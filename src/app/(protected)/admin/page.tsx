import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Shield, RefreshCw, Users, Settings, FileText, Wifi } from 'lucide-react'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const adminLinks = [
    { href: '/admin/matches', icon: Settings, label: 'Gestión de partidos', desc: 'Editar fixtures, resultados, horarios' },
    { href: '/admin/sync', icon: Wifi, label: 'Sincronizar datos', desc: 'Importar desde API externa' },
    { href: '/admin/scoring', icon: RefreshCw, label: 'Reglas de puntuación', desc: 'Configurar puntos por categoría' },
    { href: '/admin/users', icon: Users, label: 'Usuarios', desc: 'Gestionar los 8 participantes' },
    { href: '/admin/audit', icon: FileText, label: 'Auditoría', desc: 'Log de cambios del admin' },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Shield className="w-6 h-6 text-primary" />
        <div>
          <h1 className="text-xl font-black">Panel Admin</h1>
          <p className="text-muted-foreground text-sm">Control total de la quiniela</p>
        </div>
      </div>

      <div className="space-y-2">
        {adminLinks.map((link) => (
          <Link key={link.href} href={link.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="py-4 px-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <link.icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{link.label}</p>
                  <p className="text-xs text-muted-foreground">{link.desc}</p>
                </div>
                <span className="text-muted-foreground text-sm">→</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
