import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const sourceStyles: Record<string, string> = {
  FACT: "border-sky-500/60 bg-sky-500/10 text-sky-400",
  NEWS: "border-emerald-500/60 bg-emerald-500/10 text-emerald-400",
  OPINION: "border-violet-500/60 bg-violet-500/10 text-violet-400",
}

const categoryStyles: Record<string, string> = {
  AI: "border-blue-500/60 bg-blue-500/10 text-blue-400",
  TECH: "border-cyan-500/60 bg-cyan-500/10 text-cyan-400",
  CRYPTO: "border-amber-500/60 bg-amber-500/10 text-amber-400",
  FINANCE: "border-emerald-500/60 bg-emerald-500/10 text-emerald-400",
  STOCK: "border-purple-500/60 bg-purple-500/10 text-purple-400",
  MACRO: "border-orange-500/60 bg-orange-500/10 text-orange-400",
  DEVTOOLS: "border-slate-500/60 bg-slate-500/10 text-slate-300",
}

export function SourceTypeBadge({ type }: { type: string }) {
  const label = { FACT: "Fact", NEWS: "News", OPINION: "Opinion" }[type] ?? type
  return <Badge variant="outline" className={cn("rounded", sourceStyles[type])}>{label}</Badge>
}

export function CategoryBadge({ category }: { category: string }) {
  return <Badge variant="outline" className={cn("rounded", categoryStyles[category])}>{category}</Badge>
}

export function JobStatusBadge({ status }: { status: string }) {
  const style = {
    SUCCEEDED: "border-emerald-500/50 bg-emerald-500/10 text-emerald-400",
    FAILED: "border-red-500/50 bg-red-500/10 text-red-400",
    RUNNING: "border-blue-500/50 bg-blue-500/10 text-blue-400",
    QUEUED: "border-amber-500/50 bg-amber-500/10 text-amber-400",
    SKIPPED: "border-slate-500/50 bg-slate-500/10 text-slate-400",
  }[status]
  const label = {
    SUCCEEDED: "成功",
    FAILED: "失败",
    RUNNING: "运行中",
    QUEUED: "排队中",
    SKIPPED: "已跳过",
  }[status] ?? status
  return <Badge variant="outline" className={cn("rounded", style)}>{label}</Badge>
}
