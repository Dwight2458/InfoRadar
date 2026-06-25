import type { Source } from "@/generated/prisma/client"

export type SourceType = "fact" | "news" | "opinion"

export type RawItem = {
  sourceSlug: string
  title: string
  url: string
  author?: string
  summary?: string
  content?: string
  publishedAt?: Date
  raw?: unknown
  tags?: string[]
  metrics?: Record<string, unknown>
  entities?: string[]
  tickers?: string[]
  cryptoSymbols?: string[]
}

export interface SourceProvider {
  name: string
  fetch(source: Source): Promise<RawItem[]>
}

export class ProviderUnavailableError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ProviderUnavailableError"
  }
}
