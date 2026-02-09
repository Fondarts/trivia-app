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
    // Color de los números de versículo según tema
    const verseNumColor = readerSettings.theme === 'dark' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';
    versesElForColor.querySelectorAll('.bible-reader-verse-num').forEach(num => {
      num.style.setProperty('color', verseNumColor, 'important');
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
  
  // Track última selección para no re-mostrar el menú innecesariamente
  let lastSelectedText = '';
  let menuVisible = false;
  
  // Prevenir scroll horizontal en TODOS los niveles - esta es la clave
  const lockHorizontalScroll = () => {
    contentEl.scrollLeft = 0;
    document.documentElement.scrollLeft = 0;
    document.body.scrollLeft = 0;
  };
  
  // Listener permanente: si algo causa scroll horizontal, lo revertimos
  const onScroll = () => { lockHorizontalScroll(); };
  contentEl.addEventListener('scroll', onScroll, { passive: true });
  document.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('scroll', onScroll, { passive: true });
  
  // Detectar selección de texto usando selectionchange (funciona en Android)
  let selectionDebounce = null;
  document.addEventListener('selectionchange', () => {
    // Solo procesar si el lector está visible
    const overlay = document.getElementById('bibleReaderOverlay');
    if (!overlay || overlay.style.display === 'none') return;
    
    clearTimeout(selectionDebounce);
    selectionDebounce = setTimeout(() => {
      const selection = window.getSelection();
      const selectedText = selection.toString().trim();
      
      if (selectedText.length > 0 && selection.rangeCount > 0) {
        // Verificar que la selección está dentro del contenido del lector
        try {
          const range = selection.getRangeAt(0);
          const container = range.commonAncestorContainer;
          const el = container.nodeType === Node.TEXT_NODE ? container.parentElement : container;
          if (!el || !el.closest('#bibleReaderContent')) return;
          if (el.closest('.bible-reader-verse-note-icon')) return;
          
          // Solo mostrar si el texto cambió (evitar re-renders innecesarios)
          if (selectedText !== lastSelectedText || !menuVisible) {
            lastSelectedText = selectedText;
            currentSelection = selection;
            showEnhancedContextMenu(selection, selectedText);
            menuVisible = true;
          }
          lockHorizontalScroll();
        } catch (e) {
          // Ignorar errores de selección
        }
      } else {
        // No hay selección - ocultar menú
        if (menuVisible) {
          hideEnhancedContextMenu();
          menuVisible = false;
          lastSelectedText = '';
          currentSelection = null;
        }
      }
    }, 400); // Debounce generoso para que Android termine la selección
  });
  
  // Cerrar menú al tocar/clickear fuera
  const closeOnOutsideTouch = (e) => {
    const contextMenu = document.getElementById('bibleEnhancedContextMenu');
    if (menuVisible && contextMenu && !contextMenu.contains(e.target)) {
      // Solo cerrar si no está dentro del contenido seleccionado
      const selection = window.getSelection();
      if (!selection || selection.toString().trim().length === 0) {
        hideEnhancedContextMenu();
        menuVisible = false;
        lastSelectedText = '';
        currentSelection = null;
      }
    }
    lockHorizontalScroll();
  };
  
  document.addEventListener('mousedown', closeOnOutsideTouch);
  document.addEventListener('touchstart', closeOnOutsideTouch, { passive: true });
  
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
            // 1. Computar offsets ANTES de modificar el DOM
            const verseOffsets = computeVerseOffsets(range);
            
            // 2. Aplicar subrayado visual (modifica DOM)
            applyTextUnderline(range, color);
            
            // 3. Guardar con offsets pre-computados
            saveHighlightToStorage(selectedText, color, verseOffsets);
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
  
  if (!selection || selection.rangeCount === 0) return;
  
  try {
    const range = selection.getRangeAt(0);
    if (!range) return;
    
    const contentEl = document.getElementById('bibleReaderContent');
    
    // Guardar posición de scroll antes de cualquier cambio
    const savedScrollTop = contentEl ? contentEl.scrollTop : 0;
    
    // Posicionar menú centrado horizontalmente en la pantalla, debajo de la selección
    const rect = range.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    
    // Mostrar temporalmente para medir
    contextMenu.style.visibility = 'hidden';
    contextMenu.style.display = 'block';
    contextMenu.style.left = '0px';
    contextMenu.style.top = '0px';
    const menuW = contextMenu.offsetWidth;
    const menuH = contextMenu.offsetHeight;
    
    // Posición: centrado horizontalmente en pantalla, debajo de selección
    let left = Math.round((vw - menuW) / 2);
    let top = Math.round(rect.bottom + 8);
    
    // Si no cabe debajo, poner encima
    if (top + menuH > vh - 12) {
      top = Math.round(rect.top - menuH - 8);
    }
    // Si tampoco cabe arriba, centrar verticalmente
    if (top < 12) {
      top = Math.round((vh - menuH) / 2);
    }
    
    // Clamp horizontal
    if (left < 12) left = 12;
    if (left + menuW > vw - 12) left = vw - menuW - 12;
    
    contextMenu.style.top = top + 'px';
    contextMenu.style.left = left + 'px';
    contextMenu.style.visibility = 'visible';
    contextMenu.setAttribute('data-selected-text', selectedText);
    
    // Forzar que no haya desplazamiento horizontal
    requestAnimationFrame(() => {
      document.documentElement.scrollLeft = 0;
      document.body.scrollLeft = 0;
      if (contentEl) {
        contentEl.scrollLeft = 0;
        contentEl.scrollTop = savedScrollTop; // Restaurar scroll vertical
      }
      const wrap = document.querySelector('.bible-reader-wrap');
      if (wrap) wrap.scrollLeft = 0;
    });
    
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

/** Expande un rango a límites de palabra dentro de cada nodo de texto. */
function expandRangeToWordBoundaries(range) {
  if (!range || range.collapsed) return;
  const isW = (c) => typeof c === 'string' && /[a-zA-Z0-9]/.test(c);
  let sc = range.startContainer, so = range.startOffset;
  let ec = range.endContainer, eo = range.endOffset;
  if (sc.nodeType === Node.TEXT_NODE) {
    const t = sc.textContent || '';
    while (so > 0 && isW(t[so - 1])) so--;
    while (so > 0 && isLeadingPunctuation(t[so - 1])) so--;
  }
  if (ec.nodeType === Node.TEXT_NODE) {
    const t = ec.textContent || '';
    while (eo < t.length && isW(t[eo])) eo++;
    while (eo < t.length && isAttachedPunctuation(t[eo])) eo++;
  }
  try { range.setStart(sc, so); range.setEnd(ec, eo); } catch (_) {}
}

/** Recolecta todos los nodos de texto dentro de un rango con sus offsets parciales. */
function getTextNodesInRange(range) {
  const result = [];
  const ancestor = range.commonAncestorContainer;
  const root = ancestor.nodeType === Node.ELEMENT_NODE ? ancestor : ancestor.parentElement;
  if (!root) return result;
  
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
  let node, inRange = false;
  while ((node = walker.nextNode())) {
    if (node === range.startContainer) {
      inRange = true;
      const start = range.startOffset;
      const end = node === range.endContainer ? range.endOffset : node.textContent.length;
      if (start < end) result.push({ node, start, end });
      if (node === range.endContainer) break;
      continue;
    }
    if (node === range.endContainer) {
      if (range.endOffset > 0) result.push({ node, start: 0, end: range.endOffset });
      break;
    }
    if (inRange) {
      result.push({ node, start: 0, end: node.textContent.length });
    }
  }
  return result;
}

/** Aplica subrayado envolviendo cada nodo de texto individual.
 *  NO usa extractContents — preserva la estructura DOM perfectamente.
 *  @param {Range} range
 *  @param {string} color
 *  @param {boolean} [exact=false] - Si true, no expande a límites de palabra. */
function applyTextUnderline(range, color, exact) {
  if (!range || !color) return;
  if (!exact) expandRangeToWordBoundaries(range);
  
  const cls = `bible-text-underline bible-text-underline-${color}`;
  const textNodes = getTextNodesInRange(range);
  
  // Procesar en reversa para no invalidar offsets
  for (let i = textNodes.length - 1; i >= 0; i--) {
    const { node, start, end } = textNodes[i];
    // Saltar si ya está subrayado
    if (node.parentElement?.classList?.contains('bible-text-underline')) continue;
    // Saltar nodos vacíos o solo whitespace
    const text = node.textContent;
    if (!text || text.substring(start, end).trim().length === 0 && text.substring(start, end) !== ' ') continue;
    
    const span = document.createElement('span');
    span.className = cls;
    
    if (start === 0 && end >= text.length) {
      // Envolver el nodo completo
      node.parentNode.insertBefore(span, node);
      span.appendChild(node);
    } else {
      // Dividir y envolver la porción seleccionada
      const before = text.substring(0, start);
      const selected = text.substring(start, end);
      const after = text.substring(end);
      
      const parent = node.parentNode;
      const ref = node.nextSibling;
      parent.removeChild(node);
      
      if (before) parent.insertBefore(document.createTextNode(before), ref);
      span.textContent = selected;
      parent.insertBefore(span, ref);
      if (after) parent.insertBefore(document.createTextNode(after), ref);
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

/** Guarda un highlight en localStorage.
 *  @param {string} selectedText - Texto seleccionado
 *  @param {string} color - Color del highlight
 *  @param {Array} verseOffsets - Offsets pre-computados [{verse, start, end}] */
function saveHighlightToStorage(selectedText, color, verseOffsets) {
  const bookId = window.readerBookId;
  const chapter = String(window.readerCurrentChapter || '');
  if (!bookId || !chapter || !verseOffsets || !verseOffsets.length) return;
  
  // Formatear rango de versículos desde offsets (ej: "3-5,7")
  const verseNums = [...new Set(verseOffsets.map(v => v.verse))].sort((a, b) => a - b);
  const parts = [];
  let s = verseNums[0], e = s;
  for (let i = 1; i < verseNums.length; i++) {
    if (verseNums[i] === e + 1) { e = verseNums[i]; }
    else { parts.push(s === e ? String(s) : `${s}-${e}`); s = e = verseNums[i]; }
  }
  parts.push(s === e ? String(s) : `${s}-${e}`);
  const verseRange = parts.join(',');
  
  const id = `hl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  
  const KEY = 'bible_trivia_highlights';
  let highlights = [];
  try { highlights = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (_) {}
  
  highlights.unshift({
    id, bookId, chapter, verseRange, color, selectedText,
    verseOffsets,
    savedAt: Date.now()
  });
  
  try {
    localStorage.setItem(KEY, JSON.stringify(highlights));
  } catch (e) {
    console.warn('Could not save highlight:', e);
  }
  
  if (window.renderVersesList) {
    setTimeout(() => window.renderVersesList(), 50);
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

/** Encuentra el nodo de texto y offset dentro de un elemento para un offset de carácter dado. */
function findNodeAtCharOffset(element, charOffset) {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
  let count = 0, node, lastNode = null;
  while ((node = walker.nextNode())) {
    lastNode = node;
    const len = node.textContent.length;
    if (count + len >= charOffset) {
      return { node, offset: Math.min(charOffset - count, len) };
    }
    count += len;
  }
  if (lastNode) return { node: lastNode, offset: lastNode.textContent.length };
  return null;
}

/** Crea un rango que cruza múltiples versículos, incluyendo los espacios entre ellos.
 *  Esto produce un underline continuo sin gaps entre versículos. */
function createCrossVerseRange(contentEl, verseOffsets) {
  if (!verseOffsets.length) return null;
  
  const first = verseOffsets[0];
  const last = verseOffsets[verseOffsets.length - 1];
  
  const firstEl = contentEl.querySelector(`.bible-reader-verse[data-verse="${first.verse}"]`);
  const lastEl = contentEl.querySelector(`.bible-reader-verse[data-verse="${last.verse}"]`);
  if (!firstEl || !lastEl) return null;
  
  const startInfo = findNodeAtCharOffset(firstEl, first.start);
  const endInfo = findNodeAtCharOffset(lastEl, last.end);
  if (!startInfo || !endInfo) return null;
  
  try {
    const range = document.createRange();
    range.setStart(startInfo.node, startInfo.offset);
    range.setEnd(endInfo.node, endInfo.offset);
    // Validar que el rango no sea absurdamente grande
    if (range.toString().length > 3000) return null;
    return range;
  } catch (_) {
    return null;
  }
}

/** Restaura todos los highlights guardados para el libro/capítulo actual.
 *  Se llama solo desde renderReaderChapter (HTML siempre fresco). */
export function restoreHighlightsFromStorage() {
  window.restoreHighlightsFromStorage = restoreHighlightsFromStorage;
  
  const bookId = window.readerBookId;
  const chapter = window.readerCurrentChapter;
  if (!bookId || !chapter) return;
  
  const contentEl = document.getElementById('bibleReaderContent');
  if (!contentEl) return;
  
  let highlights = [];
  try { highlights = JSON.parse(localStorage.getItem('bible_trivia_highlights') || '[]'); } catch (_) { return; }
  
  const current = highlights.filter(h =>
    String(h.bookId) === String(bookId) && String(h.chapter) === String(chapter)
  );
  if (!current.length) return;
  
  current.forEach(hl => {
    if (!hl.color) return;
    
    // Método 1: verseOffsets (preciso) - crear un rango cruzando versículos
    if (hl.verseOffsets && hl.verseOffsets.length) {
      const range = createCrossVerseRange(contentEl, hl.verseOffsets);
      if (range) {
        try { applyTextUnderline(range, hl.color, true); } catch (_) {}
      }
      return;
    }
    
    // Método 2: fallback por texto (highlights antiguos sin verseOffsets)
    if (!hl.selectedText) return;
    const searchText = hl.selectedText.replace(/\s+/g, ' ').trim();
    if (searchText.length < 3) return;
    
    const verseNums = hl.verseRange ? hl.verseRange.split(',').flatMap(r => {
      if (r.includes('-')) { const [a, b] = r.split('-').map(Number); return Array.from({length: b-a+1}, (_, i) => a+i); }
      return [Number(r)];
    }) : [];
    
    const searchEls = verseNums.length 
      ? verseNums.map(n => contentEl.querySelector(`.bible-reader-verse[data-verse="${n}"]`)).filter(Boolean)
      : [contentEl];
    
    for (const el of searchEls) {
      const fullText = el.textContent || '';
      const idx = fullText.indexOf(searchText);
      if (idx === -1) continue;
      
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false);
      let node, charCount = 0, startNode = null, startOff = 0, endNode = null, endOff = 0;
      while ((node = walker.nextNode())) {
        const len = node.textContent.length;
        if (!startNode && charCount + len > idx) {
          startNode = node;
          startOff = idx - charCount;
        }
        if (!endNode && charCount + len >= idx + searchText.length) {
          endNode = node;
          endOff = idx + searchText.length - charCount;
          break;
        }
        charCount += len;
      }
      
      if (startNode && endNode) {
        try {
          const range = document.createRange();
          range.setStart(startNode, startOff);
          range.setEnd(endNode, endOff);
          applyTextUnderline(range, hl.color, true);
          break;
        } catch (_) {}
      }
    }
  });
}
