import { env } from "@/lib/env"
import type { LLMProvider } from "@/lib/llm/types"
import { MockLLMProvider } from "@/lib/llm/mock-provider"
import { OpenAILLMProvider } from "@/lib/llm/openai-provider"
import { logger } from "@/lib/logger"

let provider: LLMProvider | undefined

export function isLlmEnrichmentEnabled() {
  return (
    env.LLM_ENRICHMENT_ENABLED &&
    env.LLM_PROVIDER === "openai" &&
    Boolean(env.OPENAI_API_KEY && env.OPENAI_MODEL)
  )
}

export function getLLMProvider(): LLMProvider {
  if (provider) return provider
  if (isLlmEnrichmentEnabled()) {
    provider = new OpenAILLMProvider(env.OPENAI_API_KEY!, env.OPENAI_MODEL!)
    return provider
  }
  if (env.LLM_ENRICHMENT_ENABLED && env.LLM_PROVIDER === "openai") {
    logger.warn("OpenAI enrichment requested without both OPENAI_API_KEY and OPENAI_MODEL; using mock provider")
  }
  provider = new MockLLMProvider()
  return provider
}

export type { LLMEnrichment, LLMItem, LLMProvider } from "@/lib/llm/types"
