import { SETTINGS, persistSettings } from '../core/store.js';
import { getBank, warmLocalBank, PACKS_BASE, SUPPORTED_LANGS, getBooksInFilePack } from './bank.js';
import { getStats, getUnlockedAchievements } from '../player/stats.js';
import { getLevelProgress } from '../player/experience.js';
import { ACHIEVEMENTS_LIST } from '../player/achievements.js';
import { t, setLanguage, getLanguage, initI18n, updateUI as updateI18nUI } from '../core/i18n.js';
import { populateBibleBookSelector } from './bible-study.js';

const PROFILE_NAME_KEY = 'trivia_profile_name';
const PROFILE_PHOTO_KEY = 'trivia_profile_photo';
const PLACEHOLDER_AVATAR = 'assets/icons/avatar_placeholder.svg';

function getProfileName() {
  try { return localStorage.getItem(PROFILE_NAME_KEY) || ''; } catch { return ''; }
}
function setProfileName(name) {
  try { localStorage.setItem(PROFILE_NAME_KEY, String(name).trim().slice(0, 32)); } catch {}
}
function getProfilePhoto() {
  try { return localStorage.getItem(PROFILE_PHOTO_KEY) || ''; } catch { return ''; }
}
function setProfilePhoto(dataUrl) {
  try {
    if (dataUrl) localStorage.setItem(PROFILE_PHOTO_KEY, dataUrl);
    else localStorage.removeItem(PROFILE_PHOTO_KEY);
  } catch {}
}

function applyProfileToUI() {
  const name = getProfileName();
  const photo = getProfilePhoto();
  const nicknameEl = document.getElementById('profileNicknameText');
  const avatarEl = document.getElementById('profileAvatar');
  const headerImg = document.getElementById('headerProfileImg');
  const headerFallback = document.querySelector('.header-avatar-fallback');
  if (nicknameEl) nicknameEl.textContent = name || '—';
  if (avatarEl) avatarEl.src = photo || PLACEHOLDER_AVATAR;
  if (headerImg) {
    if (photo) {
      headerImg.src = photo;
      headerImg.style.display = 'block';
      if (headerFallback) headerFallback.style.display = 'none';
    } else {
      headerImg.src = '';
      headerImg.style.display = 'none';
      if (headerFallback) headerFallback.style.display = '';
    }
  }
}


export function toast(msg){
  const el = document.getElementById('toast') || (()=> {
    const t = document.createElement('div');
    t.id = 'toast';
    t.style.cssText = 'position:fixed;left:50%;transform:translateX(-50%);bottom:20px;background:#2c3e50;color:#fff;padding:12px 16px;border-radius:10px;z-index:99999;display:none;box-shadow: 0 4px 10px rgba(0,0,0,0.2); font-weight: 600;max-width:calc(100vw - 40px);word-wrap:break-word;overflow-wrap:break-word;white-space:normal;text-align:center;box-sizing:border-box;';
    document.body.appendChild(t);
    return t;
  })();
  el.textContent = msg;
  el.style.display = 'block';
  setTimeout(()=> el.style.display = 'none', 2500);
}

export function updatePlayerXPBar() {
    const stats = getStats();
    const { level, currentLevelXP, xpForNextLevel, progressPercent } = getLevelProgress(stats.totalXP);

    const profileLevelBadge = document.getElementById('profileLevelBadge');
    const profileXpBar = document.getElementById('profileXpBar');
    const profileXpText = document.getElementById('profileXpText');
    const profileBankInfo = document.getElementById('profileBankInfo');

    if (profileLevelBadge) {
        profileLevelBadge.innerHTML = `<span data-i18n="level">${t('level')}</span> ${level}`;
    }
    if (profileXpBar) profileXpBar.style.width = `${progressPercent}%`;
    if (profileXpText) profileXpText.textContent = `${currentLevelXP} / ${xpForNextLevel} XP`;
    
    // Actualizar info del banco en el perfil
    if (profileBankInfo) {
        const bankObj = getBank();
        let totalCount = 0;
        
        // Contar todas las preguntas
        Object.entries(bankObj).forEach(([category, questions]) => {
            if (questions && Array.isArray(questions)) {
                totalCount += questions.length;
            }
        });
        
        // Formatear texto
        profileBankInfo.textContent = `${totalCount} ${t('questions') || 'preguntas'}`;
    }
}

