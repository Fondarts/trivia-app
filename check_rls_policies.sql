-- Verificar políticas RLS en async_match_requests
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'async_match_requests';

-- Verificar si RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'async_match_requests';

-- Deshabilitar RLS temporalmente (solo para testing)
-- ALTER TABLE public.async_match_requests DISABLE ROW LEVEL SECURITY;

-- Habilitar RLS con política que permita ver todas las partidas
-- DROP POLICY IF EXISTS "Allow all users to view all match requests" ON public.async_match_requests;
-- CREATE POLICY "Allow all users to view all match requests" ON public.async_match_requests
--     FOR SELECT USING (true);
