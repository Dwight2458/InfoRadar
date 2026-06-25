import Parser from "rss-parser"
import { z } from "zod"

import { fetchText } from "@/lib/http"
import type { RawItem, SourceProvider } from "@/providers/types"

const configSchema = z.object({
  categories: z.array(z.string()).min(1).default(["cs.AI"]),
  limit: z.number().int().min(1).max(100).default(50),
})

const parser = new Parser()

export class ArxivProvider implements SourceProvider {
  name = "arxiv"

  async fetch(source: Parameters<SourceProvider["fetch"]>[0]) {
    const config = configSchema.parse(source.config)
    const search = config.categories.map((category) => `cat:${category}`).join(" OR ")
    const params = new URLSearchParams({
      search_query: search,
      start: "0",
      max_results: String(config.limit),
      sortBy: "submittedDate",
      sortOrder: "descending",
    })
    const xml = await fetchText(`https://export.arxiv.org/api/query?${params}`)
    const feed = await parser.parseString(xml)

    return feed.items.flatMap<RawItem>((item) => {
      const url = item.link ?? item.guid
      if (!item.title || !url) return []
      return [
        {
          sourceSlug: source.slug,
          title: item.title.replace(/\s+/g, " ").trim(),
          url,
          author: item.creator,
          summary: item.contentSnippet?.replace(/\s+/g, " ").trim(),
          content: item.contentSnippet,
          publishedAt: item.isoDate ? new Date(item.isoDate) : undefined,
          raw: item,
          tags: item.categories,
        },
      ]
    })
  }
}
