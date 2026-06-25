import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ExternalLink } from "lucide-react"

import { CategoryBadge, SourceTypeBadge } from "@/components/status-badges"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { formatDate, score } from "@/lib/format"
import { getItemById } from "@/services/item-query-service"

export const dynamic = "force-dynamic"

export default async function ItemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const item = await getItemById(id).catch(() => null)
  if (!item) notFound()

  const scores = [
    ["可靠性", item.reliabilityScore, "text-emerald-400"],
    ["重要性", item.importanceScore, "text-amber-400"],
    ["新鲜度", item.noveltyScore, "text-sky-400"],
    ["热度", item.heatScore, "text-orange-400"],
    ["情绪", item.sentimentScore, "text-violet-400"],
  ] as const

  return (
    <article className="mx-auto max-w-6xl space-y-4">
      <Button nativeButton={false} variant="ghost" size="sm" render={<Link href="/items" />}><ArrowLeft /> 返回信息流</Button>
      <section className="workspace-panel p-5 md:p-7">
        <div className="flex flex-wrap items-center gap-2">
          <SourceTypeBadge type={item.sourceType} />
          {item.categories.map((category) => <CategoryBadge key={category} category={category} />)}
          <span className="text-xs text-muted-foreground">{item.source.name}</span>
        </div>
        <h2 className="mt-4 max-w-4xl text-2xl font-semibold leading-tight tracking-tight md:text-3xl">{item.title}</h2>
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
          <span>发布：{formatDate(item.publishedAt)}</span>
          <span>采集：{formatDate(item.fetchedAt)}</span>
          {item.author ? <span>作者：{item.author}</span> : null}
          <Button nativeButton={false} variant="link" size="sm" className="h-auto px-0" render={<a href={item.url} target="_blank" rel="noreferrer" />}>
            查看原始链接 <ExternalLink />
          </Button>
        </div>
        <Separator className="my-6" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {scores.map(([label, value, color]) => (
            <div key={label} className="rounded-lg border border-border/60 bg-muted/20 p-3">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className={`mt-2 font-mono text-2xl font-semibold ${color}`}>{score(value)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="workspace-panel p-5 md:p-7">
        <h3 className="font-medium">摘要</h3>
        <p className="mt-3 whitespace-pre-wrap leading-7 text-foreground/85">{item.summary ?? "该条目暂无摘要。"}</p>
        {item.tags.length || item.entities.length ? (
          <div className="mt-5 flex flex-wrap gap-2">
            {[...item.tags, ...item.entities].map((tag) => <Badge key={tag} variant="secondary">{tag}</Badge>)}
          </div>
        ) : null}
      </section>

      {item.content || item.rawContent ? (
        <section className="workspace-panel p-5 md:p-7">
          <h3 className="font-medium">原始内容</h3>
          <div className="mt-3 max-w-none whitespace-pre-wrap break-words text-sm leading-7 text-foreground/80">
            {item.content ?? item.rawContent}
          </div>
        </section>
      ) : null}

      <section className="workspace-panel px-5 md:px-7">
        <Accordion defaultValue={[]}>
          <AccordionItem value="raw" className="border-0">
            <AccordionTrigger className="py-4 hover:no-underline">Raw JSON</AccordionTrigger>
            <AccordionContent>
              <pre className="max-h-[32rem] overflow-auto rounded-lg border border-border/60 bg-black/25 p-4 font-mono text-xs leading-5 text-muted-foreground">
                {JSON.stringify(item.rawJson, null, 2) ?? "null"}
              </pre>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>
    </article>
  )
}
