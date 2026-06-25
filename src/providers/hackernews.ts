import * as cheerio from "cheerio"
import { z } from "zod"

import { http } from "@/lib/http"
import type { RawItem, SourceProvider } from "@/providers/types"

const configSchema = z.object({
  feed: z.enum(["topstories", "askstories"]).default("topstories"),
  limit: z.number().int().min(1).max(100).default(30),
})

const itemSchema = z.object({
  id: z.number(),
  by: z.string().optional(),
  descendants: z.number().optional(),
  score: z.number().optional(),
  time: z.number(),
  title: z.string(),
  text: z.string().optional(),
  url: z.string().url().optional(),
  type: z.string(),
})

function plainText(value?: string) {
  return value ? cheerio.load(value).text().replace(/\s+/g, " ").trim() : undefined
}

async function fetchInBatches(ids: number[]) {
  const results: z.infer<typeof itemSchema>[] = []
  for (let index = 0; index < ids.length; index += 10) {
    const batch = ids.slice(index, index + 10)
    const items = await Promise.all(
      batch.map((id) => http(`https://hacker-news.firebaseio.com/v0/item/${id}.json`))
    )
    for (const item of items) {
      const parsed = itemSchema.safeParse(item)
      if (parsed.success) results.push(parsed.data)
    }
  }
  return results
}

export class HackerNewsProvider implements SourceProvider {
  name = "hackernews"

  async fetch(source: Parameters<SourceProvider["fetch"]>[0]) {
    const config = configSchema.parse(source.config)
    const ids = z
      .array(z.number())
      .parse(await http(`https://hacker-news.firebaseio.com/v0/${config.feed}.json`))
      .slice(0, config.limit)
    const items = await fetchInBatches(ids)

    return items.map<RawItem>((item) => ({
      sourceSlug: source.slug,
      title: item.title,
      url: item.url ?? `https://news.ycombinator.com/item?id=${item.id}`,
      author: item.by,
      summary: plainText(item.text),
      content: plainText(item.text),
      publishedAt: new Date(item.time * 1_000),
      tags: ["hacker-news", config.feed === "askstories" ? "ask-hn" : "top"],
      metrics: { score: item.score ?? 0, comments: item.descendants ?? 0 },
      raw: item,
    }))
  }
}
