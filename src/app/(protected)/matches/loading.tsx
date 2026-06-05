import { Skeleton } from '@/components/ui/skeleton'

export default function MatchesLoading() {
  return (
    <div className="space-y-4">
      <div>
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-4 w-48 mt-1" />
      </div>
      <Skeleton className="h-10 w-full rounded-xl" />
      <div className="flex gap-2">
        {[1,2,3,4].map(i => <Skeleton key={i} className="h-7 w-20 rounded-full flex-shrink-0" />)}
      </div>
      <div className="space-y-2">
        {Array.from({length: 8}).map((_, i) => (
          <Skeleton key={i} className="h-[72px] w-full rounded-xl" />
        ))}
      </div>
    </div>
  )
}
