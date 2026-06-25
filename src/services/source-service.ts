import { getDb } from "@/lib/db"

export async function listSources() {
  return getDb().source.findMany({
    orderBy: [{ type: "asc" }, { name: "asc" }],
    include: { fetchJobs: { orderBy: { createdAt: "desc" }, take: 1 } },
  })
}

export async function getSourceBySlug(slug: string) {
  return getDb().source.findUnique({ where: { slug } })
}

export async function setSourceEnabled(id: string, enabled: boolean) {
  return getDb().source.update({ where: { id }, data: { enabled } })
}

export async function listDueSources(now = new Date()) {
  const sources = await getDb().source.findMany({ where: { enabled: true } })
  return sources.filter((source) => {
    if (!source.lastAttemptAt) return true
    return now.getTime() - source.lastAttemptAt.getTime() >= source.fetchIntervalMinutes * 60_000
  })
}
