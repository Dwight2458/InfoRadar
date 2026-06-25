import { z } from "zod"

import { env } from "@/lib/env"
import { http } from "@/lib/http"
import type { RawItem, SourceProvider } from "@/providers/types"

const configSchema = z.object({
  limit: z.number().int().min(1).max(250).default(30),
  currency: z.string().default("usd"),
})

const marketsSchema = z.array(
  z.object({
    id: z.string(),
    symbol: z.string(),
    name: z.string(),
    current_price: z.number().nullable(),
    market_cap: z.number().nullable(),
    market_cap_rank: z.number().nullable(),
    total_volume: z.number().nullable(),
    price_change_percentage_24h: z.number().nullable(),
    last_updated: z.string().nullable(),
  })
)

export class CoinGeckoProvider implements SourceProvider {
  name = "coingecko"

  async fetch(source: Parameters<SourceProvider["fetch"]>[0]) {
    const config = configSchema.parse(source.config)
    const headers: HeadersInit = {}
    if (env.COINGECKO_API_KEY) headers["x-cg-demo-api-key"] = env.COINGECKO_API_KEY
    const markets = marketsSchema.parse(
      await http("https://api.coingecko.com/api/v3/coins/markets", {
        headers,
        query: {
          vs_currency: config.currency,
          order: "market_cap_desc",
          per_page: config.limit,
          page: 1,
          sparkline: false,
          price_change_percentage: "24h",
        },
      })
    )

    return markets.map<RawItem>((coin) => ({
      sourceSlug: source.slug,
      title: `${coin.name} (${coin.symbol.toUpperCase()}) market snapshot`,
      url: `https://www.coingecko.com/en/coins/${coin.id}`,
      summary: `${config.currency.toUpperCase()} ${coin.current_price ?? "N/A"} · 24h ${coin.price_change_percentage_24h?.toFixed(2) ?? "N/A"}%`,
      publishedAt: coin.last_updated ? new Date(coin.last_updated) : new Date(),
      cryptoSymbols: [coin.symbol.toUpperCase()],
      tags: ["market", "crypto", coin.symbol.toLowerCase()],
      metrics: {
        price: coin.current_price ?? 0,
        marketCap: coin.market_cap ?? 0,
        marketCapRank: coin.market_cap_rank ?? 0,
        volume: coin.total_volume ?? 0,
        change24h: coin.price_change_percentage_24h ?? 0,
      },
      raw: coin,
    }))
  }
}
