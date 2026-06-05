import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getAuditLogs } from '@/app/actions/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatMatchTime } from '@/lib/utils'

export default async function AdminAuditPage() {
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
