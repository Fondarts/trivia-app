-- ========================================
-- CONFIGURACIÓN COMPLETA DE PERFILES
-- ========================================

-- 1. Eliminar tabla si existe (para empezar limpio)
DROP TABLE IF EXISTS user_profiles CASCADE;

-- 2. Crear tabla de perfiles
CREATE TABLE user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname VARCHAR(20) UNIQUE NOT NULL,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  level INTEGER DEFAULT 1,
  total_xp INTEGER DEFAULT 0,
  stats JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Crear índice para búsquedas rápidas
CREATE INDEX idx_user_profiles_nickname ON user_profiles(nickname);

-- 4. Habilitar RLS (Row Level Security)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 5. Eliminar políticas existentes si las hay
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;

-- 6. Crear nuevas políticas
-- Política para SELECT (todos pueden ver los perfiles)
CREATE POLICY "Public profiles are viewable by everyone" 
  ON user_profiles 
  FOR SELECT 
  USING (true);

-- Política para INSERT (usuarios pueden crear su perfil)
CREATE POLICY "Users can insert own profile" 
  ON user_profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Política para UPDATE (usuarios pueden actualizar su perfil)
CREATE POLICY "Users can update own profile" 
  ON user_profiles 
  FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 7. Función para actualizar timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Crear trigger
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- 9. Verificar que todo está bien
SELECT 
  'Tabla creada exitosamente' as status,
  COUNT(*) as total_profiles
FROM user_profiles;
