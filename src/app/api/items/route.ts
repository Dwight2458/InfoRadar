import { NextRequest, NextResponse } from "next/server"

import { apiError } from "@/lib/api"
import { listItems, parseItemQuery } from "@/services/item-query-service"

export async function GET(request: NextRequest) {
  try {
    const query = parseItemQuery(Object.fromEntries(request.nextUrl.searchParams))
    return NextResponse.json(await listItems(query))
  } catch (error) {
    return apiError(error, "Could not list items")
  }
}
