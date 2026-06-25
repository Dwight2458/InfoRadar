"use client"

import { useState } from "react"
import { Download } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

export function FetchAllButton() {
  const [pending, setPending] = useState(false)
  const router = useRouter()

  async function queueAll() {
    setPending(true)
    try {
      const response = await fetch("/api/fetch", { method: "POST" })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error ?? "任务创建失败")
      toast.success(`已将 ${body.queued} 个信息源加入队列`)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "任务创建失败")
    } finally {
      setPending(false)
    }
  }

  return (
    <Button onClick={queueAll} disabled={pending} className="h-9 px-4 shadow-[0_0_24px_-8px_var(--primary)]">
      {pending ? <Spinner /> : <Download />}
      立即采集
    </Button>
  )
}
