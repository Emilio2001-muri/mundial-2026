import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { cleanupOldData, rescoreAllFinishedMatches } from '@/app/actions/admin'
import { CleanupButton } from './CleanupButton'

export const revalidate = 0

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-black">Panel Admin</h1>
      <div className="grid grid-cols-2 gap-3">
        {[
          { href: '/admin/matches',              label: '⚽ Partidos',         desc: 'Actualizar resultados y eventos' },
          { href: '/admin/awards',               label: '🏆 Premios',          desc: 'Campeón, Balón de Oro, etc.' },
          { href: '/admin/users',                label: '👥 Usuarios',         desc: 'Gestionar usuarios' },
          { href: '/admin/scoring',              label: '📊 Scoring',          desc: 'Reglas de puntuación' },
          { href: '/admin/audit',                label: '🗳 Predicciones',     desc: 'Borrar comentarios/predicciones' },
          { href: '/admin/predictions-manual',   label: '✏️ Pred. Manuales',  desc: 'Ingresar predicciones de usuarios' },
        ].map(item => (
          <Link key={item.href} href={item.href}
            className="rounded-2xl border border-border bg-card p-4 hover:bg-muted/50 transition-colors">
            <p className="font-bold text-sm">{item.label}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
          </Link>
        ))}
      </div>

      {/* Storage cleanup */}
      <div className="rounded-2xl border border-border bg-card p-4 space-y-2">
        <p className="font-bold text-sm">🗑 Limpieza de almacenamiento</p>
        <p className="text-xs text-muted-foreground">
          Elimina snapshots de leaderboard antiguos. Las predicciones nunca se borran.
        </p>
        <CleanupButton action={cleanupOldData} label="Ejecutar limpieza" />
      </div>

      {/* Re-score finished matches */}
      <div className="rounded-2xl border border-border bg-card p-4 space-y-2">
        <p className="font-bold text-sm">🔄 Re-calcular puntos</p>
        <p className="text-xs text-muted-foreground">
          Recalcula los puntos de todos los partidos finalizados. Arregla textos de puntuación
          incorrectos y actualiza el leaderboard.
        </p>
        <CleanupButton
          action={async () => {
            'use server'
            const result = await rescoreAllFinishedMatches()
            const deleted: Record<string, number> = result.rescored > 0
              ? { partidos_recalculados: result.rescored }
              : {}
            return { deleted }
          }}
          label="Recalcular todo"
          confirm="¿Recalcular puntos de todos los partidos finalizados?"
        />
      </div>
    </div>
  )
}
