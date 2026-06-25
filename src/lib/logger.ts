import pino from "pino"

import { env } from "@/lib/env"

export const logger = pino({
  level: env.LOG_LEVEL,
  base: { service: "inforadar" },
  timestamp: pino.stdTimeFunctions.isoTime,
})
