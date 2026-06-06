-- ================================================================
-- Migration 013: Remove duplicate players
--
-- ROOT CAUSE: migration 010 ran DELETE FROM players, but
-- match_events.player_id has no ON DELETE CASCADE. If any match
-- event had a player_id reference, the DELETE failed silently and
-- the subsequent INSERTs added ~1248 duplicate rows on top,
-- creating ~2496 total. LIMIT 2000 then cut off Portugal and
-- other late-inserted teams.
--
-- FIX: null out match_events.player_id, then deduplicate by
-- keeping only one row per (team_id, name).
-- ================================================================

-- 1. Null out player_id in match_events (no cascade on this FK)
UPDATE public.match_events SET player_id = NULL WHERE player_id IS NOT NULL;

-- 2. Remove duplicates - keep the physically first row (min ctid)
--    for each (team_id, name) combination. No-op if already clean.
DELETE FROM public.players
WHERE ctid NOT IN (
  SELECT MIN(ctid)
  FROM public.players
  GROUP BY team_id, name
);

-- 3. Confirm: should return 1248 (48 teams x 26 players)
SELECT COUNT(*) AS total_players FROM public.players;
