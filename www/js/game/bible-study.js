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

/** Texto actualmente seleccionado en el lector */
let currentTextSelection = null;
let selectionTimeout = null;

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
  // Exponer globalmente para acceso desde otros módulos
  window.getHighlights = getHighlights;
  try {
    const raw = localStorage.getItem(STORAGE_HIGHLIGHTS);
    console.log('getHighlights() - reading from key:', STORAGE_HIGHLIGHTS);
    console.log('getHighlights() - raw data:', raw ? raw.substring(0, 200) : 'null');
    const result = raw ? JSON.parse(raw) : [];
    console.log('getHighlights() - parsed result:', result.length, result);
    return result;
  } catch (e) {
    console.error('getHighlights() - error:', e);
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

/** Aplica o quita highlight al texto seleccionado. */
function applyHighlightToSelection(color) {
  if (!readerBookId || !readerCurrentChapter || !currentTextSelection || !currentTextSelection.text) return;
  
  const selection = currentTextSelection.selection;
  const range = currentTextSelection.range;
  if (!range) return;
  
  // Obtener información del texto seleccionado
  const selectedText = currentTextSelection.text;
  
  // Encontrar los versículos que contienen el texto seleccionado
  const verseElements = document.querySelectorAll('.bible-reader-verse');
  const affectedVerses = new Set();
  
  verseElements.forEach(verseEl => {
    const verseText = verseEl.textContent;
    if (verseText.includes(selectedText)) {
      const verseNum = verseEl.getAttribute('data-verse');
      if (verseNum) affectedVerses.add(verseNum);
    }
  });
  
  if (affectedVerses.size === 0) return;
  
  // Guardar el highlight con información del texto seleccionado
  const verseRange = formatVerseRange([...affectedVerses]);
  const highlights = getHighlights();
  
  // Eliminar highlights existentes que se solapen
  const filteredHighlights = highlights.filter(h => {
    if (h.bookId !== readerBookId || h.chapter !== readerCurrentChapter) return true;
    // Si hay solapamiento, eliminarlo
    const hVerses = h.verseRange ? h.verseRange.split(',').flatMap(r => {
      if (r.includes('-')) {
        const [a, b] = r.split('-').map(Number);
        return Array.from({length: b - a + 1}, (_, i) => a + i);
      }
      return [Number(r)];
    }) : [];
    const currentVerses = verseRange.split(',').flatMap(r => {
      if (r.includes('-')) {
        const [a, b] = r.split('-').map(Number);
        return Array.from({length: b - a + 1}, (_, i) => a + i);
      }
      return [Number(r)];
    });
    return !hVerses.some(v => currentVerses.includes(v));
  });
  
  if (color) {
    // Aplicar highlight visualmente usando Mark.js o similar
    applyTextHighlight(range, color);
    
    // Guardar en localStorage
    filteredHighlights.unshift({ 
      bookId: readerBookId, 
      chapter: readerCurrentChapter, 
      verseRange, 
      color, 
      selectedText,
      savedAt: Date.now() 
    });
  }
  
  setHighlights(filteredHighlights);
  hideContextMenu();
  currentTextSelection = null;
}

/** Aplica highlight visual al texto seleccionado */
function applyTextHighlight(range, color) {
  if (!range) return;
  
  // Crear un span con la clase de highlight
  const highlightSpan = document.createElement('span');
  highlightSpan.className = `bible-reader-text-highlight bible-reader-text-highlight-${color}`;
  
  try {
    range.surroundContents(highlightSpan);
  } catch (e) {
    // Si surroundContents falla, usar un enfoque alternativo
    const contents = range.extractContents();
    highlightSpan.appendChild(contents);
    range.insertNode(highlightSpan);
  }
}

/**
 * Rellena el menú desplegable de capítulos.
 */
function fillReaderChapterDropdown(chapters) {
  const dropdownContent = document.getElementById('bibleReaderChapterDropdownContent');
  if (!dropdownContent) return;
  dropdownContent.innerHTML = '';
  (chapters || []).forEach((ch) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'bible-reader-dropdown-item';
    btn.textContent = ch.chapter;
    btn.setAttribute('data-chapter', String(ch.chapter));
    btn.addEventListener('click', () => {
      renderReaderChapter(ch.chapter);
      hideChapterDropdown();
    });
    dropdownContent.appendChild(btn);
  });
}

/**
 * Rellena el menú desplegable de libros.
 */
