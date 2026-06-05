import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AdminScoringClient } from './AdminScoringClient'
import type { ScoringRule } from '@/types'

export default async function AdminScoringPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const { data: rules } = await supabase.from('scoring_rules').select('*').order('key')

  return <AdminScoringClient rules={(rules ?? []) as ScoringRule[]} />
}
