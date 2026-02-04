// js/game/bible-study.js - Estudio de la Biblia: lista de libros clicable, lectura directa

import { t, getLanguage } from '../core/i18n.js';

/** Libros del Antiguo Testamento (id, nombre ES, nombre EN) */
const BIBLE_BOOKS_OT = [
  ['gen', 'Génesis', 'Genesis'],
  ['ex', 'Éxodo', 'Exodus'],
  ['lev', 'Levítico', 'Leviticus'],
  ['num', 'Números', 'Numbers'],
  ['deut', 'Deuteronomio', 'Deuteronomy'],
  ['josh', 'Josué', 'Joshua'],
  ['judg', 'Jueces', 'Judges'],
  ['ruth', 'Rut', 'Ruth'],
  ['1sam', '1 Samuel', '1 Samuel'],
  ['2sam', '2 Samuel', '2 Samuel'],
  ['1kgs', '1 Reyes', '1 Kings'],
  ['2kgs', '2 Reyes', '2 Kings'],
  ['1chr', '1 Crónicas', '1 Chronicles'],
  ['2chr', '2 Crónicas', '2 Chronicles'],
  ['ezra', 'Esdras', 'Ezra'],
  ['neh', 'Nehemías', 'Nehemiah'],
  ['esth', 'Ester', 'Esther'],
  ['job', 'Job', 'Job'],
  ['ps', 'Salmos', 'Psalms'],
  ['prov', 'Proverbios', 'Proverbs'],
  ['eccl', 'Eclesiastés', 'Ecclesiastes'],
  ['song', 'Cantares', 'Song of Solomon'],
  ['isa', 'Isaías', 'Isaiah'],
  ['jer', 'Jeremías', 'Jeremiah'],
  ['lam', 'Lamentaciones', 'Lamentations'],
  ['ezek', 'Ezequiel', 'Ezekiel'],
  ['dan', 'Daniel', 'Daniel'],
  ['hos', 'Oseas', 'Hosea'],
  ['joel', 'Joel', 'Joel'],
  ['amos', 'Amós', 'Amos'],
  ['obad', 'Abdías', 'Obadiah'],
  ['jonah', 'Jonás', 'Jonah'],
  ['mic', 'Miqueas', 'Micah'],
  ['nah', 'Nahum', 'Nahum'],
  ['hab', 'Habacuc', 'Habakkuk'],
  ['zeph', 'Sofonías', 'Zephaniah'],
  ['hag', 'Hageo', 'Haggai'],
  ['zech', 'Zacarías', 'Zechariah'],
  ['mal', 'Malaquías', 'Malachi']
];

/** Libros del Nuevo Testamento */
const BIBLE_BOOKS_NT = [
  ['matt', 'Mateo', 'Matthew'],
  ['mark', 'Marcos', 'Mark'],
  ['luke', 'Lucas', 'Luke'],
  ['john', 'Juan', 'John'],
  ['acts', 'Hechos', 'Acts'],
  ['rom', 'Romanos', 'Romans'],
  ['1cor', '1 Corintios', '1 Corinthians'],
  ['2cor', '2 Corintios', '2 Corinthians'],
  ['gal', 'Gálatas', 'Galatians'],
  ['eph', 'Efesios', 'Ephesians'],
  ['phil', 'Filipenses', 'Philippians'],
  ['col', 'Colosenses', 'Colossians'],
  ['1thess', '1 Tesalonicenses', '1 Thessalonians'],
  ['2thess', '2 Tesalonicenses', '2 Thessalonians'],
  ['1tim', '1 Timoteo', '1 Timothy'],
  ['2tim', '2 Timoteo', '2 Timothy'],
  ['titus', 'Tito', 'Titus'],
  ['phlm', 'Filemón', 'Philemon'],
  ['heb', 'Hebreos', 'Hebrews'],
  ['jas', 'Santiago', 'James'],
  ['1pet', '1 Pedro', '1 Peter'],
  ['2pet', '2 Pedro', '2 Peter'],
  ['1jn', '1 Juan', '1 John'],
  ['2jn', '2 Juan', '2 John'],
  ['3jn', '3 Juan', '3 John'],
  ['jude', 'Judas', 'Jude'],
  ['rev', 'Apocalipsis', 'Revelation']
];

/** Mapeo id libro -> referencia para enlace externo (bible.com) */
const BOOK_REF = {
  gen: 'gen', ex: 'exo', lev: 'lev', num: 'num', deut: 'deu', josh: 'jos', judg: 'jdg', ruth: 'rut',
  '1sam': '1sa', '2sam': '2sa', '1kgs': '1ki', '2kgs': '2ki', '1chr': '1ch', '2chr': '2ch',
  ezra: 'ezr', neh: 'neh', esth: 'est', job: 'job', ps: 'psa', prov: 'pro', eccl: 'ecc', song: 'sng',
  isa: 'isa', jer: 'jer', lam: 'lam', ezek: 'ezk', dan: 'dan', hos: 'hos', joel: 'jol', amos: 'amo',
  obad: 'oba', jonah: 'jon', mic: 'mic', nah: 'nah', hab: 'hab', zeph: 'zep', hag: 'hag', zech: 'zec', mal: 'mal',
  matt: 'mat', mark: 'mar', luke: 'luk', john: 'jhn', acts: 'act', rom: 'rom', '1cor': '1co', '2cor': '2co',
  gal: 'gal', eph: 'eph', phil: 'php', col: 'col', '1thess': '1th', '2thess': '2th', '1tim': '1ti', '2tim': '2ti',
  titus: 'tit', phlm: 'phm', heb: 'heb', jas: 'jas', '1pet': '1pe', '2pet': '2pe', '1jn': '1jn', '2jn': '2jn', '3jn': '3jn',
  jude: 'jud', rev: 'rev'
};

