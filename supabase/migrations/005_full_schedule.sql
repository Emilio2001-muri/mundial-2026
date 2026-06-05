-- ================================================================
-- Migration 005: Full WC 2026 schedule — 72 group + 32 knockout matches
-- ================================================================

-- Remove 3 placeholder matches from migration 004
delete from public.matches where id in (
  'm0000001-0000-0000-0000-000000000001',
  'm0000001-0000-0000-0000-000000000002',
  'm0000001-0000-0000-0000-000000000003'
);

-- ── GROUP STAGE (72 matches) ──────────────────────────────────────
-- Uses subquery joins on team fifa_code and venue name
-- match_number, group, home_code, away_code, venue_name, kickoff (UTC)

with t   as (select fifa_code, id from public.teams),
     v   as (select name, id from public.venues),
     tid as (select 'a1b2c3d4-0000-0000-0000-000000000001'::uuid as id)
insert into public.matches
  (tournament_id, match_number, phase, group_name,
   home_team_id, away_team_id, venue_id, kickoff_at, status)
select
  (select id from tid),
  m.num,
  'group',
  m.grp,
  ht.id,
  at.id,
  ve.id,
  m.ko::timestamptz,
  'scheduled'
from (values
  -- ── MATCHDAY 1 ─────────────────────────────────────────────────
  -- June 11-12
  ( 1,'A','CZE','MEX','Estadio Azteca',       '2026-06-11T18:00:00Z'),
  ( 2,'D','TUR','USA','AT&T Stadium',          '2026-06-11T21:00:00Z'),
  ( 3,'A','RSA','KOR','Arrowhead Stadium',     '2026-06-12T00:00:00Z'),
  ( 4,'D','AUS','PAR','NRG Stadium',           '2026-06-12T03:00:00Z'),
  -- June 12-13
  ( 5,'B','BIH','CAN','BMO Field',             '2026-06-12T18:00:00Z'),
  ( 6,'E','CUW','ECU','Lincoln Financial Field','2026-06-12T21:00:00Z'),
  ( 7,'B','QAT','SUI','Gillette Stadium',      '2026-06-13T00:00:00Z'),
  ( 8,'E','GER','CIV','MetLife Stadium',       '2026-06-13T03:00:00Z'),
  -- June 13-14
  ( 9,'C','BRA','HAI','SoFi Stadium',          '2026-06-13T18:00:00Z'),
  (10,'F','JPN','NED','Levi''s Stadium',       '2026-06-13T21:00:00Z'),
  (11,'C','MAR','SCO','Mercedes-Benz Stadium', '2026-06-14T00:00:00Z'),
  (12,'F','SWE','TUN','BC Place',              '2026-06-14T03:00:00Z'),
  -- June 14-15
  (13,'G','BEL','EGY','Gillette Stadium',      '2026-06-14T18:00:00Z'),
  (14,'H','CPV','KSA','Estadio Azteca',        '2026-06-14T21:00:00Z'),
  (15,'G','IRN','NZL','Stade Saputo',          '2026-06-15T00:00:00Z'),
  (16,'H','ESP','URU','AT&T Stadium',          '2026-06-15T03:00:00Z'),
  -- June 15-16
  (17,'I','FRA','IRQ','MetLife Stadium',       '2026-06-15T18:00:00Z'),
  (18,'J','ALG','ARG','NRG Stadium',           '2026-06-15T21:00:00Z'),
  (19,'I','NOR','SEN','Arrowhead Stadium',     '2026-06-16T00:00:00Z'),
  (20,'J','AUT','JOR','SoFi Stadium',          '2026-06-16T03:00:00Z'),
  -- June 16-17
  (21,'K','COL','COD','Lincoln Financial Field','2026-06-16T18:00:00Z'),
  (22,'L','CRO','ENG','Mercedes-Benz Stadium', '2026-06-16T21:00:00Z'),
  (23,'K','POR','UZB','Estadio Jalisco',       '2026-06-17T00:00:00Z'),
  (24,'L','GHA','PAN','Estadio BBVA',          '2026-06-17T03:00:00Z'),

  -- ── MATCHDAY 2 ─────────────────────────────────────────────────
  -- June 17-18
  (25,'A','CZE','RSA','Estadio Azteca',        '2026-06-17T18:00:00Z'),
  (26,'D','AUS','TUR','AT&T Stadium',          '2026-06-17T21:00:00Z'),
  (27,'A','MEX','KOR','Arrowhead Stadium',     '2026-06-18T00:00:00Z'),
  (28,'D','PAR','USA','NRG Stadium',           '2026-06-18T03:00:00Z'),
  -- June 18-19
  (29,'B','BIH','QAT','BMO Field',             '2026-06-18T18:00:00Z'),
  (30,'E','CUW','GER','Lincoln Financial Field','2026-06-18T21:00:00Z'),
  (31,'B','CAN','SUI','Gillette Stadium',      '2026-06-19T00:00:00Z'),
  (32,'E','ECU','CIV','MetLife Stadium',       '2026-06-19T03:00:00Z'),
  -- June 19-20
  (33,'C','BRA','MAR','SoFi Stadium',          '2026-06-19T18:00:00Z'),
  (34,'F','JPN','SWE','Levi''s Stadium',       '2026-06-19T21:00:00Z'),
  (35,'C','HAI','SCO','Mercedes-Benz Stadium', '2026-06-20T00:00:00Z'),
  (36,'F','NED','TUN','BC Place',              '2026-06-20T03:00:00Z'),
  -- June 20-21
  (37,'G','BEL','IRN','Gillette Stadium',      '2026-06-20T18:00:00Z'),
  (38,'H','CPV','ESP','Estadio Azteca',        '2026-06-20T21:00:00Z'),
  (39,'G','EGY','NZL','Stade Saputo',          '2026-06-21T00:00:00Z'),
  (40,'H','KSA','URU','AT&T Stadium',          '2026-06-21T03:00:00Z'),
  -- June 21-22
  (41,'I','FRA','NOR','MetLife Stadium',       '2026-06-21T18:00:00Z'),
  (42,'J','ALG','AUT','NRG Stadium',           '2026-06-21T21:00:00Z'),
  (43,'I','IRQ','SEN','Arrowhead Stadium',     '2026-06-22T00:00:00Z'),
  (44,'J','ARG','JOR','SoFi Stadium',          '2026-06-22T03:00:00Z'),
  -- June 22-23
  (45,'K','COL','POR','Lincoln Financial Field','2026-06-22T18:00:00Z'),
  (46,'L','CRO','GHA','Mercedes-Benz Stadium', '2026-06-22T21:00:00Z'),
  (47,'K','COD','UZB','Estadio Jalisco',       '2026-06-23T00:00:00Z'),
  (48,'L','ENG','PAN','Estadio BBVA',          '2026-06-23T03:00:00Z'),

  -- ── MATCHDAY 3 (simultaneous within group) ─────────────────────
  -- June 23 — Group A (20:00) & Group D (00:00 Jun 24)
  (49,'A','MEX','RSA','Estadio Azteca',        '2026-06-23T20:00:00Z'),
  (50,'A','CZE','KOR','Arrowhead Stadium',     '2026-06-23T20:00:00Z'),
  (51,'D','AUS','USA','AT&T Stadium',          '2026-06-24T00:00:00Z'),
  (52,'D','PAR','TUR','NRG Stadium',           '2026-06-24T00:00:00Z'),
  -- June 24 — Group B (20:00) & Group E (00:00 Jun 25)
  (53,'B','BIH','SUI','BMO Field',             '2026-06-24T20:00:00Z'),
  (54,'B','CAN','QAT','Gillette Stadium',      '2026-06-24T20:00:00Z'),
  (55,'E','CUW','CIV','Lincoln Financial Field','2026-06-25T00:00:00Z'),
  (56,'E','ECU','GER','MetLife Stadium',       '2026-06-25T00:00:00Z'),
  -- June 25 — Group C (20:00) & Group F (00:00 Jun 26)
  (57,'C','BRA','SCO','SoFi Stadium',          '2026-06-25T20:00:00Z'),
  (58,'C','HAI','MAR','Mercedes-Benz Stadium', '2026-06-25T20:00:00Z'),
  (59,'F','JPN','TUN','Levi''s Stadium',       '2026-06-26T00:00:00Z'),
  (60,'F','NED','SWE','BC Place',              '2026-06-26T00:00:00Z'),
  -- June 26 — Group G (20:00) & Group H (00:00 Jun 27)
  (61,'G','BEL','NZL','Gillette Stadium',      '2026-06-26T20:00:00Z'),
  (62,'G','EGY','IRN','Stade Saputo',          '2026-06-26T20:00:00Z'),
  (63,'H','CPV','URU','Estadio Azteca',        '2026-06-27T00:00:00Z'),
  (64,'H','KSA','ESP','AT&T Stadium',          '2026-06-27T00:00:00Z'),
  -- June 27 — Group I (20:00) & Group J (00:00 Jun 28)
  (65,'I','FRA','SEN','MetLife Stadium',       '2026-06-27T20:00:00Z'),
  (66,'I','IRQ','NOR','Arrowhead Stadium',     '2026-06-27T20:00:00Z'),
  (67,'J','ALG','JOR','NRG Stadium',           '2026-06-28T00:00:00Z'),
  (68,'J','ARG','AUT','SoFi Stadium',          '2026-06-28T00:00:00Z'),
  -- June 28 — Group K (20:00) & Group L (00:00 Jun 29)
  (69,'K','COL','UZB','Lincoln Financial Field','2026-06-28T20:00:00Z'),
  (70,'K','COD','POR','Estadio Jalisco',       '2026-06-28T20:00:00Z'),
  (71,'L','CRO','PAN','Mercedes-Benz Stadium', '2026-06-29T00:00:00Z'),
  (72,'L','ENG','GHA','Estadio BBVA',          '2026-06-29T00:00:00Z')
) as m(num, grp, home_code, away_code, venue_name, ko)
join t  ht on ht.fifa_code = m.home_code
join t  at on at.fifa_code = m.away_code
join v  ve on ve.name      = m.venue_name
on conflict do nothing;

