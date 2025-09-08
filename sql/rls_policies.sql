-- Políticas RLS para que los datos de perfil sean públicos pero solo editables por el propietario

-- ============================================
-- TABLA: user_profiles
-- ============================================

-- Eliminar políticas existentes si las hay
DROP POLICY IF EXISTS "Los perfiles son públicos para leer" ON user_profiles;
DROP POLICY IF EXISTS "Los usuarios pueden actualizar su propio perfil" ON user_profiles;
DROP POLICY IF EXISTS "Los usuarios pueden insertar su propio perfil" ON user_profiles;

-- Habilitar RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Política: Todos pueden leer todos los perfiles (para ver nivel y nickname de otros jugadores)
CREATE POLICY "Los perfiles son públicos para leer" 
ON user_profiles 
FOR SELECT 
TO public 
USING (true);

-- Política: Los usuarios autenticados pueden actualizar solo su propio perfil
CREATE POLICY "Los usuarios pueden actualizar su propio perfil" 
ON user_profiles 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Política: Los usuarios autenticados pueden insertar su propio perfil
CREATE POLICY "Los usuarios pueden insertar su propio perfil" 
ON user_profiles 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- ============================================
-- TABLA: user_stats
-- ============================================

-- Eliminar políticas existentes si las hay
DROP POLICY IF EXISTS "Las estadísticas son públicas para leer" ON user_stats;
DROP POLICY IF EXISTS "Los usuarios pueden actualizar sus propias estadísticas" ON user_stats;
DROP POLICY IF EXISTS "Los usuarios pueden insertar sus propias estadísticas" ON user_stats;

-- Habilitar RLS
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

-- Política: Todos pueden leer todas las estadísticas (para leaderboards y VS)
CREATE POLICY "Las estadísticas son públicas para leer" 
ON user_stats 
FOR SELECT 
TO public 
USING (true);

-- Política: Los usuarios autenticados pueden actualizar solo sus propias estadísticas
CREATE POLICY "Los usuarios pueden actualizar sus propias estadísticas" 
ON user_stats 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Política: Los usuarios autenticados pueden insertar sus propias estadísticas
CREATE POLICY "Los usuarios pueden insertar sus propias estadísticas" 
ON user_stats 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- ============================================
-- TABLA: user_achievements
-- ============================================

-- Eliminar políticas existentes si las hay
DROP POLICY IF EXISTS "Los logros son públicos para leer" ON user_achievements;
DROP POLICY IF EXISTS "Los usuarios pueden insertar sus propios logros" ON user_achievements;

-- Habilitar RLS
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Política: Todos pueden leer todos los logros (para mostrar en perfiles públicos)
CREATE POLICY "Los logros son públicos para leer" 
ON user_achievements 
FOR SELECT 
TO public 
USING (true);

-- Política: Los usuarios autenticados pueden insertar sus propios logros
CREATE POLICY "Los usuarios pueden insertar sus propios logros" 
ON user_achievements 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- No permitimos UPDATE ni DELETE en logros (una vez desbloqueado, siempre desbloqueado)

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================
-- 1. Ejecuta este script en el SQL Editor de Supabase
-- 2. Asegúrate de que RLS esté habilitado para todas las tablas
-- 3. Las políticas permiten que TODOS puedan leer los datos (para VS y leaderboards)
-- 4. Solo el propietario puede modificar sus propios datos