-- ==========================================
-- FUNCIONES PARA TIMEOUT AUTOMÁTICO DE PREGUNTAS
-- ==========================================

-- ==========================================
-- 1. FUNCIÓN PARA VERIFICAR Y PROCESAR TIMEOUTS DE PREGUNTAS
-- ==========================================

-- Esta función verifica todas las partidas activas donde un jugador no ha respondido
-- en 6 horas y marca automáticamente su respuesta como incorrecta
CREATE OR REPLACE FUNCTION check_and_process_async_timeouts()
RETURNS INTEGER AS $$
DECLARE
  processed_count INTEGER := 0;
  match_record RECORD;
  player_who_didnt_answer UUID;
  all_players UUID[];
  answered_players UUID[];
BEGIN
  -- Buscar partidas activas donde question_start_time fue hace más de 6 horas
  FOR match_record IN
    SELECT 
      id,
      player1_id,
      player2_id,
      current_question,
      rounds,
      question_start_time,
      deck
    FROM async_matches
    WHERE status = 'question_active'
      AND question_start_time IS NOT NULL
      AND question_start_time < NOW() - INTERVAL '6 hours'
      AND current_question IS NOT NULL
      AND current_question < rounds
  LOOP
    -- Verificar si ambos jugadores ya respondieron esta pregunta
    SELECT ARRAY_AGG(DISTINCT player_id) INTO answered_players
    FROM async_answers
    WHERE match_id = match_record.id
      AND question_index = match_record.current_question;
    
    all_players := ARRAY[match_record.player1_id, match_record.player2_id];
    
    -- Si answered_players es NULL, significa que nadie respondió aún
    IF answered_players IS NULL THEN
      answered_players := ARRAY[]::UUID[];
    END IF;
    
    -- Verificar si hay algún jugador que no respondió
    player_who_didnt_answer := NULL;
    IF NOT (match_record.player1_id = ANY(answered_players)) THEN
      player_who_didnt_answer := match_record.player1_id;
    ELSIF NOT (match_record.player2_id = ANY(answered_players)) THEN
      player_who_didnt_answer := match_record.player2_id;
    END IF;
    
    -- Si encontramos un jugador que no respondió, procesar timeout
    IF player_who_didnt_answer IS NOT NULL THEN
      -- Insertar respuesta automática incorrecta (answer = '-1' indica timeout)
      INSERT INTO async_answers (
        match_id,
        player_id,
        question_index,
        answer,
        time_spent,
        answered_at
      ) VALUES (
        match_record.id,
        player_who_didnt_answer,
        match_record.current_question,
        '-1', -- Valor especial que indica timeout/no respondió
        6 * 60 * 60 * 1000, -- 6 horas en milisegundos
        NOW()
      )
      ON CONFLICT DO NOTHING; -- Evitar duplicados si ya existe
      
      -- Verificar si ahora ambos respondieron (incluyendo la respuesta automática)
      SELECT ARRAY_AGG(DISTINCT player_id) INTO answered_players
      FROM async_answers
      WHERE match_id = match_record.id
        AND question_index = match_record.current_question;
      
      -- Si ambos respondieron, avanzar a la siguiente pregunta
      IF array_length(answered_players, 1) = 2 THEN
        -- Avanzar a siguiente pregunta usando la función existente
        PERFORM advance_async_question(
          match_record.id,
          match_record.current_question + 1
        );
      END IF;
      
      processed_count := processed_count + 1;
    END IF;
  END LOOP;
  
  RETURN processed_count;
END;
$$ LANGUAGE plpgsql;

-- Comentario
COMMENT ON FUNCTION check_and_process_async_timeouts() IS 'Verifica y procesa timeouts automáticos: marca respuestas como incorrectas si un jugador no responde en 6 horas';

-- ==========================================
-- 2. FUNCIÓN PARA LIMPIAR SOLICITUDES EXPIRADAS (MEJORADA)
-- ==========================================

-- Esta función ya existe pero la mejoramos para que BORRE en lugar de solo cancelar
-- (Ya actualizada en supabase_async_tables.sql, pero la incluimos aquí para referencia)

-- ==========================================
-- 3. CONFIGURAR CRON JOB (OPCIONAL - REQUIERE pg_cron)
-- ==========================================

-- Para ejecutar automáticamente la verificación de timeouts cada hora:
-- SELECT cron.schedule('check-async-timeouts', '0 * * * *', 'SELECT check_and_process_async_timeouts();');

-- Para ejecutar la limpieza de solicitudes expiradas cada hora:
-- SELECT cron.schedule('cleanup-expired-requests', '0 * * * *', 'SELECT cleanup_expired_requests();');

-- ==========================================
-- NOTAS
-- ==========================================

-- Para usar estas funciones manualmente:
-- 1. SELECT check_and_process_async_timeouts(); - Procesa timeouts pendientes
-- 2. SELECT cleanup_expired_requests(); - Borra solicitudes expiradas

-- Para verificar partidas con timeouts pendientes:
-- SELECT id, player1_id, player2_id, current_question, question_start_time
-- FROM async_matches
-- WHERE status = 'question_active'
--   AND question_start_time IS NOT NULL
--   AND question_start_time < NOW() - INTERVAL '6 hours';

