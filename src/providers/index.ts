import { ArxivProvider } from "@/providers/arxiv"
import { CoinGeckoProvider } from "@/providers/coingecko"
import { DefiLlamaProvider } from "@/providers/defillama"
import { GitHubProvider } from "@/providers/github"
import { HackerNewsProvider } from "@/providers/hackernews"
import { HuggingFaceProvider } from "@/providers/huggingface"
import { xProvider, xueqiuProvider, zhihuProvider } from "@/providers/placeholders"
import { RSSProvider } from "@/providers/rss"
import { ProviderUnavailableError, type SourceProvider } from "@/providers/types"

const providers = new Map<string, SourceProvider>(
  [
    new RSSProvider(),
    new ArxivProvider(),
    new GitHubProvider(),
    new HuggingFaceProvider(),
    new CoinGeckoProvider(),
    new DefiLlamaProvider(),
    new HackerNewsProvider(),
    xProvider,
    zhihuProvider,
    xueqiuProvider,
  ].map((provider) => [provider.name, provider])
)

export function getSourceProvider(name: string) {
  const provider = providers.get(name)
  if (!provider) throw new ProviderUnavailableError(`Unknown source provider: ${name}`)
  return provider
}

export { ProviderUnavailableError }
export type { RawItem, SourceProvider, SourceType } from "@/providers/types"
