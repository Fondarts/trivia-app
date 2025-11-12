-- Script SQL para crear la tabla de packs de usuario en Supabase
-- Ejecutar en el SQL Editor de Supabase

-- Crear tabla user_packs
CREATE TABLE IF NOT EXISTS user_packs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'misc',
  share_code TEXT UNIQUE NOT NULL,
  questions JSONB NOT NULL,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índice para búsquedas por código
CREATE INDEX IF NOT EXISTS idx_user_packs_share_code ON user_packs(share_code);

-- Crear índice para búsquedas por usuario
CREATE INDEX IF NOT EXISTS idx_user_packs_user_id ON user_packs(user_id);

-- Crear índice para búsquedas por categoría
CREATE INDEX IF NOT EXISTS idx_user_packs_category ON user_packs(category);

-- Habilitar RLS (Row Level Security)
ALTER TABLE user_packs ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios pueden ver sus propios packs
CREATE POLICY "Users can view their own packs"
  ON user_packs FOR SELECT
  USING (auth.uid() = user_id);

-- Política: Los usuarios pueden ver packs públicos
CREATE POLICY "Users can view public packs"
  ON user_packs FOR SELECT
  USING (is_public = true);

-- Política: Los usuarios pueden ver packs por código (para importar)
CREATE POLICY "Users can view packs by share code"
  ON user_packs FOR SELECT
  USING (true); -- Permitir ver cualquier pack por código para importar

-- Política: Los usuarios pueden crear sus propios packs
CREATE POLICY "Users can create their own packs"
  ON user_packs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política: Los usuarios pueden actualizar sus propios packs
CREATE POLICY "Users can update their own packs"
  ON user_packs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Política: Los usuarios pueden eliminar sus propios packs
CREATE POLICY "Users can delete their own packs"
  ON user_packs FOR DELETE
  USING (auth.uid() = user_id);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_user_packs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at
CREATE TRIGGER update_user_packs_updated_at
  BEFORE UPDATE ON user_packs
  FOR EACH ROW
  EXECUTE FUNCTION update_user_packs_updated_at();

-- Comentarios para documentación
COMMENT ON TABLE user_packs IS 'Packs de preguntas creados por usuarios';
COMMENT ON COLUMN user_packs.share_code IS 'Código único de 8 caracteres para compartir el pack';
COMMENT ON COLUMN user_packs.questions IS 'Array JSON con las preguntas del pack';
COMMENT ON COLUMN user_packs.is_public IS 'Si es true, el pack es visible públicamente';


