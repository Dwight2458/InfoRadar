import { describe, expect, it } from "vitest"

import { buildDedupeKeys, canonicalizeUrl, normalizeTitle } from "@/lib/dedupe"

describe("dedupe", () => {
  it("removes tracking parameters and sorts the remaining query", () => {
    expect(canonicalizeUrl("https://EXAMPLE.com/story/?utm_source=x&b=2&a=1#top")).toBe(
      "https://example.com/story?a=1&b=2"
    )
  })

  it("normalizes punctuation, width and whitespace in titles", () => {
    expect(normalizeTitle("  GPT－5：  新 进展！ ")).toBe("gpt 5 新 进展")
  })

  it("builds stable hashes for equivalent URLs and titles", () => {
    const first = buildDedupeKeys("OpenAI: Release", "https://example.com/a?utm_medium=rss")
    const second = buildDedupeKeys("openai release", "https://example.com/a")
    expect(first.urlHash).toBe(second.urlHash)
    expect(first.titleHash).toBe(second.titleHash)
  })
})
