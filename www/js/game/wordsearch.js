/**
 * Sopa de letras - Versículos bíblicos con palabras ocultas
 * 3 niveles de dificultad según tamaño de la grilla.
 */

// Palabras comunes a filtrar (no se ocultan en el versículo)
const COMMON_WORDS = new Set([
  'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
  'from', 'up', 'about', 'into', 'through', 'during', 'including', 'until',
  'against', 'among', 'throughout', 'despite', 'towards', 'upon', 'concerning',
  'a', 'an', 'as', 'are', 'was', 'were', 'been', 'be', 'have', 'has', 'had',
  'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might', 'must',
  'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
  'his', 'her', 'its', 'our', 'your', 'their', 'him', 'her', 'us', 'them',
  'is', 'am', 'are', 'was', 'were', 'be', 'been', 'being',
  'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'de', 'del', 'en', 'a', 'al',
  'por', 'para', 'con', 'sin', 'sobre', 'entre', 'hasta', 'desde', 'durante',
  'y', 'o', 'pero', 'que', 'cual', 'cuales', 'quien', 'quienes',
  'es', 'son', 'era', 'eran', 'fue', 'fueron', 'ser', 'estar', 'haber', 'tener',
  'este', 'esta', 'estos', 'estas', 'ese', 'esa', 'esos', 'esas', 'aquel', 'aquella',
  'yo', 'tu', 'el', 'ella', 'nosotros', 'vosotros', 'ellos', 'ellas',
  'mi', 'tu', 'su', 'nuestro', 'vuestro', 'su', 'mio', 'tuyo', 'suyo'
].map(w => w.toUpperCase()));

const DIRECTIONS = [
  { dr: 0, dc: 1 },   // derecha
  { dr: 0, dc: -1 },  // izquierda
  { dr: 1, dc: 0 },   // abajo
  { dr: -1, dc: 0 },  // arriba
  { dr: 1, dc: 1 },   // diagonal abajo-derecha
  { dr: 1, dc: -1 },  // diagonal abajo-izquierda
  { dr: -1, dc: 1 },  // diagonal arriba-derecha
  { dr: -1, dc: -1 }  // diagonal arriba-izquierda
];

const DIFFICULTY = {
  easy:   { rows: 6, cols: 6, numWords: 4,  labelKey: 'difficultyEasy' },
  medium: { rows: 8, cols: 8, numWords: 6,  labelKey: 'difficultyMedium' },
  hard:   { rows: 10, cols: 10, numWords: 10, labelKey: 'difficultyHard' }
};

const ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

// Libros disponibles para obtener versículos aleatorios
const AVAILABLE_BOOKS = ['gen', 'john', '1jn'];

function normalize(s) {
  return (s || '').normalize('NFD').replace(/\u0300/g, '').toUpperCase();
}

// Importar getLanguage dinámicamente
let getLanguageFn = null;
async function initLanguage() {
  if (!getLanguageFn) {
    try {
      const i18n = await import('../core/i18n.js');
      getLanguageFn = i18n.getLanguage || (() => 'en');
    } catch {
      getLanguageFn = () => 'en';
    }
  }
  return getLanguageFn();
}

/**
 * Obtiene un versículo aleatorio de los libros disponibles.
 */
async function getRandomVerse() {
  const lang = await initLanguage();
  const bookId = AVAILABLE_BOOKS[Math.floor(Math.random() * AVAILABLE_BOOKS.length)];
  const path = `data/bible/${lang}/${bookId}.json`;
  
  try {
    const res = await fetch(path, { cache: 'default' });
    if (!res.ok) return null;
    const data = await res.json();
    
    // Seleccionar capítulo aleatorio
    const chapters = data.chapters || [];
    if (!chapters.length) return null;
    const chapter = chapters[Math.floor(Math.random() * chapters.length)];
    
    // Seleccionar versículo aleatorio
    const verses = chapter.verses || [];
    if (!verses.length) return null;
    const verse = verses[Math.floor(Math.random() * verses.length)];
    
    return {
      bookId,
      book: data.book || bookId,
      chapter: chapter.chapter,
      verse: verse.verse,
      text: verse.text,
      ref: `${data.book || bookId} ${chapter.chapter}:${verse.verse}`
    };
  } catch {
    return null;
  }
}

/**
 * Extrae palabras clave de un texto, filtrando palabras comunes.
 * Prioriza palabras más largas/importantes (nombres, términos clave) sobre palabras cortas.
 */
