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

// Handler modules
import { 
  setVsHUD, 
  renderVSQuestion, 
  showResults, 
  backToHome,
  getVsActive,
  setVsActive,
  getVsQNo,
  setVsQNo,
  getVsQTotal,
  setVsQTotal,
  lastResultShareText,
  resetVsState
} from './handlers/vs-handlers.js';

// Init modules
import { bindAllEventListeners } from './init/event-bindings.js';

// Game modules  
import { applyInitialUI, updatePlayerXPBar, bindStatsOpen, bindLeaderboardsOpen, refreshCategorySelect } from './game/ui.js';
import { startSolo, nextQuestion, endGame, renderQuestion } from './game/solo.js';
import { initVS, createMatch, joinMatch, answer, setVSName, leaveMatch, startRandomMatch, cancelRandomSearch, isRandomSearching } from './game/vs.js';
import { initAsyncVS, startAsyncRandomSearch } from './game/async_vs.js';
import { STATE } from './core/store.js';

// Player modules
import { renderLB } from './player/leaderboard.js';
import { trackEvent } from './player/stats.js';
import { getLevelProgress } from './player/experience.js';
import { initProfileSync } from './player/profile_sync.js';
import AuthSystem from './auth/auth_v2.js';

// Ad modules
import { UnifiedBanner } from './ads/unified-banner.js';
// Detectar si es Android nativo (Capacitor)
let isNativeAndroid = false;
if (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.getPlatform && window.Capacitor.getPlatform() === 'android') {
  isNativeAndroid = true;
}

// Inicializar sistema de anuncios
let unifiedBanner = null;

// Login nativo con Google Auth
async function loginWithGoogleNative() {
  try {
    // Usar el nuevo sistema de autenticación
    await AuthSystem.signInWithGoogle();
  } catch (err) {
    console.error('Error en login:', err);

    // Mostrar mensaje específico para error de configuración
    if (err.message && err.message.includes('Error de configuración en Supabase')) {
      // Mostrar el mensaje completo con instrucciones
      alert(`Error de Configuración:\n\n${err.message}`);
    } else {
      toast('Error al iniciar sesión con Google. Revisa la consola para más detalles.');
    }
  }
}
// Vincular botón de Google login (modal y perfil)
document.getElementById('btnGoogleLogin')?.addEventListener('click', async () => {
  showSimpleAuthModal();
});
document.getElementById('profileBtnAuth')?.addEventListener('click', async () => {
  showSimpleAuthModal();
});
import { injectSimpleAuthStyles, showSimpleAuthModal } from './auth/modal_v2.js';
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