function fillReaderBookDropdown() {
  const dropdownContent = document.getElementById('bibleReaderBookDropdownContent');
  if (!dropdownContent) return;
  dropdownContent.innerHTML = '';
  
  const isEn = LANG() === 'en';
  const otLabel = document.createElement('div');
  otLabel.className = 'bible-reader-dropdown-label';
  otLabel.textContent = isEn ? 'Old Testament' : 'Antiguo Testamento';
  dropdownContent.appendChild(otLabel);
  
  BIBLE_BOOKS_OT.forEach(([id, nameEs, nameEn]) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'bible-reader-dropdown-item';
    btn.textContent = isEn ? nameEn : nameEs;
    btn.setAttribute('data-book-id', id);
    btn.addEventListener('click', async () => {
      const data = await loadBookData(id);
      if (data && data.chapters && data.chapters.length) {
        const bookName = isEn ? nameEn : nameEs;
        openReaderWindow(bookName, id, data, data.chapters[0].chapter);
      } else {
        openBookOnline(id, isEn ? nameEn : nameEs);
      }
      hideBookDropdown();
    });
    dropdownContent.appendChild(btn);
  });
  
  const ntLabel = document.createElement('div');
  ntLabel.className = 'bible-reader-dropdown-label';
  ntLabel.textContent = isEn ? 'New Testament' : 'Nuevo Testamento';
  dropdownContent.appendChild(ntLabel);
  
  BIBLE_BOOKS_NT.forEach(([id, nameEs, nameEn]) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'bible-reader-dropdown-item';
    btn.textContent = isEn ? nameEn : nameEs;
    btn.setAttribute('data-book-id', id);
    btn.addEventListener('click', async () => {
      const data = await loadBookData(id);
      if (data && data.chapters && data.chapters.length) {
        const bookName = isEn ? nameEn : nameEs;
        openReaderWindow(bookName, id, data, data.chapters[0].chapter);
      } else {
        openBookOnline(id, isEn ? nameEn : nameEs);
      }
      hideBookDropdown();
    });
    dropdownContent.appendChild(btn);
  });
}

/**
 * Muestra/oculta el menú desplegable de libros.
 */
function toggleBookDropdown() {
  const dropdown = document.getElementById('bibleReaderBookDropdown');
  const bookBtn = document.getElementById('bibleReaderTitleBook');
  const chapterDropdown = document.getElementById('bibleReaderChapterDropdown');
  if (!dropdown || !bookBtn) return;
  
  const isVisible = dropdown.getAttribute('aria-hidden') === 'false';
  if (isVisible) {
    hideBookDropdown();
  } else {
    hideChapterDropdown();
    const rect = bookBtn.getBoundingClientRect();
    const titlebar = bookBtn.closest('.bible-reader-titlebar');
    const titlebarRect = titlebar?.getBoundingClientRect();
    if (titlebarRect) {
      // Alinear con el inicio del texto del botón (sin el padding izquierdo del botón)
      const computedStyle = window.getComputedStyle(bookBtn);
      const paddingLeft = parseFloat(computedStyle.paddingLeft) || 0;
      dropdown.style.left = `${rect.left - titlebarRect.left - paddingLeft}px`;
      dropdown.style.right = 'auto';
      dropdown.style.width = 'auto';
      dropdown.style.minWidth = '200px';
      dropdown.style.maxWidth = `${titlebarRect.width - 40}px`;
    }
    dropdown.setAttribute('aria-hidden', 'false');
    dropdown.classList.add('bible-reader-dropdown-visible');
    fillReaderBookDropdown();
  }
}

function hideBookDropdown() {
  const dropdown = document.getElementById('bibleReaderBookDropdown');
  if (!dropdown) return;
  dropdown.setAttribute('aria-hidden', 'true');
  dropdown.classList.remove('bible-reader-dropdown-visible');
}

/**
 * Muestra/oculta el menú desplegable de capítulos.
 */
