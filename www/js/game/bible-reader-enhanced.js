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

/** Aplica subrayado de color al texto seleccionado */
function applyTextUnderline(range, color) {
  if (!range || !color) return;
  
  // Colores para los subrayados
  const colorMap = {
    yellow: '#fbbf24',
    green: '#22c55e',
    blue: '#3b82f6',
    pink: '#ec4899',
    orange: '#f97316',
    purple: '#a855f7',
    red: '#ef4444'
  };
  
  const underlineColor = colorMap[color] || colorMap.yellow;
  
  try {
    // Crear un span con el subrayado
    const underlineSpan = document.createElement('span');
    underlineSpan.className = `bible-text-underline bible-text-underline-${color}`;
    underlineSpan.style.textDecoration = 'underline';
    underlineSpan.style.textDecorationColor = underlineColor;
    underlineSpan.style.textDecorationThickness = '2px';
    underlineSpan.style.textUnderlineOffset = '2px';
    
    // Envolver el contenido seleccionado
    range.surroundContents(underlineSpan);
  } catch (e) {
    // Si surroundContents falla, usar método alternativo
    try {
      const contents = range.extractContents();
      const underlineSpan = document.createElement('span');
      underlineSpan.className = `bible-text-underline bible-text-underline-${color}`;
      underlineSpan.style.textDecoration = 'underline';
      underlineSpan.style.textDecorationColor = underlineColor;
      underlineSpan.style.textDecorationThickness = '2px';
      underlineSpan.style.textUnderlineOffset = '2px';
      underlineSpan.appendChild(contents);
      range.insertNode(underlineSpan);
    } catch (e2) {
      console.warn('Could not apply underline:', e2);
    }
  }
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
  
  // Agregar el nuevo highlight
  const newHighlight = { 
    bookId, 
    chapter: String(chapter), // Asegurar que sea string
    verseRange, 
    color, 
    selectedText,
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
  const currentHighlights = highlights.filter(h => 
    h.bookId === bookId && h.chapter === chapter
  );
  
  if (currentHighlights.length === 0) return;
  
  const contentEl = document.getElementById('bibleReaderContent');
  if (!contentEl) return;
  
  // Para cada highlight, buscar el texto y aplicar el subrayado
  currentHighlights.forEach(highlight => {
    if (!highlight.selectedText || !highlight.color) return;
    
    const textToFind = highlight.selectedText.trim();
    if (textToFind.length === 0) return;
    
    // Verificar si el texto ya está subrayado
    const allText = contentEl.textContent || '';
    if (!allText.includes(textToFind)) return;
    
    // Buscar el texto en el contenido, evitando nodos que ya están dentro de spans con subrayado
    const walker = document.createTreeWalker(
      contentEl,
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
      const text = node.textContent;
      const index = text.indexOf(textToFind);
      
      if (index !== -1) {
        // Crear un rango para el texto encontrado
        const range = document.createRange();
        range.setStart(node, index);
        range.setEnd(node, index + textToFind.length);
        
        // Verificar que el rango no esté dentro de un span con subrayado
        const container = range.commonAncestorContainer;
        const parent = container.nodeType === Node.TEXT_NODE 
          ? container.parentElement 
          : container;
        
        if (parent && parent.classList.contains('bible-text-underline')) {
          continue; // Ya está subrayado, saltar
        }
        
        // Aplicar el subrayado
        try {
          applyTextUnderline(range, highlight.color);
        } catch (e) {
          console.warn('Could not restore highlight:', e);
        }
        
        // Solo restaurar el primer match para evitar duplicados
        break;
      }
    }
  });
}
