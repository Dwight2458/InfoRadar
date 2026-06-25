import { PrismaPg } from "@prisma/adapter-pg"

import { PrismaClient } from "@/generated/prisma/client"
import { env } from "@/lib/env"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export function getDb() {
  if (!globalForPrisma.prisma) {
    const adapter = new PrismaPg({ connectionString: env.DATABASE_URL })
    globalForPrisma.prisma = new PrismaClient({ adapter })
  }

  return globalForPrisma.prisma
}
