// js/game_solo.js
import { SETTINGS, STATE } from '../deprecated/store.js';
import { buildDeckSingle, ensureInitial60 } from './bank.js';
import { trackEvent } from '../player/stats.js';
import { toast, updatePlayerXPBar } from './ui.js';
import { t } from '../core/i18n.js';

let audioCtx = null;
let audioInitialized = false;

function ensureAC() {
  if (!SETTINGS.sounds) return null;
  if (!audioCtx || !audioInitialized) {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      // En Android, el contexto puede estar suspendido
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      audioInitialized = true;
      console.log('AudioContext creado, estado:', audioCtx.state);
    } catch (e) {
      console.error('Error creando AudioContext:', e);
      audioCtx = null;
    }
  }
  return audioCtx;
}

// Inicializar audio en el primer click/touch
function initAudioOnInteraction() {
  if (!audioInitialized) {
    ensureAC();
    // Reproducir un sonido silencioso para activar el audio en móvil
    if (audioCtx) {
      const buffer = audioCtx.createBuffer(1, 1, 22050);
      const source = audioCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(audioCtx.destination);
      source.start(0);
      console.log('Audio inicializado por interacción');
    }
  }
}

// Agregar listeners para inicializar audio
if (typeof document !== 'undefined') {
  document.addEventListener('touchstart', initAudioOnInteraction, { once: true });
  document.addEventListener('click', initAudioOnInteraction, { once: true });
}

// Sistema de sonido simplificado para contrarreloj
function playCountdownSound(secondsLeft) {
  if (!SETTINGS.sounds) return;
  
  // Asegurar que tenemos contexto de audio
  if (!audioCtx || !audioInitialized) {
    ensureAC();
    if (!audioCtx) {
      console.warn('No se pudo inicializar el audio');
      return;
    }
  }
  
  // Resume el contexto si está suspendido (común en Android)
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().then(() => {
      console.log('AudioContext resumido');
    });
  }
  
  try {
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    // Frecuencias y configuración según el segundo
    let frequency, volume, duration;
    
    switch(secondsLeft) {
      case 5:
        frequency = 440; // La
        volume = 0.3; // Más volumen para Android
        duration = 0.15;
        break;
      case 4:
        frequency = 494; // Si
        volume = 0.35;
        duration = 0.15;
        break;
      case 3:
        frequency = 523; // Do
        volume = 0.4;
        duration = 0.18;
        break;
      case 2:
        frequency = 587; // Re
        volume = 0.45;
        duration = 0.2;
        break;
      case 1:
        frequency = 659; // Mi
        volume = 0.5;
        duration = 0.22;
        break;
      case 0:
        frequency = 880; // La agudo
        volume = 0.6;
        duration = 0.4;
        break;
      default:
        return;
    }
    
    // Configurar oscilador
    osc.type = secondsLeft > 0 ? 'sine' : 'square';
    osc.frequency.value = frequency;
    
    // Configurar ganancia con valores más altos para Android
    const now = audioCtx.currentTime;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(volume, now + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);
    
    // Conectar y reproducir
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.start(now);
    osc.stop(now + duration + 0.1);
    
    // Segundo beep para los últimos 3 segundos (simplificado para Android)
    if (secondsLeft <= 3 && secondsLeft > 0) {
      setTimeout(() => {
        try {
          const osc2 = audioCtx.createOscillator();
          const gain2 = audioCtx.createGain();
          
          osc2.type = 'sine';
          osc2.frequency.value = frequency * 1.5;
          
          const now2 = audioCtx.currentTime;
          gain2.gain.setValueAtTime(0, now2);
          gain2.gain.linearRampToValueAtTime(volume * 0.6, now2 + 0.02);
          gain2.gain.exponentialRampToValueAtTime(0.01, now2 + duration * 0.6);
          
          osc2.connect(gain2);
          gain2.connect(audioCtx.destination);
          
          osc2.start(now2);
          osc2.stop(now2 + duration * 0.6 + 0.1);
        } catch (e) {
          console.error('Error en segundo beep:', e);
        }
      }, 120);
    }
    
    console.log(`Beep: ${secondsLeft}s - ${frequency}Hz - Vol: ${volume}`);
  } catch (e) {
    console.error('Error al reproducir sonido:', e);
  }
}