export function bindProfileModal(){
  const modal = document.getElementById('profileModal');
  let openBtn = document.getElementById('btnProfile');
  let closeBtn = document.getElementById('btnCloseProfile');
  let statsBtn = document.getElementById('profileBtnStats');

  if (!modal || !openBtn) return;

  const open = () => {
    updatePlayerXPBar();
    applyProfileToUI();
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
    document.body.classList.add('modal-open');
    
    // Re-bind settings listeners when opening with a small delay
    setTimeout(() => bindSettingsListeners(), 50);
  };
  
  const close = () => {
    modal.classList.remove('open');
    document.body.style.overflow = '';
    document.body.classList.remove('modal-open');
  };

  // Remove all existing listeners by cloning
  const newOpenBtn = openBtn.cloneNode(true);
  openBtn.parentNode.replaceChild(newOpenBtn, openBtn);
  openBtn = newOpenBtn; // Update reference
  
  openBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    open();
  });

  // Close button
  if (closeBtn) {
    const newCloseBtn = closeBtn.cloneNode(true);
    closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
    closeBtn = newCloseBtn; // Update reference
    
    closeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      close();
    });
  }

  // Click outside to close - only add once
  if (!modal.dataset.hasClickListener) {
    modal.dataset.hasClickListener = 'true';
    modal.addEventListener('click', (e) => {
      if (e.target === modal) close();
    });
  }

  // ESC key to close - only add once
  if (!document.body.dataset.hasEscListener) {
    document.body.dataset.hasEscListener = 'true';
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('open')) close();
    });
  }

  // Foto de perfil: clic en avatar abre selector de archivo
  const avatarWrap = document.getElementById('profileAvatarWrap');
  const photoInput = document.getElementById('profilePhotoInput');
  if (avatarWrap && photoInput) {
    avatarWrap.style.cursor = 'pointer';
    avatarWrap.addEventListener('click', () => photoInput.click());
    photoInput.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file || !file.type.startsWith('image/')) return;
      const r = new FileReader();
      r.onload = () => {
        setProfilePhoto(r.result);
        applyProfileToUI();
      };
      r.readAsDataURL(file);
      e.target.value = '';
    });
  }

  // Nombre: botón editar muestra input, guardar en blur/enter
  const nicknameText = document.getElementById('profileNicknameText');
  const nicknameInput = document.getElementById('profileNicknameInput');
  const editNameBtn = document.getElementById('profileEditNameBtn');
  if (nicknameText && nicknameInput && editNameBtn) {
    const namePlaceholder = typeof t === 'function' ? t('yourNamePlaceholder') : 'Tu nombre';
    nicknameInput.placeholder = namePlaceholder;
    editNameBtn.setAttribute('aria-label', namePlaceholder);
    const showEdit = () => {
      nicknameText.style.display = 'none';
      editNameBtn.style.display = 'none';
      nicknameInput.style.display = 'block';
      nicknameInput.value = getProfileName();
      nicknameInput.focus();
    };
    const hideEdit = () => {
      const val = nicknameInput.value.trim().slice(0, 32);
      setProfileName(val);
      nicknameText.textContent = val || '—';
      nicknameText.style.display = '';
      editNameBtn.style.display = '';
      nicknameInput.style.display = 'none';
      applyProfileToUI();
    };
    editNameBtn.addEventListener('click', showEdit);
    nicknameInput.addEventListener('blur', hideEdit);
    nicknameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); nicknameInput.blur(); }
    });
  }

  // Aplicar perfil al cargar (header con foto si existe)
  applyProfileToUI();

  // Stats button - needs to be re-queried after potential DOM changes
  statsBtn = document.getElementById('profileBtnStats');
  if (statsBtn) {
    const newStatsBtn = statsBtn.cloneNode(true);
    statsBtn.parentNode.replaceChild(newStatsBtn, statsBtn);
    statsBtn = newStatsBtn; // Update reference
    
    statsBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      close();
      // Open stats directly
      const fsStats = document.getElementById('fsStats');
      if (fsStats) {
        fsStats.style.display = 'block';
        window.scrollTo(0, 0);
        renderStatsPage();
      }
    });
  }

  // Function to bind settings listeners
  function bindSettingsListeners() {
    // Language radio buttons - NEW
    document.querySelectorAll('input[name="language"]').forEach(radio => {
      const newRadio = radio.cloneNode(true);
      // Preserve checked state
      newRadio.checked = radio.checked;
      radio.parentNode.replaceChild(newRadio, radio);
      
      newRadio.addEventListener('change', (e) => {
        e.stopPropagation();
        const lang = e.target.value;
        const currentLang = getLanguage();
        
        // Solo cambiar si es diferente al actual
        if (lang !== currentLang) {
          setLanguage(lang);
          localStorage.setItem('trivia_lang', lang);
          
          // Mostrar toast de cambio
          toast(lang === 'en' ? 'Language changed to English' : 'Idioma cambiado a Español');
          
          // Recargar el banco de preguntas en el nuevo idioma
          warmLocalBank(lang).then(async () => {
            await refreshCategorySelect();
            await refreshCombinedCategoryBook();
            populateBibleBookSelector();
            ensureCustomDropdown(document.getElementById('bibleBookSel'));
            // Actualizar toda la UI sin recargar la página
            updateI18nUI();
            // Actualizar el badge del nivel con el nuevo idioma
            updatePlayerXPBar();
          });
        }
      });
    });
    
    // Sounds checkbox
    let chkSounds = document.getElementById('optSounds');
    if (chkSounds) {
      const newChk = chkSounds.cloneNode(true);
      newChk.checked = !!SETTINGS.sounds;
      chkSounds.parentNode.replaceChild(newChk, chkSounds);
      chkSounds = newChk;
      
      chkSounds.addEventListener('change', (e) => {
        e.stopPropagation();
        SETTINGS.sounds = e.target.checked;
        persistSettings();
      });
    }

    // Auto advance checkbox  
    let chkAuto = document.getElementById('optAutoNextRounds');
    if (chkAuto) {
      const newAuto = chkAuto.cloneNode(true);
      newAuto.checked = !!SETTINGS.autoNextRounds;
      chkAuto.parentNode.replaceChild(newAuto, chkAuto);
      chkAuto = newAuto;
      
      chkAuto.addEventListener('change', (e) => {
        e.stopPropagation();
        SETTINGS.autoNextRounds = e.target.checked;
        persistSettings();
      });
    }

    // Set initial values
    const currentLang = getLanguage();
    const langRadio = document.querySelector(`input[name="language"][value="${currentLang}"]`);
    if (langRadio) langRadio.checked = true;
    
    const themeRadio = document.querySelector(`input[name="theme"][value="${SETTINGS.theme}"]`);
    if (themeRadio) themeRadio.checked = true;
  }

  // Set initial values on first load
  bindSettingsListeners();
}

