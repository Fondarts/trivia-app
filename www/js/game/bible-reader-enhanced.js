// js/game/bible-reader-enhanced.js - Funcionalidades avanzadas del lector de la Biblia
// Búsqueda, menú contextual mejorado, Wikipedia lookup, personalización

import { t, getLanguage } from '../core/i18n.js';

let markInstance = null;
let currentSearchTerm = '';
let readerSettings = null;

const STORAGE_READER_SETTINGS = 'bible_reader_settings';

// Cargar configuración guardada
function loadReaderSettings() {
  try {
    const saved = localStorage.getItem(STORAGE_READER_SETTINGS);
    if (saved) {
      readerSettings = JSON.parse(saved);
    } else {
      readerSettings = {
        fontSize: '1.1rem',
        fontFamily: 'serif',
        lineHeight: 1.8,
        theme: 'light',
        searchEnabled: true
      };
    }
  } catch (e) {
    readerSettings = {
      fontSize: '1.1rem',
      fontFamily: 'serif',
      lineHeight: 1.8,
      theme: 'light',
      searchEnabled: true
    };
  }
  return readerSettings;
}

function saveReaderSettings() {
  try {
    localStorage.setItem(STORAGE_READER_SETTINGS, JSON.stringify(readerSettings));
  } catch (e) {}
}

// Exponer función globalmente para poder llamarla desde otros módulos
window.applyBibleReaderSettings = applyReaderSettings;

function applyReaderSettings() {
  const contentEl = document.getElementById('bibleReaderContent');
  if (!contentEl) {
    console.warn('bibleReaderContent not found');
    return;
  }
  if (!readerSettings) {
    console.warn('readerSettings not loaded');
    return;
  }
  
  
  // Aplicar estilos directamente a los elementos que contienen el texto
  const versesEl = contentEl.querySelector('.bible-reader-verses');
  if (versesEl) {
    // Aplicar fontSize a todos los niveles: contenedor, párrafos y versículos
    versesEl.style.setProperty('font-size', readerSettings.fontSize, 'important');
    
    const paragraphs = versesEl.querySelectorAll('.bible-reader-paragraph');
    paragraphs.forEach(p => {
      p.style.setProperty('font-size', readerSettings.fontSize, 'important');
    });
    
    const verseSpans = versesEl.querySelectorAll('.bible-reader-verse');
    verseSpans.forEach(span => {
      span.style.setProperty('font-size', readerSettings.fontSize, 'important');
      // Asegurar color oscuro en los versos (tema claro por defecto)
      const textColor = readerSettings.theme === 'dark' ? '#f1f5f9' : '#1e293b';
      span.style.setProperty('color', textColor, 'important');
    });
    
    // Asegurar color oscuro también en los párrafos
    paragraphs.forEach(p => {
      const textColor = readerSettings.theme === 'dark' ? '#f1f5f9' : '#1e293b';
      p.style.setProperty('color', textColor, 'important');
    });
    
    // Aplicar fontFamily
    versesEl.style.fontFamily = readerSettings.fontFamily === 'serif' ? 'Georgia, serif' : 
                                 readerSettings.fontFamily === 'sans-serif' ? 'system-ui, sans-serif' : 
                                 readerSettings.fontFamily;
    
    // Aplicar lineHeight solo al contenedor (los hijos lo heredarán)
    versesEl.style.setProperty('line-height', String(readerSettings.lineHeight), 'important');
    
    // Asegurar color en el contenedor de versos
    const textColor = readerSettings.theme === 'dark' ? '#f1f5f9' : '#1e293b';
    versesEl.style.setProperty('color', textColor, 'important');
    
  } else {
    // Fallback: aplicar al contenedor si no existe .bible-reader-verses
    contentEl.style.setProperty('font-size', readerSettings.fontSize, 'important');
    contentEl.style.fontFamily = readerSettings.fontFamily === 'serif' ? 'Georgia, serif' : 
                                  readerSettings.fontFamily === 'sans-serif' ? 'system-ui, sans-serif' : 
                                  readerSettings.fontFamily;
    contentEl.style.setProperty('line-height', String(readerSettings.lineHeight), 'important');
  }
  
  // Aplicar tema
  const wrap = document.querySelector('.bible-reader-wrap');
  
  if (wrap) {
    if (readerSettings.theme === 'dark') {
      wrap.style.background = '#1e293b';
      wrap.style.color = '#f1f5f9';
    } else {
      wrap.style.background = '#fefcf5';
      wrap.style.color = '#1e293b';
    }
  }
  
  // Asegurar que los versos siempre tengan el color correcto según el tema
  // Reutilizar versesEl si ya existe, o buscarlo de nuevo
  const versesElForColor = contentEl.querySelector('.bible-reader-verses');
  if (versesElForColor) {
    const textColor = readerSettings.theme === 'dark' ? '#f1f5f9' : '#1e293b';
    versesElForColor.style.setProperty('color', textColor, 'important');
    
    // Aplicar color a todos los versos y párrafos
    versesElForColor.querySelectorAll('.bible-reader-verse').forEach(span => {
      span.style.setProperty('color', textColor, 'important');
    });
    versesElForColor.querySelectorAll('.bible-reader-paragraph').forEach(p => {
      p.style.setProperty('color', textColor, 'important');
    });
  }
}

// Función para aplicar solo fontSize sin tocar lineHeight
function applyFontSizeOnly() {
  const contentEl = document.getElementById('bibleReaderContent');
  if (!contentEl || !readerSettings) return;
  
  const versesEl = contentEl.querySelector('.bible-reader-verses');
  if (versesEl) {
    // Obtener lineHeight actual antes de modificar nada
    const currentLineHeight = versesEl.style.lineHeight || window.getComputedStyle(versesEl).lineHeight;
    
    // Aplicar fontSize directamente a los elementos que contienen el texto
    // Aplicar a .bible-reader-verses (contenedor)
    versesEl.style.setProperty('font-size', readerSettings.fontSize, 'important');
    
    // Aplicar también a .bible-reader-paragraph (párrafos) para asegurar que funcione
    const paragraphs = versesEl.querySelectorAll('.bible-reader-paragraph');
    paragraphs.forEach(p => {
      p.style.setProperty('font-size', readerSettings.fontSize, 'important');
    });
    
    // Aplicar también a .bible-reader-verse (versículos individuales) para asegurar que funcione
    const verseSpans = versesEl.querySelectorAll('.bible-reader-verse');
    verseSpans.forEach(span => {
      span.style.setProperty('font-size', readerSettings.fontSize, 'important');
    });
    
    // Restaurar el lineHeight que tenía antes (preservarlo)
    if (currentLineHeight && currentLineHeight !== 'normal') {
      versesEl.style.setProperty('line-height', currentLineHeight, 'important');
    }
  }
}

