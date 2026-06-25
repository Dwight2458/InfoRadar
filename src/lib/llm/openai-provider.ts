import OpenAI from "openai"
import { zodTextFormat } from "openai/helpers/zod"
import { z } from "zod"

import type { LLMEnrichment, LLMItem, LLMProvider } from "@/lib/llm/types"

const enrichmentSchema = z.object({
  summary: z.string(),
  entities: z.array(z.string()),
  categories: z.array(z.enum(["ai", "tech", "crypto", "finance", "stock", "macro", "devtools"])),
  tags: z.array(z.string()),
  tickers: z.array(z.string()),
  cryptoSymbols: z.array(z.string()),
  sentiment: z.number().min(-1).max(1).nullable(),
})

export class OpenAILLMProvider implements LLMProvider {
  name = "openai"
  private readonly client: OpenAI

  constructor(apiKey: string, private readonly model: string) {
    this.client = new OpenAI({ apiKey, timeout: 20_000, maxRetries: 2 })
  }

  async enrichItem(item: LLMItem): Promise<LLMEnrichment> {
    const response = await this.client.responses.parse({
      model: this.model,
      instructions:
        "Analyze an information item for a research aggregator. Be concise, preserve factual uncertainty, and never provide investment advice.",
      input: JSON.stringify(item),
      text: {
        format: zodTextFormat(enrichmentSchema, "item_enrichment"),
      },
    })
    if (!response.output_parsed) throw new Error("OpenAI returned no parsed enrichment")
    return response.output_parsed
  }

  async summarizeItem(item: LLMItem) {
    return (await this.enrichItem(item)).summary
  }

  async summarizeDailyDigest(items: LLMItem[]) {
    const response = await this.client.responses.create({
      model: this.model,
      instructions:
        "Write a compact Chinese daily research digest. Separate verified facts, news context, and community opinion. Do not provide investment advice.",
      input: JSON.stringify(items.slice(0, 50)),
    })
    return response.output_text
  }

  async extractEntities(item: LLMItem) {
    return (await this.enrichItem(item)).entities
  }

  async classifyItem(item: LLMItem) {
    const enrichment = await this.enrichItem(item)
    return { categories: enrichment.categories, tags: enrichment.tags }
  }
}
