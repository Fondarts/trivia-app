-- Script para deshabilitar RLS temporalmente y verificar datos

-- 1. Deshabilitar RLS en async_matches temporalmente
ALTER TABLE public.async_matches DISABLE ROW LEVEL SECURITY;

-- 2. Deshabilitar RLS en async_match_requests temporalmente  
ALTER TABLE public.async_match_requests DISABLE ROW LEVEL SECURITY;

-- 3. Verificar que se deshabilitó
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('async_matches', 'async_match_requests');

-- 4. Verificar datos en las tablas
SELECT COUNT(*) as total_async_matches FROM public.async_matches;
SELECT COUNT(*) as total_async_requests FROM public.async_match_requests;

-- 5. Ver algunos registros de ejemplo de async_matches
SELECT id, requester_id, accepter_id, status, created_at 
FROM public.async_matches 
ORDER BY created_at DESC 
LIMIT 5;

-- 6. Ver algunos registros de ejemplo de async_match_requests
SELECT id, requester_id, requester_name, status, created_at 
FROM public.async_match_requests 
ORDER BY created_at DESC 
LIMIT 5;
