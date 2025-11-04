// js/adventure/bosses.js - Sistema de bosses unificado
// Contiene: código compartido, funciones helper y router principal
(function(window) {
  'use strict';

  // ===== ESTADO GLOBAL =====
  window.bossGameState = {
    type: null,
    handicap: null,
    callback: null,
    canvas: null,
    ctx: null,
    animationId: null
  };

  // ===== FUNCIONES CORE =====
  
  // Función para obtener el nombre del jugador
  function getPlayerNameForBoss() {
    // Primero intenta obtener el nickname del usuario logueado
    if (window.getCurrentUser) {
      const user = window.getCurrentUser();
      if (user && !user.isGuest) {
        const savedNickname = localStorage.getItem('user_nickname_' + user.id);
        if (savedNickname) return savedNickname;
      }
    }
    
    // Si no hay usuario logueado, usa el valor del input o un default
    const inputName = document.getElementById('playerName')?.value?.trim();
    return inputName || localStorage.getItem('playerName') || 'Jugador';
  }

  // Función para redimensionar el canvas
  function resizeCanvas() {
    if (!window.bossGameState.canvas) return;
    
    window.bossGameState.canvas.width = window.innerWidth;
    window.bossGameState.canvas.height = window.innerHeight;
  }

  // Función para mostrar la UI del boss game
  function showBossGameUI(gameType) {
    const container = document.getElementById('adventureGameArea');
    if (!container) return;
    
    container.innerHTML = `
      <div class="boss-game-container" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 10000; background: radial-gradient(ellipse at center, #0b0f1a 0%, #070a12 100%); display: flex; align-items: center; justify-content: center;">
        <canvas id="bossGameCanvas" style="width: 100%; height: 100%; display: block;"></canvas>
        
        <div id="bossGameHUD" style="position: fixed; top: 20px; left: 50%; transform: translateX(-50%); z-index: 10001; background: rgba(0,0,0,0.8); color: white; padding: 10px 20px; border-radius: 10px; font-size: 16px; font-weight: bold; text-align: center;">
          Cargando...
        </div>
      </div>
    `;
    
    window.bossGameState.canvas = document.getElementById('bossGameCanvas');
    // Configurar tamaño real del canvas basado en la pantalla
    window.bossGameState.canvas.width = window.innerWidth;
    window.bossGameState.canvas.height = window.innerHeight;
    window.bossGameState.ctx = window.bossGameState.canvas.getContext('2d');
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Mostrar banner en el modo aventura (solo si no está ya visible)
    if (window.unifiedBanner && !window.unifiedBanner.isBannerVisible()) {
      setTimeout(async () => {
        console.log('🔄 Intentando mostrar banner en modo aventura...');
        const success = await window.unifiedBanner.showBanner();
        if (success) {
          console.log('✅ Banner mostrado en modo aventura');
        } else {
          console.log('❌ Fallo al mostrar banner en modo aventura');
        }
      }, 2000);
    }
  }

  // Función para actualizar el HUD
  function updateBossHUD(text) {
    const hud = document.getElementById('bossGameHUD');
    if (hud) hud.innerHTML = text;
  }

  // Función para finalizar el boss game
  function endBossGame(won) {
    if (window.bossGameState.animationId) {
      cancelAnimationFrame(window.bossGameState.animationId);
    }
    
    // Limpiar controles táctiles
    const tetrisControls = document.getElementById('tetris-touch-controls');
    if (tetrisControls) {
      tetrisControls.remove();
    }
    
    const froggerControls = document.getElementById('frogger-touch-controls');
    if (froggerControls) {
      froggerControls.remove();
    }
    
    const snakeControls = document.getElementById('snake-touch-controls');
    if (snakeControls) {
      snakeControls.remove();
    }
    
    window.removeEventListener('resize', resizeCanvas);
    
    // Mostrar mensaje de resultado
    const container = document.getElementById('adventureGameArea');
    if (container) {
      if (won) {
        // Mostrar imagen de victoria cuando se gana un boss
        // Crear el contenedor inmediatamente con estilos correctos para evitar desplazamiento
        const victoryDiv = document.createElement('div');
        victoryDiv.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 20000; display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; pointer-events: none;';
        container.appendChild(victoryDiv);
        
        // Pre-cargar la imagen y luego insertarla cuando esté lista
        const img = new Image();
        img.onload = function() {
          const imgElement = document.createElement('img');
          imgElement.src = 'assets/bosses/ganaste.webp';
          imgElement.alt = '¡Ganaste!';
          imgElement.style.cssText = 'max-width: 90vw; max-height: 90vh; object-fit: contain; display: block; animation: fadeInScale 0.5s ease;';
          victoryDiv.appendChild(imgElement);
        };
        img.src = 'assets/bosses/ganaste.webp';
      } else {
        // Mostrar imagen de derrota cuando pierdes contra un boss
        // Crear el contenedor inmediatamente con estilos correctos para evitar desplazamiento
        const defeatDiv = document.createElement('div');
        defeatDiv.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 20000; display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; pointer-events: none;';
        container.appendChild(defeatDiv);
        
        // Pre-cargar la imagen y luego insertarla cuando esté lista
        const img = new Image();
        img.onload = function() {
          const imgElement = document.createElement('img');
          imgElement.src = 'assets/bosses/perdiste.webp';
          imgElement.alt = 'Derrota';
          imgElement.style.cssText = 'max-width: 90vw; max-height: 90vh; object-fit: contain; display: block; animation: fadeInScale 0.5s ease;';
          defeatDiv.appendChild(imgElement);
        };
        img.src = 'assets/bosses/perdiste.webp';
      }
    }
    
    // Llamar al callback después de un delay
    setTimeout(() => {
      if (window.bossGameState.callback) {
        window.bossGameState.callback(won);
      }
    }, 2000);
  }

  // Función para rendirse
  window.forfeitBossGame = function() {
    if (confirm('¿Seguro que quieres rendirte? Perderás una vida.')) {
      try {
        if (window.AdventureMode && window.AdventureMode.loseLife) {
          const reset = window.AdventureMode.loseLife();
          if (reset) {
            const stateAfter = window.AdventureMode.ADVENTURE_STATE;
            if (window.renderRegionNodes) window.renderRegionNodes(stateAfter.currentRegion);
          }
        }
      } catch (e) { console.error('Error al perder vida al rendirse:', e); }
      endBossGame(false);
    }
  };

  // ===== FUNCIONES HELPER =====
  
  // Cargar imagen del boss (demonio) - retorna Promise con Image
  function loadBossImage(imagePath) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => {
        // Intentar alternativa si falla
        const altPath = imagePath.replace('.webp', '.png');
        const altImg = new Image();
        altImg.onload = () => resolve(altImg);
        altImg.onerror = () => reject(new Error(`Failed to load image: ${imagePath}`));
        altImg.src = altPath;
      };
      img.src = imagePath;
    });
  }
  
  // Cargar todas las imágenes de ciencia - retorna Promise con objeto de imágenes
  function loadScienceImages() {
    const images = {
      testTube: new Image(),
      burner: new Image(),
      flask: new Image(),
      lab: new Image(),
      microscope: new Image()
    };
    
    images.testTube.src = 'assets/ciencia/test-tube-svgrepo-com.svg';
    images.burner.src = 'assets/ciencia/burner-science-svgrepo-com.svg';
    images.flask.src = 'assets/ciencia/flask-science-svgrepo-com.svg';
    images.lab.src = 'assets/ciencia/lab-science-svgrepo-com.svg';
    images.microscope.src = 'assets/ciencia/microscope-svgrepo-com.svg';
    
    // Retornar Promise que se resuelve cuando todas están cargadas
    return Promise.all(
      Object.values(images).map(img => 
        new Promise(resolve => {
          if (img.complete) {
            resolve(img);
          } else {
            img.onload = () => resolve(img);
            img.onerror = () => resolve(img); // Resolver incluso si falla
          }
        })
      )
    ).then(() => images);
  }
  
  // Calcular escalado y offset para responsive design
  function calculateScale(baseWidth, baseHeight, canvas, options = {}) {
    const isMobile = canvas.height > canvas.width;
    
    // Si se especifica baseWidth/baseHeight móvil, usarlos
    const finalBaseWidth = options.mobileWidth && isMobile ? options.mobileWidth : baseWidth;
    const finalBaseHeight = options.mobileHeight && isMobile ? options.mobileHeight : baseHeight;
    
    // Calcular escala
    const scaleX = canvas.width / finalBaseWidth;
    const scaleY = canvas.height / finalBaseHeight;
    const maxScale = options.maxScale || 1.2;
    const scale = Math.min(scaleX, scaleY, maxScale);
    
    // Calcular offset para centrar
    const scaledWidth = finalBaseWidth * scale;
    const scaledHeight = finalBaseHeight * scale;
    const offsetX = (canvas.width - scaledWidth) / 2;
    const offsetY = (canvas.height - scaledHeight) / 2;
    
    return {
      scale,
      offsetX,
      offsetY,
      isMobile,
      scaledWidth,
      scaledHeight,
      baseWidth: finalBaseWidth,
      baseHeight: finalBaseHeight
    };
  }
  
  // Cargar imagen simple con callback (para compatibilidad con código existente)
  function loadImageSimple(url, onLoad, onError) {
    const img = new Image();
    img.onload = () => onLoad && onLoad(img);
    img.onerror = () => onError && onError(img);
    img.src = url;
    return img;
  }

  // ===== ROUTER PRINCIPAL =====
  
  const BOSS_GAMES_MAP = {
    science: 'catch',  // Boss Catch para recoger objetos de ciencia
    history: 'rpg',
    geography: 'hangman',
    sports: 'frogger',
    movies: 'arkanoid',
    anime: 'pokemon'  // Batalla estilo Pokemon GBA
  };

  function startBossGame(regionKey, handicap, callback) {
    const gameType = BOSS_GAMES_MAP[regionKey];
    
    // Usar el bossGameState global
    window.bossGameState = {
      type: gameType,
      handicap: handicap,
      callback: callback,
      canvas: null,
      ctx: null,
      animationId: null
    };
    
    // Mostrar UI
    showBossGameUI(gameType);
    
    // Seleccionar el juego según la región
    if (regionKey === 'movies') {
      // Usar el módulo de Arkanoid
      if (window.BossGames && window.BossGames.initMovieArkanoid) {
        window.BossGames.initMovieArkanoid(handicap);
      } else {
        console.error('❌ initMovieArkanoid no está disponible. Asegúrate de cargar bosses/arkanoid.js');
      }
    } else if (regionKey === 'anime') {
      // Usar el módulo de Pokemon
      if (window.BossGames && window.BossGames.initAnimePokemon) {
        window.BossGames.initAnimePokemon(handicap);
      } else {
        console.error('❌ initAnimePokemon no está disponible. Asegúrate de cargar bosses/pokemon.js');
      }
    } else if (regionKey === 'history') {
      // Usar el módulo de Tetris
      if (window.BossGames && window.BossGames.initHistoryTetris) {
        window.BossGames.initHistoryTetris(handicap);
      } else {
        console.error('❌ initHistoryTetris no está disponible. Asegúrate de cargar bosses/tetris.js');
      }
    } else if (regionKey === 'science') {
      // Usar el módulo de Catch (Science)
      if (window.BossGames && window.BossGames.initScienceCatch) {
        window.BossGames.initScienceCatch(handicap);
      } else {
        console.error('❌ initScienceCatch no está disponible. Asegúrate de cargar bosses/catch.js');
      }
    } else if (regionKey === 'sports') {
      // Usar el módulo de Frogger
      if (window.BossGames && window.BossGames.initSportsFrogger) {
        window.BossGames.initSportsFrogger(handicap);
      } else {
        console.error('❌ initSportsFrogger no está disponible. Asegúrate de cargar bosses/frogger.js');
      }
    } else if (regionKey === 'geography') {
      // Usar el módulo de Hangman
      if (window.BossGames && window.BossGames.initGeographyHangman) {
        window.BossGames.initGeographyHangman(handicap);
      } else {
        console.error('❌ initGeographyHangman no está disponible. Asegúrate de cargar bosses/hangman.js');
      }
    } else {
      // Default: usar Arkanoid
      if (window.BossGames && window.BossGames.initMovieArkanoid) {
        window.BossGames.initMovieArkanoid(handicap);
      } else {
        console.error('❌ initMovieArkanoid no está disponible. Asegúrate de cargar bosses/arkanoid.js');
      }
    }
  }

  // ===== EXPOSICIÓN GLOBAL =====
  
  // Exponer BossCore (para compatibilidad con módulos existentes)
  window.BossCore = {
    getPlayerNameForBoss,
    showBossGameUI,
    updateBossHUD,
    endBossGame,
    resizeCanvas,
    // Funciones helper
    loadBossImage,
    loadScienceImages,
    calculateScale,
    loadImageSimple
  };

  // Exportar para AdventureBosses (compatibilidad)
  window.AdventureBosses = {
    startBossGame
  };
  
  // Exponer globalmente para test de bosses
  window.startBossGame = startBossGame;

})(window);
