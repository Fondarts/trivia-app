// js/i18n.js - Sistema de internacionalización

const translations = {
  es: {
    // Header
    appTitle: 'Quizlo!',
    friends: 'Amigos',
    store: 'Tienda',
    
    // Auth
    login: 'Iniciar Sesión',
    loginRegister: 'Iniciar Sesión / Registrarse',
    logout: 'Cerrar Sesión',
    welcomeMessage: '🎮 crea tu cuenta para llevar tu progreso a todos lados',
    welcomeToQuizle: '🎮 ¡Bienvenido a Quizlo!',
    configureNickname: 'Configura tu nickname en tu perfil para empezar a jugar',
    loginWithGoogle: 'Continuar con Google',
    loginToSaveProgress: 'Inicia sesión con Google para guardar tu progreso, competir con amigos y desbloquear logros.',
    loggingIn: 'Iniciando sesión...',
    loginError: 'Error al iniciar sesión. Por favor, intenta de nuevo.',
    
    // Nickname Modal
    chooseNickname: 'Elige tu Nickname',
    nicknameDescription: 'Este será tu nombre único en el juego. No podrás cambiarlo después.',
    nicknameRules: 'Entre 3 y 20 caracteres, solo letras, números y guiones bajos',
    nicknameAvailable: '✓ Disponible',
    nicknameTaken: '✗ Ya está en uso',
    checking: 'Verificando...',
    confirmNickname: 'Confirmar Nickname',
    saving: 'Guardando...',
    
    // Mode indicators
    modeSoloFull: 'Modo Solo',
    modeSopaFull: 'Sopa de letras',
    modeSopa: 'SOPA',
    selectMode: 'Selecciona un modo',
    
    // Friends System
    friendsSystem: 'Sistema de Amigos',
    comingSoon: '¡Próximamente!',
    friendsInDevelopment: 'El sistema de amigos está en desarrollo.',
    soonYouCan: 'Pronto podrás:',
    addFriendsByNickname: '✨ Agregar amigos por nickname',
    challengeLive: '⚔️ Desafiar a partidas en vivo',
    viewRankings: '🏆 Ver rankings entre amigos',
    compareStats: '📊 Comparar estadísticas',
    send24hChallenges: '🎯 Enviar desafíos de 24 horas',
    joinCommunity: '¡Únete a la comunidad!',
    loginToUnlock: 'Inicia sesión para desbloquear el sistema de amigos y competir con otros jugadores.',
    loginForFriends: 'Inicia sesión para acceder al sistema de amigos',
    
    // Config Card
    yourName: 'Tu nombre',
    yourNamePlaceholder: 'Tu nombre',
    mode: 'Modo',
    modeSolo: 'SOLO',
    modeSopa: 'SOPA',
    modeVS: 'VS',
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
    
    // Leaderboards
    global: 'Global',
    friends: 'Amigos',
    local: 'Local',
    player: 'Jugador',
    level: 'Nivel',
    totalXP: 'XP Total',
    
    // Navigation
    leaderboards: 'Leaderboards',
    statistics: 'Estadísticas',
    statisticsAndAchievements: 'Estadísticas y Logros',
    
    // Game
    question: 'Pregunta',
    next: 'Siguiente',
    exit: 'Salir',
    pts: 'pts',
    
    // Sopa de letras
    wsFindWords: 'Encontrar palabras',
    wsCongratulations: '¡Felicitaciones!',
    wsAllFound: 'Encontraste todas las palabras.',
    wsPlayAgain: 'Jugar de nuevo',
    
    // Estudio de la Biblia
    modeBibleFull: 'Estudio de la Biblia',
    modeBible: 'BIBLIA',
    bibleSelectBook: 'Libro de la Biblia',
    bibleSelectBookPlaceholder: 'Selecciona un libro',
    bibleSelectBookToRead: 'Selecciona un libro para leer.',
    bibleChapter: 'Capítulo',
    bibleNotAvailableOffline: 'Este libro no está disponible para lectura offline. Puedes leerlo en línea.',
    biblePdfSelect: 'Leer PDF',
    biblePdfOpen: 'Abrir PDF',
    
    // Profile
    yourProfile: 'Tu Perfil',
    level: 'Nivel',
    statsAndAchievements: 'Estadísticas',
    purchases: 'Compras',
    purchasesEmpty: 'Aquí aparecerán los packs que compres.',
    plan: 'Plan',
    planFree: 'Actualmente usas el plan Gratuito. ¡Pronto podrás quitar la publicidad!',
    settings: 'Ajustes',
    sounds: 'Sonidos',
    soundsActivate: 'Activar',
    autoAdvance: 'Auto Avance',
    groupByCategory: 'Agrupar por Categoría',
    language: 'Idioma',
    spanish: 'Español',
    english: 'English',
    
    // Stats
    yourNumbers: 'Tus Números',
    gamesPlayed: 'Partidas Jugadas',
    correctQuestions: 'Preguntas Correctas',
    precision: 'Precisión',
    correctAnswers: 'correctas',
    generalAccuracy: 'Precisión General',
    bestStreak: 'Mejor Racha',
    consecutiveAnswers: 'Respuestas seguidas',
    bestWinStreak: 'Mejor Racha de Victorias',
    currentLevel: 'Nivel Actual',
    totalGames: 'Partidas Totales',
    soloGames: 'solo',
    perfectGames: 'Partidas Perfectas',
    withoutErrors: 'Sin fallar ninguna',
    daysInRow: 'Días Seguidos',
    playingDaily: 'Jugando diariamente',
    statsByCategory: 'Estadísticas por Categoría',
    achievements: 'Logros',
    
    // Achievement descriptions
    sharpshooterDesc: 'Consigue 10 respuestas correctas seguidas.',
    eagleEyeDesc: 'Consigue 25 respuestas correctas seguidas.',
    perfectionistDesc: 'Completa una partida de 15+ preguntas sin fallar.',
    cinephileDesc: '50 respuestas correctas en Películas.',
    geographerDesc: '50 respuestas correctas en Geografía.',
    historianDesc: '50 respuestas correctas en Historia.',
    scientistDesc: '50 respuestas correctas en Ciencia.',
    athleteDesc: '50 respuestas correctas en Deportes.',
    knowItAllDesc: '100 respuestas correctas en CADA categoría.',
    beginnerDesc: 'Juega tu primera partida.',
    regularDesc: 'Juega 7 días seguidos.',
    veteranDesc: 'Juega 30 días seguidos.',
    legendDesc: 'Juega 100 partidas.',
    mythicDesc: 'Juega 500 partidas.',
    gamblerDesc: 'Juega temprano por la mañana.',
    nightOwlDesc: 'Juega tarde por la noche.',
    brilliantMindDesc: 'Responde 100 preguntas correctas en total.',
    knowledgeMasterDesc: 'Alcanza 95% de precisión con mínimo 50 preguntas.',
    withoutErrorsDesc: 'Completa 3 partidas perfectas.',
    unstoppableDesc: 'Consigue una racha de 50 respuestas correctas.',
    mvpDesc: 'Consigue una racha de 100 respuestas correctas.',
    comebackKidDesc: 'Consigue 10 correctas seguidas después de fallar 3.',
    speedsterDesc: 'Responde correctamente en menos de 3s (10 veces).',
    reflexNinjaDesc: 'Completa una partida contrarreloj con 30+ puntos.',
    timeRunnerDesc: 'Gana 5 partidas contrarreloj.',
    firstVictoryDesc: 'Gana tu primera partida.',
    championDesc: 'Gana 10 partidas.',
    invincibleDesc: 'Gana 5 partidas seguidas.',
    promiseDesc: 'Alcanza el nivel 5.',
    veteranLevelDesc: 'Alcanza el nivel 25.',
    eliteDesc: 'Alcanza el nivel 50.',
    legendaryLevelDesc: 'Alcanza el nivel 100.',
    polyglotDesc: 'Juega en 2 idiomas diferentes.',
    collectorDesc: 'Desbloquea 5 packs de preguntas.',
    explorerDesc: 'Juega todas las categorías base.',
    sociableDesc: 'Agrega tu primer amigo.',
    popularDesc: 'Ten 10 amigos en tu lista.',
    wiseOwlDesc: 'Juega 10 partidas entre las 10 PM y 2 AM.',
    weekendWarriorDesc: 'Juega 20 partidas en fin de semana.',
    healthyAddictDesc: 'Juega al menos una vez al día por 14 días.',
    monthlyMasterDesc: 'Juega todos los días de un mes.',
    millenaryDesc: 'Responde 1000 preguntas en total.',
    livingEncyclopediaDesc: 'Responde correctamente 500 preguntas.',
    godOfKnowledgeDesc: 'Desbloquea todos los demás logros.',
    
    // Achievements Names
    sharpshooter: 'Francotirador',
    eagleEye: 'Ojo de Águila',
    perfectionist: 'Perfeccionista',
    cinephile: 'Cinéfilo',
    geographer: 'Geógrafo',
    historian: 'Historiador',
    scientist: 'Científico',
    athlete: 'Deportista',
    knowItAll: 'Sabio',
    beginner: 'Principiante',
    regular: 'Regular',
    veteran: 'Veterano',
    legend: 'Leyenda',
    mythic: 'Mítico',
    gambler: 'Madrugador',
    nightOwl: 'Noctámbulo',
    brilliantMind: 'Mente Brillante',
    knowledgeMaster: 'Maestro del Conocimiento',
    withoutErrors: 'Sin Errores',
    unstoppable: 'Imparable',
    mvp: 'Leyenda Viviente',
    comebackKid: 'Comeback Kid',
    speedster: 'Rayo Veloz',
    reflexNinja: 'Reflejos Ninja',
    timeRunner: 'Máquina del Tiempo',
    firstVictory: 'Primera Victoria',
    novice: 'Novato',
    promising: 'Prometedor',
    elite: 'Elite',
    legendary: 'Leyenda',
    polyglot: 'Políglota',
    collector: 'Coleccionista',
    explorer: 'Explorador',
    sociable: 'Sociable',
    popular: 'Popular',
    wiseSage: 'Búho Sabio',
    fireWarrior: 'Guerrero de Fin de Semana',
    addict: 'Adicto',
    
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
    shareResult: 'Compartir',
    
    // Categories
    movies: 'Películas y series',
    geography: 'Geografía',
    history: 'Historia',
    science: 'Ciencia',
    sports: 'Deporte',
    culture: 'Cultura',
    anime: 'Anime y Manga',
    
    // Alerts & Toasts
    selectCategory: 'Elegí una categoría',
    confirmExit: '¿Seguro que querés salir de la partida?',
    opponentLeft: 'Tu rival abandonó la partida.',
    enterCode: 'Ingresá un código',
    levelUp: '🎉 ¡Subiste de Nivel! 🎉',
    achievementUnlocked: '🏆 ¡Logro desbloqueado:',
    
    // Store
    packStore: 'Tienda de packs',
    available: 'Disponibles',
    installed: 'Instalado',
    get: 'Obtener',
    free: 'Gratis (dev)',
    packInstalled: 'Pack instalado',
    errorInstalling: 'Error instalando pack',
    packsHint: 'Los packs instalados se suman al banco.',
    
    // Base
    base: 'Base'
  },
  
  en: {
    // Header
    appTitle: 'Quizlo!',
    friends: 'Friends',
    store: 'Store',
    
    // Auth
    login: 'Sign In',
    loginRegister: 'Sign In / Sign Up',
    logout: 'Log Out',
    welcomeMessage: '🎮 Create an account to take your progress everywhere',
    welcomeToQuizle: '🎮 Welcome to Quizle!',
    configureNickname: 'Set up your nickname in your profile to start playing',
    loginWithGoogle: 'Continue with Google',
    loginToSaveProgress: 'Sign in with Google to save your progress, compete with friends and unlock achievements.',
    loggingIn: 'Signing in...',
    loginError: 'Login error. Please try again.',
    
    // Nickname Modal
    chooseNickname: 'Choose your Nickname',
    nicknameDescription: 'This will be your unique name in the game. You cannot change it later.',
    nicknameRules: 'Between 3 and 20 characters, only letters, numbers and underscores',
    nicknameAvailable: '✓ Available',
    nicknameTaken: '✗ Already taken',
    checking: 'Checking...',
    confirmNickname: 'Confirm Nickname',
    saving: 'Saving...',
    
    // Mode indicators
    modeSoloFull: 'Solo Mode',
    modeSopaFull: 'Word search',
    modeSopa: 'WORD',
    selectMode: 'Select a mode',
    
    // Friends System
    friendsSystem: 'Friends System',
    comingSoon: 'Coming Soon!',
    friendsInDevelopment: 'The friends system is in development.',
    soonYouCan: 'Soon you will be able to:',
    addFriendsByNickname: '✨ Add friends by nickname',
    challengeLive: '⚔️ Challenge to live matches',
    viewRankings: '🏆 View friend rankings',
    compareStats: '📊 Compare statistics',
    send24hChallenges: '🎯 Send 24-hour challenges',
    joinCommunity: 'Join the community!',
    loginToUnlock: 'Sign in to unlock the friends system and compete with other players.',
    loginForFriends: 'Sign in to access the friends system',
    
    // Config Card
    yourName: 'Your name',
    yourNamePlaceholder: 'Your name',
    mode: 'Mode',
    modeSolo: 'SOLO',
    modeSopa: 'WORD',
    modeVS: 'VS',
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
    room: 'Room',
    share: 'Share',
    cancelSearch: 'Cancel Search',
    backToManual: 'Manual Code',
    waitingFor: 'Waiting for',
    configureGameAgainst: 'Configure game against',
    createGameAgainst: 'Create game against',
    opponentRandom: 'Random',
    opponentRandomAsync: 'Random Offline',
    opponentFriend: 'Friend',
    
    // Leaderboards
    global: 'Global',
    friends: 'Friends',
    local: 'Local',
    player: 'Player',
    level: 'Level',
    totalXP: 'Total XP',
    
    // Navigation
    leaderboards: 'Leaderboards',
    statistics: 'Statistics',
    statisticsAndAchievements: 'Statistics & Achievements',
    
    // Game
    question: 'Question',
    next: 'Next',
    exit: 'Exit',
    pts: 'pts',
    
    // Word search
    wsFindWords: 'Find words',
    wsCongratulations: 'Congratulations!',
    wsAllFound: 'You found all the words.',
    wsPlayAgain: 'Play again',
    
    // Bible Study
    modeBibleFull: 'Bible Study',
    modeBible: 'BIBLE',
    bibleSelectBook: 'Bible book',
    bibleSelectBookPlaceholder: 'Select a book',
    bibleSelectBookToRead: 'Select a book to read.',
    bibleChapter: 'Chapter',
    bibleNotAvailableOffline: 'This book is not available for offline reading. You can read it online.',
    biblePdfSelect: 'Read PDF',
    biblePdfOpen: 'Open PDF',
    
    // Profile
    yourProfile: 'Your Profile',
    level: 'Level',
    statsAndAchievements: 'Statistics',
    purchases: 'Purchases',
    purchasesEmpty: 'Your purchased packs will appear here.',
    plan: 'Plan',
    planFree: 'You are currently using the Free plan. Ad removal coming soon!',
    settings: 'Settings',
    sounds: 'Sounds',
    soundsActivate: 'Enable',
    autoAdvance: 'Auto Advance',
    groupByCategory: 'Group by Category',
    language: 'Language',
    spanish: 'Español',
    english: 'English',
    
    // Stats
    yourNumbers: 'Your Stats',
    gamesPlayed: 'Games Played',
    correctQuestions: 'Correct Questions',
    precision: 'Accuracy',
    correctAnswers: 'correct',
    generalAccuracy: 'Overall Accuracy',
    bestStreak: 'Best Streak',
    consecutiveAnswers: 'Consecutive answers',
    bestWinStreak: 'Best Win Streak',
    currentLevel: 'Current Level',
    totalGames: 'Total Games',
    soloGames: 'solo',
    perfectGames: 'Perfect Games',
    withoutErrors: 'Without any errors',
    daysInRow: 'Days in a Row',
    playingDaily: 'Playing daily',
    statsByCategory: 'Stats by Category',
    achievements: 'Achievements',

    // Achievement descriptions
    sharpshooterDesc: 'Get 10 correct answers in a row.',
    eagleEyeDesc: 'Get 25 correct answers in a row.',
    perfectionistDesc: 'Finish a 15+ question game without mistakes.',
    cinephileDesc: '50 correct answers in Movies.',
    geographerDesc: '50 correct answers in Geography.',
    historianDesc: '50 correct answers in History.',
    scientistDesc: '50 correct answers in Science.',
    athleteDesc: '50 correct answers in Sports.',
    knowItAllDesc: '100 correct answers in EACH category.',
    beginnerDesc: 'Play your first game.',
    regularDesc: 'Play for 7 consecutive days.',
    veteranDesc: 'Play for 30 consecutive days.',
    legendDesc: 'Play 100 games.',
    mythicDesc: 'Play 500 games.',
    gamblerDesc: 'Play early in the morning.',
    nightOwlDesc: 'Play late at night.',
    brilliantMindDesc: 'Answer 100 questions correctly in total.',
    knowledgeMasterDesc: 'Reach 95% accuracy with at least 50 questions.',
    withoutErrorsDesc: 'Finish 3 perfect games.',
    unstoppableDesc: 'Get a 50 correct answers streak.',
    mvpDesc: 'Get a 100 correct answers streak.',
    comebackKidDesc: 'Get 10 in a row after 3 mistakes.',
    speedsterDesc: 'Answer correctly under 3s (10 times).',
    reflexNinjaDesc: 'Finish a timed game with 30+ points.',
    timeRunnerDesc: 'Win 5 timed games.',
    firstVictoryDesc: 'Win your first match.',
    championDesc: 'Win 10 matches.',
    invincibleDesc: 'Win 5 matches in a row.',
    promiseDesc: 'Reach level 5.',
    veteranLevelDesc: 'Reach level 25.',
    eliteDesc: 'Reach level 50.',
    legendaryLevelDesc: 'Reach level 100.',
    polyglotDesc: 'Play in 2 different languages.',
    collectorDesc: 'Unlock 5 question packs.',
    explorerDesc: 'Play all base categories.',
    sociableDesc: 'Add your first friend.',
    popularDesc: 'Have 10 friends in your list.',
    wiseOwlDesc: 'Play 10 games between 10 PM and 2 AM.',
    weekendWarriorDesc: 'Play 20 games on weekends.',
    healthyAddictDesc: 'Play at least once a day for 14 days.',
    monthlyMasterDesc: 'Play every day in a month.',
    millenaryDesc: 'Answer 1000 questions in total.',
    livingEncyclopediaDesc: 'Answer 500 questions correctly.',
    godOfKnowledgeDesc: 'Unlock all other achievements.',
    
    // Achievements Names
    sharpshooter: 'Sharpshooter',
    eagleEye: 'Eagle Eye',
    perfectionist: 'Perfectionist',
    cinephile: 'Cinephile',
    geographer: 'Geographer',
    historian: 'Historian',
    scientist: 'Scientist',
    athlete: 'Athlete',
    knowItAll: 'Know-It-All',
    beginner: 'Beginner',
    regular: 'Regular',
    veteran: 'Veteran',
    legend: 'Legend',
    mythic: 'Mythic',
    gambler: 'Early Bird',
    nightOwl: 'Night Owl',
    brilliantMind: 'Brilliant Mind',
    knowledgeMaster: 'Knowledge Master',
    withoutErrors: 'Flawless',
    unstoppable: 'Unstoppable',
    mvp: 'Living Legend',
    comebackKid: 'Comeback Kid',
    speedster: 'Speed Demon',
    reflexNinja: 'Reflex Ninja',
    timeRunner: 'Time Machine',
    firstVictory: 'First Victory',
    novice: 'Novice',
    promising: 'Promising',
    elite: 'Elite',
    legendary: 'Legendary',
    polyglot: 'Polyglot',
    collector: 'Collector',
    explorer: 'Explorer',
    sociable: 'Sociable',
    popular: 'Popular',
    wiseSage: 'Wise Owl',
    fireWarrior: 'Weekend Warrior',
    addict: 'Addicted',
    
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
    shareResult: 'Share',
    
    // Categories
    movies: 'Movies & TV Shows',
    geography: 'Geography',
    history: 'History',
    science: 'Science',
    sports: 'Sports',
    culture: 'Culture',
    anime: 'Anime & Manga',
    
    // Alerts & Toasts
    selectCategory: 'Please select a category',
    confirmExit: 'Are you sure you want to exit the game?',
    opponentLeft: 'Your opponent left the game.',
    enterCode: 'Please enter a code',
    levelUp: '🎉 Level Up! 🎉',
    achievementUnlocked: '🏆 Achievement unlocked:',
    
    // Store
    packStore: 'Pack Store',
    available: 'Available',
    installed: 'Installed',
    get: 'Get',
    free: 'Free (dev)',
    packInstalled: 'Pack installed',
    errorInstalling: 'Error installing pack',
    packsHint: 'Installed packs are added to the bank.',
    
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