// Función para aplicar solo lineHeight sin tocar fontSize
function applyLineHeightOnly() {
  const contentEl = document.getElementById('bibleReaderContent');
  if (!contentEl || !readerSettings) return;
  
  const versesEl = contentEl.querySelector('.bible-reader-verses');
  if (versesEl) {
    // Obtener fontSize actual (del estilo o del CSS)
    const currentFontSize = versesEl.style.fontSize || window.getComputedStyle(versesEl).fontSize;
    const fontSizeRem = parseFloat(currentFontSize);
    
    // Calcular lineHeight absoluto basado en el fontSize actual y el ratio deseado
    const lineHeightRatio = readerSettings.lineHeight;
    const lineHeightAbsolute = `${(fontSizeRem * lineHeightRatio).toFixed(2)}rem`;
    
    // Aplicar lineHeight como valor absoluto
    versesEl.style.setProperty('line-height', lineHeightAbsolute, 'important');
    // Asegurar que fontSize no cambie
    versesEl.style.setProperty('font-size', currentFontSize, 'important');
    
    console.log('Line height only applied:', {
      fontSizePreserved: currentFontSize,
      lineHeightRatio: lineHeightRatio,
      lineHeightAbsolute: lineHeightAbsolute,
      lineHeightComputed: window.getComputedStyle(versesEl).lineHeight
    });
  }
}

// Búsqueda de texto completo con resultados en sidebar
export function initBibleReaderSearch() {
  const searchInput = document.getElementById('bibleReaderSearch');
  const searchClear = document.getElementById('bibleReaderSearchClear');
  const searchResults = document.getElementById('bibleReaderSearchResults');
  
  if (!searchInput) return;
  if (!searchResults) {
    console.warn('bibleReaderSearchResults not found');
    return;
  }
  
  // Esperar a que Mark.js esté disponible (puede cargarse después)
  function waitForMark(callback, maxAttempts = 20) {
    if (window.Mark) {
      callback();
      return;
    }
    if (maxAttempts <= 0) {
      // Continuar sin Mark.js - usaremos método alternativo
      callback(false);
      return;
    }
    setTimeout(() => waitForMark(callback, maxAttempts - 1), 100);
  }
  
  waitForMark((hasMark) => {
    initSearchWithMark(hasMark);
  });
  
  function initSearchWithMark(hasMark = true) {
    const contentEl = document.getElementById('bibleReaderContent');
    if (!contentEl) return;
    
    function performSearch(term) {
    const contentEl = document.getElementById('bibleReaderContent');
    if (!contentEl || !term.trim()) {
      clearSearch();
      return;
    }
    
    currentSearchTerm = term.trim().toLowerCase();
    
    // Buscar en todos los versículos
    const verses = contentEl.querySelectorAll('.bible-reader-verse');
    const results = [];
    
    verses.forEach((verseEl) => {
      const verseNum = verseEl.getAttribute('data-verse');
      const verseText = verseEl.textContent || '';
      // Remover el número del versículo del texto para mostrar solo el contenido
      const verseTextClean = verseText.replace(/^\d+\s*/, '').trim();
      const verseTextLower = verseTextClean.toLowerCase();
      
      if (verseTextLower.includes(currentSearchTerm)) {
        // Obtener contexto alrededor del término buscado
        const index = verseTextLower.indexOf(currentSearchTerm);
        const start = Math.max(0, index - 30);
        const end = Math.min(verseTextClean.length, index + currentSearchTerm.length + 50);
        let context = verseTextClean.substring(start, end);
        if (start > 0) context = '...' + context;
        if (end < verseTextClean.length) context = context + '...';
        
        results.push({
          verseNum,
          text: context || verseTextClean,
          fullText: verseTextClean,
          element: verseEl
        });
      }
    });
    
    // Mostrar resultados en el sidebar
    if (results.length > 0) {
      searchResults.innerHTML = `
        <div class="bible-search-results-header">Found ${results.length} result${results.length !== 1 ? 's' : ''}</div>
        <div class="bible-search-results-list">
          ${results.slice(0, 50).map((result, idx) => `
            <div class="bible-search-result-item" data-verse="${result.verseNum}" data-index="${idx}">
              <div class="bible-search-result-verse">${result.verseNum}</div>
              <div class="bible-search-result-text">${highlightSearchTerm(result.text, currentSearchTerm)}</div>
            </div>
          `).join('')}
        </div>
      `;
      
      // Resaltar en el contenido (solo si Mark.js está disponible)
      if (hasMark && window.Mark) {
        try {
          if (!markInstance) {
            markInstance = new Mark(contentEl);
          }
          markInstance.unmark({
            done: () => {
              markInstance.mark(currentSearchTerm, {
                element: 'mark',
                className: 'bible-reader-search-mark',
                separateWordSearch: false,
                diacritics: true,
                accuracy: 'exactly',
                acrossElements: true
              });
            }
          });
        } catch (e) {
          // Si Mark.js falla, continuar sin resaltar
          console.warn('Mark.js error:', e);
        }
      }
      
      // Event listeners para los resultados
      searchResults.querySelectorAll('.bible-search-result-item').forEach(item => {
        item.addEventListener('click', () => {
          const verseNum = item.getAttribute('data-verse');
          const verseEl = contentEl.querySelector(`.bible-reader-verse[data-verse="${verseNum}"]`);
          if (verseEl) {
            verseEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            verseEl.style.background = 'rgba(250, 204, 21, 0.3)';
            setTimeout(() => {
              verseEl.style.background = '';
            }, 2000);
          }
        });
      });
      
      if (searchClear) searchClear.style.display = 'inline-block';
    } else {
      searchResults.innerHTML = '<div class="bible-search-no-results">No results found</div>';
      if (searchClear) searchClear.style.display = 'none';
    }
  }
  
  function highlightSearchTerm(text, term) {
    const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark class="bible-search-highlight">$1</mark>');
  }
  
    function clearSearch() {
      if (markInstance && window.Mark) {
        const contentEl = document.getElementById('bibleReaderContent');
        if (contentEl) {
          markInstance.unmark();
        }
      } else {
        // Fallback: remover highlights manualmente
        const contentEl = document.getElementById('bibleReaderContent');
        if (contentEl) {
          contentEl.querySelectorAll('.bible-reader-search-mark').forEach(el => {
            const parent = el.parentNode;
            parent.replaceChild(document.createTextNode(el.textContent), el);
            parent.normalize();
          });
        }
      }
      currentSearchTerm = '';
      if (searchInput) searchInput.value = '';
      if (searchResults) searchResults.innerHTML = '';
      if (searchClear) searchClear.style.display = 'none';
    }
    
    // Exponer función para limpiar desde otros módulos
    window.clearBibleSearch = clearSearch;
    
    if (searchInput) {
      let searchTimeout = null;
      searchInput.addEventListener('input', (e) => {
        const term = e.target.value;
        clearTimeout(searchTimeout);
        
        if (term.length >= 2) {
          searchTimeout = setTimeout(() => {
            performSearch(term);
          }, 300);
        } else {
          clearSearch();
        }
      });
      
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          clearSearch();
          searchInput.blur();
        }
      });
    }
    
    if (searchClear) {
      searchClear.addEventListener('click', () => {
        clearSearch();
        searchInput.focus();
      });
    }
  }
  
  // Inicializar búsqueda básica incluso sin Mark.js
  if (searchInput) {
    let searchTimeout = null;
    searchInput.addEventListener('input', (e) => {
      const term = e.target.value;
      clearTimeout(searchTimeout);
      
      if (term.length >= 2) {
        searchTimeout = setTimeout(() => {
          // Búsqueda básica sin Mark.js
          performSearch(term);
        }, 300);
      } else {
        if (searchResults) searchResults.innerHTML = '';
        if (searchClear) searchClear.style.display = 'none';
      }
    });
  }
}

