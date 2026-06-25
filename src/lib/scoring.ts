import type { SourceType } from "@/providers/types"

const importantKeywords = [
  "openai",
  "gpt",
  "claude",
  "anthropic",
  "nvidia",
  "bitcoin",
  "ethereum",
  "sec",
  "fed",
  "earnings",
  "acquisition",
  "融资",
  "财报",
  "美联储",
  "监管",
]

const positiveWords = ["surge", "growth", "breakthrough", "gain", "bullish", "上涨", "增长", "突破", "利好"]
const negativeWords = ["drop", "loss", "risk", "ban", "breach", "bearish", "下跌", "亏损", "风险", "禁令"]

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value * 100) / 100))
}

function metric(metrics: Record<string, unknown> | undefined, key: string) {
  const value = metrics?.[key]
  return typeof value === "number" && Number.isFinite(value) ? value : 0
}

export function scoreNovelty(publishedAt: Date | undefined, fetchedAt = new Date()) {
  if (!publishedAt) return 100
  const ageHours = Math.max(0, fetchedAt.getTime() - publishedAt.getTime()) / 3_600_000
  if (ageHours <= 6) return 100
  if (ageHours <= 24) return 85
  if (ageHours <= 72) return 65
  if (ageHours <= 168) return 40
  return 20
}

export function scoreImportance(sourceType: SourceType, text: string, metrics?: Record<string, unknown>) {
  const base = sourceType === "fact" ? 40 : sourceType === "news" ? 28 : 18
  const lower = text.toLowerCase()
  const keywordBoost = importantKeywords.reduce(
    (total, keyword) => total + (lower.includes(keyword) ? 6 : 0),
    0
  )
  const metricBoost = Math.min(20, Math.log10(1 + metric(metrics, "score") + metric(metrics, "stars")) * 5)
  return clamp(base + Math.min(36, keywordBoost) + metricBoost)
}

export function scoreHeat(metrics?: Record<string, unknown>) {
  const signal =
    metric(metrics, "score") +
    metric(metrics, "comments") * 2 +
    metric(metrics, "stars") / 100 +
    metric(metrics, "downloads") / 10_000 +
    metric(metrics, "volume") / 1_000_000
  return signal > 0 ? clamp(Math.log10(1 + signal) * 22) : 0
}

export function scoreSentiment(sourceType: SourceType, text: string) {
  if (sourceType !== "opinion") return null
  const lower = text.toLowerCase()
  const positive = positiveWords.filter((word) => lower.includes(word)).length
  const negative = negativeWords.filter((word) => lower.includes(word)).length
  if (positive === 0 && negative === 0) return null
  return clamp((positive - negative) / Math.max(positive + negative, 1), -1, 1)
}

export function calculateScores(input: {
  sourceType: SourceType
  reliabilityScore: number
  title: string
  summary?: string
  publishedAt?: Date
  fetchedAt?: Date
  metrics?: Record<string, unknown>
}) {
  const text = `${input.title} ${input.summary ?? ""}`
  return {
    reliabilityScore: clamp(input.reliabilityScore),
    importanceScore: scoreImportance(input.sourceType, text, input.metrics),
    noveltyScore: scoreNovelty(input.publishedAt, input.fetchedAt),
    heatScore: scoreHeat(input.metrics),
    sentimentScore: scoreSentiment(input.sourceType, text),
  }
}
