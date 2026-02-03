// js/game/bible-study.js - Estudio de la Biblia: selector de libros y área de lectura

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

/**
 * Rellena el selector de libros de la Biblia con AT y NT.
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
 * Muestra en el área de lectura el libro seleccionado (placeholder + enlace externo).
 */
function renderReadingArea(bookId, bookName) {
  const area = document.getElementById('bibleReadingArea');
  if (!area) return;

  const ref = BOOK_REF[bookId];
  const baseUrl = 'https://www.bible.com/bible';
  const langCode = LANG() === 'en' ? '59' : '146'; // 59 = NIV English, 146 = RVR1960 Spanish
  const readUrl = ref ? `${baseUrl}/${langCode}/${ref}.1.1` : baseUrl;

  const isEn = LANG() === 'en';
  const comingSoon = isEn
    ? 'Full text of this book will be available here soon.'
    : 'El texto completo de este libro estará disponible aquí pronto.';
  const readOnline = isEn ? 'Read online' : 'Leer en línea';

  area.innerHTML = `
    <div class="bible-reading-content">
      <h2 class="bible-book-title">${escapeHtml(bookName)}</h2>
      <p class="bible-reading-placeholder-text">${comingSoon}</p>
      <a href="${readUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-bible-link">${readOnline}</a>
    </div>
  `;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Muestra el placeholder inicial cuando no hay libro seleccionado.
 */
function showPlaceholder() {
  const area = document.getElementById('bibleReadingArea');
  if (!area) return;
  area.innerHTML = `
    <p class="bible-reading-placeholder" data-i18n="bibleSelectBookToRead">${t('bibleSelectBookToRead')}</p>
  `;
}

/**
 * Inicializa el modo Estudio de la Biblia: rellena selector y enlaza el cambio.
 */
export function initBibleStudy() {
  populateBibleBookSelector();

  const sel = document.getElementById('bibleBookSel');
  const wrap = document.getElementById('bibleStudyWrap');
  if (!sel) return;

  sel.addEventListener('change', () => {
    const value = sel.value;
    if (!value) {
      showPlaceholder();
      return;
    }
    const option = sel.options[sel.selectedIndex];
    const bookName = option ? option.textContent : value;
    renderReadingArea(value, bookName);
  });

  // Si al mostrar la sección ya hay un libro seleccionado, renderizar
  if (wrap && sel.value) {
    const option = sel.options[sel.selectedIndex];
    if (option) renderReadingArea(sel.value, option.textContent);
  }
}
