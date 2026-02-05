// js/game_solo.js
import { SETTINGS, STATE } from '../core/store.js';
import { buildDeckSingle, ensureInitial60 } from './bank.js';
import { trackEvent } from '../player/stats.js';
import { toast, updatePlayerXPBar } from './ui.js';
import { t } from '../core/i18n.js';

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
  
  el.classList.remove('urgent');
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


export function openSingleResult({title, subtitle, scoreText, details, wrongAnswers = []}){
  const fs = document.getElementById('fsSingleResult');
  const titleEl = document.getElementById('srTitle');
  const subtitleEl = document.getElementById('srSubtitle');
  
  if (titleEl) {
    titleEl.textContent = title;
    titleEl.style.cssText = 'font-size: 1.1em; font-weight: 600; margin-bottom: 0.1em; line-height: 1.2;';
  }
  if (subtitleEl) {
    subtitleEl.textContent = subtitle;
    subtitleEl.style.cssText = 'font-size: 0.9em; font-weight: 400; margin-bottom: 1em; opacity: 0.7; line-height: 1.2; margin-top: 0.1em;';
  }
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
  
  // Mostrar listado de preguntas incorrectas
  const wrongAnswersEl = document.getElementById('srWrongAnswers');
  if (wrongAnswersEl) {
    if (wrongAnswers && wrongAnswers.length > 0) {
      wrongAnswersEl.innerHTML = '';
      wrongAnswersEl.style.display = 'block';
      
      const titleEl = document.createElement('h3');
      titleEl.textContent = 'Incorrect Answers:';
      titleEl.style.cssText = 'margin-top: 0; margin-bottom: 12px; font-size: 1.2em; font-weight: 600;';
      wrongAnswersEl.appendChild(titleEl);
      
      const listEl = document.createElement('div');
      listEl.style.cssText = 'margin-top: 12px; max-height: 400px; overflow-y: auto;';
      
      wrongAnswers.forEach((item, index) => {
        const itemEl = document.createElement('div');
        itemEl.style.cssText = 'margin-bottom: 8px; padding: 8px; background: rgba(255, 255, 255, 0.05); border-radius: 8px; cursor: pointer;';
        
        // Hacer clickeable para mostrar el versículo
        if (item.book && item.reference) {
          itemEl.addEventListener('click', function(e) {
            e.stopPropagation();
            e.preventDefault();
            const showModal = window.showVerseModal || showVerseModal;
            if (showModal) {
              showModal(item.book, item.reference);
            }
          });
        }
        
        const questionEl = document.createElement('div');
        questionEl.textContent = `${index + 1}. ${item.question}`;
        questionEl.style.cssText = 'margin-bottom: 4px; font-weight: 500; line-height: 1.3; pointer-events: none;';
        itemEl.appendChild(questionEl);
        
        const answerEl = document.createElement('div');
        answerEl.innerHTML = `<strong>Correct answer:</strong> ${item.correctAnswer || 'N/A'}`;
        answerEl.style.cssText = 'margin-bottom: 4px; color: #4ade80; line-height: 1.3; pointer-events: none;';
        itemEl.appendChild(answerEl);
        
        if (item.book && item.reference) {
          const bookLinkEl = document.createElement('div');
          bookLinkEl.style.cssText = 'margin-top: 4px; pointer-events: none;';
          
          const link = document.createElement('a');
          // Crear enlace a Bible Gateway
          const bookName = item.book.replace(/\s+/g, '+');
          const refParts = item.reference.match(/(\d+):(\d+)/);
          if (refParts) {
            const chapter = refParts[1];
            const verse = refParts[2];
            link.href = `https://www.biblegateway.com/passage/?search=${bookName}+${chapter}:${verse}&version=NIV`;
          } else {
            link.href = `https://www.biblegateway.com/passage/?search=${bookName}&version=NIV`;
          }
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          link.textContent = `📖 Read ${item.book} ${item.reference}`;
          link.style.cssText = 'color: #60a5fa; text-decoration: none; font-weight: 500; line-height: 1.3; pointer-events: auto;';
          link.addEventListener('click', (e) => {
            e.stopPropagation();
            // Permitir que el enlace funcione normalmente
          });
          
          bookLinkEl.appendChild(link);
          itemEl.appendChild(bookLinkEl);
        }
        
        listEl.appendChild(itemEl);
      });
      
      wrongAnswersEl.appendChild(listEl);
    } else {
      wrongAnswersEl.style.display = 'none';
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
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
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

// Función para mostrar el modal con el versículo
export function showVerseModal(book, reference) {
  const modal = document.getElementById('verseModal');
  const titleEl = document.getElementById('verseModalTitle');
  const referenceEl = document.getElementById('verseReference');
  const textEl = document.getElementById('verseText');
  const linkEl = document.getElementById('verseLink');
  const closeBtn = document.getElementById('closeVerseModal');
  
  if (!modal) return;
  
  // Configurar referencia
  if (referenceEl) {
    referenceEl.textContent = `${book} ${reference}`;
  }
  
  // Configurar título del modal
  if (titleEl) {
    titleEl.textContent = 'Bible Verse';
  }
  
  // Mostrar mensaje de carga
  if (textEl) {
    textEl.textContent = 'Loading verse...';
  }
  
  // Configurar enlace
  if (linkEl) {
    const bookName = book.replace(/\s+/g, '+');
    const refParts = reference.match(/(\d+):(\d+)/);
    if (refParts) {
      const chapter = refParts[1];
      const verse = refParts[2];
      linkEl.href = `https://www.biblegateway.com/passage/?search=${bookName}+${chapter}:${verse}&version=NIV`;
    } else {
      linkEl.href = `https://www.biblegateway.com/passage/?search=${bookName}&version=NIV`;
    }
  }
  
  // Mostrar modal
  modal.style.display = 'block';
  // Asegurar que el modal esté visible
  const wrap = modal.querySelector('.wrap');
  if (wrap) {
    wrap.style.display = 'block';
  }
  window.scrollTo(0, 0);
  
  // Cargar versículo desde archivo local
  async function loadVerseFromFile() {
    try {
      const refParts = reference.match(/(\d+):(\d+)/);
      if (!refParts) {
        if (textEl) {
          textEl.innerHTML = `Click the link below to read <strong>${book} ${reference}</strong> on Bible Gateway.`;
        }
        return;
      }
      
      const chapter = refParts[1];
      const verse = refParts[2];
      
      // Mapear nombre del libro a nombre de archivo (Antiguo Testamento completo)
      const bookFileMap = {
        // Pentateuco
        'Genesis': 'gen',
        'Exodus': 'exod',
        'Leviticus': 'lev',
        'Numbers': 'num',
        'Deuteronomy': 'deut',
        // Libros históricos
        'Joshua': 'josh',
        'Judges': 'judg',
        'Ruth': 'ruth',
        '1 Samuel': '1sam',
        '2 Samuel': '2sam',
        '1 Kings': '1kgs',
        '2 Kings': '2kgs',
        '1 Chronicles': '1chr',
        '2 Chronicles': '2chr',
        'Ezra': 'ezra',
        'Nehemiah': 'neh',
        'Esther': 'esth',
        // Libros poéticos
        'Job': 'job',
        'Psalms': 'ps',
        'Psalm': 'ps',
        'Proverbs': 'prov',
        'Ecclesiastes': 'eccl',
        'Song of Solomon': 'song',
        'Song of Songs': 'song',
        // Profetas mayores
        'Isaiah': 'isa',
        'Jeremiah': 'jer',
        'Lamentations': 'lam',
        'Ezekiel': 'ezek',
        'Daniel': 'dan',
        // Profetas menores
        'Hosea': 'hos',
        'Joel': 'joel',
        'Amos': 'amos',
        'Obadiah': 'obad',
        'Jonah': 'jonah',
        'Micah': 'mic',
        'Nahum': 'nah',
        'Habakkuk': 'hab',
        'Zephaniah': 'zeph',
        'Haggai': 'hag',
        'Zechariah': 'zech',
        'Malachi': 'mal'
      };
      
      const fileName = bookFileMap[book] || book.toLowerCase().replace(/\s+/g, '');
      const filePath = `./data/bible/en/${fileName}.json`;
      
      try {
        const response = await fetch(filePath);
        if (!response.ok) {
          throw new Error('File not found');
        }
        
        const data = await response.json();
        const chapterData = data.chapters?.find(ch => ch.chapter === chapter);
        const verseData = chapterData?.verses?.find(v => v.verse === verse);
        
        if (verseData && textEl) {
          textEl.innerHTML = `
            <p style="margin-bottom: 12px; line-height: 1.8; font-size: 1.1em;">
              ${verseData.text}
            </p>
          `;
        } else {
          throw new Error('Verse not found');
        }
      } catch (fileError) {
        // Si no se encuentra el archivo, mostrar mensaje con enlace
        if (textEl) {
          textEl.innerHTML = `
            <p style="margin-bottom: 12px;">Click the link below to read the full passage on Bible Gateway.</p>
            <p style="font-style: italic; color: rgba(255, 255, 255, 0.7);">
              Reference: <strong>${book} ${chapter}:${verse}</strong>
            </p>
          `;
        }
      }
    } catch (error) {
      if (textEl) {
        const refParts = reference.match(/(\d+):(\d+)/);
        if (refParts) {
          textEl.innerHTML = `
            <p style="margin-bottom: 12px;">Click the link below to read the full passage on Bible Gateway.</p>
            <p style="font-style: italic; color: rgba(255, 255, 255, 0.7);">
              Reference: <strong>${book} ${reference}</strong>
            </p>
          `;
        } else {
          textEl.innerHTML = `Click the link below to read <strong>${book} ${reference}</strong> on Bible Gateway.`;
        }
      }
    }
  }
  
  // Cargar versículo
  loadVerseFromFile();
  
  // Botón de cerrar
  if (closeBtn) {
    // Remover listeners anteriores si existen
    closeBtn.replaceWith(closeBtn.cloneNode(true));
    const newCloseBtn = document.getElementById('closeVerseModal');
    newCloseBtn.onclick = () => {
      modal.style.display = 'none';
    };
  }
  
  // Cerrar al hacer clic fuera del modal
  const closeHandler = (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
      modal.removeEventListener('click', closeHandler);
    }
  };
  // Remover listener anterior si existe
  modal.removeEventListener('click', closeHandler);
  modal.addEventListener('click', closeHandler);
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
  let alreadyAnswered = false;
  let myAnswerIndex = null;
  
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
      
      // Marcar que ya se respondió
      alreadyAnswered = true;
      myAnswerIndex = originalIndex;
      
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
        // Guardar pregunta incorrecta para mostrar al final
        if (!currentState.wrongAnswers) {
          currentState.wrongAnswers = [];
        }
        // Usar el objeto question original del deck, no q que puede estar modificado
        // Obtener la respuesta correcta usando el índice original de la pregunta
        const originalAnswerIndex = question.answer !== undefined ? question.answer : q._originalAnswer;
        const correctAnswer = question.options && question.options[originalAnswerIndex] ? question.options[originalAnswerIndex] : null;
        currentState.wrongAnswers.push({
          question: question.q || question.question,
          book: question.book,
          reference: question.reference,
          correctAnswer: correctAnswer
        });
        results = await trackEvent('answer_wrong');
      }
      
      // Deshabilitar todas las opciones
      Array.from(optionsEl.children).forEach(option => {
        option.classList.add('disabled');
        option.style.pointerEvents = 'none';
      });

      updatePlayerXPBar();
      if(results.leveledUp) toast("🎉 Level Up! 🎉");
      if(results.bonusToast) toast(results.bonusToast);
      results.newAchievements.forEach(ach => toast(`🏆 Achievement unlocked: ${ach.title}!`));

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
  if (isPerfect) { title='Perfect!'; sub='No mistakes!'; }
  else if (won){ title='Great job!'; sub='Excellent game!'; }
  else { title='Keep trying!'; sub='Next time will be better.'; }
  
  const wrongAnswers = currentState.wrongAnswers || [];
  openSingleResult({ 
    title, 
    subtitle: sub, 
    scoreText: `${currentState.score} / ${currentState.total}`,
    wrongAnswers: wrongAnswers
  });
  
  updatePlayerXPBar();
  if(results.leveledUp) toast("🎉 Level Up! 🎉");
  if(results.bonusToast) toast(results.bonusToast);
  results.newAchievements.forEach(ach => setTimeout(() => toast(`🏆 Achievement unlocked: ${ach.title}!`), 500));

  showGame(false);
}

// --- FUNCIONES RESTAURADAS ---
function getActiveMode(){
  const a = [...document.querySelectorAll('#modeSeg .seg')].find(s=> s.classList.contains('active'));
  return a?.dataset?.val || 'rounds';
}

function getActiveDifficulty(){
  const diffSelect = document.getElementById('difficulty');
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
    if(leveledUp) toast("🎉 Level Up! 🎉");
    newAchievements.forEach(ach => toast(`🏆 Achievement unlocked: ${ach.title}!`));
    
    currentState.score = 0;
    currentState.index = 0;
    currentState.mode  = segActive;
    currentState.wrongAnswers = []; // Reset wrong answers array

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
