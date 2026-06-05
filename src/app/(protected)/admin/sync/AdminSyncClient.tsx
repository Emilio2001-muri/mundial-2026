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
              {currentProvider}
            </Badge>
          </div>

          {currentProvider === 'manual' && (
            <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3">
              <p className="text-sm text-amber-700 dark:text-amber-400">
                <strong>Modo manual:</strong> No hay API configurada. Los datos deben ingresarse manualmente desde la gestión de partidos. Configura <code>FOOTBALL_DATA_PROVIDER</code> en tus variables de entorno para usar una API.
              </p>
            </div>
          )}

          <Button
            onClick={handleSync}
            loading={isPending}
            className="w-full"
            variant="default"
          >
            <RefreshCw className="w-4 h-4" />
            Sincronizar fixtures
          </Button>

          {result && (
            <div className={`rounded-xl p-3 flex items-start gap-2 ${result.error ? 'bg-destructive/10' : 'bg-emerald-500/10'}`}>
              {result.error ? (
                <><AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{result.error}</p></>
              ) : (
                <><CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-emerald-700 dark:text-emerald-400">Sincronizados {result.count} fixtures correctamente.</p></>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Instrucciones</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>Para usar API-Football (plan gratis: 100 req/día):</p>
          <ol className="list-decimal list-inside space-y-1 text-xs">
            <li>Regístrate en api-sports.io</li>
            <li>Copia tu API key</li>
            <li>Añade <code>FOOTBALL_DATA_PROVIDER=api-football</code> a tu .env</li>
            <li>Añade <code>API_FOOTBALL_KEY=tu_key</code> a tu .env</li>
            <li>Redeploy en Vercel</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}
