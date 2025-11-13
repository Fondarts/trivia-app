-- ==========================================
-- CORRECCIONES DE SINCRONIZACIÓN PARA PARTIDAS ASÍNCRONAS
-- ==========================================

-- ==========================================
-- 1. FUNCIÓN PARA ACTUALIZAR CAMPOS AL AVANZAR PREGUNTA
-- ==========================================

-- Esta función se ejecuta cuando ambos jugadores responden
-- Resetea los campos de respuesta y actualiza la pregunta actual
CREATE OR REPLACE FUNCTION advance_async_question(p_match_id UUID, p_next_question INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE async_matches
  SET 
    current_question = p_next_question,
    player1_answered_current = FALSE,  -- Resetear para nueva pregunta
    player2_answered_current = FALSE,  -- Resetear para nueva pregunta
    current_turn_player_id = NULL,     -- Ningún jugador ha respondido aún
    question_start_time = NOW(),       -- Iniciar timer de 6h para nueva pregunta
    status = 'question_active',
    updated_at = NOW()
  WHERE id = p_match_id;
END;
$$ LANGUAGE plpgsql;

-- Comentario
COMMENT ON FUNCTION advance_async_question(UUID, INTEGER) IS 'Avanza a la siguiente pregunta y resetea campos de respuesta';

-- ==========================================
-- 2. FUNCIÓN PARA OBTENER LA PRIMERA PREGUNTA DISPONIBLE
-- ==========================================

-- Esta función determina qué pregunta debe ver el jugador
-- Retorna el índice de la primera pregunta donde el jugador NO ha respondido
-- Si ambas respondieron todas hasta X, retorna X+1
CREATE OR REPLACE FUNCTION get_current_question_for_player(p_match_id UUID, p_player_id UUID)
RETURNS INTEGER AS $$
DECLARE
  match_record async_matches%ROWTYPE;
  max_answered_question INTEGER := -1;
  player_question INTEGER;
  i INTEGER;
  player1_answered BOOLEAN;
  player2_answered BOOLEAN;
BEGIN
  -- Obtener datos de la partida
  SELECT * INTO match_record
  FROM async_matches
  WHERE id = p_match_id;
  
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  
  -- Verificar hasta qué pregunta avanzaron ambos jugadores
  FOR i IN 0..(match_record.rounds - 1) LOOP
    -- Verificar si player1 respondió esta pregunta
    SELECT COUNT(*) > 0 INTO player1_answered
    FROM async_answers
    WHERE match_id = p_match_id
      AND question_index = i
      AND player_id = match_record.player1_id;
    
    -- Verificar si player2 respondió esta pregunta
    SELECT COUNT(*) > 0 INTO player2_answered
    FROM async_answers
    WHERE match_id = p_match_id
      AND question_index = i
      AND player_id = match_record.player2_id;
    
    -- Si ambos respondieron, esta pregunta está completada
    IF player1_answered AND player2_answered THEN
      max_answered_question := i;
    ELSE
      -- Si encontramos una pregunta donde alguno no respondió, parar aquí
      EXIT;
    END IF;
  END LOOP;
  
  -- La siguiente pregunta disponible es max_answered_question + 1
  -- O la primera pregunta (0) si no hay ninguna completada
  player_question := max_answered_question + 1;
  
  -- Verificar límites
  IF player_question >= match_record.rounds THEN
    -- Partida terminada
    RETURN NULL;
  END IF;
  
  RETURN player_question;
END;
$$ LANGUAGE plpgsql;

-- Comentario
COMMENT ON FUNCTION get_current_question_for_player(UUID, UUID) IS 'Retorna el índice de la primera pregunta que el jugador debe responder';

-- ==========================================
-- 3. ACTUALIZAR TRIGGER PARA RESETEAR CAMPOS AL AVANZAR
-- ==========================================

-- El trigger actual actualiza los campos cuando se inserta una respuesta
-- Pero necesitamos que también los resetee cuando avanzamos de pregunta
-- Esto se hace mediante la función advance_async_question

-- ==========================================
-- 4. FUNCIÓN PARA VERIFICAR SI JUGADOR YA RESPONDIÓ UNA PREGUNTA
-- ==========================================

CREATE OR REPLACE FUNCTION has_player_answered(p_match_id UUID, p_player_id UUID, p_question_index INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM async_answers
    WHERE match_id = p_match_id
      AND player_id = p_player_id
      AND question_index = p_question_index
  );
END;
$$ LANGUAGE plpgsql;

-- Comentario
COMMENT ON FUNCTION has_player_answered(UUID, UUID, INTEGER) IS 'Verifica si un jugador ya respondió una pregunta específica';

-- ==========================================
-- 5. ACTUALIZAR TIMEOUT DE 16H A 12H EN CLEANUP
-- ==========================================

-- La función de cleanup ya existe, pero necesitamos actualizarla para usar 12h
-- Esto se hace en el código JavaScript, pero también podemos agregar un check en BD

-- ==========================================
-- 6. FUNCIÓN PARA LIMPIAR PARTIDAS HUÉRFANAS (24H SIN ACEPTAR)
-- ==========================================

CREATE OR REPLACE FUNCTION cleanup_orphan_async_matches()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Eliminar partidas huérfanas: creadas hace más de 24h y nunca fueron aceptadas
  -- Una partida es huérfana si:
  -- 1. status = 'waiting_start' o similar (nunca activada)
  -- 2. created_at > 24h
  -- 3. Nunca tuvo un player2_id (pero esto no aplica porque player2_id es requerido al crear)
  
  -- En realidad, las partidas huérfanas son las solicitudes (async_match_requests)
  -- que nunca fueron aceptadas, no las partidas (async_matches)
  -- Pero si una partida fue creada pero nunca iniciada (status = 'waiting_start' o 'active')
  -- y tiene más de 24h, también puede considerarse huérfana
  
  WITH orphan_matches AS (
    SELECT id
    FROM async_matches
    WHERE status IN ('waiting_start', 'active', 'ready')
      AND created_at < NOW() - INTERVAL '24 hours'
      AND current_question = 0  -- Nunca avanzaron de la primera pregunta
      AND NOT EXISTS (
        -- Verificar que no hay respuestas guardadas
        SELECT 1 FROM async_answers WHERE match_id = async_matches.id
      )
    LIMIT 100
  )
  DELETE FROM async_matches
  WHERE id IN (SELECT id FROM orphan_matches);
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Comentario
COMMENT ON FUNCTION cleanup_orphan_async_matches() IS 'Elimina partidas huérfanas creadas hace más de 24h y nunca iniciadas';

-- ==========================================
-- NOTAS
-- ==========================================

-- Para usar estas funciones:
-- 1. advance_async_question(match_id, next_question_index) - se llama cuando ambos responden
-- 2. get_current_question_for_player(match_id, player_id) - se llama al iniciar partida
-- 3. has_player_answered(match_id, player_id, question_index) - para verificar respuestas
-- 4. cleanup_orphan_async_matches() - se ejecuta periódicamente (cron job)

