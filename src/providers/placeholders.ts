import type { SourceProvider } from "@/providers/types"
import { ProviderUnavailableError } from "@/providers/types"

class PlaceholderProvider implements SourceProvider {
  constructor(
    public name: string,
    private readonly reason: string
  ) {}

  async fetch(): Promise<never> {
    throw new ProviderUnavailableError(this.reason)
  }
}

export const xProvider = new PlaceholderProvider(
  "x-placeholder",
  "X collection is disabled in MVP and requires the official X API plus a configured watchlist."
)

export const zhihuProvider = new PlaceholderProvider(
  "zhihu-placeholder",
  "Zhihu collection is a compliance placeholder and does not scrape web pages."
)

export const xueqiuProvider = new PlaceholderProvider(
  "xueqiu-placeholder",
  "Xueqiu collection is a compliance placeholder and does not scrape web pages."
)
