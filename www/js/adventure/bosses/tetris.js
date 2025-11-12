// bosses/tetris.js - Boss de Historia (Tetris)
(function(window) {
  'use strict';

  function initHistoryTetris(handicap) {
    const canvas = window.bossGameState.canvas;
    const ctx = window.bossGameState.ctx;
    const cols = 10;
    const rows = 20;
    const PAD = 20;
    const BOSS_SPACE = 120; // Espacio arriba para el demonio
    // Sin HUD superior, centrar el tablero verticalmente dejando espacio para el demonio
    const playW = canvas.width - PAD * 2;
    // Dejar espacio inferior (80px aprox.) y el demonio arriba
    const playH = canvas.height - (PAD * 2 + 80 + BOSS_SPACE);
    const cell = Math.max(12, Math.floor(Math.min(playW / cols, playH / rows)));
    const offsetX = Math.floor(PAD + (playW - cols * cell) / 2);
    const offsetY = Math.floor(PAD + BOSS_SPACE + (playH - rows * cell) / 2);
    const grid = Array.from({ length: rows }, () => Array(cols).fill(0));
    let cleared = 0;
    const linesRequired = handicap.linesRequired || 10; // Líneas requeridas para ganar
    // Calcular velocidad basada en bossSpeed:
    // bossSpeed 1.0 = 620ms (normal)
    // bossSpeed 1.2 = 560ms (rápido)
    // bossSpeed 1.4 = 500ms (muy rápido)
    // bossSpeed 1.6 = 440ms (extremo)
    // bossSpeed 1.8 = 380ms (máximo)
    const baseInterval = 620;
    const speedMultiplier = handicap.bossSpeed || 1.0;
    let fallInterval = Math.max(250, Math.floor(baseInterval - (speedMultiplier - 1) * 150));
    let last = 0;
    
    // Agregar líneas basura de entrada si hay handicap
    const startingLines = handicap.startingLines || 0;
    if (startingLines > 0) {
      // Llenar las últimas N filas con bloques aleatorios (dejando al menos un espacio vacío por fila)
      for (let y = rows - startingLines; y < rows; y++) {
        const filledCells = Math.floor(cols * 0.7); // 70% de las celdas llenas
        const emptyCells = cols - filledCells;
        const emptyPositions = new Set();
        
        // Seleccionar posiciones aleatorias para dejar vacías
        while (emptyPositions.size < emptyCells) {
          emptyPositions.add(Math.floor(Math.random() * cols));
        }
        
        // Llenar el resto con bloques aleatorios (IDs 1-7, correspondientes a los colores)
        for (let x = 0; x < cols; x++) {
          if (!emptyPositions.has(x)) {
            grid[y][x] = Math.floor(Math.random() * 7) + 1; // ID 1-7
          }
        }
      }
    }

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
    
    // Cargar imágenes usando BossCore helpers
    let bgImg = null;
    let bossImg = null;
    
    window.BossCore.loadBossImage('./assets/maps/tetris02.webp')
      .then(img => { bgImg = img; })
      .catch(() => { bgImg = null; });
    
    window.BossCore.loadBossImage('./assets/bosses/desert_boss.webp')
      .then(img => { bossImg = img; })
      .catch(() => { bossImg = null; });

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
        if (cleared >= linesRequired) return window.BossCore.endBossGame(true);
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
      const canvas = window.bossGameState.canvas;
      let touchStartX = null;
      let touchStartY = null;
      let lastSwipeHandledAt = 0;
      let holdInterval = null; // Intervalo para caída continua al mantener presionado
      let touchStartTime = 0;
      let isHolding = false;
      const swipeThreshold = 20; // píxeles mínimos para considerar swipe
      const holdThreshold = 15; // píxeles máximos de movimiento para considerar "hold"
      const repeatEveryMs = 50; // repetición al mantener swipe (más rápido)
      const holdDelayMs = 200; // delay antes de activar caída continua al mantener presionado

      // Tap en pantalla para rotar (solo si no hay touch activo)
      canvas.addEventListener('click', (e) => {
        // Solo rotar si no hay un touch activo (para evitar conflictos)
        if (touchStartX === null && touchStartY === null) {
          const r = rotate(piece.m);
          if (!collide(piece.x, piece.y, r)) piece.m = r;
        }
      });

      canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const t = e.touches[0];
        touchStartX = t.clientX;
        touchStartY = t.clientY;
        touchStartTime = performance.now();
        lastSwipeHandledAt = performance.now();
        isHolding = false;
        
        // Limpiar cualquier intervalo anterior
        if (holdInterval) {
          clearInterval(holdInterval);
          holdInterval = null;
        }
      }, { passive: false });

      canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const t = e.touches[0];
        const dx = t.clientX - touchStartX;
        const dy = t.clientY - touchStartY;
        const now = performance.now();
        const totalMovement = Math.sqrt(dx * dx + dy * dy);
        
        // Limpiar intervalo de hold si hay movimiento significativo
        if (holdInterval && totalMovement > holdThreshold) {
          clearInterval(holdInterval);
          holdInterval = null;
          isHolding = false;
        }
        
        // Detectar movimiento horizontal
        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > swipeThreshold) {
          if (now - lastSwipeHandledAt >= repeatEveryMs) {
            if (dx > 0) {
              if (!collide(piece.x + 1, piece.y, piece.m)) piece.x++;
            } else {
              if (!collide(piece.x - 1, piece.y, piece.m)) piece.x--;
            }
            lastSwipeHandledAt = now;
            touchStartX = t.clientX; // reiniciar para permitir movimientos por pasos
          }
        } 
        // Detectar swipe hacia abajo
        else if (Math.abs(dy) > Math.abs(dx) && dy > swipeThreshold) {
          // Caída rápida al deslizar hacia abajo
          if (now - lastSwipeHandledAt >= repeatEveryMs) {
            if (!collide(piece.x, piece.y + 1, piece.m)) piece.y++;
            lastSwipeHandledAt = now;
            touchStartY = t.clientY; // reiniciar para permitir movimientos continuos
          }
        }
        // Si no hay movimiento significativo, activar "hold" después de un delay
        else if (totalMovement <= holdThreshold && !isHolding && (now - touchStartTime) > holdDelayMs) {
          isHolding = true;
          // Activar caída continua mientras se mantiene presionado
          if (holdInterval) clearInterval(holdInterval);
          holdInterval = setInterval(() => {
            if (!collide(piece.x, piece.y + 1, piece.m)) {
              piece.y++;
            } else {
              // Si no puede bajar más, detener el intervalo
              if (holdInterval) {
                clearInterval(holdInterval);
                holdInterval = null;
              }
            }
          }, repeatEveryMs);
        }
      }, { passive: false });

      canvas.addEventListener('touchend', (e) => {
        e.preventDefault();
        // Limpiar intervalo al soltar
        if (holdInterval) {
          clearInterval(holdInterval);
          holdInterval = null;
        }
        touchStartX = null;
        touchStartY = null;
        isHolding = false;
      }, { passive: false });
      
      canvas.addEventListener('touchcancel', (e) => {
        e.preventDefault();
        // Limpiar intervalo al cancelar
        if (holdInterval) {
          clearInterval(holdInterval);
          holdInterval = null;
        }
        touchStartX = null;
        touchStartY = null;
        isHolding = false;
      }, { passive: false });
    }

    // Agregar controles táctiles (tap y swipe) y ocultar cualquier UI de flechas
    addTetrisTouchControls();
    
    // Ocultar HUD superior (info ahora está al costado)
    window.BossCore.updateBossHUD('');

    function update(t) {
      window.bossGameState.animationId = requestAnimationFrame(update);
      if (!last) last=t; const dt=t-last; 
      if (dt>fallInterval) { 
        last=t; 
        if (!collide(piece.x,piece.y+1,piece.m)) piece.y++; 
        else { 
          merge(); 
          piece = nextPiece; 
          piece.x = 3; piece.y = 0; 
          nextPiece = newPiece(); 
          if (collide(piece.x,piece.y,piece.m)) return window.BossCore.endBossGame(false);
        } 
      }

      // draw
      ctx.clearRect(0,0,canvas.width,canvas.height);
      // Fondo completo con opacidad reducida (fuera del marco)
      if (bgImg && bgImg.complete && bgImg.naturalWidth && bgImg.naturalHeight) {
        try {
          ctx.save();
          ctx.globalAlpha = 0.7; // 70% de opacidad para el fondo fuera del marco
          // Dibujar el fondo en todo el canvas, manteniendo la proporción
          const bgAspectRatio = bgImg.naturalWidth / bgImg.naturalHeight;
          const canvasAspectRatio = canvas.width / canvas.height;
          const isMobile = canvas.height > canvas.width; // Detectar móvil por orientación
          
          let drawWidth, drawHeight, drawX, drawY;
          
          // === Lógica para "vertical fit" en móvil y mantener proporción en PC ===
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
          
          ctx.drawImage(bgImg, drawX, drawY, drawWidth, drawHeight);
          ctx.restore();
        } catch {}
      }
      
      // Fondo con opacidad reducida dentro del área del marco (para que se vea a través del tablero)
      if (bgImg && bgImg.complete && bgImg.naturalWidth && bgImg.naturalHeight) {
        try {
          ctx.save();
          ctx.globalAlpha = 0.15; // Opacidad reducida solo dentro del marco (más transparente)
          // Recortar al rectángulo del tablero
          ctx.beginPath();
          ctx.rect(offsetX, offsetY, cols*cell, rows*cell);
          ctx.clip();
          
          const bgAspectRatio = bgImg.naturalWidth / bgImg.naturalHeight;
          const canvasAspectRatio = canvas.width / canvas.height;
          const isMobile = canvas.height > canvas.width; // Detectar móvil por orientación
          
          let drawWidth, drawHeight, drawX, drawY;
          
          // === Lógica para "vertical fit" en móvil y mantener proporción en PC ===
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
          
          ctx.drawImage(bgImg, drawX, drawY, drawWidth, drawHeight);
          ctx.restore();
        } catch {}
      }
      
      // tablero (marco) - agregar fill negro con opacidad
      ctx.save();
      ctx.globalAlpha = 0.4; // 40% de opacidad
      ctx.fillStyle = '#000'; // Negro
      ctx.fillRect(offsetX-1, offsetY-1, cols*cell+2, rows*cell+2);
      ctx.restore();
      
      // Dibujar el borde del marco
      ctx.strokeStyle = '#888';
      ctx.lineWidth = 2;
      ctx.strokeRect(offsetX-1, offsetY-1, cols*cell+2, rows*cell+2);
      for (let y=0;y<rows;y++) for (let x=0;x<cols;x++) if (grid[y][x]) drawCell(x,y,colors[grid[y][x]-1]);
      // pieza
      for (let y=0;y<piece.m.length;y++) for (let x=0;x<piece.m[y].length;x++) if (piece.m[y][x]) drawCell(piece.x+x,piece.y+y,colors[piece.id]);

      // Detectar si es móvil
      const isMobile = canvas.height > canvas.width;
      
      // Demonio arriba del tablero
      let bx = 0, by = 0, bW = 0, bH = 0;
      if (bossImg && bossImg.complete && bossImg.naturalWidth && bossImg.naturalHeight) {
        const bwRatio = bossImg.naturalWidth / bossImg.naturalHeight;
        const targetW = Math.max(100, Math.floor(cols * cell * 0.35));
        bW = targetW;
        bH = Math.floor(targetW / bwRatio);
        bx = offsetX + Math.floor((cols * cell) / 2) - Math.floor(bW / 2);
        by = PAD + 28; // Posición Y del demonio
        ctx.drawImage(bossImg, bx, by, bW, bH);
      }

      // Preview de siguiente pieza - calcular tamaño primero
      const pvCell = isMobile 
        ? Math.max(10, Math.floor(cell * 0.5)) // Más pequeño en móvil
        : Math.max(12, Math.floor(cell * 0.7)); // Tamaño original en PC
      const pvBoxW = pvCell * 4;
      const pvBoxH = pvCell * 3;
      
      // HUD - posición diferente según si es móvil o PC
      let sidebarX, sidebarY, linesX, linesY, previewX, previewY;
      
      if (isMobile) {
        // Móvil: Líneas alineada al borde izquierdo del marco, Preview alineado con el borde derecho del marco
        const demonCenterX = bx + bW / 2;
        const spacing = 15; // Espacio entre el demonio y los elementos UI
        
        // Líneas alineada al borde izquierdo del marco del juego, justo encima del marco
        linesX = offsetX; // Alineado al borde izquierdo del marco
        linesY = offsetY - 25; // Justo encima del marco del juego
        
        // Preview alineado con el borde derecho del marco del juego
        // El box tiene padding de 4px a cada lado, así que el ancho total es pvBoxW + 8
        previewX = offsetX + cols * cell - pvBoxW - 4; // Alineado al borde derecho del marco
        previewY = linesY - 60; // Más arriba que el texto "Líneas"
        
        // HUD original (para PC) - no se usa en móvil pero mantenemos la variable
        sidebarX = offsetX + cols * cell + 20;
        sidebarY = offsetY + 20;
      } else {
        // PC: mantener posición original al lado derecho del tablero
        sidebarX = offsetX + cols * cell + 20; // 20px de separación del tablero
        sidebarY = offsetY + 20; // Empezar un poco abajo del inicio del tablero
        linesX = sidebarX;
        linesY = sidebarY;
        previewX = sidebarX;
        previewY = sidebarY + 140;
      }
      
      // Líneas completadas (texto blanco)
      ctx.fillStyle = '#fff';
      ctx.font = isMobile ? 'bold 16px monospace' : 'bold 20px monospace'; // Más pequeño en móvil
      ctx.textAlign = isMobile ? 'left' : 'left'; // Alineado a la izquierda para que se vea completo
      ctx.textBaseline = 'top';
      ctx.fillText(`Líneas: ${cleared}/${linesRequired}`, linesX, linesY);
      
      // Fondo y borde para la preview (mismos valores que el marco del juego)
      ctx.save();
      ctx.globalAlpha = 0.4; // 40% de opacidad (igual que el marco)
      ctx.fillStyle = '#000'; // Negro
      ctx.fillRect(previewX - 4, previewY - 4, pvBoxW + 8, pvBoxH + 8);
      ctx.restore();
      
      // Dibujar el borde del preview (igual que el marco)
      ctx.strokeStyle = '#888';
      ctx.lineWidth = 2;
      ctx.strokeRect(previewX - 4, previewY - 4, pvBoxW + 8, pvBoxH + 8);
      
      // Dibujar la pieza siguiente
      for (let y = 0; y < nextPiece.m.length; y++) {
        for (let x = 0; x < nextPiece.m[y].length; x++) {
          if (nextPiece.m[y][x]) {
            ctx.fillStyle = colors[nextPiece.id];
            ctx.fillRect(previewX + x * pvCell, previewY + y * pvCell, pvCell - 1, pvCell - 1);
          }
        }
      }
    }
    update(0);
  }

  // Exponer función
  window.BossGames = window.BossGames || {};
  window.BossGames.initHistoryTetris = initHistoryTetris;

})(window);
