// js/handlers/vs-handlers.js - Handlers de modo VS
// Extraído de main.js para mejorar mantenibilidad

import { DOMUtils } from '../core/dom-utils.js';
import { Storage } from '../core/storage.js';
import { showGameUI, showConfigUI } from '../ui/game-ui.js';
import { updatePlayerXPBar } from '../game/ui.js';
import { trackEvent } from '../player/stats.js';
import { answer, leaveMatch } from '../game/vs.js';
import { toast } from '../game/ui.js';
import { showConfetti, showLevelUpEffect, playSound, addAnswerEffect } from '../effects.js';
import { getPlayerNameForGame } from '../ui/auth-ui.js';

// Estado de VS (privado, pero accesible via funciones)
let vsQNo = 0;
let vsQTotal = null;
let vsActive = false;

/**
 * Establecer HUD de VS
 * @param {number|string} sec - Segundos restantes
 */
export function setVsHUD(sec) {
  const hud = DOMUtils.getElement('kHUD');
  if (!hud) return;
  const left = (typeof sec === 'number') ? ` · ${sec}s` : '';
  const qNo = getVsQNo();
  const qTotal = getVsQTotal();
  if (qTotal) hud.textContent = `${qNo}/${qTotal}${left}`;
  else hud.textContent = `${qNo}${left}`;
}

/**
 * Renderizar pregunta de VS
 * @param {Object} q - Pregunta
 */
export function renderVSQuestion(q) {
  setVsActive(true);
  showGameUI();
  
  const qEl = DOMUtils.getElement('qText');
  const optionsEl = DOMUtils.getElement('options');
  
  if (qEl) qEl.textContent = q.question || '—';
  
  // Manejar imágenes en VS
  const mediaEl = DOMUtils.getElement('qMedia');
  if (mediaEl) {
    const img = mediaEl.querySelector('img');
    if (q.media || q.img) {
      const imgUrl = q.media || q.img;
      img.src = imgUrl;
      img.onload = () => DOMUtils.show(mediaEl);
      img.onerror = () => DOMUtils.hide(mediaEl);
    } else {
      DOMUtils.hide(mediaEl);
    }
  }
  
  if (!optionsEl) return;
  
  optionsEl.style.pointerEvents = 'auto';
  optionsEl.innerHTML = '';
  const correctIdx = (q.answer ?? q.correct ?? q.ans ?? null);
  
  setVsQNo(getVsQNo() + 1);
  if (q.total) setVsQTotal(q.total);
  setVsHUD(q.timeLeft);
  
  let locked = false;
  const fire = async (i) => {
    if (locked) return;
    locked = true;
    
    const btns = Array.from(optionsEl.children);
    btns.forEach((b, idx) => {
      if (idx === correctIdx) b.classList.add('correct');
    });
    
    let results = {};
    if (correctIdx !== null && correctIdx !== undefined) {
      if (i !== correctIdx) {
        btns[i]?.classList.add('wrong');
        addAnswerEffect(btns[i], false);
        playSound('wrong');
        results = await trackEvent('answer_wrong');
      } else {
        btns[i]?.classList.add('correct');
        addAnswerEffect(btns[i], true);
        playSound('correct');
        results = await trackEvent('answer_correct', {
          category: q.cat || 'vs',
          difficulty: q.diff || 'medium'
        });
      }
    }
    
    updatePlayerXPBar();
    if (results.leveledUp) {
      toast("🎉 ¡Subiste de Nivel! 🎉");
      showLevelUpEffect(document.querySelector('.container'));
      playSound('levelUp');
    }
    if (results.bonusToast) toast(results.bonusToast);
    results.newAchievements.forEach(ach => {
      toast(`🏆 ¡Logro desbloqueado: ${ach.title}!`);
    });
    
    document.querySelectorAll('#options .option').forEach(el => {
      el.classList.add('disabled');
    });
    try {
      answer(i);
    } catch (e) {
      console.error(e);
    }
  };
  
  (q.options || []).forEach((txt, i) => {
    const btn = DOMUtils.create('button', {
      type: 'button',
      className: 'option',
      textContent: String(txt ?? ''),
      listeners: {
        click: (e) => {
          e.preventDefault();
          fire(i);
        }
      }
    });
    optionsEl.appendChild(btn);
  });
}

