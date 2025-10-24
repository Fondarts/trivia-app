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
        mapImage: 'assets/maps/cine.webp',
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
        mapImage: 'assets/maps/anime.webp',
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
        mapImage: 'assets/maps/historia.webp',
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
        mapImage: 'assets/maps/geografia.webp',
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
        mapImage: 'assets/maps/ciencia.webp',
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
        mapImage: 'assets/maps/sports02.webp',
        bossImage: 'assets/bosses/demon_boss.webp',
        bossName: 'Campeón Supremo',
        bossDialog: '¡Soy el mejor atleta de todos los tiempos! Prepárate para perder.'
      }
    },
    currentRegion: 'movies',
    currentNode: 0,
    progress: {},
    lives: 5, // 5 vidas iniciales
    powerUps: []
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
                ADVENTURE_STATE.regions[key].mapImage = 'assets/maps/sports02.webp';
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
        powerUps: ADVENTURE_STATE.powerUps
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

  // Función para perder una vida
  function loseLife() {
    if (ADVENTURE_STATE.lives > 0) {
      ADVENTURE_STATE.lives--;
      saveAdventureProgress();
      
      if (ADVENTURE_STATE.lives === 0) {
        // Reiniciar el mapa actual
        const currentRegion = ADVENTURE_STATE.currentRegion;
        ADVENTURE_STATE.regions[currentRegion].nodes.forEach(node => {
          node.completed = false;
          node.stars = 0;
        });
        ADVENTURE_STATE.lives = 5; // Restaurar vidas
        ADVENTURE_STATE.currentNode = 0;
        saveAdventureProgress();
        
        if (window.toast) window.toast('💔 Te quedaste sin vidas. El mapa se ha reiniciado.');
        return true; // Indica que se reinició el mapa
      }
      
      if (window.toast) window.toast(`❤️ Perdiste una vida. Te quedan ${ADVENTURE_STATE.lives} vidas.`);
    }
    return false; // No se reinició el mapa
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
    // Agregar una función directa para God Mode
    startNodeDirectly: async function(regionKey, nodeIndex) {
      console.log('startNodeDirectly - God Mode override');
      ADVENTURE_STATE.currentRegion = regionKey;
      return await startAdventureNode(nodeIndex);
    }
  };

})(window);
