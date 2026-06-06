-- ================================================================
-- Migration 007: Fix knockout stage dates and bracket structure
-- R32 starts June 28, 2026 (not July 1)
-- Removes 3rd vs 3rd matchups — all 3rds face 1st or 2nd place teams
-- Times in UTC. CDMX CDT = UTC-5
-- ================================================================

-- Delete all knockout matches for this tournament (keep group stage)
delete from public.matches
where tournament_id = 'a1b2c3d4-0000-0000-0000-000000000001'::uuid
  and phase <> 'group';

-- Re-insert ROUND OF 32 (16 matches) — official FIFA 2026 schedule
with v   as (select name, id from public.venues),
     tid as (select 'a1b2c3d4-0000-0000-0000-000000000001'::uuid as id)
insert into public.matches
  (tournament_id, match_number, phase, home_placeholder, away_placeholder, venue_id, kickoff_at, status)
select (select id from tid), m.num, 'round_of_32', m.home_ph, m.away_ph, ve.id, m.ko::timestamptz, 'scheduled'
from (values
  -- Jun 28
  (73, '2º Grupo A',        '2º Grupo B',         'AT&T Stadium',           '2026-06-29T01:00:00Z'),
  -- Jun 29
  (74, '1º Grupo E',        '3º A/B/C/D/F',       'MetLife Stadium',        '2026-06-30T02:30:00Z'),
  (75, '1º Grupo A',        '3º C/D/E/F',         'SoFi Stadium',           '2026-06-29T23:00:00Z'),
  -- Jun 30
  (76, '1º Grupo F',        '2º Grupo C',         'Arrowhead Stadium',      '2026-07-01T07:00:00Z'),
  (77, '1º Grupo I',        '3º C/D/F/G/H',       'Lincoln Financial Field','2026-07-01T03:00:00Z'),
  -- Jul 1
  (78, '1º Grupo G',        '3º A/E/H/I/J',       'Estadio Azteca',         '2026-07-02T02:00:00Z'),
  (79, '1º Grupo B',        '3º A/C/D/K/L',       'Gillette Stadium',       '2026-07-01T21:00:00Z'),
  -- Jul 2
  (80, '1º Grupo H',        '2º Grupo J',         'NRG Stadium',            '2026-07-03T01:00:00Z'),
  (81, '1º Grupo D',        '3º B/E/F/I/J',       'Mercedes-Benz Stadium',  '2026-07-03T06:00:00Z'),
  (82, '1º Grupo C',        '2º Grupo D',         'BC Place',               '2026-07-02T21:00:00Z'),
  -- Jul 3
  (83, '2º Grupo K',        '2º Grupo L',         'BMO Field',              '2026-07-04T05:00:00Z'),
  (84, '1º Grupo J',        '2º Grupo I',         'Levi''s Stadium',        '2026-07-03T21:00:00Z'),
  -- Jul 4
  (85, '1º Grupo K',        '3º G/H/I/J/K/L',     'Estadio Jalisco',        '2026-07-05T01:00:00Z'),
  (86, '1º Grupo L',        '2º Grupo K',         'Estadio BBVA',           '2026-07-04T21:00:00Z'),
  (87, '2º Grupo E',        '2º Grupo F',         'MetLife Stadium',        '2026-07-05T21:00:00Z'),
  (88, '2º Grupo G',        '2º Grupo H',         'AT&T Stadium',           '2026-07-06T01:00:00Z')
) as m(num, home_ph, away_ph, venue_name, ko)
join v ve on ve.name = m.venue_name
on conflict do nothing;

-- OCTAVOS DE FINAL (R16) — 8 matches, Jul 7-10
with v   as (select name, id from public.venues),
     tid as (select 'a1b2c3d4-0000-0000-0000-000000000001'::uuid as id)
insert into public.matches
  (tournament_id, match_number, phase, home_placeholder, away_placeholder, venue_id, kickoff_at, status)