-- ── ROUND OF 32 (16 matches) ─────────────────────────────────────
with v   as (select name, id from public.venues),
     tid as (select 'a1b2c3d4-0000-0000-0000-000000000001'::uuid as id)
insert into public.matches
  (tournament_id, match_number, phase, home_placeholder, away_placeholder, venue_id, kickoff_at, status)
select
  (select id from tid),
  m.num,
  'round_of_32',
  m.home_ph,
  m.away_ph,
  ve.id,
  m.ko::timestamptz,
  'scheduled'
from (values
  (73, '1º Grupo A',  '2º Grupo B',  'MetLife Stadium',       '2026-07-01T18:00:00Z'),
  (74, '1º Grupo C',  '2º Grupo D',  'AT&T Stadium',          '2026-07-01T21:00:00Z'),
  (75, '1º Grupo B',  '2º Grupo A',  'SoFi Stadium',          '2026-07-02T00:00:00Z'),
  (76, '1º Grupo D',  '2º Grupo C',  'Estadio Azteca',        '2026-07-02T03:00:00Z'),
  (77, '1º Grupo E',  '2º Grupo F',  'NRG Stadium',           '2026-07-02T18:00:00Z'),
  (78, '1º Grupo G',  '2º Grupo H',  'Arrowhead Stadium',     '2026-07-02T21:00:00Z'),
  (79, '1º Grupo F',  '2º Grupo E',  'Lincoln Financial Field','2026-07-03T00:00:00Z'),
  (80, '1º Grupo H',  '2º Grupo G',  'Gillette Stadium',      '2026-07-03T03:00:00Z'),
  (81, '1º Grupo I',  '2º Grupo J',  'MetLife Stadium',       '2026-07-03T18:00:00Z'),
  (82, '1º Grupo K',  '2º Grupo L',  'Mercedes-Benz Stadium', '2026-07-03T21:00:00Z'),
  (83, '1º Grupo J',  '2º Grupo I',  'BC Place',              '2026-07-04T00:00:00Z'),
  (84, '1º Grupo L',  '2º Grupo K',  'BMO Field',             '2026-07-04T03:00:00Z'),
  (85, '3º Grupo A/B','3º Grupo C/D','MetLife Stadium',       '2026-07-04T18:00:00Z'),
  (86, '3º Grupo E/F','3º Grupo G/H','AT&T Stadium',          '2026-07-04T21:00:00Z'),
  (87, '3º Grupo I/J','3º Grupo K/L','SoFi Stadium',          '2026-07-05T00:00:00Z'),
  (88, '3º Grupo mix','3º Grupo mix','Estadio Azteca',        '2026-07-05T03:00:00Z')
) as m(num, home_ph, away_ph, venue_name, ko)
join v ve on ve.name = m.venue_name
on conflict do nothing;

