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
    console.error('[bank] No se pudo cargar manifest:', manifestUrl, e);
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
        console.error('[bank] Error cargando pack:', url, e);
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

export function buildDeckSingle(categoryKey, count, diff = 'any', customPool = null) {
  const bank = getBank();
  let pool = [];
  if (categoryKey?.startsWith('custom:') && customPool) {
    pool = [...(customPool[categoryKey] || [])];
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

  function pickOne(from) {
    const i = Math.floor(Math.random() * from.length);
    return from.splice(i, 1)[0];
  }

  let tmp = [...filtered];
  while (deck.length < count && tmp.length) {
    deck.push(pickOne(tmp));
  }

  let rest = pool.filter(q => !deck.includes(q));
  while (deck.length < count && rest.length) {
    deck.push(pickOne(rest));
  }

  return deck;
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
