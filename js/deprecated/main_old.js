import { applyInitialUI, toast, updatePlayerXPBar, bindStatsOpen, bindLeaderboardsOpen } from './ui.js';
import { startSolo, nextQuestion, endGame } from './game_solo.js';
import { renderLB } from './leaderboard.js';
import { initVS, createMatch, joinMatch, answer, setVSName, leaveMatch } from './vs.js';
import { trackEvent } from './stats.js';
import { initAuth, getCurrentUser, isAuthenticated, updateUserStats, syncPendingStats, signOut } from './auth.js';
import { createAuthModal, showAuthModal, updateUIForUser, showConvertGuestPrompt, requireAuth } from './auth_ui.js';
import { getLanguage } from '../core/i18n.js';
import { translateAchievement } from '../player/achievements.js';

function showAchievementToast(ach) {
  const lang = getLanguage();
  const { title } = translateAchievement(ach, lang);
  const msg = lang === 'en' ? 'Achievement unlocked' : '¡Logro desbloqueado';
  toast(`🏆 ${msg}: ${title}!`);
}

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
  return window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
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

const Beeps = (()=> {
  let ctx=null;
  function ensure(){ if (!ctx) ctx = new (window.AudioContext||window.webkitAudioContext)(); return ctx; }
  function beep({freq=700, dur=0.1, vol=0.2}={}){
    try{
      const ac = ensure();
      const t0 = ac.currentTime;
      const o  = ac.createOscillator();
      const g  = ac.createGain();
      o.frequency.value = freq;
      g.gain.value = vol;
      o.connect(g); g.connect(ac.destination);
      o.start(t0);
      o.stop(t0 + dur);
    }catch(e){}
  }
  return { beep };
})();

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
  if (qEl) qEl.textContent = q.question || '—'; try{ setVSQuestionMedia(q.img || (q.media && q.media.src) || null); }catch{}
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
        results = await trackEvent('answer_wrong');
      } else {
        btns[i]?.classList.add('correct');
        results = await trackEvent('answer_correct', { category: q.cat || 'vs', difficulty: q.diff || 'medium' });
      }
    }
    
    updatePlayerXPBar();
    if(results.leveledUp) toast("🎉 ¡Subiste de Nivel! 🎉");
    if(results.bonusToast) toast(results.bonusToast);
    results.newAchievements.forEach(ach => showAchievementToast(ach));

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
  
  const results = await trackEvent('game_finish', { mode: 'vs', won });
  updatePlayerXPBar();
  if(results.leveledUp) toast("🎉 ¡Subiste de Nivel! 🎉");
  if(results.bonusToast) toast(results.bonusToast);
results.newAchievements.forEach(ach => setTimeout(() => showAchievementToast(ach), 500));

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
}

