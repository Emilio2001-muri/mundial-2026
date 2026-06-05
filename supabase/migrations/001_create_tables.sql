-- ================================================================
-- Migration 001: Create all tables for Mundial 2026 predictions app
-- Run in Supabase SQL editor
-- ================================================================

-- ── profiles ─────────────────────────────────────────────────────
create table if not exists public.profiles (
  id            uuid references auth.users on delete cascade primary key,
  display_name  text not null,
  avatar_url    text,
  role          text not null default 'user' check (role in ('admin', 'user')),
  timezone      text not null default 'UTC',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ── tournaments ──────────────────────────────────────────────────
create table if not exists public.tournaments (
  id                          uuid primary key default gen_random_uuid(),
  name                        text not null,
  year                        int not null,
  starts_at                   timestamptz not null,
  ends_at                     timestamptz not null,
  global_predictions_lock_at  timestamptz not null,
  status                      text not null default 'upcoming' check (status in ('upcoming', 'active', 'finished'))
);

-- ── teams ────────────────────────────────────────────────────────
create table if not exists public.teams (
  id              uuid primary key default gen_random_uuid(),
  fifa_code       text not null unique,
  name            text not null,
  flag_url        text,
  group_name      text,
  confederation   text,
  metadata        jsonb
);

-- ── players ──────────────────────────────────────────────────────
create table if not exists public.players (
  id            uuid primary key default gen_random_uuid(),
  team_id       uuid references public.teams on delete cascade,
  name          text not null,
  position      text,
  shirt_number  int,
  active        boolean not null default true,
  metadata      jsonb
);

-- ── venues ───────────────────────────────────────────────────────
create table if not exists public.venues (
  id        uuid primary key default gen_random_uuid(),
  name      text not null,
  city      text not null,
  country   text not null,
  timezone  text not null default 'UTC',
  metadata  jsonb
);

-- ── matches ──────────────────────────────────────────────────────
create table if not exists public.matches (
  id                  uuid primary key default gen_random_uuid(),
  tournament_id       uuid references public.tournaments on delete cascade,
  external_id         text unique,
  match_number        int not null default 0,
  phase               text not null check (phase in ('group','round_of_32','round_of_16','quarter_final','semi_final','third_place','final')),
  group_name          text,
  home_team_id        uuid references public.teams,
  away_team_id        uuid references public.teams,
  home_placeholder    text,
  away_placeholder    text,
  venue_id            uuid references public.venues,
  kickoff_at          timestamptz not null,
  prediction_lock_at  timestamptz,
  status              text not null default 'scheduled' check (status in ('scheduled','locked','live','finished','postponed')),
  home_score          int,
  away_score          int,
  home_score_et       int,
  away_score_et       int,
  home_penalties      int,
  away_penalties      int,
  winner_team_id      uuid references public.teams,
  advancing_team_id   uuid references public.teams,
  metadata            jsonb,
  updated_at          timestamptz not null default now()
);

-- ── match_predictions ────────────────────────────────────────────
create table if not exists public.match_predictions (
  id                        uuid primary key default gen_random_uuid(),
  match_id                  uuid not null references public.matches on delete cascade,
  user_id                   uuid not null references public.profiles on delete cascade,
  predicted_home_score      int,
  predicted_away_score      int,
  predicted_winner_team_id  uuid references public.teams,
  predicted_draw            boolean,
  predicted_advancing_team_id uuid references public.teams,
  confidence                int check (confidence between 1 and 5),
  comment                   text,
  status                    text not null default 'draft' check (status in ('draft','submitted','locked','scored')),
  submitted_at              timestamptz,
  updated_at                timestamptz not null default now(),
  locked_at                 timestamptz,
  unique(match_id, user_id)
);

-- ── scorer_predictions ───────────────────────────────────────────
create table if not exists public.scorer_predictions (
  id                    uuid primary key default gen_random_uuid(),
  match_prediction_id   uuid not null references public.match_predictions on delete cascade,
  player_id             uuid not null references public.players on delete cascade,
  predicted_goals       int not null default 1 check (predicted_goals > 0),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  unique(match_prediction_id, player_id)
);

-- ── match_events ─────────────────────────────────────────────────
create table if not exists public.match_events (
  id            uuid primary key default gen_random_uuid(),
  match_id      uuid not null references public.matches on delete cascade,
  team_id       uuid references public.teams,
  player_id     uuid references public.players,
  event_type    text not null check (event_type in ('goal','own_goal','penalty','yellow_card','red_card','substitution')),
  minute        int not null,
  extra_minute  int,
  is_penalty    boolean not null default false,
  is_own_goal   boolean not null default false,
  metadata      jsonb
);

-- ── lineups ──────────────────────────────────────────────────────
create table if not exists public.lineups (
  id            uuid primary key default gen_random_uuid(),
  match_id      uuid not null references public.matches on delete cascade,
  team_id       uuid not null references public.teams on delete cascade,
  player_id     uuid not null references public.players on delete cascade,
  status        text not null check (status in ('starting','bench','not_called')),
  position      text,
  shirt_number  int,
  metadata      jsonb,
  unique(match_id, player_id)
);

-- ── global_predictions ───────────────────────────────────────────
create table if not exists public.global_predictions (
  id                    uuid primary key default gen_random_uuid(),
  tournament_id         uuid not null references public.tournaments on delete cascade,
  user_id               uuid not null references public.profiles on delete cascade,
  champion_team_id      uuid references public.teams,
  runner_up_team_id     uuid references public.teams,
  third_place_team_id   uuid references public.teams,
  finalist_one_team_id  uuid references public.teams,
  finalist_two_team_id  uuid references public.teams,
  golden_ball_player_id   uuid references public.players,
  silver_ball_player_id   uuid references public.players,
  bronze_ball_player_id   uuid references public.players,
  golden_boot_player_id   uuid references public.players,
  golden_glove_player_id  uuid references public.players,
  best_young_player_id    uuid references public.players,
  submitted_at          timestamptz,
  updated_at            timestamptz not null default now(),
  locked_at             timestamptz,
  unique(tournament_id, user_id)
);

-- ── scoring_rules ────────────────────────────────────────────────
create table if not exists public.scoring_rules (
  id          uuid primary key default gen_random_uuid(),
  key         text not null unique,
  points      int not null default 0,
  description text not null,
  enabled     boolean not null default true,
  metadata    jsonb
);

-- ── prediction_scores ────────────────────────────────────────────
create table if not exists public.prediction_scores (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles on delete cascade,
  match_id        uuid references public.matches on delete cascade,
  prediction_id   uuid references public.match_predictions on delete cascade,
  category        text not null,
  points          int not null default 0,
  reason          text not null,
  metadata        jsonb,
  created_at      timestamptz not null default now()
);

-- ── leaderboard_snapshots ────────────────────────────────────────
create table if not exists public.leaderboard_snapshots (
  id                  uuid primary key default gen_random_uuid(),
  tournament_id       uuid references public.tournaments on delete cascade,
  user_id             uuid not null references public.profiles on delete cascade,
  total_points        int not null default 0,
  rank                int not null default 0,
  previous_rank       int,
  exact_scores_count  int not null default 0,
  winners_count       int not null default 0,
  scorer_points       int not null default 0,
  global_points       int not null default 0,
  success_rate        int not null default 0,
  created_at          timestamptz not null default now()
);

-- ── audit_logs ───────────────────────────────────────────────────
create table if not exists public.audit_logs (
  id              uuid primary key default gen_random_uuid(),
  actor_user_id   uuid references public.profiles,
  action          text not null,
  entity_type     text not null,
  entity_id       text,
  before          jsonb,
  after           jsonb,
  created_at      timestamptz not null default now()
);

-- ── Indexes ──────────────────────────────────────────────────────
create index if not exists idx_matches_kickoff on public.matches (kickoff_at);
create index if not exists idx_matches_status on public.matches (status);
create index if not exists idx_matches_tournament on public.matches (tournament_id);
create index if not exists idx_predictions_match_user on public.match_predictions (match_id, user_id);
create index if not exists idx_predictions_user on public.match_predictions (user_id);
create index if not exists idx_events_match on public.match_events (match_id);
create index if not exists idx_events_player on public.match_events (player_id);
create index if not exists idx_lineups_match on public.lineups (match_id);
create index if not exists idx_scores_user on public.prediction_scores (user_id);
create index if not exists idx_scores_match on public.prediction_scores (match_id);
create index if not exists idx_leaderboard_tournament on public.leaderboard_snapshots (tournament_id);
create index if not exists idx_leaderboard_user on public.leaderboard_snapshots (user_id);
create index if not exists idx_audit_actor on public.audit_logs (actor_user_id);
create index if not exists idx_audit_created on public.audit_logs (created_at desc);
