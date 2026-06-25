import { NextResponse } from "next/server"

import { apiError } from "@/lib/api"
import { listSources } from "@/services/source-service"

export async function GET() {
  try {
    return NextResponse.json(await listSources())
  } catch (error) {
    return apiError(error, "Could not list sources")
  }
}
