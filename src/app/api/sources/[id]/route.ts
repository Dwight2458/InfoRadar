import { NextResponse } from "next/server"
import { z } from "zod"

import { apiError } from "@/lib/api"
import { setSourceEnabled } from "@/services/source-service"

const updateSourceSchema = z.object({ enabled: z.boolean() })

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = updateSourceSchema.parse(await request.json())
    return NextResponse.json(await setSourceEnabled(id, body.enabled))
  } catch (error) {
    return apiError(error, "Could not update source")
  }
}
