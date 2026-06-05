'use client'

import Link from 'next/link'
import { useTheme } from 'next-themes'
import { Sun, Moon, Monitor, Settings, LogOut, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import type { Profile } from '@/types'

export function TopBar({ profile }: { profile: Profile | null }) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => setMounted(true), [])

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark')
    else if (theme === 'dark') setTheme('system')
    else setTheme('light')
  }

  const ThemeIcon = !mounted ? Monitor : theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="sticky top-0 z-40 glass safe-top border-b border-border/50">
      <div className="flex items-center justify-between h-14 px-4 max-w-2xl mx-auto">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="text-2xl">⚽</span>
          <span className="font-bold text-base gradient-text">Mundial 2026</span>
        </Link>

        <div className="flex items-center gap-1">
          {/* Theme toggle */}
          <button
            onClick={cycleTheme}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Toggle theme"
          >
            <ThemeIcon className="w-4 h-4" />
          </button>

          {/* Admin link */}
          {profile?.role === 'admin' && (
            <Link
              href="/admin"
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Admin panel"
            >
              <Shield className="w-4 h-4" />
            </Link>
          )}

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-muted transition-colors"
            aria-label="Cerrar sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  )
}
