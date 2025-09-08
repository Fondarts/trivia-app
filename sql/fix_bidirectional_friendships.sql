-- Script para arreglar las amistades y hacerlas bidireccionales

-- 1. Primero, vamos a ver las amistades actuales
SELECT 
    f.id,
    f.user_id,
    u1.email as user_email,
    f.friend_id,
    u2.email as friend_email,
    f.status,
    f.created_at
FROM friendships f
LEFT JOIN auth.users u1 ON f.user_id = u1.id
LEFT JOIN auth.users u2 ON f.friend_id = u2.id
WHERE f.status = 'accepted'
ORDER BY f.created_at DESC;

-- 2. Crear relaciones inversas para todas las amistades aceptadas que no las tengan
INSERT INTO friendships (user_id, friend_id, status, created_at, updated_at)
SELECT 
    f.friend_id as user_id,
    f.user_id as friend_id,
    'accepted' as status,
    f.created_at,
    NOW() as updated_at
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

-- 3. Verificar que ahora todas las amistades son bidireccionales
SELECT 
    'Amistades unidireccionales:' as tipo,
    COUNT(*) as cantidad
FROM friendships f
WHERE f.status = 'accepted'
AND NOT EXISTS (
    SELECT 1 
    FROM friendships f2 
    WHERE f2.user_id = f.friend_id 
    AND f2.friend_id = f.user_id
    AND f2.status = 'accepted'
)
UNION ALL
SELECT 
    'Amistades bidireccionales:' as tipo,
    COUNT(*) / 2 as cantidad -- Dividir por 2 porque cada amistad cuenta 2 veces
FROM friendships f
WHERE f.status = 'accepted'
AND EXISTS (
    SELECT 1 
    FROM friendships f2 
    WHERE f2.user_id = f.friend_id 
    AND f2.friend_id = f.user_id
    AND f2.status = 'accepted'
);

-- 4. Opcional: Ver detalles de amistades por usuario
-- Reemplaza 'USER_ID_AQUI' con el ID del usuario que quieres verificar
/*
SELECT 
    CASE 
        WHEN f.user_id = 'USER_ID_AQUI' THEN 'Yo envié solicitud a'
        ELSE 'Recibí solicitud de'
    END as direccion,
    CASE 
        WHEN f.user_id = 'USER_ID_AQUI' THEN up2.nickname
        ELSE up1.nickname
    END as amigo,
    f.status,
    f.created_at
FROM friendships f
LEFT JOIN user_profiles up1 ON f.user_id = up1.user_id
LEFT JOIN user_profiles up2 ON f.friend_id = up2.user_id
WHERE (f.user_id = 'USER_ID_AQUI' OR f.friend_id = 'USER_ID_AQUI')
ORDER BY f.created_at DESC;
*/

-- 5. Función helper para crear amistad bidireccional
CREATE OR REPLACE FUNCTION create_bidirectional_friendship(
    p_user_id UUID,
    p_friend_id UUID,
    p_status VARCHAR DEFAULT 'accepted'
)
RETURNS VOID AS $$
BEGIN
    -- Insertar primera dirección
    INSERT INTO friendships (user_id, friend_id, status)
    VALUES (p_user_id, p_friend_id, p_status)
    ON CONFLICT (user_id, friend_id) 
    DO UPDATE SET status = p_status, updated_at = NOW();
    
    -- Insertar dirección inversa solo si el status es 'accepted'
    IF p_status = 'accepted' THEN
        INSERT INTO friendships (user_id, friend_id, status)
        VALUES (p_friend_id, p_user_id, p_status)
        ON CONFLICT (user_id, friend_id) 
        DO UPDATE SET status = p_status, updated_at = NOW();
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 6. Trigger para hacer automáticamente bidireccionales las amistades aceptadas
CREATE OR REPLACE FUNCTION make_friendship_bidirectional()
RETURNS TRIGGER AS $$
BEGIN
    -- Si se actualiza a 'accepted', crear la relación inversa
    IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
        INSERT INTO friendships (user_id, friend_id, status, created_at, updated_at)
        VALUES (NEW.friend_id, NEW.user_id, 'accepted', NEW.created_at, NOW())
        ON CONFLICT (user_id, friend_id) 
        DO UPDATE SET status = 'accepted', updated_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear el trigger
DROP TRIGGER IF EXISTS friendship_bidirectional_trigger ON friendships;
CREATE TRIGGER friendship_bidirectional_trigger
    AFTER INSERT OR UPDATE ON friendships
    FOR EACH ROW
    EXECUTE FUNCTION make_friendship_bidirectional();