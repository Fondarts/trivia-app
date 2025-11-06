// js/adventure_map.js - Renderizado del mapa de aventura
(function(window) {
  'use strict';
  
  // Función helper para cache busting en URLs de imágenes
  function addCacheBust(url) {
    if (!url) return url;
    const separator = url.includes('?') ? '&' : '?';
    return url + separator + 'v=' + Date.now();
  }

  // Función toast simple para mostrar mensajes
  function showToast(message) {
    // Usar alert como fallback si no hay toast
    if (window.toast) {
      window.toast(message);
    } else {
      console.log('Toast:', message);
      // Crear un toast simple si no existe
      const toastEl = document.createElement('div');
      toastEl.textContent = message;
      toastEl.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        z-index: 10000;
        animation: slideUp 0.3s ease;
      `;
      document.body.appendChild(toastEl);
      setTimeout(() => toastEl.remove(), 3000);
    }
  }

  // Renderizar el mapa principal con las 6 regiones
  function renderAdventureMap() {
    const container = window.DOMOptimizer?.getCachedElement('adventureMapContainer') || 
                     document.getElementById('adventureMapContainer');
    const fsAdventure = window.DOMOptimizer?.getCachedElement('fsAdventure') || 
                       document.getElementById('fsAdventure');
    if (!container || !window.AdventureMode) return;
    
    const ADVENTURE_STATE = window.AdventureMode.ADVENTURE_STATE;
    const stats = window.AdventureMode.getAdventureStats();
    
    // Agregar header fijo si no existe (usar caché DOM)
    const header = fsAdventure.querySelector('.adventure-fixed-header');
    if (!header) {
      const newHeader = window.DOMOptimizer?.getOrCreateElement(
        'adventureFixedHeader',
        'div',
        fsAdventure,
        {
          className: 'adventure-fixed-header',
          insertBefore: fsAdventure.firstChild
        }
      ) || document.createElement('div');
      newHeader.className = 'adventure-fixed-header';
      newHeader.innerHTML = `
        <div class="adventure-header-inner">
          <div class="app-title">
            <img src="assets/logo/logo.png" alt="Quizlo!" class="app-logo"/>
            <span>Quizlo!</span>
          </div>
          <div class="adventure-header-buttons">
            <button class="iconbtn" id="btnDLCAdventure" title="Tienda de packs">
              <svg viewBox="0 0 512 512" width="22" height="22">
                <path fill="currentColor" d="M345.6 38.4v102.4h128V38.4h-128zm-102.4-25.6v76.8h51.2v51.2h51.2V12.8h-102.4zm-51.2 89.6v51.2h102.4v-25.6h-76.8v-25.6h-25.6zm307.2 51.2H171.5l25.6 179.2h238.1l51.2-179.2zM153.6 486.4c21.2 0 38.4-17.2 38.4-38.4s-17.2-38.4-38.4-38.4-38.4 17.2-38.4 38.4 17.2 38.4 38.4 38.4zm256 0c21.2 0 38.4-17.2 38.4-38.4s-17.2-38.4-38.4-38.4-38.4 17.2-38.4 38.4 17.2 38.4 38.4 38.4z"/>
              </svg>
            </button>
            <button class="iconbtn" id="btnFriendsAdventure" title="Amigos" style="position: relative;">
              <svg viewBox="0 0 24 24" width="22" height="22">
                <path fill="currentColor" d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
              </svg>
              <span class="notification-badge" id="friendsBadgeAdventure" style="display: none;">0</span>
            </button>
            <button class="iconbtn avatar-btn" id="btnProfileAdventure" aria-label="Perfil de Usuario">
              <img src="img/avatar_placeholder.svg" alt="Avatar"/>
            </button>
          </div>
        </div>
      `;
      fsAdventure.insertBefore(header, fsAdventure.firstChild);
      
      // Vincular eventos de los botones del header de aventura
      setTimeout(() => {
        // Botón de tienda
        const btnDLC = document.getElementById('btnDLCAdventure');
        if (btnDLC) {
          btnDLC.addEventListener('click', () => {
            // Cerrar modo aventura y abrir tienda
            document.getElementById('fsAdventure').style.display = 'none';
            document.getElementById('configCard').style.display = 'block';
            // Disparar evento de tienda si existe
            const mainDLCBtn = document.getElementById('btnDLC');
            if (mainDLCBtn) mainDLCBtn.click();
          });
        }
        
        // Botón de amigos
        const btnFriends = document.getElementById('btnFriendsAdventure');
        if (btnFriends) {
          btnFriends.addEventListener('click', () => {
            // Cerrar modo aventura y abrir amigos
            document.getElementById('fsAdventure').style.display = 'none';
            document.getElementById('configCard').style.display = 'block';
            // Disparar evento de amigos si existe
            const mainFriendsBtn = document.getElementById('btnFriends');
            if (mainFriendsBtn) mainFriendsBtn.click();
          });
        }
        
        // Botón de perfil
        const btnProfile = document.getElementById('btnProfileAdventure');
        if (btnProfile) {
          btnProfile.addEventListener('click', () => {
            // Cerrar modo aventura y abrir perfil
            document.getElementById('fsAdventure').style.display = 'none';
            document.getElementById('configCard').style.display = 'block';
            // Disparar evento de perfil si existe
            const mainProfileBtn = document.getElementById('btnProfile');
            if (mainProfileBtn) mainProfileBtn.click();
          });
        }
      }, 100);
    }
    
    container.innerHTML = `
      <div class="adventure-header">
        <h2>🗺️ Modo Aventura</h2>
        <div class="adventure-stats">
          <span class="stat-item">⭐ ${stats.totalStars}/${stats.maxStars}</span>
          <span class="stat-item">📍 ${stats.completedNodes}/${stats.totalNodes}</span>
          <span class="stat-item">🔓 ${stats.unlockedRegions}/${stats.totalRegions}</span>
        </div>
      </div>
      
      <div class="regions-grid">
        ${Object.entries(ADVENTURE_STATE.regions).map(([key, region], index) => {
          const isLocked = !region.unlocked && !window.godModeActive;  // Con God Mode, nunca está bloqueado
          const completedNodes = region.nodes.filter(n => n.completed).length;
          const totalStars = region.nodes.reduce((sum, n) => sum + n.stars, 0);
          
          return `
            <div class="region-card ${isLocked ? 'locked' : 'unlocked'} ${window.godModeActive && !region.unlocked ? 'god-mode-access' : ''}" 
                 data-region="${key}"
                 onclick="window.enterAdventureRegion('${key}')">
              <div class="region-icon">${region.icon}</div>
              <div class="region-name">${region.name}</div>
              <div class="region-progress">
                ${isLocked ? 
                  '<span class="locked-text">🔒 Bloqueado</span>' :
                  `
                    <div class="progress-bar">
                      <div class="progress-fill" style="width: ${(completedNodes/8)*100}%"></div>
                    </div>
                    <span class="progress-text">${completedNodes}/8 · ⭐${totalStars}/24</span>
                  `
                }
              </div>
              ${!isLocked && completedNodes === 8 ? '<div class="region-complete">✅ Completo</div>' : ''}
              ${window.godModeActive && !region.unlocked ? '<div class="god-mode-indicator">👁️</div>' : ''}
            </div>
          `;
        }).join('')}
      </div>
      
      <div class="adventure-actions">
        <button class="btn secondary" onclick="window.exitAdventureMode()">Volver al Menú</button>
      </div>
    `;
    
    // Mostrar banner en el mapa de aventura (solo si no está ya visible)
    if (window.unifiedBanner && !window.unifiedBanner.isBannerVisible()) {
      setTimeout(async () => {
        console.log('🔄 Intentando mostrar banner en mapa de aventura...');
        const success = await window.unifiedBanner.showBanner();
        if (success) {
          console.log('✅ Banner mostrado en mapa de aventura');
        } else {
          console.log('❌ Fallo al mostrar banner en mapa de aventura');
        }
      }, 2000); // Aumentar delay para evitar conflictos
    }
  }

  // Función para vincular los botones del header de aventura
  function bindAdventureHeaderButtons() {
    // Usar caché DOM para botones frecuentes
    const btnDLC = window.DOMOptimizer?.getCachedElement('btnDLCAdventure') || 
                   document.getElementById('btnDLCAdventure');
    if (btnDLC) {
      btnDLC.addEventListener('click', () => {
        // Cerrar modo aventura y abrir tienda (usar caché DOM)
        const fsAdventure = window.DOMOptimizer?.getCachedElement('fsAdventure') || 
                           document.getElementById('fsAdventure');
        const configCard = window.DOMOptimizer?.getCachedElement('configCard') || 
                          document.getElementById('configCard');
        if (fsAdventure) fsAdventure.style.display = 'none';
        if (configCard) configCard.style.display = 'block';
        const mainDLCBtn = window.DOMOptimizer?.getCachedElement('btnDLC') || 
                          document.getElementById('btnDLC');
        if (mainDLCBtn) mainDLCBtn.click();
      });
    }
    
    // Botón de amigos (usar caché DOM)
    const btnFriends = window.DOMOptimizer?.getCachedElement('btnFriendsAdventure') || 
                      document.getElementById('btnFriendsAdventure');
    if (btnFriends) {
      btnFriends.addEventListener('click', () => {
        const fsAdventure = window.DOMOptimizer?.getCachedElement('fsAdventure') || 
                          document.getElementById('fsAdventure');
        const configCard = window.DOMOptimizer?.getCachedElement('configCard') || 
                          document.getElementById('configCard');
        if (fsAdventure) fsAdventure.style.display = 'none';
        if (configCard) configCard.style.display = 'block';
        const mainFriendsBtn = window.DOMOptimizer?.getCachedElement('btnFriends') || 
                              document.getElementById('btnFriends');
        if (mainFriendsBtn) mainFriendsBtn.click();
      });
    }
    
    // Botón de perfil (usar caché DOM)
    const btnProfile = window.DOMOptimizer?.getCachedElement('btnProfileAdventure') || 
                      document.getElementById('btnProfileAdventure');
    if (btnProfile) {
      btnProfile.addEventListener('click', () => {
        const fsAdventure = window.DOMOptimizer?.getCachedElement('fsAdventure') || 
                          document.getElementById('fsAdventure');
        const configCard = window.DOMOptimizer?.getCachedElement('configCard') || 
                          document.getElementById('configCard');
        if (fsAdventure) fsAdventure.style.display = 'none';
        if (configCard) configCard.style.display = 'block';
        const mainProfileBtn = window.DOMOptimizer?.getCachedElement('btnProfile') || 
                             document.getElementById('btnProfile');
        if (mainProfileBtn) mainProfileBtn.click();
      });
    }
  }

  // Renderizar los nodos de una región
  function renderRegionNodes(regionKey) {
    // Usar caché DOM para elementos frecuentes
    const container = window.DOMOptimizer?.getCachedElement('adventureMapContainer') || 
                     document.getElementById('adventureMapContainer');
    const fsAdventure = window.DOMOptimizer?.getCachedElement('fsAdventure') || 
                       document.getElementById('fsAdventure');
    if (!container || !window.AdventureMode) return;
    
    const ADVENTURE_STATE = window.AdventureMode.ADVENTURE_STATE;
    const region = ADVENTURE_STATE.regions[regionKey];
    if (!region) {
      console.error('Región no encontrada:', regionKey);
      return;
    }
    
    console.log('Renderizando región:', regionKey, region);
    
    // Agregar header fijo si no existe (optimizado con caché DOM)
    const header = fsAdventure.querySelector('.adventure-fixed-header');
    if (!header) {
      const newHeader = window.DOMOptimizer?.getOrCreateElement(
        'adventureFixedHeader',
        'div',
        fsAdventure,
        {
          className: 'adventure-fixed-header',
          insertBefore: fsAdventure.firstChild
        }
      ) || document.createElement('div');
      newHeader.className = 'adventure-fixed-header';
      newHeader.innerHTML = `
        <div class="adventure-header-inner">
          <div class="app-title">
            <img src="assets/logo/logo.png" alt="Quizlo!" class="app-logo"/>
            <span>Quizlo!</span>
          </div>
          <div class="adventure-header-buttons">
            <button class="iconbtn" id="btnDLCAdventure" title="Tienda de packs">
              <svg viewBox="0 0 512 512" width="22" height="22">
                <path fill="currentColor" d="M345.6 38.4v102.4h128V38.4h-128zm-102.4-25.6v76.8h51.2v51.2h51.2V12.8h-102.4zm-51.2 89.6v51.2h102.4v-25.6h-76.8v-25.6h-25.6zm307.2 51.2H171.5l25.6 179.2h238.1l51.2-179.2zM153.6 486.4c21.2 0 38.4-17.2 38.4-38.4s-17.2-38.4-38.4-38.4-38.4 17.2-38.4 38.4 17.2 38.4 38.4 38.4zm256 0c21.2 0 38.4-17.2 38.4-38.4s-17.2-38.4-38.4-38.4-38.4 17.2-38.4 38.4 17.2 38.4 38.4 38.4z"/>
              </svg>
            </button>
            <button class="iconbtn" id="btnFriendsAdventure" title="Amigos" style="position: relative;">
              <svg viewBox="0 0 24 24" width="22" height="22">
                <path fill="currentColor" d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
              </svg>
              <span class="notification-badge" id="friendsBadgeAdventure" style="display: none;">0</span>
            </button>
            <button class="iconbtn avatar-btn" id="btnProfileAdventure" aria-label="Perfil de Usuario">
              <img src="img/avatar_placeholder.svg" alt="Avatar"/>
            </button>
          </div>
        </div>
      `;
      if (!fsAdventure.contains(newHeader)) {
        fsAdventure.insertBefore(newHeader, fsAdventure.firstChild);
      }
      
      // Vincular eventos de los botones del header de aventura (optimizado)
      window.DOMOptimizer?.queueDOMOperation(() => {
        bindAdventureHeaderButtons();
      }, 'normal') || setTimeout(() => {
        bindAdventureHeaderButtons();
      }, 100);
    }
    
    // Optimización: Reutilizar contenedor de región si existe
    const existingWrapper = container.querySelector('.region-wrapper');
    
    // Posiciones del camino específicas por región
    const regionPositions = {
      // Posiciones por defecto (genéricas)
      default: [
        { x: 50, y: 90 },  // Nodo 1 - Inicio abajo centro
        { x: 70, y: 78 },  // Nodo 2 - Derecha
        { x: 30, y: 66 },  // Nodo 3 - Izquierda  
        { x: 65, y: 54 },  // Nodo 4 - Derecha
        { x: 35, y: 42 },  // Nodo 5 - Izquierda
        { x: 70, y: 30 },  // Nodo 6 - Derecha
        { x: 30, y: 18 },  // Nodo 7 - Izquierda
        { x: 50, y: 8 },   // Nodo 8 - BOSS arriba centro
      ],
      // Posiciones específicas para geografía (ajustadas según mediciones del usuario)
      geography: [
        { x: 47, y: 70 },  // Nodo 1 - Medido desde DevTools
        { x: 50, y: 59 },  // Nodo 2 - Medido desde DevTools
        { x: 40, y: 52 },  // Nodo 3 - Medido desde DevTools
        { x: 52, y: 44 },  // Nodo 4 - Medido desde DevTools
        { x: 42, y: 35 },  // Nodo 5 - Medido desde DevTools
        { x: 50, y: 29 },  // Nodo 6 - Medido desde DevTools
        { x: 43, y: 22 },  // Nodo 7 - Medido desde DevTools
        { x: 50, y: 14 },  // Nodo 8 - BOSS - Medido desde DevTools
      ]
    };
    
    // Seleccionar posiciones según la región
    const pathPositions = regionPositions[regionKey] || regionPositions.default;
    
    // Crear HTML con template strings correctos
    let mapStyle = '';
    // No aplicar el estilo inline aquí, lo haremos después
    
    const currentLives = window.AdventureMode?.ADVENTURE_STATE?.lives || 5;
    container.innerHTML = `
      <div class="region-wrapper">
        <div class="map-info">
          <div class="map-title" style="padding-left:15px">${region.name}</div>
          <div class="lives" style="padding-right:15px">
            ${Array(5).fill(0).map((_, i) => 
              `<span class="heart ${i < currentLives ? 'active' : 'lost'}">❤️</span>`
            ).join('')}
          </div>
        </div>
        
        <div class="map-container">
          <div class="region-map" id="regionMapDiv" style="${mapStyle}">
            <img id="regionBg" class="region-bg" alt="map" src=""/>
            <div class="nodes-container">
              <div id="playerMarker" class="player-marker" style="display:none" onclick="window.handlePlayerMarkerClick('${regionKey}')"><img id="playerMarkerImg" src="img/avatar_placeholder.svg" alt="avatar"/></div>
          ${region.nodes.map((node, index) => {
            const pos = pathPositions[index];
            const isGodMode = window.godModeActive || false;
            const canPlayNormally = index === 0 || (index > 0 && region.nodes[index - 1].completed);
            const canPlay = isGodMode || canPlayNormally;
            const isCurrent = !node.completed && canPlayNormally && !isGodMode;
            const isLocked = !canPlay && !isGodMode;
            
            // Calcular posición relativa al mapa de fondo (se calculará después de que la imagen cargue)
            // Por ahora usar pos.x y pos.y como data attributes para calcular después
            return `
              <div class="adventure-node ${node.completed ? 'completed' : ''} 
                          ${isCurrent ? 'current' : ''} 
                          ${isLocked ? 'locked' : ''}
                          ${isGodMode && !node.completed ? 'god-mode clickable' : ''}
                          ${node.type}"
                   style="cursor: ${canPlay ? 'pointer' : 'not-allowed'};"
                   data-map-x="${pos.x}"
                   data-map-y="${pos.y}"
                   onclick="window.handleNodeClick('${regionKey}', ${index})"
                   data-node-index="${index}">
                
                <div class="node-icon">
                  ${node.type === 'boss' ? '👺' : 
                    node.completed ? '✅' : `${index + 1}`}
                </div>
                
                ${node.completed ? `
                  <div class="node-stars">
                    ${'⭐'.repeat(node.stars)}${'☆'.repeat(3 - node.stars)}
                  </div>
                ` : ''}
                
                ${isCurrent ? '<div class="current-indicator">▼</div>' : ''}
                ${isGodMode && !node.completed ? '<div class="god-indicator">👁️</div>' : ''}
              </div>
            `;
          }).join('')}
              <!-- SVG para animaciones de progreso -->
              <svg class="progress-links" viewBox="0 0 100 100" preserveAspectRatio="none"></svg>
            </div>
          </div>
        </div>
        
        <div class="map-controls">
          <button class="btn-control" onclick="window.exitAdventureMode()">← Volver</button>
          <button class="btn-control" onclick="window.resetAdventureProgress()" title="Reset">🔄 Reset</button>
          <button class="btn-control" onclick="window.toggleGodMode()" id="godModeBtn" title="God Mode">🔓 God</button>
        </div>
      </div>
    `;
    
    // Aplicar imagen de fondo después de renderizar (optimizado: agrupar operaciones DOM)
    window.DOMOptimizer?.batchSetTimeout([
      () => {
        const mapDiv = window.DOMOptimizer?.getCachedElement('regionMapDiv', container) || 
                      document.getElementById('regionMapDiv');
        if (mapDiv && region.mapImage) {
          const imagePath = region.mapImage.replace('./', '');
          window.DOMOptimizer?.updateElement(mapDiv, {
            style: {
              backgroundImage: `url('${imagePath}')`,
              backgroundSize: 'contain',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }
          }) || (mapDiv.style.cssText += `background-image: url('${imagePath}') !important; background-size: contain !important; background-position: center !important; background-repeat: no-repeat !important;`);
          
          console.log('Imagen aplicada al mapa:', imagePath);
          
          // Verificar que la imagen existe
          const testImg = new Image();
          testImg.src = imagePath;
          testImg.onload = () => {
            console.log('✅ Imagen cargada correctamente:', imagePath);
          };
          testImg.onerror = () => {
            console.error('❌ Error cargando imagen:', imagePath);
            const altPath = './' + imagePath;
            console.log('Intentando ruta alternativa:', altPath);
            mapDiv.style.backgroundImage = `url('${altPath}')`;
          };
        }
      }
    ], 100, 0) || setTimeout(() => {
      const mapDiv = document.getElementById('regionMapDiv');
      if (mapDiv && region.mapImage) {
        const imagePath = region.mapImage.replace('./', '');
        mapDiv.style.cssText += `background-image: url('${imagePath}') !important; background-size: contain !important; background-position: center !important; background-repeat: no-repeat !important;`;
        console.log('Imagen aplicada al mapa:', imagePath);
        
        const testImg = new Image();
        testImg.src = imagePath;
        testImg.onload = () => {
          console.log('✅ Imagen cargada correctamente:', imagePath);
        };
        testImg.onerror = () => {
          console.error('❌ Error cargando imagen:', imagePath);
          const altPath = './' + imagePath;
          mapDiv.style.backgroundImage = `url('${altPath}')`;
        };
      }
    }, 100);

    // Helpers para posicionar marcador con offset lateral
    function getNodePercentPosition(index) {
      // Usar las mismas posiciones específicas por región que se usan para renderizar
      const regionPositions = {
        default: [
          { x: 50, y: 90 },{ x: 70, y: 78 },{ x: 30, y: 66 },{ x: 65, y: 54 },
          { x: 35, y: 42 },{ x: 70, y: 30 },{ x: 30, y: 18 },{ x: 50, y: 8 }
        ],
        geography: [
          { x: 47, y: 70 },{ x: 50, y: 59 },{ x: 40, y: 52 },{ x: 52, y: 44 },
          { x: 42, y: 35 },{ x: 50, y: 29 },{ x: 43, y: 22 },{ x: 50, y: 14 }
        ]
      };
      const positions = regionPositions[regionKey] || regionPositions.default;
      return positions[index];
    }

    // Función para calcular posiciones relativas al mapa de fondo (no al contenedor)
    // El CSS usa background-size: auto 100% (fit vertical) o object-fit: contain
    // Hacerla accesible globalmente para que animatePlayerMarkerTo pueda usarla
    window.calculateMapRelativePosition = function(percentX, percentY) {
      const mapDiv = document.getElementById('regionMapDiv');
      const bgImg = document.getElementById('regionBg');
      
      if (!mapDiv) {
        // Fallback: usar porcentaje del contenedor si no hay div
        return { x: percentX, y: percentY, isRelative: false };
      }
      
      // Obtener dimensiones del contenedor
      const containerWidth = mapDiv.offsetWidth;
      const containerHeight = mapDiv.offsetHeight;
      
      if (containerWidth === 0 || containerHeight === 0) {
        // Contenedor no tiene dimensiones aún
        return { x: percentX, y: percentY, isRelative: false };
      }
      
      // Priorizar usar el elemento <img> si está disponible y tiene dimensiones
      // El <img> tiene object-fit: contain, así que sus dimensiones renderizadas son las del mapa visible
      let mapVisibleWidth, mapVisibleHeight, offsetX, offsetY;
      
      if (bgImg && bgImg.complete && bgImg.naturalWidth && bgImg.naturalHeight) {
        // Usar las dimensiones renderizadas del elemento <img> (que ya tiene object-fit: contain aplicado)
        // Usar offsetWidth/offsetHeight en lugar de getBoundingClientRect para posiciones relativas al contenedor
        const imgWidth = bgImg.offsetWidth;
        const imgHeight = bgImg.offsetHeight;
        
        if (imgWidth > 0 && imgHeight > 0) {
          // El <img> ya está escalado y posicionado correctamente por CSS
          // El CSS usa left: 50%, transform: translateX(-50%), así que está centrado
          mapVisibleWidth = imgWidth;
          mapVisibleHeight = imgHeight;
          offsetX = (containerWidth - mapVisibleWidth) / 2;
          offsetY = 0; // El CSS usa height: 100%, top: 0, así que está alineado arriba
        } else {
          // Fallback: calcular desde las dimensiones naturales
          const naturalImgWidth = bgImg.naturalWidth;
          const naturalImgHeight = bgImg.naturalHeight;
          const imgAspectRatio = naturalImgWidth / naturalImgHeight;
          const containerAspectRatio = containerWidth / containerHeight;
          
          if (containerAspectRatio > imgAspectRatio) {
            mapVisibleHeight = containerHeight;
            mapVisibleWidth = containerHeight * imgAspectRatio;
            offsetX = (containerWidth - mapVisibleWidth) / 2;
            offsetY = 0;
          } else {
            mapVisibleWidth = containerWidth;
            mapVisibleHeight = containerWidth / imgAspectRatio;
            offsetX = 0;
            offsetY = (containerHeight - mapVisibleHeight) / 2;
          }
        }
      } else {
        // No hay imagen cargada, usar porcentaje del contenedor
        return { x: percentX, y: percentY, isRelative: false };
      }
      
      // Convertir porcentajes del mapa a píxeles absolutos
      const absoluteX = offsetX + (mapVisibleWidth * percentX / 100);
      const absoluteY = offsetY + (mapVisibleHeight * percentY / 100);
      
      // Convertir a porcentaje del contenedor
      const containerPercentX = (absoluteX / containerWidth) * 100;
      const containerPercentY = (absoluteY / containerHeight) * 100;
      
      return { 
        x: containerPercentX, 
        y: containerPercentY, 
        isRelative: true,
        mapVisibleWidth,
        mapVisibleHeight,
        offsetX,
        offsetY
      };
    }

    function placeMarkerAt(index, opts = {}) {
      const pos = getNodePercentPosition(index);
      const marker = document.getElementById('playerMarker');
      if (!pos || !marker) return;

      // Calcular posición relativa al mapa de fondo
      const calculatedPos = calculateMapRelativePosition(pos.x, pos.y);
      
      // Offset lateral: avatar a la derecha y un poco abajo para pisar el círculo
      const offsetXPct = opts.offsetXPct ?? 5; // 5% del ancho del contenedor
      const offsetYPct = opts.offsetYPct ?? 2; // 2% del alto del contenedor
      
      marker.style.left = (calculatedPos.x + offsetXPct) + '%';
      marker.style.top = (calculatedPos.y + offsetYPct) + '%';
      marker.style.display = 'block';
    }

    // Función para actualizar posiciones de nodos relativas al mapa de fondo
    function updateNodePositions() {
      const nodes = container.querySelectorAll('.adventure-node');
      nodes.forEach(node => {
        const mapX = parseFloat(node.getAttribute('data-map-x'));
        const mapY = parseFloat(node.getAttribute('data-map-y'));
        if (!isNaN(mapX) && !isNaN(mapY)) {
          const calculatedPos = calculateMapRelativePosition(mapX, mapY);
          node.style.left = calculatedPos.x + '%';
          node.style.top = calculatedPos.y + '%';
        }
      });
    }

    // Actualizar posiciones cuando la imagen del mapa cargue
    const bgImg = document.getElementById('regionBg');
    const mapDiv = document.getElementById('regionMapDiv');
    
    function updatePositionsWhenReady() {
      // Esperar a que el contenedor y la imagen tengan dimensiones
      if (mapDiv && mapDiv.offsetWidth > 0 && mapDiv.offsetHeight > 0) {
        if (bgImg && bgImg.complete && bgImg.naturalWidth > 0) {
          // Imagen cargada, actualizar posiciones
          updateNodePositions();
          
          // También actualizar el marcador del jugador
          const currentIndex = region.nodes.findIndex(n => !n.completed);
          const idx = currentIndex === -1 ? region.nodes.length - 1 : currentIndex;
          placeMarkerAt(idx);
        } else if (bgImg) {
          // Esperar a que la imagen cargue
          bgImg.addEventListener('load', () => {
            setTimeout(updatePositionsWhenReady, 100);
          }, { once: true });
        }
      } else {
        // Esperar un poco más para que el DOM se renderice
        setTimeout(updatePositionsWhenReady, 100);
      }
    }
    
    // Iniciar actualización de posiciones
    setTimeout(updatePositionsWhenReady, 200);
    
    // También actualizar en resize del window
    let resizeTimeout;
    const resizeHandler = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        updateNodePositions();
        const currentIndex = region.nodes.findIndex(n => !n.completed);
        const idx = currentIndex === -1 ? region.nodes.length - 1 : currentIndex;
        placeMarkerAt(idx);
      }, 250);
    };
    window.addEventListener('resize', resizeHandler);
    
    // Guardar el handler para poder limpiarlo después si es necesario
    window._mapResizeHandler = resizeHandler;

    // Posicionar el marcador del jugador en el nodo actual (optimizado)
    try {
      const marker = window.DOMOptimizer?.getCachedElement('playerMarker', container) || 
                    document.getElementById('playerMarker');
      const markerImg = window.DOMOptimizer?.getCachedElement('playerMarkerImg', container) || 
                       document.getElementById('playerMarkerImg');
      if (marker) {
        // intentar usar avatar real si está disponible
        if (window.getCurrentUser) {
          const u = window.getCurrentUser();
          if (u && u.avatar) markerImg.src = u.avatar;
        }
        const currentIndex = region.nodes.findIndex(n => !n.completed);
        const idx = currentIndex === -1 ? region.nodes.length - 1 : currentIndex; // último si completó todos
        // Esperar a que la imagen cargue antes de posicionar
        if (bgImg && bgImg.complete && bgImg.naturalWidth) {
          placeMarkerAt(idx);
        } else if (bgImg) {
          bgImg.addEventListener('load', () => {
            placeMarkerAt(idx);
          }, { once: true });
        } else {
          placeMarkerAt(idx);
        }
      }
    } catch {}

    // Cargar imagen de fondo como <img> (optimizado: agrupar setTimeout)
    window.DOMOptimizer?.batchSetTimeout([
      () => {
        const bg = window.DOMOptimizer?.getCachedElement('regionBg', container) || 
                  document.getElementById('regionBg');
        if (!bg || !region.mapImage) return;

        const base = region.mapImage.replace(/^\.\//, '');
        const candidates = [base, `./${base}`];
        console.log('Cargando fondo región', regionKey, 'mapImage:', region.mapImage, 'candidatos:', candidates);
        let i = 0;
        const next = () => {
          if (i >= candidates.length) return;
          const url = addCacheBust(candidates[i++]);
          const probe = new Image();
          probe.onload = () => { 
            window.DOMOptimizer?.updateElement(bg, {
              attributes: { src: url },
              style: { opacity: '1' }
            }) || (bg.src = url);
            console.log('Mapa cargado:', regionKey, url); 
          };
          probe.onerror = next;
          probe.src = url;
        };
        next();
      },
      () => {
        const mapDiv = window.DOMOptimizer?.getCachedElement('regionMapDiv', container) || 
                      document.getElementById('regionMapDiv');
        if (!mapDiv || !region.mapImage) return;

        const base = region.mapImage.replace(/^\.\//, '');
        const candidates = [base, `./${base}`];

        const tryLoad = (idx = 0) => {
          if (idx >= candidates.length) return;
          const url = addCacheBust(candidates[idx]);
          const img = new Image();
          img.onload = () => {
            window.DOMOptimizer?.updateElement(mapDiv, {
              style: {
                backgroundImage: `url('${url}')`,
                backgroundSize: 'contain',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
              }
            }) || (
              mapDiv.style.setProperty('background-image', `url('${url}')`, 'important'),
              mapDiv.style.setProperty('background-size', 'contain', 'important'),
              mapDiv.style.setProperty('background-position', 'center', 'important'),
              mapDiv.style.setProperty('background-repeat', 'no-repeat', 'important')
            );
            console.log('Fondo (parche) aplicado:', regionKey, url);
          };
          img.onerror = () => tryLoad(idx + 1);
          img.src = url;
        };

        tryLoad(0);
      }
    ], 120, 130) || (
      setTimeout(() => {
        const bg = document.getElementById('regionBg');
        if (!bg || !region.mapImage) return;
        const base = region.mapImage.replace(/^\.\//, '');
        const candidates = [base, `./${base}`];
        let i = 0;
        const next = () => {
          if (i >= candidates.length) return;
          const url = addCacheBust(candidates[i++]);
          const probe = new Image();
          probe.onload = () => { bg.src = url; bg.style.opacity = '1'; };
          probe.onerror = next;
          probe.src = url;
        };
        next();
      }, 120),
      setTimeout(() => {
        const mapDiv = document.getElementById('regionMapDiv');
        if (!mapDiv || !region.mapImage) return;
        const base = region.mapImage.replace(/^\.\//, '');
        const candidates = [base, `./${base}`];
        const tryLoad = (idx = 0) => {
          if (idx >= candidates.length) return;
          const url = addCacheBust(candidates[idx]);
          const img = new Image();
          img.onload = () => {
            mapDiv.style.setProperty('background-image', `url('${url}')`, 'important');
            mapDiv.style.setProperty('background-size', 'contain', 'important');
            mapDiv.style.setProperty('background-position', 'center', 'important');
            mapDiv.style.setProperty('background-repeat', 'no-repeat', 'important');
          };
          img.onerror = () => tryLoad(idx + 1);
          img.src = url;
        };
        tryLoad(0);
      }, 250)
    );
  }

  // Funciones globales
  window.renderAdventureMap = renderAdventureMap;
  window.renderRegionNodes = renderRegionNodes;

  window.resetAdventureProgress = function() {
    if (!confirm('¿Seguro que quieres reiniciar todo tu progreso de aventura?')) return;
    
    if (window.AdventureMode) {
      window.AdventureMode.resetAdventureProgress();
      // Volver a renderizar el mapa
      renderRegionNodes('movies');
    }
  };

  window.enterAdventureRegion = function(regionKey) {
    const ADVENTURE_STATE = window.AdventureMode.ADVENTURE_STATE;
    // Con God Mode activo, siempre permitir acceso
    if (window.godModeActive || ADVENTURE_STATE.regions[regionKey].unlocked) {
      if (window.AdventureMode) {
        // Actualizar currentRegion antes de iniciar
        ADVENTURE_STATE.currentRegion = regionKey;
        window.AdventureMode.saveAdventureProgress();
        renderRegionNodes(regionKey);
      }
    } else {
      showToast('🔒 Esta región aún no está desbloqueada');
    }
  };

  window.backToAdventureMap = function() {
    renderAdventureMap();
  };

  window.exitAdventureMode = function() {
    document.getElementById('fsAdventure').style.display = 'none';
    document.getElementById('configCard').style.display = 'block';
  };

  // Variable global para God Mode
  window.godModeActive = false;
  
  // Toggle God Mode con popup de selección
  window.toggleGodMode = function() {
    window.godModeActive = !window.godModeActive;
    const btn = document.getElementById('godModeBtn');
    if (btn) {
      btn.textContent = window.godModeActive ? '🔓 God ON' : '🔒 God';
      btn.classList.toggle('active', window.godModeActive);
    }
    
    if (window.godModeActive) {
      // Mostrar popup de selección de región
      showGodModeRegionSelector();
    } else {
      showToast('🔒 God Mode DESACTIVADO');
      // Re-renderizar para actualizar la vista
      updateCurrentView();
    }
  };
  
  // Mostrar selector de regiones para God Mode
  function showGodModeRegionSelector() {
    const ADVENTURE_STATE = window.AdventureMode.ADVENTURE_STATE;
    
    // Crear overlay
    const overlay = document.createElement('div');
    overlay.id = 'godModeOverlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.8);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: fadeIn 0.3s ease;
    `;
    
    // Crear panel
    const panel = document.createElement('div');
    panel.style.cssText = `
      background: var(--card);
      border: 2px solid var(--accent);
      border-radius: 20px;
      padding: 30px;
      max-width: 90%;
      max-height: 80%;
      overflow-y: auto;
      animation: slideUp 0.3s ease;
    `;
    
    // Contenido del panel
    panel.innerHTML = `
      <h2 style="text-align: center; margin: 0 0 20px; color: var(--accent);">
        👁️ God Mode - Selector de Mundos
      </h2>
      <p style="text-align: center; color: var(--muted); margin-bottom: 20px;">
        Elige a qué mundo quieres ir:
      </p>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
        ${Object.entries(ADVENTURE_STATE.regions).map(([key, region]) => `
          <button 
            class="god-mode-region-btn" 
            onclick="window.godModeGoToRegion('${key}')"
            style="
              padding: 20px;
              background: ${region.unlocked ? 'var(--accent)' : 'var(--cardBorder)'};
              color: white;
              border: none;
              border-radius: 15px;
              cursor: pointer;
              transition: all 0.3s ease;
              text-align: center;
            "
            onmouseover="this.style.transform='scale(1.05)'"
            onmouseout="this.style.transform='scale(1)'">
            <div style="font-size: 40px; margin-bottom: 10px;">${region.icon}</div>
            <div style="font-weight: bold; font-size: 16px;">${region.name}</div>
            <div style="font-size: 12px; margin-top: 5px; opacity: 0.9;">
              ${region.unlocked ? '🔓 Desbloqueado' : '🔒 Bloqueado (God Mode)'}
            </div>
          </button>
        `).join('')}
      </div>
      <div style="text-align: center; margin-top: 20px;">
        <button 
          onclick="window.closeGodModeSelector()"
          style="
            padding: 10px 30px;
            background: transparent;
            color: var(--text);
            border: 2px solid var(--cardBorder);
            border-radius: 10px;
            cursor: pointer;
            font-weight: bold;
          ">
          Cancelar
        </button>
      </div>
    `;
    
    overlay.appendChild(panel);
    document.body.appendChild(overlay);
    
    // Añadir animaciones CSS si no existen
    if (!document.getElementById('godModeAnimations')) {
      const style = document.createElement('style');
      style.id = 'godModeAnimations';
      style.textContent = `
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `;
      document.head.appendChild(style);
    }
  }
  
  // Ir a una región con God Mode
  window.godModeGoToRegion = function(regionKey) {
    // Cerrar el selector
    closeGodModeSelector();
    
    // Actualizar la región actual
    if (window.AdventureMode) {
      window.AdventureMode.ADVENTURE_STATE.currentRegion = regionKey;
      window.AdventureMode.saveAdventureProgress();
    }
    
    // Renderizar los nodos de la región seleccionada
    renderRegionNodes(regionKey);
    
    // Mostrar mensaje
    const region = window.AdventureMode.ADVENTURE_STATE.regions[regionKey];
    showToast(`👁️ God Mode: Entrando a ${region.name}`);
  };
  
  // Cerrar el selector de God Mode
  window.closeGodModeSelector = function() {
    const overlay = document.getElementById('godModeOverlay');
    if (overlay) {
      overlay.style.animation = 'fadeOut 0.3s ease';
      setTimeout(() => overlay.remove(), 300);
    }
  };
  
  // Función auxiliar para actualizar la vista actual
  function updateCurrentView() {
    const adventureMapContainer = document.getElementById('adventureMapContainer');
    if (adventureMapContainer) {
      const regionNodes = adventureMapContainer.querySelector('.region-map');
      if (regionNodes) {
        // Estamos viendo nodos de una región
        const ADVENTURE_STATE = window.AdventureMode.ADVENTURE_STATE;
        renderRegionNodes(ADVENTURE_STATE.currentRegion);
      } else {
        // Estamos viendo el mapa de regiones
        renderAdventureMap();
      }
    }
  }
  
  // Manejar click en nodos
  window.handleNodeClick = async function(regionKey, nodeIndex) {
    console.log('handleNodeClick llamado:', regionKey, nodeIndex, 'GodMode:', window.godModeActive);
    
    if (!window.AdventureMode) {
      console.error('AdventureMode no disponible');
      return;
    }
    
    const ADVENTURE_STATE = window.AdventureMode.ADVENTURE_STATE;
    const region = ADVENTURE_STATE.regions[regionKey];
    if (!region) {
      console.error('Región no encontrada:', regionKey);
      return;
    }
    
    const node = region.nodes[nodeIndex];
    if (!node) {
      console.error('Nodo no encontrado:', nodeIndex);
      return;
    }
    
    // Con God Mode activo, SIEMPRE permitir jugar cualquier nodo
    if (window.godModeActive) {
      console.log('God Mode activo - Permitiendo acceso al nodo', nodeIndex);
      const nodeType = node.type === 'boss' ? 'JEFE' : `Nivel ${nodeIndex + 1}`;
      showToast(`👁️ God Mode: Iniciando ${nodeType}`);
      await startNodeLevel(regionKey, nodeIndex);
      return;
    }
    
    // Sin God Mode, verificar si puede jugar normalmente
    const canPlay = nodeIndex === 0 || (nodeIndex > 0 && region.nodes[nodeIndex - 1].completed);
    
    if (!canPlay) {
      showToast('⚠️ Debes completar el nivel anterior primero');
      return;
    }
    
    await startNodeLevel(regionKey, nodeIndex);
  };
  
  window.startNodeLevel = async function(regionKey, nodeIndex) {
    console.log('startNodeLevel llamado con:', regionKey, nodeIndex);
    
    // Asegurar que el banco esté cargado ANTES de cualquier cosa
    if (window.ensureInitial60) {
      console.log('Cargando banco antes de iniciar nivel...');
      await window.ensureInitial60();
      
      // Verificar que realmente se cargó
      if (window.getBankCount) {
        const count = window.getBankCount();
        console.log('Banco cargado con', count, 'preguntas totales');
      }
    }
    
    if (!window.AdventureGame) {
      console.error('AdventureGame no está disponible');
      showToast('Error: Sistema de juego no cargado');
      return;
    }
    
    try {
      // Asegurar que AdventureMode tiene el currentRegion correcto antes de iniciar
      if (window.AdventureMode) {
        window.AdventureMode.ADVENTURE_STATE.currentRegion = regionKey;
      }
      
      const success = await window.AdventureGame.startAdventureLevel(regionKey, nodeIndex);
      console.log('startAdventureLevel result:', success);
      
      if (success) {
        document.getElementById('fsAdventure').style.display = 'none';
        document.getElementById('adventureGameArea').style.display = 'block';
      } else {
        console.error('No se pudo iniciar el nivel');
        showToast('Error al iniciar el nivel');
      }
    } catch (error) {
      console.error('Error en startNodeLevel:', error);
      showToast('Error: ' + error.message);
    }
  };

  // Dibuja una línea punteada animada entre dos nodos completados consecutivamente
  function drawProgressLink(regionKey, fromIndex, toIndex) {
    try {
      const container = document.getElementById('regionMapDiv');
      if (!container) return;
      const svg = container.querySelector('.progress-links');
      if (!svg) return;

      // Usar las mismas posiciones específicas por región
      const regionPositions = {
        default: [
          { x: 50, y: 90 },
          { x: 70, y: 78 },
          { x: 30, y: 66 },
          { x: 65, y: 54 },
          { x: 35, y: 42 },
          { x: 70, y: 30 },
          { x: 30, y: 18 },
          { x: 50, y: 8 }
        ],
        geography: [
          { x: 47, y: 70 },
          { x: 50, y: 59 },
          { x: 40, y: 52 },
          { x: 52, y: 44 },
          { x: 42, y: 35 },
          { x: 50, y: 29 },
          { x: 43, y: 22 },
          { x: 50, y: 14 }
        ]
      };
      const positions = regionPositions[regionKey] || regionPositions.default;
      const a = positions[fromIndex];
      const b = positions[toIndex];
      if (!a || !b) return;
      const path = document.createElementNS('http://www.w3.org/2000/svg','path');
      path.setAttribute('d', `M ${a.x} ${a.y} L ${b.x} ${b.y}`);
      svg.appendChild(path);
      setTimeout(() => { try { svg.removeChild(path); } catch {} }, 2000);
    } catch {}
  }

  window.drawProgressLink = drawProgressLink;

  // Animar el marcador del jugador hacia el índice objetivo
  window.animatePlayerMarkerTo = function(targetIndex, regionKey) {
    try {
      const marker = document.getElementById('playerMarker');
      if (!marker) return;
      
      // Usar las mismas posiciones específicas por región
      const regionPositions = {
        default: [
          { x: 50, y: 90 },{ x: 70, y: 78 },{ x: 30, y: 66 },{ x: 65, y: 54 },
          { x: 35, y: 42 },{ x: 70, y: 30 },{ x: 30, y: 18 },{ x: 50, y: 8 }
        ],
        geography: [
          { x: 47, y: 70 },{ x: 50, y: 59 },{ x: 40, y: 52 },{ x: 52, y: 44 },
          { x: 42, y: 35 },{ x: 50, y: 29 },{ x: 43, y: 22 },{ x: 50, y: 14 }
        ]
      };
      const positions = regionPositions[regionKey] || regionPositions.default;
      const pos = positions[targetIndex];
      if (!pos) return;
      
      // Calcular posición relativa al mapa de fondo usando la misma función
      const calculatedPos = window.calculateMapRelativePosition ? 
        window.calculateMapRelativePosition(pos.x, pos.y) : 
        { x: pos.x, y: pos.y, isRelative: false };
      
      let finalX = calculatedPos.x + 5; // Offset por defecto
      let finalY = calculatedPos.y + 2;
      
      // Si no se pudo calcular relativamente, usar valores directos
      if (!calculatedPos.isRelative) {
        finalX = pos.x + 5;
        finalY = pos.y + 2;
      }
      
      marker.style.transition = 'left 450ms ease, top 450ms ease';
      marker.style.left = finalX + '%';
      marker.style.top = finalY + '%';
      // restaurar transición por defecto luego
      setTimeout(() => {
        marker.style.transition = 'left 300ms ease, top 300ms ease';
      }, 500);
    } catch {}
  };

  // Manejar click en el marcador del jugador
  window.handlePlayerMarkerClick = function(regionKey) {
    if (!window.AdventureMode) return;
    
    const ADVENTURE_STATE = window.AdventureMode.ADVENTURE_STATE;
    const region = ADVENTURE_STATE.regions[regionKey];
    if (!region) return;
    
    // Encontrar el nodo actual (primer no completado)
    const currentIndex = region.nodes.findIndex(n => !n.completed);
    const nodeIndex = currentIndex === -1 ? region.nodes.length - 1 : currentIndex;
    
    // Llamar a la misma función que maneja el click en nodos
    window.handleNodeClick(regionKey, nodeIndex);
  };

})(window);

