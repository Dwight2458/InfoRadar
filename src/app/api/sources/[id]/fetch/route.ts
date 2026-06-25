import { NextResponse } from "next/server"

import { FetchTrigger } from "@/generated/prisma/client"
import { enqueueSourceFetch } from "@/jobs/queue"
import { apiError } from "@/lib/api"

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const job = await enqueueSourceFetch(id, FetchTrigger.MANUAL)
    return NextResponse.json({ job }, { status: 202 })
  } catch (error) {
    return apiError(error, "Could not queue source fetch")
  }
}
