-- ================================================================
-- Migration 010: Definitive player reseed
-- Fixes FK issues that caused migration 009 DELETE to fail silently.
-- ================================================================

-- 1. Clear player references from global_predictions (preserves team picks)
UPDATE public.global_predictions SET
  golden_ball_player_id   = NULL,
  silver_ball_player_id   = NULL,
  bronze_ball_player_id   = NULL,
  golden_boot_player_id   = NULL,
  golden_glove_player_id  = NULL,
  best_young_player_id    = NULL;

-- 2. Delete all players (lineups + scorer_predictions cascade automatically)
DELETE FROM public.players;

-- ================================================================
-- 3. Re-insert all 48 × 26 players (1,248 total)
-- ================================================================

-- ─── GROUP A ────────────────────────────────────────────────────
INSERT INTO public.players (team_id,name,position,shirt_number,active)
SELECT t.id,v.name,v.pos,v.num,true FROM public.teams t,(VALUES
(1,'Matěj Kovář','GK'),(2,'David Zima','DF'),(3,'Tomáš Holeš','DF'),(4,'Robin Hranáč','DF'),(5,'Vladimír Coufal','DF'),
(6,'Štěpán Chaloupek','DF'),(7,'Ladislav Krejčí','DF'),(8,'Vladimír Darida','MF'),(9,'Adam Hložek','FW'),(10,'Patrik Schick','FW'),
(11,'Jan Kuchta','FW'),(12,'Lukáš Červ','MF'),(13,'Mojmír Chytil','FW'),(14,'David Jurásek','DF'),(15,'Pavel Šulc','FW'),
(16,'Jindřich Staněk','GK'),(17,'Lukáš Provod','MF'),(18,'Michal Sadílek','MF'),(19,'Tomáš Chorý','FW'),(20,'Jaroslav Zelený','DF'),
(21,'David Douděra','DF'),(22,'Tomáš Souček','MF'),(23,'Lukáš Horníček','GK'),(24,'Alexandr Sojka','MF'),(25,'Hugo Sochůrek','MF'),(26,'Denis Višinský','FW')
) AS v(num,name,pos) WHERE t.fifa_code='CZE';

INSERT INTO public.players (team_id,name,position,shirt_number,active)
SELECT t.id,v.name,v.pos,v.num,true FROM public.teams t,(VALUES
(1,'Raúl Rangel','GK'),(2,'Jorge Sánchez','DF'),(3,'César Montes','DF'),(4,'Edson Álvarez','DF'),(5,'Johan Vásquez','DF'),
(6,'Érik Lira','MF'),(7,'Luis Romo','MF'),(8,'Álvaro Fidalgo','MF'),(9,'Raúl Jiménez','FW'),(10,'Alexis Vega','FW'),
(11,'Santiago Giménez','FW'),(12,'Carlos Acevedo','GK'),(13,'Guillermo Ochoa','GK'),(14,'Armando González','FW'),(15,'Israel Reyes','DF'),
(16,'Julián Quiñones','FW'),(17,'Orbelín Pineda','MF'),(18,'Obed Vargas','MF'),(19,'Gilberto Mora','MF'),(20,'Mateo Chávez','DF'),
(21,'César Huerta','FW'),(22,'Guillermo Martínez','FW'),(23,'Jesús Gallardo','DF'),(24,'Luis Chávez','MF'),(25,'Roberto Alvarado','FW'),(26,'Brian Gutiérrez','MF')
) AS v(num,name,pos) WHERE t.fifa_code='MEX';

INSERT INTO public.players (team_id,name,position,shirt_number,active)
SELECT t.id,v.name,v.pos,v.num,true FROM public.teams t,(VALUES
(1,'Ronwen Williams','GK'),(2,'Thabang Matuludi','DF'),(3,'Khulumani Ndamane','DF'),(4,'Teboho Mokoena','MF'),(5,'Thalente Mbatha','MF'),
(6,'Aubrey Modiba','DF'),(7,'Oswin Appollis','FW'),(8,'Tshepang Moremi','FW'),(9,'Lyle Foster','FW'),(10,'Relebohile Mofokeng','FW'),
(11,'Themba Zwane','MF'),(12,'Thapelo Maseko','FW'),(13,'Sphephelo Sithole','MF'),(14,'Mbekezeli Mbokazi','DF'),(15,'Iqraam Rayners','FW'),
(16,'Sipho Chaine','GK'),(17,'Evidence Makgopa','FW'),(18,'Samukele Kabini','DF'),(19,'Nkosinathi Sibisi','DF'),(20,'Khuliso Mudau','DF'),
(21,'Ime Okon','DF'),(22,'Ricardo Goss','GK'),(23,'Jayden Adams','MF'),(24,'Olwethu Makhanya','DF'),(25,'Kamogelo Sebelebele','FW'),(26,'Bradley Cross','DF')
) AS v(num,name,pos) WHERE t.fifa_code='RSA';

INSERT INTO public.players (team_id,name,position,shirt_number,active)
SELECT t.id,v.name,v.pos,v.num,true FROM public.teams t,(VALUES
(1,'Kim Seung-gyu','GK'),(2,'Lee Han-beom','DF'),(3,'Lee Gi-hyuk','MF'),(4,'Kim Min-jae','DF'),(5,'Kim Tae-hyeon','DF'),
(6,'Hwang In-beom','MF'),(7,'Son Heung-min','FW'),(8,'Paik Seung-ho','MF'),(9,'Cho Gue-sung','FW'),(10,'Lee Jae-sung','MF'),
(11,'Hwang Hee-chan','MF'),(12,'Song Bum-keun','GK'),(13,'Lee Tae-seok','DF'),(14,'Cho Wi-je','DF'),(15,'Kim Moon-hwan','DF'),
(16,'Park Jin-seob','DF'),(17,'Bae Jun-ho','MF'),(18,'Oh Hyeon-gyu','FW'),(19,'Lee Kang-in','MF'),(20,'Yang Hyun-jun','MF'),
(21,'Jo Hyeon-woo','GK'),(22,'Seol Young-woo','DF'),(23,'Jens Castrop','DF'),(24,'Kim Jin-gyu','MF'),(25,'Eom Ji-sung','MF'),(26,'Lee Dong-gyeong','MF')
) AS v(num,name,pos) WHERE t.fifa_code='KOR';

-- ─── GROUP B ────────────────────────────────────────────────────
INSERT INTO public.players (team_id,name,position,shirt_number,active)
SELECT t.id,v.name,v.pos,v.num,true FROM public.teams t,(VALUES
(1,'Nikola Vasilj','GK'),(2,'Nihad Mujakić','DF'),(3,'Dennis Hadžikadunić','DF'),(4,'Tarik Muharemović','DF'),(5,'Sead Kolašinac','DF'),
(6,'Benjamin Tahirović','MF'),(7,'Amar Dedić','DF'),(8,'Armin Gigović','MF'),(9,'Samed Baždar','FW'),(10,'Ermedin Demirović','FW'),
(11,'Edin Džeko','FW'),(12,'Mladen Jurkas','GK'),(13,'Ivan Bašić','MF'),(14,'Ivan Šunjić','MF'),(15,'Amar Memić','MF'),
(16,'Amir Hadžiahmetović','MF'),(17,'Dženis Burnić','MF'),(18,'Nikola Katić','DF'),(19,'Kerim Alajbegović','FW'),(20,'Esmir Bajraktarević','FW'),
(21,'Stjepan Radeljić','DF'),(22,'Martin Zlomislić','GK'),(23,'Haris Tabaković','FW'),(24,'Nidal Čelik','DF'),(25,'Jovo Lukić','FW'),(26,'Ermin Mahmić','MF')
) AS v(num,name,pos) WHERE t.fifa_code='BIH';

INSERT INTO public.players (team_id,name,position,shirt_number,active)
SELECT t.id,v.name,v.pos,v.num,true FROM public.teams t,(VALUES
(1,'Dayne St. Clair','GK'),(2,'Alistair Johnston','DF'),(3,'Alfie Jones','DF'),(4,'Luc de Fougerolles','DF'),(5,'Joel Waterman','DF'),
(6,'Mathieu Choinière','MF'),(7,'Stephen Eustáquio','MF'),(8,'Ismaël Koné','MF'),(9,'Cyle Larin','FW'),(10,'Jonathan David','FW'),
(11,'Liam Millar','MF'),(12,'Tani Oluwaseyi','FW'),(13,'Derek Cornelius','DF'),(14,'Jacob Shaffelburg','MF'),(15,'Moïse Bombito','DF'),
(16,'Maxime Crépeau','GK'),(17,'Tajon Buchanan','FW'),(18,'Owen Goodman','GK'),(19,'Alphonso Davies','DF'),(20,'Ali Ahmed','FW'),
(21,'Jonathan Osorio','MF'),(22,'Richie Laryea','DF'),(23,'Niko Sigur','DF'),(24,'Promise David','FW'),(25,'Nathan Saliba','MF'),(26,'Samuel Piette','MF')
) AS v(num,name,pos) WHERE t.fifa_code='CAN';

