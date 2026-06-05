import { TopBar } from './TopBar'
import { MobileBottomNav } from './MobileBottomNav'
import type { Profile } from '@/types'

interface AppShellProps {
  children: React.ReactNode
  profile: Profile | null
}

export function AppShell({ children, profile }: AppShellProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <TopBar profile={profile} />
      <main className="flex-1 has-bottom-nav max-w-2xl w-full mx-auto px-4 py-4">
        {children}
      </main>
      <MobileBottomNav />
    </div>
  )
}
