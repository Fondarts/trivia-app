// www/js/experience.js

// Constantes para ajustar la curva de nivelación
const BASE_XP = 100; // XP necesario para el primer nivel
const GROWTH_FACTOR = 1.5; // Qué tan rápido aumenta el requisito de XP

/**
 * Calcula el nivel de un jugador basado en su XP total.
 * @param {number} totalXP - El total de puntos de experiencia del jugador.
 * @returns {number} - El nivel actual.
 */
export function calculateLevel(totalXP) {
  if (totalXP < BASE_XP) {
    return 1;
  }
  let level = 1;
  let xpForNext = BASE_XP;
  while (totalXP >= xpForNext) {
    totalXP -= xpForNext;
    level++;
    xpForNext = Math.floor(xpForNext * GROWTH_FACTOR);
  }
  return level;
}

/**
 * Calcula la información de XP para el nivel actual.
 * @param {number} totalXP - El total de puntos de experiencia del jugador.
 * @returns {object} - Un objeto con { currentLevelXP, xpForNextLevel, progressPercent }
 */
export function getLevelProgress(totalXP) {
  let level = 1;
  let xpForCurrentLevel = 0;
  let xpForNextLevel = BASE_XP;

  while (totalXP >= xpForNextLevel) {
    totalXP -= xpForNextLevel;
    level++;
    xpForCurrentLevel = xpForNextLevel;
    xpForNextLevel = Math.floor(xpForNextLevel * GROWTH_FACTOR);
  }

  const currentLevelXP = totalXP;
  const progressPercent = (currentLevelXP / xpForNextLevel) * 100;

  return {
    level,
    currentLevelXP: Math.floor(currentLevelXP),
    xpForNextLevel: Math.floor(xpForNextLevel),
    progressPercent: Math.min(100, progressPercent),
  };
}