'use client'

import { useState, useTransition } from 'react'
import { motion } from 'framer-motion'
import type { ScoringRule } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { updateScoringRule } from '@/app/actions/admin'
import { Check, AlertTriangle } from 'lucide-react'

interface AdminScoringClientProps {
  rules: ScoringRule[]
}

export function AdminScoringClient({ rules: initialRules }: AdminScoringClientProps) {
  const [rules, setRules] = useState(initialRules)
  const [isPending, startTransition] = useTransition()
  const [savedId, setSavedId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSave = (rule: ScoringRule) => {
    setError(null)
    startTransition(async () => {
      const result = await updateScoringRule(rule)
      if (result.error) setError(result.error)
      else {
        setSavedId(rule.id)
        setTimeout(() => setSavedId(null), 2000)
      }
    })
  }

  return (
    <div className="space-y-4">
      <a href="/admin" className="text-sm text-primary font-medium">← Admin</a>
      <h1 className="text-xl font-black">Reglas de puntuación</h1>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
          <AlertTriangle className="w-4 h-4" /> {error}
        </div>
      )}

      <div className="space-y-2">
        {rules.map((rule) => (
          <motion.div key={rule.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card>
              <CardContent className="py-4 px-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-sm">{rule.key}</p>
                    <p className="text-xs text-muted-foreground">{rule.description}</p>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rule.enabled}
                      onChange={(e) => {
                        const updated = { ...rule, enabled: e.target.checked }
                        setRules(rules.map((r) => r.id === rule.id ? updated : r))
                      }}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-xs">Activo</span>
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-xs font-medium">Puntos:</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={rule.points}
                    onChange={(e) => {
                      const updated = { ...rule, points: Number(e.target.value) }
                      setRules(rules.map((r) => r.id === rule.id ? updated : r))
                    }}
                    className="w-20 h-8 rounded-lg border border-input bg-muted/50 px-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <Button
                    size="sm"
                    variant={savedId === rule.id ? 'secondary' : 'default'}
                    onClick={() => handleSave(rule)}
                    loading={isPending}
                  >
                    {savedId === rule.id ? <><Check className="w-3 h-3" /> Guardado</> : 'Guardar'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
