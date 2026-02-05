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
import { getPlayerNameForGame, updateAuthUI } from './ui/auth-ui.js';
import { showGameUI, showConfigUI, updateGameModeDescription } from './ui/game-ui.js';

// Handler modules (VS removido)

// Init modules
import { bindAllEventListeners } from './init/event-bindings.js';

// Game modules  
import { applyInitialUI, updatePlayerXPBar, bindStatsOpen, bindLeaderboardsOpen, refreshCategorySelect } from './game/ui.js';
import { startSolo, nextQuestion, endGame, renderQuestion, openSingleResult, showGame } from './game/solo.js';
import { bindWordSearchButtons } from './game/wordsearch-ui.js';
import { initBibleStudy } from './game/bible-study.js';
import { STATE } from './core/store.js';

// Player modules
import { renderLB } from './player/leaderboard.js';
import { trackEvent } from './player/stats.js';
import { getLevelProgress } from './player/experience.js';
import { initProfileSync } from './player/profile_sync.js';
import AuthSystem from './auth/auth_v2.js';

// Login nativo con Google Auth
async function loginWithGoogleNative() {
  try {
    // Usar el nuevo sistema de autenticación
    await AuthSystem.signInWithGoogle();
  } catch (err) {

    // Mostrar mensaje específico para error de configuración
    if (err.message && err.message.includes('Error de configuración en Supabase')) {
      // Mostrar el mensaje completo con instrucciones
      alert(`Error de Configuración:\n\n${err.message}`);
    } else {
      toast('Error al iniciar sesión con Google. Revisa la consola para más detalles.');
    }
  }
}
import { injectNicknameModalStyles, checkAndShowNicknameModal } from './auth/nickname_modal.js';
import { initFriendsSystem } from './player/social.js';
import { initFriendsSystem as initFriendsUI } from './player/friends_ui.js';

