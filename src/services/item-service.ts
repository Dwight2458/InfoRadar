import {
  ItemStatus,
  Prisma,
  SourceType,
  type Source,
} from "@/generated/prisma/client"
import { buildDedupeKeys } from "@/lib/dedupe"
import { getDb } from "@/lib/db"
import { calculateScores } from "@/lib/scoring"
import type { RawItem, SourceType as DomainSourceType } from "@/providers/types"

export type IngestResult = "inserted" | "updated" | "duplicate"

export function toDomainSourceType(type: SourceType): DomainSourceType {
  if (type === SourceType.FACT) return "fact"
  if (type === SourceType.NEWS) return "news"
  return "opinion"
}

function asJson(value: unknown): Prisma.InputJsonValue | undefined {
  if (value === undefined) return undefined
  try {
    return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue
  } catch {
    return { serializationError: true }
  }
}

function detectLanguage(value: string) {
  return /[\u3400-\u9fff]/u.test(value) ? "zh" : "en"
}

function unique(values: Array<string | undefined>) {
  return [...new Set(values.filter((value): value is string => Boolean(value?.trim())).map((value) => value.trim()))]
}

function extractTickers(text: string) {
  return unique([...text.matchAll(/\$([A-Z]{1,6})\b/g)].map((match) => match[1]))
}

function ruleSummary(item: RawItem) {
  const value = item.summary ?? item.content
  return value?.replace(/\s+/g, " ").trim().slice(0, 1_000)
}

export async function ingestRawItem(source: Source, rawItem: RawItem): Promise<IngestResult> {
  if (rawItem.sourceSlug !== source.slug) {
    throw new Error(`Provider returned sourceSlug ${rawItem.sourceSlug} for ${source.slug}`)
  }
  if (!rawItem.title.trim() || !rawItem.url.trim()) throw new Error("Item title and URL are required")

  const db = getDb()
  const fetchedAt = new Date()
  const keys = buildDedupeKeys(rawItem.title, rawItem.url)
  const sourceType = toDomainSourceType(source.type)
  const summary = ruleSummary(rawItem)
  const scores = calculateScores({
    sourceType,
    reliabilityScore: source.reliabilityScore,
    title: rawItem.title,
    summary,
    publishedAt: rawItem.publishedAt,
    fetchedAt,
    metrics: rawItem.metrics,
  })
  const tickers = unique([...(rawItem.tickers ?? []), ...extractTickers(`${rawItem.title} ${summary ?? ""}`)])
  const existing = await db.item.findFirst({
    where: {
      OR: [
        { urlHash: keys.urlHash },
        { sourceId: source.id, titleHash: keys.titleHash },
      ],
    },
  })

  const data = {
    sourceType: source.type,
    title: rawItem.title.trim(),
    url: rawItem.url.trim(),
    canonicalUrl: keys.canonicalUrl,
    urlHash: keys.urlHash,
    normalizedTitle: keys.normalizedTitle,
    titleHash: keys.titleHash,
    author: rawItem.author?.trim() || null,
    summary: summary ?? null,
    content: rawItem.content?.trim() || null,
    rawContent: rawItem.content || null,
    publishedAt: rawItem.publishedAt ?? null,
    fetchedAt,
    language: detectLanguage(`${rawItem.title} ${summary ?? ""}`),
    categories: [source.category],
    tags: unique(rawItem.tags ?? []),
    entities: unique(rawItem.entities ?? []),
    tickers,
    cryptoSymbols: unique(rawItem.cryptoSymbols ?? []),
    status: ItemStatus.PUBLISHED,
    metrics: asJson(rawItem.metrics),
    rawJson: asJson(rawItem.raw),
    ...scores,
  }

  if (!existing) {
    try {
      await db.item.create({ data: { ...data, sourceId: source.id } })
      return "inserted"
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        return "duplicate"
      }
      throw error
    }
  }

  // URL-level duplicates keep the first source as their owner to avoid mixing
  // a later source's scores and type with the existing source relation.
  if (existing.sourceId !== source.id) return "duplicate"

  const significantChange =
    existing.summary !== data.summary ||
    JSON.stringify(existing.metrics) !== JSON.stringify(data.metrics) ||
    existing.heatScore !== data.heatScore

  await db.item.update({
    where: { id: existing.id },
    data: {
      ...data,
      summary: data.summary ?? existing.summary,
      content: data.content ?? existing.content,
      rawContent: data.rawContent ?? existing.rawContent,
      publishedAt: data.publishedAt ?? existing.publishedAt,
    },
  })
  return significantChange ? "updated" : "duplicate"
}
