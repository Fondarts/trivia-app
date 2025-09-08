// js/adventure_game.js - Sistema de juego para niveles de aventura
(function(window) {
  'use strict';
  
  // Función toast simple para mostrar mensajes
  function showToast(message) {
    if (window.toast) {
      window.toast(message);
    } else {
      console.log('Toast:', message);
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

  let adventureGameState = {
    deck: [],
    currentQuestion: 0,
    score: 0,
    total: 0,
    regionKey: null,
    nodeIndex: null,
    isBoss: false,
    isTimed: false,
    timeLimit: null,
    timer: null,
    timeLeft: 0
  };

  // Iniciar un nivel de aventura
  async function startAdventureLevel(regionKey, nodeIndex) {
    console.log('startAdventureLevel - regionKey:', regionKey, 'nodeIndex:', nodeIndex);
    
    if (!window.AdventureMode) {
      console.error('AdventureMode no disponible');
      return false;
    }
    
    // Verificar que el banco esté cargado
    if (window.ensureInitial60) {
      console.log('Asegurando que el banco esté cargado...');
      await window.ensureInitial60();
    }
    
    // IMPORTANTE: Actualizar currentRegion antes de iniciar
    window.AdventureMode.ADVENTURE_STATE.currentRegion = regionKey;
    
    let nodeData;
    
    // Si God Mode está activo, usar la función directa
    if (window.godModeActive) {
      console.log('Usando startNodeDirectly para God Mode');
      nodeData = await window.AdventureMode.startNodeDirectly(regionKey, nodeIndex);
    } else {
      nodeData = await window.AdventureMode.startAdventureNode(nodeIndex);
    }
    
    console.log('nodeData recibido:', nodeData);
    
    if (!nodeData) {
      console.error('No se pudo obtener datos del nodo');
      return false;
    }
    
    if (!nodeData.deck || nodeData.deck.length === 0) {
      console.error('No hay preguntas en el deck');
      console.log('Verificando estado del banco...');
      if (window.getBank) {
        const bank = window.getBank();
        console.log('Banco actual:', bank);
        console.log('Categorías disponibles:', Object.keys(bank));
        Object.keys(bank).forEach(cat => {
          console.log(`${cat}: ${bank[cat]?.length || 0} preguntas`);
        });
      }
      return false;
    }
    
    // Configurar estado del juego
    adventureGameState = {
      deck: nodeData.deck,
      currentQuestion: 0,
      score: 0,
      total: nodeData.deck.length,
      regionKey: nodeData.region,
      nodeIndex: nodeData.nodeIndex,
      isBoss: nodeData.isBoss,
      isTimed: nodeData.isTimed,
      timeLimit: nodeData.isTimed ? 60 : null,  // 60 segundos para contrarreloj
      timer: null,
      timeLeft: nodeData.timeLimit || 0
    };
    
    // Mostrar UI del juego
    showAdventureGameUI();
    
    // Si es contrarreloj, iniciar timer
    if (adventureGameState.isTimed) {
      startAdventureTimer();
    }
    
    // Mostrar primera pregunta
    renderAdventureQuestion();
    
    return true;
  }

  function showAdventureGameUI() {
    const gameArea = document.getElementById('adventureGameArea');
    const adventureFS = document.getElementById('fsAdventure');
    
    if (gameArea) gameArea.style.display = 'block';
    if (adventureFS) adventureFS.style.display = 'none';
  }

  function renderAdventureQuestion() {
    const state = adventureGameState;
    if (state.currentQuestion >= state.deck.length) {
      endAdventureLevel();
      return;
    }
    
    const q = state.deck[state.currentQuestion];
    const gameArea = document.getElementById('adventureGameArea');
    
    if (!gameArea) return;
    
    const hudText = state.isTimed ? 
      `⏱️ ${state.timeLeft}s · 🎯 ${state.score} correctas` :
      `📝 ${state.currentQuestion + 1}/${state.total} · ⭐ ${state.score}/${state.currentQuestion}`;
    
    gameArea.innerHTML = `
      <div class="adventure-game-header">
        <div class="adventure-hud">${hudText}</div>
        <div class="adventure-progress">
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${(state.currentQuestion/state.total)*100}%"></div>
          </div>
        </div>
      </div>
      
      <div class="question-container">
        ${q.img ? `<div class="question-image"><img src="${q.img}" alt="Imagen de pregunta"/></div>` : ''}
        <div class="question-text">${q.q}</div>
        
        <div class="options-grid adventure-options">
          ${q.options.map((opt, i) => `
            <button class="option-btn" onclick="window.answerAdventureQuestion(${i})">
              ${opt}
            </button>
          `).join('')}
        </div>
      </div>
      
      <button class="btn secondary danger" onclick="window.exitAdventureLevel()">
        Abandonar Nivel
      </button>
    `;
  }

  window.answerAdventureQuestion = async function(answerIndex) {
    const state = adventureGameState;
    const q = state.deck[state.currentQuestion];
    
    const buttons = document.querySelectorAll('.option-btn');
    buttons.forEach(btn => btn.disabled = true);
    
    const isCorrect = answerIndex === q.answer;
    
    buttons[answerIndex].classList.add(isCorrect ? 'correct' : 'wrong');
    if (!isCorrect && q.answer < buttons.length) {
      buttons[q.answer].classList.add('correct');
    }
    
    if (isCorrect) {
      state.score++;
    }
    
    setTimeout(() => {
      state.currentQuestion++;
      
      if (state.currentQuestion >= state.deck.length || (state.isTimed && state.timeLeft <= 0)) {
        endAdventureLevel();
      } else {
        renderAdventureQuestion();
      }
    }, 1000);
  };

  function startAdventureTimer() {
    const state = adventureGameState;
    state.timeLeft = state.timeLimit;
    
    if (state.timer) clearInterval(state.timer);
    
    state.timer = setInterval(() => {
      state.timeLeft--;
      
      const hudEl = document.querySelector('.adventure-hud');
      if (hudEl) {
        hudEl.textContent = `⏱️ ${state.timeLeft}s · 🎯 ${state.score} pts`;
      }
      
      if (state.timeLeft <= 5) {
        hudEl?.classList.add('urgent');
      }
      
      if (state.timeLeft <= 0) {
        clearInterval(state.timer);
        endAdventureLevel();
      }
    }, 1000);
  }

  async function endAdventureLevel() {
    const state = adventureGameState;
    
    if (state.timer) {
      clearInterval(state.timer);
      state.timer = null;
    }
    
    // Verificar si pasó el nivel
    const minRequired = state.isBoss ? 0 : (state.isTimed ? 10 : 18);  // Jefe: 0, Contrarreloj: 10, Normal: 18
    const passed = state.score >= minRequired;
    
    // Si es un jefe, SIEMPRE pasa a la batalla (no hay mínimo)
    if (state.isBoss) {
      // Mostrar diálogo del jefe
      const region = window.AdventureMode.ADVENTURE_STATE.regions[state.regionKey];
      if (region.bossDialog) {
        showBossDialog(region.bossDialog, region.bossName || 'Jefe');
      }
      setTimeout(() => {
        const handicap = window.AdventureMode.getBossHandicap(state.score, state.total);
        // IMPORTANTE: Agregar el score al handicap para los puntos de experiencia
        handicap.questionsScore = state.score;
        
        showToast(handicap.message);
        
        setTimeout(() => {
          if (window.AdventureBosses) {
            window.AdventureBosses.startBossGame(state.regionKey, handicap, async (bossWon) => {
              if (bossWon) {
                const result = await window.AdventureMode.completeAdventureNode(state.nodeIndex, state.total, state.total);
                showAdventureResults(true, result);
              } else {
                showAdventureResults(false, null);
              }
            });
          }
        }, 2000);
      }, 3000);  // Esperar a que se lea el diálogo
      
      return;
    }
    
    // Si no pasó el mínimo, no completar el nodo
    if (!passed) {
      showAdventureResults(false, null);
      return;
    }
    
    // Completar nodo normal
    const result = await window.AdventureMode.completeAdventureNode(state.nodeIndex, state.score, state.total);
    
    // Actualizar XP si está disponible
    if (window.updatePlayerXPBar) window.updatePlayerXPBar();
    if (result.leveledUp) showToast("🎉 ¡Subiste de Nivel! 🎉");
    if (result.bonusToast) showToast(result.bonusToast);
    if (result.newAchievements) {
      result.newAchievements.forEach(ach => {
        showToast(`🏆 ¡Logro desbloqueado: ${ach.title}!`);
      });
    }
    
    showAdventureResults(true, result);
  }

  function showAdventureResults(completed, result) {
    const state = adventureGameState;
    const gameArea = document.getElementById('adventureGameArea');
    
    if (!gameArea) return;
    
    const stars = result?.stars || 0;
    const percentage = Math.round((state.score / state.total) * 100);
    
    let title, message;
    if (completed && stars === 3) {
      title = '¡Perfecto! 🌟';
      message = '¡Completaste el nivel sin errores!';
    } else if (completed && stars === 2) {
      title = '¡Muy bien! ⭐';
      message = 'Excelente trabajo en este nivel.';
    } else if (completed && stars === 1) {
      title = 'Nivel Completado ✅';
      message = 'Has pasado el nivel con el mínimo requerido.';
    } else {
      title = 'Nivel Fallado ❌';
      message = state.isBoss ? 
        `El jefe es demasiado fuerte. Pero aun así puedes intentar vencerlo.` :
        state.isTimed ?
        `Necesitas al menos 10 correctas en 60 segundos. Obtuviste: ${state.score}` :
        `Necesitas al menos 18 correctas. Obtuviste: ${state.score}/25`;
    }
    
    // Si se desbloqueó una nueva región (después de derrotar un jefe)
    let newRegionKey = null;
    if (result?.newRegionUnlocked && state.isBoss) {
      // Definir el orden correcto de desbloqueo
      const unlockOrder = {
        'movies': 'anime',
        'anime': 'history',
        'history': 'geography',
        'geography': 'science',
        'science': 'sports'
      };
      
      newRegionKey = unlockOrder[state.regionKey];
    }
    
    gameArea.innerHTML = `
      <div class="adventure-results">
        <h2>${title}</h2>
        <p class="result-message">${message}</p>
        
        <div class="result-stats">
          <div class="stat-box">
            <div class="stat-label">Puntuación</div>
            <div class="stat-value">${state.score}/${state.total}</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">Precisión</div>
            <div class="stat-value">${percentage}%</div>
          </div>
          ${completed ? `
            <div class="stat-box">
              <div class="stat-label">Estrellas</div>
              <div class="stat-value">${'⭐'.repeat(stars)}${'☆'.repeat(3-stars)}</div>
            </div>
          ` : ''}
        </div>
        
        ${result?.newRegionUnlocked ? `
          <div class="new-region-unlocked">
            🎊 ¡Nueva región desbloqueada! 🎊
            <div style="font-size: 16px; margin-top: 10px;">
              ${newRegionKey ? window.AdventureMode.ADVENTURE_STATE.regions[newRegionKey].name : ''}
            </div>
          </div>
        ` : ''}
        
        <div class="result-actions">
          ${!completed ? `
            <button class="btn" onclick="window.retryAdventureLevel()">
              Reintentar
            </button>
          ` : ''}
          ${newRegionKey ? `
            <button class="btn accent" onclick="window.goToNewRegion('${newRegionKey}')">
              Ir a ${window.AdventureMode.ADVENTURE_STATE.regions[newRegionKey].name}
            </button>
          ` : `
            <button class="btn ${completed ? '' : 'secondary'}" onclick="window.backToRegionMap()">
              Volver al Mapa
            </button>
          `}
        </div>
      </div>
    `;
  }

  // Funciones globales
  window.exitAdventureLevel = function() {
    if (!confirm('¿Seguro que quieres abandonar este nivel?')) return;
    
    if (adventureGameState.timer) {
      clearInterval(adventureGameState.timer);
    }
    
    window.backToRegionMap();
  };

  window.retryAdventureLevel = function() {
    startAdventureLevel(adventureGameState.regionKey, adventureGameState.nodeIndex);
  };

  window.backToRegionMap = function() {
    const gameArea = document.getElementById('adventureGameArea');
    const adventureFS = document.getElementById('fsAdventure');
    
    if (gameArea) gameArea.style.display = 'none';
    if (adventureFS) adventureFS.style.display = 'block';
    
    if (window.renderRegionNodes) {
      window.renderRegionNodes(adventureGameState.regionKey);
    }
  };
  
  // Nueva función para ir directamente a una nueva región desbloqueada
  window.goToNewRegion = function(regionKey) {
    const gameArea = document.getElementById('adventureGameArea');
    const adventureFS = document.getElementById('fsAdventure');
    
    if (gameArea) gameArea.style.display = 'none';
    if (adventureFS) adventureFS.style.display = 'block';
    
    // Actualizar la región actual
    if (window.AdventureMode) {
      window.AdventureMode.ADVENTURE_STATE.currentRegion = regionKey;
      window.AdventureMode.saveAdventureProgress();
    }
    
    // Renderizar los nodos de la nueva región
    if (window.renderRegionNodes) {
      window.renderRegionNodes(regionKey);
    }
    
    // Mostrar mensaje de bienvenida
    const region = window.AdventureMode.ADVENTURE_STATE.regions[regionKey];
    showToast(`🎆 ¡Bienvenido a ${region.name}!`);
  };

  // Mostrar diálogo del jefe
  function showBossDialog(dialog, bossName) {
    const gameArea = document.getElementById('adventureGameArea');
    if (!gameArea) return;
    
    // Obtener la imagen del jefe si existe
    const state = adventureGameState;
    const region = window.AdventureMode.ADVENTURE_STATE.regions[state.regionKey];
    const bossImage = region?.bossImage || '';
    
    gameArea.innerHTML = `
      <div class="boss-dialog-container">
        <div class="boss-dialog-box">
          ${bossImage ? 
            `<div class="boss-avatar"><img src="${bossImage}" alt="${bossName}" style="width: 120px; height: 120px; object-fit: contain;"/></div>` :
            `<div class="boss-avatar">👺</div>`
          }
          <div class="boss-name">${bossName}</div>
          <div class="boss-dialog-text">
            ${dialog}
          </div>
          <div class="dialog-continue" style="text-align: center;">Preparando batalla...</div>
        </div>
      </div>
    `;
  }
  
  // Exportar
  window.AdventureGame = {
    startAdventureLevel
  };

})(window);