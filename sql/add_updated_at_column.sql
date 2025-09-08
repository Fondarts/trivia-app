-- Script para agregar la columna updated_at si no existe y arreglar las amistades

-- 1. Agregar columna updated_at si no existe
ALTER TABLE friendships 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Crear trigger para actualizar updated_at
DROP TRIGGER IF EXISTS update_friendships_updated_at ON friendships;
CREATE TRIGGER update_friendships_updated_at
BEFORE UPDATE ON friendships
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 4. Ahora sí, crear relaciones inversas para todas las amistades aceptadas que no las tengan
INSERT INTO friendships (user_id, friend_id, status, created_at)
SELECT 
    f.friend_id as user_id,
    f.user_id as friend_id,
    'accepted' as status,
    f.created_at
FROM friendships f
WHERE f.status = 'accepted'
AND NOT EXISTS (
    -- Verificar que no existe ya la relación inversa
    SELECT 1 
    FROM friendships f2 
    WHERE f2.user_id = f.friend_id 
    AND f2.friend_id = f.user_id
)
ON CONFLICT (user_id, friend_id) DO NOTHING;

-- 5. Verificar el estado
SELECT 
    'Total amistades aceptadas:' as descripcion,
    COUNT(*) as cantidad
FROM friendships
WHERE status = 'accepted'
UNION ALL
SELECT 
    'Amistades unidireccionales:' as descripcion,
    COUNT(*) as cantidad
FROM friendships f
WHERE f.status = 'accepted'
AND NOT EXISTS (
    SELECT 1 
    FROM friendships f2 
    WHERE f2.user_id = f.friend_id 
    AND f2.friend_id = f.user_id
    AND f2.status = 'accepted'
);