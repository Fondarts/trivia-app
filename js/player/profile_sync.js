// js/profile_sync.js
// Sincronización de perfiles, estadísticas y logros con Supabase

import { getStats } from './stats.js';
import { getUnlockedAchievements } from './stats.js';
import { calculateLevel } from './experience.js';

let supabaseClient = null;
let currentUserId = null;

// Inicializar el sistema de sincronización
export function initProfileSync(supabase, userId) {
    supabaseClient = supabase;
    currentUserId = userId;
    
    console.log('Profile sync initialized for user:', userId);
    
    // Sincronizar datos locales con la nube al inicializar
    if (userId && !userId.startsWith('guest_')) {
        // Dar un pequeño delay para que todo esté listo
        setTimeout(() => syncLocalToCloud(), 1000);
    }
}

// Sincronizar datos locales con Supabase
export async function syncLocalToCloud() {
    if (!supabaseClient || !currentUserId) {
        console.log('No se puede sincronizar: falta cliente o userId');
        return;
    }
    
    try {
        console.log('Iniciando sincronización para usuario:', currentUserId);
        
        const stats = getStats();
        const unlocked = getUnlockedAchievements();
        const level = calculateLevel(stats.totalXP || 0);
        const nickname = localStorage.getItem('user_nickname_' + currentUserId) || 'Jugador';
        
        console.log('Datos a sincronizar:', { level, totalXP: stats.totalXP, nickname });
        
        // Primero verificar si existe el perfil
        const { data: existingProfile } = await supabaseClient
            .from('user_profiles')
            .select('user_id')
            .eq('user_id', currentUserId)
            .single();
        
        const profileData = {
            user_id: currentUserId,
            nickname: nickname,
            level: level,
            total_xp: stats.totalXP || 0,
            updated_at: new Date().toISOString()
        };
        
        if (existingProfile) {
            // UPDATE si ya existe
            const { data, error } = await supabaseClient
                .from('user_profiles')
                .update(profileData)
                .eq('user_id', currentUserId)
                .select();
                
            if (error) {
                console.error('Error actualizando perfil:', error);
            } else {
                console.log('Perfil actualizado:', data);
            }
        } else {
            // INSERT si no existe
            const { data, error } = await supabaseClient
                .from('user_profiles')
                .insert(profileData)
                .select();
                
            if (error) {
                console.error('Error insertando perfil:', error);
            } else {
                console.log('Perfil creado:', data);
            }
        }
        
        // Hacer lo mismo para estadísticas
        const { data: existingStats } = await supabaseClient
            .from('user_stats')
            .select('user_id')
            .eq('user_id', currentUserId)
            .single();
        
        const statsData = {
            user_id: currentUserId,
            questions_answered: stats.questionsAnswered || 0,
            questions_correct: stats.questionsCorrect || 0,
            total_games_played: stats.totalGamesPlayed || 0,
            vs_games_won: stats.vsGamesWon || 0,
            best_win_streak: stats.bestWinStreak || 0,
            longest_correct_streak: stats.longestCorrectStreak || 0,
            perfect_games: stats.perfectGames || 0,
            updated_at: new Date().toISOString()
        };
        
        if (existingStats) {
            const { error } = await supabaseClient
                .from('user_stats')
                .update(statsData)
                .eq('user_id', currentUserId);
                
            if (error) {
                console.error('Error actualizando estadísticas:', error);
            } else {
                console.log('Estadísticas actualizadas');
            }
        } else {
            const { error } = await supabaseClient
                .from('user_stats')
                .insert(statsData);
                
            if (error) {
                console.error('Error insertando estadísticas:', error);
            } else {
                console.log('Estadísticas creadas');
            }
        }
        
        // Sincronizar logros desbloqueados
        const achievementsArray = Array.from(unlocked);
        console.log('Logros a sincronizar:', achievementsArray);
        
        for (const achievementId of achievementsArray) {
            // Verificar si ya existe
            const { data: existing } = await supabaseClient
                .from('user_achievements')
                .select('achievement_id')
                .eq('user_id', currentUserId)
                .eq('achievement_id', achievementId)
                .single();
            
            if (!existing) {
                const { error } = await supabaseClient
                    .from('user_achievements')
                    .insert({
                        user_id: currentUserId,
                        achievement_id: achievementId,
                        unlocked_at: new Date().toISOString()
                    });
                    
                if (error) {
                    console.error('Error insertando logro:', achievementId, error);
                }
            }
        }
        
        console.log('✅ Sincronización completada');
        
    } catch (error) {
        console.error('❌ Error general en sincronización:', error);
    }
}

// Obtener perfil público de un jugador
export async function getPublicProfile(userId) {
    if (!supabaseClient || !userId) return null;
    
    try {
        // Obtener perfil
        const { data: profile, error: profileError } = await supabaseClient
            .from('user_profiles')
            .select('nickname, level, total_xp')
            .eq('user_id', userId)
            .single();
            
        if (profileError) {
            console.error('Error obteniendo perfil:', profileError);
            return null;
        }
        
        // Obtener estadísticas
        const { data: stats, error: statsError } = await supabaseClient
            .from('user_stats')
            .select('questions_correct, questions_answered, vs_games_won, best_win_streak')
            .eq('user_id', userId)
            .single();
            
        if (statsError) {
            console.error('Error obteniendo estadísticas:', statsError);
        }
        
        // Obtener logros
        const { data: achievements, error: achError } = await supabaseClient
            .from('user_achievements')
            .select('achievement_id')
            .eq('user_id', userId);
            
        if (achError) {
            console.error('Error obteniendo logros:', achError);
        }
        
        return {
            profile: profile || { nickname: 'Jugador', level: 1, total_xp: 0 },
            stats: stats || { questions_correct: 0, questions_answered: 0, vs_games_won: 0, best_win_streak: 0 },
            achievements: achievements ? achievements.map(a => a.achievement_id) : []
        };
        
    } catch (error) {
        console.error('Error obteniendo perfil público:', error);
        return null;
    }
}

// Obtener perfiles de múltiples jugadores (para VS)
export async function getPlayersProfiles(playerIds) {
    if (!supabaseClient || !playerIds || playerIds.length === 0) return {};
    
    try {
        const { data: profiles, error } = await supabaseClient
            .from('user_profiles')
            .select('user_id, nickname, level, total_xp')
            .in('user_id', playerIds);
            
        if (error) {
            console.error('Error obteniendo perfiles:', error);
            return {};
        }
        
        // Convertir a objeto indexado por user_id
        const profilesMap = {};
        profiles.forEach(p => {
            profilesMap[p.user_id] = p;
        });
        
        return profilesMap;
        
    } catch (error) {
        console.error('Error obteniendo perfiles de jugadores:', error);
        return {};
    }
}

// Hacer disponible globalmente para otros módulos
window.syncProfileToCloud = syncLocalToCloud;
window.getPublicProfile = getPublicProfile;
window.getPlayersProfiles = getPlayersProfiles;
window.initProfileSync = initProfileSync;