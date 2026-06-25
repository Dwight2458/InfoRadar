import * as cheerio from "cheerio"
import Parser from "rss-parser"
import { z } from "zod"

import { fetchText } from "@/lib/http"
import type { RawItem, SourceProvider } from "@/providers/types"

const parser = new Parser()
const configSchema = z.object({
  limit: z.number().int().min(1).max(200).default(50),
})

function toPlainText(value?: string) {
  if (!value) return undefined
  const text = cheerio.load(value).text().replace(/\s+/g, " ").trim()
  return text || undefined
}

export class RSSProvider implements SourceProvider {
  name = "rss"

  async fetch(source: Parameters<SourceProvider["fetch"]>[0]) {
    const config = configSchema.parse(source.config)
    const xml = await fetchText(source.url)
    const feed = await parser.parseString(xml)

    return feed.items.slice(0, config.limit).flatMap<RawItem>((item) => {
      const url = item.link ?? item.guid
      if (!item.title || !url) return []
      const rawContent = item["content:encoded"] ?? item.content
      return [
        {
          sourceSlug: source.slug,
          title: toPlainText(item.title) ?? item.title,
          url,
          author: item.creator ?? item.author,
          summary: toPlainText(item.contentSnippet ?? item.summary ?? rawContent),
          content: toPlainText(rawContent),
          publishedAt: item.isoDate || item.pubDate ? new Date(item.isoDate ?? item.pubDate!) : undefined,
          raw: item,
          tags: item.categories,
        },
      ]
    })
  }
}
