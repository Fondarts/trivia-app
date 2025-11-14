// js/game_solo.js
import { SETTINGS, STATE } from '../core/store.js';
import { buildDeckSingle, ensureInitial60 } from './bank.js';
import { trackEvent } from '../player/stats.js';
import { toast, updatePlayerXPBar } from './ui.js';
import { t } from '../core/i18n.js';
// Usar el cliente de Supabase desde window (inicializado en config.js)
const supabase = window.supabaseClient;

// Obtener socialManager desde window
const socialManager = window.socialManager;

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
  
  // Usar window.STATE si está disponible (modo asíncrono), sino usar STATE local
  const currentState = window.STATE || STATE;
  
  if (currentState.mode === 'timed') {
    // Mostrar puntos y tiempo restante
    const timeDisplay = currentTimeLeft > 0 ? ` · ${currentTimeLeft}s` : '';
    el.textContent = `${currentState.score} pts${timeDisplay}`;
    
    // Cambiar color cuando quedan 5 segundos o menos
    if (currentTimeLeft <= 5 && currentTimeLeft > 0) {
      el.classList.add('urgent');
    } else {
      el.classList.remove('urgent');
    }
  } else if (currentState.mode === 'async' || currentState.mode === 'async_v2') {
    // Modo asíncrono - mostrar timer de pregunta (solo para async V1)
    const timerDisplay = (currentState.mode === 'async' && asyncQuestionTimer && asyncQuestionTimeLeft > 0) ? ` · ${asyncQuestionTimeLeft}s` : '';
    
    // Validar que el índice no exceda el total (corrección de bug)
    const displayIndex = Math.min(currentState.index, currentState.total - 1);
    el.textContent = `${displayIndex + 1}/${currentState.total} · ${currentState.score} pts${timerDisplay}`;
    
    // Si el índice excedió el total, es un error - loguear para debug
    if (currentState.index >= currentState.total) {
      console.error('❌ ERROR: Índice excedió el total:', {
        index: currentState.index,
        total: currentState.total,
        mode: currentState.mode
      });
    }
    
    // Cambiar color cuando quedan 5 segundos o menos (solo para async V1)
    if (currentState.mode === 'async' && asyncQuestionTimeLeft <= 5 && asyncQuestionTimeLeft > 0) {
      el.classList.add('urgent');
    } else {
      el.classList.remove('urgent');
    }
  } else {
    el.textContent = `${currentState.index}/${currentState.total} · ${currentState.score} pts`;
    el.classList.remove('urgent');
  }
}
function setProgress(p){
  const el = document.getElementById('progressBar');
  if (el) el.style.width = `${Math.round(p*100)}%`;
}

function setQuestionMedia(u){ const w=document.getElementById('qMedia'); if(!w) return; const img=w.querySelector('img'); if(!u){ w.style.display='none'; return;} img.onload=()=>w.style.display='block'; img.onerror=()=>w.style.display='none'; img.src=u; }

// Función auxiliar para convertir dificultad a estrellas
function getDifficultyStars(difficulty) {
  const diffMap = {
    'easy': '★',
    'medium': '★★',
    'hard': '★★★',
    'any': '★'
  };
  return diffMap[difficulty?.toLowerCase()] || '★';
}

