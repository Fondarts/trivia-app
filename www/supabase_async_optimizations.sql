-- ==========================================
-- OPTIMIZACIONES PARA PARTIDAS ASÍNCRONAS
-- Fase 1: Quick Wins
-- ==========================================

-- ==========================================
-- 1. AGREGAR CAMPOS CALCULADOS A async_matches
-- ==========================================

-- Agregar campos para tracking de respuestas (evita consultar async_answers)
ALTER TABLE async_matches
ADD COLUMN IF NOT EXISTS player1_answered_current BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS player2_answered_current BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS current_turn_player_id UUID,
ADD COLUMN IF NOT EXISTS last_answer_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Comentarios para documentación
COMMENT ON COLUMN async_matches.player1_answered_current IS 'Indica si player1 ya respondió la pregunta actual';
COMMENT ON COLUMN async_matches.player2_answered_current IS 'Indica si player2 ya respondió la pregunta actual';
COMMENT ON COLUMN async_matches.current_turn_player_id IS 'ID del jugador cuyo turno es responder (null si ambos respondieron)';
COMMENT ON COLUMN async_matches.last_answer_time IS 'Timestamp de la última respuesta recibida';
COMMENT ON COLUMN async_matches.updated_at IS 'Timestamp de última actualización (para ordenamiento)';

-- ==========================================
-- 2. CREAR FUNCIÓN PARA ACTUALIZAR CAMPOS CALCULADOS
-- ==========================================

CREATE OR REPLACE FUNCTION update_match_answer_status()
RETURNS TRIGGER AS $$
DECLARE
  match_record async_matches%ROWTYPE;
  player1_answered BOOLEAN := FALSE;
  player2_answered BOOLEAN := FALSE;
  answer_count INTEGER;
BEGIN
  -- Obtener datos de la partida
  SELECT * INTO match_record
  FROM async_matches
  WHERE id = NEW.match_id
  FOR UPDATE; -- Lock para evitar race conditions
  
  -- Si no existe la partida, no hacer nada
  IF NOT FOUND THEN
    RETURN NEW;
  END IF;
  
  -- Verificar si player1 respondió esta pregunta
  SELECT COUNT(*) > 0 INTO player1_answered
  FROM async_answers
  WHERE match_id = NEW.match_id
    AND question_index = NEW.question_index
    AND player_id = match_record.player1_id;
  
  -- Verificar si player2 respondió esta pregunta
  SELECT COUNT(*) > 0 INTO player2_answered
  FROM async_answers
  WHERE match_id = NEW.match_id
    AND question_index = NEW.question_index
    AND player_id = match_record.player2_id;
  
  -- Determinar current_turn_player_id
  -- null = ambos respondieron o ninguno
  -- player_id = ese jugador aún no responde
  DECLARE
    turn_player_id UUID := NULL;
  BEGIN
    IF player1_answered AND NOT player2_answered THEN
      turn_player_id := match_record.player2_id;
    ELSIF player2_answered AND NOT player1_answered THEN
      turn_player_id := match_record.player1_id;
    ELSE
      turn_player_id := NULL; -- Ambos respondieron o ninguno
    END IF;
    
    -- Actualizar campos calculados en async_matches
    UPDATE async_matches
    SET 
      player1_answered_current = player1_answered,
      player2_answered_current = player2_answered,
      current_turn_player_id = turn_player_id,
      last_answer_time = NEW.answered_at,
      updated_at = NOW()
    WHERE id = NEW.match_id;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 3. CREAR TRIGGER QUE ACTUALIZA CAMPOS AUTOMÁTICAMENTE
-- ==========================================

-- Eliminar trigger anterior si existe
DROP TRIGGER IF EXISTS trigger_update_match_answer_status ON async_answers;

-- Crear trigger que se ejecuta después de insertar respuesta
CREATE TRIGGER trigger_update_match_answer_status
AFTER INSERT ON async_answers
FOR EACH ROW
EXECUTE FUNCTION update_match_answer_status();

-- ==========================================
-- 4. CREAR FUNCIÓN RPC PARA OBTENER PARTIDAS DEL USUARIO
-- ==========================================