const LANG = () => (getLanguage && getLanguage()) === 'es' ? 'es' : 'en';

/** Ruta base para datos de la Biblia (offline, relativa al documento) */
function getBibleDataPath(bookId) {
  const lang = LANG();
  return `data/bible/${lang}/${bookId}.json`;
}

function escapeHtml(text) {
  if (text == null) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Carga el texto de un libro desde JSON local (offline).
 */
async function loadBookData(bookId) {
  const path = getBibleDataPath(bookId);
  try {
    const res = await fetch(path, { cache: 'default' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/** Estado del lector: libro actual y capítulo visible */
let readerBookData = null;
let readerBookName = '';
let readerBookId = '';
let readerCurrentChapter = '';

const STORAGE_VERSES = 'bible_trivia_verses';
const STORAGE_NOTES = 'bible_trivia_notes';
const STORAGE_HIGHLIGHTS = 'bible_trivia_highlights';

/** Versículos actualmente seleccionados en el lector (números de versículo) */
let selectedVerseNumbers = new Set();

/** Timer para long-press (mantener apretado) */
let longPressTimer = null;
let longPressVerseEl = null;
/** Si true, el próximo click en un versículo no alterna selección (evita que el release del long-press cuente como click). */
let suppressNextVerseClick = false;

function getSavedVerses() {
  try {
    const raw = localStorage.getItem(STORAGE_VERSES);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setSavedVerses(list) {
  try {
    localStorage.setItem(STORAGE_VERSES, JSON.stringify(list));
  } catch (_) {}
}

/** Compatibilidad: si existe la clave antigua de pasajes, migrar a versículos (1 versículo por capítulo = capítulo completo) */
function migratePassagesToVerses() {
  try {
    const old = localStorage.getItem('bible_trivia_passages');
    if (!old) return;
    const list = JSON.parse(old);
    const verses = [];
    list.forEach(p => {
      verses.push({
        key: `${p.bookId}:${p.chapter}:0`,
        ref: p.ref,
        bookId: p.bookId,
        chapter: p.chapter,
        verse: '0',
        text: '',
        savedAt: p.savedAt || Date.now()
          });
    });
    setSavedVerses(verses);
    localStorage.removeItem('bible_trivia_passages');
  } catch (_) {}
}

function getNotes() {
  try {
    const raw = localStorage.getItem(STORAGE_NOTES);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setNotes(list) {
  try {
    localStorage.setItem(STORAGE_NOTES, JSON.stringify(list));
  } catch (_) {}
}

function getHighlights() {
  try {
    const raw = localStorage.getItem(STORAGE_HIGHLIGHTS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setHighlights(list) {
  try {
    localStorage.setItem(STORAGE_HIGHLIGHTS, JSON.stringify(list));
  } catch (_) {}
}

/** Devuelve la entrada guardada (con nota) que incluye este versículo en el capítulo actual, o null. */
function getNoteEntryForVerse(verseNum) {
  if (!readerBookId || !readerCurrentChapter) return null;
  const saved = getSavedVerses();
  const v = Number(verseNum);
  const chapterStr = String(readerCurrentChapter);
  const bookStr = String(readerBookId);
  for (const entry of saved) {
    if (String(entry.bookId) !== bookStr || String(entry.chapter) !== chapterStr) continue;
    if (!(entry.note && String(entry.note).trim())) continue;
    const range = entry.verseRange || (entry.verses && entry.verses.length ? entry.verses.join(',') : '') || (entry.verse != null && entry.verse !== '' ? String(entry.verse) : '');
    if (!range) continue;
    const parts = String(range).split(',');
    for (const part of parts) {
      const p = part.trim();
      if (!p) continue;
      if (p.includes('-')) {
        const [a, b] = p.split('-').map(n => Number(n.trim()));
        if (!Number.isNaN(a) && !Number.isNaN(b) && v >= a && v <= b) return entry;
      } else if (Number(p) === v) return entry;
    }
  }
  return null;
}

/** Devuelve la nota (de la lista Notas) que corresponde a este versículo, o null. Ref tipo "Génesis 1:8" o "Génesis 1:1-4". */
function getNoteFromNotesListForVerse(verseNum) {
  if (!readerBookId || !readerCurrentChapter) return null;
  const notes = getNotes();
  const v = Number(verseNum);
  const chapterStr = String(readerCurrentChapter);
  const bookStr = String(readerBookId);
  for (const note of notes) {
    if (String(note.bookId) !== bookStr || String(note.chapter) !== chapterStr) continue;
    if (!(note.text && String(note.text).trim())) continue;
    const ref = String(note.ref || '');
    const colonIdx = ref.lastIndexOf(':');
    if (colonIdx === -1) continue;
    const versePart = ref.substring(colonIdx + 1).trim();
    if (!versePart) continue;
    const parts = versePart.split(',');
    for (const part of parts) {
      const p = part.trim();
      if (!p) continue;
      if (p.includes('-')) {
        const [a, b] = p.split('-').map(n => Number(n.trim()));
        if (!Number.isNaN(a) && !Number.isNaN(b) && v >= a && v <= b) return note;
      } else if (Number(p) === v) return note;
    }
  }
  return null;
}

/** Devuelve la fuente de nota para este versículo: entrada guardada (con .key) o nota suelta (con .id). */
function getNoteSourceForVerse(verseNum) {
  const entry = getNoteEntryForVerse(verseNum);
  if (entry) return { key: entry.key, ref: entry.ref || '', text: entry.note || '', type: 'saved' };
  const note = getNoteFromNotesListForVerse(verseNum);
  if (note) return { id: note.id, ref: note.ref || '', text: note.text || '', type: 'note' };
  return null;
}

/** Devuelve el color de highlight para un versículo en el capítulo actual (puede estar en un rango). */
function getHighlightForVerse(verseNum) {
  if (!readerBookId || !readerCurrentChapter) return '';
  const highlights = getHighlights();
  const v = Number(verseNum);
  for (const h of highlights) {
    if (h.bookId !== readerBookId || h.chapter !== readerCurrentChapter) continue;
    const parts = (h.verseRange || String(h.verse || '')).split(',');
    for (const part of parts) {
      if (part.includes('-')) {
        const [a, b] = part.split('-').map(Number);
        if (v >= a && v <= b) return h.color || '';
      } else if (Number(part) === v) return h.color || '';
    }
  }
  return '';
}

/** Aplica o quita highlight a los versículos seleccionados. */
function applyHighlightToSelection(color) {
  if (!readerBookId || !readerCurrentChapter || !selectedVerseNumbers.size) return;
  const verseRange = formatVerseRange([...selectedVerseNumbers]);
  const highlights = getHighlights().filter(h => !(h.bookId === readerBookId && h.chapter === readerCurrentChapter && h.verseRange === verseRange));
  if (color) {
    highlights.unshift({ bookId: readerBookId, chapter: readerCurrentChapter, verseRange, color, savedAt: Date.now() });
  }
  setHighlights(highlights);
  renderReaderChapter(readerCurrentChapter);
  hideContextMenu();
}

/**
 * Rellena el selector de capítulos dentro del overlay y muestra el capítulo actual.
 */
function fillReaderChapterSelect(chapters) {
  const sel = document.getElementById('bibleReaderChapterSel');
  if (!sel) return;
  sel.innerHTML = '';
  (chapters || []).forEach((ch, i) => {
    const opt = document.createElement('option');
    opt.value = ch.chapter;
    opt.textContent = ch.chapter;
    opt.selected = i === 0;
    sel.appendChild(opt);
  });
}

/**
 * Renderiza el contenido del capítulo en el overlay.
 */
function renderReaderChapter(chapterNum) {
  const contentEl = document.getElementById('bibleReaderContent');
  const titleEl = document.getElementById('bibleReaderTitle');
  if (!contentEl || !readerBookData || !readerBookData.chapters) return;

  readerCurrentChapter = String(chapterNum);
  const ch = readerBookData.chapters.find(c => String(c.chapter) === String(chapterNum));
  const displayName = readerBookData.book || readerBookName;
  const chapterLabel = LANG() === 'en' ? 'Chapter' : 'Capítulo';

  if (titleEl) titleEl.textContent = `${displayName} — ${chapterLabel} ${chapterNum}`;

  if (!ch || !ch.verses || !ch.verses.length) {
    contentEl.innerHTML = `<p class="bible-reader-verse">${escapeHtml(LANG() === 'en' ? 'No verses for this chapter.' : 'No hay versículos para este capítulo.')}</p>`;
    return;
  }

  selectedVerseNumbers.clear();
  const PARAGRAPH_SIZE = 4;
  const paragraphs = [];
  for (let i = 0; i < ch.verses.length; i += PARAGRAPH_SIZE) {
    const chunk = ch.verses.slice(i, i + PARAGRAPH_SIZE);
    const verseSpans = chunk
      .map(v => {
        const num = String(v.verse);
        const highlightColor = getHighlightForVerse(num);
        const highlightClass = highlightColor ? ` bible-reader-verse-highlight-${highlightColor}` : '';
        const noteSource = getNoteSourceForVerse(num);
        const noteIcon = noteSource
          ? ` <button type="button" class="bible-reader-verse-note-icon" data-key="${escapeHtml(noteSource.key || '')}" data-note-id="${escapeHtml(noteSource.id || '')}" data-ref="${escapeHtml(noteSource.ref || '')}" aria-label="${escapeHtml(LANG() === 'en' ? 'View note' : 'Ver nota')}">📓</button>`
          : '';
        return `<span class="bible-reader-verse${highlightClass}" data-verse="${escapeHtml(num)}" role="button" tabindex="0"><sup class="bible-reader-verse-num">${escapeHtml(num)}</sup> ${escapeHtml(v.text || '')}${noteIcon}</span>`;
      })
      .join(' ');
    paragraphs.push(`<p class="bible-reader-paragraph">${verseSpans}</p>`);
  }
  contentEl.innerHTML = `<div class="bible-reader-verses">${paragraphs.join('')}</div>`;

  contentEl.querySelectorAll('.bible-reader-verse').forEach(p => {
    p.addEventListener('click', (e) => {
      if (contextMenuVisible()) return;
      if (e.target.closest('.bible-reader-verse-note-icon')) return;
      if (suppressNextVerseClick) { suppressNextVerseClick = false; return; }
      toggleVerseSelection(p);
    });
    p.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleVerseSelection(p); } });
    setupVerseContextMenu(p, contentEl);
  });

  contentEl.querySelectorAll('.bible-reader-verse-note-icon').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const key = btn.getAttribute('data-key') || '';
      const noteId = btn.getAttribute('data-note-id') || '';
      const ref = btn.getAttribute('data-ref') || '';
      if (key) {
        const entry = getSavedVerses().find(x => x.key === key);
        openNoteModalForSavedEntry(key, ref, entry?.note);
      } else if (noteId) {
        const note = getNotes().find(x => x.id === noteId);
        openNoteModalForNoteId(noteId, ref, note?.text);
      }
    });
  });
}

function toggleVerseSelection(verseEl) {
  const num = verseEl.getAttribute('data-verse');
  if (!num) return;
  if (selectedVerseNumbers.has(num)) {
    selectedVerseNumbers.delete(num);
    verseEl.classList.remove('bible-reader-verse-selected');
  } else {
    selectedVerseNumbers.add(num);
    verseEl.classList.add('bible-reader-verse-selected');
  }
}

/** Menú contextual: mostrar/ocultar */
function contextMenuVisible() {
  const menu = document.getElementById('bibleContextMenu');
  return menu && menu.classList.contains('bible-context-menu-visible');
}

function showContextMenu(clientX, clientY) {
  if (!readerBookId || !readerCurrentChapter) return;
  if (!selectedVerseNumbers.size) return;
  const menu = document.getElementById('bibleContextMenu');
  if (!menu) return;
  menu.setAttribute('aria-hidden', 'false');
  menu.classList.add('bible-context-menu-visible');
  const rect = menu.getBoundingClientRect();
  const pad = 8;
  let x = clientX;
  let y = clientY;
  if (x + rect.width > window.innerWidth - pad) x = window.innerWidth - rect.width - pad;
  if (x < pad) x = pad;
  if (y + rect.height > window.innerHeight - pad) y = window.innerHeight - rect.height - pad;
  if (y < pad) y = pad;
  menu.style.left = `${x}px`;
  menu.style.top = `${y}px`;
}

function hideContextMenu() {
  const menu = document.getElementById('bibleContextMenu');
  if (!menu) return;
  menu.setAttribute('aria-hidden', 'true');
  menu.classList.remove('bible-context-menu-visible');
}

function clearLongPress() {
  if (longPressTimer) {
    clearTimeout(longPressTimer);
    longPressTimer = null;
  }
  longPressVerseEl = null;
}

/** Configura long-press y clic derecho en un versículo para abrir el menú contextual. */
function setupVerseContextMenu(verseEl, contentEl) {
  const num = verseEl.getAttribute('data-verse');
  if (!num) return;

  verseEl.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    if (!selectedVerseNumbers.has(num)) {
      selectedVerseNumbers.add(num);
      verseEl.classList.add('bible-reader-verse-selected');
    }
    showContextMenu(e.clientX, e.clientY);
  });

  verseEl.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    clearLongPress();
    longPressVerseEl = verseEl;
    longPressTimer = setTimeout(() => {
      longPressTimer = null;
      if (!selectedVerseNumbers.has(num)) {
        selectedVerseNumbers.add(num);
        verseEl.classList.add('bible-reader-verse-selected');
      }
      suppressNextVerseClick = true;
      const rect = verseEl.getBoundingClientRect();
      showContextMenu(rect.left + rect.width / 2, rect.top + rect.height / 2);
      longPressVerseEl = null;
    }, 500);
  });

  verseEl.addEventListener('pointerup', clearLongPress);
  verseEl.addEventListener('pointerleave', clearLongPress);
  verseEl.addEventListener('pointercancel', clearLongPress);
}

/**
 * Abre la ventana de lectura con el libro cargado y el capítulo indicado (por defecto el primero).
 */
function openReaderWindow(bookName, bookId, data, chapterNum) {
  if (!data || !data.chapters || !data.chapters.length) return;

  readerBookData = data;
  readerBookName = bookName;
  readerBookId = bookId;

  const overlay = document.getElementById('bibleReaderOverlay');
  const chapterSel = document.getElementById('bibleReaderChapterSel');
  if (!overlay) return;

  const firstChapter = data.chapters[0] && data.chapters[0].chapter;
  const openChapter = chapterNum != null ? String(chapterNum) : firstChapter;

  fillReaderChapterSelect(data.chapters);
  renderReaderChapter(openChapter);
  if (chapterSel) {
    chapterSel.value = openChapter;
    chapterSel.style.display = '';
  }

  overlay.style.display = 'block';
  document.body.classList.add('bible-reader-open');

  const closeBtn = document.getElementById('bibleReaderClose');
  if (closeBtn) closeBtn.focus();
}

/**
 * Cierra la ventana de lectura.
 */
function closeReaderWindow() {
  const overlay = document.getElementById('bibleReaderOverlay');
  if (overlay) overlay.style.display = 'none';
  document.body.classList.remove('bible-reader-open');
  closeSidepanel();
  closeNoteModal();
  hideContextMenu();
  clearLongPress();
  readerBookData = null;
  readerBookName = '';
  readerBookId = '';
  readerCurrentChapter = '';
}

/** Referencia actual en formato corto (ej. "Génesis 1" o "Génesis 1:1") */
function getCurrentRef(verseNum) {
  const name = readerBookData?.book || readerBookName || '';
  if (!name) return '';
  return verseNum != null && verseNum !== '' ? `${name} ${readerCurrentChapter}:${verseNum}` : `${name} ${readerCurrentChapter}`;
}

/** Formatea un rango de versículos para ref: "1-4" si consecutivos, "1,3,5" si no. */
function formatVerseRange(nums) {
  if (!nums.length) return '';
  const sorted = [...nums].map(n => (typeof n === 'string' ? parseInt(n, 10) : n)).filter(n => !Number.isNaN(n)).sort((a, b) => a - b);
  if (sorted.length === 1) return String(sorted[0]);
  const parts = [];
  let start = sorted[0];
  let end = start;
  for (let i = 1; i < sorted.length; i++) {
    const n = sorted[i];
    if (n === end + 1) {
      end = n;
    } else {
      parts.push(start === end ? String(start) : `${start}-${end}`);
      start = end = n;
    }
  }
  parts.push(start === end ? String(start) : `${start}-${end}`);
  return parts.join(',');
}

/** Ref completa para varios versículos: "Génesis 1:1-4" o "Génesis 1:1,3" */
function getRefForVerseRange(nums) {
  const name = readerBookData?.book || readerBookName || '';
  if (!name || !readerCurrentChapter) return '';
  const range = formatVerseRange(nums);
  return range ? `${name} ${readerCurrentChapter}:${range}` : '';
}

/** Obtiene el texto de un versículo del capítulo actual. */
function getVerseText(verseNum) {
  if (!readerBookData?.chapters) return '';
  const ch = readerBookData.chapters.find(c => String(c.chapter) === String(readerCurrentChapter));
  const v = ch?.verses?.find(vr => String(vr.verse) === String(verseNum));
  return v?.text || '';
}

/** Concatena el texto de varios versículos en orden. */
function getVersesText(nums) {
  const sorted = [...nums].map(String).sort((a, b) => Number(a) - Number(b));
  return sorted.map(n => getVerseText(n)).filter(Boolean).join(' ');
}

/** Guarda los versículos actualmente seleccionados como una sola entrada (ej. 1-4). */
function saveSelectedVerses() {
  if (!readerBookId || !readerCurrentChapter) return;
  if (!selectedVerseNumbers.size) {
    showToast(t('bibleSelectAtLeastOne') || 'Selecciona al menos un versículo.');
    return;
  }
  const nums = [...selectedVerseNumbers];
  const verseRange = formatVerseRange(nums);
  const key = `${readerBookId}:${readerCurrentChapter}:${verseRange}`;
  const saved = getSavedVerses();
  if (saved.some(v => v.key === key)) {
    showToast(t('bibleVersesSaved') || 'Versículo(s) guardado(s).');
    return;
  }
  const ref = getRefForVerseRange(nums);
  const text = getVersesText(nums);
  saved.unshift({
    key,
    ref,
    bookId: readerBookId,
    chapter: readerCurrentChapter,
    verses: nums.map(String).sort((a, b) => Number(a) - Number(b)),
    verseRange,
    text,
    note: '',
    savedAt: Date.now()
  });
  setSavedVerses(saved);
  showToast(t('bibleVersesSaved') || 'Versículo(s) guardado(s).');
}

function showToast(msg) {
  const el = document.createElement('div');
  el.className = 'bible-toast';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2000);
}