function toggleChapterDropdown() {
  const dropdown = document.getElementById('bibleReaderChapterDropdown');
  const chapterBtn = document.getElementById('bibleReaderTitleChapter');
  const bookDropdown = document.getElementById('bibleReaderBookDropdown');
  if (!dropdown || !chapterBtn) return;
  
  const isVisible = dropdown.getAttribute('aria-hidden') === 'false';
  if (isVisible) {
    hideChapterDropdown();
  } else {
    hideBookDropdown();
    const rect = chapterBtn.getBoundingClientRect();
    const titlebar = chapterBtn.closest('.bible-reader-titlebar');
    const titlebarRect = titlebar?.getBoundingClientRect();
    if (titlebarRect) {
      // Alinear con el inicio del texto del botón (sin el padding izquierdo del botón)
      const computedStyle = window.getComputedStyle(chapterBtn);
      const paddingLeft = parseFloat(computedStyle.paddingLeft) || 0;
      dropdown.style.left = `${rect.left - titlebarRect.left - paddingLeft}px`;
      dropdown.style.right = 'auto';
      dropdown.style.width = 'auto';
      dropdown.style.minWidth = '120px';
      dropdown.style.maxWidth = `${titlebarRect.width - 40}px`;
    }
    dropdown.setAttribute('aria-hidden', 'false');
    dropdown.classList.add('bible-reader-dropdown-visible');
  }
}

function hideChapterDropdown() {
  const dropdown = document.getElementById('bibleReaderChapterDropdown');
  if (!dropdown) return;
  dropdown.setAttribute('aria-hidden', 'true');
  dropdown.classList.remove('bible-reader-dropdown-visible');
}

/** Panel izquierdo: libro y capítulo */
function openBookChapterPanel() {
  const panel = document.getElementById('bibleReaderBookChapterPanel');
  const titleEl = document.getElementById('bibleReaderBookChapterPanelTitle');
  if (!panel) return;
  if (titleEl) titleEl.textContent = LANG() === 'en' ? 'Book & Chapter' : 'Libro y capítulo';
  panel.setAttribute('aria-hidden', 'false');
  fillBookChapterPanelBooks();
}

function closeBookChapterPanel() {
  const panel = document.getElementById('bibleReaderBookChapterPanel');
  if (!panel) return;
  panel.setAttribute('aria-hidden', 'true');
}

function fillBookChapterPanelBooks() {
  const listEl = document.getElementById('bibleReaderBooksList');
  if (!listEl) return;
  const isEn = LANG() === 'en';

  listEl.innerHTML = '';

  function addBookRow(bookId, bookName) {
    const row = document.createElement('div');
    row.className = 'bible-reader-book-row';
    row.setAttribute('data-book-id', bookId);

    const header = document.createElement('button');
    header.type = 'button';
    header.className = 'bible-reader-book-row-header';
    header.setAttribute('aria-expanded', 'false');

    const chevron = document.createElement('span');
    chevron.className = 'bible-reader-book-row-chevron';
    chevron.textContent = '▶';
    chevron.setAttribute('aria-hidden', 'true');

    const nameSpan = document.createElement('span');
    nameSpan.className = 'bible-reader-book-row-name';
    nameSpan.textContent = bookName;

    header.appendChild(chevron);
    header.appendChild(nameSpan);
    row.appendChild(header);

    const chaptersWrap = document.createElement('div');
    chaptersWrap.className = 'bible-reader-book-row-chapters';
    chaptersWrap.style.display = 'none';
    row.appendChild(chaptersWrap);

    header.addEventListener('click', async (e) => {
      e.stopPropagation();
      const expanded = header.getAttribute('aria-expanded') === 'true';
      if (expanded) {
        chaptersWrap.style.display = 'none';
        header.setAttribute('aria-expanded', 'false');
        chevron.textContent = '▶';
        return;
      }
      header.setAttribute('aria-expanded', 'true');
      chevron.textContent = '▼';
      if (chaptersWrap.children.length === 0) {
        const data = await loadBookData(bookId);
        if (data && data.chapters && data.chapters.length) {
          data.chapters.forEach((ch) => {
            const chBtn = document.createElement('button');
            chBtn.type = 'button';
            chBtn.className = 'bible-reader-chapter-item';
            chBtn.textContent = ch.chapter;
            chBtn.setAttribute('data-chapter', String(ch.chapter));
            chBtn.addEventListener('click', (e) => {
              e.stopPropagation();
              if (readerBookId === bookId) {
                renderReaderChapter(ch.chapter);
              } else {
                loadBookData(bookId).then((d) => {
                  if (d && d.chapters && d.chapters.length) {
                    openReaderWindow(bookName, bookId, d, ch.chapter);
                  }
                });
              }
              closeBookChapterPanel();
            });
            chaptersWrap.appendChild(chBtn);
          });
        } else {
          openBookOnline(bookId, bookName);
          closeBookChapterPanel();
        }
      }
      chaptersWrap.style.display = chaptersWrap.children.length ? 'block' : 'none';
    });

    listEl.appendChild(row);
  }

  const otLabel = document.createElement('div');
  otLabel.className = 'bible-reader-book-chapter-label';
  otLabel.textContent = isEn ? 'Old Testament' : 'Antiguo Testamento';
  listEl.appendChild(otLabel);

  BIBLE_BOOKS_OT.forEach(([id, nameEs, nameEn]) => {
    addBookRow(id, isEn ? nameEn : nameEs);
  });

  const ntLabel = document.createElement('div');
  ntLabel.className = 'bible-reader-book-chapter-label';
  ntLabel.textContent = isEn ? 'New Testament' : 'Nuevo Testamento';
  listEl.appendChild(ntLabel);

  BIBLE_BOOKS_NT.forEach(([id, nameEs, nameEn]) => {
    addBookRow(id, isEn ? nameEn : nameEs);
  });
}

