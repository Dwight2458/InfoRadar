import { z } from "zod"

import { http } from "@/lib/http"
import type { RawItem, SourceProvider } from "@/providers/types"

const configSchema = z.object({
  limit: z.number().int().min(1).max(100).default(30),
})

const protocolsSchema = z.array(
  z.object({
    id: z.string().optional(),
    name: z.string(),
    slug: z.string(),
    symbol: z.string().optional(),
    category: z.string().optional(),
    chains: z.array(z.string()).optional(),
    tvl: z.number().nullable().optional(),
    change_1d: z.number().nullable().optional(),
    change_7d: z.number().nullable().optional(),
    mcap: z.number().nullable().optional(),
  })
)

export class DefiLlamaProvider implements SourceProvider {
  name = "defillama"

  async fetch(source: Parameters<SourceProvider["fetch"]>[0]) {
    const config = configSchema.parse(source.config)
    const protocols = protocolsSchema
      .parse(await http("https://api.llama.fi/protocols"))
      .toSorted((a, b) => (b.tvl ?? 0) - (a.tvl ?? 0))
      .slice(0, config.limit)

    return protocols.map<RawItem>((protocol) => ({
      sourceSlug: source.slug,
      title: `${protocol.name} protocol TVL snapshot`,
      url: `https://defillama.com/protocol/${protocol.slug}`,
      summary: `TVL $${Math.round(protocol.tvl ?? 0).toLocaleString("en-US")} · 24h ${protocol.change_1d?.toFixed(2) ?? "N/A"}%`,
      publishedAt: new Date(),
      cryptoSymbols: protocol.symbol ? [protocol.symbol.toUpperCase()] : undefined,
      tags: [protocol.category, ...(protocol.chains ?? [])].filter((value): value is string => Boolean(value)),
      metrics: {
        tvl: protocol.tvl ?? 0,
        change1d: protocol.change_1d ?? 0,
        change7d: protocol.change_7d ?? 0,
        marketCap: protocol.mcap ?? 0,
      },
      raw: protocol,
    }))
  }
}