CREATE OR REPLACE FUNCTION get_user_async_matches(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  request_id UUID,
  player1_id UUID,
  player1_name TEXT,
  player2_id UUID,
  player2_name TEXT,
  rounds INTEGER,
  category TEXT,
  difficulty TEXT,
  deck JSONB,
  status TEXT,
  current_question INTEGER,
  question_start_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  player1_answered_current BOOLEAN,
  player2_answered_current BOOLEAN,
  current_turn_player_id UUID,
  last_answer_time TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.request_id,
    m.player1_id,
    m.player1_name,
    m.player2_id,
    m.player2_name,
    m.rounds,
    m.category,
    m.difficulty,
    m.deck,
    m.status,
    m.current_question,
    m.question_start_time,
    m.created_at,
    m.finished_at,
    m.player1_answered_current,
    m.player2_answered_current,
    m.current_turn_player_id,
    m.last_answer_time,
    m.updated_at
  FROM async_matches m
  WHERE (m.player1_id = p_user_id OR m.player2_id = p_user_id)
    -- Excluir partidas terminadas
    AND m.status NOT IN ('finished', 'abandoned')
    -- Filtrar partidas expiradas en BD (no en frontend)
    AND (
      -- Partida no activa aún: máximo 24 horas desde creación
      (m.status != 'question_active' AND m.created_at > NOW() - INTERVAL '24 hours')
      OR
      -- Partidas activas: máximo 12 horas desde última pregunta (cambiado de 16h)
      (m.status = 'question_active' AND (
        m.question_start_time IS NULL OR 
        m.question_start_time > NOW() - INTERVAL '12 hours'
      ))
      OR
      -- Partida terminada (ya filtrada arriba, pero por si acaso)
      m.status = 'finished'
    )
    -- Excluir partidas que completaron todas las preguntas
    AND (m.current_question IS NULL OR m.current_question < m.rounds)
  ORDER BY 
    -- Partidas activas primero (en orden de última actualización)
    CASE WHEN m.status = 'question_active' THEN 0 ELSE 1 END,
    m.updated_at DESC NULLS LAST,
    m.created_at DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentario para documentación
COMMENT ON FUNCTION get_user_async_matches(UUID) IS 'Obtiene todas las partidas asíncronas activas de un usuario, con filtrado optimizado en BD';

-- ==========================================
-- 5. CREAR ÍNDICES OPTIMIZADOS
-- ==========================================

-- Índice compuesto para la función get_user_async_matches
-- Cubre la condición WHERE más común
CREATE INDEX IF NOT EXISTS idx_async_matches_user_active 
ON async_matches(player1_id, player2_id, status, current_question, updated_at DESC NULLS LAST)
WHERE status IN ('active', 'question_active', 'ready', 'waiting_start');

-- Índice para búsqueda rápida por match_id y question_index (usado en trigger)
CREATE INDEX IF NOT EXISTS idx_async_answers_match_question_player
ON async_answers(match_id, question_index, player_id);

-- Índice para ordenamiento por updated_at (para obtener partidas más recientes)
CREATE INDEX IF NOT EXISTS idx_async_matches_updated_at 
ON async_matches(updated_at DESC NULLS LAST)
WHERE status NOT IN ('finished', 'abandoned');

-- Índice para matchmaking (usado en startAsyncRandomSearch)
CREATE INDEX IF NOT EXISTS idx_async_requests_matchmaking 
ON async_match_requests(status, rounds, category, difficulty, created_at DESC)
WHERE status = 'pending';

-- ==========================================
-- 6. FUNCIÓN PARA LIMPIAR PARTIDAS EXPIRADAS (OPTIMIZADA)
-- ==========================================

CREATE OR REPLACE FUNCTION cleanup_expired_async_matches()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Eliminar partidas expiradas en una sola query
  WITH expired_matches AS (
    SELECT id
    FROM async_matches
    WHERE (
      -- Partidas terminadas
      status IN ('finished', 'abandoned')
      OR
      -- Partidas con todas las preguntas completadas
      (current_question IS NOT NULL AND current_question >= rounds)
      OR
      -- Partidas inactivas de más de 24 horas
      (status != 'question_active' AND created_at < NOW() - INTERVAL '24 hours')
      OR
      -- Partidas activas abandonadas (más de 12 horas sin respuesta - cambiado de 16h)
      (status = 'question_active' 
       AND question_start_time IS NOT NULL 
       AND question_start_time < NOW() - INTERVAL '12 hours')
    )
    LIMIT 100 -- Limitar para no bloquear BD
  )
  DELETE FROM async_matches
  WHERE id IN (SELECT id FROM expired_matches);
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 7. MIGRAR DATOS EXISTENTES (Si hay partidas activas)
-- ==========================================

-- Actualizar campos calculados para partidas existentes
-- Esto solo se ejecuta una vez al aplicar la migración
DO $$
DECLARE
  match_record RECORD;
  player1_answered BOOLEAN;
  player2_answered BOOLEAN;
BEGIN
  -- Solo actualizar partidas que tienen respuestas pero los campos calculados están en FALSE
  FOR match_record IN 
    SELECT DISTINCT m.id, m.current_question, m.player1_id, m.player2_id
    FROM async_matches m
    WHERE m.status IN ('active', 'question_active', 'ready')
      AND m.current_question IS NOT NULL
      AND (m.player1_answered_current = FALSE OR m.player2_answered_current = FALSE)
  LOOP
    -- Verificar respuestas para la pregunta actual
    SELECT 
      COUNT(*) FILTER (WHERE player_id = match_record.player1_id) > 0,
      COUNT(*) FILTER (WHERE player_id = match_record.player2_id) > 0
    INTO player1_answered, player2_answered
    FROM async_answers
    WHERE match_id = match_record.id
      AND question_index = match_record.current_question;
    
    -- Actualizar campos calculados
    UPDATE async_matches
    SET 
      player1_answered_current = COALESCE(player1_answered, FALSE),
      player2_answered_current = COALESCE(player2_answered, FALSE),
      current_turn_player_id = CASE
        WHEN player1_answered AND NOT player2_answered THEN match_record.player2_id
        WHEN player2_answered AND NOT player1_answered THEN match_record.player1_id
        ELSE NULL
      END,
      updated_at = NOW()
    WHERE id = match_record.id;
  END LOOP;
END;
$$;

-- ==========================================
-- NOTAS
-- ==========================================

-- Para aplicar estas optimizaciones:
-- 1. Ejecutar este script en Supabase SQL Editor
-- 2. Verificar que los triggers funcionan correctamente
-- 3. Actualizar el código JavaScript para usar los nuevos campos
-- 4. Monitorear performance

-- Para verificar que los triggers funcionan:
-- SELECT * FROM async_matches WHERE id = 'tu-match-id';
-- INSERT INTO async_answers (match_id, player_id, question_index, answer, time_spent) VALUES (...);
-- SELECT * FROM async_matches WHERE id = 'tu-match-id'; -- Debe actualizarse automáticamente

