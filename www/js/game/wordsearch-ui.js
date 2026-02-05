/**
 * UI de Sopa de letras: renderizado, selección y validación.
 */
import { generateWordSearch } from './wordsearch.js';
import { t } from '../core/i18n.js';
import { showConfigUI } from '../ui/game-ui.js';
import { openReaderWithBook } from './bible-study.js';

let wsState = null;

function onCompleteVerseClick() {
  if (!wsState?.verse?.bookId) return;
  openReaderWithBook(wsState.verse.bookId, wsState.verse.chapter, wsState.verse.verse);
}

function normalize(s) {
  return (s || '').normalize('NFD').replace(/\u0300/g, '').toUpperCase();
}

function renderGrid(grid, words) {
  const el = document.getElementById('wsGrid');
  if (!el) return;
  el.innerHTML = '';
  const rows = grid.length;
  const cols = grid[0].length;
  el.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
  el.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = document.createElement('div');
      cell.className = 'ws-cell';
          cell.setAttribute('role', 'gridcell');
      cell.dataset.r = r;
      cell.dataset.c = c;
      cell.textContent = grid[r][c];
      el.appendChild(cell);
    }
  }
}

function renderVerse(verse) {
  const wrap = document.getElementById('wsWordList');
  if (!wrap) return;
  
  if (!verse) {
    wrap.innerHTML = '';
    return;
  }

  // Crear estructura para mostrar el versículo con palabras ocultas
  // El HTML ya viene con los spans con ancho fijo desde createHiddenText
  wrap.innerHTML = `
    <div class="ws-verse-ref">${escapeHtml(verse.ref)}</div>
    <div class="ws-verse-text" id="wsVerseText">${verse.hiddenText}</div>
  `;
}

