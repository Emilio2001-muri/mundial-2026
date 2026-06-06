-- ================================================================
-- Migration 014: Add award columns to tournaments table
-- Used by admin to record final tournament results and
-- trigger global prediction scoring.
-- ================================================================

alter table public.tournaments
  add column if not exists champion_team_id       uuid references public.teams,
  add column if not exists runner_up_team_id      uuid references public.teams,
  add column if not exists third_place_team_id    uuid references public.teams,
  add column if not exists golden_ball_player_id  uuid references public.players,
  add column if not exists silver_ball_player_id  uuid references public.players,
  add column if not exists bronze_ball_player_id  uuid references public.players,
  add column if not exists golden_boot_player_id  uuid references public.players,
  add column if not exists golden_glove_player_id uuid references public.players,
  add column if not exists best_young_player_id   uuid references public.players;
