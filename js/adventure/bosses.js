// js/adventure_bosses.js - Mini-juegos de jefes mejorado
(function(window) {
  'use strict';

  const BOSS_GAMES = {
    science: 'tetris',
    history: 'rpg',
    geography: 'pacman',
    sports: 'arkanoid',
    movies: 'arkanoid',
    anime: 'pokemon'  // Batalla estilo Pokemon GBA
  };

  let bossGameState = {
    type: null,
    handicap: null,
    callback: null,
    canvas: null,
    ctx: null,
    animationId: null
  };
  
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

  function startBossGame(regionKey, handicap, callback) {
    const gameType = BOSS_GAMES[regionKey];
    
    bossGameState = {
      type: gameType,
      handicap: handicap,
      callback: callback,
      canvas: null,
      ctx: null,
      animationId: null
    };
    
    showBossGameUI(gameType);
    
    // Seleccionar el juego según la región
    if (regionKey === 'movies') {
      initMovieArkanoid(handicap);
    } else if (regionKey === 'anime') {
      initAnimePokemon(handicap);
    } else {
      // Para otras regiones, usar Arkanoid simplificado
      initMovieArkanoid(handicap);
    }
  }

  function showBossGameUI(gameType) {
    const container = document.getElementById('adventureGameArea');
    if (!container) return;
    
    container.innerHTML = `
      <div class="boss-game-container" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 10000; background: #000;">
        <canvas id="bossGameCanvas" style="width: 100%; height: 100%; display: block;"></canvas>
        
        <div style="position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); z-index: 10001;">
          <button class="btn secondary danger" onclick="window.forfeitBossGame()" style="background: rgba(255,0,0,0.8); color: white; padding: 10px 20px; border-radius: 20px; border: 2px solid #fff;">
            Rendirse
          </button>
        </div>
      </div>
    `;
    
    bossGameState.canvas = document.getElementById('bossGameCanvas');
    // Configurar tamaño real del canvas basado en la pantalla
    bossGameState.canvas.width = window.innerWidth;
    bossGameState.canvas.height = window.innerHeight;
    bossGameState.ctx = bossGameState.canvas.getContext('2d');
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
  }

  function resizeCanvas() {
    if (!bossGameState.canvas) return;
    
    bossGameState.canvas.width = window.innerWidth;
    bossGameState.canvas.height = window.innerHeight;
  }

  // Arkanoid mejorado para el jefe del cine
  function initMovieArkanoid(handicap) {
    const canvas = bossGameState.canvas;
    const ctx = bossGameState.ctx;
    
    // Intentar cargar imagen del demonio
    const demonImage = new Image();
    demonImage.src = 'assets/bosses/demon_boss.webp';
    let imageLoaded = false;
    demonImage.onload = () => { imageLoaded = true; };
    
    const game = {
      paddle: {
        x: canvas.width / 2 - 50,
        y: canvas.height - 30,
        width: 100,
        height: 10,
        speed: 8 * (handicap.playerSpeed || 1)
      },
      ball: {
        x: canvas.width / 2,
        y: canvas.height - 50,
        dx: 4,
        dy: -4,
        radius: 8
      },
      boss: {
        x: canvas.width / 2,
        y: 120,  // Más abajo para que se vea completo
        width: 120,  // Más grande
        height: 150,  // Más alto
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
    
    // Crear barrera de bloques protectores
    const baseRows = 3;
    const totalRows = baseRows + (handicap.extraRows || 0);
    
    for (let row = 0; row < totalRows; row++) {
      for (let col = 0; col < 8; col++) {
        const colors = ['#e74c3c', '#f39c12', '#3498db', '#9b59b6', '#2ecc71'];
        game.blocks.push({
          x: col * 95 + 35,
          y: row * 25 + 250,  // Más abajo para dar espacio al demonio
          width: 85,
          height: 20,
          destroyed: false,
          color: colors[row % colors.length]
        });
      }
    }
    
    // Controles
    document.addEventListener('keydown', (e) => game.keys[e.key] = true);
    document.addEventListener('keyup', (e) => game.keys[e.key] = false);
    
    // Controles táctiles mejorados
    let touchX = null;
    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      touchX = e.touches[0].clientX;
    });
    
    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (touchX !== null) {
        const currentX = e.touches[0].clientX;
        const diff = currentX - touchX;
        game.paddle.x += diff * 2;
        game.paddle.x = Math.max(0, Math.min(canvas.width - game.paddle.width, game.paddle.x));
        touchX = currentX;
      }
    });
    
    canvas.addEventListener('touchend', () => {
      touchX = null;
    });
    
    // Control con mouse
    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const mouseX = (e.clientX - rect.left) * scaleX;
      game.paddle.x = mouseX - game.paddle.width / 2;
      game.paddle.x = Math.max(0, Math.min(canvas.width - game.paddle.width, game.paddle.x));
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
      game.paddle.x = Math.max(0, Math.min(canvas.width - game.paddle.width, game.paddle.x));
      
      // Mover jefe
      game.boss.x += game.boss.speed * game.boss.direction;
      if (game.boss.x <= 80 || game.boss.x >= canvas.width - 80) {
        game.boss.direction *= -1;
      }
      
      // Mover pelota
      game.ball.x += game.ball.dx;
      game.ball.y += game.ball.dy;
      
      // Rebote en paredes
      if (game.ball.x + game.ball.radius > canvas.width || game.ball.x - game.ball.radius < 0) {
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
        const playerName = getPlayerNameForBoss();
        updateBossHUD(`${playerName}: ${'❤️'.repeat(game.player.lives)} | Demonio del Cine: ${'💀'.repeat(game.boss.health)}`);
        
        // Efecto de daño al jefe
        ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        if (game.boss.health <= 0) {
          game.gameOver = true;
          endBossGame(true);
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
      if (game.ball.y > canvas.height) {
        // Perder una vida
        game.player.lives--;
        const playerName = getPlayerNameForBoss();
        updateBossHUD(`${playerName}: ${'❤️'.repeat(game.player.lives)} | Demonio del Cine: ${'💀'.repeat(game.boss.health)}`);
        
        if (game.player.lives <= 0) {
          // Game Over - Perdiste
          game.gameOver = true;
          endBossGame(false);
        } else {
          // Reset pelota
          game.ball.x = canvas.width / 2;
          game.ball.y = canvas.height - 50;
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
      
      // Instrucciones
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Usa las flechas ← → o mueve el mouse/toca la pantalla', canvas.width / 2, canvas.height - 10);
    }
    
    function gameLoop() {
      update();
      draw();
      if (!game.gameOver) {
        bossGameState.animationId = requestAnimationFrame(gameLoop);
      }
    }
    
    // Mostrar HUD inicial
    const playerName = getPlayerNameForBoss();
    updateBossHUD(`${playerName}: ${'❤️'.repeat(game.player.lives)} | Demonio del Cine: ${'💀'.repeat(game.boss.health)}`);
    
    // Iniciar el juego
    gameLoop();
  }

  function updateBossHUD(text) {
    const hud = document.getElementById('bossGameHUD');
    if (hud) hud.innerHTML = text;
  }

  function endBossGame(won) {
    if (bossGameState.animationId) {
      cancelAnimationFrame(bossGameState.animationId);
    }
    
    window.removeEventListener('resize', resizeCanvas);
    
    // Mostrar mensaje de resultado
    const container = document.getElementById('adventureGameArea');
    if (container) {
      const message = won ? '🎉 ¡VICTORIA! 🎉' : '💀 DERROTA 💀';
      const color = won ? '#2ecc71' : '#e74c3c';
      
      container.innerHTML += `
        <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                    background: ${color}; color: white; padding: 30px 50px; 
                    border-radius: 20px; font-size: 32px; font-weight: bold; 
                    z-index: 20000; animation: fadeInScale 0.5s ease;">
          ${message}
        </div>
      `;
    }
    
    // Llamar al callback después de un delay
    setTimeout(() => {
      if (bossGameState.callback) {
        bossGameState.callback(won);
      }
    }, 2000);
  }

  window.forfeitBossGame = function() {
    if (confirm('¿Seguro que quieres rendirte? Perderás el combate contra el jefe.')) {
      endBossGame(false);
    }
  };

  // Batalla estilo Pokemon GBA para anime mejorada
  function initAnimePokemon(handicap) {
    // Verificar que tenemos canvas y contexto
    if (!bossGameState.canvas || !bossGameState.ctx) {
      console.error('Canvas o contexto no disponible en bossGameState');
      return;
    }
    
    const canvas = bossGameState.canvas;
    const ctx = bossGameState.ctx;
    
    // Habilitar imagen suavizada desactivada para pixel art
    ctx.imageSmoothingEnabled = false;
    ctx.mozImageSmoothingEnabled = false;
    ctx.webkitImageSmoothingEnabled = false;
    ctx.msImageSmoothingEnabled = false;
    
    // Cargar imágenes
    const bossImage = new Image();
    bossImage.src = 'assets/bosses/demon_anime.webp';
    let bossImageLoaded = false;
    bossImage.onload = () => { bossImageLoaded = true; };
    
    // Obtener avatar del usuario
    function getUserAvatar() {
      // Intentar obtener avatar del usuario logueado
      if (window.getCurrentUser) {
        const user = window.getCurrentUser();
        if (user && user.avatar) {
          return { type: 'image', src: user.avatar };
        }
      }
      // Si no hay avatar, usar emoji predeterminado
      return { type: 'emoji', value: '🎮' };
    }
    
    const userAvatar = getUserAvatar();
    let avatarImage = null;
    if (userAvatar.type === 'image') {
      avatarImage = new Image();
      avatarImage.src = userAvatar.src;
      avatarImage.onerror = () => {
        userAvatar.type = 'emoji';
        userAvatar.value = '🎮';
      };
    }
    
    // Cargar avatar de batalla
    const battleAvatar = new Image();
    battleAvatar.src = 'img/avatarman.webp';
    let battleAvatarLoaded = false;
    battleAvatar.onload = () => { battleAvatarLoaded = true; };
    
    // Calcular estadísticas basadas en el desempeño en las preguntas
    const questionsScore = handicap.questionsScore || 0;
    const expPoints = questionsScore * 10; // 10 puntos de experiencia por respuesta correcta
    
    const game = {
      player: {
        name: getPlayerNameForBoss(),
        baseHp: 100,
        hp: 100,
        maxHp: 100,
        baseAttack: 35,
        attack: 35,
        level: 50,
        exp: 0,
        expPoints: expPoints, // Puntos disponibles para distribuir
        moves: [
          { name: 'Kame Hame Ha', power: 40, type: 'attack', pp: 10, maxPp: 10, animation: 'beam' },
          { name: 'Gomu Gomu Pistol', power: 35, type: 'attack', pp: 15, maxPp: 15, animation: 'punch' },
          { name: 'Rasengan', power: 50, type: 'attack', pp: 5, maxPp: 5, animation: 'spiral' },
          { name: 'Barrera de Energía', power: 0, type: 'defense', pp: 10, maxPp: 10, animation: 'shield' }
        ],
        defending: false,
        avatar: userAvatar,
        items: [
          { name: 'Senzu Bean', description: 'Una judía mágica... pero está caducada', useless: true },
          { name: 'Pokeball', description: 'No puedes capturar jefes', useless: true },
          { name: 'Pergamino Ninja', description: 'Está en japonés, no entiendes nada', useless: true },
          { name: 'Ramen Instantáneo', description: 'No es momento de comer', useless: true }
        ]
      },
      boss: {
        name: 'Otakuma',
        hp: handicap.bossLives * 60,
        maxHp: handicap.bossLives * 60,
        level: Math.floor(30 * handicap.bossSpeed),
        species: 'OTAKUMA',
        baseDamage: 5 // Reducido aún más de 10 a 5
      },
      state: 'statUpgrade', // Empezar con mejora de stats
      selectedMove: 0,
      menuOption: 0,
      selectedItem: 0,
      selectedStat: 0, // Para el menú de mejora
      message: '',
      animationFrame: 0,
      gameOver: false,
      animation: null,
      animationTimer: null,
      showingItems: false
    };
    
    // Mostrar menú de mejora de stats al inicio si hay puntos
    if (game.expPoints > 0) {
      game.message = `Tienes ${game.expPoints} puntos de experiencia para distribuir`;
      game.state = 'statUpgrade';
    } else {
      game.state = 'menu';
      game.message = `¿Qué debería hacer ${game.player.name}?`;
    }
    
    // Controles
    document.addEventListener('keydown', handleKeyPress);
    
    // Asegurarnos de que el canvas existe antes de agregar listeners
    if (canvas) {
      canvas.addEventListener('click', handleClick);
      canvas.addEventListener('touchstart', handleTouch);
    } else {
      console.error('No se pudieron agregar event listeners - canvas no disponible');
    }
    
    function handleKeyPress(e) {
      if (game.gameOver) return;
      
      if (game.state === 'statUpgrade') {
        if (e.key === 'ArrowUp' || e.key === 'w') {
          game.selectedStat = Math.max(0, game.selectedStat - 1);
        } else if (e.key === 'ArrowDown' || e.key === 's') {
          game.selectedStat = Math.min(2, game.selectedStat + 1); // 2 para incluir Continuar
        } else if (e.key === 'Enter' || e.key === ' ') {
          if (game.selectedStat === 2) {
            // Continuar sin gastar puntos
            game.state = 'menu';
            game.message = `¿Qué debería hacer ${game.player.name}?`;
          } else if (game.expPoints >= 10) {
            applyStatUpgrade();
          }
        } else if (e.key === 'Escape') {
          // También permitir ESC para continuar
          game.state = 'menu';
          game.message = `¿Qué debería hacer ${game.player.name}?`;
        }
      } else if (game.state === 'menu') {
        if (e.key === 'ArrowUp' || e.key === 'w') {
          game.menuOption = (game.menuOption - 2 + 4) % 4;
        } else if (e.key === 'ArrowDown' || e.key === 's') {
          game.menuOption = (game.menuOption + 2) % 4;
        } else if (e.key === 'ArrowLeft' || e.key === 'a') {
          game.menuOption = game.menuOption % 2 === 0 ? game.menuOption + 1 : game.menuOption - 1;
        } else if (e.key === 'ArrowRight' || e.key === 'd') {
          game.menuOption = game.menuOption % 2 === 1 ? game.menuOption - 1 : game.menuOption + 1;
        } else if (e.key === 'Enter' || e.key === ' ') {
          selectMenuOption();
        }
      } else if (game.state === 'showingItems') {
        if (e.key === 'ArrowUp' || e.key === 'w') {
          if (game.selectedItem === game.player.items.length) {
            game.selectedItem = game.player.items.length - 1;
          } else {
            game.selectedItem = Math.max(0, game.selectedItem - 1);
          }
        } else if (e.key === 'ArrowDown' || e.key === 's') {
          if (game.selectedItem < game.player.items.length) {
            game.selectedItem = Math.min(game.player.items.length, game.selectedItem + 1);
          }
        } else if (e.key === 'Enter' || e.key === ' ') {
          if (game.selectedItem === game.player.items.length) {
            // Volver atrás
            game.state = 'menu';
            game.showingItems = false;
          } else {
            useItem(game.selectedItem);
          }
        } else if (e.key === 'Escape') {
          game.state = 'menu';
          game.showingItems = false;
        }
      } else if (game.state === 'selectMove') {
        if (e.key === 'ArrowUp' || e.key === 'w') {
          game.selectedMove = (game.selectedMove - 2 + 4) % 4;
        } else if (e.key === 'ArrowDown' || e.key === 's') {
          game.selectedMove = (game.selectedMove + 2) % 4;
        } else if (e.key === 'ArrowLeft' || e.key === 'a') {
          game.selectedMove = game.selectedMove % 2 === 0 ? game.selectedMove + 1 : game.selectedMove - 1;
        } else if (e.key === 'ArrowRight' || e.key === 'd') {
          game.selectedMove = game.selectedMove % 2 === 1 ? game.selectedMove - 1 : game.selectedMove + 1;
        } else if (e.key === 'Enter' || e.key === ' ') {
          useMove(game.selectedMove);
        } else if (e.key === 'Escape') {
          game.state = 'menu';
        }
      }
    }
    
    function applyStatUpgrade() {
      if (game.expPoints >= 10) {
        if (game.selectedStat === 0) {
          // Mejorar HP
          game.player.maxHp += 20;
          game.player.hp = game.player.maxHp;
          game.expPoints -= 10;
          game.message = `¡HP aumentado! Te quedan ${game.expPoints} puntos`;
        } else {
          // Mejorar Ataque
          game.player.attack += 10;
          game.expPoints -= 10;
          game.message = `¡Ataque aumentado! Te quedan ${game.expPoints} puntos`;
        }
        
        if (game.expPoints === 0) {
          setTimeout(() => {
            game.state = 'menu';
            game.message = `¿Qué debería hacer ${game.player.name}?`;
          }, 2000);
        }
      }
    }
    
    function handleClick(e) {
      const canvas = bossGameState.canvas;
      if (!canvas) return;
      
      const rect = canvas.getBoundingClientRect();
      
      // Convertir coordenadas del click a coordenadas del canvas
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      
      // Convertir a coordenadas del juego usando la escala guardada
      const x = (clickX - game.canvasOffsetX) / game.canvasScale;
      const y = (clickY - game.canvasOffsetY) / game.canvasScale;
      
      // Ajustar coordenadas según si es móvil o no
      const isMobile = game.baseHeight > game.baseWidth;
      const baseWidth = game.baseWidth || 800;
      const baseHeight = game.baseHeight || 700;
      
      if (game.state === 'statUpgrade') {
        // Click en opciones de mejora
        if (y > 400 && y < 500 && game.expPoints >= 10) {
          game.selectedStat = 0;
          applyStatUpgrade();
        } else if (y > 500 && y < 600 && game.expPoints >= 10) {
          game.selectedStat = 1;
          applyStatUpgrade();
        } else if (x > 550 && x < 750 && y > 620 && y < 660) {
          // Click en botón Continuar
          game.state = 'menu';
          game.message = `¿Qué debería hacer ${game.player.name}?`;
        }
      } else if (game.state === 'menu') {
        // Detectar click en opciones del menu
        if (y > 500 && y < 680) {
          if (x > 420 && x < 580 && y < 590) {
            game.menuOption = 0;
            selectMenuOption();
          } else if (x > 590 && x < 750 && y < 590) {
            game.menuOption = 1;
            selectMenuOption();
          } else if (x > 420 && x < 580 && y > 590) {
            game.menuOption = 2;
            selectMenuOption();
          } else if (x > 590 && x < 750 && y > 590) {
            game.menuOption = 3;
            selectMenuOption();
          }
        }
      } else if (game.state === 'selectMove') {
        // Detectar click en movimientos
        if (y > 500 && y < 680) {
          if (x < 400) {
            if (y < 590) game.selectedMove = 0;
            else game.selectedMove = 2;
          } else {
            if (y < 590) game.selectedMove = 1;
            else game.selectedMove = 3;
          }
          useMove(game.selectedMove);
        }
      }
    }
    
    function handleTouch(e) {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches[0];
      const evt = new MouseEvent('click', {
        clientX: touch.clientX,
        clientY: touch.clientY
      });
      handleClick(evt);
    }
    
    function selectMenuOption() {
      if (game.menuOption === 0) {
        // FIGHT - Luchar
        game.state = 'selectMove';
      } else if (game.menuOption === 1) {
        // CHIPOKOMON - Mostrar mensaje personalizado
        game.message = '¡Están todos dormidos! ¡Estás por tu cuenta en esta!';
        setTimeout(() => {
          game.message = `¿Qué debería hacer ${game.player.name}?`;
        }, 3000);
      } else if (game.menuOption === 2) {
        // BAG - Mostrar items inútiles
        game.state = 'showingItems';
        game.showingItems = true;
        game.selectedItem = 0;
        game.message = '';
      } else if (game.menuOption === 3) {
        // RUN - Mensaje personalizado
        game.message = 'No vas a llegar muy lejos. ¡Mejor enfréntate a tus problemas!';
        setTimeout(() => {
          game.message = `¿Qué debería hacer ${game.player.name}?`;
        }, 3000);
      }
    }
    
    function useItem(itemIndex) {
      const item = game.player.items[itemIndex];
      game.message = `Usaste ${item.name}... ${item.description}. ¡Perdiste tu turno!`;
      game.state = 'itemUsed';
      game.showingItems = false;
      
      // Mostrar mensaje y luego el enemigo ataca
      setTimeout(() => {
        game.state = 'enemyTurn';
        bossAttack();
      }, 2000);
    }
    
    function useMove(moveIndex) {
      const move = game.player.moves[moveIndex];
      if (move.pp <= 0) {
        game.message = '¡No quedan PP para este movimiento!';
        setTimeout(() => game.message = '', 2000);
        return;
      }
      
      move.pp--;
      game.state = 'playerAttack';
      game.player.defending = move.type === 'defense';
      
      // Activar animación específica del movimiento
      game.animation = move.animation;
      game.animationTimer = Date.now();
      
      if (move.type === 'attack') {
        const damage = Math.floor(move.power * (1 + Math.random() * 0.5) / handicap.bossSpeed);
        
        // Retrasar el daño para sincronizar con la animación
        setTimeout(() => {
          game.boss.hp = Math.max(0, game.boss.hp - damage);
          game.message = `${game.player.name} usó ${move.name}! ¡Hizo ${damage} de daño!`;
          
          if (game.boss.hp <= 0) {
            game.gameOver = true;
            setTimeout(() => endBossGame(true), 2000);
            return;
          }
        }, 500);
      } else {
        game.message = `${game.player.name} usó ${move.name}! ¡Está defendiendo!`;
      }
      
      // Turno del jefe
      setTimeout(() => bossAttack(), 2000);
    }
    
    function bossAttack() {
      const bossMoves = [
        'Shinra Tensei',
        'Getsuga Tenshou',
        'Gear Second',
        'Chidori'
      ];
      const bossMove = bossMoves[Math.floor(Math.random() * bossMoves.length)];
      const baseDamage = game.boss.baseDamage + Math.random() * 5; // Reducido de 10 a 5
      const damage = Math.floor(baseDamage * handicap.bossSpeed * (game.player.defending ? 0.3 : 1));
      
      // Mostrar animación de ataque
      game.animation = 'bossAttack';
      game.animationTimer = Date.now();
      
      setTimeout(() => {
        game.player.hp = Math.max(0, game.player.hp - damage);
        game.message = `¡${game.boss.name} usó ${bossMove}! ¡Hizo ${damage} de daño!`;
        
        if (game.player.hp <= 0) {
          game.gameOver = true;
          setTimeout(() => endBossGame(false), 2000);
          return;
        }
        
        game.player.defending = false;
        setTimeout(() => {
          game.state = 'menu';
          game.animation = null;
          game.message = `¿Qué debería hacer ${game.player.name}?`;
        }, 1500);
      }, 500);
    }
    
    function draw() {
      const canvas = bossGameState.canvas;
      const ctx = bossGameState.ctx;
      
      if (!canvas || !ctx) {
        console.error('Canvas no disponible en draw()');
        return;
      }
      
      // Limpiar canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Determinar si estamos en móvil (vertical)
      const isMobile = canvas.height > canvas.width;
      
      // DIMENSIONES FIJAS - NO DEFORMAR
      const baseWidth = 900;
      const baseHeight = 600;
      
      // Para móvil, ajustar proporción pero mantener aspecto
      let gameWidth = baseWidth;
      let gameHeight = baseHeight;
      
      if (isMobile) {
        // En móvil mantener aspecto vertical
        gameWidth = 400;
        gameHeight = 700;
      }
      
      // Calcular escala para ajustarse a la pantalla SIN DEFORMAR
      const scaleX = canvas.width / gameWidth;
      const scaleY = canvas.height / gameHeight;
      const scale = Math.min(scaleX, scaleY, 1.5); // Limitar escala máxima a 1.5x
      
      // Centrar el contenido
      const scaledWidth = gameWidth * scale;
      const scaledHeight = gameHeight * scale;
      const offsetX = (canvas.width - scaledWidth) / 2;
      const offsetY = (canvas.height - scaledHeight) / 2;
      
      // Fondo negro para áreas no usadas
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.save();
      ctx.translate(offsetX, offsetY);
      ctx.scale(scale, scale);
      
      // Guardar la escala y offset para los clicks
      game.canvasScale = scale;
      game.canvasOffsetX = offsetX;
      game.canvasOffsetY = offsetY;
      game.baseWidth = gameWidth;
      game.baseHeight = gameHeight;
      
      // Fondo pixelado con gradiente retro
      const bgGradient = ctx.createLinearGradient(0, 0, 0, gameHeight);
      bgGradient.addColorStop(0, '#87CEEB'); // Cielo azul claro
      bgGradient.addColorStop(0.4, '#98FB98'); // Verde pálido
      bgGradient.addColorStop(1, '#90EE90'); // Verde claro
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, gameWidth, gameHeight);
      
      // Patrón de píxeles de fondo
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      for (let x = 0; x < gameWidth; x += 20) {
        for (let y = 0; y < gameHeight; y += 20) {
          if ((x + y) % 40 === 0) {
            ctx.fillRect(x, y, 10, 10);
          }
        }
      }
      
      // Ajustar posiciones para móvil
      const enemyX = isMobile ? gameWidth/2 : 600;
      const enemyY = isMobile ? 150 : 200;
      const playerX = isMobile ? gameWidth/2 : 300;
      const playerY = isMobile ? 450 : 400;
      
      // Terreno de batalla con estilo pixel art
      // Plataforma del enemigo
      ctx.fillStyle = '#4B8B3B';
      ctx.fillRect(enemyX - (isMobile ? 100 : 150), enemyY - 10, isMobile ? 200 : 300, 20);
      ctx.fillStyle = '#6B8E23';
      ctx.fillRect(enemyX - (isMobile ? 100 : 150), enemyY, isMobile ? 200 : 300, isMobile ? 40 : 60);
      // Borde pixelado
      ctx.strokeStyle = '#2F4F2F';
      ctx.lineWidth = 2;
      ctx.strokeRect(enemyX - (isMobile ? 100 : 150), enemyY - 10, isMobile ? 200 : 300, isMobile ? 50 : 70);
      
      // Plataforma del jugador
      ctx.fillStyle = '#4B8B3B';
      ctx.fillRect(playerX - (isMobile ? 100 : 150), playerY - 10, isMobile ? 200 : 300, 20);
      ctx.fillStyle = '#6B8E23';
      ctx.fillRect(playerX - (isMobile ? 100 : 150), playerY, isMobile ? 200 : 300, isMobile ? 40 : 60);
      // Borde pixelado
      ctx.strokeStyle = '#2F4F2F';
      ctx.lineWidth = 2;
      ctx.strokeRect(playerX - (isMobile ? 100 : 150), playerY - 10, isMobile ? 200 : 300, isMobile ? 50 : 70);
      
      // Sombras pixeladas
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.fillRect(enemyX - (isMobile ? 80 : 120), enemyY + (isMobile ? 50 : 70), isMobile ? 160 : 240, 10);
      ctx.fillRect(playerX - (isMobile ? 80 : 120), playerY + (isMobile ? 50 : 70), isMobile ? 160 : 240, 10);
      
      // Dibujar enemigo (MÁS GRANDE)
      const enemySize = isMobile ? 150 : 200;
      
      // PARCHE: Si estamos en el menú de items, limpiar el fondo oscuro
      if (game.state === 'showingItems') {
        // Redibujar el fondo del menú para que sea crema
        ctx.fillStyle = '#FFF8DC';
        ctx.fillRect(10, menuY, gameWidth - 20, menuHeight);
        
        // Marco simple
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(10, menuY, gameWidth - 20, 4);
        ctx.fillRect(10, menuY + menuHeight - 4, gameWidth - 20, 4);
        ctx.fillRect(10, menuY, 4, menuHeight);
        ctx.fillRect(gameWidth - 14, menuY, 4, menuHeight);
      }
      if (bossImageLoaded) {
        ctx.drawImage(bossImage, enemyX - enemySize/2, enemyY - enemySize/2 - 30, enemySize, enemySize);
      } else {
        // Jefe más grande
        ctx.fillStyle = '#8B0000';
        ctx.fillRect(enemyX - 40, enemyY - 40, 80, 80);
        ctx.fillStyle = '#D2691E';
        ctx.fillRect(enemyX - 30, enemyY - 30, 60, 60);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(enemyX - 20, enemyY - 20, 10, 10);
        ctx.fillRect(enemyX + 10, enemyY - 20, 10, 10);
        // Cuernos
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.moveTo(enemyX - 40, enemyY - 40);
        ctx.lineTo(enemyX - 50, enemyY - 60);
        ctx.lineTo(enemyX - 30, enemyY - 40);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(enemyX + 40, enemyY - 40);
        ctx.lineTo(enemyX + 50, enemyY - 60);
        ctx.lineTo(enemyX + 30, enemyY - 40);
        ctx.fill();
      }
      
      // Animación de ataque del jefe - vibración de toda la silueta
      if (game.animation === 'bossAttack') {
        const shakeX = Math.sin(Date.now() / 50) * 5;
        const shakeY = Math.cos(Date.now() / 50) * 3;
        ctx.save();
        ctx.translate(shakeX, shakeY);
        
        // Resplandor rojo alrededor del jefe
        ctx.shadowColor = 'rgba(255, 0, 0, 0.8)';
        ctx.shadowBlur = 20 + Math.sin(Date.now() / 100) * 10;
        
        if (bossImageLoaded) {
          ctx.drawImage(bossImage, 520, 120, 160, 160);
        }
        ctx.restore();
      }
      
      // Dibujar jugador con avatar de batalla (MÁS GRANDE)
      const avatarSize = isMobile ? 140 : 160;
      if (battleAvatarLoaded) {
        ctx.save();
        // Vibración si está siendo atacado
        if (game.animation === 'playerHurt') {
          const shakeX = Math.sin(Date.now() / 50) * 3;
          ctx.translate(shakeX, 0);
        }
        // Dibujar avatar más grande y centrado
        ctx.drawImage(battleAvatar, playerX - avatarSize/2, playerY - avatarSize - 20, avatarSize, avatarSize);
        ctx.restore();
      } else {
        // Fallback
        ctx.fillStyle = '#4169E1';
        ctx.fillRect(playerX - 30, playerY - 60, 60, 60);
      }
      
      // Dibujar avatar del usuario de Google en el hueco de la cabeza del personaje
      const headHoleSize = isMobile ? 35 : 30; // Tamaño del hueco
      const headHoleX = playerX;
      const headHoleY = playerY - avatarSize + 25; // Posición del hueco en la cabeza
      
      ctx.save();
      // Crear círculo de recorte para el avatar
      ctx.beginPath();
      ctx.arc(headHoleX, headHoleY, headHoleSize, 0, Math.PI * 2);
      ctx.clip();
      
      if (userAvatar.type === 'image' && avatarImage && avatarImage.complete) {
        // Dibujar la imagen del avatar de Google
        ctx.drawImage(avatarImage, 
          headHoleX - headHoleSize, 
          headHoleY - headHoleSize, 
          headHoleSize * 2, 
          headHoleSize * 2);
      } else {
        // Si no hay imagen, usar fondo blanco con emoji
        ctx.fillStyle = '#fff';
        ctx.fillRect(headHoleX - headHoleSize, headHoleY - headHoleSize, headHoleSize * 2, headHoleSize * 2);
        ctx.fillStyle = '#ffffff';
        ctx.font = `${headHoleSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(userAvatar.value, headHoleX, headHoleY);
      }
      ctx.restore();
      
      // Borde dorado alrededor del hueco de la cabeza
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(headHoleX, headHoleY, headHoleSize, 0, Math.PI * 2);
      ctx.stroke();
      
      // Animaciones de ataques del jugador
      if (game.animation === 'beam') {
        // Kamehameha - rayo de energía
        const beamProgress = Math.min((Date.now() - game.animationTimer) / 500, 1);
        ctx.save();
        
        // Carga de energía
        if (beamProgress < 0.3) {
          const chargeSize = beamProgress * 100;
          ctx.fillStyle = 'rgba(0, 150, 255, 0.8)';
          ctx.beginPath();
          ctx.arc(240, 400, chargeSize, 0, Math.PI * 2);
          ctx.fill();
        }
        
        // Disparo del rayo
        if (beamProgress >= 0.3) {
          const gradient = ctx.createLinearGradient(240, 400, 560, 200);
          gradient.addColorStop(0, 'rgba(0, 150, 255, 0.9)');
          gradient.addColorStop(0.5, 'rgba(0, 200, 255, 1)');
          gradient.addColorStop(1, 'rgba(255, 255, 255, 0.8)');
          
          ctx.strokeStyle = gradient;
          ctx.lineWidth = 20 + Math.sin(Date.now() / 50) * 5;
          ctx.beginPath();
          ctx.moveTo(240, 400);
          ctx.lineTo(560 + Math.sin(Date.now() / 30) * 10, 200);
          ctx.stroke();
          
          // Efectos de partículas
          for (let i = 0; i < 5; i++) {
            ctx.fillStyle = 'rgba(100, 200, 255, 0.6)';
            const x = 240 + (320 * beamProgress) + Math.random() * 40 - 20;
            const y = 400 - (200 * beamProgress) + Math.random() * 40 - 20;
            ctx.beginPath();
            ctx.arc(x, y, Math.random() * 10, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.restore();
      } else if (game.animation === 'punch') {
        // Gomu Gomu Pistol - puño extendido
        const punchProgress = Math.min((Date.now() - game.animationTimer) / 400, 1);
        ctx.save();
        ctx.fillStyle = 'rgba(255, 150, 0, 0.8)';
        const punchX = 240 + (320 * punchProgress);
        const punchY = 400 - (200 * punchProgress);
        ctx.beginPath();
        ctx.arc(punchX, punchY, 20, 0, Math.PI * 2);
        ctx.fill();
        
        // Línea del brazo
        ctx.strokeStyle = 'rgba(255, 150, 0, 0.6)';
        ctx.lineWidth = 15;
        ctx.beginPath();
        ctx.moveTo(240, 400);
        ctx.lineTo(punchX, punchY);
        ctx.stroke();
        ctx.restore();
      } else if (game.animation === 'spiral') {
        // Rasengan - espiral de energía
        const spiralProgress = Math.min((Date.now() - game.animationTimer) / 600, 1);
        ctx.save();
        const spiralX = 240 + (320 * spiralProgress);
        const spiralY = 400 - (200 * spiralProgress);
        
        // Espiral rotatorio
        for (let i = 0; i < 8; i++) {
          const angle = (Date.now() / 100) + (i * Math.PI / 4);
          const x = spiralX + Math.cos(angle) * 30;
          const y = spiralY + Math.sin(angle) * 30;
          
          ctx.fillStyle = `rgba(100, 200, 255, ${0.8 - i * 0.1})`;
          ctx.beginPath();
          ctx.arc(x, y, 15 - i, 0, Math.PI * 2);
          ctx.fill();
        }
        
        // Centro brillante
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.beginPath();
        ctx.arc(spiralX, spiralY, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (game.animation === 'shield') {
        // Barrera de energía
        ctx.save();
        ctx.strokeStyle = 'rgba(0, 255, 0, 0.6)';
        ctx.lineWidth = 3;
        const shieldRadius = 50 + Math.sin(Date.now() / 100) * 5;
        ctx.beginPath();
        ctx.arc(200, 400, shieldRadius, 0, Math.PI * 2);
        ctx.stroke();
        
        // Hexágonos de escudo
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI * 2 / 6) * i;
          const x = 200 + Math.cos(angle) * shieldRadius;
          const y = 400 + Math.sin(angle) * shieldRadius;
          ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
          ctx.beginPath();
          ctx.arc(x, y, 10, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
      
      // HUD del enemigo estilo pixel art (MÁS GRANDE)
      const hudWidth = isMobile ? 320 : 380;
      const hudX = isMobile ? (gameWidth - hudWidth) / 2 : 50;
      const hudY = isMobile ? 10 : 30;
      
      // Fondo con degradado retro
      const hudGradient = ctx.createLinearGradient(hudX, hudY, hudX, hudY + 80);
      hudGradient.addColorStop(0, '#FFE4B5');
      hudGradient.addColorStop(1, '#FFD700');
      ctx.fillStyle = hudGradient;
      ctx.fillRect(hudX, hudY, hudWidth, 80);
      
      // Marco pixelado
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(hudX - 2, hudY - 2, hudWidth + 4, 2);
      ctx.fillRect(hudX - 2, hudY + 80, hudWidth + 4, 2);
      ctx.fillRect(hudX - 2, hudY, 2, 80);
      ctx.fillRect(hudX + hudWidth, hudY, 2, 80);
      
      // Texto pixelado con MEJOR CONTRASTE
      ctx.fillStyle = '#ffffff';
      ctx.font = isMobile ? 'bold 18px "Courier New", monospace' : 'bold 24px "Courier New", monospace';
      ctx.fillText(game.boss.species.toUpperCase() + '♂', hudX + 20, hudY + 25);
      ctx.fillText('Lv' + game.boss.level, hudX + hudWidth - 60, hudY + 25);
      
      // Barra de HP del enemigo pixelada
      // Fondo negro
      ctx.fillStyle = '#2F4F2F';
      ctx.fillRect(hudX + 60, hudY + 35, 180, 16);
      
      // Barra interior con color según vida
      let hpColor = '#00FF00'; // Verde brillante
      if (game.boss.hp / game.boss.maxHp <= 0.5) hpColor = '#FFD700'; // Amarillo dorado
      if (game.boss.hp / game.boss.maxHp <= 0.2) hpColor = '#FF4500'; // Rojo naranja
      
      ctx.fillStyle = hpColor;
      const hpWidth = Math.floor(176 * (game.boss.hp / game.boss.maxHp));
      
      // Efecto pixelado en la barra
      for (let x = 0; x < hpWidth; x += 4) {
        ctx.fillRect(hudX + 62 + x, hudY + 37, 3, 12);
      }
      
      // Texto HP pixelado
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px "Courier New", monospace';
      ctx.fillText('HP', hudX + 20, hudY + 45);
      
      // HUD del jugador estilo pixel art (MÁS GRANDE)
      const playerHudWidth = isMobile ? 320 : 380;
      const playerHudX = isMobile ? (gameWidth - playerHudWidth) / 2 : gameWidth - 430;
      const playerHudY = isMobile ? 280 : 320;
      
      // Fondo con degradado retro diferente
      const playerHudGradient = ctx.createLinearGradient(playerHudX, playerHudY, playerHudX, playerHudY + 100);
      playerHudGradient.addColorStop(0, '#E0FFFF');
      playerHudGradient.addColorStop(1, '#B0E0E6');
      ctx.fillStyle = playerHudGradient;
      ctx.fillRect(playerHudX, playerHudY, playerHudWidth, 100);
      
      // Marco pixelado azul
      ctx.fillStyle = '#4682B4';
      ctx.fillRect(playerHudX - 2, playerHudY - 2, playerHudWidth + 4, 2);
      ctx.fillRect(playerHudX - 2, playerHudY + 100, playerHudWidth + 4, 2);
      ctx.fillRect(playerHudX - 2, playerHudY, 2, 100);
      ctx.fillRect(playerHudX + playerHudWidth, playerHudY, 2, 100);
      
      // Texto pixelado con MEJOR CONTRASTE
      ctx.fillStyle = '#000080';
      ctx.font = isMobile ? 'bold 18px "Courier New", monospace' : 'bold 24px "Courier New", monospace';
      ctx.fillText(game.player.name.toUpperCase(), playerHudX + 20, playerHudY + 25);
      ctx.fillText('Lv' + game.player.level, playerHudX + playerHudWidth - 60, playerHudY + 25);
      
      // Barra de HP del jugador pixelada
      // Fondo oscuro
      ctx.fillStyle = '#191970';
      ctx.fillRect(playerHudX + 60, playerHudY + 35, 180, 16);
      
      // Barra interior con color según vida
      let playerHpColor = '#00FF00';
      if (game.player.hp / game.player.maxHp <= 0.5) playerHpColor = '#FFD700';
      if (game.player.hp / game.player.maxHp <= 0.2) playerHpColor = '#FF4500';
      
      ctx.fillStyle = playerHpColor;
      const playerHpWidth = Math.floor(176 * (game.player.hp / game.player.maxHp));
      
      // Efecto pixelado en la barra
      for (let x = 0; x < playerHpWidth; x += 4) {
        ctx.fillRect(playerHudX + 62 + x, playerHudY + 37, 3, 12);
      }
      
      // Texto HP pixelado
      ctx.fillStyle = '#000080';
      ctx.font = 'bold 14px "Courier New", monospace';
      ctx.fillText('HP', playerHudX + 20, playerHudY + 45);
      
      // Mostrar números de HP debajo de la barra para evitar superposición
      ctx.font = 'bold 14px "Courier New", monospace';
      ctx.fillText(game.player.hp + '/' + game.player.maxHp, playerHudX + 90, playerHudY + 70);
      
      // Barra de EXP pixelada
      ctx.fillStyle = '#191970';
      ctx.fillRect(playerHudX + 60, playerHudY + 75, 180, 8);
      ctx.fillStyle = '#FFD700';
      const expWidth = Math.floor(176 * (game.player.exp / 100));
      
      // Efecto pixelado en la barra de EXP
      for (let x = 0; x < expWidth; x += 4) {
        ctx.fillRect(playerHudX + 62 + x, playerHudY + 77, 3, 4);
      }
      
      ctx.fillStyle = '#000080';
      ctx.font = 'bold 12px "Courier New", monospace';
      ctx.fillText('EXP', playerHudX + 20, playerHudY + 80);
      
      // Caja de texto/menú estilo pixel art
      const menuY = isMobile ? gameHeight - 200 : gameHeight - 200;
      const menuHeight = isMobile ? 200 : 200;
      
      // Fondo claro tipo crema para mejor legibilidad
      ctx.fillStyle = '#FFF8DC'; // Color crema
      ctx.fillRect(10, menuY, gameWidth - 20, menuHeight);
      
      // Marco pixelado simple
      ctx.fillStyle = '#8B4513';
      // Marco exterior
      ctx.fillRect(10, menuY, gameWidth - 20, 4);
      ctx.fillRect(10, menuY + menuHeight - 4, gameWidth - 20, 4);
      ctx.fillRect(10, menuY, 4, menuHeight);
      ctx.fillRect(gameWidth - 14, menuY, 4, menuHeight);
      
      if (game.state === 'statUpgrade' && game.expPoints > 0) {
        // Menú de mejora de stats con estilo pixel art
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px "Courier New", monospace';
        ctx.fillText(`⭐ PUNTOS EXP: ${game.expPoints} ⭐`, 50, menuY + 40);
        ctx.font = 'bold 16px "Courier New", monospace';
        ctx.fillText('MEJORA TUS STATS:', 50, menuY + 65);
        
        // Opciones de mejora
        const options = [
          `Mejorar HP (+20) - Costo: 10 pts`,
          `Mejorar Ataque (+10) - Costo: 10 pts`
        ];
        
        options.forEach((opt, i) => {
          const optY = menuY + 80 + i * 35;
          if (i === game.selectedStat) {
            // Selección con efecto pixelado
            ctx.fillStyle = '#FF6347';
            ctx.fillRect(45, optY - 20, gameWidth - 90, 30);
            ctx.fillStyle = '#FFA07A';
            ctx.fillRect(47, optY - 18, gameWidth - 94, 26);
          }
          ctx.fillStyle = '#ffffff';
          ctx.shadowBlur = 0;
          ctx.font = 'bold 18px "Courier New", monospace';
          ctx.fillText('▶ ' + opt, 50, optY);
        });
        
        if (game.expPoints < 10) {
          ctx.fillStyle = '#888';
          ctx.font = '14px monospace';
          ctx.fillText('No tienes suficientes puntos (necesitas 10)', 50, 660);
        }
        
        // Botón para continuar sin gastar puntos
        if (game.selectedStat === 2) {
          ctx.fillStyle = '#F85050';
          ctx.fillRect(550, 620, 200, 40);
        }
        ctx.fillStyle = '#F8F8F0';
        ctx.fillRect(552, 622, 196, 36);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeRect(550, 620, 200, 40);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px monospace';
        ctx.fillText('CONTINUAR →', 620, 645);
      } else if (game.state === 'showingItems') {
        // ASEGURAR FONDO CREMA PARA EL MENÚ DE ITEMS
        ctx.fillStyle = '#FFF8DC';
        ctx.fillRect(10, menuY, gameWidth - 20, menuHeight);
        
        // Marco simple marrón
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(10, menuY, gameWidth - 20, 3);
        ctx.fillRect(10, menuY + menuHeight - 3, gameWidth - 20, 3);
        ctx.fillRect(10, menuY, 3, menuHeight);
        ctx.fillRect(gameWidth - 13, menuY, 3, menuHeight);
        
        // Título
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px "Courier New", monospace';
        ctx.fillText('Tu Bolsa de Otaku:', 50, menuY + 35);
        
        // Solo mostrar los primeros 4 items
        const maxItems = 4;
        for (let i = 0; i < Math.min(maxItems, game.player.items.length); i++) {
          const itemY = menuY + 60 + i * 25;
          
          if (i === game.selectedItem) {
            // Selección con fondo rosa claro
            ctx.fillStyle = '#FFB6C1';
            ctx.fillRect(45, itemY - 18, gameWidth - 90, 24);
          }
          
          // Texto negro para máxima legibilidad
          ctx.fillStyle = '#ffffff';
          ctx.font = '16px "Courier New", monospace';
          ctx.fillText(game.player.items[i].name, 55, itemY);
        }
        
        // Flechas de navegación simples al lado
        if (game.player.items.length > maxItems) {
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 20px "Courier New", monospace';
          
          // Flecha arriba
          if (game.selectedItem > 0) {
            ctx.fillText('▲', gameWidth - 60, menuY + 70);
          }
          
          // Flecha abajo  
          if (game.selectedItem < game.player.items.length - 1) {
            ctx.fillText('▼', gameWidth - 60, menuY + 120);
          }
        }
        
        // Botón volver centrado
        const backY = menuY + 160;
        ctx.fillStyle = '#4169E1';
        ctx.fillRect(gameWidth/2 - 90, backY, 180, 30);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 16px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('← VOLVER AL MENÚ', gameWidth/2, backY + 20);
        ctx.textAlign = 'left';
        
        // Mostrar descripción del item seleccionado con mejor estilo
        if (game.selectedItem < game.player.items.length) {
          // Panel de descripción más abajo
          const descY = menuY + 120;
          ctx.fillStyle = '#2F4F2F';
          ctx.fillRect(50, descY, gameWidth - 100, 50);
          ctx.fillStyle = '#F0FFF0';
          ctx.fillRect(52, descY + 2, gameWidth - 104, 46);
          
          ctx.fillStyle = '#ffffff';
          ctx.font = '14px "Courier New", monospace';
          ctx.textAlign = 'center';
          ctx.fillText(game.player.items[game.selectedItem].description, gameWidth/2, descY + 28);
          ctx.textAlign = 'left';
        }
      } else if (game.state === 'menu') {
        // Menú principal con estilo pixel art
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 22px "Courier New", monospace';
        ctx.fillText('¿QUÉ DEBERÍA', 50, menuY + 40);
        ctx.fillText(game.player.name.toUpperCase() + ' HACER?', 50, menuY + 65);
        
        // Opciones del menú con diseño pixelado
        const menuOptions = [
          { x: gameWidth/2 - 190, y: menuY + 90, w: 170, h: 45, text: 'ATACAR', icon: '⚔️' },
          { x: gameWidth/2 + 20, y: menuY + 90, w: 170, h: 45, text: 'CHIPOKOMON', icon: '🎮' },
          { x: gameWidth/2 - 190, y: menuY + 140, w: 170, h: 45, text: 'BOLSA', icon: '🎒' },
          { x: gameWidth/2 + 20, y: menuY + 140, w: 170, h: 45, text: 'CORRER', icon: '🏃' }
        ];
        
        menuOptions.forEach((opt, i) => {
          // Fondo del botón
          const isSelected = game.menuOption === i;
          
          if (isSelected) {
            // Botón seleccionado
            ctx.fillStyle = '#FF6347';
            ctx.fillRect(opt.x - 2, opt.y - 2, opt.w + 4, opt.h + 4);
            ctx.fillStyle = '#FFD700';
            ctx.fillRect(opt.x, opt.y, opt.w, opt.h);
          } else {
            // Botón normal
            ctx.fillStyle = '#4169E1';
            ctx.fillRect(opt.x, opt.y, opt.w, opt.h);
            ctx.fillStyle = '#87CEEB';
            ctx.fillRect(opt.x + 2, opt.y + 2, opt.w - 4, opt.h - 4);
          }
          
          // Texto del botón
          ctx.fillStyle = isSelected ? '#8B0000' : '#000080';
          ctx.shadowBlur = 0;
          ctx.font = 'bold 18px "Courier New", monospace';
          ctx.fillText(opt.icon + ' ' + opt.text, opt.x + 10, opt.y + 25);
        });
        
        return; // Evitar el código antiguo de las opciones
        
        // Este código se reemplazó con el nuevo diseño de botones pixelados
        
      } else if (game.state === 'selectMove') {
        // Selección de movimientos estilo pixel art
        ctx.fillStyle = '#000080';
        ctx.font = 'bold 20px "Courier New", monospace';
        ctx.fillText('SELECCIONA ATAQUE:', 50, menuY + 35);
        
        for (let i = 0; i < 4; i++) {
          const x = i % 2 === 0 ? 50 : gameWidth/2 + 10;
          const y = menuY + 60 + (i < 2 ? 0 : 55);
          
          // Fondo del movimiento
          if (i === game.selectedMove) {
            ctx.fillStyle = '#FF6347';
            ctx.fillRect(x - 5, y - 5, gameWidth/2 - 70, 50);
            ctx.fillStyle = '#FFA500';
            ctx.fillRect(x - 3, y - 3, gameWidth/2 - 74, 46);
          } else {
            ctx.fillStyle = '#4682B4';
            ctx.fillRect(x - 3, y - 3, gameWidth/2 - 74, 46);
          }
          
          ctx.fillStyle = '#F0F8FF';
          ctx.fillRect(x, y, gameWidth/2 - 80, 40);
          
          const move = game.player.moves[i];
          
          // Icono según tipo de movimiento
          let icon = '⚡';
          if (move.animation === 'beam') icon = '💥';
          else if (move.animation === 'punch') icon = '👊';
          else if (move.animation === 'spiral') icon = '🌀';
          else if (move.type === 'defense') icon = '🛡️';
          
          // Texto con mejor contraste
          ctx.fillStyle = i === game.selectedMove ? '#000000' : '#000080';
          ctx.font = 'bold 16px "Courier New", monospace';
          ctx.fillText(icon + ' ' + move.name, x + 5, y + 15);
          
          // PP con barra visual
          ctx.font = '12px "Courier New", monospace';
          const ppRatio = move.pp / move.maxPp;
          const ppColor = ppRatio > 0.5 ? '#228B22' : ppRatio > 0.25 ? '#FFD700' : '#DC143C';
          
          ctx.fillStyle = '#696969';
          ctx.fillRect(x + 5, y + 25, gameWidth/2 - 90, 8);
          ctx.fillStyle = ppColor;
          ctx.fillRect(x + 5, y + 25, (gameWidth/2 - 90) * ppRatio, 8);
          
          ctx.fillStyle = '#000080';
          ctx.fillText(`PP: ${move.pp}/${move.maxPp}`, x + gameWidth/2 - 140, y + 33);
        }
      } else {
        // Mostrar mensaje con estilo pixel art
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px "Courier New", monospace';
        
        // Añadir indicador de acción si hay animación
        if (game.animation) {
          ctx.fillStyle = '#FF6347';
          ctx.fillRect(30, menuY + 20, gameWidth - 60, 3);
          ctx.fillStyle = '#FFD700';
          const progress = ((Date.now() / 100) % 10) * ((gameWidth - 60) / 10);
          ctx.fillRect(30, menuY + 20, progress, 3);
        }
        
        const lines = game.message.split('!');
        lines.forEach((line, i) => {
          if (line) {
            // Usar caja de texto con fondo para mejor legibilidad
            const textY = menuY + 50 + i * 28;
            const textWidth = ctx.measureText(line + (i < lines.length - 1 ? '!' : '')).width;
            
            // Fondo semi-transparente para el texto
            ctx.fillStyle = 'rgba(240, 248, 255, 0.9)';
            ctx.fillRect(45, textY - 20, textWidth + 30, 25);
            
            ctx.fillStyle = '#ffffff';
            ctx.fillText(line + (i < lines.length - 1 ? '!' : ''), 50, textY);
          }
        });
        
        // Añadir efecto de texto parpadeante para mensajes importantes
        if (game.message.includes('VICTORIA') || game.message.includes('DERROTA')) {
          if (Math.sin(Date.now() / 200) > 0) {
            ctx.fillStyle = '#FFD700';
            ctx.font = 'bold 24px "Courier New", monospace';
            ctx.fillText('★ ★ ★', gameWidth/2 - 40, menuY + 160);
          }
        }
      }
      
      // Restaurar el contexto al final
      ctx.restore();
    }
    
    function gameLoop() {
      draw();
      if (!game.gameOver) {
        bossGameState.animationId = requestAnimationFrame(gameLoop);
      }
    }
    
    // Inicializar
    if (game.expPoints > 0) {
      game.message = `Tienes ${game.expPoints} puntos de experiencia para mejorar`;
    } else {
      game.state = 'menu';
      game.message = `¿Qué debería hacer ${game.player.name}?`;
    }
    
    // Iniciar el loop de renderizado
    gameLoop();
  }

  // Exportar
  window.AdventureBosses = {
    startBossGame
  };

})(window);
