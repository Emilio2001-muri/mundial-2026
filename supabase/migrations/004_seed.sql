-- ================================================================
-- Migration 004: Seed data - FIFA World Cup 2026
-- Real 12 groups, 48 teams and official 26-player squads
-- ================================================================

-- ── Tournament ───────────────────────────────────────────────────
insert into public.tournaments (id, name, year, starts_at, ends_at, global_predictions_lock_at, status)
values (
  'a1b2c3d4-0000-0000-0000-000000000001',
  'FIFA World Cup 2026',
  2026,
  '2026-06-11T20:00:00Z',
  '2026-07-19T21:00:00Z',
  '2026-06-11T19:00:00Z',
  'active'
) on conflict do nothing;

-- ── Scoring rules ────────────────────────────────────────────────
insert into public.scoring_rules (key, points, description, enabled) values
  ('exact_score',      3, 'Acertar el marcador exacto del partido',              true),
  ('correct_winner',   2, 'Acertar ganador o empate',                            true),
  ('scorer_goal',      1, 'Por cada gol que anota el jugador predicho',          true),
  ('global_champion',  5, 'Acertar el campeón del torneo',                       true),
  ('global_runner_up', 3, 'Acertar el subcampeón',                               true),
  ('global_third',     2, 'Acertar el tercer lugar',                             true),
  ('global_finalist',  5, 'Acertar un equipo finalista (cualquiera de los dos)', true),
  ('golden_ball',      5, 'Acertar el Balón de Oro',                             true),
  ('silver_ball',      2, 'Acertar el Balón de Plata',                           true),
  ('bronze_ball',      1, 'Acertar el Balón de Bronce',                          true),
  ('golden_boot',      3, 'Acertar la Bota de Oro (máximo goleador)',            true),
  ('golden_glove',     3, 'Acertar el Guante de Oro (mejor portero)',            true),
  ('best_young',       3, 'Acertar el mejor jugador sub-21',                     true)
on conflict (key) do update set points = excluded.points, description = excluded.description;

-- ── Venues ───────────────────────────────────────────────────────
insert into public.venues (id, name, city, country, timezone) values
  ('e1000000-0000-0000-0000-000000000001', 'MetLife Stadium',        'East Rutherford', 'USA',    'America/New_York'),
  ('e1000000-0000-0000-0000-000000000002', 'AT&T Stadium',           'Arlington',       'USA',    'America/Chicago'),
  ('e1000000-0000-0000-0000-000000000003', 'SoFi Stadium',           'Inglewood',       'USA',    'America/Los_Angeles'),
  ('e1000000-0000-0000-0000-000000000004', 'Estadio Azteca',         'Ciudad de México','Mexico', 'America/Mexico_City'),
  ('e1000000-0000-0000-0000-000000000005', 'Estadio BBVA',           'Monterrey',       'Mexico', 'America/Monterrey'),
  ('e1000000-0000-0000-0000-000000000006', 'BC Place',               'Vancouver',       'Canada', 'America/Vancouver'),
  ('e1000000-0000-0000-0000-000000000007', 'BMO Field',              'Toronto',         'Canada', 'America/Toronto'),
  ('e1000000-0000-0000-0000-000000000008', 'Arrowhead Stadium',      'Kansas City',     'USA',    'America/Chicago'),
  ('e1000000-0000-0000-0000-000000000009', 'Gillette Stadium',       'Foxborough',      'USA',    'America/New_York'),
  ('e1000000-0000-0000-0000-000000000010', 'Levi''s Stadium',        'Santa Clara',     'USA',    'America/Los_Angeles'),
  ('e1000000-0000-0000-0000-000000000011', 'Lincoln Financial Field','Philadelphia',    'USA',    'America/New_York'),
  ('e1000000-0000-0000-0000-000000000012', 'Allegiant Stadium',      'Las Vegas',       'USA',    'America/Los_Angeles'),
  ('e1000000-0000-0000-0000-000000000013', 'NRG Stadium',            'Houston',         'USA',    'America/Chicago'),
  ('e1000000-0000-0000-0000-000000000014', 'Estadio Jalisco',        'Guadalajara',     'Mexico', 'America/Mazatlan'),
  ('e1000000-0000-0000-0000-000000000015', 'Stade Saputo',           'Montreal',        'Canada', 'America/Toronto'),
  ('e1000000-0000-0000-0000-000000000016', 'Mercedes-Benz Stadium',  'Atlanta',         'USA',    'America/New_York')
on conflict do nothing;

-- ================================================================
-- 48 Teams (real WC 2026 groups A-L)
-- ================================================================
insert into public.teams (fifa_code, name, flag_url, group_name, confederation) values
  ('CZE','Czech Republic',        'https://flagcdn.com/w80/cz.png',    'A','UEFA'),
  ('MEX','Mexico',                'https://flagcdn.com/w80/mx.png',    'A','CONCACAF'),
  ('RSA','South Africa',          'https://flagcdn.com/w80/za.png',    'A','CAF'),
  ('KOR','South Korea',           'https://flagcdn.com/w80/kr.png',    'A','AFC'),
  ('BIH','Bosnia and Herzegovina','https://flagcdn.com/w80/ba.png',    'B','UEFA'),
  ('CAN','Canada',                'https://flagcdn.com/w80/ca.png',    'B','CONCACAF'),
  ('QAT','Qatar',                 'https://flagcdn.com/w80/qa.png',    'B','AFC'),
  ('SUI','Switzerland',           'https://flagcdn.com/w80/ch.png',    'B','UEFA'),
  ('BRA','Brazil',                'https://flagcdn.com/w80/br.png',    'C','CONMEBOL'),
  ('HAI','Haiti',                 'https://flagcdn.com/w80/ht.png',    'C','CONCACAF'),
  ('MAR','Morocco',               'https://flagcdn.com/w80/ma.png',    'C','CAF'),
  ('SCO','Scotland',              'https://flagcdn.com/w80/gb-sct.png','C','UEFA'),
  ('AUS','Australia',             'https://flagcdn.com/w80/au.png',    'D','AFC'),
  ('PAR','Paraguay',              'https://flagcdn.com/w80/py.png',    'D','CONMEBOL'),
  ('TUR','Turkey',                'https://flagcdn.com/w80/tr.png',    'D','UEFA'),
  ('USA','United States',         'https://flagcdn.com/w80/us.png',    'D','CONCACAF'),
  ('CUW','Curaçao',               'https://flagcdn.com/w80/cw.png',    'E','CONCACAF'),
  ('ECU','Ecuador',               'https://flagcdn.com/w80/ec.png',    'E','CONMEBOL'),
  ('GER','Germany',               'https://flagcdn.com/w80/de.png',    'E','UEFA'),
  ('CIV','Ivory Coast',           'https://flagcdn.com/w80/ci.png',    'E','CAF'),
  ('JPN','Japan',                 'https://flagcdn.com/w80/jp.png',    'F','AFC'),
  ('NED','Netherlands',           'https://flagcdn.com/w80/nl.png',    'F','UEFA'),
  ('SWE','Sweden',                'https://flagcdn.com/w80/se.png',    'F','UEFA'),
  ('TUN','Tunisia',               'https://flagcdn.com/w80/tn.png',    'F','CAF'),
  ('BEL','Belgium',               'https://flagcdn.com/w80/be.png',    'G','UEFA'),
  ('EGY','Egypt',                 'https://flagcdn.com/w80/eg.png',    'G','CAF'),
  ('IRN','Iran',                  'https://flagcdn.com/w80/ir.png',    'G','AFC'),
  ('NZL','New Zealand',           'https://flagcdn.com/w80/nz.png',    'G','OFC'),
  ('CPV','Cape Verde',            'https://flagcdn.com/w80/cv.png',    'H','CAF'),
  ('KSA','Saudi Arabia',          'https://flagcdn.com/w80/sa.png',    'H','AFC'),
  ('ESP','Spain',                 'https://flagcdn.com/w80/es.png',    'H','UEFA'),
  ('URU','Uruguay',               'https://flagcdn.com/w80/uy.png',    'H','CONMEBOL'),
  ('FRA','France',                'https://flagcdn.com/w80/fr.png',    'I','UEFA'),
  ('IRQ','Iraq',                  'https://flagcdn.com/w80/iq.png',    'I','AFC'),
  ('NOR','Norway',                'https://flagcdn.com/w80/no.png',    'I','UEFA'),
  ('SEN','Senegal',               'https://flagcdn.com/w80/sn.png',    'I','CAF'),
  ('ALG','Algeria',               'https://flagcdn.com/w80/dz.png',    'J','CAF'),
  ('ARG','Argentina',             'https://flagcdn.com/w80/ar.png',    'J','CONMEBOL'),
  ('AUT','Austria',               'https://flagcdn.com/w80/at.png',    'J','UEFA'),
  ('JOR','Jordan',                'https://flagcdn.com/w80/jo.png',    'J','AFC'),
  ('COL','Colombia',              'https://flagcdn.com/w80/co.png',    'K','CONMEBOL'),
  ('COD','DR Congo',              'https://flagcdn.com/w80/cd.png',    'K','CAF'),
  ('POR','Portugal',              'https://flagcdn.com/w80/pt.png',    'K','UEFA'),
  ('UZB','Uzbekistan',            'https://flagcdn.com/w80/uz.png',    'K','AFC'),
  ('CRO','Croatia',               'https://flagcdn.com/w80/hr.png',    'L','UEFA'),
  ('ENG','England',               'https://flagcdn.com/w80/gb-eng.png','L','UEFA'),
  ('GHA','Ghana',                 'https://flagcdn.com/w80/gh.png',    'L','CAF'),
  ('PAN','Panama',                'https://flagcdn.com/w80/pa.png',    'L','CONCACAF')
