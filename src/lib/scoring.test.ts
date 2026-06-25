import { describe, expect, it } from "vitest"

import { calculateScores, scoreHeat, scoreNovelty } from "@/lib/scoring"

describe("scoring", () => {
  it("scores fresh items higher than old items", () => {
    const fetchedAt = new Date("2026-06-23T12:00:00Z")
    expect(scoreNovelty(new Date("2026-06-23T10:00:00Z"), fetchedAt)).toBe(100)
    expect(scoreNovelty(new Date("2026-06-01T10:00:00Z"), fetchedAt)).toBe(20)
  })

  it("uses provider metrics as heat signals", () => {
    expect(scoreHeat({ score: 1_000, comments: 200 })).toBeGreaterThan(scoreHeat({ score: 1 }))
  })

  it("combines source reliability, keywords and sentiment rules", () => {
    const result = calculateScores({
      sourceType: "opinion",
      reliabilityScore: 55,
      title: "Bitcoin breakthrough: bullish growth",
      publishedAt: new Date(),
      metrics: { score: 800, comments: 120 },
    })
    expect(result.reliabilityScore).toBe(55)
    expect(result.importanceScore).toBeGreaterThan(30)
    expect(result.heatScore).toBeGreaterThan(0)
    expect(result.sentimentScore).toBeGreaterThan(0)
  })
})
