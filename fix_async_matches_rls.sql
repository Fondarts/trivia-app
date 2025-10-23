-- Script para corregir las políticas RLS de async_matches

-- 1. Verificar si la tabla existe
SELECT table_name, table_schema 
FROM information_schema.tables 
WHERE table_name = 'async_matches';

-- 2. Verificar políticas existentes
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'async_matches';

-- 3. Eliminar políticas existentes si hay problemas
DROP POLICY IF EXISTS "Users can view their own matches" ON public.async_matches;
DROP POLICY IF EXISTS "Users can insert their own matches" ON public.async_matches;
DROP POLICY IF EXISTS "Users can update their own matches" ON public.async_matches;

-- 4. Crear políticas correctas para async_matches
CREATE POLICY "Users can view their own matches" ON public.async_matches
FOR SELECT USING (
  requester_id = auth.uid() OR accepter_id = auth.uid()
);

CREATE POLICY "Users can insert their own matches" ON public.async_matches
FOR INSERT WITH CHECK (
  requester_id = auth.uid() OR accepter_id = auth.uid()
);

CREATE POLICY "Users can update their own matches" ON public.async_matches
FOR UPDATE USING (
  requester_id = auth.uid() OR accepter_id = auth.uid()
) WITH CHECK (
  requester_id = auth.uid() OR accepter_id = auth.uid()
);

-- 5. Verificar que RLS esté habilitado
ALTER TABLE public.async_matches ENABLE ROW LEVEL SECURITY;

-- 6. Verificar políticas de async_match_requests también
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'async_match_requests';

-- 7. Crear políticas para async_match_requests si no existen
CREATE POLICY IF NOT EXISTS "Users can view pending requests" ON public.async_match_requests
FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Users can create requests" ON public.async_match_requests
FOR INSERT WITH CHECK (requester_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Users can update requests" ON public.async_match_requests
FOR UPDATE USING (true) WITH CHECK (true);

-- 8. Verificar que RLS esté habilitado en async_match_requests
ALTER TABLE public.async_match_requests ENABLE ROW LEVEL SECURITY;
