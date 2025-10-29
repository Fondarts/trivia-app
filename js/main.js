// ============================================
// QUIZLE! - ARCHIVO PRINCIPAL
// Optimizado con nueva estructura de carpetas v3.0
// ============================================

// Core utilities
import { toast } from './game/ui.js';
import { initVisualEffects, showConfetti, showLevelUpEffect, addAnswerEffect, playSound } from './effects.js';
import { t, initI18n, updateUI as updateI18nUI } from './core/i18n.js';

// Game modules  
import { applyInitialUI, updatePlayerXPBar, bindStatsOpen, bindLeaderboardsOpen } from './game/ui.js';
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
function showGameUI(){
  const cfg = document.getElementById('configCard');
  const game = document.getElementById('gameArea');
  if (cfg) cfg.style.display = 'none';
  if (game){ game.style.display = 'block'; game.style.position='relative'; game.style.zIndex='1'; }
}
function showConfigUI(){
  const cfg = document.getElementById('configCard');
  const game = document.getElementById('gameArea');
  if (game) game.style.display   = 'none';
  if (cfg)  cfg.style.display    = 'block';
}

let vsQNo = 0;
let vsQTotal = null;
let vsActive = false;

function setVsHUD(sec){
  const hud = document.getElementById('kHUD');
  if (!hud) return;
  const left = (typeof sec==='number') ? ` · ${sec}s` : '';
  if (vsQTotal) hud.textContent = `${vsQNo}/${vsQTotal}${left}`;
  else          hud.textContent = `${vsQNo}${left}`;
}

function renderVSQuestion(q){
  vsActive = true;
  showGameUI();
  const qEl = document.getElementById('qText');
  const optionsEl = document.getElementById('options');
  if (qEl) qEl.textContent = q.question || '—'; 
  
  // Manejar imágenes en VS
  const mediaEl = document.getElementById('qMedia');
  if (mediaEl) {
    const img = mediaEl.querySelector('img');
    if (q.media || q.img) {
      const imgUrl = q.media || q.img;
      img.src = imgUrl;
      img.onload = () => mediaEl.style.display = 'block';
      img.onerror = () => mediaEl.style.display = 'none';
    } else {
      mediaEl.style.display = 'none';
    }
  }
  
  if (!optionsEl) return;

  optionsEl.style.pointerEvents = 'auto';
  optionsEl.innerHTML = '';
  const correctIdx = (q.answer ?? q.correct ?? q.ans ?? null);

  vsQNo++;
  if (q.total) vsQTotal = q.total;
  setVsHUD(q.timeLeft);

  let locked = false;
  const fire = async (i)=>{
    if (locked) return; locked = true;
    const btns = Array.from(optionsEl.children);
    btns.forEach((b, idx)=>{ if (idx === correctIdx) b.classList.add('correct'); });
    
    let results = {};
    if (correctIdx !== null && correctIdx !== undefined){
      if (i !== correctIdx) {
        btns[i]?.classList.add('wrong');
        addAnswerEffect(btns[i], false);
        playSound('wrong');
        results = await trackEvent('answer_wrong');
      } else {
        btns[i]?.classList.add('correct');
        addAnswerEffect(btns[i], true);
        playSound('correct');
        results = await trackEvent('answer_correct', { category: q.cat || 'vs', difficulty: q.diff || 'medium' });
      }
    }
    
    updatePlayerXPBar();
    if(results.leveledUp) {
      toast("🎉 ¡Subiste de Nivel! 🎉");
      showLevelUpEffect(document.querySelector('.container'));
      playSound('levelUp');
    }
    if(results.bonusToast) toast(results.bonusToast);
    results.newAchievements.forEach(ach => toast(`🏆 ¡Logro desbloqueado: ${ach.title}!`));

    document.querySelectorAll('#options .option').forEach(el=>el.classList.add('disabled'));
    try{ answer(i); }catch(e){ console.error(e); }
  };

  (q.options || []).forEach((txt, i)=>{
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'option';
    btn.textContent = String(txt ?? '');
    btn.addEventListener('click', (e)=>{ e.preventDefault(); fire(i); });
    optionsEl.appendChild(btn);
  });
}

