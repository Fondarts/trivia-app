// bosses/arkanoid.js - Boss del Reino del Cine (Arkanoid)
(function(window) {
  'use strict';

  function initMovieArkanoid(handicap) {
    const canvas = window.bossGameState.canvas;
    const ctx = window.bossGameState.ctx;
    
    // Cargar imagen del demonio usando BossCore helper
    let demonImage = null;
    let imageLoaded = false;
    window.BossCore.loadBossImage('assets/bosses/demon_boss.webp')
      .then(img => {
        demonImage = img;
        imageLoaded = true;
      })
      .catch(() => {
        imageLoaded = false;
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
        dx: 4,
        dy: -4,
        radius: 8
      },
      boss: {
        x: baseWidth / 2,
        y: Math.min(140, baseHeight * 0.18),
        width: Math.max(140, baseWidth * 0.12),
        height: Math.max(170, baseHeight * 0.22),
        speed: 3 * (handicap.bossSpeed || 1),
        health: handicap.bossLives || 3,
        maxHealth: handicap.bossLives || 3,
        direction: 1
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
    
    // Bloques responsivos al ancho base del juego
    const cols = Math.max(8, Math.floor(baseWidth / 100));
    const gutter = Math.max(4, Math.floor(baseWidth * 0.01));
    const totalGutters = gutter * (cols + 1);
    const blockWidth = Math.max(50, Math.floor((baseWidth - totalGutters) / cols));
    const blockHeight = Math.max(16, Math.floor(blockWidth * 0.25));
    const startY = Math.min(baseHeight * 0.35, 250);
    
    for (let row = 0; row < totalRows; row++) {
      for (let col = 0; col < cols; col++) {
        const colors = ['#e74c3c', '#f39c12', '#3498db', '#9b59b6', '#2ecc71'];
        game.blocks.push({
          x: gutter + col * (blockWidth + gutter),
          y: startY + row * (blockHeight + 6),
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
        touchX = currentX;
      }
    });
    
    canvas.addEventListener('touchend', () => {
      touchX = null;
    });
    
    // Control con mouse con escala
    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const mouseX = (e.clientX - rect.left) * scaleX;
      // Convertir coordenadas del canvas a coordenadas del juego
      const gameX = (mouseX - game.offsetX) / game.scale;
      game.paddle.x = gameX - game.paddle.width / 2;
      game.paddle.x = Math.max(0, Math.min(game.baseWidth - game.paddle.width, game.paddle.x));
    });
    
    function update() {
      if (game.gameOver) return;
      
      // Mover paddle con teclado
      if (game.keys['ArrowLeft'] || game.keys['a'] || game.keys['A']) {
        game.paddle.x -= game.paddle.speed;
      }
      if (game.keys['ArrowRight'] || game.keys['d'] || game.keys['D']) {
        game.paddle.x += game.paddle.speed;
      }
      game.paddle.x = Math.max(0, Math.min(game.baseWidth - game.paddle.width, game.paddle.x));
      
      // Mover jefe
      game.boss.x += game.boss.speed * game.boss.direction;
      if (game.boss.x <= 80 || game.boss.x >= game.baseWidth - 80) {
        game.boss.direction *= -1;
      }
      
      // Mover pelota
      game.ball.x += game.ball.dx;
      game.ball.y += game.ball.dy;
      
      // Rebote en paredes
      if (game.ball.x + game.ball.radius > game.baseWidth || game.ball.x - game.ball.radius < 0) {
        game.ball.dx = -game.ball.dx;
      }
      if (game.ball.y - game.ball.radius < 0) {
        game.ball.dy = -game.ball.dy;
      }
      
      // Colisión con el jefe
      if (game.ball.x > game.boss.x - game.boss.width/2 &&
          game.ball.x < game.boss.x + game.boss.width/2 &&
          game.ball.y > game.boss.y - game.boss.height/2 &&
          game.ball.y < game.boss.y + game.boss.height/2) {
        game.ball.dy = -game.ball.dy;
        game.boss.health--;
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
      
      // Colisión con paddle
      if (game.ball.y + game.ball.radius > game.paddle.y &&
          game.ball.x > game.paddle.x &&
          game.ball.x < game.paddle.x + game.paddle.width) {
        game.ball.dy = -game.ball.dy;
        // Ajustar ángulo según dónde golpea el paddle
        const hitPos = (game.ball.x - game.paddle.x) / game.paddle.width;
        game.ball.dx = 8 * (hitPos - 0.5);
      }
      
      // Colisión con bloques
      game.blocks.forEach(block => {
        if (!block.destroyed &&
            game.ball.x > block.x &&
            game.ball.x < block.x + block.width &&
            game.ball.y > block.y &&
            game.ball.y < block.y + block.height) {
          block.destroyed = true;
          game.ball.dy = -game.ball.dy;
        }
      });
      
      // Pelota fuera
      if (game.ball.y > game.baseHeight) {
        // Perder una vida
        game.player.lives--;
        const playerName = window.BossCore.getPlayerNameForBoss();
        window.BossCore.updateBossHUD(`${playerName}: ${'❤️'.repeat(game.player.lives)} | Demonio del Cine: ${'💀'.repeat(game.boss.health)}`);
        
        if (game.player.lives <= 0) {
          // Game Over - Perdiste
          game.gameOver = true;
          window.BossCore.endBossGame(false);
        } else {
          // Reset pelota
          game.ball.x = game.baseWidth / 2;
          game.ball.y = game.baseHeight - 50;
          game.ball.dx = 4;
          game.ball.dy = -4;
        }
      }
    }
    
    function draw() {
      // Fondo degradado oscuro
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#0a0a0a');
      gradient.addColorStop(1, '#1a1a2e');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Aplicar transformaciones de escala y posición
      ctx.save();
      ctx.translate(game.offsetX, game.offsetY);
      ctx.scale(game.scale, game.scale);
      
      // === MARCO DECORATIVO ALREDEDOR DEL CAMPO DE JUEGO ===
      const borderWidth = 8; // Grosor del marco
      const borderPadding = 10; // Separación entre el juego y el marco
      
      // Marco exterior (borde oscuro con brillo)
      ctx.strokeStyle = '#2c3e50';
      ctx.lineWidth = borderWidth + 2;
      ctx.strokeRect(
        -borderPadding, 
        -borderPadding, 
        game.baseWidth + (borderPadding * 2), 
        game.baseHeight + (borderPadding * 2)
      );
      
      // Marco interior (borde brillante)
      ctx.strokeStyle = '#ecf0f1';
      ctx.lineWidth = borderWidth;
      ctx.strokeRect(
        -borderPadding, 
        -borderPadding, 
        game.baseWidth + (borderPadding * 2), 
        game.baseHeight + (borderPadding * 2)
      );
      
      // Línea de neón interna (efecto cinematográfico)
      ctx.strokeStyle = '#e74c3c';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#e74c3c';
      ctx.shadowBlur = 15;
      ctx.strokeRect(
        -borderPadding + (borderWidth / 2), 
        -borderPadding + (borderWidth / 2), 
        game.baseWidth + (borderPadding * 2) - borderWidth, 
        game.baseHeight + (borderPadding * 2) - borderWidth
      );
      ctx.shadowBlur = 0;
      
      // Esquinas decorativas (estilo cine vintage)
      const cornerSize = 25;
      const cornerThickness = 4;
      ctx.strokeStyle = '#f39c12';
      ctx.lineWidth = cornerThickness;
      ctx.lineCap = 'round';
      
      // Esquina superior izquierda
      ctx.beginPath();
      ctx.moveTo(-borderPadding, -borderPadding + cornerSize);
      ctx.lineTo(-borderPadding, -borderPadding);
      ctx.lineTo(-borderPadding + cornerSize, -borderPadding);
      ctx.stroke();
      
      // Esquina superior derecha
      ctx.beginPath();
      ctx.moveTo(game.baseWidth + borderPadding - cornerSize, -borderPadding);
      ctx.lineTo(game.baseWidth + borderPadding, -borderPadding);
      ctx.lineTo(game.baseWidth + borderPadding, -borderPadding + cornerSize);
      ctx.stroke();
      
      // Esquina inferior izquierda
      ctx.beginPath();
      ctx.moveTo(-borderPadding, game.baseHeight + borderPadding - cornerSize);
      ctx.lineTo(-borderPadding, game.baseHeight + borderPadding);
      ctx.lineTo(-borderPadding + cornerSize, game.baseHeight + borderPadding);
      ctx.stroke();
      
      // Esquina inferior derecha
      ctx.beginPath();
      ctx.moveTo(game.baseWidth + borderPadding - cornerSize, game.baseHeight + borderPadding);
      ctx.lineTo(game.baseWidth + borderPadding, game.baseHeight + borderPadding);
      ctx.lineTo(game.baseWidth + borderPadding, game.baseHeight + borderPadding - cornerSize);
      ctx.stroke();
      
      // Dibujar jefe (demonio)
      if (imageLoaded) {
        // Dibujar imagen del demonio si está cargada
        ctx.drawImage(demonImage, game.boss.x - 60, game.boss.y - 75, 120, 150);
      } else {
        // Dibujar demonio mejorado con formas si no hay imagen
        ctx.save();
        ctx.translate(game.boss.x, game.boss.y);
        
        // Cuerpo del demonio
        ctx.fillStyle = '#8b0000';
        ctx.fillRect(-40, -60, 80, 120);
        
        // Cabeza
        ctx.fillStyle = '#a00000';
        ctx.beginPath();
        ctx.arc(0, -40, 35, 0, Math.PI * 2);
        ctx.fill();
        
        // Cuernos
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.moveTo(-25, -60);
        ctx.lineTo(-30, -80);
        ctx.lineTo(-20, -65);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(25, -60);
        ctx.lineTo(30, -80);
        ctx.lineTo(20, -65);
        ctx.fill();
        
        // Ojos brillantes
        ctx.fillStyle = '#ff0000';
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(-12, -40, 5, 0, Math.PI * 2);
        ctx.arc(12, -40, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // Boca malvada
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, -30, 15, 0, Math.PI);
        ctx.stroke();
        
        // Alas
        ctx.fillStyle = 'rgba(50, 0, 0, 0.7)';
        ctx.beginPath();
        ctx.moveTo(-40, -30);
        ctx.quadraticCurveTo(-70, -40, -60, 10);
        ctx.lineTo(-40, 0);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(40, -30);
        ctx.quadraticCurveTo(70, -40, 60, 10);
        ctx.lineTo(40, 0);
        ctx.fill();
        
        ctx.restore();
      }
      
      // Barra de vida del jefe
      ctx.fillStyle = '#333';
      ctx.fillRect(game.boss.x - 60, game.boss.y - 100, 120, 12);
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(game.boss.x - 60, game.boss.y - 100, 120 * (game.boss.health / game.boss.maxHealth), 12);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.strokeRect(game.boss.x - 60, game.boss.y - 100, 120, 12);
      
      // Nombre del jefe
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('DEMONIO DEL CINE', game.boss.x, game.boss.y - 105);
      
      // Dibujar bloques
      game.blocks.forEach(block => {
        if (!block.destroyed) {
          ctx.fillStyle = block.color;
          ctx.fillRect(block.x, block.y, block.width, block.height);
          // Borde de los bloques
          ctx.strokeStyle = 'rgba(255,255,255,0.3)';
          ctx.strokeRect(block.x, block.y, block.width, block.height);
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
