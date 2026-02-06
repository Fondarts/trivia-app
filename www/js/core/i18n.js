// js/i18n.js - Sistema de internacionalización

const translations = {
  es: {
    // Header
    appTitle: 'Bible Trivia',
    store: 'Tienda',
    
    
    // Mode indicators
    modeSoloFull: 'Pon a prueba tus conocimientos',
    modeSopaFull: 'Sopa de letras',
    modeSopa: 'SOPA',
    selectMode: 'Selecciona un modo',
    
    // Friends System
    
    // Config Card
    yourName: 'Tu nombre',
    yourNamePlaceholder: 'Tu nombre',
    mode: 'Modo',
    modeSolo: 'TEST',
    modeSopa: 'SOPA',
    questionsCount: 'Cantidad de preguntas',
    time: 'Tiempo',
    difficulty: 'Dificultad',
    difficultyAny: 'Cualquiera',
    difficultyEasy: 'Principiante',
    difficultyMedium: 'Intermedio',
    difficultyHard: 'Experto',
    category: 'Categoría',
    categoryAll: 'Todas las categorías',
    book: 'Libro',
    bookAll: 'Todos los libros',
    start: 'EMPEZAR',
    create: 'CREAR',
    join: 'UNIRSE',
    
    // Navigation
    statistics: 'Estadísticas',
    statisticsAndAchievements: 'Estadísticas y Logros',
    
    // Game
    question: 'Pregunta',
    next: 'Siguiente',
    exit: 'Salir',
    pts: 'pts',
    reportQuestion: 'Reportar',
    reportQuestionTooltip: '¿Hay algún problema con esta pregunta?',
    
    // Sopa de letras
    wsDescription: 'Encuentra palabras bíblicas ocultas en la sopa de letras. Arrastra el cursor o toca las letras para seleccionar palabras en cualquier dirección: horizontal, vertical o diagonal.',
    wsFindWords: 'Encontrar palabras',
    wsHint: 'Hint',
    wsCongratulations: '¡Felicitaciones!',
    wsAllFound: 'Encontraste todas las palabras.',
    wsPlayAgain: 'Jugar de nuevo',
    wsNextVerse: 'Siguiente versículo',
    
    // Estudio de la Biblia
    modeBibleFull: 'Estudio de la Biblia',
    modeBible: 'BIBLIA',
    bibleSelectBook: 'Libro de la Biblia',
    bibleSelectBookPlaceholder: 'Selecciona un libro',
    bibleSelectBookToRead: 'Selecciona un libro para leer.',
    bibleChapter: 'Capítulo',
    bibleNotAvailableOffline: 'Este libro no está disponible para lectura offline. Puedes leerlo en línea.',
    bibleSaveVerses: 'Guardar versículo(s)',
    bibleAddNote: 'Añadir nota',
    bibleShareVerses: 'Compartir versículo(s)',
    bibleVerseCopied: 'Copiado al portapapeles',
    bibleVerseShared: 'Compartido',
    bibleMyPassagesNotes: 'Mis versículos y notas',
    bibleTabPassages: 'Subrayados',
    bibleTabNotes: 'Notas',
    bibleSelectVerses: 'Selecciona uno o más versículos y pulsa Guardar.',
    bibleNotePlaceholder: 'Escribe tu nota aquí...',
    bibleNoteSave: 'Guardar nota',
    bibleNoteTextLabel: 'Texto de la nota',
    bibleVersesSaved: 'Versículo(s) guardado(s)',
    bibleNoteSaved: 'Nota guardada',
    bibleNoVerses: 'Aún no has guardado ningún versículo.',
    bibleSelectAtLeastOne: 'Selecciona al menos un versículo.',
    bibleHighlight: 'Resaltar',
    bibleNoNotes: 'Aún no tienes notas.',
    bibleDelete: 'Eliminar',
    cancel: 'Cancelar',
    
    // Profile
    yourProfile: 'Tu Perfil',
    level: 'Nivel',
    statsAndAchievements: 'Estadísticas',
    purchases: 'Compras',
    purchasesEmpty: 'Aquí aparecerán los packs que compres.',
    plan: 'Plan',
    planFree: 'Plan gratuito',
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
    totalTime: 'Tiempo Total',
    totalTimeDetail: 'Tiempo jugando',
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
    promiseDesc: 'Alcanza el nivel 5.',
    veteranLevelDesc: 'Alcanza el nivel 25.',
    eliteDesc: 'Alcanza el nivel 50.',
    legendaryLevelDesc: 'Alcanza el nivel 100.',
    polyglotDesc: 'Juega en 2 idiomas diferentes.',
    collectorDesc: 'Desbloquea 5 packs de preguntas.',
    explorerDesc: 'Juega todas las categorías base.',
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
    congratulations: '¡Felicitaciones!',
    playAgain: 'Jugar de nuevo',
    home: 'Inicio',
    
    
    // Alerts & Toasts
    selectCategory: 'Elegí una categoría',
    confirmExit: '¿Seguro que querés salir de la partida?',
    levelUp: '🎉 ¡Subiste de Nivel! 🎉',
    achievementUnlocked: '🏆 ¡Logro desbloqueado:',
    
    
    // Base
    base: 'Base'
  },
  
  en: {
    // Header
    appTitle: 'Bible Trivia',
    store: 'Store',
    
    
    // Mode indicators
    modeSoloFull: 'Test your knowledge',
    modeSopaFull: 'Word search',
    modeSopa: 'WORD',
    selectMode: 'Select a mode',
    
    // Friends System
    
    // Config Card
    yourName: 'Your name',
    yourNamePlaceholder: 'Your name',
    mode: 'Mode',
    modeSolo: 'TEST',
    modeSopa: 'WORD',
    questionsCount: 'Number of questions',
    time: 'Time',
    difficulty: 'Difficulty',
    difficultyAny: 'Any',
    difficultyEasy: 'Beginner',
    difficultyMedium: 'Intermediate',
    difficultyHard: 'Expert',
    category: 'Category',
    categoryAll: 'All categories',
    book: 'Book',
    bookAll: 'All books',
    start: 'START',
    create: 'CREATE',
    join: 'JOIN',
    room: 'Room',
    share: 'Share',
    cancelSearch: 'Cancel Search',
    backToManual: 'Manual Code',
    waitingFor: 'Waiting for',
    opponentRandom: 'Random',
    opponentRandomAsync: 'Random Offline',
    opponentFriend: 'Friend',
    
    // Navigation
    statistics: 'Statistics',
    statisticsAndAchievements: 'Statistics & Achievements',
    
    // Game
    question: 'Question',
    next: 'Next',
    exit: 'Exit',
    pts: 'pts',
    reportQuestion: 'Report',
    reportQuestionTooltip: 'Is there a problem with this question?',
    
    // Word search
    wsDescription: 'Find hidden biblical words in the word search. Drag the cursor or tap letters to select words in any direction: horizontal, vertical, or diagonal.',
    wsFindWords: 'Find words',
    wsHint: 'Hint',
    wsCongratulations: 'Congratulations!',
    wsAllFound: 'You found all the words.',
    wsPlayAgain: 'Play again',
    wsNextVerse: 'Next verse',
    
    // Bible Study
    modeBibleFull: 'Bible Study',
    modeBible: 'BIBLE',
    bibleSelectBook: 'Bible book',
    bibleSelectBookPlaceholder: 'Select a book',
    bibleSelectBookToRead: 'Select a book to read.',
    bibleChapter: 'Chapter',
    bibleNotAvailableOffline: 'This book is not available for offline reading. You can read it online.',
    bibleSaveVerses: 'Save verse(s)',
    bibleAddNote: 'Add note',
    bibleShareVerses: 'Share verse(s)',
    bibleVerseCopied: 'Copied to clipboard',
    bibleVerseShared: 'Shared',
    bibleMyPassagesNotes: 'My verses & notes',
    bibleTabPassages: 'Highlights',
    bibleTabNotes: 'Notes',
    bibleSelectVerses: 'Select one or more verses and press Save.',
    bibleNotePlaceholder: 'Write your note here...',
    bibleNoteSave: 'Save note',
    bibleNoteTextLabel: 'Note text',
    bibleVersesSaved: 'Verse(s) saved',
    bibleNoteSaved: 'Note saved',
    bibleNoVerses: 'You have not saved any verses yet.',
    bibleSelectAtLeastOne: 'Select at least one verse.',
    bibleHighlight: 'Highlight',
    bibleNoNotes: 'You have no notes yet.',
    bibleDelete: 'Delete',
    cancel: 'Cancel',
    
    // Profile
    yourProfile: 'Your Profile',
    level: 'Level',
    statsAndAchievements: 'Statistics',
    purchases: 'Purchases',
    purchasesEmpty: 'Your purchased packs will appear here.',
    plan: 'Plan',
    planFree: 'Free plan',
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
    totalTime: 'Total Time',
    totalTimeDetail: 'Time playing',
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
    promiseDesc: 'Reach level 5.',
    veteranLevelDesc: 'Reach level 25.',
    eliteDesc: 'Reach level 50.',
    legendaryLevelDesc: 'Reach level 100.',
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
    novice: 'Novice',
    promising: 'Promising',
    elite: 'Elite',
    legendary: 'Legendary',
    addict: 'Addicted',
    
    // Results
    results: 'Results',
    perfect: 'Perfect!',
    noErrors: 'No errors!',
    veryGood: 'Very good!',
    greatGame: 'Great game!',
    dontGiveUp: "Don't give up!",
    nextBetter: 'Next one will be better.',
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
    
    
    // Alerts & Toasts
    selectCategory: 'Please select a category',
    confirmExit: 'Are you sure you want to exit the game?',
    levelUp: '🎉 Level Up! 🎉',
    achievementUnlocked: '🏆 Achievement unlocked:',
    
    // Store
    
    // Base
    base: 'Base'
  }
};

let currentLang = 'en';

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
  return translations[currentLang][key] || translations['en'][key] || key;
}

export function initI18n() {
  // Cargar idioma guardado
  const savedLang = localStorage.getItem('trivia_lang') || 'en';
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
  // Actualizar elementos con atributo data-i18n-title (para tooltips)
  document.querySelectorAll('[data-i18n-title]').forEach(element => {
    const key = element.getAttribute('data-i18n-title');
    if (key) element.setAttribute('title', t(key));
  });
}

export default { t, setLanguage, getLanguage, initI18n, updateUI };