export function bindDifficultyPills(){
  // Los botones de dificultad fueron reemplazados por selects
  // Esta función se mantiene por compatibilidad pero ya no es necesaria
  const diffSelect = document.getElementById('difficulty');
  // Asegurar que los selects tengan el valor correcto si existen
  if (diffSelect && !diffSelect.value) {
    diffSelect.value = 'easy';
  }
}

export function bindModeSegment(){
  const seg = document.getElementById('modeSeg'); if (!seg) return;
  const wrapRounds     = document.getElementById('roundsWrap');
  const wordsearchWrap = document.getElementById('wordsearchWrap');
  const bibleStudyWrap = document.getElementById('bibleStudyWrap');
  const catSection         = document.getElementById('catSection');
  const categoryBookSection = document.getElementById('categoryBookSection');
  const spStartWrap        = document.getElementById('spStartWrap');
  const spStartWrapWS      = document.getElementById('spStartWrapWS');

  const show = (el,on)=>{ if (el) el.style.display = on ? 'block' : 'none'; };

  function apply(val){
    if (val === 'rounds') {
      show(wrapRounds, true);
      show(wordsearchWrap, false);
      show(bibleStudyWrap, false);
      show(catSection, false);
      show(categoryBookSection, true);
      show(spStartWrap, true);
      show(spStartWrapWS, false);
    } else if (val === 'wordsearch') {
      show(wrapRounds, false);
      show(wordsearchWrap, true);
      show(bibleStudyWrap, false);
      show(catSection, false);
      show(categoryBookSection, false);
      show(spStartWrap, false);
      show(spStartWrapWS, true);
    } else if (val === 'bible') {
      show(wrapRounds, false);
      show(wordsearchWrap, false);
      show(bibleStudyWrap, true);
      show(catSection, false);
      show(categoryBookSection, false);
      show(spStartWrap, false);
      show(spStartWrapWS, false);
    }
  }

  seg.querySelectorAll('.seg').forEach(s=>{
    s.addEventListener('click', ()=>{
      seg.querySelectorAll('.seg').forEach(x=> x.classList.remove('active'));
      s.classList.add('active');
      apply(s.dataset.val);
    });
  });
  apply('rounds');
}


