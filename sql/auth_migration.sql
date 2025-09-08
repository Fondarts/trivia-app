-- Migración para sistema de autenticación y perfiles de usuario en Supabase

-- 1. Crear tabla de perfiles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  level INTEGER DEFAULT 1,
  total_xp INTEGER DEFAULT 0,
  stats JSONB DEFAULT '{
    "questionsAnswered": 0,
    "questionsCorrect": 0,
    "totalGamesPlayed": 0,
    "vsGamesWon": 0,
    "bestWinStreak": 0,
    "currentCorrectStreak": 0,
    "longestCorrectStreak": 0,
    "perfectGames": 0,
    "consecutiveDaysPlayed": 1,
    "correctByCategory": {
      "movies": 0,
      "geography": 0,
      "history": 0,
      "science": 0,
      "sports": 0,
      "culture": 0
    }
  }'::jsonb,
  achievements TEXT[] DEFAULT '{}',
  friends UUID[] DEFAULT '{}',
  is_guest BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Crear tabla de amistades
CREATE TABLE IF NOT EXISTS friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  friend_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('pending', 'accepted', 'blocked')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

-- 3. Crear tabla de historial de partidas
CREATE TABLE IF NOT EXISTS match_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  opponent_id UUID REFERENCES profiles(id),
  mode TEXT NOT NULL, -- 'solo', 'timed', 'vs'
  player_score INTEGER NOT NULL,
  opponent_score INTEGER,
  total_questions INTEGER NOT NULL,
  category TEXT,
  difficulty TEXT,
  won BOOLEAN,
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Crear tabla de invitaciones de partida
CREATE TABLE IF NOT EXISTS match_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user UUID REFERENCES profiles(id) ON DELETE CASCADE,
  to_user UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('pending', 'accepted', 'declined', 'expired')) DEFAULT 'pending',
  match_settings JSONB,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '5 minutes'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Crear tabla de leaderboard global
CREATE TABLE IF NOT EXISTS leaderboard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  mode TEXT NOT NULL,
  score INTEGER NOT NULL,
  total INTEGER,
  time_seconds INTEGER,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_level ON profiles(level DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_total_xp ON profiles(total_xp DESC);
CREATE INDEX IF NOT EXISTS idx_friendships_user ON friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend ON friendships(friend_id);
CREATE INDEX IF NOT EXISTS idx_match_history_player ON match_history(player_id);
CREATE INDEX IF NOT EXISTS idx_match_history_created ON match_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_mode ON leaderboard(mode);
CREATE INDEX IF NOT EXISTS idx_leaderboard_score ON leaderboard(score DESC);

-- 7. Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

-- 8. Políticas de seguridad para profiles
CREATE POLICY "Public profiles are viewable by everyone" 
  ON profiles FOR SELECT 
  USING (true);

CREATE POLICY "Users can update own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
  ON profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- 9. Políticas para friendships
CREATE POLICY "Users can view their friendships" 
  ON friendships FOR SELECT 
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can create friendships" 
  ON friendships FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their friendships" 
  ON friendships FOR UPDATE 
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- 10. Políticas para match_history
CREATE POLICY "Users can view their match history" 
  ON match_history FOR SELECT 
  USING (auth.uid() = player_id);

CREATE POLICY "Users can insert their match history" 
  ON match_history FOR INSERT 
  WITH CHECK (auth.uid() = player_id);

-- 11. Políticas para match_invitations
CREATE POLICY "Users can view their invitations" 
  ON match_invitations FOR SELECT 
  USING (auth.uid() = from_user OR auth.uid() = to_user);

CREATE POLICY "Users can create invitations" 
  ON match_invitations FOR INSERT 
  WITH CHECK (auth.uid() = from_user);

CREATE POLICY "Users can update invitations" 
  ON match_invitations FOR UPDATE 
  USING (auth.uid() = to_user);

-- 12. Políticas para leaderboard
CREATE POLICY "Everyone can view leaderboard" 
  ON leaderboard FOR SELECT 
  USING (true);

CREATE POLICY "Users can insert their scores" 
  ON leaderboard FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- 13. Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 14. Trigger para actualizar updated_at en profiles
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON profiles 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- 15. Función para obtener ranking de amigos
CREATE OR REPLACE FUNCTION get_friends_ranking(user_uuid UUID)
RETURNS TABLE (
  friend_id UUID,
  username TEXT,
  display_name TEXT,
  level INTEGER,
  total_xp INTEGER,
  rank INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.username,
    p.display_name,
    p.level,
    p.total_xp,
    RANK() OVER (ORDER BY p.total_xp DESC) as rank
  FROM profiles p
  WHERE p.id IN (
    SELECT CASE 
      WHEN f.user_id = user_uuid THEN f.friend_id 
      ELSE f.user_id 
    END
    FROM friendships f
    WHERE (f.user_id = user_uuid OR f.friend_id = user_uuid)
    AND f.status = 'accepted'
  )
  OR p.id = user_uuid
  ORDER BY rank;
END;
$$ LANGUAGE plpgsql;

-- 16. Vista para estadísticas globales
CREATE OR REPLACE VIEW global_stats AS
SELECT 
  COUNT(DISTINCT id) as total_players,
  AVG(level) as avg_level,
  AVG(total_xp) as avg_xp,
  MAX(level) as max_level,
  MAX(total_xp) as max_xp,
  AVG((stats->>'questionsCorrect')::int) as avg_correct,
  AVG((stats->>'totalGamesPlayed')::int) as avg_games
FROM profiles;

-- 17. Función para limpiar invitaciones expiradas (ejecutar periódicamente)
CREATE OR REPLACE FUNCTION cleanup_expired_invitations()
RETURNS void AS $$
BEGIN
  UPDATE match_invitations 
  SET status = 'expired'
  WHERE status = 'pending' 
  AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;