-- ── ROUND OF 16 (8 matches) ──────────────────────────────────────
with v   as (select name, id from public.venues),
     tid as (select 'a1b2c3d4-0000-0000-0000-000000000001'::uuid as id)
insert into public.matches
  (tournament_id, match_number, phase, home_placeholder, away_placeholder, venue_id, kickoff_at, status)
select
  (select id from tid),
  m.num,
  'round_of_16',
  m.home_ph,
  m.away_ph,
  ve.id,
  m.ko::timestamptz,
  'scheduled'
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

-- ── QUARTER-FINALS (4 matches) ───────────────────────────────────
with v   as (select name, id from public.venues),
     tid as (select 'a1b2c3d4-0000-0000-0000-000000000001'::uuid as id)
insert into public.matches
  (tournament_id, match_number, phase, home_placeholder, away_placeholder, venue_id, kickoff_at, status)
select
  (select id from tid),
  m.num,
  'quarter_final',
  m.home_ph,
  m.away_ph,
  ve.id,
  m.ko::timestamptz,
  'scheduled'
from (values
  ( 97, 'W89', 'W90', 'MetLife Stadium',  '2026-07-13T18:00:00Z'),
  ( 98, 'W91', 'W92', 'AT&T Stadium',     '2026-07-13T21:00:00Z'),
  ( 99, 'W93', 'W94', 'SoFi Stadium',     '2026-07-14T18:00:00Z'),
  (100, 'W95', 'W96', 'NRG Stadium',      '2026-07-14T21:00:00Z')
) as m(num, home_ph, away_ph, venue_name, ko)
join v ve on ve.name = m.venue_name
on conflict do nothing;

