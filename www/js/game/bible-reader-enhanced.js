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
  
  console.log('Applying settings:', readerSettings);
  
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
    });
    
    // Aplicar fontFamily
    versesEl.style.fontFamily = readerSettings.fontFamily === 'serif' ? 'Georgia, serif' : 
                                 readerSettings.fontFamily === 'sans-serif' ? 'system-ui, sans-serif' : 
                                 readerSettings.fontFamily;
    
    // Aplicar lineHeight solo al contenedor (los hijos lo heredarán)
    versesEl.style.setProperty('line-height', String(readerSettings.lineHeight), 'important');
    
    console.log('Settings applied to .bible-reader-verses:', {
      fontSize: readerSettings.fontSize,
      fontSizeComputed: window.getComputedStyle(versesEl).fontSize,
      paragraphsCount: paragraphs.length,
      versesCount: verseSpans.length,
      lineHeight: readerSettings.lineHeight,
      lineHeightComputed: window.getComputedStyle(versesEl).lineHeight,
      fontFamily: versesEl.style.fontFamily
    });
  } else {
    // Fallback: aplicar al contenedor si no existe .bible-reader-verses
    contentEl.style.setProperty('font-size', readerSettings.fontSize, 'important');
    contentEl.style.fontFamily = readerSettings.fontFamily === 'serif' ? 'Georgia, serif' : 
                                  readerSettings.fontFamily === 'sans-serif' ? 'system-ui, sans-serif' : 
                                  readerSettings.fontFamily;
    contentEl.style.setProperty('line-height', String(readerSettings.lineHeight), 'important');
    console.log('Settings applied to contentEl (fallback)');
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
    
    console.log('Font size only applied:', {
      fontSize: readerSettings.fontSize,
      fontSizeComputed: window.getComputedStyle(versesEl).fontSize,
      paragraphsCount: paragraphs.length,
      versesCount: verseSpans.length,
      lineHeightPreserved: currentLineHeight,
      lineHeightComputed: window.getComputedStyle(versesEl).lineHeight
    });
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
  if (!window.Mark) {
    console.warn('Mark.js not loaded');
    return;
  }
  
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
      
      // Resaltar en el contenido
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
    if (markInstance) {
      const contentEl = document.getElementById('bibleReaderContent');
      if (contentEl) {
        markInstance.unmark();
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

// Menú contextual mejorado para texto seleccionado
export function initEnhancedContextMenu() {
  const contentEl = document.getElementById('bibleReaderContent');
  if (!contentEl) return;
  
  let selectionTimeout = null;
  let currentSelection = null;
  
  contentEl.addEventListener('mouseup', (e) => {
    // No mostrar menú mejorado si se está haciendo click en un versículo completo
    if (e.target.closest('.bible-reader-verse')) {
      const verseEl = e.target.closest('.bible-reader-verse');
      const selection = window.getSelection();
      const selectedText = selection.toString().trim();
      
      // Solo mostrar menú mejorado si hay texto seleccionado Y no es todo el versículo
      if (selectedText.length > 0 && selectedText.length < 200) {
        const verseText = verseEl.textContent.trim();
        if (selectedText !== verseText) {
          clearTimeout(selectionTimeout);
          selectionTimeout = setTimeout(() => {
            currentSelection = selection;
            showEnhancedContextMenu(selection, selectedText);
          }, 200);
          return;
        }
      }
    }
    
    clearTimeout(selectionTimeout);
    hideEnhancedContextMenu();
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
  const highlightBtn = document.getElementById('bibleContextHighlight');
  
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
  
  if (highlightBtn) {
    highlightBtn.addEventListener('click', () => {
      hideEnhancedContextMenu();
      const contextMenu = document.getElementById('bibleContextMenu');
      if (contextMenu) {
        const rect = currentSelection?.getRangeAt(0)?.getBoundingClientRect();
        if (rect) {
          contextMenu.style.top = `${rect.bottom + window.scrollY + 10}px`;
          contextMenu.style.left = `${rect.left + window.scrollX}px`;
          contextMenu.classList.add('bible-context-menu-visible');
        }
      }
    });
  }
}

function showEnhancedContextMenu(selection, selectedText) {
  const contextMenu = document.getElementById('bibleEnhancedContextMenu');
  if (!contextMenu) return;
  
  const range = selection.getRangeAt(0);
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
  
  const wikiBtn = document.getElementById('bibleContextWiki');
  if (wikiBtn) {
    const shortText = selectedText.length > 20 ? selectedText.substring(0, 20) + '...' : selectedText;
    wikiBtn.innerHTML = `<span>🔍</span> ${shortText}`;
  }
}

function hideEnhancedContextMenu() {
  const contextMenu = document.getElementById('bibleEnhancedContextMenu');
  if (contextMenu) {
    contextMenu.style.display = 'none';
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

// Panel de configuración en el sidebar
export function initReaderSettings() {
  loadReaderSettings();
  applyReaderSettings();
  
  // Cerrar sidebar
  const menuClose = document.getElementById('bibleReaderMenuClose');
  if (menuClose) {
    menuClose.addEventListener('click', () => {
      closeMenuSidebar();
    });
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
    console.log('Font size changed:', value);
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
    console.log('Line height changed:', value);
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
      console.log('Theme changed:', e.target.value);
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
  initWikipediaLookup();
  initReaderSettings();
  
  loadReaderSettings();
  applyReaderSettings();
}
