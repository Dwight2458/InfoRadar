import { getLLMProvider, type LLMItem } from "@/lib/llm"

export async function summarizeDailyDigest(items: LLMItem[]) {
  return getLLMProvider().summarizeDailyDigest(items)
}