function escapeHtml(text) {
  if (text == null) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function revealWordInVerse(word, originalText, hiddenWords) {
  const verseTextEl = document.getElementById('wsVerseText');
  if (!verseTextEl || !wsState.verse) return;

  const wordNorm = normalize(word);
  const currentFound = Array.from(wsState.foundWords).map(w => normalize(w));
  
  // Buscar todos los spans de palabras ocultas que coincidan con esta palabra
  const blankSpans = verseTextEl.querySelectorAll('.ws-word-blank');
  let foundNewWord = false;
  
  blankSpans.forEach(span => {
    const spanWordNorm = span.getAttribute('data-word-norm');
    if (spanWordNorm === wordNorm && currentFound.includes(wordNorm)) {
      // Revelar la palabra - cambiar la clase para mostrar la palabra invisible
      if (!foundNewWord) {
        span.className = 'ws-word-blank ws-word-revealed';
        foundNewWord = true;
        
        // Animación
        const invisibleSpan = span.querySelector('.ws-word-invisible');
        if (invisibleSpan) {
          invisibleSpan.style.animation = 'wsRevealWord 0.5s ease-out';
          setTimeout(() => {
            span.classList.remove('ws-word-revealed');
            span.classList.add('ws-word-found');
            if (invisibleSpan) invisibleSpan.style.animation = '';
          }, 500);
        }
      } else {
        // Otras ocurrencias de la misma palabra
        span.className = 'ws-word-blank ws-word-found';
      }
    }
  });
  
  // Actualizar todas las palabras ya encontradas
  blankSpans.forEach(span => {
    const spanWordNorm = span.getAttribute('data-word-norm');
    if (spanWordNorm && currentFound.includes(spanWordNorm) && 
        !span.classList.contains('ws-word-found') && 
        !span.classList.contains('ws-word-revealed') &&
        !span.classList.contains('ws-word-hint')) {
      span.className = 'ws-word-blank ws-word-found';
    }
  });
}

let hintTimeout = null;
let hintWordElement = null;

function showHint() {
  if (!wsState || !wsState.verse) return;
  
  const verseTextEl = document.getElementById('wsVerseText');
  if (!verseTextEl) return;
  
  const currentFound = Array.from(wsState.foundWords).map(w => normalize(w));
  const hiddenWords = wsState.verse.hiddenWords || [];
  
  // Encontrar una palabra que aún no ha sido encontrada
  const notFoundWords = hiddenWords.filter(w => !currentFound.includes(normalize(w)));
  if (notFoundWords.length === 0) return;
  
  // Seleccionar una palabra aleatoria de las no encontradas
  const hintWordNorm = notFoundWords[Math.floor(Math.random() * notFoundWords.length)];
  
  // Buscar el span correspondiente y mostrar el hint
  const blankSpans = verseTextEl.querySelectorAll('.ws-word-blank');
  blankSpans.forEach(span => {
    const spanWordNorm = span.getAttribute('data-word-norm');
    if (spanWordNorm === hintWordNorm && !currentFound.includes(hintWordNorm) &&
        !span.classList.contains('ws-word-found') && 
        !span.classList.contains('ws-word-revealed')) {
      span.className = 'ws-word-blank ws-word-hint';
      hintWordElement = span;
    }
  });
}

function hideHint() {
  if (!wsState || !wsState.verse) return;
  
  // Restaurar solo el span del hint a su estado oculto
  if (hintWordElement) {
    const wordNorm = hintWordElement.getAttribute('data-word-norm');
    const currentFound = Array.from(wsState.foundWords).map(w => normalize(w));
    
    if (wordNorm && !currentFound.includes(wordNorm)) {
      // Solo ocultar si no ha sido encontrada - remover la clase hint
      hintWordElement.className = 'ws-word-blank';
    }
  }
  
  hintWordElement = null;
}

function updateFoundCount(found, total) {
  const el = document.getElementById('wsFoundCount');
  if (el) el.textContent = `${found} / ${total}`;
}

function getSelectedCellsInOrder(start, end) {
  const r0 = start.r;
  const c0 = start.c;
  const r1 = end.r;
  const c1 = end.c;
  const dr = r1 - r0;
  const dc = c1 - c0;
  const len = Math.max(Math.abs(dr), Math.abs(dc)) + 1;
  const stepR = dr === 0 ? 0 : dr / Math.abs(dr);
  const stepC = dc === 0 ? 0 : dc / Math.abs(dc);
  const cells = [];
  for (let i = 0; i < len; i++) {
    cells.push({ r: r0 + i * stepR, c: c0 + i * stepC });
  }
  return cells;
}

function buildWordFromCells(grid, cells) {
  return cells.map(({ r, c }) => grid[r][c]).join('');
}

function markWordAndCellsAsFound(wordNorm, positions) {
  document.querySelectorAll('.ws-word-item').forEach(span => {
    if (span.dataset.word === wordNorm) span.classList.add('found');
  });
  positions.forEach(({ r, c }) => {
    const cell = document.querySelector(`.ws-cell[data-r="${r}"][data-c="${c}"]`);
    if (cell) cell.classList.add('found');
  });
}

function bindSelection(grid, words) {
  const el = document.getElementById('wsGrid');
  if (!el) return;
  let start = null;
  let current = null;

  const getCell = (r, c) => el.querySelector(`.ws-cell[data-r="${r}"][data-c="${c}"]`);

  const clearSelection = () => {
    el.querySelectorAll('.ws-cell.selected').forEach(c => c.classList.remove('selected'));
    start = null;
    current = null;
  };

  const applySelection = (cells) => {
    el.querySelectorAll('.ws-cell.selected').forEach(c => c.classList.remove('selected'));
    if (!cells || cells.length === 0) return;
    cells.forEach(({ r, c }) => getCell(r, c)?.classList.add('selected'));
  };

  const onPointerDown = (e) => {
    const cell = e.target.closest('.ws-cell');
    if (!cell || cell.classList.contains('found')) return;
    e.preventDefault();
    el.setPointerCapture(e.pointerId);
    const r = parseInt(cell.dataset.r, 10);
    const c = parseInt(cell.dataset.c, 10);
    start = { r, c };
    current = { r, c };
    applySelection([{ r, c }]);
  };

  const onPointerMove = (e) => {
    if (!start) return;
    const cell = document.elementFromPoint(e.clientX, e.clientY)?.closest('.ws-cell');
    if (!cell || !el.contains(cell)) return;
    const r = parseInt(cell.dataset.r, 10);
    const c = parseInt(cell.dataset.c, 10);
    current = { r, c };
    const cells = getSelectedCellsInOrder(start, current);
    applySelection(cells);
  };

  const onPointerUp = (e) => {
    try { el.releasePointerCapture(e.pointerId); } catch (_) {}
    if (!start || !current) {
      clearSelection();
      return;
    }
    const cells = getSelectedCellsInOrder(start, current);
    const word = buildWordFromCells(grid, cells);
    const wordRev = [...cells].reverse().map(({ r, c }) => grid[r][c]).join('');
    const wordNorm = normalize(word);
    const wordRevNorm = normalize(wordRev);

    const foundEntry = words.find(
      ({ word: w }) => normalize(w) === wordNorm || normalize(w) === wordRevNorm
    );
    if (foundEntry && !wsState.foundWords.has(foundEntry.word)) {
      wsState.foundWords.add(foundEntry.word);
      markWordAndCellsAsFound(normalize(foundEntry.word), foundEntry.positions);
      updateFoundCount(wsState.foundWords.size, words.length);
      
      // Revelar palabra en el versículo si existe
      if (wsState.verse) {
        revealWordInVerse(foundEntry.word, wsState.verse.originalText, wsState.verse.hiddenWords);
      }
      
      if (wsState.foundWords.size === words.length) {
        // Mostrar versículo completo cuando todas las palabras están encontradas
        if (wsState.verse) {
          const verseTextEl = document.getElementById('wsVerseText');
          if (verseTextEl) {
            verseTextEl.innerHTML = escapeHtml(wsState.verse.originalText);
            verseTextEl.classList.add('ws-verse-complete');
            verseTextEl.setAttribute('role', 'button');
            verseTextEl.setAttribute('tabindex', '0');
            verseTextEl.setAttribute('title', t('wsOpenInReader') || 'Ver en el lector');
            verseTextEl.removeEventListener('click', onCompleteVerseClick);
            verseTextEl.addEventListener('click', onCompleteVerseClick);
            verseTextEl.removeEventListener('keydown', verseTextEl._wsKeyHandler);
            verseTextEl._wsKeyHandler = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onCompleteVerseClick(); } };
            verseTextEl.addEventListener('keydown', verseTextEl._wsKeyHandler);
          }
        }
        document.getElementById('wsComplete').style.display = 'block';
      }
    }
    clearSelection();
  };

  el.addEventListener('pointerdown', onPointerDown, { passive: false });
  el.addEventListener('pointermove', onPointerMove);
  el.addEventListener('pointerup', onPointerUp);
  el.addEventListener('pointercancel', onPointerUp);
}