/** Key de la entrada de versículos cuya nota se está editando (null = no editando). */
let noteEditingVerseKey = null;

/** Abre el modal de nota para la selección actual (solo ref, sin guardar nota en entrada). Se usa desde el toolbar. */
function openNoteModalForSelection() {
  if (!selectedVerseNumbers.size) {
    showToast(t('bibleSelectAtLeastOne') || 'Selecciona al menos un versículo.');
    return;
  }
  noteEditingVerseKey = null;
  const ref = getRefForVerseRange([...selectedVerseNumbers]);
  openNoteModalWithRef(ref, '', '', '');
}

/** Abre el modal para añadir/editar nota de una entrada guardada (desde el panel). */
function openNoteModalForSavedEntry(verseKey, ref, currentNote) {
  noteEditingVerseKey = verseKey;
  openNoteModalWithRef(ref || '—', currentNote || '', verseKey, '');
}

/** Abre el modal para ver/editar una nota de la lista Notas (desde el icono del versículo). */
function openNoteModalForNoteId(noteId, ref, noteText) {
  noteEditingVerseKey = null;
  openNoteModalWithRef(ref || '—', noteText || '', '', noteId);
}

function openNoteModalWithRef(ref, noteText, verseKey, noteId) {
  const modal = document.getElementById('bibleNoteModal');
  const refEl = document.getElementById('bibleNoteRef');
  const textEl = document.getElementById('bibleNoteText');
  if (!modal || !refEl || !textEl) return;
  refEl.textContent = ref || '—';
  textEl.value = noteText || '';
  textEl.dataset.verseKey = verseKey || '';
  textEl.dataset.noteId = noteId || '';
  modal.setAttribute('aria-hidden', 'false');
  modal.classList.add('bible-reader-note-modal-visible');
  textEl.focus();
}

