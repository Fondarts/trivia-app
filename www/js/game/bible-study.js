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

const LANG = () => (getLanguage && getLanguage()) === 'en' ? 'en' : 'es';

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

/** Estado del lector: libro actual y capítulos */
let readerBookData = null;
let readerBookName = '';
let readerBookId = '';

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

  const ch = readerBookData.chapters.find(c => String(c.chapter) === String(chapterNum));
  const displayName = readerBookData.book || readerBookName;
  const chapterLabel = LANG() === 'en' ? 'Chapter' : 'Capítulo';

  if (titleEl) titleEl.textContent = `${displayName} — ${chapterLabel} ${chapterNum}`;

  if (!ch || !ch.verses || !ch.verses.length) {
    contentEl.innerHTML = `<p class="bible-reader-verse">${escapeHtml(LANG() === 'en' ? 'No verses for this chapter.' : 'No hay versículos para este capítulo.')}</p>`;
    return;
  }

  const versesHtml = ch.verses
    .map(v => `<p class="bible-reader-verse"><span class="bible-reader-verse-num">${escapeHtml(String(v.verse))}</span> <span class="bible-reader-verse-text">${escapeHtml(v.text || '')}</span></p>`)
    .join('');
  contentEl.innerHTML = `<div class="bible-reader-verses">${versesHtml}</div>`;
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
  readerBookData = null;
  readerBookName = '';
  readerBookId = '';
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

  const readerOverlay = document.getElementById('bibleReaderOverlay');
  if (readerOverlay) {
    readerOverlay.addEventListener('click', (e) => {
      if (e.target === readerOverlay) closeReaderWindow();
    });
    readerOverlay.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeReaderWindow();
    });
  }
}
