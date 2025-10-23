-- Script para actualizar partidas existentes con nombres reales
-- ⚠️ ADVERTENCIA: Este script actualizará TODAS las partidas existentes

-- 1. Ver partidas actuales
SELECT id, player1_name, player2_name, created_at 
FROM public.async_matches 
ORDER BY created_at DESC;

-- 2. Actualizar nombres genéricos a nombres más descriptivos
UPDATE public.async_matches 
SET player1_name = 'Jugador ' || SUBSTRING(player1_id, 1, 4)
WHERE player1_name = 'Anon' OR player1_name IS NULL OR player1_name = '';

UPDATE public.async_matches 
SET player2_name = 'Jugador ' || SUBSTRING(player2_id, 1, 4)
WHERE player2_name = 'Anon' OR player2_name IS NULL OR player2_name = '';

-- 3. Ver partidas actualizadas
SELECT id, player1_name, player2_name, created_at 
FROM public.async_matches 
ORDER BY created_at DESC;
