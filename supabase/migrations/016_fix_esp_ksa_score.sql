-- ================================================================
-- Migration 016: Fix ESP vs KSA final score
-- Actual result was 4-0. football-data.org API was reporting 5-0.
-- After this migration, run "Recalcular puntos" on this match
-- from the admin panel so predictions are scored correctly.
-- ================================================================

UPDATE public.matches
SET home_score = 4,
    away_score = 0
WHERE home_team_id = (SELECT id FROM public.teams WHERE fifa_code = 'ESP')
  AND away_team_id = (SELECT id FROM public.teams WHERE fifa_code = 'KSA')
  AND status = 'finished';