INSERT INTO public.players (team_id,name,position,shirt_number,active)
SELECT t.id,v.name,v.pos,v.num,true FROM public.teams t,(VALUES
(1,'Meshaal Barsham','GK'),(2,'Pedro Miguel','DF'),(3,'Lucas Mendes','DF'),(4,'Homam Ahmed','DF'),(5,'Jassem Gaber','DF'),
(6,'Abdulaziz Hatem','MF'),(7,'Ahmed Alaaeldin','FW'),(8,'Edmilson Junior','FW'),(9,'Mohammed Muntari','FW'),(10,'Hassan Al-Haydos','FW'),
(11,'Akram Afif','FW'),(12,'Karim Boudiaf','MF'),(13,'Boualem Khoukhi','DF'),(14,'Assim Madibo','MF'),(15,'Yusuf Abdurisag','FW'),
(16,'Sultan Al-Brake','DF'),(17,'Ahmed Al-Ganehi','MF'),(18,'Almoez Ali','FW'),(19,'Ahmed Fathy','MF'),(20,'Salah Zakaria','GK'),
(21,'Mahmud Abunada','GK'),(22,'Issa Laye','DF'),(23,'Tahsin Jamshid','FW'),(24,'Ayoub Al-Oui','DF'),(25,'Mohamed Manai','FW'),(26,'Khalid Muneer','MF')
) AS v(num,name,pos) WHERE t.fifa_code='QAT';

INSERT INTO public.players (team_id,name,position,shirt_number,active)
SELECT t.id,v.name,v.pos,v.num,true FROM public.teams t,(VALUES
(1,'Gregor Kobel','GK'),(2,'Miro Muheim','DF'),(3,'Silvan Widmer','DF'),(4,'Nico Elvedi','DF'),(5,'Manuel Akanji','DF'),
(6,'Denis Zakaria','MF'),(7,'Breel Embolo','FW'),(8,'Remo Freuler','MF'),(9,'Dan Ndoye','FW'),(10,'Granit Xhaka','MF'),
(11,'Ruben Vargas','FW'),(12,'Yvon Mvogo','GK'),(13,'Ricardo Rodriguez','DF'),(14,'Ardon Jashari','MF'),(15,'Djibril Sow','MF'),
(16,'Christian Fassnacht','FW'),(17,'Noah Okafor','FW'),(18,'Eray Cömert','DF'),(19,'Zeki Amdouni','FW'),(20,'Michel Aebischer','MF'),
(21,'Marvin Keller','GK'),(22,'Fabian Rieder','MF'),(23,'Johan Manzambi','MF'),(24,'Aurèle Amenda','DF'),(25,'Luca Jaquez','DF'),(26,'Cedric Itten','FW')
) AS v(num,name,pos) WHERE t.fifa_code='SUI';

-- ─── GROUP C ────────────────────────────────────────────────────
INSERT INTO public.players (team_id,name,position,shirt_number,active)
SELECT t.id,v.name,v.pos,v.num,true FROM public.teams t,(VALUES
(1,'Alisson','GK'),(2,'Wesley','DF'),(3,'Gabriel Magalhães','DF'),(4,'Marquinhos','DF'),(5,'Casemiro','MF'),
(6,'Alex Sandro','DF'),(7,'Vinícius Júnior','FW'),(8,'Bruno Guimarães','MF'),(9,'Matheus Cunha','FW'),(10,'Neymar','FW'),
(11,'Raphinha','FW'),(12,'Weverton','GK'),(13,'Danilo','DF'),(14,'Bremer','DF'),(15,'Léo Pereira','DF'),
(16,'Douglas Santos','DF'),(17,'Fabinho','MF'),(18,'Lucas Paquetá','MF'),(19,'Endrick','FW'),(20,'Gabriel Martinelli','FW'),
(21,'Luiz Henrique','FW'),(22,'Danilo Santos','MF'),(23,'Ederson','GK'),(24,'Roger Ibañez','DF'),(25,'Igor Thiago','FW'),(26,'Rayan','FW')
) AS v(num,name,pos) WHERE t.fifa_code='BRA';

INSERT INTO public.players (team_id,name,position,shirt_number,active)
SELECT t.id,v.name,v.pos,v.num,true FROM public.teams t,(VALUES
(1,'Johny Placide','GK'),(2,'Carlens Arcus','DF'),(3,'Keeto Thermoncy','DF'),(4,'Ricardo Adé','DF'),(5,'Hannes Delcroix','DF'),
(6,'Carl Sainté','MF'),(7,'Derrick Etienne Jr.','FW'),(8,'Martin Expérience','DF'),(9,'Duckens Nazon','FW'),(10,'Jean-Ricner Bellegarde','MF'),
(11,'Wilson Isidor','FW'),(12,'Alexandre Pierre','GK'),(13,'Duke Lacroix','DF'),(14,'Leverton Pierre','MF'),(15,'Ruben Providence','FW'),
(16,'Lenny Joseph','FW'),(17,'Danley Jean Jacques','MF'),(18,'Frantzdy Pierrot','FW'),(19,'Yassin Fortuné','FW'),(20,'Louicius Deedson','FW'),
(21,'Josué Casimir','FW'),(22,'Jean-Kévin Duverne','DF'),(23,'Josué Duverger','GK'),(24,'Wilguens Paugain','DF'),(25,'Dominique Simon','MF'),(26,'Woodensky Pierre','MF')
) AS v(num,name,pos) WHERE t.fifa_code='HAI';

INSERT INTO public.players (team_id,name,position,shirt_number,active)
SELECT t.id,v.name,v.pos,v.num,true FROM public.teams t,(VALUES
(1,'Yassine Bounou','GK'),(2,'Achraf Hakimi','DF'),(3,'Noussair Mazraoui','DF'),(4,'Sofyan Amrabat','MF'),(5,'Nayef Aguerd','DF'),
(6,'Ayyoub Bouaddi','MF'),(7,'Chemsdine Talbi','MF'),(8,'Azzedine Ounahi','MF'),(9,'Soufiane Rahimi','FW'),(10,'Brahim Díaz','FW'),
(11,'Ismael Saibari','MF'),(12,'Munir Mohamedi','GK'),(13,'Zakaria El Ouahdi','DF'),(14,'Issa Diop','DF'),(15,'Samir El Mourabet','MF'),
(16,'Gessime Yassine','MF'),(17,'Abde Ezzalzouli','FW'),(18,'Chadi Riad','DF'),(19,'Youssef Belammari','DF'),(20,'Ayoub El Kaabi','FW'),
(21,'Ayoube Amaimouni','FW'),(22,'Ahmed Reda Tagnaouti','GK'),(23,'Bilal El Khannouss','MF'),(24,'Neil El Aynaoui','MF'),(25,'Redouane Halhal','DF'),(26,'Anass Salah-Eddine','DF')
) AS v(num,name,pos) WHERE t.fifa_code='MAR';

INSERT INTO public.players (team_id,name,position,shirt_number,active)
SELECT t.id,v.name,v.pos,v.num,true FROM public.teams t,(VALUES
(1,'Angus Gunn','GK'),(2,'Aaron Hickey','DF'),(3,'Andy Robertson','DF'),(4,'Scott McTominay','MF'),(5,'Grant Hanley','DF'),
(6,'Kieran Tierney','DF'),(7,'John McGinn','MF'),(8,'Billy Gilmour','MF'),(9,'Lyndon Dykes','FW'),(10,'Ché Adams','FW'),
(11,'Ryan Christie','MF'),(12,'Liam Kelly','GK'),(13,'Jack Hendry','DF'),(14,'Ross Stewart','FW'),(15,'John Souttar','DF'),
(16,'Dominic Hyam','DF'),(17,'Ben Doak','FW'),(18,'George Hirst','FW'),(19,'Lewis Ferguson','MF'),(20,'Lawrence Shankland','FW'),
(21,'Craig Gordon','GK'),(22,'Nathan Patterson','DF'),(23,'Kenny McLean','MF'),(24,'Anthony Ralston','DF'),(25,'Findlay Curtis','FW'),(26,'Scott McKenna','DF')
) AS v(num,name,pos) WHERE t.fifa_code='SCO';

