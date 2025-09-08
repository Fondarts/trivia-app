-- Script para crear solo las políticas que no existen

-- 1. Habilitar RLS en las tablas (si no está habilitado)
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_invitations ENABLE ROW LEVEL SECURITY;

-- 2. Eliminar políticas existentes con conflicto y recrearlas
DO $$ 
BEGIN
    -- Friendships policies
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'friendships' AND policyname = 'Users can view their friendships') THEN
        DROP POLICY "Users can view their friendships" ON friendships;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'friendships' AND policyname = 'Users can create friend requests') THEN
        DROP POLICY "Users can create friend requests" ON friendships;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'friendships' AND policyname = 'Users can update friendships') THEN
        DROP POLICY "Users can update friendships" ON friendships;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'friendships' AND policyname = 'Users can delete friendships') THEN
        DROP POLICY "Users can delete friendships" ON friendships;
    END IF;
END $$;

-- 3. Crear políticas para friendships
CREATE POLICY "Users can view their friendships" ON friendships
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid() OR friend_id = auth.uid());

CREATE POLICY "Users can create friend requests" ON friendships
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update friendships" ON friendships
    FOR UPDATE
    TO authenticated
    USING (friend_id = auth.uid() OR user_id = auth.uid())
    WITH CHECK (true);

CREATE POLICY "Users can delete friendships" ON friendships
    FOR DELETE
    TO authenticated
    USING (user_id = auth.uid() OR friend_id = auth.uid());

-- 4. Políticas para friend_rankings (eliminar existentes primero)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'friend_rankings' AND policyname = 'Users can view their rankings') THEN
        DROP POLICY "Users can view their rankings" ON friend_rankings;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'friend_rankings' AND policyname = 'Users can manage their rankings') THEN
        DROP POLICY "Users can manage their rankings" ON friend_rankings;
    END IF;
END $$;

CREATE POLICY "Users can view their rankings" ON friend_rankings
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid() OR friend_id = auth.uid());

CREATE POLICY "Users can manage their rankings" ON friend_rankings
    FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- 5. Políticas para game_invitations (eliminar existentes primero)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'game_invitations' AND policyname = 'Users can view their invitations') THEN
        DROP POLICY "Users can view their invitations" ON game_invitations;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'game_invitations' AND policyname = 'Users can create invitations') THEN
        DROP POLICY "Users can create invitations" ON game_invitations;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'game_invitations' AND policyname = 'Users can update invitations') THEN
        DROP POLICY "Users can update invitations" ON game_invitations;
    END IF;
END $$;

CREATE POLICY "Users can view their invitations" ON game_invitations
    FOR SELECT
    TO authenticated
    USING (from_user_id = auth.uid() OR to_user_id = auth.uid());

CREATE POLICY "Users can create invitations" ON game_invitations
    FOR INSERT
    TO authenticated
    WITH CHECK (from_user_id = auth.uid());

CREATE POLICY "Users can update invitations" ON game_invitations
    FOR UPDATE
    TO authenticated
    USING (to_user_id = auth.uid() OR from_user_id = auth.uid())
    WITH CHECK (true);