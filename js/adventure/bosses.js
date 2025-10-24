// js/adventure_bosses.js - Mini-juegos de jefes mejorado
(function(window) {
  'use strict';

  const BOSS_GAMES = {
    science: 'snake',
    history: 'rpg',
    geography: 'hangman',
    sports: 'frogger',
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
    } else if (regionKey === 'history') {
      initHistoryTetris(handicap);
    } else if (regionKey === 'science') {
      initScienceCatch(handicap);
    } else if (regionKey === 'sports') {
      initSportsFrogger(handicap);
    } else if (regionKey === 'geography') {
      initGeographyHangman(handicap);
    } else {
      initMovieArkanoid(handicap);
    }
  }

  function showBossGameUI(gameType) {
    const container = document.getElementById('adventureGameArea');
    if (!container) return;
    
    container.innerHTML = `
      <div class="boss-game-container" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 10000; background: radial-gradient(ellipse at center, #0b0f1a 0%, #070a12 100%); display: flex; align-items: center; justify-content: center;">
        <canvas id="bossGameCanvas" style="width: 100%; height: 100%; display: block;"></canvas>
        
        <div id="bossGameHUD" style="position: fixed; top: 20px; left: 50%; transform: translateX(-50%); z-index: 10001; background: rgba(0,0,0,0.8); color: white; padding: 10px 20px; border-radius: 10px; font-size: 16px; font-weight: bold; text-align: center;">
          Cargando...
        </div>
        
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
      }, 2000); // Aumentar delay para evitar conflictos
    }
  }

  function resizeCanvas() {
    if (!bossGameState.canvas) return;
    
    bossGameState.canvas.width = window.innerWidth;
    bossGameState.canvas.height = window.innerHeight;
  }

  // Tetris para jefe de Historia (limpiar 10 líneas)
  function initHistoryTetris(handicap) {
    const canvas = bossGameState.canvas;
    const ctx = bossGameState.ctx;
    const cols = 10;
    const rows = 20;
    const PAD = 12;
    // HUD en la parte superior (alto dinámico)
    const hudH = Math.max(70, Math.min(110, Math.floor(canvas.height * 0.12)));
    const playW = canvas.width - PAD * 2;
    // Dejar espacio para el botón Rendirse (70px aprox.)
    const playH = canvas.height - (hudH + PAD * 3 + 80);
    const cell = Math.max(12, Math.floor(Math.min(playW / cols, playH / rows)));
    const offsetX = Math.floor(PAD + (playW - cols * cell) / 2);
    const offsetY = Math.floor(PAD * 2 + hudH);
    const grid = Array.from({ length: rows }, () => Array(cols).fill(0));
    let cleared = 0;
    let fallInterval = Math.max(250, 700 - (handicap.bossSpeed || 1) * 80);
    let last = 0;

    const SHAPES = [
      [[1,1,1,1]], // I
      [[1,1],[1,1]], // O
      [[0,1,0],[1,1,1]], // T
      [[1,0,0],[1,1,1]], // J
      [[0,0,1],[1,1,1]], // L
      [[0,1,1],[1,1,0]], // S
      [[1,1,0],[0,1,1]]  // Z
    ];
    const colors = ['#e74c3c','#f1c40f','#9b59b6','#3498db','#1abc9c','#e67e22','#2ecc71'];

    function newPiece() {
      const id = Math.floor(Math.random()*SHAPES.length);
      return { id, m: SHAPES[id], x: 3, y: 0 };
    }
    let piece = newPiece();
    let nextPiece = newPiece();
    // Fondo del tablero (imagen)
    const bgImg = new Image();
    bgImg.src = 'assets/backgrounds/tetris_BG.webp';

    function drawCell(x,y,c) {
      ctx.fillStyle = c; ctx.fillRect(offsetX + x*cell, offsetY + y*cell, cell-1, cell-1);
    }

    function collide(px,py,m) {
      for (let y=0;y<m.length;y++) for (let x=0;x<m[y].length;x++) {
        if (!m[y][x]) continue;
        const gx = px + x; const gy = py + y;
        if (gx<0 || gx>=cols || gy>=rows || (gy>=0 && grid[gy][gx])) return true;
      }
      return false;
    }

    function merge() {
      const m = piece.m;
      for (let y=0;y<m.length;y++) for (let x=0;x<m[y].length;x++) if (m[y][x]) {
        const gy = piece.y + y; const gx = piece.x + x; if (gy>=0) grid[gy][gx] = piece.id+1;
      }
      // limpiar líneas
      let lines=0;
      for (let r=rows-1;r>=0;r--) {
        if (grid[r].every(v=>v)) { grid.splice(r,1); grid.unshift(Array(cols).fill(0)); lines++; r++; }
      }
      if (lines>0) {
        cleared += lines;
        if (cleared >= 10) return endBossGame(true);
      }
    }

    function rotate(m) {
      const h=m.length,w=m[0].length; const out=Array.from({length:w},()=>Array(h).fill(0));
      for (let y=0;y<h;y++) for (let x=0;x<w;x++) out[x][h-1-y]=m[y][x];
      return out;
    }

    // Controles por pulsación (un movimiento por tecla)
    function handleKeyDown(e) {
      switch (e.key) {
        case 'ArrowLeft':
          if (!collide(piece.x-1,piece.y,piece.m)) piece.x--;
          break;
        case 'ArrowRight':
          if (!collide(piece.x+1,piece.y,piece.m)) piece.x++;
          break;
        case 'ArrowDown':
          if (!collide(piece.x,piece.y+1,piece.m)) piece.y++;
          break;
        case 'ArrowUp': {
          const r = rotate(piece.m); if (!collide(piece.x,piece.y,r)) piece.m = r;
          break;
        }
        case ' ': // hard drop opcional
          while(!collide(piece.x,piece.y+1,piece.m)) piece.y++;
          break;
      }
    }
    document.addEventListener('keydown', handleKeyDown);

    // Agregar controles táctiles: tap para rotar, swipe para mover/caer
    function addTetrisTouchControls() {
      const canvas = bossGameState.canvas;
      let touchStartX = null;
      let touchStartY = null;
      let lastSwipeHandledAt = 0;
      const swipeThreshold = 20; // píxeles mínimos para considerar swipe
      const repeatEveryMs = 80; // repetición al mantener swipe

      // Tap en pantalla para rotar
      canvas.addEventListener('click', () => {
        const r = rotate(piece.m);
        if (!collide(piece.x, piece.y, r)) piece.m = r;
      });

      canvas.addEventListener('touchstart', (e) => {
        const t = e.touches[0];
        touchStartX = t.clientX;
        touchStartY = t.clientY;
        lastSwipeHandledAt = performance.now();
      }, { passive: true });

      canvas.addEventListener('touchmove', (e) => {
        const t = e.touches[0];
        const dx = t.clientX - touchStartX;
        const dy = t.clientY - touchStartY;
        const now = performance.now();
        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > swipeThreshold) {
          // mover horizontal
          if (now - lastSwipeHandledAt >= repeatEveryMs) {
            if (dx > 0) {
              if (!collide(piece.x + 1, piece.y, piece.m)) piece.x++;
            } else {
              if (!collide(piece.x - 1, piece.y, piece.m)) piece.x--;
            }
            lastSwipeHandledAt = now;
            touchStartX = t.clientX; // reiniciar para permitir movimientos por pasos
          }
        } else if (Math.abs(dy) > swipeThreshold && dy > 0) {
          // swipe hacia abajo: acelerar caída
          if (now - lastSwipeHandledAt >= repeatEveryMs) {
            if (!collide(piece.x, piece.y + 1, piece.m)) piece.y++;
            lastSwipeHandledAt = now;
          }
        }
      }, { passive: true });

      canvas.addEventListener('touchend', () => {
        touchStartX = null;
        touchStartY = null;
      });
    }

    // Agregar controles táctiles (tap y swipe) y ocultar cualquier UI de flechas
    addTetrisTouchControls();
    
    // Actualizar HUD inicial
    updateBossHUD(`Líneas: ${cleared}/10 - Click en pantalla para rotar, controles para mover`);

    function update(t) {
      bossGameState.animationId = requestAnimationFrame(update);
      if (!last) last=t; const dt=t-last; 
      if (dt>fallInterval) { 
        last=t; 
        if (!collide(piece.x,piece.y+1,piece.m)) piece.y++; 
        else { 
          merge(); 
          piece = nextPiece; 
          piece.x = 3; piece.y = 0; 
          nextPiece = newPiece(); 
          if (collide(piece.x,piece.y,piece.m)) return endBossGame(false);
        } 
      }

      // draw
      ctx.clearRect(0,0,canvas.width,canvas.height);
      // tablero (fondo) con proporción preservada y ajustado a ALTURA (cover-height)
      if (bgImg.complete && bgImg.naturalWidth && bgImg.naturalHeight) {
        try {
          ctx.save();
          ctx.globalAlpha = 0.25;
          // Recortar al rectángulo del tablero para que no se salga
          ctx.beginPath();
          ctx.rect(offsetX, offsetY, cols*cell, rows*cell);
          ctx.clip();
          const bw = cols * cell; const bh = rows * cell;
          const ir = bgImg.naturalWidth / bgImg.naturalHeight;
          // Ajustar por altura: ocupar full alto y centrar, recortando lados si es necesario
          let dh = bh; 
          let dw = Math.floor(bh * ir);
          const dx = offsetX + Math.floor((bw - dw) / 2);
          const dy = offsetY + Math.floor((bh - dh) / 2);
          ctx.drawImage(bgImg, dx, dy, dw, dh);
          ctx.restore();
        } catch {}
      }
      // tablero
      ctx.strokeStyle = '#888';
      ctx.lineWidth = 2;
      ctx.strokeRect(offsetX-1, offsetY-1, cols*cell+2, rows*cell+2);
      for (let y=0;y<rows;y++) for (let x=0;x<cols;x++) if (grid[y][x]) drawCell(x,y,colors[grid[y][x]-1]);
      // pieza
      for (let y=0;y<piece.m.length;y++) for (let x=0;x<piece.m[y].length;x++) if (piece.m[y][x]) drawCell(piece.x+x,piece.y+y,colors[piece.id]);

      // HUD
      // HUD superior (barra blanca sobre el marco)
      const hudW = canvas.width - PAD * 2;
      ctx.fillStyle = '#fff'; ctx.fillRect(PAD, PAD, hudW, hudH); ctx.strokeStyle='#000'; ctx.strokeRect(PAD, PAD, hudW, hudH);
      ctx.fillStyle = '#000'; ctx.font = 'bold 18px monospace';
      ctx.textBaseline = 'top';
      ctx.fillText(`Líneas: ${cleared}/10`, PAD + 12, PAD + 12);
      // vista previa siguiente pieza a la derecha del HUD
      const pvCell = Math.max(10, Math.floor(cell*0.6));
      const pvBoxW = pvCell * 4; const pvBoxH = pvCell * 3;
      const pvX = PAD + hudW - pvBoxW - 12; const pvY = PAD + Math.floor((hudH - pvBoxH)/2);
      ctx.strokeRect(pvX-4, pvY-4, pvBoxW+8, pvBoxH+8);
      for (let y=0;y<nextPiece.m.length;y++) for (let x=0;x<nextPiece.m[y].length;x++) if (nextPiece.m[y][x]) {
        ctx.fillStyle = colors[nextPiece.id];
        ctx.fillRect( pvX + x*pvCell, pvY + y*pvCell, pvCell-1, pvCell-1 );
      }

      // Jefe colgando del HUD (manos sobre el borde del marco blanco)
      try {
        const bossImg = new Image();
        bossImg.src = 'assets/bosses/desert_boss.webp';
        if (bossImg.complete && bossImg.naturalWidth && bossImg.naturalHeight) {
          const bwRatio = bossImg.naturalWidth / bossImg.naturalHeight;
          const targetW = Math.max(120, Math.floor(cols*cell*0.38));
          const bW = targetW;
          const bH = Math.floor(targetW / bwRatio);
          const bx = PAD + Math.floor((canvas.width - PAD*2)/2) - Math.floor(bW/2);
          // Ajuste fino: subir 2px desde el último ajuste
          const by = PAD - Math.floor(bH * 0.15) + 38;
          ctx.drawImage(bossImg, bx, by, bW, bH);
        }
      } catch {}
    }
    update(0);
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
    
    // === SISTEMA DE LAYOUT RESPONSIVO PARA MÓVIL ===
    const isMobile = canvas.height > canvas.width;
    
    // Dimensiones base del juego
    const baseWidth = isMobile ? 400 : 800;
    const baseHeight = isMobile ? 600 : 600;
    
    // Calcular escala para ajustarse a la pantalla SIN DEFORMAR
    const scaleX = canvas.width / baseWidth;
    const scaleY = canvas.height / baseHeight;
    const scale = Math.min(scaleX, scaleY, 1.2); // Limitar escala máxima
    
    // Centrar el contenido
    const scaledWidth = baseWidth * scale;
    const scaledHeight = baseHeight * scale;
    const offsetX = (canvas.width - scaledWidth) / 2;
    const offsetY = (canvas.height - scaledHeight) / 2;
    
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
      if (game.ball.y > game.baseHeight) {
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
    
    // Limpiar controles táctiles
    const tetrisControls = document.getElementById('tetris-touch-controls');
    if (tetrisControls) {
      tetrisControls.remove();
    }
    
    const froggerControls = document.getElementById('frogger-touch-controls');
    if (froggerControls) {
      froggerControls.remove();
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

  // Snake mejorado para región de Ciencia (recoger 10 tubos de ensayo)
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
    
    // Cargar imagen del demonio
    const demonImage = new Image();
    demonImage.src = 'assets/bosses/demon_boss.webp';
    let demonLoaded = false;
    demonImage.onload = () => { demonLoaded = true; };
    
    // Cargar imágenes de ciencia
    const testTubeImage = new Image();
    const burnerImage = new Image();
    const flaskImage = new Image();
    const labImage = new Image();
    const microscopeImage = new Image();
    
    testTubeImage.src = 'assets/ciencia/test-tube-svgrepo-com.svg';
    burnerImage.src = 'assets/ciencia/burner-science-svgrepo-com.svg';
    flaskImage.src = 'assets/ciencia/flask-science-svgrepo-com.svg';
    labImage.src = 'assets/ciencia/lab-science-svgrepo-com.svg';
    microscopeImage.src = 'assets/ciencia/microscope-svgrepo-com.svg';
    
    let scienceImagesLoaded = 0;
    const totalScienceImages = 5;
    
    testTubeImage.onload = burnerImage.onload = flaskImage.onload = labImage.onload = microscopeImage.onload = () => {
      scienceImagesLoaded++;
    };
    
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
    updateBossHUD(`Tubos: ${game.score}/${game.target} - Usa las flechas o controles táctiles`);
    
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
          setTimeout(() => bossGameState.callback(false), 1000);
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
      if (demonLoaded && demonImage.complete) {
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
      if (scienceImagesLoaded === totalScienceImages) {
        switch (type) {
          case 'testTube':
            imageToUse = testTubeImage;
            break;
          case 'burner':
            imageToUse = burnerImage;
            break;
          case 'flask':
            imageToUse = flaskImage;
            break;
          case 'lab':
            imageToUse = labImage;
            break;
          case 'microscope':
            imageToUse = microscopeImage;
            break;
        }
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
      }
    }
    
    gameLoop();
  }

  // Catch the falling objects para región de Ciencia (control tipo Arkanoid)
  function initScienceCatch(handicap) {
    const canvas = bossGameState.canvas;
    const ctx = bossGameState.ctx;
    // Forzar layout base en vertical (portrait) para móvil
    const baseWidth = 360;  // ancho lógico en modo vertical
    const baseHeight = 640; // alto lógico en modo vertical
    const scaleX = canvas.width / baseWidth;
    const scaleY = canvas.height / baseHeight;
    const scale = Math.min(scaleX, scaleY);
    const offsetX = (canvas.width - baseWidth * scale) / 2;
    const offsetY = (canvas.height - baseHeight * scale) / 2;

    const demonImage = new Image();
    demonImage.src = 'assets/bosses/demon_boss.webp';
    let demonLoaded = false;
    demonImage.onload = () => { demonLoaded = true; };

    const testTubeImage = new Image();
    const burnerImage = new Image();
    const flaskImage = new Image();
    const labImage = new Image();
    const microscopeImage = new Image();
    testTubeImage.src = 'assets/ciencia/test-tube-svgrepo-com.svg';
    burnerImage.src = 'assets/ciencia/burner-science-svgrepo-com.svg';
    flaskImage.src = 'assets/ciencia/flask-science-svgrepo-com.svg';
    labImage.src = 'assets/ciencia/lab-science-svgrepo-com.svg';
    microscopeImage.src = 'assets/ciencia/microscope-svgrepo-com.svg';

    // Mantener una zona segura inferior para no tapar con el botón "Rendirse"
    const safeBottom = 90;
    const player = { x: baseWidth / 2 - 55, y: baseHeight - safeBottom, width: 110, height: 16, speed: 9 * (handicap.playerSpeed || 1) };
    const goodSprites = [testTubeImage, burnerImage, flaskImage, labImage, microscopeImage];
    // Objetos malos (no relacionados a ciencia)
    const badMovie = new Image(); badMovie.src = 'Icons/movie.png';
    const badSports = new Image(); badSports.src = 'Icons/sports.png';
    const badWorld = new Image(); badWorld.src = 'Icons/world.png';
    const badSword = new Image(); badSword.src = 'Icons/sword.png';
    const badSprites = [badMovie, badSports, badWorld, badSword];
    const objects = [];
    let spawnTimer = 0;
    let spawnInterval = 800;
    let score = 0;
    let misses = 0;
    const maxMisses = 3;

    function spawnObject() {
      // 75% buenos, 25% malos
      const isGood = Math.random() < 0.75;
      const sprite = (isGood ? goodSprites : badSprites)[Math.floor(Math.random() * (isGood ? goodSprites.length : badSprites.length))];
      const size = 28 + Math.floor(Math.random() * 10);
      objects.push({ x: Math.random() * (baseWidth - size), y: -size, size, speed: 2.7 + Math.random() * 1.8, sprite, good: isGood });
    }

    function update(dt) {
      // teclado opcional
      if (keys['ArrowLeft'] || keys['a'] || keys['A']) player.x -= player.speed;
      if (keys['ArrowRight'] || keys['d'] || keys['D']) player.x += player.speed;
      player.x = Math.max(0, Math.min(baseWidth - player.width, player.x));

      spawnTimer += dt;
      if (spawnTimer >= spawnInterval) {
        spawnTimer = 0;
        spawnObject();
        spawnInterval = Math.max(400, spawnInterval - 10);
      }

      for (let i = objects.length - 1; i >= 0; i--) {
        const o = objects[i];
        o.y += o.speed;
        if (o.y + o.size >= player.y && o.y <= player.y + player.height && o.x + o.size >= player.x && o.x <= player.x + player.width) {
          if (o.good) {
            score++;
          } else {
            misses++;
          }
          objects.splice(i, 1);
          continue;
        }
        if (o.y > baseHeight) {
          misses++;
          objects.splice(i, 1);
        }
      }

      if (score >= 10) { endBossGame(true); return false; }
      if (misses >= maxMisses) { endBossGame(false); return false; }
      return true;
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(offsetX, offsetY);
      ctx.scale(scale, scale);

      ctx.fillStyle = '#0b1a2b';
      ctx.fillRect(0, 0, baseWidth, baseHeight);
      if (demonLoaded) ctx.drawImage(demonImage, baseWidth / 2 - 70, -20, 140, 120);

      // paddle
      ctx.fillStyle = '#2ecc71';
      ctx.fillRect(player.x, player.y, player.width, player.height);
      // zona segura inferior de referencia (opcional visual mínimo)
      // ctx.fillStyle = 'rgba(255,255,255,0.04)'; ctx.fillRect(0, baseHeight - safeBottom, baseWidth, 1);

      for (const o of objects) {
        if (o.sprite && o.sprite.complete) {
          ctx.drawImage(o.sprite, o.x, o.y, o.size, o.size);
          if (!o.good) {
            // resaltar malos con borde rojo
            ctx.strokeStyle = 'rgba(231,76,60,0.9)';
            ctx.lineWidth = 2;
            ctx.strokeRect(o.x, o.y, o.size, o.size);
          }
        } else {
          ctx.fillStyle = o.good ? '#3498db' : '#e74c3c';
          ctx.fillRect(o.x, o.y, o.size, o.size);
        }
      }

      ctx.restore();
      updateBossHUD(`Puntos: ${score}/10 · Fallos: ${misses}/${maxMisses} · Evita los rojos`);
    }

    const keys = {};
    document.addEventListener('keydown', (e) => keys[e.key] = true);
    document.addEventListener('keyup', (e) => keys[e.key] = false);

    let touchX = null;
    canvas.addEventListener('touchstart', (e) => {
      const rect = canvas.getBoundingClientRect();
      const sX = canvas.width / rect.width;
      touchX = (e.touches[0].clientX - rect.left) * sX;
    }, { passive: true });
    canvas.addEventListener('touchmove', (e) => {
      if (touchX !== null) {
        const rect = canvas.getBoundingClientRect();
        const sX = canvas.width / rect.width;
        const currentX = (e.touches[0].clientX - rect.left) * sX;
        const diff = (currentX - touchX) / scale;
        player.x += diff * 2.2;
        player.x = Math.max(0, Math.min(baseWidth - player.width, player.x));
        touchX = currentX;
      }
    }, { passive: true });
    canvas.addEventListener('touchend', () => { touchX = null; });

    let last = 0;
    function loop(t) {
      bossGameState.animationId = requestAnimationFrame(loop);
      if (!last) last = t; const dt = t - last; last = t;
      if (!update(dt)) return;
      draw();
    }
    loop(0);
  }
  
  // Frogger para región de Sports (cruzar el campo de fútbol)
  function initSportsFrogger(handicap) {
    const canvas = bossGameState.canvas;
    const ctx = bossGameState.ctx;
    
    // Optimizar para móvil 9:16
    const maxWidth = Math.min(canvas.width, canvas.height * 9 / 16);
    const gameWidth = maxWidth;
    const gameHeight = canvas.height;
    const laneHeight = 60; // Más alto para mobile
    const lanes = Math.floor(gameHeight / laneHeight);
    const playerSize = 50; // Jugador más grande para mobile
    const defenderSize = 60; // Defensores más grandes
    
    // Cargar imágenes de defensores y fondo
    const defensor01 = new Image();
    const defensor02 = new Image();
    const canchaImage = new Image();
    defensor01.src = 'assets/soccer/defensor 01.webp';
    defensor02.src = 'assets/soccer/defensor 02.webp';
    canchaImage.src = 'assets/soccer/cancha_V02.webp';
    
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
    
    // Cargar imágenes y generar defensores
    defensor01.onload = defensor02.onload = () => {
      game.imagesLoaded++;
      if (game.imagesLoaded === 2) {
        generateDefenders();
      }
    };
    
    canchaImage.onload = () => {
      game.canchaLoaded = true;
    };
    
    // Si las imágenes ya están cargadas
    if (defensor01.complete && defensor02.complete) {
      game.imagesLoaded = 2;
      generateDefenders();
    }
    
    if (canchaImage.complete) {
      game.canchaLoaded = true;
    }
    
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
            setTimeout(() => bossGameState.callback(false), 1000);
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

      document.body.appendChild(controls);
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
    
    // Actualizar HUD inicial
    updateBossHUD(`Cruces: ${game.score}/${game.target} - Usa las flechas o controles táctiles`);
    
    function generateDefenders() {
      game.defenders = [];
      
      for (let i = 0; i < lanes - 3; i++) { // Empezar desde arriba, pero excluir las 2 últimas filas (las más cercanas al jugador)
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
      if (game.canchaLoaded && canchaImage.complete) {
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
        bossGameState.animationId = setTimeout(gameLoop, game.speed);
      }
    }
    
    gameLoop();
  }

  // === BASE DE DATOS DE PALABRAS PARA HANGMAN ===
  const GEOGRAPHY_WORDS = {
    cities: [
      'BARCELONA', 'MADRID', 'VALENCIA', 'SEVILLA', 'BILBAO', 'MALAGA', 'ZARAGOZA', 'MURCIA',
      'PALMA', 'LAS_PALMAS', 'BURGOS', 'VALLADOLID', 'CORDOBA', 'VIGO', 'GIJON', 'L_HOSPITALET',
      'VITORIA', 'CORUNA', 'ELCHE', 'OVIEDO', 'SANTA_CRUZ', 'GRANADA', 'BADALONA', 'CARTAGENA',
      'TERRASSA', 'JEREZ', 'SABADELL', 'MOSTOLES', 'ALCALA', 'PAMPLONA', 'FUEVENTERRABRAVA',
      'ALMERIA', 'LEGANES', 'SAN_SEBASTIAN', 'BURGOS', 'ALBACETE', 'GETAFE', 'SALAMANCA',
      'HUELVA', 'MARBELLA', 'LEON', 'CADIZ', 'DOS_HERMANAS', 'MATARO', 'SANTA_COLOMA',
      'JAEN', 'OURENSE', 'REUS', 'TORRELAVEGA', 'ALCORA', 'ELDA', 'SAN_FERNANDO',
      'PARIS', 'LONDON', 'ROME', 'BERLIN', 'AMSTERDAM', 'VIENNA', 'PRAGUE', 'BUDAPEST',
      'WARSAW', 'STOCKHOLM', 'COPENHAGEN', 'OSLO', 'HELSINKI', 'MOSCOW', 'ISTANBUL',
      'ATHENS', 'LISBON', 'DUBLIN', 'EDINBURGH', 'CARDIFF', 'BRUSSELS', 'LUXEMBOURG',
      'ZURICH', 'GENEVA', 'MILAN', 'NAPLES', 'TURIN', 'FLORENCE', 'VENICE', 'BOLOGNA',
      'GENOA', 'PALERMO', 'CATANIA', 'BARI', 'MUNICH', 'HAMBURG', 'COLOGNE', 'FRANKFURT',
      'STUTTGART', 'DUSSELDORF', 'DORTMUND', 'ESSEN', 'LEIPZIG', 'DRESDEN', 'HANOVER',
      'NUREMBERG', 'NEW_YORK', 'LOS_ANGELES', 'CHICAGO', 'HOUSTON', 'PHOENIX', 'PHILADELPHIA',
      'SAN_ANTONIO', 'SAN_DIEGO', 'DALLAS', 'SAN_JOSE', 'AUSTIN', 'JACKSONVILLE',
      'FORT_WORTH', 'COLUMBUS', 'CHARLOTTE', 'SAN_FRANCISCO', 'INDIANAPOLIS',
      'SEATTLE', 'DENVER', 'BOSTON', 'DETROIT', 'NASHVILLE', 'PORTLAND',
      'LAS_VEGAS', 'BALTIMORE', 'MILWAUKEE', 'ALBUQUERQUE', 'TUCSON',
      'FRESNO', 'SACRAMENTO', 'MESA', 'KANSAS_CITY', 'ATLANTA', 'LONG_BEACH',
      'COLORADO_SPRINGS', 'RALEIGH', 'MIAMI', 'VIRGINIA_BEACH', 'OMAHA',
      'OAKLAND', 'MINNEAPOLIS', 'TULSA', 'ARLINGTON', 'TAMPA', 'NEW_ORLEANS',
      'WICHITA', 'CLEVELAND', 'BABILONIA', 'TOLEDO', 'ANAHEIM', 'HONOLULU',
      'TOKYO', 'YOKOHAMA', 'OSAKA', 'NAGOYA', 'SAPPORO', 'FUKUOKA', 'KOBE',
      'KYOTO', 'KAWASAKI', 'SAITAMA', 'HIROSHIMA', 'SENDAI', 'KITAKYUSHU',
      'CHIBA', 'SAGAMIHARA', 'NIIGATA', 'HAMAMATSU', 'OKAYAMA', 'KUMAMOTO',
      'SHIZUOKA', 'KAGOSHIMA', 'FUKUOKA', 'MATSUYAMA', 'HIMEJI', 'MATSUDO',
      'NISHINOMIYA', 'KANAZAWA', 'FUKUYAMA', 'KURASHIKI', 'GIFU', 'TOYOTA',
      'TAKAMATSU', 'MACHIDA', 'TOYONAKA', 'KOCHI', 'ODAWARA', 'KORIYAMA',
      'YOKOSUKA', 'HIRATSUKA', 'NAGANO', 'TOYOHASHI', 'WAKAYAMA', 'NARA',
      'TSUKUBA', 'NAGASAKI', 'HIRAKATA', 'IBARAKI', 'FUKUSHIMA', 'TSU',
      'KASHIWA', 'AKITA', 'BEIJING', 'SHANGHAI', 'GUANGZHOU', 'SHENZHEN',
      'TIANJIN', 'WUHAN', 'CHONGQING', 'CHENGDU', 'NANJING', 'XIAN',
      'HANGZHOU', 'DONGGUAN', 'FOSHAN', 'SHENYANG', 'HARBIN', 'QINGDAO',
      'DALIAN', 'JINAN', 'ZHEJIANG', 'NANCHANG', 'FUZHOU', 'HEFEI',
      'KUNMING', 'SHIJIAZHUANG', 'TAIYUAN', 'NANNING', 'GUIYANG', 'HAIKOU',
      'URUMQI', 'LHASA', 'YINCHUAN', 'XINING', 'HOHHOT', 'SHIHEZI',
      'KARAMAY', 'TURPAN', 'MUMBAI', 'DELHI', 'BANGALORE', 'HYDERABAD',
      'AHMEDABAD', 'CHENNAI', 'KOLKATA', 'SURAT', 'PUNE', 'JAIPUR',
      'LUCKNOW', 'KANPUR', 'NAGPUR', 'INDORE', 'THANE', 'BHOPAL',
      'VISAKHAPATNAM', 'PIMPRI', 'PATNA', 'VADODARA', 'GHAZIABAD', 'LUDHIANA',
      'AGRA', 'NASHIK', 'FARIDABAD', 'MEERUT', 'RAJKOT', 'KALYAN',
      'VASANT_KUNJ', 'VARANASI', 'SRINAGAR', 'AURANGABAD', 'SOLAPUR',
      'KOLHAPUR', 'AMRITSAR', 'NANDED', 'SANGALI', 'MALEGAON', 'ULHASNAGAR',
      'JALGAON', 'LATUR', 'AHMEDNAGAR', 'CHANDRAPUR', 'PARBHANI', 'ICHALKARANJI',
      'JALNA', 'AMBAD', 'BHIWANDI', 'DHULE', 'CHOPDA', 'MANMAD',
      'SANGAMNER', 'BARSI', 'KOPARGAON', 'YEOLA', 'SATARA', 'KARAD',
      'MIRAJ', 'JATH', 'KAGAL', 'GADHINGLAJ', 'CHIKHALI', 'SHIRALA',
      'PALUS', 'KAVATHE_MAHANKAL', 'SAO_PAULO', 'RIO_DE_JANEIRO', 'SALVADOR',
      'BRASILIA', 'FORTALEZA', 'BELO_HORIZONTE', 'MANAUS', 'CURITIBA',
      'RECIFE', 'PORTO_ALEGRE', 'GOIANIA', 'GUARULHOS', 'CAMPINAS',
      'SAO_LUIS', 'SAO_GONCALO', 'MACEIO', 'DUQUE_DE_CAXIAS', 'NATAL',
      'TERESINA', 'CAMPINA_GRANDE', 'SAO_BERNARDO', 'NOVA_IGUACU',
      'JOAO_PESSOA', 'SANTO_ANDRE', 'OSASCO', 'JABOATAO', 'SAO_JOSE_DOS_CAMPOS',
      'RIBEIRAO_PRETO', 'UBERLANDIA', 'SOROCABA', 'NITEROI', 'CUIABA',
      'APARECIDA_DE_GOIANIA', 'ARACAJU', 'FEIRA_DE_SANTANA', 'JOINVILLE',
      'LONDRINA', 'SERRA'
    ],
    countries: [
      'ARGENTINA', 'AUSTRALIA', 'AUSTRIA', 'BANGLADESH', 'BELARUS', 'BELGIUM',
      'BOLIVIA', 'BOTSWANA', 'BRAZIL', 'BULGARIA', 'CAMEROON', 'CANADA',
      'CHILE', 'CHINA', 'COLOMBIA', 'CROATIA', 'CYPRUS', 'DENMARK',
      'ECUADOR', 'ESTONIA', 'FINLAND', 'FRANCE', 'GEORGIA', 'GERMANY',
      'GHANA', 'GREECE', 'GUATEMALA', 'HUNGARY', 'ICELAND', 'INDIA',
      'INDONESIA', 'IRELAND', 'ISRAEL', 'ITALY', 'JAMAICA', 'JAPAN',
      'JORDAN', 'KAZAKHSTAN', 'KENYA', 'LATVIA', 'LEBANON', 'LITHUANIA',
      'LUXEMBOURG', 'MADAGASCAR', 'MALAYSIA', 'MEXICO', 'MOLDOVA', 'MONGOLIA',
      'MONTENEGRO', 'MOROCCO', 'MYANMAR', 'NEPAL', 'NETHERLANDS', 'NEW_ZEALAND',
      'NICARAGUA', 'NIGERIA', 'NORWAY', 'PAKISTAN', 'PANAMA', 'PARAGUAY',
      'PERU', 'PHILIPPINES', 'POLAND', 'PORTUGAL', 'ROMANIA', 'RUSSIA',
      'SENEGAL', 'SERBIA', 'SINGAPORE', 'SLOVAKIA', 'SLOVENIA', 'SOMALIA',
      'SOUTH_AFRICA', 'SOUTH_KOREA', 'SPAIN', 'SRI_LANKA', 'SUDAN', 'SWEDEN',
      'SWITZERLAND', 'SYRIA', 'TAIWAN', 'TANZANIA', 'THAILAND', 'TUNISIA',
      'TURKEY', 'UGANDA', 'UKRAINE', 'UNITED_KINGDOM', 'UNITED_STATES', 'URUGUAY',
      'UZBEKISTAN', 'VENEZUELA', 'VIETNAM', 'YEMEN', 'ZAMBIA', 'ZIMBABWE',
      'AFGHANISTAN', 'ALBANIA', 'ALGERIA', 'ANDORRA', 'ANGOLA', 'ANTIGUA',
      'ARMENIA', 'AZERBAIJAN', 'BAHAMAS', 'BAHRAIN', 'BARBADOS', 'BELIZE',
      'BENIN', 'BHUTAN', 'BOSNIA', 'BRUNEI', 'BURKINA', 'BURUNDI',
      'CAMBODIA', 'CAPE_VERDE', 'CENTRAL_AFRICAN', 'CHAD', 'COMOROS', 'CONGO',
      'COSTA_RICA', 'COTE_DIVOIRE', 'CUBA', 'DJIBOUTI', 'DOMINICA', 'DOMINICAN',
      'EAST_TIMOR', 'EL_SALVADOR', 'EQUATORIAL_GUINEA', 'ERITREA', 'ESWATINI',
      'ETHIOPIA', 'FIJI', 'GABON', 'GAMBIA', 'GRENADA', 'GUINEA', 'GUINEA_BISSAU',
      'GUYANA', 'HAITI', 'HONDURAS', 'IRAN', 'IRAQ', 'IVORY_COAST', 'KIRIBATI',
      'KOSOVO', 'KUWAIT', 'KYRGYZSTAN', 'LAOS', 'LESOTHO', 'LIBERIA', 'LIBYA',
      'LIECHTENSTEIN', 'MALAWI', 'MALDIVES', 'MALI', 'MALTA', 'MARSHALL_ISLANDS',
      'MAURITANIA', 'MAURITIUS', 'MICRONESIA', 'MONACO', 'MOZAMBIQUE', 'NAMIBIA',
      'NAURU', 'NIGER', 'NORTH_KOREA', 'NORTH_MACEDONIA', 'OMAN', 'PALAU',
      'PALESTINE', 'PAPUA_NEW_GUINEA', 'QATAR', 'RWANDA', 'SAINT_KITTS', 'SAINT_LUCIA',
      'SAINT_VINCENT', 'SAMOA', 'SAN_MARINO', 'SAO_TOME', 'SAUDI_ARABIA',
      'SEYCHELLES', 'SIERRA_LEONE', 'SOLOMON_ISLANDS', 'SOUTH_SUDAN', 'SURINAME',
      'TAJIKISTAN', 'TANZANIA', 'TOGO', 'TONGA', 'TRINIDAD', 'TUVALU',
      'VATICAN_CITY', 'VANUATU', 'WESTERN_SAHARA'
    ]
  };

  // === HANGMAN PARA ATLAS MUNDIAL ===
  function initGeographyHangman(handicap) {
    const canvas = bossGameState.canvas;
    const ctx = bossGameState.ctx;
    
    // === SISTEMA DE LAYOUT RESPONSIVO (OPTIMIZADO MÓVIL VERTICAL) ===
    // Mantener proporción exacta del fondo (1536x2720)
    const BG_ASPECT = 1536 / 2720; // ~0.564705882
    const baseWidth = 360; // ancho lógico en retrato
    const baseHeight = Math.round(baseWidth / BG_ASPECT); // alto lógico según proporción exacta
    const scaleX = canvas.width / baseWidth;
    const scaleY = canvas.height / baseHeight;
    const scale = Math.min(scaleX, scaleY);
    const offsetX = (canvas.width - baseWidth * scale) / 2;
    const offsetY = (canvas.height - baseHeight * scale) / 2;

    // Primero cargar la imagen de fondo para obtener sus proporciones reales
    const hangmanBgImage = new Image();
    hangmanBgImage.src = 'assets/atlas/hangman.webp';
    let hangmanBgLoaded = false;
    hangmanBgImage.onload = () => { hangmanBgLoaded = true; };
    
    const isMobile = canvas.height > canvas.width;
    
    // Dimensiones del área de juego
    const gameAreaWidth = canvas.width;
    const gameAreaHeight = canvas.height;
    
    // Cargar imagen del demonio
    const demonImage = new Image();
    demonImage.src = 'assets/bosses/demon_boss.webp';
    let demonLoaded = false;
    demonImage.onload = () => { demonLoaded = true; };
    
    // La imagen de fondo ya se cargó arriba
    
    // Cargar partes del muñeco
    const headImage = new Image();
    const bodyImage = new Image();
    const rightArmImage = new Image();
    const leftArmImage = new Image();
    const leftLegImage = new Image();
    const rightLegImage = new Image();
    
    headImage.src = 'assets/atlas/01_head.webp';
    bodyImage.src = 'assets/atlas/02_body.webp';
    rightArmImage.src = 'assets/atlas/03_rightArm.webp';
    leftArmImage.src = 'assets/atlas/04_leftArm.webp';
    leftLegImage.src = 'assets/atlas/05_leftLeg.webp';
    rightLegImage.src = 'assets/atlas/05_rightLeg.webp';
    
    let hangmanPartsLoaded = 0;
    const totalHangmanParts = 6;
    
    // Función para verificar si todas las imágenes están cargadas
    function checkImageLoaded(image, imageName) {
      if (image.complete && image.naturalWidth > 0) {
        hangmanPartsLoaded++;
        console.log(`${imageName} loaded: ${hangmanPartsLoaded}/${totalHangmanParts}`);
      } else {
        image.onload = () => {
          hangmanPartsLoaded++;
          console.log(`${imageName} loaded: ${hangmanPartsLoaded}/${totalHangmanParts}`);
        };
        image.onerror = () => {
          console.error(`Error loading ${imageName}: ${image.src}`);
        };
      }
    }
    
    // Verificar carga de cada imagen
    checkImageLoaded(headImage, 'head');
    checkImageLoaded(bodyImage, 'body');
    checkImageLoaded(rightArmImage, 'rightArm');
    checkImageLoaded(leftArmImage, 'leftArm');
    checkImageLoaded(leftLegImage, 'leftLeg');
    checkImageLoaded(rightLegImage, 'rightLeg');
    
    console.log(`Initial hangman parts loaded: ${hangmanPartsLoaded}/${totalHangmanParts}`);
    
    // Seleccionar palabra aleatoria
    // Lista de capitales comunes para reducir dificultad
    const COMMON_CAPITALS = [
      'MADRID','PARIS','LONDON','BERLIN','ROME','LISBON','VIENNA','ATHENS','DUBLIN','OSLO','STOCKHOLM','HELSINKI','COPENHAGEN','BRUSSELS','AMSTERDAM','PRAGUE','WARSAW','BUDAPEST','BUCHAREST','SOFIA','BELGRADE','ZAGREB','BRATISLAVA','LJUBLJANA','SARAJEVO','REYKJAVIK','ANKARA','MOSCOW','KIEV','OTTAWA','WASHINGTON','MEXICO_CITY','BOGOTA','LIMA','SANTIAGO','BUENOS_AIRES','MONTEVIDEO','ASUNCION','LA_PAZ','SUCRE','QUITO','BRASILIA','CARACAS','HAVANA','SAN_JOSE','PANAMA_CITY','KINGSTON','PORT_AU_PRINCE','SANTO_DOMINGO','GUATEMALA_CITY','TEGUCIGALPA','MANAGUA','SAN_SALVADOR','TOKYO','BEIJING','SEOUL','PYONGYANG','TAIPEI','MANILA','BANGKOK','HANOI','VIENTIANE','PHNOM_PENH','KUALA_LUMPUR','SINGAPORE','JAKARTA','NEW_DELHI','ISLAMABAD','KABUL','TEHRAN','BAGHDAD','RIYADH','DOHA','ABU_DHABI','KUWAIT_CITY','MUSCAT','AMMAN','JERUSALEM','CAIRO','RABAT','ALGIERS','TUNIS','TRIPOLI','ADDIS_ABABA','NAIROBI','DAR_ES_SALAAM','PRETORIA','CAPE_TOWN','HARARE','LUSAKA','MAPUTO','LUANDA','ACCRA','DAKAR','ABIDJAN','YAOUNDE','KIGALI','KAMPALA','BAMAKO','MONROVIA','ANTANANARIVO','CANBERRA','WELLINGTON'
    ];

    function selectRandomWord() {
      const countries = Array.isArray(GEOGRAPHY_WORDS.countries) ? GEOGRAPHY_WORDS.countries : [];
      const capitals = COMMON_CAPITALS;
      const all = [...countries, ...capitals];
      const valid = all.filter(w => typeof w === 'string' && w.length >= 4);
      return valid[Math.floor(Math.random() * valid.length)];
    }
    
    const game = {
      // Configuración del juego
      word: selectRandomWord(),
      guessedLetters: [],
      wrongGuesses: 0,
      maxWrongGuesses: handicap.maxWrongGuesses || 6,
      gameOver: false,
      won: false,
      message: '¡Adivina la ciudad o país!',
      
      // Configuración visual
      demonLoaded: false,
      animationFrame: 0,
      
      // Configuración del handicap
      hints: handicap.hints || 0
    };
    
    // Función para limpiar el teclado virtual
    function cleanupVirtualKeyboard() {
      const keyboard = document.getElementById('hangman-virtual-keyboard');
      if (keyboard) {
        keyboard.remove();
      }
    }

    // Función para procesar una letra
    function processLetter(letter) {
      if (game.gameOver) return;
      
      if (letter >= 'A' && letter <= 'Z' && letter.length === 1 && !game.guessedLetters.includes(letter)) {
        game.guessedLetters.push(letter);
        
        if (game.word.includes(letter)) {
          // Letra correcta
          if (game.word.split('').every(char => char === '_' || game.guessedLetters.includes(char))) {
            game.won = true;
            game.gameOver = true;
            game.message = '¡VICTORIA! ¡Adivinaste la palabra!';
            setTimeout(() => {
              cleanupVirtualKeyboard();
              bossGameState.callback(false);
            }, 2000);
          }
        } else {
          // Letra incorrecta
          game.wrongGuesses++;
          if (game.wrongGuesses >= game.maxWrongGuesses) {
            game.gameOver = true;
            game.won = false;
            game.message = `¡DERROTA! La palabra era: ${game.word}`;
            setTimeout(() => {
              cleanupVirtualKeyboard();
              bossGameState.callback(false);
            }, 2000);
          }
        }
      }
    }

    // Controles del teclado físico
    document.addEventListener('keydown', (e) => {
      processLetter(e.key.toUpperCase());
    });

    // Configurar teclado nativo del móvil mediante un input oculto
    const hiddenInput = document.createElement('input');
    hiddenInput.type = 'text';
    hiddenInput.inputMode = 'text';
    hiddenInput.autocapitalize = 'characters';
    hiddenInput.autocomplete = 'off';
    hiddenInput.autocorrect = 'off';
    hiddenInput.spellcheck = false;
    hiddenInput.maxLength = 1;
    hiddenInput.id = 'hangman-native-input';
    hiddenInput.style.cssText = 'position:fixed;opacity:0;pointer-events:none;height:0;width:0;left:-1000px;top:-1000px;';
    document.body.appendChild(hiddenInput);

    function focusHiddenInputSoon() {
      setTimeout(() => hiddenInput.focus(), 50);
    }

    hiddenInput.addEventListener('input', () => {
      const value = (hiddenInput.value || '').toUpperCase();
      if (value && value.length >= 1) {
        const letter = value[value.length - 1];
        processLetter(letter);
        hiddenInput.value = '';
      }
      focusHiddenInputSoon();
    });

    // Intentar mantener el foco para que el teclado nativo permanezca abierto
    canvas.addEventListener('click', focusHiddenInputSoon);
    focusHiddenInputSoon();
    
    // Actualizar HUD inicial
    updateBossHUD(`Errores: ${game.wrongGuesses}/${game.maxWrongGuesses} - Usa el teclado nativo`);
    
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(offsetX, offsetY);
      ctx.scale(scale, scale);
      
      // Fondo principal (imagen de pizarra) con proporción 1536x2720 exacta
      if (hangmanBgLoaded && hangmanBgImage.complete && hangmanBgImage.naturalWidth && hangmanBgImage.naturalHeight) {
        // Dibujar ajustando al área lógica (baseWidth x baseHeight)
        ctx.drawImage(hangmanBgImage, 0, 0, baseWidth, baseHeight);
      } else {
        const gradient = ctx.createLinearGradient(0, 0, 0, baseHeight);
        gradient.addColorStop(0, '#0a0a0a');
        gradient.addColorStop(1, '#1a1a2e');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, baseWidth, baseHeight);
      }
      
      // === DEMONIO ASOMÁNDOSE (como en Tetris) ===
      if (demonLoaded && demonImage.complete) {
        const demonWidth = 120;
        const demonHeight = 95;
        const demonX = baseWidth/2 - demonWidth/2;
        const demonY = -10; // Asomándose desde arriba, menos intrusivo
        
        ctx.drawImage(demonImage, demonX, demonY, demonWidth, demonHeight);
      } else {
        // Dibujar demonio simple asomándose
        ctx.save();
        ctx.translate(baseWidth/2, 60);
        
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
      
      // Texto del juego (en la parte superior) - Responsive
      ctx.fillStyle = '#ffffff';
      const fontSize = 18;
      ctx.font = `bold ${fontSize}px Arial`;
      ctx.textAlign = 'left';
      ctx.fillText(`Errores: ${game.wrongGuesses}/${game.maxWrongGuesses}`, 12, 24);
      
      // Mostrar pistas disponibles si las hay
      if (game.hints > 0) {
        ctx.fillStyle = '#f39c12';
        ctx.fillText(`💡 Pistas: ${game.hints}`, 20, 60);
      }
      
      // === ÁREA DE JUEGO USANDO TODO EL CANVAS ===
      
      // Usar todo el canvas para el juego, sin marcos restrictivos
      const gameAreaX = 0;
      const gameAreaY = 0;
      const gameAreaWidth = baseWidth;
      const gameAreaHeight = baseHeight;
      
      // Fondo del área de juego (imagen de hangman) - USAR TODO EL CANVAS
      if (hangmanBgLoaded && hangmanBgImage.complete) {
        // Dibujar la imagen de fondo usando TODO el canvas
        ctx.drawImage(hangmanBgImage, 0, 0, canvas.width, canvas.height);
      } else {
        // Fallback: fondo azul claro
        ctx.fillStyle = '#e8f4fd';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      
      // Dibujar horca (usando todo el canvas)
      drawGallows(gameAreaWidth * 0.08, gameAreaHeight * 0.22, gameAreaWidth * 0.84, gameAreaHeight * 0.58);
      
      // Dibujar palabra oculta (centrada verticalmente)
      drawHiddenWord(gameAreaWidth/2, gameAreaHeight * 0.78, game.word, game.guessedLetters);
      
      // Dibujar letras usadas (en la parte inferior)
      drawUsedLetters(12, gameAreaHeight - 16, game.guessedLetters);
      
      // === MENSAJES DE JUEGO ===
      if (game.gameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, baseWidth, baseHeight);
        
        ctx.fillStyle = game.won ? '#2ecc71' : '#e74c3c';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(game.message, baseWidth/2, baseHeight/2);
        ctx.textAlign = 'left';
      }
      ctx.restore();
    }
    
    function drawGallows(x, y, width, height) {
      // CALCULAR TAMAÑO PROPORCIONAL AL FONDO ORIGINAL
      // El fondo original tiene proporción 1536x2720 (0.5647)
      // Necesito que las partes del muñeco tengan el mismo tamaño relativo
      
      // Tamaño base proporcional al canvas (como el fondo)
      const baseSize = Math.min(canvas.width * 0.15, canvas.height * 0.2); // Mucho más grande
      
      // Posición en el lado derecho donde está la horca en el fondo
      const hangmanCenterX = canvas.width * 0.75; // 75% del ancho del canvas
      const hangmanCenterY = canvas.height * 0.25; // 25% de la altura del canvas
      
      // Dibujar partes del muñeco según errores usando las imágenes
      if (game.wrongGuesses >= 1 && headImage.complete && headImage.naturalWidth > 0) {
        console.log('Dibujando cabeza');
        const headSize = baseSize;
        ctx.drawImage(headImage, hangmanCenterX - headSize/2, hangmanCenterY - headSize/2, headSize, headSize);
      }
      
      if (game.wrongGuesses >= 2 && bodyImage.complete && bodyImage.naturalWidth > 0) {
        console.log('Dibujando cuerpo');
        const bodySize = baseSize * 1.2;
        ctx.drawImage(bodyImage, hangmanCenterX - bodySize/2, hangmanCenterY + baseSize/2, bodySize, bodySize);
      }
      
      if (game.wrongGuesses >= 3 && leftArmImage.complete && leftArmImage.naturalWidth > 0) {
        console.log('Dibujando brazo izquierdo');
        const armSize = baseSize * 0.8;
        ctx.drawImage(leftArmImage, hangmanCenterX - baseSize * 1.5, hangmanCenterY + baseSize * 0.5, armSize, armSize);
      }
      
      if (game.wrongGuesses >= 4 && rightArmImage.complete && rightArmImage.naturalWidth > 0) {
        console.log('Dibujando brazo derecho');
        const armSize = baseSize * 0.8;
        ctx.drawImage(rightArmImage, hangmanCenterX + baseSize * 0.5, hangmanCenterY + baseSize * 0.5, armSize, armSize);
      }
      
      if (game.wrongGuesses >= 5 && leftLegImage.complete && leftLegImage.naturalWidth > 0) {
        console.log('Dibujando pierna izquierda');
        const legSize = baseSize * 0.9;
        ctx.drawImage(leftLegImage, hangmanCenterX - baseSize * 0.3, hangmanCenterY + baseSize * 1.8, legSize, legSize);
      }
      
      if (game.wrongGuesses >= 6 && rightLegImage.complete && rightLegImage.naturalWidth > 0) {
        console.log('Dibujando pierna derecha');
        const legSize = baseSize * 0.9;
        ctx.drawImage(rightLegImage, hangmanCenterX + baseSize * 0.3, hangmanCenterY + baseSize * 1.8, legSize, legSize);
      }
      
      // Fallback: dibujar horca simple si las imágenes no están cargadas
      if (hangmanPartsLoaded < totalHangmanParts) {
        // Fallback: dibujar horca simple si las imágenes no están cargadas
        ctx.strokeStyle = '#8b4513';
        ctx.lineWidth = 6;
        
        // Base de la horca
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + width * 0.4, y);
        ctx.stroke();
        
        // Poste vertical
        ctx.beginPath();
        ctx.moveTo(x + width * 0.2, y);
        ctx.lineTo(x + width * 0.2, y - height * 0.8);
        ctx.stroke();
        
        // Travesaño superior
        ctx.beginPath();
        ctx.moveTo(x + width * 0.2, y - height * 0.8);
        ctx.lineTo(x + width * 0.7, y - height * 0.8);
        ctx.stroke();
        
        // Cuerda
        ctx.beginPath();
        ctx.moveTo(x + width * 0.7, y - height * 0.8);
        ctx.lineTo(x + width * 0.7, y - height * 0.6);
        ctx.stroke();
        
        // Dibujar muñeco simple como fallback
        if (game.wrongGuesses >= 1) {
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(x + width * 0.7, y - height * 0.5, 20, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    }
    
    function drawHiddenWord(x, y, word, guessedLetters) {
      ctx.fillStyle = '#000000';
      // Tamaño de fuente responsive para móvil
      const fontSize = Math.min(canvas.width * 0.08, canvas.height * 0.1, 32);
      ctx.font = `bold ${fontSize}px Arial`;
      ctx.textAlign = 'center';
      
      let displayWord = '';
      for (let i = 0; i < word.length; i++) {
        const char = word[i];
        if (char === '_') {
          displayWord += ' ';
        } else if (guessedLetters.includes(char)) {
          displayWord += char;
        } else {
          displayWord += '_';
        }
        displayWord += ' ';
      }
      
      ctx.fillText(displayWord, x, y);
      ctx.textAlign = 'left';
    }
    
    function drawUsedLetters(x, y, guessedLetters) {
      ctx.fillStyle = '#666666';
      // Tamaño de fuente responsive para móvil
      const fontSize = Math.min(canvas.width * 0.04, canvas.height * 0.05, 16);
      ctx.font = `bold ${fontSize}px Arial`;
      ctx.textAlign = 'left';
      
      // Ajustar posición Y para móvil (más arriba para dar espacio al teclado virtual)
      const adjustedY = Math.min(y, canvas.height - 220); // Dejar espacio para el teclado
      
      const usedText = 'Letras usadas: ' + guessedLetters.join(', ');
      ctx.fillText(usedText, x, adjustedY);
    }
    
    function gameLoop() {
      draw();
      if (!game.gameOver) {
        bossGameState.animationId = requestAnimationFrame(gameLoop);
      }
    }
    
    // Iniciar el juego
    gameLoop();
  }

  // Exportar
  window.AdventureBosses = {
    startBossGame
  };

})(window);