-- ─── GROUP D ────────────────────────────────────────────────────
INSERT INTO public.players (team_id,name,position,shirt_number,active)
SELECT t.id,v.name,v.pos,v.num,true FROM public.teams t,(VALUES
(1,'Mathew Ryan','GK'),(2,'Miloš Degenek','DF'),(3,'Alessandro Circati','DF'),(4,'Jacob Italiano','DF'),(5,'Jordan Bos','DF'),
(6,'Jason Geria','DF'),(7,'Mathew Leckie','FW'),(8,'Connor Metcalfe','MF'),(9,'Mohamed Touré','FW'),(10,'Ajdin Hrustic','FW'),
(11,'Awer Mabil','FW'),(12,'Paul Izzo','GK'),(13,'Aiden O''Neill','MF'),(14,'Cammy Devlin','MF'),(15,'Kai Trewin','DF'),
(16,'Aziz Behich','DF'),(17,'Nestory Irankunda','FW'),(18,'Patrick Beach','GK'),(19,'Harry Souttar','DF'),(20,'Cristian Volpato','FW'),
(21,'Cameron Burgess','DF'),(22,'Jackson Irvine','MF'),(23,'Nishan Velupillay','FW'),(24,'Marcus Calligeros','MF'),(25,'Lucas Herrington','DF'),(26,'Tete Yengi','FW')
) AS v(num,name,pos) WHERE t.fifa_code='AUS';

INSERT INTO public.players (team_id,name,position,shirt_number,active)
SELECT t.id,v.name,v.pos,v.num,true FROM public.teams t,(VALUES
(1,'Gatito Fernández','GK'),(2,'Gustavo Velázquez','DF'),(3,'Omar Alderete','DF'),(4,'Juan José Cáceres','DF'),(5,'Fabián Balbuena','DF'),
(6,'Júnior Alonso','DF'),(7,'Ramón Sosa','MF'),(8,'Diego Gómez','MF'),(9,'Antonio Sanabria','FW'),(10,'Miguel Almirón','MF'),
(11,'Julio Enciso','FW'),(12,'Orlando Gill','GK'),(13,'José Canale','DF'),(14,'Andrés Cubas','MF'),(15,'Gustavo Gómez','DF'),
(16,'Damián Bobadilla','MF'),(17,'Kaku','FW'),(18,'Álex Arce','FW'),(19,'Maurício','MF'),(20,'Braian Ojeda','MF'),
(21,'Gabriel Ávalos','FW'),(22,'Gastón Olveira','GK'),(23,'Matías Galarza','MF'),(24,'Gustavo Caballero','MF'),(25,'Isidro Pitta','FW'),(26,'Alexandro Maidana','DF')
) AS v(num,name,pos) WHERE t.fifa_code='PAR';

INSERT INTO public.players (team_id,name,position,shirt_number,active)
SELECT t.id,v.name,v.pos,v.num,true FROM public.teams t,(VALUES
(1,'Mert Günok','GK'),(2,'Zeki Çelik','DF'),(3,'Merih Demiral','DF'),(4,'Çağlar Söyüncü','DF'),(5,'Salih Özcan','MF'),
(6,'Orkun Kökçü','MF'),(7,'Kerem Aktürkoğlu','FW'),(8,'Arda Güler','FW'),(9,'Can Uzun','FW'),(10,'Hakan Çalhanoğlu','MF'),
(11,'Kenan Yıldız','FW'),(12,'Altay Bayındır','GK'),(13,'Eren Elmalı','DF'),(14,'Abdülkerim Bardakcı','DF'),(15,'Ozan Kabak','DF'),
(16,'İsmail Yüksek','MF'),(17,'İrfan Can Kahveci','FW'),(18,'Mert Müldür','DF'),(19,'Yunus Akgün','FW'),(20,'Ferdi Kadıoğlu','DF'),
(21,'Barış Alper Yılmaz','FW'),(22,'Kaan Ayhan','MF'),(23,'Uğurcan Çakır','GK'),(24,'Oğuz Aydın','FW'),(25,'Samet Akaydin','DF'),(26,'Deniz Gül','FW')
) AS v(num,name,pos) WHERE t.fifa_code='TUR';

INSERT INTO public.players (team_id,name,position,shirt_number,active)
SELECT t.id,v.name,v.pos,v.num,true FROM public.teams t,(VALUES
(1,'Matt Turner','GK'),(2,'Sergiño Dest','DF'),(3,'Chris Richards','DF'),(4,'Tyler Adams','MF'),(5,'Antonee Robinson','DF'),
(6,'Auston Trusty','DF'),(7,'Giovanni Reyna','MF'),(8,'Weston McKennie','MF'),(9,'Ricardo Pepi','FW'),(10,'Christian Pulisic','FW'),
(11,'Brenden Aaronson','MF'),(12,'Miles Robinson','DF'),(13,'Tim Ream','DF'),(14,'Malik Tillman','MF'),(15,'Cristian Roldan','MF'),
(16,'Joe Scally','DF'),(17,'Folarin Balogun','FW'),(18,'Maximilian Arfsten','DF'),(19,'Haji Wright','FW'),(20,'Timothy Weah','FW'),
(21,'Sebastian Berhalter','MF'),(22,'Mark McKenzie','DF'),(23,'Matt Freese','GK'),(24,'Chris Brady','GK'),(25,'Alejandro Zendejas','FW'),(26,'Alex Freeman','DF')
) AS v(num,name,pos) WHERE t.fifa_code='USA';

-- ─── GROUP E ────────────────────────────────────────────────────
INSERT INTO public.players (team_id,name,position,shirt_number,active)
SELECT t.id,v.name,v.pos,v.num,true FROM public.teams t,(VALUES
(1,'Eloy Room','GK'),(2,'Shurandy Sambo','DF'),(3,'Juriën Gaari','DF'),(4,'Roshon van Eijma','DF'),(5,'Sherel Floranus','DF'),
(6,'Godfried Roemeratoe','MF'),(7,'Juninho Bacuna','MF'),(8,'Livano Comenencia','MF'),(9,'Jürgen Locadia','FW'),(10,'Leandro Bacuna','MF'),
(11,'Jeremy Antonisse','FW'),(12,'Sontje Hansen','FW'),(13,'Tyrese Noslin','FW'),(14,'Kenji Gorré','FW'),(15,'Tahith Chong','MF'),
(16,'Jearl Margaritha','FW'),(17,'Brandley Kuwas','FW'),(18,'Armando Obispo','DF'),(19,'Gervane Kastaneer','FW'),(20,'Joshua Brenet','DF'),
(21,'Kevin Felida','MF'),(22,'Riechedly Bazoer','DF'),(23,'Deveron Fonville','DF'),(24,'Tyrick Bodak','GK'),(25,'Trevor Doornbusch','GK'),(26,'Myron Boadu','FW')
) AS v(num,name,pos) WHERE t.fifa_code='CUW';

INSERT INTO public.players (team_id,name,position,shirt_number,active)
SELECT t.id,v.name,v.pos,v.num,true FROM public.teams t,(VALUES
(1,'Hernán Galíndez','GK'),(2,'Félix Torres','DF'),(3,'Piero Hincapié','DF'),(4,'Joel Ordóñez','DF'),(5,'Willian Pacho','DF'),
(6,'Jordy Alcívar','MF'),(7,'Pervis Estupiñán','DF'),(8,'Anthony Valencia','MF'),(9,'John Yeboah','FW'),(10,'Kendry Páez','MF'),
(11,'Enner Valencia','FW'),(12,'Moisés Ramírez','GK'),(13,'Kevin Rodríguez','FW'),(14,'Alan Minda','MF'),(15,'Pedro Vite','MF'),
(16,'Jordy Caicedo','FW'),(17,'Ángelo Preciado','DF'),(18,'Denil Castillo','MF'),(19,'Gonzalo Plata','FW'),(20,'Nilson Angulo','FW'),
(21,'Alan Franco','MF'),(22,'Gonzalo Valle','GK'),(23,'Moisés Caicedo','MF'),(24,'Jeremy Arévalo','FW'),(25,'Jackson Porozo','DF'),(26,'Yaimar Medina','DF')
) AS v(num,name,pos) WHERE t.fifa_code='ECU';