-- ── SEMI-FINALS (2 matches) ──────────────────────────────────────
with v   as (select name, id from public.venues),
     tid as (select 'a1b2c3d4-0000-0000-0000-000000000001'::uuid as id)
insert into public.matches
  (tournament_id, match_number, phase, home_placeholder, away_placeholder, venue_id, kickoff_at, status)
select
  (select id from tid),
  m.num,
  'semi_final',
  m.home_ph,
  m.away_ph,
  ve.id,
  m.ko::timestamptz,
  'scheduled'
from (values
  (101, 'W97', 'W98',   'MetLife Stadium', '2026-07-17T18:00:00Z'),
  (102, 'W99', 'W100',  'AT&T Stadium',    '2026-07-18T18:00:00Z')
) as m(num, home_ph, away_ph, venue_name, ko)
join v ve on ve.name = m.venue_name
on conflict do nothing;

-- ── THIRD PLACE ──────────────────────────────────────────────────
with v   as (select name, id from public.venues),
     tid as (select 'a1b2c3d4-0000-0000-0000-000000000001'::uuid as id)
insert into public.matches
  (tournament_id, match_number, phase, home_placeholder, away_placeholder, venue_id, kickoff_at, status)
select
  (select id from tid),
  103,
  'third_place',
  'Perdedor SF1',
  'Perdedor SF2',
  (select id from v where name = 'Arrowhead Stadium'),
  '2026-07-19T16:00:00Z'::timestamptz,
  'scheduled'
on conflict do nothing;

-- ── FINAL ────────────────────────────────────────────────────────
with v   as (select name, id from public.venues),
     tid as (select 'a1b2c3d4-0000-0000-0000-000000000001'::uuid as id)
insert into public.matches
  (tournament_id, match_number, phase, home_placeholder, away_placeholder, venue_id, kickoff_at, status)
select
  (select id from tid),
  104,
  'final',
  'Ganador SF1',
  'Ganador SF2',
  (select id from v where name = 'MetLife Stadium'),
  '2026-07-19T20:00:00Z'::timestamptz,
  'scheduled'
on conflict do nothing;
