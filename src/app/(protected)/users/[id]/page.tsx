import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trophy, Target, Zap, TrendingUp } from 'lucide-react'

export default async function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: profile }, { data: snapshot }, { data: recentScores }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', id).single(),
    supabase
      .from('leaderboard_snapshots')
      .select('*')
      .eq('user_id', id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('prediction_scores')
      .select('points, category, reason, created_at')
      .eq('user_id', id)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  if (!profile) notFound()

  return (
    <div className="space-y-4">
      <a href="/leaderboard" className="text-sm text-primary font-medium">← Ranking</a>

      {/* Profile header */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center text-2xl font-black overflow-hidden">
          {profile.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            profile.display_name[0].toUpperCase()
          )}
        </div>
        <div>
          <h1 className="text-xl font-black">{profile.display_name}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            {snapshot?.rank === 1 && <Badge variant="gold">👑 Líder</Badge>}
            {snapshot?.rank && <span className="text-sm text-muted-foreground">Posición #{snapshot.rank}</span>}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="py-4 px-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Puntos</p>
                <p className="text-3xl font-black mt-0.5 gradient-text">{snapshot?.total_points ?? 0}</p>
              </div>
              <Zap className="w-4 h-4 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 px-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Éxito</p>
                <p className="text-3xl font-black mt-0.5">{snapshot?.success_rate ?? 0}%</p>
              </div>
              <Target className="w-4 h-4 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 px-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Exactos</p>
                <p className="text-3xl font-black mt-0.5">{snapshot?.exact_scores_count ?? 0}</p>
              </div>
              <Trophy className="w-4 h-4 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 px-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Pts goleadores</p>
                <p className="text-3xl font-black mt-0.5">{snapshot?.scorer_points ?? 0}</p>
              </div>
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent scores */}
      {(recentScores?.length ?? 0) > 0 && (
        <Card>
          <CardHeader><CardTitle>Puntos recientes</CardTitle></CardHeader>
          <CardContent className="space-y-2 pt-0">
            {recentScores!.map((s, i) => (
              <div key={i} className="flex items-start justify-between py-2 border-b border-border/40 last:border-0">
                <p className="text-sm text-muted-foreground flex-1 pr-3">{s.reason}</p>
                <Badge variant={s.points > 0 ? 'success' : 'outline'}>+{s.points}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
