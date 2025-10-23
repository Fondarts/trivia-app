-- Script para crear políticas RLS para async_answers
-- ⚠️ ADVERTENCIA: Este script creará políticas de seguridad

-- 1. Verificar si la tabla existe
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'async_answers' 
ORDER BY ordinal_position;

-- 2. Crear políticas RLS para async_answers
-- Política para INSERT: permitir a los jugadores insertar sus propias respuestas
CREATE POLICY "Allow players to insert their own answers" ON public.async_answers
FOR INSERT WITH CHECK (
  player_id = auth.uid() OR 
  player_id::text = current_setting('request.jwt.claims', true)::json->>'sub'
);

-- Política para SELECT: permitir a los jugadores ver respuestas de sus partidas
CREATE POLICY "Allow players to view answers from their matches" ON public.async_answers
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.async_matches 
    WHERE async_matches.id = async_answers.match_id 
    AND (async_matches.player1_id = auth.uid() OR async_matches.player2_id = auth.uid())
  )
);

-- Política para UPDATE: permitir actualizaciones (si es necesario)
CREATE POLICY "Allow players to update their own answers" ON public.async_answers
FOR UPDATE USING (
  player_id = auth.uid() OR 
  player_id::text = current_setting('request.jwt.claims', true)::json->>'sub'
);

-- 3. Habilitar RLS en la tabla
ALTER TABLE public.async_answers ENABLE ROW LEVEL SECURITY;

-- 4. Verificar las políticas creadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'async_answers';
