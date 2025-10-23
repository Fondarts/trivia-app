// Archivo temporal para aplicar las traducciones faltantes

// Importar sistema de traducción
import { t } from './core/i18n.js';

// Función para actualizar el indicador de modo con traducciones
export function updateModeIndicatorWithTranslations() {
  const activeMode = document.querySelector('#modeSeg .seg.active');
  if (!activeMode) return;
  
  const modeName = activeMode.dataset.val;
  const modeKeys = {
    'rounds': 'modeSoloFull',
    'timed': 'modeTimedFull',
    'vs': 'modeVSFull',
    'adventure': 'modeAdventureFull'
  };
  
  // Buscar o crear el indicador
  let indicator = document.getElementById('selectedModeIndicator');
  if (!indicator) {
    // Crear el indicador si no existe
    indicator = document.createElement('div');
    indicator.id = 'selectedModeIndicator';
    indicator.style.cssText = `
      text-align: center;
      font-size: 16px;
      font-weight: 600;
      color: var(--accent);
      margin: 12px 0 8px;
      padding: 8px;
      background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(34, 211, 238, 0.1));
      border-radius: 8px;
      border: 1px solid var(--cardBorder);
    `;
    
    // Insertar después de los botones de modo
    const modeSection = document.querySelector('#modeSeg').parentElement;
    if (modeSection) {
      modeSection.appendChild(indicator);
    }
  }
  
  // Usar traducción
  indicator.textContent = t(modeKeys[modeName]) || t('selectMode');
  
  // Animar el cambio
  indicator.style.animation = 'fadeInScale 0.3s ease';
}