/** Cierra el modal de nota. */
function closeNoteModal() {
  const modal = document.getElementById('bibleNoteModal');
  if (!modal) return;
  modal.setAttribute('aria-hidden', 'true');
  modal.classList.remove('bible-reader-note-modal-visible');
  noteEditingVerseKey = null;
  const textEl = document.getElementById('bibleNoteText');
  if (textEl) {
    textEl.removeAttribute('data-verse-key');
    textEl.removeAttribute('data-note-id');
  }
}

/** Guarda la nota desde el modal: verseKey -> actualiza entrada guardada; noteId -> actualiza nota en lista; si no, crea nota nueva. */
function saveNoteFromModal() {
  const textEl = document.getElementById('bibleNoteText');
  if (!textEl) return;
  const text = (textEl.value || '').trim();
  const verseKey = textEl.dataset.verseKey || noteEditingVerseKey;
  const noteId = textEl.dataset.noteId || '';

  if (verseKey) {
    const saved = getSavedVerses();
    const entry = saved.find(v => v.key === verseKey);
    if (entry) {
      entry.note = text;
      setSavedVerses(saved);
      closeNoteModal();
      showToast(t('bibleNoteSaved') || 'Nota guardada');
      renderVersesList();
      renderNotesList();
      if (readerBookData) renderReaderChapter(readerCurrentChapter);
      return;
    }
  }

  if (noteId) {
    const notes = getNotes();
    const note = notes.find(n => n.id === noteId);
    if (note) {
      note.text = text;
      setNotes(notes);
      closeNoteModal();
      showToast(t('bibleNoteSaved') || 'Nota guardada');
      renderNotesList();
      if (readerBookData) renderReaderChapter(readerCurrentChapter);
      return;
    }
  }

  if (!readerBookId || !readerCurrentChapter) return;
  const refEl = document.getElementById('bibleNoteRef');
  const notes = getNotes();
  const id = `n${Date.now()}`;
  notes.unshift({
    id,
    ref: refEl?.textContent?.trim() || getCurrentRef() || '—',
    bookId: readerBookId,
    chapter: readerCurrentChapter,
    text,
    savedAt: Date.now()
  });
  setNotes(notes);
  closeNoteModal();
  showToast(t('bibleNoteSaved') || 'Nota guardada');
}

