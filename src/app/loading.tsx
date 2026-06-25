import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-32 rounded-lg" />)}
      </div>
      <Skeleton className="h-24 rounded-lg" />
      <Skeleton className="h-[34rem] rounded-lg" />
    </div>
  )
}
