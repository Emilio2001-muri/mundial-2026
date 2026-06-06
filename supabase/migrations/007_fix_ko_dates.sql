-- ================================================================
-- Migration 007: Fix knockout stage dates and bracket structure
-- R32 starts June 28, 2026
-- Source: https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_knockout_stage
-- All times in UTC. CDMX CDT = UTC-5
-- ================================================================

-- Add missing venues (Hard Rock Stadium, Lumen Field)
insert into public.venues (id, name, city, country, timezone) values
  ('e1000000-0000-0000-0000-000000000017', 'Hard Rock Stadium', 'Miami Gardens', 'USA', 'America/New_York'),
  ('e1000000-0000-0000-0000-000000000018', 'Lumen Field',       'Seattle',       'USA', 'America/Los_Angeles')
on conflict do nothing;

-- Delete all knockout matches for this tournament (keep group stage)
delete from public.matches
where tournament_id = 'a1b2c3d4-0000-0000-0000-000000000001'::uuid
  and phase <> 'group';

-- ================================================================
-- ROUND OF 32 — official FIFA 2026 bracket
-- ================================================================
with v   as (select name, id from public.venues),
     tid as (select 'a1b2c3d4-0000-0000-0000-000000000001'::uuid as id)
insert into public.matches
  (tournament_id, match_number, phase, home_placeholder, away_placeholder, venue_id, kickoff_at, status)
select (select id from tid), m.num, 'round_of_32', m.home_ph, m.away_ph, ve.id, m.ko::timestamptz, 'scheduled'
from (values
  -- Jun 28
  (73, '2º Grupo A',        '2º Grupo B',        'SoFi Stadium',            '2026-06-29T02:00:00Z'), -- Jun 28 7pm PDT
  -- Jun 29
  (76, '1º Grupo C',        '2º Grupo F',        'NRG Stadium',             '2026-06-29T17:00:00Z'), -- Jun 29 12pm CDT
  (74, '1º Grupo E',        '3º A/B/C/D/F',      'Gillette Stadium',        '2026-06-29T20:30:00Z'), -- Jun 29 4:30pm EDT
  (75, '1º Grupo F',        '2º Grupo C',        'Estadio BBVA',            '2026-06-30T00:00:00Z'), -- Jun 29 7pm CDT
  -- Jun 30
  (78, '2º Grupo E',        '2º Grupo I',        'AT&T Stadium',            '2026-06-30T17:00:00Z'), -- Jun 30 12pm CDT
  (77, '1º Grupo I',        '3º C/D/F/G/H',      'MetLife Stadium',         '2026-07-01T01:00:00Z'), -- Jun 30 9pm EDT
  (79, '1º Grupo A',        '3º C/E/F/H/I',      'Estadio Azteca',          '2026-07-01T00:00:00Z'), -- Jun 30 7pm CDT
  -- Jul 1
  (80, '1º Grupo L',        '3º E/H/I/J/K',      'Mercedes-Benz Stadium',   '2026-07-01T16:00:00Z'), -- Jul 1 12pm EDT
  (82, '1º Grupo G',        '3º A/E/H/I/J',      'Lumen Field',             '2026-07-01T20:00:00Z'), -- Jul 1 1pm PDT
  (81, '1º Grupo D',        '3º B/E/F/I/J',      'Levi''s Stadium',         '2026-07-02T00:00:00Z'), -- Jul 1 5pm PDT
  -- Jul 2
  (84, '1º Grupo H',        '2º Grupo J',        'SoFi Stadium',            '2026-07-02T19:00:00Z'), -- Jul 2 12pm PDT
  (83, '2º Grupo K',        '2º Grupo L',        'BMO Field',               '2026-07-02T23:00:00Z'), -- Jul 2 7pm EDT
  (85, '1º Grupo B',        '3º E/F/G/I/J',      'BC Place',                '2026-07-03T03:00:00Z'), -- Jul 2 8pm PDT
  -- Jul 3
  (88, '2º Grupo D',        '2º Grupo G',        'AT&T Stadium',            '2026-07-03T18:00:00Z'), -- Jul 3 1pm CDT
  (86, '1º Grupo J',        '2º Grupo H',        'Hard Rock Stadium',       '2026-07-03T22:00:00Z'), -- Jul 3 6pm EDT
  (87, '1º Grupo K',        '3º D/E/I/J/L',      'Arrowhead Stadium',       '2026-07-04T01:30:00Z')  -- Jul 3 8:30pm CDT
) as m(num, home_ph, away_ph, venue_name, ko)
join v ve on ve.name = m.venue_name
on conflict do nothing;

-- ================================================================
-- OCTAVOS DE FINAL (R16) — Jul 4-7
-- ================================================================
with v   as (select name, id from public.venues),
     tid as (select 'a1b2c3d4-0000-0000-0000-000000000001'::uuid as id)
insert into public.matches
  (tournament_id, match_number, phase, home_placeholder, away_placeholder, venue_id, kickoff_at, status)
