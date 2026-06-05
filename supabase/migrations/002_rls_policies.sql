-- ================================================================
-- Migration 002: Row Level Security policies
-- ================================================================

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.tournaments enable row level security;
alter table public.teams enable row level security;
alter table public.players enable row level security;
alter table public.venues enable row level security;
alter table public.matches enable row level security;
alter table public.match_predictions enable row level security;
alter table public.scorer_predictions enable row level security;
alter table public.match_events enable row level security;
alter table public.lineups enable row level security;
alter table public.global_predictions enable row level security;
alter table public.scoring_rules enable row level security;
alter table public.prediction_scores enable row level security;
alter table public.leaderboard_snapshots enable row level security;
alter table public.audit_logs enable row level security;

-- ── Helper: is_admin ──────────────────────────────────────────────
create or replace function public.is_admin(user_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = user_id and role = 'admin'
  );
$$;

-- ── Helper: can_edit_match_prediction ────────────────────────────
create or replace function public.can_edit_match_prediction(p_match_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.matches m
    where m.id = p_match_id
      and now() < m.kickoff_at - interval '1 minute'
  );
$$;

-- ================================================================
-- PROFILES
-- ================================================================
create policy "profiles: users can read all" on public.profiles
  for select using (true);

create policy "profiles: users can update own" on public.profiles
  for update using (auth.uid() = id);

create policy "profiles: admin can insert" on public.profiles
  for insert with check (public.is_admin(auth.uid()));

create policy "profiles: admin can delete" on public.profiles
  for delete using (public.is_admin(auth.uid()));

-- ================================================================
-- TOURNAMENTS
-- ================================================================
create policy "tournaments: anyone can read" on public.tournaments
  for select using (true);

create policy "tournaments: admin can modify" on public.tournaments
  for all using (public.is_admin(auth.uid()));

-- ================================================================
-- TEAMS
-- ================================================================
create policy "teams: anyone can read" on public.teams
  for select using (true);

create policy "teams: admin can modify" on public.teams
  for all using (public.is_admin(auth.uid()));

-- ================================================================
-- PLAYERS
-- ================================================================
create policy "players: anyone can read" on public.players
  for select using (true);

create policy "players: admin can modify" on public.players
  for all using (public.is_admin(auth.uid()));

-- ================================================================
-- VENUES
-- ================================================================
create policy "venues: anyone can read" on public.venues
  for select using (true);

create policy "venues: admin can modify" on public.venues
  for all using (public.is_admin(auth.uid()));

-- ================================================================
-- MATCHES
-- ================================================================
create policy "matches: anyone authenticated can read" on public.matches
  for select using (auth.role() = 'authenticated');

create policy "matches: admin can modify" on public.matches
  for all using (public.is_admin(auth.uid()));

-- ================================================================
-- MATCH PREDICTIONS
-- ================================================================

-- Users can read their own predictions always
create policy "predictions: users can read own" on public.match_predictions
  for select using (user_id = auth.uid());

-- Users can read others' predictions ONLY after lock
create policy "predictions: read others after lock" on public.match_predictions
  for select using (
    auth.role() = 'authenticated'
    and (
      user_id = auth.uid()
      or public.is_admin(auth.uid())
      or exists (
        select 1 from public.matches m
        where m.id = match_id
          and now() >= m.kickoff_at - interval '1 minute'
      )
    )
  );

-- Users can insert own prediction if match is not locked
create policy "predictions: insert own if not locked" on public.match_predictions
  for insert with check (
    user_id = auth.uid()
    and public.can_edit_match_prediction(match_id, auth.uid())
  );

-- Users can update own prediction if match is not locked
create policy "predictions: update own if not locked" on public.match_predictions
  for update using (
    user_id = auth.uid()
    and public.can_edit_match_prediction(match_id, auth.uid())
  );

-- Admin can do anything
create policy "predictions: admin all" on public.match_predictions
  for all using (public.is_admin(auth.uid()));

-- ================================================================
-- SCORER PREDICTIONS
-- ================================================================
create policy "scorer_preds: users can read own" on public.scorer_predictions
  for select using (
    exists (
      select 1 from public.match_predictions mp
      where mp.id = match_prediction_id
        and (
          mp.user_id = auth.uid()
          or public.is_admin(auth.uid())
          or exists (
            select 1 from public.matches m
            where m.id = mp.match_id and now() >= m.kickoff_at - interval '1 minute'
          )
        )
    )
  );

