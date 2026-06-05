'use client'

import { useState, useTransition } from 'react'
import { motion } from 'framer-motion'
import type { Profile } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { createUserAccount } from '@/app/actions/admin'
import { UserPlus, Shield, User } from 'lucide-react'

interface AdminUsersClientProps {
  users: Profile[]
  currentUserId: string
}

export function AdminUsersClient({ users, currentUserId }: AdminUsersClientProps) {
  const [showForm, setShowForm] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [role, setRole] = useState<'user' | 'admin'>('user')
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  const handleCreate = () => {
    startTransition(async () => {
      const res = await createUserAccount(email, password, displayName, role)
      if (res.error) {
        setMessage({ text: res.error, type: 'error' })
      } else {
        setMessage({ text: `Usuario ${displayName} creado correctamente.`, type: 'success' })
        setEmail(''); setPassword(''); setDisplayName('')
        setShowForm(false)
      }
    })
  }

  return (
    <div className="space-y-4">
      <a href="/admin" className="text-sm text-primary font-medium">← Admin</a>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-black">Usuarios ({users.length}/8)</h1>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <UserPlus className="w-4 h-4" />
          Nuevo usuario
        </Button>
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardContent className="py-4 space-y-3">
              <h3 className="font-semibold text-sm">Crear usuario</h3>
              <Input placeholder="Nombre visible" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
              <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <Input type="password" placeholder="Contraseña (mín. 6 chars)" value={password} onChange={(e) => setPassword(e.target.value)} />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'user' | 'admin')}
                className="w-full h-10 rounded-xl border border-input bg-muted/50 px-3 text-sm"
              >
                <option value="user">Usuario normal</option>
                <option value="admin">Admin</option>
              </select>
              <div className="flex gap-2">
                <Button onClick={handleCreate} loading={isPending} className="flex-1">Crear</Button>
                <Button variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {message && (
        <div className={`rounded-xl p-3 text-sm ${message.type === 'error' ? 'bg-destructive/10 text-destructive' : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'}`}>
          {message.text}
        </div>
      )}

      <div className="space-y-2">
        {users.map((u) => (
          <Card key={u.id}>
            <CardContent className="py-3 px-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center font-bold text-sm flex-shrink-0">
                {u.display_name[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm truncate">{u.display_name}</span>
                  {u.id === currentUserId && <Badge variant="secondary" className="text-[10px]">Tú</Badge>}
                </div>
                <p className="text-xs text-muted-foreground truncate">{u.timezone}</p>
              </div>
              <Badge variant={u.role === 'admin' ? 'default' : 'outline'}>
                {u.role === 'admin' ? <Shield className="w-3 h-3 mr-1" /> : <User className="w-3 h-3 mr-1" />}
                {u.role}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
