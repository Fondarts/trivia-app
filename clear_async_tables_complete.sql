-- Script para limpiar TODAS las tablas de partidas asíncronas
-- ⚠️ ADVERTENCIA: Este script eliminará TODOS los registros de ambas tablas

-- 1. Ver cuántos registros hay en cada tabla
SELECT 'async_matches' as tabla, COUNT(*) as total_registros FROM public.async_matches
UNION ALL
SELECT 'async_match_requests' as tabla, COUNT(*) as total_registros FROM public.async_match_requests;

-- 2. Ver algunos registros de ejemplo antes de eliminar
SELECT 'async_matches' as tabla, id, request_id, player1_id, player2_id, status, created_at 
FROM public.async_matches 
UNION ALL
SELECT 'async_match_requests' as tabla, id, requester_id, accepter_id, status, created_at 
FROM public.async_match_requests 
ORDER BY created_at DESC 
LIMIT 6;

-- 3. Eliminar PRIMERO async_matches (tabla que tiene la clave foránea)
DELETE FROM public.async_matches;

-- 4. Eliminar DESPUÉS async_match_requests (tabla referenciada)
DELETE FROM public.async_match_requests;

-- 5. Verificar que se eliminaron todos
SELECT 'async_matches' as tabla, COUNT(*) as registros_restantes FROM public.async_matches
UNION ALL
SELECT 'async_match_requests' as tabla, COUNT(*) as registros_restantes FROM public.async_match_requests;

-- 6. Opcional: Resetear contadores de ID si usas SERIAL
-- ALTER SEQUENCE async_matches_id_seq RESTART WITH 1;
-- ALTER SEQUENCE async_match_requests_id_seq RESTART WITH 1;
