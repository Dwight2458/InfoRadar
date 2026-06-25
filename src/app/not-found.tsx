import Link from "next/link"
import { Radar } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"

export default function NotFound() {
  return (
    <Empty className="workspace-panel min-h-96">
      <EmptyHeader>
        <EmptyMedia variant="icon"><Radar /></EmptyMedia>
        <EmptyTitle>未找到该信息</EmptyTitle>
        <EmptyDescription>条目可能已归档或链接无效。</EmptyDescription>
      </EmptyHeader>
      <Button nativeButton={false} render={<Link href="/items" />}>返回信息流</Button>
    </Empty>
  )
}
