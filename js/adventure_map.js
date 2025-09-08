// js/adventure_map.js - Renderizado del mapa de aventura
(function(window) {
  'use strict';

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
          const isLocked = !region.unlocked;
          const completedNodes = region.nodes.filter(n => n.completed).length;
          const totalStars = region.nodes.reduce((sum, n) => sum + n.stars, 0);
          
          return `
            <div class="region-card ${isLocked ? 'locked' : 'unlocked'}" 
                 data-region="${key}"
                 ${!isLocked ? 'onclick="window.enterAdventureRegion(\'' + key + '\')"' : ''}>
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
    
    // Posiciones del camino en forma de S para mayor visibilidad
    const pathPositions = [
      { x: 20, y: 80 },  // Inicio abajo izquierda
      { x: 35, y: 75 },  // Subiendo a la derecha
      { x: 50, y: 65 },  // Centro
      { x: 65, y: 55 },  // Continúa subiendo
      { x: 50, y: 45 },  // Curva hacia la izquierda
      { x: 35, y: 35 },  // Sigue la curva
      { x: 50, y: 25 },  // Hacia el centro
      { x: 65, y: 15 },  // Castillo (BOSS) arriba derecha
    ];
    
    // Crear HTML con template strings correctos
    let mapStyle = '';
    if (region.mapImage) {
      mapStyle = `background-image: url('${region.mapImage}'); background-size: cover; background-position: center;`;
    }
    
    container.innerHTML = `
      <div class="region-header">
        <button class="btn-back" onclick="window.exitAdventureMode()">← Volver</button>
        <h2>${region.icon} ${region.name}</h2>
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
            const canPlay = isGodMode || index === 0 || region.nodes[index - 1].completed;
            const isCurrent = !node.completed && canPlay && !isGodMode;
            
            return `
              <div class="adventure-node ${node.completed ? 'completed' : ''} 
                          ${isCurrent ? 'current' : ''} 
                          ${!canPlay ? 'locked' : ''}
                          ${isGodMode && !node.completed ? 'god-mode' : ''}
                          ${node.type}"
                   style="left: ${pos.x}%; top: ${pos.y}%;"
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
    if (window.AdventureMode && window.AdventureMode.startAdventureRegion(regionKey)) {
      renderRegionNodes(regionKey);
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
  
  // Toggle God Mode
  window.toggleGodMode = function() {
    window.godModeActive = !window.godModeActive;
    const btn = document.getElementById('godModeBtn');
    if (btn) {
      btn.textContent = window.godModeActive ? '🔓 God ON' : '🔓 God';
      btn.classList.toggle('active', window.godModeActive);
    }
    
    // Re-renderizar para actualizar los nodos
    const ADVENTURE_STATE = window.AdventureMode.ADVENTURE_STATE;
    renderRegionNodes(ADVENTURE_STATE.currentRegion);
    
    if (window.toast) {
      window.toast(window.godModeActive ? '👁️ God Mode ACTIVADO' : '👁️ God Mode DESACTIVADO');
    }
  };
  
  // Manejar click en nodos
  window.handleNodeClick = async function(regionKey, nodeIndex) {
    if (!window.AdventureMode) return;
    
    const ADVENTURE_STATE = window.AdventureMode.ADVENTURE_STATE;
    const region = ADVENTURE_STATE.regions[regionKey];
    if (!region) return;
    
    const node = region.nodes[nodeIndex];
    const isGodMode = window.godModeActive || false;
    const canPlay = isGodMode || nodeIndex === 0 || (nodeIndex > 0 && region.nodes[nodeIndex - 1].completed);
    
    if (!canPlay) {
      if (window.toast) window.toast('⚠️ Debes completar el nivel anterior primero');
      return;
    }
    
    // Si God Mode está activo, mostrar confirmación
    if (isGodMode && !node.completed) {
      if (window.toast) window.toast('👁️ Iniciando nivel con God Mode');
    }
    
    await startNodeLevel(regionKey, nodeIndex);
  };
  
  window.startNodeLevel = async function(regionKey, nodeIndex) {
    if (window.AdventureGame) {
      const success = await window.AdventureGame.startAdventureLevel(regionKey, nodeIndex);
      if (success) {
        document.getElementById('fsAdventure').style.display = 'none';
      }
    }
  };

})(window);