/** Abre el panel lateral de versículos y notas. */
function openSidepanel() {
  const panel = document.getElementById('bibleReaderSidepanel');
  if (!panel) return;
  panel.setAttribute('aria-hidden', 'false');
  panel.classList.add('bible-reader-sidepanel-visible');
  renderVersesList();
  renderNotesList();
  const tabPassages = document.getElementById('bibleTabPassages');
  const tabNotes = document.getElementById('bibleTabNotes');
  const listPassages = document.getElementById('biblePassagesList');
  const listNotes = document.getElementById('bibleNotesList');
  if (tabPassages) tabPassages.classList.add('active');
  if (tabNotes) tabNotes.classList.remove('active');
  if (listPassages) listPassages.style.display = '';
  if (listNotes) listNotes.style.display = 'none';
}

/** Cierra el panel lateral. */
function closeSidepanel() {
  const panel = document.getElementById('bibleReaderSidepanel');
  if (!panel) return;
  panel.setAttribute('aria-hidden', 'true');
  panel.classList.remove('bible-reader-sidepanel-visible');
}

const LABEL_ADD_NOTE = () => (LANG() === 'en' ? 'Add note' : 'Añadir nota');
const LABEL_EDIT_NOTE = () => (LANG() === 'en' ? 'Edit note' : 'Editar nota');