// Función para actualizar los nombres de los logros con traducciones
export function updateAchievementsWithTranslations() {
  // Mapeo de IDs de logros a keys de traducción
  const achievementNameKeys = {
    'ACCURACY_STREAK_10': 'sharpshooter',
    'ACCURACY_STREAK_25': 'eagleEye',
    'PERFECT_GAME': 'perfectionist',
    'KNOWLEDGE_MOVIES': 'cinephile',
    'KNOWLEDGE_GEOGRAPHY': 'geographer',
    'KNOWLEDGE_HISTORY': 'historian',
    'KNOWLEDGE_SCIENCE': 'scientist',
    'KNOWLEDGE_SPORTS': 'athlete',
    'KNOWLEDGE_SAGE': 'knowItAll',
    'DEDICATION_FIRST_GAME': 'beginner',
    'DEDICATION_7_DAYS': 'regular',
    'DEDICATION_30_DAYS': 'veteran',
    'DEDICATION_100_GAMES': 'legend',
    'DEDICATION_500_GAMES': 'mythic',
    'SPECIAL_EARLY_BIRD': 'gambler',
    'SPECIAL_NIGHT_OWL': 'nightOwl',
    'PRECISION_100_TOTAL': 'brilliantMind',
    'PRECISION_95_PERCENT': 'knowledgeMaster',
    'PERFECT_GAMES_3': 'withoutErrors',
    'STREAK_50': 'unstoppable',
    'STREAK_100': 'mvp',
    'COMEBACK_STREAK': 'comebackKid',
    'SPEED_DEMON': 'speedster',
    'TIMED_HIGH_SCORE': 'reflexNinja',
    'TIMED_WINS_5': 'timeRunner',
    'VS_FIRST_WIN': 'firstVictory',
    'VS_WINS_10': 'champion',
    'VS_STREAK_5': 'invincible',
    'LEVEL_5': 'novice',
    'LEVEL_25': 'veteran',
    'LEVEL_50': 'elite',
    'LEVEL_100': 'legendary',
    'POLYGLOT': 'polyglot',
    'COLLECTOR_5_PACKS': 'collector',
    'EXPLORER_ALL_CATEGORIES': 'explorer',
    'FIRST_FRIEND': 'sociable',
    'FRIENDS_10': 'popular',
    'NIGHT_PLAYER': 'wiseSage',
    'WEEKEND_WARRIOR': 'fireWarrior',
    'DAILY_PLAYER_14': 'healthyAddict',
    'MONTHLY_MASTER': 'monthlyMaster',
    'QUESTIONS_1000': 'millenary',
    'CORRECT_500': 'livingEncyclopedia',
    'ALL_ACHIEVEMENTS': 'godOfKnowledge'
  };
  
  const achievementDescKeys = {
    'ACCURACY_STREAK_10': 'sharpshooterDesc',
    'ACCURACY_STREAK_25': 'eagleEyeDesc',
    'PERFECT_GAME': 'perfectionistDesc',
    'KNOWLEDGE_MOVIES': 'cinephileDesc',
    'KNOWLEDGE_GEOGRAPHY': 'geographerDesc',
    'KNOWLEDGE_HISTORY': 'historianDesc',
    'KNOWLEDGE_SCIENCE': 'scientistDesc',
    'KNOWLEDGE_SPORTS': 'athleteDesc',
    'KNOWLEDGE_SAGE': 'knowItAllDesc',
    'DEDICATION_FIRST_GAME': 'beginnerDesc',
    'DEDICATION_7_DAYS': 'regularDesc',
    'DEDICATION_30_DAYS': 'veteranDesc',
    'DEDICATION_100_GAMES': 'legendDesc',
    'DEDICATION_500_GAMES': 'mythicDesc',
    'SPECIAL_EARLY_BIRD': 'gamblerDesc',
    'SPECIAL_NIGHT_OWL': 'nightOwlDesc',
    'PRECISION_100_TOTAL': 'brilliantMindDesc',
    'PRECISION_95_PERCENT': 'knowledgeMasterDesc',
    'PERFECT_GAMES_3': 'withoutErrorsDesc',
    'STREAK_50': 'unstoppableDesc',
    'STREAK_100': 'mvpDesc',
    'COMEBACK_STREAK': 'comebackKidDesc',
    'SPEED_DEMON': 'speedsterDesc',
    'TIMED_HIGH_SCORE': 'reflexNinjaDesc',
    'TIMED_WINS_5': 'timeRunnerDesc',
    'VS_FIRST_WIN': 'firstVictoryDesc',
    'VS_WINS_10': 'championDesc',
    'VS_STREAK_5': 'invincibleDesc',
    'LEVEL_5': 'promiseDesc',
    'LEVEL_25': 'veteranLevelDesc',
    'LEVEL_50': 'eliteDesc',
    'LEVEL_100': 'legendaryLevelDesc',
    'POLYGLOT': 'polyglotDesc',
    'COLLECTOR_5_PACKS': 'collectorDesc',
    'EXPLORER_ALL_CATEGORIES': 'explorerDesc',
    'FIRST_FRIEND': 'sociableDesc',
    'FRIENDS_10': 'popularDesc',
    'NIGHT_PLAYER': 'wiseOwlDesc',
    'WEEKEND_WARRIOR': 'weekendWarriorDesc',
    'DAILY_PLAYER_14': 'healthyAddictDesc',
    'MONTHLY_MASTER': 'monthlyMasterDesc',
    'QUESTIONS_1000': 'millenaryDesc',
    'CORRECT_500': 'livingEncyclopediaDesc',
    'ALL_ACHIEVEMENTS': 'godOfKnowledgeDesc'
  };
  
  // Buscar todos los elementos de logros y actualizarlos
  document.querySelectorAll('[data-achievement-id]').forEach(element => {
    const achievementId = element.getAttribute('data-achievement-id');
    
    // Actualizar título
    const titleElement = element.querySelector('.achievement-title');
    if (titleElement && achievementNameKeys[achievementId]) {
      titleElement.textContent = t(achievementNameKeys[achievementId]);
    }
    
    // Actualizar descripción
    const descElement = element.querySelector('.achievement-desc');
    if (descElement && achievementDescKeys[achievementId]) {
      descElement.textContent = t(achievementDescKeys[achievementId]);
    }
  });
}

