-- ================================================================
-- Migration 006: Reset and correct full WC 2026 schedule
-- Fixes: wrong team pairings, wrong kickoff times
-- All times UTC. Mexico City (CDMX) = CDT = UTC-5 in summer
--   13:00 CDMX = 18:00 UTC  (slot A)
--   16:00 CDMX = 21:00 UTC  (slot B)
--   19:00 CDMX = 00:00 UTC+1 (slot C)
--   22:00 CDMX = 03:00 UTC+1 (slot D)
-- ================================================================

-- 1. Delete all existing matches for this tournament
delete from public.matches
where tournament_id = 'a1b2c3d4-0000-0000-0000-000000000001'::uuid;

-- 2. Re-insert GROUP STAGE (72 matches) with corrected times
with t   as (select fifa_code, id from public.teams),
     v   as (select name, id from public.venues),
     tid as (select 'a1b2c3d4-0000-0000-0000-000000000001'::uuid as id)
insert into public.matches
  (tournament_id, match_number, phase, group_name,
   home_team_id, away_team_id, venue_id, kickoff_at, status)
select
  (select id from tid),
  m.num, 'group', m.grp, ht.id, at.id, ve.id, m.ko::timestamptz, 'scheduled'
from (values
  -- ── JORNADA 1 ──────────────────────────────────────────────────
  -- Jun 11 (4 partidos)
  ( 1,'A','MEX','RSA','Estadio Azteca',        '2026-06-11T18:00:00Z'),
  ( 2,'B','CAN','BIH','BMO Field',             '2026-06-11T21:00:00Z'),
  ( 3,'C','BRA','SCO','SoFi Stadium',          '2026-06-12T00:00:00Z'),
  ( 4,'D','USA','TUR','AT&T Stadium',          '2026-06-12T03:00:00Z'),
  -- Jun 12 (4 partidos)
  ( 5,'E','GER','ECU','MetLife Stadium',       '2026-06-12T18:00:00Z'),
  ( 6,'F','NED','SWE','Lincoln Financial Field','2026-06-12T21:00:00Z'),
  ( 7,'G','ESP','KSA','Estadio Azteca',        '2026-06-13T00:00:00Z'),
  ( 8,'H','URU','CPV','AT&T Stadium',          '2026-06-13T03:00:00Z'),
  -- Jun 13 (4 partidos)
  ( 9,'A','KOR','CZE','Arrowhead Stadium',     '2026-06-13T18:00:00Z'),
  (10,'B','SUI','QAT','Gillette Stadium',      '2026-06-13T21:00:00Z'),
  (11,'C','MAR','HAI','Mercedes-Benz Stadium', '2026-06-14T00:00:00Z'),
  (12,'D','AUS','PAR','NRG Stadium',           '2026-06-14T03:00:00Z'),
  -- Jun 14 (4 partidos)
  (13,'E','CIV','CUW','BC Place',              '2026-06-14T18:00:00Z'),
  (14,'F','TUN','JPN','Levi''s Stadium',       '2026-06-14T21:00:00Z'),
  (15,'G','BEL','NZL','Gillette Stadium',      '2026-06-15T00:00:00Z'),
  (16,'H','IRN','EGY','Stade Saputo',          '2026-06-15T03:00:00Z'),
  -- Jun 15 (4 partidos)
  (17,'I','FRA','IRQ','MetLife Stadium',       '2026-06-15T18:00:00Z'),
  (18,'J','ARG','ALG','SoFi Stadium',          '2026-06-15T21:00:00Z'),
  (19,'K','POR','COD','Estadio Jalisco',       '2026-06-16T00:00:00Z'),
  (20,'L','ENG','PAN','Estadio BBVA',          '2026-06-16T03:00:00Z'),
  -- Jun 16 (4 partidos)
  (21,'I','NOR','SEN','Arrowhead Stadium',     '2026-06-16T18:00:00Z'),
  (22,'J','AUT','JOR','NRG Stadium',           '2026-06-16T21:00:00Z'),
  (23,'K','COL','UZB','Lincoln Financial Field','2026-06-17T00:00:00Z'),
  (24,'L','CRO','GHA','Mercedes-Benz Stadium', '2026-06-17T03:00:00Z'),

  -- ── JORNADA 2 ──────────────────────────────────────────────────
  -- Jun 17 (4 partidos)
  (25,'A','RSA','KOR','Estadio Azteca',        '2026-06-17T18:00:00Z'),
  (26,'B','BIH','SUI','BMO Field',             '2026-06-17T21:00:00Z'),
  (27,'C','SCO','HAI','SoFi Stadium',          '2026-06-18T00:00:00Z'),
  (28,'D','TUR','AUS','AT&T Stadium',          '2026-06-18T03:00:00Z'),
  -- Jun 18 (4 partidos)
  (29,'A','MEX','CZE','Arrowhead Stadium',     '2026-06-18T18:00:00Z'),
  (30,'B','QAT','CAN','Gillette Stadium',      '2026-06-18T21:00:00Z'),
  (31,'C','BRA','MAR','Mercedes-Benz Stadium', '2026-06-19T00:00:00Z'),
  (32,'D','PAR','USA','NRG Stadium',           '2026-06-19T03:00:00Z'),
  -- Jun 19 (4 partidos)
  (33,'E','ECU','CUW','MetLife Stadium',       '2026-06-19T18:00:00Z'),
  (34,'F','SWE','TUN','Lincoln Financial Field','2026-06-19T21:00:00Z'),
  (35,'G','KSA','BEL','AT&T Stadium',          '2026-06-20T00:00:00Z'),
  (36,'H','CPV','IRN','Stade Saputo',          '2026-06-20T03:00:00Z'),
  -- Jun 20 (4 partidos)
  (37,'E','GER','CIV','BC Place',              '2026-06-20T18:00:00Z'),
  (38,'F','JPN','NED','Levi''s Stadium',       '2026-06-20T21:00:00Z'),
  (39,'G','NZL','ESP','SoFi Stadium',          '2026-06-21T00:00:00Z'),
  (40,'H','EGY','URU','Gillette Stadium',      '2026-06-21T03:00:00Z'),
  -- Jun 21 (4 partidos)
  (41,'I','IRQ','NOR','MetLife Stadium',       '2026-06-21T18:00:00Z'),
  (42,'J','ALG','AUT','NRG Stadium',           '2026-06-21T21:00:00Z'),
  (43,'K','UZB','POR','Estadio Jalisco',       '2026-06-22T00:00:00Z'),
  (44,'L','PAN','CRO','Estadio BBVA',          '2026-06-22T03:00:00Z'),
  -- Jun 22 (4 partidos)
  (45,'I','FRA','SEN','Arrowhead Stadium',     '2026-06-22T18:00:00Z'),
  (46,'J','JOR','ARG','SoFi Stadium',          '2026-06-22T21:00:00Z'),
  (47,'K','COL','POR','Lincoln Financial Field','2026-06-23T00:00:00Z'),
  (48,'L','GHA','ENG','Mercedes-Benz Stadium', '2026-06-23T03:00:00Z'),

  -- ── JORNADA 3 (simultánea en cada grupo) ───────────────────────
  -- Jun 23 — Grupos A y B (simultánea 20:00 UTC / 3pm CDMX)
  (49,'A','MEX','KOR','Estadio Azteca',        '2026-06-23T20:00:00Z'),
  (50,'A','CZE','RSA','Arrowhead Stadium',     '2026-06-23T20:00:00Z'),
  -- Jun 23 — Grupos C y D simultánea
  (51,'C','BRA','HAI','SoFi Stadium',          '2026-06-23T23:00:00Z'),
  (52,'C','MAR','SCO','Mercedes-Benz Stadium', '2026-06-23T23:00:00Z'),
  -- Jun 24 — Grupos E y F
  (53,'D','USA','AUS','AT&T Stadium',          '2026-06-24T02:00:00Z'),
  (54,'D','TUR','PAR','NRG Stadium',           '2026-06-24T02:00:00Z'),
  -- Jun 24 — Grupos E y F
  (55,'B','CAN','SUI','BMO Field',             '2026-06-24T20:00:00Z'),
  (56,'B','BIH','QAT','Gillette Stadium',      '2026-06-24T20:00:00Z'),
  -- Jun 24 — Grupos G y H
  (57,'E','GER','CUW','MetLife Stadium',       '2026-06-24T23:00:00Z'),
  (58,'E','CIV','ECU','BC Place',              '2026-06-24T23:00:00Z'),
  -- Jun 25 — Grupos G y H
  (59,'F','NED','TUN','Lincoln Financial Field','2026-06-25T02:00:00Z'),
  (60,'F','JPN','SWE','Levi''s Stadium',       '2026-06-25T02:00:00Z'),
  -- Jun 25 — Grupos G y H
  (61,'G','ESP','URU','Estadio Azteca',        '2026-06-25T20:00:00Z'),
  (62,'G','BEL','IRN','Gillette Stadium',      '2026-06-25T20:00:00Z'),
  -- Jun 25
  (63,'H','KSA','NZL','AT&T Stadium',         '2026-06-25T23:00:00Z'),
  (64,'H','CPV','EGY','Stade Saputo',          '2026-06-25T23:00:00Z'),
  -- Jun 26 — Grupos I y J
  (65,'I','FRA','NOR','MetLife Stadium',       '2026-06-26T20:00:00Z'),
  (66,'I','SEN','IRQ','Arrowhead Stadium',     '2026-06-26T20:00:00Z'),
  (67,'J','ARG','JOR','SoFi Stadium',          '2026-06-26T23:00:00Z'),
  (68,'J','ALG','AUT','NRG Stadium',           '2026-06-26T23:00:00Z'),
  -- Jun 27 — Grupos K y L
  (69,'K','POR','COL','Estadio Jalisco',       '2026-06-27T20:00:00Z'),
  (70,'K','COD','UZB','Lincoln Financial Field','2026-06-27T20:00:00Z'),
  (71,'L','ENG','GHA','Estadio BBVA',          '2026-06-27T23:00:00Z'),
  (72,'L','CRO','PAN','Mercedes-Benz Stadium', '2026-06-27T23:00:00Z')
) as m(num, grp, home_code, away_code, venue_name, ko)
join t  ht on ht.fifa_code = m.home_code
join t  at on at.fifa_code = m.away_code
join v  ve on ve.name      = m.venue_name
on conflict do nothing;

