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
      // El contexto puede estar suspendido
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      audioInitialized = true;

    } catch (e) {

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

    }
  }
}

// Agregar listeners para inicializar audio
if (typeof document !== 'undefined') {
  document.addEventListener('touchstart', initAudioOnInteraction, { once: true });
  document.addEventListener('click', initAudioOnInteraction, { once: true });
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

function hud(){
  const el = document.getElementById('kHUD');
  if (!el) return;
  
  // Usar window.STATE si está disponible (modo asíncrono), sino usar STATE local
  const currentState = window.STATE || STATE;
  
  if (currentState.mode === 'async' || currentState.mode === 'async_v2') {
    // Modo asíncrono - mostrar timer de pregunta (solo para async V1)
    const timerDisplay = (currentState.mode === 'async' && asyncQuestionTimer && asyncQuestionTimeLeft > 0) ? ` · ${asyncQuestionTimeLeft}s` : '';
    
    // Validar que el índice no exceda el total (corrección de bug)
    const displayIndex = Math.min(currentState.index, currentState.total - 1);
    el.textContent = `${displayIndex + 1}/${currentState.total} · ${currentState.score} pts${timerDisplay}`;
    
    // Si el índice excedió el total, es un error - loguear para debug
    if (currentState.index >= currentState.total) {

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

function setQuestionMedia(u){ 
  const w=document.getElementById('qMedia'); 
  if(!w) return; 
  const img=w.querySelector('img'); 
  if(!u){ 
    w.style.display='none'; 
    w.classList.remove('qMedia-portrait');
    return;
  } 
  
  // Detectar si la imagen es vertical (más alta que ancha)
  img.onload=()=>{
    const isPortrait = img.naturalHeight > img.naturalWidth;
    if(isPortrait) {
      w.classList.add('qMedia-portrait');
    } else {
      w.classList.remove('qMedia-portrait');
    }
    w.style.display='block';
  };
  img.onerror=()=>{
    w.style.display='none';
    w.classList.remove('qMedia-portrait');
  };
  img.src=u; 
}

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
          // Funcionalidad de revancha removida (VS eliminado)
          if (window.toast) {
            window.toast('Funcionalidad de revancha no disponible');
          }
        } catch (error) {

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

// Función auxiliar para decodificar entidades HTML
function decodeHtmlEntities(text) {
  if (!text || typeof text !== 'string') return text;
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
}

// Función para aleatorizar opciones manteniendo el mapeo de índices
function shuffleOptions(options, correctAnswerIndex) {
  // Crear array de índices [0, 1, 2, 3]
  const indices = options.map((_, i) => i);
  
  // Aleatorizar usando Fisher-Yates shuffle
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  
  // Crear opciones aleatorizadas
  const shuffledOptions = indices.map(i => options[i]);
  
  // Crear mapeo: nuevo índice -> índice original
  const indexMap = {};
  indices.forEach((originalIndex, newIndex) => {
    indexMap[newIndex] = originalIndex;
  });
  
  // Encontrar el nuevo índice de la respuesta correcta
  const newCorrectIndex = indices.indexOf(correctAnswerIndex);
  
  return {
    options: shuffledOptions,
    indexMap: indexMap, // nuevo índice -> índice original
    reverseMap: indices, // nuevo índice -> índice original (array)
    correctIndex: newCorrectIndex
  };
}

export function renderQuestion(q){ 
  const qEl=document.getElementById('qText'); 
  if(qEl) {
    const decodedText = decodeHtmlEntities(q.q);
    qEl.textContent = decodedText;
  } 
  try{ setQuestionMedia(q.img || (q.media && q.media.src) || null); }catch{}
  
  // Guardar datos de pregunta para reporte
  try {
    if (window.setCurrentQuestionData) {
      window.setCurrentQuestionData(q);
    }
  } catch(e) {}

  const optionsEl = document.getElementById('options');
  optionsEl.innerHTML = '';
  let locked = false;
  
  // Usar window.STATE si está disponible (modo asíncrono), sino usar STATE local
  const currentState = window.STATE || STATE;
  
  // Guardar tiempo de inicio de pregunta para calcular timeSpent (modo async_v2)
  if (currentState.mode === 'async_v2') {
    currentState.questionStartTime = Date.now();

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

    // Si ya respondió, marcar como locked desde el inicio
    locked = true;
    
    // Mostrar mensaje informativo
    if (window.showAsyncExitMessage) {
      window.showAsyncExitMessage();
    }
  }

  // Aleatorizar opciones
  const shuffled = shuffleOptions(q.options, q.answer);
  const shuffledOptions = shuffled.options;
  const indexMap = shuffled.indexMap;
  const correctAnswerIndex = shuffled.correctIndex;
  
  // Guardar el mapeo en la pregunta para usarlo después
  q._shuffledIndexMap = indexMap;
  q._originalAnswer = q.answer;
  q._shuffledAnswer = correctAnswerIndex;

  shuffledOptions.forEach((opt, i)=>{
    const div = document.createElement('button');
    div.type='button';
    div.className = 'option';
    const decodedOpt = decodeHtmlEntities(opt);
    div.textContent = `${String.fromCharCode(65+i)}. ${decodedOpt}`;
    
    // Si ya respondió, marcar la respuesta y deshabilitar opciones
    if (alreadyAnswered && myAnswerIndex !== null) {
      // Convertir el índice original de la respuesta del jugador al índice aleatorizado
      const shuffledMyAnswerIndex = shuffled.reverseMap.indexOf(myAnswerIndex);
      
      if (i === shuffledMyAnswerIndex) {
        // Marcar la respuesta del jugador
        if (myAnswerIndex === q._originalAnswer) {
          div.classList.add('correct');
          currentState.score++;
        } else {
          div.classList.add('wrong');
        }
      }
      
      // Mostrar respuesta correcta si respondió mal
      if (myAnswerIndex !== q._originalAnswer && i === correctAnswerIndex) {
        div.classList.add('correct');
      }
      
      // Deshabilitar todas las opciones
      div.classList.add('disabled');
      div.style.pointerEvents = 'none';
    }

    const handler = async ()=>{
      // Si ya respondió, no permitir cambiar la respuesta
      if (alreadyAnswered) {

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

        return;
      }

      // Convertir el índice seleccionado (aleatorizado) al índice original
      const originalIndex = indexMap[i];
      
      let results = {};
      if(originalIndex === q._originalAnswer){
        div.classList.add('correct');
        currentState.score++;
        results = await trackEvent('answer_correct', { category: question.category, difficulty: question.difficulty });
      } else {
        div.classList.add('wrong');
        // Marcar todas las opciones incorrectas que se clickearon
        optionsEl.children[i].classList.add('wrong');
        // Mostrar la respuesta correcta
        const corr = optionsEl.children[correctAnswerIndex];
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
        // Usar el índice original para guardar la respuesta
        await saveAsyncAnswerAndCheck(currentState, question, originalIndex === q._originalAnswer, originalIndex, timeSpent);
      }

      updatePlayerXPBar();
      if(results.leveledUp) toast("🎉 ¡Subiste de Nivel! 🎉");
      if(results.bonusToast) toast(results.bonusToast);
      results.newAchievements.forEach(ach => toast(`🏆 ¡Logro desbloqueado: ${ach.title}!`));

      if (currentState.mode === 'async' || currentState.mode === 'async_v2') {
        // En modo asíncrono, no avanzar automáticamente
        // Esperar a que ambos respondan

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
      } else if (SETTINGS.autoNextRounds) {
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
  
  if (bCat)  bCat.textContent  = q.category || 'Solo';
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
  let results = {};

  // Usar window.STATE si está disponible (modo asíncrono), sino usar STATE local
  const currentState = window.STATE || STATE;

  // NO mostrar resultados si está en modo async_v2 esperando al rival
  // Solo mostrar resultados cuando la partida realmente terminó
  if (currentState.mode === 'async_v2' && 
      (currentState.status === 'waiting_for_opponent_answer' || window.currentAsyncMatchId)) {

    showGame(false);
    return; // Salir sin mostrar resultados
  }

  const isPerfect = (currentState.score === currentState.total && currentState.total >= 15);
  const won = currentState.score >= currentState.total / 2;
  results = await trackEvent('game_finish', { mode: currentState.mode === 'async' || currentState.mode === 'async_v2' ? 'async' : 'solo', won, isPerfect });
  
  let title, sub;
  if (isPerfect) { title='¡Perfecto!'; sub='¡Ningún error!'; }
  else if (won){ title='¡Muy bien!'; sub='¡Gran partida!'; }
  else { title='¡No te rindas!'; sub='La próxima será mejor.'; }
  openSingleResult({ title, subtitle: sub, scoreText: `${currentState.score} / ${currentState.total}` });
  
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
  
  if (mode === 'vs') {
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

    } else if (currentState.deck && currentState.deck.length > 0) {
      // Si ya está en STATE, usarlo

    } else {
      // Fallback: generar deck localmente
      currentState.deck = await buildDeckSingle(currentState.category, currentState.rounds, currentState.difficulty);

    }
    
    // Asegurar que el index esté dentro del rango válido
    if (currentState.index < 0 || currentState.index >= currentState.deck.length) {

      currentState.index = 0;
    }
  } else {
    // Modo normal (solo, etc.)
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

        }
      }
      
      currentState.total = total;
      currentState.deck  = await buildDeckSingle(selectedCat, total, diff);
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

  // Detectar si estamos en modo V2
  if (window.currentGameMode === 'async_v2' && window.saveAsyncAnswerV2) {

    return await window.saveAsyncAnswerV2(currentState, question, isCorrect, selectedAnswer, timeSpent);
  }
  
  if (!window.currentAsyncMatchId) {

    return;
  }
  
  const supabaseClient = window.supabaseClient;
  if (!supabaseClient) {

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

  if (!playerId) {

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

      return; // Ya respondió, no hacer nada
    }
  } catch (checkError) {
    // Si no existe, es normal (404 es esperado)
    // Si hay otro error, loguear pero continuar
    if (checkError.code !== 'PGRST116') {

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

    const { data: insertData, error } = await supabaseClient
      .from('async_answers')
      .insert([answerData])
      .select();

    if (error) {

      return;
    }

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

      // Fallback: consultar async_answers si los campos calculados no están disponibles

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

    if (bothAnswered) {

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

    }
  } catch (error) {

  }
}

async function notifyAnswerSubmitted(matchId, questionIndex, isCorrect) {
  try {
    const supabaseClient = window.supabaseClient;
    if (!supabaseClient) {

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

  } catch (error) {

  }
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

  // Actualizar UI del timer inmediatamente
  updateAsyncTimerDisplay();
  
  asyncQuestionTimer = setInterval(() => {
    asyncQuestionTimeLeft--;

    updateAsyncTimerDisplay();
    
    if (asyncQuestionTimeLeft <= 0) {

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

  const supabaseClient = window.supabaseClient;
  if (!supabaseClient) {

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

    } else {

    }
  } catch (error) {

  }
}