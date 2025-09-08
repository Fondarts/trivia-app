// js/i18n.js - Sistema de internacionalización

const translations = {
  es: {
    // Header
    appTitle: 'Quizle!',
    
    // Config Card
    yourName: 'Tu nombre',
    yourNamePlaceholder: 'Tu nombre',
    mode: 'Modo',
    modeSolo: 'SOLO',
    modeTimed: 'CONTRARRELOJ',
    modeVS: 'VS',
    modeAdventure: 'AVENTURA',
    questionsCount: 'Cantidad de preguntas',
    time: 'Tiempo',
    difficulty: 'Dificultad',
    difficultyAny: 'Cualquiera',
    difficultyEasy: 'Fácil',
    difficultyMedium: 'Medio',
    difficultyHard: 'Difícil',
    category: 'Categoría',
    categoryAll: 'Todas las categorías',
    start: 'EMPEZAR',
    create: 'CREAR',
    join: 'UNIRSE',
    createRoom: 'Crear sala',
    joinRoom: 'Unirse',
    roomCode: 'Código de sala',
    room: 'Sala',
    share: 'Compartir',
    
    // Navigation
    leaderboards: 'Leaderboards',
    statistics: 'Estadísticas',
    
    // Game
    question: 'Pregunta',
    next: 'Siguiente',
    exit: 'Salir',
    pts: 'pts',
    
    // Profile
    yourProfile: 'Tu Perfil',
    level: 'Nivel',
    statsAndAchievements: 'Estadísticas y Logros',
    purchases: 'Compras',
    purchasesEmpty: 'Aquí aparecerán los packs que compres.',
    plan: 'Plan',
    planFree: 'Actualmente usas el plan Gratuito. ¡Pronto podrás quitar la publicidad!',
    settings: 'Ajustes',
    theme: 'Tema',
    themeDark: 'Dark',
    themeLight: 'Claro',
    sounds: 'Sonidos',
    soundsActivate: 'Activar',
    autoAdvance: 'Auto Avance',
    language: 'Idioma',
    spanish: 'Español',
    english: 'English',
    
    // Stats
    yourNumbers: 'Tus Números',
    correctQuestions: 'Preguntas Correctas',
    generalAccuracy: 'Precisión General',
    bestWinStreak: 'Mejor Racha de Victorias',
    vsGamesWon: 'Partidas VS Ganadas',
    achievements: 'Logros',
    
    // Results
    results: 'Resultados',
    perfect: '¡Perfecto!',
    noErrors: '¡Ningún error!',
    veryGood: '¡Muy bien!',
    greatGame: '¡Gran partida!',
    dontGiveUp: '¡No te rindas!',
    nextBetter: 'La próxima será mejor.',
    timeUp: '¡Se acabó el tiempo!',
    goodTry: '¡Buen intento!',
    congratulations: '¡Felicitaciones!',
    youWon: 'Le ganaste a',
    youLost: 'Perdiste',
    against: 'Contra',
    betterNext: 'Te irá mejor la próxima.',
    maybe: '(quizás)',
    tie: '¡Empate!',
    goodDuel: 'Buen duelo con',
    playAgain: 'Jugar de nuevo',
    rematch: 'Revancha',
    home: 'Inicio',
    
    // Categories
    movies: 'Películas y series',
    geography: 'Geografía',
    history: 'Historia',
    science: 'Ciencia',
    sports: 'Deporte',
    culture: 'Cultura',
    anime: 'Anime y Manga',
    
    // Alerts
    selectCategory: 'Elegí una categoría',
    confirmExit: '¿Seguro que querés salir de la partida?',
    opponentLeft: 'Tu rival abandonó la partida.',
    enterCode: 'Ingresá un código',
    
    // Store
    packStore: 'Tienda de packs',
    available: 'Disponibles',
    installed: 'Instalado',
    get: 'Obtener',
    free: 'Gratis (dev)',
    packInstalled: 'Pack instalado',
    errorInstalling: 'Error instalando pack',
    
    // Base
    base: 'Base'
  },
  
  en: {
    // Header
    appTitle: 'Quizle!',
    
    // Config Card
    yourName: 'Your name',
    yourNamePlaceholder: 'Your name',
    mode: 'Mode',
    modeSolo: 'SOLO',
    modeTimed: 'TIMED',
    modeVS: 'VS',
    modeAdventure: 'ADVENTURE',
    questionsCount: 'Number of questions',
    time: 'Time',
    difficulty: 'Difficulty',
    difficultyAny: 'Any',
    difficultyEasy: 'Easy',
    difficultyMedium: 'Medium',
    difficultyHard: 'Hard',
    category: 'Category',
    categoryAll: 'All categories',
    start: 'START',
    create: 'CREATE',
    join: 'JOIN',
    createRoom: 'Create room',
    joinRoom: 'Join',
    roomCode: 'Room code',
    room: 'Room',
    share: 'Share',
    
    // Navigation
    leaderboards: 'Leaderboards',
    statistics: 'Statistics',
    
    // Game
    question: 'Question',
    next: 'Next',
    exit: 'Exit',
    pts: 'pts',
    
    // Profile
    yourProfile: 'Your Profile',
    level: 'Level',
    statsAndAchievements: 'Stats & Achievements',
    purchases: 'Purchases',
    purchasesEmpty: 'Your purchased packs will appear here.',
    plan: 'Plan',
    planFree: 'You are currently using the Free plan. Ad removal coming soon!',
    settings: 'Settings',
    theme: 'Theme',
    themeDark: 'Dark',
    themeLight: 'Light',
    sounds: 'Sounds',
    soundsActivate: 'Enable',
    autoAdvance: 'Auto Advance',
    language: 'Language',
    spanish: 'Español',
    english: 'English',
    
    // Stats
    yourNumbers: 'Your Stats',
    correctQuestions: 'Correct Questions',
    generalAccuracy: 'Overall Accuracy',
    bestWinStreak: 'Best Win Streak',
    vsGamesWon: 'VS Games Won',
    achievements: 'Achievements',
    
    // Results
    results: 'Results',
    perfect: 'Perfect!',
    noErrors: 'No errors!',
    veryGood: 'Very good!',
    greatGame: 'Great game!',
    dontGiveUp: "Don't give up!",
    nextBetter: 'Next one will be better.',
    timeUp: "Time's up!",
    goodTry: 'Good try!',
    congratulations: 'Congratulations!',
    youWon: 'You beat',
    youLost: 'You lost',
    against: 'Against',
    betterNext: "You'll do better next time.",
    maybe: '(maybe)',
    tie: 'Tie!',
    goodDuel: 'Good match with',
    playAgain: 'Play again',
    rematch: 'Rematch',
    home: 'Home',
    
    // Categories
    movies: 'Movies & TV Shows',
    geography: 'Geography',
    history: 'History',
    science: 'Science',
    sports: 'Sports',
    culture: 'Culture',
    anime: 'Anime & Manga',
    
    // Alerts
    selectCategory: 'Please select a category',
    confirmExit: 'Are you sure you want to exit the game?',
    opponentLeft: 'Your opponent left the game.',
    enterCode: 'Please enter a code',
    
    // Store
    packStore: 'Pack Store',
    available: 'Available',
    installed: 'Installed',
    get: 'Get',
    free: 'Free (dev)',
    packInstalled: 'Pack installed',
    errorInstalling: 'Error installing pack',
    
    // Base
    base: 'Base'
  }
};

let currentLang = 'es';

export function setLanguage(lang) {
  if (translations[lang]) {
    currentLang = lang;
    localStorage.setItem('trivia_lang', lang);
    document.documentElement.setAttribute('data-lang', lang);
    updateUI();
  }
}

export function getLanguage() {
  return currentLang;
}

export function t(key) {
  return translations[currentLang][key] || translations['es'][key] || key;
}

export function initI18n() {
  // Cargar idioma guardado
  const savedLang = localStorage.getItem('trivia_lang') || 'es';
  currentLang = savedLang;
  document.documentElement.setAttribute('data-lang', savedLang);
}

// Actualizar todos los elementos de la UI con data-i18n
export function updateUI() {
  // Actualizar elementos con atributo data-i18n
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.getAttribute('data-i18n');
    if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
      element.placeholder = t(key);
    } else {
      element.textContent = t(key);
    }
  });
  
  // Actualizar elementos con atributo data-i18n-placeholder
  document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
    const key = element.getAttribute('data-i18n-placeholder');
    element.placeholder = t(key);
  });
}

export default { t, setLanguage, getLanguage, initI18n, updateUI };
