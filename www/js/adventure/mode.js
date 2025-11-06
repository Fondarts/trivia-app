// js/adventure_mode.js - Sistema principal del Modo Aventura
(function(window) {
  'use strict';

  // Estado del modo aventura
  const ADVENTURE_STATE = {
    regions: {
      movies: { 
        name: 'Reino del Cine', 
        icon: '🎬', 
        unlocked: true, 
        nodes: [], 
        boss: 'arkanoid',
        mapImage: 'assets/maps/cine_02.webp',
        bossImage: 'assets/bosses/demon_boss.webp',
        bossName: 'Lord Spoiler',
        bossDialog: '¡Te felicito! Has llegado más lejos de lo que pensaba... ¡Pero hasta aquí llega tu conocimiento y tu suerte!'
      },
      anime: { 
        name: 'Valle Otaku', 
        icon: '🎌', 
        unlocked: false, 
        nodes: [], 
        boss: 'pokemon',
        mapImage: 'assets/maps/anime_02.webp',
        bossImage: 'assets/bosses/demon_anime.webp',
        bossName: 'Otaku Supremo',
        bossDialog: '¡Al fin un rival digno! ¡Nuestra batalla será legendaria!'
      },
      history: { 
        name: 'Tierra Antigua', 
        icon: '📜', 
        unlocked: false, 
        nodes: [], 
        boss: 'tetris',
        mapImage: 'assets/maps/historia_V03.webp',
        bossImage: 'assets/bosses/demon_boss.webp',
        bossName: 'Faraón Eterno',
        bossDialog: '¡Mil años de historia me respaldan! No podrás vencerme.'
      },
      geography: { 
        name: 'Atlas Mundial', 
        icon: '🌍', 
        unlocked: false, 
        nodes: [], 
        boss: 'pacman',
        mapImage: 'assets/maps/geografia_02.webp',
        bossImage: 'assets/bosses/demon_boss.webp',
        bossName: 'Conquistador Global',
        bossDialog: 'He recorrido cada rincón del mundo. ¿Crees conocerlo mejor que yo?'
      },
      science: { 
        name: 'Reino de la Ciencia', 
        icon: '🧪', 
        unlocked: false, 
        nodes: [], 
        boss: 'snake',
        mapImage: 'assets/maps/ciencia_02.webp',
        bossImage: 'assets/bosses/demon_boss.webp',
        bossName: 'Dr. Quantum',
        bossDialog: 'La ciencia es mi dominio. Tus conocimientos son insignificantes.'
      },
      sports: { 
        name: 'Olimpo Deportivo', 
        icon: '⚽', 
        unlocked: false, 
        nodes: [], 
        boss: 'frogger',
        mapImage: 'assets/maps/sports03.webp',
        bossImage: 'assets/bosses/demon_boss.webp',
        bossName: 'Campeón Supremo',
        bossDialog: '¡Soy el mejor atleta de todos los tiempos! Prepárate para perder.'
      }
    },
    currentRegion: 'movies',
    currentNode: 0,
    progress: {},
    lives: 5, // 5 vidas iniciales
    powerUps: [],
    lastLivesRefill: null // Timestamp de última recarga de vidas (24 horas)
  };

  // Cargar progreso guardado
  function loadAdventureProgress() {
    try {
      const saved = localStorage.getItem('adventure_progress');
      if (saved) {
        const data = JSON.parse(saved);
        
        // Verificar que currentRegion sea válido
        if (!data.currentRegion || !ADVENTURE_STATE.regions[data.currentRegion]) {
          data.currentRegion = 'movies';
        }
        
        // Si la región actual no está en movies y movies no tiene progreso, resetear
        if (data.currentRegion !== 'movies' && (!data.regions || !data.regions.movies || !data.regions.movies.nodes || data.regions.movies.nodes.length === 0)) {
          console.log('Datos corruptos detectados, reiniciando aventura');
          resetAdventureProgress();
          return;
        }
        
        // Mezclar datos: preservar metadatos nuevos (mapImage, bossImage, icon, etc.)
        try {
          // Regiones
          if (data.regions && typeof data.regions === 'object') {
            Object.keys(ADVENTURE_STATE.regions).forEach((key) => {
              const defReg = ADVENTURE_STATE.regions[key];
              const savedReg = data.regions[key] || {};
              // Merge shallow: defaults primero, luego datos guardados
              ADVENTURE_STATE.regions[key] = Object.assign({}, defReg, savedReg);
              // Forzar nueva imagen de deportes
              if (key === 'sports') {
                ADVENTURE_STATE.regions[key].mapImage = 'assets/maps/sports03.webp';
              }
              // Asegurar nodos (8)
              if (!Array.isArray(ADVENTURE_STATE.regions[key].nodes) || ADVENTURE_STATE.regions[key].nodes.length === 0) {
                ADVENTURE_STATE.regions[key].nodes = Array(8).fill(null).map((_, i) => ({
                  id: i,
                  type: i === 7 ? 'boss' : (i % 2 === 0 ? 'normal' : 'timed'),
                  completed: false,
                  stars: 0,
                  questions: i === 7 ? 10 : (i % 2 === 0 ? 25 : 999),
                  requiredCorrect: i === 7 ? 0 : (i % 2 === 0 ? 18 : 10),
                  timeLimit: i % 2 === 1 && i !== 7 ? 60 : null
                }));
              }
            });
          }

          // Propiedades escalares del estado
          if (typeof data.currentRegion === 'string') ADVENTURE_STATE.currentRegion = data.currentRegion;
          if (typeof data.currentNode === 'number') ADVENTURE_STATE.currentNode = data.currentNode;
          if (data.progress && typeof data.progress === 'object') ADVENTURE_STATE.progress = data.progress;
          if (typeof data.lives === 'number') ADVENTURE_STATE.lives = data.lives;
          if (Array.isArray(data.powerUps)) ADVENTURE_STATE.powerUps = data.powerUps;
          if (data.lastLivesRefill) ADVENTURE_STATE.lastLivesRefill = data.lastLivesRefill;
        } catch (mergeErr) {
          console.warn('Fallo al mezclar progreso de aventura, usando defaults:', mergeErr);
          // En caso de problema, caer a Object.assign clásico
          Object.assign(ADVENTURE_STATE, data);
        }
      } else {
        // Si no hay datos guardados, asegurar que currentRegion esté configurado
        ADVENTURE_STATE.currentRegion = 'movies';
      }
    } catch (e) {
      console.error('Error loading adventure progress:', e);
      resetAdventureProgress();
    }
    
    // SIEMPRE asegurar que currentRegion sea válido
    if (!ADVENTURE_STATE.currentRegion || !ADVENTURE_STATE.regions[ADVENTURE_STATE.currentRegion]) {
      console.log('currentRegion inválido, configurando a movies');
      ADVENTURE_STATE.currentRegion = 'movies';
    }
    
    // Inicializar nodos para cada región si no existen
    Object.keys(ADVENTURE_STATE.regions).forEach(regionKey => {
      if (ADVENTURE_STATE.regions[regionKey].nodes.length === 0) {
        ADVENTURE_STATE.regions[regionKey].nodes = Array(8).fill(null).map((_, i) => ({
          id: i,
          type: i === 7 ? 'boss' : (i % 2 === 0 ? 'normal' : 'timed'),
          completed: false,
          stars: 0,
          questions: i === 7 ? 10 : (i % 2 === 0 ? 25 : 999),  // Normal: 25, Contrarreloj: ilimitado, Jefe: 10
          requiredCorrect: i === 7 ? 0 : (i % 2 === 0 ? 18 : 10),  // Normal: 18, Contrarreloj: 10 mínimo para 1 estrella
          timeLimit: i % 2 === 1 && i !== 7 ? 60 : null  // 60 segundos para contrarreloj
        }));
      }
    });
    
    // Verificar y recargar vidas si pasaron 24 horas al cargar
    checkAndRefillLives();
  }

  // Guardar progreso
  function saveAdventureProgress() {
    try {
      localStorage.setItem('adventure_progress', JSON.stringify({
        regions: ADVENTURE_STATE.regions,
        currentRegion: ADVENTURE_STATE.currentRegion,
        currentNode: ADVENTURE_STATE.currentNode,
        progress: ADVENTURE_STATE.progress,
        lives: ADVENTURE_STATE.lives,
        powerUps: ADVENTURE_STATE.powerUps,
        lastLivesRefill: ADVENTURE_STATE.lastLivesRefill
      }));
    } catch (e) {
      console.error('Error saving adventure progress:', e);
    }
  }

  // Iniciar aventura en una región
  function startAdventureRegion(regionKey) {
    // Si God Mode está activo, permitir acceso a cualquier región
    if (!window.godModeActive && !ADVENTURE_STATE.regions[regionKey].unlocked) {
      if (window.toast) window.toast('🔒 Esta región aún no está desbloqueada');
      return false;
    }
    
    // Si God Mode está activo y la región está bloqueada, mostrar mensaje
    if (window.godModeActive && !ADVENTURE_STATE.regions[regionKey].unlocked) {
      if (window.toast) window.toast('👁️ God Mode: Accediendo a región bloqueada');
    }
    
    ADVENTURE_STATE.currentRegion = regionKey;
    ADVENTURE_STATE.currentNode = 0;
    
    // Encontrar el primer nodo no completado
    const nodes = ADVENTURE_STATE.regions[regionKey].nodes;
    for (let i = 0; i < nodes.length; i++) {
      if (!nodes[i].completed) {
        ADVENTURE_STATE.currentNode = i;
        break;
      }
    }
    
    saveAdventureProgress();
    return true;
  }

  // Empezar un nodo
  async function startAdventureNode(nodeIndex) {
    const regionKey = ADVENTURE_STATE.currentRegion;
    const region = ADVENTURE_STATE.regions[regionKey];
    
    if (!region) {
      console.error('Región no encontrada:', regionKey);
      return null;
    }
    
    const node = region.nodes[nodeIndex];
    
    if (!node) {
      console.error('Nodo no encontrado:', nodeIndex);
      return null;
    }
    
    // Ya no verificar si puede jugar aquí - eso se hace en handleNodeClick
    // Solo trackear si está disponible
    if (window.trackEvent) {
      await window.trackEvent('adventure_node_start', { 
        region: regionKey, 
        node: nodeIndex,
        type: node.type 
      });
    }
    
    // Construir deck de preguntas
    let deck = [];
    
    console.log('startAdventureNode - regionKey:', regionKey);
    console.log('startAdventureNode - nodeIndex:', nodeIndex);
    console.log('startAdventureNode - node:', node);
    
    // Obtener el banco directamente
    if (window.getBank && window.buildDeckSingle) {
      const bank = window.getBank();
      
      // Verificar que hay preguntas disponibles
      if (bank && bank[regionKey] && bank[regionKey].length > 0) {
        console.log(`Usando ${bank[regionKey].length} preguntas de ${regionKey}`);
        
        // Para el jefe: 10 preguntas aleatorias
        // Para niveles normales: 25 preguntas aleatorias
        const questionsNeeded = nodeIndex === 7 ? 10 : 25;
        
        // Copiar las preguntas disponibles
        const availableQuestions = [...bank[regionKey]];
        
        // Mezclar las preguntas
        for (let i = availableQuestions.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [availableQuestions[i], availableQuestions[j]] = [availableQuestions[j], availableQuestions[i]];
        }
        
        // Tomar las que necesitamos
        deck = availableQuestions.slice(0, Math.min(questionsNeeded, availableQuestions.length));
        
        // Si no hay suficientes, repetir algunas
        while (deck.length < questionsNeeded && availableQuestions.length > 0) {
          const extra = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
          deck.push(extra);
        }
        
        console.log(`Deck construido con ${deck.length} preguntas`);
      } else {
        console.error('No hay preguntas en el banco para', regionKey);
        
        // Intentar con TODAS las categorías como fallback
        const allQuestions = [];
        Object.keys(bank).forEach(cat => {
          if (bank[cat] && Array.isArray(bank[cat])) {
            allQuestions.push(...bank[cat]);
          }
        });
        
        if (allQuestions.length > 0) {
          console.log('Usando preguntas de todas las categorías:', allQuestions.length);
          const questionsNeeded = nodeIndex === 7 ? 10 : 25;
          
          // Mezclar
          for (let i = allQuestions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [allQuestions[i], allQuestions[j]] = [allQuestions[j], allQuestions[i]];
          }
          
          deck = allQuestions.slice(0, Math.min(questionsNeeded, allQuestions.length));
        }
      }
    } else {
      // Fallback: crear preguntas de prueba
      console.warn('buildDeckSingle no disponible, usando preguntas de prueba');
      for (let i = 0; i < node.questions; i++) {
        deck.push({
          q: `Pregunta ${i + 1} de ${regionKey}`,
          options: ['Opción A', 'Opción B', 'Opción C', 'Opción D'],
          answer: Math.floor(Math.random() * 4),
          category: regionKey,
          difficulty: nodeIndex < 3 ? 'easy' : nodeIndex < 6 ? 'medium' : 'hard'
        });
      }
    }
    
    console.log('Deck construido con', deck.length, 'preguntas');
    
    const result = {
      deck,
      node,
      region: regionKey,  // Usar regionKey en lugar de currentRegion
      nodeIndex,
      isBoss: node.type === 'boss',
      isTimed: node.type === 'timed',
      timeLimit: node.type === 'timed' ? 60 : null  // 60 segundos para contrarreloj
    };
    
    console.log('Retornando datos del nodo:', result);
    return result;
  }

  // Función para verificar y recargar vidas si pasaron 24 horas
  function checkAndRefillLives() {
    const now = Date.now();
    const REFILL_INTERVAL = 24 * 60 * 60 * 1000; // 24 horas en milisegundos
    
    console.log('🔄 checkAndRefillLives llamado', {
      currentLives: ADVENTURE_STATE.lives,
      lastRefill: ADVENTURE_STATE.lastLivesRefill,
      timeSinceRefill: ADVENTURE_STATE.lastLivesRefill ? now - ADVENTURE_STATE.lastLivesRefill : null,
      shouldRefill: ADVENTURE_STATE.lastLivesRefill ? (now - ADVENTURE_STATE.lastLivesRefill >= REFILL_INTERVAL) : false
    });
    
    // Si no hay timestamp de última recarga, inicializar
    if (!ADVENTURE_STATE.lastLivesRefill) {
      console.log('⏰ Inicializando lastLivesRefill');
      ADVENTURE_STATE.lastLivesRefill = now;
      saveAdventureProgress();
      return false;
    }
    
    // Si pasaron 24 horas, recargar vidas
    if (now - ADVENTURE_STATE.lastLivesRefill >= REFILL_INTERVAL) {
      console.log('⏰ Pasaron 24 horas, verificando si recargar vidas');
      if (ADVENTURE_STATE.lives < 5) {
        console.log('✅ Recargando vidas de', ADVENTURE_STATE.lives, 'a 5');
        ADVENTURE_STATE.lives = 5;
        ADVENTURE_STATE.lastLivesRefill = now;
        saveAdventureProgress();
        if (window.toast) window.toast('⏰ ¡Tus vidas se han recargado!');
        return true; // Se recargaron vidas
      }
      // Actualizar timestamp aunque ya tengas 5 vidas
      console.log('⏰ Ya tienes 5 vidas, solo actualizando timestamp');
      ADVENTURE_STATE.lastLivesRefill = now;
      saveAdventureProgress();
    } else {
      console.log('⏰ No pasaron 24 horas, no se recargan vidas');
    }
    
    return false; // No se recargaron vidas
  }
  
  // Función para obtener tiempo restante hasta próxima recarga
  function getTimeUntilRefill() {
    if (!ADVENTURE_STATE.lastLivesRefill) return null;
    
    const now = Date.now();
    const REFILL_INTERVAL = 24 * 60 * 60 * 1000; // 24 horas
    const timePassed = now - ADVENTURE_STATE.lastLivesRefill;
    const timeRemaining = REFILL_INTERVAL - timePassed;
    
    if (timeRemaining <= 0) return null; // Ya pasó el tiempo
    
    const hours = Math.floor(timeRemaining / (60 * 60 * 1000));
    const minutes = Math.floor((timeRemaining % (60 * 60 * 1000)) / (60 * 1000));
    
    return { hours, minutes, total: timeRemaining };
  }

  // Función para perder una vida
  function loseLife() {
    console.log('💔 loseLife llamado. Vidas antes:', ADVENTURE_STATE.lives);
    
    // Verificar si se pueden recargar vidas primero
    const refilled = checkAndRefillLives();
    console.log('💔 Después de checkAndRefillLives. Vidas:', ADVENTURE_STATE.lives, 'Refilled:', refilled);
    
    if (ADVENTURE_STATE.lives > 0) {
      ADVENTURE_STATE.lives--;
      console.log('💔 Vida restada. Vidas restantes:', ADVENTURE_STATE.lives);
      saveAdventureProgress();
      console.log('💔 Progreso guardado. Vidas en estado:', ADVENTURE_STATE.lives);
      
      if (ADVENTURE_STATE.lives === 0) {
        // NO reiniciar automáticamente - mostrar modal con opciones
        console.log('💔 Sin vidas, mostrando modal');
        showNoLivesModal();
        return 'no_lives'; // Indica que se quedó sin vidas
      }
      
      if (window.toast) window.toast(`❤️ Perdiste una vida. Te quedan ${ADVENTURE_STATE.lives} vidas.`);
      
      // Notificar que las vidas cambiaron para actualizar la UI
      console.log('💖 Vidas actualizadas, debería actualizarse la UI del mapa');
    } else {
      console.log('💔 Ya no hay vidas, no se puede restar más');
    }
    return false; // No se reinició el mapa
  }
  
  // Función para mostrar modal cuando te quedas sin vidas
  function showNoLivesModal() {
    console.log('💔 showNoLivesModal llamado');
    
    // ESPERAR a que termine cualquier renderizado del mapa antes de crear el modal
    // Esto evita que el modal se elimine si renderRegionNodes se ejecuta después
    setTimeout(() => {
      const adventureFS = document.getElementById('fsAdventure');
      const gameArea = document.getElementById('adventureGameArea');
      
      // Ocultar el mapa si está visible
      if (adventureFS) {
        adventureFS.style.display = 'none';
      }
      
      // Ocultar gameArea si está visible
      if (gameArea) {
        gameArea.style.display = 'none';
      }
      
      // Crear o obtener el modal directamente en el body
      let modalContainer = document.getElementById('noLivesModalContainer');
      if (!modalContainer) {
        modalContainer = document.createElement('div');
        modalContainer.id = 'noLivesModalContainer';
        document.body.appendChild(modalContainer);
        console.log('✅ modalContainer creado y añadido al body');
      } else {
        console.log('✅ modalContainer ya existe');
      }
      
      // Asegurarse de que el modal esté visible y en la parte superior
      modalContainer.style.display = 'block';
      modalContainer.style.position = 'fixed';
      modalContainer.style.top = '0';
      modalContainer.style.left = '0';
      modalContainer.style.right = '0';
      modalContainer.style.bottom = '0';
      modalContainer.style.zIndex = '99999';
      modalContainer.style.pointerEvents = 'auto';
      
      // Función para actualizar el timer
      function updateTimer() {
        const timeUntilRefill = getTimeUntilRefill();
        const timerElement = document.getElementById('noLivesTimer');
        
        if (!timerElement) return;
        
        if (timeUntilRefill) {
          const hours = timeUntilRefill.hours;
          const minutes = timeUntilRefill.minutes;
          const seconds = Math.floor((timeUntilRefill.total % (60 * 1000)) / 1000);
          timerElement.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        } else {
          timerElement.textContent = '24:00:00';
        }
      }
      
      // Inicializar el timestamp si no existe
      if (!ADVENTURE_STATE.lastLivesRefill) {
        ADVENTURE_STATE.lastLivesRefill = Date.now();
        saveAdventureProgress();
      }
      
      // Obtener mensaje inicial
      const timeUntilRefill = getTimeUntilRefill();
      let refillMessage = '';
      
      if (timeUntilRefill) {
        const hours = timeUntilRefill.hours;
        const minutes = timeUntilRefill.minutes;
        refillMessage = `Tus vidas se recargarán en ${hours}h ${minutes}m`;
      } else {
        refillMessage = 'Tus vidas se recargarán en 24 horas';
      }
      
      // Limpiar contenido previo
      modalContainer.innerHTML = '';
      
      console.log('🔍 Creando contenido del modal...');
      console.log('🔍 modalContainer en DOM:', document.body.contains(modalContainer));
      console.log('🔍 modalContainer display:', modalContainer.style.display);
      console.log('🔍 modalContainer z-index:', modalContainer.style.zIndex);
      
      // Crear el HTML del modal
      const modalHTML = `
      <div class="no-lives-modal" style="
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        background: rgba(0, 0, 0, 0.75) !important;
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        justify-content: center !important;
        z-index: 99999 !important;
        padding: 20px !important;
        font-family: 'Arial', sans-serif !important;
        pointer-events: auto !important;
        visibility: visible !important;
        opacity: 1 !important;
      ">
        <div style="
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          border-radius: 20px;
          padding: 40px;
          max-width: 500px;
          width: 100%;
          text-align: center;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
        ">
          <div style="font-size: 80px; margin-bottom: 20px;">💔</div>
          <h2 style="color: #fff; font-size: 28px; margin-bottom: 15px; font-weight: bold;">
            ¡Te quedaste sin vidas!
          </h2>
          <p style="color: #ccc; font-size: 16px; margin-bottom: 30px; line-height: 1.6;">
            Has perdido todas tus vidas en el modo aventura.
          </p>
          
          <div style="
            background: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 30px;
          ">
            <div style="color: #fff; font-size: 18px; font-weight: bold; margin-bottom: 10px;">
              ⏰ Recarga Automática
            </div>
            <div id="noLivesTimer" style="color: #4CAF50; font-size: 32px; font-weight: bold; font-family: 'Courier New', monospace; margin: 10px 0;">
              ${timeUntilRefill ? `${timeUntilRefill.hours.toString().padStart(2, '0')}:${timeUntilRefill.minutes.toString().padStart(2, '0')}:00` : '24:00:00'}
            </div>
            <div style="color: #aaa; font-size: 14px; margin-top: 10px;">
              ${refillMessage}
            </div>
          </div>
          
          <div style="display: flex; flex-direction: column; gap: 15px;">
            <button onclick="window.watchAdForAdventureLives()" style="
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: #fff;
              border: none;
              border-radius: 10px;
              padding: 15px 30px;
              font-size: 18px;
              font-weight: bold;
              cursor: pointer;
              transition: transform 0.2s;
            " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
              📺 Ver Anuncio (Recuperar 5 Vidas)
            </button>
            
            <button onclick="window.backToRegionMap()" style="
              background: rgba(255, 255, 255, 0.1);
              color: #fff;
              border: 2px solid rgba(255, 255, 255, 0.3);
              border-radius: 10px;
              padding: 15px 30px;
              font-size: 16px;
              font-weight: bold;
              cursor: pointer;
              transition: background 0.2s;
            " onmouseover="this.style.background='rgba(255, 255, 255, 0.2)'" onmouseout="this.style.background='rgba(255, 255, 255, 0.1)'">
              Volver al Mapa
            </button>
          </div>
        </div>
      </div>
      `;
      
      // Insertar el HTML usando insertAdjacentHTML para asegurar que se inserte
      try {
        // Limpiar primero
        modalContainer.innerHTML = '';
        
        // Insertar el HTML
        modalContainer.insertAdjacentHTML('beforeend', modalHTML);
      
        console.log('✅ HTML insertado en modalContainer usando insertAdjacentHTML');
        console.log('✅ modalContainer.innerHTML length:', modalContainer.innerHTML.length);
        console.log('✅ modalContainer.children.length:', modalContainer.children.length);
        
        // Verificar inmediatamente si el elemento se creó
        const modalElementCheck = modalContainer.querySelector('.no-lives-modal');
        console.log('🔍 Modal element encontrado inmediatamente:', !!modalElementCheck);
        if (modalElementCheck) {
          console.log('✅ Modal element creado correctamente');
          console.log('✅ Modal element display:', window.getComputedStyle(modalElementCheck).display);
          console.log('✅ Modal element z-index:', window.getComputedStyle(modalElementCheck).zIndex);
        } else {
          console.error('❌ Modal element NO encontrado después de insertar HTML');
          console.error('❌ modalContainer.innerHTML:', modalContainer.innerHTML.substring(0, 200));
          console.error('❌ modalContainer.children:', modalContainer.children);
          
          // Intentar de nuevo con innerHTML directamente
          console.log('🔄 Intentando con innerHTML directamente...');
          modalContainer.innerHTML = modalHTML;
          const modalElementCheck2 = modalContainer.querySelector('.no-lives-modal');
          console.log('🔍 Modal element encontrado después de innerHTML:', !!modalElementCheck2);
        }
      } catch (error) {
        console.error('❌ Error al insertar HTML:', error);
        console.error('❌ Error stack:', error.stack);
      }
      
      // Forzar que el modal sea visible después de que se cree el HTML
      setTimeout(() => {
        // Verificar que el modal se haya creado
        const modalElement = modalContainer.querySelector('.no-lives-modal');
        console.log('🔍 Modal element encontrado:', !!modalElement);
        
        modalContainer.style.display = 'block';
        modalContainer.style.visibility = 'visible';
        modalContainer.style.opacity = '1';
        
        if (modalElement) {
          console.log('🔍 Modal element display:', window.getComputedStyle(modalElement).display);
          console.log('🔍 Modal element z-index:', window.getComputedStyle(modalElement).zIndex);
          console.log('🔍 Modal element visibility:', window.getComputedStyle(modalElement).visibility);
          console.log('🔍 Modal element opacity:', window.getComputedStyle(modalElement).opacity);
          
          modalElement.style.display = 'flex';
          modalElement.style.visibility = 'visible';
          modalElement.style.opacity = '1';
        }
        
        console.log('✅ Modal forzado a ser visible');
        console.log('✅ modalContainer display:', modalContainer.style.display);
        console.log('✅ modalContainer en DOM:', document.body.contains(modalContainer));
        console.log('✅ modalContainer offsetWidth:', modalContainer.offsetWidth);
        console.log('✅ modalContainer offsetHeight:', modalContainer.offsetHeight);
        console.log('✅ modalContainer getBoundingClientRect:', modalContainer.getBoundingClientRect());
      }, 10);
      
      // Actualizar el timer cada segundo
      const timerInterval = setInterval(() => {
        updateTimer();
        
        // Verificar si ya pasaron 24 horas
        const timeUntilRefill = getTimeUntilRefill();
        if (!timeUntilRefill || timeUntilRefill.total <= 0) {
          // Si ya pasaron 24 horas, recargar vidas y cerrar el modal
          clearInterval(timerInterval);
          checkAndRefillLives();
          // Cerrar el modal
          if (modalContainer) {
            modalContainer.style.display = 'none';
            modalContainer.innerHTML = '';
          }
          if (window.backToRegionMap) {
            window.backToRegionMap();
          }
        }
      }, 1000);
      
      // Guardar el intervalo para poder limpiarlo si es necesario
      window.__noLivesTimerInterval__ = timerInterval;
      
      console.log('✅ Modal de sin vidas mostrado en modalContainer');
      console.log('✅ Modal visible:', modalContainer.style.display);
      console.log('✅ Modal z-index:', modalContainer.style.zIndex);
    }, 100); // Esperar 100ms para asegurar que cualquier renderizado del mapa haya terminado
  }
  
  // Completar un nodo
  async function completeAdventureNode(nodeIndex, score, total, failed = false) {
    const region = ADVENTURE_STATE.regions[ADVENTURE_STATE.currentRegion];
    const node = region.nodes[nodeIndex];
    
    // Si el jugador falló el nivel
    if (failed) {
      const mapReset = loseLife();
      return {
        stars: 0,
        failed: true,
        mapReset,
        livesRemaining: ADVENTURE_STATE.lives
      };
    }
    
    // Calcular estrellas basado en respuestas correctas
    let stars = 0;
    if (nodeIndex === 7) {  // Es el jefe
      if (score >= 7) stars = 1;
      if (score >= 9) stars = 2;
      if (score === 10) stars = 3;
    } else if (node.type === 'timed') {  // Contrarreloj
      if (score >= 10) stars = 1;   // 10 para 1 estrella
      if (score >= 14) stars = 2;   // 14 para 2 estrellas  
      if (score >= 18) stars = 3;   // 18 para 3 estrellas
    } else {  // Nivel normal
      if (score >= 18) stars = 1;
      if (score >= 23) stars = 2;
      if (score === 25) stars = 3;
    }
    
    // Actualizar nodo
    node.completed = true;
    node.stars = Math.max(node.stars, stars);
    
    // Trackear completado si está disponible
    let results = {};
    if (window.trackEvent) {
      results = await window.trackEvent('adventure_node_complete', {
        region: ADVENTURE_STATE.currentRegion,
        node: nodeIndex,
        stars,
        score,
        total
      });
    }
    
    // Desbloquear siguiente región específica según la región actual
    if (nodeIndex === 7 && stars > 0) {
      let nextRegionKey = null;
      
      // Definir el orden correcto de desbloqueo
      const unlockOrder = {
        'movies': 'anime',
        'anime': 'history',
        'history': 'geography',
        'geography': 'science',
        'science': 'sports'
      };
      
      nextRegionKey = unlockOrder[ADVENTURE_STATE.currentRegion];
      
      if (nextRegionKey && ADVENTURE_STATE.regions[nextRegionKey]) {
        ADVENTURE_STATE.regions[nextRegionKey].unlocked = true;
        if (window.toast) window.toast(`🎊 ¡Nueva región desbloqueada: ${ADVENTURE_STATE.regions[nextRegionKey].name}!`);
      }
    }
    
    // Avanzar al siguiente nodo
    if (nodeIndex < 7) {
      ADVENTURE_STATE.currentNode = nodeIndex + 1;
    }
    
    saveAdventureProgress();
    
    return {
      stars,
      newRegionUnlocked: nodeIndex === 7 && stars > 0,
      ...results
    };
  }

  // Obtener handicap para el boss
  function getBossHandicap(questionsScore, questionsTotal) {
    // No hay mínimo para pasar, siempre se llega al jefe
    // El handicap se calcula según el desempeño en las 10 preguntas
    
    // Para Tetris (historia) y Hangman (geography), usar sistema de 5 niveles
    const region = ADVENTURE_STATE.regions[ADVENTURE_STATE.currentRegion];
    
    // Para Hangman (geography), usar sistema de 5 niveles con dificultad de palabras, errores máximos y pistas
    if (ADVENTURE_STATE.currentRegion === 'geography' || (region && region.boss === 'pacman')) {
      // Nivel 1: 10 correctas - Muy fácil
      if (questionsScore === 10) {
        return {
          type: 'level1',
          playerLives: 5,
          bossLives: 3,
          playerSpeed: 1.0,
          bossSpeed: 1.0,
          extraRows: 0,
          maxWrongGuesses: 8,       // 8 errores permitidos
          hints: 3,                  // 3 pistas disponibles
          wordDifficulty: 'easy',    // Palabras fáciles (4-6 letras)
          message: '¡Perfecto! Nivel 1: Palabras fáciles, 8 errores permitidos, 3 pistas disponibles'
        };
      }
      // Nivel 2: 8-9 correctas - Fácil
      else if (questionsScore >= 8) {
        return {
          type: 'level2',
          playerLives: 4,
          bossLives: 3,
          playerSpeed: 1.0,
          bossSpeed: 1.2,
          extraRows: 1,
          maxWrongGuesses: 7,       // 7 errores permitidos
          hints: 2,                  // 2 pistas disponibles
          wordDifficulty: 'easy',    // Palabras fáciles
          message: 'Muy bien! Nivel 2: Palabras fáciles, 7 errores permitidos, 2 pistas disponibles'
        };
      }
      // Nivel 3: 5-7 correctas - Normal
      else if (questionsScore >= 5) {
        return {
          type: 'level3',
          playerLives: 2,
          bossLives: 4,
          playerSpeed: 1.0,
          bossSpeed: 1.4,
          extraRows: 2,
          maxWrongGuesses: 6,       // 6 errores permitidos (normal)
          hints: 1,                  // 1 pista disponible
          wordDifficulty: 'medium',  // Palabras medias (7-9 letras)
          message: 'Regular. Nivel 3: Palabras medias, 6 errores permitidos, 1 pista disponible'
        };
      }
      // Nivel 4: 2-4 correctas - Difícil
      else if (questionsScore >= 2) {
        return {
          type: 'level4',
          playerLives: 1,
          bossLives: 5,
          playerSpeed: 1.0,
          bossSpeed: 1.6,
          extraRows: 3,
          maxWrongGuesses: 5,       // 5 errores permitidos
          hints: 0,                  // Sin pistas
          wordDifficulty: 'hard',    // Palabras difíciles (10+ letras)
          message: 'Difícil. Nivel 4: Palabras difíciles, 5 errores permitidos, sin pistas'
        };
      }
      // Nivel 5: 0-1 correctas - Muy difícil
      else {
        return {
          type: 'level5',
          playerLives: 1,
          bossLives: 5,
          playerSpeed: 1.0,
          bossSpeed: 1.8,
          extraRows: 3,
          maxWrongGuesses: 4,       // Solo 4 errores permitidos
          hints: 0,                  // Sin pistas
          wordDifficulty: 'hard',    // Palabras difíciles
          message: 'Muy difícil! Nivel 5: Palabras difíciles, solo 4 errores permitidos, sin pistas'
        };
      }
    }
    
    // Para Frogger (sports), usar sistema de 5 niveles con marcador inicial del oponente
    if (region && region.boss === 'frogger' || ADVENTURE_STATE.currentRegion === 'sports') {
      // Nivel 1: 10 correctas - Muy fácil
      if (questionsScore === 10) {
        return {
          type: 'level1',
          playerLives: 5,
          bossLives: 3,
          playerSpeed: 1.0,
          bossSpeed: 1.0,
          extraRows: 0,
          opponentScore: 3,  // Marcador inicial: 0-3
          message: '¡Perfecto! Nivel 1: Partido empieza 0-3, necesitas ganar para vencer'
        };
      }
      // Nivel 2: 8-9 correctas - Fácil
      else if (questionsScore >= 8) {
        return {
          type: 'level2',
          playerLives: 4,
          bossLives: 3,
          playerSpeed: 1.0,
          bossSpeed: 1.2,
          extraRows: 1,
          opponentScore: 5,  // Marcador inicial: 0-5
          message: 'Muy bien! Nivel 2: Partido empieza 0-5, necesitas ganar para vencer'
        };
      }
      // Nivel 3: 5-7 correctas - Normal
      else if (questionsScore >= 5) {
        return {
          type: 'level3',
          playerLives: 2,
          bossLives: 4,
          playerSpeed: 1.0,
          bossSpeed: 1.4,
          extraRows: 2,
          opponentScore: 7,  // Marcador inicial: 0-7
          message: 'Regular. Nivel 3: Partido empieza 0-7, necesitas ganar para vencer'
        };
      }
      // Nivel 4: 2-4 correctas - Difícil
      else if (questionsScore >= 2) {
        return {
          type: 'level4',
          playerLives: 1,
          bossLives: 5,
          playerSpeed: 1.0,
          bossSpeed: 1.6,
          extraRows: 3,
          opponentScore: 9,  // Marcador inicial: 0-9
          message: 'Difícil. Nivel 4: Partido empieza 0-9, necesitas ganar para vencer'
        };
      }
      // Nivel 5: 0-1 correctas - Muy difícil
      else {
        return {
          type: 'level5',
          playerLives: 1,
          bossLives: 5,
          playerSpeed: 1.0,
          bossSpeed: 1.8,
          extraRows: 3,
          opponentScore: 11,  // Marcador inicial: 0-11
          message: 'Muy difícil! Nivel 5: Partido empieza 0-11, necesitas ganar para vencer'
        };
      }
    }
    
    // Para Tetris (historia), usar sistema de 5 niveles con líneas basura, velocidad y líneas requeridas
    if (region && region.boss === 'tetris') {
      // Nivel 1: 10 correctas - Muy fácil
      if (questionsScore === 10) {
        return {
          type: 'level1',
          playerLives: 5,
          bossLives: 3,
          playerSpeed: 1.0,
          bossSpeed: 1.0,
          extraRows: 0,
          startingLines: 0,  // Sin líneas basura
          linesRequired: 8,   // 8 líneas para ganar
          message: '¡Perfecto! Nivel 1: Sin líneas basura, velocidad normal, 8 líneas requeridas'
        };
      }
      // Nivel 2: 8-9 correctas - Fácil
      else if (questionsScore >= 8) {
        return {
          type: 'level2',
          playerLives: 4,
          bossLives: 3,
          playerSpeed: 1.0,
          bossSpeed: 1.2,
          extraRows: 1,
          startingLines: 1,  // 1 línea basura
          linesRequired: 10,  // 10 líneas para ganar
          message: 'Muy bien! Nivel 2: 1 línea basura, velocidad rápida, 10 líneas requeridas'
        };
      }
      // Nivel 3: 5-7 correctas - Normal
      else if (questionsScore >= 5) {
        return {
          type: 'level3',
          playerLives: 2,
          bossLives: 4,
          playerSpeed: 1.0,
          bossSpeed: 1.4,
          extraRows: 2,
          startingLines: 2,  // 2 líneas basura
          linesRequired: 12,  // 12 líneas para ganar
          message: 'Regular. Nivel 3: 2 líneas basura, velocidad muy rápida, 12 líneas requeridas'
        };
      }
      // Nivel 4: 2-4 correctas - Difícil
      else if (questionsScore >= 2) {
        return {
          type: 'level4',
          playerLives: 1,
          bossLives: 5,
          playerSpeed: 1.0,
          bossSpeed: 1.6,
          extraRows: 3,
          startingLines: 3,  // 3 líneas basura
          linesRequired: 15,  // 15 líneas para ganar
          message: 'Difícil. Nivel 4: 3 líneas basura, velocidad extrema, 15 líneas requeridas'
        };
      }
      // Nivel 5: 0-1 correctas - Muy difícil
      else {
        return {
          type: 'level5',
          playerLives: 1,
          bossLives: 5,
          playerSpeed: 1.0,
          bossSpeed: 1.8,
          extraRows: 3,
          startingLines: 4,  // 4 líneas basura
          linesRequired: 18,  // 18 líneas para ganar
          message: 'Muy difícil! Nivel 5: 4 líneas basura, velocidad máxima, 18 líneas requeridas'
        };
      }
    }
    
    // Para otros bosses, mantener el sistema anterior
    if (questionsScore === 10) {
      return {
        type: 'perfect',
        playerLives: 5,
        bossLives: 3,
        playerSpeed: 1.0,
        bossSpeed: 1.0,
        extraRows: 0,
        message: '¡Perfecto! Tienes la ventaja máxima: 5 vidas vs 3 del jefe'
      };
    } else if (questionsScore >= 8) {
      return {
        type: 'good',
        playerLives: 4,
        bossLives: 3,
        playerSpeed: 1.0,
        bossSpeed: 1.2,
        extraRows: 1,
        message: 'Muy bien: 4 vidas, jefe más rápido y 1 fila extra de bloques'
      };
    } else if (questionsScore >= 4) {
      return {
        type: 'medium',
        playerLives: 2,
        bossLives: 4,
        playerSpeed: 1.0,
        bossSpeed: 1.4,
        extraRows: 2,
        message: 'Regular: 2 vidas, jefe rápido y 2 filas extra de bloques'
      };
    } else {
      return {
        type: 'hard',
        playerLives: 1,
        bossLives: 5,
        playerSpeed: 1.0,
        bossSpeed: 1.5,
        extraRows: 3,
        message: 'Difícil: 1 vida, jefe muy rápido y 3 filas extra de bloques'
      };
    }
  }

  // Obtener estadísticas
  function getAdventureStats() {
    let totalStars = 0;
    let totalNodes = 0;
    let completedNodes = 0;
    let unlockedRegions = 0;
    
    Object.values(ADVENTURE_STATE.regions).forEach(region => {
      if (region.unlocked) unlockedRegions++;
      region.nodes.forEach(node => {
        totalNodes++;
        if (node.completed) {
          completedNodes++;
          totalStars += node.stars;
        }
      });
    });
    
    return {
      totalStars,
      maxStars: totalNodes * 3,
      completedNodes,
      totalNodes,
      unlockedRegions,
      totalRegions: Object.keys(ADVENTURE_STATE.regions).length,
      percentage: Math.round((completedNodes / totalNodes) * 100)
    };
  }

  // Reiniciar todo el progreso de aventura
  function resetAdventureProgress() {
    // Reiniciar estado
    Object.keys(ADVENTURE_STATE.regions).forEach((key) => {
      ADVENTURE_STATE.regions[key].unlocked = key === 'movies'; // Solo movies desbloqueado
      ADVENTURE_STATE.regions[key].nodes = Array(8).fill(null).map((_, i) => ({
        id: i,
        type: i === 7 ? 'boss' : (i % 2 === 0 ? 'normal' : 'timed'),
        completed: false,
        stars: 0,
        questions: i === 7 ? 10 : (i % 2 === 0 ? 25 : 999),
        requiredCorrect: i === 7 ? 7 : (i % 2 === 0 ? 18 : 10),
        timeLimit: i % 2 === 1 && i !== 7 ? 60 : null
      }));
    });
    
    ADVENTURE_STATE.currentRegion = 'movies'; // Empezar en movies
    ADVENTURE_STATE.currentNode = 0;
    ADVENTURE_STATE.progress = {};
    ADVENTURE_STATE.lives = 5; // Reiniciar con 5 vidas
    ADVENTURE_STATE.powerUps = [];
    
    // Limpiar localStorage
    localStorage.removeItem('adventure_progress');
    saveAdventureProgress();
    
    if (window.toast) window.toast('🔄 Progreso de aventura reiniciado');
    return true;
  }
  
  // Función para limpiar datos corruptos
  function cleanCorruptedData() {
    try {
      const saved = localStorage.getItem('adventure_progress');
      if (saved) {
        const data = JSON.parse(saved);
        // Si los datos están corruptos o incompletos, resetear
        if (!data || !data.regions || !data.currentRegion || 
            !data.regions.movies || !data.regions.movies.nodes || 
            data.regions.movies.nodes.length === 0) {
          console.log('Datos de aventura corruptos detectados, limpiando...');
          resetAdventureProgress();
          return true;
        }
      }
    } catch (e) {
      console.error('Error al verificar datos:', e);
      resetAdventureProgress();
      return true;
    }
    return false;
  }

  // Exportar al objeto window
  window.AdventureMode = {
    ADVENTURE_STATE,
    loadAdventureProgress,
    saveAdventureProgress,
    startAdventureRegion,
    startAdventureNode,
    completeAdventureNode,
    getBossHandicap,
    getAdventureStats,
    resetAdventureProgress,
    loseLife, // Exportar función de perder vida
    checkAndRefillLives, // Exportar función de verificar recarga
    getTimeUntilRefill, // Exportar función de tiempo restante
    saveAdventureProgress, // Exportar función de guardar progreso
    showNoLivesModal, // Exportar función para mostrar modal de sin vidas
    // Agregar una función directa para God Mode
    startNodeDirectly: async function(regionKey, nodeIndex) {
      console.log('startNodeDirectly - God Mode override');
      ADVENTURE_STATE.currentRegion = regionKey;
      return await startAdventureNode(nodeIndex);
    }
  };

})(window);
