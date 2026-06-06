-- ================================================================
-- Migration 008: Spanish team names (es-MX) + fix players active
-- ================================================================

-- Ensure all players are active (fixes null active from older inserts)
UPDATE public.players SET active = true WHERE active IS NULL OR active = false;

-- ================================================================
-- Team names → Spanish (Mexico)
-- ================================================================
UPDATE public.teams SET name = 'Argelia'                   WHERE fifa_code = 'ALG';
UPDATE public.teams SET name = 'Alemania'                  WHERE fifa_code = 'GER';
UPDATE public.teams SET name = 'Arabia Saudita'            WHERE fifa_code = 'KSA';
UPDATE public.teams SET name = 'Argentina'                 WHERE fifa_code = 'ARG';
UPDATE public.teams SET name = 'Australia'                 WHERE fifa_code = 'AUS';
UPDATE public.teams SET name = 'Austria'                   WHERE fifa_code = 'AUT';
UPDATE public.teams SET name = 'Bélgica'                   WHERE fifa_code = 'BEL';
UPDATE public.teams SET name = 'Bosnia y Herzegovina'      WHERE fifa_code = 'BIH';
UPDATE public.teams SET name = 'Brasil'                    WHERE fifa_code = 'BRA';
UPDATE public.teams SET name = 'Cabo Verde'                WHERE fifa_code = 'CPV';
UPDATE public.teams SET name = 'Canadá'                    WHERE fifa_code = 'CAN';
UPDATE public.teams SET name = 'Catar'                     WHERE fifa_code = 'QAT';
UPDATE public.teams SET name = 'Colombia'                  WHERE fifa_code = 'COL';
UPDATE public.teams SET name = 'Corea del Sur'             WHERE fifa_code = 'KOR';
UPDATE public.teams SET name = 'Costa de Marfil'           WHERE fifa_code = 'CIV';
UPDATE public.teams SET name = 'Croacia'                   WHERE fifa_code = 'CRO';
UPDATE public.teams SET name = 'Curaçao'                   WHERE fifa_code = 'CUW';
UPDATE public.teams SET name = 'Ecuador'                   WHERE fifa_code = 'ECU';
UPDATE public.teams SET name = 'Egipto'                    WHERE fifa_code = 'EGY';
UPDATE public.teams SET name = 'Escocia'                   WHERE fifa_code = 'SCO';
UPDATE public.teams SET name = 'España'                    WHERE fifa_code = 'ESP';
UPDATE public.teams SET name = 'Estados Unidos'            WHERE fifa_code = 'USA';
UPDATE public.teams SET name = 'Francia'                   WHERE fifa_code = 'FRA';
UPDATE public.teams SET name = 'Ghana'                     WHERE fifa_code = 'GHA';
UPDATE public.teams SET name = 'Haití'                     WHERE fifa_code = 'HAI';
UPDATE public.teams SET name = 'Inglaterra'                WHERE fifa_code = 'ENG';
UPDATE public.teams SET name = 'Irán'                      WHERE fifa_code = 'IRN';
UPDATE public.teams SET name = 'Irak'                      WHERE fifa_code = 'IRQ';
UPDATE public.teams SET name = 'Japón'                     WHERE fifa_code = 'JPN';
UPDATE public.teams SET name = 'Jordania'                  WHERE fifa_code = 'JOR';
UPDATE public.teams SET name = 'Marruecos'                 WHERE fifa_code = 'MAR';
UPDATE public.teams SET name = 'México'                    WHERE fifa_code = 'MEX';
UPDATE public.teams SET name = 'Nigeria'                   WHERE fifa_code = 'NGA';
UPDATE public.teams SET name = 'Noruega'                   WHERE fifa_code = 'NOR';
UPDATE public.teams SET name = 'Nueva Zelanda'             WHERE fifa_code = 'NZL';
UPDATE public.teams SET name = 'Países Bajos'              WHERE fifa_code = 'NED';
UPDATE public.teams SET name = 'Panamá'                    WHERE fifa_code = 'PAN';
UPDATE public.teams SET name = 'Paraguay'                  WHERE fifa_code = 'PAR';
UPDATE public.teams SET name = 'Portugal'                  WHERE fifa_code = 'POR';
UPDATE public.teams SET name = 'Rep. Dem. del Congo'       WHERE fifa_code = 'COD';
UPDATE public.teams SET name = 'República Checa'           WHERE fifa_code = 'CZE';
UPDATE public.teams SET name = 'Senegal'                   WHERE fifa_code = 'SEN';
UPDATE public.teams SET name = 'Sudáfrica'                 WHERE fifa_code = 'RSA';
UPDATE public.teams SET name = 'Suecia'                    WHERE fifa_code = 'SWE';
UPDATE public.teams SET name = 'Suiza'                     WHERE fifa_code = 'SUI';
UPDATE public.teams SET name = 'Túnez'                     WHERE fifa_code = 'TUN';
UPDATE public.teams SET name = 'Turquía'                   WHERE fifa_code = 'TUR';
UPDATE public.teams SET name = 'Uruguay'                   WHERE fifa_code = 'URU';
UPDATE public.teams SET name = 'Uzbekistán'                WHERE fifa_code = 'UZB';
