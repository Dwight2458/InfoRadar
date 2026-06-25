"use client"

import { AlertCircle } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <Alert variant="destructive" className="workspace-panel">
      <AlertCircle />
      <AlertTitle>页面加载失败</AlertTitle>
      <AlertDescription className="flex items-center gap-3">
        数据读取或渲染发生错误。
        <Button variant="outline" size="sm" onClick={reset}>重试</Button>
      </AlertDescription>
    </Alert>
  )
}
