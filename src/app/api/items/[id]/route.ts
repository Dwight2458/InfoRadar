import { NextResponse } from "next/server"

import { apiError } from "@/lib/api"
import { getItemById } from "@/services/item-query-service"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const item = await getItemById(id)
    if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 })
    return NextResponse.json(item)
  } catch (error) {
    return apiError(error, "Could not load item")
  }
}
