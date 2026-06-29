-- ================================================================
-- Migration 019: Fix knockout stage bracket with REAL FIFA WC 2026 data
-- Source: https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_knockout_stage
-- Today: June 29, 2026 — M73 (RSA 0-1 CAN) already finished.
--
-- Group results:
--   A: 1-MEX  2-RSA
--   B: 1-SUI  2-CAN  3-BIH
--   C: 1-BRA  2-MAR
--   D: 1-USA  2-AUS  3-PAR
--   E: 1-GER  2-CIV  3-ECU
--   F: 1-NED  2-JPN  3-SWE
--   G: 1-BEL  2-EGY
--   H: 1-ESP  2-CPV
--   I: 1-FRA  2-NOR  3-SEN
--   J: 1-ARG  2-AUT  3-ALG
--   K: 1-COL  2-POR  3-COD
--   L: 1-ENG  2-CRO  3-GHA
-- ================================================================

-- Step 1: Delete all knockout matches
DELETE FROM public.matches
WHERE tournament_id = 'a1b2c3d4-0000-0000-0000-000000000001'::uuid
  AND phase <> 'group';

-- Step 2: Insert ROUND OF 32 with REAL TEAMS
-- All times in UTC
WITH t AS (SELECT fifa_code, id FROM public.teams),
     v AS (SELECT name, id FROM public.venues),
     tid AS (SELECT 'a1b2c3d4-0000-0000-0000-000000000001'::uuid AS id)
INSERT INTO public.matches
  (tournament_id, match_number, phase, home_team_id, away_team_id, venue_id, kickoff_at, status,
   home_score, away_score, home_placeholder, away_placeholder)
SELECT
  (SELECT id FROM tid),
  m.num, 'round_of_32',
  ht.id, at.id, ve.id,
  m.ko::timestamptz,
  m.st,
  m.hs, m.as_,
  NULL, NULL
FROM (VALUES
  -- M73: RSA 0-1 CAN — Jun 28 12pm PDT = 19:00 UTC — SoFi Stadium (FINISHED)
  (73,'RSA','CAN','SoFi Stadium',          '2026-06-28T19:00:00Z','finished',0,1),
  -- M74: GER vs PAR — Jun 29 4:30pm EDT = 20:30 UTC — Gillette Stadium
  (74,'GER','PAR','Gillette Stadium',       '2026-06-29T20:30:00Z','scheduled',NULL,NULL),
  -- M75: NED vs MAR — Jun 29 7pm CDT = 01:00 UTC Jun 30 — Estadio BBVA
  (75,'NED','MAR','Estadio BBVA',           '2026-06-30T01:00:00Z','scheduled',NULL,NULL),
  -- M76: BRA vs JPN — Jun 29 12pm CDT = 17:00 UTC — NRG Stadium
  (76,'BRA','JPN','NRG Stadium',            '2026-06-29T17:00:00Z','scheduled',NULL,NULL),
  -- M77: FRA vs SWE — Jun 30 5pm EDT = 21:00 UTC — MetLife Stadium
  (77,'FRA','SWE','MetLife Stadium',        '2026-06-30T21:00:00Z','scheduled',NULL,NULL),
  -- M78: CIV vs NOR — Jun 30 12pm CDT = 17:00 UTC — AT&T Stadium
  (78,'CIV','NOR','AT&T Stadium',           '2026-06-30T17:00:00Z','scheduled',NULL,NULL),
  -- M79: MEX vs ECU — Jun 30 7pm CDT = 01:00 UTC Jul 1 — Estadio Azteca
  (79,'MEX','ECU','Estadio Azteca',         '2026-07-01T01:00:00Z','scheduled',NULL,NULL),
  -- M80: ENG vs COD — Jul 1 12pm EDT = 16:00 UTC — Mercedes-Benz Stadium
  (80,'ENG','COD','Mercedes-Benz Stadium',  '2026-07-01T16:00:00Z','scheduled',NULL,NULL),
  -- M81: USA vs BIH — Jul 1 5pm PDT = 00:00 UTC Jul 2 — Levi's Stadium
  (81,'USA','BIH','Levi''s Stadium',        '2026-07-02T00:00:00Z','scheduled',NULL,NULL),
  -- M82: BEL vs SEN — Jul 1 1pm PDT = 20:00 UTC — Lumen Field
  (82,'BEL','SEN','Lumen Field',            '2026-07-01T20:00:00Z','scheduled',NULL,NULL),
  -- M83: POR vs CRO — Jul 2 7pm EDT = 23:00 UTC — BMO Field
  (83,'POR','CRO','BMO Field',              '2026-07-02T23:00:00Z','scheduled',NULL,NULL),
  -- M84: ESP vs AUT — Jul 2 12pm PDT = 19:00 UTC — SoFi Stadium
  (84,'ESP','AUT','SoFi Stadium',           '2026-07-02T19:00:00Z','scheduled',NULL,NULL),
  -- M85: SUI vs ALG — Jul 2 8pm PDT = 03:00 UTC Jul 3 — BC Place
  (85,'SUI','ALG','BC Place',               '2026-07-03T03:00:00Z','scheduled',NULL,NULL),
  -- M86: ARG vs CPV — Jul 3 6pm EDT = 22:00 UTC — Hard Rock Stadium
  (86,'ARG','CPV','Hard Rock Stadium',      '2026-07-03T22:00:00Z','scheduled',NULL,NULL),
  -- M87: COL vs GHA — Jul 3 8:30pm CDT = 01:30 UTC Jul 4 — Arrowhead Stadium
  (87,'COL','GHA','Arrowhead Stadium',      '2026-07-04T01:30:00Z','scheduled',NULL,NULL),
  -- M88: AUS vs EGY — Jul 3 1pm CDT = 18:00 UTC — AT&T Stadium
  (88,'AUS','EGY','AT&T Stadium',           '2026-07-03T18:00:00Z','scheduled',NULL,NULL)
) AS m(num, home_code, away_code, venue_name, ko, st, hs, as_)
JOIN t ht ON ht.fifa_code = m.home_code
JOIN t at ON at.fifa_code = m.away_code
JOIN v ve ON ve.name = m.venue_name
ON CONFLICT DO NOTHING;