function fillBookChapterPanelChapters(chapters) {
  // Ya no se usa: los capítulos se muestran dentro de cada libro al expandir
}

/**
 * Renderiza el contenido del capítulo en el overlay.
 */
function renderReaderChapter(chapterNum) {
  // Limpiar búsqueda al cambiar de capítulo
  const searchInput = document.getElementById('bibleReaderSearch');
  const searchResults = document.getElementById('bibleReaderSearchResults');
  if (searchInput) {
    searchInput.value = '';
    const searchClear = document.getElementById('bibleReaderSearchClear');
    if (searchClear) searchClear.style.display = 'none';
  }
  if (searchResults) {
    searchResults.innerHTML = '';
  }
  // Limpiar resaltados usando la función del módulo enhanced
  if (window.clearBibleSearch) {
    window.clearBibleSearch();
  } else if (window.Mark) {
    const contentEl = document.getElementById('bibleReaderContent');
    if (contentEl) {
      const markInstance = new Mark(contentEl);
      markInstance.unmark();
    }
  }
  const contentEl = document.getElementById('bibleReaderContent');
  const titleBtn = document.getElementById('bibleReaderTitleBookChapter');
  if (!contentEl || !readerBookData || !readerBookData.chapters) return;

  readerCurrentChapter = String(chapterNum);
  // Exponer globalmente para acceso desde otros módulos
  window.readerCurrentChapter = String(chapterNum);
  const ch = readerBookData.chapters.find(c => String(c.chapter) === String(chapterNum));
  const displayName = readerBookData.book || readerBookName;
  const chapterLabel = LANG() === 'en' ? 'Chapter' : 'Capítulo';

  if (titleBtn) titleBtn.textContent = `${displayName} — ${chapterLabel} ${chapterNum}`;

  if (!ch || !ch.verses || !ch.verses.length) {
    contentEl.innerHTML = `<p class="bible-reader-verse">${escapeHtml(LANG() === 'en' ? 'No verses for this chapter.' : 'No hay versículos para este capítulo.')}</p>`;
    return;
  }

  currentTextSelection = null;
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
        return `<span class="bible-reader-verse${highlightClass}" data-verse="${escapeHtml(num)}"><sup class="bible-reader-verse-num">${escapeHtml(num)}</sup> ${escapeHtml(v.text || '')}${noteIcon}</span>`;
      })
      .join(' ');
    paragraphs.push(`<p class="bible-reader-paragraph">${verseSpans}</p>`);
  }
  contentEl.innerHTML = `<div class="bible-reader-verses">${paragraphs.join('')}</div>`;
  
  // Re-aplicar configuración del lector después de renderizar
  if (window.applyBibleReaderSettings) {
    setTimeout(() => {
      window.applyBibleReaderSettings();
      // Restaurar highlights visuales después de renderizar (con delay adicional)
      if (window.restoreHighlightsFromStorage) {
        setTimeout(() => {
          console.log('[renderReaderChapter] Restoring highlights after render');
          window.restoreHighlightsFromStorage();
        }, 100);
      }
    }, 50);
  } else {
    // Si no hay applyBibleReaderSettings, restaurar highlights de todas formas
    setTimeout(() => {
      if (window.restoreHighlightsFromStorage) {
        console.log('[renderReaderChapter] Restoring highlights (no settings)');
        window.restoreHighlightsFromStorage();
      }
    }, 150);
  }

  // Configurar selección de texto por letra/palabra
  setupTextSelection(contentEl);
  
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

