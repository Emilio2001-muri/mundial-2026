import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getAuditLogs } from '@/app/actions/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatMatchTime } from '@/lib/utils'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { deleteMatchPrediction, clearPredictionComment } from '@/app/actions/admin'

export const revalidate = 0

export default async function AdminAuditPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const { data: predictions } = await supabase
    .from('match_predictions')
    .select(`
      id, comment, predicted_home_score, predicted_away_score, created_at,
      profile:profiles(display_name),
      match:matches(match_number,
        home_team:teams!matches_home_team_id_fkey(fifa_code),
        away_team:teams!matches_away_team_id_fkey(fifa_code)
      )
    `)
    .order('created_at', { ascending: false })
    .limit(200)

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-black">Gestión de Predicciones</h1>
      <p className="text-sm text-muted-foreground">{predictions?.length ?? 0} predicciones registradas</p>

      <div className="space-y-2">
        {(predictions ?? []).length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">Sin predicciones aún.</p>
        )}
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {(predictions ?? []).map((p: any) => (
          <div key={p.id} className="rounded-xl border border-border bg-card p-3">
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold">{p.profile?.display_name ?? 'Usuario'}</span>
                  <span className="text-xs text-muted-foreground">
                    P{p.match?.match_number ?? '?'} — {p.match?.home_team?.fifa_code ?? '?'} vs {p.match?.away_team?.fifa_code ?? '?'}
                  </span>
                  <span className="text-xs font-semibold text-primary">
                    {p.predicted_home_score ?? '?'} – {p.predicted_away_score ?? '?'}
                  </span>
                </div>
                {p.comment && (
                  <p className="text-xs text-muted-foreground mt-1 italic bg-muted/50 rounded px-2 py-1">
                    "{p.comment}"
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-1 flex-shrink-0">
                {p.comment && (
                  <form action={clearPredictionComment}>
                    <input type="hidden" name="prediction_id" value={p.id} />
                    <button type="submit"
                      className="w-full text-xs text-amber-600 font-semibold px-2 py-1 rounded border border-amber-500/20 hover:bg-amber-500/10 transition-colors whitespace-nowrap">
                      Borrar comentario
                    </button>
                  </form>
                )}
                <form action={deleteMatchPrediction}>
                  <input type="hidden" name="prediction_id" value={p.id} />
                  <button type="submit"
                    className="w-full text-xs text-destructive font-semibold px-2 py-1 rounded border border-destructive/20 hover:bg-destructive/10 transition-colors">
                    Borrar predicción
                  </button>
                </form>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const logs = await getAuditLogs(50)

  return (
    <div className="space-y-4">
      <a href="/admin" className="text-sm text-primary font-medium">← Admin</a>
      <h1 className="text-xl font-black">Auditoría</h1>

      <Card>
        <CardHeader><CardTitle>{logs.length} entradas recientes</CardTitle></CardHeader>
        <CardContent className="space-y-2 pt-0">
          {logs.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Sin registros todavía</p>
          ) : (
            logs.map((log) => {
              const logTyped = log as {
                id: string
                action: string
                entity_type: string
                entity_id: string
                created_at: string
                actor: { display_name: string } | null
              }
              return (
                <div key={logTyped.id} className="py-2.5 border-b border-border/40 last:border-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">{logTyped.action}</p>
                      <p className="text-xs text-muted-foreground">
                        {logTyped.actor?.display_name ?? 'Admin'} · {logTyped.entity_type} #{logTyped.entity_id.slice(0, 8)}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground flex-shrink-0">
                      {formatMatchTime(logTyped.created_at)}
                    </p>
                  </div>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>
    </div>
  )
}
