import { NextRequest, NextResponse } from "next/server"

import { apiError } from "@/lib/api"
import { listFetchJobs } from "@/services/job-service"

export async function GET(request: NextRequest) {
  try {
    const page = Number(request.nextUrl.searchParams.get("page") ?? 1)
    const pageSize = Number(request.nextUrl.searchParams.get("pageSize") ?? 50)
    return NextResponse.json(await listFetchJobs(page, pageSize))
  } catch (error) {
    return apiError(error, "Could not list jobs")
  }
}