INSERT INTO public.players (team_id,name,position,shirt_number,active)
SELECT t.id,v.name,v.pos,v.num,true FROM public.teams t,(VALUES
(1,'Manuel Neuer','GK'),(2,'Antonio Rüdiger','DF'),(3,'Waldemar Anton','DF'),(4,'Jonathan Tah','DF'),(5,'Aleksandar Pavlović','MF'),
(6,'Joshua Kimmich','DF'),(7,'Kai Havertz','FW'),(8,'Leon Goretzka','MF'),(9,'Florian Wirtz','MF'),(10,'Jamal Musiala','MF'),
(11,'Leroy Sané','MF'),(12,'Oliver Baumann','GK'),(13,'Pascal Groß','MF'),(14,'Maximilian Beier','FW'),(15,'Nico Schlotterbeck','DF'),
(16,'Angelo Stiller','MF'),(17,'Jamie Leweling','MF'),(18,'Nathaniel Brown','DF'),(19,'Nick Woltemade','FW'),(20,'Nadiem Amiri','MF'),
(21,'Alexander Nübel','GK'),(22,'David Raum','DF'),(23,'Felix Nmecha','MF'),(24,'Malick Thiaw','DF'),(25,'Deniz Undav','FW'),(26,'Lennart Karl','MF')
) AS v(num,name,pos) WHERE t.fifa_code='GER';

INSERT INTO public.players (team_id,name,position,shirt_number,active)
SELECT t.id,v.name,v.pos,v.num,true FROM public.teams t,(VALUES
(1,'Yahia Fofana','GK'),(2,'Ousmane Diomande','DF'),(3,'Ghislain Konan','DF'),(4,'Jean Michaël Seri','MF'),(5,'Wilfried Singo','DF'),
(6,'Seko Fofana','MF'),(7,'Odilon Kossounou','DF'),(8,'Franck Kessié','MF'),(9,'Ange-Yoan Bonny','FW'),(10,'Simon Adingra','FW'),
(11,'Amad Diallo','FW'),(12,'Elye Wahi','FW'),(13,'Christopher Opéri','DF'),(14,'Oumar Diakité','FW'),(15,'Yan Diomande','FW'),
(16,'Mohamed Koné','GK'),(17,'Guéla Doué','DF'),(18,'Ibrahim Sangaré','MF'),(19,'Nicolas Pépé','FW'),(20,'Emmanuel Agbadou','DF'),
(21,'Evan Ndicka','DF'),(22,'Evann Guessand','FW'),(23,'Alban Lafont','GK'),(24,'Bazoumana Touré','FW'),(25,'Parfait Guiagon','MF'),(26,'Christ Inao Oulaï','MF')
) AS v(num,name,pos) WHERE t.fifa_code='CIV';

-- ─── GROUP F ────────────────────────────────────────────────────
INSERT INTO public.players (team_id,name,position,shirt_number,active)
SELECT t.id,v.name,v.pos,v.num,true FROM public.teams t,(VALUES
(1,'Zion Suzuki','GK'),(2,'Yukinari Sugawara','DF'),(3,'Shogo Taniguchi','DF'),(4,'Ko Itakura','DF'),(5,'Yuto Nagatomo','DF'),
(6,'Wataru Endo','MF'),(7,'Ao Tanaka','MF'),(8,'Takefusa Kubo','MF'),(9,'Ayase Ueda','FW'),(10,'Ritsu Doan','MF'),
(11,'Daizen Maeda','MF'),(12,'Keisuke Osako','GK'),(13,'Keito Nakamura','MF'),(14,'Junya Ito','MF'),(15,'Daichi Kamada','MF'),
(16,'Tsuyoshi Watanabe','DF'),(17,'Yuito Suzuki','MF'),(18,'Kaoru Mitoma','FW'),(19,'Koki Ogawa','FW'),(20,'Hiroki Ito','DF'),
(21,'Takehiro Tomiyasu','DF'),(22,'Tomoki Hayakawa','GK'),(23,'Kaishu Sano','MF'),(24,'Junnosuke Suzuki','DF'),(25,'Shuto Machino','FW'),(26,'Kento Shiogai','FW')
) AS v(num,name,pos) WHERE t.fifa_code='JPN';

INSERT INTO public.players (team_id,name,position,shirt_number,active)
SELECT t.id,v.name,v.pos,v.num,true FROM public.teams t,(VALUES
(1,'Bart Verbruggen','GK'),(2,'Jurriën Timber','DF'),(3,'Marten de Roon','MF'),(4,'Virgil van Dijk','DF'),(5,'Nathan Aké','DF'),
(6,'Jan Paul van Hecke','DF'),(7,'Justin Kluivert','MF'),(8,'Ryan Gravenberch','MF'),(9,'Wout Weghorst','FW'),(10,'Memphis Depay','FW'),
(11,'Cody Gakpo','FW'),(12,'Mats Wieffer','MF'),(13,'Robin Roefs','GK'),(14,'Tijjani Reijnders','MF'),(15,'Micky van de Ven','DF'),
(16,'Guus Til','MF'),(17,'Noa Lang','FW'),(18,'Donyell Malen','FW'),(19,'Brian Brobbey','FW'),(20,'Teun Koopmeiners','MF'),
(21,'Frenkie de Jong','MF'),(22,'Denzel Dumfries','DF'),(23,'Mark Flekken','GK'),(24,'Crysencio Summerville','FW'),(25,'Jorrel Hato','DF'),(26,'Quinten Timber','MF')
) AS v(num,name,pos) WHERE t.fifa_code='NED';

INSERT INTO public.players (team_id,name,position,shirt_number,active)
SELECT t.id,v.name,v.pos,v.num,true FROM public.teams t,(VALUES
(1,'Jacob Widell Zetterström','GK'),(2,'Gustaf Lagerbielke','DF'),(3,'Victor Lindelöf','DF'),(4,'Isak Hien','DF'),(5,'Gabriel Gudmundsson','DF'),
(6,'Herman Johansson','DF'),(7,'Lucas Bergvall','MF'),(8,'Daniel Svensson','DF'),(9,'Alexander Isak','FW'),(10,'Viktor Gyökeres','FW'),
(11,'Anthony Elanga','FW'),(12,'Viktor Johansson','GK'),(13,'Ken Sema','MF'),(14,'Hjalmar Ekdal','DF'),(15,'Carl Starfelt','DF'),
(16,'Jesper Karlström','MF'),(17,'Benjamin Nygren','MF'),(18,'Yasin Ayari','MF'),(19,'Mattias Svanberg','MF'),(20,'Eric Smith','DF'),
(21,'Alexander Bernhardsson','DF'),(22,'Besfort Zeneli','MF'),(23,'Kristoffer Nordfeldt','GK'),(24,'Elliot Stroud','DF'),(25,'Gustaf Nilsson','FW'),(26,'Taha Ali','FW')
) AS v(num,name,pos) WHERE t.fifa_code='SWE';

INSERT INTO public.players (team_id,name,position,shirt_number,active)
SELECT t.id,v.name,v.pos,v.num,true FROM public.teams t,(VALUES
(1,'Mouhib Chamakh','GK'),(2,'Ali Abdi','DF'),(3,'Montassar Talbi','DF'),(4,'Omar Rekik','DF'),(5,'Adem Arous','DF'),
(6,'Dylan Bronn','DF'),(7,'Elias Achouri','FW'),(8,'Elias Saad','FW'),(9,'Hazem Mastouri','FW'),(10,'Hannibal Mejbri','MF'),
(11,'Ismaël Gharbi','MF'),(12,'Mortadha Ben Ouanes','DF'),(13,'Rani Khedira','MF'),(14,'Khalil Ayari','MF'),(15,'Hadj Mahmoud','MF'),
(16,'Aymen Dahmen','GK'),(17,'Ellyes Skhiri','MF'),(18,'Rayan Elloumi','FW'),(19,'Firas Chaouat','FW'),(20,'Yan Valery','DF'),
(21,'Mohamed Amine Ben Hamida','DF'),(22,'Sabri Ben Hessen','GK'),(23,'Moutaz Neffati','DF'),(24,'Raed Chikhaoui','DF'),(25,'Anis Ben Slimane','MF'),(26,'Sebastian Tounekti','MF')
) AS v(num,name,pos) WHERE t.fifa_code='TUN';