-- Step 3: Insert ROUND OF 16 (all placeholders — bracket-advance fills teams)
WITH v AS (SELECT name, id FROM public.venues),
     tid AS (SELECT 'a1b2c3d4-0000-0000-0000-000000000001'::uuid AS id)
INSERT INTO public.matches
  (tournament_id, match_number, phase, home_placeholder, away_placeholder, venue_id, kickoff_at, status)
SELECT (SELECT id FROM tid), m.num, 'round_of_16', m.hp, m.ap, ve.id, m.ko::timestamptz, 'scheduled'
FROM (VALUES
  -- M89: W74 vs W77 — Jul 4 5pm EDT = 21:00 UTC — Lincoln Financial Field
  (89,'Gan.M74','Gan.M77','Lincoln Financial Field','2026-07-04T21:00:00Z'),
  -- M90: CAN (W73) vs W75 — Jul 4 12pm CDT = 17:00 UTC — NRG Stadium
  (90,'Gan.M73','Gan.M75','NRG Stadium',            '2026-07-04T17:00:00Z'),
  -- M91: W76 vs W78 — Jul 5 4pm EDT = 20:00 UTC — MetLife Stadium
  (91,'Gan.M76','Gan.M78','MetLife Stadium',        '2026-07-05T20:00:00Z'),
  -- M92: W79 vs W80 — Jul 5 6pm CDT = 23:00 UTC — Estadio Azteca
  (92,'Gan.M79','Gan.M80','Estadio Azteca',         '2026-07-05T23:00:00Z'),
  -- M93: W83 vs W84 — Jul 6 2pm CDT = 19:00 UTC — AT&T Stadium
  (93,'Gan.M83','Gan.M84','AT&T Stadium',           '2026-07-06T19:00:00Z'),
  -- M94: W81 vs W82 — Jul 6 5pm PDT = 00:00 UTC Jul 7 — Lumen Field
  (94,'Gan.M81','Gan.M82','Lumen Field',            '2026-07-07T00:00:00Z'),
  -- M95: W86 vs W88 — Jul 7 12pm EDT = 16:00 UTC — Mercedes-Benz Stadium
  (95,'Gan.M86','Gan.M88','Mercedes-Benz Stadium',  '2026-07-07T16:00:00Z'),
  -- M96: W85 vs W87 — Jul 7 1pm PDT = 20:00 UTC — BC Place
  (96,'Gan.M85','Gan.M87','BC Place',               '2026-07-07T20:00:00Z')
) AS m(num, hp, ap, venue_name, ko)
JOIN v ve ON ve.name = m.venue_name
ON CONFLICT DO NOTHING;

-- Step 4: Insert QUARTER-FINALS
WITH v AS (SELECT name, id FROM public.venues),
     tid AS (SELECT 'a1b2c3d4-0000-0000-0000-000000000001'::uuid AS id)
