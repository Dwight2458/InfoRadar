import { getDb } from "@/lib/db"

export async function listFetchJobs(page = 1, pageSize = 50) {
  const db = getDb()
  const safePage = Math.max(1, page)
  const safePageSize = Math.min(100, Math.max(1, pageSize))
  const [jobs, total] = await Promise.all([
    db.fetchJob.findMany({
      include: { source: { select: { name: true, slug: true, type: true } } },
      orderBy: { createdAt: "desc" },
      skip: (safePage - 1) * safePageSize,
      take: safePageSize,
    }),
    db.fetchJob.count(),
  ])
  return { jobs, total, page: safePage, pageSize: safePageSize }
}
