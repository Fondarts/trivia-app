// /web/js/bank.js
import { Storage } from '../core/storage.js';

export const BASE_LABELS = {
  bible: 'Bible'
};
export const BASE_KEYS = Object.keys(BASE_LABELS);

export const K = {
  bank:     'trivia_bank',
  custom:   'trivia_custom',
  settings: 'trivia_settings',
  lang:     'trivia_lang',
};

export const PACKS_BASE = 'packs';
export const SUPPORTED_LANGS = ['es', 'en'];

/** Normaliza una pregunta desde formato q/answer (índice) o question/answer (texto). */
function normalizeQuestion(q, category, book = null) {
  if (!q || !Array.isArray(q.options) || q.options.length !== 4) return null;
  const text = String(q.question || q.q || '').trim();
  if (!text) return null;
  const opts = q.options.slice(0, 4);
  let ans = 0;
  if (Number.isInteger(q.answer) && q.answer >= 0 && q.answer <= 3) {
    ans = q.answer;
  } else if (typeof q.answer === 'string') {
    const want = q.answer.trim();
    const idx = opts.findIndex(o => String(o).trim() === want);
    if (idx >= 0) ans = idx; else return null;
  } else return null;
  let diff = String(q.difficulty || 'medium').toLowerCase();
  if (!['easy', 'medium', 'hard'].includes(diff)) diff = 'medium';
  const bookVal = book != null ? String(book).trim() : (q.book != null ? String(q.book).trim() : null);
  const reference = q.reference ? String(q.reference).trim() : null;
  return { q: text, options: opts, answer: ans, difficulty: diff, category: category || q.category || 'misc', book: bookVal || null, reference: reference };
}

export function getCurrentLanguage() {
  return Storage.get(K.lang, 'en');
}

export function getBank() {
  const bank = Storage.get(K.bank);
  if (bank) return bank;
  
  const empty = {};
  BASE_KEYS.forEach(k => (empty[k] = []));
  Storage.set(K.bank, empty);
  return empty;
}

export function setBank(b) {
  Storage.set(K.bank, b);
}

export function clearBank() {
  const empty = {};
  BASE_KEYS.forEach(k => (empty[k] = []));
  Storage.set(K.bank, empty);
}

export function getCustom() {
  const custom = Storage.get(K.custom);
  if (custom) return custom;
  
  const empty = {};
  BASE_KEYS.forEach(k => (empty[k] = []));
  Storage.set(K.custom, empty);
  return empty;
}

export function setCustom(c) {
  Storage.set(K.custom, c);
}

export function getBankCount() {
  const b = getBank();
  const c = getCustom();
  let n = 0;
  Object.values(b).forEach(arr => (n += arr?.length || 0));
  Object.values(c).forEach(arr => (n += arr?.length || 0));
  return n;
}

export async function warmLocalBank(lang = 'en') {
  if (!SUPPORTED_LANGS.includes(lang)) lang = 'en';

  const base = `${PACKS_BASE}/${lang}`;
  const manifestUrl = `${base}/manifest.json`;

  let manifest;
  try {
    const res = await fetch(manifestUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    manifest = await res.json();
  } catch (e) {

    // en vez de throw, devolvemos banco vacío para no bloquear la app
    const bank = {}; BASE_KEYS.forEach(k => (bank[k] = []));
    setBank(bank);
    return bank;
  }

  const bank = {};
  BASE_KEYS.forEach(k => (bank[k] = []));

  for (const entry of manifest.packs || []) {
    const category = entry.category;
    if (!category) continue;
    bank[category] = bank[category] || [];
    for (const fname of entry.files || []) {
      const url = `${base}/${fname}`;
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const arr = await res.json();
        for (const q of arr) {
          const normalized = normalizeQuestion(q, category);
          if (normalized) bank[category].push(normalized);
        }
      } catch (e) {

      }
    }
  }

  setBank(bank);
  return bank;
}

export function difficultyFilter(arr, diff) {
  const d = String(diff || 'any').toLowerCase();
  if (d === 'any') return arr;
  return arr.filter(q => String(q.difficulty).toLowerCase() === d);
}

// Cache para packs de archivos cargados
const filePackCache = new Map();

/** Obtiene todos los archivos de un pack desde el manifest. */
async function getPackFiles(lang, fileName) {
  try {
    const manifestUrl = `${PACKS_BASE}/${lang}/manifest.json`;
    const res = await fetch(manifestUrl);
    if (!res.ok) return null;
    const manifest = await res.json();
    if (!manifest.packs || !Array.isArray(manifest.packs)) return null;
    
    for (const pack of manifest.packs) {
      if (pack.files && Array.isArray(pack.files) && pack.files.includes(fileName)) {
        return pack.files; // Retorna todos los archivos del pack
      }
    }
    return null; // No encontrado en ningún pack
  } catch (e) {
    return null;
  }
}

