// js/profile_sync.js
// SincronizaciA3n de perfiles, estadA-sticas y logros con Supabase

import { getStats } from './stats.js';
import { getUnlockedAchievements } from './stats.js';
import { calculateLevel } from './experience.js';

const STATS_STORAGE_KEY = 'trivia_stats';
const ACHIEVEMENTS_STORAGE_KEY = 'trivia_achievements_unlocked';

let supabaseClient = null;
let currentUserId = null;
let hasHydratedFromCloud = false;

function hasMeaningfulStats(stats) {
    if (!stats) return false;
    const values = [
        stats.totalXP,
        stats.questionsAnswered,
        stats.questionsCorrect,
        stats.totalGamesPlayed,
        stats.vsGamesWon,
        stats.perfectGames,
        stats.bestWinStreak,
        stats.longestCorrectStreak
    ];
    return values.some(value => (value || 0) > 0);
}

function hasMeaningfulServerStats(stats) {
    if (!stats) return false;
    const values = [
        stats.questions_answered,
        stats.questions_correct,
        stats.total_games_played,
        stats.vs_games_won,
        stats.perfect_games,
        stats.best_win_streak,
        stats.longest_correct_streak
    ];
    return values.some(value => (value || 0) > 0);
}

function normalizeNickname(nickname) {
    return (nickname || '').trim();
}

function isCustomNickname(nickname) {
    const normalized = normalizeNickname(nickname);
    if (!normalized) return false;
    return normalized.toLowerCase() !== 'jugador';
}

async function syncCloudToLocal() {
    if (!supabaseClient || !currentUserId) return;

    console.log('🔄 Iniciando syncCloudToLocal para usuario:', currentUserId);

    try {
        const localStats = getStats();
        const localAchievements = getUnlockedAchievements();
        const localHasProgress = hasMeaningfulStats(localStats) || localAchievements.size > 0;
        const hasLocalNickname = !!normalizeNickname(localStorage.getItem('user_nickname_' + currentUserId));

        console.log('📊 Estado local:', {
            localHasProgress,
            hasLocalNickname,
            localStats,
            localAchievements: localAchievements.size
        });

        // En Android, siempre intentar sincronizar desde el servidor primero
        const isAndroid = window.Capacitor && window.Capacitor.getPlatform() === 'android';
        
        if (localHasProgress && hasLocalNickname && !isAndroid) {
            console.log('⚠️ Saltando sync - datos locales encontrados (solo en web)');
            hasHydratedFromCloud = true;
            return;
        }

        console.log('🔍 Consultando perfil para user_id:', currentUserId);
        const profilePromise = supabaseClient
            .from('user_profiles')
            .select('nickname, level, total_xp')
            .eq('user_id', currentUserId)
            .maybeSingle();

        const statsPromise = supabaseClient
            .from('user_stats')
            .select('questions_answered, questions_correct, total_games_played, vs_games_won, best_win_streak, longest_correct_streak, perfect_games')
            .eq('user_id', currentUserId)
            .maybeSingle();

        const achievementsPromise = supabaseClient
            .from('user_achievements')
            .select('achievement_id')
            .eq('user_id', currentUserId);

        const [profileResult, statsResult, achievementsResult] = await Promise.all([
            profilePromise,
            statsPromise,
            achievementsPromise
        ]);

        console.log('📊 Resultado de consulta de perfil:', {
            profileResult,
            error: profileResult.error
        });

        const profile = profileResult.data;
        const stats = statsResult.data;
        const achievements = achievementsResult.data || [];

        const serverHasProgress =
            ((profile?.total_xp ?? 0) > 0) ||
            hasMeaningfulServerStats(stats) ||
            achievements.length > 0 ||
            isCustomNickname(profile?.nickname);

        console.log('🔍 Verificando datos del servidor:', {
            profile: profile,
            stats: stats,
            achievements: achievements.length,
            serverHasProgress
        });

        if (!serverHasProgress) {
            console.log('⚠️ No hay datos del servidor para sincronizar');
            hasHydratedFromCloud = true;
            return;
        }

        console.log('✅ Datos del servidor encontrados, sincronizando...');

        const mergedStats = { ...localStats };

        if (typeof profile?.total_xp === 'number') {
            console.log('📈 Actualizando XP desde servidor:', profile.total_xp);
            mergedStats.totalXP = profile.total_xp;
            mergedStats.level = profile.level ?? calculateLevel(profile.total_xp);
        }

        if (stats) {
            mergedStats.questionsAnswered = stats.questions_answered ?? mergedStats.questionsAnswered;
            mergedStats.questionsCorrect = stats.questions_correct ?? mergedStats.questionsCorrect;
            mergedStats.totalGamesPlayed = stats.total_games_played ?? mergedStats.totalGamesPlayed;
            mergedStats.vsGamesWon = stats.vs_games_won ?? mergedStats.vsGamesWon;
            mergedStats.bestWinStreak = stats.best_win_streak ?? mergedStats.bestWinStreak;
            mergedStats.longestCorrectStreak = stats.longest_correct_streak ?? mergedStats.longestCorrectStreak;
            mergedStats.perfectGames = stats.perfect_games ?? mergedStats.perfectGames;
        }

        console.log('💾 Guardando datos sincronizados:', mergedStats);
        localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(mergedStats));

        if (profile?.nickname) {
            console.log('👤 Guardando nickname:', profile.nickname);
            localStorage.setItem('user_nickname_' + currentUserId, profile.nickname);
            localStorage.setItem('user_has_nickname_' + currentUserId, 'true');
        }

        if (achievements.length > 0) {
            const achievementIds = Array.from(new Set(achievements.map(a => a.achievement_id)));
            console.log('🏆 Guardando logros:', achievementIds);
            localStorage.setItem(ACHIEVEMENTS_STORAGE_KEY, JSON.stringify(achievementIds));
        }

        if (typeof window.updatePlayerXPBar === 'function') {
            console.log('🔄 Actualizando barra de XP...');
            // Forzar actualización inmediata de la UI
            setTimeout(() => {
                window.updatePlayerXPBar();
                console.log('✅ UI actualizada con datos sincronizados');
            }, 100);
        }

        console.log('✅ Sincronización completada exitosamente');

    } catch (error) {
        console.error('Error sincronizando datos desde la nube:', error);
    } finally {
        hasHydratedFromCloud = true;
    }
}