/* ===== Supabase UMD ===== */
async function getSupabaseClient(){
  if (!window.supabase) await new Promise((res)=>{
    const s = document.getElementById('supabase-umd');
    if (s && window.supabase) return res();
    if (s){ s.addEventListener('load', res); s.addEventListener('error', res); return; }
    const n = document.createElement('script');
    n.id='supabase-umd'; n.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js';
    n.onload=res; n.onerror=res; document.head.appendChild(n);
  });
  if (!window.supabase) { alert('Error cargando Supabase'); throw new Error('Supabase UMD missing'); }
  if (!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) { alert('Faltan credenciales de Supabase'); throw new Error('Missing Supabase credentials'); }
  
  // Crear el cliente y guardarlo globalmente
  const client = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: window.localStorage,
      storageKey: 'sb-' + window.SUPABASE_URL.split('//')[1].split('.')[0] + '-auth-token'
    }
  });
  
  // Guardar globalmente para que otros scripts lo puedan usar
  window.supabaseClient = client;
  
  return client;
}

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
  
  // Limpiar partidas antiguas automáticamente
  try {
    if (window.cleanupOldMatches) {
      await window.cleanupOldMatches();
    }
  } catch (error) {
  }
  
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
  
  // Importar funciones de auth al scope global
  window.getCurrentUser = AuthSystem.getCurrentUser;
  window.signOut = AuthSystem.signOut;
  window.initGoogleAuth = AuthSystem.initAuth;
  window.checkAndShowNicknameModal = checkAndShowNicknameModal;
  window.AuthSystem = AuthSystem;
  window.initFriendsSystem = initFriendsSystem;
  window.toast = toast;
  
  // Exponer utilidades DOM y State Manager globalmente (compatibilidad con código tradicional)
  window.DOMUtils = DOMUtils;
  window.StateManager = StateManager;
  window.refreshCategorySelect = refreshCategorySelect;
  
  // Función de debug para avatar
  window.debugAvatar = function() {
    const user = getCurrentUser();
    const profileAvatar = document.getElementById('profileAvatar');
    if (user?.avatar && user.avatar !== 'img/avatarman.webp') {
      profileAvatar.src = user.avatar + '?t=' + Date.now();
    }
  };
  
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
  
  // Inyectar estilos del modal de nickname
  injectNicknameModalStyles();
  
  // updateAuthUI ahora está importada desde ui/auth-ui.js
  
  // Event listeners básicos (los complejos están más abajo)
  // bindAllEventListeners se llama más abajo después de definir las funciones
  
  // Hacer updateAuthUI disponible globalmente para auth_google.js
  window.updateAuthUI = updateAuthUI;
  
  // Hacer getCurrentUser disponible globalmente para nickname_modal.js
  window.getCurrentUser = AuthSystem.getCurrentUser;

  // Cargar nivel y XP del perfil si hay usuario
  async function loadUserProfile(userId) {
    if (!supabase || !userId) return null;
    
    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('nickname, level, total_xp')
        .eq('user_id', userId)
        .single();
      
      return profile;
    } catch (error) {
      return null;
    }
  }
  
  // Intentar inicializar Google Auth (opcional, no bloquea)
  let supabase = null;
  try {
    supabase = await getSupabaseClient();
    const user = await AuthSystem.initAuth();
    
    // Configurar callback para cambios de auth
    window.onAuthStateChanged = (user) => {
      updateAuthUI(user, { supabase });
      if (user) {
        setTimeout(() => {
          checkAndShowNicknameModal();
        }, 1000);
      }
    };
    
    // Verificar si venimos de un callback OAuth
    if (Storage.get('auth_success') === 'true') {
      Storage.remove('auth_success');
      toast('¡Login exitoso con Google!');
      setTimeout(() => {
        checkAndShowNicknameModal();
      }, 1000);
    }
    
    updateAuthUI(user, { supabase });
  } catch (error) {
    // El juego funciona sin autenticación
  }

  // Helper global para enviar invitaciones incluso si socialManager aún no está listo
  window.sendGameInvite = async function(friendId, roomCode) {
    try {
      if (!supabase || !friendId || !roomCode) return { success: false, error: new Error('Missing data') };
      const typesToTry = ['sync', 'async'];
      let lastError = null;
      for (const gtype of typesToTry) {
        const { data, error } = await supabase
          .from('game_invitations')
          .insert({
            from_user_id: (window.socialManager?.userId) || Storage.get('current_user', {}).id,
            to_user_id: friendId,
            room_code: roomCode,
            game_type: gtype,
            status: 'pending',
            expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString()
          })
          .select();
        if (!error) return { success: true, data };
        lastError = error;
        const msg = String(error?.message || '');
        if (!(msg.includes('check constraint') || error?.code === '23514')) break;
      }
      if (lastError) throw lastError;
      return { success: false, error: new Error('Invite insert failed') };
    } catch (e) {
      return { success: false, error: e };
    }
  };

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
  bindStatsOpen(renderLB);
  
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

  // Exponer función globalmente
  window.showAsyncExitMessage = showAsyncExitMessage;

  document.getElementById('btnExitGame')?.addEventListener('click', async ()=>{
    // Verificar si estamos en modo asíncrono esperando rival
    const currentState = window.STATE || STATE;
    
    // Detectar si está en modo async_v2 (ya respondió o no, pero está en partida asíncrona)
    const isAsyncV2 = currentState?.mode === 'async_v2' || window.currentGameMode === 'async_v2';
    const isAsyncV1 = currentState?.mode === 'async' || window.currentGameMode === 'async';
    const hasAsyncMatch = !!window.currentAsyncMatchId;
    
    // Si está en modo async (V1 o V2) y tiene una partida activa, NO mostrar confirmación
    const isAsyncWaiting = (isAsyncV2 || isAsyncV1) && hasAsyncMatch &&
      (currentState?.status === 'waiting_for_opponent' || 
       currentState?.status === 'waiting_for_opponent_answer' ||
       currentState?.alreadyAnswered ||
       isAsyncV2); // En async_v2 siempre permitir salir sin confirmación
    
    // Botón Exit clickeado
    
    if (isAsyncWaiting) {
      // En partidas asíncronas esperando rival, no mostrar confirmación
      
      // Para partidas asíncronas, solo salir sin terminar el juego
      // NO llamar a endGame() ni leaveMatch() porque eso abandonaría la partida
      // Solo volver a la pantalla principal
      showConfigUI();
      setStatus('Listo', false);
      
      // Limpiar referencias pero mantener la partida activa
      // No limpiar currentAsyncMatchId para que pueda volver a entrar
      
      // Recargar el listado de partidas abiertas para actualizar el progreso
      setTimeout(() => {
        if (window.loadOpenMatches) {

          window.loadOpenMatches();
        }
      }, 500);
    } else {

      // Para partidas normales, mostrar confirmación
      if (!confirm('¿Seguro que querés salir de la partida?')) return;
      endGame();
      showConfigUI();
      setStatus('Listo', false);
    }
  });

  document.getElementById('btnBackHome')?.addEventListener('click', () => showConfigUI());

  document.getElementById('backSingleResult')?.addEventListener('click', ()=> { document.getElementById('fsSingleResult').style.display='none'; showConfigUI(); });
  document.getElementById('srHome')?.addEventListener('click', ()=> { document.getElementById('fsSingleResult').style.display='none'; showConfigUI(); });
  

  // Vincular todos los event listeners centralizados
  bindAllEventListeners({
    onStartGame: () => {
      startSolo();
    },
    onShowFriends: () => {
      import('./player/friends_ui.js').then(module => {
        if (module.toggleFriendsPanel) {
          module.toggleFriendsPanel();
        }
      }).catch(err => {

      });
    },
    onExitGame: async () => {
      const currentState = window.STATE || STATE;
      
      // Detectar si está en modo async_v2 (ya respondió o no, pero está en partida asíncrona)
      const isAsyncV2 = currentState?.mode === 'async_v2' || window.currentGameMode === 'async_v2';
      const isAsyncV1 = currentState?.mode === 'async' || window.currentGameMode === 'async';
      const hasAsyncMatch = !!window.currentAsyncMatchId;
      
      // Si está en modo async (V1 o V2) y tiene una partida activa, NO mostrar confirmación
      const isAsyncWaiting = (isAsyncV2 || isAsyncV1) && hasAsyncMatch &&
        (currentState?.status === 'waiting_for_opponent' || 
         currentState?.status === 'waiting_for_opponent_answer' ||
         currentState?.alreadyAnswered ||
         isAsyncV2); // En async_v2 siempre permitir salir sin confirmación
      
      if (isAsyncWaiting) {
        showConfigUI();
        setStatus('Listo', false);
        if (window.showAsyncExitMessage) showAsyncExitMessage();
        setTimeout(() => {
          if (window.loadOpenMatches) window.loadOpenMatches();
        }, 500);
      } else {
        if (!confirm('¿Seguro que querés salir de la partida?')) return;
        endGame();
        showConfigUI();
        setStatus('Listo', false);
      }
    },
  });

  bindWordSearchButtons();
  initBibleStudy();
  
  // Vincular botón de logout en el perfil (específico, no en bindings genéricos)
  DOMUtils.getElement('profileBtnLogout')?.addEventListener('click', async () => {
    if (confirm('¿Seguro que quieres cerrar sesión?')) {
      await AuthSystem.signOut();
      updateAuthUI(null, { supabase });
      DOMUtils.update(DOMUtils.getElement('profileNicknameText'), { textContent: '—' });
      DOMUtils.update(DOMUtils.getElement('profileLevelBadge'), { innerHTML: '<span data-i18n="level">Nivel</span> 1' });
      DOMUtils.update(DOMUtils.getElement('profileXpBar'), { style: { width: '0%' } });
      DOMUtils.update(DOMUtils.getElement('profileXpText'), { textContent: '0 / 100 XP' });
      DOMUtils.update(DOMUtils.getElement('profileAvatar'), { src: './img/avatar_placeholder.svg' });
      const headerAvatar = document.querySelector('.avatar-btn img');
      if (headerAvatar) headerAvatar.src = './img/avatar_placeholder.svg';
      const profileModal = DOMUtils.getElement('profileModal');
      if (profileModal) profileModal.classList.remove('open');
    }
  });

  // SOLUCION OAUTH: Detectar token en la URL al cargar la página
  const urlHash = window.location.hash;
  if (urlHash && urlHash.includes('access_token') && supabase) {

    // Esperar un momento para que Supabase procese el hash automáticamente
    setTimeout(async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (session?.user) {

          const userData = {
            id: session.user.id,
            email: session.user.email,
            name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
            avatar: session.user.user_metadata?.avatar_url || 'img/avatar_placeholder.svg',
            isGuest: false
          };
          
          // Guardar y actualizar UI
          Storage.set('current_user', userData);
          updateAuthUI(userData, { supabase });
          
          // Limpiar URL
          window.history.replaceState({}, document.title, window.location.pathname);
          
          toast('¡Login exitoso con Google!');
          
          // Verificar si necesita configurar nickname
          setTimeout(() => {
            checkAndShowNicknameModal();
          }, 1000);
          
        } else {

        }
      } catch (error) {

      }
    }, 2000);
  }
});