/** Crea el wrapper del custom dropdown para cualquier select si no existe y sincroniza el panel. */
export function ensureCustomDropdown(selectEl) {
  if (!selectEl || !selectEl.matches?.('select')) return;
  if (selectEl.parentElement?.classList?.contains('custom-select-wrap')) {
    syncCustomDropdown(selectEl.parentElement);
    return;
  }
  const wrap = document.createElement('div');
  wrap.className = 'custom-select-wrap';
  wrap.setAttribute('aria-expanded', 'false');
  selectEl.parentNode.insertBefore(wrap, selectEl);
  wrap.appendChild(selectEl);

  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'custom-select-trigger';
  trigger.setAttribute('aria-haspopup', 'listbox');
  trigger.setAttribute('aria-expanded', 'false');
  wrap.appendChild(trigger);

  const panel = document.createElement('div');
  panel.className = 'custom-select-panel';
  panel.setAttribute('role', 'listbox');
  wrap.appendChild(panel);

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = wrap.getAttribute('aria-expanded') === 'true';
    if (!open) {
      document.querySelectorAll('.custom-select-wrap[aria-expanded="true"]').forEach(other => {
        if (other !== wrap) {
          other.setAttribute('aria-expanded', 'false');
          other.querySelector('.custom-select-trigger')?.setAttribute('aria-expanded', 'false');
        }
      });
    }
    wrap.setAttribute('aria-expanded', !open);
    trigger.setAttribute('aria-expanded', !open);
  });

  document.addEventListener('click', () => {
    wrap.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-expanded', 'false');
  });

  wrap.addEventListener('click', (e) => e.stopPropagation());
  syncCustomDropdown(wrap);
}

/** Rellena el panel del custom dropdown desde el select del wrap y enlaza clics. */
function syncCustomDropdown(wrap) {
  if (!wrap) return;
  const sel = wrap.querySelector('select');
  const trigger = wrap.querySelector('.custom-select-trigger');
  const panel = wrap.querySelector('.custom-select-panel');
  if (!sel || !trigger || !panel) return;

  panel.innerHTML = '';
  const currentValue = sel.value ?? '';

  function addOption(value, text, isSelected) {
    const opt = document.createElement('div');
    opt.className = 'custom-select-option' + (value === 'all' ? ' custom-select-option-bible' : '');
    opt.setAttribute('role', 'option');
    opt.dataset.value = value;
    opt.textContent = text;
    opt.setAttribute('aria-selected', isSelected ? 'true' : 'false');
    opt.addEventListener('click', () => {
      sel.value = value;
      sel.dispatchEvent(new Event('change', { bubbles: true }));
      trigger.textContent = text;
      panel.querySelectorAll('.custom-select-option').forEach(o => o.setAttribute('aria-selected', 'false'));
      opt.setAttribute('aria-selected', 'true');
      wrap.setAttribute('aria-expanded', 'false');
      trigger.setAttribute('aria-expanded', 'false');
    });
    panel.appendChild(opt);
  }

  for (const node of sel.children) {
    if (node.tagName === 'OPTION') {
      addOption(node.value, node.textContent.trim(), node.value === currentValue);
    } else if (node.tagName === 'OPTGROUP') {
      const group = document.createElement('div');
      group.className = 'custom-select-group';
      const opts = node.querySelectorAll('option');
      const groupLabel = (node.label || '').trim();
      const firstOpt = opts[0];
      const isPackFirst = firstOpt && groupLabel && firstOpt.textContent.trim().toLowerCase() === groupLabel.toLowerCase();

      const header = document.createElement('div');
      header.className = 'custom-select-group-header';
      const toggle = document.createElement('span');
      toggle.className = 'custom-select-group-toggle';
      toggle.setAttribute('aria-label', 'Expandir o contraer');
      toggle.innerHTML = '▼';
      const packDiv = document.createElement('div');
      packDiv.className = 'custom-select-option custom-select-option-pack';
      packDiv.setAttribute('role', 'option');
      packDiv.dataset.value = firstOpt.value;
      packDiv.textContent = firstOpt.textContent.trim();
      packDiv.setAttribute('aria-selected', firstOpt.value === currentValue ? 'true' : 'false');
      packDiv.addEventListener('click', (e) => {
        if (e.target === toggle) return;
        sel.value = firstOpt.value;
        sel.dispatchEvent(new Event('change', { bubbles: true }));
        trigger.textContent = firstOpt.textContent.trim();
        panel.querySelectorAll('.custom-select-option').forEach(o => o.setAttribute('aria-selected', 'false'));
        packDiv.setAttribute('aria-selected', 'true');
        wrap.setAttribute('aria-expanded', 'false');
        trigger.setAttribute('aria-expanded', 'false');
      });
      toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        group.classList.toggle('custom-select-group-collapsed');
        toggle.textContent = group.classList.contains('custom-select-group-collapsed') ? '▶' : '▼';
      });
      header.appendChild(toggle);
      header.appendChild(packDiv);
      group.appendChild(header);

      const booksWrap = document.createElement('div');
      booksWrap.className = 'custom-select-group-books';
      for (let i = isPackFirst ? 1 : 0; i < opts.length; i++) {
        const opt = opts[i];
        const div = document.createElement('div');
        div.className = 'custom-select-option';
        div.setAttribute('role', 'option');
        div.dataset.value = opt.value;
        div.textContent = opt.textContent.trim();
        div.setAttribute('aria-selected', opt.value === currentValue ? 'true' : 'false');
        div.addEventListener('click', () => {
          sel.value = opt.value;
          sel.dispatchEvent(new Event('change', { bubbles: true }));
          trigger.textContent = opt.textContent.trim();
          panel.querySelectorAll('.custom-select-option').forEach(o => o.setAttribute('aria-selected', 'false'));
          div.setAttribute('aria-selected', 'true');
          wrap.setAttribute('aria-expanded', 'false');
          trigger.setAttribute('aria-expanded', 'false');
        });
        booksWrap.appendChild(div);
      }
      group.appendChild(booksWrap);
      panel.appendChild(group);
    }
  }

  const selectedOpt = [...sel.options].find(o => o.value === currentValue);
  trigger.textContent = selectedOpt ? selectedOpt.textContent.trim() : '';
}

