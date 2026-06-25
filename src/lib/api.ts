import { NextResponse } from "next/server"
import { ZodError } from "zod"

import { logger } from "@/lib/logger"

export function apiError(error: unknown, fallback = "Request failed") {
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: "Invalid request", details: error.flatten() },
      { status: 400 }
    )
  }

  logger.error({ err: error }, fallback)
  const message = error instanceof Error ? error.message : fallback
  const status = message.includes("not found") || message.includes("No record") ? 404 : 500
  return NextResponse.json({ error: message }, { status })
}