-- ─── GROUP G ────────────────────────────────────────────────────
INSERT INTO public.players (team_id,name,position,shirt_number,active)
SELECT t.id,v.name,v.pos,v.num,true FROM public.teams t,(VALUES
(1,'Thibaut Courtois','GK'),(2,'Zeno Debast','DF'),(3,'Arthur Theate','DF'),(4,'Brandon Mechele','DF'),(5,'Maxim De Cuyper','DF'),
(6,'Axel Witsel','MF'),(7,'Kevin De Bruyne','MF'),(8,'Youri Tielemans','MF'),(9,'Romelu Lukaku','FW'),(10,'Leandro Trossard','FW'),
(11,'Jérémy Doku','FW'),(12,'Senne Lammens','GK'),(13,'Mike Penders','GK'),(14,'Dodi Lukébakio','FW'),(15,'Thomas Meunier','DF'),
(16,'Koni De Winter','DF'),(17,'Charles De Ketelaere','FW'),(18,'Joaquin Seys','DF'),(19,'Amadou Onana','MF'),(20,'Hans Vanaken','MF'),
(21,'Timothy Castagne','DF'),(22,'Alexis Saelemaekers','MF'),(23,'Nicolas Raskin','MF'),(24,'Diego Moreira','MF'),(25,'Nathan Ngoy','DF'),(26,'Matias Fernandez-Pardo','FW')
) AS v(num,name,pos) WHERE t.fifa_code='BEL';

INSERT INTO public.players (team_id,name,position,shirt_number,active)
SELECT t.id,v.name,v.pos,v.num,true FROM public.teams t,(VALUES
(1,'Mohamed El Shenawy','GK'),(2,'Yasser Ibrahim','DF'),(3,'Mohamed Hany','DF'),(4,'Hossam Abdelmaguid','DF'),(5,'Ramy Rabia','DF'),
(6,'Mohamed Abdelmonem','DF'),(7,'Trézéguet','FW'),(8,'Emam Ashour','MF'),(9,'Omar Marmoush','FW'),(10,'Mohamed Salah','FW'),
(11,'Mostafa Ziko','MF'),(12,'Haissem Hassan','FW'),(13,'Ahmed Fatouh','DF'),(14,'Hamdy Fathy','MF'),(15,'Karim Hafez','DF'),
(16,'El Mahdy Soliman','GK'),(17,'Mohanad Lasheen','MF'),(18,'Nabil Emad','MF'),(19,'Ibrahim Adel','FW'),(20,'Mahmoud Saber','MF'),
(21,'Marwan Attia','MF'),(22,'Mostafa Shobeir','GK'),(23,'Tarek Alaa','DF'),(24,'Zizo','FW'),(25,'Hamza Abdelkarim','FW'),(26,'Mohamed Alaa','GK')
) AS v(num,name,pos) WHERE t.fifa_code='EGY';

INSERT INTO public.players (team_id,name,position,shirt_number,active)
SELECT t.id,v.name,v.pos,v.num,true FROM public.teams t,(VALUES
(1,'Alireza Beiranvand','GK'),(2,'Saleh Hardani','DF'),(3,'Ehsan Hajsafi','DF'),(4,'Shojae Khalilzadeh','DF'),(5,'Milad Mohammadi','DF'),
(6,'Saeid Ezatolahi','MF'),(7,'Alireza Jahanbakhsh','MF'),(8,'Mohammad Mohebi','MF'),(9,'Mehdi Taremi','FW'),(10,'Mehdi Ghayedi','FW'),
(11,'Ali Alipour','FW'),(12,'Payam Niazmand','GK'),(13,'Hossein Kanaanizadegan','DF'),(14,'Saman Ghoddos','MF'),(15,'Rouzbeh Cheshmi','MF'),
(16,'Mehdi Torabi','MF'),(17,'Aria Yousefi','DF'),(18,'Amirhossein Hosseinzadeh','FW'),(19,'Ali Nemati','DF'),(20,'Shahriyar Moghanlou','FW'),
(21,'Mohammad Ghorbani','MF'),(22,'Hossein Hosseini','GK'),(23,'Ramin Rezaeian','DF'),(24,'Dennis Eckert','FW'),(25,'Danial Eiri','DF'),(26,'Amirmohammad Razzaghinia','MF')
) AS v(num,name,pos) WHERE t.fifa_code='IRN';

INSERT INTO public.players (team_id,name,position,shirt_number,active)
SELECT t.id,v.name,v.pos,v.num,true FROM public.teams t,(VALUES
(1,'Max Crocombe','GK'),(2,'Tim Payne','DF'),(3,'Francis de Vries','DF'),(4,'Tyler Bindon','DF'),(5,'Michael Boxall','DF'),
(6,'Joe Bell','MF'),(7,'Matthew Garbett','MF'),(8,'Marko Stamenić','MF'),(9,'Chris Wood','FW'),(10,'Sarpreet Singh','MF'),
(11,'Elijah Just','MF'),(12,'Alex Paulsen','GK'),(13,'Liberato Cacace','DF'),(14,'Alex Rufer','MF'),(15,'Nando Pijnaker','DF'),
(16,'Finn Surman','DF'),(17,'Kosta Barbarouses','FW'),(18,'Ben Waine','FW'),(19,'Ben Old','MF'),(20,'Callum McCowatt','MF'),
(21,'Jesse Randall','FW'),(22,'Michael Woud','GK'),(23,'Ryan Thomas','MF'),(24,'Callan Elliot','DF'),(25,'Lachlan Bayliss','MF'),(26,'Tommy Smith','DF')
) AS v(num,name,pos) WHERE t.fifa_code='NZL';

-- ─── GROUP H ────────────────────────────────────────────────────
INSERT INTO public.players (team_id,name,position,shirt_number,active)
SELECT t.id,v.name,v.pos,v.num,true FROM public.teams t,(VALUES
(1,'Vozinha','GK'),(2,'Stopira','DF'),(3,'Diney','DF'),(4,'Roberto Lopes','DF'),(5,'Logan Costa','DF'),
(6,'Kevin Pina','MF'),(7,'Jovane Cabral','MF'),(8,'João Paulo','MF'),(9,'Gilson Benchimol','FW'),(10,'Jamiro Monteiro','MF'),
(11,'Garry Rodrigues','MF'),(12,'Márcio Rosa','GK'),(13,'Sidny Lopes Cabral','DF'),(14,'Deroy Duarte','MF'),(15,'Laros Duarte','MF'),
(16,'Yannick Semedo','MF'),(17,'Willy Semedo','MF'),(18,'Telmo Arcanjo','MF'),(19,'Dailon Livramento','FW'),(20,'Ryan Mendes','FW'),
(21,'Nuno da Costa','MF'),(22,'Steven Moreira','DF'),(23,'CJ dos Santos','GK'),(24,'Wagner Pina','DF'),(25,'Kelvin Pires','DF'),(26,'Hélio Varela','MF')
) AS v(num,name,pos) WHERE t.fifa_code='CPV';

INSERT INTO public.players (team_id,name,position,shirt_number,active)
SELECT t.id,v.name,v.pos,v.num,true FROM public.teams t,(VALUES
(1,'Mohammed Al-Owais','GK'),(2,'Saud Abdulhamid','DF'),(3,'Ali Lajami','DF'),(4,'Abdulelah Al-Amri','DF'),(5,'Hassan Al-Tambakti','DF'),
(6,'Nasser Al-Dawsari','MF'),(7,'Musab Al-Juwayr','MF'),(8,'Ayman Yahya','FW'),(9,'Firas Al-Buraikan','FW'),(10,'Salem Al-Dawsari','FW'),
(11,'Saleh Al-Shehri','FW'),(12,'Nawaf Boushal','DF'),(13,'Hassan Kadesh','DF'),(14,'Abdullah Al-Khaibari','MF'),(15,'Ali Majrashi','DF'),
(16,'Nawaf Al-Aqidi','GK'),(17,'Khalid Al-Ghannam','FW'),(18,'Alaa Al-Hejji','MF'),(19,'Abdullah Al-Hamdan','FW'),(20,'Sultan Mandash','FW'),
(21,'Ziyad Al-Johani','MF'),(22,'Ahmed Al-Kassar','GK'),(23,'Mohamed Kanno','MF'),(24,'Moteb Al-Harbi','DF'),(25,'Jehad Thakri','DF'),(26,'Mohammed Abu Al-Shamat','DF')
) AS v(num,name,pos) WHERE t.fifa_code='KSA';

