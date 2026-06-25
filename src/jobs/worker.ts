import { Worker, type Job } from "bullmq"

import { FetchTrigger } from "@/generated/prisma/client"
import {
  closeFetchQueue,
  createRedisConnection,
  enqueueSourceFetch,
  FETCH_QUEUE_NAME,
  type FetchSourceJobData,
} from "@/jobs/queue"
import { registerScheduler } from "@/jobs/scheduler"
import { getDb } from "@/lib/db"
import { logger } from "@/lib/logger"
import { fetchSource } from "@/services/fetch-service"
import { listDueSources } from "@/services/source-service"

async function processJob(job: Job) {
  if (job.name === "dispatch-due-sources") {
    const dueSources = await listDueSources()
    await Promise.all(
      dueSources.map((source) => enqueueSourceFetch(source.id, FetchTrigger.SCHEDULED))
    )
    return { queued: dueSources.length }
  }

  if (job.name === "fetch-source") {
    const { sourceId, fetchJobId } = job.data as FetchSourceJobData
    const source = await getDb().source.findUniqueOrThrow({ where: { id: sourceId } })
    return fetchSource(source, { trigger: FetchTrigger.SCHEDULED, fetchJobId })
  }

  throw new Error(`Unsupported job type: ${job.name}`)
}

const workerConnection = createRedisConnection(true)
const worker = new Worker(FETCH_QUEUE_NAME, processJob, {
  connection: workerConnection,
  concurrency: 4,
})

worker.on("completed", (job) => logger.info({ jobId: job.id, name: job.name }, "Queue job completed"))
worker.on("failed", (job, error) => logger.error({ err: error, jobId: job?.id }, "Queue job failed"))
worker.on("error", (error) => logger.error({ err: error }, "Worker connection error"))

async function shutdown(signal: string) {
  logger.info({ signal }, "Stopping worker")
  await worker.close()
  await closeFetchQueue()
  await getDb().$disconnect()
}

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, () => {
    void shutdown(signal).finally(() => process.exit(0))
  })
}

registerScheduler()
  .then(() => logger.info("InfoRadar worker started; scheduler registered"))
  .catch((error) => {
    logger.fatal({ err: error }, "Could not register scheduler")
    process.exitCode = 1
  })
