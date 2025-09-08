// Reemplazo completo de la batalla Pokemon para el jefe Otakuma
// Este archivo debe incluirse después de adventure_bosses.js

(function(window) {
  'use strict';

  // Nueva función de batalla Pokemon optimizada para móvil
  function initAnimePokemonMobile(handicap) {
    // Asegurarse de que bossGameState existe
    if (!window.bossGameState || !window.bossGameState.canvas || !window.bossGameState.ctx) {
      console.error('Canvas o contexto no disponible');
      return;
    }
    
    const canvas = window.bossGameState.canvas;
    const ctx = window.bossGameState.ctx;
    
    // === CONFIGURACIÓN INICIAL ===
    
    // Cargar imágenes
    const bossImage = new Image();
    bossImage.src = 'assets/bosses/demon_anime.webp';
    let bossImageLoaded = false;
    bossImage.onload = () => { bossImageLoaded = true; };
    
    const battleAvatar = new Image();
    battleAvatar.src = 'img/avatarman.webp';
    let battleAvatarLoaded = false;
    battleAvatar.onload = () => { battleAvatarLoaded = true; };
    
    // Obtener avatar del usuario de Google
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
    
    // Obtener nombre del jugador usando la función global si existe
    function getPlayerName() {
      // Usar la función global si existe
      if (typeof window.getPlayerNameForBoss === 'function') {
        return window.getPlayerNameForBoss();
      }
      
      // Fallback: obtener nombre localmente
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
    
    // Estado del juego
    const game = {
      player: {
        name: getPlayerName(),
        hp: 100,
        maxHp: 100,
        level: 50,
        exp: 0,
        expPoints: (handicap.questionsScore || 0) * 10,
        correctAnswers: handicap.questionsScore || 0,
        attack: 35,
        defense: 1, // Multiplicador de defensa
        attackBonus: 1, // Multiplicador de ataque
        sleepTurns: 0, // Turnos dormido
        moves: [
          { name: 'Kame Hame Ha', power: 40, pp: 10, maxPp: 10, animation: 'beam' },
          { name: 'Gomu Gomu Pistol', power: 35, pp: 15, maxPp: 15, animation: 'punch' },
          { name: 'Rasengan', power: 50, pp: 5, maxPp: 5, animation: 'spiral' },
          { name: 'Barrera de Energía', power: 0, pp: 10, maxPp: 10, animation: 'shield', isDefense: true }
        ],
        defending: false,
        avatar: userAvatar,
        items: [
          { name: 'Senzu Bean', description: 'Una judía mágica... sospechosa', effect: 'damage', value: 20, message: 'Quizás no deberías comprar judías mágicas de extraños en callejones oscuros.' },
          { name: 'Ramen Instantáneo', description: 'Huele delicioso', effect: 'heal', value: 20, message: 'Mmm qué buen ramen. ¡Ichiraku estaría orgulloso!' },
          { name: 'Death Note', description: 'Un cuaderno misterioso', effect: 'none', message: 'Escribiste el nombre del jefe... pero no sabes su nombre real. Solo dice "OTAKUMA".' },
          { name: 'Pokeball', description: 'Para capturar... algo', effect: 'none', message: 'La lanzaste pero rebotó. Los jefes no pueden ser capturados.' },
          { name: 'Sharingan Lens', description: 'Lentes de contacto rojos', effect: 'attackUp', value: 1.5, message: '¡Ahora puedes copiar los movimientos! Ataque aumentado.' },
          { name: 'Espada de Kirito', description: 'Una réplica barata', effect: 'attackDown', value: 0.7, message: 'Es de plástico... tu ataque bajó por la vergüenza.' },
          { name: 'Armadura de Edward', description: 'Muy pesada', effect: 'defenseUp', value: 1.5, message: '¡Defensa aumentada! Pero pesas mucho más.' },
          { name: 'Sake de Tsunade', description: 'Bebida muy fuerte', effect: 'defenseDown', value: 0.5, message: 'Te mareaste... defensa reducida drásticamente.' },
          { name: 'Pastilla del Soldado', description: 'Píldora militar', effect: 'sleep', value: 2, message: '¡Era una pastilla para dormir! Te quedaste dormido.' },
          { name: 'Pergamino Prohibido', description: 'Técnica secreta', effect: 'randomEffect', message: 'No entiendes los kanjis. Algo random pasó.' },
          { name: 'Comida de Yukihira', description: 'Brilla sospechosamente', effect: 'fullHeal', message: '¡Es tan deliciosa que te curaste completamente!' },
          { name: 'Carta de Yu-Gi-Oh', description: 'Exodia incompleto', effect: 'none', message: 'Solo tienes el brazo izquierdo de Exodia. No sirve de nada.' }
        ]
      },
      boss: {
        name: 'OTAKUMA',
        hp: handicap.bossLives * 60,
        maxHp: handicap.bossLives * 60,
        level: 45,
        species: 'OTAKUMA'
      },
      state: 'menu', // menu, selectMove, message, statUpgrade, showingItems, confirmRun
      selectedOption: 0,
      selectedMove: 0,
      selectedItem: 0,
      scrollOffset: 0, // Para scrollear en la bolsa
      message: '',
      gameOver: false,
      animation: null,
      animationTimer: null,
      // Dimensiones del juego
      width: 0,
      height: 0,
      battleHeight: 0,
      menuHeight: 0,
      scale: 1,
      offsetX: 0 // Para centrar cuando el canvas es más ancho que 900px
    };
    
    // === SISTEMA DE LAYOUT RESPONSIVO ===
    
    function updateLayout() {
      // Limitar el ancho máximo a 900px para evitar deformaciones
      game.width = Math.min(canvas.width, 900);
      game.height = canvas.height;
      
      // Si el canvas es más ancho que 900px, centrar el juego
      if (canvas.width > 900) {
        game.offsetX = (canvas.width - 900) / 2;
      } else {
        game.offsetX = 0;
      }
      
      // División vertical: 65% batalla, 35% menú
      game.battleHeight = Math.floor(game.height * 0.65);
      game.menuHeight = game.height - game.battleHeight;
      
      // Calcular escala para los elementos
      game.scale = Math.min(game.width / 400, game.height / 700);
      game.scale = Math.max(0.8, Math.min(1.5, game.scale)); // Limitar escala
    }
    
    // === CONTROLES ===
    
    function handleTouch(e) {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      if (e.touches && e.touches.length > 0) {
        const x = e.touches[0].clientX - rect.left;
        const y = e.touches[0].clientY - rect.top;
        
        // Escalar coordenadas
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        handleClick(x * scaleX, y * scaleY);
      }
    }
    
    function handleMouseClick(e) {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Escalar coordenadas
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      
      handleClick(x * scaleX, y * scaleY);
    }
    
    function handleClick(x, y) {
      if (game.gameOver) return;
      
      // Ajustar coordenadas por el offset si existe
      const adjustedX = x - game.offsetX;
      
      // Solo procesamos clicks en el área del menú
      if (y < game.battleHeight) return;
      
      const menuY = y - game.battleHeight;
      
      if (game.state === 'menu') {
        // Layout 2x2 para las opciones del menú - CORREGIDO
        const buttonWidth = (game.width - 30) / 2;
        const buttonHeight = (game.menuHeight - 80) / 2;
        const buttonsY = 70; // Posición relativa desde el inicio del menú
        
        if (menuY > buttonsY) {
          // Calcular qué botón fue clickeado
          const relY = menuY - buttonsY;
          const row = Math.floor(relY / (buttonHeight + 5));
          const col = adjustedX < game.width / 2 ? 0 : 1;
          
          const optionIndex = row * 2 + col;
          
          if (optionIndex >= 0 && optionIndex < 4) {
            game.selectedOption = optionIndex;
            selectMenuOption();
          }
        }
      } else if (game.state === 'selectMove') {
        // Layout 2x2 para movimientos
        const buttonWidth = (game.width - 30) / 2;
        const buttonHeight = (game.menuHeight - 40) / 2;
        const buttonsY = 20;
        
        if (menuY > buttonsY) {
          const relY = menuY - buttonsY;
          const row = Math.floor(relY / (buttonHeight + 5));
          const col = adjustedX < game.width / 2 ? 0 : 1;
          
          const moveIndex = row * 2 + col;
          if (moveIndex >= 0 && moveIndex < 4) {
            useMove(moveIndex);
          }
        }
      } else if (game.state === 'showingItems') {
        // Click en items - con scroll
        const itemHeight = 30;
        const startY = 50;
        const visibleItems = 5; // Mostrar solo 5 items a la vez
        
        if (menuY > startY && menuY < startY + visibleItems * itemHeight) {
          const itemIndex = Math.floor((menuY - startY) / itemHeight) + game.scrollOffset;
          if (itemIndex >= 0 && itemIndex < game.player.items.length) {
            useItem(itemIndex);
          }
        } else if (menuY > startY + visibleItems * itemHeight + 10) {
          // Scroll o volver
          if (game.scrollOffset > 0 && menuY < startY + visibleItems * itemHeight + 35) {
            // Scroll arriba
            game.scrollOffset = Math.max(0, game.scrollOffset - 1);
          } else if (menuY < startY + visibleItems * itemHeight + 65) {
            // Volver
            game.state = 'menu';
            game.scrollOffset = 0;
          } else if (game.scrollOffset < game.player.items.length - visibleItems) {
            // Scroll abajo
            game.scrollOffset = Math.min(game.player.items.length - visibleItems, game.scrollOffset + 1);
          }
        }
      } else if (game.state === 'confirmRun') {
        // Confirmar huida
        const buttonWidth = (game.width - 60) / 2;
        const buttonY = 80;
        
        if (menuY > buttonY && menuY < buttonY + 50) {
          if (adjustedX < game.width / 2) {
            // Sí, huir
            forfeitBattle();
          } else {
            // No, volver al menú
            game.state = 'menu';
            game.message = '';
          }
        }
      } else if (game.state === 'statUpgrade') {
        // Botones de mejora de stats
        const buttonHeight = (game.menuHeight - 80) / 3;
        const buttonsY = 70;
        
        if (menuY > buttonsY && menuY < buttonsY + buttonHeight) {
          applyStatUpgrade(0); // HP
        } else if (menuY > buttonsY + buttonHeight && menuY < buttonsY + buttonHeight * 2) {
          applyStatUpgrade(1); // Attack
        } else if (menuY > buttonsY + buttonHeight * 2) {
          // Continuar
          game.state = 'menu';
          game.message = '';
        }
      }
    }
    
    // === LÓGICA DEL JUEGO ===
    
    function selectMenuOption() {
      // Si el jugador está dormido, no puede hacer nada
      if (game.player.sleepTurns > 0) {
        game.player.sleepTurns--;
        game.message = `¡Estás dormido! ${game.player.sleepTurns > 0 ? `Te quedan ${game.player.sleepTurns} turnos dormido.` : '¡Te despertaste!'}`;
        game.state = 'message';
        setTimeout(() => {
          bossAttack();
        }, 3500);
        return;
      }
      
      switch(game.selectedOption) {
        case 0: // FIGHT
          game.state = 'selectMove';
          break;
        case 1: // CHIPOKOMON
          game.message = '¡Están todos dormidos! ¡Estás por tu cuenta!';
          game.state = 'message';
          setTimeout(() => {
            game.state = 'menu';
            game.message = '';
          }, 3500);
          break;
        case 2: // BAG
          game.state = 'showingItems';
          game.selectedItem = 0;
          game.scrollOffset = 0;
          break;
        case 3: // RUN
          game.state = 'confirmRun';
          game.message = '¿Estás seguro de querer huir?';
          break;
      }
    }
    
    function useItem(itemIndex) {
      const item = game.player.items[itemIndex];
      game.state = 'message';
      let skipTurn = true;
      
      switch(item.effect) {
        case 'damage':
          game.player.hp = Math.max(0, game.player.hp - item.value);
          game.message = `Usaste ${item.name}... ¡Te bajó ${item.value} HP! ${item.message}`;
          if (game.player.hp <= 0) {
            game.gameOver = true;
            endBossGame(false);
            return;
          }
          break;
          
        case 'heal':
          const healAmount = Math.min(item.value, game.player.maxHp - game.player.hp);
          game.player.hp = Math.min(game.player.maxHp, game.player.hp + item.value);
          game.message = `Usaste ${item.name}... ¡Recuperaste ${healAmount} HP! ${item.message}`;
          break;
          
        case 'fullHeal':
          game.player.hp = game.player.maxHp;
          game.message = `Usaste ${item.name}... ${item.message}`;
          break;
          
        case 'attackUp':
          game.player.attackBonus = item.value;
          game.message = `Usaste ${item.name}... ${item.message}`;
          break;
          
        case 'attackDown':
          game.player.attackBonus = item.value;
          game.message = `Usaste ${item.name}... ${item.message}`;
          break;
          
        case 'defenseUp':
          game.player.defense = item.value;
          game.message = `Usaste ${item.name}... ${item.message}`;
          break;
          
        case 'defenseDown':
          game.player.defense = item.value;
          game.message = `Usaste ${item.name}... ${item.message}`;
          break;
          
        case 'sleep':
          game.player.sleepTurns = item.value;
          game.message = `Usaste ${item.name}... ${item.message}`;
          break;
          
        case 'randomEffect':
          const effects = ['heal', 'damage', 'attackUp', 'defenseUp'];
          const randomEffect = effects[Math.floor(Math.random() * effects.length)];
          if (randomEffect === 'heal') {
            game.player.hp = Math.min(game.player.maxHp, game.player.hp + 30);
            game.message = `${item.message} ¡Te curaste 30 HP!`;
          } else if (randomEffect === 'damage') {
            game.player.hp = Math.max(0, game.player.hp - 15);
            game.message = `${item.message} ¡Te dañaste 15 HP!`;
          } else if (randomEffect === 'attackUp') {
            game.player.attackBonus = 1.3;
            game.message = `${item.message} ¡Tu ataque subió!`;
          } else {
            game.player.defense = 1.3;
            game.message = `${item.message} ¡Tu defensa subió!`;
          }
          break;
          
        default:
          game.message = `Usaste ${item.name}... ${item.message}`;
          break;
      }
      
      // Quitar el item usado (solo se puede usar una vez)
      game.player.items.splice(itemIndex, 1);
      
      setTimeout(() => {
        if (!game.gameOver && skipTurn) bossAttack();
      }, 4000); // Más tiempo para leer
    }
    
    function forfeitBattle() {
      game.gameOver = true;
      endBossGame(false);
    }
    
    function applyStatUpgrade(stat) {
      if (game.player.expPoints < 5) return;
      
      if (stat === 0) {
        game.player.maxHp += 20;
        game.player.hp = game.player.maxHp;
        game.player.expPoints -= 5;
        game.message = `¡HP aumentado! Quedan ${game.player.expPoints} puntos`;
      } else {
        game.player.attack += 10;
        game.player.expPoints -= 5;
        game.message = `¡Ataque aumentado! Quedan ${game.player.expPoints} puntos`;
      }
      
      if (game.player.expPoints === 0) {
        setTimeout(() => {
          game.state = 'menu';
          game.message = '';
        }, 3500);
      }
    }
    
    function useMove(moveIndex) {
      // Si está dormido no puede atacar
      if (game.player.sleepTurns > 0) {
        game.player.sleepTurns--;
        game.message = `¡Estás dormido! ${game.player.sleepTurns > 0 ? `Te quedan ${game.player.sleepTurns} turnos dormido.` : '¡Te despertaste!'}`;
        game.state = 'message';
        setTimeout(() => {
          bossAttack();
        }, 3500);
        return;
      }
      
      const move = game.player.moves[moveIndex];
      if (!move || move.pp <= 0) {
        game.message = '¡No quedan PP!';
        game.state = 'message';
        setTimeout(() => game.state = 'selectMove', 2000);
        return;
      }
      
      move.pp--;
      game.player.defending = move.isDefense || false;
      
      // Activar animación
      game.animation = move.animation;
      game.animationTimer = Date.now();
      
      if (!move.isDefense) {
        const damage = Math.floor(move.power * game.player.attackBonus * (1 + Math.random() * 0.5) / (handicap.bossSpeed || 1));
        
        // Retrasar el daño para sincronizar con la animación
        setTimeout(() => {
          game.boss.hp = Math.max(0, game.boss.hp - damage);
          game.message = `¡${move.name} causó ${damage} de daño!`;
          
          if (game.boss.hp <= 0) {
            game.gameOver = true;
            endBossGame(true);
            return;
          }
        }, 500);
      } else {
        game.message = `¡${game.player.name} usó ${move.name}! ¡Está defendiendo!`;
      }
      
      game.state = 'message';
      
      setTimeout(() => {
        if (!game.gameOver) bossAttack();
      }, 3500); // Más tiempo para leer
    }
    
    function bossAttack() {
      const moves = ['Shinra Tensei', 'Getsuga Tenshou', 'Gear Second', 'Chidori'];
      const move = moves[Math.floor(Math.random() * moves.length)];
      const baseDamage = 5 + Math.random() * 5;
      const defenseMod = game.player.defending ? 0.3 : game.player.defense;
      const damage = Math.floor(baseDamage * (handicap.bossSpeed || 1) / defenseMod);
      
      // Animación de ataque del boss
      game.animation = 'bossAttack';
      game.animationTimer = Date.now();
      
      setTimeout(() => {
        game.player.hp = Math.max(0, game.player.hp - damage);
        game.message = `¡${game.boss.name} usó ${move}! ¡${damage} de daño!`;
        
        if (game.player.hp <= 0) {
          game.gameOver = true;
          endBossGame(false);
          return;
        }
        
        game.player.defending = false;
        game.animation = null;
        setTimeout(() => {
          game.state = 'menu';
          game.message = '';
        }, 3000);
      }, 500);
    }
    
    function endBossGame(won) {
      if (window.bossGameState && window.bossGameState.animationId) {
        cancelAnimationFrame(window.bossGameState.animationId);
      }
      
      const message = won ? '🎉 ¡VICTORIA! 🎉' : '💀 DERROTA 💀';
      game.message = message;
      
      setTimeout(() => {
        if (window.bossGameState && window.bossGameState.callback) {
          window.bossGameState.callback(won);
        }
      }, 3000);
    }
    
    // === RENDERIZADO ===
    
    function draw() {
      if (!canvas || !ctx) return;
      
      // Limpiar canvas completo
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Fondo negro para las barras laterales si el canvas es más ancho
      if (game.offsetX > 0) {
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      
      // Aplicar offset para centrar el juego
      ctx.save();
      ctx.translate(game.offsetX, 0);
      
      // === ÁREA DE BATALLA (65% superior) ===
      
      // Fondo de batalla con patrón pixel art
      const gradient = ctx.createLinearGradient(0, 0, 0, game.battleHeight);
      gradient.addColorStop(0, '#87CEEB');
      gradient.addColorStop(0.3, '#98FB98');
      gradient.addColorStop(0.7, '#90EE90');
      gradient.addColorStop(1, '#7CFC00');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, game.width, game.battleHeight);
      
      // Patrón de píxeles para el fondo
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      for (let x = 0; x < game.width; x += 20) {
        for (let y = 0; y < game.battleHeight; y += 20) {
          if ((x + y) % 40 === 0) {
            ctx.fillRect(x, y, 10, 10);
          }
        }
      }
      
      // Posiciones ajustadas - jugador abajo izquierda, enemigo arriba derecha
      const playerX = game.width * 0.25;
      const playerY = game.battleHeight * 0.70; // Más abajo
      const enemyX = game.width * 0.75;
      const enemyY = game.battleHeight * 0.30; // Más arriba
      
      // Plataformas/sombras estilo pixel art
      ctx.fillStyle = '#4a7c59';
      // Plataforma enemigo
      ctx.fillRect(enemyX - 85, enemyY + 65, 170, 10);
      ctx.fillStyle = '#5a8d69';
      ctx.fillRect(enemyX - 80, enemyY + 70, 160, 8);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(enemyX - 75, enemyY + 75, 150, 5);
      
      // Plataforma jugador
      ctx.fillStyle = '#4a7c59';
      ctx.fillRect(playerX - 85, playerY + 65, 170, 10);
      ctx.fillStyle = '#5a8d69';
      ctx.fillRect(playerX - 80, playerY + 70, 160, 8);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(playerX - 75, playerY + 75, 150, 5);
      
      // Dibujar enemigo PRIMERO (para que los ataques pasen por delante)
      const enemySize = 140 * game.scale;
      if (bossImageLoaded) {
        ctx.drawImage(bossImage, enemyX - enemySize/2, enemyY - enemySize/2, enemySize, enemySize);
      } else {
        // Dibujo del jefe más grande
        ctx.fillStyle = '#8B0000';
        ctx.fillRect(enemyX - 60, enemyY - 60, 120, 120);
        // Cuernos
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.moveTo(enemyX - 55, enemyY - 60);
        ctx.lineTo(enemyX - 65, enemyY - 80);
        ctx.lineTo(enemyX - 45, enemyY - 60);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(enemyX + 55, enemyY - 60);
        ctx.lineTo(enemyX + 65, enemyY - 80);
        ctx.lineTo(enemyX + 45, enemyY - 60);
        ctx.fill();
      }
      
      // === ANIMACIONES DE ATAQUES (DETRÁS DEL JUGADOR, DELANTE DEL ENEMIGO) ===
      if (game.animation && game.animation !== 'bossAttack' && game.animation !== 'shield') {
        const elapsed = Date.now() - game.animationTimer;
        const progress = Math.min(elapsed / 600, 1);
        
        ctx.save(); // Guardar estado para las animaciones
        
        if (game.animation === 'beam') {
          // Kamehameha - desde el centro del personaje
          const startX = playerX;
          const startY = playerY;
          
          if (progress < 0.3) {
            // Carga de energía detrás del personaje
            const chargeSize = progress * 150;
            ctx.globalAlpha = 0.8;
            ctx.fillStyle = '#00BFFF';
            ctx.beginPath();
            ctx.arc(startX, startY, chargeSize, 0, Math.PI * 2);
            ctx.fill();
          } else {
            // Disparo del rayo
            const beamEndX = startX + (enemyX - startX) * ((progress - 0.3) / 0.7);
            const beamEndY = startY + (enemyY - startY) * ((progress - 0.3) / 0.7);
            
            ctx.strokeStyle = '#00BFFF';
            ctx.lineWidth = 25 + Math.sin(elapsed / 50) * 5;
            ctx.shadowColor = '#00BFFF';
            ctx.shadowBlur = 20;
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(beamEndX, beamEndY);
            ctx.stroke();
          }
        } else if (game.animation === 'punch') {
          // Gomu Gomu Pistol
          const startX = playerX;
          const startY = playerY;
          const punchX = startX + (enemyX - startX) * progress;
          const punchY = startY + (enemyY - startY) * progress;
          
          ctx.fillStyle = '#FFA500';
          ctx.beginPath();
          ctx.arc(punchX, punchY, 30, 0, Math.PI * 2);
          ctx.fill();
          
          // Línea del brazo
          ctx.strokeStyle = '#FFA500';
          ctx.lineWidth = 20;
          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.lineTo(punchX, punchY);
          ctx.stroke();
        } else if (game.animation === 'spiral') {
          // Rasengan
          const startX = playerX;
          const startY = playerY;
          const spiralX = startX + (enemyX - startX) * progress;
          const spiralY = startY + (enemyY - startY) * progress;
          
          // Espiral rotatorio
          for (let i = 0; i < 8; i++) {
            const angle = (elapsed / 100) + (i * Math.PI / 4);
            const x = spiralX + Math.cos(angle) * 35;
            const y = spiralY + Math.sin(angle) * 35;
            
            ctx.fillStyle = `rgba(100, 200, 255, ${0.8 - i * 0.1})`;
            ctx.beginPath();
            ctx.arc(x, y, 20 - i * 2, 0, Math.PI * 2);
            ctx.fill();
          }
          
          // Centro brillante
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.beginPath();
          ctx.arc(spiralX, spiralY, 15, 0, Math.PI * 2);
          ctx.fill();
        }
        
        ctx.restore(); // Restaurar estado después de las animaciones
      }
      
      // Dibujar jugador AL FINAL (para que esté delante de los ataques que salen de él)
      const playerSize = 170 * game.scale; // Aumentado más
      if (battleAvatarLoaded) {
        // Dibujar el cuerpo del avatar
        ctx.drawImage(battleAvatar, playerX - playerSize/2, playerY - playerSize/2, playerSize, playerSize);
        
        // Dibujar avatar de Google en el hueco de la cabeza
        const headHoleSize = 42 * game.scale; // Tamaño del hueco aumentado
        const headHoleX = playerX;
        const headHoleY = playerY - playerSize/2 + 42 * game.scale;
        
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
          ctx.fillStyle = '#000';
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
      } else {
        // Avatar más grande sin imagen
        ctx.fillStyle = '#F0F0F0';
        ctx.fillRect(playerX - 70, playerY - 70, 140, 140);
      }
      
      // Animación de escudo (encima del jugador)
      if (game.animation === 'shield') {
        const elapsed = Date.now() - game.animationTimer;
        ctx.save();
        ctx.strokeStyle = 'rgba(0, 255, 0, 0.6)';
        ctx.lineWidth = 4;
        const shieldRadius = 70 + Math.sin(elapsed / 100) * 5;
        ctx.beginPath();
        ctx.arc(playerX, playerY, shieldRadius, 0, Math.PI * 2);
        ctx.stroke();
        
        // Hexágonos del escudo
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI * 2 / 6) * i + (elapsed / 200);
          const x = playerX + Math.cos(angle) * shieldRadius;
          const y = playerY + Math.sin(angle) * shieldRadius;
          ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
          ctx.beginPath();
          ctx.arc(x, y, 12, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
      
      // Animación de ataque del boss (encima de todo)
      if (game.animation === 'bossAttack') {
        const elapsed = Date.now() - game.animationTimer;
        const shakeX = Math.sin(elapsed / 50) * 5;
        const shakeY = Math.cos(elapsed / 50) * 3;
        
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
        ctx.lineWidth = 3;
        ctx.shadowColor = 'rgba(255, 0, 0, 0.8)';
        ctx.shadowBlur = 20 + Math.sin(elapsed / 100) * 10;
        
        // Líneas de energía desde el boss al jugador
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.moveTo(enemyX + shakeX, enemyY + shakeY);
          ctx.lineTo(playerX + Math.random() * 20 - 10, playerY + Math.random() * 20 - 10);
          ctx.stroke();
        }
        ctx.restore();
      }
      
      // === HUD DEL ENEMIGO (arriba a la izquierda) - ESTILO PIXEL ART ===
      const enemyHudX = 20;
      const enemyHudY = 20;
      const hudWidth = Math.min(game.width * 0.45, 300);
      
      // Sombra del HUD
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(enemyHudX + 3, enemyHudY + 3, hudWidth, 70);
      
      // Fondo del HUD con gradiente
      const hudGradient = ctx.createLinearGradient(enemyHudX, enemyHudY, enemyHudX, enemyHudY + 70);
      hudGradient.addColorStop(0, '#FFF8DC');
      hudGradient.addColorStop(1, '#F0E68C');
      ctx.fillStyle = hudGradient;
      ctx.fillRect(enemyHudX, enemyHudY, hudWidth, 70);
      
      // Borde pixelado
      ctx.strokeStyle = '#4B0082';
      ctx.lineWidth = 4;
      ctx.strokeRect(enemyHudX, enemyHudY, hudWidth, 70);
      ctx.strokeStyle = '#8B008B';
      ctx.lineWidth = 2;
      ctx.strokeRect(enemyHudX + 2, enemyHudY + 2, hudWidth - 4, 66);
      
      ctx.fillStyle = '#000';
      ctx.font = `bold ${16 * game.scale}px monospace`;
      ctx.fillText(game.boss.species + '♂', enemyHudX + 15, enemyHudY + 25);
      ctx.textAlign = 'right';
      ctx.fillText(`Lv${game.boss.level}`, enemyHudX + hudWidth - 15, enemyHudY + 25);
      ctx.textAlign = 'left';
      
      // Barra HP del enemigo con estilo pixel
      const hpBarWidth = hudWidth - 80;
      // Fondo de la barra
      ctx.fillStyle = '#2F4F4F';
      ctx.fillRect(enemyHudX + 48, enemyHudY + 33, hpBarWidth + 4, 20);
      ctx.fillStyle = '#000';
      ctx.fillRect(enemyHudX + 50, enemyHudY + 35, hpBarWidth, 16);
      
      const hpRatio = game.boss.hp / game.boss.maxHp;
      // Colores vibrantes para la HP
      const hpColor = hpRatio > 0.5 ? '#00FF00' : hpRatio > 0.2 ? '#FFD700' : '#FF1493';
      ctx.fillStyle = hpColor;
      // Efecto de píxeles en la barra
      for (let i = 0; i < (hpBarWidth - 4) * hpRatio; i += 3) {
        ctx.fillRect(enemyHudX + 52 + i, enemyHudY + 37, 2, 12);
      }
      
      ctx.fillStyle = '#000';
      ctx.font = `bold ${12 * game.scale}px monospace`;
      ctx.fillText('HP', enemyHudX + 15, enemyHudY + 45);
      
      // === HUD DEL JUGADOR (abajo a la derecha) - ESTILO PIXEL ART ===
      const playerHudX = game.width - hudWidth - 20;
      const playerHudY = game.battleHeight - 100;
      
      // Sombra del HUD
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(playerHudX + 3, playerHudY + 3, hudWidth, 85);
      
      // Fondo del HUD con gradiente
      const playerHudGradient = ctx.createLinearGradient(playerHudX, playerHudY, playerHudX, playerHudY + 85);
      playerHudGradient.addColorStop(0, '#E0FFFF');
      playerHudGradient.addColorStop(1, '#B0E0E6');
      ctx.fillStyle = playerHudGradient;
      ctx.fillRect(playerHudX, playerHudY, hudWidth, 85);
      
      // Borde pixelado
      ctx.strokeStyle = '#FF1493';
      ctx.lineWidth = 4;
      ctx.strokeRect(playerHudX, playerHudY, hudWidth, 85);
      ctx.strokeStyle = '#FF69B4';
      ctx.lineWidth = 2;
      ctx.strokeRect(playerHudX + 2, playerHudY + 2, hudWidth - 4, 81);
      
      // Indicadores de estado (ENCIMA del HUD)
      if (game.player.sleepTurns > 0) {
        ctx.fillStyle = '#9370DB';
        ctx.fillRect(playerHudX + 5, playerHudY - 20, 30, 18);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.strokeRect(playerHudX + 5, playerHudY - 20, 30, 18);
        ctx.fillStyle = '#FFF';
        ctx.font = `bold ${10 * game.scale}px monospace`;
        ctx.fillText('SLP', playerHudX + 10, playerHudY - 6);
      }
      if (game.player.attackBonus !== 1) {
        const xOffset = game.player.sleepTurns > 0 ? 40 : 5;
        ctx.fillStyle = game.player.attackBonus > 1 ? '#FF4500' : '#4169E1';
        ctx.fillRect(playerHudX + xOffset, playerHudY - 20, 35, 18);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.strokeRect(playerHudX + xOffset, playerHudY - 20, 35, 18);
        ctx.fillStyle = '#FFF';
        ctx.font = `bold ${10 * game.scale}px monospace`;
        ctx.fillText(game.player.attackBonus > 1 ? 'ATK↑' : 'ATK↓', playerHudX + xOffset + 3, playerHudY - 6);
      }
      if (game.player.defense !== 1) {
        let xOffset = 5;
        if (game.player.sleepTurns > 0) xOffset += 35;
        if (game.player.attackBonus !== 1) xOffset += 35;
        ctx.fillStyle = game.player.defense > 1 ? '#32CD32' : '#DC143C';
        ctx.fillRect(playerHudX + xOffset, playerHudY - 20, 35, 18);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.strokeRect(playerHudX + xOffset, playerHudY - 20, 35, 18);
        ctx.fillStyle = '#FFF';
        ctx.font = `bold ${10 * game.scale}px monospace`;
        ctx.fillText(game.player.defense > 1 ? 'DEF↑' : 'DEF↓', playerHudX + xOffset + 3, playerHudY - 6);
      }
      
      ctx.fillStyle = '#000';
      ctx.font = `bold ${16 * game.scale}px monospace`;
      ctx.fillText(game.player.name.toUpperCase(), playerHudX + 15, playerHudY + 25);
      ctx.textAlign = 'right';
      ctx.fillText(`Lv${game.player.level}`, playerHudX + hudWidth - 15, playerHudY + 25);
      ctx.textAlign = 'left';
      
      // Barra HP del jugador con estilo pixel
      ctx.fillStyle = '#2F4F4F';
      ctx.fillRect(playerHudX + 48, playerHudY + 33, hpBarWidth + 4, 20);
      ctx.fillStyle = '#000';
      ctx.fillRect(playerHudX + 50, playerHudY + 35, hpBarWidth, 16);
      
      const playerHpRatio = game.player.hp / game.player.maxHp;
      const playerHpColor = playerHpRatio > 0.5 ? '#00FF00' : playerHpRatio > 0.2 ? '#FFD700' : '#FF1493';
      ctx.fillStyle = playerHpColor;
      // Efecto de píxeles en la barra
      for (let i = 0; i < (hpBarWidth - 4) * playerHpRatio; i += 3) {
        ctx.fillRect(playerHudX + 52 + i, playerHudY + 37, 2, 12);
      }
      
      ctx.fillStyle = '#000';
      ctx.font = `${12 * game.scale}px monospace`;
      ctx.fillText('HP', playerHudX + 15, playerHudY + 45);
      ctx.fillText(`${game.player.hp}/${game.player.maxHp}`, playerHudX + hudWidth - 80, playerHudY + 45);
      
      // Barra EXP con estilo pixel
      ctx.fillStyle = '#2F4F4F';
      ctx.fillRect(playerHudX + 48, playerHudY + 56, hpBarWidth + 4, 10);
      ctx.fillStyle = '#000';
      ctx.fillRect(playerHudX + 50, playerHudY + 58, hpBarWidth, 8);
      ctx.fillStyle = '#00CED1';
      // Efecto de píxeles en la barra
      for (let i = 0; i < (hpBarWidth - 4) * (game.player.exp / 100); i += 3) {
        ctx.fillRect(playerHudX + 52 + i, playerHudY + 60, 2, 4);
      }
      ctx.fillText('EXP', playerHudX + 15, playerHudY + 67);
      
      // === ÁREA DE MENÚ (35% inferior) - ESTILO PIXEL ART ===
      
      // Fondo del menú con gradiente y patrón
      const menuGradient = ctx.createLinearGradient(0, game.battleHeight, 0, game.height);
      menuGradient.addColorStop(0, '#2C3E50');
      menuGradient.addColorStop(0.5, '#34495E');
      menuGradient.addColorStop(1, '#2C3E50');
      ctx.fillStyle = menuGradient;
      ctx.fillRect(0, game.battleHeight, game.width, game.menuHeight);
      
      // Patrón de píxeles
      ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
      for (let x = 0; x < game.width; x += 15) {
        for (let y = game.battleHeight; y < game.height; y += 15) {
          if ((x + y) % 30 === 0) {
            ctx.fillRect(x, y, 8, 8);
          }
        }
      }
      
      // Borde superior del menú
      ctx.fillStyle = '#FF6347';
      ctx.fillRect(0, game.battleHeight, game.width, 4);
      ctx.fillStyle = '#FF7F50';
      ctx.fillRect(0, game.battleHeight + 4, game.width, 2);
      
      const menuStartY = game.battleHeight;
      
      if (game.state === 'menu') {
        // Texto de pregunta con sombra
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.font = `bold ${22 * game.scale}px monospace`;
        ctx.fillText('¿Qué debería', 22, menuStartY + 37);
        ctx.fillText(`${game.player.name} hacer?`, 22, menuStartY + 62);
        
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText('¿Qué debería', 20, menuStartY + 35);
        ctx.fillText(`${game.player.name} hacer?`, 20, menuStartY + 60);
        
        // Botones 2x2
        const buttonWidth = (game.width - 30) / 2;
        const buttonHeight = (game.menuHeight - 80) / 2;
        const buttonsY = menuStartY + 70;
        
        const buttons = [
          { x: 10, y: buttonsY, text: 'ATACAR' },
          { x: game.width / 2 + 5, y: buttonsY, text: 'CHIPOKOMON' },
          { x: 10, y: buttonsY + buttonHeight + 5, text: 'BOLSA' },
          { x: game.width / 2 + 5, y: buttonsY + buttonHeight + 5, text: 'CORRER' }
        ];
        
        buttons.forEach((btn, i) => {
          // Sombra del botón
          ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
          ctx.fillRect(btn.x + 3, btn.y + 3, buttonWidth, buttonHeight);
          
          // Fondo del botón con gradiente
          const btnGradient = ctx.createLinearGradient(btn.x, btn.y, btn.x, btn.y + buttonHeight);
          if (i === game.selectedOption) {
            btnGradient.addColorStop(0, '#FF69B4');
            btnGradient.addColorStop(1, '#FF1493');
          } else {
            btnGradient.addColorStop(0, '#4169E1');
            btnGradient.addColorStop(1, '#1E90FF');
          }
          ctx.fillStyle = btnGradient;
          ctx.fillRect(btn.x, btn.y, buttonWidth, buttonHeight);
          
          // Borde pixelado
          ctx.strokeStyle = i === game.selectedOption ? '#FFD700' : '#00CED1';
          ctx.lineWidth = i === game.selectedOption ? 4 : 2;
          ctx.strokeRect(btn.x, btn.y, buttonWidth, buttonHeight);
          
          // Decoración de esquinas
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(btn.x + 2, btn.y + 2, 4, 4);
          ctx.fillRect(btn.x + buttonWidth - 6, btn.y + 2, 4, 4);
          ctx.fillRect(btn.x + 2, btn.y + buttonHeight - 6, 4, 4);
          ctx.fillRect(btn.x + buttonWidth - 6, btn.y + buttonHeight - 6, 4, 4);
          
          // Texto del botón con sombra
          ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
          ctx.font = `bold ${20 * game.scale}px monospace`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(btn.text, btn.x + buttonWidth / 2 + 2, btn.y + buttonHeight / 2 + 2);
          
          ctx.fillStyle = '#FFFFFF';
          ctx.fillText(btn.text, btn.x + buttonWidth / 2, btn.y + buttonHeight / 2);
        });
        
      } else if (game.state === 'selectMove') {
        // Mostrar movimientos
        const buttonWidth = (game.width - 30) / 2;
        const buttonHeight = (game.menuHeight - 40) / 2;
        const buttonsY = menuStartY + 20;
        
        game.player.moves.forEach((move, i) => {
          const x = i % 2 === 0 ? 10 : game.width / 2 + 5;
          const y = buttonsY + Math.floor(i / 2) * (buttonHeight + 5);
          
          ctx.fillStyle = move.pp > 0 ? '#FFFFFF' : '#CCCCCC';
          ctx.fillRect(x, y, buttonWidth, buttonHeight);
          
          ctx.strokeStyle = '#000';
          ctx.lineWidth = 2;
          ctx.strokeRect(x, y, buttonWidth, buttonHeight);
          
          ctx.fillStyle = move.pp > 0 ? '#000' : '#666';
          ctx.font = `bold ${16 * game.scale}px monospace`;
          ctx.textAlign = 'center';
          ctx.fillText(move.name, x + buttonWidth / 2, y + buttonHeight / 2 - 12);
          
          ctx.font = `${14 * game.scale}px monospace`;
          ctx.fillText(`PP ${move.pp}/${move.maxPp}`, x + buttonWidth / 2, y + buttonHeight / 2 + 12);
        });
        
      } else if (game.state === 'showingItems') {
        // Mostrar items con scroll
        ctx.fillStyle = '#000';
        ctx.font = `bold ${18 * game.scale}px monospace`;
        ctx.textAlign = 'left';
        ctx.fillText('Tu Bolsa de Otaku:', 20, menuStartY + 35);
        
        const itemHeight = 30;
        const startY = menuStartY + 50;
        const visibleItems = 5;
        
        // Mostrar solo items visibles
        for (let i = 0; i < Math.min(visibleItems, game.player.items.length - game.scrollOffset); i++) {
          const itemIndex = i + game.scrollOffset;
          const item = game.player.items[itemIndex];
          const y = startY + i * itemHeight;
          
          if (itemIndex === game.selectedItem) {
            ctx.fillStyle = '#FFE4E1';
            ctx.fillRect(10, y - 5, game.width - 20, itemHeight - 2);
          }
          
          ctx.fillStyle = '#000';
          ctx.font = `${16 * game.scale}px monospace`;
          ctx.fillText(item.name, 20, y + 15);
        }
        
        // Botones de navegación
        const navY = startY + visibleItems * itemHeight + 10;
        
        // Indicador de más items arriba
        if (game.scrollOffset > 0) {
          ctx.fillStyle = '#FFE4E1';
          ctx.fillRect(10, navY, game.width - 20, 25);
          ctx.strokeStyle = '#000';
          ctx.lineWidth = 2;
          ctx.strokeRect(10, navY, game.width - 20, 25);
          ctx.fillStyle = '#000';
          ctx.font = `bold ${14 * game.scale}px monospace`;
          ctx.textAlign = 'center';
          ctx.fillText('↑ Más items arriba ↑', game.width/2, navY + 17);
        }
        
        // Botón volver
        const backY = navY + (game.scrollOffset > 0 ? 30 : 0);
        ctx.fillStyle = '#F0F0F0';
        ctx.fillRect(10, backY, game.width - 20, 30);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeRect(10, backY, game.width - 20, 30);
        ctx.fillStyle = '#000';
        ctx.font = `bold ${16 * game.scale}px monospace`;
        ctx.textAlign = 'center';
        ctx.fillText('← VOLVER AL MENÚ', game.width/2, backY + 20);
        
        // Indicador de más items abajo
        if (game.scrollOffset < game.player.items.length - visibleItems) {
          const moreY = backY + 35;
          ctx.fillStyle = '#FFE4E1';
          ctx.fillRect(10, moreY, game.width - 20, 25);
          ctx.strokeStyle = '#000';
          ctx.lineWidth = 2;
          ctx.strokeRect(10, moreY, game.width - 20, 25);
          ctx.fillStyle = '#000';
          ctx.font = `bold ${14 * game.scale}px monospace`;
          ctx.fillText('↓ Más items abajo ↓', game.width/2, moreY + 17);
        }
        
      } else if (game.state === 'confirmRun') {
        // Confirmar huida
        ctx.fillStyle = '#000';
        ctx.font = `bold ${20 * game.scale}px monospace`;
        ctx.textAlign = 'center';
        ctx.fillText('¿Estás seguro de querer huir?', game.width / 2, menuStartY + 50);
        
        const buttonWidth = (game.width - 60) / 2;
        const buttonY = menuStartY + 80;
        
        // Botón SÍ
        ctx.fillStyle = '#FFE4E1';
        ctx.fillRect(20, buttonY, buttonWidth, 50);
        ctx.strokeStyle = '#F85050';
        ctx.lineWidth = 3;
        ctx.strokeRect(20, buttonY, buttonWidth, 50);
        ctx.fillStyle = '#000';
        ctx.font = `bold ${18 * game.scale}px monospace`;
        ctx.fillText('SÍ, HUIR', 20 + buttonWidth / 2, buttonY + 30);
        
        // Botón NO
        ctx.fillStyle = '#E8F5E9';
        ctx.fillRect(40 + buttonWidth, buttonY, buttonWidth, 50);
        ctx.strokeStyle = '#4CAF50';
        ctx.lineWidth = 3;
        ctx.strokeRect(40 + buttonWidth, buttonY, buttonWidth, 50);
        ctx.fillStyle = '#000';
        ctx.fillText('NO, QUEDARME', 40 + buttonWidth + buttonWidth / 2, buttonY + 30);
        
      } else if (game.state === 'statUpgrade' && game.player.expPoints > 0) {
        // Menú de mejora de stats
        ctx.fillStyle = '#000';
        ctx.font = `bold ${18 * game.scale}px monospace`;
        ctx.textAlign = 'left';
        ctx.fillText(`¡Contestaste bien ${game.player.correctAnswers} preguntas!`, 20, menuStartY + 30);
        ctx.fillText(`Ganaste ${game.player.expPoints} Skill Points para mejorar`, 20, menuStartY + 55);
        
        const buttonHeight = (game.menuHeight - 80) / 3;
        
        // Botón HP
        ctx.fillStyle = '#E8F5E9';
        ctx.fillRect(10, menuStartY + 70, game.width - 20, buttonHeight - 5);
        ctx.strokeRect(10, menuStartY + 70, game.width - 20, buttonHeight - 5);
        ctx.fillStyle = '#000';
        ctx.textAlign = 'center';
        ctx.fillText('Mejorar HP (+20) - 5 pts', game.width / 2, menuStartY + 70 + buttonHeight / 2);
        
        // Botón Attack
        ctx.fillStyle = '#FFEBEE';
        ctx.fillRect(10, menuStartY + 70 + buttonHeight, game.width - 20, buttonHeight - 5);
        ctx.strokeRect(10, menuStartY + 70 + buttonHeight, game.width - 20, buttonHeight - 5);
        ctx.fillStyle = '#000';
        ctx.fillText('Mejorar Ataque (+10) - 5 pts', game.width / 2, menuStartY + 70 + buttonHeight + buttonHeight / 2);
        
        // Botón Continuar
        ctx.fillStyle = '#F0F0F0';
        ctx.fillRect(10, menuStartY + 70 + buttonHeight * 2, game.width - 20, buttonHeight - 5);
        ctx.strokeRect(10, menuStartY + 70 + buttonHeight * 2, game.width - 20, buttonHeight - 5);
        ctx.fillStyle = '#000';
        ctx.fillText('Continuar sin mejorar →', game.width / 2, menuStartY + 70 + buttonHeight * 2 + buttonHeight / 2);
        
      } else if (game.state === 'message' || game.message) {
        // Mostrar mensaje
        ctx.fillStyle = '#000';
        ctx.font = `bold ${18 * game.scale}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const words = game.message.split(' ');
        let line = '';
        let y = menuStartY + game.menuHeight / 2 - 30;
        const maxWidth = game.width - 40;
        
        for (let n = 0; n < words.length; n++) {
          const testLine = line + words[n] + ' ';
          const metrics = ctx.measureText(testLine);
          const testWidth = metrics.width;
          
          if (testWidth > maxWidth && n > 0) {
            ctx.fillText(line, game.width / 2, y);
            line = words[n] + ' ';
            y += 25;
          } else {
            line = testLine;
          }
        }
        ctx.fillText(line, game.width / 2, y);
      }
      
      // Restaurar el contexto (importante para el offset)
      ctx.restore();
      
      // Reset text align
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      
      // Limpiar animación después de completarse
      if (game.animation && Date.now() - game.animationTimer > 1000) {
        if (game.animation !== 'bossAttack') {
          game.animation = null;
        }
      }
    }
    
    // === GAME LOOP ===
    
    function gameLoop() {
      draw();
      if (!game.gameOver) {
        window.bossGameState.animationId = requestAnimationFrame(gameLoop);
      }
    }
    
    // === INICIALIZACIÓN ===
    
    // Configurar canvas
    updateLayout();
    
    // Event listeners
    canvas.addEventListener('touchstart', handleTouch, { passive: false });
    canvas.addEventListener('click', handleMouseClick);
    
    // Listener de resize
    window.addEventListener('resize', () => {
      if (window.bossGameState && window.bossGameState.canvas) {
        window.bossGameState.canvas.width = window.innerWidth;
        window.bossGameState.canvas.height = window.innerHeight;
        updateLayout();
      }
    });
    
    // Iniciar con mejora de stats si hay puntos
    if (game.player.expPoints > 0) {
      game.state = 'statUpgrade';
    } else {
      game.state = 'menu';
    }
    
    // Iniciar game loop
    gameLoop();
  }
  
  // Reemplazar la función original en AdventureBosses si existe
  if (window.AdventureBosses) {
    const originalStartBossGame = window.AdventureBosses.startBossGame;
    
    window.AdventureBosses.startBossGame = function(regionKey, handicap, callback) {
      if (regionKey === 'anime') {
        // Configurar el boss game state
        const gameType = 'pokemon';
        
        window.bossGameState = {
          type: gameType,
          handicap: handicap,
          callback: callback,
          canvas: null,
          ctx: null,
          animationId: null
        };
        
        // Crear UI del boss game SIN botón de rendirse
        const container = document.getElementById('adventureGameArea');
        if (!container) {
          console.error('No se encontró adventureGameArea');
          return;
        }
        
        container.innerHTML = `
          <div class="boss-game-container" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 10000; background: #000;">
            <canvas id="bossGameCanvas" style="width: 100%; height: 100%; display: block;"></canvas>
          </div>
        `;
        
        window.bossGameState.canvas = document.getElementById('bossGameCanvas');
        if (!window.bossGameState.canvas) {
          console.error('No se pudo crear el canvas');
          return;
        }
        
        window.bossGameState.canvas.width = window.innerWidth;
        window.bossGameState.canvas.height = window.innerHeight;
        window.bossGameState.ctx = window.bossGameState.canvas.getContext('2d');
        
        // Usar la nueva función optimizada
        initAnimePokemonMobile(handicap);
      } else {
        // Para otros jefes, usar la función original
        originalStartBossGame.call(this, regionKey, handicap, callback);
      }
    };
  }
  
  console.log('✅ Batalla Pokemon Mobile v6 - Archivo reparado completamente');
  
})(window);