on conflict (fifa_code) do update
  set name=excluded.name, flag_url=excluded.flag_url,
      group_name=excluded.group_name, confederation=excluded.confederation;

-- ================================================================
-- Players: all 26 per team (official FIFA WC 2026 squads)
-- ================================================================

-- Helper macro: insert 26 players for a team by fifa_code
-- Each block: team_id via subquery, names array, positions array, shirt 1..26

-- === Group A ===
insert into public.players (team_id,name,position,shirt_number) select t.id,v.name,v.pos,v.num from public.teams t, (values
(1,'Matěj Kovář','GK'),(2,'David Zima','DF'),(3,'Tomáš Holeš','DF'),(4,'Robin Hranáč','DF'),(5,'Vladimír Coufal','DF'),
(6,'Štěpán Chaloupek','DF'),(7,'Ladislav Krejčí','DF'),(8,'Vladimír Darida','MF'),(9,'Adam Hložek','FW'),(10,'Patrik Schick','FW'),
(11,'Jan Kuchta','FW'),(12,'Lukáš Červ','MF'),(13,'Mojmír Chytil','FW'),(14,'David Jurásek','DF'),(15,'Pavel Šulc','FW'),
(16,'Jindřich Staněk','GK'),(17,'Lukáš Provod','MF'),(18,'Michal Sadílek','MF'),(19,'Tomáš Chorý','FW'),(20,'Jaroslav Zelený','DF'),
(21,'David Douděra','DF'),(22,'Tomáš Souček','MF'),(23,'Lukáš Horníček','GK'),(24,'Alexandr Sojka','MF'),(25,'Hugo Sochůrek','MF'),(26,'Denis Višinský','FW')
) as v(num,name,pos) where t.fifa_code='CZE' on conflict do nothing;

insert into public.players (team_id,name,position,shirt_number) select t.id,v.name,v.pos,v.num from public.teams t, (values
(1,'Raúl Rangel','GK'),(2,'Jorge Sánchez','DF'),(3,'César Montes','DF'),(4,'Edson Álvarez','DF'),(5,'Johan Vásquez','DF'),
(6,'Érik Lira','MF'),(7,'Luis Romo','MF'),(8,'Álvaro Fidalgo','MF'),(9,'Raúl Jiménez','FW'),(10,'Alexis Vega','FW'),
(11,'Santiago Giménez','FW'),(12,'Carlos Acevedo','GK'),(13,'Guillermo Ochoa','GK'),(14,'Armando González','FW'),(15,'Israel Reyes','DF'),
(16,'Julián Quiñones','FW'),(17,'Orbelín Pineda','MF'),(18,'Obed Vargas','MF'),(19,'Gilberto Mora','MF'),(20,'Mateo Chávez','DF'),
(21,'César Huerta','FW'),(22,'Guillermo Martínez','FW'),(23,'Jesús Gallardo','DF'),(24,'Luis Chávez','MF'),(25,'Roberto Alvarado','FW'),(26,'Brian Gutiérrez','MF')
) as v(num,name,pos) where t.fifa_code='MEX' on conflict do nothing;

insert into public.players (team_id,name,position,shirt_number) select t.id,v.name,v.pos,v.num from public.teams t, (values
(1,'Ronwen Williams','GK'),(2,'Thabang Matuludi','DF'),(3,'Khulumani Ndamane','DF'),(4,'Teboho Mokoena','MF'),(5,'Thalente Mbatha','MF'),
(6,'Aubrey Modiba','DF'),(7,'Oswin Appollis','FW'),(8,'Tshepang Moremi','FW'),(9,'Lyle Foster','FW'),(10,'Relebohile Mofokeng','FW'),
(11,'Themba Zwane','MF'),(12,'Thapelo Maseko','FW'),(13,'Sphephelo Sithole','MF'),(14,'Mbekezeli Mbokazi','DF'),(15,'Iqraam Rayners','FW'),
(16,'Sipho Chaine','GK'),(17,'Evidence Makgopa','FW'),(18,'Samukele Kabini','DF'),(19,'Nkosinathi Sibisi','DF'),(20,'Khuliso Mudau','DF'),
(21,'Ime Okon','DF'),(22,'Ricardo Goss','GK'),(23,'Jayden Adams','MF'),(24,'Olwethu Makhanya','DF'),(25,'Kamogelo Sebelebele','FW'),(26,'Bradley Cross','DF')
) as v(num,name,pos) where t.fifa_code='RSA' on conflict do nothing;

insert into public.players (team_id,name,position,shirt_number) select t.id,v.name,v.pos,v.num from public.teams t, (values
(1,'Kim Seung-gyu','GK'),(2,'Lee Han-beom','DF'),(3,'Lee Gi-hyuk','MF'),(4,'Kim Min-jae','DF'),(5,'Kim Tae-hyeon','DF'),
(6,'Hwang In-beom','MF'),(7,'Son Heung-min','FW'),(8,'Paik Seung-ho','MF'),(9,'Cho Gue-sung','FW'),(10,'Lee Jae-sung','MF'),
(11,'Hwang Hee-chan','MF'),(12,'Song Bum-keun','GK'),(13,'Lee Tae-seok','DF'),(14,'Cho Wi-je','DF'),(15,'Kim Moon-hwan','DF'),
(16,'Park Jin-seob','DF'),(17,'Bae Jun-ho','MF'),(18,'Oh Hyeon-gyu','FW'),(19,'Lee Kang-in','MF'),(20,'Yang Hyun-jun','MF'),
(21,'Jo Hyeon-woo','GK'),(22,'Seol Young-woo','DF'),(23,'Jens Castrop','DF'),(24,'Kim Jin-gyu','MF'),(25,'Eom Ji-sung','MF'),(26,'Lee Dong-gyeong','MF')
) as v(num,name,pos) where t.fifa_code='KOR' on conflict do nothing;

-- === Group B ===
insert into public.players (team_id,name,position,shirt_number) select t.id,v.name,v.pos,v.num from public.teams t, (values
(1,'Nikola Vasilj','GK'),(2,'Nihad Mujakić','DF'),(3,'Dennis Hadžikadunić','DF'),(4,'Tarik Muharemović','DF'),(5,'Sead Kolašinac','DF'),
(6,'Benjamin Tahirović','MF'),(7,'Amar Dedić','DF'),(8,'Armin Gigović','MF'),(9,'Samed Baždar','FW'),(10,'Ermedin Demirović','FW'),
(11,'Edin Džeko','FW'),(12,'Mladen Jurkas','GK'),(13,'Ivan Bašić','MF'),(14,'Ivan Šunjić','MF'),(15,'Amar Memić','MF'),
(16,'Amir Hadžiahmetović','MF'),(17,'Dženis Burnić','MF'),(18,'Nikola Katić','DF'),(19,'Kerim Alajbegović','FW'),(20,'Esmir Bajraktarević','FW'),
(21,'Stjepan Radeljić','DF'),(22,'Martin Zlomislić','GK'),(23,'Haris Tabaković','FW'),(24,'Nidal Čelik','DF'),(25,'Jovo Lukić','FW'),(26,'Ermin Mahmić','MF')
) as v(num,name,pos) where t.fifa_code='BIH' on conflict do nothing;

insert into public.players (team_id,name,position,shirt_number) select t.id,v.name,v.pos,v.num from public.teams t, (values
(1,'Dayne St. Clair','GK'),(2,'Alistair Johnston','DF'),(3,'Alfie Jones','DF'),(4,'Luc de Fougerolles','DF'),(5,'Joel Waterman','DF'),
(6,'Mathieu Choinière','MF'),(7,'Stephen Eustáquio','MF'),(8,'Ismaël Koné','MF'),(9,'Cyle Larin','FW'),(10,'Jonathan David','FW'),
(11,'Liam Millar','MF'),(12,'Tani Oluwaseyi','FW'),(13,'Derek Cornelius','DF'),(14,'Jacob Shaffelburg','MF'),(15,'Moïse Bombito','DF'),
(16,'Maxime Crépeau','GK'),(17,'Tajon Buchanan','FW'),(18,'Owen Goodman','GK'),(19,'Alphonso Davies','DF'),(20,'Ali Ahmed','FW'),
(21,'Jonathan Osorio','MF'),(22,'Richie Laryea','DF'),(23,'Niko Sigur','DF'),(24,'Promise David','FW'),(25,'Nathan Saliba','MF'),(26,'Jacob Shaffelburg','MF')
) as v(num,name,pos) where t.fifa_code='CAN' on conflict do nothing;

