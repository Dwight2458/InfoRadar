import Link from "next/link"
import { Filter, RotateCcw, Search } from "lucide-react"

import { DataUnavailable } from "@/components/data-unavailable"
import { ItemTable } from "@/components/items/item-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { formatDate } from "@/lib/format"
import { listItems, parseItemQuery } from "@/services/item-query-service"
import { listSources } from "@/services/source-service"

export const dynamic = "force-dynamic"

type SearchParams = Promise<Record<string, string | string[] | undefined>>

function pageHref(params: URLSearchParams, page: number) {
  const next = new URLSearchParams(params)
  next.set("page", String(page))
  return `/items?${next.toString()}`
}

export default async function ItemsPage({ searchParams }: { searchParams: SearchParams }) {
  const rawParams = await searchParams
  const query = parseItemQuery(rawParams)
  const [result, sources] = await Promise.all([
    listItems(query).catch(() => null),
    listSources().catch(() => []),
  ])
  if (!result) return <DataUnavailable />
  const urlParams = new URLSearchParams(
    Object.entries(rawParams).flatMap(([key, value]) =>
      value === undefined ? [] : [[key, Array.isArray(value) ? value[0] : value]]
    )
  )

  return (
    <div className="space-y-4">
      <section className="workspace-panel p-4">
        <form action="/items" method="get" className="grid gap-3 lg:grid-cols-12">
          <label className="lg:col-span-3">
            <span className="mb-1.5 block text-xs text-muted-foreground">关键词</span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input name="keyword" defaultValue={query.keyword} placeholder="标题、摘要或正文" className="pl-8" />
            </div>
          </label>
          <label className="lg:col-span-2">
            <span className="mb-1.5 block text-xs text-muted-foreground">源类型</span>
            <NativeSelect name="sourceType" defaultValue={query.sourceType ?? ""} className="w-full">
              <NativeSelectOption value="">全部类型</NativeSelectOption>
              <NativeSelectOption value="fact">事实源</NativeSelectOption>
              <NativeSelectOption value="news">新闻源</NativeSelectOption>
              <NativeSelectOption value="opinion">观点源</NativeSelectOption>
            </NativeSelect>
          </label>
          <label className="lg:col-span-2">
            <span className="mb-1.5 block text-xs text-muted-foreground">领域</span>
            <NativeSelect name="category" defaultValue={query.category ?? ""} className="w-full">
              <NativeSelectOption value="">全部领域</NativeSelectOption>
              {(["ai", "tech", "crypto", "finance", "stock", "macro", "devtools"] as const).map((category) => (
                <NativeSelectOption key={category} value={category}>{category.toUpperCase()}</NativeSelectOption>
              ))}
            </NativeSelect>
          </label>
          <label className="lg:col-span-2">
            <span className="mb-1.5 block text-xs text-muted-foreground">信息源</span>
            <NativeSelect name="source" defaultValue={query.source ?? ""} className="w-full">
              <NativeSelectOption value="">全部信息源</NativeSelectOption>
              {sources.map((source) => (
                <NativeSelectOption key={source.id} value={source.slug}>{source.name}</NativeSelectOption>
              ))}
            </NativeSelect>
          </label>
          <label className="lg:col-span-1">
            <span className="mb-1.5 block text-xs text-muted-foreground">最低重要性</span>
            <Input name="minImportance" type="number" min="0" max="100" defaultValue={query.minImportance} />
          </label>
          <label className="lg:col-span-2">
            <span className="mb-1.5 block text-xs text-muted-foreground">排序</span>
            <NativeSelect name="sort" defaultValue={query.sort} className="w-full">
              <NativeSelectOption value="publishedAt">发布时间</NativeSelectOption>
              <NativeSelectOption value="fetchedAt">采集时间</NativeSelectOption>
              <NativeSelectOption value="importanceScore">重要性</NativeSelectOption>
              <NativeSelectOption value="heatScore">热度</NativeSelectOption>
              <NativeSelectOption value="reliabilityScore">可靠性</NativeSelectOption>
            </NativeSelect>
          </label>
          <label className="lg:col-span-2">
            <span className="mb-1.5 block text-xs text-muted-foreground">开始日期</span>
            <Input name="from" type="date" defaultValue={query.from ? formatDate(query.from, false) : undefined} />
          </label>
          <label className="lg:col-span-2">
            <span className="mb-1.5 block text-xs text-muted-foreground">结束日期</span>
            <Input name="to" type="date" defaultValue={query.to ? formatDate(query.to, false) : undefined} />
          </label>
          <label className="lg:col-span-2">
            <span className="mb-1.5 block text-xs text-muted-foreground">顺序</span>
            <NativeSelect name="order" defaultValue={query.order} className="w-full">
              <NativeSelectOption value="desc">从高到低 / 从新到旧</NativeSelectOption>
              <NativeSelectOption value="asc">从低到高 / 从旧到新</NativeSelectOption>
            </NativeSelect>
          </label>
          <div className="flex items-end gap-2 lg:col-span-6">
            <Button type="submit"><Filter /> 应用筛选</Button>
            <Button nativeButton={false} variant="outline" render={<Link href="/items" />}><RotateCcw /> 重置</Button>
            <span className="ml-auto text-xs text-muted-foreground">共 {result.total.toLocaleString()} 条</span>
          </div>
        </form>
      </section>

      <section className="workspace-panel overflow-hidden">
        <ItemTable items={result.items} />
        {result.pageCount > 1 ? (
          <div className="border-t border-border/60 px-4 py-3">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious href={pageHref(urlParams, Math.max(1, result.page - 1))} text="上一页" />
                </PaginationItem>
                {Array.from({ length: Math.min(5, result.pageCount) }, (_, index) => {
                  const page = Math.min(result.pageCount, Math.max(1, result.page - 2) + index)
                  return (
                    <PaginationItem key={page}>
                      <PaginationLink href={pageHref(urlParams, page)} isActive={page === result.page}>{page}</PaginationLink>
                    </PaginationItem>
                  )
                })}
                <PaginationItem>
                  <PaginationNext href={pageHref(urlParams, Math.min(result.pageCount, result.page + 1))} text="下一页" />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        ) : null}
      </section>
    </div>
  )
}