function beepOnce({ freq = 650, dur = 0.09, vol = 0.18 } = {}) {
  const ac = ensureAC(); if (!ac) return;
  try {
    const t0 = ac.currentTime;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.value = vol;
    osc.connect(gain); gain.connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + dur);
  } catch {}
}

let timerInt = null;
let TIMED_SECONDS = 0;
let currentTimeLeft = 0; // Variable para mantener el tiempo restante

function hud(){
  const el = document.getElementById('kHUD');
  if (!el) return;
  if (STATE.mode === 'timed') {
    // Mostrar puntos y tiempo restante
    const timeDisplay = currentTimeLeft > 0 ? ` · ${currentTimeLeft}s` : '';
    el.textContent = `${STATE.score} pts${timeDisplay}`;
    
    // Cambiar color cuando quedan 5 segundos o menos
    if (currentTimeLeft <= 5 && currentTimeLeft > 0) {
      el.classList.add('urgent');
    } else {
      el.classList.remove('urgent');
    }
  } else {
    el.textContent = `${STATE.index}/${STATE.total} · ${STATE.score} pts`;
    el.classList.remove('urgent');
  }
}
function setProgress(p){
  const el = document.getElementById('progressBar');
  if (el) el.style.width = `${Math.round(p*100)}%`;
}
function showGame(show){
  const g = document.getElementById('gameArea');
  const c = document.getElementById('configCard');
  if (g) g.style.display = show ? 'block' : 'none';
  if (c) c.style.display = show ? 'none'  : 'block';
}

function setQuestionMedia(u){ const w=document.getElementById('qMedia'); if(!w) return; const img=w.querySelector('img'); if(!u){ w.style.display='none'; return;} img.onload=()=>w.style.display='block'; img.onerror=()=>w.style.display='none'; img.src=u; }

function renderQuestion(q){ 
  const qEl=document.getElementById('qText'); if(qEl) qEl.textContent=q.q; 
  try{ setQuestionMedia(q.img || (q.media && q.media.src) || null); }catch{}

  const optionsEl = document.getElementById('options');
  optionsEl.innerHTML = '';
  let locked = false;

  q.options.forEach((opt,i)=>{
    const div = document.createElement('button');
    div.type='button';
    div.className = 'option';
    div.textContent = `${String.fromCharCode(65+i)}. ${opt}`;

    const handler = async ()=>{
      if (locked) return; locked = true;

      const question = STATE.deck[STATE.index - 1];
      if (!question) return;

      let results = {};
      if(i===q.answer){
        div.classList.add('correct');
        STATE.score++;
        results = await trackEvent('answer_correct', { category: question.category, difficulty: question.difficulty });
      } else {
        div.classList.add('wrong');
        // Marcar todas las opciones incorrectas que se clickearon
        optionsEl.children[i].classList.add('wrong');
        // Mostrar la respuesta correcta
        const corr = optionsEl.children[q.answer];
        if (corr) corr.classList.add('correct');
        results = await trackEvent('answer_wrong');
      }
      
      // Deshabilitar todas las opciones
      Array.from(optionsEl.children).forEach(option => {
        option.classList.add('disabled');
        option.style.pointerEvents = 'none';
      });

      updatePlayerXPBar();
      if(results.leveledUp) toast("🎉 ¡Subiste de Nivel! 🎉");
      if(results.bonusToast) toast(results.bonusToast);
      results.newAchievements.forEach(ach => toast(`🏆 ¡Logro desbloqueado: ${ach.title}!`));

      if (STATE.mode==='timed' || SETTINGS.autoNextRounds) {
        setTimeout(()=> nextQuestion(), 800);
      } else {
        const btnNext = document.getElementById('btnNext');
        if (btnNext) btnNext.style.display = 'inline-block';
      }
      
      hud();
    };

    div.addEventListener('click', handler, {passive:true});
    optionsEl.appendChild(div);
  });
}

export function nextQuestion(){
  let q=null;
  if(STATE.mode==='rounds'){
    if(STATE.index>=STATE.deck.length){ endGame(); return; }
    q = STATE.deck[STATE.index];
  } else {
    q = STATE.deck[STATE.index % STATE.deck.length];
  }

  const btnNext = document.getElementById('btnNext');
  if(btnNext) btnNext.style.display = 'none';

  const bCat = document.getElementById('bCat');
  const bDiff= document.getElementById('bDiff');
  if (bCat)  bCat.textContent  = (STATE.mode==='timed') ? 'Contrarreloj' : (q.category || 'Solo');
  if (bDiff) bDiff.textContent = q.difficulty || '—';

  renderQuestion(q);
  STATE.index++;

  if(STATE.mode==='rounds'){
    hud();
    setProgress((STATE.index)/STATE.total);
  } else {
    hud();
  }
}