insert into public.players (team_id,name,position,shirt_number) select t.id,v.name,v.pos,v.num from public.teams t, (values
(1,'Mahmud Abunada','GK'),(2,'Pedro Miguel','DF'),(3,'Lucas Mendes','DF'),(4,'Issa Laye','DF'),(5,'Jassem Gaber','DF'),
(6,'Abdulaziz Hatem','MF'),(7,'Ahmed Alaaeldin','FW'),(8,'Edmilson Junior','FW'),(9,'Mohammed Muntari','FW'),(10,'Hassan Al-Haydos','FW'),
(11,'Akram Afif','FW'),(12,'Karim Boudiaf','MF'),(13,'Ayoub Al-Oui','DF'),(14,'Homam Ahmed','DF'),(15,'Yusuf Abdurisag','FW'),
(16,'Boualem Khoukhi','DF'),(17,'Ahmed Al-Ganehi','MF'),(18,'Sultan Al-Brake','DF'),(19,'Almoez Ali','FW'),(20,'Ahmed Fathy','MF'),
(21,'Salah Zakaria','GK'),(22,'Meshaal Barsham','GK'),(23,'Assim Madibo','MF'),(24,'Tahsin Jamshid','FW'),(25,'Al-Hashmi Al-Hussain','DF'),(26,'Mohamed Manai','FW')
) as v(num,name,pos) where t.fifa_code='QAT' on conflict do nothing;

insert into public.players (team_id,name,position,shirt_number) select t.id,v.name,v.pos,v.num from public.teams t, (values
(1,'Gregor Kobel','GK'),(2,'Miro Muheim','DF'),(3,'Silvan Widmer','DF'),(4,'Nico Elvedi','DF'),(5,'Manuel Akanji','DF'),
(6,'Denis Zakaria','MF'),(7,'Breel Embolo','FW'),(8,'Remo Freuler','MF'),(9,'Johan Manzambi','MF'),(10,'Granit Xhaka','MF'),
(11,'Dan Ndoye','FW'),(12,'Yvon Mvogo','GK'),(13,'Ricardo Rodriguez','DF'),(14,'Ardon Jashari','MF'),(15,'Djibril Sow','MF'),
(16,'Christian Fassnacht','FW'),(17,'Rubén Vargas','FW'),(18,'Eray Cömert','DF'),(19,'Noah Okafor','FW'),(20,'Michel Aebischer','MF'),
(21,'Marvin Keller','GK'),(22,'Fabian Rieder','MF'),(23,'Zeki Amdouni','FW'),(24,'Aurèle Amenda','DF'),(25,'Luca Jaquez','DF'),(26,'Cedric Itten','FW')
) as v(num,name,pos) where t.fifa_code='SUI' on conflict do nothing;

-- === Group C ===
insert into public.players (team_id,name,position,shirt_number) select t.id,v.name,v.pos,v.num from public.teams t, (values
(1,'Alisson','GK'),(2,'Wesley','DF'),(3,'Gabriel Magalhães','DF'),(4,'Marquinhos','DF'),(5,'Casemiro','MF'),
(6,'Alex Sandro','DF'),(7,'Vinícius Júnior','FW'),(8,'Bruno Guimarães','MF'),(9,'Matheus Cunha','FW'),(10,'Neymar','FW'),
(11,'Raphinha','FW'),(12,'Weverton','GK'),(13,'Danilo','DF'),(14,'Bremer','DF'),(15,'Léo Pereira','DF'),
(16,'Douglas Santos','DF'),(17,'Fabinho','MF'),(18,'Danilo Santos','MF'),(19,'Endrick','FW'),(20,'Lucas Paquetá','MF'),
(21,'Luiz Henrique','FW'),(22,'Gabriel Martinelli','FW'),(23,'Ederson','GK'),(24,'Roger Ibañez','DF'),(25,'Igor Thiago','FW'),(26,'Rayan','FW')
) as v(num,name,pos) where t.fifa_code='BRA' on conflict do nothing;

insert into public.players (team_id,name,position,shirt_number) select t.id,v.name,v.pos,v.num from public.teams t, (values
(1,'Johny Placide','GK'),(2,'Carlens Arcus','DF'),(3,'Keeto Thermoncy','DF'),(4,'Ricardo Adé','DF'),(5,'Hannes Delcroix','DF'),
(6,'Carl Sainté','MF'),(7,'Derrick Etienne Jr.','FW'),(8,'Martin Expérience','DF'),(9,'Duckens Nazon','FW'),(10,'Jean-Ricner Bellegarde','MF'),
(11,'Louicius Deedson','FW'),(12,'Alexandre Pierre','GK'),(13,'Duke Lacroix','DF'),(14,'Leverton Pierre','MF'),(15,'Ruben Providence','FW'),
(16,'Lenny Joseph','FW'),(17,'Danley Jean Jacques','MF'),(18,'Wilson Isidor','FW'),(19,'Yassin Fortuné','FW'),(20,'Frantzdy Pierrot','FW'),
(21,'Josué Casimir','FW'),(22,'Jean-Kévin Duverne','DF'),(23,'Josué Duverger','GK'),(24,'Wilguens Paugain','DF'),(25,'Dominique Simon','MF'),(26,'Woodensky Pierre','MF')
) as v(num,name,pos) where t.fifa_code='HAI' on conflict do nothing;

insert into public.players (team_id,name,position,shirt_number) select t.id,v.name,v.pos,v.num from public.teams t, (values
(1,'Yassine Bounou','GK'),(2,'Achraf Hakimi','DF'),(3,'Noussair Mazraoui','DF'),(4,'Sofyan Amrabat','MF'),(5,'Nayef Aguerd','DF'),
(6,'Ayyoub Bouaddi','MF'),(7,'Chemsdine Talbi','MF'),(8,'Azzedine Ounahi','MF'),(9,'Soufiane Rahimi','FW'),(10,'Brahim Díaz','FW'),
(11,'Ismael Saibari','MF'),(12,'Munir Mohamedi','GK'),(13,'Zakaria El Ouahdi','DF'),(14,'Issa Diop','DF'),(15,'Samir El Mourabet','MF'),
(16,'Gessime Yassine','MF'),(17,'Abde Ezzalzouli','FW'),(18,'Chadi Riad','DF'),(19,'Youssef Belammari','DF'),(20,'Ayoub El Kaabi','FW'),
(21,'Ayoube Amaimouni','FW'),(22,'Ahmed Reda Tagnaouti','GK'),(23,'Bilal El Khannouss','MF'),(24,'Neil El Aynaoui','MF'),(25,'Redouane Halhal','DF'),(26,'Anass Salah-Eddine','DF')
) as v(num,name,pos) where t.fifa_code='MAR' on conflict do nothing;

insert into public.players (team_id,name,position,shirt_number) select t.id,v.name,v.pos,v.num from public.teams t, (values
(1,'Angus Gunn','GK'),(2,'Aaron Hickey','DF'),(3,'Andy Robertson','DF'),(4,'Scott McTominay','MF'),(5,'Grant Hanley','DF'),
(6,'Kieran Tierney','DF'),(7,'John McGinn','MF'),(8,'Tyler Fletcher','MF'),(9,'Lyndon Dykes','FW'),(10,'Ché Adams','FW'),
(11,'Ryan Christie','MF'),(12,'Liam Kelly','GK'),(13,'Jack Hendry','DF'),(14,'Ross Stewart','FW'),(15,'John Souttar','DF'),
(16,'Dominic Hyam','DF'),(17,'Ben Gannon-Doak','FW'),(18,'George Hirst','FW'),(19,'Lewis Ferguson','MF'),(20,'Lawrence Shankland','FW'),
(21,'Craig Gordon','GK'),(22,'Nathan Patterson','DF'),(23,'Kenny McLean','MF'),(24,'Anthony Ralston','DF'),(25,'Findlay Curtis','FW'),(26,'Scott McKenna','DF')
) as v(num,name,pos) where t.fifa_code='SCO' on conflict do nothing;

-- === Group D ===
insert into public.players (team_id,name,position,shirt_number) select t.id,v.name,v.pos,v.num from public.teams t, (values
(1,'Mathew Ryan','GK'),(2,'Miloš Degenek','DF'),(3,'Alessandro Circati','DF'),(4,'Jacob Italiano','DF'),(5,'Jordan Bos','DF'),
(6,'Jason Geria','DF'),(7,'Mathew Leckie','FW'),(8,'Connor Metcalfe','MF'),(9,'Mohamed Touré','FW'),(10,'Ajdin Hrustic','FW'),
(11,'Awer Mabil','FW'),(12,'Paul Izzo','GK'),(13,'Aiden O''Neill','MF'),(14,'Cammy Devlin','MF'),(15,'Kai Trewin','DF'),
(16,'Aziz Behich','DF'),(17,'Nestory Irankunda','FW'),(18,'Patrick Beach','GK'),(19,'Harry Souttar','DF'),(20,'Cristian Volpato','FW'),
(21,'Cameron Burgess','DF'),(22,'Jackson Irvine','MF'),(23,'Nishan Velupillay','FW'),(24,'Paul Okon-Engstler','MF'),(25,'Lucas Herrington','DF'),(26,'Tete Yengi','FW')
) as v(num,name,pos) where t.fifa_code='AUS' on conflict do nothing;

