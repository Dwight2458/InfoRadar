import { config } from "dotenv"
import { z } from "zod"

if (typeof window === "undefined") {
  config({ path: ".env.local", quiet: true })
  config({ path: ".env", quiet: true })
}

const booleanFromString = z
  .enum(["true", "false"])
  .default("false")
  .transform((value) => value === "true")

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z
    .string()
    .url()
    .default("postgresql://inforadar_mvp:inforadar_mvp@localhost:55432/inforadar_mvp"),
  REDIS_URL: z.string().url().default("redis://localhost:56379"),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default("info"),
  GITHUB_TOKEN: z.string().min(1).optional(),
  HUGGINGFACE_TOKEN: z.string().min(1).optional(),
  COINGECKO_API_KEY: z.string().min(1).optional(),
  X_BEARER_TOKEN: z.string().min(1).optional(),
  LLM_PROVIDER: z.enum(["mock", "openai"]).default("mock"),
  LLM_ENRICHMENT_ENABLED: booleanFromString,
  LLM_MAX_ITEMS_PER_FETCH: z.coerce.number().int().min(0).max(100).default(10),
  OPENAI_API_KEY: z.string().min(1).optional(),
  OPENAI_MODEL: z.string().min(1).optional(),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  throw new Error(`Invalid environment variables: ${parsed.error.message}`)
}

export const env = parsed.data