/** Configura la selección de texto por letra/palabra */
function setupTextSelection(contentEl) {
  if (!contentEl) return;
  
  // Prevenir eventos de click en versículos que interfieran con la selección
  contentEl.querySelectorAll('.bible-reader-verse').forEach(verseEl => {
    // Eliminar cualquier listener previo y prevenir selección de versículo completo
    verseEl.addEventListener('mousedown', (e) => {
      // Permitir selección de texto normal - no hacer nada especial
      // Solo prevenir si es click en el icono de nota
      if (e.target.closest('.bible-reader-verse-note-icon')) {
        e.stopPropagation();
      }
    }, { passive: true });
  });
  
  // Detectar cuando se selecciona texto (solo para guardar la selección, no para mostrar menú)
  // El menú se maneja en initEnhancedContextMenu
  contentEl.addEventListener('mouseup', (e) => {
    // No procesar si es click en el icono de nota
    if (e.target.closest('.bible-reader-verse-note-icon')) {
      return;
    }
    
    // Permitir que la selección de texto funcione normalmente
    // El menú mejorado se encargará de mostrar el menú contextual
  });
  
  // Ocultar menú al hacer click fuera
  document.addEventListener('mousedown', (e) => {
    if (contextMenuVisible() && !document.getElementById('bibleContextMenu')?.contains(e.target)) {
      hideContextMenu();
      currentTextSelection = null;
    }
  });
  
  // Permitir selección de texto normal - no prevenir eventos de doble click
}

/** Menú contextual: mostrar/ocultar */
function contextMenuVisible() {
  const menu = document.getElementById('bibleContextMenu');
  return menu && menu.classList.contains('bible-context-menu-visible');
}

