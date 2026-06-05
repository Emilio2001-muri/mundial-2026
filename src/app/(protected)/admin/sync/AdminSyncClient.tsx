'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { syncFixtures } from '@/app/actions/admin'
import { Wifi, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react'

export function AdminSyncClient({ currentProvider }: { currentProvider: string }) {
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<{ error?: string; count?: number } | null>(null)

  const handleSync = () => {
    setResult(null)
    startTransition(async () => {
      const res = await syncFixtures()
      setResult(res)
    })
  }

  return (
    <div className="space-y-4">
      <a href="/admin" className="text-sm text-primary font-medium">← Admin</a>
      <h1 className="text-xl font-black">Sincronizar datos</h1>

      <Card>
        <CardHeader><CardTitle>Proveedor activo</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Wifi className="w-5 h-5 text-primary" />
            <Badge variant={currentProvider === 'manual' ? 'warning' : 'success'}>
              {currentProvider === 'manual' ? 'Manual (sin API)' : currentProvider}
            </Badge>
          </div>

          {currentProvider === 'manual' && (
            <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 space-y-1.5">
              <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">⚠️ API no configurada</p>
              <p className="text-xs text-amber-700/80 dark:text-amber-400/80">
                Para resultados en tiempo real necesitas una clave de football-data.org (gratis).
              </p>
              <ol className="text-xs text-amber-700/80 dark:text-amber-400/80 list-decimal list-inside space-y-1">
                <li>Regístrate en <strong>football-data.org/client/register</strong></li>
                <li>Copia tu API key del correo</li>
                <li>Agrega en Vercel: <code className="bg-black/10 px-1 rounded">FOOTBALL_DATA_API_KEY=tu_clave</code></li>
                <li>Haz redeploy y vuelve aquí a pulsar Sincronizar</li>
              </ol>
            </div>
          )}

          <Button
            onClick={handleSync}
            loading={isPending}
            className="w-full"
            variant="default"
          >
            <RefreshCw className="w-4 h-4" />
            Sincronizar resultados ahora
          </Button>

          {result && (
            <div className={`rounded-xl p-3 flex items-start gap-2 ${result.error ? 'bg-destructive/10' : 'bg-emerald-500/10'}`}>
              {result.error ? (
                <><AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{result.error}</p></>
              ) : (
                <><CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-emerald-700 dark:text-emerald-400">
                  {(result as { count?: number; updated?: number }).updated ?? 0} partidos actualizados de {result.count} recibidos.
                </p></>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Cómo funciona</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>Con la API activada, cada vez que pulses <strong>Sincronizar</strong>:</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>Se obtienen todos los partidos del Mundial 2026 en vivo</li>
            <li>Se actualizan marcadores, estado y tiempo en la BD</li>
            <li>Los puntos del ranking se recalculan automáticamente</li>
            <li>Puedes configurar un cron en Vercel para hacerlo cada 2 minutos</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
