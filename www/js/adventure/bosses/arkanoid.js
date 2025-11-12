// bosses/arkanoid.js - Boss del Reino del Cine (Arkanoid)
(function(window) {
  'use strict';

  function initMovieArkanoid(handicap) {
    const canvas = window.bossGameState.canvas;
    const ctx = window.bossGameState.ctx;
    
    // Cargar imagen del demonio usando BossCore helper
    let demonImage = null;
    let imageLoaded = false;
    window.BossCore.loadBossImage('./assets/bosses/demon_boss.webp')
      .then(img => {
        demonImage = img;
        imageLoaded = true;
      })
      .catch(() => {
        imageLoaded = false;
      });
    
    // Cargar imagen de fondo
    let bgImage = null;
    let bgImageLoaded = false;
    window.BossCore.loadBossImage('./assets/maps/arkanoidBg02.webp')
      .then(img => { 
        bgImage = img; 
        bgImageLoaded = true; 
        console.log('Imagen de fondo de Arkanoid cargada correctamente');
      })
      .catch(err => { 
        bgImageLoaded = false; 
        console.error('Error cargando imagen de fondo de Arkanoid:', err);
      });
    
    // Usar BossCore.calculateScale para responsive design
    const scaleConfig = window.BossCore.calculateScale(800, 600, canvas, {
      mobileWidth: 400,
      mobileHeight: 600,
      maxScale: 1.2
    });
    const { scale, offsetX, offsetY, baseWidth, baseHeight, isMobile } = scaleConfig;
    
    const game = {
      // Configuración de escala y offset
      scale: scale,
      offsetX: offsetX,
      offsetY: offsetY,
      baseWidth: baseWidth,
      baseHeight: baseHeight,
      
      paddle: {
        x: baseWidth / 2 - 50,
        y: baseHeight - 30,
        width: 100,
        height: 10,
        speed: 8 * (handicap.playerSpeed || 1)
      },
      ball: {
        x: baseWidth / 2,
        y: baseHeight - 50,
        dx: 0,
        dy: 0,
        radius: 8,
        prevX: baseWidth / 2,
        prevY: baseHeight - 50,
        active: false
      },
      boss: {
        x: baseWidth / 2,
        y: Math.min(140, baseHeight * 0.18),
        width: Math.max(100, baseWidth * 0.10),
        height: Math.max(120, baseHeight * 0.18),
        speed: 3 * (handicap.bossSpeed || 1),
        health: handicap.bossLives || 3,
        maxHealth: handicap.bossLives || 3,
        direction: 1,
        hitCooldown: 0,
        wasHit: false
      },
      player: {
        lives: handicap.playerLives || 3,
        maxLives: handicap.playerLives || 3
      },
      blocks: [],
      keys: {},
      gameOver: false
    };
    
    // Crear barrera de bloques protectores con mejor adaptación móvil
    const baseRows = 3;
    const totalRows = baseRows + (handicap.extraRows || 0);
    
    // Bloques más pequeños y más juntos - aumentar columnas y reducir gutter
    const cols = Math.max(12, Math.floor(baseWidth / 60)); // Más columnas (antes 8, ahora 12+)
    const gutter = Math.max(2, Math.floor(baseWidth * 0.005)); // Gutter más pequeño (antes 0.01, ahora 0.005)
    const totalGutters = gutter * (cols + 1);
    const blockWidth = Math.max(30, Math.floor((baseWidth - totalGutters) / cols)); // Bloques más pequeños
    const blockHeight = Math.max(12, Math.floor(blockWidth * 0.3)); // Mantener proporción
    const startY = Math.min(baseHeight * 0.35, 250);
    
    for (let row = 0; row < totalRows; row++) {
        for (let col = 0; col < cols; col++) {
        const colors = ['#e74c3c', '#f39c12', '#3498db', '#9b59b6', '#2ecc71'];
        game.blocks.push({
          x: gutter + col * (blockWidth + gutter),
          y: startY + row * (blockHeight + 3), // Menos espacio vertical (antes 6, ahora 3)
          width: blockWidth,
          height: blockHeight,
          destroyed: false,
          color: colors[row % colors.length]
        });
      }
    }
    
    // Controles
    document.addEventListener('keydown', (e) => game.keys[e.key] = true);
    document.addEventListener('keyup', (e) => game.keys[e.key] = false);
    
    // Controles táctiles mejorados con escala
    let touchX = null;
    let lastTouchPaddleX = game.paddle.x;
    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      touchX = (e.touches[0].clientX - rect.left) * scaleX;
    });
    
    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (touchX !== null) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const currentX = (e.touches[0].clientX - rect.left) * scaleX;
        const diff = (currentX - touchX) / game.scale;
        game.paddle.x += diff * 2;
        game.paddle.x = Math.max(0, Math.min(game.baseWidth - game.paddle.width, game.paddle.x));
        
        // Activar pelota si se movió la barra por primera vez
        if (!game.ball.active && Math.abs(game.paddle.x - lastTouchPaddleX) > 0.1) {
          game.ball.active = true;
          game.ball.dx = 4;
          game.ball.dy = -4;
        }
        lastTouchPaddleX = game.paddle.x;
        touchX = currentX;
      }
    });
    
    canvas.addEventListener('touchend', () => {
      touchX = null;
    });
    
    // Control con mouse con escala
    let lastPaddleX = game.paddle.x;
    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const mouseX = (e.clientX - rect.left) * scaleX;
      // Convertir coordenadas del canvas a coordenadas del juego
      const gameX = (mouseX - game.offsetX) / game.scale;
      game.paddle.x = gameX - game.paddle.width / 2;
      game.paddle.x = Math.max(0, Math.min(game.baseWidth - game.paddle.width, game.paddle.x));
      
      // Activar pelota si se movió la barra por primera vez
      if (!game.ball.active && Math.abs(game.paddle.x - lastPaddleX) > 0.1) {
        game.ball.active = true;
        game.ball.dx = 4;
        game.ball.dy = -4;
      }
      lastPaddleX = game.paddle.x;
    });
    
    // Funciones helper para detección de colisiones mejoradas
    function checkCircleRectCollision(ballX, ballY, ballRadius, rectX, rectY, rectWidth, rectHeight) {
      // Encontrar el punto más cercano en el rectángulo al centro del círculo
      const closestX = Math.max(rectX, Math.min(ballX, rectX + rectWidth));
      const closestY = Math.max(rectY, Math.min(ballY, rectY + rectHeight));
      
      // Calcular distancia entre el centro del círculo y el punto más cercano
      const dx = ballX - closestX;
      const dy = ballY - closestY;
      const distanceSquared = dx * dx + dy * dy;
      
      // Si la distancia es menor que el radio, hay colisión
      return distanceSquared <= ballRadius * ballRadius;
    }
    
    function checkSweptCollision(ballPrevX, ballPrevY, ballX, ballY, ballRadius, rectX, rectY, rectWidth, rectHeight) {
      // Verificar colisión en posición actual (primera prioridad)
      if (checkCircleRectCollision(ballX, ballY, ballRadius, rectX, rectY, rectWidth, rectHeight)) {
        return true;
      }
      
      // Verificar si la trayectoria cruza el rectángulo
      // Solo si la pelota se mueve rápido, dividir la trayectoria en segmentos
      const moveDistance = Math.sqrt((ballX - ballPrevX) * (ballX - ballPrevX) + (ballY - ballPrevY) * (ballY - ballPrevY));
      
      // Si la pelota se movió más de su radio, verificar trayectoria
      if (moveDistance > ballRadius) {
        const steps = Math.min(5, Math.ceil(moveDistance / ballRadius)); // Máximo 5 pasos para mejor rendimiento
        for (let i = 1; i <= steps; i++) {
          const t = i / steps;
          const checkX = ballPrevX + (ballX - ballPrevX) * t;
          const checkY = ballPrevY + (ballY - ballPrevY) * t;
          if (checkCircleRectCollision(checkX, checkY, ballRadius, rectX, rectY, rectWidth, rectHeight)) {
            return true;
          }
        }
      }
      
      return false;
    }
    
    function update() {
      if (game.gameOver) return;
      
      // Mover paddle con teclado
      let paddleMoved = false;
      if (game.keys['ArrowLeft'] || game.keys['a'] || game.keys['A']) {
        game.paddle.x -= game.paddle.speed;
        paddleMoved = true;
      }
      if (game.keys['ArrowRight'] || game.keys['d'] || game.keys['D']) {
        game.paddle.x += game.paddle.speed;
        paddleMoved = true;
      }
      game.paddle.x = Math.max(0, Math.min(game.baseWidth - game.paddle.width, game.paddle.x));
      
      // Activar pelota si se movió la barra por primera vez
      if (!game.ball.active && paddleMoved) {
        game.ball.active = true;
        game.ball.dx = 4;
        game.ball.dy = -4;
      }
      
      // Mover jefe
      game.boss.x += game.boss.speed * game.boss.direction;
      if (game.boss.x <= 80 || game.boss.x >= game.baseWidth - 80) {
        game.boss.direction *= -1;
      }
      
      // Reducir cooldown de golpe al jefe
      if (game.boss.hitCooldown > 0) {
        game.boss.hitCooldown--;
      }
      
      // Guardar posición anterior de la pelota
      game.ball.prevX = game.ball.x;
      game.ball.prevY = game.ball.y;
      
      // Mover pelota solo si está activa
      if (game.ball.active) {
        game.ball.x += game.ball.dx;
        game.ball.y += game.ball.dy;
      } else {
        // Si la pelota no está activa, mantenerla pegada a la barra
        game.ball.x = game.paddle.x + game.paddle.width / 2;
        game.ball.y = game.paddle.y - game.ball.radius - 2;
      }
      
      // Rebote en paredes con corrección de posición (solo si la pelota está activa)
      if (game.ball.active) {
        if (game.ball.x + game.ball.radius > game.baseWidth) {
          game.ball.x = game.baseWidth - game.ball.radius;
          game.ball.dx = -Math.abs(game.ball.dx); // Asegurar que rebote hacia la izquierda
        }
        if (game.ball.x - game.ball.radius < 0) {
          game.ball.x = game.ball.radius;
          game.ball.dx = Math.abs(game.ball.dx); // Asegurar que rebote hacia la derecha
        }
        if (game.ball.y - game.ball.radius < 0) {
          game.ball.y = game.ball.radius;
          game.ball.dy = Math.abs(game.ball.dy); // Asegurar que rebote hacia abajo
        }
        
        // Verificación final: asegurar que la pelota no quede atrapada en esquinas
        // Si la pelota está en una esquina y no se está moviendo, darle un pequeño impulso
        const isInCorner = (game.ball.x <= game.ball.radius + 1 && game.ball.y <= game.ball.radius + 1) ||
                           (game.ball.x >= game.baseWidth - game.ball.radius - 1 && game.ball.y <= game.ball.radius + 1);
        
        if (isInCorner && Math.abs(game.ball.dx) < 0.5 && Math.abs(game.ball.dy) < 0.5) {
          // Dar un pequeño impulso para liberar la pelota
          game.ball.dx = game.ball.x < game.baseWidth / 2 ? 3 : -3;
          game.ball.dy = 3;
        }
      }
      
      // Verificar si la pelota salió del área del jefe (para resetear el cooldown)
      // Usar hitbox expandido para detectar mejor
      const bossHitboxPadding = 2; // Padding extra para detectar colisiones en esquinas
      const bossRect = {
        x: game.boss.x - game.boss.width/2 - bossHitboxPadding,
        y: game.boss.y - game.boss.height/2 - bossHitboxPadding,
        width: game.boss.width + (bossHitboxPadding * 2),
        height: game.boss.height + (bossHitboxPadding * 2)
      };
      
      // Rectángulo original del boss (sin padding) para verificar si la pelota realmente está dentro
      const bossOriginalRect = {
        x: game.boss.x - game.boss.width/2,
        y: game.boss.y - game.boss.height/2,
        width: game.boss.width,
        height: game.boss.height
      };
      
      const ballInBossArea = checkCircleRectCollision(
        game.ball.x, game.ball.y, game.ball.radius,
        bossOriginalRect.x, bossOriginalRect.y, bossOriginalRect.width, bossOriginalRect.height
      );
      
      if (!ballInBossArea && game.boss.wasHit) {
        // Si la pelota salió del área y el jefe fue golpeado, resetear el flag
        game.boss.wasHit = false;
      }
      
      // Colisión con el jefe (usando detección mejorada) - solo si la pelota está activa
      if (game.ball.active &&
          game.boss.hitCooldown <= 0 && 
          !game.boss.wasHit &&
          game.ball.y < game.boss.y + game.boss.height/2) { // Solo golpear si viene desde abajo
        
        // Usar hitbox expandido para detectar colisiones, pero verificar con el original
        const bossHit = checkSweptCollision(
          game.ball.prevX, game.ball.prevY,
          game.ball.x, game.ball.y,
          game.ball.radius,
          bossRect.x, bossRect.y, bossRect.width, bossRect.height
        );
        
        // Si hay colisión con el hitbox expandido Y la pelota está cerca del área original
        if (bossHit) {
          // Verificar si la pelota está realmente cerca del boss original
          const closestX = Math.max(bossOriginalRect.x, Math.min(game.ball.x, bossOriginalRect.x + bossOriginalRect.width));
          const closestY = Math.max(bossOriginalRect.y, Math.min(game.ball.y, bossOriginalRect.y + bossOriginalRect.height));
          const dx = game.ball.x - closestX;
          const dy = game.ball.y - closestY;
          const distanceToBoss = Math.sqrt(dx * dx + dy * dy);
          
          // Si la distancia es menor que el radio + padding, es un golpe válido
          if (distanceToBoss <= game.ball.radius + bossHitboxPadding) {
            // Ajustar posición de la pelota para evitar que quede dentro del jefe
            if (distanceToBoss > 0 && distanceToBoss < game.ball.radius) {
              // Empujar la pelota fuera del jefe solo si está dentro (ajuste conservador)
              const pushDistance = (game.ball.radius - distanceToBoss) * 0.5;
              if (pushDistance > 0.1) {
                const pushX = (dx / distanceToBoss) * pushDistance;
                const pushY = (dy / distanceToBoss) * pushDistance;
                game.ball.x += pushX;
                game.ball.y += pushY;
                
                // Asegurar que no salga de los límites
                game.ball.x = Math.max(game.ball.radius, Math.min(game.baseWidth - game.ball.radius, game.ball.x));
                game.ball.y = Math.max(game.ball.radius, Math.min(game.baseHeight, game.ball.y));
              }
            }
            
            game.ball.dy = -Math.abs(game.ball.dy); // Asegurar que rebote hacia arriba
            game.boss.health--;
            game.boss.hitCooldown = 30; // Cooldown de 30 frames (~0.5 segundos a 60fps)
            game.boss.wasHit = true;
            
            const playerName = window.BossCore.getPlayerNameForBoss();
            window.BossCore.updateBossHUD(`${playerName}: ${'❤️'.repeat(game.player.lives)} | Demonio del Cine: ${'💀'.repeat(game.boss.health)}`);
            
            // Efecto de daño al jefe
            ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            if (game.boss.health <= 0) {
              game.gameOver = true;
              window.BossCore.endBossGame(true);
            }
          }
        }
      }
      
      // Colisión con paddle (mejorada)
      const paddleRect = {
        x: game.paddle.x,
        y: game.paddle.y,
        width: game.paddle.width,
        height: game.paddle.height
      };
      
      // Colisión con paddle solo si la pelota está activa
      let paddleHit = false;
      if (game.ball.active) {
        paddleHit = checkSweptCollision(
          game.ball.prevX, game.ball.prevY,
          game.ball.x, game.ball.y,
          game.ball.radius,
          paddleRect.x, paddleRect.y, paddleRect.width, paddleRect.height
        );
      }
      
      if (paddleHit && game.ball.dy > 0) { // Solo si viene desde arriba
        // Ajustar posición de la pelota
        const closestX = Math.max(paddleRect.x, Math.min(game.ball.x, paddleRect.x + paddleRect.width));
        const closestY = Math.max(paddleRect.y, Math.min(game.ball.y, paddleRect.y + paddleRect.height));
        const dx = game.ball.x - closestX;
        const dy = game.ball.y - closestY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0 && distance < game.ball.radius) {
          // Ajuste conservador para evitar empujones agresivos
          const pushDistance = (game.ball.radius - distance) * 0.5;
          if (pushDistance > 0.1) { // Solo ajustar si es significativo
            const pushX = (dx / distance) * pushDistance;
            const pushY = (dy / distance) * pushDistance;
            game.ball.x += pushX;
            game.ball.y += pushY;
            
            // Asegurar que no salga de los límites
            game.ball.x = Math.max(game.ball.radius, Math.min(game.baseWidth - game.ball.radius, game.ball.x));
            game.ball.y = Math.max(game.ball.radius, Math.min(game.baseHeight, game.ball.y));
          }
        }
        
        game.ball.dy = -Math.abs(game.ball.dy);
        // Ajustar ángulo según dónde golpea el paddle
        const hitPos = (game.ball.x - game.paddle.x) / game.paddle.width;
        game.ball.dx = 8 * (hitPos - 0.5);
      }
      
      // Colisión con bloques (mejorada) - solo si la pelota está activa
      if (game.ball.active) {
        // Expandir ligeramente el hitbox para detectar mejor las colisiones en intersecciones
        const hitboxPadding = 1; // Padding extra para detectar colisiones en esquinas
        
        // Variable para rastrear qué bloque fue golpeado (solo uno por frame)
        let hitBlock = null;
        let minHitDistance = Infinity;
        
        // Primero, encontrar el bloque más cercano que fue golpeado
        game.blocks.forEach(block => {
          if (!block.destroyed) {
            // Expandir el rectángulo del bloque ligeramente para detectar mejor colisiones en intersecciones
            const blockRect = {
              x: block.x - hitboxPadding,
              y: block.y - hitboxPadding,
              width: block.width + (hitboxPadding * 2),
              height: block.height + (hitboxPadding * 2)
            };
            
            const blockHit = checkSweptCollision(
              game.ball.prevX, game.ball.prevY,
              game.ball.x, game.ball.y,
              game.ball.radius,
              blockRect.x, blockRect.y, blockRect.width, blockRect.height
            );
            
            if (blockHit) {
              // Calcular distancia desde el centro de la pelota al centro del bloque
              const blockCenterX = block.x + block.width / 2;
              const blockCenterY = block.y + block.height / 2;
              const distance = Math.sqrt(
                (game.ball.x - blockCenterX) * (game.ball.x - blockCenterX) +
                (game.ball.y - blockCenterY) * (game.ball.y - blockCenterY)
              );
              
              // Guardar el bloque más cercano
              if (distance < minHitDistance) {
                minHitDistance = distance;
                hitBlock = block;
              }
            }
          }
        });
        
        // Solo procesar el bloque más cercano (el que realmente golpeó)
        if (hitBlock) {
          hitBlock.destroyed = true;
          
          // Usar el rectángulo original del bloque para calcular el rebote
          const originalBlockRect = {
            x: hitBlock.x,
            y: hitBlock.y,
            width: hitBlock.width,
            height: hitBlock.height
          };
          
          // Determinar desde qué lado golpeó para un rebote más realista
          const ballCenterX = game.ball.x;
          const ballCenterY = game.ball.y;
          const blockCenterX = originalBlockRect.x + originalBlockRect.width / 2;
          const blockCenterY = originalBlockRect.y + originalBlockRect.height / 2;
          
          // Calcular distancias a los bordes del bloque
          const distToLeft = Math.abs(ballCenterX - originalBlockRect.x);
          const distToRight = Math.abs(ballCenterX - (originalBlockRect.x + originalBlockRect.width));
          const distToTop = Math.abs(ballCenterY - originalBlockRect.y);
          const distToBottom = Math.abs(ballCenterY - (originalBlockRect.y + originalBlockRect.height));
          
          // Encontrar el borde más cercano
          const minDistX = Math.min(distToLeft, distToRight);
          const minDistY = Math.min(distToTop, distToBottom);
          
          // Si la pelota está cerca de una esquina (dentro del radio), usar ambos rebotes
          const isNearCorner = minDistX < game.ball.radius && minDistY < game.ball.radius;
          
          if (isNearCorner) {
            // Si está cerca de una esquina, rebotar en ambas direcciones
            game.ball.dx = -game.ball.dx;
            game.ball.dy = -game.ball.dy;
            
            // Ajustar posición para evitar que quede dentro
            if (game.ball.x < blockCenterX) {
              game.ball.x = Math.max(game.ball.radius, originalBlockRect.x - game.ball.radius);
            } else {
              game.ball.x = Math.min(game.baseWidth - game.ball.radius, originalBlockRect.x + originalBlockRect.width + game.ball.radius);
            }
            if (game.ball.y < blockCenterY) {
              game.ball.y = Math.max(game.ball.radius, originalBlockRect.y - game.ball.radius);
            } else {
              game.ball.y = Math.min(game.baseHeight, originalBlockRect.y + originalBlockRect.height + game.ball.radius);
            }
          } else if (minDistX < minDistY) {
            // Golpe horizontal
            game.ball.dx = -game.ball.dx;
            // Ajustar posición para evitar que quede dentro
            if (game.ball.x < blockCenterX) {
              game.ball.x = Math.max(game.ball.radius, originalBlockRect.x - game.ball.radius);
            } else {
              game.ball.x = Math.min(game.baseWidth - game.ball.radius, originalBlockRect.x + originalBlockRect.width + game.ball.radius);
            }
          } else {
            // Golpe vertical
            game.ball.dy = -game.ball.dy;
            // Ajustar posición para evitar que quede dentro
            if (game.ball.y < blockCenterY) {
              game.ball.y = Math.max(game.ball.radius, originalBlockRect.y - game.ball.radius);
            } else {
              game.ball.y = Math.min(game.baseHeight, originalBlockRect.y + originalBlockRect.height + game.ball.radius);
            }
          }
        }
      }
      
      // Pelota fuera (solo si está activa)
      if (game.ball.active && game.ball.y > game.baseHeight) {
        // Perder una vida
        game.player.lives--;
        const playerName = window.BossCore.getPlayerNameForBoss();
        window.BossCore.updateBossHUD(`${playerName}: ${'❤️'.repeat(game.player.lives)} | Demonio del Cine: ${'💀'.repeat(game.boss.health)}`);
        
        if (game.player.lives <= 0) {
          // Game Over - Perdiste
          game.gameOver = true;
          window.BossCore.endBossGame(false);
        } else {
          // Reset pelota - pegada a la barra, inactiva
          game.ball.x = game.paddle.x + game.paddle.width / 2;
          game.ball.y = game.paddle.y - game.ball.radius - 2;
          game.ball.prevX = game.ball.x;
          game.ball.prevY = game.ball.y;
          game.ball.dx = 0;
          game.ball.dy = 0;
          game.ball.active = false;
        }
      }
    }
    
    function draw() {
      // Siempre dibujar el fondo degradado oscuro primero
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#0a0a0a');
      gradient.addColorStop(1, '#1a1a2e');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Dibujar imagen de fondo con 50% de opacidad encima del degradado
      // En móvil: fit vertical (llenar altura completa)
      // En PC: mantener proporción completa
      if (bgImageLoaded && bgImage) {
        ctx.save();
        ctx.globalAlpha = 0.5;
        
        let drawWidth, drawHeight, drawX, drawY;
        const bgAspectRatio = bgImage.width / bgImage.height;
        const canvasAspectRatio = canvas.width / canvas.height;
        
        if (isMobile) {
          // Móvil: fit vertical - ajustar por altura y centrar horizontalmente
          drawHeight = canvas.height;
          drawWidth = drawHeight * bgAspectRatio;
          drawX = (canvas.width - drawWidth) / 2;
          drawY = 0;
        } else {
          // PC: mantener proporción completa
          if (canvasAspectRatio > bgAspectRatio) {
            // Canvas es más ancho - ajustar por altura
            drawHeight = canvas.height;
            drawWidth = drawHeight * bgAspectRatio;
            drawX = (canvas.width - drawWidth) / 2;
            drawY = 0;
          } else {
            // Canvas es más alto - ajustar por ancho
            drawWidth = canvas.width;
            drawHeight = drawWidth / bgAspectRatio;
            drawX = 0;
            drawY = (canvas.height - drawHeight) / 2;
          }
        }
        
        ctx.drawImage(bgImage, drawX, drawY, drawWidth, drawHeight);
        ctx.restore();
      }
      
      // === MARCO LATERAL DEL CANVAS (fuera del área escalada) ===
      // Dibujar los laterales del marco directamente en el canvas para que se vean en móvil
      if (isMobile && game.offsetX > 5) {
        // Hay espacio a los lados en móvil - dibujar marcos laterales
        const lateralBarWidth = Math.max(4, Math.min(game.offsetX * 0.4, 20)); // Grosor de las barras laterales (4-20px)
        
        // Barra lateral izquierda con gradiente
        const leftGradient = ctx.createLinearGradient(0, 0, lateralBarWidth, 0);
        leftGradient.addColorStop(0, '#1a1a2e');
        leftGradient.addColorStop(0.5, '#2c3e50');
        leftGradient.addColorStop(1, '#ecf0f1');
        ctx.fillStyle = leftGradient;
        ctx.fillRect(0, 0, lateralBarWidth, canvas.height);
        
        // Barra lateral derecha con gradiente
        const rightGradient = ctx.createLinearGradient(canvas.width - lateralBarWidth, 0, canvas.width, 0);
        rightGradient.addColorStop(0, '#ecf0f1');
        rightGradient.addColorStop(0.5, '#2c3e50');
        rightGradient.addColorStop(1, '#1a1a2e');
        ctx.fillStyle = rightGradient;
        ctx.fillRect(canvas.width - lateralBarWidth, 0, lateralBarWidth, canvas.height);
        
        // Líneas de borde interno para mayor visibilidad
        ctx.strokeStyle = '#ecf0f1';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(lateralBarWidth, 0);
        ctx.lineTo(lateralBarWidth, canvas.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(canvas.width - lateralBarWidth, 0);
        ctx.lineTo(canvas.width - lateralBarWidth, canvas.height);
        ctx.stroke();
      }
      
      // Aplicar transformaciones de escala y posición
      ctx.save();
      ctx.translate(game.offsetX, game.offsetY);
      ctx.scale(game.scale, game.scale);
      
      // === MARCO DECORATIVO ALREDEDOR DEL CAMPO DE JUEGO ===
      // Ajustar grosor del marco según el tamaño de pantalla
      // En móvil usamos valores más pequeños que se escalan apropiadamente
      const baseBorderWidth = isMobile ? 6 : 8;
      const baseBorderPadding = isMobile ? 8 : 10;
      const baseCornerSize = isMobile ? 18 : 25;
      const baseCornerThickness = isMobile ? 3 : 4;
      
      // Ajustar según la escala para mantener consistencia visual
      // Como estamos dentro del contexto escalado, necesitamos ajustar inversamente
      const scaledBorderWidth = baseBorderWidth / game.scale;
      const scaledBorderPadding = baseBorderPadding / game.scale;
      const scaledCornerSize = baseCornerSize / game.scale;
      const scaledCornerThickness = baseCornerThickness / game.scale;
      
      // Marco exterior (borde oscuro con brillo)
      ctx.strokeStyle = '#2c3e50';
      ctx.lineWidth = scaledBorderWidth + 2;
      ctx.strokeRect(
        -scaledBorderPadding, 
        -scaledBorderPadding, 
        game.baseWidth + (scaledBorderPadding * 2), 
        game.baseHeight + (scaledBorderPadding * 2)
      );
      
      // Marco interior (borde brillante)
      ctx.strokeStyle = '#ecf0f1';
      ctx.lineWidth = scaledBorderWidth;
      ctx.strokeRect(
        -scaledBorderPadding, 
        -scaledBorderPadding, 
        game.baseWidth + (scaledBorderPadding * 2), 
        game.baseHeight + (scaledBorderPadding * 2)
      );
      
      // Línea de neón interna (efecto cinematográfico)
      const baseNeonWidth = isMobile ? 2.5 : 3;
      const baseNeonBlur = isMobile ? 12 : 15;
      ctx.strokeStyle = '#e74c3c';
      ctx.lineWidth = baseNeonWidth / game.scale;
      ctx.shadowColor = '#e74c3c';
      ctx.shadowBlur = baseNeonBlur / game.scale;
      ctx.strokeRect(
        -scaledBorderPadding + (scaledBorderWidth / 2), 
        -scaledBorderPadding + (scaledBorderWidth / 2), 
        game.baseWidth + (scaledBorderPadding * 2) - scaledBorderWidth, 
        game.baseHeight + (scaledBorderPadding * 2) - scaledBorderWidth
      );
      ctx.shadowBlur = 0;
      
      // Esquinas decorativas (estilo cine vintage)
      ctx.strokeStyle = '#f39c12';
      ctx.lineWidth = scaledCornerThickness;
      ctx.lineCap = 'round';
      
      // Esquina superior izquierda
      ctx.beginPath();
      ctx.moveTo(-scaledBorderPadding, -scaledBorderPadding + scaledCornerSize);
      ctx.lineTo(-scaledBorderPadding, -scaledBorderPadding);
      ctx.lineTo(-scaledBorderPadding + scaledCornerSize, -scaledBorderPadding);
      ctx.stroke();
      
      // Esquina superior derecha
      ctx.beginPath();
      ctx.moveTo(game.baseWidth + scaledBorderPadding - scaledCornerSize, -scaledBorderPadding);
      ctx.lineTo(game.baseWidth + scaledBorderPadding, -scaledBorderPadding);
      ctx.lineTo(game.baseWidth + scaledBorderPadding, -scaledBorderPadding + scaledCornerSize);
      ctx.stroke();
      
      // Esquina inferior izquierda
      ctx.beginPath();
      ctx.moveTo(-scaledBorderPadding, game.baseHeight + scaledBorderPadding - scaledCornerSize);
      ctx.lineTo(-scaledBorderPadding, game.baseHeight + scaledBorderPadding);
      ctx.lineTo(-scaledBorderPadding + scaledCornerSize, game.baseHeight + scaledBorderPadding);
      ctx.stroke();
      
      // Esquina inferior derecha
      ctx.beginPath();
      ctx.moveTo(game.baseWidth + scaledBorderPadding - scaledCornerSize, game.baseHeight + scaledBorderPadding);
      ctx.lineTo(game.baseWidth + scaledBorderPadding, game.baseHeight + scaledBorderPadding);
      ctx.lineTo(game.baseWidth + scaledBorderPadding, game.baseHeight + scaledBorderPadding - scaledCornerSize);
      ctx.stroke();
      
      // Dibujar jefe (demonio)
      if (imageLoaded) {
        // Dibujar imagen del demonio si está cargada (más pequeño)
        ctx.drawImage(demonImage, game.boss.x - game.boss.width/2, game.boss.y - game.boss.height/2, game.boss.width, game.boss.height);
      } else {
        // Dibujar demonio mejorado con formas si no hay imagen
        ctx.save();
        ctx.translate(game.boss.x, game.boss.y);
        
        // Escalar el demonio según el tamaño del boss
        const scaleX = game.boss.width / 80;
        const scaleY = game.boss.height / 120;
        
        // Cuerpo del demonio
        ctx.fillStyle = '#8b0000';
        ctx.fillRect(-40 * scaleX, -60 * scaleY, 80 * scaleX, 120 * scaleY);
        
        // Cabeza
        ctx.fillStyle = '#a00000';
        ctx.beginPath();
        ctx.arc(0, -40 * scaleY, 35 * Math.min(scaleX, scaleY), 0, Math.PI * 2);
        ctx.fill();
        
        // Cuernos
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.moveTo(-25 * scaleX, -60 * scaleY);
        ctx.lineTo(-30 * scaleX, -80 * scaleY);
        ctx.lineTo(-20 * scaleX, -65 * scaleY);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(25 * scaleX, -60 * scaleY);
        ctx.lineTo(30 * scaleX, -80 * scaleY);
        ctx.lineTo(20 * scaleX, -65 * scaleY);
        ctx.fill();
        
        // Ojos brillantes
        ctx.fillStyle = '#ff0000';
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(-12 * scaleX, -40 * scaleY, 5 * Math.min(scaleX, scaleY), 0, Math.PI * 2);
        ctx.arc(12 * scaleX, -40 * scaleY, 5 * Math.min(scaleX, scaleY), 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // Boca malvada
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, -30 * scaleY, 15 * Math.min(scaleX, scaleY), 0, Math.PI);
        ctx.stroke();
        
        // Alas
        ctx.fillStyle = 'rgba(50, 0, 0, 0.7)';
        ctx.beginPath();
        ctx.moveTo(-40 * scaleX, -30 * scaleY);
        ctx.quadraticCurveTo(-70 * scaleX, -40 * scaleY, -60 * scaleX, 10 * scaleY);
        ctx.lineTo(-40 * scaleX, 0);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(40 * scaleX, -30 * scaleY);
        ctx.quadraticCurveTo(70 * scaleX, -40 * scaleY, 60 * scaleX, 10 * scaleY);
        ctx.lineTo(40 * scaleX, 0);
        ctx.fill();
        
        ctx.restore();
      }
      
      // Barra de vida del jefe
      const barWidth = game.boss.width;
      const barHeight = 12;
      ctx.fillStyle = '#333';
      ctx.fillRect(game.boss.x - barWidth/2, game.boss.y - game.boss.height/2 - 25, barWidth, barHeight);
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(game.boss.x - barWidth/2, game.boss.y - game.boss.height/2 - 25, barWidth * (game.boss.health / game.boss.maxHealth), barHeight);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.strokeRect(game.boss.x - barWidth/2, game.boss.y - game.boss.height/2 - 25, barWidth, barHeight);
      
      
      // Dibujar bloques con efecto bevel (3D)
      game.blocks.forEach(block => {
        if (!block.destroyed) {
          const bevelSize = 3; // Tamaño del bevel
          
          // Cuerpo principal del bloque
          ctx.fillStyle = block.color;
          ctx.fillRect(block.x, block.y, block.width, block.height);
          
          // Bevel superior (luz)
          const lightGradient = ctx.createLinearGradient(
            block.x, block.y, 
            block.x, block.y + bevelSize
          );
          lightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
          lightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
          ctx.fillStyle = lightGradient;
          ctx.fillRect(block.x, block.y, block.width, bevelSize);
          
          // Bevel izquierdo (luz)
          const leftGradient = ctx.createLinearGradient(
            block.x, block.y,
            block.x + bevelSize, block.y
          );
          leftGradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
          leftGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
          ctx.fillStyle = leftGradient;
          ctx.fillRect(block.x, block.y, bevelSize, block.height);
          
          // Bevel inferior (sombra)
          const shadowGradient = ctx.createLinearGradient(
            block.x, block.y + block.height - bevelSize,
            block.x, block.y + block.height
          );
          shadowGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
          shadowGradient.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
          ctx.fillStyle = shadowGradient;
          ctx.fillRect(block.x, block.y + block.height - bevelSize, block.width, bevelSize);
          
          // Bevel derecho (sombra)
          const rightGradient = ctx.createLinearGradient(
            block.x + block.width - bevelSize, block.y,
            block.x + block.width, block.y
          );
          rightGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
          rightGradient.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
          ctx.fillStyle = rightGradient;
          ctx.fillRect(block.x + block.width - bevelSize, block.y, bevelSize, block.height);
          
          // Borde externo sutil
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
          ctx.lineWidth = 1;
          ctx.strokeRect(block.x + 0.5, block.y + 0.5, block.width - 1, block.height - 1);
        }
      });
      
      // Dibujar paddle mejorado
      const paddleGradient = ctx.createLinearGradient(game.paddle.x, game.paddle.y, game.paddle.x, game.paddle.y + game.paddle.height);
      paddleGradient.addColorStop(0, '#5dade2');
      paddleGradient.addColorStop(1, '#2980b9');
      ctx.fillStyle = paddleGradient;
      ctx.fillRect(game.paddle.x, game.paddle.y, game.paddle.width, game.paddle.height);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.strokeRect(game.paddle.x, game.paddle.y, game.paddle.width, game.paddle.height);
      
      // Dibujar pelota como rollo de cine
      ctx.save();
      ctx.translate(game.ball.x, game.ball.y);
      
      // Sombra de la pelota
      ctx.shadowColor = '#fff';
      ctx.shadowBlur = 10;
      
      // Rollo de cine exterior
      ctx.fillStyle = '#2c3e50';
      ctx.beginPath();
      ctx.arc(0, 0, game.ball.radius + 2, 0, Math.PI * 2);
      ctx.fill();
      
      // Cinta de película
      ctx.fillStyle = '#34495e';
      ctx.beginPath();
      ctx.arc(0, 0, game.ball.radius, 0, Math.PI * 2);
      ctx.fill();
      
      // Perforaciones de la película (animadas)
      ctx.fillStyle = '#ecf0f1';
      for (let i = 0; i < 4; i++) {
        const angle = (Math.PI * 2 / 4) * i + (Date.now() / 100);
        const x = Math.cos(angle) * (game.ball.radius - 3);
        const y = Math.sin(angle) * (game.ball.radius - 3);
        ctx.fillRect(x - 1, y - 2, 2, 4);
      }
      
      ctx.restore();
      
      // Restaurar transformaciones
      ctx.restore();
      
      // Instrucciones (fuera del área escalada)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Usa las flechas ← → o mueve el mouse/toca la pantalla', canvas.width / 2, canvas.height - 10);
    }
    
    function gameLoop() {
      update();
      draw();
      if (!game.gameOver) {
        window.bossGameState.animationId = requestAnimationFrame(gameLoop);
      }
    }
    
    // Mostrar HUD inicial
    const playerName = window.BossCore.getPlayerNameForBoss();
    window.BossCore.updateBossHUD(`${playerName}: ${'❤️'.repeat(game.player.lives)} | Demonio del Cine: ${'💀'.repeat(game.boss.health)}`);
    
    // Iniciar el juego
    gameLoop();
  }

  // Exponer función
  window.BossGames = window.BossGames || {};
  window.BossGames.initMovieArkanoid = initMovieArkanoid;

})(window);
