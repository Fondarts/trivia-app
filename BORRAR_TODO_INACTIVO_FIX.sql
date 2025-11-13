-- ==========================================
-- LIMPIEZA AGRESIVA: BORRAR TODO LO INACTIVO (CORREGIDO)
-- ==========================================
-- Solo conserva partidas realmente activas (con actividad en últimas 72h)
-- ==========================================

-- ==========================================
-- 1. FUNCIÓN PARA BORRAR PARTIDAS INACTIVAS
-- ==========================================

DROP FUNCTION IF EXISTS cleanup_expired_async_matches();

CREATE OR REPLACE FUNCTION cleanup_expired_async_matches()
RETURNS INTEGER AS $$
DECLARE
  deleted_matches_count INTEGER := 0;
  match_record RECORD;
  ultima_actividad TIMESTAMPTZ;
  horas_sin_actividad NUMERIC;
  ultima_respuesta TIMESTAMPTZ;
BEGIN
  -- Iterar sobre TODAS las partidas
  FOR match_record IN
    SELECT id, status, updated_at, question_start_time, created_at, finished_at
    FROM async_matches
  LOOP
    -- Obtener última respuesta si existe
    SELECT MAX(answered_at) INTO ultima_respuesta
    FROM async_answers
    WHERE match_id = match_record.id;
    
    -- Calcular última actividad (la más reciente)
    ultima_actividad := GREATEST(
      COALESCE(match_record.updated_at, '1970-01-01'::timestamptz),
      COALESCE(match_record.question_start_time, '1970-01-01'::timestamptz),
      COALESCE(ultima_respuesta, '1970-01-01'::timestamptz),
      COALESCE(match_record.finished_at, '1970-01-01'::timestamptz),
      COALESCE(match_record.created_at, '1970-01-01'::timestamptz)
    );
    
    -- Calcular horas sin actividad
    horas_sin_actividad := EXTRACT(EPOCH FROM (NOW() - ultima_actividad)) / 3600;
    
    -- BORRAR si:
    -- 1. Tiene más de 72 horas sin actividad, O
    -- 2. Está marcada como 'finished' o 'abandoned' (sin importar el tiempo)
    IF horas_sin_actividad >= 72 OR match_record.status IN ('finished', 'abandoned') THEN
      -- Borrar respuestas primero
      DELETE FROM async_answers WHERE match_id = match_record.id;
      
      -- Borrar partida
      DELETE FROM async_matches WHERE id = match_record.id;
      
      deleted_matches_count := deleted_matches_count + 1;
    END IF;
  END LOOP;
  
  RETURN deleted_matches_count;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 2. FUNCIÓN PARA BORRAR SOLICITUDES INACTIVAS (CORREGIDA)
-- ==========================================
-- IMPORTANTE: Solo borra solicitudes que NO tienen partidas asociadas

DROP FUNCTION IF EXISTS cleanup_expired_requests();

CREATE OR REPLACE FUNCTION cleanup_expired_requests()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- BORRAR todas las solicitudes que:
  -- 1. Están pendientes y tienen más de 48 horas, O
  -- 2. Están aceptadas/canceladas/rechazadas (ya no son activas)
  -- Y que NO tienen partidas asociadas (para evitar foreign key constraint)
  DELETE FROM async_match_requests 
  WHERE (
    -- Solicitudes pendientes expiradas
    (status = 'pending' AND (expires_at < NOW() OR created_at < NOW() - INTERVAL '48 hours'))
    OR
    -- Solicitudes ya procesadas (no activas)
    status IN ('accepted', 'cancelled', 'rejected')
  )
  -- IMPORTANTE: Solo borrar si NO hay partidas que referencien esta solicitud
  AND NOT EXISTS (
    SELECT 1 FROM async_matches WHERE request_id = async_match_requests.id
  );
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 3. EJECUTAR LIMPIEZA COMPLETA
-- ==========================================
-- IMPORTANTE: Ejecutar primero las partidas, luego las solicitudes
-- (porque las partidas pueden referenciar solicitudes)

-- Primero borrar partidas inactivas
SELECT cleanup_expired_async_matches() as partidas_borradas;

-- Luego borrar solicitudes inactivas (ya no habrá foreign key errors)
SELECT cleanup_expired_requests() as solicitudes_borradas;

-- ==========================================
-- 4. VERIFICAR QUÉ QUEDÓ (SOLO LO ACTIVO)
-- ==========================================

-- Ver partidas activas que quedaron
SELECT 
  id,
  status,
  created_at,
  updated_at,
  question_start_time,
  EXTRACT(EPOCH FROM (NOW() - COALESCE(updated_at, question_start_time, created_at))) / 3600 as horas_desde_actividad
FROM async_matches
WHERE status NOT IN ('finished', 'abandoned')
  AND COALESCE(updated_at, question_start_time, created_at) > NOW() - INTERVAL '72 hours'
ORDER BY created_at DESC;

-- Ver solicitudes activas que quedaron
SELECT 
  id,
  status,
  created_at,
  expires_at
FROM async_match_requests
WHERE status = 'pending'
  AND expires_at > NOW()
  AND created_at > NOW() - INTERVAL '48 hours'
ORDER BY created_at DESC;

