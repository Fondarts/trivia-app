// ============================================
// QUIZLE! - ARCHIVO PRINCIPAL
// Optimizado con nueva estructura de carpetas v3.0
// ============================================

// Core utilities
import { toast } from './game/ui.js';
import { initVisualEffects, showConfetti, showLevelUpEffect, addAnswerEffect, playSound } from './effects.js';
import { t, initI18n, updateUI as updateI18nUI } from './core/i18n.js';
import { DOMUtils } from './core/dom-utils.js';
import { StateManager } from './core/state-manager.js';
import { Storage } from './core/storage.js';

// UI modules
import { showGameUI, showConfigUI, updateGameModeDescription } from './ui/game-ui.js';

// Handler modules (VS removido)

// Init modules
import { bindAllEventListeners } from './init/event-bindings.js';

// Game modules  
import { applyInitialUI, updatePlayerXPBar, bindStatsOpen, refreshCategorySelect } from './game/ui.js';
import { startSolo, nextQuestion, endGame, renderQuestion, openSingleResult, showGame } from './game/solo.js';
import { bindWordSearchButtons } from './game/wordsearch-ui.js';
import { initBibleStudy } from './game/bible-study.js';
import { STATE } from './core/store.js';

// Player modules
import { trackEvent } from './player/stats.js';
import { getLevelProgress } from './player/experience.js';


function setStatus(text, spin=false){
  const el = document.getElementById('statusText');
  const sp = document.getElementById('statusSpin');
  if (el) el.textContent = text;
  if (sp) sp.style.display = spin ? 'inline-block' : 'none';
}
// showGameUI, showConfigUI, updateGameModeDescription ahora están importadas desde ui/game-ui.js


// Esperar a que el banco esté listo
function waitForBank() {
  return new Promise((resolve) => {
    if (window.getBank && window.getBankCount && window.getBankCount() > 0) {
      resolve();
    } else {
      window.addEventListener('bankReady', resolve, { once: true });
    }
  });
}

window.addEventListener('load', async ()=>{
  // Inicializar sistema de traducciones
  initI18n();
  updateI18nUI();
  
  // Inicializar efectos visuales
  initVisualEffects();
  
  // Esperar a que el banco esté cargado
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
        container.style.opacity = '1';
        container.style.animation = 'fadeInUp 0.6s ease-out';
      }, 500);
    }
  }, 500);
  
  // Primero aplicar UI inicial
  applyInitialUI();
  
  window.toast = toast;
  
  // Exponer utilidades DOM y State Manager globalmente (compatibilidad con código tradicional)
  window.DOMUtils = DOMUtils;
  window.StateManager = StateManager;
  window.refreshCategorySelect = refreshCategorySelect;
  
  
  // Exponer funciones de juego globalmente
  window.startSolo = startSolo;
  window.nextQuestion = nextQuestion;
  window.endGame = endGame;
  window.STATE = STATE;
  window.renderQuestion = renderQuestion;
  window.openSingleResult = openSingleResult;
  window.showGame = showGame;
  
  window.backToHome = () => showConfigUI();
  
  // Exponer Storage globalmente
  window.Storage = Storage;
  
  // Hacer disponibles funciones necesarias para el sistema de amigos
  window.getLevelProgress = getLevelProgress;
  window.ACHIEVEMENTS_LIST = [];
  
  // Cargar lista de logros
  import('./player/achievements.js').then(module => {
    window.ACHIEVEMENTS_LIST = module.ACHIEVEMENTS_LIST || [];
  }).catch(err => {
  });
  
  // Event listeners básicos (los complejos están más abajo)
  // bindAllEventListeners se llama más abajo después de definir las funciones
  

  // Helper global para enviar invitaciones (sistema de amigos removido)

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
  
  // Event listeners básicos ahora se manejan en bindAllEventListeners (más abajo)
  bindStatsOpen();
  
  // Inicializar sistema de reporte de preguntas
  try {
    const { initQuestionReport } = await import('./game/question-report.js');
    initQuestionReport();
  } catch (error) {
  }

  // Función para actualizar el estilo del botón Exit según el modo
  function updateExitButtonStyle() {
    const exitBtn = document.getElementById('btnExitGame');
    if (!exitBtn) return;
    
    const currentState = window.STATE || STATE;
    const isAsyncWaiting = currentState && currentState.mode === 'async' && 
      (currentState.status === 'waiting_for_opponent' || currentState.status === 'waiting_for_opponent_answer');

    if (isAsyncWaiting) {
      // En modo asíncrono esperando rival: botón normal (no rojo)
      exitBtn.classList.remove('danger');
      exitBtn.classList.add('secondary');
      exitBtn.style.backgroundColor = '';
      exitBtn.style.color = '';
    } else {
      // En modo normal: botón rojo (danger)
      exitBtn.classList.remove('secondary');
      exitBtn.classList.add('danger');
    }
  }
  
  // Exponer función globalmente
  window.updateExitButtonStyle = updateExitButtonStyle;

  // Función para mostrar mensaje de partida asíncrona
  function showAsyncExitMessage() {
    const exitBtn = document.getElementById('btnExitGame');
    if (!exitBtn) {

      return;
    }

    // Crear o actualizar el mensaje
    let messageEl = document.getElementById('asyncExitMessage');
    if (!messageEl) {

      messageEl = document.createElement('div');
      messageEl.id = 'asyncExitMessage';
      
      messageEl.style.cssText = `
        margin-top: 12px;
        padding: 12px 16px;
        background: rgba(59, 130, 246, 0.15);
        border: 1px solid rgba(59, 130, 246, 0.4);
        border-radius: 8px;
        color: black;
        font-size: 15px;
        font-weight: 500;
        text-align: center;
        line-height: 1.5;
        box-shadow: 0 2px 4px rgba(59, 130, 246, 0.1);
      `;
      
      // Insertar después del botón Exit

      exitBtn.parentNode.insertBefore(messageEl, exitBtn.nextSibling);

    } else {

    }
    
    messageEl.textContent = 'Podés salir mientras esperás a que tu rival responda';

    // En partidas asíncronas, el mensaje debe permanecer visible
    // No ocultar automáticamente
  }

  document.getElementById('btnExitGame')?.addEventListener('click', async ()=>{
    if (!confirm('¿Seguro que querés salir de la partida?')) return;
    endGame();
    showConfigUI();
    setStatus('Listo', false);
  });

  document.getElementById('btnBackHome')?.addEventListener('click', () => showConfigUI());

  document.getElementById('backSingleResult')?.addEventListener('click', ()=> { document.getElementById('fsSingleResult').style.display='none'; showConfigUI(); });
  document.getElementById('srHome')?.addEventListener('click', ()=> { document.getElementById('fsSingleResult').style.display='none'; showConfigUI(); });
  

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
});
