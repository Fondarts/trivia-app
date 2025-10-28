// www/js/achievements.js

// Mapeo de iconos para los logros
export const ACHIEVEMENT_ICONS = {
  'ACCURACY_STREAK_10': 'francotirador.png',
  'ACCURACY_STREAK_25': 'eagle eye.png',
  'PERFECT_GAME': 'wizard.png',
  'KNOWLEDGE_MOVIES': 'movie.png',          // Actualizado
  'KNOWLEDGE_GEOGRAPHY': 'world.png',       // Actualizado
  'KNOWLEDGE_HISTORY': 'hieroglyph.png',    // Actualizado
  'KNOWLEDGE_SCIENCE': 'science.png',       // Actualizado
  'KNOWLEDGE_SPORTS': 'sports.png',         // Actualizado
  'KNOWLEDGE_SAGE': 'wizard.png',
  'DEDICATION_FIRST_GAME': 'newbie.png',
  'DEDICATION_7_DAYS': 'sword.png',
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
    id: 'KNOWLEDGE_MOVIES',
    title: 'Cinéfilo',
    description: '50 respuestas correctas en Películas.',
    icon: 'movie.png',  // Actualizado
    condition: (stats) => stats.correctByCategory.movies >= 50,
  },
  {
    id: 'KNOWLEDGE_GEOGRAPHY',
    title: 'Geógrafo',
    description: '50 respuestas correctas en Geografía.',
    icon: 'world.png',  // Actualizado
    condition: (stats) => stats.correctByCategory.geography >= 50,
  },
  {
    id: 'KNOWLEDGE_HISTORY',
    title: 'Historiador',
    description: '50 respuestas correctas en Historia.',
    icon: 'hieroglyph.png',  // Actualizado
    condition: (stats) => stats.correctByCategory.history >= 50,
  },
  {
    id: 'KNOWLEDGE_SCIENCE',
    title: 'Científico',
    description: '50 respuestas correctas en Ciencia.',
    icon: 'science.png',  // Actualizado
    condition: (stats) => stats.correctByCategory.science >= 50,
  },
  {
    id: 'KNOWLEDGE_SPORTS',
    title: 'Deportista',
    description: '50 respuestas correctas en Deportes.',
    icon: 'sports.png',  // Actualizado
    condition: (stats) => stats.correctByCategory.sports >= 50,
  },
  {
    id: 'KNOWLEDGE_SAGE',
    title: 'Sabio',
    description: '100 respuestas correctas en CADA categoría.',
    icon: 'wizard.png',
    condition: (stats) => Object.values(stats.correctByCategory).every(count => count >= 100),
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
    id: 'DEDICATION_7_DAYS',
    title: 'Regular',
    description: 'Juega 7 días seguidos.',
    icon: 'sword.png',
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
  {
    id: 'COMEBACK_STREAK',
    title: 'Comeback Kid',
    description: 'Consigue 10 correctas seguidas después de 3 fallos.',
    icon: 'wizard.png', // Temporal
    condition: (stats) => false, // Requiere lógica especial
  },

  // === LOGROS DE VELOCIDAD ===
  {
    id: 'SPEED_DEMON',
    title: 'Rayo Veloz',
    description: 'Responde correctamente en menos de 3 segundos (10 veces).',
    icon: 'eagle eye.png', // Temporal para lightning
    condition: (stats) => false, // Requiere tracking de tiempo
  },
  {
    id: 'TIMED_HIGH_SCORE',
    title: 'Reflexos Ninja',
    description: 'Completa una partida contrarreloj con 30+ puntos.',
    icon: 'sword.png', // Temporal para ninja
    condition: (stats) => false, // Requiere datos de partidas timed
  },
  {
    id: 'TIMED_WINS_5',
    title: 'Máquina del Tiempo',
    description: 'Gana 5 partidas contrarreloj.',
    icon: 'morning.png', // Temporal para hourglass
    condition: (stats) => stats.timedGamesPlayed >= 5,
  },

  // === LOGROS COMPETITIVOS ===
  {
    id: 'VS_FIRST_WIN',
    title: 'Primera Victoria',
    description: 'Gana tu primera partida VS.',
    icon: 'newbie.png', // Temporal para medal_bronze
    condition: (stats) => stats.vsGamesWon >= 1,
  },
  {
    id: 'VS_WINS_10',
    title: 'Campeón',
    description: 'Gana 10 partidas VS.',
    icon: 'anniversary.png', // Temporal para medal_gold
    condition: (stats) => stats.vsGamesWon >= 10,
  },
  {
    id: 'VS_STREAK_5',
    title: 'Invencible',
    description: 'Gana 5 partidas VS seguidas.',
    icon: 'god.png', // Temporal para champion
    condition: (stats) => stats.bestWinStreak >= 5,
  },

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

  // === LOGROS DE ESPECIALIZACIÓN ===
  {
    id: 'POLYGLOT',
    title: 'Políglota',
    description: 'Juega en 2 idiomas diferentes.',
    icon: 'world.png',
    condition: (stats) => false, // Requiere tracking de idiomas
  },
  {
    id: 'COLLECTOR_5_PACKS',
    title: 'Coleccionista',
    description: 'Desbloquea 5 packs de preguntas.',
    icon: 'anniversary.png', // Temporal para chest
    condition: (stats) => false, // Requiere datos de packs
  },
  {
    id: 'EXPLORER_ALL_CATEGORIES',
    title: 'Explorador',
    description: 'Juega todas las categorías base.',
    icon: 'world.png',
    condition: (stats) => {
      const cats = stats.correctByCategory || {};
      return cats.movies > 0 && cats.geography > 0 && cats.history > 0 && 
             cats.science > 0 && cats.sports > 0;
    },
  },

  // === LOGROS SOCIALES ===
  {
    id: 'FIRST_FRIEND',
    title: 'Sociable',
    description: 'Agrega tu primer amigo.',
    icon: 'anniversary.png', // Temporal
    condition: (stats) => false, // Requiere sistema de amigos
  },
  {
    id: 'FRIENDS_10',
    title: 'Popular',
    description: 'Ten 10 amigos en tu lista.',
    icon: 'wizard.png', // Temporal
    condition: (stats) => false, // Requiere sistema de amigos
  },

  // === LOGROS ESPECIALES ===
  {
    id: 'NIGHT_PLAYER',
    title: 'Búho Sabio',
    description: 'Juega 10 partidas entre las 10 PM y 2 AM.',
    icon: 'night.png',
    condition: (stats) => false, // Requiere tracking especial
  },
  {
    id: 'WEEKEND_WARRIOR',
    title: 'Guerrero de Fin de Semana',
    description: 'Juega 20 partidas en fin de semana.',
    icon: 'sword.png',
    condition: (stats) => false, // Requiere tracking de días
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