// ============================================
// QUIZLE! - ARCHIVO PRINCIPAL
// Optimizado con nueva estructura de carpetas v3.0
// ============================================

// Core utilities
import { toast } from './game/ui.js';
import { initVisualEffects, showConfetti, showLevelUpEffect, addAnswerEffect, playSound } from './effects.js';
import { t, initI18n, updateUI as updateI18nUI } from './core/i18n.js';
import { DOMUtils } from './core/dom-utils.js';
import { Storage } from './core/storage.js';

// UI modules
import { showGameUI, showConfigUI, updateGameModeDescription } from './ui/game-ui.js';

// Init modules
import { bindAllEventListeners } from './init/event-bindings.js';

// Game modules  
import { applyInitialUI, updatePlayerXPBar, bindStatsOpen, refreshCategorySelect, ensureCustomDropdown } from './game/ui.js';
import { startSolo, nextQuestion, endGame, renderQuestion, openSingleResult, showGame, showVerseModal } from './game/solo.js';
import { bindWordSearchButtons } from './game/wordsearch-ui.js';
import { initBibleStudy } from './game/bible-study.js';
import { STATE } from './core/store.js';

// Player modules
import { trackEvent } from './player/stats.js';
import { getLevelProgress } from './player/experience.js';


function setStatus(text, spin = false) {
  const el = document.getElementById('statusText');
  const sp = document.getElementById('statusSpin');
  if (el) el.textContent = text;
  if (sp) sp.style.display = spin ? 'inline-block' : 'none';
}


// Esperar a que el banco esté listo con timeout de seguridad
function waitForBank() {
  return new Promise((resolve) => {
    // Si ya está disponible, resolver inmediatamente
    if (window.getBank && window.getBankCount && window.getBankCount() > 0) {
      resolve();
      return;
    }
    
    // Esperar el evento bankReady con timeout de 10 segundos
    const timeout = setTimeout(() => {
      console.warn('Timeout esperando bankReady, continuando de todas formas');
      // Crear funciones básicas de fallback si no existen
      if (!window.getBank) {
        window.getBank = () => ({ bible: [] });
      }
      if (!window.getBankCount) {
        window.getBankCount = () => 0;
      }
      resolve();
    }, 10000);
    
    window.addEventListener('bankReady', () => {
      clearTimeout(timeout);
      resolve();
    }, { once: true });
  });
}

window.addEventListener('load', async ()=>{
  try {
    // Inicializar sistema de traducciones
    initI18n();
    updateI18nUI();
    
    // Inicializar efectos visuales
    initVisualEffects();
    
    // Esperar a que el banco esté cargado (con timeout de seguridad)
    await waitForBank();
    
    // Ocultar loader inicial con animación
    setTimeout(() => {
      const loader = document.getElementById('initial-loader');
      if (loader) {
        loader.style.opacity = '0';
        setTimeout(() => {
          loader.remove();
          // Animar la entrada del contenido principal
          const container = document.querySelector('.container');
          if (container) {
            container.style.opacity = '1';
            container.style.animation = 'fadeInUp 0.6s ease-out';
          }
        }, 500);
      }
    }, 500);
  
  // Primero aplicar UI inicial
  applyInitialUI();
  
  window.toast = toast;
  
  // Exponer utilidades globalmente
  window.DOMUtils = DOMUtils;
  window.refreshCategorySelect = refreshCategorySelect;
  
  // Exponer funciones de juego globalmente
  window.startSolo = startSolo;
  window.nextQuestion = nextQuestion;
  window.endGame = endGame;
  window.STATE = STATE;
  window.renderQuestion = renderQuestion;
  window.openSingleResult = openSingleResult;
  window.showGame = showGame;
  window.showVerseModal = showVerseModal;
  
  window.backToHome = () => showConfigUI();
  
  // Exponer Storage globalmente
  window.Storage = Storage;
  
  // Exponer funciones de progreso
  window.getLevelProgress = getLevelProgress;
  window.ACHIEVEMENTS_LIST = [];
  
  // Cargar lista de logros
  import('./player/achievements.js').then(module => {
    window.ACHIEVEMENTS_LIST = module.ACHIEVEMENTS_LIST || [];
  }).catch(() => {});

  // Indicador del modo seleccionado
  function updateModeIndicator() {
    const activeMode = document.querySelector('#modeSeg .seg.active');
    if (!activeMode) return;
    
    const modeName = activeMode.dataset.val;
    const modeKeys = {
      'rounds': 'modeSoloFull',
      'wordsearch': 'modeSopaFull',
      'bible': 'modeBibleFull'
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
    
    indicator.textContent = t(modeKeys[modeName]) || t('selectMode');
    
    // Animar el cambio
    indicator.style.animation = 'fadeInScale 0.3s ease';
  }
  
  // Actualizar indicador cuando se cambie el modo
  document.querySelectorAll('#modeSeg .seg').forEach(seg => {
    seg.addEventListener('click', () => {
      setTimeout(updateModeIndicator, 50);
    });
  });
  
  // Actualizar indicador inicial
  updateModeIndicator();
  
  bindStatsOpen();
  
  // Inicializar sistema de reporte de preguntas
  try {
    const { initQuestionReport } = await import('./game/question-report.js');
    initQuestionReport();
  } catch (error) {
    // Silenciar errores de carga
  }

  // Vincular todos los event listeners centralizados
  bindAllEventListeners({
    onStartGame: () => {
      startSolo();
    },
    onExitGame: async () => {
      if (!confirm('¿Seguro que querés salir de la partida?')) return;
      endGame();
      showConfigUI();
      setStatus('Listo', false);
    },
  });

  bindWordSearchButtons();
  initBibleStudy();
  ensureCustomDropdown(document.getElementById('bibleBookSel'));
  } catch (error) {
    console.error('Error durante la inicialización:', error);
    // Asegurar que el loader se oculte incluso si hay errores
    const loader = document.getElementById('initial-loader');
    if (loader) {
      loader.style.opacity = '0';
      setTimeout(() => loader.remove(), 500);
    }
    const container = document.querySelector('.container');
    if (container) {
      container.style.opacity = '1';
    }
    // Mostrar mensaje de error al usuario
    if (window.toast) {
      window.toast('Error al cargar la aplicación. Por favor recarga la página.');
    }
  }
});
