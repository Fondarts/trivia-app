-- Script para limpiar la tabla async_match_requests
-- ⚠️ ADVERTENCIA: Este script eliminará TODOS los registros de la tabla

-- 1. Ver cuántos registros hay antes de eliminar
SELECT COUNT(*) as total_registros FROM public.async_match_requests;

-- 2. Ver algunos registros de ejemplo antes de eliminar
SELECT id, requester_id, accepter_id, status, created_at 
FROM public.async_match_requests 
ORDER BY created_at DESC 
LIMIT 5;

-- 3. Eliminar todos los registros
DELETE FROM public.async_match_requests;

-- 4. Verificar que se eliminaron todos
SELECT COUNT(*) as registros_restantes FROM public.async_match_requests;

-- 5. Opcional: Resetear el contador de ID si usas SERIAL
-- ALTER SEQUENCE async_match_requests_id_seq RESTART WITH 1;