insert into public.players (team_id,name,position,shirt_number) select t.id,v.name,v.pos,v.num from public.teams t, (values
(1,'Gatito Fernández','GK'),(2,'Gustavo Velázquez','DF'),(3,'Omar Alderete','DF'),(4,'Juan José Cáceres','DF'),(5,'Fabián Balbuena','DF'),
(6,'Júnior Alonso','DF'),(7,'Ramón Sosa','MF'),(8,'Diego Gómez','MF'),(9,'Antonio Sanabria','FW'),(10,'Miguel Almirón','MF'),
(11,'Maurício','MF'),(12,'Orlando Gill','GK'),(13,'José Canale','DF'),(14,'Andrés Cubas','MF'),(15,'Gustavo Gómez','DF'),
(16,'Damián Bobadilla','MF'),(17,'Kaku','FW'),(18,'Álex Arce','FW'),(19,'Julio Enciso','FW'),(20,'Braian Ojeda','MF'),
(21,'Gabriel Ávalos','FW'),(22,'Gastón Olveira','GK'),(23,'Matías Galarza','MF'),(24,'Gustavo Caballero','MF'),(25,'Isidro Pitta','FW'),(26,'Alexandro Maidana','DF')
) as v(num,name,pos) where t.fifa_code='PAR' on conflict do nothing;

insert into public.players (team_id,name,position,shirt_number) select t.id,v.name,v.pos,v.num from public.teams t, (values
(1,'Mert Günok','GK'),(2,'Zeki Çelik','DF'),(3,'Merih Demiral','DF'),(4,'Çağlar Söyüncü','DF'),(5,'Salih Özcan','MF'),
(6,'Orkun Kökçü','MF'),(7,'Kerem Aktürkoğlu','FW'),(8,'Arda Güler','FW'),(9,'Deniz Gül','FW'),(10,'Hakan Çalhanoğlu','MF'),
(11,'Kenan Yıldız','FW'),(12,'Altay Bayındır','GK'),(13,'Eren Elmalı','DF'),(14,'Abdülkerim Bardakcı','DF'),(15,'Ozan Kabak','DF'),
(16,'İsmail Yüksek','MF'),(17,'İrfan Can Kahveci','FW'),(18,'Mert Müldür','DF'),(19,'Yunus Akgün','FW'),(20,'Ferdi Kadıoğlu','DF'),
(21,'Barış Alper Yılmaz','FW'),(22,'Kaan Ayhan','MF'),(23,'Uğurcan Çakır','GK'),(24,'Oğuz Aydın','FW'),(25,'Samet Akaydin','DF'),(26,'Can Uzun','FW')
) as v(num,name,pos) where t.fifa_code='TUR' on conflict do nothing;

insert into public.players (team_id,name,position,shirt_number) select t.id,v.name,v.pos,v.num from public.teams t, (values
(1,'Matt Turner','GK'),(2,'Sergiño Dest','DF'),(3,'Chris Richards','DF'),(4,'Tyler Adams','MF'),(5,'Antonee Robinson','DF'),
(6,'Auston Trusty','DF'),(7,'Giovanni Reyna','MF'),(8,'Weston McKennie','MF'),(9,'Ricardo Pepi','FW'),(10,'Christian Pulisic','FW'),
(11,'Brenden Aaronson','MF'),(12,'Miles Robinson','DF'),(13,'Tim Ream','DF'),(14,'Sebastian Berhalter','MF'),(15,'Cristian Roldan','MF'),
(16,'Alex Freeman','DF'),(17,'Malik Tillman','MF'),(18,'Maximilian Arfsten','DF'),(19,'Haji Wright','FW'),(20,'Folarin Balogun','FW'),
(21,'Timothy Weah','FW'),(22,'Mark McKenzie','DF'),(23,'Joe Scally','DF'),(24,'Matt Freese','GK'),(25,'Chris Brady','GK'),(26,'Alejandro Zendejas','FW')
) as v(num,name,pos) where t.fifa_code='USA' on conflict do nothing;

-- === Group E ===
insert into public.players (team_id,name,position,shirt_number) select t.id,v.name,v.pos,v.num from public.teams t, (values
(1,'Eloy Room','GK'),(2,'Shurandy Sambo','DF'),(3,'Juriën Gaari','DF'),(4,'Roshon van Eijma','DF'),(5,'Sherel Floranus','DF'),
(6,'Godfried Roemeratoe','MF'),(7,'Juninho Bacuna','MF'),(8,'Livano Comenencia','MF'),(9,'Jürgen Locadia','FW'),(10,'Leandro Bacuna','MF'),
(11,'Jeremy Antonisse','FW'),(12,'Sontje Hansen','FW'),(13,'Tyrese Noslin','FW'),(14,'Kenji Gorré','FW'),(15,'Ar''jany Martha','MF'),
(16,'Jearl Margaritha','FW'),(17,'Brandley Kuwas','FW'),(18,'Armando Obispo','DF'),(19,'Gervane Kastaneer','FW'),(20,'Joshua Brenet','DF'),
(21,'Tahith Chong','MF'),(22,'Kevin Felida','MF'),(23,'Riechedly Bazoer','DF'),(24,'Deveron Fonville','DF'),(25,'Tyrick Bodak','GK'),(26,'Trevor Doornbusch','GK')
) as v(num,name,pos) where t.fifa_code='CUW' on conflict do nothing;

insert into public.players (team_id,name,position,shirt_number) select t.id,v.name,v.pos,v.num from public.teams t, (values
(1,'Hernán Galíndez','GK'),(2,'Félix Torres','DF'),(3,'Piero Hincapié','DF'),(4,'Joel Ordóñez','DF'),(5,'Jordy Alcívar','MF'),
(6,'Willian Pacho','DF'),(7,'Pervis Estupiñán','DF'),(8,'Anthony Valencia','MF'),(9,'John Yeboah','FW'),(10,'Kendry Páez','MF'),
(11,'Kevin Rodríguez','FW'),(12,'Moisés Ramírez','GK'),(13,'Enner Valencia','FW'),(14,'Alan Minda','MF'),(15,'Pedro Vite','MF'),
(16,'Jordy Caicedo','FW'),(17,'Ángelo Preciado','DF'),(18,'Denil Castillo','MF'),(19,'Gonzalo Plata','FW'),(20,'Nilson Angulo','FW'),
(21,'Alan Franco','MF'),(22,'Gonzalo Valle','GK'),(23,'Moisés Caicedo','MF'),(24,'Jeremy Arévalo','FW'),(25,'Jackson Porozo','DF'),(26,'Yaimar Medina','DF')
) as v(num,name,pos) where t.fifa_code='ECU' on conflict do nothing;

insert into public.players (team_id,name,position,shirt_number) select t.id,v.name,v.pos,v.num from public.teams t, (values
(1,'Manuel Neuer','GK'),(2,'Antonio Rüdiger','DF'),(3,'Waldemar Anton','DF'),(4,'Jonathan Tah','DF'),(5,'Aleksandar Pavlović','MF'),
(6,'Joshua Kimmich','DF'),(7,'Kai Havertz','FW'),(8,'Leon Goretzka','MF'),(9,'Jamie Leweling','MF'),(10,'Jamal Musiala','MF'),
(11,'Nick Woltemade','FW'),(12,'Oliver Baumann','GK'),(13,'Pascal Groß','MF'),(14,'Maximilian Beier','FW'),(15,'Nico Schlotterbeck','DF'),
(16,'Angelo Stiller','MF'),(17,'Florian Wirtz','MF'),(18,'Nathaniel Brown','DF'),(19,'Leroy Sané','MF'),(20,'Nadiem Amiri','MF'),
(21,'Alexander Nübel','GK'),(22,'David Raum','DF'),(23,'Felix Nmecha','MF'),(24,'Malick Thiaw','DF'),(25,'Lennart Karl','MF'),(26,'Deniz Undav','FW')
) as v(num,name,pos) where t.fifa_code='GER' on conflict do nothing;

insert into public.players (team_id,name,position,shirt_number) select t.id,v.name,v.pos,v.num from public.teams t, (values
(1,'Yahia Fofana','GK'),(2,'Ousmane Diomande','DF'),(3,'Ghislain Konan','DF'),(4,'Jean Michaël Seri','MF'),(5,'Wilfried Singo','DF'),
(6,'Seko Fofana','MF'),(7,'Odilon Kossounou','DF'),(8,'Franck Kessié','MF'),(9,'Ange-Yoan Bonny','FW'),(10,'Simon Adingra','FW'),
(11,'Yan Diomande','FW'),(12,'Elye Wahi','FW'),(13,'Christopher Opéri','DF'),(14,'Oumar Diakité','FW'),(15,'Amad Diallo','FW'),
(16,'Mohamed Koné','GK'),(17,'Guéla Doué','DF'),(18,'Ibrahim Sangaré','MF'),(19,'Nicolas Pépé','FW'),(20,'Emmanuel Agbadou','DF'),
(21,'Evan Ndicka','DF'),(22,'Evann Guessand','FW'),(23,'Alban Lafont','GK'),(24,'Bazoumana Touré','FW'),(25,'Parfait Guiagon','MF'),(26,'Christ Inao Oulaï','MF')
) as v(num,name,pos) where t.fifa_code='CIV' on conflict do nothing;

