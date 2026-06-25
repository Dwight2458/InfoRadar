import dayjs from "dayjs"

import { Category } from "@/generated/prisma/client"
import { getDb } from "@/lib/db"

export async function getDashboardData() {
  const db = getDb()
  const today = dayjs().startOf("day").toDate()
  const categories = [
    Category.AI,
    Category.TECH,
    Category.CRYPTO,
    Category.FINANCE,
    Category.STOCK,
  ]

  const [todayCount, layerCounts, categoryCounts, importantItems, recentJobs, enabledSources] =
    await Promise.all([
      db.item.count({ where: { fetchedAt: { gte: today } } }),
      db.item.groupBy({
        by: ["sourceType"],
        where: { fetchedAt: { gte: today } },
        _count: { _all: true },
      }),
      Promise.all(
        categories.map(async (category) => ({
          category,
          count: await db.item.count({ where: { categories: { has: category } } }),
        }))
      ),
      db.item.findMany({
        include: { source: { select: { name: true, slug: true, category: true } } },
        orderBy: [{ importanceScore: "desc" }, { publishedAt: "desc" }],
        take: 8,
      }),
      db.fetchJob.findMany({
        include: { source: { select: { name: true, slug: true } } },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
      db.source.count({ where: { enabled: true } }),
    ])

  return { todayCount, layerCounts, categoryCounts, importantItems, recentJobs, enabledSources }
}
