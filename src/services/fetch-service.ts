import {
  FetchJobStatus,
  FetchTrigger,
  type Source,
} from "@/generated/prisma/client"
import { getDb } from "@/lib/db"
import { env } from "@/lib/env"
import { getLLMProvider, isLlmEnrichmentEnabled } from "@/lib/llm"
import { logger } from "@/lib/logger"
import { getSourceProvider, ProviderUnavailableError } from "@/providers"
import type { RawItem } from "@/providers"
import { ingestRawItem, toDomainSourceType } from "@/services/item-service"

type FetchOptions = {
  trigger?: FetchTrigger
  fetchJobId?: string
}

export type FetchSummary = {
  jobId: string
  sourceSlug: string
  status: FetchJobStatus
  fetched: number
  inserted: number
  updated: number
  duplicates: number
  error?: string
}

async function enrichItems(source: Source, items: RawItem[]) {
  if (!isLlmEnrichmentEnabled() || env.LLM_MAX_ITEMS_PER_FETCH === 0) return items
  const llm = getLLMProvider()
  const output = [...items]
  const limit = Math.min(items.length, env.LLM_MAX_ITEMS_PER_FETCH)

  for (let index = 0; index < limit; index += 1) {
    const item = items[index]
    try {
      const enrichment = await llm.enrichItem({
        title: item.title,
        summary: item.summary,
        content: item.content,
        sourceType: toDomainSourceType(source.type),
      })
      output[index] = {
        ...item,
        summary: enrichment.summary || item.summary,
        entities: enrichment.entities,
        tags: [...(item.tags ?? []), ...enrichment.tags],
        tickers: enrichment.tickers,
        cryptoSymbols: [...(item.cryptoSymbols ?? []), ...enrichment.cryptoSymbols],
      }
    } catch (error) {
      logger.warn({ err: error, source: source.slug, title: item.title }, "LLM enrichment failed; continuing with rule output")
    }
  }
  return output
}

async function getOrCreateJob(source: Source, options: FetchOptions) {
  const db = getDb()
  if (options.fetchJobId) {
    return db.fetchJob.update({
      where: { id: options.fetchJobId },
      data: { status: FetchJobStatus.RUNNING, startedAt: new Date(), error: null },
    })
  }
  return db.fetchJob.create({
    data: {
      sourceId: source.id,
      trigger: options.trigger ?? FetchTrigger.CLI,
      status: FetchJobStatus.RUNNING,
      startedAt: new Date(),
    },
  })
}

export async function fetchSource(source: Source, options: FetchOptions = {}): Promise<FetchSummary> {
  const db = getDb()
  const startedAt = new Date()
  const job = await getOrCreateJob(source, options)
  await db.source.update({ where: { id: source.id }, data: { lastAttemptAt: startedAt } })

  if (!source.enabled) {
    const error = "Source is disabled"
    await db.fetchJob.update({
      where: { id: job.id },
      data: { status: FetchJobStatus.SKIPPED, finishedAt: new Date(), durationMs: 0, error },
    })
    return { jobId: job.id, sourceSlug: source.slug, status: FetchJobStatus.SKIPPED, fetched: 0, inserted: 0, updated: 0, duplicates: 0, error }
  }

  try {
    const provider = getSourceProvider(source.provider)
    const rawItems = await enrichItems(source, await provider.fetch(source))
    const counters = { inserted: 0, updated: 0, duplicate: 0 }
    for (const item of rawItems) counters[await ingestRawItem(source, item)] += 1
    const finishedAt = new Date()
    await db.$transaction([
      db.fetchJob.update({
        where: { id: job.id },
        data: {
          status: FetchJobStatus.SUCCEEDED,
          finishedAt,
          durationMs: finishedAt.getTime() - startedAt.getTime(),
          fetchedCount: rawItems.length,
          insertedCount: counters.inserted,
          updatedCount: counters.updated,
          duplicateCount: counters.duplicate,
        },
      }),
      db.source.update({
        where: { id: source.id },
        data: { lastFetchedAt: finishedAt, lastError: null },
      }),
    ])
    return {
      jobId: job.id,
      sourceSlug: source.slug,
      status: FetchJobStatus.SUCCEEDED,
      fetched: rawItems.length,
      inserted: counters.inserted,
      updated: counters.updated,
      duplicates: counters.duplicate,
    }
  } catch (error) {
    const finishedAt = new Date()
    const message = error instanceof Error ? error.message.slice(0, 4_000) : String(error)
    const status = error instanceof ProviderUnavailableError ? FetchJobStatus.SKIPPED : FetchJobStatus.FAILED
    await db.$transaction([
      db.fetchJob.update({
        where: { id: job.id },
        data: { status, finishedAt, durationMs: finishedAt.getTime() - startedAt.getTime(), error: message },
      }),
      db.source.update({ where: { id: source.id }, data: { lastError: message } }),
    ])
    logger.error({ err: error, source: source.slug }, "Source fetch failed")
    return { jobId: job.id, sourceSlug: source.slug, status, fetched: 0, inserted: 0, updated: 0, duplicates: 0, error: message }
  }
}

export async function fetchAllEnabled(trigger = FetchTrigger.CLI) {
  const sources = await getDb().source.findMany({ where: { enabled: true }, orderBy: { slug: "asc" } })
  const summaries: FetchSummary[] = []
  for (let index = 0; index < sources.length; index += 3) {
    summaries.push(...(await Promise.all(sources.slice(index, index + 3).map((source) => fetchSource(source, { trigger })))))
  }
  return summaries
}
