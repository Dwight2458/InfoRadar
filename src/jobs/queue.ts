import { Queue } from "bullmq"

import { FetchJobStatus, FetchTrigger } from "@/generated/prisma/client"
import { getDb } from "@/lib/db"
import { env } from "@/lib/env"
import { logger } from "@/lib/logger"

export const FETCH_QUEUE_NAME = "inforadar-fetch"

export type FetchSourceJobData = {
  sourceId: string
  fetchJobId: string
}

let queue: Queue | undefined

export function createRedisConnection(worker = false) {
  const redisUrl = new URL(env.REDIS_URL)
  return {
    host: redisUrl.hostname,
    port: Number(redisUrl.port || 6379),
    username: redisUrl.username || undefined,
    password: redisUrl.password || undefined,
    db: redisUrl.pathname.length > 1 ? Number(redisUrl.pathname.slice(1)) : 0,
    enableReadyCheck: false,
    connectTimeout: 5_000,
    maxRetriesPerRequest: worker ? null : 2,
    retryStrategy: worker
      ? (attempt: number) => Math.min(attempt * 500, 5_000)
      : (attempt: number) => (attempt <= 2 ? attempt * 250 : null),
  }
}

export function getFetchQueue() {
  if (!queue) {
    queue = new Queue(FETCH_QUEUE_NAME, {
      connection: createRedisConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 2_000 },
        removeOnComplete: { age: 86_400, count: 1_000 },
        removeOnFail: { age: 604_800, count: 2_000 },
      },
    })
  }
  return queue
}

export async function enqueueSourceFetch(
  sourceId: string,
  trigger: FetchTrigger = FetchTrigger.MANUAL
) {
  const db = getDb()
  const source = await db.source.findUniqueOrThrow({ where: { id: sourceId } })
  const record = await db.fetchJob.create({
    data: { sourceId, trigger, status: FetchJobStatus.QUEUED },
  })

  try {
    const job = await getFetchQueue().add(
      "fetch-source",
      { sourceId, fetchJobId: record.id } satisfies FetchSourceJobData,
      { jobId: `source-${sourceId}-${record.id}` }
    )
    await db.fetchJob.update({
      where: { id: record.id },
      data: { queueJobId: job.id },
    })
    return { ...record, queueJobId: job.id, source }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    await db.fetchJob.update({
      where: { id: record.id },
      data: {
        status: FetchJobStatus.FAILED,
        finishedAt: new Date(),
        error: `Queue unavailable: ${message}`,
      },
    })
    logger.error({ err: error, source: source.slug }, "Failed to enqueue source")
    throw error
  }
}

export async function closeFetchQueue() {
  if (!queue) return
  await queue.close()
  queue = undefined
}