// Menú contextual mejorado para texto seleccionado
export function initEnhancedContextMenu() {
  const contentEl = document.getElementById('bibleReaderContent');
  if (!contentEl) return;
  
  let selectionTimeout = null;
  let currentSelection = null;
  
  contentEl.addEventListener('mouseup', (e) => {
    // No procesar si es click en el icono de nota
    if (e.target.closest('.bible-reader-verse-note-icon')) {
      return;
    }
    
    clearTimeout(selectionTimeout);
    selectionTimeout = setTimeout(() => {
      const selection = window.getSelection();
      const selectedText = selection.toString().trim();
      
      // Verificar que hay texto seleccionado y que hay un rango válido
      if (selectedText.length > 0 && selection.rangeCount > 0) {
        try {
          const range = selection.getRangeAt(0);
          if (range && range.toString().trim().length > 0) {
            // Verificar que la selección no incluya el icono de nota
            const container = range.commonAncestorContainer;
            const clickedEl = container.nodeType === Node.TEXT_NODE 
              ? container.parentElement 
              : container;
            
            if (clickedEl && clickedEl.closest('.bible-reader-verse-note-icon')) {
              hideEnhancedContextMenu();
              return;
            }
            
            currentSelection = selection;
            showEnhancedContextMenu(selection, selectedText);
            return;
          }
        } catch (e) {
          console.warn('Error processing selection:', e);
        }
      }
      
      // Si no hay selección válida, ocultar el menú
      hideEnhancedContextMenu();
      currentSelection = null;
    }, 200);
  });
  
  document.addEventListener('mousedown', (e) => {
    const contextMenu = document.getElementById('bibleEnhancedContextMenu');
    if (contextMenu && !contextMenu.contains(e.target)) {
      hideEnhancedContextMenu();
    }
  });
  
  // Event listeners para acciones del menú
  const copyBtn = document.getElementById('bibleContextCopy');
  const noteBtn = document.getElementById('bibleContextNote');
  
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      if (currentSelection) {
        const text = currentSelection.toString();
        navigator.clipboard.writeText(text).then(() => {
          if (window.toast) window.toast('Copied to clipboard');
        });
      }
      hideEnhancedContextMenu();
      window.getSelection().removeAllRanges();
    });
  }
  
  if (noteBtn) {
    noteBtn.addEventListener('click', () => {
      if (currentSelection) {
        const text = currentSelection.toString();
        if (window.openNoteModalForSelection) {
          window.openNoteModalForSelection();
        }
      }
      hideEnhancedContextMenu();
    });
  }
  
  // Event listeners para los círculos de colores (usar delegación de eventos)
  document.addEventListener('click', (e) => {
    const colorCircle = e.target.closest('.bible-enhanced-color-circle');
    if (colorCircle) {
      e.stopPropagation();
      const color = colorCircle.getAttribute('data-color');
      if (currentSelection && currentSelection.rangeCount > 0) {
        try {
          const range = currentSelection.getRangeAt(0);
          const selectedText = currentSelection.toString().trim();
          
          if (range && selectedText) {
            // Aplicar subrayado visual
            applyTextUnderline(range, color);
            
            // Guardar el highlight en localStorage
            saveHighlightToStorage(range, selectedText, color);
          }
        } catch (e) {
          console.warn('Error applying underline:', e);
        }
      }
      hideEnhancedContextMenu();
      window.getSelection().removeAllRanges();
      currentSelection = null;
    }
  });
}

function showEnhancedContextMenu(selection, selectedText) {
  const contextMenu = document.getElementById('bibleEnhancedContextMenu');
  if (!contextMenu) return;
  
  // Verificar que hay una selección válida con rangos
  if (!selection || selection.rangeCount === 0) {
    return;
  }
  
  try {
    const range = selection.getRangeAt(0);
    if (!range) return;
    
    const rect = range.getBoundingClientRect();
    
    let top = rect.bottom + window.scrollY + 10;
    let left = rect.left + window.scrollX;
    
    if (top + 200 > window.innerHeight + window.scrollY) {
      top = rect.top + window.scrollY - 200;
    }
    if (left + 200 > window.innerWidth) {
      left = window.innerWidth - 220;
    }
    
    contextMenu.style.top = `${top}px`;
    contextMenu.style.left = `${left}px`;
    contextMenu.style.display = 'block';
    contextMenu.setAttribute('data-selected-text', selectedText);
  } catch (e) {
    console.warn('Error showing enhanced context menu:', e);
  }
}

function hideEnhancedContextMenu() {
  const contextMenu = document.getElementById('bibleEnhancedContextMenu');
  if (contextMenu) {
    contextMenu.style.display = 'none';
  }
}

