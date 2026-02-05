// js/game_solo.js
import { SETTINGS, STATE } from '../core/store.js';
import { buildDeckSingle, ensureInitial60 } from './bank.js';
import { trackEvent } from '../player/stats.js';
import { toast, updatePlayerXPBar } from './ui.js';
import { t } from '../core/i18n.js';
// Sistema de amigos removido

let audioCtx = null;
let audioInitialized = false;

function ensureAC() {
  if (!SETTINGS.sounds) return null;
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      audioCtx = null;
      return null;
    }
  }
  // Solo intentar resume si el contexto está suspendido y ya fue inicializado por interacción
  if (audioCtx && audioCtx.state === 'suspended' && audioInitialized) {
    audioCtx.resume().catch(() => {
      // Ignorar errores de resume si el usuario aún no ha interactuado
    });
  }
  return audioCtx;
}

// Inicializar audio en el primer click/touch
function initAudioOnInteraction() {
  if (!audioInitialized && !audioCtx) {
    ensureAC();
    // Marcar como inicializado después de la interacción del usuario
    audioInitialized = true;
    // Reproducir un sonido silencioso para activar el audio en móvil
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().then(() => {
        try {
          const buffer = audioCtx.createBuffer(1, 1, 22050);
          const source = audioCtx.createBufferSource();
          source.buffer = buffer;
          source.connect(audioCtx.destination);
          source.start(0);
        } catch (e) {
          // Ignorar errores al crear buffer silencioso
        }
      }).catch(() => {
        // Ignorar errores de resume
      });
    } else if (audioCtx) {
      try {
        const buffer = audioCtx.createBuffer(1, 1, 22050);
        const source = audioCtx.createBufferSource();
        source.buffer = buffer;
        source.connect(audioCtx.destination);
        source.start(0);
      } catch (e) {
        // Ignorar errores al crear buffer silencioso
      }
    }
  } else if (audioCtx && audioCtx.state === 'suspended') {
    // Si el contexto ya existe pero está suspendido, intentar resumirlo
    audioCtx.resume().catch(() => {
      // Ignorar errores
    });
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
  
  const currentState = STATE;
  
  // Validar que el índice no exceda el total
  const displayIndex = Math.min(currentState.index, currentState.total - 1);
  el.textContent = `${displayIndex + 1}/${currentState.total} · ${currentState.score} pts`;
  
  // Cambiar color cuando quedan 5 segundos o menos
  if (false) {
    el.classList.add('urgent');
  } else {
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


export function openSingleResult({title, subtitle, scoreText, details}){
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
          <img src="./assets/logo/logo.webp" alt="Bible Trivia" class="app-logo"/>
        </div>
        <div class="row">
          <button class="iconbtn avatar-btn" id="btnProfileResults" aria-label="Perfil de Usuario">
            <img src="img/avatar_placeholder.svg" alt="Avatar"/>
          </button>
        </div>
      `;
      wrap.insertBefore(appHeader, wrap.firstChild);
      
      // Vincular eventos de los botones
      setTimeout(() => {
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
      const shareText = `${currentTitle}\n${currentSubtitle}\n${currentScore}${currentDetails ? '\n' + currentDetails : ''}\n\n¡Jugá Bible Trivia! 🎮`;
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
  
  const currentState = STATE;

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

      // Usar el índice (que se incrementa después de renderizar)
      const question = currentState.deck[currentState.index - 1];
      
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

      updatePlayerXPBar();
      if(results.leveledUp) toast("🎉 ¡Subiste de Nivel! 🎉");
      if(results.bonusToast) toast(results.bonusToast);
      results.newAchievements.forEach(ach => toast(`🏆 ¡Logro desbloqueado: ${ach.title}!`));

      if (SETTINGS.autoNextRounds) {
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
  const currentState = STATE;
  
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

  const currentState = STATE;

  const isPerfect = (currentState.score === currentState.total && currentState.total >= 15);
  const won = currentState.score >= currentState.total / 2;
  results = await trackEvent('game_finish', { mode: 'solo', won, isPerfect });
  
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
  
  if (false) {
    diffSelect = null;
  } else {
    diffSelect = document.getElementById('difficulty');
  }
  
  return diffSelect?.value || 'easy';
}
// --- FIN DE FUNCIONES RESTAURADAS ---

export async function startSolo(){
  const currentState = STATE;
  
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
      
      currentState.total = total;
      const bookSel = document.getElementById('bookSel');
      const bookFilter = (selectedCat.startsWith('filepack:') && bookSel?.value) ? bookSel.value : null;
      currentState.deck  = await buildDeckSingle(selectedCat, total, diff, null, bookFilter);
    }

  showGame(true);
  nextQuestion();
}
