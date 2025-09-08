// js/store.js
const K = {
  settings: 'trivia_settings',
  bank: 'trivia_bank',
  custom: 'trivia_custom',
};

export const SETTINGS = loadSettings();
export const STATE = {
  deck: [], mode: 'rounds', score: 0, index: 0, total: 0
};

export function loadSettings(){
  try{
    const s = JSON.parse(localStorage.getItem(K.settings)||'{}');
    return { theme: s.theme || 'dark', sounds: s.sounds!==false, autoNextRounds: s.autoNextRounds !== false };
  }catch{
    return { theme:'dark', sounds:true, autoNextRounds:true };
  }
}
export function saveSettings(s){
  localStorage.setItem(K.settings, JSON.stringify(s));
}
export function applyTheme(theme){ document.documentElement.setAttribute('data-theme', theme); }

export function getBank(){
  try{ const r=localStorage.getItem(K.bank); if(r) return JSON.parse(r); } catch{}
  const o={ movies:[], geography:[], culture:[], history:[], science:[], sports:[] };
  localStorage.setItem(K.bank, JSON.stringify(o)); return o;
}
export function setBank(b){ localStorage.setItem(K.bank, JSON.stringify(b)); }
export function getCustom(){ try{const r=localStorage.getItem(K.custom); if(r) return JSON.parse(r)}catch{} return {}; }
export function setCustom(c){ localStorage.setItem(K.custom, JSON.stringify(c)); }

export const LABELS = { movies:'Películas y series', geography:'Geografía', culture:'Cultura', history:'Historia', science:'Ciencia', sports:'Deporte' };
export const OTDB = { movies:[11,14], geography:[22], culture:[9], history:[23], science:[17], sports:[21] };
export const BASE_KEYS = Object.keys(LABELS);