INSERT INTO public.players (team_id,name,position,shirt_number,active)
SELECT t.id,v.name,v.pos,v.num,true FROM public.teams t,(VALUES
(1,'David Raya','GK'),(2,'Marc Pubill','DF'),(3,'Álex Grimaldo','DF'),(4,'Eric García','DF'),(5,'Marcos Llorente','DF'),
(6,'Mikel Merino','MF'),(7,'Ferran Torres','FW'),(8,'Fabián Ruiz','MF'),(9,'Gavi','MF'),(10,'Dani Olmo','FW'),
(11,'Yéremy Pino','FW'),(12,'Pedro Porro','DF'),(13,'Joan Garcia','GK'),(14,'Aymeric Laporte','DF'),(15,'Álex Baena','MF'),
(16,'Rodri','MF'),(17,'Nico Williams','FW'),(18,'Martín Zubimendi','MF'),(19,'Lamine Yamal','FW'),(20,'Pedri','MF'),
(21,'Mikel Oyarzabal','FW'),(22,'Pau Cubarsí','DF'),(23,'Unai Simón','GK'),(24,'Marc Cucurella','DF'),(25,'Víctor Muñoz','FW'),(26,'Borja Iglesias','FW')
) AS v(num,name,pos) WHERE t.fifa_code='ESP';

INSERT INTO public.players (team_id,name,position,shirt_number,active)
SELECT t.id,v.name,v.pos,v.num,true FROM public.teams t,(VALUES
(1,'Sergio Rochet','GK'),(2,'José Giménez','DF'),(3,'Sebastián Cáceres','DF'),(4,'Ronald Araújo','DF'),(5,'Manuel Ugarte','MF'),
(6,'Rodrigo Bentancur','MF'),(7,'Nicolás de la Cruz','MF'),(8,'Federico Valverde','MF'),(9,'Darwin Núñez','FW'),(10,'Giorgian de Arrascaeta','MF'),
(11,'Facundo Pellistri','FW'),(12,'Santiago Mele','GK'),(13,'Guillermo Varela','DF'),(14,'Mathías Olivera','DF'),(15,'Matías Viña','DF'),
(16,'Brian Rodríguez','FW'),(17,'Rodrigo Aguirre','FW'),(18,'Maximiliano Araújo','MF'),(19,'Federico Viñas','FW'),(20,'Agustín Canobbio','MF'),
(21,'Joaquín Piquerez','MF'),(22,'Fernando Muslera','GK'),(23,'Santiago Bueno','DF'),(24,'Juan Manuel Sanabria','MF'),(25,'Rodrigo Zalazar','MF'),(26,'Nahuel Nardoni','MF')
) AS v(num,name,pos) WHERE t.fifa_code='URU';

-- ─── GROUP I ────────────────────────────────────────────────────
INSERT INTO public.players (team_id,name,position,shirt_number,active)
SELECT t.id,v.name,v.pos,v.num,true FROM public.teams t,(VALUES
(1,'Mike Maignan','GK'),(2,'Malo Gusto','DF'),(3,'Lucas Digne','DF'),(4,'Dayot Upamecano','DF'),(5,'Jules Koundé','DF'),
(6,'Aurélien Tchouaméni','MF'),(7,'Ousmane Dembélé','FW'),(8,'Adrien Rabiot','MF'),(9,'Marcus Thuram','FW'),(10,'Kylian Mbappé','FW'),
(11,'Michael Olise','FW'),(12,'Bradley Barcola','FW'),(13,'N''Golo Kanté','MF'),(14,'Manu Koné','MF'),(15,'Ibrahima Konaté','DF'),
(16,'Brice Samba','GK'),(17,'William Saliba','DF'),(18,'Warren Zaïre-Emery','MF'),(19,'Théo Hernandez','DF'),(20,'Désiré Doué','FW'),
(21,'Lucas Hernandez','DF'),(22,'Jean-Philippe Mateta','FW'),(23,'Robin Risser','GK'),(24,'Rayan Cherki','MF'),(25,'Maghnes Akliouche','MF'),(26,'Maxence Lacroix','DF')
) AS v(num,name,pos) WHERE t.fifa_code='FRA';

INSERT INTO public.players (team_id,name,position,shirt_number,active)
SELECT t.id,v.name,v.pos,v.num,true FROM public.teams t,(VALUES
(1,'Fahad Talib','GK'),(2,'Rebin Sulaka','DF'),(3,'Hussein Ali','DF'),(4,'Zaid Tahseen','DF'),(5,'Akam Hashim','DF'),
(6,'Manaf Younis','DF'),(7,'Youssef Amyn','MF'),(8,'Ibrahim Bayesh','MF'),(9,'Ali Al-Hamadi','FW'),(10,'Mohanad Ali','FW'),
(11,'Ahmed Qasem','FW'),(12,'Jalal Hassan','GK'),(13,'Ali Yousif','FW'),(14,'Zidane Iqbal','MF'),(15,'Ahmed Yahya','DF'),
(16,'Amir Al-Ammari','MF'),(17,'Ali Jasim','FW'),(18,'Aymen Hussein','FW'),(19,'Kevin Yakob','MF'),(20,'Aimar Sher','MF'),
(21,'Marko Farji','FW'),(22,'Ahmed Basil','GK'),(23,'Merchas Doski','DF'),(24,'Zaid Ismail','MF'),(25,'Mustafa Saadoon','DF'),(26,'Frans Putros','DF')
) AS v(num,name,pos) WHERE t.fifa_code='IRQ';

INSERT INTO public.players (team_id,name,position,shirt_number,active)
SELECT t.id,v.name,v.pos,v.num,true FROM public.teams t,(VALUES
(1,'Ørjan Nyland','GK'),(2,'Morten Thorsby','MF'),(3,'Kristoffer Ajer','DF'),(4,'Leo Østigård','DF'),(5,'Stian Gregersen','DF'),
(6,'Patrick Berg','MF'),(7,'Alexander Sørloth','FW'),(8,'Sander Berge','MF'),(9,'Erling Haaland','FW'),(10,'Martin Ødegaard','MF'),
(11,'Jørgen Strand Larsen','FW'),(12,'Sander Tangvik','GK'),(13,'Egil Selvik','GK'),(14,'Fredrik Aursnes','MF'),(15,'Fredrik André Bjørkan','DF'),
(16,'Marcus Holmgren Pedersen','DF'),(17,'Torbjørn Heggem','DF'),(18,'Kristian Thorstvedt','MF'),(19,'Thelo Aasgaard','MF'),(20,'Antonio Nusa','FW'),
(21,'Andreas Schjelderup','MF'),(22,'Oscar Bobb','MF'),(23,'Jens Petter Hauge','MF'),(24,'Sondre Langås','DF'),(25,'David Møller Wolfe','DF'),(26,'Julian Ryerson','FW')
) AS v(num,name,pos) WHERE t.fifa_code='NOR';

INSERT INTO public.players (team_id,name,position,shirt_number,active)
SELECT t.id,v.name,v.pos,v.num,true FROM public.teams t,(VALUES
(1,'Édouard Mendy','GK'),(2,'Mamadou Sarr','DF'),(3,'Kalidou Koulibaly','DF'),(4,'Abdoulaye Seck','DF'),(5,'Idrissa Gueye','MF'),
(6,'Pathé Ciss','MF'),(7,'Assane Diao','FW'),(8,'Lamine Camara','MF'),(9,'Bamba Dieng','FW'),(10,'Sadio Mané','FW'),
(11,'Nicolas Jackson','FW'),(12,'Yehvann Diouf','GK'),(13,'Iliman Ndiaye','FW'),(14,'Ismail Jakobs','DF'),(15,'Krépin Diatta','DF'),
(16,'Pape Matar Sarr','MF'),(17,'Ismaïla Sarr','FW'),(18,'Moussa Niakhaté','DF'),(19,'Ibrahim Mbaye','FW'),(20,'Habib Diarra','MF'),
(21,'Cherif Ndiaye','FW'),(22,'Bara Sapoko Ndiaye','MF'),(23,'Mory Diaw','GK'),(24,'Antoine Mendy','DF'),(25,'El Hadji Malick Diouf','DF'),(26,'Pape Gueye','MF')
) AS v(num,name,pos) WHERE t.fifa_code='SEN';

