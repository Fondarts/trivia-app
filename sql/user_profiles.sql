-- Tabla para perfiles de usuario con nicknames únicos
CREATE TABLE IF NOT EXISTS user_profiles (
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

-- Índice para búsquedas rápidas por nickname
CREATE INDEX IF NOT EXISTS idx_user_profiles_nickname ON user_profiles(nickname);

-- Habilitar RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios pueden ver todos los perfiles (para rankings)
CREATE POLICY "Public profiles are viewable by everyone" 
  ON user_profiles FOR SELECT 
  USING (true);

-- Política: Los usuarios solo pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile" 
  ON user_profiles FOR UPDATE 
  USING (auth.uid() = user_id);

-- Política: Los usuarios pueden insertar su propio perfil
CREATE POLICY "Users can insert own profile" 
  ON user_profiles FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Función para actualizar el timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at automáticamente
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Vista para el ranking (nickname, nivel, xp)
CREATE OR REPLACE VIEW public_rankings AS
SELECT 
  nickname,
  level,
  total_xp,
  avatar_url,
  ROW_NUMBER() OVER (ORDER BY total_xp DESC) as rank
FROM user_profiles
ORDER BY total_xp DESC;

-- Comentarios
COMMENT ON TABLE user_profiles IS 'Perfiles de usuario con nicknames únicos para el juego';
COMMENT ON COLUMN user_profiles.nickname IS 'Nickname único del jugador, visible en rankings y VS';
COMMENT ON COLUMN user_profiles.stats IS 'Estadísticas del juego en formato JSON';