-- 3. Re-insert ROUND OF 32 (16 matches) — bracket oficial FIFA 2026
-- Grupos E-H en un lado, A-D en el otro, I-L en el tercero
with v   as (select name, id from public.venues),
     tid as (select 'a1b2c3d4-0000-0000-0000-000000000001'::uuid as id)
insert into public.matches
  (tournament_id, match_number, phase, home_placeholder, away_placeholder, venue_id, kickoff_at, status)
select (select id from tid), m.num, 'round_of_32', m.home_ph, m.away_ph, ve.id, m.ko::timestamptz, 'scheduled'
from (values
  -- Bracket Norte (Grupos A-D + mejores 3os)
  (73, '1º Grupo A', '2º Grupo B',          'MetLife Stadium',        '2026-07-01T18:00:00Z'),
  (74, '1º Grupo C', '2º Grupo D',          'AT&T Stadium',           '2026-07-01T21:00:00Z'),
  (75, '1º Grupo B', '2º Grupo A',          'SoFi Stadium',           '2026-07-02T00:00:00Z'),
  (76, '1º Grupo D', '2º Grupo C',          'Estadio Azteca',         '2026-07-02T03:00:00Z'),
  -- Bracket Centro (Grupos E-H + mejores 3os)
  (77, '1º Grupo E', '3º A/B/C/D/F',        'NRG Stadium',            '2026-07-02T18:00:00Z'),
  (78, '1º Grupo G', '3º A/B/C/D/E',        'Arrowhead Stadium',      '2026-07-02T21:00:00Z'),
  (79, '1º Grupo F', '3º A/B/C/D/G',        'Lincoln Financial Field', '2026-07-03T00:00:00Z'),
  (80, '1º Grupo H', '2º Grupo E/F/G',      'Gillette Stadium',       '2026-07-03T03:00:00Z'),
  -- Bracket Sur (Grupos I-L + mejores 3os)
  (81, '1º Grupo I', '2º Grupo J',          'MetLife Stadium',         '2026-07-03T18:00:00Z'),
  (82, '1º Grupo K', '2º Grupo L',          'Mercedes-Benz Stadium',  '2026-07-03T21:00:00Z'),
  (83, '1º Grupo J', '2º Grupo I',          'BC Place',               '2026-07-04T00:00:00Z'),
  (84, '1º Grupo L', '2º Grupo K',          'BMO Field',              '2026-07-04T03:00:00Z'),
  -- Mejores 3os restantes
  (85, '3º Grupo E/F/G/H', '3º otros',      'MetLife Stadium',        '2026-07-04T18:00:00Z'),
  (86, '3º Grupo I/J',     '3º otros',      'AT&T Stadium',           '2026-07-04T21:00:00Z'),
  (87, '3º Grupo K/L',     '3º otros',      'SoFi Stadium',           '2026-07-05T00:00:00Z'),
  (88, '3º Grupo mix',     '3º Grupo mix',  'Estadio Azteca',         '2026-07-05T03:00:00Z')
) as m(num, home_ph, away_ph, venue_name, ko)
join v ve on ve.name = m.venue_name
on conflict do nothing;

