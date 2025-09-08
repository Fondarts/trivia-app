// js/stats_sync.js - Sincronización de estadísticas con el servidor

import { getCurrentUser, updateUserStats } from './auth.js';
import { getStats } from './stats.js';

// Sincronizar estadísticas locales con el perfil del usuario
export async function syncStatsWithProfile() {
  const user = getCurrentUser();
  if (!user) return { success: false, error: 'No user logged in' };
  
  try {
    const localStats = getStats();
    
    // Preparar actualización de estadísticas
    const statsUpdate = {
      totalXP: localStats.totalXP,
      level: localStats.level,
      questionsAnswered: localStats.questionsAnswered,
      questionsCorrect: localStats.questionsCorrect,
      totalGamesPlayed: localStats.totalGamesPlayed,
      vsGamesWon: localStats.vsGamesWon,
      bestWinStreak: localStats.bestWinStreak,
      currentCorrectStreak: localStats.currentCorrectStreak,
      longestCorrectStreak: localStats.longestCorrectStreak,
      perfectGames: localStats.perfectGames,
      consecutiveDaysPlayed: localStats.consecutiveDaysPlayed,
      correctByCategory: localStats.correctByCategory
    };
    
    // Actualizar en el servidor
    const result = await updateUserStats(statsUpdate);
    
    if (result.success) {
      console.log('Stats synced successfully');
      return { success: true };
    } else {
      console.error('Failed to sync stats:', result.error);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error('Error syncing stats:', error);
    return { success: false, error: error.message };
  }
}

// Migrar estadísticas locales al crear cuenta
export async function migrateLocalStats() {
  const user = getCurrentUser();
  if (!user || user.is_guest) return;
  
  // Verificar si ya migramos las estadísticas
  const migrated = localStorage.getItem('stats_migrated');
  if (migrated === user.id) return;
  
  try {
    const result = await syncStatsWithProfile();
    if (result.success) {
      localStorage.setItem('stats_migrated', user.id);
      console.log('Local stats migrated to profile');
    }
  } catch (error) {
    console.error('Failed to migrate stats:', error);
  }
}

// Hook para sincronizar después de cada evento importante
export function setupStatsSync() {
  // Sincronizar cada 5 minutos si hay usuario logueado
  setInterval(async () => {
    const user = getCurrentUser();
    if (user && !user.is_guest) {
      await syncStatsWithProfile();
    }
  }, 300000); // 5 minutos
  
  // Sincronizar al cerrar/recargar la página
  window.addEventListener('beforeunload', () => {
    const user = getCurrentUser();
    if (user && !user.is_guest) {
      // Intentar sincronización síncrona (best effort)
      const localStats = getStats();
      localStorage.setItem('pending_stats_sync', JSON.stringify(localStats));
    }
  });
  
  // Sincronizar cuando el usuario vuelve a la página
  window.addEventListener('visibilitychange', async () => {
    if (!document.hidden) {
      const user = getCurrentUser();
      if (user && !user.is_guest) {
        await syncStatsWithProfile();
      }
    }
  });
}

export default {
  syncStatsWithProfile,
  migrateLocalStats,
  setupStatsSync
};