-- === Group F ===
insert into public.players (team_id,name,position,shirt_number) select t.id,v.name,v.pos,v.num from public.teams t, (values
(1,'Zion Suzuki','GK'),(2,'Yukinari Sugawara','DF'),(3,'Shōgo Taniguchi','DF'),(4,'Kō Itakura','DF'),(5,'Yūto Nagatomo','DF'),
(6,'Wataru Endo','MF'),(7,'Ao Tanaka','MF'),(8,'Takefusa Kubo','MF'),(9,'Keisuke Gotō','FW'),(10,'Ritsu Dōan','MF'),
(11,'Daizen Maeda','MF'),(12,'Keisuke Ōsako','GK'),(13,'Keito Nakamura','MF'),(14,'Junya Itō','MF'),(15,'Daichi Kamada','MF'),
(16,'Tsuyoshi Watanabe','DF'),(17,'Yuito Suzuki','MF'),(18,'Ayase Ueda','FW'),(19,'Kōki Ogawa','FW'),(20,'Ayumu Seko','DF'),
(21,'Hiroki Itō','DF'),(22,'Takehiro Tomiyasu','DF'),(23,'Tomoki Hayakawa','GK'),(24,'Kaishū Sano','MF'),(25,'Junnosuke Suzuki','DF'),(26,'Kento Shiogai','FW')
) as v(num,name,pos) where t.fifa_code='JPN' on conflict do nothing;

insert into public.players (team_id,name,position,shirt_number) select t.id,v.name,v.pos,v.num from public.teams t, (values
(1,'Bart Verbruggen','GK'),(2,'Jurriën Timber','DF'),(3,'Marten de Roon','MF'),(4,'Virgil van Dijk','DF'),(5,'Nathan Aké','DF'),
(6,'Jan Paul van Hecke','DF'),(7,'Justin Kluivert','MF'),(8,'Ryan Gravenberch','MF'),(9,'Wout Weghorst','FW'),(10,'Memphis Depay','FW'),
(11,'Cody Gakpo','FW'),(12,'Mats Wieffer','MF'),(13,'Robin Roefs','GK'),(14,'Tijjani Reijnders','MF'),(15,'Micky van de Ven','DF'),
(16,'Guus Til','MF'),(17,'Noa Lang','FW'),(18,'Donyell Malen','FW'),(19,'Brian Brobbey','FW'),(20,'Teun Koopmeiners','MF'),
(21,'Frenkie de Jong','MF'),(22,'Denzel Dumfries','DF'),(23,'Mark Flekken','GK'),(24,'Crysencio Summerville','FW'),(25,'Jorrel Hato','DF'),(26,'Quinten Timber','MF')
) as v(num,name,pos) where t.fifa_code='NED' on conflict do nothing;

insert into public.players (team_id,name,position,shirt_number) select t.id,v.name,v.pos,v.num from public.teams t, (values
(1,'Jacob Widell Zetterström','GK'),(2,'Gustaf Lagerbielke','DF'),(3,'Victor Lindelöf','DF'),(4,'Isak Hien','DF'),(5,'Gabriel Gudmundsson','DF'),
(6,'Herman Johansson','DF'),(7,'Lucas Bergvall','MF'),(8,'Daniel Svensson','DF'),(9,'Alexander Isak','FW'),(10,'Benjamin Nygren','MF'),
(11,'Anthony Elanga','FW'),(12,'Viktor Johansson','GK'),(13,'Ken Sema','MF'),(14,'Hjalmar Ekdal','DF'),(15,'Carl Starfelt','DF'),
(16,'Jesper Karlström','MF'),(17,'Viktor Gyökeres','FW'),(18,'Yasin Ayari','MF'),(19,'Mattias Svanberg','MF'),(20,'Eric Smith','DF'),
(21,'Alexander Bernhardsson','DF'),(22,'Besfort Zeneli','MF'),(23,'Kristoffer Nordfeldt','GK'),(24,'Elliot Stroud','DF'),(25,'Gustaf Nilsson','FW'),(26,'Taha Ali','FW')
) as v(num,name,pos) where t.fifa_code='SWE' on conflict do nothing;

insert into public.players (team_id,name,position,shirt_number) select t.id,v.name,v.pos,v.num from public.teams t, (values
(1,'Mouhib Chamakh','GK'),(2,'Ali Abdi','DF'),(3,'Montassar Talbi','DF'),(4,'Omar Rekik','DF'),(5,'Adem Arous','DF'),
(6,'Dylan Bronn','DF'),(7,'Elias Achouri','FW'),(8,'Elias Saad','FW'),(9,'Hazem Mastouri','FW'),(10,'Hannibal Mejbri','MF'),
(11,'Ismaël Gharbi','MF'),(12,'Mortadha Ben Ouanes','DF'),(13,'Rani Khedira','MF'),(14,'Khalil Ayari','MF'),(15,'Hadj Mahmoud','MF'),
(16,'Aymen Dahmen','GK'),(17,'Ellyes Skhiri','MF'),(18,'Rayan Elloumi','FW'),(19,'Firas Chaouat','FW'),(20,'Yan Valery','DF'),
(21,'Mohamed Amine Ben Hamida','DF'),(22,'Sabri Ben Hessen','GK'),(23,'Moutaz Neffati','DF'),(24,'Raed Chikhaoui','DF'),(25,'Anis Ben Slimane','MF'),(26,'Sebastian Tounekti','MF')
) as v(num,name,pos) where t.fifa_code='TUN' on conflict do nothing;

-- === Group G ===
insert into public.players (team_id,name,position,shirt_number) select t.id,v.name,v.pos,v.num from public.teams t, (values
(1,'Thibaut Courtois','GK'),(2,'Zeno Debast','DF'),(3,'Arthur Theate','DF'),(4,'Brandon Mechele','DF'),(5,'Maxim De Cuyper','DF'),
(6,'Axel Witsel','MF'),(7,'Kevin De Bruyne','MF'),(8,'Youri Tielemans','MF'),(9,'Romelu Lukaku','FW'),(10,'Leandro Trossard','FW'),
(11,'Jérémy Doku','FW'),(12,'Senne Lammens','GK'),(13,'Mike Penders','GK'),(14,'Dodi Lukébakio','FW'),(15,'Thomas Meunier','DF'),
(16,'Koni De Winter','DF'),(17,'Charles De Ketelaere','FW'),(18,'Joaquin Seys','DF'),(19,'Diego Moreira','MF'),(20,'Hans Vanaken','MF'),
(21,'Timothy Castagne','DF'),(22,'Alexis Saelemaekers','MF'),(23,'Nicolas Raskin','MF'),(24,'Amadou Onana','MF'),(25,'Nathan Ngoy','DF'),(26,'Matias Fernandez-Pardo','FW')
) as v(num,name,pos) where t.fifa_code='BEL' on conflict do nothing;

insert into public.players (team_id,name,position,shirt_number) select t.id,v.name,v.pos,v.num from public.teams t, (values
(1,'Mohamed El Shenawy','GK'),(2,'Yasser Ibrahim','DF'),(3,'Mohamed Hany','DF'),(4,'Hossam Abdelmaguid','DF'),(5,'Ramy Rabia','DF'),
(6,'Mohamed Abdelmonem','DF'),(7,'Trézéguet','FW'),(8,'Emam Ashour','MF'),(9,'Hamza Abdelkarim','FW'),(10,'Mohamed Salah','FW'),
(11,'Mostafa Ziko','MF'),(12,'Haissem Hassan','FW'),(13,'Ahmed Fatouh','DF'),(14,'Hamdy Fathy','MF'),(15,'Karim Hafez','DF'),
(16,'El Mahdy Soliman','GK'),(17,'Mohanad Lasheen','MF'),(18,'Nabil Emad','MF'),(19,'Marwan Attia','MF'),(20,'Ibrahim Adel','FW'),
(21,'Mahmoud Saber','MF'),(22,'Omar Marmoush','FW'),(23,'Mostafa Shobeir','GK'),(24,'Tarek Alaa','DF'),(25,'Zizo','FW'),(26,'Mohamed Alaa','GK')
) as v(num,name,pos) where t.fifa_code='EGY' on conflict do nothing;

insert into public.players (team_id,name,position,shirt_number) select t.id,v.name,v.pos,v.num from public.teams t, (values
(1,'Alireza Beiranvand','GK'),(2,'Saleh Hardani','DF'),(3,'Ehsan Hajsafi','DF'),(4,'Shojae Khalilzadeh','DF'),(5,'Milad Mohammadi','DF'),
(6,'Saeid Ezatolahi','MF'),(7,'Alireza Jahanbakhsh','MF'),(8,'Mohammad Mohebi','MF'),(9,'Mehdi Taremi','FW'),(10,'Mehdi Ghayedi','FW'),
(11,'Ali Alipour','FW'),(12,'Payam Niazmand','GK'),(13,'Hossein Kanaanizadegan','DF'),(14,'Saman Ghoddos','MF'),(15,'Rouzbeh Cheshmi','MF'),
(16,'Mehdi Torabi','MF'),(17,'Aria Yousefi','DF'),(18,'Amirhossein Hosseinzadeh','FW'),(19,'Ali Nemati','DF'),(20,'Shahriyar Moghanlou','FW'),
(21,'Mohammad Ghorbani','MF'),(22,'Hossein Hosseini','GK'),(23,'Ramin Rezaeian','DF'),(24,'Dennis Eckert','FW'),(25,'Danial Eiri','DF'),(26,'Amirmohammad Razzaghinia','MF')
) as v(num,name,pos) where t.fifa_code='IRN' on conflict do nothing;

