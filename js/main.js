// ============================================
// QUIZLE! - ARCHIVO PRINCIPAL
// Optimizado con nueva estructura de carpetas v3.0
// ============================================

// Core utilities
import { toast } from './game/ui.js';
import { initVisualEffects, showConfetti, showLevelUpEffect, addAnswerEffect, playSound } from './effects.js';

// Game modules  
import { applyInitialUI, updatePlayerXPBar, bindStatsOpen, bindLeaderboardsOpen } from './game/ui.js';
import { startSolo, nextQuestion, endGame } from './game/solo.js';
import { initVS, createMatch, joinMatch, answer, setVSName, leaveMatch } from './game/vs.js';

// Player modules
import { renderLB } from './player/leaderboard.js';
import { trackEvent } from './player/stats.js';
import { getLevelProgress } from './player/experience.js';
import { initProfileSync } from './player/profile_sync.js';
import { getCurrentUser, signOut, initGoogleAuth } from './auth/google.js';
import { injectSimpleAuthStyles, showSimpleAuthModal } from './auth/modal.js';
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
async function showResults({scores, mePid}){
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
  const won = meScore > rivalScore;
  
  // Actualizar rankings si es una partida entre amigos
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
  scoreEl.textContent = `${meScore} vs ${rivalScore}`;

  lastResultShareText = won ? `Te gané ${rivalName}: ${meScore}–${rivalScore} en Trivia. ¿Revancha?` : `Perdí contra ${rivalName}: ${meScore}–${rivalScore} en Trivia. ¡La próxima te gano!`;

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
  // Inicializar efectos visuales
  initVisualEffects();
  
  // Esperar a que el banco esté cargado
  await waitForBank();
  console.log('Banco listo, inicializando aplicación...');
  
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
  window.getCurrentUser = getCurrentUser;
  window.signOut = signOut;
  window.initGoogleAuth = initGoogleAuth;
  window.showSimpleAuthModal = showSimpleAuthModal;
  window.checkAndShowNicknameModal = checkAndShowNicknameModal;
  window.initFriendsSystem = initFriendsSystem;
  window.toast = toast;
  
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
    const user = getCurrentUser();
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
            savedNickname = profile.nickname;
            // Guardar localmente para acceso offline
            localStorage.setItem('user_nickname_' + user.id, savedNickname);
            localStorage.setItem('user_has_nickname_' + user.id, 'true');
            
            // Actualizar nivel y XP si existen
            if (profile.level && profileLevelBadge) {
              profileLevelBadge.innerHTML = `<span data-i18n="level">Nivel</span> ${profile.level}`;
            }
            if (profile.total_xp !== undefined) {
              const { currentLevelXP, xpForNextLevel, progressPercent } = getLevelProgress(profile.total_xp);
              if (profileXpBar) profileXpBar.style.width = `${progressPercent}%`;
              if (profileXpText) profileXpText.textContent = `${currentLevelXP} / ${xpForNextLevel} XP`;
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
      if (profileAvatar && user.avatar) profileAvatar.src = user.avatar;
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
          initProfileSync(supabase, user.id);
        } catch (error) {
          console.log('Error iniciando sincronización de perfil:', error);
        }
      }
      
      // Actualizar avatar en el header
      const headerAvatar = document.querySelector('.avatar-btn img');
      if (headerAvatar && user.avatar) headerAvatar.src = user.avatar;
      
      // Actualizar el input oculto de playerName con el nickname
      if (playerNameInput) {
        playerNameInput.value = savedNickname || user.name?.split(' ')[0] || 'Jugador';
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
      await signOut();
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
  window.getCurrentUser = getCurrentUser;
  
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
    const user = await initGoogleAuth(supabase);
    updateAuthUI(user);
  } catch (error) {
    console.log('Supabase no disponible, modo offline activado');
    // El juego funciona sin autenticación
  }

  // Manejador simple para el botón de amigos cuando no está logueado
  document.getElementById('btnFriends')?.addEventListener('click', () => {
    // Si no hay usuario logueado, mostrar mensaje
    const user = getCurrentUser();
    if (!user || user.isGuest) {
      toast('Inicia sesión para acceder al sistema de amigos');
      showSimpleAuthModal();
    } else {
      // Si el panel no existe, crearlo
      if (!document.getElementById('friendsPanel')) {
        console.log('Panel de amigos no existe, intentando crear...');
        // Intentar inicializar el sistema de amigos si no está inicializado
        if (window.socialManager && !document.getElementById('friendsPanel')) {
          // Crear el panel manualmente
          const panel = document.createElement('div');
          panel.id = 'friendsPanel';
          panel.className = 'friends-panel';
          panel.innerHTML = `
            <div class="friends-header">
              <h3>Amigos</h3>
              <button class="iconbtn" id="btnCloseFriends">✖</button>
            </div>
            <div class="friends-tab-content active">
              <div class="empty-state">Sistema de amigos no disponible. Por favor recarga la página.</div>
            </div>
          `;
          document.body.appendChild(panel);
          
          document.getElementById('btnCloseFriends')?.addEventListener('click', () => {
            panel.classList.remove('open');
          });
        }
      }
      
      // Intentar abrir el panel
      const panel = document.getElementById('friendsPanel');
      if (panel) {
        panel.classList.toggle('open');
      }
    }
  });
  
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

  document.getElementById('btnExitGame')?.addEventListener('click', async ()=>{
    if (!confirm('¿Seguro que querés salir de la partida?')) return;
    if (vsActive){
      await leaveMatch();
      vsActive = false;
    } else {
      endGame();
    }
    showConfigUI();
    setStatus('Listo', false);
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
        onEnd: payload => showResults(payload || {})
      }
    });
  }

  const onHost = async ()=>{
    if (!supabase) { 
      alert('El modo VS no está disponible sin conexión'); 
      return; 
    }
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
    const code = await createMatch({ rounds, category: cat, difficulty: diff });
    console.log('Sala VS creada con código:', code);
    
    // Verificar si hay una invitación pendiente a un amigo
    const pendingFriendId = localStorage.getItem('pending_friend_invite');
    const pendingFriendName = localStorage.getItem('pending_friend_name');
    
    console.log('Verificando invitación pendiente:');
    console.log('  - pendingFriendId:', pendingFriendId);
    console.log('  - pendingFriendName:', pendingFriendName);
    console.log('  - window.socialManager existe?', !!window.socialManager);
    
    if (pendingFriendId && window.socialManager) {
      console.log('Enviando invitación a amigo:');
      console.log('  - Friend ID:', pendingFriendId);
      console.log('  - Friend Name:', pendingFriendName);
      console.log('  - Room Code:', code);
      console.log('  - socialManager.inviteToSyncGame existe?', typeof window.socialManager.inviteToSyncGame);
      
      if (typeof window.socialManager.inviteToSyncGame !== 'function') {
        console.error('ERROR: inviteToSyncGame no es una función!');
        console.log('Métodos disponibles en socialManager:', Object.keys(window.socialManager));
        toast('Error: Sistema de invitaciones no disponible');
      } else {
        // Enviar invitación al amigo
        const result = await window.socialManager.inviteToSyncGame(pendingFriendId, code);
        console.log('Resultado de inviteToSyncGame:', result);
        
        if (result.success) {
          toast(`Invitación enviada a ${pendingFriendName}`);
          document.getElementById('vsCodeBadge').textContent = `Esperando a ${pendingFriendName}...`;
          // Guardar el ID del amigo para los rankings
          localStorage.setItem('last_vs_friend_id', pendingFriendId);
        } else {
          console.error('Error al enviar invitación:', result.error);
          toast('Error al enviar invitación');
          document.getElementById('vsCodeBadge').textContent = `Sala: ${code}`;
        }
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
      document.getElementById('vsCodeBadge').textContent = `Sala: ${code}`;
    }
    
    vsQTotal = rounds;
  };
  
  const onJoin = async ()=>{
    if (!supabase) { 
      alert('El modo VS no está disponible sin conexión'); 
      return; 
    }
    const { newAchievements, leveledUp } = await trackEvent('game_start');
    updatePlayerXPBar();
    if(leveledUp) toast("🎉 ¡Subiste de Nivel! 🎉");
    newAchievements.forEach(ach => toast(`🏆 ¡Logro desbloqueado: ${ach.title}!`));

    vsQNo = 0; vsQTotal = null; vsActive = true;
    setVSName(getPlayerNameForGame());
    const code = document.getElementById('inputVsCode')?.value?.trim();
    if (!code){ alert('Ingresá un código'); return; }
    await joinMatch(code);
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
  document.getElementById('btnVsJoin')?.addEventListener('click', onJoin);
});