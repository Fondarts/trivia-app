// www/js/stats.js

import { Storage } from '../core/storage.js';
import { ACHIEVEMENTS_LIST } from './achievements.js';
import { calculateLevel } from './experience.js';

const STATS_KEY = 'trivia_stats';
const ACHIEVEMENTS_KEY = 'trivia_achievements_unlocked';

const defaultStats = {
  totalXP: 0,
  level: 1,
  questionsAnswered: 0,
  questionsCorrect: 0,
  totalGamesPlayed: 0,
  soloGamesPlayed: 0,
  timedGamesPlayed: 0,
  vsGamesWon: 0,
  winStreak: 0,
  bestWinStreak: 0,
  currentCorrectStreak: 0,
  longestCorrectStreak: 0,
  perfectGames: 0,
  lastPlayDate: null,
  consecutiveDaysPlayed: 1,
  correctByCategory: {
    movies: 0,
    geography: 0,
    history: 0,
    science: 0,
    sports: 0,
    culture: 0,
  }
};

// --- CORRECCIÓN DE ERROR AQUÍ ---
// Esta función ahora es más robusta y previene errores con datos guardados de versiones antiguas.
export function getStats() {
  const savedStats = Storage.get(STATS_KEY);
  if (!savedStats) return defaultStats;
  
  // Fusiona los datos guardados de forma segura para garantizar que todas las propiedades existan.
  return {
    ...defaultStats,
    ...savedStats,
    correctByCategory: {
      ...defaultStats.correctByCategory,
      ...(savedStats.correctByCategory || {}),
    }
  };
}

function saveStats(stats) {
  Storage.set(STATS_KEY, stats);
}

export function getUnlockedAchievements() {
  const unlocked = Storage.get(ACHIEVEMENTS_KEY, []);
  return new Set(unlocked);
}

function saveUnlockedAchievement(achievementId) {
  const unlocked = getUnlockedAchievements();
  unlocked.add(achievementId);
  Storage.set(ACHIEVEMENTS_KEY, [...unlocked]);
}

function handleDailyStreak(stats) {
    const today = new Date().toISOString().slice(0, 10);
    const lastPlay = stats.lastPlayDate;
    if (lastPlay) {
        const yesterday = new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().slice(0, 10);
        if (lastPlay === yesterday) {
            stats.consecutiveDaysPlayed++;
        } else if (lastPlay !== today) {
            stats.consecutiveDaysPlayed = 1;
        }
    } else {
        stats.consecutiveDaysPlayed = 1;
    }
    stats.lastPlayDate = today;
}

export async function trackEvent(eventName, data = {}) {
  const stats = getStats();
  const oldLevel = stats.level;
  let xpGained = 0;
  let bonusToast = null;

  const XP_VALUES = {
      correct: { easy: 10, medium: 15, hard: 20 },
      incorrect: -2,
      game_finish: 20,
      perfect_game: 50,
      streak_5: 15,
      streak_10: 30,
  };

  switch (eventName) {
    case 'game_start':
      handleDailyStreak(stats);
      stats.totalGamesPlayed++;
      break;

    case 'answer_correct':
      stats.questionsAnswered++;
      stats.questionsCorrect++;
      stats.currentCorrectStreak++;
      if (stats.currentCorrectStreak > stats.longestCorrectStreak) {
        stats.longestCorrectStreak = stats.currentCorrectStreak;
      }
      if (data.category && stats.correctByCategory.hasOwnProperty(data.category)) {
        stats.correctByCategory[data.category]++;
      }
      xpGained = XP_VALUES.correct[data.difficulty] || XP_VALUES.correct.medium;
      
      if (stats.currentCorrectStreak === 5) {
        xpGained += XP_VALUES.streak_5;
        bonusToast = `🔥 Racha de 5: +${XP_VALUES.streak_5} XP!`;
      }
      if (stats.currentCorrectStreak === 10) {
        xpGained += XP_VALUES.streak_10;
        bonusToast = `🔥🔥 Racha de 10: +${XP_VALUES.streak_10} XP!`;
      }
      break;

    case 'answer_wrong':
      stats.questionsAnswered++;
      stats.currentCorrectStreak = 0;
      xpGained = XP_VALUES.incorrect;
      break;

    case 'game_finish':
        xpGained = XP_VALUES.game_finish;
        if (data.isPerfect) {
            xpGained += XP_VALUES.perfect_game;
            bonusToast = `✨ Partida Perfecta: +${XP_VALUES.perfect_game} XP!`;
            stats.perfectGames++;
        }
        if (data.mode === 'solo') stats.soloGamesPlayed++;
        if (data.mode === 'timed') stats.timedGamesPlayed++;
        if (data.won) {
            stats.winStreak++;
            if (stats.winStreak > stats.bestWinStreak) stats.bestWinStreak = stats.winStreak;
            if (data.mode === 'vs') stats.vsGamesWon++;
        } else {
            stats.winStreak = 0;
        }
        break;
  }
  
  stats.totalXP = Math.max(0, stats.totalXP + xpGained);
  stats.level = calculateLevel(stats.totalXP);
  const leveledUp = stats.level > oldLevel;
  
  saveStats(stats);

  // Intentar sincronizar con el servidor
  try {
    if (window.syncProfileToCloud && typeof window.syncProfileToCloud === 'function') {
      window.syncProfileToCloud();
    }
  } catch (err) {
    // Si falla, solo guardar localmente (ya está hecho arriba)
    console.log('Stats guardadas localmente');
  }

  const newAchievements = await checkForNewAchievements(stats);
  return { newAchievements, leveledUp, bonusToast };
}

async function checkForNewAchievements(currentStats) {
  const unlocked = getUnlockedAchievements();
  const newlyUnlocked = [];
  
  for (const achievement of ACHIEVEMENTS_LIST) {
    if (!unlocked.has(achievement.id)) {
      const specialConditions = {
          isEarlyBird: () => { const h = new Date().getHours(); return h >= 5 && h < 7; },
          isNightOwl: () => { const h = new Date().getHours(); return h >= 0 && h < 3; }
      };
      if (achievement.condition(currentStats, specialConditions)) {
        newlyUnlocked.push(achievement);
        saveUnlockedAchievement(achievement.id);
        
        // Guardar en Supabase si está disponible
        if (window.supabaseClient && window.getCurrentUser) {
          try {
            const user = window.getCurrentUser();
            if (user && !user.isGuest) {
              await window.supabaseClient
                .from('user_achievements')
                .insert({
                  user_id: user.id,
                  achievement_id: achievement.id
                })
                .select();
              console.log('Logro guardado en la nube:', achievement.id);
            }
          } catch (error) {
            console.error('Error guardando logro en Supabase:', error);
          }
        }
      }
    }
  }
  return newlyUnlocked;
}