function openSingleResult({title, subtitle, scoreText}){
  const fs = document.getElementById('fsSingleResult');
  document.getElementById('srTitle').textContent   = title;
  document.getElementById('srSubtitle').textContent= subtitle;
  document.getElementById('srScore').textContent   = scoreText;
  
  // Agregar el header completo si no existe
  if (!fs.querySelector('.results-header')) {
    const wrap = fs.querySelector('.wrap');
    if (wrap) {
      const appHeader = document.createElement('div');
      appHeader.className = 'results-header';
      appHeader.innerHTML = `
        <div class="app-title">
          <img src="./assets/logo/logo.png" alt="Quizle!" class="app-logo"/>
          <span>Quizle!</span>
        </div>
        <div class="row">
          <button class="iconbtn" id="btnDLCResults" title="Tienda de packs">
            <svg viewBox="0 0 512 512" width="22" height="22">
              <path fill="currentColor" d="M345.6 38.4v102.4h128V38.4h-128zm-102.4-25.6v76.8h51.2v51.2h51.2V12.8h-102.4zm-51.2 89.6v51.2h102.4v-25.6h-76.8v-25.6h-25.6zm307.2 51.2H171.5l25.6 179.2h238.1l51.2-179.2zM153.6 486.4c21.2 0 38.4-17.2 38.4-38.4s-17.2-38.4-38.4-38.4-38.4 17.2-38.4 38.4 17.2 38.4 38.4 38.4zm256 0c21.2 0 38.4-17.2 38.4-38.4s-17.2-38.4-38.4-38.4-38.4 17.2-38.4 38.4 17.2 38.4 38.4 38.4z"/>
            </svg>
          </button>
          <button class="iconbtn" id="btnFriendsResults" title="Amigos" style="position: relative;">
            <svg viewBox="0 0 24 24" width="22" height="22">
              <path fill="currentColor" d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
            </svg>
            <span class="notification-badge" id="friendsBadgeResults" style="display: none;">0</span>
          </button>
          <button class="iconbtn avatar-btn" id="btnProfileResults" aria-label="Perfil de Usuario">
            <img src="img/avatar_placeholder.svg" alt="Avatar"/>
          </button>
        </div>
      `;
      wrap.insertBefore(appHeader, wrap.firstChild);
      
      // Vincular eventos de los botones
      setTimeout(() => {
        const btnDLC = document.getElementById('btnDLCResults');
        if (btnDLC) {
          btnDLC.addEventListener('click', () => {
            fs.style.display = 'none';
            showGame(false);
            const mainDLCBtn = document.getElementById('btnDLC');
            if (mainDLCBtn) mainDLCBtn.click();
          });
        }
        
        const btnFriends = document.getElementById('btnFriendsResults');
        if (btnFriends) {
          btnFriends.addEventListener('click', () => {
            fs.style.display = 'none';
            showGame(false);
            const mainFriendsBtn = document.getElementById('btnFriends');
            if (mainFriendsBtn) mainFriendsBtn.click();
          });
        }
        
        const btnProfile = document.getElementById('btnProfileResults');
        if (btnProfile) {
          btnProfile.addEventListener('click', () => {
            fs.style.display = 'none';
            showGame(false);
            const mainProfileBtn = document.getElementById('btnProfile');
            if (mainProfileBtn) mainProfileBtn.click();
          });
        }
      }, 100);
    }
  }
  
  fs.style.display='block';
  window.scrollTo(0,0);

  document.getElementById('srAgain').onclick = ()=> {
    fs.style.display='none';
    startSolo();
  };
  document.getElementById('srHome').onclick = ()=>{
    fs.style.display='none';
    showGame(false);
  };
  document.getElementById('backSingleResult').onclick = ()=>{
    fs.style.display='none';
    showGame(false);
  };
}