export function openSingleResult({title, subtitle, scoreText, details, matchId, opponentId, rounds, category, difficulty}){
  const fs = document.getElementById('fsSingleResult');
  document.getElementById('srTitle').textContent   = title;
  document.getElementById('srSubtitle').textContent= subtitle;
  document.getElementById('srScore').textContent   = scoreText;
  
  // Mostrar detalles si están disponibles
  const detailsEl = document.getElementById('srDetails');
  if (detailsEl) {
    if (details) {
      detailsEl.textContent = details;
      detailsEl.style.display = 'block';
    } else if (scoreText && difficulty) {
      // Construir detalles automáticamente si no se proporcionan
      const [correct, total] = scoreText.split(' / ');
      const stars = getDifficultyStars(difficulty);
      detailsEl.textContent = `Respondiste correctamente ${correct}/${total} en dificultad ${stars}`;
      detailsEl.style.display = 'block';
    } else {
      detailsEl.style.display = 'none';
    }
  }
  
  // Agregar el header completo si no existe
  if (!fs.querySelector('.results-header')) {
    const wrap = fs.querySelector('.wrap');
    if (wrap) {
      const appHeader = document.createElement('div');
      appHeader.className = 'results-header';
      appHeader.innerHTML = `
        <div class="app-title">
          <img src="./assets/logo/logo.png" alt="Quizlo!" class="app-logo"/>
          <span>Quizlo!</span>
        </div>
        <div class="row">
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

  // Botón de Revancha
  const srRematch = document.getElementById('srRematch');
  if (srRematch) {
    srRematch.onclick = async () => {
      if (matchId && opponentId && rounds && category && difficulty) {
        try {
          // Crear nueva partida con las mismas características
          if (window.asyncVSV2 && window.asyncVSV2.createMatch) {
            const newMatch = await window.asyncVSV2.createMatch({
              rounds,
              category,
              difficulty
            });
            
            // Enviar notificación al rival (esto se puede hacer via Realtime o notificaciones)
            // Por ahora, la partida aparecerá en "Partidas Abiertas" del rival
            if (window.toast) {
              window.toast('Revancha creada. Tu rival recibirá una notificación.');
            }
            
            // Cerrar pantalla de resultados
            fs.style.display = 'none';
            showGame(false);
            
            // Opcional: abrir la nueva partida automáticamente
            // await window.asyncVSV2.startGame(newMatch.id);
          } else {
            console.error('❌ Sistema async_v2 no disponible');
            if (window.toast) {
              window.toast('Error: Sistema de partidas no disponible');
            }
          }
        } catch (error) {
          console.error('❌ Error creando revancha:', error);
          if (window.toast) {
            window.toast('Error al crear revancha. Intenta de nuevo.');
          }
        }
      } else {
        // Si no hay datos de partida, simplemente iniciar un nuevo juego
        fs.style.display = 'none';
        startSolo();
      }
    };
  }

  // Botón de Compartir
  const srShare = document.getElementById('srShare');
  if (srShare) {
    srShare.onclick = () => {
      // Obtener valores actuales del DOM
      const currentTitle = document.getElementById('srTitle')?.textContent || title;
      const currentSubtitle = document.getElementById('srSubtitle')?.textContent || subtitle;
      const currentScore = document.getElementById('srScore')?.textContent || scoreText;
      const currentDetails = document.getElementById('srDetails')?.textContent || details || '';
      
      // Construir mensaje para WhatsApp
      const shareText = `${currentTitle}\n${currentSubtitle}\n${currentScore}${currentDetails ? '\n' + currentDetails : ''}\n\n¡Jugá Quizlo! 🎮`;
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
      window.open(whatsappUrl, '_blank');
    };
  }

  // Botón de Salir (antes "Inicio")
  const srHome = document.getElementById('srHome');
  if (srHome) {
    srHome.onclick = () => {
      fs.style.display = 'none';
      showGame(false);
      // Ir a pantalla principal
      if (window.showConfigUI) {
        window.showConfigUI();
      }
    };
  }

  // Botón de cerrar (X)
  document.getElementById('backSingleResult').onclick = ()=>{
    fs.style.display='none';
    showGame(false);
    if (window.showConfigUI) {
      window.showConfigUI();
    }
  };
}

export function showGame(show){
  const g = document.getElementById('gameArea');
  const c = document.getElementById('configCard');
  if (show) {
    g.style.display = 'block';
    if (c) c.style.display = 'none';
  } else {
    g.style.display = 'none';
    if (c) c.style.display = 'block';
  }
}

export function renderQuestion(q){ 
  const qEl=document.getElementById('qText'); if(qEl) qEl.textContent=q.q; 
  try{ setQuestionMedia(q.img || (q.media && q.media.src) || null); }catch{}
  
  // Guardar datos de pregunta para reporte
  try {
    if (window.setCurrentQuestionData) {
      window.setCurrentQuestionData(q);
    }
  } catch(e) {}
  
  // Mostrar banner durante preguntas (Android + Web)
  if (window.unifiedBanner) {
    window.unifiedBanner.showBanner();
  }

  const optionsEl = document.getElementById('options');
  optionsEl.innerHTML = '';
  let locked = false;
  
  // Usar window.STATE si está disponible (modo asíncrono), sino usar STATE local
  const currentState = window.STATE || STATE;
  
  // Guardar tiempo de inicio de pregunta para calcular timeSpent (modo async_v2)
  if (currentState.mode === 'async_v2') {
    currentState.questionStartTime = Date.now();
    console.log('⏰ Tiempo de inicio de pregunta guardado:', currentState.questionStartTime);
  }
  
  // Si estamos en modo asíncrono V1, iniciar timer de 15 segundos
  // V2 no usa timer local, cada jugador tiene 6 horas
  if (currentState.mode === 'async') {
    startAsyncQuestionTimer(q, currentState);
  }

  // Verificar si ya respondió (modo async_v2)
  const alreadyAnswered = currentState.mode === 'async_v2' && currentState.alreadyAnswered;
  const myAnswerIndex = currentState.mode === 'async_v2' ? currentState.myAnswerIndex : null;
  
  if (alreadyAnswered && myAnswerIndex !== null) {
    console.log('✅ Ya respondió esta pregunta, mostrando respuesta marcada:', myAnswerIndex);
    // Si ya respondió, marcar como locked desde el inicio
    locked = true;
    
    // Mostrar mensaje informativo
    if (window.showAsyncExitMessage) {
      window.showAsyncExitMessage();
    }
  }

  q.options.forEach((opt,i)=>{
    const div = document.createElement('button');
    div.type='button';
    div.className = 'option';
    div.textContent = `${String.fromCharCode(65+i)}. ${opt}`;
    
    // Si ya respondió, marcar la respuesta y deshabilitar opciones
    if (alreadyAnswered && myAnswerIndex !== null) {
      if (i === myAnswerIndex) {
        // Marcar la respuesta del jugador
        if (i === q.answer) {
          div.classList.add('correct');
          currentState.score++;
        } else {
          div.classList.add('wrong');
        }
      }
      
      // Mostrar respuesta correcta si respondió mal
      if (myAnswerIndex !== q.answer && i === q.answer) {
        div.classList.add('correct');
      }
      
      // Deshabilitar todas las opciones
      div.classList.add('disabled');
      div.style.pointerEvents = 'none';
    }

    const handler = async ()=>{
      // Si ya respondió, no permitir cambiar la respuesta
      if (alreadyAnswered) {
        console.log('⚠️ Ya respondiste esta pregunta, no puedes cambiarla');
        return;
      }
      
      if (locked) return; locked = true;

      // Usar window.STATE si está disponible (modo asíncrono), sino usar STATE local
      const currentState = window.STATE || STATE;

      // En modo async_v2, usar directamente la pregunta q que se pasó a renderQuestion
      // En otros modos, usar el índice (que se incrementa después de renderizar)
      const question = (currentState.mode === 'async_v2') 
        ? q  // Usar la pregunta actual que se está mostrando
        : currentState.deck[currentState.index - 1];  // Modo normal: índice ya incrementado
      
      if (!question) {
        console.error('❌ Pregunta no encontrada:', { 
          mode: currentState.mode, 
          index: currentState.index,
          deckLength: currentState.deck?.length 
        });
        return;
      }

      let results = {};
      if(i===q.answer){
        div.classList.add('correct');
        currentState.score++;
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

      // Si estamos en modo asíncrono (V1 o V2), guardar respuesta y verificar avance
      if (currentState.mode === 'async' || currentState.mode === 'async_v2') {
        // Limpiar timer ya que respondimos (solo para V1)
        if (currentState.mode === 'async') {
          clearAsyncQuestionTimer();
        }
        
        // Calcular tiempo transcurrido desde que se mostró la pregunta
        const timeSpent = currentState.questionStartTime 
          ? Date.now() - currentState.questionStartTime 
          : 0;
        
        // Guardar respuesta y verificar si ambos respondieron
        await saveAsyncAnswerAndCheck(currentState, question, i === q.answer, i, timeSpent);
      }

      updatePlayerXPBar();
      if(results.leveledUp) toast("🎉 ¡Subiste de Nivel! 🎉");
      if(results.bonusToast) toast(results.bonusToast);
      results.newAchievements.forEach(ach => toast(`🏆 ¡Logro desbloqueado: ${ach.title}!`));

      if (currentState.mode === 'async' || currentState.mode === 'async_v2') {
        // En modo asíncrono, no avanzar automáticamente
        // Esperar a que ambos respondan
        console.log('⏳ Esperando a que el rival responda...');
        toast('⏳ Esperando a que el rival responda...');
        
        // Actualizar estado para indicar que está esperando
        currentState.status = 'waiting_for_opponent_answer';
        
        // Mostrar mensaje informativo debajo del botón Exit
        if (window.showAsyncExitMessage) {
          window.showAsyncExitMessage();
        }
        
        // Actualizar estilo del botón Exit (no rojo en modo asíncrono)
        if (window.updateExitButtonStyle) {
          window.updateExitButtonStyle();
        }
      } else if (currentState.mode==='timed' || SETTINGS.autoNextRounds) {
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
  // Usar window.STATE si está disponible (modo asíncrono), sino usar STATE local
  const currentState = window.STATE || STATE;
  
  let q=null;
  if(currentState.mode==='rounds'){
    if(currentState.index>=currentState.deck.length){ endGame(); return; }
    q = currentState.deck[currentState.index];
  } else {
    q = currentState.deck[currentState.index % currentState.deck.length];
  }

  const btnNext = document.getElementById('btnNext');
  if(btnNext) btnNext.style.display = 'none';

  const bCat = document.getElementById('bCat');
  const bDiff= document.getElementById('bDiff');
  
  if (bCat)  bCat.textContent  = (currentState.mode==='timed') ? 'Contrarreloj' : (q.category || 'Solo');
  if (bDiff) bDiff.textContent = q.difficulty || '—';

  renderQuestion(q);
  currentState.index++;

  if(currentState.mode==='rounds'){
    hud();
    setProgress((currentState.index)/currentState.total);
  } else {
    hud();
  }
}


export async function endGame(){
  if (timerInt) { clearInterval(timerInt); timerInt = null; }
  let results = {};

  // Usar window.STATE si está disponible (modo asíncrono), sino usar STATE local
  const currentState = window.STATE || STATE;

  // NO mostrar resultados si está en modo async_v2 esperando al rival
  // Solo mostrar resultados cuando la partida realmente terminó
  if (currentState.mode === 'async_v2' && 
      (currentState.status === 'waiting_for_opponent_answer' || window.currentAsyncMatchId)) {
    console.log('⏸️ Modo async_v2 esperando rival - NO mostrar resultados');
    showGame(false);
    return; // Salir sin mostrar resultados
  }

  if (currentState.mode==='rounds' || currentState.mode==='async'){
    const isPerfect = (currentState.score === currentState.total && currentState.total >= 15);
    const won = currentState.score >= currentState.total / 2;
    results = await trackEvent('game_finish', { mode: currentState.mode === 'async' ? 'async' : 'solo', won, isPerfect });
    
    let title, sub;
    if (isPerfect) { title='¡Perfecto!'; sub='¡Ningún error!'; }
    else if (won){ title='¡Muy bien!'; sub='¡Gran partida!'; }
    else { title='¡No te rindas!'; sub='La próxima será mejor.'; }
    openSingleResult({ title, subtitle: sub, scoreText: `${currentState.score} / ${currentState.total}` });

  } else { // Timed mode
    results = await trackEvent('game_finish', { mode: 'timed', won: true });
    openSingleResult({ title: '¡Se acabó el tiempo!', subtitle: '¡Buen intento!', scoreText: `${currentState.score} pts` });
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
  // Verificar el select de dificultad según el modo activo
  const mode = getActiveMode();
  let diffSelect = null;
  
  if (mode === 'timed') {
    diffSelect = document.getElementById('timedDifficulty');
  } else if (mode === 'vs') {
    diffSelect = document.getElementById('vsDifficulty');
  } else {
    diffSelect = document.getElementById('difficulty');
  }
  
  return diffSelect?.value || 'easy';
}
// --- FIN DE FUNCIONES RESTAURADAS ---


export async function startSolo(){
  // Usar window.STATE si está disponible (modo asíncrono), sino usar STATE local
  const currentState = window.STATE || STATE;
  
  // Si estamos en modo asíncrono (V1 o V2), usar los datos de la partida
  if (currentState.mode === 'async' || currentState.mode === 'async_v2') {
    console.log('🎮 Iniciando juego asíncrono con datos:', {
      mode: currentState.mode,
      category: currentState.category,
      difficulty: currentState.difficulty,
      rounds: currentState.rounds,
      index: currentState.index
    });
    
    // Configurar el estado para el juego asíncrono
    currentState.score = 0;
    // NO resetear index - ya se configuró desde la BD en startAsyncGame
    // currentState.index = 0; // ← Comentado para mantener el progreso
    currentState.total = currentState.rounds;
    
    await ensureInitial60();
    
    // Usar el deck de la base de datos si existe
    if (window.currentAsyncMatch && window.currentAsyncMatch.deck) {
      // Si el deck es un string JSON, parsearlo
      if (typeof window.currentAsyncMatch.deck === 'string') {
        currentState.deck = JSON.parse(window.currentAsyncMatch.deck);
      } else {
        currentState.deck = window.currentAsyncMatch.deck;
      }
      console.log('🎮 Deck cargado desde BD:', currentState.deck.length, 'preguntas');
    } else if (currentState.deck && currentState.deck.length > 0) {
      // Si ya está en STATE, usarlo
      console.log('🎮 Deck ya está en STATE:', currentState.deck.length, 'preguntas');
    } else {
      // Fallback: generar deck localmente
      currentState.deck = buildDeckSingle(currentState.category, currentState.rounds, currentState.difficulty);
      console.log('🎮 Deck generado localmente:', currentState.deck.length, 'preguntas');
    }
    
    // Asegurar que el index esté dentro del rango válido
    if (currentState.index < 0 || currentState.index >= currentState.deck.length) {
      console.warn('⚠️ Index fuera de rango, ajustando a 0');
      currentState.index = 0;
    }
  } else {
    // Modo normal (solo, timed, etc.)
    const selEl = document.getElementById('categorySel');
    if(!selEl?.value || selEl.value === ''){ alert(t('selectCategory')); return; }

    const segActive = getActiveMode();
    const diff = getActiveDifficulty();
    const selectedCat = selEl.value;

    const { newAchievements, leveledUp } = await trackEvent('game_start');
    updatePlayerXPBar();
    if(leveledUp) toast("🎉 ¡Subiste de Nivel! 🎉");
    newAchievements.forEach(ach => toast(`🏆 ¡Logro desbloqueado: ${ach.title}!`));
    
    currentState.score = 0;
    currentState.index = 0;
    currentState.mode  = segActive;

    await ensureInitial60();

    if(segActive==='rounds'){
      let total = parseInt(document.getElementById('rounds').value, 10);
      
      // Si es un pack personalizado, asegurarse de no pedir más preguntas de las disponibles
      if (selectedCat && selectedCat.startsWith('userpack:')) {
        try {
          const packIndex = parseInt(selectedCat.slice(9), 10);
          const userPacks = JSON.parse(localStorage.getItem('userCreatedPacks') || '[]');
          const pack = userPacks[packIndex];
          if (pack && pack.questions && Array.isArray(pack.questions)) {
            const maxQuestions = pack.questions.length;
            if (total > maxQuestions) {
              total = maxQuestions;
              // Actualizar el selector también
              const roundsSel = document.getElementById('rounds');
              if (roundsSel) roundsSel.value = total.toString();
            }
          }
        } catch(e) {
          console.warn('[solo] Error verificando límite de pack personalizado:', e);
        }
      }
      
      currentState.total = total;
      currentState.deck  = buildDeckSingle(selectedCat, total, diff);
    } else if (segActive==='timed'){
      const seconds = parseInt(document.getElementById('timer').value, 10);
      TIMED_SECONDS = seconds;
      currentTimeLeft = seconds; // Establecer tiempo inicial
      currentState.total = 999;
      currentState.deck  = buildDeckSingle(selectedCat, 50, diff);
      startTimer(seconds);
    }
  }

  showGame(true);
  
  // En modo async_v2, el índice ya está configurado correctamente
  // No llamar a nextQuestion() porque incrementa el índice
  // Renderizar directamente la pregunta actual
  if (currentState.mode === 'async_v2') {
    const deck = currentState.deck || [];
    const question = deck[currentState.index];
    if (question) {
      renderQuestion(question);
      hud();
      setProgress((currentState.index + 1) / currentState.total);
      
      // Si ya respondió, mostrar mensaje y actualizar estilo del botón
      if (currentState.alreadyAnswered) {
        if (window.showAsyncExitMessage) {
          window.showAsyncExitMessage();
        }
        if (window.updateExitButtonStyle) {
          window.updateExitButtonStyle();
        }
      }
    } else {
      console.error('❌ No se encontró la pregunta en el índice:', currentState.index);
    }
  } else {
    nextQuestion();
  }
}

// ===== Funciones para modo asíncrono
// ===== Sistema de tracking local para async mode (como VS mode)
let asyncAnsweredSet = new Set();
let asyncExpectedAnswers = 2;

// Exponer globalmente
window.asyncAnsweredSet = asyncAnsweredSet;
window.asyncExpectedAnswers = asyncExpectedAnswers;

async function saveAsyncAnswerAndCheck(currentState, question, isCorrect, selectedAnswer, timeSpent = 0) {
  console.log('💾 saveAsyncAnswerAndCheck llamado:', {
    hasMatchId: !!window.currentAsyncMatchId,
    matchId: window.currentAsyncMatchId,
    questionIndex: currentState.index - 1,
    isCorrect,
    selectedAnswer,
    timeSpent,
    gameMode: window.currentGameMode
  });
  
  // Detectar si estamos en modo V2
  if (window.currentGameMode === 'async_v2' && window.saveAsyncAnswerV2) {
    console.log('✅ Usando sistema V2 para guardar respuesta');
    return await window.saveAsyncAnswerV2(currentState, question, isCorrect, selectedAnswer, timeSpent);
  }
  
  if (!window.currentAsyncMatchId) {
    console.error('❌ No hay matchId para guardar respuesta');
    return;
  }
  
  const supabaseClient = window.supabaseClient;
  if (!supabaseClient) {
    console.error('❌ Supabase client no disponible');
    return;
  }
  
  // Obtener player_id del estado actual
  // Intentar múltiples fuentes para el ID del usuario
  const userId = window.currentUser?.id || 
                 window.socialManager?.userId || 
                 localStorage.getItem('vs_uid') ||
                 localStorage.getItem('savedUserId');
  
  console.log('🔍 Fuentes de ID del usuario:', {
    currentUser_id: window.currentUser?.id,
    socialManager_userId: window.socialManager?.userId,
    localStorage_vs_uid: localStorage.getItem('vs_uid'),
    localStorage_savedUserId: localStorage.getItem('savedUserId'),
    determined_userId: userId
  });
  
  const playerId = window.currentAsyncMatch?.player1_id === userId ? 
    window.currentAsyncMatch?.player1_id : 
    window.currentAsyncMatch?.player2_id;
  
  console.log('🔍 Debugging player_id:', {
    userId: userId,
    player1_id: window.currentAsyncMatch?.player1_id,
    player2_id: window.currentAsyncMatch?.player2_id,
    determined_playerId: playerId,
    isPlayer1: window.currentAsyncMatch?.player1_id === userId,
    isPlayer2: window.currentAsyncMatch?.player2_id === userId
  });
  
  console.log('🔍 Debugging currentUser object:', {
    currentUser: window.currentUser,
    currentUser_id: window.currentUser?.id,
    currentUser_type: typeof window.currentUser?.id,
    currentUser_undefined: window.currentUser?.id === undefined,
    currentUser_null: window.currentUser?.id === null
  });
  
  if (!playerId) {
    console.error('❌ No se pudo determinar player_id');
    return;
  }
  
  // CORRECCIÓN: Verificar si el jugador ya respondió esta pregunta
  // Evitar respuestas duplicadas que causan desincronización
  const currentQuestionIndex = currentState.index - 1;
  try {
    const { data: existingAnswer } = await supabaseClient
      .from('async_answers')
      .select('id')
      .eq('match_id', window.currentAsyncMatchId)
      .eq('player_id', playerId)
      .eq('question_index', currentQuestionIndex)
      .single();
    
    if (existingAnswer) {
      console.warn('⚠️ El jugador ya respondió esta pregunta, ignorando respuesta duplicada');
      return; // Ya respondió, no hacer nada
    }
  } catch (checkError) {
    // Si no existe, es normal (404 es esperado)
    // Si hay otro error, loguear pero continuar
    if (checkError.code !== 'PGRST116') {
      console.warn('⚠️ Error verificando respuesta existente:', checkError);
    }
  }
  
  try {
    // Guardar respuesta en base de datos
    const answerData = {
      match_id: window.currentAsyncMatchId,
      player_id: playerId,
      question_index: currentState.index - 1,
      answer: selectedAnswer.toString(),
      time_spent: 0
    };
    
    console.log('💾 Guardando respuesta:', answerData);
    
    const { data: insertData, error } = await supabaseClient
      .from('async_answers')
      .insert([answerData])
      .select();
    
    console.log('💾 Resultado del insert:', { insertData, error });
    
    if (error) {
      console.error('❌ Error guardando respuesta:', error);
      return;
    }
    
    console.log('✅ Respuesta guardada correctamente');
    
    // OPTIMIZACIÓN: Usar campos calculados de async_matches en lugar de consultar async_answers
    // El trigger actualiza automáticamente player1_answered_current y player2_answered_current
    // Esto elimina una query adicional
    console.log('🔍 Consultando estado de partida (campos calculados):', {
      match_id: window.currentAsyncMatchId
    });
    
    const { data: updatedMatch, error: matchError } = await supabaseClient
      .from('async_matches')
      .select('player1_answered_current, player2_answered_current, current_question, updated_at')
      .eq('id', window.currentAsyncMatchId)
      .single();
    
    if (matchError) {
      console.error('❌ Error obteniendo estado de partida:', matchError);
      // Fallback: consultar async_answers si los campos calculados no están disponibles
      console.log('⚠️ Fallback: consultando async_answers directamente');
      const { data: answers } = await supabaseClient
        .from('async_answers')
        .select('player_id')
        .eq('match_id', window.currentAsyncMatchId)
        .eq('question_index', currentState.index - 1);
      
      const answeredPlayers = answers?.map(a => a.player_id) || [];
      const allPlayers = [window.currentAsyncMatch.player1_id, window.currentAsyncMatch.player2_id];
      const bothAnswered = allPlayers.every(id => answeredPlayers.includes(id));
      
      if (bothAnswered) {
        console.log('🎉 ¡Ambos jugadores respondieron! (fallback)');
        await notifyBothAnswered(window.currentAsyncMatchId, currentState.index - 1);
        setTimeout(() => {
          if (window.nextAsyncQuestion) {
            window.nextAsyncQuestion();
          }
        }, 600);
      }
      return;
    }
    
    // Usar campos calculados (optimizado - sin query a async_answers)
    console.log('✅ Estado de partida obtenido (campos calculados):', {
      player1_answered: updatedMatch.player1_answered_current,
      player2_answered: updatedMatch.player2_answered_current,
      updated_at: updatedMatch.updated_at
    });
    
    const bothAnswered = updatedMatch.player1_answered_current && 
                         updatedMatch.player2_answered_current;
    
    console.log('🔍 Verificación usando campos calculados:', {
      player1_answered_current: updatedMatch.player1_answered_current,
      player2_answered_current: updatedMatch.player2_answered_current,
      bothAnswered
    });
    
    if (bothAnswered) {
      console.log('🎉 ¡Ambos jugadores respondieron! Notificando y avanzando...');
      
      const nextQuestionIndex = currentState.index;
      
      // Notificar al otro jugador que ambos respondieron (esto dispara el avance en BD)
      await notifyBothAnswered(window.currentAsyncMatchId, currentState.index - 1);
      
      // El avance en BD se hace en async_vs.js checkBothAnswered
      // Aquí solo invalidamos caché y avanzamos localmente si estamos en la partida
      
      // Invalidar caché de partidas abiertas cuando ambos responden
      if (window.asyncMatchesCache && window.currentUser?.id) {
        window.asyncMatchesCache.invalidate(window.currentUser.id);
        // También invalidar para el otro jugador si tenemos su ID
        const otherPlayerId = window.currentAsyncMatch?.player1_id === window.currentUser.id 
          ? window.currentAsyncMatch?.player2_id 
          : window.currentAsyncMatch?.player1_id;
        if (otherPlayerId) {
          window.asyncMatchesCache.invalidate(otherPlayerId);
        }
      }
      
      // Pequeño delay para que ambos vean los colores (como VS mode)
      // NOTA: El avance automático se hace en checkBothAnswered (async_vs.js)
      // pero también aquí para asegurar sincronización local
      setTimeout(() => {
        console.log('🔄 Avanzando a siguiente pregunta (local)...');
        if (window.nextAsyncQuestion) {
          window.nextAsyncQuestion();
        }
      }, 600);
    } else {
      console.log('⏳ Esperando a que el rival responda...');
    }
  } catch (error) {
    console.error('Error en saveAsyncAnswerAndCheck:', error);
  }
}

async function notifyAnswerSubmitted(matchId, questionIndex, isCorrect) {
  try {
    const supabaseClient = window.supabaseClient;
    if (!supabaseClient) {
      console.error('❌ Supabase client no disponible para notificación');
      return;
    }
    
    await supabaseClient
      .channel('async_match_notifications')
      .send({
        type: 'broadcast',
        event: 'answer_submitted',
        payload: {
          matchId: matchId,
          questionIndex: questionIndex,
          isCorrect: isCorrect,
          playerName: window.currentUser?.name || 'Anon'
        }
      });
    
    console.log('📡 Notificación de respuesta enviada');
  } catch (error) {
    console.error('Error enviando notificación de respuesta:', error);
  }
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

// Timer para preguntas asíncronas (15 segundos)
let asyncQuestionTimer = null;
let asyncQuestionTimeLeft = 15;

function startAsyncQuestionTimer(q, currentState) {
  // Limpiar timer anterior si existe
  if (asyncQuestionTimer) {
    clearInterval(asyncQuestionTimer);
  }
  
  asyncQuestionTimeLeft = 15;
  console.log('⏰ Iniciando timer de 15 segundos para pregunta asíncrona');
  
  // Actualizar UI del timer inmediatamente
  updateAsyncTimerDisplay();
  
  asyncQuestionTimer = setInterval(() => {
    asyncQuestionTimeLeft--;
    console.log('⏰ Timer:', asyncQuestionTimeLeft, 'segundos restantes');
    updateAsyncTimerDisplay();
    
    if (asyncQuestionTimeLeft <= 0) {
      console.log('⏰ Tiempo agotado - marcando como incorrecta');
      handleAsyncTimeout(q, currentState);
    }
  }, 1000);
}

function updateAsyncTimerDisplay() {
  // Actualizar el HUD directamente
  const currentState = window.STATE || STATE;
  if (currentState.mode === 'async') {
    hud(); // Esto actualizará el HUD con el timer
  }
}

async function handleAsyncTimeout(q, currentState) {
  if (asyncQuestionTimer) {
    clearInterval(asyncQuestionTimer);
    asyncQuestionTimer = null;
  }
  
  // Marcar como incorrecta automáticamente
  const question = currentState.deck[currentState.index - 1];
  if (question) {
    console.log('⏰ Tiempo agotado - guardando respuesta incorrecta');
    await saveAsyncAnswerAndCheck(currentState, question, false, -1); // -1 indica timeout
  }
  
  // Deshabilitar opciones y mostrar respuesta correcta
  const optionsEl = document.getElementById('options');
  if (optionsEl) {
    Array.from(optionsEl.children).forEach((option, index) => {
      option.classList.add('disabled');
      option.style.pointerEvents = 'none';
      
      // Marcar la respuesta correcta en verde
      if (index === q.answer) {
        option.classList.add('correct');
      }
    });
  }
  
  // Mostrar mensaje de tiempo agotado
  toast('⏰ Tiempo agotado - Respuesta incorrecta');
}

// Limpiar timer cuando se responde
function clearAsyncQuestionTimer() {
  if (asyncQuestionTimer) {
    clearInterval(asyncQuestionTimer);
    asyncQuestionTimer = null;
  }
}

// Función para notificar que ambos jugadores respondieron
async function notifyBothAnswered(matchId, questionIndex) {
  console.log('📢 Notificando que ambos jugadores respondieron:', { matchId, questionIndex });
  
  const supabaseClient = window.supabaseClient;
  if (!supabaseClient) {
    console.error('❌ Supabase client no disponible para notificación');
    return;
  }
  
  try {
    const { error } = await supabaseClient
      .channel('async_match_notifications')
      .send({
        type: 'broadcast',
        event: 'both_answered',
        payload: {
          match_id: matchId,
          question_index: questionIndex,
          timestamp: new Date().toISOString()
        }
      });
    
    if (error) {
      console.error('❌ Error enviando notificación:', error);
    } else {
      console.log('✅ Notificación enviada correctamente');
    }
  } catch (error) {
    console.error('❌ Error en notifyBothAnswered:', error);
  }
}