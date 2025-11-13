-- Tablas para VS Asíncrono

-- Tabla de solicitudes de partidas asíncronas
CREATE TABLE IF NOT EXISTS async_match_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID NOT NULL,
  requester_name TEXT NOT NULL,
  rounds INTEGER NOT NULL DEFAULT 10,
  category TEXT NOT NULL DEFAULT 'all',
  difficulty TEXT NOT NULL DEFAULT 'easy',
  status TEXT NOT NULL DEFAULT 'pending', -- pending, accepted, rejected, cancelled
  accepter_id UUID,
  accepter_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '48 hours')
);

-- Tabla de partidas asíncronas
CREATE TABLE IF NOT EXISTS async_matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID REFERENCES async_match_requests(id),
  player1_id UUID NOT NULL,
  player1_name TEXT NOT NULL,
  player2_id UUID NOT NULL,
  player2_name TEXT NOT NULL,
  rounds INTEGER NOT NULL DEFAULT 10,
  category TEXT NOT NULL DEFAULT 'all',
  difficulty TEXT NOT NULL DEFAULT 'easy',
  deck JSONB,
  status TEXT NOT NULL DEFAULT 'waiting_start', -- waiting_start, ready, question_active, question_timeout, finished, abandoned
  current_question INTEGER DEFAULT 0,
  question_start_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  finished_at TIMESTAMPTZ
);

-- Tabla de respuestas asíncronas
CREATE TABLE IF NOT EXISTS async_answers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID NOT NULL REFERENCES async_matches(id),
  player_id UUID NOT NULL,
  question_index INTEGER NOT NULL,
  answer TEXT NOT NULL,
  time_spent INTEGER NOT NULL, -- en milisegundos
  answered_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_async_requests_status ON async_match_requests(status);
CREATE INDEX IF NOT EXISTS idx_async_requests_requester ON async_match_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_async_requests_filters ON async_match_requests(rounds, category, difficulty);
CREATE INDEX IF NOT EXISTS idx_async_matches_player1 ON async_matches(player1_id);
CREATE INDEX IF NOT EXISTS idx_async_matches_player2 ON async_matches(player2_id);
CREATE INDEX IF NOT EXISTS idx_async_matches_status ON async_matches(status);
CREATE INDEX IF NOT EXISTS idx_async_answers_match ON async_answers(match_id);
CREATE INDEX IF NOT EXISTS idx_async_answers_player ON async_answers(player_id);

-- RLS (Row Level Security)
ALTER TABLE async_match_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE async_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE async_answers ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para async_match_requests
CREATE POLICY "Users can view their own requests" ON async_match_requests
  FOR SELECT USING (requester_id = auth.uid() OR accepter_id = auth.uid());

CREATE POLICY "Users can create requests" ON async_match_requests
  FOR INSERT WITH CHECK (requester_id = auth.uid());

CREATE POLICY "Users can update their own requests" ON async_match_requests
  FOR UPDATE USING (requester_id = auth.uid() OR accepter_id = auth.uid());

-- Políticas RLS para async_matches
CREATE POLICY "Users can view their own matches" ON async_matches
  FOR SELECT USING (player1_id = auth.uid() OR player2_id = auth.uid());

CREATE POLICY "Users can create matches" ON async_matches
  FOR INSERT WITH CHECK (player1_id = auth.uid() OR player2_id = auth.uid());

CREATE POLICY "Users can update their own matches" ON async_matches
  FOR UPDATE USING (player1_id = auth.uid() OR player2_id = auth.uid());

-- Políticas RLS para async_answers
CREATE POLICY "Users can view answers from their matches" ON async_answers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM async_matches 
      WHERE id = async_answers.match_id 
      AND (player1_id = auth.uid() OR player2_id = auth.uid())
    )
  );

CREATE POLICY "Users can create answers for their matches" ON async_answers
  FOR INSERT WITH CHECK (
    player_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM async_matches 
      WHERE id = async_answers.match_id 
      AND (player1_id = auth.uid() OR player2_id = auth.uid())
    )
  );

-- Función para limpiar solicitudes expiradas (BORRAR TODO LO INACTIVO)
-- Elimina solicitudes sin aceptar después de 48 horas Y todas las ya procesadas
-- IMPORTANTE: Solo borra solicitudes que NO tienen partidas asociadas (para evitar foreign key errors)
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

-- Trigger para limpiar automáticamente
CREATE OR REPLACE FUNCTION trigger_cleanup_expired_requests()
RETURNS trigger AS $$
BEGIN
  PERFORM cleanup_expired_requests();
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger que se ejecute cada minuto (requiere pg_cron)
-- SELECT cron.schedule('cleanup-expired-requests', '* * * * *', 'SELECT cleanup_expired_requests();');

