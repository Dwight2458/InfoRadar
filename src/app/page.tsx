import Link from "next/link"
import { ArrowRight, BrainCircuit, ChartNoAxesColumnIncreasing, Coins, Landmark, Monitor } from "lucide-react"

import { DataUnavailable } from "@/components/data-unavailable"
import { MetricCard } from "@/components/dashboard/metric-card"
import { ItemTable } from "@/components/items/item-table"
import { JobTable } from "@/components/jobs/job-table"
import { Button } from "@/components/ui/button"
import { getDashboardData } from "@/services/dashboard-service"

export const dynamic = "force-dynamic"

const layerLabels = { FACT: "事实源", NEWS: "新闻源", OPINION: "观点/情绪源" }
const categoryMeta = {
  AI: { label: "AI", icon: BrainCircuit, color: "bg-chart-1 text-chart-1" },
  TECH: { label: "Tech", icon: Monitor, color: "bg-chart-2 text-chart-2" },
  CRYPTO: { label: "Crypto", icon: Coins, color: "bg-chart-3 text-chart-3" },
  FINANCE: { label: "Finance", icon: Landmark, color: "bg-chart-4 text-chart-4" },
  STOCK: { label: "Stock", icon: ChartNoAxesColumnIncreasing, color: "bg-chart-5 text-chart-5" },
} as const

export default async function DashboardPage() {
  const data = await getDashboardData().catch(() => null)
  if (!data) return <DataUnavailable />

  const layerCount = Object.fromEntries(data.layerCounts.map((entry) => [entry.sourceType, entry._count._all]))
  const maxCategory = Math.max(1, ...data.categoryCounts.map((entry) => entry.count))

  return (
    <div className="space-y-4">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="今日新增" value={data.todayCount} detail={`${data.enabledSources} 个信息源已启用`} />
        {(["FACT", "NEWS", "OPINION"] as const).map((type) => (
          <MetricCard key={type} type={type} label={layerLabels[type]} value={layerCount[type] ?? 0} detail="今日已入库" />
        ))}
      </section>

      <section className="workspace-panel p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-medium">类别分布</h2>
          <span className="text-xs text-muted-foreground">全部已入库信息</span>
        </div>
        <div className="grid gap-5 md:grid-cols-5">
          {data.categoryCounts.map((entry) => {
            const meta = categoryMeta[entry.category as keyof typeof categoryMeta]
            const Icon = meta.icon
            return (
              <div key={entry.category} className="min-w-0 md:border-r md:border-border/60 md:pr-5 md:last:border-0">
                <div className="mb-3 flex items-center gap-2">
                  <Icon className={`size-5 ${meta.color.split(" ")[1]}`} />
                  <span className="text-sm font-medium">{meta.label}</span>
                  <span className="ml-auto font-mono text-sm">{entry.count.toLocaleString()}</span>
                </div>
                <div className="score-track">
                  <div className={`score-fill ${meta.color.split(" ")[0]}`} style={{ width: `${(entry.count / maxCategory) * 100}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.9fr)_minmax(22rem,1fr)]">
        <section className="workspace-panel min-w-0 overflow-hidden">
          <div className="flex h-13 items-center justify-between border-b border-border/70 px-4">
            <h2 className="font-medium">高重要性信息</h2>
            <Button nativeButton={false} variant="link" size="sm" render={<Link href="/items?sort=importanceScore" />}>
              查看全部 <ArrowRight />
            </Button>
          </div>
          <ItemTable items={data.importantItems} compact />
        </section>
        <section className="workspace-panel min-w-0 overflow-hidden">
          <div className="flex h-13 items-center justify-between border-b border-border/70 px-4">
            <h2 className="font-medium">最近采集任务</h2>
            <Button nativeButton={false} variant="link" size="sm" render={<Link href="/jobs" />}>
              查看全部 <ArrowRight />
            </Button>
          </div>
          <JobTable jobs={data.recentJobs} compact />
        </section>
      </div>
    </div>
  )
}
