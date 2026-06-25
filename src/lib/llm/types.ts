export type LLMItem = {
  title: string
  summary?: string
  content?: string
  sourceType: "fact" | "news" | "opinion"
}

export type LLMEnrichment = {
  summary: string
  entities: string[]
  categories: string[]
  tags: string[]
  tickers: string[]
  cryptoSymbols: string[]
  sentiment: number | null
}

export interface LLMProvider {
  name: string
  enrichItem(item: LLMItem): Promise<LLMEnrichment>
  summarizeItem(item: LLMItem): Promise<string>
  summarizeDailyDigest(items: LLMItem[]): Promise<string>
  extractEntities(item: LLMItem): Promise<string[]>
  classifyItem(item: LLMItem): Promise<{ categories: string[]; tags: string[] }>
}
