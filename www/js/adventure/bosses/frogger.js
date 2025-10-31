// bosses/frogger.js - Boss del Campo Deportivo (Frogger)
(function(window) {
  'use strict';

  function initSportsFrogger(handicap) {
    const canvas = window.bossGameState.canvas;
    const ctx = window.bossGameState.ctx;
    
    // Optimizar para móvil 9:16
    const maxWidth = Math.min(canvas.width, canvas.height * 9 / 16);
    const gameWidth = maxWidth;
    const gameHeight = canvas.height;
    const laneHeight = 60; // Más alto para mobile
    const lanes = Math.floor(gameHeight / laneHeight);
    const playerSize = 50; // Jugador más grande para mobile
    const defenderSize = 60; // Defensores más grandes
    
    // Cargar imágenes usando BossCore helpers
    let defensor01 = null;
    let defensor02 = null;
    let canchaImage = null;
    let soccerBallImage = null;
    let soccerBallLoaded = false;
    
    const game = {
      player: {x: gameWidth/2 - playerSize/2, y: gameHeight - laneHeight - playerSize/2},
      defenders: [],
      score: 0,
      target: 5, // Necesita cruzar 5 veces
      gameOver: false,
      started: false,
      message: 'Usa las flechas para empezar a cruzar el campo!',
      speed: 100,
      imagesLoaded: 0,
      canchaLoaded: false
    };
    
    // Función helper para cargar imágenes de Frogger
    function loadFroggerImages() {
      let loadedCount = 0;
      
      window.BossCore.loadImageSimple('assets/soccer/defensor 01.webp', 
        (img) => {
          defensor01 = img;
          loadedCount++;
          if (loadedCount === 2) {
            generateDefenders();
          }
        },
        () => { loadedCount++; }
      );
      
      window.BossCore.loadImageSimple('assets/soccer/defensor 02.webp',
        (img) => {
          defensor02 = img;
          loadedCount++;
          if (loadedCount === 2) {
            generateDefenders();
          }
        },
        () => { loadedCount++; }
      );
      
      window.BossCore.loadImageSimple('assets/soccer/cancha_V02.webp',
        (img) => {
          canchaImage = img;
          game.canchaLoaded = true;
        },
        () => {}
      );
      
      // Cargar imagen del balón de fútbol
      window.BossCore.loadImageSimple('assets/soccer/soccer-ball-svgrepo-com.webp',
        (img) => {
          soccerBallImage = img;
          soccerBallLoaded = true;
        },
        () => {}
      );
    }
    
    loadFroggerImages();
    
    // Función para mover el jugador
    function movePlayer(direction) {
      if (game.gameOver) return;
      
      if (!game.started) {
        game.started = true;
        game.message = 'Cruza el campo 5 veces!';
      }
      
      const step = 60; // Paso más grande para mobile
      if (direction === 'up') {
        game.player.y -= step;
        if (game.player.y < 0) {
          // Llegó al otro lado del campo
          game.score++;
          game.player.y = gameHeight - laneHeight - playerSize/2;
          if (game.score >= game.target) {
            game.gameOver = true;
            game.message = '¡VICTORIA! Cruzaste el campo 5 veces!';
            setTimeout(() => window.BossCore.endBossGame(true), 1000);
            return;
          }
        }
      } else if (direction === 'down' && game.player.y < gameHeight - laneHeight) {
        game.player.y += step;
      } else if (direction === 'left' && game.player.x > 0) {
        game.player.x -= step;
      } else if (direction === 'right' && game.player.x < gameWidth - playerSize) {
        game.player.x += step;
      }
    }

    // Controles del teclado
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowUp') movePlayer('up');
      else if (e.key === 'ArrowDown') movePlayer('down');
      else if (e.key === 'ArrowLeft') movePlayer('left');
      else if (e.key === 'ArrowRight') movePlayer('right');
    });

    // Crear controles táctiles para móvil
    function createFroggerTouchControls() {
      const controls = document.createElement('div');
      controls.id = 'frogger-touch-controls';
      // Posicionar controles sobre el campo de juego (esquina inferior derecha del área del juego)
      // El campo está centrado, así que calculamos la posición relativa al canvas
      const offsetX = (canvas.width - gameWidth) / 2;
      controls.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: ${offsetX + gameWidth - 140}px;
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        grid-template-rows: 1fr 1fr 1fr;
        gap: 5px;
        z-index: 10002;
        width: 120px;
        height: 120px;
        pointer-events: auto;
      `;

      // Botón arriba
      const upBtn = createFroggerButton('↑', 'up');
      upBtn.style.gridColumn = '2';
      upBtn.style.gridRow = '1';
      controls.appendChild(upBtn);

      // Botón izquierda
      const leftBtn = createFroggerButton('←', 'left');
      leftBtn.style.gridColumn = '1';
      leftBtn.style.gridRow = '2';
      controls.appendChild(leftBtn);

      // Botón derecha
      const rightBtn = createFroggerButton('→', 'right');
      rightBtn.style.gridColumn = '3';
      rightBtn.style.gridRow = '2';
      controls.appendChild(rightBtn);

      // Botón abajo
      const downBtn = createFroggerButton('↓', 'down');
      downBtn.style.gridColumn = '2';
      downBtn.style.gridRow = '3';
      controls.appendChild(downBtn);

      // Agregar controles al canvas o al contenedor del juego en lugar del body
      const gameContainer = canvas.parentElement || document.body;
      gameContainer.appendChild(controls);
      return controls;
    }

    function createFroggerButton(text, direction) {
      const button = document.createElement('button');
      button.textContent = text;
      button.style.cssText = `
        background: rgba(46, 204, 113, 0.8);
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 24px;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.2s;
        min-height: 35px;
        display: flex;
        align-items: center;
        justify-content: center;
      `;

      button.addEventListener('click', () => {
        movePlayer(direction);
      });

      return button;
    }

    // Crear controles táctiles
    const froggerTouchControls = createFroggerTouchControls();
    
    // Ocultar HUD para frogger (no se necesita el mensaje de instrucciones)
    const hud = document.getElementById('bossGameHUD');
    if (hud) hud.style.display = 'none';
    
    function generateDefenders() {
      game.defenders = [];
      
      // Generar exactamente 10 filas de defensores (empezar desde arriba, excluir las últimas filas cercanas al jugador)
      const maxDefenderRows = 10;
      const rowsToGenerate = Math.min(maxDefenderRows, lanes - 3);
      
      for (let i = 0; i < rowsToGenerate; i++) { // Empezar desde arriba, pero excluir las últimas filas (las más cercanas al jugador)
        const isDefensor01 = Math.random() < 0.5;
        
        // Sistema de velocidades más variado y realista
        const speedType = Math.random();
        let baseSpeed, speedMultiplier, isFast, isSlow, isVariable, speedVariation;
        
        if (speedType < 0.15) {
          // 15% - Defensores muy lentos (tortugas)
          baseSpeed = Math.random() * 2 + 1; // 1-3
          speedMultiplier = 1;
          isFast = false;
          isSlow = true;
          isVariable = false;
        } else if (speedType < 0.35) {
          // 20% - Defensores lentos
          baseSpeed = Math.random() * 2 + 3; // 3-5
          speedMultiplier = 1;
          isFast = false;
          isSlow = false;
          isVariable = Math.random() < 0.3; // 30% de los lentos son variables
        } else if (speedType < 0.65) {
          // 30% - Defensores normales
          baseSpeed = Math.random() * 3 + 4; // 4-7
          speedMultiplier = 1;
          isFast = false;
          isSlow = false;
          isVariable = Math.random() < 0.4; // 40% de los normales son variables
        } else if (speedType < 0.85) {
          // 20% - Defensores rápidos
          baseSpeed = Math.random() * 3 + 6; // 6-9
          speedMultiplier = 1.2;
          isFast = true;
          isSlow = false;
          isVariable = Math.random() < 0.5; // 50% de los rápidos son variables
        } else {
          // 15% - Defensores muy rápidos (estrellas)
          baseSpeed = Math.random() * 4 + 8; // 8-12
          speedMultiplier = 1.5;
          isFast = true;
          isSlow = false;
          isVariable = Math.random() < 0.6; // 60% de los muy rápidos son variables
        }
        
        const finalSpeed = baseSpeed * speedMultiplier;
        
        // Configurar variación de velocidad para defensores variables
        if (isVariable) {
          speedVariation = Math.random() * 3 + 1; // Variación de 1-4
        } else {
          speedVariation = 0;
        }
        
        game.defenders.push({
          x: Math.random() * (gameWidth - defenderSize),
          y: i * laneHeight + laneHeight/2 - defenderSize/2,
          speed: (isDefensor01 ? -1 : 1) * finalSpeed,
          baseSpeed: baseSpeed,
          speedMultiplier: speedMultiplier,
          isFast: isFast,
          isSlow: isSlow,
          isVariable: isVariable,
          speedVariation: speedVariation,
          lastSpeedChange: Date.now(),
          speedChangeInterval: Math.random() * 2000 + 1000, // Cambio cada 1-3 segundos
          width: defenderSize,
          height: defenderSize,
          image: isDefensor01 ? defensor01 : defensor02,
          type: isDefensor01 ? 'defensor01' : 'defensor02',
          speedType: speedType < 0.15 ? 'tortuga' : 
                    speedType < 0.35 ? 'lento' : 
                    speedType < 0.65 ? 'normal' : 
                    speedType < 0.85 ? 'rapido' : 'estrella'
        });
      }
    }
    
    function update() {
      if (game.gameOver || !game.started) return;
      
      // Mover defensores
      game.defenders.forEach(defender => {
        // Manejar velocidad variable con intervalos más dinámicos
        if (defender.isVariable) {
          const now = Date.now();
          if (now - defender.lastSpeedChange > defender.speedChangeInterval) {
            // Cambiar velocidad con variación más dramática
            const variation = (Math.random() - 0.5) * defender.speedVariation * 2;
            const newSpeed = defender.baseSpeed + variation;
            const finalSpeed = Math.max(0.5, newSpeed) * defender.speedMultiplier; // Velocidad mínima de 0.5
            
            defender.speed = (defender.type === 'defensor01' ? -1 : 1) * finalSpeed;
            defender.lastSpeedChange = now;
            
            // Cambiar el intervalo para la próxima variación (más impredecible)
            defender.speedChangeInterval = Math.random() * 3000 + 500; // 0.5-3.5 segundos
          }
        }
        
        defender.x += defender.speed;
        if (defender.speed > 0 && defender.x > gameWidth) {
          defender.x = -defender.width;
        } else if (defender.speed < 0 && defender.x < -defender.width) {
          defender.x = gameWidth;
        }
      });
      
      // Verificar colisiones con defensores
      game.defenders.forEach(defender => {
        if (game.player.x < defender.x + defender.width &&
            game.player.x + playerSize > defender.x &&
            game.player.y < defender.y + defender.height &&
            game.player.y + playerSize > defender.y) {
          game.gameOver = true;
          game.message = '¡Te detuvieron! DERROTA';
          setTimeout(() => window.BossCore.endBossGame(false), 500);
          return;
        }
      });
    }
    
    function draw() {
      // Fondo negro para el área no utilizada
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Calcular offset para centrar el campo
      const offsetX = (canvas.width - gameWidth) / 2;
      
      // Fondo del campo de fútbol
      if (game.canchaLoaded && canchaImage && canchaImage.complete) {
        // Usar imagen de cancha como fondo
        ctx.drawImage(canchaImage, offsetX, 0, gameWidth, gameHeight);
      } else {
        // Fallback: fondo verde si la imagen no está cargada
        ctx.fillStyle = '#2ecc71'; // Verde césped
        ctx.fillRect(offsetX, 0, gameWidth, gameHeight);
        
        // Dibujar líneas del campo como fallback
        for (let i = 0; i < lanes - 1; i++) {
          // Líneas horizontales del campo
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(offsetX, i * laneHeight + laneHeight/2);
          ctx.lineTo(offsetX + gameWidth, i * laneHeight + laneHeight/2);
          ctx.stroke();
          
          // Líneas verticales (marcas del campo)
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 15]);
          ctx.beginPath();
          ctx.moveTo(offsetX + gameWidth/4, i * laneHeight + 10);
          ctx.lineTo(offsetX + gameWidth/4, i * laneHeight + laneHeight - 10);
          ctx.moveTo(offsetX + 3*gameWidth/4, i * laneHeight + 10);
          ctx.lineTo(offsetX + 3*gameWidth/4, i * laneHeight + laneHeight - 10);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }
      
      // Dibujar defensores
      game.defenders.forEach(defender => {
        if (defender.image && defender.image.complete) {
          ctx.drawImage(defender.image, offsetX + defender.x, defender.y, defender.width, defender.height);
        } else {
          // Fallback si la imagen no está cargada
          ctx.fillStyle = defender.type === 'defensor01' ? '#e74c3c' : '#f39c12';
          ctx.fillRect(offsetX + defender.x, defender.y, defender.width, defender.height);
        }
        
      });
      
      // Dibujar jugador (balón de fútbol)
      if (soccerBallLoaded && soccerBallImage && soccerBallImage.complete) {
        // Dibujar imagen del balón SVG
        ctx.drawImage(soccerBallImage, offsetX + game.player.x, game.player.y, playerSize, playerSize);
      } else {
        // Fallback: dibujar balón simple si la imagen no está cargada
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(offsetX + game.player.x + playerSize/2, game.player.y + playerSize/2, playerSize/2, 0, 2 * Math.PI);
        ctx.fill();
        
        // Líneas del balón
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(offsetX + game.player.x + playerSize/2, game.player.y + playerSize/2, playerSize/2, 0, 2 * Math.PI);
        ctx.stroke();
        
        // Líneas del balón
        ctx.beginPath();
        ctx.moveTo(offsetX + game.player.x + playerSize/2, game.player.y);
        ctx.lineTo(offsetX + game.player.x + playerSize/2, game.player.y + playerSize);
        ctx.moveTo(offsetX + game.player.x, game.player.y + playerSize/2);
        ctx.lineTo(offsetX + game.player.x + playerSize, game.player.y + playerSize/2);
        ctx.stroke();
      }
      
      // Dibujar texto
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px Arial';
      ctx.fillText(`Cruces: ${game.score}/${game.target}`, offsetX + 20, 30);
      
      if (game.gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(game.message, canvas.width/2, canvas.height/2);
        ctx.textAlign = 'left';
      }
    }
    
    function gameLoop() {
      update();
      draw();
      if (!game.gameOver) {
        window.bossGameState.animationId = setTimeout(gameLoop, game.speed);
      }
    }
    
    gameLoop();
  }

  // Exponer función
  window.BossGames = window.BossGames || {};
  window.BossGames.initSportsFrogger = initSportsFrogger;

})(window);
