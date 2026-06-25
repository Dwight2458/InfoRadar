"use client"

import { useState } from "react"
import { RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"

export function SourceActions({ id, name, enabled }: { id: string; name: string; enabled: boolean }) {
  const [switching, setSwitching] = useState(false)
  const [fetching, setFetching] = useState(false)
  const router = useRouter()

  async function toggle(nextEnabled: boolean) {
    setSwitching(true)
    try {
      const response = await fetch(`/api/sources/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ enabled: nextEnabled }),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error ?? "更新失败")
      toast.success(`${name} 已${nextEnabled ? "启用" : "禁用"}`)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "更新失败")
    } finally {
      setSwitching(false)
    }
  }

  async function fetchNow() {
    setFetching(true)
    try {
      const response = await fetch(`/api/sources/${id}/fetch`, { method: "POST" })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error ?? "任务创建失败")
      toast.success(`${name} 已加入采集队列`)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "任务创建失败")
    } finally {
      setFetching(false)
    }
  }

  return (
    <div className="flex items-center justify-end gap-3">
      <Switch checked={enabled} onCheckedChange={toggle} disabled={switching} aria-label={`${enabled ? "禁用" : "启用"} ${name}`} />
      <Button variant="outline" size="sm" onClick={fetchNow} disabled={!enabled || fetching}>
        {fetching ? <Spinner /> : <RefreshCw />}
        采集
      </Button>
    </div>
  )
}