-- ─── GROUP J ────────────────────────────────────────────────────
INSERT INTO public.players (team_id,name,position,shirt_number,active)
SELECT t.id,v.name,v.pos,v.num,true FROM public.teams t,(VALUES
(1,'Melvin Mastil','GK'),(2,'Aïssa Mandi','DF'),(3,'Achref Abada','DF'),(4,'Mohamed Amine Tougai','DF'),(5,'Zineddine Belaïd','DF'),
(6,'Ramiz Zerrouki','MF'),(7,'Riyad Mahrez','FW'),(8,'Houssem Aouar','MF'),(9,'Amine Gouiri','FW'),(10,'Farès Chaïbi','MF'),
(11,'Anis Hadj Moussa','FW'),(12,'Nadhir Benbouali','FW'),(13,'Jaouen Hadjam','DF'),(14,'Hicham Boudaoui','MF'),(15,'Rayan Aït-Nouri','DF'),
(16,'Oussama Benbot','GK'),(17,'Rafik Belghali','DF'),(18,'Mohamed Amoura','FW'),(19,'Nabil Bentaleb','MF'),(20,'Adil Boulbina','FW'),
(21,'Ramy Bensebaini','DF'),(22,'Ibrahim Maza','MF'),(23,'Luca Zidane','GK'),(24,'Yacine Titraoui','MF'),(25,'Farès Ghedjemis','FW'),(26,'Samir Chergui','DF')
) AS v(num,name,pos) WHERE t.fifa_code='ALG';

INSERT INTO public.players (team_id,name,position,shirt_number,active)
SELECT t.id,v.name,v.pos,v.num,true FROM public.teams t,(VALUES
(1,'Emiliano Martínez','GK'),(2,'Nahuel Molina','DF'),(3,'Nicolás Tagliafico','DF'),(4,'Gonzalo Montiel','DF'),(5,'Leandro Paredes','MF'),
(6,'Lisandro Martínez','DF'),(7,'Rodrigo De Paul','MF'),(8,'Enzo Fernández','MF'),(9,'Julián Alvarez','FW'),(10,'Lionel Messi','FW'),
(11,'Ángel Di María','FW'),(12,'Gerónimo Rulli','GK'),(13,'Cristian Romero','DF'),(14,'Exequiel Palacios','MF'),(15,'Nicolás González','MF'),
(16,'Thiago Almada','FW'),(17,'Giuliano Simeone','FW'),(18,'Valentín Barco','MF'),(19,'Nicolás Otamendi','DF'),(20,'Alexis Mac Allister','MF'),
(21,'Lautaro Martínez','FW'),(22,'Juan Musso','GK'),(23,'Leonardo Balerdi','DF'),(24,'Facundo Medina','DF'),(25,'Giovani Lo Celso','MF'),(26,'Nico Paz','FW')
) AS v(num,name,pos) WHERE t.fifa_code='ARG';

INSERT INTO public.players (team_id,name,position,shirt_number,active)
SELECT t.id,v.name,v.pos,v.num,true FROM public.teams t,(VALUES
(1,'Patrick Pentz','GK'),(2,'Stefan Posch','DF'),(3,'Philipp Lienhart','DF'),(4,'Kevin Danso','DF'),(5,'David Alaba','DF'),
(6,'Nicolas Seiwald','MF'),(7,'Marko Arnautović','FW'),(8,'Marcel Sabitzer','MF'),(9,'Michael Gregoritsch','FW'),(10,'Florian Grillitsch','MF'),
(11,'Konrad Laimer','MF'),(12,'Florian Wiegele','GK'),(13,'Alexander Schlager','GK'),(14,'Saša Kalajdžić','FW'),(15,'Phillipp Mwene','DF'),
(16,'Xaver Schlager','MF'),(17,'Carney Chukwuemeka','MF'),(18,'Romano Schmid','MF'),(19,'Patrick Wimmer','FW'),(20,'Alexander Prass','MF'),
(21,'David Affengruber','DF'),(22,'Marco Friedl','DF'),(23,'Lukas Mühl','DF'),(24,'Paul Wanner','MF'),(25,'Michael Svoboda','DF'),(26,'Alessandro Schöpf','MF')
) AS v(num,name,pos) WHERE t.fifa_code='AUT';

INSERT INTO public.players (team_id,name,position,shirt_number,active)
SELECT t.id,v.name,v.pos,v.num,true FROM public.teams t,(VALUES
(1,'Yazeed Abulaila','GK'),(2,'Mohammad Abu Hashish','DF'),(3,'Abdallah Nasib','DF'),(4,'Husam Abu Dahab','DF'),(5,'Yazan Al-Arab','DF'),
(6,'Amer Jamous','MF'),(7,'Mohammad Abu Zrayq','FW'),(8,'Noor Al-Rawabdeh','MF'),(9,'Ali Olwan','FW'),(10,'Musa Al-Taamari','FW'),
(11,'Odeh Al-Fakhouri','FW'),(12,'Nour Bani Attiah','GK'),(13,'Mahmoud Al-Mardi','FW'),(14,'Rajaei Ayed','MF'),(15,'Ibrahim Sadeh','MF'),
(16,'Mo Abualnadi','DF'),(17,'Salim Obaid','DF'),(18,'Saed Al-Rosan','DF'),(19,'Mohannad Abu Taha','MF'),(20,'Nizar Al-Rashdan','MF'),
(21,'Abdallah Al-Fakhouri','GK'),(22,'Ihsan Haddad','DF'),(23,'Ali Azaizeh','FW'),(24,'Mohammad Al-Dawoud','MF'),(25,'Anas Badawi','DF'),(26,'Adnan Janazreh','MF')
) AS v(num,name,pos) WHERE t.fifa_code='JOR';

-- ─── GROUP K ────────────────────────────────────────────────────
INSERT INTO public.players (team_id,name,position,shirt_number,active)
SELECT t.id,v.name,v.pos,v.num,true FROM public.teams t,(VALUES
(1,'David Ospina','GK'),(2,'Daniel Muñoz','DF'),(3,'Jhon Lucumí','DF'),(4,'Santiago Arias','DF'),(5,'Kevin Castaño','MF'),
(6,'Richard Ríos','MF'),(7,'Luis Díaz','FW'),(8,'Jorge Carrascal','MF'),(9,'Jhon Córdoba','FW'),(10,'James Rodríguez','MF'),
(11,'Jhon Arias','MF'),(12,'Camilo Vargas','GK'),(13,'Yerry Mina','DF'),(14,'Gustavo Puerta','MF'),(15,'Jefferson Lerma','MF'),
(16,'Johan Mojica','DF'),(17,'Cucho Hernández','FW'),(18,'Juan Fernando Quintero','MF'),(19,'Jaminton Campaz','FW'),(20,'Davinson Sánchez','DF'),
(21,'Álvaro Montero','GK'),(22,'Deiver Machado','DF'),(23,'Willer Ditta','DF'),(24,'Andrés Gómez','FW'),(25,'Luis Suárez','FW'),(26,'Jhon Jáder Durán','FW')
) AS v(num,name,pos) WHERE t.fifa_code='COL';

INSERT INTO public.players (team_id,name,position,shirt_number,active)
SELECT t.id,v.name,v.pos,v.num,true FROM public.teams t,(VALUES
(1,'Lionel Mpasi','GK'),(2,'Aaron Wan-Bissaka','DF'),(3,'Steve Kapuadi','DF'),(4,'Axel Tuanzebe','DF'),(5,'Dylan Batubinsika','DF'),
(6,'Ngal''ayel Mukau','MF'),(7,'Nathanaël Mbuku','MF'),(8,'Samuel Moutoussamy','MF'),(9,'Fiston Mayele','FW'),(10,'Théo Bongonda','MF'),
(11,'Gaël Kakuta','FW'),(12,'Timothy Fayulu','GK'),(13,'Meschak Elia','FW'),(14,'Noah Sadiki','MF'),(15,'Aaron Tshibola','MF'),
(16,'Matthieu Epolo','GK'),(17,'Cédric Bakambu','FW'),(18,'Charles Pickel','MF'),(19,'Yoane Wissa','FW'),(20,'Chancel Mbemba','DF'),
(21,'Simon Banza','FW'),(22,'Gédéon Kalulu','DF'),(23,'Edo Kayembe','MF'),(24,'Arthur Masuaku','DF'),(25,'Joris Kayembe','DF'),(26,'Brian Cipenga','FW')
) AS v(num,name,pos) WHERE t.fifa_code='COD';