export async function endGame(){
  if (timerInt) { clearInterval(timerInt); timerInt = null; }
  let results = {};

  if (STATE.mode==='rounds'){
    const isPerfect = (STATE.score === STATE.total && STATE.total >= 15);
    const won = STATE.score >= STATE.total / 2;
    results = await trackEvent('game_finish', { mode: 'solo', won, isPerfect });
    
    let title, sub;
    if (isPerfect) { title='¡Perfecto!'; sub='¡Ningún error!'; }
    else if (won){ title='¡Muy bien!'; sub='¡Gran partida!'; }
    else { title='¡No te rindas!'; sub='La próxima será mejor.'; }
    openSingleResult({ title, subtitle: sub, scoreText: `${STATE.score} / ${STATE.total}` });

  } else { // Timed mode
    results = await trackEvent('game_finish', { mode: 'timed', won: true });
    openSingleResult({ title: '¡Se acabó el tiempo!', subtitle: '¡Buen intento!', scoreText: `${STATE.score} pts` });
  }
  
  updatePlayerXPBar();
  if(results.leveledUp) toast("🎉 ¡Subiste de Nivel! 🎉");
  if(results.bonusToast) toast(results.bonusToast);
  results.newAchievements.forEach(ach => setTimeout(() => toast(`🏆 ¡Logro desbloqueado: ${ach.title}!`), 500));

  showGame(false);
}

// --- FUNCIONES RESTAURADAS ---
function getActiveMode(){
  const a = [...document.querySelectorAll('#modeSeg .seg')].find(s=> s.classList.contains('active'));
  return a?.dataset?.val || 'rounds';
}

function getActiveDifficulty(){
  const p = [...document.querySelectorAll('#diffPills .pill')].find(x=> x.classList.contains('active'));
  return p?.dataset?.val || 'easy';
}
// --- FIN DE FUNCIONES RESTAURADAS ---


export async function startSolo(){
  const selEl = document.getElementById('categorySel');
  if(!selEl?.value || selEl.value === ''){ alert(t('selectCategory')); return; }

  const segActive = getActiveMode();
  const diff = getActiveDifficulty();
  const selectedCat = selEl.value;

  const { newAchievements, leveledUp } = await trackEvent('game_start');
  updatePlayerXPBar();
  if(leveledUp) toast("🎉 ¡Subiste de Nivel! 🎉");
  newAchievements.forEach(ach => toast(`🏆 ¡Logro desbloqueado: ${ach.title}!`));
  
  STATE.score = 0;
  STATE.index = 0;
  STATE.mode  = segActive;

  await ensureInitial60();

  if(segActive==='rounds'){
    const total = parseInt(document.getElementById('rounds').value, 10);
    STATE.total = total;
    STATE.deck  = buildDeckSingle(selectedCat, total, diff);
  } else if (segActive==='timed'){
    const seconds = parseInt(document.getElementById('timer').value, 10);
    TIMED_SECONDS = seconds;
    currentTimeLeft = seconds; // Establecer tiempo inicial
    STATE.total = 999;
    STATE.deck  = buildDeckSingle(selectedCat, 50, diff);
    startTimer(seconds);
  }

  showGame(true);
  nextQuestion();
}

function startTimer(seconds){
  if (timerInt) clearInterval(timerInt);
  const total = seconds;
  const t0 = Date.now();
  let lastSec = null;
  currentTimeLeft = seconds; // Inicializar tiempo restante

  // Forzar la creación del contexto de audio al inicio
  if (SETTINGS.sounds) {
    ensureAC();
  }

  timerInt = setInterval(()=>{
    const elapsed = (Date.now() - t0) / 1000;
    const rem = Math.max(0, total - elapsed);
    const sec = Math.ceil(rem);
    currentTimeLeft = sec; // Actualizar tiempo restante
    setProgress(rem / total);

    // Solo ejecutar cuando cambia el segundo
    if (sec !== lastSec){
      // Actualizar HUD con el tiempo
      hud();
      
      // Reproducir sonido de cuenta regresiva en los últimos 5 segundos
      if (sec <= 5 && sec >= 0) {
        console.log(`Countdown: ${sec} seconds`);
        playCountdownSound(sec);
      }
      
      // Terminar el juego cuando llegue a 0
      if (sec === 0){
        endGame();
        return;
      }
      lastSec = sec;
    }
  }, 100); // Cambiado a 100ms para mejor precisión
}