window.addEventListener('load', async ()=>{
  // Primero aplicar UI inicial para que el juego funcione
  applyInitialUI();
  
  // Vincular botón de mostrar auth
  document.getElementById('btnShowAuth')?.addEventListener('click', () => {
    if (typeof showAuthModal === 'function') {
      showAuthModal('login');
    }
  });
  
  // Vincular botón de auth en el perfil
  document.getElementById('profileBtnAuth')?.addEventListener('click', () => {
    // Cerrar modal de perfil primero
    const profileModal = document.getElementById('profileModal');
    if (profileModal) profileModal.classList.remove('open');
    
    // Mostrar modal de auth
    if (typeof showAuthModal === 'function') {
      showAuthModal('login');
    }
  });
  
  // Vincular botón de logout
  document.getElementById('btnLogout')?.addEventListener('click', async () => {
    if (confirm('¿Seguro que quieres cerrar sesión?')) {
      try {
        if (typeof signOut === 'function') {
          await signOut();
          // Actualizar UI
          updateAuthUI(false);
          toast('Sesión cerrada');
        }
      } catch (error) {
        console.error('Error al cerrar sesión:', error);
      }
    }
  });
  
  // Función para actualizar UI según estado de auth
  function updateAuthUI(isLoggedIn, user = null) {
    const authSection = document.getElementById('authSection');
    const authPrompt = authSection?.querySelector('.auth-prompt');
    const userInfo = document.getElementById('userInfo');
    const playerNameInput = document.getElementById('playerName');
    const profileAuthSection = document.getElementById('profileAuthSection');
    const profileUserSection = document.getElementById('profileUserSection');
    
    if (isLoggedIn && user) {
      // Usuario logueado
      if (authPrompt) authPrompt.style.display = 'none';
      if (userInfo) {
        userInfo.style.display = 'block';
        document.getElementById('userDisplayName').textContent = user.display_name || user.username || 'Jugador';
        document.getElementById('userLevel').textContent = user.level || 1;
        document.getElementById('userXP').textContent = user.total_xp || 0;
      }
      if (playerNameInput) {
        playerNameInput.value = user.display_name || user.username || 'Jugador';
        playerNameInput.disabled = true;
      }
      if (profileAuthSection) profileAuthSection.style.display = 'none';
      if (profileUserSection) profileUserSection.style.display = 'block';
    } else {
      // No logueado
      if (authPrompt) authPrompt.style.display = 'block';
      if (userInfo) userInfo.style.display = 'none';
      if (playerNameInput) playerNameInput.disabled = false;
      if (profileAuthSection) profileAuthSection.style.display = 'block';
      if (profileUserSection) profileUserSection.style.display = 'none';
    }
  }
  
  // Intentar inicializar Supabase y autenticación (opcional)
  let supabase = null;
  let currentUser = null;
  
  try {
    // Obtener cliente Supabase
    supabase = await getSupabaseClient();
    
    // Inicializar sistema de autenticación
    currentUser = await initAuth(supabase, {
      onAuthStateChange: ({ event, user }) => {
        console.log('Auth state changed:', event);
        if (user) {
        updateUIForUser();
        updateAuthUI(true, user);
          syncPendingStats(); // Sincronizar estadísticas pendientes
      } else {
        updateAuthUI(false);
      }
      },
      onProfileUpdate: (profile) => {
        console.log('Profile updated:', profile);
        updatePlayerXPBar();
      }
    });
    
    // Crear modal de autenticación solo si Supabase está disponible
    createAuthModal();
    
    // Si no hay usuario, mostrar modal de autenticación (opcional)
    if (!currentUser) {
      // Comentado para no forzar login
      // setTimeout(() => {
      //   showAuthModal('login');
      // }, 1000);
    } else {
      updateUIForUser();
      updateAuthUI(true, currentUser);
      // Si es invitado, mostrar prompt después de un tiempo
      if (currentUser.is_guest) {
        setTimeout(() => showConvertGuestPrompt(), 120000); // 2 minutos
      }
    }
  } catch (error) {
    console.error('Error initializing Supabase/Auth:', error);
    console.log('El juego funcionará en modo offline');
    // El juego continúa funcionando sin autenticación
  }

  document.getElementById('btnStart')?.addEventListener('click', startSolo);
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
    newAchievements.forEach(ach => showAchievementToast(ach));
    
    vsQNo = 0; vsQTotal = null; vsActive = true;
    setVSName(document.getElementById('playerName')?.value || '');
    const rounds = parseInt(document.getElementById('vsRounds')?.value, 10);
    const diff = document.querySelector('#diffPills .pill.active')?.dataset.val;
    const code = await createMatch({ rounds, category: cat, difficulty: diff });
    document.getElementById('vsCodeBadge').textContent = `Sala: ${code}`;
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
    newAchievements.forEach(ach => showAchievementToast(ach));

    vsQNo = 0; vsQTotal = null; vsActive = true;
    setVSName(document.getElementById('playerName')?.value || '');
    const code = document.getElementById('inputVsCode')?.value?.trim();
    if (!code){ alert('Ingresá un código'); return; }
    await joinMatch(code);
  };

  document.getElementById('btnVsHost')?.addEventListener('click', onHost);
  document.getElementById('btnVsJoin')?.addEventListener('click', onJoin);
});