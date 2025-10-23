-- Script para corregir las políticas RLS basado en la estructura real de async_matches

-- 1. Verificar políticas existentes
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'async_matches';

-- 2. Eliminar políticas existentes si hay problemas
DROP POLICY IF EXISTS "Users can view their own matches" ON public.async_matches;
DROP POLICY IF EXISTS "Users can insert their own matches" ON public.async_matches;
DROP POLICY IF EXISTS "Users can update their own matches" ON public.async_matches;
DROP POLICY IF EXISTS "Allow users to view async matches" ON public.async_matches;
DROP POLICY IF EXISTS "Allow users to insert async matches" ON public.async_matches;
DROP POLICY IF EXISTS "Allow users to update async matches" ON public.async_matches;

-- 3. Crear políticas correctas para async_matches
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

-- 4. Verificar que RLS esté habilitado
ALTER TABLE public.async_matches ENABLE ROW LEVEL SECURITY;

-- 5. Verificar políticas de async_match_requests
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'async_match_requests';

-- 6. Crear políticas para async_match_requests si no existen
CREATE POLICY IF NOT EXISTS "Users can view all requests" ON public.async_match_requests
FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Users can create requests" ON public.async_match_requests
FOR INSERT WITH CHECK (requester_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Users can update requests" ON public.async_match_requests
FOR UPDATE USING (true) WITH CHECK (true);

-- 7. Verificar que RLS esté habilitado en async_match_requests
ALTER TABLE public.async_match_requests ENABLE ROW LEVEL SECURITY;

-- 8. Verificar que las políticas se crearon correctamente
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename IN ('async_matches', 'async_match_requests')
ORDER BY tablename, policyname;
