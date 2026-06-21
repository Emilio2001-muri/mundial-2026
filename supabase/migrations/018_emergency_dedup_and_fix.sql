-- ================================================================
-- Migration 018: EMERGENCY — Remove duplicate matches + fix ESP vs KSA
--
-- Run this in Supabase SQL Editor (supabase.com > SQL Editor).
-- It is safe to run multiple times.
-- ================================================================

-- Step 1: Add score_override column (idempotent)
ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS score_override boolean NOT NULL DEFAULT false;

-- Step 2: Deduplicate matches
-- For each (tournament, home_team, away_team) that has > 1 row:
--   • Keep the match that has the most predictions (these are the real user data).
--   • If tied, keep the one with an actual score, else the oldest id.
-- All related rows (predictions, events, scores) on duplicates are moved or deleted.
DO $$
DECLARE
  dup      RECORD;
  keeper   uuid;
  dead_ids uuid[];
BEGIN
  FOR dup IN (
    SELECT tournament_id, home_team_id, away_team_id
    FROM   public.matches
    GROUP  BY tournament_id, home_team_id, away_team_id
    HAVING COUNT(*) > 1
  ) LOOP

    -- Pick the match to keep
    SELECT m.id INTO keeper
    FROM   public.matches m
    LEFT   JOIN public.match_predictions mp ON mp.match_id = m.id
    WHERE  m.tournament_id = dup.tournament_id
      AND  m.home_team_id  = dup.home_team_id
      AND  m.away_team_id  = dup.away_team_id
    GROUP  BY m.id, m.home_score
    ORDER  BY COUNT(mp.id) DESC,
              CASE WHEN m.home_score IS NOT NULL THEN 0 ELSE 1 END,
              m.id ASC
    LIMIT  1;

    -- Collect the ids to delete
    SELECT ARRAY_AGG(id) INTO dead_ids
    FROM   public.matches
    WHERE  tournament_id = dup.tournament_id
      AND  home_team_id  = dup.home_team_id
      AND  away_team_id  = dup.away_team_id
      AND  id           != keeper;

    IF dead_ids IS NULL OR array_length(dead_ids, 1) = 0 THEN
      CONTINUE;
    END IF;

    -- Re-attach predictions that landed on a duplicate → move to keeper
    UPDATE public.match_predictions
    SET    match_id = keeper
    WHERE  match_id = ANY(dead_ids)
      AND  NOT EXISTS (
             -- avoid unique(match_id, user_id) collision
             SELECT 1 FROM public.match_predictions x
             WHERE  x.match_id = keeper AND x.user_id = public.match_predictions.user_id
           );

    -- Drop any leftover predictions on duplicates (would violate unique constraint)
    DELETE FROM public.match_predictions WHERE match_id = ANY(dead_ids);

    -- Drop events, lineups, prediction_scores on duplicates (cascade will get the rest)
    DELETE FROM public.match_events        WHERE match_id = ANY(dead_ids);
    DELETE FROM public.lineups             WHERE match_id = ANY(dead_ids);
    DELETE FROM public.prediction_scores   WHERE match_id = ANY(dead_ids);

    -- Delete the duplicate match rows
    DELETE FROM public.matches WHERE id = ANY(dead_ids);

    RAISE NOTICE 'Deduped: keeper=%, removed=%', keeper, dead_ids;
  END LOOP;
END;
$$;

-- Step 3: Fix ESP vs KSA to the correct 4-0 and mark as admin override
UPDATE public.matches
SET    home_score     = 4,
       away_score     = 0,
       score_override = true
WHERE  home_team_id = (SELECT id FROM public.teams WHERE fifa_code = 'ESP')
  AND  away_team_id = (SELECT id FROM public.teams WHERE fifa_code = 'KSA')
  AND  status = 'finished';