INSERT INTO public.matches
  (tournament_id, match_number, phase, home_placeholder, away_placeholder, venue_id, kickoff_at, status)
SELECT (SELECT id FROM tid), m.num, 'quarter_final', m.hp, m.ap, ve.id, m.ko::timestamptz, 'scheduled'
FROM (VALUES
  -- M97: W89 vs W90 — Jul 9 4pm EDT = 20:00 UTC — Gillette Stadium
  ( 97,'Gan.M89','Gan.M90','Gillette Stadium',    '2026-07-09T20:00:00Z'),
  -- M98: W93 vs W94 — Jul 10 12pm PDT = 19:00 UTC — SoFi Stadium
  ( 98,'Gan.M93','Gan.M94','SoFi Stadium',        '2026-07-10T19:00:00Z'),
  -- M99: W91 vs W92 — Jul 11 5pm EDT = 21:00 UTC — Hard Rock Stadium
  ( 99,'Gan.M91','Gan.M92','Hard Rock Stadium',   '2026-07-11T21:00:00Z'),
  -- M100: W95 vs W96 — Jul 11 8pm CDT = 01:00 UTC Jul 12 — Arrowhead Stadium
  (100,'Gan.M95','Gan.M96','Arrowhead Stadium',   '2026-07-12T01:00:00Z')
) AS m(num, hp, ap, venue_name, ko)
JOIN v ve ON ve.name = m.venue_name
ON CONFLICT DO NOTHING;

-- Step 5: Insert SEMI-FINALS
WITH v AS (SELECT name, id FROM public.venues),
     tid AS (SELECT 'a1b2c3d4-0000-0000-0000-000000000001'::uuid AS id)
INSERT INTO public.matches
  (tournament_id, match_number, phase, home_placeholder, away_placeholder, venue_id, kickoff_at, status)
SELECT (SELECT id FROM tid), m.num, 'semi_final', m.hp, m.ap, ve.id, m.ko::timestamptz, 'scheduled'
FROM (VALUES
  -- M101: W97 vs W98 — Jul 14 2pm CDT = 19:00 UTC — AT&T Stadium
  (101,'Gan.M97','Gan.M98','AT&T Stadium',         '2026-07-14T19:00:00Z'),
  -- M102: W99 vs W100 — Jul 15 3pm EDT = 19:00 UTC — Mercedes-Benz Stadium
  (102,'Gan.M99','Gan.M100','Mercedes-Benz Stadium','2026-07-15T19:00:00Z')
) AS m(num, hp, ap, venue_name, ko)
JOIN v ve ON ve.name = m.venue_name
ON CONFLICT DO NOTHING;

-- Step 6: Third place
WITH v AS (SELECT name, id FROM public.venues),
     tid AS (SELECT 'a1b2c3d4-0000-0000-0000-000000000001'::uuid AS id)
INSERT INTO public.matches
  (tournament_id, match_number, phase, home_placeholder, away_placeholder, venue_id, kickoff_at, status)
SELECT
  (SELECT id FROM tid), 103, 'third_place',
  'Perdedor SF1', 'Perdedor SF2',
  (SELECT id FROM v WHERE name = 'Hard Rock Stadium'),
  '2026-07-18T21:00:00Z'::timestamptz,
  'scheduled'
ON CONFLICT DO NOTHING;

-- Step 7: Final
WITH v AS (SELECT name, id FROM public.venues),
     tid AS (SELECT 'a1b2c3d4-0000-0000-0000-000000000001'::uuid AS id)
INSERT INTO public.matches
  (tournament_id, match_number, phase, home_placeholder, away_placeholder, venue_id, kickoff_at, status)
SELECT
  (SELECT id FROM tid), 104, 'final',
  'Ganador SF1', 'Ganador SF2',
  (SELECT id FROM v WHERE name = 'MetLife Stadium'),
  '2026-07-19T19:00:00Z'::timestamptz,
  'scheduled'
ON CONFLICT DO NOTHING;

-- Step 8: Immediately advance CAN from M73 into R16 M90 (home position)
-- bracket-advance will also handle this on next poll, but do it here proactively.
UPDATE public.matches
SET home_team_id = (SELECT id FROM public.teams WHERE fifa_code = 'CAN')
WHERE tournament_id = 'a1b2c3d4-0000-0000-0000-000000000001'::uuid
  AND match_number = 90
  AND home_team_id IS NULL;
