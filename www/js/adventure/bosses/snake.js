// bosses/snake.js - Boss del Reino de la Ciencia (Snake)
(function(window) {
  'use strict';

  if (!window.BossCore) {
    console.error('❌ BossCore no está cargado. Asegúrate de cargar bosses-core.js antes que snake.js');
    return;
  }

  const bossGameState = window.bossGameState;

  function initScienceSnake(handicap) {
    const canvas = bossGameState.canvas;
    const ctx = bossGameState.ctx;
    
    // === SISTEMA DE LAYOUT RESPONSIVO CON MARCO ===
    const isMobile = canvas.height > canvas.width;
    
    // Dimensiones del área de juego (dejando espacio para el marco)
    const frameHeight = isMobile ? 120 : 100;
    const gameAreaHeight = canvas.height - frameHeight;
    const gameAreaWidth = canvas.width;
    
    // Dimensiones del marco de juego (con márgenes)
    const gameFrameMargin = 20;
    const gameFrameWidth = gameAreaWidth - (gameFrameMargin * 2);
    const gameFrameHeight = gameAreaHeight - (gameFrameMargin * 2);
    
    const gridSize = Math.max(20, Math.min(30, Math.floor(gameFrameWidth / 20))); // Más grande
    const cols = Math.floor(gameFrameWidth / gridSize);
    const rows = Math.floor(gameFrameHeight / gridSize);
    
    // Cargar imágenes usando BossCore helpers
    let demonImage = null;
    let demonLoaded = false;
    window.BossCore.loadBossImage('./assets/bosses/demon_boss.webp')
      .then(img => {
        demonImage = img;
        demonLoaded = true;
      })
      .catch(() => {
        demonLoaded = false;
      });
    
    // Cargar imágenes de ciencia usando BossCore helper
    let scienceImages = {
      testTube: null,
      burner: null,
      flask: null,
      lab: null,
      microscope: null
    };
    let scienceImagesLoaded = 0;
    const totalScienceImages = 5;
    
    window.BossCore.loadScienceImages().then(images => {
      scienceImages = images;
      scienceImagesLoaded = totalScienceImages;
    });
    
    const game = {
      // Configuración del área de juego
      gameAreaX: 0,
      gameAreaY: frameHeight,
      gameAreaWidth: gameAreaWidth,
      gameAreaHeight: gameAreaHeight,
      gridSize: gridSize,
      cols: cols,
      rows: rows,
      
      // Estado del juego
      snake: [{x: Math.floor(cols/2), y: Math.floor(rows/2)}],
      direction: {x: 0, y: 0},
      food: null,
      score: 0,
      target: handicap.targetTubes || 10, // Necesita 10 tubos de ensayo
      gameOver: false,
      started: false,
      message: 'Usa las flechas para empezar. Recoge 10 tubos de ensayo!',
      speed: Math.max(100, 200 - (handicap.snakeSpeed || 0) * 20), // Velocidad basada en handicap
      
      // Efectos visuales
      demonLoaded: false,
      animationFrame: 0
    };
    
    // Generar primera comida
    generateFood();
    
    // Controles del teclado
    const keys = {};
    document.addEventListener('keydown', (e) => {
      keys[e.key] = true;
      if (!game.started && (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        game.started = true;
        game.message = 'Recoge 10 tubos de ensayo!';
      }
      if (e.key === 'ArrowUp' && game.direction.y === 0) {
        game.direction = {x: 0, y: -1};
      } else if (e.key === 'ArrowDown' && game.direction.y === 0) {
        game.direction = {x: 0, y: 1};
      } else if (e.key === 'ArrowLeft' && game.direction.x === 0) {
        game.direction = {x: -1, y: 0};
      } else if (e.key === 'ArrowRight' && game.direction.x === 0) {
        game.direction = {x: 1, y: 0};
      }
    });

    // Crear controles táctiles para móvil
    function createTouchControls() {
      const controls = document.createElement('div');
      controls.id = 'snake-touch-controls';
      controls.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
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
      const upBtn = createDirectionButton('↑', {x: 0, y: -1});
      upBtn.style.gridColumn = '2';
      upBtn.style.gridRow = '1';
      controls.appendChild(upBtn);

      // Botón izquierda
      const leftBtn = createDirectionButton('←', {x: -1, y: 0});
      leftBtn.style.gridColumn = '1';
      leftBtn.style.gridRow = '2';
      controls.appendChild(leftBtn);

      // Botón derecha
      const rightBtn = createDirectionButton('→', {x: 1, y: 0});
      rightBtn.style.gridColumn = '3';
      rightBtn.style.gridRow = '2';
      controls.appendChild(rightBtn);

      // Botón abajo
      const downBtn = createDirectionButton('↓', {x: 0, y: 1});
      downBtn.style.gridColumn = '2';
      downBtn.style.gridRow = '3';
      controls.appendChild(downBtn);

      document.body.appendChild(controls);
      return controls;
    }

    function createDirectionButton(text, direction) {
      const button = document.createElement('button');
      button.textContent = text;
      button.style.cssText = `
        background: rgba(52, 152, 219, 0.8);
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
        if (!game.started) {
          game.started = true;
          game.message = 'Recoge 10 tubos de ensayo!';
        }
        
        // Solo cambiar dirección si no es opuesta a la actual
        if (game.direction.x === 0 && direction.x !== 0) {
          game.direction = direction;
        } else if (game.direction.y === 0 && direction.y !== 0) {
          game.direction = direction;
        }
      });

      return button;
    }

    // Crear controles táctiles
    const touchControls = createTouchControls();
    
    // Actualizar HUD inicial
    window.BossCore.updateBossHUD(`Tubos: ${game.score}/${game.target} - Usa las flechas o controles táctiles`);
    
    function generateFood() {
      do {
        const scienceTypes = ['testTube', 'burner', 'flask', 'lab', 'microscope'];
        const randomType = scienceTypes[Math.floor(Math.random() * scienceTypes.length)];
        
        game.food = {
          x: Math.floor(Math.random() * game.cols),
          y: Math.floor(Math.random() * game.rows),
          type: randomType,
          isRare: Math.random() < 0.2, // 20% de objetos raros
          animationFrame: 0
        };
      } while (game.snake.some(segment => segment.x === game.food.x && segment.y === game.food.y));
    }
    
    function update() {
      if (game.gameOver || !game.started) return;
      
      // Incrementar frame de animación
      game.animationFrame++;
      
      // Mover serpiente
      const head = {x: game.snake[0].x + game.direction.x, y: game.snake[0].y + game.direction.y};
      
      // Verificar colisiones con paredes
      if (head.x < 0 || head.x >= game.cols || head.y < 0 || head.y >= game.rows) {
        game.gameOver = true;
        game.message = '¡Chocaste con la pared! DERROTA';
        return;
      }
      
      // Verificar colisión consigo misma
      if (game.snake.some(segment => segment.x === head.x && segment.y === head.y)) {
        game.gameOver = true;
        game.message = '¡Te mordiste a ti mismo! DERROTA';
        return;
      }
      
      game.snake.unshift(head);
      
      // Verificar si comió comida
      if (head.x === game.food.x && head.y === game.food.y) {
        // Bonus por objeto raro
        const bonus = game.food.isRare ? 2 : 1;
        game.score += bonus;
        
        if (game.score >= game.target) {
          game.gameOver = true;
          game.message = '¡VICTORIA! Recogiste todos los objetos de ciencia!';
          setTimeout(() => window.BossCore.endBossGame(true), 1000);
          return;
        }
        generateFood();
      } else {
        game.snake.pop();
      }
      
      // Animar la comida
      if (game.food) {
        game.food.animationFrame++;
      }
    }
    
    function draw() {
      // Fondo principal
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#0a0a0a');
      gradient.addColorStop(1, '#1a1a2e');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // === DEMONIO ASOMÁNDOSE (como en Tetris) ===
      if (demonLoaded && demonImage && demonImage.complete) {
        const demonWidth = Math.min(150, canvas.width * 0.4);
        const demonHeight = 120;
        const demonX = canvas.width/2 - demonWidth/2;
        const demonY = -30; // Asomándose desde arriba
        
        ctx.drawImage(demonImage, demonX, demonY, demonWidth, demonHeight);
      } else {
        // Dibujar demonio simple asomándose
        ctx.save();
        ctx.translate(canvas.width/2, 60);
        
        // Cuerpo del demonio (solo la parte superior)
        ctx.fillStyle = '#8b0000';
        ctx.fillRect(-40, -60, 80, 60);
        
        // Cabeza
        ctx.fillStyle = '#a00000';
        ctx.beginPath();
        ctx.arc(0, -40, 30, 0, Math.PI * 2);
        ctx.fill();
        
        // Cuernos
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.moveTo(-20, -60);
        ctx.lineTo(-25, -75);
        ctx.lineTo(-15, -65);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(20, -60);
        ctx.lineTo(25, -75);
        ctx.lineTo(15, -65);
        ctx.fill();
        
        // Ojos
        ctx.fillStyle = '#ff0000';
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 5;
        ctx.beginPath();
        ctx.arc(-10, -40, 4, 0, Math.PI * 2);
        ctx.arc(10, -40, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // Sonrisa malvada
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, -30, 15, 0, Math.PI);
        ctx.stroke();
        
        ctx.restore();
      }
      
      // Texto del juego (en la parte superior)
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(`Objetos: ${game.score}/${game.target}`, 20, 30);
      
      // === ÁREA DE JUEGO CON MARCO BLANCO ===
      
      // Marco blanco que delimita el área de la víbora
      const gameFrameX = 20;
      const gameFrameY = game.gameAreaY + 20;
      const gameFrameWidth = game.gameAreaWidth - 40;
      const gameFrameHeight = game.gameAreaHeight - 40;
      
      // Fondo del marco (blanco)
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(gameFrameX, gameFrameY, gameFrameWidth, gameFrameHeight);
      
      // Borde del marco
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.strokeRect(gameFrameX, gameFrameY, gameFrameWidth, gameFrameHeight);
      
      // Fondo del área de juego (laboratorio) - solo dentro del marco
      ctx.fillStyle = '#0f1419';
      ctx.fillRect(gameFrameX + 5, gameFrameY + 5, gameFrameWidth - 10, gameFrameHeight - 10);
      
      // Patrón de laboratorio dentro del marco
      ctx.strokeStyle = 'rgba(100, 150, 200, 0.1)';
      ctx.lineWidth = 1;
      for (let x = gameFrameX + 5; x < gameFrameX + gameFrameWidth - 5; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, gameFrameY + 5);
        ctx.lineTo(x, gameFrameY + gameFrameHeight - 5);
        ctx.stroke();
      }
      for (let y = gameFrameY + 5; y < gameFrameY + gameFrameHeight - 5; y += 40) {
        ctx.beginPath();
        ctx.moveTo(gameFrameX + 5, y);
        ctx.lineTo(gameFrameX + gameFrameWidth - 5, y);
        ctx.stroke();
      }
      
      // === DIBUJAR VÍBORA MEJORADA ===
      game.snake.forEach((segment, index) => {
        const x = gameFrameX + 5 + segment.x * game.gridSize;
        const y = gameFrameY + 5 + segment.y * game.gridSize;
        
        if (index === 0) {
          // Cabeza de víbora
          drawViperHead(x, y, game.gridSize, game.direction);
        } else {
          // Cuerpo de víbora
          drawViperBody(x, y, game.gridSize, index, game.snake.length);
        }
      });
      
      // === DIBUJAR OBJETOS DE CIENCIA MEJORADOS ===
      if (game.food) {
        const x = gameFrameX + 5 + game.food.x * game.gridSize;
        const y = gameFrameY + 5 + game.food.y * game.gridSize;
        drawScienceObject(x, y, game.gridSize, game.food.type, game.food.isRare, game.food.animationFrame);
      }
      
      // === MENSAJES DE JUEGO ===
      if (game.gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(game.message, canvas.width/2, canvas.height/2);
        ctx.textAlign = 'left';
      } else if (!game.started) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(game.gameAreaX, game.gameAreaY, game.gameAreaWidth, game.gameAreaHeight);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Usa las flechas para empezar', canvas.width/2, canvas.height/2);
        ctx.textAlign = 'left';
      }
    }
    
    // Función para dibujar cabeza de víbora
    function drawViperHead(x, y, size, direction) {
      ctx.save();
      ctx.translate(x + size/2, y + size/2);
      
      // Rotar según dirección
      if (direction.x === 1) ctx.rotate(0);
      else if (direction.x === -1) ctx.rotate(Math.PI);
      else if (direction.y === -1) ctx.rotate(-Math.PI/2);
      else if (direction.y === 1) ctx.rotate(Math.PI/2);
      
      // Cabeza de víbora
      const headSize = size * 0.8;
      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, headSize/2);
      gradient.addColorStop(0, '#2d5016');
      gradient.addColorStop(0.7, '#4a7c59');
      gradient.addColorStop(1, '#1a3d0a');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.ellipse(0, 0, headSize/2, headSize/2.5, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Ojos de víbora
      ctx.fillStyle = '#ff0000';
      ctx.shadowColor = '#ff0000';
      ctx.shadowBlur = 3;
      ctx.beginPath();
      ctx.arc(-headSize/4, -headSize/6, 2, 0, Math.PI * 2);
      ctx.arc(headSize/4, -headSize/6, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      
      // Lengua bífida
      ctx.strokeStyle = '#ff6b6b';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, headSize/3);
      ctx.lineTo(-3, headSize/2);
      ctx.moveTo(0, headSize/3);
      ctx.lineTo(3, headSize/2);
      ctx.stroke();
      
      ctx.restore();
    }
    
    // Función para dibujar cuerpo de víbora
    function drawViperBody(x, y, size, index, totalLength) {
      const bodySize = size * 0.7;
      const alpha = 1 - (index / totalLength) * 0.5; // Desvanecer hacia la cola
      
      // Patrón de escamas
      const gradient = ctx.createRadialGradient(x + size/2, y + size/2, 0, x + size/2, y + size/2, bodySize/2);
      gradient.addColorStop(0, `rgba(45, 80, 22, ${alpha})`);
      gradient.addColorStop(0.5, `rgba(74, 124, 89, ${alpha})`);
      gradient.addColorStop(1, `rgba(26, 61, 10, ${alpha})`);
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x + size/2, y + size/2, bodySize/2, 0, Math.PI * 2);
      ctx.fill();
      
      // Escamas individuales
      ctx.strokeStyle = `rgba(26, 61, 10, ${alpha * 0.8})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x + size/2, y + size/2, bodySize/2 - 2, 0, Math.PI * 2);
      ctx.stroke();
    }
    
    // Función para dibujar objetos de ciencia
    function drawScienceObject(x, y, size, type, isRare, animationFrame) {
      ctx.save();
      ctx.translate(x + size/2, y + size/2);
      
      // Efecto de brillo para objetos raros
      if (isRare) {
        ctx.shadowColor = '#00ff00';
        ctx.shadowBlur = 8;
      }
      
      // Tamaño más grande
      const objectSize = size * 1.2;
      
      // Seleccionar imagen según el tipo
      let imageToUse = null;
      if (scienceImagesLoaded === totalScienceImages && scienceImages[type]) {
        imageToUse = scienceImages[type];
      }
      
      // Dibujar imagen SVG si está disponible
      if (imageToUse && imageToUse.complete) {
        ctx.drawImage(imageToUse, -objectSize/2, -objectSize/2, objectSize, objectSize);
        
        // Efecto de brillo para objetos raros
        if (isRare) {
          ctx.shadowColor = '#00ff00';
          ctx.shadowBlur = 4;
          ctx.drawImage(imageToUse, -objectSize/2, -objectSize/2, objectSize, objectSize);
          ctx.shadowBlur = 0;
        }
      } else {
        // Fallback: dibujar objeto simple
        const objectWidth = size * 0.6;
        const objectHeight = size * 0.6;
        
        // Color según el tipo
        let color = '#4a90e2';
        switch (type) {
          case 'testTube':
            color = '#4a90e2';
            break;
          case 'burner':
            color = '#ff6b6b';
            break;
          case 'flask':
            color = '#4ecdc4';
            break;
          case 'lab':
            color = '#45b7b8';
            break;
          case 'microscope':
            color = '#f39c12';
            break;
        }
        
        if (isRare) {
          color = '#00ff00';
        }
        
        ctx.fillStyle = color;
        ctx.fillRect(-objectWidth/2, -objectHeight/2, objectWidth, objectHeight);
        
        // Borde
        ctx.strokeStyle = isRare ? '#00aa00' : '#2c5aa0';
        ctx.lineWidth = 2;
        ctx.strokeRect(-objectWidth/2, -objectHeight/2, objectWidth, objectHeight);
      }
      
      ctx.shadowBlur = 0;
      ctx.restore();
    }
    
    function gameLoop() {
      update();
      draw();
      if (!game.gameOver) {
        bossGameState.animationId = setTimeout(gameLoop, game.speed);
      } else {
        // Limpiar controles táctiles cuando el juego termine
        const controls = document.getElementById('snake-touch-controls');
        if (controls) {
          controls.remove();
        }
        // Llamar a endBossGame si perdió
        if (game.message.includes('DERROTA')) {
          setTimeout(() => window.BossCore.endBossGame(false), 1000);
        }
      }
    }
    
    gameLoop();
  }

  window.BossGames = window.BossGames || {};
  window.BossGames.initScienceSnake = initScienceSnake;

})(window);

