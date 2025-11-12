-- Tabla para compartir packs de preguntas entre usuarios
-- Ejecutar este SQL en el SQL Editor de Supabase

-- Crear la tabla shared_packs
CREATE TABLE IF NOT EXISTS public.shared_packs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pack_name TEXT NOT NULL,
  pack_data JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'read', 'imported', 'declined')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_shared_packs_to_user ON public.shared_packs(to_user_id, status);
CREATE INDEX IF NOT EXISTS idx_shared_packs_from_user ON public.shared_packs(from_user_id);
CREATE INDEX IF NOT EXISTS idx_shared_packs_created_at ON public.shared_packs(created_at DESC);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.shared_packs ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios pueden ver los packs que les fueron compartidos
CREATE POLICY "Users can view packs shared with them"
  ON public.shared_packs
  FOR SELECT
  USING (auth.uid() = to_user_id);

-- Política: Los usuarios pueden crear packs compartidos (enviar a otros)
CREATE POLICY "Users can create shared packs"
  ON public.shared_packs
  FOR INSERT
  WITH CHECK (auth.uid() = from_user_id);

-- Política: Los usuarios pueden actualizar packs que les fueron compartidos (marcar como leído/importado)
CREATE POLICY "Users can update packs shared with them"
  ON public.shared_packs
  FOR UPDATE
  USING (auth.uid() = to_user_id);

-- Política: Los usuarios pueden ver los packs que ellos compartieron
CREATE POLICY "Users can view packs they shared"
  ON public.shared_packs
  FOR SELECT
  USING (auth.uid() = from_user_id);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_shared_packs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at
CREATE TRIGGER update_shared_packs_updated_at
  BEFORE UPDATE ON public.shared_packs
  FOR EACH ROW
  EXECUTE FUNCTION update_shared_packs_updated_at();

-- Comentarios para documentación
COMMENT ON TABLE public.shared_packs IS 'Tabla para almacenar packs de preguntas compartidos entre usuarios';
COMMENT ON COLUMN public.shared_packs.from_user_id IS 'ID del usuario que comparte el pack';
COMMENT ON COLUMN public.shared_packs.to_user_id IS 'ID del usuario que recibe el pack';
COMMENT ON COLUMN public.shared_packs.pack_name IS 'Nombre del pack compartido';
COMMENT ON COLUMN public.shared_packs.pack_data IS 'Datos completos del pack en formato JSON';
COMMENT ON COLUMN public.shared_packs.status IS 'Estado: pending, read, imported, declined';

