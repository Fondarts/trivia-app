// Archivo: js/adventure_bosses_fix.js
// Fix para el problema de escalado en la batalla del jefe del Valle Otaku

(function() {
  'use strict';
  
  // Guardamos la función original
  const originalInitAnimePokemon = window.initAnimePokemon;
  
  // Reemplazamos la función con una versión corregida
  window.initAnimePokemonFixed = function(handicap) {
    // Verificar que tenemos canvas y contexto
    if (!window.bossGameState || !window.bossGameState.canvas || !window.bossGameState.ctx) {
      console.error('Canvas o contexto no disponible en bossGameState');
      return;
    }
    
    const canvas = window.bossGameState.canvas;
    const ctx = window.bossGameState.ctx;
    
    // Cargar imágenes
    const bossImage = new Image();
    bossImage.src = 'assets/bosses/demon_anime.png';
    let bossImageLoaded = false;
    bossImage.onload = () => { bossImageLoaded = true; };
    
    // Obtener avatar del usuario
    function getUserAvatar() {
      if (window.getCurrentUser) {
        const user = window.getCurrentUser();
        if (user && user.avatar) {
          return { type: 'image', src: user.avatar };
        }
      }
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
    battleAvatar.src = 'img/avatarman.png';
    let battleAvatarLoaded = false;
    battleAvatar.onload = () => { battleAvatarLoaded = true; };
    
    // Calcular estadísticas basadas en el desempeño
    const questionsScore = handicap.questionsScore || 0;
    const expPoints = questionsScore * 10;
    
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
        expPoints: expPoints,
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
        baseDamage: 5
      },
      state: 'statUpgrade',
      selectedMove: 0,
      menuOption: 0,
      selectedItem: 0,
      selectedStat: 0,
      message: '',
      animationFrame: 0,
      gameOver: false,
      animation: null,
      animationTimer: null,
      showingItems: false,
      // Añadimos estas propiedades para el escalado
      scale: 1,
      offsetX: 0,
      offsetY: 0,
      baseWidth: 800,
      baseHeight: 600
    };
    
    // Función mejorada para calcular el escalado
    function updateScaling() {
      const isMobile = canvas.height > canvas.width;
      
      // Ajustar dimensiones base según orientación
      game.baseWidth = isMobile ? 400 : 800;
      game.baseHeight = isMobile ? 700 : 600;
      
      // Calcular escala manteniendo aspect ratio
      const scaleX = canvas.width / game.baseWidth;
      const scaleY = canvas.height / game.baseHeight;
      game.scale = Math.min(scaleX, scaleY);
      
      // Centrar el contenido
      const scaledWidth = game.baseWidth * game.scale;
      const scaledHeight = game.baseHeight * game.scale;
      game.offsetX = (canvas.width - scaledWidth) / 2;
      game.offsetY = (canvas.height - scaledHeight) / 2;
    }
    
    // Actualizar escalado cuando cambie el tamaño
    window.addEventListener('resize', () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      updateScaling();
    });
    
    // Calcular escalado inicial
    updateScaling();
    
    // Mostrar menú de mejora de stats al inicio si hay puntos
    if (game.expPoints > 0) {
      game.message = `Tienes ${game.expPoints} puntos de experiencia para distribuir`;
      game.state = 'statUpgrade';
    } else {
      game.state = 'menu';
      game.message = `¿Qué debería hacer ${game.player.name}?`;
    }
    
    // Controles táctiles y mouse mejorados
    function getGameCoordinates(clientX, clientY) {
      const rect = canvas.getBoundingClientRect();
      const canvasX = clientX - rect.left;
      const canvasY = clientY - rect.top;
      
      // Convertir a coordenadas del juego
      const gameX = (canvasX - game.offsetX) / game.scale;
      const gameY = (canvasY - game.offsetY) / game.scale;
      
      return { x: gameX, y: gameY };
    }
    
    // Manejador de clicks mejorado
    function handleClick(e) {
      e.preventDefault();
      const coords = getGameCoordinates(e.clientX, e.clientY);
      processGameClick(coords.x, coords.y);
    }
    
    // Manejador de touch mejorado
    function handleTouch(e) {
      e.preventDefault();
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        const coords = getGameCoordinates(touch.clientX, touch.clientY);
        processGameClick(coords.x, coords.y);
      }
    }
    
    // Procesar click en coordenadas del juego
    function processGameClick(x, y) {
      const isMobile = game.baseHeight > game.baseWidth;
      const baseWidth = game.baseWidth;
      const baseHeight = game.baseHeight;
      
      if (game.state === 'statUpgrade') {
        if (y > 400 && y < 500 && game.expPoints >= 5) {
          game.selectedStat = 0;
          applyStatUpgrade();
        } else if (y > 500 && y < 600 && game.expPoints >= 5) {
          game.selectedStat = 1;
          applyStatUpgrade();
        } else if (x > 550 && x < 750 && y > 620 && y < 660) {
          game.state = 'menu';
          game.message = `¿Qué debería hacer ${game.player.name}?`;
        }
      } else if (game.state === 'menu') {
        // Ajustar áreas de click para el menú
        const menuY = isMobile ? baseHeight - 180 : 500;
        
        if (y > menuY + 20 && y < menuY + 160) {
          if (x > 420 && x < 580 && y < menuY + 90) {
            game.menuOption = 0;
            selectMenuOption();
          } else if (x > 590 && x < 750 && y < menuY + 90) {
            game.menuOption = 1;
            selectMenuOption();
          } else if (x > 420 && x < 580 && y > menuY + 90) {
            game.menuOption = 2;
            selectMenuOption();
          } else if (x > 590 && x < 750 && y > menuY + 90) {
            game.menuOption = 3;
            selectMenuOption();
          }
        }
      } else if (game.state === 'selectMove') {
        const menuY = isMobile ? baseHeight - 180 : 500;
        
        if (y > menuY + 30 && y < menuY + 160) {
          if (x < baseWidth / 2) {
            if (y < menuY + 90) game.selectedMove = 0;
            else game.selectedMove = 2;
          } else {
            if (y < menuY + 90) game.selectedMove = 1;
            else game.selectedMove = 3;
          }
          useMove(game.selectedMove);
        }
      }
    }
    
    // Event listeners para canvas
    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('touchstart', handleTouch);
    
    // Función de dibujo mejorada con escalado correcto
    function draw() {
      if (!canvas || !ctx) {
        console.error('Canvas no disponible en draw()');
        return;
      }
      
      // Limpiar todo el canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Fondo negro para las áreas fuera del juego
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Guardar estado y aplicar transformaciones
      ctx.save();
      ctx.translate(game.offsetX, game.offsetY);
      ctx.scale(game.scale, game.scale);
      
      // Ahora dibujamos todo en coordenadas del juego (0, 0, baseWidth, baseHeight)
      const isMobile = game.baseHeight > game.baseWidth;
      const baseWidth = game.baseWidth;
      const baseHeight = game.baseHeight;
      
      // Fondo del juego
      ctx.fillStyle = '#c8f8c8';
      ctx.fillRect(0, 0, baseWidth, baseHeight);
      
      // Posiciones ajustadas para móvil/desktop
      const enemyX = isMobile ? baseWidth/2 : 600;
      const enemyY = isMobile ? 150 : 250;
      const playerX = isMobile ? baseWidth/2 : 200;
      const playerY = isMobile ? 450 : 450;
      
      // Terreno de batalla
      ctx.fillStyle = '#a0d0a0';
      ctx.beginPath();
      ctx.ellipse(playerX, playerY, isMobile ? 100 : 150, isMobile ? 40 : 60, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(enemyX, enemyY, isMobile ? 100 : 150, isMobile ? 40 : 60, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Dibujar enemigo
      const enemySize = isMobile ? 120 : 160;
      if (bossImageLoaded) {
        ctx.drawImage(bossImage, enemyX - enemySize/2, enemyY - enemySize/2 - 30, enemySize, enemySize);
      } else {
        // Enemigo placeholder
        ctx.fillStyle = '#8B0000';
        ctx.fillRect(enemyX - 40, enemyY - 40, 80, 80);
      }
      
      // Dibujar jugador
      const avatarSize = isMobile ? 120 : 100;
      if (battleAvatarLoaded) {
        ctx.drawImage(battleAvatar, playerX - avatarSize/2, playerY - avatarSize - 20, avatarSize, avatarSize);
      } else {
        ctx.fillStyle = '#4169E1';
        ctx.fillRect(playerX - 30, playerY - 60, 60, 60);
      }
      
      // HUD del enemigo
      const hudWidth = isMobile ? 280 : 300;
      const hudX = isMobile ? (baseWidth - hudWidth) / 2 : 50;
      const hudY = isMobile ? 10 : 50;
      
      ctx.fillStyle = '#F8F8F0';
      ctx.fillRect(hudX, hudY, hudWidth, 80);
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 3;
      ctx.strokeRect(hudX, hudY, hudWidth, 80);
      
      ctx.fillStyle = '#000';
      ctx.font = isMobile ? 'bold 16px monospace' : 'bold 20px monospace';
      ctx.fillText(game.boss.species.toUpperCase() + '♂', hudX + 20, hudY + 25);
      ctx.fillText('Lv' + game.boss.level, hudX + hudWidth - 60, hudY + 25);
      
      // Barra de HP del enemigo
      ctx.fillStyle = '#000';
      ctx.fillRect(hudX + 60, hudY + 35, 180, 16);
      const hpRatio = game.boss.hp / game.boss.maxHp;
      ctx.fillStyle = hpRatio > 0.5 ? '#48D048' : hpRatio > 0.2 ? '#F8D030' : '#F85050';
      ctx.fillRect(hudX + 62, hudY + 37, 176 * hpRatio, 12);
      
      // HUD del jugador
      const playerHudY = isMobile ? 280 : 350;
      
      ctx.fillStyle = '#F8F8F0';
      ctx.fillRect(hudX, playerHudY, hudWidth, 100);
      ctx.strokeStyle = '#000';
      ctx.strokeRect(hudX, playerHudY, hudWidth, 100);
      
      ctx.fillStyle = '#000';
      ctx.font = isMobile ? 'bold 16px monospace' : 'bold 20px monospace';
      ctx.fillText(game.player.name.toUpperCase(), hudX + 20, playerHudY + 25);
      ctx.fillText('Lv' + game.player.level, hudX + hudWidth - 60, playerHudY + 25);
      
      // Barra de HP del jugador
      ctx.fillStyle = '#000';
      ctx.fillRect(hudX + 60, playerHudY + 35, 180, 16);
      const playerHpRatio = game.player.hp / game.player.maxHp;
      ctx.fillStyle = playerHpRatio > 0.5 ? '#48D048' : playerHpRatio > 0.2 ? '#F8D030' : '#F85050';
      ctx.fillRect(hudX + 62, playerHudY + 37, 176 * playerHpRatio, 12);
      
      ctx.fillStyle = '#000';
      ctx.font = '12px monospace';
      ctx.fillText('HP', hudX + 20, playerHudY + 45);
      ctx.fillText(game.player.hp + '/ ' + game.player.maxHp, hudX + 140, playerHudY + 70);
      
      // Menú/Texto
      const menuY = isMobile ? baseHeight - 180 : 500;
      const menuHeight = 180;
      
      ctx.fillStyle = '#F8F8F0';
      ctx.fillRect(10, menuY, baseWidth - 20, menuHeight);
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 4;
      ctx.strokeRect(10, menuY, baseWidth - 20, menuHeight);
      
      // Contenido del menú según el estado
      if (game.state === 'menu') {
        ctx.fillStyle = '#000';
        ctx.font = 'bold 24px monospace';
        ctx.fillText('¿Qué debería', 50, menuY + 50);
        ctx.fillText(game.player.name + ' hacer?', 50, menuY + 80);
        
        // Opciones del menú
        const options = [
          { x: 420, y: menuY + 20, w: 160, h: 70, text: 'ATACAR' },
          { x: 590, y: menuY + 20, w: 160, h: 70, text: 'CHIPOKOMON' },
          { x: 420, y: menuY + 90, w: 160, h: 70, text: 'BOLSA' },
          { x: 590, y: menuY + 90, w: 160, h: 70, text: 'CORRER' }
        ];
        
        options.forEach((opt, i) => {
          ctx.fillStyle = '#F8F8F0';
          ctx.fillRect(opt.x, opt.y, opt.w, opt.h);
          
          if (i === game.menuOption) {
            ctx.strokeStyle = '#F85050';
            ctx.lineWidth = 3;
          } else {
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
          }
          ctx.strokeRect(opt.x, opt.y, opt.w, opt.h);
          
          ctx.fillStyle = '#000';
          ctx.font = 'bold 20px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(opt.text, opt.x + opt.w/2, opt.y + opt.h/2 + 7);
        });
        ctx.textAlign = 'left';
      } else {
        // Mostrar mensaje
        ctx.fillStyle = '#000';
        ctx.font = 'bold 20px monospace';
        const lines = game.message.split('!');
        lines.forEach((line, i) => {
          if (line) ctx.fillText(line + (i < lines.length - 1 ? '!' : ''), 50, menuY + 50 + i * 30);
        });
      }
      
      // Restaurar contexto
      ctx.restore();
    }
    
    // Función del game loop
    function gameLoop() {
      draw();
      if (!game.gameOver) {
        window.bossGameState.animationId = requestAnimationFrame(gameLoop);
      }
    }
    
    // Función auxiliar para obtener el nombre del jugador
    function getPlayerNameForBoss() {
      if (window.getCurrentUser) {
        const user = window.getCurrentUser();
        if (user && !user.isGuest) {
          const savedNickname = localStorage.getItem('user_nickname_' + user.id);
          if (savedNickname) return savedNickname;
        }
      }
      const inputName = document.getElementById('playerName')?.value?.trim();
      return inputName || localStorage.getItem('playerName') || 'Jugador';
    }
    
    // Funciones del juego (simplificadas para el ejemplo)
    function applyStatUpgrade() {
      if (game.expPoints >= 5) {
        if (game.selectedStat === 0) {
          game.player.maxHp += 20;
          game.player.hp = game.player.maxHp;
          game.expPoints -= 5;
          game.message = `¡HP aumentado! Te quedan ${game.expPoints} puntos`;
        } else {
          game.player.attack += 10;
          game.expPoints -= 5;
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
    
    function selectMenuOption() {
      // Implementar lógica de selección de menú
      if (game.menuOption === 0) {
        game.state = 'selectMove';
      }
      // ... más opciones
    }
    
    function useMove(moveIndex) {
      // Implementar lógica de movimientos
      const move = game.player.moves[moveIndex];
      if (move.pp <= 0) {
        game.message = '¡No quedan PP para este movimiento!';
        return;
      }
      
      move.pp--;
      game.state = 'playerAttack';
      // ... lógica de ataque
    }
    
    // Iniciar el game loop
    gameLoop();
  };
  
  // Si existe AdventureBosses, parchear la función
  if (window.AdventureBosses) {
    const originalStartBossGame = window.AdventureBosses.startBossGame;
    
    window.AdventureBosses.startBossGame = function(regionKey, handicap, callback) {
      // Si es el jefe de anime, usar la versión corregida
      if (regionKey === 'anime') {
        // Configurar el estado del boss game
        window.bossGameState = {
          type: 'pokemon',
          handicap: handicap,
          callback: callback,
          canvas: null,
          ctx: null,
          animationId: null
        };
        
        // Mostrar UI del boss game
        const container = document.getElementById('adventureGameArea');
        if (container) {
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
          
          window.bossGameState.canvas = document.getElementById('bossGameCanvas');
          window.bossGameState.canvas.width = window.innerWidth;
          window.bossGameState.canvas.height = window.innerHeight;
          window.bossGameState.ctx = window.bossGameState.canvas.getContext('2d');
        }
        
        // Usar la versión corregida
        window.initAnimePokemonFixed(handicap);
      } else {
        // Para otros jefes, usar la función original
        originalStartBossGame.call(this, regionKey, handicap, callback);
      }
    };
  }
  
  console.log('✅ Fix de escalado para el jefe del Valle Otaku aplicado');
})();