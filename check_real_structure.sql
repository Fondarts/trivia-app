-- Script para ver la estructura real de la tabla async_matches

-- 1. Ver todas las columnas de async_matches
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'async_matches' 
ORDER BY ordinal_position;

-- 2. Ver algunos registros de ejemplo para entender la estructura
SELECT * FROM public.async_matches LIMIT 3;

-- 3. Ver la estructura de async_match_requests también
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'async_match_requests' 
ORDER BY ordinal_position;

-- 4. Ver algunos registros de async_match_requests
SELECT * FROM public.async_match_requests LIMIT 3;
