import { DataUnavailable } from "@/components/data-unavailable"
import { JobStatusBadge, SourceTypeBadge, CategoryBadge } from "@/components/status-badges"
import { SourceActions } from "@/components/sources/source-actions"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatDate } from "@/lib/format"
import { listSources } from "@/services/source-service"

export const dynamic = "force-dynamic"

export default async function SourcesPage() {
  const sources = await listSources().catch(() => null)
  if (!sources) return <DataUnavailable />

  return (
    <section className="workspace-panel overflow-hidden">
      <div className="border-b border-border/70 px-4 py-4">
        <h2 className="font-medium">信息源管理</h2>
        <p className="mt-1 text-xs text-muted-foreground">启用状态决定定时调度；手动采集任务由 Worker 异步处理。</p>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/35 hover:bg-muted/35">
              <TableHead>信息源</TableHead>
              <TableHead className="w-24">类型</TableHead>
              <TableHead className="w-24">领域</TableHead>
              <TableHead className="w-28">Provider</TableHead>
              <TableHead className="w-24 text-right">可靠性</TableHead>
              <TableHead className="w-36">最近状态</TableHead>
              <TableHead className="w-44 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sources.map((source) => {
              const latestJob = source.fetchJobs[0]
              return (
                <TableRow key={source.id} className={!source.enabled ? "opacity-60" : undefined}>
                  <TableCell className="min-w-72">
                    <p className="font-medium">{source.name}</p>
                    <p className="mt-1 font-mono text-[11px] text-muted-foreground">{source.slug} · 每 {source.fetchIntervalMinutes} 分钟</p>
                    {source.lastError ? <p className="mt-1 line-clamp-1 text-xs text-destructive">{source.lastError}</p> : null}
                  </TableCell>
                  <TableCell><SourceTypeBadge type={source.type} /></TableCell>
                  <TableCell><CategoryBadge category={source.category} /></TableCell>
                  <TableCell className="font-mono text-xs">{source.provider}</TableCell>
                  <TableCell className="text-right font-mono text-emerald-400">{Math.round(source.reliabilityScore)}%</TableCell>
                  <TableCell>
                    {latestJob ? <JobStatusBadge status={latestJob.status} /> : <span className="text-xs text-muted-foreground">尚未采集</span>}
                    <p className="mt-1 font-mono text-[10px] text-muted-foreground">{formatDate(latestJob?.finishedAt ?? source.lastAttemptAt)}</p>
                  </TableCell>
                  <TableCell><SourceActions id={source.id} name={source.name} enabled={source.enabled} /></TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </section>
  )
}
