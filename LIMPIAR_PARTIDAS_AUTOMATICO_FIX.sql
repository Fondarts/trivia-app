-- ==========================================
-- FUNCIONES PARA LIMPIEZA AUTOMÁTICA (CORREGIDO)
-- ==========================================
-- 
-- 1. Elimina partidas abiertas sin actualización en 72 horas
-- 2. Elimina solicitudes sin aceptar después de 48 horas
-- ==========================================

-- ==========================================
-- 1. ACTUALIZAR FUNCIÓN DE LIMPIEZA DE PARTIDAS
-- ==========================================
-- Elimina automáticamente partidas abiertas sin actualización en 72 horas

-- Eliminar función existente si tiene diferente tipo de retorno
DROP FUNCTION IF EXISTS cleanup_expired_async_matches();

CREATE OR REPLACE FUNCTION cleanup_expired_async_matches()
RETURNS INTEGER AS $$
DECLARE
  deleted_answers_count INTEGER;
  deleted_matches_count INTEGER;
  match_ids_to_delete UUID[];
BEGIN
  -- PASO 1: Identificar partidas abiertas sin actualización en 72 horas
  -- Usar la fecha más reciente entre: updated_at, question_start_time, last_answer_time, created_at
  WITH matches_to_delete AS (
    SELECT id
    FROM async_matches
    WHERE status NOT IN ('finished', 'abandoned')
      AND (
        -- Partidas sin actualización en 72 horas
        -- Usar COALESCE para obtener la fecha más reciente de actividad
        COALESCE(
          updated_at,
          question_start_time,
          (SELECT MAX(answered_at) FROM async_answers WHERE match_id = async_matches.id),
          created_at
        ) < NOW() - INTERVAL '72 hours'
      )
    LIMIT 100 -- Limitar para no bloquear BD
  )
  SELECT ARRAY_AGG(id) INTO match_ids_to_delete
  FROM matches_to_delete;
  
  -- PASO 2: Si hay partidas para borrar, eliminar primero las respuestas
  IF match_ids_to_delete IS NOT NULL AND array_length(match_ids_to_delete, 1) > 0 THEN
    -- Borrar respuestas de las partidas que se van a eliminar
    DELETE FROM async_answers
    WHERE match_id = ANY(match_ids_to_delete);
    
    GET DIAGNOSTICS deleted_answers_count = ROW_COUNT;
    
    -- Borrar las partidas
    DELETE FROM async_matches
    WHERE id = ANY(match_ids_to_delete);
    
    GET DIAGNOSTICS deleted_matches_count = ROW_COUNT;
  ELSE
    deleted_answers_count := 0;
    deleted_matches_count := 0;
  END IF;
  
  -- PASO 3: También borrar partidas terminadas muy antiguas (más de 30 días)
  -- Primero borrar respuestas
  DELETE FROM async_answers
  WHERE match_id IN (
    SELECT id 
    FROM async_matches 
    WHERE status IN ('finished', 'abandoned')
      AND finished_at IS NOT NULL
      AND finished_at < NOW() - INTERVAL '30 days'
  );
  
  -- Luego borrar las partidas
  DELETE FROM async_matches
  WHERE status IN ('finished', 'abandoned')
    AND finished_at IS NOT NULL
    AND finished_at < NOW() - INTERVAL '30 days'
    AND NOT EXISTS (
      SELECT 1 FROM async_answers WHERE match_id = async_matches.id
    );
  
  -- Retornar el total de partidas borradas
  RETURN COALESCE(deleted_matches_count, 0);
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 2. ACTUALIZAR FUNCIÓN DE LIMPIEZA DE SOLICITUDES
-- ==========================================
-- Elimina automáticamente solicitudes sin aceptar después de 48 horas

-- Eliminar función existente si tiene diferente tipo de retorno
DROP FUNCTION IF EXISTS cleanup_expired_requests();

CREATE OR REPLACE FUNCTION cleanup_expired_requests()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- BORRAR solicitudes pendientes que:
  -- 1. Tienen expires_at expirado, O
  -- 2. Fueron creadas hace más de 48 horas (por si expires_at no está configurado)
  DELETE FROM async_match_requests 
  WHERE status = 'pending' 
  AND (
    expires_at < NOW()
    OR
    created_at < NOW() - INTERVAL '48 hours'
  );
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 3. EJECUTAR LIMPIEZA AHORA
-- ==========================================

-- Procesar timeouts pendientes
SELECT check_and_process_async_timeouts();

-- Limpiar solicitudes expiradas (más de 48 horas sin aceptar)
SELECT cleanup_expired_requests();

-- Limpiar partidas abiertas sin actualización (más de 72 horas)
SELECT cleanup_expired_async_matches();

