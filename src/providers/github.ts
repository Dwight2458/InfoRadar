import { z } from "zod"

import { env } from "@/lib/env"
import { http } from "@/lib/http"
import type { RawItem, SourceProvider } from "@/providers/types"

const configSchema = z.object({
  query: z.string().default("topic:artificial-intelligence stars:>100"),
  limit: z.number().int().min(1).max(100).default(30),
})

const responseSchema = z.object({
  items: z.array(
    z.object({
      full_name: z.string(),
      html_url: z.string().url(),
      description: z.string().nullable(),
      owner: z.object({ login: z.string() }),
      stargazers_count: z.number(),
      forks_count: z.number(),
      open_issues_count: z.number(),
      language: z.string().nullable(),
      topics: z.array(z.string()).default([]),
      pushed_at: z.string(),
      license: z.object({ spdx_id: z.string().nullable() }).nullable(),
    })
  ),
})

export class GitHubProvider implements SourceProvider {
  name = "github"

  async fetch(source: Parameters<SourceProvider["fetch"]>[0]) {
    const config = configSchema.parse(source.config)
    const headers: HeadersInit = {
      accept: "application/vnd.github+json",
      "x-github-api-version": "2022-11-28",
    }
    if (env.GITHUB_TOKEN) headers.authorization = `Bearer ${env.GITHUB_TOKEN}`

    const data = responseSchema.parse(
      await http("https://api.github.com/search/repositories", {
        headers,
        query: {
          q: config.query,
          sort: "updated",
          order: "desc",
          per_page: config.limit,
        },
      })
    )

    return data.items.map<RawItem>((repo) => ({
      sourceSlug: source.slug,
      title: repo.full_name,
      url: repo.html_url,
      author: repo.owner.login,
      summary: repo.description ?? undefined,
      publishedAt: new Date(repo.pushed_at),
      tags: [repo.language, ...repo.topics].filter((value): value is string => Boolean(value)),
      metrics: {
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        openIssues: repo.open_issues_count,
      },
      raw: repo,
    }))
  }
}