// Funciones VS ahora están importadas desde handlers/vs-handlers.js

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
  
  // Inicializar sistema de anuncios (Android + Web)
  try {
    unifiedBanner = new UnifiedBanner();
    await unifiedBanner.initialize();
    console.log('✅ Sistema de anuncios unificado inicializado');
  } catch (error) {
    console.error('❌ Error inicializando anuncios:', error);
  }
  updateI18nUI();
  
  // Inicializar efectos visuales
  initVisualEffects();
  
  // Esperar a que el banco esté cargado
  await waitForBank();
  console.log('Banco listo, inicializando aplicación...');
  
  // Limpiar partidas antiguas automáticamente
  try {
    if (window.cleanupOldMatches) {
      await window.cleanupOldMatches();
      console.log('✅ Limpieza automática de partidas completada');
    }
  } catch (error) {
    console.error('❌ Error en limpieza automática:', error);
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
  window.showSimpleAuthModal = showSimpleAuthModal;
  window.checkAndShowNicknameModal = checkAndShowNicknameModal;
  window.AuthSystem = AuthSystem;
  window.initFriendsSystem = initFriendsSystem;
  window.toast = toast;
  
  // Exponer utilidades DOM y State Manager globalmente (compatibilidad con código tradicional)
  window.DOMUtils = DOMUtils;
  window.StateManager = StateManager;
  window.refreshCategorySelect = refreshCategorySelect;
  console.log('✅ Utilidades DOM y State Manager disponibles globalmente');
  
  // Función de debug para avatar
  window.debugAvatar = function() {
    const user = getCurrentUser();
    const profileAvatar = document.getElementById('profileAvatar');
    console.log('🔍 DEBUG AVATAR MANUAL:');
    console.log('Usuario:', user);
    console.log('Avatar URL:', user?.avatar);
    console.log('Elemento avatar:', profileAvatar);
    if (user?.avatar && user.avatar !== 'img/avatarman.webp') {
      console.log('🔄 Forzando recarga de avatar...');
      profileAvatar.src = user.avatar + '?t=' + Date.now();
    }
  };
  
  // Exponer funciones de juego globalmente
  window.startSolo = startSolo;
  window.nextQuestion = nextQuestion;
  window.endGame = endGame;
  window.startRandomMatch = startRandomMatch;
  window.STATE = STATE;
  window.renderQuestion = renderQuestion;
  window.answer = answer;
  
  // Exponer funciones VS globalmente
  window.renderVSQuestion = renderVSQuestion;
  window.showResults = showResults;
  window.setVsHUD = setVsHUD;
  window.backToHome = backToHome;
  window.getVsActive = getVsActive;
  window.setVsActive = setVsActive;
  
  // Exponer Storage globalmente
  window.Storage = Storage;
  console.log('✅ Sistema de Storage centralizado cargado');
  
  // Hacer disponibles funciones necesarias para el sistema de amigos
  window.getLevelProgress = getLevelProgress;
  window.ACHIEVEMENTS_LIST = [];
  
  // Cargar lista de logros
  import('./player/achievements.js').then(module => {
    window.ACHIEVEMENTS_LIST = module.ACHIEVEMENTS_LIST || [];
  }).catch(err => {
    console.log('No se pudo cargar lista de logros:', err);
  });
  
  // Inyectar estilos del modal simple
  injectSimpleAuthStyles();
  
  // Inyectar estilos del modal de nickname
  injectNicknameModalStyles();
  
  // updateAuthUI ahora está importada desde ui/auth-ui.js
  
  // Event listeners básicos (los complejos están más abajo)
  // bindAllEventListeners se llama más abajo después de definir las funciones
  
  // Hacer updateAuthUI disponible globalmente para auth_google.js
  window.updateAuthUI = updateAuthUI;
  
  // Hacer getCurrentUser disponible globalmente para nickname_modal.js
  window.getCurrentUser = AuthSystem.getCurrentUser;
  
  // Hacer unifiedBanner disponible globalmente
  window.unifiedBanner = unifiedBanner;
  
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
      console.log('No se pudo cargar el perfil');
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
          updateAuthUI(user, { supabase, unifiedBanner });
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
    
          updateAuthUI(user, { supabase, unifiedBanner });
  } catch (error) {
    console.log('Supabase no disponible, modo offline activado');
    // El juego funciona sin autenticación
  }

  // Helper global para enviar invitaciones incluso si socialManager aún no está listo
  window.sendGameInvite = async function(friendId, roomCode) {
    try {
      if (!supabase || !friendId || !roomCode) return { success: false, error: new Error('Missing data') };
      const typesToTry = ['vs', 'sync', 'async'];
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
      console.error('[sendGameInvite] error:', e);
      return { success: false, error: e };
    }
  };

  // Sistema de amigos simplificado - funciona para todos los usuarios
  function createSimpleFriendsPanel() {
    if (document.getElementById('simpleFriendsPanel')) return;
    
    const panel = document.createElement('div');
    panel.id = 'simpleFriendsPanel';
    panel.style.cssText = `
      position: fixed;
      top: 70px;
      right: 10px;
      width: 340px;
      max-height: 500px;
      background: var(--card);
      border: 2px solid var(--cardBorder);
      border-radius: 16px;
      box-shadow: var(--shadow-lg);
      z-index: 9999;
      display: none;
      overflow: hidden;
      backdrop-filter: blur(12px);
    `;
    
    const user = getCurrentUser();
    const isLoggedIn = user && !user.isGuest;
    
    panel.innerHTML = `
      <div style="padding: 16px; border-bottom: 1px solid var(--cardBorder); background: rgba(139, 92, 246, 0.1);">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <h3 style="margin: 0; font-size: 18px; font-weight: 800;">Sistema de Amigos</h3>
          <button id="closeFriendsPanel" style="
            background: none;
            border: none;
            font-size: 20px;
            cursor: pointer;
            color: var(--text);
            padding: 0;
            transition: all 0.2s;
          ">✖</button>
        </div>
      </div>
      
      <div id="friendsPanelContent" style="
        padding: 20px;
        max-height: 400px;
        overflow-y: auto;
      ">
        ${isLoggedIn ? `
          <div style="text-align: center; padding: 20px;">
            <div style="font-size: 48px; margin-bottom: 16px;">🚀</div>
            <p style="color: var(--text); font-weight: 600; margin-bottom: 8px;">¡Próximamente!</p>
            <p style="color: var(--muted); font-size: 14px; line-height: 1.6;">
              El sistema de amigos está en desarrollo.<br>
              Pronto podrás:
            </p>
            <ul style="text-align: left; display: inline-block; color: var(--muted); font-size: 14px; margin-top: 12px; list-style: none; padding: 0;">
              <li style="margin: 6px 0;">✨ Agregar amigos por nickname</li>
              <li style="margin: 6px 0;">⚔️ Desafiar a partidas en vivo</li>
              <li style="margin: 6px 0;">🏆 Ver rankings entre amigos</li>
              <li style="margin: 6px 0;">📊 Comparar estadísticas</li>
              <li style="margin: 6px 0;">🎯 Enviar desafíos de 24 horas</li>
            </ul>
          </div>
        ` : `
          <div style="text-align: center; padding: 20px;">
            <div style="font-size: 48px; margin-bottom: 16px;">👥</div>
            <p style="color: var(--text); font-weight: 600; margin-bottom: 12px;">¡Únete a la comunidad!</p>
            <p style="color: var(--muted); font-size: 14px; margin-bottom: 16px;">
              Inicia sesión para desbloquear el sistema de amigos y competir con otros jugadores.
            </p>
            <button class="btn accent" id="btnLoginFromFriends" style="width: 100%;">
              Iniciar Sesión / Registrarse
            </button>
          </div>
        `}
      </div>
    `;
    
    document.body.appendChild(panel);
    
    // Eventos - SIN listener global de click
    setTimeout(() => {
      document.getElementById('closeFriendsPanel')?.addEventListener('click', (e) => {
        e.stopPropagation();
        panel.style.display = 'none';
      });
      
      document.getElementById('btnLoginFromFriends')?.addEventListener('click', (e) => {
        e.stopPropagation();
        panel.style.display = 'none';
        showSimpleAuthModal();
      });
    }, 100);
  }
  
  // Crear el panel al inicio
  createSimpleFriendsPanel();
  
  // Variable para controlar el estado del panel
  let friendsPanelOpen = false;
  
  // Manejador del botón de amigos - Simplificado
  document.getElementById('btnFriends')?.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    
    console.log('Click en botón de amigos');
    
    // Si hay panel del sistema completo y está activo, usarlo
    const fullPanel = document.getElementById('friendsPanel');
    if (fullPanel && window.socialManager) {
      console.log('Usando panel completo');
      fullPanel.classList.toggle('open');
      return;
    }
    
    // Si no, usar el panel simple
    let panel = document.getElementById('simpleFriendsPanel');
    if (!panel) {
      createSimpleFriendsPanel();
      panel = document.getElementById('simpleFriendsPanel');
    }
    
    if (panel) {
      // Toggle simple del panel
      friendsPanelOpen = !friendsPanelOpen;
      panel.style.display = friendsPanelOpen ? 'block' : 'none';
      console.log('Panel ahora está:', friendsPanelOpen ? 'abierto' : 'cerrado');
    }
  });
  
  // Cerrar panel al hacer click fuera (con delay para evitar conflictos)
  document.addEventListener('click', (e) => {
    const panel = document.getElementById('simpleFriendsPanel');
    const btn = document.getElementById('btnFriends');
    
    if (panel && friendsPanelOpen) {
      // Si el click no fue en el panel ni en el botón
      if (!panel.contains(e.target) && !btn.contains(e.target)) {
        setTimeout(() => {
          panel.style.display = 'none';
          friendsPanelOpen = false;
          console.log('Panel cerrado por click externo');
        }, 50);
      }
    }
  });
  
  // Indicador del modo seleccionado
  function updateModeIndicator() {
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
    console.error('[main] Error inicializando sistema de reporte:', error);
  }

  // Modal de Test de Bosses (Preproducción)
  const testBossModal = document.getElementById('testBossModal');
  const btnTestBoss = document.getElementById('btnTestBoss');
  const btnCloseTestBoss = document.getElementById('btnCloseTestBoss');
  
  if (btnTestBoss && testBossModal) {
    btnTestBoss.addEventListener('click', () => {
      testBossModal.classList.add('open');
    });
  }
  
  if (btnCloseTestBoss && testBossModal) {
    btnCloseTestBoss.addEventListener('click', () => {
      testBossModal.classList.remove('open');
    });
  }
  
  // Vincular botones de bosses en el modal de test
  document.querySelectorAll('.boss-test-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const bossKey = btn.dataset.boss;
      
      console.log('🎮 Test Boss clicked:', bossKey);
      console.log('🔍 window.startBossGame:', window.startBossGame);
      console.log('🔍 window.AdventureBosses:', window.AdventureBosses);
      
      // Cerrar modal
      if (testBossModal) {
        testBossModal.classList.remove('open');
      }
      
      // Intentar obtener startBossGame de diferentes fuentes
      const startBossGameFn = window.startBossGame || window.AdventureBosses?.startBossGame;
      
      if (startBossGameFn) {
        const handicap = {
          bossSpeed: 1,
          bossLives: 3,
          playerSpeed: 1,
          playerLives: 3,
          extraRows: 0
        };
        
        // Mostrar el área de juego de aventura
        const gameArea = document.getElementById('adventureGameArea');
        if (gameArea) {
          gameArea.style.display = 'block';
          console.log('✅ adventureGameArea mostrado');
        }
        
        // Ocultar el menú principal
        const mainCard = document.getElementById('configCard');
        if (mainCard) {
          mainCard.style.display = 'none';
        }
        
        startBossGameFn(bossKey, handicap, (won) => {
          const bossNames = {
            movies: '🎬 Reino del Cine',
            anime: '🎌 Valle Otaku',
            history: '📜 Tierra Antigua',
            geography: '🌍 Atlas Mundial',
            sports: '⚽ Campo Deportivo',
            science: '🔬 Reino de la Ciencia'
          };
          
          toast(won ? `¡Ganaste contra ${bossNames[bossKey]}!` : `Perdiste contra ${bossNames[bossKey]}`);
          
          // Volver al menú principal
          if (gameArea) gameArea.style.display = 'none';
          if (mainCard) mainCard.style.display = 'block';
          
          const fsAdventure = document.getElementById('fsAdventure');
          if (fsAdventure) fsAdventure.style.display = 'none';
        });
      } else {
        console.error('❌ startBossGame no está disponible. window:', window);
        toast('Error: Los bosses aún no están cargados. Intenta de nuevo en un momento.');
      }
    });
  });

  // Función para actualizar el estilo del botón Exit según el modo
  function updateExitButtonStyle() {
    const exitBtn = document.getElementById('btnExitGame');
    if (!exitBtn) return;
    
    const currentState = window.STATE || STATE;
    const isAsyncWaiting = currentState && currentState.mode === 'async' && 
      (currentState.status === 'waiting_for_opponent' || currentState.status === 'waiting_for_opponent_answer');
    
    console.log('🎨 Actualizando estilo del botón Exit:', {
      currentState,
      mode: currentState?.mode,
      status: currentState?.status,
      isAsyncWaiting
    });
    
    if (isAsyncWaiting) {
      // En modo asíncrono esperando rival: botón normal (no rojo)
      exitBtn.classList.remove('danger');
      exitBtn.classList.add('secondary');
      exitBtn.style.backgroundColor = '';
      exitBtn.style.color = '';
      console.log('✅ Botón Exit cambiado a modo asíncrono (no rojo)');
    } else {
      // En modo normal: botón rojo (danger)
      exitBtn.classList.remove('secondary');
      exitBtn.classList.add('danger');
      console.log('✅ Botón Exit cambiado a modo normal (rojo)');
    }
  }
  
  // Exponer función globalmente
  window.updateExitButtonStyle = updateExitButtonStyle;

  // Función para mostrar mensaje de partida asíncrona
  function showAsyncExitMessage() {
    console.log('🎯 showAsyncExitMessage() ejecutándose');
    const exitBtn = document.getElementById('btnExitGame');
    if (!exitBtn) {
      console.error('❌ No se encontró btnExitGame');
      return;
    }
    console.log('✅ btnExitGame encontrado:', exitBtn);

    // Crear o actualizar el mensaje
    let messageEl = document.getElementById('asyncExitMessage');
    if (!messageEl) {
      console.log('🎯 Creando nuevo mensaje asyncExitMessage');
      messageEl = document.createElement('div');
      messageEl.id = 'asyncExitMessage';
      // Detectar si estamos en modo oscuro
      const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
      
      messageEl.style.cssText = `
        margin-top: 12px;
        padding: 12px 16px;
        background: rgba(59, 130, 246, 0.15);
        border: 1px solid rgba(59, 130, 246, 0.4);
        border-radius: 8px;
        color: ${isDarkMode ? 'white' : 'black'};
        font-size: 15px;
        font-weight: 500;
        text-align: center;
        line-height: 1.5;
        box-shadow: 0 2px 4px rgba(59, 130, 246, 0.1);
        ${isDarkMode ? 'text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);' : ''}
      `;
      
      // Insertar después del botón Exit
      console.log('🎯 Insertando mensaje después del botón Exit');
      exitBtn.parentNode.insertBefore(messageEl, exitBtn.nextSibling);
      console.log('✅ Mensaje insertado:', messageEl);
    } else {
      console.log('🎯 Mensaje asyncExitMessage ya existe, actualizando texto');
    }
    
    messageEl.textContent = 'Puedes salir. Te notificaremos cuando el rival haya contestado.';
    console.log('✅ Texto del mensaje configurado');
    
    // En partidas asíncronas, el mensaje debe permanecer visible
    // No ocultar automáticamente
  }

  // Exponer función globalmente
  window.showAsyncExitMessage = showAsyncExitMessage;

  document.getElementById('btnExitGame')?.addEventListener('click', async ()=>{
    // Verificar si estamos en modo asíncrono esperando rival
    const currentState = window.STATE || STATE;
    const isAsyncWaiting = (currentState && currentState.mode === 'async' && 
      (currentState.status === 'waiting_for_opponent' || currentState.status === 'waiting_for_opponent_answer')) ||
      (window.currentGameMode === 'async' && window.currentAsyncMatchId);
    
    console.log('🚪 Botón Exit clickeado:', {
      currentState,
      mode: currentState?.mode,
      status: currentState?.status,
      isAsyncWaiting,
      vsActive: getVsActive(),
      currentAsyncMatchId: window.currentAsyncMatchId,
      currentGameMode: window.currentGameMode
    });
    
    if (isAsyncWaiting) {
      // En partidas asíncronas esperando rival, no mostrar confirmación
      console.log('🎮 Saliendo de partida asíncrona (esperando rival)');
      
      // Para partidas asíncronas, solo salir sin terminar el juego
      // No llamar a endGame() porque eso muestra resultados
      showConfigUI();
      setStatus('Listo', false);
      
      // Mostrar mensaje informativo debajo del botón Exit
      console.log('🎯 Llamando a showAsyncExitMessage()');
      showAsyncExitMessage();
      
      // Recargar el listado de partidas abiertas para actualizar el progreso
      setTimeout(() => {
        if (window.loadOpenMatches) {
          console.log('🔄 Recargando listado de partidas abiertas...');
          window.loadOpenMatches();
        }
      }, 1000);
    } else {
      console.log('🎮 Modo normal - mostrando confirmación');
      // Para partidas normales, mostrar confirmación
      if (!confirm('¿Seguro que querés salir de la partida?')) return;
      if (getVsActive()){
        await leaveMatch();
        setVsActive(false);
      } else {
        endGame();
      }
      showConfigUI();
      setStatus('Listo', false);
    }
  });

  document.getElementById('backVSResult')?.addEventListener('click', backToHome);
  document.getElementById('btnBackHome')?.addEventListener('click', backToHome);
  document.getElementById('btnShareResult')?.addEventListener('click', async ()=>{
    try{
      await navigator.share({ title:'Resultado VS', text: lastResultShareText || 'Jugué VS en Trivia' });
    }catch{}
  });

  document.getElementById('backSingleResult')?.addEventListener('click', ()=> { document.getElementById('fsSingleResult').style.display='none'; showConfigUI(); });
  document.getElementById('srHome')?.addEventListener('click', ()=> { document.getElementById('fsSingleResult').style.display='none'; showConfigUI(); });
  
  // Inicializar VS solo si Supabase está disponible
  if (supabase) {
    initVS({
      supabase,
      userId: Storage.get('vs_uid'),
      username: document.getElementById('playerName')?.value || 'Anon',
      callbacks: {
        onStatus: s => {
          // Limpiar textos de espera cuando no estamos esperando/ jugando
          if (s.status !== 'waiting' && s.status !== 'playing' && s.status !== 'searching'){
            const btnHost = document.getElementById('btnVsHost');
            if (btnHost){ btnHost.textContent = 'Crear Sala'; btnHost.classList.remove('friend-vs'); }
            const badge = document.getElementById('vsCodeBadge');
            if (badge){ badge.textContent = 'Sala: —'; badge.style.color = ''; }
          }
          if (s.status === 'searching'){
            const btn = document.getElementById('btnVsHost');
            const badge = document.getElementById('vsCodeBadge');
            if (btn) btn.textContent = 'Buscando rival...';
            if (badge) { badge.textContent = 'Emparejando...'; badge.style.color = 'var(--muted)'; }
          }
          if (s.status === 'peer-left' || s.status === 'abandoned'){
            alert('Tu rival abandonó la partida.');
            vsActive = false;
            showConfigUI();
            setStatus('Listo', false);
            // Limpiar badge de espera
            const badge = document.getElementById('vsCodeBadge');
            if (badge) {
              badge.textContent = 'Sala: —';
              badge.style.color = '';
            }
          } else if (s.status === 'waiting' && s.players && s.players.length > 1) {
            // Si alguien se unió, limpiar mensaje de espera
            const badge = document.getElementById('vsCodeBadge');
            if (badge && badge.textContent.includes('Esperando')) {
              badge.textContent = `Sala: ${s.code}`;
              badge.style.color = '';
            }
          } else {
            const txt = s.code ? `VS: ${s.status} · ${s.code}` : `VS: ${s.status}`;
            setStatus(txt, s.status==='waiting' || s.status==='playing');
          }
        },
        onQuestion: q => renderVSQuestion(q),
        onTimerTick: ({ remaining }) => {
          setVsHUD(typeof remaining === 'number' ? remaining : undefined);
          // Opcional: sonidos últimos 3s
          try {
            if (typeof remaining === 'number' && remaining <= 3 && remaining > 0) {
              playSound('wrong'); // usar sonido existente como beep suave
            }
          } catch {}
        },
        onEnd: payload => {
          if (window.showResults) {
            window.showResults(payload || {});
          }
        }
      }
    });

    // Inicializar VS Asíncrono
      const currentUser = window.getCurrentUser ? window.getCurrentUser() : null;
      let userId = currentUser?.id || Storage.get('vs_uid');
      
      // Limpiar userId si es "null" string
      if (userId === 'null' || userId === 'undefined') {
        userId = null;
        console.log('🔍 Limpiando userId inválido:', userId);
      }
      
      console.log('🔍 Debug initAsyncVS:', {
        currentUser: currentUser,
        userId: userId,
        storage_vs_uid: Storage.get('vs_uid'),
        isSameUser: currentUser?.id === Storage.get('vs_uid'),
        supabaseUser: supabase?.auth?.getUser ? 'available' : 'not available'
      });
      
      // Debug adicional: verificar si hay sesión de Supabase
      if (supabase?.auth) {
        supabase.auth.getUser().then(({ data: { user }, error }) => {
          console.log('🔍 Supabase User:', { user, error });
          if (user) {
            console.log('🔍 Supabase User ID:', user.id);
            console.log('🔍 Usando Supabase User ID en lugar de localStorage');
            // Usar el ID de Supabase si está disponible
            userId = user.id;
          }
        });
      }
      
      // Obtener el nombre del usuario de diferentes fuentes
      let username = document.getElementById('playerName')?.value;
      if (!username) {
        username = Storage.get('savedNickname');
      }
      if (!username) {
        username = currentUser?.user_metadata?.full_name;
      }
      if (!username) {
        username = 'Jugador';
      }
      
      console.log('🔍 Username para async VS:', { 
        playerName: document.getElementById('playerName')?.value,
        savedNickname: Storage.get('savedNickname'),
        fullName: currentUser?.user_metadata?.full_name,
        finalUsername: username
      });
      
      initAsyncVS({
        supabase,
        userId: userId,
        username: username,
        callbacks: {
          onStatus: (data) => {
            console.log('Async VS Status:', data);
            
            // Actualizar el estado global
            if (window.STATE) {
              window.STATE.status = data.status;
              console.log('🎮 Estado actualizado:', window.STATE);
            }
            
            if (data.status === 'waiting_for_opponent') {
              const badge = document.getElementById('vsCodeBadge');
              if (badge) badge.textContent = 'Esperando rival...';
              toast(data.message || 'Esperando que alguien acepte tu solicitud...');
            } else if (data.status === 'match_created') {
              const badge = document.getElementById('vsCodeBadge');
              if (badge) badge.textContent = `Partida: ${data.matchId}`;
              toast(`¡${data.opponent} aceptó tu desafío! Ve a "Partidas Abiertas" para jugar.`);
              
              // Actualizar la pestaña de partidas abiertas si está abierta
              const matchesTab = document.querySelector('.tab-btn[data-tab="matches"]');
              const matchesContent = document.getElementById('tabMatches');
              if (matchesTab && matchesContent && matchesContent.classList.contains('active')) {
                // Recargar partidas si el tab está activo
                if (window.loadOpenMatches) {
                  window.loadOpenMatches();
                }
              }
              
              // NO iniciar automáticamente el juego - el creador debe ir al menú de amigos
            }
          },
          onQuestion: (data) => {
            console.log('Async VS Question:', data);
          },
          onTimerTick: (data) => {
            console.log('Async VS Timer:', data);
          },
          onEnd: (data) => {
            console.log('Async VS End:', data);
          },
          onInvitation: (data) => {
            console.log('Async VS Invitation:', data);
          },
          onMatchUpdate: (data) => {
            console.log('Async VS Match Update:', data);
          }
        }
      });
  }

  const onHost = async ()=>{
    if (!supabase) { 
      alert('El modo VS no está disponible sin conexión'); 
      return; 
    }
    const opponentType = document.querySelector('#opponentPills .pill.active')?.dataset?.val || 'random';
    const cat = document.getElementById('categorySel')?.value;
    if(!cat || cat === '') { alert('Elegí una categoría'); return; }
    const { newAchievements, leveledUp } = await trackEvent('game_start');
    updatePlayerXPBar();
    if(leveledUp) toast("🎉 ¡Subiste de Nivel! 🎉");
    newAchievements.forEach(ach => toast(`🏆 ¡Logro desbloqueado: ${ach.title}!`));
    
    resetVsState();
    setVsActive(true);
    setVSName(getPlayerNameForGame());
    const rounds = parseInt(document.getElementById('vsRounds')?.value, 10);
    const diff = document.getElementById('vsDifficulty')?.value || document.getElementById('difficulty')?.value || 'easy';
    const pendingFriendId = Storage.get('pending_friend_invite');
    const pendingFriendName = Storage.get('pending_friend_name');

         if (opponentType === 'random' && !pendingFriendId){
           // Buscar rival aleatorio
           try {
             await startRandomMatch({ rounds, category: cat, difficulty: diff });
             const badge = document.getElementById('vsCodeBadge');
             if (badge) badge.textContent = 'Emparejando...';
             document.getElementById('btnVsHost').style.display = 'none';
             document.getElementById('btnVsCancel').style.display = 'block';
             return; // el flujo continúa cuando se encuentre rival
           } catch (e){
             console.error('Error iniciando matchmaking:', e);
             toast('No se pudo iniciar el emparejamiento');
             return;
           }
         }

         if (opponentType === 'random_async' && !pendingFriendId){
           // Buscar rival aleatorio asíncrono
           try {
             const result = await startAsyncRandomSearch({ rounds, category: cat, difficulty: diff });
             const badge = document.getElementById('vsCodeBadge');
             if (result.status === 'match_created') {
               if (badge) badge.textContent = `Partida: ${result.matchId}`;
               toast(`¡Partida asíncrona creada contra ${result.opponent}!`);
            } else {
              if (badge) badge.textContent = 'Esperando rival...';
              toast('Solicitud enviada. Esperando que alguien acepte...');
              // El botón btnViewRequests ya no existe, no intentar mostrarlo
            }
             return;
           } catch (e){
             console.error('Error iniciando matchmaking asíncrono:', e);
             toast('No se pudo iniciar el emparejamiento asíncrono');
             return;
           }
         }

    const code = await createMatch({ rounds, category: cat, difficulty: diff });
    console.log('Sala VS creada con código:', code);
    
    // Verificar si hay una invitación pendiente a un amigo
    
    console.log('Verificando invitación pendiente:');
    console.log('  - pendingFriendId:', pendingFriendId);
    console.log('  - pendingFriendName:', pendingFriendName);
    console.log('  - window.socialManager existe?', !!window.socialManager);
    
    if (pendingFriendId && (window.socialManager || supabase)) {
      console.log('Enviando invitación a amigo:');
      console.log('  - Friend ID:', pendingFriendId);
      console.log('  - Friend Name:', pendingFriendName);
      console.log('  - Room Code:', code);
      const useMgr = window.socialManager && typeof window.socialManager.inviteToSyncGame === 'function';
      const result = useMgr
        ? await window.socialManager.inviteToSyncGame(pendingFriendId, code)
        : await window.sendGameInvite(pendingFriendId, code);
      console.log('Resultado de envío de invitación:', result);
      if (result.success) {
        toast(`Invitación enviada a ${pendingFriendName}`);
        const badge = document.getElementById('vsCodeBadge');
        if (badge) badge.textContent = `Esperando a ${pendingFriendName}...`;
        Storage.set('last_vs_friend_id', pendingFriendId);
      } else {
        console.error('Error al enviar invitación:', result.error);
        toast('Error al enviar invitación');
        const badge = document.getElementById('vsCodeBadge');
        if (badge) badge.textContent = `Sala: ${code}`;
      }
    
    // Limpiar la invitación pendiente
        Storage.remove('pending_friend_invite');
        Storage.remove('pending_friend_name');
      
      // Restaurar el texto del botón y badge
      const btnHost = document.getElementById('btnVsHost');
      if (btnHost) {
        btnHost.textContent = 'Crear Sala';
        btnHost.classList.remove('friend-vs');
      }
      const badge = document.getElementById('vsCodeBadge');
      if (badge) {
        badge.style.color = '';
      }
    } else {
      const badge = document.getElementById('vsCodeBadge');
      if (badge) badge.textContent = `Sala: ${code}`;
    }
    
    setVsQTotal(rounds);
  };
  

  const onCancelSearch = async ()=>{
    if (window.cancelRandomSearch) {
      await window.cancelRandomSearch();
      document.getElementById('btnVsHost').style.display = 'block';
      document.getElementById('btnVsCancel').style.display = 'none';
      const badge = document.getElementById('vsCodeBadge');
      if (badge) badge.textContent = 'Sala: —';
    }
  };

  const onJoin = async ()=>{
    if (!supabase) { 
      alert('El modo VS no está disponible sin conexión'); 
      return; 
    }
    
    const code = document.getElementById('inputVsCode')?.value?.trim();
    if (!code) { 
      alert('Ingresá un código de sala'); 
      return; 
    }
    
    try {
      await joinMatch(code);
      setVsActive(true);
      document.getElementById('vsSection').style.display = 'none';
      document.getElementById('gameSection').style.display = 'block';
    } catch (error) {
      console.error('Error uniéndose a la sala:', error);
      alert('Error al unirse a la sala. Verificá el código.');
    }
  };



  // Limpiar estado de invitación pendiente si se cambia de modo manualmente
  document.querySelectorAll('#modeSeg .seg').forEach(seg => {
    seg.addEventListener('click', () => {
      // Si se cambia a otro modo que no sea VS, limpiar la invitación pendiente
      if (seg.dataset.val !== 'vs') {
        const pendingFriendId = Storage.get('pending_friend_invite');
        if (pendingFriendId) {
          Storage.remove('pending_friend_invite');
          Storage.remove('pending_friend_name');
          // Restaurar textos
          const btnHost = document.getElementById('btnVsHost');
          if (btnHost) {
            btnHost.textContent = 'Crear Sala';
            btnHost.classList.remove('friend-vs');
          }
          const badge = document.getElementById('vsCodeBadge');
          if (badge) {
            badge.textContent = 'Sala: —';
            badge.style.color = '';
          }
        }
      }
    });
  });
  
  // Event listeners VS (usando bindAllEventListeners más abajo)
  
  // Vincular todos los event listeners centralizados
  bindAllEventListeners({
    onStartGame: () => {
      const activeMode = document.querySelector('#modeSeg .seg.active')?.dataset?.val;
      if (activeMode === 'adventure') {
        if (window.AdventureMode && window.renderRegionNodes) {
          console.log('Iniciando modo aventura...');
          
          try {
            const savedData = Storage.get('adventure_progress');
            if (savedData) {
              if (!savedData || !savedData.currentRegion || !savedData.regions || 
                  !savedData.regions.movies || !savedData.regions.movies.nodes) {
                console.warn('Datos de aventura corruptos, limpiando...');
                Storage.remove('adventure_progress');
              }
            }
          } catch (e) {
            console.error('Error verificando datos, limpiando:', e);
            Storage.remove('adventure_progress');
          }
          
          window.AdventureMode.loadAdventureProgress();
          const state = window.AdventureMode.ADVENTURE_STATE;
          
          if (!state.currentRegion || !state.regions[state.currentRegion]) {
            console.error('Estado inválido, reiniciando...');
            window.AdventureMode.resetAdventureProgress();
            window.AdventureMode.loadAdventureProgress();
          }
          
          DOMUtils.getElement('configCard').style.display = 'none';
          DOMUtils.getElement('fsAdventure').style.display = 'block';
          window.renderRegionNodes(state.currentRegion);
        } else {
          console.error('Módulos de aventura no cargados');
          toast('Error: No se pudo cargar el modo aventura');
        }
      } else {
        startSolo();
      }
    },
    onHost,
    onCancelSearch,
    onJoin,
    onShowFriends: () => {
      import('./player/friends_ui.js').then(module => {
        if (module.toggleFriendsPanel) {
          module.toggleFriendsPanel();
        }
      }).catch(err => {
        console.error('Error al abrir lista de amigos:', err);
      });
    },
    onExitGame: async () => {
      const currentState = window.STATE || STATE;
      const isAsyncWaiting = (currentState && currentState.mode === 'async' && 
        (currentState.status === 'waiting_for_opponent' || currentState.status === 'waiting_for_opponent_answer')) ||
        (window.currentGameMode === 'async' && window.currentAsyncMatchId);
      
      if (isAsyncWaiting) {
        showConfigUI();
        setStatus('Listo', false);
        if (window.showAsyncExitMessage) showAsyncExitMessage();
        setTimeout(() => {
          if (window.loadOpenMatches) window.loadOpenMatches();
        }, 1000);
      } else {
        if (!confirm('¿Seguro que querés salir de la partida?')) return;
        if (getVsActive()) {
          await leaveMatch();
          setVsActive(false);
        } else {
          endGame();
        }
        showConfigUI();
        setStatus('Listo', false);
      }
    },
    onShareResult: async () => {
      try {
        await navigator.share({
          title: 'Resultado VS',
          text: lastResultShareText || 'Jugué VS en Trivia'
        });
      } catch {}
    },
    lastResultShareText
  });
  
  // Vincular botón de logout en el perfil (específico, no en bindings genéricos)
  DOMUtils.getElement('profileBtnLogout')?.addEventListener('click', async () => {
    if (confirm('¿Seguro que quieres cerrar sesión?')) {
      await AuthSystem.signOut();
      updateAuthUI(null, { supabase, unifiedBanner });
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
  

  // Toggle de oponente (Random / Amigo)
  document.querySelectorAll('#opponentPills .pill').forEach(p=>{
    p.addEventListener('click', ()=>{
      document.querySelectorAll('#opponentPills .pill').forEach(x=> x.classList.remove('active'));
      p.classList.add('active');
      // Si se cambia a amigo y estamos buscando, cancelar matchmaking
      if (p.dataset.val === 'friend' && isRandomSearching()){
        cancelRandomSearch();
      }
      
      // Si se selecciona "Amigos", abrir la lista de amigos
      if (p.dataset.val === 'friend') {
        // Importar y ejecutar la función para abrir la lista de amigos
        import('./player/friends_ui.js').then(module => {
          if (module.toggleFriendsPanel) {
            module.toggleFriendsPanel();
          }
        }).catch(err => {
          console.error('Error al abrir lista de amigos:', err);
        });
      }
      
      // Actualizar descripción del modo de juego
      updateGameModeDescription(p.dataset.val);
      
      // UI: si es amigo, pintar pista en botón
      const btnHost = document.getElementById('btnVsHost');
      if (p.dataset.val === 'friend'){
        btnHost.textContent = 'Crear sala';
      } else if (p.dataset.val === 'random'){
        btnHost.textContent = 'Buscar partida';
      }
    });
  });
  
  // SOLUCION OAUTH: Detectar token en la URL al cargar la página
  const urlHash = window.location.hash;
  if (urlHash && urlHash.includes('access_token') && supabase) {
    console.log('Token OAuth detectado en la URL');
    
    // Esperar un momento para que Supabase procese el hash automáticamente
    setTimeout(async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (session?.user) {
          console.log('Usuario autenticado exitosamente:', session.user);
          
          const userData = {
            id: session.user.id,
            email: session.user.email,
            name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
            avatar: session.user.user_metadata?.avatar_url || 'img/avatar_placeholder.svg',
            isGuest: false
          };
          
          // Guardar y actualizar UI
          Storage.set('current_user', userData);
          updateAuthUI(userData, { supabase, unifiedBanner });
          
          // Limpiar URL
          window.history.replaceState({}, document.title, window.location.pathname);
          
          toast('¡Login exitoso con Google!');
          
          // Verificar si necesita configurar nickname
          setTimeout(() => {
            checkAndShowNicknameModal();
          }, 1000);
          
        } else {
          console.log('No se pudo obtener la sesión');
        }
      } catch (error) {
        console.error('Error procesando OAuth callback:', error);
      }
    }, 2000);
  }
});
