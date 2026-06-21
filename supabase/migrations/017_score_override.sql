-- ================================================================
-- Migration 017: Add score_override + fix ESP vs KSA score
-- score_override = true means an admin manually set this score.
-- The API sync will never overwrite it.
-- ================================================================

-- 1. Add the column
ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS score_override boolean NOT NULL DEFAULT false;

-- 2. Fix ESP vs KSA to the correct 4-0 result and mark as overridden
UPDATE public.matches
SET home_score    = 4,
    away_score    = 0,
    score_override = true
WHERE home_team_id = (SELECT id FROM public.teams WHERE fifa_code = 'ESP')
  AND away_team_id = (SELECT id FROM public.teams WHERE fifa_code = 'KSA')
  AND status = 'finished';
