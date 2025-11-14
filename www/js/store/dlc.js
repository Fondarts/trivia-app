
// dlc_store.js — v5b (hard bind, no HTML changes needed)
import { getBank, setBank } from '../game/bank.js';
import { updateBankCount, refreshCategorySelect, toast } from '../game/ui.js';
import { t } from '../core/i18n.js';

const K = { owned: 'trivia_owned_packs', ownedMeta: 'trivia_owned_packs_meta', lang: 'trivia_lang' };

// --- helpers
function getLang(){ try{ return (localStorage.getItem(K.lang)||'es').split('-')[0]; }catch{ return 'es'; } }
function getOwned(){ try{ return JSON.parse(localStorage.getItem(K.owned)||'[]'); }catch{ return []; } }
function setOwned(arr){ localStorage.setItem(K.owned, JSON.stringify(Array.from(new Set(arr)))); }
function getOwnedMeta(){ try{ return JSON.parse(localStorage.getItem(K.ownedMeta)||'{}'); }catch{ return {}; } }
function setOwnedMeta(meta){ localStorage.setItem(K.ownedMeta, JSON.stringify(meta||{})); }

function packInstalled(id){
  try{
    const bank = getBank();
    for (const arr of Object.values(bank)) if ((arr||[]).some(q => q && q.packId === id)) return true;
  }catch{}
  return false;
}
function sanitizeOwned(){
  try{
    const set = new Set(getOwned()); let changed=false;
    for (const id of Array.from(set)) if (!packInstalled(id)) { set.delete(id); changed=true; }
    if (changed) setOwned(Array.from(set));
  }catch{}
}

const PATHS = {
  manifest(lang){ return `dlc/${lang}/manifest.json`; },
  pack(lang, file){ return `dlc/${lang}/${file}`; }
};

// --- minimal CSS (only if needed)
function injectStyles(){
  if (document.getElementById('dlcStyles')) return;
  const s = document.createElement('style'); s.id='dlcStyles';
  s.textContent = `
    .dlc-overlay{ position:fixed; inset:0; display:none; align-items:center; justify-content:center; padding:16px; z-index:99999; background:rgba(0,0,0,.55); pointer-events: none; }
    .dlc-overlay[style*="flex"] { pointer-events: auto; }
    .dlc-panel{ 
      width:min(520px,92vw); 
      max-height:86vh; 
      overflow:auto; 
      background: var(--card);
      color: var(--text);
      border:1px solid var(--cardBorder); 
      border-radius:16px; 
      box-shadow:0 20px 60px rgba(0,0,0,.45); 
      padding:12px; 
      position:relative; 
      pointer-events: auto;
      backdrop-filter: blur(12px);
    }
    .dlc-sec{ 
      background: rgba(30, 41, 59, 0.6);
      border:1px solid var(--cardBorder); 
      border-radius:14px; 
      padding:12px; 
      margin:10px 0; 
    }
    :root[data-theme="light"] .dlc-sec {
      background: rgba(255, 255, 255, 0.7);
    }
    .dlc-row{ display:flex; align-items:center; justify-content:space-between; gap:8px; }
    .dlc-title{ font-weight:800; color: var(--text); }
    .dlc-small{ opacity:.9; font-size:12px; color: var(--muted); }
    .dlc-btn{ border-radius:12px; padding:10px 14px; font-weight:800; border:1px solid transparent; }
    .dlc-btn.get{ background:var(--accent); color:#fff; }
    .dlc-btn.installed{ background:var(--good); color:#fff; }
    .dlc-close{ 
      position:absolute; 
      top:8px; 
      right:8px; 
      width:36px; 
      height:36px; 
      border-radius:10px; 
      background: var(--card);
      color: var(--text);
      font-size:20px; 
      font-weight:900; 
      border: 1px solid var(--cardBorder);
      cursor: pointer;
    }
    .iconbtn svg{ width:22px; height:22px; display:block; }
  `;
  document.head.appendChild(s);
}

// --- modal
function ensureModal(){
  injectStyles();
  let ov = document.getElementById('dlcModal');
  if (ov) return ov;
  ov = document.createElement('div');
  ov.id='dlcModal'; ov.className='dlc-overlay';
  ov.innerHTML = `
    <div class="dlc-panel" role="dialog" aria-label="${t('packStore')}">
      <button class="dlc-close" id="dlcClose" aria-label="Cerrar">×</button>
      <div class="dlc-sec">
        <div class="dlc-row">
          <div class="dlc-title">${t('available')}</div>
          <div class="dlc-small">${t('packsHint')}</div>
        </div>
      </div>
      <div id="dlcList"></div>
    </div>`;
  document.body.appendChild(ov);
  ov.addEventListener('click',(e)=>{ if(e.target===ov) hide(); });
  ov.querySelector('#dlcClose').onclick = hide;
  return ov;
}
function show(){ ensureModal().style.display='flex'; }
function hide(){ const ov = document.getElementById('dlcModal'); if (ov) ov.style.display='none'; }