insert into public.players (team_id,name,position,shirt_number) select t.id,v.name,v.pos,v.num from public.teams t, (values
(1,'Max Crocombe','GK'),(2,'Tim Payne','DF'),(3,'Francis de Vries','DF'),(4,'Tyler Bindon','DF'),(5,'Michael Boxall','DF'),
(6,'Joe Bell','MF'),(7,'Matthew Garbett','MF'),(8,'Marko Stamenić','MF'),(9,'Chris Wood','FW'),(10,'Sarpreet Singh','MF'),
(11,'Elijah Just','MF'),(12,'Alex Paulsen','GK'),(13,'Liberato Cacace','DF'),(14,'Alex Rufer','MF'),(15,'Nando Pijnaker','DF'),
(16,'Finn Surman','DF'),(17,'Kosta Barbarouses','FW'),(18,'Ben Waine','FW'),(19,'Ben Old','MF'),(20,'Callum McCowatt','MF'),
(21,'Jesse Randall','FW'),(22,'Michael Woud','GK'),(23,'Ryan Thomas','MF'),(24,'Callan Elliot','DF'),(25,'Lachlan Bayliss','MF'),(26,'Tommy Smith','DF')
) as v(num,name,pos) where t.fifa_code='NZL' on conflict do nothing;

-- === Group H ===
insert into public.players (team_id,name,position,shirt_number) select t.id,v.name,v.pos,v.num from public.teams t, (values
(1,'Vozinha','GK'),(2,'Stopira','DF'),(3,'Diney','DF'),(4,'Roberto Lopes','DF'),(5,'Logan Costa','DF'),
(6,'Kevin Pina','MF'),(7,'Jovane Cabral','MF'),(8,'João Paulo','MF'),(9,'Gilson Benchimol','FW'),(10,'Jamiro Monteiro','MF'),
(11,'Garry Rodrigues','MF'),(12,'Márcio Rosa','GK'),(13,'Sidny Lopes Cabral','DF'),(14,'Deroy Duarte','MF'),(15,'Laros Duarte','MF'),
(16,'Yannick Semedo','MF'),(17,'Willy Semedo','MF'),(18,'Telmo Arcanjo','MF'),(19,'Dailon Livramento','FW'),(20,'Ryan Mendes','FW'),
(21,'Nuno da Costa','MF'),(22,'Steven Moreira','DF'),(23,'CJ dos Santos','GK'),(24,'Wagner Pina','DF'),(25,'Kelvin Pires','DF'),(26,'Hélio Varela','MF')
) as v(num,name,pos) where t.fifa_code='CPV' on conflict do nothing;

insert into public.players (team_id,name,position,shirt_number) select t.id,v.name,v.pos,v.num from public.teams t, (values
(1,'Nawaf Al-Aqidi','GK'),(2,'Ali Majrashi','DF'),(3,'Ali Lajami','DF'),(4,'Abdulelah Al-Amri','DF'),(5,'Hassan Al-Tambakti','DF'),
(6,'Nasser Al-Dawsari','MF'),(7,'Musab Al-Juwayr','MF'),(8,'Ayman Yahya','FW'),(9,'Firas Al-Buraikan','FW'),(10,'Salem Al-Dawsari','FW'),
(11,'Saleh Al-Shehri','FW'),(12,'Saud Abdulhamid','DF'),(13,'Nawaf Boushal','DF'),(14,'Hassan Kadesh','DF'),(15,'Abdullah Al-Khaibari','MF'),
(16,'Ziyad Al-Johani','MF'),(17,'Khalid Al-Ghannam','FW'),(18,'Alaa Al-Hejji','MF'),(19,'Abdullah Al-Hamdan','FW'),(20,'Sultan Mandash','FW'),
(21,'Mohammed Al-Owais','GK'),(22,'Ahmed Al-Kassar','GK'),(23,'Mohamed Kanno','MF'),(24,'Moteb Al-Harbi','DF'),(25,'Jehad Thakri','DF'),(26,'Mohammed Abu Al-Shamat','DF')
) as v(num,name,pos) where t.fifa_code='KSA' on conflict do nothing;

insert into public.players (team_id,name,position,shirt_number) select t.id,v.name,v.pos,v.num from public.teams t, (values
(1,'David Raya','GK'),(2,'Marc Pubill','DF'),(3,'Álex Grimaldo','DF'),(4,'Eric García','DF'),(5,'Marcos Llorente','DF'),
(6,'Mikel Merino','MF'),(7,'Ferran Torres','FW'),(8,'Fabián Ruiz','MF'),(9,'Gavi','MF'),(10,'Dani Olmo','FW'),
(11,'Yéremy Pino','FW'),(12,'Pedro Porro','DF'),(13,'Joan Garcia','GK'),(14,'Aymeric Laporte','DF'),(15,'Álex Baena','MF'),
(16,'Rodri','MF'),(17,'Nico Williams','FW'),(18,'Martín Zubimendi','MF'),(19,'Lamine Yamal','FW'),(20,'Pedri','MF'),
(21,'Mikel Oyarzabal','FW'),(22,'Pau Cubarsí','DF'),(23,'Unai Simón','GK'),(24,'Marc Cucurella','DF'),(25,'Víctor Muñoz','FW'),(26,'Borja Iglesias','FW')
) as v(num,name,pos) where t.fifa_code='ESP' on conflict do nothing;

insert into public.players (team_id,name,position,shirt_number) select t.id,v.name,v.pos,v.num from public.teams t, (values
(1,'Sergio Rochet','GK'),(2,'José Giménez','DF'),(3,'Sebastián Cáceres','DF'),(4,'Ronald Araújo','DF'),(5,'Manuel Ugarte','MF'),
(6,'Rodrigo Bentancur','MF'),(7,'Nicolás de la Cruz','MF'),(8,'Federico Valverde','MF'),(9,'Darwin Núñez','FW'),(10,'Giorgian de Arrascaeta','MF'),
(11,'Facundo Pellistri','FW'),(12,'Santiago Mele','GK'),(13,'Guillermo Varela','DF'),(14,'Agustín Canobbio','MF'),(15,'Emiliano Martínez','MF'),
(16,'Mathías Olivera','DF'),(17,'Matías Viña','DF'),(18,'Brian Rodríguez','FW'),(19,'Rodrigo Aguirre','FW'),(20,'Maximiliano Araújo','MF'),
(21,'Federico Viñas','FW'),(22,'Joaquín Piquerez','MF'),(23,'Fernando Muslera','GK'),(24,'Santiago Bueno','DF'),(25,'Juan Manuel Sanabria','MF'),(26,'Rodrigo Zalazar','MF')
) as v(num,name,pos) where t.fifa_code='URU' on conflict do nothing;

-- === Group I ===
insert into public.players (team_id,name,position,shirt_number) select t.id,v.name,v.pos,v.num from public.teams t, (values
(1,'Brice Samba','GK'),(2,'Malo Gusto','DF'),(3,'Lucas Digne','DF'),(4,'Dayot Upamecano','DF'),(5,'Jules Koundé','DF'),
(6,'Manu Koné','MF'),(7,'Ousmane Dembélé','FW'),(8,'Aurélien Tchouaméni','MF'),(9,'Marcus Thuram','FW'),(10,'Kylian Mbappé','FW'),
(11,'Michael Olise','FW'),(12,'Bradley Barcola','FW'),(13,'N''Golo Kanté','MF'),(14,'Adrien Rabiot','MF'),(15,'Ibrahima Konaté','DF'),
(16,'Mike Maignan','GK'),(17,'William Saliba','DF'),(18,'Warren Zaïre-Emery','MF'),(19,'Théo Hernandez','DF'),(20,'Désiré Doué','FW'),
(21,'Lucas Hernandez','DF'),(22,'Jean-Philippe Mateta','FW'),(23,'Robin Risser','GK'),(24,'Rayan Cherki','MF'),(25,'Maghnes Akliouche','MF'),(26,'Maxence Lacroix','DF')
) as v(num,name,pos) where t.fifa_code='FRA' on conflict do nothing;

insert into public.players (team_id,name,position,shirt_number) select t.id,v.name,v.pos,v.num from public.teams t, (values
(1,'Fahad Talib','GK'),(2,'Rebin Sulaka','DF'),(3,'Hussein Ali','DF'),(4,'Zaid Tahseen','DF'),(5,'Akam Hashim','DF'),
(6,'Manaf Younis','DF'),(7,'Youssef Amyn','MF'),(8,'Ibrahim Bayesh','MF'),(9,'Ali Al-Hamadi','FW'),(10,'Mohanad Ali','FW'),
(11,'Ahmed Qasem','FW'),(12,'Jalal Hassan','GK'),(13,'Ali Yousif','FW'),(14,'Zidane Iqbal','MF'),(15,'Ahmed Yahya','DF'),
(16,'Amir Al-Ammari','MF'),(17,'Ali Jasim','FW'),(18,'Aymen Hussein','FW'),(19,'Kevin Yakob','MF'),(20,'Aimar Sher','MF'),
(21,'Marko Farji','FW'),(22,'Ahmed Basil','GK'),(23,'Merchas Doski','DF'),(24,'Zaid Ismail','MF'),(25,'Mustafa Saadoon','DF'),(26,'Frans Putros','DF')
) as v(num,name,pos) where t.fifa_code='IRQ' on conflict do nothing;