export async function refreshCategorySelect(){
  const sel = document.getElementById('categorySel');
  if (!sel) return;
  const prev = sel.value;
  sel.innerHTML = '';

  try {
    // Opción "todas"
    const optAll = document.createElement('option');
    optAll.value = 'all';
    optAll.textContent = (typeof t === 'function' ? t('categoryAll') : 'Todas las categorías');
    sel.appendChild(optAll);

    // Etiquetas para grupos del manifest (ej. Bible -> Old Testament; luego New Testament)
    const labels = { bible: 'Bible' };

    // Grupo packs disponibles según idioma (desde manifest.json): solo Old Testament, luego New Testament
    try {
      const currentLang = getLanguage();
      const lang = SUPPORTED_LANGS.includes(currentLang) ? currentLang : 'en';
      const manifestUrl = `${PACKS_BASE}/${lang}/manifest.json`;
      
      const res = await fetch(manifestUrl);
      if (res.ok) {
        const manifest = await res.json();
        const packsMap = new Map(); // Para agrupar por categoría
        
        if (manifest.packs && Array.isArray(manifest.packs)) {
          manifest.packs.forEach(pack => {
            const category = pack.category || 'misc';
            const files = pack.files || [];
            
            // Si el pack tiene múltiples archivos, mostrar solo UNA opción con el nombre del pack
            // El código cargará automáticamente todos los archivos del pack
            if (files.length > 1) {
              // Pack con múltiples archivos: mostrar solo una opción
              const packName = pack.id || pack.title || 'Pack';
              const firstFile = files[0]; // Usar el primer archivo como referencia
              let normalizedFileName = firstFile;
              if (normalizedFileName && !normalizedFileName.endsWith('.json')) {
                normalizedFileName = normalizedFileName + '.json';
              }
              
              if (!packsMap.has(category)) {
                packsMap.set(category, []);
              }
              packsMap.get(category).push({
                id: pack.id || normalizedFileName.replace('.json', ''),
                name: packName,
                fileName: normalizedFileName, // Primer archivo como referencia
                category: category
              });
            } else {
              // Pack con un solo archivo: mostrar normalmente
              files.forEach(fileName => {
                let normalizedFileName = fileName;
                if (normalizedFileName && !normalizedFileName.endsWith('.json')) {
                  normalizedFileName = normalizedFileName + '.json';
                }
                
                const packName = pack.id || pack.title || normalizedFileName.replace('.json', '').replace(/_/g, ' ').replace(/-/g, ' ');
                
                if (!packsMap.has(category)) {
                  packsMap.set(category, []);
                }
                packsMap.get(category).push({
                  id: pack.id || normalizedFileName.replace('.json', ''),
                  name: packName,
                  fileName: normalizedFileName,
                  category: category
                });
              });
            }
          });
          
          // Crear grupos por categoría
          if (packsMap.size > 0) {
            packsMap.forEach((packs, category) => {
              const categoryLabel = labels[category] || category;
              const g = document.createElement('optgroup');
              g.label = categoryLabel;
              packs.forEach(pack => {
                const o = document.createElement('option');
                o.value = `filepack:${lang}:${pack.fileName}`;
                o.textContent = pack.name;
                g.appendChild(o);
              });
              sel.appendChild(g);
            });
          }
        }
      }
    } catch(e) {

    }

  } catch (e) {

    // Fallback absoluto si algo explota (solo opción todas)
    const optAllFallback = document.createElement('option'); optAllFallback.value = 'all'; optAllFallback.textContent = 'Todas las categorías'; sel.appendChild(optAllFallback);
  }

  if (prev && [...sel.options].some(o=>o.value===prev)) sel.value = prev;
  else sel.value = 'all';
  
  // Vincular evento para actualizar selector de cantidad y de libro cuando cambie la categoría
  if (!sel._hasCategoryListener) {
    sel.addEventListener('change', () => {
      updateRoundsSelectorForCategory();
      refreshBookSelect();
    });
    sel._hasCategoryListener = true;
  }
  
  // Actualizar selector de cantidad y de libro inicialmente
  updateRoundsSelectorForCategory();
  refreshBookSelect();

  ensureCustomDropdown(document.getElementById('rounds'));
  ensureCustomDropdown(document.getElementById('difficulty'));
  ensureCustomDropdown(document.getElementById('wsDifficulty'));
  await refreshCombinedCategoryBook();
}

