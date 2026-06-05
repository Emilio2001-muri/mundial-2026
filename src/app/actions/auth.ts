'use server'

import { createAdminClient } from '@/lib/supabase/admin'

function toInternalEmail(name: string): string {
  const slug = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_.]/g, '')
    .slice(0, 40) || 'user'
  return `${slug}@mundial2026.app`
}

export async function registerUser(displayName: string, password: string) {
  const admin = createAdminClient()
  const email = toInternalEmail(displayName)

  // Check if username already taken (case-insensitive)
  const { data: existing } = await admin
    .from('profiles')
    .select('id')
    .ilike('display_name', displayName)
    .maybeSingle()

  if (existing) {
    return { error: 'Ese nombre ya está en uso. Elige otro.' }
  }

  // Create user with email_confirm: true so no confirmation email needed
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name: displayName },
  })

  if (error) {
    if (error.message?.includes('already been registered')) {
      return { error: 'Ese nombre ya está en uso. Elige otro.' }
    }
    return { error: error.message ?? 'Error al crear la cuenta.' }
  }

  return { email, userId: data.user?.id }
}
