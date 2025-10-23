-- Script para verificar la estructura real de las tablas

-- 1. Ver estructura de async_matches
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'async_matches' 
ORDER BY ordinal_position;

-- 2. Ver estructura de async_match_requests  
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'async_match_requests' 
ORDER BY ordinal_position;

-- 3. Ver algunos registros de ejemplo de async_matches
SELECT * FROM public.async_matches LIMIT 3;

-- 4. Ver algunos registros de ejemplo de async_match_requests
SELECT * FROM public.async_match_requests LIMIT 3;
