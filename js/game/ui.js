import { SETTINGS } from '../deprecated/store.js';
import { getBank, getBankCount, warmLocalBank, BASE_LABELS } from './bank.js';
import { getStats, getUnlockedAchievements } from '../player/stats.js';
import { getLevelProgress } from '../player/experience.js';
import { ACHIEVEMENTS_LIST } from '../player/achievements.js';
import { t, setLanguage, getLanguage, initI18n, updateUI as updateI18nUI } from '../core/i18n.js';

export function updateBankCount(){
  // Esta función ya no se usa para mostrar el badge en la página principal
  // Se mantiene por compatibilidad pero no hace nada visible
}

export function toast(msg){
  const el = document.getElementById('toast') || (()=> {
    const t = document.createElement('div');
    t.id = 'toast';
    t.style.cssText = 'position:fixed;left:50%;transform:translateX(-50%);bottom:20px;background:#2c3e50;color:#fff;padding:12px 16px;border-radius:10px;z-index:99999;display:none;box-shadow: 0 4px 10px rgba(0,0,0,0.2); font-weight: 600;';
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
    
    // Actualizar info del banco en el perfil con formato Base: X + Y packs
    if (profileBankInfo) {
        const bankObj = getBank();
        let baseCount = 0;
        let packCount = 0;
        
        // Contar preguntas base y de packs
        Object.entries(bankObj).forEach(([category, questions]) => {
            if (questions && Array.isArray(questions)) {
                questions.forEach(q => {
                    if (q && q.packId) {
                        packCount++;
                    } else {
                        baseCount++;
                    }
                });
            }
        });
        
        // Formatear texto
        if (packCount > 0) {
            profileBankInfo.textContent = `${t('base')}: ${baseCount} + ${packCount}`;
        } else {
            profileBankInfo.textContent = `${t('base')}: ${baseCount}`;
        }
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
          warmLocalBank(lang).then(() => {
            refreshCategorySelect();
            // Actualizar toda la UI sin recargar la página
            updateI18nUI();
            // Actualizar el badge del nivel con el nuevo idioma
            updatePlayerXPBar();
          });
        }
      });
    });
    
    // Theme radio buttons - clone and replace to remove old listeners
    document.querySelectorAll('input[name="theme"]').forEach(radio => {
      const newRadio = radio.cloneNode(true);
      // Preserve checked state
      newRadio.checked = radio.checked;
      radio.parentNode.replaceChild(newRadio, radio);
      
      newRadio.addEventListener('change', (e) => {
        e.stopPropagation();
        const theme = e.target.value;
        SETTINGS.theme = theme;
        localStorage.setItem('trivia_settings', JSON.stringify(SETTINGS));
        document.documentElement.setAttribute('data-theme', theme);
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
        localStorage.setItem('trivia_settings', JSON.stringify(SETTINGS));
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
        localStorage.setItem('trivia_settings', JSON.stringify(SETTINGS));
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
  const wrap = document.getElementById('diffPills');
  wrap?.querySelectorAll('.pill').forEach(p=>{
    p.addEventListener('click', ()=>{
      wrap.querySelectorAll('.pill').forEach(x=> x.classList.remove('active'));
      p.classList.add('active');
    });
  });
}

export function bindModeSegment(){
  const seg = document.getElementById('modeSeg'); if (!seg) return;
  const wrapRounds   = document.getElementById('roundsWrap');
  const wrapTime     = document.getElementById('timeWrap');
  const vsSection    = document.getElementById('vsSection');
  const vsRoundsWrap = document.getElementById('vsRoundsWrap');
  const vsActionArea = document.getElementById('vsActionArea');
  const vsHostActions= document.getElementById('vsHostActions');
  const vsJoinActions= document.getElementById('vsJoinActions');
  const vsHostExtras = document.getElementById('vsHostExtras');
  const diffSection  = document.getElementById('diffSection');
  const catSection   = document.getElementById('catSection');
  const spStartWrap  = document.getElementById('spStartWrap');

  const show = (el,on)=>{ if (el) el.style.display = on ? (el===vsHostExtras?'flex':'block') : 'none'; };

  function apply(val){
    const isVS = (val==='vs');
    const isAdventure = (val==='adventure');
    
    // Ocultar todo primero
    show(wrapRounds, false);
    show(wrapTime, false);
    show(vsSection, false);
    show(vsRoundsWrap, false);
    show(vsActionArea, false);
    show(vsHostActions, false);
    show(vsJoinActions, false);
    show(vsHostExtras, false);
    show(diffSection, false);
    show(catSection, false);
    show(spStartWrap, false);
    
    if (isAdventure) {
      // Modo aventura no necesita configuración adicional
      show(spStartWrap, true); // Solo mostrar el botón de empezar
    } else if (isVS) {
      // Modo VS
      show(vsSection, true);
      show(vsActionArea, true);
      show(vsRoundsWrap, true);
      show(vsHostActions, true);
      show(vsHostExtras, true);
    } else if (val === 'rounds') {
      // Modo rondas
      show(wrapRounds, true);
      show(diffSection, true);
      show(catSection, true);
      show(spStartWrap, true);
    } else if (val === 'timed') {
      // Modo contrarreloj
      show(wrapTime, true);
      show(diffSection, true);
      show(catSection, true);
      show(spStartWrap, true);
    }
  }

  seg.querySelectorAll('.seg').forEach(s=>{
    s.addEventListener('click', ()=>{
      seg.querySelectorAll('.seg').forEach(x=> x.classList.remove('active'));
      s.classList.add('active');
      apply(s.dataset.val);
    });
  });
  apply(seg.querySelector('.seg.active')?.dataset?.val || 'rounds');
}

export function bindVsToggle(){
  const toggle = document.getElementById('vsModeToggle'); if (!toggle) return;
  const vsSection    = document.getElementById('vsSection');
  const vsRoundsWrap = document.getElementById('vsRoundsWrap');
  const diffSection  = document.getElementById('diffSection');
  const catSection   = document.getElementById('catSection');
  const vsHostActions= document.getElementById('vsHostActions');
  const vsJoinActions= document.getElementById('vsJoinActions');
  const vsHostExtras = document.getElementById('vsHostExtras');

  const show = (el,on)=>{ if (el) el.style.display = on ? (el===vsHostExtras?'flex':'block') : 'none'; };

  function apply(val){
    const vsVisible = vsSection && vsSection.style.display !== 'none';
    if (!vsVisible) return;
    const isHost = (val==='host');
    show(vsRoundsWrap, isHost);
    show(diffSection,  isHost);
    show(catSection,   isHost);
    show(vsHostActions,isHost);
    show(vsHostExtras, isHost);
    show(vsJoinActions,!isHost);
  }

  toggle.querySelectorAll('.seg').forEach(s=>{
    s.addEventListener('click', ()=>{
      toggle.querySelectorAll('.seg').forEach(x=> x.classList.remove('active'));
      s.classList.add('active');
      apply(s.dataset.val || 'host');
    });
  });
  apply(toggle.querySelector('.seg.active')?.dataset?.val || 'host');
}

export function refreshCategorySelect(){
  const sel = document.getElementById('categorySel');
  if (!sel) return;
  const prev = sel.value;
  sel.innerHTML = '';

  const optAll = document.createElement('option');
  optAll.value = 'all'; 
  optAll.textContent = t('categoryAll');
  sel.appendChild(optAll);

  const groupBase = document.createElement('optgroup');
  groupBase.label = t('base');
  Object.keys(BASE_LABELS).forEach(k=>{
    const o = document.createElement('option');
    o.value = k; 
    o.textContent = t(k); // Usar traducción para la categoría
    groupBase.appendChild(o);
  });
  sel.appendChild(groupBase);
  try {
    const meta = JSON.parse(localStorage.getItem('trivia_owned_packs_meta') || '{}');
    const bankObj = getBank();
    const ids = new Set();
    Object.values(bankObj).forEach(arr => (arr||[]).forEach(q => { if (q && q.packId) ids.add(q.packId); }));
    const packs = Array.from(ids).map(id => ({ id, title: (meta[id] && meta[id].title) ? meta[id].title : id }));
    if (packs.length){
      const g = document.createElement('optgroup'); g.label = 'Packs instalados';
      packs.forEach(p=>{
        const o = document.createElement('option');
        o.value = `pack:${p.id}`;
        o.textContent = p.title;
        g.appendChild(o);
      });
      sel.appendChild(g);
    }
  } catch(e) { console.warn('[ui] refreshCategorySelect packs', e); }

  if (prev && [...sel.options].some(o=>o.value===prev)) sel.value = prev;
  else sel.value = 'all';
}

export async function applyInitialUI(){
  // Inicializar i18n
  initI18n();
  
  // Aplicar traducciones a toda la UI
  updateI18nUI();
  
  document.documentElement.setAttribute('data-theme', SETTINGS.theme);
  bindProfileModal();
  bindDifficultyPills();
  bindModeSegment();
  bindVsToggle();
  refreshCategorySelect();
  updateBankCount();
  updatePlayerXPBar();

  const currentLang = getLanguage();
  
  try {
    await warmLocalBank(currentLang);
    updateBankCount();
    refreshCategorySelect();
  } catch (e) {
    console.error('[packs] no se pudieron cargar', e);
    toast('No se pudieron cargar los packs locales');
  }
}

export function renderStatsPage() {
    const stats = getStats();
    const unlocked = getUnlockedAchievements();
    const statsContainer = document.getElementById('statsContainer');
    const achievementsContainer = document.getElementById('achievementsContainer');
    if (!statsContainer || !achievementsContainer) return;
    
    const accuracy = stats.questionsAnswered > 0 ? ((stats.questionsCorrect / stats.questionsAnswered) * 100).toFixed(1) : 0;
    
    // Calcular estadísticas adicionales
    const totalGames = stats.totalGamesPlayed || 0;
    const winRate = totalGames > 0 ? ((stats.vsGamesWon / totalGames) * 100).toFixed(1) : 0;
    
    statsContainer.innerHTML = `
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon">🎯</div>
                <div class="stat-info">
                    <div class="stat-value">${accuracy}%</div>
                    <div class="stat-label">Precisión</div>
                    <div class="stat-detail">${stats.questionsCorrect}/${stats.questionsAnswered} correctas</div>
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
                    <div class="stat-detail">${stats.soloGamesPlayed || 0} solo, ${stats.vsGamesWon || 0} VS ganadas</div>
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
            
            <div class="stat-card">
                <div class="stat-icon">📅</div>
                <div class="stat-info">
                    <div class="stat-value">${stats.consecutiveDaysPlayed || 0}</div>
                    <div class="stat-label">Días Seguidos</div>
                    <div class="stat-detail">Jugando diariamente</div>
                </div>
            </div>
        </div>
        
        <h4 style="margin-top: 24px; margin-bottom: 16px; font-weight: 800;">Estadísticas por Categoría</h4>
        <div class="category-stats">
            ${Object.entries(stats.correctByCategory || {}).map(([category, count]) => `
                <div class="category-stat-item">
                    <div class="category-stat-name">${category.charAt(0).toUpperCase() + category.slice(1)}</div>
                    <div class="category-stat-bar">
                        <div class="category-stat-fill" style="width: ${Math.min((count / 100) * 100, 100)}%"></div>
                    </div>
                    <div class="category-stat-count">${count}</div>
                </div>
            `).join('')}
        </div>
    `;
    
    // Nueva vista con iconos para los logros
    achievementsContainer.innerHTML = `
        <div class="achievements-grid-icons">
            ${ACHIEVEMENTS_LIST.map(ach => {
                const isUnlocked = unlocked.has(ach.id);
                const iconPath = ach.icon ? `Icons/${ach.icon}` : '';
                return `
                    <div class="achievement-icon-item ${isUnlocked ? 'unlocked' : 'locked'}" title="${ach.description}">
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
    
    if (openBtn) {
        openBtn.addEventListener('click', () => {
            if (fsStats) {
                fsStats.style.display = 'block';
                window.scrollTo(0, 0);
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

export function bindLeaderboardsOpen(renderLB){
  const fsLB = document.getElementById('fsLB');
  document.getElementById('btnOpenLB')?.addEventListener('click', async ()=>{
    fsLB.style.display='block';
    window.scrollTo(0,0);
    if (renderLB) await renderLB();
  });
  document.getElementById('backLB')?.addEventListener('click', ()=> fsLB.style.display='none');
}