import { Skeleton } from '@/components/ui/skeleton'

export default function LeaderboardLoading() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-7 w-36" />
      {Array.from({length: 10}).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
          <Skeleton className="h-12 flex-1 rounded-xl" />
        </div>
      ))}
    </div>
  )
}