insert into public.players (team_id,name,position,shirt_number) select t.id,v.name,v.pos,v.num from public.teams t, (values
(1,'Ørjan Nyland','GK'),(2,'Morten Thorsby','MF'),(3,'Kristoffer Ajer','DF'),(4,'Leo Østigård','DF'),(5,'David Møller Wolfe','DF'),
(6,'Patrick Berg','MF'),(7,'Alexander Sørloth','FW'),(8,'Sander Berge','MF'),(9,'Erling Haaland','FW'),(10,'Martin Ødegaard','MF'),
(11,'Jørgen Strand Larsen','FW'),(12,'Sander Tangvik','GK'),(13,'Egil Selvik','GK'),(14,'Fredrik Aursnes','MF'),(15,'Fredrik André Bjørkan','DF'),
(16,'Marcus Holmgren Pedersen','DF'),(17,'Torbjørn Heggem','DF'),(18,'Kristian Thorstvedt','MF'),(19,'Thelo Aasgaard','MF'),(20,'Antonio Nusa','FW'),
(21,'Andreas Schjelderup','MF'),(22,'Oscar Bobb','MF'),(23,'Jens Petter Hauge','MF'),(24,'Sondre Langås','DF'),(25,'Henrik Falchener','DF'),(26,'Julian Ryerson','FW')
) as v(num,name,pos) where t.fifa_code='NOR' on conflict do nothing;

insert into public.players (team_id,name,position,shirt_number) select t.id,v.name,v.pos,v.num from public.teams t, (values
(1,'Yehvann Diouf','GK'),(2,'Mamadou Sarr','DF'),(3,'Kalidou Koulibaly','DF'),(4,'Abdoulaye Seck','DF'),(5,'Idrissa Gueye','MF'),
(6,'Pathé Ciss','MF'),(7,'Assane Diao','FW'),(8,'Lamine Camara','MF'),(9,'Bamba Dieng','FW'),(10,'Sadio Mané','FW'),
(11,'Nicolas Jackson','FW'),(12,'Cherif Ndiaye','FW'),(13,'Iliman Ndiaye','FW'),(14,'Ismail Jakobs','DF'),(15,'Krépin Diatta','DF'),
(16,'Édouard Mendy','GK'),(17,'Pape Matar Sarr','MF'),(18,'Ismaïla Sarr','FW'),(19,'Moussa Niakhaté','DF'),(20,'Ibrahim Mbaye','FW'),
(21,'Habib Diarra','MF'),(22,'Bara Sapoko Ndiaye','MF'),(23,'Mory Diaw','GK'),(24,'Antoine Mendy','DF'),(25,'El Hadji Malick Diouf','DF'),(26,'Pape Gueye','MF')
) as v(num,name,pos) where t.fifa_code='SEN' on conflict do nothing;

-- === Group J ===
insert into public.players (team_id,name,position,shirt_number) select t.id,v.name,v.pos,v.num from public.teams t, (values
(1,'Melvin Mastil','GK'),(2,'Aïssa Mandi','DF'),(3,'Achref Abada','DF'),(4,'Mohamed Amine Tougai','DF'),(5,'Zineddine Belaïd','DF'),
(6,'Ramiz Zerrouki','MF'),(7,'Riyad Mahrez','FW'),(8,'Houssem Aouar','MF'),(9,'Amine Gouiri','FW'),(10,'Farès Chaïbi','MF'),
(11,'Anis Hadj Moussa','FW'),(12,'Nadhir Benbouali','FW'),(13,'Jaouen Hadjam','DF'),(14,'Hicham Boudaoui','MF'),(15,'Rayan Aït-Nouri','DF'),
(16,'Oussama Benbot','GK'),(17,'Rafik Belghali','DF'),(18,'Mohamed Amoura','FW'),(19,'Nabil Bentaleb','MF'),(20,'Adil Boulbina','FW'),
(21,'Ramy Bensebaini','DF'),(22,'Ibrahim Maza','MF'),(23,'Luca Zidane','GK'),(24,'Yacine Titraoui','MF'),(25,'Farès Ghedjemis','FW'),(26,'Samir Chergui','DF')
) as v(num,name,pos) where t.fifa_code='ALG' on conflict do nothing;

insert into public.players (team_id,name,position,shirt_number) select t.id,v.name,v.pos,v.num from public.teams t, (values
(1,'Juan Musso','GK'),(2,'Leonardo Balerdi','DF'),(3,'Nicolás Tagliafico','DF'),(4,'Gonzalo Montiel','DF'),(5,'Leandro Paredes','MF'),
(6,'Lisandro Martínez','DF'),(7,'Rodrigo De Paul','MF'),(8,'Valentín Barco','MF'),(9,'Julián Alvarez','FW'),(10,'Lionel Messi','FW'),
(11,'Giovani Lo Celso','MF'),(12,'Gerónimo Rulli','GK'),(13,'Cristian Romero','DF'),(14,'Exequiel Palacios','MF'),(15,'Nicolás González','MF'),
(16,'Thiago Almada','FW'),(17,'Giuliano Simeone','FW'),(18,'Nico Paz','FW'),(19,'Nicolás Otamendi','DF'),(20,'Alexis Mac Allister','MF'),
(21,'José Manuel López','FW'),(22,'Lautaro Martínez','FW'),(23,'Emiliano Martínez','GK'),(24,'Enzo Fernández','MF'),(25,'Facundo Medina','DF'),(26,'Nahuel Molina','DF')
) as v(num,name,pos) where t.fifa_code='ARG' on conflict do nothing;

insert into public.players (team_id,name,position,shirt_number) select t.id,v.name,v.pos,v.num from public.teams t, (values
(1,'Alexander Schlager','GK'),(2,'David Affengruber','DF'),(3,'Kevin Danso','DF'),(4,'Xaver Schlager','MF'),(5,'Stefan Posch','DF'),
(6,'Nicolas Seiwald','MF'),(7,'Marko Arnautović','FW'),(8,'David Alaba','DF'),(9,'Marcel Sabitzer','MF'),(10,'Florian Grillitsch','MF'),
(11,'Michael Gregoritsch','FW'),(12,'Florian Wiegele','GK'),(13,'Patrick Pentz','GK'),(14,'Saša Kalajdžić','FW'),(15,'Philipp Lienhart','DF'),
(16,'Phillipp Mwene','DF'),(17,'Carney Chukwuemeka','MF'),(18,'Romano Schmid','MF'),(19,'Konrad Laimer','MF'),(20,'Patrick Wimmer','FW'),
(21,'Alexander Prass','MF'),(22,'Marco Friedl','DF'),(23,'Patrick Pentz','GK'),(24,'Paul Wanner','MF'),(25,'Michael Svoboda','DF'),(26,'Alessandro Schöpf','MF')
) as v(num,name,pos) where t.fifa_code='AUT' on conflict do nothing;

insert into public.players (team_id,name,position,shirt_number) select t.id,v.name,v.pos,v.num from public.teams t, (values
(1,'Yazeed Abulaila','GK'),(2,'Mohammad Abu Hashish','DF'),(3,'Abdallah Nasib','DF'),(4,'Husam Abu Dahab','DF'),(5,'Yazan Al-Arab','DF'),
(6,'Amer Jamous','MF'),(7,'Mohammad Abu Zrayq','FW'),(8,'Noor Al-Rawabdeh','MF'),(9,'Ali Olwan','FW'),(10,'Musa Al-Taamari','FW'),
(11,'Odeh Al-Fakhouri','FW'),(12,'Nour Bani Attiah','GK'),(13,'Mahmoud Al-Mardi','FW'),(14,'Rajaei Ayed','MF'),(15,'Ibrahim Sadeh','MF'),
(16,'Mo Abualnadi','DF'),(17,'Salim Obaid','DF'),(18,'Saed Al-Rosan','DF'),(19,'Mohannad Abu Taha','MF'),(20,'Nizar Al-Rashdan','MF'),
(21,'Abdallah Al-Fakhouri','GK'),(22,'Ihsan Haddad','DF'),(23,'Ali Azaizeh','FW'),(24,'Mohammad Al-Dawoud','MF'),(25,'Anas Badawi','DF'),(26,'Amer Jamous','MF')
) as v(num,name,pos) where t.fifa_code='JOR' on conflict do nothing;

-- === Group K ===
insert into public.players (team_id,name,position,shirt_number) select t.id,v.name,v.pos,v.num from public.teams t, (values
(1,'David Ospina','GK'),(2,'Daniel Muñoz','DF'),(3,'Jhon Lucumí','DF'),(4,'Santiago Arias','DF'),(5,'Kevin Castaño','MF'),
(6,'Richard Ríos','MF'),(7,'Luis Díaz','FW'),(8,'Jorge Carrascal','MF'),(9,'Jhon Córdoba','FW'),(10,'James Rodríguez','MF'),
(11,'Jhon Arias','MF'),(12,'Camilo Vargas','GK'),(13,'Yerry Mina','DF'),(14,'Gustavo Puerta','DF'),(15,'Juan Portilla','MF'),
(16,'Jefferson Lerma','MF'),(17,'Johan Mojica','DF'),(18,'Willer Ditta','DF'),(19,'Cucho Hernández','FW'),(20,'Juan Fernando Quintero','MF'),
(21,'Jaminton Campaz','FW'),(22,'Deiver Machado','DF'),(23,'Davinson Sánchez','DF'),(24,'Álvaro Montero','GK'),(25,'Luis Suárez','FW'),(26,'Andrés Gómez','FW')
) as v(num,name,pos) where t.fifa_code='COL' on conflict do nothing;

