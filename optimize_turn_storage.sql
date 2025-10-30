-- Optimización: Almacenar información del turno directamente en async_matches
-- Esto elimina la necesidad de consultar async_answers cada vez que se carga la lista

-- Agregar columnas para almacenar el estado de respuestas de la pregunta actual
ALTER TABLE async_matches 
ADD COLUMN IF NOT EXISTS player1_answered_current BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS player2_answered_current BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS current_turn_player_id UUID REFERENCES auth.users(id);

-- Crear índice para búsquedas rápidas por turno
CREATE INDEX IF NOT EXISTS idx_async_matches_turn ON async_matches(current_turn_player_id) 
WHERE status = 'question_active';

-- Función para actualizar automáticamente el turno cuando se guarda una respuesta
CREATE OR REPLACE FUNCTION update_turn_on_answer()
RETURNS TRIGGER AS $$
DECLARE
  match_record async_matches%ROWTYPE;
  current_q INTEGER;
  player1_answered BOOLEAN;
  player2_answered BOOLEAN;
BEGIN
  -- Obtener la partida actual
  SELECT * INTO match_record FROM async_matches WHERE id = NEW.match_id;
  
  IF NOT FOUND THEN
    RETURN NEW;
  END IF;
  
  current_q := match_record.current_question;
  
  -- Verificar si esta respuesta es para la pregunta actual
  IF NEW.question_index = current_q THEN
    -- Verificar qué jugadores respondieron la pregunta actual
    SELECT 
      EXISTS(SELECT 1 FROM async_answers WHERE match_id = NEW.match_id AND question_index = current_q AND player_id = match_record.player1_id),
      EXISTS(SELECT 1 FROM async_answers WHERE match_id = NEW.match_id AND question_index = current_q AND player_id = match_record.player2_id)
    INTO player1_answered, player2_answered;
    
    -- Actualizar flags en async_matches
    UPDATE async_matches
    SET 
      player1_answered_current = player1_answered,
      player2_answered_current = player2_answered,
      current_turn_player_id = CASE
        WHEN player1_answered AND NOT player2_answered THEN match_record.player2_id
        WHEN player2_answered AND NOT player1_answered THEN match_record.player1_id
        WHEN NOT player1_answered AND NOT player2_answered THEN NULL -- Ninguno ha respondido
        ELSE NULL -- Ambos respondieron, se avanzará a siguiente pregunta
      END
    WHERE id = NEW.match_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger que se ejecuta cuando se inserta una respuesta
DROP TRIGGER IF EXISTS trigger_update_turn_on_answer ON async_answers;
CREATE TRIGGER trigger_update_turn_on_answer
  AFTER INSERT ON async_answers
  FOR EACH ROW
  EXECUTE FUNCTION update_turn_on_answer();

-- Función para actualizar el turno cuando se avanza a una nueva pregunta
CREATE OR REPLACE FUNCTION update_turn_on_question_advance()
RETURNS TRIGGER AS $$
BEGIN
  -- Cuando se avanza a una nueva pregunta, resetear los flags
  IF OLD.current_question IS DISTINCT FROM NEW.current_question THEN
    UPDATE async_matches
    SET 
      player1_answered_current = FALSE,
      player2_answered_current = FALSE,
      current_turn_player_id = NULL
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger que se ejecuta cuando se actualiza current_question
DROP TRIGGER IF EXISTS trigger_update_turn_on_advance ON async_matches;
CREATE TRIGGER trigger_update_turn_on_advance
  AFTER UPDATE OF current_question ON async_matches
  FOR EACH ROW
  EXECUTE FUNCTION update_turn_on_question_advance();

-- Actualizar registros existentes para calcular el turno actual basándose en async_answers
UPDATE async_matches am
SET 
  player1_answered_current = EXISTS(
    SELECT 1 FROM async_answers 
    WHERE match_id = am.id 
    AND question_index = am.current_question 
    AND player_id = am.player1_id
  ),
  player2_answered_current = EXISTS(
    SELECT 1 FROM async_answers 
    WHERE match_id = am.id 
    AND question_index = am.current_question 
    AND player_id = am.player2_id
  ),
  current_turn_player_id = CASE
    WHEN EXISTS(SELECT 1 FROM async_answers WHERE match_id = am.id AND question_index = am.current_question AND player_id = am.player1_id)
         AND NOT EXISTS(SELECT 1 FROM async_answers WHERE match_id = am.id AND question_index = am.current_question AND player_id = am.player2_id)
    THEN am.player2_id
    WHEN EXISTS(SELECT 1 FROM async_answers WHERE match_id = am.id AND question_index = am.current_question AND player_id = am.player2_id)
         AND NOT EXISTS(SELECT 1 FROM async_answers WHERE match_id = am.id AND question_index = am.current_question AND player_id = am.player1_id)
    THEN am.player1_id
    ELSE NULL
  END
WHERE am.status = 'question_active';

