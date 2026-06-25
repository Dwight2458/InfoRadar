import { getFetchQueue } from "@/jobs/queue"

const SCHEDULER_ID = "dispatch-due-sources"

/** Registers an idempotent one-minute dispatcher for due sources. */
export async function registerScheduler() {
  return getFetchQueue().upsertJobScheduler(
    SCHEDULER_ID,
    { every: 60_000 },
    { name: "dispatch-due-sources", data: {} }
  )
}
