import { JobStatusBadge } from "@/components/status-badges"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatDate, formatDuration } from "@/lib/format"

export type JobTableRow = {
  id: string
  status: string
  trigger: string
  durationMs: number | null
  fetchedCount: number
  insertedCount: number
  duplicateCount: number
  error: string | null
  createdAt: Date
  finishedAt: Date | null
  source: { name: string; slug: string }
}

export function JobTable({ jobs, compact = false }: { jobs: JobTableRow[]; compact?: boolean }) {
  if (compact) {
    return (
      <div>
        <div className="grid grid-cols-[minmax(0,1fr)_5rem_4.5rem] gap-2 border-b border-border/60 bg-muted/35 px-3 py-2 text-xs text-muted-foreground">
          <span>任务名称</span>
          <span>状态</span>
          <span className="text-right">完成时间</span>
        </div>
        {jobs.map((job) => (
          <div
            key={job.id}
            className={`grid grid-cols-[minmax(0,1fr)_5rem_4.5rem] gap-2 border-b border-border/60 px-3 py-2.5 last:border-0 ${job.status === "FAILED" ? "bg-destructive/5" : ""}`}
          >
            <div className="min-w-0">
              <p className="truncate font-medium">{job.source.name}</p>
              <p className="mt-1 truncate font-mono text-[10px] text-muted-foreground">
                {job.source.slug} · {job.fetchedCount.toLocaleString()} 条 · {formatDuration(job.durationMs)}
              </p>
              {job.error ? <p className="mt-1 line-clamp-2 break-all text-[11px] leading-4 text-destructive">{job.error}</p> : null}
            </div>
            <div className="pt-0.5"><JobStatusBadge status={job.status} /></div>
            <div className="pt-1 text-right font-mono text-[10px] text-muted-foreground">{formatDate(job.finishedAt ?? job.createdAt).slice(11)}</div>
          </div>
        ))}
        {jobs.length === 0 ? <div className="py-14 text-center text-sm text-muted-foreground">暂无采集任务</div> : null}
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/35 hover:bg-muted/35">
            <TableHead>任务名称</TableHead>
            <TableHead className="w-24">状态</TableHead>
            <TableHead className="w-24 text-right">耗时</TableHead>
            <TableHead className="w-20 text-right">条目数</TableHead>
            <TableHead className="w-20 text-right">新增</TableHead>
            <TableHead className="w-20 text-right">重复</TableHead>
            <TableHead className="w-36 text-right">完成时间</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobs.map((job) => (
            <TableRow key={job.id} className={job.status === "FAILED" ? "bg-destructive/5" : undefined}>
              <TableCell className="min-w-56">
                <p className="font-medium">{job.source.name}</p>
                <p className="mt-1 font-mono text-[11px] text-muted-foreground">{job.trigger.toLowerCase()} · {job.source.slug}</p>
                {job.error ? <p className="mt-1 line-clamp-2 text-xs text-destructive">{job.error}</p> : null}
              </TableCell>
              <TableCell><JobStatusBadge status={job.status} /></TableCell>
              <TableCell className="text-right font-mono text-xs">{formatDuration(job.durationMs)}</TableCell>
              <TableCell className="text-right font-mono">{job.fetchedCount.toLocaleString()}</TableCell>
              <TableCell className="text-right font-mono">{job.insertedCount.toLocaleString()}</TableCell>
              <TableCell className="text-right font-mono">{job.duplicateCount.toLocaleString()}</TableCell>
              <TableCell className="text-right font-mono text-xs text-muted-foreground">{formatDate(job.finishedAt ?? job.createdAt)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {jobs.length === 0 ? <div className="py-14 text-center text-sm text-muted-foreground">暂无采集任务</div> : null}
    </div>
  )
}
