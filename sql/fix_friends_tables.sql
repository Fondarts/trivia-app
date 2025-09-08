-- Script para verificar y crear las tablas de amigos si no existen

-- 1. Verificar/crear tabla friendships
CREATE TABLE IF NOT EXISTS friendships (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    friend_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'accepted', 'blocked')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, friend_id)
);

-- 2. Verificar/crear tabla friend_rankings
CREATE TABLE IF NOT EXISTS friend_rankings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    friend_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    games_played INTEGER DEFAULT 0,
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, friend_id)
);

-- 3. Verificar/crear tabla game_invitations
CREATE TABLE IF NOT EXISTS game_invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    to_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    room_code VARCHAR(10),
    game_type VARCHAR(20) NOT NULL CHECK (game_type IN ('vs', 'async')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled', 'completed')),
    async_game_id UUID,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_friendships_user_id ON friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend_id ON friendships(friend_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON friendships(status);

CREATE INDEX IF NOT EXISTS idx_friend_rankings_user_id ON friend_rankings(user_id);
CREATE INDEX IF NOT EXISTS idx_friend_rankings_friend_id ON friend_rankings(friend_id);

CREATE INDEX IF NOT EXISTS idx_game_invitations_to_user ON game_invitations(to_user_id);
CREATE INDEX IF NOT EXISTS idx_game_invitations_from_user ON game_invitations(from_user_id);
CREATE INDEX IF NOT EXISTS idx_game_invitations_status ON game_invitations(status);

-- 5. Políticas RLS para friendships
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

-- Política para ver amistades (usuarios pueden ver sus propias amistades)
CREATE POLICY "Users can view their friendships" ON friendships
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid() OR friend_id = auth.uid());

-- Política para crear solicitudes de amistad
CREATE POLICY "Users can create friend requests" ON friendships
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Política para actualizar estado de amistad (solo el receptor puede aceptar)
CREATE POLICY "Users can update friendships" ON friendships
    FOR UPDATE
    TO authenticated
    USING (friend_id = auth.uid() AND status = 'pending')
    WITH CHECK (status IN ('accepted', 'blocked'));

-- Política para eliminar amistades
CREATE POLICY "Users can delete friendships" ON friendships
    FOR DELETE
    TO authenticated
    USING (user_id = auth.uid() OR friend_id = auth.uid());

-- 6. Políticas RLS para friend_rankings
ALTER TABLE friend_rankings ENABLE ROW LEVEL SECURITY;

-- Política para ver rankings
CREATE POLICY "Users can view their rankings" ON friend_rankings
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid() OR friend_id = auth.uid());

-- Política para crear/actualizar rankings
CREATE POLICY "Users can manage their rankings" ON friend_rankings
    FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- 7. Políticas RLS para game_invitations
ALTER TABLE game_invitations ENABLE ROW LEVEL SECURITY;

-- Política para ver invitaciones
CREATE POLICY "Users can view their invitations" ON game_invitations
    FOR SELECT
    TO authenticated
    USING (from_user_id = auth.uid() OR to_user_id = auth.uid());

-- Política para crear invitaciones
CREATE POLICY "Users can create invitations" ON game_invitations
    FOR INSERT
    TO authenticated
    WITH CHECK (from_user_id = auth.uid());

-- Política para actualizar invitaciones
CREATE POLICY "Users can update invitations" ON game_invitations
    FOR UPDATE
    TO authenticated
    USING (to_user_id = auth.uid() OR from_user_id = auth.uid())
    WITH CHECK (status IN ('accepted', 'rejected', 'cancelled', 'completed'));

-- 8. Función para limpiar invitaciones expiradas
CREATE OR REPLACE FUNCTION cleanup_expired_invitations()
RETURNS void AS $$
BEGIN
    UPDATE game_invitations
    SET status = 'cancelled'
    WHERE status = 'pending'
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Nota: Puedes crear un cron job en Supabase para ejecutar esta función periódicamente