// --- ensure button in header (if missing)
// DESACTIVADO: Botón de tienda removido
function ensureButton(){
  // Función desactivada - botón de tienda removido
  return;
}

async function fetchJSON(url){
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

async function render(){
  ensureModal();
  sanitizeOwned();
  const lang = getLang();
  let mani;
  try{ mani = await fetchJSON(PATHS.manifest(lang)); }
  catch(e){ console.error('[dlc] manifest', e); const el=document.getElementById('dlcList'); if(el) el.innerHTML='<div class="dlc-small">No hay packs disponibles.</div>'; return; }

  const owned = new Set(getOwned());
  const meta = getOwnedMeta();
  const list = document.getElementById('dlcList'); list.innerHTML = '';

  for (const p of (mani.packs||[])){
    meta[p.id] = { id:p.id, title:p.title, category:p.category||'', version:p.version||1 };
    const isOwned = owned.has(p.id) && packInstalled(p.id);

    const sec = document.createElement('div');
    sec.className = 'dlc-sec';
    sec.innerHTML = `
      <div class="dlc-row">
        <div class="dlc-title">${p.title}</div>
        <div class="dlc-small">${p.category||''} · ${p.count||'?'} preg.</div>
      </div>
      <div class="dlc-row" style="margin:6px 0">
        <div class="dlc-small">${p.description||''}</div>
        <div class="dlc-small dlc-price" data-id="${p.id}">${isOwned?t('installed'):t('free')}</div>
      </div>
      <div class="dlc-row">
        <button class="dlc-btn ${isOwned?'installed':'get'}" data-id="${p.id}">${isOwned?t('installed'):t('get')}</button>
        <div class="dlc-small">v${p.version||1}</div>
      </div>`;
    list.appendChild(sec);
    const btn = sec.querySelector('button');
    if (!isOwned) btn.onclick = ()=> onAcquire(p, btn);
    else btn.disabled = true;
  }
  setOwnedMeta(meta);
}

async function onAcquire(pack, btn){
  toInstalledUI(pack.id, btn);
  try{
    await installPack(pack);
    const owned = new Set(getOwned()); owned.add(pack.id); setOwned(Array.from(owned));
    try{ updateBankCount && updateBankCount(); }catch{}
    try{ refreshCategorySelect && refreshCategorySelect(); }catch{}
    toast && toast(t('packInstalled'));
  }catch(e){
    console.error('[dlc] install', e);
    toGetUI(pack.id, btn);
    toast && toast(t('errorInstalling'));
  }
}

function toInstalledUI(id, btn){
  if (btn){ btn.classList.remove('get'); btn.classList.add('installed'); btn.textContent = t('installed'); btn.disabled=true; }
  const price = document.querySelector(`.dlc-price[data-id="${CSS.escape(id)}"]`);
  if (price) price.textContent = t('installed');
}
function toGetUI(id, btn){
  if (btn){ btn.classList.remove('installed'); btn.classList.add('get'); btn.textContent = t('get'); btn.disabled=false; }
  const price = document.querySelector(`.dlc-price[data-id="${CSS.escape(id)}"]`);
  if (price) price.textContent = t('free');
}

async function installPack(p){
  const lang = getLang();
  const bank = getBank();
  const category = p.category || 'misc';
  bank[category] = bank[category] || [];

  let added = 0;
  for (const f of (p.files||[])){
    try{
      const url = PATHS.pack(lang, f);
      const arr = await fetchJSON(url);
      const base = url.substring(0, url.lastIndexOf('/')+1);
      for (const q of arr){
        if (!q || !Array.isArray(q.options) || q.options.length !== 4) continue;
        const ans = Number.isInteger(q.answer) ? q.answer : 0;
        if (ans<0 || ans>3) continue;
        let diff = String(q.difficulty || 'medium').toLowerCase();
        if (!['easy','medium','hard'].includes(diff)) diff='medium';
        const img = (typeof q.img==='string' ? (/^https?:\/\/.*/.test(q.img) ? q.img : (base + q.img.replace(/^\.\//,''))) : undefined);
        bank[category].push({ q:String(q.q||'').trim(), options:q.options.slice(0,4), answer:ans, difficulty:diff, category, packId:p.id, img });
        added++;
      }
    }catch(e){ console.error('[dlc] file failed', f, e); }
  }
  if (added===0) throw new Error('No questions added');
  setBank(bank);
}

// --- public open
async function openStore(){ try{ await render(); show(); }catch(e){ console.error('[dlc] open', e); } }
window.__openStore = openStore;

// Bind on load (and ensure button exists)
// DESACTIVADO: Botón de tienda removido
document.addEventListener('DOMContentLoaded', ()=>{
  // ensureButton(); // Desactivado
  // const btn = document.getElementById('btnDLC');
  // if (btn) btn.addEventListener('click', openStore);
});
