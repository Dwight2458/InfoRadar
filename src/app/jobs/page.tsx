import { DataUnavailable } from "@/components/data-unavailable"
import { JobTable } from "@/components/jobs/job-table"
import { listFetchJobs } from "@/services/job-service"

export const dynamic = "force-dynamic"

export default async function JobsPage() {
  const result = await listFetchJobs().catch(() => null)
  if (!result) return <DataUnavailable />
  return (
    <section className="workspace-panel overflow-hidden">
      <div className="border-b border-border/70 px-4 py-4">
        <h2 className="font-medium">采集任务</h2>
        <p className="mt-1 text-xs text-muted-foreground">共 {result.total.toLocaleString()} 条任务记录，失败任务会保留错误信息。</p>
      </div>
      <JobTable jobs={result.jobs} />
    </section>
  )
}
