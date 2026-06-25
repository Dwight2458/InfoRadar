import { z } from "zod"

import { env } from "@/lib/env"
import { http } from "@/lib/http"
import type { RawItem, SourceProvider } from "@/providers/types"

const configSchema = z.object({
  limit: z.number().int().min(1).max(100).default(30),
  sort: z.enum(["trendingScore", "lastModified", "downloads", "likes"]).default("trendingScore"),
})

const modelsSchema = z.array(
  z.object({
    id: z.string(),
    author: z.string().optional(),
    lastModified: z.string().optional(),
    downloads: z.number().optional(),
    likes: z.number().optional(),
    trendingScore: z.number().optional(),
    pipeline_tag: z.string().optional(),
    library_name: z.string().optional(),
    tags: z.array(z.string()).optional(),
  })
)

export class HuggingFaceProvider implements SourceProvider {
  name = "huggingface"

  async fetch(source: Parameters<SourceProvider["fetch"]>[0]) {
    const config = configSchema.parse(source.config)
    const headers: HeadersInit = {}
    if (env.HUGGINGFACE_TOKEN) headers.authorization = `Bearer ${env.HUGGINGFACE_TOKEN}`
    const models = modelsSchema.parse(
      await http("https://huggingface.co/api/models", {
        headers,
        query: { sort: config.sort, direction: -1, limit: config.limit },
      })
    )

    return models.map<RawItem>((model) => ({
      sourceSlug: source.slug,
      title: model.id,
      url: `https://huggingface.co/${model.id}`,
      author: model.author ?? model.id.split("/")[0],
      summary: [model.pipeline_tag, model.library_name].filter(Boolean).join(" · ") || undefined,
      publishedAt: model.lastModified ? new Date(model.lastModified) : undefined,
      tags: model.tags?.slice(0, 20),
      metrics: {
        downloads: model.downloads ?? 0,
        likes: model.likes ?? 0,
        trendingScore: model.trendingScore ?? 0,
      },
      raw: model,
    }))
  }
}