function extractKeyWords(text, minLength = 3, maxWords = 10) {
  if (!text) return [];
  
  // Limpiar y normalizar texto
  const cleaned = text
    .replace(/[.,;:!?'"()\[\]{}]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  const words = cleaned.split(' ')
    .map(w => normalize(w))
    .filter(w => w.length >= minLength && !COMMON_WORDS.has(w));
  
  // Eliminar duplicados manteniendo el orden
  const unique = [];
  const seen = new Set();
  for (const word of words) {
    if (!seen.has(word)) {
      seen.add(word);
      unique.push(word);
    }
  }
  
  // Ordenar por longitud descendente: priorizar palabras "fuertes" (nombres, términos)
  // como Ephraim, Israel, Manasseh sobre palabras cortas como took, both
  unique.sort((a, b) => b.length - a.length);
  
  return unique.slice(0, maxWords);
}

/**
 * Crea un texto con palabras ocultas usando spans con ancho fijo para evitar reflujo.
 * Retorna un objeto con el HTML y un mapa de palabras para referencia.
 */
function createHiddenText(text, wordsToHide) {
  if (!text || !wordsToHide || !wordsToHide.length) {
    return { html: escapeHtmlForText(text), wordMap: new Map() };
  }
  
  function escapeHtmlForText(str) {
    if (str == null) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
  
  const wordsToHideSet = new Set(wordsToHide.map(w => normalize(w)));
  const wordMap = new Map(); // Mapa: palabra normalizada -> palabra original con puntuación
  
  // Normalizar espacios múltiples a uno solo
  const normalizedText = text.replace(/\s+/g, ' ').trim();
  
  // Dividir el texto en palabras preservando espacios y puntuación
  const parts = normalizedText.split(/(\s+)/);
  const result = [];
  let wordIndex = 0;
  
  for (const part of parts) {
    if (/^\s+$/.test(part)) {
      // Es un espacio, mantenerlo como un solo espacio
      result.push(' ');
    } else {
      // Es una palabra, puede tener puntuación al final
      const wordMatch = part.match(/^([\w'-]+)([.,;:!?'"()\[\]{}]*)$/);
      if (wordMatch) {
        const [, word, punctuation] = wordMatch;
        const normalized = normalize(word);
        if (wordsToHideSet.has(normalized)) {
          // Crear span con ancho fijo usando la palabra real pero invisible para reservar el espacio exacto
          const fullWord = word + punctuation;
          const key = `ws-word-${wordIndex++}`;
          wordMap.set(normalized, { key, original: fullWord, word, punctuation });
          // Usar la palabra real invisible para reservar el espacio exacto, y mostrar guiones encima
          result.push(`<span class="ws-word-blank" data-word-key="${key}" data-word-norm="${escapeHtmlForText(normalized)}"><span class="ws-word-placeholder">${escapeHtmlForText('_'.repeat(word.length))}${escapeHtmlForText(punctuation)}</span><span class="ws-word-invisible">${escapeHtmlForText(fullWord)}</span></span>`);
        } else {
          result.push(escapeHtmlForText(part));
        }
      } else {
        // No es una palabra reconocible, mantener como está
        result.push(escapeHtmlForText(part));
      }
    }
  }
  
  return { html: result.join(''), wordMap };
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function canPlace(grid, word, r, c, dr, dc) {
  const rows = grid.length;
  const cols = grid[0].length;
  for (let i = 0; i < word.length; i++) {
    const nr = r + i * dr;
    const nc = c + i * dc;
    if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) return false;
    const cell = grid[nr][nc];
    if (cell !== '' && cell !== word[i]) return false;
  }
  return true;
}

/** Distancia mínima entre las celdas de una palabra (r,c,dr,dc) y las posiciones ya colocadas. */
function minDistanceToPlaced(placedPositions, r, c, dr, dc, wordLen) {
  let minDist = Infinity;
  for (let i = 0; i < wordLen; i++) {
    const nr = r + i * dr;
    const nc = c + i * dc;
    for (const pos of placedPositions) {
      const d = Math.max(Math.abs(nr - pos.r), Math.abs(nc - pos.c));
      if (d < minDist) minDist = d;
    }
  }
  return minDist === Infinity ? 999 : minDist;
}

function placeWord(grid, word, r, c, dr, dc) {
  const positions = [];
  for (let i = 0; i < word.length; i++) {
    const nr = r + i * dr;
    const nc = c + i * dc;
    grid[nr][nc] = word[i];
    positions.push({ r: nr, c: nc });
  }
  return positions;
}

export async function generateWordSearch(difficultyKey = 'easy') {
  const config = DIFFICULTY[difficultyKey] || DIFFICULTY.easy;
  const { rows, cols, numWords } = config;
  const minWords = difficultyKey === 'easy' ? 4 : numWords; // Mínimo 4 para beginners

  // Obtener versículo aleatorio
  const verse = await getRandomVerse();
  if (!verse) {
    // Fallback a palabras predefinidas si no hay versículo
    return generateWordSearchFallback(difficultyKey);
  }

  // Extraer más palabras para asegurar que tengamos suficientes (extraer hasta numWords * 2 para tener opciones)
  const keyWords = extractKeyWords(verse.text, 3, numWords * 2);
  if (keyWords.length === 0) {
    return generateWordSearchFallback(difficultyKey);
  }

  // Filtrar palabras que caben en la grilla
  const maxLen = Math.max(rows, cols);
  const wordsToPlace = keyWords.filter(w => w.length <= maxLen);
  
  if (wordsToPlace.length === 0) {
    return generateWordSearchFallback(difficultyKey);
  }

  const grid = Array(rows).fill(null).map(() => Array(cols).fill(''));
  const placed = [];
  const allPlacedPositions = []; // Todas las celdas ya usadas para separar palabras
  const usedDirections = new Set(); // Track de direcciones usadas para asegurar variedad
  const directionKeys = new Map(); // Mapa para identificar direcciones únicas

  // Crear claves únicas para cada dirección
  DIRECTIONS.forEach((dir, idx) => {
    directionKeys.set(`${dir.dr},${dir.dc}`, idx);
  });

  // Intentar colocar palabras hasta alcanzar el mínimo requerido
  let attempts = 0;
  const maxAttempts = 500;
  const shuffledWords = shuffle([...wordsToPlace]);

  for (const word of shuffledWords) {
    if (placed.length >= numWords) break;
    if (attempts >= maxAttempts) break;
    
    // Mezclar direcciones para aleatoriedad
    const dirs = shuffle([...DIRECTIONS]);
    
    // Si ya tenemos palabras colocadas, priorizar direcciones no usadas
    const prioritizedDirs = [];
    const otherDirs = [];
    for (const dir of dirs) {
      const key = `${dir.dr},${dir.dc}`;
      if (usedDirections.has(key)) {
        otherDirs.push(dir);
      } else {
        prioritizedDirs.push(dir);
      }
    }
    const finalDirs = [...prioritizedDirs, ...otherDirs];
    
    // Generar posiciones de inicio aleatorias
    const starts = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        starts.push({ r, c });
      }
    }
    shuffle(starts);
    
    const candidates = [];
    for (const { r, c } of starts) {
      for (const { dr, dc } of finalDirs) {
        if (canPlace(grid, word, r, c, dr, dc)) {
          const dist = minDistanceToPlaced(allPlacedPositions, r, c, dr, dc, word.length);
          const dirKey = `${dr},${dc}`;
          const isNewDirection = !usedDirections.has(dirKey);
          // Priorizar nuevas direcciones y posiciones aleatorias
          const score = dist * 10 + (isNewDirection ? 100 : 0) + Math.random() * 50;
          candidates.push({ r, c, dr, dc, dist, score });
        }
      }
    }
    
    // Ordenar por score (nuevas direcciones primero, luego distancia y aleatoriedad)
    candidates.sort((a, b) => b.score - a.score);
    
    let placedThis = false;
    for (const { r, c, dr, dc } of candidates) {
      if (placedThis) break;
      // Revisar que siga siendo válido (por si hay solapamiento con intentos previos)
      if (canPlace(grid, word, r, c, dr, dc)) {
        const positions = placeWord(grid, word, r, c, dr, dc);
        const dirKey = `${dr},${dc}`;
        usedDirections.add(dirKey);
        placed.push({ word, positions, direction: { dr, dc } });
        allPlacedPositions.push(...positions);
        placedThis = true;
      }
    }
    attempts++;
  }

  // Validar que tenemos al menos el mínimo de palabras requerido
  if (placed.length < minWords) {
    // Si no alcanzamos el mínimo, intentar con fallback
    return generateWordSearchFallback(difficultyKey);
  }

  // Rellenar espacios vacíos con letras aleatorias
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === '') {
        grid[r][c] = ABC[Math.floor(Math.random() * ABC.length)];
      }
    }
  }

  // Crear texto con palabras ocultas
  // Solo ocultar las palabras que realmente se colocaron en la grilla
  const hiddenWords = placed.map(p => normalize(p.word));
  const { html: hiddenTextHtml, wordMap } = createHiddenText(verse.text, hiddenWords);

  return { 
    grid, 
    words: placed, 
    config,
    verse: {
      bookId: verse.bookId,
      chapter: verse.chapter,
      verse: verse.verse,
      ref: verse.ref,
      originalText: verse.text,
      hiddenText: hiddenTextHtml,
      hiddenWords: hiddenWords, // Guardar palabras normalizadas para comparación
      wordMap: wordMap // Mapa de palabras para referencia rápida
    }
  };
}

function generateWordSearchFallback(difficultyKey) {
  const config = DIFFICULTY[difficultyKey] || DIFFICULTY.easy;
  const { rows, cols, numWords } = config;
  const minWords = difficultyKey === 'easy' ? 4 : numWords; // Mínimo 4 para beginners
  const grid = Array(rows).fill(null).map(() => Array(cols).fill(''));

  // Usar palabras predefinidas como fallback
  const WS_WORDS_FALLBACK = [
    'DIOS', 'JESUS', 'BIBLIA', 'FE', 'AMOR', 'GRACIA', 'PACTO', 'LEY', 'REINO',
    'PALABRA', 'ORACION', 'PERDON', 'JUSTICIA', 'VERDAD', 'VIDA', 'LUZ', 'CAMINO',
    'CRISTO', 'SALVACION', 'IGLESIA', 'ESPIRITU', 'SANTIDAD', 'BENDICION', 'ALABANZA'
  ].map(w => normalize(w));

  const wordsByLen = {};
  WS_WORDS_FALLBACK.forEach(w => {
    if (w.length <= Math.max(rows, cols)) {
      if (!wordsByLen[w.length]) wordsByLen[w.length] = [];
      wordsByLen[w.length].push(w);
    }
  });
  const flat = [];
  Object.values(wordsByLen).forEach(arr => flat.push(...arr));
  const shuffled = shuffle(flat);
  const toPlace = shuffled.slice(0, Math.min(numWords * 3, shuffled.length)); // Más palabras para tener opciones
  const placed = [];
  const allPlacedPositions = [];
  const usedDirections = new Set(); // Track de direcciones usadas
  const maxAttempts = 500;
  let attempts = 0;

  for (const word of toPlace) {
    if (placed.length >= numWords) break;
    if (attempts >= maxAttempts) break;
    
    // Mezclar direcciones y priorizar nuevas direcciones
    const dirs = shuffle([...DIRECTIONS]);
    const prioritizedDirs = [];
    const otherDirs = [];
    for (const dir of dirs) {
      const key = `${dir.dr},${dir.dc}`;
      if (usedDirections.has(key)) {
        otherDirs.push(dir);
      } else {
        prioritizedDirs.push(dir);
      }
    }
    const finalDirs = [...prioritizedDirs, ...otherDirs];
    
    let placedThis = false;
    const starts = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) starts.push({ r, c });
    shuffle(starts);
    
    for (const { r, c } of starts) {
      if (placedThis) break;
      for (const { dr, dc } of finalDirs) {
        if (canPlace(grid, word, r, c, dr, dc)) {
          const positions = placeWord(grid, word, r, c, dr, dc);
          const dirKey = `${dr},${dc}`;
          usedDirections.add(dirKey);
          placed.push({ word, positions, direction: { dr, dc } });
          allPlacedPositions.push(...positions);
          placedThis = true;
          break;
        }
      }
      attempts++;
    }
  }

  // Validar mínimo de palabras
  if (placed.length < minWords) {
    // Si aún no tenemos suficientes, intentar colocar más palabras con más intentos
    const remainingWords = shuffled.filter(w => !placed.some(p => p.word === w));
    for (const word of remainingWords.slice(0, 10)) {
      if (placed.length >= minWords) break;
      const dirs = shuffle([...DIRECTIONS]);
      const starts = [];
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) starts.push({ r, c });
      shuffle(starts);
      for (const { r, c } of starts) {
        for (const { dr, dc } of dirs) {
          if (canPlace(grid, word, r, c, dr, dc)) {
            const positions = placeWord(grid, word, r, c, dr, dc);
            placed.push({ word, positions, direction: { dr, dc } });
            break;
          }
        }
        if (placed.length >= minWords) break;
      }
    }
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === '') {
        grid[r][c] = ABC[Math.floor(Math.random() * ABC.length)];
      }
    }
  }

  // Asegurar que nunca haya solo 1 palabra
  if (placed.length < 2) {
    // Si solo hay 1 palabra, intentar agregar más
    const extraWords = shuffled.filter(w => !placed.some(p => p.word === w));
    for (const word of extraWords.slice(0, 5)) {
      const dirs = shuffle([...DIRECTIONS]);
      const starts = [];
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) starts.push({ r, c });
      shuffle(starts);
      for (const { r, c } of starts) {
        for (const { dr, dc } of dirs) {
          if (canPlace(grid, word, r, c, dr, dc)) {
            const positions = placeWord(grid, word, r, c, dr, dc);
            placed.push({ word, positions, direction: { dr, dc } });
            break;
          }
        }
        if (placed.length >= 2) break;
      }
      if (placed.length >= 2) break;
    }
  }

  return { grid, words: placed, config, verse: null };
}

export function getDifficultyConfig(difficultyKey) {
  return DIFFICULTY[difficultyKey] || DIFFICULTY.easy;
}

export { DIFFICULTY };
