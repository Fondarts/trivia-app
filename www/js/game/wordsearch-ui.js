/**
 * UI de Sopa de letras: renderizado, selección y validación.
 */
import { generateWordSearch } from './wordsearch.js';
import { t } from '../core/i18n.js';
import { showConfigUI } from '../ui/game-ui.js';

let wsState = null;

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

function renderWordList(words) {
  const wrap = document.getElementById('wsWordList');
  if (!wrap) return;
  wrap.innerHTML = '';
  words.forEach(({ word }) => {
    const span = document.createElement('span');
    span.className = 'ws-word-item';
    span.dataset.word = normalize(word);
    span.textContent = word;
    wrap.appendChild(span);
  });
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
      if (wsState.foundWords.size === words.length) {
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

export function startWordSearchGame() {
  const diffEl = document.getElementById('wsDifficulty');
  const difficulty = (diffEl && diffEl.value) || 'medium';
  const { grid, words } = generateWordSearch(difficulty);
  wsState = { grid, words, foundWords: new Set(), difficulty };

  const configCard = document.getElementById('configCard');
  const gameArea = document.getElementById('gameArea');
  const wsArea = document.getElementById('wordsearchGameArea');
  if (configCard) configCard.style.display = 'none';
  if (gameArea) gameArea.style.display = 'none';
  if (wsArea) wsArea.style.display = 'block';

  hideComplete();
  renderGrid(grid, words);
  renderWordList(words);
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
}