/** Carácter de puntuación que suele ir pegada a una palabra (no expandir sobre espacios). */
function isAttachedPunctuation(c) {
  return typeof c === 'string' && /[.,;:?!'")\]\u2019\u201d]/.test(c);
}
/** Puntuación que puede ir antes de una palabra (abre comillas, paréntesis). */
function isLeadingPunctuation(c) {
  return typeof c === 'string' && /[\u201c\u2018\(\[\"]/.test(c);
}

/** Expande un rango a límites de palabra (+ puntuación adyacente), incluso si la palabra cruza varios nodos de texto. */
function expandRangeToWordBoundaries(range) {
  if (!range || range.collapsed) return;
  const isWordChar = (c) => typeof c === 'string' && /[a-zA-Z0-9]/.test(c);
  const anc = range.commonAncestorContainer;
  const root = anc.nodeType === Node.ELEMENT_NODE ? anc : (anc.parentElement || anc.ownerDocument.body);
  let startContainer = range.startContainer;
  let startOffset = range.startOffset;
  let endContainer = range.endContainer;
  let endOffset = range.endOffset;

  // Expandir inicio hacia atrás: primero palabras, luego puntuación inicial
  if (startContainer.nodeType === Node.TEXT_NODE) {
    const text = startContainer.textContent || '';
    while (startOffset > 0 && isWordChar(text[startOffset - 1])) startOffset--;
    while (startOffset > 0 && isLeadingPunctuation(text[startOffset - 1])) startOffset--;
    if (startOffset === 0 && root.contains(startContainer)) {
      const prev = getPreviousTextNodeInRoot(startContainer, root);
      if (prev) {
        const prevText = prev.textContent || '';
        let p = prevText.length;
        while (p > 0 && isWordChar(prevText[p - 1])) p--;
        while (p > 0 && isLeadingPunctuation(prevText[p - 1])) p--;
        if (p < prevText.length) {
          startContainer = prev;
          startOffset = p;
        }
      }
    }
  }

  // Expandir final hacia delante: primero palabras, luego puntuación final (p. ej. "LORD.")
  if (endContainer.nodeType === Node.TEXT_NODE) {
    const text = endContainer.textContent || '';
    while (endOffset < text.length && isWordChar(text[endOffset])) endOffset++;
    while (endOffset < text.length && isAttachedPunctuation(text[endOffset])) endOffset++;
    if (endOffset === text.length && root.contains(endContainer)) {
      const next = getNextTextNodeInRoot(endContainer, root);
      if (next) {
        const nextText = next.textContent || '';
        let n = 0;
        while (n < nextText.length && isWordChar(nextText[n])) n++;
        while (n < nextText.length && isAttachedPunctuation(nextText[n])) n++;
        if (n > 0) {
          endContainer = next;
          endOffset = n;
        }
      }
    }
  }

  try {
    range.setStart(startContainer, startOffset);
    range.setEnd(endContainer, endOffset);
  } catch (_) {}
}

function getPreviousTextNodeInRoot(node, root) {
  if (!root || !root.contains(node)) return null;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
  walker.currentNode = node;
  return walker.previousNode();
}

function getNextTextNodeInRoot(node, root) {
  if (!root || !root.contains(node)) return null;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
  walker.currentNode = node;
  return walker.nextNode();
}

/** Helper: obtiene el primer nodo de texto dentro de un elemento */
function getFirstTextNode(element) {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
  return walker.nextNode();
}

/** Helper: obtiene el último nodo de texto dentro de un elemento */
function getLastTextNode(element) {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
  let last = null;
  while (walker.nextNode()) last = walker.currentNode;
  return last;
}

/** Aplica subrayado de color al texto seleccionado */
function applyTextUnderline(range, color) {
  if (!range || !color) return;
  expandRangeToWordBoundaries(range);
  
  // Detectar si el rango cruza múltiples párrafos - si es así, aplicar por separado para no afectar espaciado
  const startPara = range.startContainer.nodeType === Node.TEXT_NODE 
    ? range.startContainer.parentElement.closest('.bible-reader-paragraph')
    : range.startContainer.closest('.bible-reader-paragraph');
  const endPara = range.endContainer.nodeType === Node.TEXT_NODE
    ? range.endContainer.parentElement.closest('.bible-reader-paragraph')
    : range.endContainer.closest('.bible-reader-paragraph');
  
  if (startPara && endPara && startPara !== endPara) {
    // Cruza múltiples párrafos: aplicar subrayado por separado en cada párrafo para no afectar espaciado
    const paras = [];
    let current = startPara;
    while (current) {
      if (current.classList && current.classList.contains('bible-reader-paragraph')) {
        paras.push(current);
        if (current === endPara) break;
      }
      current = current.nextElementSibling;
    }
    
    paras.forEach((para, idx) => {
      const paraRange = document.createRange();
      if (idx === 0) {
        // Primer párrafo: desde start hasta el final del contenido del párrafo
        paraRange.setStart(range.startContainer, range.startOffset);
        const lastTextNode = getLastTextNode(para);
        if (lastTextNode) {
          paraRange.setEnd(lastTextNode, lastTextNode.textContent.length);
        } else {
          paraRange.setEndAfter(para.lastChild || para);
        }
      } else if (idx === paras.length - 1) {
        // Último párrafo: desde el primer nodo de texto hasta end
        const firstTextNode = getFirstTextNode(para);
        if (firstTextNode) {
          paraRange.setStart(firstTextNode, 0);
        } else {
          paraRange.setStartBefore(para.firstChild || para);
        }
        paraRange.setEnd(range.endContainer, range.endOffset);
      } else {
        // Párrafos intermedios: todo el contenido del párrafo
        paraRange.selectNodeContents(para);
      }
      try {
        const span = document.createElement('span');
        span.className = `bible-text-underline bible-text-underline-${color}`;
        paraRange.surroundContents(span);
      } catch (e) {
        try {
          const contents = paraRange.extractContents();
          const span = document.createElement('span');
          span.className = `bible-text-underline bible-text-underline-${color}`;
          span.appendChild(contents);
          paraRange.insertNode(span);
        } catch (e2) {
          console.warn('Could not apply underline to paragraph:', e2);
        }
      }
    });
    return;
  }
  
  // Rango dentro de un solo párrafo: aplicar normalmente
  try {
    const underlineSpan = document.createElement('span');
    underlineSpan.className = `bible-text-underline bible-text-underline-${color}`;
    range.surroundContents(underlineSpan);
  } catch (e) {
    try {
      const contents = range.extractContents();
      const underlineSpan = document.createElement('span');
      underlineSpan.className = `bible-text-underline bible-text-underline-${color}`;
      underlineSpan.appendChild(contents);
      range.insertNode(underlineSpan);
    } catch (e2) {
      console.warn('Could not apply underline:', e2);
    }
  }
}

/** Devuelve el offset de carácter dentro del texto del versículo donde está (targetNode, targetOffset), o -1 si no está en el versículo. */
function getCharacterOffsetInVerse(verseEl, targetNode, targetOffset) {
  const walker = document.createTreeWalker(verseEl, NodeFilter.SHOW_TEXT, null, false);
  let count = 0;
  let node;
  while ((node = walker.nextNode())) {
    const len = (node.textContent || '').length;
    if (node === targetNode) return count + Math.min(targetOffset, len);
    count += len;
  }
  return -1;
}

/** Dado un rango y un versículo, devuelve { start, end } en offsets de carácter dentro del versículo (para guardar y restaurar por posición). */
function getVerseOffsetsForRange(verseEl, range) {
  const verseNum = verseEl.getAttribute('data-verse');
  if (!verseNum) return null;
  const fullLength = (verseEl.textContent || '').length;
  const startInVerse = verseEl.contains(range.startContainer)
    ? getCharacterOffsetInVerse(verseEl, range.startContainer, range.startOffset)
    : 0;
  const endInVerse = verseEl.contains(range.endContainer)
    ? getCharacterOffsetInVerse(verseEl, range.endContainer, range.endOffset)
    : fullLength;
  if (startInVerse < 0 && endInVerse < 0) return null;
  const start = startInVerse >= 0 ? startInVerse : 0;
  const end = endInVerse >= 0 ? endInVerse : fullLength;
  if (start >= end) return null;
  return { verse: parseInt(verseNum, 10), start, end };
}

/** Dado un rango, devuelve array de { verse, start, end } para cada versículo que toca (para guardar). */
function computeVerseOffsets(range) {
  const verseEls = document.querySelectorAll('.bible-reader-verse');
  const segments = [];
  verseEls.forEach((verseEl) => {
    const seg = getVerseOffsetsForRange(verseEl, range);
    if (seg) segments.push(seg);
  });
  return segments.sort((a, b) => a.verse - b.verse);
}

/** Dado un elemento versículo y offsets de carácter, crea un Range (node, offset) -> (node, offset). */
function createRangeFromVerseOffsets(verseEl, startChar, endChar) {
  const range = document.createRange();
  const walker = document.createTreeWalker(verseEl, NodeFilter.SHOW_TEXT, null, false);
  let count = 0;
  let node;
  let startNode = null;
  let startOffset = 0;
  let endNode = null;
  let endOffset = 0;
  let lastNode = null;
  let lastLen = 0;
  while ((node = walker.nextNode())) {
    const len = (node.textContent || '').length;
    lastNode = node;
    lastLen = len;
    const nextCount = count + len;
    if (startNode === null && startChar <= nextCount) {
      startNode = node;
      startOffset = Math.min(Math.max(0, startChar - count), len);
    }
    if (endNode === null && endChar <= nextCount) {
      endNode = node;
      endOffset = Math.min(Math.max(0, endChar - count), len);
    }
    count = nextCount;
  }
  if (!endNode && lastNode) {
    endNode = lastNode;
    endOffset = lastLen;
  }
  if (startNode && endNode) {
    range.setStart(startNode, startOffset);
    range.setEnd(endNode, endOffset);
    return range;
  }
  return null;
}

/** Guarda un highlight en localStorage */
function saveHighlightToStorage(range, selectedText, color) {
  console.log('[saveHighlightToStorage] 🚀 Function called with:', { 
    hasRange: !!range, 
    selectedText: selectedText ? selectedText.substring(0, 50) : 'none',
    color 
  });
  
  // Obtener información del libro y capítulo actual desde el DOM o variables globales
  const bookId = window.readerBookId;
  const chapter = String(window.readerCurrentChapter || '');
  
  console.log('[saveHighlightToStorage] 📖 Book/Chapter info:', { bookId, chapter, readerBookId: window.readerBookId, readerCurrentChapter: window.readerCurrentChapter });
  
  if (!bookId || !chapter) {
    console.error('[saveHighlightToStorage] ❌ Missing book or chapter - ABORTING', { bookId, chapter });
    return;
  }
  
  console.log('[saveHighlightToStorage] ✅ Proceeding to save highlight:', { bookId, chapter, color, selectedText: selectedText.substring(0, 50) });
  
  // Encontrar los versículos que están dentro del rango seleccionado
  const verseElements = document.querySelectorAll('.bible-reader-verse');
  const affectedVerses = new Set();
  
  // Obtener el contenedor común del rango
  const rangeContainer = range.commonAncestorContainer;
  const containerElement = rangeContainer.nodeType === Node.TEXT_NODE 
    ? rangeContainer.parentElement 
    : rangeContainer;
  
  // Encontrar todos los versículos que están dentro del rango seleccionado
  verseElements.forEach(verseEl => {
    // Verificar si el versículo está dentro del rango seleccionado
    const verseRange = document.createRange();
    try {
      verseRange.selectNodeContents(verseEl);
      
      // Verificar si hay intersección entre el rango del versículo y el rango seleccionado
      if (range.intersectsNode(verseEl) || 
          (range.startContainer.contains(verseEl) || verseEl.contains(range.startContainer)) ||
          (range.endContainer.contains(verseEl) || verseEl.contains(range.endContainer))) {
        const verseNum = verseEl.getAttribute('data-verse');
        if (verseNum) {
          affectedVerses.add(verseNum);
          console.log('[saveHighlightToStorage] ✅ Verse found in range:', verseNum);
        }
      }
    } catch (e) {
      // Si falla la verificación de intersección, usar método alternativo
      // Verificar si el versículo contiene el inicio o fin del rango
      if (verseEl.contains(range.startContainer) || 
          verseEl.contains(range.endContainer) ||
          verseEl === range.startContainer.parentElement ||
          verseEl === range.endContainer.parentElement) {
        const verseNum = verseEl.getAttribute('data-verse');
        if (verseNum) {
          affectedVerses.add(verseNum);
          console.log('[saveHighlightToStorage] ✅ Verse found (fallback method):', verseNum);
        }
      }
    }
  });
  
  // Si aún no encontramos versículos, buscar por texto (método alternativo)
  if (affectedVerses.size === 0) {
    console.log('[saveHighlightToStorage] 🔍 No verses found by range, trying text search...');
    const cleanSelectedText = selectedText.replace(/\d+/g, '').trim(); // Remover números de versículo
    
    verseElements.forEach(verseEl => {
      const verseText = verseEl.textContent || '';
      // Buscar si el texto del versículo contiene parte del texto seleccionado
      const verseWords = verseText.toLowerCase().split(/\s+/);
      const selectedWords = cleanSelectedText.toLowerCase().split(/\s+/);
      
      // Si al menos 3 palabras coinciden, considerar el versículo
      const matchingWords = selectedWords.filter(word => 
        word.length > 2 && verseWords.includes(word)
      );
      
      if (matchingWords.length >= Math.min(3, selectedWords.length / 2)) {
        const verseNum = verseEl.getAttribute('data-verse');
        if (verseNum) {
          affectedVerses.add(verseNum);
          console.log('[saveHighlightToStorage] ✅ Verse found by text match:', verseNum);
        }
      }
    });
  }
  
  if (affectedVerses.size === 0) {
    console.error('[saveHighlightToStorage] ❌ No affected verses found - ABORTING');
    console.error('[saveHighlightToStorage] Debug info:', {
      selectedText: selectedText.substring(0, 100),
      rangeStart: range.startContainer.textContent?.substring(0, 50),
      rangeEnd: range.endContainer.textContent?.substring(0, 50),
      totalVerses: verseElements.length
    });
    return;
  }
  
  console.log('[saveHighlightToStorage] ✅ Found affected verses:', [...affectedVerses]);
  
  // Formatear el rango de versículos
  const formatVerseRange = (nums) => {
    if (!nums.length) return '';
    const sorted = [...nums].map(n => parseInt(n, 10)).filter(n => !Number.isNaN(n)).sort((a, b) => a - b);
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
  };
  
  const verseRange = formatVerseRange([...affectedVerses]);
  
  // Guardar posición por versículo+offset para restaurar sin depender del texto en el DOM
  const verseOffsets = computeVerseOffsets(range);
  
  // Obtener highlights existentes - usar exactamente la misma clave que bible-study.js
  const STORAGE_KEY_HIGHLIGHTS = 'bible_trivia_highlights';
  let highlights = [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_HIGHLIGHTS);
    console.log('[saveHighlightToStorage] Reading existing highlights from localStorage:', raw ? 'found' : 'not found');
    if (raw) {
      highlights = JSON.parse(raw);
      console.log('[saveHighlightToStorage] Existing highlights count:', highlights.length);
    } else {
      console.log('[saveHighlightToStorage] No existing highlights found');
    }
  } catch (e) {
    console.error('[saveHighlightToStorage] Error reading highlights:', e);
    highlights = [];
  }
  
  // Eliminar highlights existentes que se solapen
  // Asegurar comparación correcta de chapter (puede ser string o número)
  const filteredHighlights = highlights.filter(h => {
    const hChapter = String(h.chapter || '');
    const currentChapter = String(chapter || '');
    if (h.bookId !== bookId || hChapter !== currentChapter) return true;
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
  
  // Agregar el nuevo highlight (verseOffsets permite restaurar por posición, sin buscar texto)
  const newHighlight = { 
    bookId, 
    chapter: String(chapter),
    verseRange, 
    color, 
    selectedText,
    verseOffsets: verseOffsets.length ? verseOffsets : undefined,
    savedAt: Date.now() 
  };
  
  filteredHighlights.unshift(newHighlight);
  
  // Guardar en localStorage - usar EXACTAMENTE la misma clave que bible-study.js
  const STORAGE_KEY = 'bible_trivia_highlights';
  
  // Verificar que localStorage esté disponible
  if (typeof localStorage === 'undefined') {
    console.error('[saveHighlightToStorage] ❌ localStorage is not available!');
    return;
  }
  
  try {
    const jsonData = JSON.stringify(filteredHighlights);
    console.log('[saveHighlightToStorage] 📝 About to save:', {
      key: STORAGE_KEY,
      count: filteredHighlights.length,
      jsonLength: jsonData.length,
      firstItem: filteredHighlights[0]
    });
    
    // Intentar guardar con manejo de errores explícito
    try {
      localStorage.setItem(STORAGE_KEY, jsonData);
      console.log('[saveHighlightToStorage] ✅ localStorage.setItem() called successfully');
    } catch (setItemError) {
      console.error('[saveHighlightToStorage] ❌ localStorage.setItem() FAILED:', setItemError);
      console.error('[saveHighlightToStorage] Error name:', setItemError.name);
      console.error('[saveHighlightToStorage] Error message:', setItemError.message);
      // Puede ser que localStorage esté lleno
      if (setItemError.name === 'QuotaExceededError') {
        console.error('[saveHighlightToStorage] localStorage is full!');
      }
      return; // Salir si no se pudo guardar
    }
    
    // Verificar INMEDIATAMENTE después de guardar
    let verifyRaw;
    try {
      verifyRaw = localStorage.getItem(STORAGE_KEY);
      console.log('[saveHighlightToStorage] ✅ Immediate read - exists:', verifyRaw !== null);
      console.log('[saveHighlightToStorage] ✅ Immediate read - length:', verifyRaw ? verifyRaw.length : 0);
      
      if (verifyRaw) {
        const verifyParsed = JSON.parse(verifyRaw);
        console.log('[saveHighlightToStorage] ✅ Immediate read - parsed count:', verifyParsed.length);
        if (verifyParsed.length > 0) {
          console.log('[saveHighlightToStorage] ✅ Immediate read - first item:', verifyParsed[0]);
        }
      } else {
        console.error('[saveHighlightToStorage] ❌ CRITICAL: Data is NULL immediately after saving!');
        console.error('[saveHighlightToStorage] This means localStorage.setItem() did not work!');
      }
    } catch (getItemError) {
      console.error('[saveHighlightToStorage] ❌ Error reading back:', getItemError);
    }
    
    // Actualizar el panel lateral si está abierto
    setTimeout(() => {
      const sidepanel = document.getElementById('bibleReaderSidepanel');
      if (sidepanel && sidepanel.getAttribute('aria-hidden') === 'false') {
        if (window.renderVersesList) {
          console.log('[saveHighlightToStorage] 🔄 Refreshing highlights list');
          window.renderVersesList();
        }
      }
    }, 100);
  } catch (e) {
    console.error('[saveHighlightToStorage] ❌ EXCEPTION:', e);
    console.error('[saveHighlightToStorage] Stack:', e.stack);
  }
}

// Wikipedia lookup
export function initWikipediaLookup() {
  const wikiBtn = document.getElementById('bibleContextWiki');
  if (!wikiBtn) return;
  
  wikiBtn.addEventListener('click', async () => {
    const contextMenu = document.getElementById('bibleEnhancedContextMenu');
    const selectedText = contextMenu?.getAttribute('data-selected-text');
    if (!selectedText) return;
    
    hideEnhancedContextMenu();
    
    try {
      const lang = getLanguage() === 'es' ? 'es' : 'en';
      const apiUrl = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(selectedText)}`;
      
      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error('Not found');
      
      const data = await response.json();
      showWikipediaPopup(data, selectedText);
    } catch (e) {
      showWikipediaPopup(null, selectedText);
    }
  });
}

function showWikipediaPopup(data, term) {
  const popup = document.getElementById('bibleWikipediaPopup');
  if (!popup) return;
  
  if (data && data.extract) {
    const titleEl = popup.querySelector('.bible-wiki-title');
    const contentEl = popup.querySelector('.bible-wiki-content');
    const linkEl = popup.querySelector('.bible-wiki-link');
    
    if (titleEl) titleEl.textContent = data.title || term;
    if (contentEl) contentEl.textContent = data.extract;
    if (linkEl && data.content_urls) {
      linkEl.href = data.content_urls.desktop.page;
      linkEl.textContent = 'Read more on Wikipedia';
    }
  } else {
    const titleEl = popup.querySelector('.bible-wiki-title');
    const contentEl = popup.querySelector('.bible-wiki-content');
    if (titleEl) titleEl.textContent = term;
    if (contentEl) contentEl.textContent = 'No Wikipedia article found for this term.';
  }
  
  popup.style.display = 'block';
  
  const closeBtn = popup.querySelector('.bible-wiki-close');
  if (closeBtn) {
    closeBtn.onclick = () => {
      popup.style.display = 'none';
    };
  }
}

// Panel de configuración en el modal
export function initReaderSettings() {
  loadReaderSettings();
  applyReaderSettings();
  
  // Abrir modal de settings
  const settingsBtn = document.getElementById('bibleReaderSettingsBtn');
  const settingsModal = document.getElementById('bibleReaderSettingsModal');
  const settingsModalClose = document.getElementById('bibleReaderSettingsModalClose');
  
  if (settingsBtn && settingsModal) {
    settingsBtn.addEventListener('click', () => {
      settingsModal.setAttribute('aria-hidden', 'false');
      settingsModal.classList.add('bible-reader-settings-modal-visible');
      // Inicializar sliders cuando se abre el modal
      if (window.setupSliders) {
        setTimeout(() => window.setupSliders(), 50);
      }
    });
  }
  
  if (settingsModalClose && settingsModal) {
    settingsModalClose.addEventListener('click', () => {
      closeSettingsModal();
    });
  }
  
  // Cerrar modal al hacer click fuera o en el overlay
  if (settingsModal) {
    const overlay = settingsModal.querySelector('.bible-reader-settings-modal-overlay');
    if (overlay) {
      overlay.addEventListener('click', () => {
        closeSettingsModal();
      });
    }
    
    // Cerrar con Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && settingsModal.classList.contains('bible-reader-settings-modal-visible')) {
        closeSettingsModal();
      }
    });
  }
}

function closeSettingsModal() {
  const settingsModal = document.getElementById('bibleReaderSettingsModal');
  if (settingsModal) {
    settingsModal.setAttribute('aria-hidden', 'true');
    settingsModal.classList.remove('bible-reader-settings-modal-visible');
  }
}

export function setupSliders() {
  if (!readerSettings) loadReaderSettings();
  
  const fontSizeInput = document.getElementById('bibleReaderFontSize');
  const fontFamilySelect = document.getElementById('bibleReaderFontFamily');
  const lineHeightInput = document.getElementById('bibleReaderLineHeight');
  const themeSelect = document.getElementById('bibleReaderTheme');
  
  if (!fontSizeInput || !lineHeightInput) {
    console.warn('Sliders not found in DOM', { fontSizeInput, lineHeightInput });
    return;
  }
  
  // Establecer valores iniciales
  const fontSizeNum = parseFloat(readerSettings.fontSize) || 1.1;
  fontSizeInput.value = fontSizeNum;
  const fontSizeValue = document.getElementById('bibleReaderFontSizeValue');
  if (fontSizeValue) fontSizeValue.textContent = `${fontSizeNum}rem`;
  
  const lineHeightNum = parseFloat(readerSettings.lineHeight) || 1.8;
  lineHeightInput.value = lineHeightNum;
  const lineHeightValue = document.getElementById('bibleReaderLineHeightValue');
  if (lineHeightValue) lineHeightValue.textContent = lineHeightNum.toFixed(1);
  
  if (fontFamilySelect) {
    fontFamilySelect.value = readerSettings.fontFamily || 'serif';
  }
  
  if (themeSelect) {
    themeSelect.value = readerSettings.theme || 'light';
  }
  
  // Remover listeners anteriores usando una función auxiliar
  function removeAllListeners(element) {
    const newElement = element.cloneNode(true);
    newElement.id = element.id;
    newElement.value = element.value;
    element.parentNode.replaceChild(newElement, element);
    return document.getElementById(element.id);
  }
  
  // Remover y re-añadir listeners para evitar duplicados
  const fontSizeInputClean = removeAllListeners(fontSizeInput);
  const lineHeightInputClean = removeAllListeners(lineHeightInput);
  
  // Añadir listeners directamente con funciones inline
  fontSizeInputClean.addEventListener('input', (e) => {
    const value = parseFloat(e.target.value);
    // Guardar solo el fontSize, no modificar lineHeight
    readerSettings.fontSize = `${value}rem`;
    const fontSizeValueEl = document.getElementById('bibleReaderFontSizeValue');
    if (fontSizeValueEl) fontSizeValueEl.textContent = `${value}rem`;
    // Aplicar SOLO fontSize, sin tocar lineHeight
    applyFontSizeOnly();
    saveReaderSettings();
  });
  
  lineHeightInputClean.addEventListener('input', (e) => {
    const value = parseFloat(e.target.value);
    // Guardar solo el lineHeight, no modificar fontSize
    readerSettings.lineHeight = value;
    const lineHeightValueEl = document.getElementById('bibleReaderLineHeightValue');
    if (lineHeightValueEl) lineHeightValueEl.textContent = value.toFixed(1);
    // Aplicar SOLO lineHeight, sin tocar fontSize
    applyLineHeightOnly();
    saveReaderSettings();
  });
  
  if (fontFamilySelect) {
    const fontFamilySelectClean = removeAllListeners(fontFamilySelect);
    fontFamilySelectClean.value = readerSettings.fontFamily || 'serif';
    fontFamilySelectClean.addEventListener('change', (e) => {
      console.log('Font family changed:', e.target.value);
      readerSettings.fontFamily = e.target.value;
      applyReaderSettings();
      saveReaderSettings();
    });
  }
  
  if (themeSelect) {
    const themeSelectClean = removeAllListeners(themeSelect);
    themeSelectClean.value = readerSettings.theme || 'light';
    themeSelectClean.addEventListener('change', (e) => {
      readerSettings.theme = e.target.value;
      applyReaderSettings();
      saveReaderSettings();
    });
  }
  
  console.log('Sliders initialized successfully');
}

// Estas funciones ya no se usan directamente, se definen inline en setupSliders
// pero las mantenemos por si acaso
function handleFontSizeChange(e) {
  const value = e.target.value;
  readerSettings.fontSize = `${value}rem`;
  const fontSizeValue = document.getElementById('bibleReaderFontSizeValue');
  if (fontSizeValue) fontSizeValue.textContent = `${value}rem`;
  applyReaderSettings();
  saveReaderSettings();
}

function handleLineHeightChange(e) {
  const value = parseFloat(e.target.value);
  readerSettings.lineHeight = value;
  const lineHeightValue = document.getElementById('bibleReaderLineHeightValue');
  if (lineHeightValue) lineHeightValue.textContent = value.toFixed(1);
  applyReaderSettings();
  saveReaderSettings();
}

function handleFontFamilyChange(e) {
  readerSettings.fontFamily = e.target.value;
  applyReaderSettings();
  saveReaderSettings();
}

function handleThemeChange(e) {
  readerSettings.theme = e.target.value;
  applyReaderSettings();
  saveReaderSettings();
}

function closeMenuSidebar() {
  const sidebar = document.getElementById('bibleReaderMenuSidebar');
  if (sidebar) {
    sidebar.setAttribute('aria-hidden', 'true');
    sidebar.classList.remove('bible-reader-menu-sidebar-visible');
  }
}

// Inicializar todas las funcionalidades mejoradas
export function initBibleReaderEnhanced() {
  // Solo inicializar si el lector está abierto
  const overlay = document.getElementById('bibleReaderOverlay');
  if (!overlay || overlay.style.display === 'none') return;
  
  initBibleReaderSearch();
  initEnhancedContextMenu();
  initReaderSettings();
  
  loadReaderSettings();
  applyReaderSettings();
  
  // Restaurar highlights visuales desde localStorage
  restoreHighlightsFromStorage();
}

/** Restaura los highlights visuales desde localStorage */
export function restoreHighlightsFromStorage() {
  // Exponer globalmente
  window.restoreHighlightsFromStorage = restoreHighlightsFromStorage;
  const STORAGE_HIGHLIGHTS = 'bible_trivia_highlights';
  const bookId = window.readerBookId;
  const chapter = window.readerCurrentChapter;
  
  if (!bookId || !chapter) return;
  
  let highlights = [];
  try {
    const raw = localStorage.getItem(STORAGE_HIGHLIGHTS);
    highlights = raw ? JSON.parse(raw) : [];
  } catch {
    return;
  }
  
  // Filtrar highlights del libro y capítulo actual
  // Asegurar comparación correcta de chapter (puede ser string o número)
  const currentHighlights = highlights.filter(h => {
    const hBookId = String(h.bookId || '');
    const hChapter = String(h.chapter || '');
    const currentBookId = String(bookId || '');
    const currentChapter = String(chapter || '');
    return hBookId === currentBookId && hChapter === currentChapter;
  });
  
  console.log('[restoreHighlightsFromStorage] Current highlights to restore:', {
    bookId,
    chapter,
    count: currentHighlights.length,
    highlights: currentHighlights
  });
  
  if (currentHighlights.length === 0) {
    console.log('[restoreHighlightsFromStorage] No highlights to restore for this chapter');
    return;
  }
  
  const contentEl = document.getElementById('bibleReaderContent');
  if (!contentEl) return;
  
  // Para cada highlight, restaurar por posición (verseOffsets) si existe; si no, buscar por texto
  currentHighlights.forEach((highlight, idx) => {
    if (!highlight.color) {
      console.log(`[restoreHighlightsFromStorage] Skipping highlight ${idx}: missing color`);
      return;
    }
    
    // Restaurar por posición (verseOffsets) — un solo rango para toda la selección (línea continua, sin separación)
    if (highlight.verseOffsets && Array.isArray(highlight.verseOffsets) && highlight.verseOffsets.length > 0) {
      const segs = highlight.verseOffsets;
      const first = segs[0];
      const last = segs[segs.length - 1];
      const verseElFirst = contentEl.querySelector(`.bible-reader-verse[data-verse="${first.verse}"]`);
      const verseElLast = contentEl.querySelector(`.bible-reader-verse[data-verse="${last.verse}"]`);
      if (verseElFirst && verseElLast) {
        const rangeFirst = createRangeFromVerseOffsets(verseElFirst, first.start, first.end);
        const rangeLast = createRangeFromVerseOffsets(verseElLast, last.start, last.end);
        if (rangeFirst && rangeLast) {
          const fullRange = document.createRange();
          fullRange.setStart(rangeFirst.startContainer, rangeFirst.startOffset);
          fullRange.setEnd(rangeLast.endContainer, rangeLast.endOffset);
          try {
            applyTextUnderline(fullRange, highlight.color);
            console.log(`[restoreHighlightsFromStorage] ✅ Restored highlight ${idx} by verseOffsets (single range)`);
            return;
          } catch (e) {
            console.warn(`[restoreHighlightsFromStorage] Single range failed, trying per-segment:`, e);
          }
        }
      }
      // Fallback: aplicar por segmento si el rango único falla (p. ej. range inválido)
      for (const seg of segs) {
        const verseEl = contentEl.querySelector(`.bible-reader-verse[data-verse="${seg.verse}"]`);
        if (!verseEl) continue;
        const range = createRangeFromVerseOffsets(verseEl, seg.start, seg.end);
        if (range) {
          try {
            applyTextUnderline(range, highlight.color);
          } catch (e2) {
            console.warn(`[restoreHighlightsFromStorage] Could not apply highlight ${idx} segment verse ${seg.verse}:`, e2);
          }
        }
      }
      return;
    }
    
    // Fallback: buscar por texto (highlights antiguos sin verseOffsets)
    if (!highlight.selectedText) {
      console.log(`[restoreHighlightsFromStorage] Skipping highlight ${idx}: no selectedText and no verseOffsets`);
      return;
    }
    
    // Limpiar el texto para buscar (remover números de versículo, normalizar espacios y hacer case-insensitive)
    const normalizeText = (text) => {
      return text.toLowerCase()
        .replace(/\d+/g, '') // Remover números
        .replace(/[^\w\s]/g, ' ') // Reemplazar puntuación con espacios
        .replace(/\s+/g, ' ') // Normalizar espacios
        .trim();
    };
    
    const textToFind = normalizeText(highlight.selectedText);
    
    if (textToFind.length === 0) {
      console.log(`[restoreHighlightsFromStorage] Skipping highlight ${idx}: text too short after cleaning`);
      return;
    }
    
    // Extraer palabras clave (palabras de más de 2 caracteres)
    const keywords = textToFind.split(' ').filter(w => w.length > 2);
    if (keywords.length === 0) {
      console.log(`[restoreHighlightsFromStorage] Skipping highlight ${idx}: no valid keywords`);
      return;
    }
    
    console.log(`[restoreHighlightsFromStorage] Attempting to restore highlight ${idx}:`, {
      color: highlight.color,
      textPreview: highlight.selectedText.substring(0, 50),
      keywords: keywords.slice(0, 5),
      verseRange: highlight.verseRange
    });
    
    // Si tenemos verseRange, limitar la búsqueda a esos versículos
    let searchElements = [];
    if (highlight.verseRange) {
      const verseNumbers = highlight.verseRange.split(',').flatMap(r => {
        if (r.includes('-')) {
          const [a, b] = r.split('-').map(Number);
          return Array.from({length: b - a + 1}, (_, i) => a + i);
        }
        return [Number(r)];
      });
      
      verseNumbers.forEach(verseNum => {
        const verseEl = contentEl.querySelector(`.bible-reader-verse[data-verse="${verseNum}"]`);
        if (verseEl) {
          searchElements.push(verseEl);
        }
      });
    }
    
    // Si no encontramos versículos específicos o no hay verseRange, buscar en todo el contenido
    if (searchElements.length === 0) {
      searchElements = [contentEl];
    }
    
    let found = false;
    
    // Buscar en cada elemento
    for (const searchEl of searchElements) {
      // Buscar el texto en el contenido, evitando nodos que ya están dentro de spans con subrayado
      const walker = document.createTreeWalker(
        searchEl,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: (node) => {
            // Evitar nodos que ya están dentro de un span con subrayado
            const parent = node.parentElement;
            if (parent && parent.classList.contains('bible-text-underline')) {
              return NodeFilter.FILTER_REJECT;
            }
            return NodeFilter.FILTER_ACCEPT;
          }
        },
        false
      );
      
      let node;
      while (node = walker.nextNode()) {
        const text = node.textContent || '';
        const normalizedText = normalizeText(text);
        
        // Buscar usando las palabras clave - verificar si todas las palabras clave están presentes
        const allKeywordsFound = keywords.every(keyword => normalizedText.includes(keyword));
        
        if (allKeywordsFound) {
          // Encontrar la posición donde comienzan las palabras clave
          let bestStart = -1;
          let bestEnd = -1;
          
          // Buscar la primera palabra clave
          const firstKeyword = keywords[0];
          const firstIndex = normalizedText.indexOf(firstKeyword);
          
          if (firstIndex !== -1) {
            // Encontrar la posición real en el texto original
            let realStart = 0;
            let normalizedIndex = 0;
            for (let i = 0; i < text.length && normalizedIndex < firstIndex; i++) {
              const char = text[i].toLowerCase();
              if (/[a-z]/.test(char)) {
                normalizedIndex++;
              }
              realStart++;
            }
            
            // Calcular el final basado en la longitud del texto original
            let realEnd = realStart;
            let normalizedEnd = firstIndex + firstKeyword.length;
            normalizedIndex = firstIndex;
            
            for (let i = realStart; i < text.length && normalizedIndex < normalizedEnd; i++) {
              const char = text[i].toLowerCase();
              if (/[a-z]/.test(char)) {
                normalizedIndex++;
              }
              realEnd++;
            }
            
            // Ajustar para incluir todas las palabras clave
            const lastKeyword = keywords[keywords.length - 1];
            const lastIndex = normalizedText.lastIndexOf(lastKeyword);
            if (lastIndex !== -1 && lastIndex > firstIndex) {
              normalizedIndex = firstIndex;
              realEnd = realStart;
              for (let i = realStart; i < text.length && normalizedIndex < lastIndex + lastKeyword.length; i++) {
                const char = text[i].toLowerCase();
                if (/[a-z]/.test(char)) {
                  normalizedIndex++;
                }
                realEnd++;
              }
            }
            
            // Expandir a límites de palabra para no cortar palabras (evitar "c" + "alled" -> "called")
            const isWordChar = (c) => /[a-zA-Z0-9]/.test(c);
            while (realStart > 0 && isWordChar(text[realStart - 1])) realStart--;
            let realEndClamped = Math.min(realEnd, text.length);
            while (realEndClamped < text.length && isWordChar(text[realEndClamped])) realEndClamped++;
            
            // Crear un rango para el texto encontrado
            const range = document.createRange();
            try {
              range.setStart(node, realStart);
              range.setEnd(node, realEndClamped);
              
              // Verificar que el rango no esté dentro de un span con subrayado
              const container = range.commonAncestorContainer;
              const parent = container.nodeType === Node.TEXT_NODE 
                ? container.parentElement 
                : container;
              
              if (parent && parent.classList.contains('bible-text-underline')) {
                console.log(`[restoreHighlightsFromStorage] Highlight ${idx} already underlined, skipping`);
                continue; // Ya está subrayado, saltar
              }
              
              // Aplicar el subrayado
              try {
                applyTextUnderline(range, highlight.color);
                console.log(`[restoreHighlightsFromStorage] ✅ Successfully restored highlight ${idx}`);
                found = true;
                break; // Salir del loop de elementos de búsqueda
              } catch (e) {
                console.warn(`[restoreHighlightsFromStorage] ❌ Could not restore highlight ${idx}:`, e);
              }
            } catch (rangeError) {
              console.warn(`[restoreHighlightsFromStorage] ❌ Error creating range for highlight ${idx}:`, rangeError);
              continue;
            }
          }
        }
      }
      
      if (found) break; // Si encontramos el highlight, salir del loop
    }
    
    if (!found) {
      console.warn(`[restoreHighlightsFromStorage] ⚠️ Could not find text for highlight ${idx} in DOM`, {
        keywords: keywords.slice(0, 5),
        verseRange: highlight.verseRange,
        searchElementsCount: searchElements.length
      });
    }
  });
  
  console.log('[restoreHighlightsFromStorage] ✅ Finished restoring highlights');
}