function renderVersesList() {
  const listEl = document.getElementById('biblePassagesList');
  if (!listEl) return;
  const verses = getSavedVerses();
  const noMsg = t('bibleNoVerses') || 'Aún no has guardado ningún versículo.';
  const delLabel = t('bibleDelete') || 'Eliminar';
  if (!verses.length) {
    listEl.innerHTML = `<p class="bible-reader-list-empty">${escapeHtml(noMsg)}</p>`;
    return;
  }
  listEl.innerHTML = verses.map(v => {
    const delId = `del-verse-${v.key.replace(/:/g, '-')}`;
    const noteBtnId = `note-verse-${v.key.replace(/:/g, '-')}`;
    const textPreview = (v.text || '').slice(0, 80) + ((v.text || '').length > 80 ? '…' : '');
    const hasNote = !!(v.note && v.note.trim());
    const noteLabel = hasNote ? LABEL_EDIT_NOTE() : LABEL_ADD_NOTE();
    const notePreview = hasNote ? (v.note.slice(0, 50) + (v.note.length > 50 ? '…' : '')) : '';
    return `<div class="bible-reader-list-item" data-key="${escapeHtml(v.key)}" data-book-id="${escapeHtml(v.bookId)}" data-chapter="${escapeHtml(v.chapter)}">
        <div class="bible-reader-list-item-body">
          <span class="bible-reader-list-ref">${escapeHtml(v.ref)}</span>
          ${textPreview ? `<span class="bible-reader-list-preview">${escapeHtml(textPreview)}</span>` : ''}
          ${notePreview ? `<span class="bible-reader-list-note-preview">${escapeHtml(notePreview)}</span>` : ''}
        </div>
        <div class="bible-reader-list-item-actions">
          <button type="button" class="bible-reader-btn-note" id="${noteBtnId}" data-key="${escapeHtml(v.key)}" data-ref="${escapeHtml(v.ref)}" aria-label="${escapeHtml(noteLabel)}">${hasNote ? '✎' : '+'}</button>
          <button type="button" class="bible-reader-list-del" id="${delId}" aria-label="${escapeHtml(delLabel)}">✖</button>
        </div>
      </div>`;
  }).join('');

  listEl.querySelectorAll('.bible-reader-list-item').forEach(item => {
    const bookId = item.getAttribute('data-book-id');
    const chapter = item.getAttribute('data-chapter');
    const body = item.querySelector('.bible-reader-list-item-body');
    body?.addEventListener('click', () => {
      closeSidepanel();
      loadBookData(bookId).then(data => {
        if (data?.chapters?.length) {
          const opt = document.querySelector(`#bibleBookSel option[value="${bookId}"]`);
          const bookName = (opt && opt.textContent) || data.book || bookId;
          openReaderWindow(bookName, bookId, data, chapter);
        }
      });
    });
    const noteBtn = item.querySelector('.bible-reader-btn-note');
    if (noteBtn) {
      noteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const key = noteBtn.getAttribute('data-key');
        const ref = noteBtn.getAttribute('data-ref') || '';
        const entry = getSavedVerses().find(x => x.key === key);
        openNoteModalForSavedEntry(key, ref, entry?.note);
      });
    }
    const delBtn = item.querySelector('.bible-reader-list-del');
    if (delBtn) {
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const key = item.getAttribute('data-key');
        const next = getSavedVerses().filter(x => x.key !== key);
        setSavedVerses(next);
        renderVersesList();
      });
    }
  });
}

