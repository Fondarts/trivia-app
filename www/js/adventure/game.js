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
    
    // Verificar si se terminaron las preguntas o se acabó el tiempo antes de renderizar
    if (state.currentQuestion >= state.deck.length) {
      endAdventureLevel();
      return;
    }
    
    // Si es contrarreloj y se acabó el tiempo, terminar el nivel
    if (state.isTimed && state.timeLeft <= 0) {
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
      
      // Verificar si se terminaron las preguntas o se acabó el tiempo
      if (state.currentQuestion >= state.deck.length) {
        // Se terminaron todas las preguntas
        endAdventureLevel();
      } else if (state.isTimed && state.timeLeft <= 0) {
        // Se acabó el tiempo
        endAdventureLevel();
      } else {
        // Continuar con la siguiente pregunta
        renderAdventureQuestion();
      }
    }, 1000);
  };

  function startAdventureTimer() {
    const state = adventureGameState;
    state.timeLeft = state.timeLimit;
    
    if (state.timer) clearInterval(state.timer);
    
    state.timer = setInterval(() => {
      // Verificar primero si el tiempo ya llegó a 0 antes de decrementar
      if (state.timeLeft <= 0) {
        console.log('⏰ Timer ya estaba en 0, terminando nivel...');
        clearInterval(state.timer);
        state.timer = null;
        // Deshabilitar botones inmediatamente
        const buttons = document.querySelectorAll('.option-btn');
        buttons.forEach(btn => {
          btn.disabled = true;
          btn.style.pointerEvents = 'none';
        });
        // Terminar el nivel inmediatamente
        endAdventureLevel();
        return; // Salir del intervalo
      }
      
      state.timeLeft--;
      
      const hudEl = document.querySelector('.adventure-hud');
      if (hudEl) {
        hudEl.textContent = `⏱️ ${state.timeLeft}s · 🎯 ${state.score} pts`;
      }
      
      if (state.timeLeft <= 5) {
        hudEl?.classList.add('urgent');
      }
      
      // Verificar nuevamente después de decrementar
      if (state.timeLeft <= 0) {
        console.log('⏰ Timer llegó a 0, terminando nivel...');
        clearInterval(state.timer);
        state.timer = null;
        // Deshabilitar botones inmediatamente
        const buttons = document.querySelectorAll('.option-btn');
        buttons.forEach(btn => {
          btn.disabled = true;
          btn.style.pointerEvents = 'none';
        });
        // Terminar el nivel inmediatamente
        endAdventureLevel();
      }
    }, 1000);
  }

  async function endAdventureLevel() {
    const state = adventureGameState;
    
    console.log('🏁 endAdventureLevel llamado', {
      timeLeft: state.timeLeft,
      isTimed: state.isTimed,
      currentQuestion: state.currentQuestion,
      total: state.deck.length,
      score: state.score
    });
    
    // Asegurar que el timer esté detenido PRIMERO
    if (state.timer) {
      clearInterval(state.timer);
      state.timer = null;
    }
    
    // Si es contrarreloj, asegurar que timeLeft refleje el estado correcto
    if (state.isTimed && state.timeLeft < 0) {
      state.timeLeft = 0;
    }
    
    // Deshabilitar todos los botones para evitar respuestas después de que termine
    const buttons = document.querySelectorAll('.option-btn');
    buttons.forEach(btn => {
      btn.disabled = true;
      btn.style.pointerEvents = 'none';
    });
    
    // Si se terminaron las preguntas pero aún no se procesó la última respuesta
    // Asegurar que currentQuestion refleje que se terminaron todas
    if (state.currentQuestion < state.deck.length) {
      // Si estamos en alguna pregunta y no se ha respondido, marcar como terminado
      // Esto puede pasar si se acabó el tiempo
      if (state.isTimed && state.timeLeft <= 0) {
        // Si se acabó el tiempo, no incrementar currentQuestion, solo marcar como terminado
        // El score ya está calculado con las preguntas respondidas
      }
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
    
    // Si no pasó el mínimo, perder una vida y no completar el nodo
    if (!passed) {
      console.log('❌ No pasó el mínimo. Score:', state.score, 'Mínimo requerido:', minRequired);
      let shouldShowResults = true;
      let noLives = false;
      
      try {
        if (window.AdventureMode && window.AdventureMode.loseLife) {
          const result = window.AdventureMode.loseLife();
          console.log('💔 Resultado de loseLife:', result);
          console.log('❤️ Vidas después de perder:', window.AdventureMode.ADVENTURE_STATE.lives);
          
          // Si se quedó sin vidas, el modal ya se mostró, NO mostrar resultados ni actualizar mapa
          if (result === 'no_lives') {
            console.log('⚠️ Se quedó sin vidas, el modal ya se mostró. NO mostrar resultados ni actualizar mapa.');
            shouldShowResults = false;
            noLives = true;
            // NO actualizar el mapa aquí porque el modal se está mostrando
            // El modal se encargará de ocultar el mapa y mostrar el modal
            // Salir temprano para no continuar con el flujo normal
          } else {
            // Si se reseteó el mapa (comportamiento antiguo), actualizar vista
            if (result === true) {
              const stateAfter = window.AdventureMode.ADVENTURE_STATE;
              if (window.renderRegionNodes) window.renderRegionNodes(stateAfter.currentRegion);
            }
            
            // SIEMPRE actualizar la UI del mapa para mostrar los corazones actualizados
            // Esto asegura que los corazones se actualicen incluso si no se reseteó el mapa
            if (window.renderRegionNodes && state.regionKey) {
              const livesBeforeRender = window.AdventureMode?.ADVENTURE_STATE?.lives;
              console.log('🔄 Actualizando UI del mapa para mostrar corazones actualizados...', {
                regionKey: state.regionKey,
                livesBeforeRender: livesBeforeRender,
                livesType: typeof livesBeforeRender
              });
              window.renderRegionNodes(state.regionKey);
              const livesAfterRender = window.AdventureMode?.ADVENTURE_STATE?.lives;
              console.log('🔄 Después de renderizar, vidas:', livesAfterRender);
            }
          }
        }
      } catch (e) { 
        console.error('❌ Error al perder vida:', e); 
        // Si hay error, mostrar resultados de todas formas
        shouldShowResults = true;
      }
      
      // Si se quedó sin vidas, salir aquí sin mostrar resultados
      if (noLives) {
        console.log('⚠️ Se quedó sin vidas, saliendo sin mostrar resultados');
        return;
      }
      
      // Mostrar resultados SIEMPRE que no se haya quedado sin vidas
      if (shouldShowResults) {
        const livesRemaining = window.AdventureMode?.ADVENTURE_STATE?.lives || 0;
        console.log('❤️ Vidas restantes:', livesRemaining);
        console.log('📊 Mostrando resultados de derrota...');
        // Mostrar resultados SIEMPRE si shouldShowResults es true
        try {
          showAdventureResults(false, null);
        } catch (e) {
          console.error('❌ Error al mostrar resultados:', e);
          // Si hay error, intentar mostrar resultados de forma básica
          const gameArea = document.getElementById('adventureGameArea');
          if (gameArea) {
            gameArea.innerHTML = `
              <div class="adventure-results">
                <h2>Nivel Fallado ❌</h2>
                <p>Necesitas al menos ${minRequired} correctas. Obtuviste: ${state.score}</p>
                <button class="btn" onclick="window.retryAdventureLevel()">Reintentar</button>
                <button class="btn secondary" onclick="window.backToRegionMap()">Volver al Mapa</button>
              </div>
            `;
          }
        }
      } else {
        console.log('⚠️ shouldShowResults=false, NO mostrar resultados (modal de sin vidas ya se mostró)');
      }
      return;
    }
    
    // Completar nodo normal
    const result = await window.AdventureMode.completeAdventureNode(state.nodeIndex, state.score, state.total);
    try {
      if (window.drawProgressLink) {
        window.drawProgressLink(state.regionKey, state.nodeIndex, Math.min(7, state.nodeIndex + 1));
      }
    } catch {}
    
    // Marcar para animar avatar hacia el próximo casillero al volver al mapa
    try { window.__adventureAnimateToIndex__ = Math.min(7, state.nodeIndex + 1); } catch {}
    
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
    console.log('📊 showAdventureResults llamado', { completed, result, state: adventureGameState });
    const state = adventureGameState;
    const gameArea = document.getElementById('adventureGameArea');
    
    if (!gameArea) {
      console.error('❌ gameArea no encontrado!');
      return;
    }
    
    console.log('✅ gameArea encontrado, mostrando resultados...');
    
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
    
    // Limpiar el contenido anterior y mostrar resultados
    console.log('🔄 Limpiando gameArea y mostrando resultados...');
    gameArea.innerHTML = '';
    gameArea.style.display = 'block';
    
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
          ${!completed && state.isBoss ? `
            <button class="btn accent" onclick="window.watchAdForExtraLives()" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); margin-bottom: 10px;">
              📺 Ver Anuncio (+3 Vidas)
            </button>
            <button class="btn" onclick="window.retryAdventureLevel()">
              Reintentar
            </button>
          ` : !completed ? `
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
    
    console.log('✅ Resultados mostrados correctamente en gameArea. HTML insertado.');
  }

  // Funciones globales
  window.exitAdventureLevel = function() {
    if (!confirm('¿Seguro que quieres abandonar este nivel?')) return;
    
    if (adventureGameState.timer) {
      clearInterval(adventureGameState.timer);
    }
    try {
      if (window.AdventureMode && window.AdventureMode.loseLife) {
        const reset = window.AdventureMode.loseLife();
        if (reset) {
          const s = window.AdventureMode.ADVENTURE_STATE;
          if (window.renderRegionNodes) window.renderRegionNodes(s.currentRegion);
        }
      }
    } catch (e) { console.error('Error al perder vida al abandonar nivel:', e); }
    
    window.backToRegionMap();
  };

  window.retryAdventureLevel = function() {
    startAdventureLevel(adventureGameState.regionKey, adventureGameState.nodeIndex);
  };

  window.backToRegionMap = function() {
    // Limpiar el timer del modal de sin vidas si existe
    if (window.__noLivesTimerInterval__) {
      clearInterval(window.__noLivesTimerInterval__);
      window.__noLivesTimerInterval__ = null;
    }
    
    // Cerrar el modal de sin vidas si existe
    const modalContainer = document.getElementById('noLivesModalContainer');
    if (modalContainer) {
      modalContainer.style.display = 'none';
      modalContainer.innerHTML = '';
    }
    
    const gameArea = document.getElementById('adventureGameArea');
    const adventureFS = document.getElementById('fsAdventure');
    
    if (gameArea) gameArea.style.display = 'none';
    if (adventureFS) adventureFS.style.display = 'block';
    
    // Actualizar la UI del mapa para mostrar los corazones actualizados
    if (window.renderRegionNodes) {
      const regionKey = adventureGameState.regionKey || window.AdventureMode?.ADVENTURE_STATE?.currentRegion;
      if (regionKey) {
        console.log('🔄 Actualizando mapa al volver, región:', regionKey, 'Vidas:', window.AdventureMode?.ADVENTURE_STATE?.lives);
        window.renderRegionNodes(regionKey);
      } else {
        console.warn('⚠️ No se pudo obtener regionKey para actualizar el mapa');
      }
    }
    
    // Ejecutar animación de avatar si corresponde
    setTimeout(() => {
      try {
        if (typeof window.__adventureAnimateToIndex__ === 'number' && window.animatePlayerMarkerTo) {
          const target = window.__adventureAnimateToIndex__;
          const regionKey = adventureGameState.regionKey;
          delete window.__adventureAnimateToIndex__;
          window.animatePlayerMarkerTo(target, regionKey);
        }
      } catch {}
    }, 250);
  };
  
  // Función para ver anuncio y recuperar vidas del modo aventura
  window.watchAdForAdventureLives = async function() {
    if (!window.RewardedAd) {
      console.error('RewardedAd no disponible');
      showToast('Error: Sistema de anuncios no disponible');
      return;
    }

    const rewardedAd = new window.RewardedAd();
    
    // Mostrar anuncio
    await rewardedAd.showRewardedAd(
      // onRewarded: cuando el usuario ve el anuncio completo
      async () => {
        console.log('✅ Usuario vio el anuncio, otorgando 5 vidas...');
        
        // Verificar que AdventureMode esté disponible
        if (window.AdventureMode && window.AdventureMode.ADVENTURE_STATE) {
          // Dar 5 vidas
          window.AdventureMode.ADVENTURE_STATE.lives = 5;
          // Actualizar timestamp de última recarga
          window.AdventureMode.ADVENTURE_STATE.lastLivesRefill = Date.now();
          // Guardar progreso
          if (window.AdventureMode.saveAdventureProgress) {
            window.AdventureMode.saveAdventureProgress();
          }
          
          showToast('✅ ¡5 vidas recuperadas!');
          
          // Cerrar el modal de sin vidas si existe
          const modalContainer = document.getElementById('noLivesModalContainer');
          if (modalContainer) {
            modalContainer.style.display = 'none';
            modalContainer.innerHTML = '';
          }
          
          // Limpiar el timer del modal si existe
          if (window.__noLivesTimerInterval__) {
            clearInterval(window.__noLivesTimerInterval__);
            window.__noLivesTimerInterval__ = null;
          }
          
          // Cerrar el modal y volver al mapa
          setTimeout(() => {
            window.backToRegionMap();
          }, 500);
        } else {
          showToast('Error: No se pudo recuperar las vidas');
        }
      },
      // onError: si hay un error
      (error) => {
        console.error('❌ Error mostrando anuncio:', error);
        showToast('Error al mostrar el anuncio. Intenta de nuevo.');
      }
    );
  };

  // Función para ver anuncio y obtener vidas extra (para bosses)
  window.watchAdForExtraLives = async function() {
    if (!window.RewardedAd) {
      console.error('RewardedAd no disponible');
      showToast('Error: Sistema de anuncios no disponible');
      return;
    }

    const rewardedAd = new window.RewardedAd();
    
    // Mostrar anuncio
    await rewardedAd.showRewardedAd(
      // onRewarded: cuando el usuario ve el anuncio completo
      async () => {
        console.log('✅ Usuario vio el anuncio, otorgando vidas extra...');
        
        // Verificar si hay un juego de boss que puede continuar
        if (window.bossGameState && window.bossGameState.canContinue) {
          const regionKey = window.bossGameState.originalRegionKey;
          const originalHandicap = window.bossGameState.originalHandicap;
          const originalCallback = window.bossGameState.originalCallback;
          
          // Modificar el handicap para agregar 3 vidas extra
          const newHandicap = { ...originalHandicap };
          newHandicap.playerLives = 3; // Dar 3 vidas extra
          newHandicap.extraLivesFromAd = true; // Marcar que vienen de un anuncio
          
          showToast('✅ ¡3 vidas extra obtenidas!');
          
          // Limpiar el estado de continuación
          window.bossGameState.canContinue = false;
          delete window.bossGameState.originalHandicap;
          delete window.bossGameState.originalRegionKey;
          delete window.bossGameState.originalCallback;
          
          // Reiniciar el juego del boss con las vidas extra
          setTimeout(() => {
            if (window.AdventureBosses) {
              window.AdventureBosses.startBossGame(regionKey, newHandicap, originalCallback);
            }
          }, 500);
        } else {
          showToast('Error: No hay un juego de boss para continuar');
        }
      },
      // onError: si hay un error
      (error) => {
        console.error('❌ Error mostrando anuncio:', error);
        showToast('Error al mostrar el anuncio. Intenta de nuevo.');
      }
    );
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
            `<div class=\"boss-avatar\"><img src=\"${bossImage}\" alt=\"${bossName}\" style=\"width: 200px; height: 200px; object-fit: contain;\" onerror=\"this.onerror=null; if(this.src.endsWith('.png')){this.src=this.src.replace('.png','.webp')}else{this.src=this.src.replace('.webp','.png')}\"/></div>` :
            `<div class="boss-avatar">👺</div>`
          }
          <div class="boss-name">${bossName}</div>
          <div class="boss-dialog-text">
            ${dialog}
          </div>
          <div class="dialog-continue" style="text-align: center; margin-top: 8px; color: var(--muted);">Preparando batalla...</div>
        </div>
      </div>
    `;
  }
  
  // Exportar
  window.AdventureGame = {
    startAdventureLevel
  };

})(window);