select (select id from tid), m.num, 'round_of_16', m.home_ph, m.away_ph, ve.id, m.ko::timestamptz, 'scheduled'
from (values
  (89, 'W73', 'W74', 'MetLife Stadium',         '2026-07-08T01:00:00Z'),
  (90, 'W75', 'W76', 'AT&T Stadium',            '2026-07-08T21:00:00Z'),
  (91, 'W77', 'W78', 'SoFi Stadium',            '2026-07-09T01:00:00Z'),
  (92, 'W79', 'W80', 'NRG Stadium',             '2026-07-09T21:00:00Z'),
  (93, 'W81', 'W82', 'Arrowhead Stadium',       '2026-07-10T01:00:00Z'),
  (94, 'W83', 'W84', 'Gillette Stadium',        '2026-07-10T21:00:00Z'),
  (95, 'W85', 'W86', 'MetLife Stadium',         '2026-07-11T01:00:00Z'),
  (96, 'W87', 'W88', 'AT&T Stadium',            '2026-07-11T21:00:00Z')
) as m(num, home_ph, away_ph, venue_name, ko)
join v ve on ve.name = m.venue_name
on conflict do nothing;

-- CUARTOS DE FINAL — Jul 13-14
with v   as (select name, id from public.venues),
     tid as (select 'a1b2c3d4-0000-0000-0000-000000000001'::uuid as id)
insert into public.matches
  (tournament_id, match_number, phase, home_placeholder, away_placeholder, venue_id, kickoff_at, status)
select (select id from tid), m.num, 'quarter_final', m.home_ph, m.away_ph, ve.id, m.ko::timestamptz, 'scheduled'
from (values
  ( 97, 'W89', 'W90', 'MetLife Stadium', '2026-07-14T02:00:00Z'),
  ( 98, 'W91', 'W92', 'AT&T Stadium',    '2026-07-14T22:00:00Z'),
  ( 99, 'W93', 'W94', 'SoFi Stadium',    '2026-07-15T02:00:00Z'),
  (100, 'W95', 'W96', 'NRG Stadium',     '2026-07-15T22:00:00Z')
) as m(num, home_ph, away_ph, venue_name, ko)
join v ve on ve.name = m.venue_name
on conflict do nothing;

-- SEMIFINALES — Jul 17-18
with v   as (select name, id from public.venues),
     tid as (select 'a1b2c3d4-0000-0000-0000-000000000001'::uuid as id)
insert into public.matches
  (tournament_id, match_number, phase, home_placeholder, away_placeholder, venue_id, kickoff_at, status)
select (select id from tid), m.num, 'semi_final', m.home_ph, m.away_ph, ve.id, m.ko::timestamptz, 'scheduled'
from (values
  (101, 'W97',  'W98',  'MetLife Stadium', '2026-07-18T01:00:00Z'),
  (102, 'W99',  'W100', 'AT&T Stadium',    '2026-07-19T01:00:00Z')
) as m(num, home_ph, away_ph, venue_name, ko)
join v ve on ve.name = m.venue_name
on conflict do nothing;

-- TERCER LUGAR — Jul 19
insert into public.matches
  (tournament_id, match_number, phase, home_placeholder, away_placeholder, venue_id, kickoff_at, status)
select 'a1b2c3d4-0000-0000-0000-000000000001'::uuid,
  103, 'third_place', 'Perdedor SF1', 'Perdedor SF2',
  (select id from public.venues where name = 'MetLife Stadium' limit 1),
  '2026-07-19T21:00:00Z'::timestamptz, 'scheduled'
on conflict do nothing;

-- FINAL — Jul 19
insert into public.matches
  (tournament_id, match_number, phase, home_placeholder, away_placeholder, venue_id, kickoff_at, status)
select 'a1b2c3d4-0000-0000-0000-000000000001'::uuid,
  104, 'final', 'Ganador SF1', 'Ganador SF2',
  (select id from public.venues where name = 'MetLife Stadium' limit 1),
  '2026-07-20T01:00:00Z'::timestamptz, 'scheduled'
on conflict do nothing;