const COMBINED_VALUE_SEP = '||';

/** Menú unificado Categoría + Libro: All categories → Old Testament (libros) → New Testament (libros). */
export async function refreshCombinedCategoryBook() {
  const combinedSel = document.getElementById('categoryBookSel');
  const categorySel = document.getElementById('categorySel');
  const bookSel = document.getElementById('bookSel');
  if (!combinedSel || !categorySel || !bookSel) return;

  const currentCat = categorySel.value || 'all';
  const currentBook = bookSel.value || '';
  const currentCombined = currentCat.startsWith('filepack:')
    ? `${currentCat}${COMBINED_VALUE_SEP}${currentBook}`
    : 'all';

  combinedSel.innerHTML = '';
  const optAll = document.createElement('option');
  optAll.value = 'all';
  optAll.textContent = 'Bible';
  combinedSel.appendChild(optAll);

  try {
    const currentLang = getLanguage();
    const lang = SUPPORTED_LANGS.includes(currentLang) ? currentLang : 'en';
    const manifestUrl = `${PACKS_BASE}/${lang}/manifest.json`;
    const res = await fetch(manifestUrl);
    if (!res.ok) return finishCombined();
    const manifest = await res.json();
    if (!manifest.packs || !Array.isArray(manifest.packs)) return finishCombined();

    for (const pack of manifest.packs) {
      const files = pack.files || [];
      if (files.length === 0) continue;
      let firstFile = files[0];
      if (firstFile && !firstFile.endsWith('.json')) firstFile = firstFile + '.json';
      const packName = pack.id || pack.title || firstFile?.replace('.json', '').replace(/_/g, ' ') || 'Pack';
      const books = await getBooksInFilePack(lang, firstFile);
      if (!books || !books.length) continue;

      const g = document.createElement('optgroup');
      g.label = packName;
      const optPack = document.createElement('option');
      optPack.value = `filepack:${lang}:${firstFile}${COMBINED_VALUE_SEP}`;
      optPack.textContent = packName;
      g.appendChild(optPack);
      for (const book of books) {
        const o = document.createElement('option');
        o.value = `filepack:${lang}:${firstFile}${COMBINED_VALUE_SEP}${book}`;
        o.textContent = book;
        g.appendChild(o);
      }
      combinedSel.appendChild(g);
    }
  } catch (e) {
    // fallback: solo "All categories"
  }

  function finishCombined() {
    if ([...combinedSel.options].some(o => o.value === currentCombined)) combinedSel.value = currentCombined;
    else combinedSel.value = 'all';
    if (!combinedSel._hasCombinedListener) {
      combinedSel.addEventListener('change', () => {
        const val = combinedSel.value || 'all';
        if (val === 'all') {
          categorySel.value = 'all';
          bookSel.value = '';
        } else {
          const idx = val.indexOf(COMBINED_VALUE_SEP);
          if (idx !== -1) {
            categorySel.value = val.slice(0, idx);
            bookSel.value = val.slice(idx + COMBINED_VALUE_SEP.length);
          }
        }
        categorySel.dispatchEvent(new Event('change', { bubbles: true }));
      });
      combinedSel._hasCombinedListener = true;
    }
    ensureCustomDropdown(combinedSel);
  }
  finishCombined();
}