function renderNotesList() {
  const listEl = document.getElementById('bibleNotesList');
  if (!listEl) return;
  const notes = getNotes();
  const noMsg = t('bibleNoNotes') || 'Aún no tienes notas.';
  const delLabel = t('bibleDelete') || 'Eliminar';
  if (!notes.length) {
    listEl.innerHTML = `<p class="bible-reader-list-empty">${escapeHtml(noMsg)}</p>`;
    return;
  }
  listEl.innerHTML = notes.map(n => {
    const delId = `del-note-${n.id}`;
    return `
      <div class="bible-reader-note-item" data-id="${escapeHtml(n.id)}">
        <div class="bible-reader-note-item-ref">${escapeHtml(n.ref)}</div>
        <div class="bible-reader-note-item-text">${escapeHtml(n.text)}</div>
        <button type="button" class="bible-reader-list-del" id="${delId}" aria-label="${escapeHtml(delLabel)}">✖</button>
      </div>`;
  }).join('');

  listEl.querySelectorAll('.bible-reader-note-item .bible-reader-list-del').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const item = e.target.closest('.bible-reader-note-item');
      const id = item?.getAttribute('data-id');
      if (!id) return;
      const next = getNotes().filter(x => x.id !== id);
      setNotes(next);
      renderNotesList();
    });
  });
}

/**
 * Muestra mensaje "no disponible offline" en un overlay temporal o abre enlace externo.
 * Aquí abrimos directamente el enlace en nueva pestaña (no tenemos overlay intermedio).
 */
function openBookOnline(bookId, bookName) {
  const ref = BOOK_REF[bookId];
  const baseUrl = 'https://www.bible.com/bible';
  const langCode = LANG() === 'en' ? '59' : '146';
  const readUrl = ref ? `${baseUrl}/${langCode}/${ref}.1.1` : baseUrl;
  window.open(readUrl, '_blank', 'noopener,noreferrer');
}

/**
 * Rellena el menú desplegable de libros (Antiguo y Nuevo Testamento).
 * Al elegir un libro se abre directamente el lector o enlace externo.
 */
