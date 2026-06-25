import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

import { CategoryBadge, SourceTypeBadge } from "@/components/status-badges"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatTime, score } from "@/lib/format"

export type ItemTableRow = {
  id: string
  sourceType: string
  title: string
  publishedAt: Date | null
  importanceScore: number
  reliabilityScore: number
  heatScore: number
  categories: string[]
  source: { name: string; slug: string; category: string }
}

export function ItemTable({ items, compact = false }: { items: ItemTableRow[]; compact?: boolean }) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/35 hover:bg-muted/35">
            <TableHead className="w-24">源类型</TableHead>
            <TableHead>信息标题</TableHead>
            <TableHead className="w-24">类别</TableHead>
            <TableHead className="w-20 text-right">可靠性</TableHead>
            <TableHead className="w-20 text-right">重要性</TableHead>
            {!compact ? <TableHead className="w-16 text-right">热度</TableHead> : null}
            <TableHead className="w-20 text-right">发布时间</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id} className="border-border/60">
              <TableCell><SourceTypeBadge type={item.sourceType} /></TableCell>
              <TableCell className="min-w-72 max-w-[38rem]">
                <Link href={`/items/${item.id}`} className="line-clamp-2 font-medium leading-5 hover:text-primary">
                  {item.title}
                </Link>
                {!compact ? <p className="mt-1 text-xs text-muted-foreground">{item.source.name}</p> : null}
              </TableCell>
              <TableCell><CategoryBadge category={item.categories[0] ?? item.source.category} /></TableCell>
              <TableCell className="text-right font-mono text-emerald-400">{score(item.reliabilityScore)}%</TableCell>
              <TableCell className="text-right font-mono font-medium text-amber-400">{score(item.importanceScore)}</TableCell>
              {!compact ? <TableCell className="text-right font-mono">{score(item.heatScore)}</TableCell> : null}
              <TableCell className="text-right font-mono text-xs text-muted-foreground">{formatTime(item.publishedAt)}</TableCell>
              <TableCell>
                <Link href={`/items/${item.id}`} aria-label={`查看 ${item.title}`} className="text-muted-foreground hover:text-primary">
                  <ArrowUpRight className="size-4" />
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {items.length === 0 ? (
        <div className="py-14 text-center text-sm text-muted-foreground">暂无符合条件的信息</div>
      ) : null}
    </div>
  )
}
