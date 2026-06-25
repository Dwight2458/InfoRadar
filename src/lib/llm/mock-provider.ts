import type { LLMEnrichment, LLMItem, LLMProvider } from "@/lib/llm/types"

function fallbackSummary(item: LLMItem) {
  const value = item.summary ?? item.content ?? item.title
  return value.replace(/\s+/g, " ").trim().slice(0, 360)
}

export class MockLLMProvider implements LLMProvider {
  name = "mock"

  async enrichItem(item: LLMItem): Promise<LLMEnrichment> {
    return {
      summary: fallbackSummary(item),
      entities: [],
      categories: [],
      tags: [],
      tickers: [],
      cryptoSymbols: [],
      sentiment: null,
    }
  }

  async summarizeItem(item: LLMItem) {
    return fallbackSummary(item)
  }

  async summarizeDailyDigest(items: LLMItem[]) {
    return items.slice(0, 10).map((item) => `- ${item.title}`).join("\n")
  }

  async extractEntities() {
    return []
  }

  async classifyItem() {
    return { categories: [], tags: [] }
  }
}