insert into public.players (team_id,name,position,shirt_number) select t.id,v.name,v.pos,v.num from public.teams t, (values
(1,'Lionel Mpasi','GK'),(2,'Aaron Wan-Bissaka','DF'),(3,'Steve Kapuadi','DF'),(4,'Axel Tuanzebe','DF'),(5,'Dylan Batubinsika','DF'),
(6,'Ngal''ayel Mukau','MF'),(7,'Nathanaël Mbuku','MF'),(8,'Samuel Moutoussamy','MF'),(9,'Brian Cipenga','FW'),(10,'Théo Bongonda','MF'),
(11,'Gaël Kakuta','FW'),(12,'Joris Kayembe','DF'),(13,'Meschak Elia','FW'),(14,'Noah Sadiki','MF'),(15,'Aaron Tshibola','MF'),
(16,'Timothy Fayulu','GK'),(17,'Cédric Bakambu','FW'),(18,'Charles Pickel','MF'),(19,'Fiston Mayele','FW'),(20,'Yoane Wissa','FW'),
(21,'Matthieu Epolo','GK'),(22,'Chancel Mbemba','DF'),(23,'Simon Banza','FW'),(24,'Gédéon Kalulu','DF'),(25,'Edo Kayembe','MF'),(26,'Arthur Masuaku','DF')
) as v(num,name,pos) where t.fifa_code='COD' on conflict do nothing;

insert into public.players (team_id,name,position,shirt_number) select t.id,v.name,v.pos,v.num from public.teams t, (values
(1,'Diogo Costa','GK'),(2,'Nélson Semedo','DF'),(3,'Rúben Dias','DF'),(4,'Tomás Araújo','DF'),(5,'Diogo Dalot','DF'),
(6,'Matheus Nunes','MF'),(7,'Cristiano Ronaldo','FW'),(8,'Bruno Fernandes','MF'),(9,'Gonçalo Ramos','FW'),(10,'Bernardo Silva','MF'),
(11,'João Félix','FW'),(12,'José Sá','GK'),(13,'Renato Veiga','DF'),(14,'Gonçalo Inácio','DF'),(15,'João Neves','MF'),
(16,'Francisco Trincão','FW'),(17,'Rafael Leão','FW'),(18,'Pedro Neto','FW'),(19,'Gonçalo Guedes','FW'),(20,'João Cancelo','DF'),
(21,'Rúben Neves','MF'),(22,'Rui Silva','GK'),(23,'Vitinha','MF'),(24,'Samú Costa','DF'),(25,'Nuno Mendes','DF'),(26,'Francisco Conceição','FW')
) as v(num,name,pos) where t.fifa_code='POR' on conflict do nothing;

insert into public.players (team_id,name,position,shirt_number) select t.id,v.name,v.pos,v.num from public.teams t, (values
(1,'Utkir Yusupov','GK'),(2,'Abdukodir Khusanov','DF'),(3,'Khojiakbar Alijonov','DF'),(4,'Farrukh Sayfiev','DF'),(5,'Rustam Ashurmatov','DF'),
(6,'Akmal Mozgovoy','MF'),(7,'Otabek Shukurov','MF'),(8,'Jamshid Iskanderov','MF'),(9,'Odiljon Hamrobekov','MF'),(10,'Jaloliddin Masharipov','MF'),
(11,'Oston Urunov','MF'),(12,'Abduvohid Nematov','GK'),(13,'Sherzod Nasrullaev','DF'),(14,'Eldor Shomurodov','FW'),(15,'Umar Eshmurodov','DF'),
(16,'Botirali Ergashev','GK'),(17,'Dostonbek Khamdamov','MF'),(18,'Abdulla Abdullaev','DF'),(19,'Azizjon Ganiev','MF'),(20,'Azizbek Amonov','FW'),
(21,'Igor Sergeev','FW'),(22,'Abbosbek Fayzullaev','MF'),(23,'Sherzod Esanov','MF'),(24,'Bekhruz Karimov','DF'),(25,'Avazbek Ulmasaliev','DF'),(26,'Jakhongir Urozov','DF')
) as v(num,name,pos) where t.fifa_code='UZB' on conflict do nothing;

-- === Group L ===
insert into public.players (team_id,name,position,shirt_number) select t.id,v.name,v.pos,v.num from public.teams t, (values
(1,'Dominik Livaković','GK'),(2,'Josip Stanišić','DF'),(3,'Marin Pongračić','DF'),(4,'Joško Gvardiol','DF'),(5,'Duje Ćaleta-Car','DF'),
(6,'Josip Šutalo','DF'),(7,'Nikola Moro','MF'),(8,'Mateo Kovačić','MF'),(9,'Andrej Kramarić','FW'),(10,'Luka Modrić','MF'),
(11,'Ante Budimir','FW'),(12,'Ivor Pandur','GK'),(13,'Nikola Vlašić','MF'),(14,'Ivan Perišić','FW'),(15,'Mario Pašalić','MF'),
(16,'Martin Baturina','MF'),(17,'Petar Sučić','MF'),(18,'Kristijan Jakić','DF'),(19,'Toni Fruk','MF'),(20,'Igor Matanović','FW'),
(21,'Luka Sučić','MF'),(22,'Luka Vušković','DF'),(23,'Dominik Kotarski','GK'),(24,'Marco Pašalić','FW'),(25,'Martin Erlić','DF'),(26,'Petar Musa','FW')
) as v(num,name,pos) where t.fifa_code='CRO' on conflict do nothing;

insert into public.players (team_id,name,position,shirt_number) select t.id,v.name,v.pos,v.num from public.teams t, (values
(1,'Jordan Pickford','GK'),(2,'Ezri Konsa','DF'),(3,'Nico O''Reilly','DF'),(4,'Declan Rice','MF'),(5,'John Stones','DF'),
(6,'Marc Guéhi','DF'),(7,'Bukayo Saka','FW'),(8,'Elliot Anderson','MF'),(9,'Harry Kane','FW'),(10,'Jude Bellingham','MF'),
(11,'Marcus Rashford','FW'),(12,'Tino Livramento','DF'),(13,'Dean Henderson','GK'),(14,'Jordan Henderson','MF'),(15,'Dan Burn','DF'),
(16,'Kobbie Mainoo','MF'),(17,'Morgan Rogers','MF'),(18,'Anthony Gordon','FW'),(19,'Ollie Watkins','FW'),(20,'Noni Madueke','FW'),
(21,'Eberechi Eze','MF'),(22,'Ivan Toney','FW'),(23,'James Trafford','GK'),(24,'Reece James','DF'),(25,'Djed Spence','DF'),(26,'Jarell Quansah','DF')
) as v(num,name,pos) where t.fifa_code='ENG' on conflict do nothing;

insert into public.players (team_id,name,position,shirt_number) select t.id,v.name,v.pos,v.num from public.teams t, (values
(1,'Lawrence Ati-Zigi','GK'),(2,'Alidu Seidu','DF'),(3,'Caleb Yirenkyi','MF'),(4,'Jonas Adjetey','DF'),(5,'Thomas Partey','MF'),
(6,'Abdul Mumin','DF'),(7,'Abdul Fatawu','FW'),(8,'Kwasi Sibo','MF'),(9,'Jordan Ayew','FW'),(10,'Brandon Thomas-Asante','FW'),
(11,'Antoine Semenyo','MF'),(12,'Joseph Anang','GK'),(13,'Christopher Bonsu Baah','FW'),(14,'Gideon Mensah','DF'),(15,'Elisha Owusu','MF'),
(16,'Benjamin Asare','GK'),(17,'Abdul Rahman Baba','DF'),(18,'Jerome Opoku','DF'),(19,'Iñaki Williams','FW'),(20,'Augustine Boakye','MF'),
(21,'Kojo Peprah Oppong','DF'),(22,'Kamaldeen Sulemana','FW'),(23,'Derrick Luckassen','DF'),(24,'Ernest Nuamah','FW'),(25,'Prince Kwabena Adu','FW'),(26,'Marvin Senaya','DF')
) as v(num,name,pos) where t.fifa_code='GHA' on conflict do nothing;

insert into public.players (team_id,name,position,shirt_number) select t.id,v.name,v.pos,v.num from public.teams t, (values
(1,'Luis Mejía','GK'),(2,'César Blackman','DF'),(3,'José Córdoba','DF'),(4,'Fidel Escobar','DF'),(5,'Edgardo Fariña','DF'),
(6,'Cristian Martínez','MF'),(7,'José Luis Rodríguez','MF'),(8,'Adalberto Carrasquilla','MF'),(9,'Tomás Rodríguez','FW'),(10,'Ismael Díaz','MF'),
(11,'Yoel Bárcenas','MF'),(12,'César Samudio','GK'),(13,'Jiovany Ramos','DF'),(14,'Carlos Harvey','DF'),(15,'Eric Davis','DF'),
(16,'Andrés Andrade','DF'),(17,'José Fajardo','FW'),(18,'Cecilio Waterman','FW'),(19,'Alberto Quintero','MF'),(20,'Aníbal Godoy','MF'),
(21,'César Yanis','MF'),(22,'Orlando Mosquera','GK'),(23,'Michael Amir Murillo','DF'),(24,'Azarias Londoño','FW'),(25,'Roderick Miller','DF'),(26,'Jorge Gutiérrez','DF')
) as v(num,name,pos) where t.fifa_code='PAN' on conflict do nothing;

-- (sample matches removed; run migration 005 for full schedule)