INSERT INTO public.players (team_id,name,position,shirt_number,active)
SELECT t.id,v.name,v.pos,v.num,true FROM public.teams t,(VALUES
(1,'Diogo Costa','GK'),(2,'Nélson Semedo','DF'),(3,'Rúben Dias','DF'),(4,'Tomás Araújo','DF'),(5,'Diogo Dalot','DF'),
(6,'Matheus Nunes','MF'),(7,'Cristiano Ronaldo','FW'),(8,'Bruno Fernandes','MF'),(9,'Gonçalo Ramos','FW'),(10,'Bernardo Silva','MF'),
(11,'João Félix','FW'),(12,'José Sá','GK'),(13,'Renato Veiga','DF'),(14,'Gonçalo Inácio','DF'),(15,'João Neves','MF'),
(16,'Francisco Trincão','FW'),(17,'Rafael Leão','FW'),(18,'Pedro Neto','FW'),(19,'Gonçalo Guedes','FW'),(20,'João Cancelo','DF'),
(21,'Rúben Neves','MF'),(22,'Rui Silva','GK'),(23,'Vitinha','MF'),(24,'Nuno Mendes','DF'),(25,'Samú Costa','DF'),(26,'Francisco Conceição','FW')
) AS v(num,name,pos) WHERE t.fifa_code='POR';

INSERT INTO public.players (team_id,name,position,shirt_number,active)
SELECT t.id,v.name,v.pos,v.num,true FROM public.teams t,(VALUES
(1,'Utkir Yusupov','GK'),(2,'Abdukodir Khusanov','DF'),(3,'Khojiakbar Alijonov','DF'),(4,'Farrukh Sayfiev','DF'),(5,'Rustam Ashurmatov','DF'),
(6,'Akmal Mozgovoy','MF'),(7,'Otabek Shukurov','MF'),(8,'Jamshid Iskanderov','MF'),(9,'Eldor Shomurodov','FW'),(10,'Jaloliddin Masharipov','MF'),
(11,'Oston Urunov','MF'),(12,'Abduvohid Nematov','GK'),(13,'Sherzod Nasrullaev','DF'),(14,'Odiljon Hamrobekov','MF'),(15,'Umar Eshmurodov','DF'),
(16,'Botirali Ergashev','GK'),(17,'Dostonbek Khamdamov','MF'),(18,'Abdulla Abdullaev','DF'),(19,'Azizjon Ganiev','MF'),(20,'Azizbek Amonov','FW'),
(21,'Igor Sergeev','FW'),(22,'Abbosbek Fayzullaev','MF'),(23,'Sherzod Esanov','MF'),(24,'Bekhruz Karimov','DF'),(25,'Avazbek Ulmasaliev','DF'),(26,'Jakhongir Urozov','DF')
) AS v(num,name,pos) WHERE t.fifa_code='UZB';

-- ─── GROUP L ────────────────────────────────────────────────────
INSERT INTO public.players (team_id,name,position,shirt_number,active)
SELECT t.id,v.name,v.pos,v.num,true FROM public.teams t,(VALUES
(1,'Dominik Livaković','GK'),(2,'Josip Stanišić','DF'),(3,'Marin Pongračić','DF'),(4,'Joško Gvardiol','DF'),(5,'Duje Ćaleta-Car','DF'),
(6,'Josip Šutalo','DF'),(7,'Nikola Moro','MF'),(8,'Mateo Kovačić','MF'),(9,'Andrej Kramarić','FW'),(10,'Luka Modrić','MF'),
(11,'Ante Budimir','FW'),(12,'Ivor Pandur','GK'),(13,'Nikola Vlašić','MF'),(14,'Ivan Perišić','FW'),(15,'Mario Pašalić','MF'),
(16,'Martin Baturina','MF'),(17,'Petar Sučić','MF'),(18,'Kristijan Jakić','DF'),(19,'Luka Sučić','MF'),(20,'Igor Matanović','FW'),
(21,'Marco Pašalić','FW'),(22,'Luka Vušković','DF'),(23,'Dominik Kotarski','GK'),(24,'Toni Fruk','MF'),(25,'Martin Erlić','DF'),(26,'Petar Musa','FW')
) AS v(num,name,pos) WHERE t.fifa_code='CRO';

INSERT INTO public.players (team_id,name,position,shirt_number,active)
SELECT t.id,v.name,v.pos,v.num,true FROM public.teams t,(VALUES
(1,'Jordan Pickford','GK'),(2,'Ezri Konsa','DF'),(3,'Luke Shaw','DF'),(4,'Declan Rice','MF'),(5,'John Stones','DF'),
(6,'Marc Guéhi','DF'),(7,'Bukayo Saka','FW'),(8,'Jude Bellingham','MF'),(9,'Harry Kane','FW'),(10,'Phil Foden','MF'),
(11,'Marcus Rashford','FW'),(12,'Tino Livramento','DF'),(13,'Dean Henderson','GK'),(14,'Kobbie Mainoo','MF'),(15,'Dan Burn','DF'),
(16,'Jordan Henderson','MF'),(17,'Morgan Rogers','MF'),(18,'Anthony Gordon','FW'),(19,'Ollie Watkins','FW'),(20,'Noni Madueke','FW'),
(21,'Eberechi Eze','MF'),(22,'Ivan Toney','FW'),(23,'James Trafford','GK'),(24,'Reece James','DF'),(25,'Elliot Anderson','MF'),(26,'Jarell Quansah','DF')
) AS v(num,name,pos) WHERE t.fifa_code='ENG';

INSERT INTO public.players (team_id,name,position,shirt_number,active)
SELECT t.id,v.name,v.pos,v.num,true FROM public.teams t,(VALUES
(1,'Lawrence Ati-Zigi','GK'),(2,'Alidu Seidu','DF'),(3,'Caleb Yirenkyi','MF'),(4,'Jonas Adjetey','DF'),(5,'Thomas Partey','MF'),
(6,'Abdul Mumin','DF'),(7,'Abdul Fatawu','FW'),(8,'Kwasi Sibo','MF'),(9,'Jordan Ayew','FW'),(10,'Iñaki Williams','FW'),
(11,'Antoine Semenyo','MF'),(12,'Joseph Anang','GK'),(13,'Christopher Bonsu Baah','FW'),(14,'Gideon Mensah','DF'),(15,'Elisha Owusu','MF'),
(16,'Benjamin Asare','GK'),(17,'Abdul Rahman Baba','DF'),(18,'Jerome Opoku','DF'),(19,'Brandon Thomas-Asante','FW'),(20,'Augustine Boakye','MF'),
(21,'Kamaldeen Sulemana','FW'),(22,'Ernest Nuamah','FW'),(23,'Derrick Luckassen','DF'),(24,'Osman Bukari','FW'),(25,'Laryea Kingston','MF'),(26,'Marvin Senaya','DF')
) AS v(num,name,pos) WHERE t.fifa_code='GHA';

INSERT INTO public.players (team_id,name,position,shirt_number,active)
SELECT t.id,v.name,v.pos,v.num,true FROM public.teams t,(VALUES
(1,'Luis Mejía','GK'),(2,'César Blackman','DF'),(3,'José Córdoba','DF'),(4,'Fidel Escobar','DF'),(5,'Edgardo Fariña','DF'),
(6,'Cristian Martínez','MF'),(7,'José Luis Rodríguez','MF'),(8,'Adalberto Carrasquilla','MF'),(9,'Tomás Rodríguez','FW'),(10,'Ismael Díaz','MF'),
(11,'Yoel Bárcenas','MF'),(12,'César Samudio','GK'),(13,'Jiovany Ramos','DF'),(14,'Carlos Harvey','DF'),(15,'Eric Davis','DF'),
(16,'Andrés Andrade','DF'),(17,'José Fajardo','FW'),(18,'Cecilio Waterman','FW'),(19,'Alberto Quintero','MF'),(20,'Aníbal Godoy','MF'),
(21,'César Yanis','MF'),(22,'Orlando Mosquera','GK'),(23,'Michael Amir Murillo','DF'),(24,'Azarias Londoño','FW'),(25,'Roderick Miller','DF'),(26,'Jorge Gutiérrez','DF')
) AS v(num,name,pos) WHERE t.fifa_code='PAN';

-- ================================================================
-- Verify: should return 1248
-- SELECT COUNT(*) FROM public.players;
-- ================================================================