function hideComplete() {
  const el = document.getElementById('wsComplete');
  if (el) el.style.display = 'none';
}

export async function startWordSearchGame() {
  const diffEl = document.getElementById('wsDifficulty');
  const difficulty = (diffEl && diffEl.value) || 'medium';
  const result = await generateWordSearch(difficulty);
  const { grid, words, verse } = result;
  
  wsState = { 
    grid, 
    words, 
    foundWords: new Set(), 
    difficulty,
    verse: verse || null
  };

  const configCard = document.getElementById('configCard');
  const gameArea = document.getElementById('gameArea');
  const wsArea = document.getElementById('wordsearchGameArea');
  if (configCard) configCard.style.display = 'none';
  if (gameArea) gameArea.style.display = 'none';
  if (wsArea) wsArea.style.display = 'block';

  hideComplete();
  renderGrid(grid, words);
  if (verse) {
    renderVerse(verse);
  } else {
    // Fallback a lista de palabras si no hay versículo
    renderWordList(words);
  }
  updateFoundCount(0, words.length);
  bindSelection(grid, words);
}

export function exitWordSearchGame() {
  const configCard = document.getElementById('configCard');
  const wsArea = document.getElementById('wordsearchGameArea');
  if (wsArea) wsArea.style.display = 'none';
  if (configCard) configCard.style.display = 'block';
  wsState = null;
  showConfigUI();
}

export function bindWordSearchButtons() {
  document.getElementById('btnStartWordSearch')?.addEventListener('click', () => {
    startWordSearchGame();
  });
  document.getElementById('btnExitWordSearch')?.addEventListener('click', () => {
    exitWordSearchGame();
  });
  document.getElementById('btnWsPlayAgain')?.addEventListener('click', () => {
    startWordSearchGame();
  });
  
  // Botón Hint - mostrar palabra mientras se mantiene presionado
  const hintBtn = document.getElementById('btnHintWordSearch');
  if (hintBtn) {
    hintBtn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      showHint();
    });
    
    hintBtn.addEventListener('pointerup', () => {
      hideHint();
    });
    
    hintBtn.addEventListener('pointerleave', () => {
      hideHint();
    });
    
    hintBtn.addEventListener('pointercancel', () => {
      hideHint();
    });
  }
}
