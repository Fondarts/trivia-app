// www/js/achievements.js

// Mapeo de iconos para los logros
export const ACHIEVEMENT_ICONS = {
  'ACCURACY_STREAK_10': 'francotirador.png',
  'ACCURACY_STREAK_25': 'eagle eye.png',
  'PERFECT_GAME': 'wizard.png',
  'DEDICATION_FIRST_GAME': 'newbie.png',
  'SURI_7_DAYS': 'Suri logro.webp',
  'DEDICATION_30_DAYS': 'sword.png',
  'DEDICATION_100_GAMES': 'wizard.png',
  'DEDICATION_500_GAMES': 'wizard.png',
  'SPECIAL_EARLY_BIRD': 'morning.png',
  'SPECIAL_NIGHT_OWL': 'night.png'
};

export const ACHIEVEMENTS_LIST = [
  // === LOGROS BASE EXISTENTES ===

  // --- Precisión ---
  {
    id: 'ACCURACY_STREAK_10',
    title: 'Francotirador',
    description: 'Consigue 10 respuestas correctas seguidas.',
    icon: 'francotirador.png',
    condition: (stats) => stats.longestCorrectStreak >= 10,
  },
  {
    id: 'ACCURACY_STREAK_25',
    title: 'Ojo de Águila',
    description: 'Consigue 25 respuestas correctas seguidas.',
    icon: 'eagle eye.png',
    condition: (stats) => stats.longestCorrectStreak >= 25,
  },
  {
    id: 'PERFECT_GAME',
    title: 'Perfeccionista',
    description: 'Completa una partida de 15+ preguntas sin fallar.',
    icon: 'wizard.png',
    condition: (stats) => stats.perfectGames >= 1,
  },
  
  // --- Conocimiento ---
  {
    id: 'KNOWLEDGE_BIBLE',
    title: 'Estudiante de la Biblia',
    description: '100 respuestas correctas en Biblia.',
    icon: 'wizard.png',
    condition: (stats) => stats.correctByCategory.bible >= 100,
  },

  // --- Dedicación ---
  {
    id: 'DEDICATION_FIRST_GAME',
    title: 'Principiante',
    description: 'Juega tu primera partida.',
    icon: 'newbie.png',
    condition: (stats) => stats.totalGamesPlayed >= 1,
  },
  {
    id: 'SURI_7_DAYS',
    title: 'Suri',
    description: 'Juega 7 días seguidos.',
    icon: 'Suri logro.webp',
    condition: (stats) => stats.consecutiveDaysPlayed >= 7,
  },
  {
    id: 'DEDICATION_30_DAYS',
    title: 'Veterano',
    description: 'Juega 30 días seguidos.',
    icon: 'sword.png',
    condition: (stats) => stats.consecutiveDaysPlayed >= 30,
  },
  {
    id: 'DEDICATION_100_GAMES',
    title: 'Leyenda',
    description: 'Juega 100 partidas.',
    icon: 'wizard.png',
    condition: (stats) => stats.totalGamesPlayed >= 100,
  },
  {
    id: 'DEDICATION_500_GAMES',
    title: 'Mítico',
    description: 'Juega 500 partidas.',
    icon: 'wizard.png',
    condition: (stats) => stats.totalGamesPlayed >= 500,
  },

  // --- Especiales ---
  {
    id: 'SPECIAL_EARLY_BIRD',
    title: 'Madrugador',
    description: 'Juega una partida entre las 5 y 7 AM.',
    icon: 'morning.png',
    condition: (stats, special) => special.isEarlyBird(),
  },
  {
    id: 'SPECIAL_NIGHT_OWL',
    title: 'Noctámbulo',
    description: 'Juega una partida entre las 12 y 3 AM.',
    icon: 'night.png',
    condition: (stats, special) => special.isNightOwl(),
  },

  // === NUEVOS LOGROS - PRECISIÓN AVANZADA ===
  {
    id: 'PRECISION_100_TOTAL',
    title: 'Mente Brillante',
    description: 'Responde 100 preguntas correctas en total.',
    icon: 'brain.png', // Usamos brain.png por ahora
    condition: (stats) => stats.questionsCorrect >= 100,
  },
  {
    id: 'PRECISION_95_PERCENT',
    title: 'Maestro del Conocimiento',
    description: 'Alcanza 95% de precisión con mínimo 50 preguntas.',
    icon: 'wizard.png', // Usamos wizard como crown
    condition: (stats) => stats.questionsAnswered >= 50 && (stats.questionsCorrect / stats.questionsAnswered) >= 0.95,
  },
  {
    id: 'PERFECT_GAMES_3',
    title: 'Sin Errores',
    description: 'Completa 3 partidas perfectas.',
    icon: 'target.png', // Usamos target como shield
    condition: (stats) => stats.perfectGames >= 3,
  },

  // === LOGROS DE RACHA EXTREMA ===
  {
    id: 'STREAK_50',
    title: 'Imparable',
    description: 'Consigue una racha de 50 respuestas correctas.',
    icon: 'eagle.png', // Usamos eagle como meteor
    condition: (stats) => stats.longestCorrectStreak >= 50,
  },
  {
    id: 'STREAK_100',
    title: 'Leyenda Viviente',
    description: 'Consigue una racha de 100 respuestas correctas.',
    icon: 'god.png', // Usamos god como phoenix
    condition: (stats) => stats.longestCorrectStreak >= 100,
  },

  // === LOGROS COMPETITIVOS ===
  // Logros VS/timed/adventure removidos

  // === LOGROS DE EXPERIENCIA ===
  {
    id: 'LEVEL_5',
    title: 'Novato Prometedor',
    description: 'Alcanza el nivel 5.',
    icon: 'newbie.png',
    condition: (stats) => stats.level >= 5,
  },
  {
    id: 'LEVEL_25',
    title: 'Veterano',
    description: 'Alcanza el nivel 25.',
    icon: 'sword.png',
    condition: (stats) => stats.level >= 25,
  },
  {
    id: 'LEVEL_50',
    title: 'Élite',
    description: 'Alcanza el nivel 50.',
    icon: 'wizard.png',
    condition: (stats) => stats.level >= 50,
  },
  {
    id: 'LEVEL_100',
    title: 'Leyenda',
    description: 'Alcanza el nivel 100.',
    icon: 'god.png',
    condition: (stats) => stats.level >= 100,
  },


  {
    id: 'DAILY_PLAYER_14',
    title: 'Adicto Saludable',
    description: 'Juega al menos una vez al día por 14 días.',
    icon: 'anniversary.png',
    condition: (stats) => stats.consecutiveDaysPlayed >= 14,
  },
  {
    id: 'MONTHLY_MASTER',
    title: 'Maestro del Mes',
    description: 'Juega todos los días de un mes.',
    icon: 'god.png',
    condition: (stats) => stats.consecutiveDaysPlayed >= 30,
  },

  // === LOGROS ÉPICOS ===
  {
    id: 'QUESTIONS_1000',
    title: 'Milenario',
    description: 'Responde 1000 preguntas en total.',
    icon: 'brain.png',
    condition: (stats) => stats.questionsAnswered >= 1000,
  },
  {
    id: 'CORRECT_500',
    title: 'Enciclopedia Viviente',
    description: 'Responde correctamente 500 preguntas.',
    icon: 'brain.png',
    condition: (stats) => stats.questionsCorrect >= 500,
  },
  {
    id: 'ALL_ACHIEVEMENTS',
    title: 'Dios del Conocimiento',
    description: 'Desbloquea todos los demás logros.',
    icon: 'god.png',
    condition: (stats, special) => {
      // Este requiere verificación especial de todos los logros
      return false;
    },
  }
];