export function populateBibleBookSelector() {
  const sel = document.getElementById('bibleBookSel');
  if (!sel) return;

  const isEn = LANG() === 'en';
  const placeholder = sel.querySelector('option[value=""]');
  sel.innerHTML = '';
  if (placeholder) {
    placeholder.setAttribute('data-i18n', 'bibleSelectBookPlaceholder');
    sel.appendChild(placeholder);
  }

  const optgroupOT = document.createElement('optgroup');
  optgroupOT.label = isEn ? 'Old Testament' : 'Antiguo Testamento';
  BIBLE_BOOKS_OT.forEach(([id, nameEs, nameEn]) => {
    const opt = document.createElement('option');
    opt.value = id;
    opt.textContent = isEn ? nameEn : nameEs;
    optgroupOT.appendChild(opt);
  });
  sel.appendChild(optgroupOT);

  const optgroupNT = document.createElement('optgroup');
  optgroupNT.label = isEn ? 'New Testament' : 'Nuevo Testamento';
  BIBLE_BOOKS_NT.forEach(([id, nameEs, nameEn]) => {
    const opt = document.createElement('option');
    opt.value = id;
    opt.textContent = isEn ? nameEn : nameEs;
    optgroupNT.appendChild(opt);
  });
  sel.appendChild(optgroupNT);
}

/**
 * Inicializa el modo Estudio de la Biblia: menú desplegable de libros y lector con selector de capítulo.
 */
export function initBibleStudy() {
  populateBibleBookSelector();

  const sel = document.getElementById('bibleBookSel');
  const chapterSel = document.getElementById('bibleReaderChapterSel');
  if (!sel) return;

  sel.addEventListener('change', async () => {
    const bookId = sel.value;
    if (!bookId) return;

    const option = sel.options[sel.selectedIndex];
    const bookName = option ? option.textContent : bookId;

    const data = await loadBookData(bookId);
    if (data && data.chapters && data.chapters.length) {
      openReaderWindow(bookName, bookId, data, data.chapters[0].chapter);
    } else {
      openBookOnline(bookId, bookName);
    }
    sel.value = '';
  });

  if (chapterSel) {
    chapterSel.addEventListener('change', () => {
      if (readerBookData) renderReaderChapter(chapterSel.value);
    });
  }

  const closeBtn = document.getElementById('bibleReaderClose');
  if (closeBtn) closeBtn.addEventListener('click', closeReaderWindow);

  migratePassagesToVerses();
  const myPassagesBtn = document.getElementById('bibleReaderMyPassagesNotes');
  if (myPassagesBtn) myPassagesBtn.addEventListener('click', openSidepanel);

  const sidepanelClose = document.getElementById('bibleReaderSidepanelClose');
  if (sidepanelClose) sidepanelClose.addEventListener('click', closeSidepanel);

  const tabPassages = document.getElementById('bibleTabPassages');
  const tabNotes = document.getElementById('bibleTabNotes');
  const listPassages = document.getElementById('biblePassagesList');
  const listNotes = document.getElementById('bibleNotesList');
  if (tabPassages && tabNotes && listPassages && listNotes) {
    tabPassages.addEventListener('click', () => {
      tabPassages.classList.add('active');
      tabNotes.classList.remove('active');
      listPassages.style.display = '';
      listNotes.style.display = 'none';
    });
    tabNotes.addEventListener('click', () => {
      tabNotes.classList.add('active');
      tabPassages.classList.remove('active');
      listNotes.style.display = '';
      listPassages.style.display = 'none';
      renderNotesList();
    });
  }

  const noteCancel = document.getElementById('bibleNoteCancel');
  if (noteCancel) noteCancel.addEventListener('click', closeNoteModal);
  const noteSave = document.getElementById('bibleNoteSave');
  if (noteSave) noteSave.addEventListener('click', saveNoteFromModal);

  const readerOverlay = document.getElementById('bibleReaderOverlay');
  if (readerOverlay) {
    readerOverlay.addEventListener('click', (e) => {
      if (e.target === readerOverlay) closeReaderWindow();
    });
    readerOverlay.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (contextMenuVisible()) hideContextMenu();
        else if (document.getElementById('bibleReaderSidepanel')?.classList.contains('bible-reader-sidepanel-visible')) closeSidepanel();
        else if (document.getElementById('bibleNoteModal')?.classList.contains('bible-reader-note-modal-visible')) closeNoteModal();
        else closeReaderWindow();
      }
    });
  }

  const contextMenu = document.getElementById('bibleContextMenu');
  if (contextMenu) {
    document.addEventListener('click', (e) => {
      if (!contextMenuVisible()) return;
      if (!contextMenu.contains(e.target)) hideContextMenu();
    });
    const ctxSave = document.getElementById('bibleContextSave');
    if (ctxSave) ctxSave.addEventListener('click', () => { saveSelectedVerses(); hideContextMenu(); });
    const ctxNote = document.getElementById('bibleContextNote');
    if (ctxNote) ctxNote.addEventListener('click', () => { openNoteModalForSelection(); hideContextMenu(); });
    const colors = contextMenu.querySelectorAll('.bible-context-color[data-color]');
    colors.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const color = e.currentTarget.getAttribute('data-color') || '';
        applyHighlightToSelection(color);
      });
    });
  }
}
