// js/game/ui_stats_translated.js - Función de estadísticas con traducciones

import { t } from '../core/i18n.js';
import { getStats, getUnlockedAchievements } from '../player/stats.js';
import { ACHIEVEMENTS_LIST } from '../player/achievements.js';

export function renderStatsPageTranslated() {
    const stats = getStats();
    const unlocked = getUnlockedAchievements();
    const statsContainer = document.getElementById('statsContainer');
    const achievementsContainer = document.getElementById('achievementsContainer');
    if (!statsContainer || !achievementsContainer) return;
    
    const accuracy = stats.questionsAnswered > 0 ? ((stats.questionsCorrect / stats.questionsAnswered) * 100).toFixed(1) : 0;
    
    // Calcular estadísticas adicionales
    const totalGames = stats.totalGamesPlayed || 0;
    
    statsContainer.innerHTML = `
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon">🎯</div>
                <div class="stat-info">
                    <div class="stat-value">${accuracy}%</div>
                    <div class="stat-label">${t('precision')}</div>
                    <div class="stat-detail">${stats.questionsCorrect}/${stats.questionsAnswered} ${t('correctAnswers')}</div>
                </div>
            </div>
            
            <div class="stat-card">
                <div class="stat-icon">🔥</div>
                <div class="stat-info">
                    <div class="stat-value">${stats.longestCorrectStreak || 0}</div>
                    <div class="stat-label">${t('bestStreak')}</div>
                    <div class="stat-detail">${t('consecutiveAnswers')}</div>
                </div>
            </div>
            
            <div class="stat-card">
                <div class="stat-icon">🏆</div>
                <div class="stat-info">
                    <div class="stat-value">${stats.level || 1}</div>
                    <div class="stat-label">${t('currentLevel')}</div>
                    <div class="stat-detail">${stats.totalXP || 0} ${t('totalXP')}</div>
                </div>
            </div>
            
            <div class="stat-card">
                <div class="stat-icon">📊</div>
                <div class="stat-info">
                    <div class="stat-value">${totalGames}</div>
                    <div class="stat-label">${t('totalGames')}</div>
                    <div class="stat-detail">${stats.soloGamesPlayed || 0} ${t('soloGames')}, ${stats.vsGamesWon || 0} ${t('vsGames')}</div>
                </div>
            </div>
            
            <div class="stat-card">
                <div class="stat-icon">⭐</div>
                <div class="stat-info">
                    <div class="stat-value">${stats.perfectGames || 0}</div>
                    <div class="stat-label">${t('perfectGames')}</div>
                    <div class="stat-detail">${t('withoutErrors')}</div>
                </div>
            </div>
            
            <div class="stat-card">
                <div class="stat-icon">📅</div>
                <div class="stat-info">
                    <div class="stat-value">${stats.consecutiveDaysPlayed || 0}</div>
                    <div class="stat-label">${t('daysInRow')}</div>
                    <div class="stat-detail">${t('playingDaily')}</div>
                </div>
            </div>
        </div>
        
        <h4 style="margin-top: 24px; margin-bottom: 16px; font-weight: 800;">${t('statsByCategory')}</h4>
        <div class="category-stats">
            ${Object.entries(stats.correctByCategory || {}).map(([category, count]) => `
                <div class="category-stat-item">
                    <div class="category-stat-name">${t(category) || (category.charAt(0).toUpperCase() + category.slice(1))}</div>
                    <div class="category-stat-bar">
                        <div class="category-stat-fill" style="width: ${Math.min((count / 100) * 100, 100)}%"></div>
                    </div>
                    <div class="category-stat-count">${count}</div>
                </div>
            `).join('')}
        </div>
    `;
    
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
    
    // Vista con iconos para los logros traducidos
    achievementsContainer.innerHTML = `
        <div class="achievements-grid-icons">
            ${ACHIEVEMENTS_LIST.map(ach => {
                const isUnlocked = unlocked.has(ach.id);
                const iconPath = ach.icon ? `Icons/${ach.icon}` : '';
                
                // Usar traducción si existe, sino usar el original
                const title = achievementNameKeys[ach.id] ? t(achievementNameKeys[ach.id]) : ach.title;
                const description = achievementDescKeys[ach.id] ? t(achievementDescKeys[ach.id]) : ach.description;
                
                return `
                    <div class="achievement-icon-item ${isUnlocked ? 'unlocked' : 'locked'}" data-tooltip="${description}">
                        <div class="achievement-icon-wrapper">
                            ${iconPath ? 
                                `<img src="${iconPath}" alt="${title}" onerror="this.style.display='none'; this.parentElement.innerHTML='${isUnlocked ? '🏆' : '🔒'}';"/>` : 
                                (isUnlocked ? '🏆' : '🔒')
                            }
                        </div>
                        <div class="achievement-icon-name">${title}</div>
                        <div class="achievement-tooltip">${description}</div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

// Exportar la función
window.renderStatsPageTranslated = renderStatsPageTranslated;