/**
 * Mostrar resultados de VS
 * @param {Object} params - Parámetros
 * @param {Object} params.scores - Puntuaciones
 * @param {string} params.mePid - ID del jugador actual
 * @param {string} params.reason - Razón de finalización
 * @param {string} params.winnerPid - ID del ganador
 */
export async function showResults({ scores, mePid, reason, winnerPid }) {
  setVsActive(false);
  resetVsState();
  
  // Obtener el ID del amigo si es una partida de amigos
  let friendId = null;
  const pendingFriendId = Storage.get('last_vs_friend_id');
  
  // Limpiar invitaciones pendientes si las hay
  if (window.socialManager) {
    try {
      // Marcar las invitaciones de esta partida como completadas
      const { data: invitations } = await window.socialManager.supabase
        .from('game_invitations')
        .select('*')
        .or(`from_user_id.eq.${window.socialManager.userId},to_user_id.eq.${window.socialManager.userId}`)
        .eq('status', 'pending')
        .gte('expires_at', new Date().toISOString());
      
      if (invitations && invitations.length > 0) {
        for (const inv of invitations) {
          await window.socialManager.supabase
            .from('game_invitations')
            .update({ status: 'completed' })
            .eq('id', inv.id);
          
          // Guardar el ID del amigo para actualizar rankings
          if (inv.from_user_id === window.socialManager.userId) {
            friendId = inv.to_user_id;
          } else {
            friendId = inv.from_user_id;
          }
        }
      }
      
      // Si no encontramos amigo en las invitaciones, usar el guardado
      if (!friendId) friendId = pendingFriendId;
    } catch (error) {
      console.log('Error limpiando invitaciones:', error);
    }
  }
  
  // Limpiar el badge de espera
  const badge = DOMUtils.getElement('vsCodeBadge');
  if (badge) {
    badge.textContent = 'Sala: —';
    badge.style.color = '';
  }
  
  const fs = DOMUtils.getElement('fsVSResult');
  if (!fs) {
    showConfigUI();
    return;
  }
  
  const arr = Object.entries(scores || {}).map(([pid, s]) => ({
    pid,
    name: s?.name || 'Jugador',
    correct: s?.correct || 0
  })).sort((a, b) => b.correct - a.correct);
  
  const meIdx = Math.max(0, arr.findIndex(x => x.pid === mePid));
  const rivalIdx = meIdx === 0 ? 1 : 0;
  const meName = getPlayerNameForGame() || (arr[meIdx]?.name || 'Vos');
  const rivalName = arr[rivalIdx]?.name || 'rival';
  const meScore = arr[meIdx]?.correct ?? 0;
  const rivalScore = arr[rivalIdx]?.correct ?? 0;
  
  // Prioridad: victoria por abandono
  let won = meScore > rivalScore;
  const wonByForfeit = (reason === 'opponent_left' && (!winnerPid || winnerPid === mePid));
  if (wonByForfeit) won = true;
  
  if (friendId && window.socialManager) {
    console.log('Actualizando ranking con amigo:', friendId, 'Ganó:', won);
    await window.socialManager.updateFriendRanking(friendId, won);
  }
  
  // Limpiar el ID del amigo guardado
  Storage.remove('last_vs_friend_id');
  
  const results = await trackEvent('game_finish', { mode: 'vs', won });
  updatePlayerXPBar();
  
  if (results.leveledUp) {
    toast("🎉 ¡Subiste de Nivel! 🎉");
    showLevelUpEffect(document.querySelector('.container'));
    playSound('levelUp');
  }
  if (won) {
    showConfetti();
  }
  if (results.bonusToast) toast(results.bonusToast);
  results.newAchievements.forEach(ach => {
    setTimeout(() => toast(`🏆 ¡Logro desbloqueado: ${ach.title}!`), 500);
  });
  
  const heroTitle = fs.querySelector('.hero .big-title');
  const subtitle = fs.querySelector('.hero .subtitle');
  const scoreEl = fs.querySelector('.hero .bigscore');
  
  if (meScore === rivalScore) {
    heroTitle.textContent = '¡Empate!';
    subtitle.textContent = `Buen duelo con ${rivalName}.`;
  } else if (won) {
    heroTitle.textContent = '¡Felicitaciones!';
    subtitle.textContent = `Le ganaste a ${rivalName}.`;
  } else {
    heroTitle.textContent = 'Perdiste';
    subtitle.innerHTML = `Contra ${rivalName}. Te irá mejor la próxima. <span class="maybe">(quizás)</span>`;
  }
  
  // Mostrar/ocultar marcador según motivo
  if (typeof wonByForfeit !== 'undefined' && wonByForfeit) {
    if (scoreEl) scoreEl.style.display = 'none';
  } else {
    if (scoreEl) {
      scoreEl.style.display = '';
      scoreEl.textContent = `${meScore} vs ${rivalScore}`;
    }
  }
  
  // Ajustar mensaje de compartir
  if (typeof wonByForfeit !== 'undefined' && wonByForfeit) {
    lastResultShareText = 'Victoria por abandono vs ' + rivalName + '.';
  } else {
    lastResultShareText = won
      ? ('Te gane ' + rivalName + ': ' + meScore + '-' + rivalScore + ' en Trivia. Revancha?')
      : ('Perdi contra ' + rivalName + ': ' + meScore + '-' + rivalScore + ' en Trivia. La proxima te gano!');
  }
  
  // Override mensajes si fue abandono del rival
  if (typeof wonByForfeit !== 'undefined' && wonByForfeit) {
    heroTitle.textContent = 'Victoria por abandono';
    subtitle.textContent = `${rivalName} abandono la partida.`;
  }
  
  DOMUtils.show(fs);
  window.scrollTo(0, 0);
}

