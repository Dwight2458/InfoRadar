import { NextResponse } from "next/server"

import { FetchTrigger } from "@/generated/prisma/client"
import { enqueueSourceFetch } from "@/jobs/queue"
import { apiError } from "@/lib/api"
import { getDb } from "@/lib/db"

export async function POST() {
  try {
    const sources = await getDb().source.findMany({ where: { enabled: true }, select: { id: true } })
    const jobs = await Promise.all(
      sources.map((source) => enqueueSourceFetch(source.id, FetchTrigger.MANUAL))
    )
    return NextResponse.json({ queued: jobs.length }, { status: 202 })
  } catch (error) {
    return apiError(error, "Could not queue enabled sources")
  }
}
