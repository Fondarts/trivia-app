// js/game/pdf-reader.js - Lector de PDFs (Biblia u otros)

import { t, getLanguage } from '../core/i18n.js';

/** Lista de PDFs disponibles: { nameEs, nameEn, file } */
const PDF_LIST = [
  { nameEs: 'Juan 1 (Español)', nameEn: 'John 1 (Spanish)', file: 'Juan1_es.pdf' }
];

/** Ruta base para PDFs (relativa al documento, debe estar en www/pdf/) */
const PDF_BASE = 'pdf';

const LANG = () => (getLanguage && getLanguage()) === 'en' ? 'en' : 'es';

/**
 * Rellena el selector de PDFs.
 */
function populatePdfSelector() {
  const sel = document.getElementById('biblePdfSel');
  if (!sel) return;
  const placeholder = sel.querySelector('option[value=""]');
  sel.innerHTML = '';
  if (placeholder) {
    placeholder.setAttribute('data-i18n', 'bibleSelectBookPlaceholder');
    sel.appendChild(placeholder);
  }
  const isEn = LANG() === 'en';
  PDF_LIST.forEach((item, i) => {
    const opt = document.createElement('option');
    opt.value = item.file;
    opt.textContent = isEn ? item.nameEn : item.nameEs;
    sel.appendChild(opt);
  });
}

/**
 * Abre la ventana del lector de PDF con el archivo indicado.
 * @param {string} file - Nombre del archivo (ej. Juan1_es.pdf)
 * @param {string} title - Título para la barra
 */
export function openPdfReader(file, title) {
  const overlay = document.getElementById('pdfReaderOverlay');
  const titleEl = document.getElementById('pdfReaderTitle');
  const contentEl = document.getElementById('pdfReaderContent');
  const objEl = document.getElementById('pdfReaderObject');
  if (!overlay || !titleEl || !contentEl) return;

  const url = `${PDF_BASE}/${encodeURIComponent(file)}`;
  titleEl.textContent = title || file;

  if (objEl) {
    objEl.setAttribute('data', url);
    objEl.style.display = 'block';
  } else {
    contentEl.innerHTML = `<object type="application/pdf" data="${url}" class="pdf-embed" title="PDF"></object>`;
  }

  overlay.style.display = 'flex';
  document.body.classList.add('pdf-reader-open');
}

/**
 * Cierra la ventana del lector de PDF.
 */
export function closePdfReader() {
  const overlay = document.getElementById('pdfReaderOverlay');
  const objEl = document.getElementById('pdfReaderObject');
  if (overlay) overlay.style.display = 'none';
  if (objEl) {
    objEl.removeAttribute('data');
    objEl.style.display = 'none';
  }
  document.body.classList.remove('pdf-reader-open');
}

/**
 * Inicializa el lector de PDF: rellena selector y enlaza botones.
 */
export function initPdfReader() {
  populatePdfSelector();

  const sel = document.getElementById('biblePdfSel');
  const btn = document.getElementById('btnOpenPdf');
  const closeBtn = document.getElementById('pdfReaderClose');
  const overlay = document.getElementById('pdfReaderOverlay');

  if (btn && sel) {
    btn.addEventListener('click', () => {
      const file = sel.value;
      if (!file) return;
      const opt = sel.options[sel.selectedIndex];
      const title = opt ? opt.textContent : file;
      openPdfReader(file, title);
    });
  }

  if (closeBtn) closeBtn.addEventListener('click', closePdfReader);
  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closePdfReader();
    });
    overlay.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closePdfReader();
    });
  }
}
