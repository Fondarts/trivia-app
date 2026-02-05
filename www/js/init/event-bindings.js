// js/init/event-bindings.js - Todos los event listeners centralizados
// Extraído de main.js para mejorar mantenibilidad

import { DOMUtils } from '../core/dom-utils.js';
import { showConfigUI } from '../ui/game-ui.js';
// VS handlers removido
import { nextQuestion } from '../game/solo.js';
/**
 * Vincular todos los event listeners
 * @param {Object} options - Opciones con funciones y dependencias
 */
export function bindAllEventListeners(options = {}) {
  const {
    onStartGame = () => {},
    onHost = () => {},
    onCancelSearch = () => {},
    onJoin = () => {},
    onShowFriends = () => {},
    onExitGame = () => {},
    onShareResult = () => {},
    lastResultShareText = ''
  } = options;
  
  // Botones de juego
  DOMUtils.getElement('btnStart')?.addEventListener('click', onStartGame);
  DOMUtils.getElement('btnNext')?.addEventListener('click', nextQuestion);
  
  // Botones de resultados
  DOMUtils.getElement('btnBackHome')?.addEventListener('click', () => {
    showConfigUI();
  });
  
  // Botones de resultados solo
  DOMUtils.getElement('backSingleResult')?.addEventListener('click', () => {
    const fsSingleResult = DOMUtils.getElement('fsSingleResult');
    if (fsSingleResult) DOMUtils.hide(fsSingleResult);
    showConfigUI();
  });
  
  DOMUtils.getElement('srHome')?.addEventListener('click', () => {
    const fsSingleResult = DOMUtils.getElement('fsSingleResult');
    if (fsSingleResult) DOMUtils.hide(fsSingleResult);
    showConfigUI();
  });
  
  // Botón de salir del juego
  DOMUtils.getElement('btnExitGame')?.addEventListener('click', onExitGame);
}

