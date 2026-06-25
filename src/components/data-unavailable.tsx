import { DatabaseZap } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function DataUnavailable() {
  return (
    <Alert className="workspace-panel border-amber-500/30 bg-amber-500/5">
      <DatabaseZap className="text-amber-400" />
      <AlertTitle>数据库暂不可用</AlertTitle>
      <AlertDescription>
        请先运行 docker compose up -d、npm run db:push 和 npm run db:seed。
      </AlertDescription>
    </Alert>
  )
}