/**
 * Volver al inicio desde VS
 */
export async function backToHome() {
  try {
    await leaveMatch();
  } catch {}
  
  vsActive = false;
  const fsResult = DOMUtils.getElement('fsVSResult');
  if (fsResult) DOMUtils.hide(fsResult);
  showConfigUI();
  
  // Limpiar invitaciones y badges
  if (window.socialManager) {
    try {
      // Marcar invitaciones como canceladas
      const { data: invitations } = await window.socialManager.supabase
        .from('game_invitations')
        .select('id')
        .eq('from_user_id', window.socialManager.userId)
        .eq('status', 'pending');
      
      if (invitations && invitations.length > 0) {
        for (const inv of invitations) {
          await window.socialManager.supabase
            .from('game_invitations')
            .update({ status: 'cancelled' })
            .eq('id', inv.id);
        }
      }
    } catch (error) {
      console.log('Error limpiando invitaciones:', error);
    }
  }
  
  // Limpiar el badge
  const badge = DOMUtils.getElement('vsCodeBadge');
  if (badge) {
    badge.textContent = 'Sala: —';
    badge.style.color = '';
  }
}

// Exportar estado de VS para acceso externo
export function getVsState() {
  return { vsQNo, vsQTotal, vsActive };
}

export function resetVsState() {
  vsQNo = 0;
  vsQTotal = null;
  vsActive = false;
}

// Getters individuales para compatibilidad
export function getVsActive() {
  return vsActive;
}

export function setVsActive(value) {
  vsActive = value;
}

export function getVsQNo() {
  return vsQNo;
}

export function setVsQNo(value) {
  vsQNo = value;
}

export function getVsQTotal() {
  return vsQTotal;
}

export function setVsQTotal(value) {
  vsQTotal = value;
}

// Exportar lastResultShareText
export let lastResultShareText = '';

