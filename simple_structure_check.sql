-- Script simple para ver la estructura real de async_matches

-- 1. Ver todas las columnas de async_matches
SELECT column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'async_matches' 
ORDER BY ordinal_position;

-- 2. Ver un registro completo para entender la estructura
SELECT * FROM public.async_matches LIMIT 1;