select (select id from tid), m.num, 'round_of_16', m.home_ph, m.away_ph, ve.id, m.ko::timestamptz, 'scheduled'
from (values
  -- Jul 4 (W73 vs W75 = M90, W74 vs W77 = M89)
  (90, 'W73', 'W75', 'NRG Stadium',            '2026-07-04T17:00:00Z'), -- Jul 4 12pm CDT
  (89, 'W74', 'W77', 'Lincoln Financial Field','2026-07-04T21:00:00Z'), -- Jul 4 5pm EDT
  -- Jul 5 (W76 vs W78 = M91, W79 vs W80 = M92)
  (91, 'W76', 'W78', 'MetLife Stadium',        '2026-07-05T20:00:00Z'), -- Jul 5 4pm EDT
  (92, 'W79', 'W80', 'Estadio Azteca',         '2026-07-06T00:00:00Z'), -- Jul 5 6pm CDT
  -- Jul 6 (W83 vs W84 = M93, W81 vs W82 = M94)
  (93, 'W83', 'W84', 'AT&T Stadium',           '2026-07-06T19:00:00Z'), -- Jul 6 2pm CDT
  (94, 'W81', 'W82', 'Lumen Field',            '2026-07-07T00:00:00Z'), -- Jul 6 5pm PDT
  -- Jul 7 (W86 vs W88 = M95, W85 vs W87 = M96)
  (95, 'W86', 'W88', 'Mercedes-Benz Stadium',  '2026-07-07T16:00:00Z'), -- Jul 7 12pm EDT
  (96, 'W85', 'W87', 'BC Place',               '2026-07-07T20:00:00Z')  -- Jul 7 1pm PDT
) as m(num, home_ph, away_ph, venue_name, ko)
join v ve on ve.name = m.venue_name
on conflict do nothing;

-- ================================================================
-- CUARTOS DE FINAL — Jul 9-11
-- ================================================================
with v   as (select name, id from public.venues),
     tid as (select 'a1b2c3d4-0000-0000-0000-000000000001'::uuid as id)
insert into public.matches
  (tournament_id, match_number, phase, home_placeholder, away_placeholder, venue_id, kickoff_at, status)
select (select id from tid), m.num, 'quarter_final', m.home_ph, m.away_ph, ve.id, m.ko::timestamptz, 'scheduled'
from (values
  ( 97, 'W89', 'W90', 'Gillette Stadium',    '2026-07-09T20:00:00Z'), -- Jul 9 4pm EDT
  ( 98, 'W93', 'W94', 'SoFi Stadium',        '2026-07-10T19:00:00Z'), -- Jul 10 12pm PDT
  ( 99, 'W91', 'W92', 'Hard Rock Stadium',   '2026-07-11T21:00:00Z'), -- Jul 11 5pm EDT
  (100, 'W95', 'W96', 'Arrowhead Stadium',   '2026-07-12T01:00:00Z')  -- Jul 11 8pm CDT
) as m(num, home_ph, away_ph, venue_name, ko)
join v ve on ve.name = m.venue_name
on conflict do nothing;

-- ================================================================
-- SEMIFINALES — Jul 14-15
-- ================================================================
with v   as (select name, id from public.venues),
     tid as (select 'a1b2c3d4-0000-0000-0000-000000000001'::uuid as id)
insert into public.matches
  (tournament_id, match_number, phase, home_placeholder, away_placeholder, venue_id, kickoff_at, status)
select (select id from tid), m.num, 'semi_final', m.home_ph, m.away_ph, ve.id, m.ko::timestamptz, 'scheduled'
from (values
  (101, 'W97',  'W98',  'AT&T Stadium',       '2026-07-14T19:00:00Z'), -- Jul 14 2pm CDT
  (102, 'W99',  'W100', 'Mercedes-Benz Stadium','2026-07-15T19:00:00Z') -- Jul 15 3pm EDT
) as m(num, home_ph, away_ph, venue_name, ko)
join v ve on ve.name = m.venue_name
on conflict do nothing;

-- ================================================================
-- TERCER LUGAR — Jul 18
-- ================================================================
insert into public.matches
  (tournament_id, match_number, phase, home_placeholder, away_placeholder, venue_id, kickoff_at, status)
select 'a1b2c3d4-0000-0000-0000-000000000001'::uuid,
  103, 'third_place', 'Perdedor SF1', 'Perdedor SF2',
  (select id from public.venues where name = 'Hard Rock Stadium' limit 1),
  '2026-07-18T21:00:00Z'::timestamptz, 'scheduled' -- Jul 18 5pm EDT
on conflict do nothing;

-- ================================================================
-- FINAL — Jul 19
-- ================================================================
insert into public.matches
  (tournament_id, match_number, phase, home_placeholder, away_placeholder, venue_id, kickoff_at, status)
select 'a1b2c3d4-0000-0000-0000-000000000001'::uuid,
  104, 'final', 'Ganador SF1', 'Ganador SF2',
  (select id from public.venues where name = 'MetLife Stadium' limit 1),
  '2026-07-19T19:00:00Z'::timestamptz, 'scheduled' -- Jul 19 3pm EDT
on conflict do nothing;
