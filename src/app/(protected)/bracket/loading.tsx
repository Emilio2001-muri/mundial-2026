import { Skeleton } from '@/components/ui/skeleton'

export default function BracketLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-7 w-32" />
      <div className="flex gap-2">
        {[1,2].map(i => <Skeleton key={i} className="h-8 w-28 rounded-full" />)}
      </div>
      <div className="grid grid-cols-3 gap-3">
        {Array.from({length: 12}).map((_,i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
    </div>
  )
}
