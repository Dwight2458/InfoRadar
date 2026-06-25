import { SourceTypeBadge } from "@/components/status-badges"

export function MetricCard({
  label,
  value,
  type,
  detail,
}: {
  label: string
  value: number
  type?: string
  detail?: string
}) {
  return (
    <div className="workspace-panel min-h-32 p-4">
      <div className="flex items-center gap-2 text-sm font-medium">
        {type ? <SourceTypeBadge type={type} /> : null}
        <span>{label}</span>
      </div>
      <div className="mt-5 font-mono text-3xl font-semibold tracking-tight text-foreground">
        {value.toLocaleString()}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{detail ?? "按本地时区统计"}</p>
    </div>
  )
}