let lastResultShareText = '';
async function showResults({scores, mePid, reason, winnerPid}){
  vsActive = false;
  vsQNo = 0; vsQTotal = null;
  
  // Obtener el ID del amigo si es una partida de amigos
  let friendId = null;
  const pendingFriendId = localStorage.getItem('last_vs_friend_id');
  
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
  const badge = document.getElementById('vsCodeBadge');
  if (badge) {
    badge.textContent = 'Sala: —';
    badge.style.color = '';
  }

  const fs = document.getElementById('fsVSResult');
  if (!fs) { showConfigUI(); return; }

  const arr = Object.entries(scores || {}).map(([pid, s])=>({
    pid, name: s?.name || 'Jugador', correct: s?.correct || 0
  })).sort((a,b)=> b.correct - a.correct);

  const meIdx = Math.max(0, arr.findIndex(x=> x.pid===mePid));
  const rivalIdx = meIdx === 0 ? 1 : 0;
  const meName = document.getElementById('playerName')?.value?.trim() || (arr[meIdx]?.name || 'Vos');
  const rivalName = arr[rivalIdx]?.name || 'rival';
  const meScore = arr[meIdx]?.correct ?? 0;
  const rivalScore = arr[rivalIdx]?.correct ?? 0;
  // prioridad: victoria por abandono
  let won = meScore > rivalScore;
  const wonByForfeit = (reason === 'opponent_left' && (!winnerPid || winnerPid === mePid));
  if (wonByForfeit) won = true;
  if (friendId && window.socialManager) {
    console.log('Actualizando ranking con amigo:', friendId, 'Ganó:', won);
    await window.socialManager.updateFriendRanking(friendId, won);
  }
  
  // Limpiar el ID del amigo guardado
  localStorage.removeItem('last_vs_friend_id');
  
  const results = await trackEvent('game_finish', { mode: 'vs', won });
  updatePlayerXPBar();
  if(results.leveledUp) {
    toast("🎉 ¡Subiste de Nivel! 🎉");
    showLevelUpEffect(document.querySelector('.container'));
    playSound('levelUp');
  }
  if(won) {
    showConfetti();
  }
  if(results.bonusToast) toast(results.bonusToast);
  results.newAchievements.forEach(ach => setTimeout(() => toast(`🏆 ¡Logro desbloqueado: ${ach.title}!`), 500));

  const heroTitle = fs.querySelector('.hero .big-title');
  const subtitle  = fs.querySelector('.hero .subtitle');
  const scoreEl   = fs.querySelector('.hero .bigscore');

  if (meScore === rivalScore) {
    heroTitle.textContent = '¡Empate!';
    subtitle.textContent  = `Buen duelo con ${rivalName}.`;
  } else if (won){
    heroTitle.textContent = '¡Felicitaciones!';
    subtitle.textContent  = `Le ganaste a ${rivalName}.`;
  } else {
    heroTitle.textContent = 'Perdiste';
    subtitle.innerHTML    = `Contra ${rivalName}. Te irá mejor la próxima. <span class="maybe">(quizás)</span>`;
  }
  // Mostrar/ocultar marcador según motivo
  if (typeof wonByForfeit !== 'undefined' && wonByForfeit) {
    if (scoreEl) scoreEl.style.display = 'none';
  } else {
    if (scoreEl) { scoreEl.style.display = ''; scoreEl.textContent = `${meScore} vs ${rivalScore}`; }
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
    subtitle.textContent  = `${rivalName} abandono la partida.`;
  }

  fs.style.display = 'block';
  window.scrollTo(0,0);
}