// Inicializar el sistema de sincronizaciA3n
export function initProfileSync(supabase, userId) {
    supabaseClient = supabase;
    currentUserId = userId;
    hasHydratedFromCloud = false;
    
    console.log('Profile sync initialized for user:', userId);
    
    if (userId && !userId.startsWith('guest_')) {
        // En Android, dar más tiempo para que la sesión se establezca completamente
        const isAndroid = window.Capacitor && window.Capacitor.getPlatform() === 'android';
        const delay = isAndroid ? 2000 : 500;
        
        setTimeout(() => {
            syncCloudToLocal()
                .catch(error => console.error('Error al hidratar datos desde la nube:', error))
                .finally(() => {
                    setTimeout(() => {
                        syncLocalToCloud();
                    }, 1500);
                });
        }, delay);
    }
}

// Sincronizar datos locales con Supabase
export async function syncLocalToCloud() {
    if (!supabaseClient || !currentUserId) {
        console.log('No se puede sincronizar: falta cliente o userId');
        return;
    }
    
    const stats = getStats();
    const unlocked = getUnlockedAchievements();
    const nickname = normalizeNickname(localStorage.getItem('user_nickname_' + currentUserId)) || 'Jugador';

    if (!hasHydratedFromCloud) {
        console.log('Sincronizacion pospuesta: esperando hidratacion inicial.');
        return;
    }

    const hasStatsProgress = hasMeaningfulStats(stats);
    const hasAchievements = unlocked.size > 0;
    const hasNickname = isCustomNickname(nickname);

    if (!hasStatsProgress && !hasAchievements && !hasNickname) {
        console.log('Sin datos locales para sincronizar; se omite subida.');
        return;
    }

    try {
        console.log('Iniciando sincronizaciA3n para usuario:', currentUserId);
        
        const profilePromise = supabaseClient
            .from('user_profiles')
            .select('user_id, nickname, level, total_xp')
            .eq('user_id', currentUserId)
            .maybeSingle();

        const statsPromise = supabaseClient
            .from('user_stats')
            .select('user_id, questions_answered, questions_correct, total_games_played, vs_games_won, best_win_streak, longest_correct_streak, perfect_games')
            .eq('user_id', currentUserId)
            .maybeSingle();

        const achievementsPromise = hasAchievements
            ? supabaseClient
                .from('user_achievements')
                .select('achievement_id')
                .eq('user_id', currentUserId)
            : Promise.resolve({ data: [], error: null });

        const [profileResult, statsResult, achievementsResult] = await Promise.all([
            profilePromise,
            statsPromise,
            achievementsPromise
        ]);

        const existingProfile = profileResult.data;
        const existingStats = statsResult.data;
        const existingAchievementIds = new Set((achievementsResult.data || []).map(a => a.achievement_id));

        const profileData = {
            user_id: currentUserId,
            nickname: hasNickname ? nickname : (existingProfile?.nickname || nickname),
            level: hasStatsProgress ? calculateLevel(stats.totalXP || 0) : (existingProfile?.level ?? calculateLevel(existingProfile?.total_xp ?? 0)),
            total_xp: hasStatsProgress ? (stats.totalXP || 0) : (existingProfile?.total_xp ?? 0),
            updated_at: new Date().toISOString()
        };

        if (!existingProfile) {
            const { error } = await supabaseClient
                .from('user_profiles')
                .insert(profileData);
                
            if (error) {
                console.error('Error insertando perfil:', error);
            } else {
                console.log('Perfil creado en Supabase');
            }
        } else {
            const { error } = await supabaseClient
                .from('user_profiles')
                .update(profileData)
                .eq('user_id', currentUserId);
                
            if (error) {
                console.error('Error actualizando perfil:', error);
            } else {
                console.log('Perfil actualizado en Supabase');
            }
        }

        if (hasStatsProgress) {
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
                    console.error('Error actualizando estadA-sticas:', error);
                } else {
                    console.log('EstadA-sticas actualizadas en Supabase');
                }
            } else {
                const { error } = await supabaseClient
                    .from('user_stats')
                    .insert(statsData);
                    
                if (error) {
                    console.error('Error insertando estadA-sticas:', error);
                } else {
                    console.log('EstadA-sticas creadas en Supabase');
                }
            }
        } else {
            console.log('Sin progreso local en estadA-sticas; no se actualiza user_stats.');
        }
        
        if (hasAchievements) {
            for (const achievementId of unlocked) {
                if (existingAchievementIds.has(achievementId)) continue;

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
        
        console.log('Sincronizacion completada');
        
    } catch (error) {
        console.error('Error general en sincronizacion:', error);
    }
}

