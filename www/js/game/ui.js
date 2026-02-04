import { SETTINGS, persistSettings } from '../core/store.js';
import { getBank, getBankCount, warmLocalBank, BASE_LABELS, PACKS_BASE, SUPPORTED_LANGS } from './bank.js';
import { getStats, getUnlockedAchievements } from '../player/stats.js';
import { getLevelProgress } from '../player/experience.js';
import { ACHIEVEMENTS_LIST } from '../player/achievements.js';
import { t, setLanguage, getLanguage, initI18n, updateUI as updateI18nUI } from '../core/i18n.js';
import { populateBibleBookSelector } from './bible-study.js';

export function updateBankCount(){
  // Esta función ya no se usa para mostrar el badge en la página principal
  // Se mantiene por compatibilidad pero no hace nada visible
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
          warmLocalBank(lang).then(async () => {
            await refreshCategorySelect();
            populateBibleBookSelector();
            // Actualizar toda la UI sin recargar la página
            updateI18nUI();
            // Actualizar el badge del nivel con el nuevo idioma
            updatePlayerXPBar();
          });
        }
      });
    });
    
    // Theme selector removed - only one theme now

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

    // Group by category checkbox
    let chkGroupByCategory = document.getElementById('optGroupByCategory');
    if (chkGroupByCategory) {
      const newChk = chkGroupByCategory.cloneNode(true);
      newChk.checked = !!SETTINGS.groupByCategory;
      chkGroupByCategory.parentNode.replaceChild(newChk, chkGroupByCategory);
      chkGroupByCategory = newChk;
      
      chkGroupByCategory.addEventListener('change', (e) => {
        e.stopPropagation();
        SETTINGS.groupByCategory = e.target.checked;
        persistSettings();
        // Refrescar el selector de categorías para aplicar el cambio
        refreshCategorySelect();
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
  const catSection     = document.getElementById('catSection');
  const spStartWrap    = document.getElementById('spStartWrap');
  const spStartWrapWS  = document.getElementById('spStartWrapWS');

  const show = (el,on)=>{ if (el) el.style.display = on ? 'block' : 'none'; };

  function apply(val){
    if (val === 'rounds') {
      show(wrapRounds, true);
      show(wordsearchWrap, false);
      show(bibleStudyWrap, false);
      show(catSection, true);
      show(spStartWrap, true);
      show(spStartWrapWS, false);
    } else if (val === 'wordsearch') {
      show(wrapRounds, false);
      show(wordsearchWrap, true);
      show(bibleStudyWrap, false);
      show(catSection, false);
      show(spStartWrap, false);
      show(spStartWrapWS, true);
    } else if (val === 'bible') {
      show(wrapRounds, false);
      show(wordsearchWrap, false);
      show(bibleStudyWrap, true);
      show(catSection, false);
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

    // Grupo base
    const groupBase = document.createElement('optgroup');
    groupBase.label = (typeof t === 'function' ? t('base') : 'Base');
    const labels = BASE_LABELS || { movies:'Películas y series', geography:'Geografía', history:'Historia', science:'Ciencia', sports:'Deporte', anime:'Anime y Manga' };
    Object.keys(labels).forEach(k => {
      const o = document.createElement('option');
      o.value = k;
      o.textContent = (typeof t === 'function' ? t(k) : labels[k]);
      groupBase.appendChild(o);
    });
    sel.appendChild(groupBase);

    // Grupo packs disponibles según idioma (desde manifest.json)
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
            
            // Procesar TODOS los archivos del pack, no solo el primero
            files.forEach(fileName => {
              // Asegurar que el nombre del archivo tenga la extensión .json
              let normalizedFileName = fileName;
              if (normalizedFileName && !normalizedFileName.endsWith('.json')) {
                normalizedFileName = normalizedFileName + '.json';
              }
              
              // Usar el id del manifest como nombre de visualización
              // Si hay múltiples archivos, usar id + nombre del archivo
              let packName;
              if (pack.id) {
                if (files.length > 1) {
                  // Si hay múltiples archivos, mostrar id + nombre del archivo
                  const fileDisplayName = normalizedFileName.replace('.json', '').replace(/_/g, ' ').replace(/-/g, ' ');
                  packName = `${pack.id} - ${fileDisplayName}`;
                } else {
                  // Si solo hay un archivo, usar solo el id
                  packName = pack.id;
                }
              } else {
                // Fallback: generar nombre del archivo si no hay id
                packName = normalizedFileName.replace('.json', '').replace(/_/g, ' ').replace(/-/g, ' ');
                packName = packName.split(' ').map(word => 
                  word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' ');
              }
              
              // Si el pack tiene un título específico para este archivo, usarlo
              if (pack.title) {
                packName = pack.title;
              }
              
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
          });
          
          // Crear grupos por categoría o lista plana según configuración
          if (packsMap.size > 0) {
            const groupByCategory = SETTINGS.groupByCategory !== false; // Por defecto true
            
            if (groupByCategory) {
              // Agrupar por categoría
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
            } else {
              // Mostrar todos sin agrupar
              const g = document.createElement('optgroup');
              g.label = typeof t === 'function' ? t('categoryAll') : 'Todos los packs';
              
              packsMap.forEach((packs, category) => {
                packs.forEach(pack => {
                  const o = document.createElement('option');
                  o.value = `filepack:${lang}:${pack.fileName}`;
                  o.textContent = pack.name;
                  g.appendChild(o);
                });
              });
              
              sel.appendChild(g);
            }
          }
        }
      }
    } catch(e) {

    }

    // Grupo packs instalados (si hay)
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
    } catch(e) {

    }

    // Grupo packs creados por el usuario (si hay)
    try {
      const userPacks = JSON.parse(localStorage.getItem('userCreatedPacks') || '[]');
      if (userPacks.length > 0) {
        const g = document.createElement('optgroup');
        g.label = 'Packs Personalizados';
        userPacks.forEach((pack, index) => {
          const o = document.createElement('option');
          o.value = `userpack:${index}`;
          o.textContent = pack.name || `Pack ${index + 1}`;
          g.appendChild(o);
        });
        sel.appendChild(g);
      }
    } catch(e) {

    }
  } catch (e) {

    // Fallback absoluto si algo explota
    const optAll = document.createElement('option'); optAll.value = 'all'; optAll.textContent = 'Todas las categorías'; sel.appendChild(optAll);
    ;['movies','geography','history','science','sports','anime'].forEach(k => {
      const o = document.createElement('option'); o.value = k; o.textContent = k; sel.appendChild(o);
    });
  }

  if (prev && [...sel.options].some(o=>o.value===prev)) sel.value = prev;
  else sel.value = 'all';
  
  // Vincular evento para actualizar selector de cantidad cuando cambie la categoría
  if (!sel._hasCategoryListener) {
    sel.addEventListener('change', () => {
      updateRoundsSelectorForCategory();
    });
    sel._hasCategoryListener = true;
  }
  
  // Actualizar selector de cantidad inicialmente
  updateRoundsSelectorForCategory();
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
  
  const selectedCategory = categorySel.value;
  
  // Si es un pack personalizado, leer la cantidad de preguntas
  if (selectedCategory && selectedCategory.startsWith('userpack:')) {
    try {
      const packIndex = parseInt(selectedCategory.slice(9), 10);
      const userPacks = JSON.parse(localStorage.getItem('userCreatedPacks') || '[]');
      const pack = userPacks[packIndex];
      
      if (pack && pack.questions && Array.isArray(pack.questions)) {
        const maxQuestions = pack.questions.length;
        
        // Guardar el valor actual si es válido
        const currentValue = parseInt(roundsSel.value, 10);
        
        // Limpiar opciones existentes
        roundsSel.innerHTML = '';
        
        // Agregar opciones hasta el máximo disponible
        const availableOptions = [5, 15, 30].filter(n => n <= maxQuestions);
        
        // Si no hay opciones estándar que funcionen, agregar la cantidad exacta
        if (availableOptions.length === 0 && maxQuestions > 0) {
          const option = document.createElement('option');
          option.value = maxQuestions.toString();
          option.textContent = maxQuestions.toString();
          option.selected = true;
          roundsSel.appendChild(option);
        } else {
          availableOptions.forEach(n => {
            const option = document.createElement('option');
            option.value = n.toString();
            option.textContent = n.toString();
            // Seleccionar el valor actual si está disponible, o el más cercano
            if (n === currentValue || (n === availableOptions[availableOptions.length - 1] && currentValue > n)) {
              option.selected = true;
            }
            roundsSel.appendChild(option);
          });
          
          // Si el valor actual es mayor que el máximo, seleccionar el máximo
          if (currentValue > maxQuestions && availableOptions.length > 0) {
            roundsSel.value = availableOptions[availableOptions.length - 1].toString();
          }
        }
        
        return maxQuestions;
      }
    } catch(e) {

    }
  } else {
    // Para categorías normales, restaurar opciones por defecto
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
  }
  
  return null;
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
  updateBankCount();
  updatePlayerXPBar();

  const currentLang = getLanguage();
  
  try {
    await warmLocalBank(currentLang);
    updateBankCount();
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
        // La dificultad está ahora integrada en roundsWrap
        const catSection = document.getElementById('catSection');
        const spStartWrap = document.getElementById('spStartWrap');
        
        if (mode === 'rounds') {
          if (wrapRounds) wrapRounds.style.display = 'block';
          // La dificultad está integrada en roundsWrap
          if (catSection) catSection.style.display = 'block';
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

export function bindStatsOpen(renderLB) {
    const fsStats = document.getElementById('fsStats');
    const openBtn = document.getElementById('btnOpenStats');
    const backBtn = document.getElementById('backStats');
    
    // Manejar tabs de Estadísticas y Leaderboards
    const statsTab = document.querySelector('.stats-tab[data-tab="stats"]');
    const leaderboardsTab = document.querySelector('.stats-tab[data-tab="leaderboards"]');
    const statsTabContent = document.getElementById('statsTabContent');
    const leaderboardsTabContent = document.getElementById('leaderboardsTabContent');
    
    function switchTab(activeTab) {
        if (activeTab === 'stats') {
            if (statsTab) statsTab.classList.add('active');
            if (leaderboardsTab) leaderboardsTab.classList.remove('active');
            if (statsTabContent) statsTabContent.style.display = 'block';
            if (leaderboardsTabContent) leaderboardsTabContent.style.display = 'none';
            renderStatsPage();
        } else if (activeTab === 'leaderboards') {
            if (statsTab) statsTab.classList.remove('active');
            if (leaderboardsTab) leaderboardsTab.classList.add('active');
            if (statsTabContent) statsTabContent.style.display = 'none';
            if (leaderboardsTabContent) leaderboardsTabContent.style.display = 'block';
            if (renderLB) renderLB();
        }
    }
    
    if (statsTab) {
        statsTab.addEventListener('click', () => switchTab('stats'));
    }
    
    if (leaderboardsTab) {
        leaderboardsTab.addEventListener('click', () => switchTab('leaderboards'));
    }
    
    if (openBtn) {
        openBtn.addEventListener('click', () => {
            if (fsStats) {
                fsStats.style.display = 'block';
                window.scrollTo(0, 0);
                // Por defecto mostrar Estadísticas
                switchTab('stats');
            }
        });
    }
    
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            if (fsStats) fsStats.style.display = 'none';
        });
    }
}

// Mantener bindLeaderboardsOpen para compatibilidad, pero ahora está integrado en bindStatsOpen
export function bindLeaderboardsOpen(renderLB){
  // Ahora esto está integrado en bindStatsOpen, pero mantenemos la función por compatibilidad

}
