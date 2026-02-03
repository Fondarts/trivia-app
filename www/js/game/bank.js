// /web/js/bank.js
import { Storage } from '../core/storage.js';

export const BASE_LABELS = {
  movies:    'Películas y series',
  geography: 'Geografía',
  history:   'Historia',
  science:   'Ciencia',
  sports:    'Deporte',
  anime:     'Anime y Manga'
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

export function getCurrentLanguage() {
  return Storage.get(K.lang, 'es');
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

export async function warmLocalBank(lang = 'es') {
  if (!SUPPORTED_LANGS.includes(lang)) lang = 'es';

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
          if (!q || !Array.isArray(q.options) || q.options.length !== 4) continue;
          const ans = Number.isInteger(q.answer) ? q.answer : 0;
          if (ans < 0 || ans > 3) continue;
          let diff = String(q.difficulty || 'medium').toLowerCase();
          if (!['easy', 'medium', 'hard'].includes(diff)) diff = 'medium';
          bank[category].push({
            q: String(q.q || '').trim(),
            options: q.options.slice(0, 4),
            answer: ans,
            difficulty: diff,
            category,
          });
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

export async function buildDeckSingle(categoryKey, count, diff = 'any', customPool = null) {
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
        const cacheKey = `${lang}:${fileName}`;
        
        // Verificar cache primero
        if (filePackCache.has(cacheKey)) {
          pool = [...filePackCache.get(cacheKey)];
        } else {
          // Cargar el archivo
          const url = `${PACKS_BASE}/${lang}/${fileName}`;
          const res = await fetch(url);
          if (res.ok) {
            const arr = await res.json();
            if (Array.isArray(arr)) {
              // Calcular la base URL para resolver rutas relativas de imágenes
              const base = url.substring(0, url.lastIndexOf('/') + 1);
              
              pool = arr.map(q => {
                if (!q || !Array.isArray(q.options) || q.options.length !== 4) return null;
                const ans = Number.isInteger(q.answer) ? q.answer : 0;
                if (ans < 0 || ans > 3) return null;
                let difficulty = String(q.difficulty || 'medium').toLowerCase();
                if (!['easy', 'medium', 'hard'].includes(difficulty)) difficulty = 'medium';
                
                // Resolver ruta de imagen: si es URL absoluta, usarla; si es relativa, resolver desde base
                let imgUrl = null;
                if (q.img && typeof q.img === 'string') {
                  if (/^https?:\/\//.test(q.img)) {
                    // URL absoluta (http/https)
                    imgUrl = q.img;
                  } else {
                    // Ruta relativa: resolver desde la base del archivo JSON
                    // Remover ./ si existe
                    let imgPath = q.img.replace(/^\.\//, '');
                    
                    // Resolver rutas relativas como ../img/ desde packs/es/
                    // Desde packs/es/, ../ sube a packs/, luego img/ va a packs/img/
                    if (imgPath.startsWith('../')) {
                      // Remover ../ y construir ruta desde PACKS_BASE
                      const resolvedPath = imgPath.replace(/^\.\.\//, '');
                      // La ruta resultante (ej: img/archivo.webp) se concatena con PACKS_BASE
                      // Construir ruta relativa: packs/img/archivo.webp
                      imgUrl = `${PACKS_BASE}/${resolvedPath}`.replace(/\/+/g, '/');
                    } else {
                      // Ruta relativa simple: concatenar con base (packs/es/)
                      imgUrl = base + imgPath;
                    }
                  }
                }
                
                return {
                  q: String(q.q || '').trim(),
                  options: q.options.slice(0, 4),
                  answer: ans,
                  difficulty: difficulty,
                  category: q.category || 'misc',
                  img: imgUrl
                };
              }).filter(q => q !== null);
              
              // Guardar en cache
              filePackCache.set(cacheKey, pool);
            }
          } else {

          }
        }
      }
    } catch(e) {

      pool = [];
    }
  } else if (String(categoryKey||'').startsWith('userpack:')) {
    // Cargar pack creado por el usuario desde localStorage
    try {
      const packIndex = parseInt(String(categoryKey).slice(9), 10);
      const userPacks = JSON.parse(localStorage.getItem('userCreatedPacks') || '[]');
      const pack = userPacks[packIndex];
      if (pack && pack.questions && Array.isArray(pack.questions)) {
        pool = pack.questions.map(q => ({
          q: q.q || '',
          options: q.options || [],
          answer: q.answer || 0,
          difficulty: q.difficulty || 'medium',
          category: 'userpack',
          img: q.img || null
        }));
      }
    } catch(e) {

      pool = [];
    }
  } else if (String(categoryKey||'').startsWith('pack:')) {
    const pid = String(categoryKey).slice(5);
    pool = Object.values(bank).flatMap(arr => arr || []).filter(q => q && q.packId === pid);
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

export function categoryCounts() {
  const bank = getBank();
  const out = {};
  for (const [k, arr] of Object.entries(bank)) out[k] = arr?.length || 0;
  return out;
}

export async function ensureBankReady(lang = 'es', { force = false } = {}) {
  const existing = getBankCount();
  if (existing > 0 && !force) return getBank();
  return await warmLocalBank(lang);
}

// Backwards-compat alias expected by game_solo.js
export async function ensureInitial60(lang = 'es') {
  // Warm the bank if needed; keep behavior minimal
  return await ensureBankReady(lang);
}