// Obtener perfil pA?blico de un jugador
export async function getPublicProfile(userId) {
    if (!supabaseClient || !userId) return null;
    
    try {
        const { data: profile, error: profileError } = await supabaseClient
            .from('user_profiles')
            .select('nickname, level, total_xp')
            .eq('user_id', userId)
            .single();
            
        if (profileError) {
            console.error('Error obteniendo perfil:', profileError);
            return null;
        }
        
        const { data: stats, error: statsError } = await supabaseClient
            .from('user_stats')
            .select('questions_correct, questions_answered, vs_games_won, best_win_streak')
            .eq('user_id', userId)
            .single();
            
        if (statsError) {
            console.error('Error obteniendo estadA-sticas:', statsError);
        }
        
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
        console.error('Error obteniendo perfil pA?blico:', error);
        return null;
    }
}

// Obtener perfiles de mA?ltiples jugadores (para VS)
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

// Función para forzar sincronización completa (útil para Android)
export async function forceFullSync(retryCount = 0) {
    if (!supabaseClient || !currentUserId) {
        console.log('No se puede forzar sincronización: falta cliente o userId');
        return;
    }
    
    console.log(`🔄 Forzando sincronización completa (intento ${retryCount + 1})...`);
    hasHydratedFromCloud = false;
    
    try {
        await syncCloudToLocal();
        await syncLocalToCloud();
        console.log('✅ Sincronización completa exitosa');
    } catch (error) {
        console.error('❌ Error en sincronización completa:', error);
        
        // Retry hasta 3 veces en Android
        const isAndroid = window.Capacitor && window.Capacitor.getPlatform() === 'android';
        if (isAndroid && retryCount < 2) {
            console.log(`🔄 Reintentando sincronización en ${(retryCount + 1) * 2000}ms...`);
            setTimeout(() => {
                forceFullSync(retryCount + 1);
            }, (retryCount + 1) * 2000);
        }
    }
}