/** Carga un archivo JSON y normaliza sus preguntas. */
async function loadAndNormalizeFile(lang, fileName) {
  const cacheKey = `${lang}:${fileName}`;
  if (filePackCache.has(cacheKey)) {
    return filePackCache.get(cacheKey);
  }
  
  const url = `${PACKS_BASE}/${lang}/${fileName}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const arr = await res.json();
    if (!Array.isArray(arr)) return [];
    
    const base = url.substring(0, url.lastIndexOf('/') + 1);
    const pool = arr.map(q => {
      const normalized = normalizeQuestion(q, q.category || 'misc', q.book);
      if (!normalized) return null;
      
      let imgUrl = null;
      if (q.img && typeof q.img === 'string') {
        if (/^https?:\/\//.test(q.img)) {
          imgUrl = q.img;
        } else {
          let imgPath = q.img.replace(/^\.\//, '');
          if (imgPath.startsWith('../')) {
            const resolvedPath = imgPath.replace(/^\.\.\//, '');
            imgUrl = `${PACKS_BASE}/${resolvedPath}`.replace(/\/+/g, '/');
          } else {
            imgUrl = base + imgPath;
          }
        }
      }
      return { ...normalized, img: imgUrl, reference: q.reference || normalized.reference || null };
    }).filter(q => q !== null);
    
    filePackCache.set(cacheKey, pool);
    return pool;
  } catch (e) {
    return [];
  }
}

/** Devuelve la lista única de libros en un pack por archivo (para el submenú Book). */
export async function getBooksInFilePack(lang, fileName) {
  // Verificar si este archivo pertenece a un pack con múltiples archivos
  const packFiles = await getPackFiles(lang, fileName);
  
  if (packFiles && packFiles.length > 1) {
    // Cargar todos los archivos del pack y combinar libros (orden canónico = orden del manifest)
    const allBooks = [];
    const seen = new Set();
    for (const file of packFiles) {
      const pool = await loadAndNormalizeFile(lang, file);
      pool.forEach(q => {
        if (q.book && q.book !== 'General OT' && !seen.has(q.book)) {
          seen.add(q.book);
          allBooks.push(q.book);
        }
      });
    }
    return allBooks;
  }
  
  // Si es un archivo único, orden de primera aparición en el archivo
  const pool = await loadAndNormalizeFile(lang, fileName);
  const books = [];
  const seen = new Set();
  pool.forEach(q => {
    if (q.book && q.book !== 'General OT' && !seen.has(q.book)) {
      seen.add(q.book);
      books.push(q.book);
    }
  });
  return books;
}

export async function buildDeckSingle(categoryKey, count, diff = 'any', customPool = null, bookFilter = null) {
  const bank = getBank();
  let pool = [];
  
  if (categoryKey?.startsWith('custom:') && customPool) {
    pool = [...(customPool[categoryKey] || [])];
  } else if (String(categoryKey||'').startsWith('filepack:')) {
    // Cargar pack desde archivo JSON según idioma
    try {
      const parts = String(categoryKey).split(':');
      if (parts.length >= 3) {
        const lang = parts[1];
        const fileName = parts.slice(2).join(':'); // Por si el nombre tiene ':'
        
        // Verificar si este archivo pertenece a un pack con múltiples archivos
        const packFiles = await getPackFiles(lang, fileName);
        
        if (packFiles && packFiles.length > 1) {
          // Cargar todos los archivos del pack y combinar
          const allPools = [];
          for (const file of packFiles) {
            const filePool = await loadAndNormalizeFile(lang, file);
            allPools.push(...filePool);
          }
          pool = allPools;
        } else {
          // Cargar solo el archivo seleccionado
          pool = await loadAndNormalizeFile(lang, fileName);
        }
        
        // Aplicar filtro de libro si existe
        if (bookFilter && pool.length) {
          pool = pool.filter(q => q && q.book === bookFilter);
        }
      }
    } catch(e) {
      pool = [];
    }
  } else if (bank[categoryKey]) {
    pool = [...bank[categoryKey]];
  } else {
    pool = BASE_KEYS.flatMap(k => bank[k] || []);
  }

  const filtered = difficultyFilter(pool, diff);
  const deck = [];

  // Función mejorada para mezclar array usando Fisher-Yates shuffle
  function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // Obtener historial de preguntas recientes desde localStorage
  const recentQuestionsKey = `recent_questions_${categoryKey}`;
  const recentQuestions = JSON.parse(localStorage.getItem(recentQuestionsKey) || '[]');
  
  // Filtrar preguntas recientes para evitar repeticiones inmediatas
  let availableQuestions = filtered.filter(q => {
    // Comparar por texto de pregunta para evitar duplicados
    const questionText = q.q || '';
    return !recentQuestions.some(recent => recent === questionText);
  });

  // Si no hay suficientes preguntas disponibles (sin las recientes), usar todas
  if (availableQuestions.length < count) {
    availableQuestions = [...filtered];
  }

  // Mezclar completamente el array antes de seleccionar
  const shuffled = shuffleArray(availableQuestions);

  // Seleccionar las preguntas necesarias
  for (let i = 0; i < count && i < shuffled.length; i++) {
    deck.push(shuffled[i]);
  }

  // Si aún no hay suficientes, agregar del pool completo (ya filtrado por dificultad)
  if (deck.length < count) {
    const remaining = filtered.filter(q => !deck.includes(q));
    const shuffledRemaining = shuffleArray(remaining);
    for (let i = 0; deck.length < count && i < shuffledRemaining.length; i++) {
      deck.push(shuffledRemaining[i]);
    }
  }

  // Actualizar historial de preguntas recientes (mantener últimas 50)
  const newRecent = deck.map(q => q.q || '').concat(recentQuestions);
  const updatedRecent = newRecent.slice(0, 50); // Mantener solo las últimas 50
  localStorage.setItem(recentQuestionsKey, JSON.stringify(updatedRecent));

  // Mezclar el deck final una vez más para mayor aleatoriedad
  return shuffleArray(deck);
}

export function listAvailableCategories() {
  const bank = getBank();
  return Object.keys(bank).filter(k => (bank[k]?.length || 0) > 0);
}


export async function ensureBankReady(lang = 'en', { force = false } = {}) {
  const existing = getBankCount();
  if (existing > 0 && !force) return getBank();
  return await warmLocalBank(lang);
}

// Backwards-compat alias expected by game_solo.js
export async function ensureInitial60(lang = 'en') {
  // Warm the bank if needed; keep behavior minimal
  return await ensureBankReady(lang);
}