async function backToHome(){
  try { await leaveMatch(); } catch {}
  vsActive = false;
  document.getElementById('fsVSResult').style.display='none';
  showConfigUI();
  setStatus('Listo', false);
  
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
  const badge = document.getElementById('vsCodeBadge');
  if (badge) {
    badge.textContent = 'Sala: —';
    badge.style.color = '';
  }
}

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
  
  // Función para obtener el nombre para jugar
  function getPlayerNameForGame() {
    const user = AuthSystem.getCurrentUser();
    if (user && !user.isGuest) {
      // Si está logueado, usar el nickname guardado
      const savedNickname = localStorage.getItem('user_nickname_' + user.id);
      return savedNickname || user.name?.split(' ')[0] || 'Jugador';
    } else {
      // Si no está logueado, usar el valor del input
      return document.getElementById('playerName')?.value?.trim() || 'Anónimo';
    }
  }
  
  // Función para actualizar UI según estado de auth
  async function updateAuthUI(user) {
    const authSection = document.getElementById('authSection');
    const welcomeSection = document.getElementById('welcomeSection');
    const guestNameSection = document.getElementById('guestNameSection');
    const playerNameInput = document.getElementById('playerName');
    const profileNicknameSection = document.getElementById('profileNicknameSection');
    const profileNicknameMain = document.getElementById('profileNicknameMain');
    const profileNicknameText = document.getElementById('profileNicknameText');
    
    // Elementos del perfil
    const profileAvatar = document.getElementById('profileAvatar');
    const profileAuthSection = document.getElementById('profileAuthSection');
    const profileActionsSection = document.getElementById('profileActionsSection');
    const profileLevelBadge = document.getElementById('profileLevelBadge');
    const profileXpBar = document.getElementById('profileXpBar');
    const profileXpText = document.getElementById('profileXpText');
    
    if (user && !user.isGuest) {
      // Usuario logueado con Google - OCULTAR sección de auth y nombre
      if (authSection) authSection.style.display = 'none';
      if (guestNameSection) guestNameSection.style.display = 'none';
      
      // Cargar nickname desde el servidor o localmente
      let savedNickname = localStorage.getItem('user_nickname_' + user.id);
      
      // Intentar cargar desde el servidor si hay conexión
      if (supabase && !user.isGuest) {
        try {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('nickname, level, total_xp')
            .eq('user_id', user.id)
            .single();
          
          if (profile && profile.nickname) {
            // Solo usar el nickname del servidor si no hay uno local más reciente
            const localNickname = localStorage.getItem('user_nickname_' + user.id);
            if (!localNickname) {
              savedNickname = profile.nickname;
              // Guardar localmente para acceso offline
              localStorage.setItem('user_nickname_' + user.id, savedNickname);
              localStorage.setItem('user_has_nickname_' + user.id, 'true');
            } else {
              // Usar el nickname local (más reciente)
              savedNickname = localNickname;
            }
            
            // Actualizar nivel y XP si existen (solo si no hay datos locales más recientes)
            const localStats = JSON.parse(localStorage.getItem('trivia_stats') || '{}');
            const hasLocalData = localStats.totalXP && localStats.totalXP > 0;
            
            if (!hasLocalData) {
              if (profile.level && profileLevelBadge) {
                profileLevelBadge.innerHTML = `<span data-i18n="level">Nivel</span> ${profile.level}`;
              }
              if (profile.total_xp !== undefined) {
                const { currentLevelXP, xpForNextLevel, progressPercent } = getLevelProgress(profile.total_xp);
                if (profileXpBar) profileXpBar.style.width = `${progressPercent}%`;
                if (profileXpText) profileXpText.textContent = `${currentLevelXP} / ${xpForNextLevel} XP`;
              }
            } else {
              console.log('📊 Usando datos locales en lugar de servidor');
              // Usar la función de actualización que lee de localStorage
              if (typeof window.updatePlayerXPBar === 'function') {
                window.updatePlayerXPBar();
              }
            }
          }
        } catch (error) {
          console.log('No se pudo cargar el perfil del servidor, usando datos locales');
        }
      }
      
      // Verificar si necesita elegir nickname (para nuevos usuarios)
      if (!savedNickname) {
        // Mostrar modal de nickname obligatorio
        setTimeout(() => {
          checkAndShowNicknameModal();
        }, 1000);
        
        // Ocultar mensaje de bienvenida mientras tanto
        if (welcomeSection) welcomeSection.style.display = 'none';
      } else {
        if (welcomeSection) welcomeSection.style.display = 'none';
      }
      
      // Ocultar completamente la sección de nickname en el perfil
      if (profileNicknameSection) profileNicknameSection.style.display = 'none';
      
      // Mostrar el nickname en el perfil (debajo del avatar)
      if (profileNicknameText) {
        profileNicknameText.textContent = savedNickname || 'Sin nickname';
      }
      
      // Actualizar avatar
      if (profileAvatar) {
        console.log('🖼️ ===== DEBUG AVATAR =====');
        console.log('🖼️ Usuario completo:', user);
        console.log('🖼️ Avatar URL:', user.avatar);
        console.log('🖼️ Metadata completa:', user.metadata);
        console.log('🖼️ Elemento avatar encontrado:', !!profileAvatar);
        console.log('🖼️ ========================');
        
        if (user.avatar && user.avatar !== 'img/avatar_placeholder.svg' && user.avatar !== 'img/avatarman.webp') {
          console.log('🖼️ Intentando cargar avatar de Google:', user.avatar);
          // Intentar cargar el avatar del usuario
          const avatarImg = new Image();
          avatarImg.onload = () => {
            console.log('✅ Avatar de Google cargado correctamente:', user.avatar);
            profileAvatar.src = user.avatar;
          };
          avatarImg.onerror = () => {
            console.log('⚠️ Avatar de Google falló, usando placeholder');
            profileAvatar.src = 'img/avatarman.webp';
          };
          avatarImg.src = user.avatar;
        } else {
          // Usar placeholder por defecto
          console.log('🖼️ No hay avatar de Google, usando placeholder por defecto');
          profileAvatar.src = 'img/avatarman.webp';
        }
      }
      if (profileAuthSection) profileAuthSection.style.display = 'none';
      if (profileActionsSection) profileActionsSection.style.display = 'block';
      
      // Inicializar sistema de amigos si tiene nickname
      if (savedNickname && supabase) {
        try {
          console.log('Inicializando sistema de amigos para:', savedNickname);
          // IMPORTANTE: Primero inicializar el sistema social básico
          const socialManager = initFriendsSystem(supabase, user.id, savedNickname);
          
          // Solo inicializar la UI si el sistema social se creó correctamente
          if (socialManager) {
            console.log('Sistema social creado, inicializando UI...');
            // Esperar un momento para asegurar que window.socialManager esté disponible
            setTimeout(() => {
              initFriendsUI(supabase, user.id, savedNickname);
            }, 100);
          } else {
            console.error('No se pudo crear el sistema social');
          }
        } catch (error) {
          console.error('Error iniciando sistema de amigos:', error);
        }
      }
      
      // Inicializar sincronización de perfil
      if (supabase && user.id) {
        try {
          console.log('🔄 Inicializando sincronización de perfil para:', user.id);
          initProfileSync(supabase, user.id);
          
          // En Android, usar sincronización forzada después de un delay mayor
          const isAndroid = window.Capacitor && window.Capacitor.getPlatform() === 'android';
          const delay = isAndroid ? 3000 : 2000;
          
          setTimeout(() => {
            if (isAndroid && window.forceFullSync) {
              console.log('🔄 Forzando sincronización completa en Android...');
              window.forceFullSync().catch(e => console.error('Error en sync completa:', e));
            } else if (window.forceSyncProfile) {
              console.log('🔄 Forzando sincronización inmediata...');
              window.forceSyncProfile().catch(e => console.error('Error en sync forzada:', e));
            }
          }, delay);
        } catch (error) {
          console.error('❌ Error iniciando sincronización de perfil:', error);
        }
      }
      
      // Actualizar avatar en el header
      const headerAvatar = document.querySelector('.avatar-btn img');
      if (headerAvatar && user.avatar) headerAvatar.src = user.avatar;
      
      // Actualizar el input oculto de playerName con el nickname
      if (playerNameInput) {
        playerNameInput.value = savedNickname || user.name?.split(' ')[0] || 'Jugador';
      }
      
      // Mostrar banner en menú principal (Android + Web)
      if (unifiedBanner) {
        // Delay para asegurar que la UI esté lista
        setTimeout(async () => {
          console.log('🔄 Intentando mostrar banner en menú principal...');
          const success = await unifiedBanner.showBanner();
          if (success) {
            console.log('✅ Banner mostrado en menú principal');
          } else {
            console.log('❌ Fallo al mostrar banner en menú principal');
          }
        }, 1000);
      }
      
    } else if (user && user.isGuest) {
      // Usuario invitado
      if (authSection) authSection.style.display = 'block';
      if (welcomeSection) welcomeSection.style.display = 'none';
      if (guestNameSection) guestNameSection.style.display = 'block';
      if (profileNicknameSection) profileNicknameSection.style.display = 'none';
      if (playerNameInput) {
        playerNameInput.value = user.name || 'Invitado';
        playerNameInput.disabled = false;
      }
      if (profileAuthSection) profileAuthSection.style.display = 'block';
      if (profileActionsSection) profileActionsSection.style.display = 'none';
      
      // Mostrar "Invitado" como nickname
      if (profileNicknameText) profileNicknameText.textContent = 'Invitado';
      
      // Limpiar información del perfil cuando es invitado
      if (profileLevelBadge) profileLevelBadge.innerHTML = '<span data-i18n="level">Nivel</span> 1';
      if (profileXpBar) profileXpBar.style.width = '0%';
      if (profileXpText) profileXpText.textContent = '0 / 100 XP';
      
    } else {
      // No logueado
      if (authSection) authSection.style.display = 'block';
      if (welcomeSection) welcomeSection.style.display = 'none';
      if (guestNameSection) guestNameSection.style.display = 'block';
      if (profileNicknameSection) profileNicknameSection.style.display = 'none';
      if (playerNameInput) {
        playerNameInput.value = '';
        playerNameInput.disabled = false;
      }
      if (profileAuthSection) profileAuthSection.style.display = 'block';
      if (profileActionsSection) profileActionsSection.style.display = 'none';
      
      // Sin nickname
      if (profileNicknameText) profileNicknameText.textContent = '—';
      
      // Limpiar información del perfil
      if (profileLevelBadge) profileLevelBadge.innerHTML = '<span data-i18n="level">Nivel</span> 1';
      if (profileXpBar) profileXpBar.style.width = '0%';
      if (profileXpText) profileXpText.textContent = '0 / 100 XP';
      if (profileAvatar) profileAvatar.src = 'img/avatar_placeholder.svg';
      
      // Limpiar avatar del header
      const headerAvatar = document.querySelector('.avatar-btn img');
      if (headerAvatar) headerAvatar.src = 'img/avatar_placeholder.svg';
    }
  }
  
  // Vincular botón de mostrar auth
  document.getElementById('btnShowAuth')?.addEventListener('click', () => {
    showSimpleAuthModal();
  });
  
  // Ya NO necesitamos el botón de guardar nickname porque se hace desde el modal obligatorio
  
  // Vincular botón de auth en el perfil
  document.getElementById('profileBtnAuth')?.addEventListener('click', () => {
    // Cerrar modal de perfil
    const profileModal = document.getElementById('profileModal');
    if (profileModal) profileModal.classList.remove('open');
    // Mostrar modal de auth
    showSimpleAuthModal();
  });
  
  // Vincular botón de logout en el perfil
  document.getElementById('profileBtnLogout')?.addEventListener('click', async () => {
    if (confirm('¿Seguro que quieres cerrar sesión?')) {
      await AuthSystem.signOut();
      updateAuthUI(null);
      // Limpiar datos del perfil
      document.getElementById('profileNicknameText').textContent = '—';
      document.getElementById('profileLevelBadge').innerHTML = '<span data-i18n="level">Nivel</span> 1';
      document.getElementById('profileXpBar').style.width = '0%';
      document.getElementById('profileXpText').textContent = '0 / 100 XP';
      document.getElementById('profileAvatar').src = 'img/avatar_placeholder.svg';
      document.querySelector('.avatar-btn img').src = 'img/avatar_placeholder.svg';
      // Cerrar modal de perfil
      const profileModal = document.getElementById('profileModal');
      if (profileModal) profileModal.classList.remove('open');
    }
  });
  
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
      updateAuthUI(user);
      if (user) {
        setTimeout(() => {
          checkAndShowNicknameModal();
        }, 1000);
      }
    };
    
    // Verificar si venimos de un callback OAuth
    if (localStorage.getItem('auth_success') === 'true') {
      localStorage.removeItem('auth_success');
      toast('¡Login exitoso con Google!');
      setTimeout(() => {
        checkAndShowNicknameModal();
      }, 1000);
    }
    
    updateAuthUI(user);
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
            from_user_id: (window.socialManager?.userId) || JSON.parse(localStorage.getItem('current_user')||'{}').id,
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
  
  document.getElementById('btnStart')?.addEventListener('click', () => {
    const activeMode = document.querySelector('#modeSeg .seg.active')?.dataset?.val;
    if (activeMode === 'adventure') {
      // Verificar que los módulos de aventura estén cargados
      if (window.AdventureMode && window.renderRegionNodes) {
        console.log('Iniciando modo aventura...');
        
        // Verificar y limpiar datos corruptos antes de cargar
        try {
          const savedData = localStorage.getItem('adventure_progress');
          if (savedData) {
            const parsed = JSON.parse(savedData);
            // Si hay problemas con los datos, limpiarlos
            if (!parsed || !parsed.currentRegion || !parsed.regions || 
                !parsed.regions.movies || !parsed.regions.movies.nodes) {
              console.warn('Datos de aventura corruptos, limpiando...');
              localStorage.removeItem('adventure_progress');
            }
          }
        } catch (e) {
          console.error('Error verificando datos, limpiando:', e);
          localStorage.removeItem('adventure_progress');
        }
        
        // Cargar progreso de aventura
        window.AdventureMode.loadAdventureProgress();
        
        // Verificar que el estado sea válido
        const state = window.AdventureMode.ADVENTURE_STATE;
        console.log('Estado de aventura:', state);
        
        if (!state.currentRegion || !state.regions[state.currentRegion]) {
          console.error('Estado inválido, reiniciando...');
          window.AdventureMode.resetAdventureProgress();
          window.AdventureMode.loadAdventureProgress();
        }
        
        // Mostrar pantalla de aventura
        document.getElementById('configCard').style.display = 'none';
        document.getElementById('fsAdventure').style.display = 'block';
        
        // Renderizar el mapa de la región actual
        console.log('Renderizando región:', state.currentRegion);
        window.renderRegionNodes(state.currentRegion);
        
        // NO iniciar automáticamente el primer nivel (dejar que el usuario haga click)
      } else {
        console.error('Módulos de aventura no cargados');
        console.error('AdventureMode:', window.AdventureMode);
        console.error('renderRegionNodes:', window.renderRegionNodes);
        toast('Error: No se pudo cargar el modo aventura');
      }
    } else {
      startSolo();
    }
  });
  document.getElementById('btnNext')?.addEventListener('click', nextQuestion);
  bindLeaderboardsOpen(renderLB);
  bindStatsOpen();

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

  document.getElementById('btnExitGame')?.addEventListener('click', async ()=>{
    // Verificar si estamos en modo asíncrono esperando rival
    const currentState = window.STATE || STATE;
    const isAsyncWaiting = currentState && currentState.mode === 'async' && 
      (currentState.status === 'waiting_for_opponent' || currentState.status === 'waiting_for_opponent_answer');
    
    console.log('🚪 Botón Exit clickeado:', {
      currentState,
      mode: currentState?.mode,
      status: currentState?.status,
      isAsyncWaiting,
      vsActive
    });
    
    if (isAsyncWaiting) {
      // En partidas asíncronas esperando rival, no mostrar confirmación
      console.log('🎮 Saliendo de partida asíncrona (esperando rival)');
      
      // Para partidas asíncronas, solo salir sin terminar el juego
      // No llamar a endGame() porque eso muestra resultados
      showConfigUI();
      setStatus('Listo', false);
      
      // Mostrar mensaje informativo
      toast('Puedes salir y volver al menú de amigos. Te notificaremos cuando tu rival responda.');
    } else {
      // Para partidas normales, mostrar confirmación
      if (!confirm('¿Seguro que querés salir de la partida?')) return;
      if (vsActive){
        await leaveMatch();
        vsActive = false;
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
      userId: localStorage.getItem('vs_uid'),
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
        onEnd: payload => showResults(payload || {})
      }
    });

    // Inicializar VS Asíncrono
      const currentUser = window.getCurrentUser ? window.getCurrentUser() : null;
      let userId = currentUser?.id || localStorage.getItem('vs_uid');
      
      // Limpiar userId si es "null" string
      if (userId === 'null' || userId === 'undefined') {
        userId = null;
        console.log('🔍 Limpiando userId inválido:', userId);
      }
      
      console.log('🔍 Debug initAsyncVS:', {
        currentUser: currentUser,
        userId: userId,
        localStorage_vs_uid: localStorage.getItem('vs_uid'),
        isSameUser: currentUser?.id === localStorage.getItem('vs_uid'),
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
        username = localStorage.getItem('savedNickname');
      }
      if (!username) {
        username = currentUser?.user_metadata?.full_name;
      }
      if (!username) {
        username = 'Jugador';
      }
      
      console.log('🔍 Username para async VS:', { 
        playerName: document.getElementById('playerName')?.value,
        savedNickname: localStorage.getItem('savedNickname'),
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
    
    vsQNo = 0; vsQTotal = null; vsActive = true;
    setVSName(getPlayerNameForGame());
    const rounds = parseInt(document.getElementById('vsRounds')?.value, 10);
    const diff = document.querySelector('#diffPills .pill.active')?.dataset.val;
    const pendingFriendId = localStorage.getItem('pending_friend_invite');
    const pendingFriendName = localStorage.getItem('pending_friend_name');

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
        localStorage.setItem('last_vs_friend_id', pendingFriendId);
      } else {
        console.error('Error al enviar invitación:', result.error);
        toast('Error al enviar invitación');
        const badge = document.getElementById('vsCodeBadge');
        if (badge) badge.textContent = `Sala: ${code}`;
      }
    
    // Limpiar la invitación pendiente
        localStorage.removeItem('pending_friend_invite');
        localStorage.removeItem('pending_friend_name');
      
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
    
    vsQTotal = rounds;
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
      vsActive = true;
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
        const pendingFriendId = localStorage.getItem('pending_friend_invite');
        if (pendingFriendId) {
          localStorage.removeItem('pending_friend_invite');
          localStorage.removeItem('pending_friend_name');
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
  
  document.getElementById('btnVsHost')?.addEventListener('click', onHost);
  document.getElementById('btnVsCancel')?.addEventListener('click', onCancelSearch);
  document.getElementById('btnVsJoin')?.addEventListener('click', onJoin);
  

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
          localStorage.setItem('current_user', JSON.stringify(userData));
          updateAuthUI(userData);
          
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
