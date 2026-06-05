import { Skeleton } from '@/components/ui/skeleton'

export default function DashboardLoading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-2 gap-3">
        {[1,2,3,4].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}
      </div>
      <Skeleton className="h-6 w-36 mt-2" />
      <div className="space-y-2">
        {[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
      </div>
    </div>
  )
}
