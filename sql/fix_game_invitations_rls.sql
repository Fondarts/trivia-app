-- Políticas RLS para game_invitations
-- Ejecutar este script en el SQL Editor de Supabase

-- Habilitar RLS en la tabla
ALTER TABLE game_invitations ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si las hay
DROP POLICY IF EXISTS "Los usuarios pueden crear invitaciones" ON game_invitations;
DROP POLICY IF EXISTS "Los usuarios pueden ver invitaciones" ON game_invitations;  
DROP POLICY IF EXISTS "Los usuarios pueden actualizar sus invitaciones" ON game_invitations;

-- Política: Los usuarios autenticados pueden crear invitaciones
CREATE POLICY "Los usuarios pueden crear invitaciones" 
ON game_invitations 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = from_user_id);

-- Política: Los usuarios pueden ver invitaciones donde están involucrados
CREATE POLICY "Los usuarios pueden ver invitaciones" 
ON game_invitations 
FOR SELECT 
TO authenticated 
USING (
  auth.uid() = from_user_id OR 
  auth.uid() = to_user_id
);

-- Política: Los usuarios pueden actualizar invitaciones donde están involucrados
CREATE POLICY "Los usuarios pueden actualizar sus invitaciones" 
ON game_invitations 
FOR UPDATE 
TO authenticated
USING (
  auth.uid() = from_user_id OR 
  auth.uid() = to_user_id
)
WITH CHECK (
  auth.uid() = from_user_id OR 
  auth.uid() = to_user_id
);