// js/ui/game-ui.js - Helpers de UI para juego
// Extraído de main.js para mejorar mantenibilidad

import { DOMUtils } from '../core/dom-utils.js';

/**
 * Mostrar UI de juego y ocultar configuración
 */
export function showGameUI() {
  const cfg = DOMUtils.getElement('configCard');
  const game = DOMUtils.getElement('gameArea');
  
  DOMUtils.hide(cfg);
  if (game) {
    DOMUtils.show(game);
    game.style.position = 'relative';
    game.style.zIndex = '1';
  }
}

/**
 * Mostrar UI de configuración y ocultar juego
 */
export function showConfigUI() {
  const cfg = DOMUtils.getElement('configCard');
  const game = DOMUtils.getElement('gameArea');
  const wsArea = DOMUtils.getElement('wordsearchGameArea');
  
  DOMUtils.hide(game);
  if (wsArea) DOMUtils.hide(wsArea);
  DOMUtils.show(cfg);
}

/**
 * Actualizar descripción del modo de juego
 * @param {string} mode - Modo seleccionado
 */
export function updateGameModeDescription(mode) {
  const descEl = DOMUtils.getElement('gameModeDescription');
  if (!descEl) return;
  
  const iconEl = descEl.querySelector('.mode-desc-icon');
  const textEl = descEl.querySelector('.mode-desc-text');
  
  if (!iconEl || !textEl) return;
  
  // Solo modos disponibles: rounds, wordsearch, bible
  const descriptions = {
    'rounds': {
      icon: '📖',
      text: 'Test your Bible knowledge'
    },
    'wordsearch': {
      icon: '🔍',
      text: 'Find Bible words'
    },
    'bible': {
      icon: '📚',
      text: 'Study the Bible'
    }
  };
  
  const desc = descriptions[mode] || descriptions['rounds'];
  iconEl.textContent = desc.icon;
  textEl.textContent = desc.text;
}

