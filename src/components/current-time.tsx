"use client"

import { CalendarDays } from "lucide-react"
import { useSyncExternalStore } from "react"

function subscribe(onChange: () => void) {
  const interval = window.setInterval(onChange, 1_000)
  return () => window.clearInterval(interval)
}

function getSnapshot() {
  return Math.floor(Date.now() / 1_000)
}

function getServerSnapshot() {
  return 0
}

export function CurrentTime() {
  const timestamp = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  if (!timestamp) return <div className="hidden w-52 xl:block" aria-hidden="true" />
  const date = new Date(timestamp * 1_000)
  const weekday = new Intl.DateTimeFormat("zh-CN", { weekday: "short" }).format(date)
  const day = new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date)
  const time = new Intl.DateTimeFormat("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date)

  return (
    <div className="hidden items-center gap-2 text-xs text-muted-foreground xl:flex">
      <CalendarDays className="size-4" />
      <span>{day}</span>
      <span>{weekday}</span>
      <span className="font-mono">{time}</span>
    </div>
  )
}