// Función de debug para verificar consulta directa a Supabase
export async function debugSupabaseQuery() {
    if (!supabaseClient || !currentUserId) {
        console.log('❌ No se puede hacer debug query: falta cliente o userId');
        return;
    }
    
    console.log('🐛 DEBUG: Consultando directamente Supabase...');
    console.log('🐛 User ID:', currentUserId);
    
    try {
        // Consulta directa sin filtros adicionales
        const { data, error } = await supabaseClient
            .from('user_profiles')
            .select('*')
            .eq('user_id', currentUserId);
            
        console.log('🐛 Resultado directo:', { data, error });
        
        // También consultar todas las filas para ver qué hay
        const { data: allData, error: allError } = await supabaseClient
            .from('user_profiles')
            .select('user_id, nickname, level, total_xp')
            .limit(10);
            
        console.log('🐛 Todas las filas (primeras 10):', { allData, allError });
        
    } catch (error) {
        console.error('🐛 DEBUG: Error en consulta:', error);
    }
}

// Función de debug para verificar datos locales
export function debugLocalData() {
    console.log('🐛 DEBUG: Verificando datos locales...');
    
    const stats = JSON.parse(localStorage.getItem('trivia_stats') || '{}');
    const nickname = localStorage.getItem('user_nickname_' + currentUserId);
    const achievements = JSON.parse(localStorage.getItem('trivia_achievements_unlocked') || '[]');
    
    console.log('🐛 Datos locales:', {
        stats,
        nickname,
        achievements: achievements.length,
        currentUserId
    });
    
    // Verificar función getLevelProgress
    if (typeof window.getLevelProgress === 'function' && stats.totalXP) {
        const progress = window.getLevelProgress(stats.totalXP);
        console.log('🐛 Progreso calculado:', progress);
    }
    
    return { stats, nickname, achievements };
}

// Función de debug para forzar sincronización desde servidor
export async function debugForceCloudSync() {
    if (!supabaseClient || !currentUserId) {
        console.log('❌ No se puede hacer debug sync: falta cliente o userId');
        return;
    }
    
    console.log('🐛 DEBUG: Forzando sincronización desde servidor...');
    hasHydratedFromCloud = false;
    
    try {
        await syncCloudToLocal();
        console.log('🐛 DEBUG: Sincronización desde servidor completada');
    } catch (error) {
        console.error('🐛 DEBUG: Error en sincronización:', error);
    }
}

// Hacer disponible globalmente para otros mA3dulos
window.forceSyncProfile = syncLocalToCloud;
window.syncProfileToCloud = syncLocalToCloud;
window.forceFullSync = forceFullSync;
window.debugForceCloudSync = debugForceCloudSync;
window.debugSupabaseQuery = debugSupabaseQuery;
window.debugLocalData = debugLocalData;
window.getPublicProfile = getPublicProfile;
window.getPlayersProfiles = getPlayersProfiles;
window.initProfileSync = initProfileSync;


