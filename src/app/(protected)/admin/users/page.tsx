import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AdminUsersClient } from './AdminUsersClient'
import type { Profile } from '@/types'

export default async function AdminUsersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const { data: users } = await supabase
    .from('profiles')
    .select('*')
    .order('display_name')

  return <AdminUsersClient users={(users ?? []) as Profile[]} currentUserId={user.id} />
}
