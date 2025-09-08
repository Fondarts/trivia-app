// js/adventure_map.js - Renderizado del mapa de aventura
(function(window) {
  'use strict';
  
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
    const container = document.getElementById('adventureMapContainer');
    if (!container || !window.AdventureMode) return;
    
    const ADVENTURE_STATE = window.AdventureMode.ADVENTURE_STATE;
    const stats = window.AdventureMode.getAdventureStats();
    
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
  }

  // Renderizar los nodos de una región
  function renderRegionNodes(regionKey) {
    const container = document.getElementById('adventureMapContainer');
    if (!container || !window.AdventureMode) return;
    
    const ADVENTURE_STATE = window.AdventureMode.ADVENTURE_STATE;
    const region = ADVENTURE_STATE.regions[regionKey];
    if (!region) {
      console.error('Región no encontrada:', regionKey);
      return;
    }
    
    console.log('Renderizando región:', regionKey, region);
    
    // Posiciones del camino optimizadas para formato vertical 9:16
    const pathPositions = [
      { x: 50, y: 90 },  // Nodo 1 - Inicio abajo centro
      { x: 70, y: 78 },  // Nodo 2 - Derecha
      { x: 30, y: 66 },  // Nodo 3 - Izquierda  
      { x: 65, y: 54 },  // Nodo 4 - Derecha
      { x: 35, y: 42 },  // Nodo 5 - Izquierda
      { x: 70, y: 30 },  // Nodo 6 - Derecha
      { x: 30, y: 18 },  // Nodo 7 - Izquierda
      { x: 50, y: 8 },   // Nodo 8 - BOSS arriba centro
    ];
    
    // Crear HTML con template strings correctos
    let mapStyle = '';
    if (region.mapImage) {
      mapStyle = `background-image: url('${region.mapImage}'); background-size: cover; background-position: center;`;
    }
    
    container.innerHTML = `
      <div class="region-header">
        <button class="btn-back" onclick="window.exitAdventureMode()">← Volver</button>
        <span class="region-title">${region.name}</span>
        <div class="header-actions">
          <button class="btn secondary danger small" onclick="window.resetAdventureProgress()" title="Reiniciar progreso">🔄</button>
          <button class="btn secondary warning small" onclick="window.toggleGodMode()" title="God Mode" id="godModeBtn">🔓 God</button>
        </div>
      </div>
      
      <div class="region-map" style="${mapStyle}">
        <svg class="path-svg" viewBox="0 0 100 100">
          <!-- Camino completo de fondo -->
          <path d="M ${pathPositions.map((pos, i) => 
            `${i === 0 ? 'M' : 'L'} ${pos.x} ${pos.y}`
          ).join(' ')}" 
            stroke="rgba(255,255,255,0.1)" 
            stroke-width="8" 
            fill="none"
            stroke-linecap="round"
            stroke-linejoin="round"/>
          
          <!-- Camino progreso -->
          ${pathPositions.map((pos, i) => {
            if (i === 0) return '';
            const prev = pathPositions[i-1];
            const isCompleted = region.nodes[i-1].completed;
            return `
              <line 
                x1="${prev.x}" y1="${prev.y}" 
                x2="${pos.x}" y2="${pos.y}"
                stroke="${isCompleted ? '#4CAF50' : 'rgba(255,255,255,0.2)'}"
                stroke-width="${isCompleted ? '4' : '3'}"
                stroke-dasharray="${isCompleted ? '0' : '8,4'}"
                stroke-linecap="round"
              />
            `;
          }).join('')}
        </svg>
        
        <div class="nodes-container">
          ${region.nodes.map((node, index) => {
            const pos = pathPositions[index];
            const isGodMode = window.godModeActive || false;
            const canPlayNormally = index === 0 || (index > 0 && region.nodes[index - 1].completed);
            const canPlay = isGodMode || canPlayNormally;
            const isCurrent = !node.completed && canPlayNormally && !isGodMode;
            const isLocked = !canPlay && !isGodMode;
            
            return `
              <div class="adventure-node ${node.completed ? 'completed' : ''} 
                          ${isCurrent ? 'current' : ''} 
                          ${isLocked ? 'locked' : ''}
                          ${isGodMode && !node.completed ? 'god-mode clickable' : ''}
                          ${node.type}"
                   style="left: ${pos.x}%; top: ${pos.y}%; cursor: ${canPlay ? 'pointer' : 'not-allowed'};"
                   onclick="window.handleNodeClick('${regionKey}', ${index})"
                   data-node-index="${index}">
                
                <div class="node-icon">
                  ${node.type === 'boss' ? '👺' : 
                    node.type === 'timed' ? '⏱️' : 
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
        </div>
      </div>
    `;
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

})(window);