/** Rellena el selector de libro; siempre visible. Con filepack muestra libros del pack; si no, solo "Todos los libros". */
export async function refreshBookSelect() {
  const categorySel = document.getElementById('categorySel');
  const bookSel = document.getElementById('bookSel');
  if (!categorySel || !bookSel) return;
  const val = categorySel.value || '';
  if (val.startsWith('filepack:')) {
    const parts = val.split(':');
    if (parts.length >= 3) {
      const lang = parts[1];
      const fileName = parts.slice(2).join(':');
      const books = await getBooksInFilePack(lang, fileName);
      const prev = bookSel.value;
      bookSel.innerHTML = '';
      const optAll = document.createElement('option');
      optAll.value = '';
      optAll.textContent = typeof t === 'function' ? t('bookAll') : 'Todos los libros';
      bookSel.appendChild(optAll);
      books.forEach(book => {
        const o = document.createElement('option');
        o.value = book;
        o.textContent = book;
        bookSel.appendChild(o);
      });
      if (prev && books.includes(prev)) bookSel.value = prev;
      else bookSel.value = '';
      ensureCustomDropdown(bookSel);
      return;
    }
  }
  // Sin filepack: solo opción "Todos los libros"
  bookSel.innerHTML = '';
  const optAll = document.createElement('option');
  optAll.value = '';
  optAll.textContent = typeof t === 'function' ? t('bookAll') : 'Todos los libros';
  bookSel.appendChild(optAll);
  bookSel.value = '';
  ensureCustomDropdown(bookSel);
}

// Exponer globalmente para que pueda ser llamada desde otros módulos
if (typeof window !== 'undefined') {
  window.refreshCategorySelect = refreshCategorySelect;
}

// Función para actualizar el selector de cantidad de preguntas según la categoría seleccionada
export function updateRoundsSelectorForCategory() {
  const categorySel = document.getElementById('categorySel');
  const roundsSel = document.getElementById('rounds');
  if (!categorySel || !roundsSel) return;
  
  // Restaurar opciones por defecto
  const currentValue = parseInt(roundsSel.value, 10);
  roundsSel.innerHTML = '';
  [5, 15, 30].forEach(n => {
    const option = document.createElement('option');
    option.value = n.toString();
    option.textContent = n.toString();
    if (n === currentValue || (n === 15 && !currentValue)) {
      option.selected = true;
    }
    roundsSel.appendChild(option);
  });
  ensureCustomDropdown(roundsSel);
}

export async function applyInitialUI(){
  // Inicializar i18n
  initI18n();
  
  // Aplicar traducciones a toda la UI
  updateI18nUI();
  
  document.documentElement.setAttribute('data-theme', SETTINGS.theme);
  bindProfileModal();
  bindDifficultyPills();
  // Cargar categorías ASAP para evitar UI vacía si algo falla después
  try { await refreshCategorySelect(); } catch(e){  }
  // Enlazar segmentos con tolerancia a errores
  try { bindModeSegment(); } catch(e){  }
  await refreshCategorySelect();
  updatePlayerXPBar();

  const currentLang = getLanguage();
  
  try {
    await warmLocalBank(currentLang);
    await refreshCategorySelect();
  } catch (e) {

    toast('No se pudieron cargar los packs locales');
  }
  
  // Asegurar que los elementos de configuración se muestren correctamente
  // después de que todo esté cargado
  setTimeout(() => {
    const modeSeg = document.getElementById('modeSeg');
    if (modeSeg) {
      const activeSeg = modeSeg.querySelector('.seg.active');
      if (activeSeg) {
        const mode = activeSeg.dataset.val || 'rounds';

        // Forzar la aplicación del modo inicial
        const wrapRounds = document.getElementById('roundsWrap');
        const categoryBookSection = document.getElementById('categoryBookSection');
        const spStartWrap = document.getElementById('spStartWrap');
        
        if (mode === 'rounds') {
          if (wrapRounds) wrapRounds.style.display = 'block';
          if (categoryBookSection) categoryBookSection.style.display = 'block';
          if (spStartWrap) spStartWrap.style.display = 'block';
        }
      }
    }
  }, 100);
}