create policy "scorer_preds: insert own if not locked" on public.scorer_predictions
  for insert with check (
    exists (
      select 1 from public.match_predictions mp
      join public.matches m on m.id = mp.match_id
      where mp.id = match_prediction_id
        and mp.user_id = auth.uid()
        and now() < m.kickoff_at - interval '1 minute'
    )
  );

create policy "scorer_preds: update own if not locked" on public.scorer_predictions
  for update using (
    exists (
      select 1 from public.match_predictions mp
      join public.matches m on m.id = mp.match_id
      where mp.id = match_prediction_id
        and mp.user_id = auth.uid()
        and now() < m.kickoff_at - interval '1 minute'
    )
  );

create policy "scorer_preds: delete own if not locked" on public.scorer_predictions
  for delete using (
    exists (
      select 1 from public.match_predictions mp
      join public.matches m on m.id = mp.match_id
      where mp.id = match_prediction_id
        and mp.user_id = auth.uid()
        and now() < m.kickoff_at - interval '1 minute'
    )
  );

create policy "scorer_preds: admin all" on public.scorer_predictions
  for all using (public.is_admin(auth.uid()));

-- ================================================================
-- MATCH EVENTS
-- ================================================================
create policy "events: authenticated can read" on public.match_events
  for select using (auth.role() = 'authenticated');

create policy "events: admin can modify" on public.match_events
  for all using (public.is_admin(auth.uid()));

-- ================================================================
-- LINEUPS
-- ================================================================
create policy "lineups: authenticated can read" on public.lineups
  for select using (auth.role() = 'authenticated');

create policy "lineups: admin can modify" on public.lineups
  for all using (public.is_admin(auth.uid()));

-- ================================================================
-- GLOBAL PREDICTIONS
-- ================================================================
create policy "global_preds: users can read own" on public.global_predictions
  for select using (user_id = auth.uid() or public.is_admin(auth.uid()));

create policy "global_preds: read others after lock" on public.global_predictions
  for select using (
    auth.role() = 'authenticated'
    and (
      user_id = auth.uid()
      or public.is_admin(auth.uid())
      or exists (
        select 1 from public.tournaments t
        where t.id = tournament_id
          and now() >= t.global_predictions_lock_at
      )
    )
  );

create policy "global_preds: insert own if not locked" on public.global_predictions
  for insert with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.tournaments t
      where t.id = tournament_id
        and now() < t.global_predictions_lock_at
    )
  );

create policy "global_preds: update own if not locked" on public.global_predictions
  for update using (
    user_id = auth.uid()
    and exists (
      select 1 from public.tournaments t
      where t.id = tournament_id
        and now() < t.global_predictions_lock_at
    )
  );

create policy "global_preds: admin all" on public.global_predictions
  for all using (public.is_admin(auth.uid()));

-- ================================================================
-- SCORING RULES
-- ================================================================
create policy "scoring_rules: authenticated can read" on public.scoring_rules
  for select using (auth.role() = 'authenticated');

create policy "scoring_rules: admin can modify" on public.scoring_rules
  for all using (public.is_admin(auth.uid()));

-- ================================================================
-- PREDICTION SCORES
-- ================================================================
create policy "pred_scores: authenticated can read" on public.prediction_scores
  for select using (auth.role() = 'authenticated');

create policy "pred_scores: service role can write" on public.prediction_scores
  for all using (public.is_admin(auth.uid()));

-- ================================================================
-- LEADERBOARD SNAPSHOTS
-- ================================================================
create policy "leaderboard: authenticated can read" on public.leaderboard_snapshots
  for select using (auth.role() = 'authenticated');

create policy "leaderboard: service role can write" on public.leaderboard_snapshots
  for all using (public.is_admin(auth.uid()));

-- ================================================================
-- AUDIT LOGS
-- ================================================================
create policy "audit: admin can read" on public.audit_logs
  for select using (public.is_admin(auth.uid()));

create policy "audit: service role can write" on public.audit_logs
  for insert with check (public.is_admin(auth.uid()));
