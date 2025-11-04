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
    
    // Definir área del arco (portería) - en la parte superior central del campo
    const goalWidth = gameWidth * 0.25; // Ancho del arco (25% del ancho del campo)
    const goalHeight = laneHeight * 1.5; // Altura del arco (1.5 líneas)
    const goalX = (gameWidth - goalWidth) / 2; // Centrar el arco horizontalmente
    const goalY = 0; // Arco en la parte superior del campo
    
    // Cargar imágenes usando BossCore helpers
    let defensor01 = null;
    let defensor02 = null;
    let canchaImage = null;
    let soccerBallImage = null;
    let soccerBallLoaded = false;
    let goalImage = null;
    let goalImageLoaded = false;
    let outImage = null;
    let outImageLoaded = false;
    let robadaImage = null;
    let robadaImageLoaded = false;
    
    // Calcular posición inicial del jugador alineada con las líneas
    const startLane = Math.max(0, lanes - 3); // Empezar en una de las últimas líneas
    const startY = startLane * laneHeight + laneHeight/2 - playerSize/2;
    
    const game = {
      player: {x: gameWidth/2 - playerSize/2, y: startY},
      defenders: [],
      score: 0,
      target: 5, // Necesita cruzar 5 veces
      lives: 3, // Vidas (corazones)
      gameOver: false,
      started: false,
      message: 'Usa las flechas para empezar a cruzar el campo!',
      speed: 100,
      imagesLoaded: 0,
      canchaLoaded: false,
      lastCheckedLane: -1, // Rastrear la última línea verificada para evitar múltiples verificaciones
      showGoalAnimation: false, // Mostrar animación de gol
      goalAnimationTime: 0, // Tiempo de la animación de gol
      showOutAnimation: false, // Mostrar animación de "out" (pelota fuera)
      outAnimationTime: 0, // Tiempo de la animación de "out"
      showRobadaAnimation: false, // Mostrar animación de "robada" (tocado por defensor)
      robadaAnimationTime: 0 // Tiempo de la animación de "robada"
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
      
      // Cargar imagen del gol
      window.BossCore.loadImageSimple('assets/soccer/gool01.webp',
        (img) => {
          goalImage = img;
          goalImageLoaded = true;
        },
        () => {}
      );
      
      // Cargar imagen de "afuera" (pelota fuera)
      window.BossCore.loadImageSimple('assets/soccer/afuera.webp',
        (img) => {
          outImage = img;
          outImageLoaded = true;
        },
        () => {}
      );
      
      // Cargar imagen de "robada" (tocado por defensor)
      window.BossCore.loadImageSimple('assets/soccer/robada.webp',
        (img) => {
          robadaImage = img;
          robadaImageLoaded = true;
        },
        () => {}
      );
    }
    
    loadFroggerImages();
    
    // Función helper para alinear el jugador a una línea específica
    function alignPlayerToLane(laneIndex) {
      return laneIndex * laneHeight + laneHeight/2 - playerSize/2;
    }
    
    // Función helper para obtener la línea actual del jugador
    function getCurrentLane(y) {
      return Math.round((y + playerSize/2 - laneHeight/2) / laneHeight);
    }
    
    // Función para mover el jugador
    function movePlayer(direction) {
      if (game.gameOver) return;
      
      if (!game.started) {
        game.started = true;
        game.message = 'Cruza el campo 5 veces!';
      }
      
      const currentLane = getCurrentLane(game.player.y);
      
      if (direction === 'up') {
        const newLane = currentLane - 1;
        
        // Si la pelota ya está en la línea 0 (última línea) o intenta ir más allá
        if (currentLane === 0 || newLane < 0) {
          // La pelota llegó a la última línea (arriba) - ejecutar inmediatamente
          // Verificar si la pelota está dentro del área del arco (portería)
          const playerCenterX = game.player.x + playerSize / 2;
          const playerCenterY = game.player.y + playerSize / 2;
          
          // Verificar si la pelota está dentro del área del arco
          if (playerCenterX >= goalX && 
              playerCenterX <= goalX + goalWidth &&
              playerCenterY >= goalY && 
              playerCenterY <= goalY + goalHeight) {
            // ¡GOL! La pelota está en la última línea dentro del arco
            game.score++;
            // Mostrar animación de gol
            game.showGoalAnimation = true;
            game.goalAnimationTime = Date.now();
            
            const resetLane = Math.max(0, lanes - 3);
            game.player.y = alignPlayerToLane(resetLane);
            game.player.x = gameWidth/2 - playerSize/2; // Resetear posición X también
            if (game.score >= game.target) {
              game.gameOver = true;
              game.message = '¡VICTORIA! Cruzaste el campo 5 veces!';
              setTimeout(() => window.BossCore.endBossGame(true), 1000);
              return;
            }
          } else {
            // La pelota está en la última línea pero NO está dentro del arco
            // Pierde una vida (corazón) y vuelve a empezar desde la posición inicial (abajo)
            game.lives--;
            // Mostrar animación de "out"
            game.showOutAnimation = true;
            game.outAnimationTime = Date.now();
            
            if (game.lives <= 0) {
              // Sin vidas, perder la partida
              game.gameOver = true;
              game.message = '¡Sin vidas! DERROTA';
              setTimeout(() => window.BossCore.endBossGame(false), 1500);
              return;
            } else {
              // Resetear pelota a la posición inicial (abajo de todo)
              game.player.y = startY;
              game.player.x = gameWidth/2 - playerSize/2; // Centrar horizontalmente
              game.lastCheckedLane = startLane; // Resetear el rastreo
            }
          }
          // No mover la pelota más arriba, ya está en la última línea
          return;
        } else {
          // Movimiento normal: mover a la siguiente línea
          game.player.y = alignPlayerToLane(newLane);
        }
      } else if (direction === 'down') {
        const newLane = currentLane + 1;
        if (newLane < lanes) {
          game.player.y = alignPlayerToLane(newLane);
        }
      } else if (direction === 'left' && game.player.x > 0) {
        const step = 60;
        game.player.x -= step;
      } else if (direction === 'right' && game.player.x < gameWidth - playerSize) {
        const step = 60;
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
        left: ${offsetX + gameWidth - 160}px;
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        grid-template-rows: 1fr 1fr 1fr;
        gap: 8px;
        z-index: 10002;
        width: 150px;
        height: 150px;
        pointer-events: auto;
      `;

      // Botón arriba
      const upBtn = createFroggerButton('▲', 'up');
      upBtn.style.gridColumn = '2';
      upBtn.style.gridRow = '1';
      controls.appendChild(upBtn);

      // Botón izquierda
      const leftBtn = createFroggerButton('◄', 'left');
      leftBtn.style.gridColumn = '1';
      leftBtn.style.gridRow = '2';
      controls.appendChild(leftBtn);

      // Botón derecha
      const rightBtn = createFroggerButton('►', 'right');
      rightBtn.style.gridColumn = '3';
      rightBtn.style.gridRow = '2';
      controls.appendChild(rightBtn);

      // Botón abajo
      const downBtn = createFroggerButton('▼', 'down');
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
      button.innerHTML = text;
      button.style.cssText = `
        background: rgba(231, 76, 60, 0.95);
        color: white;
        border: 3px solid rgba(255, 255, 255, 0.9);
        border-radius: 50%;
        font-size: 28px;
        font-weight: bold;
        line-height: 1;
        cursor: pointer;
        transition: all 0.2s;
        width: 48px;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
      `;
      
      // Efecto hover/active para mejor feedback
      button.addEventListener('mousedown', () => {
        button.style.transform = 'scale(0.9)';
        button.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.3)';
      });
      
      button.addEventListener('mouseup', () => {
        button.style.transform = 'scale(1)';
        button.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.3)';
      });
      
      button.addEventListener('mouseleave', () => {
        button.style.transform = 'scale(1)';
        button.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.3)';
      });

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
      // IMPORTANTE: No generar defensores en la línea superior (i=0) porque es fuera de la cancha
      const maxDefenderRows = 10;
      const rowsToGenerate = Math.min(maxDefenderRows, lanes - 3);
      
      // Empezar desde i=1 (segunda línea) porque la línea 0 es fuera de la cancha (área del arco)
      for (let i = 1; i <= rowsToGenerate; i++) { // Empezar desde la segunda línea, excluir la línea superior
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
      
      // Manejar animación de gol (mostrar por 2.5 segundos con animaciones)
      if (game.showGoalAnimation) {
        const elapsed = Date.now() - game.goalAnimationTime;
        if (elapsed > 2500) { // 2.5 segundos
          game.showGoalAnimation = false;
        }
      }
      
      // Manejar animación de "out" (mostrar por 2 segundos con animaciones)
      if (game.showOutAnimation) {
        const elapsed = Date.now() - game.outAnimationTime;
        if (elapsed > 2000) { // 2 segundos
          game.showOutAnimation = false;
        }
      }
      
      // Manejar animación de "robada" (mostrar por 2 segundos con animaciones)
      if (game.showRobadaAnimation) {
        const elapsed = Date.now() - game.robadaAnimationTime;
        if (elapsed > 2000) { // 2 segundos
          game.showRobadaAnimation = false;
        }
      }
      
      // Verificar continuamente si la pelota está en la última línea (línea 0)
      const currentLane = getCurrentLane(game.player.y);
      // Solo verificar una vez cuando llegue a la línea 0 (no repetir mientras sigue ahí)
      if (currentLane === 0 && game.lastCheckedLane !== 0) {
        game.lastCheckedLane = 0; // Marcar que ya verificamos esta línea
        
        // La pelota está en la última línea - verificar gol o pérdida de vida
        const playerCenterX = game.player.x + playerSize / 2;
        const playerCenterY = game.player.y + playerSize / 2;
        
        // Verificar si la pelota está dentro del área del arco
        if (playerCenterX >= goalX && 
            playerCenterX <= goalX + goalWidth &&
            playerCenterY >= goalY && 
            playerCenterY <= goalY + goalHeight) {
          // ¡GOL! La pelota está en la última línea dentro del arco
          game.score++;
          // Mostrar animación de gol
          game.showGoalAnimation = true;
          game.goalAnimationTime = Date.now();
          
          const resetLane = Math.max(0, lanes - 3);
          game.player.y = alignPlayerToLane(resetLane);
          game.player.x = gameWidth/2 - playerSize/2; // Resetear posición X también
          game.lastCheckedLane = resetLane; // Resetear el rastreo
          if (game.score >= game.target) {
            game.gameOver = true;
            game.message = '¡VICTORIA! Cruzaste el campo 5 veces!';
            setTimeout(() => window.BossCore.endBossGame(true), 1000);
            return;
          }
          } else {
            // La pelota está en la última línea pero NO está dentro del arco
            // Pierde una vida (corazón) y vuelve a empezar desde la posición inicial (abajo)
            game.lives--;
            // Mostrar animación de "out"
            game.showOutAnimation = true;
            game.outAnimationTime = Date.now();
            
            if (game.lives <= 0) {
              // Sin vidas, perder la partida
              game.gameOver = true;
              game.message = '¡Sin vidas! DERROTA';
              setTimeout(() => window.BossCore.endBossGame(false), 1500);
              return;
            } else {
              // Resetear pelota a la posición inicial (abajo de todo)
              game.player.y = startY;
              game.player.x = gameWidth/2 - playerSize/2; // Centrar horizontalmente
              game.lastCheckedLane = startLane; // Resetear el rastreo
            }
          }
      } else if (currentLane !== 0) {
        // Si la pelota no está en la línea 0, resetear el rastreo para permitir verificación nuevamente
        game.lastCheckedLane = currentLane;
      }
      
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
        // Wrap-around: cuando sale por un lado, aparece por el otro
        // Pero solo se dibuja cuando está completamente dentro del área visible
        if (defender.speed > 0 && defender.x > gameWidth) {
          defender.x = -defender.width; // Aparecerá por la izquierda
        } else if (defender.speed < 0 && defender.x < -defender.width) {
          defender.x = gameWidth; // Aparecerá por la derecha
        }
      });
      
      // Verificar colisiones con defensores
      // Primero obtener la línea actual del jugador
      const playerLane = getCurrentLane(game.player.y);
      
      // Usar un área de colisión más precisa (reducida) para evitar falsos positivos
      const collisionTolerance = 0.75; // Reducir área de colisión al 75% para mayor precisión
      const playerCollisionWidth = playerSize * collisionTolerance;
      const playerCollisionHeight = playerSize * collisionTolerance;
      const defenderCollisionWidth = defenderSize * collisionTolerance;
      const defenderCollisionHeight = defenderSize * collisionTolerance;
      
      // Centrar el área de colisión dentro del sprite
      const playerCollisionOffsetX = (playerSize - playerCollisionWidth) / 2;
      const playerCollisionOffsetY = (playerSize - playerCollisionHeight) / 2;
      const defenderCollisionOffsetX = (defenderSize - defenderCollisionWidth) / 2;
      const defenderCollisionOffsetY = (defenderSize - defenderCollisionHeight) / 2;
      
      // Calcular posiciones reales de las áreas de colisión del jugador
      const playerCollisionX = game.player.x + playerCollisionOffsetX;
      const playerCollisionY = game.player.y + playerCollisionOffsetY;
      
      game.defenders.forEach(defender => {
        // Verificar primero que estén en la misma línea (solo defensores en la misma línea pueden colisionar)
        const defenderLane = Math.round((defender.y + defenderSize/2 - laneHeight/2) / laneHeight);
        
        // Solo verificar colisión si están en la misma línea
        if (defenderLane !== playerLane) {
          return; // Saltar este defensor, está en una línea diferente
        }
        
        // Calcular posiciones reales de las áreas de colisión del defensor
        const defenderCollisionX = defender.x + defenderCollisionOffsetX;
        const defenderCollisionY = defender.y + defenderCollisionOffsetY;
        
        // Verificar colisión solo en el área central reducida
        if (playerCollisionX < defenderCollisionX + defenderCollisionWidth &&
            playerCollisionX + playerCollisionWidth > defenderCollisionX &&
            playerCollisionY < defenderCollisionY + defenderCollisionHeight &&
            playerCollisionY + playerCollisionHeight > defenderCollisionY) {
          
          // 1. Perder una vida
          game.lives--;
          
          // 2. Mostrar animación de "robada"
          game.showRobadaAnimation = true;
          game.robadaAnimationTime = Date.now();
          
          // 3. Resetear la pelota a su posición inicial
          game.player.y = startY;
          game.player.x = gameWidth/2 - playerSize/2; // Centrar horizontalmente
          game.lastCheckedLane = startLane; // Resetear el rastreo
          
          // Actualizar HUD con las vidas restantes
          const playerName = window.BossCore.getPlayerNameForBoss();
          window.BossCore.updateBossHUD(`Vidas: ${'❤️'.repeat(game.lives)} | Goles: ${game.score}/${game.target}`);
          
          // 4. Verificar si aún quedan vidas
          if (game.lives <= 0) {
            // Sin vidas, perder la partida después de mostrar la animación
            setTimeout(() => {
              game.gameOver = true;
              game.message = '¡Sin vidas! DERROTA';
              window.BossCore.endBossGame(false);
            }, 2000); // Esperar 2 segundos para mostrar la animación
          }
          // Si aún hay vidas, el juego continúa automáticamente
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
      
      // Dibujar área del arco (portería) visualmente
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      ctx.setLineDash([]);
      // Dibujar líneas del arco (portería) en la parte superior
      ctx.beginPath();
      // Línea superior del arco
      ctx.moveTo(offsetX + goalX, goalY);
      ctx.lineTo(offsetX + goalX + goalWidth, goalY);
      // Líneas laterales del arco
      ctx.moveTo(offsetX + goalX, goalY);
      ctx.lineTo(offsetX + goalX, goalY + goalHeight);
      ctx.moveTo(offsetX + goalX + goalWidth, goalY);
      ctx.lineTo(offsetX + goalX + goalWidth, goalY + goalHeight);
      ctx.stroke();
      
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
      
      // Dibujar defensores (solo si están completamente dentro del área visible de la cancha)
      game.defenders.forEach(defender => {
        // Solo dibujar si el defensor está completamente dentro de los límites de la cancha
        // Evitar que aparezcan parcialmente fuera de los bordes
        if (defender.x >= 0 && defender.x + defender.width <= gameWidth) {
          // El defensor está completamente dentro del área visible
          if (defender.image && defender.image.complete) {
            ctx.drawImage(defender.image, offsetX + defender.x, defender.y, defender.width, defender.height);
          } else {
            // Fallback si la imagen no está cargada
            ctx.fillStyle = defender.type === 'defensor01' ? '#e74c3c' : '#f39c12';
            ctx.fillRect(offsetX + defender.x, defender.y, defender.width, defender.height);
          }
        }
        // Si el defensor está fuera (parcialmente o completamente), no se dibuja
        // Esto hace que "desaparezcan" cuando salen de la cancha
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
      // Dibujar vidas (corazones)
      ctx.fillText(`Vidas: ${'❤️'.repeat(game.lives)}`, offsetX + 20, 60);
      
      // Dibujar animación de gol si está activa
      if (game.showGoalAnimation && goalImageLoaded && goalImage) {
        const elapsed = Date.now() - game.goalAnimationTime;
        const duration = 2500; // Duración total de la animación
        const progress = Math.min(elapsed / duration, 1); // Progreso de 0 a 1
        
        ctx.save();
        
        // Centrar la imagen en el canvas
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        // Efecto de zoom y bounce
        let scale = 0;
        if (progress < 0.3) {
          // Primera fase: zoom in rápido con bounce
          const bounceProgress = progress / 0.3;
          scale = 1.2 * bounceProgress - 0.2 * Math.sin(bounceProgress * Math.PI * 3); // Bounce effect
        } else if (progress < 0.7) {
          // Segunda fase: mantener tamaño con ligero movimiento
          scale = 1.0 + 0.1 * Math.sin((progress - 0.3) * Math.PI * 2); // Pulso sutil
        } else {
          // Tercera fase: zoom out con fade
          const fadeProgress = (progress - 0.7) / 0.3;
          scale = 1.0 - 0.3 * fadeProgress;
        }
        
        // Rotación animada
        const rotation = progress < 0.3 ? 
          (progress / 0.3) * Math.PI * 0.1 * Math.sin(progress * Math.PI * 5) : // Rotación inicial
          Math.sin(progress * Math.PI * 2) * 0.05; // Oscilación sutil
        
        // Fade in/out
        let alpha = 1.0;
        if (progress < 0.2) {
          // Fade in rápido
          alpha = progress / 0.2;
        } else if (progress > 0.7) {
          // Fade out al final
          alpha = 1.0 - ((progress - 0.7) / 0.3);
        }
        
        // Aplicar transformaciones
        ctx.translate(centerX, centerY);
        ctx.rotate(rotation);
        ctx.scale(scale, scale);
        ctx.globalAlpha = alpha;
        
        // Dibujar la imagen centrada
        const drawX = -goalImage.width / 2;
        const drawY = -goalImage.height / 2;
        ctx.drawImage(goalImage, drawX, drawY);
        
        // Efecto de brillo/glow adicional
        if (progress < 0.4) {
          ctx.globalAlpha = alpha * 0.3 * (1 - progress / 0.4);
          ctx.filter = 'blur(20px)';
          ctx.drawImage(goalImage, drawX, drawY);
        }
        
        ctx.restore();
      }
      
      // Dibujar animación de "out" si está activa (animación diferente, más negativa)
      if (game.showOutAnimation && outImageLoaded && outImage) {
        const elapsed = Date.now() - game.outAnimationTime;
        const duration = 2000; // Duración total de la animación
        const progress = Math.min(elapsed / duration, 1); // Progreso de 0 a 1
        
        ctx.save();
        
        // Centrar la imagen en el canvas
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        // Efecto diferente: temblor/agitación y escala más pequeña al final
        let scale = 0;
        let shakeX = 0;
        let shakeY = 0;
        
        if (progress < 0.2) {
          // Primera fase: aparece con temblor
          const shakeProgress = progress / 0.2;
          scale = 0.8 + 0.4 * shakeProgress; // Zoom in más lento
          // Efecto de temblor
          shakeX = (Math.random() - 0.5) * 20 * (1 - shakeProgress);
          shakeY = (Math.random() - 0.5) * 20 * (1 - shakeProgress);
        } else if (progress < 0.6) {
          // Segunda fase: temblor constante (malo)
          scale = 1.0;
          shakeX = (Math.random() - 0.5) * 15;
          shakeY = (Math.random() - 0.5) * 15;
        } else {
          // Tercera fase: se encoge y desaparece
          const shrinkProgress = (progress - 0.6) / 0.4;
          scale = 1.0 - 0.5 * shrinkProgress; // Se hace más pequeño
          shakeX = (Math.random() - 0.5) * 10 * (1 - shrinkProgress);
          shakeY = (Math.random() - 0.5) * 10 * (1 - shrinkProgress);
        }
        
        // Rotación negativa (como si estuviera cayendo)
        const rotation = progress < 0.5 ? 
          -Math.sin(progress * Math.PI * 3) * 0.15 : // Oscilación negativa
          -0.15 + (progress - 0.5) * 0.3; // Rotación hacia abajo
        
        // Fade in/out más rápido
        let alpha = 1.0;
        if (progress < 0.15) {
          // Fade in rápido
          alpha = progress / 0.15;
        } else if (progress > 0.6) {
          // Fade out al final
          alpha = 1.0 - ((progress - 0.6) / 0.4);
        }
        
        // Aplicar transformaciones
        ctx.translate(centerX + shakeX, centerY + shakeY);
        ctx.rotate(rotation);
        ctx.scale(scale, scale);
        ctx.globalAlpha = alpha;
        
        // Dibujar la imagen centrada
        const drawX = -outImage.width / 2;
        const drawY = -outImage.height / 2;
        ctx.drawImage(outImage, drawX, drawY);
        
        ctx.restore();
      }
      
      
      if (game.gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(game.message, canvas.width/2, canvas.height/2);
        ctx.textAlign = 'left';
      }
      
      // Dibujar animación de "robada" (se muestra encima de todo)
      if (game.showRobadaAnimation && robadaImageLoaded && robadaImage && robadaImage.complete) {
        const elapsed = Date.now() - game.robadaAnimationTime;
        const duration = 2000; // Duración total de la animación
        const progress = Math.min(elapsed / duration, 1); // Progreso de 0 a 1
        
        ctx.save();
        
        // Centrar la imagen en el canvas
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        // Efecto similar a "out": temblor/agitación y escala más pequeña al final
        let scale = 0;
        let shakeX = 0;
        let shakeY = 0;
        
        if (progress < 0.2) {
          // Primera fase: aparece con temblor
          const shakeProgress = progress / 0.2;
          scale = 0.8 + 0.4 * shakeProgress; // Zoom in más lento
          // Efecto de temblor
          shakeX = (Math.random() - 0.5) * 20 * (1 - shakeProgress);
          shakeY = (Math.random() - 0.5) * 20 * (1 - shakeProgress);
        } else if (progress < 0.6) {
          // Segunda fase: temblor constante (malo)
          scale = 1.0;
          shakeX = (Math.random() - 0.5) * 15;
          shakeY = (Math.random() - 0.5) * 15;
        } else {
          // Tercera fase: se encoge y desaparece
          const shrinkProgress = (progress - 0.6) / 0.4;
          scale = 1.0 - 0.5 * shrinkProgress; // Se hace más pequeño
          shakeX = (Math.random() - 0.5) * 10 * (1 - shrinkProgress);
          shakeY = (Math.random() - 0.5) * 10 * (1 - shrinkProgress);
        }
        
        // Rotación negativa (como si estuviera cayendo)
        const rotation = progress < 0.5 ? 
          -Math.sin(progress * Math.PI * 3) * 0.15 : // Oscilación negativa
          -0.15 + (progress - 0.5) * 0.3; // Rotación hacia abajo
        
        // Fade in/out más rápido
        let alpha = 1.0;
        if (progress < 0.15) {
          // Fade in rápido
          alpha = progress / 0.15;
        } else if (progress > 0.6) {
          // Fade out al final
          alpha = 1.0 - ((progress - 0.6) / 0.4);
        }
        
        // Aplicar transformaciones
        ctx.translate(centerX + shakeX, centerY + shakeY);
        ctx.rotate(rotation);
        ctx.scale(scale, scale);
        ctx.globalAlpha = alpha;
        
        // Dibujar la imagen centrada
        const drawX = -robadaImage.width / 2;
        const drawY = -robadaImage.height / 2;
        ctx.drawImage(robadaImage, drawX, drawY);
        
        ctx.restore();
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
