import { z } from "zod"
import dayjs from "dayjs"

import { Category, Prisma, SourceType } from "@/generated/prisma/client"
import { getDb } from "@/lib/db"

const SOURCE_TYPE_MAP = {
  fact: SourceType.FACT,
  news: SourceType.NEWS,
  opinion: SourceType.OPINION,
} as const

const CATEGORY_MAP = {
  ai: Category.AI,
  tech: Category.TECH,
  crypto: Category.CRYPTO,
  finance: Category.FINANCE,
  stock: Category.STOCK,
  macro: Category.MACRO,
  devtools: Category.DEVTOOLS,
} as const

export const itemQuerySchema = z.object({
  sourceType: z.enum(["fact", "news", "opinion"]).optional(),
  category: z.enum(["ai", "tech", "crypto", "finance", "stock", "macro", "devtools"]).optional(),
  source: z.string().trim().min(1).max(100).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  keyword: z.string().trim().max(200).optional(),
  minImportance: z.coerce.number().min(0).max(100).optional(),
  sort: z
    .enum(["publishedAt", "fetchedAt", "importanceScore", "heatScore", "reliabilityScore"])
    .default("publishedAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
})

export type ItemQuery = z.infer<typeof itemQuerySchema>

export function parseItemQuery(input: Record<string, string | string[] | undefined>) {
  const flattened = Object.fromEntries(
    Object.entries(input)
      .map(([key, value]) => [key, Array.isArray(value) ? value[0] : value])
      .filter(([, value]) => value !== undefined && value !== "")
  )
  const query = itemQuerySchema.parse(flattened)
  if (typeof flattened.from === "string" && /^\d{4}-\d{2}-\d{2}$/.test(flattened.from)) {
    query.from = dayjs(flattened.from).startOf("day").toDate()
  }
  if (typeof flattened.to === "string" && /^\d{4}-\d{2}-\d{2}$/.test(flattened.to)) {
    query.to = dayjs(flattened.to).endOf("day").toDate()
  }
  return query
}

export async function listItems(query: ItemQuery) {
  const where: Prisma.ItemWhereInput = {
    sourceType: query.sourceType ? SOURCE_TYPE_MAP[query.sourceType] : undefined,
    categories: query.category ? { has: CATEGORY_MAP[query.category] } : undefined,
    source: query.source ? { slug: query.source } : undefined,
    importanceScore: query.minImportance ? { gte: query.minImportance } : undefined,
    publishedAt:
      query.from || query.to
        ? { gte: query.from, lte: query.to }
        : undefined,
    OR: query.keyword
      ? [
          { title: { contains: query.keyword, mode: "insensitive" } },
          { summary: { contains: query.keyword, mode: "insensitive" } },
          { content: { contains: query.keyword, mode: "insensitive" } },
        ]
      : undefined,
  }

  const db = getDb()
  const [items, total] = await Promise.all([
    db.item.findMany({
      where,
      include: { source: { select: { id: true, name: true, slug: true, category: true } } },
      orderBy: { [query.sort]: query.order },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    db.item.count({ where }),
  ])

  return {
    items,
    total,
    page: query.page,
    pageSize: query.pageSize,
    pageCount: Math.max(1, Math.ceil(total / query.pageSize)),
  }
}

export async function getItemById(id: string) {
  return getDb().item.findUnique({ where: { id }, include: { source: true } })
}