export function renderStatsPage() {
    // Si existe la versión traducida, usarla
    if (window.renderStatsPageTranslated) {
        window.renderStatsPageTranslated();
        return;
    }
    
    // Código original como fallback
    const stats = getStats();
    const unlocked = getUnlockedAchievements();
    const statsContainer = document.getElementById('statsContainer');
    const achievementsContainer = document.getElementById('achievementsContainer');
    if (!statsContainer || !achievementsContainer) return;
    
    const accuracy = stats.questionsAnswered > 0 ? ((stats.questionsCorrect / stats.questionsAnswered) * 100).toFixed(1) : 0;
    const totalGames = stats.totalGamesPlayed || 0;
    const totalSec = stats.totalTimePlayedSeconds || 0;
    const totalTimeStr = totalSec >= 3600 ? `${Math.floor(totalSec / 3600)} h ${Math.floor((totalSec % 3600) / 60)} min` : `${Math.floor(totalSec / 60)} min`;

    statsContainer.innerHTML = `
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon">📅</div>
                <div class="stat-info">
                    <div class="stat-value">${stats.consecutiveDaysPlayed || 0}</div>
                    <div class="stat-label">Días Seguidos</div>
                    <div class="stat-detail">Jugando diariamente</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">🎯</div>
                <div class="stat-info">
                    <div class="stat-value">${accuracy}%</div>
                    <div class="stat-label">Precisión</div>
                    <div class="stat-detail">${stats.questionsCorrect}/${stats.questionsAnswered} correctas</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">⏱</div>
                <div class="stat-info">
                    <div class="stat-value">${totalTimeStr}</div>
                    <div class="stat-label">Tiempo Total</div>
                    <div class="stat-detail">Tiempo jugando</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">🔥</div>
                <div class="stat-info">
                    <div class="stat-value">${stats.longestCorrectStreak || 0}</div>
                    <div class="stat-label">Mejor Racha</div>
                    <div class="stat-detail">Respuestas seguidas</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">🏆</div>
                <div class="stat-info">
                    <div class="stat-value">${stats.level || 1}</div>
                    <div class="stat-label">Nivel Actual</div>
                    <div class="stat-detail">${stats.totalXP || 0} XP total</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">📊</div>
                <div class="stat-info">
                    <div class="stat-value">${totalGames}</div>
                    <div class="stat-label">Partidas Totales</div>
                    <div class="stat-detail">${stats.soloGamesPlayed || 0} partidas jugadas</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">⭐</div>
                <div class="stat-info">
                    <div class="stat-value">${stats.perfectGames || 0}</div>
                    <div class="stat-label">Partidas Perfectas</div>
                    <div class="stat-detail">Sin fallar ninguna</div>
                </div>
            </div>
        </div>
    `;
    
    // Nueva vista con iconos para los logros
    achievementsContainer.innerHTML = `
        <div class="achievements-grid-icons">
            ${ACHIEVEMENTS_LIST.map(ach => {
                const isUnlocked = unlocked.has(ach.id);
                const iconPath = ach.icon ? `assets/icons/${ach.icon}` : '';
                return `
                    <div class="achievement-icon-item ${isUnlocked ? 'unlocked' : 'locked'}" data-tooltip="${ach.description}">
                        <div class="achievement-icon-wrapper">
                            ${iconPath ? 
                                `<img src="${iconPath}" alt="${ach.title}" onerror="this.style.display='none'; this.parentElement.innerHTML='${isUnlocked ? '🏆' : '🔒'}';" />` : 
                                (isUnlocked ? '🏆' : '🔒')
                            }
                        </div>
                        <div class="achievement-icon-name">${ach.title}</div>
                        <div class="achievement-tooltip">${ach.description}</div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

export function bindStatsOpen() {
    const fsStats = document.getElementById('fsStats');
    const openBtn = document.getElementById('btnOpenStats');
    const backBtn = document.getElementById('backStats');
    const statsTabContent = document.getElementById('statsTabContent');

    if (openBtn) {
        openBtn.addEventListener('click', () => {
            if (fsStats) {
                fsStats.style.display = 'block';
                window.scrollTo(0, 0);
                if (statsTabContent) statsTabContent.style.display = 'block';
                renderStatsPage();
            }
        });
    }

    if (backBtn) {
        backBtn.addEventListener('click', () => {
            if (fsStats) fsStats.style.display = 'none';
        });
    }
}