-- 4. OCTAVOS DE FINAL (8 matches)
with v   as (select name, id from public.venues),
     tid as (select 'a1b2c3d4-0000-0000-0000-000000000001'::uuid as id)
insert into public.matches
  (tournament_id, match_number, phase, home_placeholder, away_placeholder, venue_id, kickoff_at, status)
select (select id from tid), m.num, 'round_of_16', m.home_ph, m.away_ph, ve.id, m.ko::timestamptz, 'scheduled'
from (values
  (89, 'W73', 'W74', 'MetLife Stadium',   '2026-07-07T18:00:00Z'),
  (90, 'W75', 'W76', 'AT&T Stadium',      '2026-07-07T21:00:00Z'),
  (91, 'W77', 'W78', 'SoFi Stadium',      '2026-07-08T18:00:00Z'),
  (92, 'W79', 'W80', 'NRG Stadium',       '2026-07-08T21:00:00Z'),
  (93, 'W81', 'W82', 'Arrowhead Stadium', '2026-07-09T18:00:00Z'),
  (94, 'W83', 'W84', 'Gillette Stadium',  '2026-07-09T21:00:00Z'),
  (95, 'W85', 'W86', 'MetLife Stadium',   '2026-07-10T18:00:00Z'),
  (96, 'W87', 'W88', 'AT&T Stadium',      '2026-07-10T21:00:00Z')
) as m(num, home_ph, away_ph, venue_name, ko)
join v ve on ve.name = m.venue_name
on conflict do nothing;

