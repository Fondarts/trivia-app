// js/global_leaderboard.js
// Sistema de Leaderboard Global

export async function getGlobalLeaderboard(supabase, limit = 100) {
    try {
        console.log('Obteniendo leaderboard global...');
        
        // Obtener los mejores jugadores por XP total (que determina el nivel)
        const { data: players, error } = await supabase
            .from('user_profiles')
            .select(`
                user_id,
                nickname,
                level,
                total_xp,
                avatar_url
            `)
            .order('total_xp', { ascending: false })
            .limit(limit);
        
        if (error) {
            console.error('Error obteniendo leaderboard:', error);
            return { success: false, error: error.message };
        }
        
        // Obtener el ID del usuario actual si está logueado
        const currentUserId = window.getCurrentUser ? window.getCurrentUser()?.id : null;
        
        // Agregar ranking y marcar al usuario actual
        const rankedPlayers = players.map((player, index) => ({
            ...player,
            rank: index + 1,
            isCurrentUser: player.user_id === currentUserId
        }));
        
        // Si el usuario actual no está en el top, obtener su posición
        let currentUserRank = null;
        if (currentUserId && !rankedPlayers.find(p => p.isCurrentUser)) {
            // Obtener datos del usuario actual
            const { data: currentUser } = await supabase
                .from('user_profiles')
                .select('user_id, nickname, level, total_xp, avatar_url')
                .eq('user_id', currentUserId)
                .single();
            
            if (currentUser) {
                // Contar cuántos jugadores tienen más XP
                const { count } = await supabase
                    .from('user_profiles')
                    .select('*', { count: 'exact', head: true })
                    .gt('total_xp', currentUser.total_xp);
                
                currentUserRank = {
                    ...currentUser,
                    rank: (count || 0) + 1,
                    isCurrentUser: true
                };
            }
        }
        
        return {
            success: true,
            data: rankedPlayers,
            currentUserRank
        };
        
    } catch (error) {
        console.error('Error en getGlobalLeaderboard:', error);
        return { success: false, error: error.message };
    }
}

// Función simplificada para obtener ranking con precisión
export async function getLeaderboardByWinRate(supabase, limit = 100) {
    try {
        // Obtener todos los usuarios con sus stats
        const { data: profiles, error: profileError } = await supabase
            .from('user_profiles')
            .select('user_id, nickname, level, total_xp, avatar_url')
            .order('total_xp', { ascending: false })
            .limit(limit * 2); // Obtener más para filtrar después
        
        if (profileError) throw profileError;
        
        if (!profiles || profiles.length === 0) {
            return { success: true, data: [] };
        }
        
        // Obtener las estadísticas de estos usuarios
        const userIds = profiles.map(p => p.user_id);
        
        const { data: stats, error: statsError } = await supabase
            .from('user_stats')
            .select('user_id, questions_correct, questions_answered')
            .in('user_id', userIds)
            .gt('questions_answered', 50); // Mínimo 50 preguntas
        
        if (statsError) {
            console.error('Error obteniendo stats:', statsError);
            // Si no hay stats, devolver array vacío
            return { success: true, data: [] };
        }
        
        if (!stats || stats.length === 0) {
            return { success: true, data: [] };
        }
        
        const currentUserId = window.getCurrentUser ? window.getCurrentUser()?.id : null;
        
        // Combinar perfiles con stats y calcular win rate
        const playersWithStats = stats.map(stat => {
            const profile = profiles.find(p => p.user_id === stat.user_id);
            const winRate = stat.questions_answered > 0 
                ? Math.round((stat.questions_correct / stat.questions_answered) * 100)
                : 0;
            
            return {
                user_id: stat.user_id,
                nickname: profile?.nickname || 'Jugador',
                level: profile?.level || 1,
                avatar_url: profile?.avatar_url,
                questions_correct: stat.questions_correct,
                questions_answered: stat.questions_answered,
                winRate: winRate,
                isCurrentUser: stat.user_id === currentUserId
            };
        });
        
        // Ordenar por win rate y agregar ranking
        const sorted = playersWithStats
            .sort((a, b) => b.winRate - a.winRate)
            .slice(0, limit)
            .map((player, index) => ({
                ...player,
                rank: index + 1
            }));
        
        return { success: true, data: sorted };
        
    } catch (error) {
        console.error('Error en getLeaderboardByWinRate:', error);
        return { success: false, error: error.message };
    }
}

// Función simplificada para obtener ranking por racha
export async function getLeaderboardByStreak(supabase, limit = 100) {
    try {
        // Primero obtener los usuarios con mejor racha
        const { data: stats, error: statsError } = await supabase
            .from('user_stats')
            .select('user_id, longest_correct_streak, best_win_streak')
            .order('longest_correct_streak', { ascending: false })
            .limit(limit);
        
        if (statsError) {
            console.error('Error obteniendo stats de racha:', statsError);
            return { success: true, data: [] };
        }
        
        if (!stats || stats.length === 0) {
            return { success: true, data: [] };
        }
        
        // Obtener perfiles de estos usuarios
        const userIds = stats.map(s => s.user_id);
        
        const { data: profiles, error: profileError } = await supabase
            .from('user_profiles')
            .select('user_id, nickname, level, avatar_url')
            .in('user_id', userIds);
        
        if (profileError) {
            console.error('Error obteniendo perfiles:', profileError);
        }
        
        const currentUserId = window.getCurrentUser ? window.getCurrentUser()?.id : null;
        
        // Combinar stats con perfiles
        const players = stats.map((stat, index) => {
            const profile = profiles?.find(p => p.user_id === stat.user_id);
            return {
                user_id: stat.user_id,
                nickname: profile?.nickname || 'Jugador',
                level: profile?.level || 1,
                avatar_url: profile?.avatar_url,
                longest_correct_streak: stat.longest_correct_streak || 0,
                best_win_streak: stat.best_win_streak || 0,
                rank: index + 1,
                isCurrentUser: stat.user_id === currentUserId
            };
        });
        
        return { success: true, data: players };
        
    } catch (error) {
        console.error('Error en getLeaderboardByStreak:', error);
        return { success: false, error: error.message };
    }
}

// Hacer disponible globalmente
window.getGlobalLeaderboard = getGlobalLeaderboard;
window.getLeaderboardByWinRate = getLeaderboardByWinRate;
window.getLeaderboardByStreak = getLeaderboardByStreak;