// Función para traducir el panel de estadísticas
export function translateStatsPanel() {
  // Traducir encabezados
  const statsTitle = document.querySelector('#fsStats h3');
  if (statsTitle && statsTitle.textContent.includes('Tus Números')) {
    statsTitle.textContent = t('yourNumbers');
  }
  
  // Traducir labels de estadísticas
  const statLabels = {
    'PRECISIÓN': 'precision',
    'MEJOR RACHA': 'bestStreak',
    'NIVEL ACTUAL': 'currentLevel',
    'PARTIDAS TOTALES': 'totalGames',
    'PARTIDAS PERFECTAS': 'perfectGames',
    'DÍAS SEGUIDOS': 'daysInRow'
  };
  
  document.querySelectorAll('.stat-label').forEach(label => {
    const text = label.textContent.trim().toUpperCase();
    if (statLabels[text]) {
      label.textContent = t(statLabels[text]);
    }
  });
  
  // Traducir descripciones
  const statDescs = {
    'correctas': 'correctAnswers',
    'Respuestas seguidas': 'consecutiveAnswers',
    'Sin fallar ninguna': 'withoutErrors',
    'Jugando diariamente': 'playingDaily'
  };
  
  document.querySelectorAll('.stat-desc').forEach(desc => {
    const text = desc.textContent.trim();
    if (statDescs[text]) {
      desc.textContent = t(statDescs[text]);
    }
  });
}

// Exportar función principal para actualizar todas las traducciones
export function applyMissingTranslations() {
  updateModeIndicatorWithTranslations();
  updateAchievementsWithTranslations();
  translateStatsPanel();
  
  // Títulos de ventanas completas
  const fsStatsTitle = document.querySelector('#fsStats .fs-titlebar-title');
  if (fsStatsTitle) fsStatsTitle.textContent = t('statisticsAndAchievements');
  const fsLBTitle = document.querySelector('#fsLB .fs-titlebar-title');
  if (fsLBTitle) fsLBTitle.textContent = t('leaderboards');

  // Encabezados dentro de fsStats
  const firstH3 = document.querySelector('#fsStats h3');
  if (firstH3) firstH3.textContent = t('yourNumbers');
  const achH3 = document.querySelector('#fsStats h3 + div + hr + h3') || document.querySelector('#fsStats h3:nth-of-type(2)');
  if (achH3) achH3.textContent = t('achievements');

  // Botones/menus
  const friendsBtn = document.getElementById('btnFriends');
  if (friendsBtn) friendsBtn.title = t('friendsSystem');
  const dlcBtn = document.getElementById('btnDLC');
  if (dlcBtn) dlcBtn.title = t('packStore');

  // Panel de tienda si está abierto
  const dlcPanel = document.querySelector('.dlc-panel');
  if (dlcPanel) {
    const title = dlcPanel.querySelector('.dlc-title');
    if (title) title.textContent = t('available');
    const small = dlcPanel.querySelector('.dlc-small');
    if (small) small.textContent = t('packsHint');
    dlcPanel.setAttribute('aria-label', t('packStore'));
    // Botones de precio/estado
    dlcPanel.querySelectorAll('.dlc-small.dlc-price').forEach(el=>{
      if (/Instalado/i.test(el.textContent)) el.textContent = t('installed');
      if (/Gratis/i.test(el.textContent)) el.textContent = t('free');
    });
    dlcPanel.querySelectorAll('.dlc-btn').forEach(btn=>{
      if (/Instalado/i.test(btn.textContent)) btn.textContent = t('installed');
      if (/Obtener|Get/i.test(btn.textContent)) btn.textContent = t('get');
    });
  }

  // Panel amigos simple si existe
  const friendsPanel = document.getElementById('simpleFriendsPanel');
  if (friendsPanel) {
    const h3 = friendsPanel.querySelector('h3');
    if (h3) h3.textContent = t('friendsSystem');
    const pList = friendsPanel.querySelectorAll('#notificationsContent p');
    if (pList[0]) pList[0].textContent = t('friendsInDevelopment');
    if (pList[1]) {
      pList[1].innerHTML = `${t('soonYouCan')}<br>${t('addFriendsByNickname')}<br>${t('challengeLive')}<br>${t('viewRankings')}`;
    }
  }
  
  // También actualizar cuando cambie el modo
  document.querySelectorAll('#modeSeg .seg').forEach(seg => {
    seg.addEventListener('click', () => {
      setTimeout(updateModeIndicatorWithTranslations, 50);
    });
  });
}