-- 5. CUARTOS DE FINAL
with v   as (select name, id from public.venues),
     tid as (select 'a1b2c3d4-0000-0000-0000-000000000001'::uuid as id)
insert into public.matches
  (tournament_id, match_number, phase, home_placeholder, away_placeholder, venue_id, kickoff_at, status)
select (select id from tid), m.num, 'quarter_final', m.home_ph, m.away_ph, ve.id, m.ko::timestamptz, 'scheduled'
from (values
  ( 97, 'W89', 'W90', 'MetLife Stadium', '2026-07-13T18:00:00Z'),
  ( 98, 'W91', 'W92', 'AT&T Stadium',    '2026-07-13T21:00:00Z'),
  ( 99, 'W93', 'W94', 'SoFi Stadium',    '2026-07-14T18:00:00Z'),
  (100, 'W95', 'W96', 'NRG Stadium',     '2026-07-14T21:00:00Z')
) as m(num, home_ph, away_ph, venue_name, ko)
join v ve on ve.name = m.venue_name
on conflict do nothing;

-- 6. SEMIFINALES
with v   as (select name, id from public.venues),
     tid as (select 'a1b2c3d4-0000-0000-0000-000000000001'::uuid as id)
insert into public.matches
  (tournament_id, match_number, phase, home_placeholder, away_placeholder, venue_id, kickoff_at, status)
select (select id from tid), m.num, 'semi_final', m.home_ph, m.away_ph, ve.id, m.ko::timestamptz, 'scheduled'
from (values
  (101, 'W97',  'W98',  'MetLife Stadium', '2026-07-17T18:00:00Z'),
  (102, 'W99',  'W100', 'AT&T Stadium',    '2026-07-18T18:00:00Z')
) as m(num, home_ph, away_ph, venue_name, ko)
join v ve on ve.name = m.venue_name
on conflict do nothing;

-- 7. TERCER LUGAR
insert into public.matches
  (tournament_id, match_number, phase, home_placeholder, away_placeholder, venue_id, kickoff_at, status)
select 'a1b2c3d4-0000-0000-0000-000000000001'::uuid,
  103, 'third_place', 'Perdedor SF1', 'Perdedor SF2',
  (select id from public.venues where name = 'Arrowhead Stadium'),
  '2026-07-19T16:00:00Z'::timestamptz, 'scheduled'
on conflict do nothing;

-- 8. FINAL
insert into public.matches
  (tournament_id, match_number, phase, home_placeholder, away_placeholder, venue_id, kickoff_at, status)
select 'a1b2c3d4-0000-0000-0000-000000000001'::uuid,
  104, 'final', 'Ganador SF1', 'Ganador SF2',
  (select id from public.venues where name = 'MetLife Stadium'),
  '2026-07-19T20:00:00Z'::timestamptz, 'scheduled'
on conflict do nothing;