function showContextMenu(clientX, clientY) {
  if (!readerBookId || !readerCurrentChapter) return;
  if (!currentTextSelection || !currentTextSelection.text) return;
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

// Funciones de long-press eliminadas - ya no se necesitan con selección de texto

/**
 * Abre la ventana de lectura con el libro cargado y el capítulo indicado (por defecto el primero).
 * Si se pasa verseNum, después de renderizar se hace scroll hasta ese versículo.
 */
function openReaderWindow(bookName, bookId, data, chapterNum, verseNum) {
  if (!data || !data.chapters || !data.chapters.length) return;

  readerBookData = data;
  readerBookName = bookName;
  readerBookId = bookId;
  // Exponer globalmente para acceso desde otros módulos
  window.readerBookId = bookId;
  window.readerCurrentChapter = chapterNum;

  const overlay = document.getElementById('bibleReaderOverlay');
  if (!overlay) return;

  const firstChapter = data.chapters[0] && data.chapters[0].chapter;
  const openChapter = chapterNum != null ? String(chapterNum) : firstChapter;

  renderReaderChapter(openChapter);

  overlay.style.display = 'block';
  document.body.classList.add('bible-reader-open');

  const menuBtn = document.getElementById('bibleReaderMenuBtn');
  if (menuBtn) menuBtn.focus();
  
  // Inicializar funcionalidades mejoradas cuando se abre el lector
  if (window.initBibleReaderEnhanced) {
    setTimeout(() => {
      window.initBibleReaderEnhanced();
    }, 100);
  }

  if (verseNum != null && verseNum !== '') {
    const verseStr = String(verseNum);
    requestAnimationFrame(() => {
      const contentEl = document.getElementById('bibleReaderContent');
      const verseEl = contentEl?.querySelector(`.bible-reader-verse[data-verse="${verseStr}"]`);
      if (verseEl) verseEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }
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
  hideBookDropdown();
  hideChapterDropdown();
  currentTextSelection = null;
  readerBookData = null;
  readerBookName = '';
  readerBookId = '';
  readerCurrentChapter = '';
  // Limpiar variables globales
  window.readerBookId = '';
  window.readerCurrentChapter = '';
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

/** Texto de varios versículos con referencia completa en negrita (Markdown) antes de cada pasaje para compartir. */
function getVersesTextWithNumbers(nums) {
  const sorted = [...nums].map(String).sort((a, b) => Number(a) - Number(b));
  return sorted
    .map(n => {
      const txt = getVerseText(n);
      const ref = getCurrentRef(n);
      return txt && ref ? `**${ref}** ${txt}` : '';
    })
    .filter(Boolean)
    .join('\n\n');
}

/** Guarda los versículos actualmente seleccionados como una sola entrada (ej. 1-4). */
function saveSelectedVerses() {
  if (!readerBookId || !readerCurrentChapter) return;
  if (!currentTextSelection || !currentTextSelection.text) {
    showToast(t('bibleSelectText') || 'Selecciona texto para guardar.');
    return;
  }
  
  const selectedText = currentTextSelection.text;
  const key = `${readerBookId}:${readerCurrentChapter}:${selectedText.substring(0, 50)}`;
  const saved = getSavedVerses();
  
  if (saved.some(v => v.key === key)) {
    showToast(t('bibleVersesSaved') || 'Texto guardado.');
    return;
  }
  
  const verseElements = document.querySelectorAll('.bible-reader-verse');
  const affectedVerses = [];
  verseElements.forEach(verseEl => {
    if (verseEl.textContent.includes(selectedText)) {
      const verseNum = verseEl.getAttribute('data-verse');
      if (verseNum) affectedVerses.push(verseNum);
    }
  });
  
  const verseRange = formatVerseRange(affectedVerses);
  const ref = getRefForVerseRange(affectedVerses) || getCurrentRef();
  
  saved.unshift({
    key,
    ref,
    bookId: readerBookId,
    chapter: readerCurrentChapter,
    verses: affectedVerses.map(String).sort((a, b) => Number(a) - Number(b)),
    verseRange,
    text: selectedText,
    note: '',
    savedAt: Date.now()
  });
  setSavedVerses(saved);
  showToast(t('bibleVersesSaved') || 'Texto guardado.');
  hideContextMenu();
  updatePassagesList();
  currentTextSelection = null;
}

/** Comparte el texto seleccionado: Web Share API si está disponible, si no copia al portapapeles. */
function shareSelectedVerses() {
  if (!readerBookId || !readerCurrentChapter) return;
  if (!currentTextSelection || !currentTextSelection.text) {
    showToast(t('bibleSelectText') || 'Selecciona texto para compartir.');
    return;
  }
  
  const selectedText = currentTextSelection.text;
  const verseElements = document.querySelectorAll('.bible-reader-verse');
  const affectedVerses = [];
  verseElements.forEach(verseEl => {
    if (verseEl.textContent.includes(selectedText)) {
      const verseNum = verseEl.getAttribute('data-verse');
      if (verseNum) affectedVerses.push(verseNum);
    }
  });
  
  const ref = getRefForVerseRange(affectedVerses) || getCurrentRef();
  const shareText = `${ref}\n\n${selectedText}`;

  if (typeof navigator !== 'undefined' && navigator.share) {
    navigator.share({
      title: ref,
      text: text
    }).then(() => {
      showToast(t('bibleVerseShared') || 'Compartido');
    }).catch(() => {
      copyToClipboard(shareText);
      showToast(t('bibleVerseCopied') || 'Copiado al portapapeles');
    });
  } else {
    copyToClipboard(shareText);
    showToast(t('bibleVerseCopied') || 'Copiado al portapapeles');
  }
}

function copyToClipboard(str) {
  if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(str).catch(() => {});
  } else {
    try {
      const ta = document.createElement('textarea');
      ta.value = str;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    } catch (_) {}
  }
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
  if (!currentTextSelection || !currentTextSelection.text) {
    showToast(t('bibleSelectText') || 'Selecciona texto para añadir nota.');
    return;
  }
  
  noteEditingVerseKey = null;
  const verseElements = document.querySelectorAll('.bible-reader-verse');
  const affectedVerses = [];
  verseElements.forEach(verseEl => {
    if (verseEl.textContent.includes(currentTextSelection.text)) {
      const verseNum = verseEl.getAttribute('data-verse');
      if (verseNum) affectedVerses.push(verseNum);
    }
  });
  
  const ref = getRefForVerseRange(affectedVerses) || getCurrentRef();
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

/** Obtiene el nombre del libro desde bookId */
function getBookNameFromId(bookId) {
  const isEn = LANG() === 'en';
  const allBooks = [...BIBLE_BOOKS_OT, ...BIBLE_BOOKS_NT];
  const entry = allBooks.find(([id]) => id === bookId);
  return entry ? (isEn ? entry[2] : entry[1]) : bookId;
}

/** Genera la referencia para un highlight */
function getRefForHighlight(highlight) {
  const bookName = getBookNameFromId(highlight.bookId);
  if (!bookName || !highlight.chapter || !highlight.verseRange) return '';
  return `${bookName} ${highlight.chapter}:${highlight.verseRange}`;
}

function renderVersesList() {
  // Exponer globalmente para acceso desde otros módulos
  window.renderVersesList = renderVersesList;
  const listEl = document.getElementById('biblePassagesList');
  if (!listEl) {
    console.warn('biblePassagesList element not found');
    return;
  }
  
  // Leer highlights usando la función getHighlights()
  const highlights = getHighlights();
  console.log('Raw localStorage data:', localStorage.getItem(STORAGE_HIGHLIGHTS));
  console.log('Parsed highlights from getHighlights():', highlights);
  
  const noMsg = LANG() === 'en' ? 'You have not made any highlights yet.' : 'Aún no has hecho ningún subrayado.';
  const delLabel = t('bibleDelete') || 'Eliminar';
  
  console.log('Rendering highlights list. Total highlights:', highlights.length, highlights);
  
  if (!highlights.length) {
    listEl.innerHTML = `<p class="bible-reader-list-empty">${escapeHtml(noMsg)}</p>`;
    return;
  }
  
  // Mapeo de colores para mostrar visualmente
  const colorMap = {
    yellow: '#fbbf24',
    green: '#22c55e',
    blue: '#3b82f6',
    pink: '#ec4899',
    orange: '#f97316',
    purple: '#a855f7',
    red: '#ef4444'
  };
  
  listEl.innerHTML = highlights.map((h, index) => {
    const highlightId = `highlight-${h.bookId}-${h.chapter}-${index}`;
    const delId = `del-highlight-${index}`;
    const ref = getRefForHighlight(h);
    // Asegurar que selectedText existe, si no usar texto por defecto
    const selectedText = h.selectedText || (h.text || '') || '';
    const textPreview = selectedText.slice(0, 80) + (selectedText.length > 80 ? '…' : '');
    const colorHex = colorMap[h.color] || colorMap.yellow;
    
    // Si no hay texto seleccionado ni referencia, saltar este highlight
    if (!selectedText && !ref) {
      console.warn('Skipping highlight without text or ref:', h);
      return '';
    }
    
    return `<div class="bible-reader-list-item" data-highlight-index="${index}" data-book-id="${escapeHtml(h.bookId)}" data-chapter="${escapeHtml(h.chapter)}" data-verse-range="${escapeHtml(h.verseRange || '')}">
        <div class="bible-reader-list-item-body">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 4px;">
            <div style="display: flex; align-items: center; gap: 8px; flex: 1;">
              <span class="bible-reader-list-ref">${escapeHtml(ref)}</span>
              <span style="width: 20px; height: 20px; border-radius: 50%; background: ${colorHex}; border: 2px solid rgba(0,0,0,0.1); flex-shrink: 0;" title="${escapeHtml(h.color)}"></span>
            </div>
            <button type="button" class="bible-reader-list-del" id="${delId}" aria-label="${escapeHtml(delLabel)}" style="background: transparent; border: none; color: #ef4444; font-size: 1.2rem; cursor: pointer; padding: 4px 8px; line-height: 1; transition: all 0.2s; flex-shrink: 0;">✖</button>
          </div>
          ${textPreview ? `<span class="bible-reader-list-preview">${escapeHtml(textPreview)}</span>` : ''}
        </div>
      </div>`;
  }).join('');

  listEl.querySelectorAll('.bible-reader-list-item').forEach(item => {
    const bookId = item.getAttribute('data-book-id');
    const chapter = item.getAttribute('data-chapter');
    const verseRange = item.getAttribute('data-verse-range');
    const body = item.querySelector('.bible-reader-list-item-body');
    
    body?.addEventListener('click', () => {
      closeSidepanel();
      loadBookData(bookId).then(data => {
        if (data?.chapters?.length) {
          const bookName = getBookNameFromId(bookId);
          openReaderWindow(bookName, bookId, data, chapter);
          // Scroll al primer versículo del rango después de un pequeño delay
          // También restaurar highlights después de que se renderice el capítulo
          if (verseRange) {
            setTimeout(() => {
              const firstVerse = verseRange.split(',')[0].split('-')[0];
              const verseEl = document.querySelector(`.bible-reader-verse[data-verse="${firstVerse}"]`);
              if (verseEl) {
                verseEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
              // Restaurar highlights después de hacer scroll
              if (window.restoreHighlightsFromStorage) {
                setTimeout(() => {
                  window.restoreHighlightsFromStorage();
                }, 200);
              }
            }, 500);
          } else {
            // Si no hay verseRange, restaurar highlights después de un delay
            setTimeout(() => {
              if (window.restoreHighlightsFromStorage) {
                window.restoreHighlightsFromStorage();
              }
            }, 500);
          }
        }
      });
    });
    
    const delBtn = item.querySelector('.bible-reader-list-del');
    if (delBtn) {
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        const index = parseInt(item.getAttribute('data-highlight-index'), 10);
        const highlights = getHighlights();
        if (index >= 0 && index < highlights.length) {
          const deletedHighlight = highlights[index];
          highlights.splice(index, 1);
          setHighlights(highlights);
          renderVersesList();
          // Re-renderizar el capítulo si está abierto y es el mismo libro/capítulo
          if (readerBookData && readerBookId === deletedHighlight.bookId && 
              readerCurrentChapter === deletedHighlight.chapter) {
            renderReaderChapter(readerCurrentChapter);
          }
        }
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
 * Abre el lector de la Biblia con un libro y capítulo (para uso desde sopa de letras u otros).
 * verseNum opcional: si se pasa, el lector hace scroll hasta ese versículo.
 */
export async function openReaderWithBook(bookId, chapterNum, verseNum) {
  const data = await loadBookData(bookId);
  if (!data || !data.chapters || !data.chapters.length) return;
  const isEn = LANG() === 'en';
  const allBooks = [...BIBLE_BOOKS_OT, ...BIBLE_BOOKS_NT];
  const entry = allBooks.find(([id]) => id === bookId);
  const bookName = entry ? (isEn ? entry[2] : entry[1]) : (data.book || bookId);
  const chapter = chapterNum != null ? String(chapterNum) : (data.chapters[0] && data.chapters[0].chapter);
  openReaderWindow(bookName, bookId, data, chapter, verseNum);
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

  const titleBtn = document.getElementById('bibleReaderTitleBookChapter');
  const bookChapterPanel = document.getElementById('bibleReaderBookChapterPanel');
  if (titleBtn) {
    titleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openBookChapterPanel();
    });
  }

  // Cerrar panel libro/capítulo al hacer clic fuera
  document.addEventListener('click', (e) => {
    if (bookChapterPanel && bookChapterPanel.getAttribute('aria-hidden') === 'false' &&
        !bookChapterPanel.contains(e.target) && !titleBtn?.contains(e.target)) {
      closeBookChapterPanel();
    }
  });

  const bookChapterPanelClose = document.getElementById('bibleReaderBookChapterPanelClose');
  if (bookChapterPanelClose) {
    bookChapterPanelClose.addEventListener('click', closeBookChapterPanel);
  }

  // Conectar botón de hamburguesa al panel existente
  const menuBtn = document.getElementById('bibleReaderMenuBtn');
  const sidepanel = document.getElementById('bibleReaderSidepanel');
  
  if (menuBtn && sidepanel) {
    menuBtn.addEventListener('click', () => {
      openSidepanel();
      // Inicializar sliders cuando se abre el panel (con delay para asegurar que el DOM esté listo)
      if (window.setupSliders) {
        setTimeout(() => {
          window.setupSliders();
        }, 150);
      }
    });
  }
  
  // Cerrar panel al hacer click fuera
  document.addEventListener('click', (e) => {
    if (sidepanel && sidepanel.getAttribute('aria-hidden') === 'false' &&
        !sidepanel.contains(e.target) && 
        !menuBtn?.contains(e.target)) {
      closeSidepanel();
    }
  });

  migratePassagesToVerses();

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
        else if (document.getElementById('bibleReaderBookChapterPanel')?.getAttribute('aria-hidden') === 'false') closeBookChapterPanel();
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
    const ctxShare = document.getElementById('bibleContextShare');
    if (ctxShare) ctxShare.addEventListener('click', () => { shareSelectedVerses(); hideContextMenu(); });
    const colors = contextMenu.querySelectorAll('.bible-context-color[data-color]');
    colors.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const color = e.currentTarget.getAttribute('data-color') || '';
        applyHighlightToSelection(color);
      });
    });
  }
}
