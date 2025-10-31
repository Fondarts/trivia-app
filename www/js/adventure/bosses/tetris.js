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
    // Dejar espacio para el botón Rendirse (70px aprox.) y el demonio arriba
    const playH = canvas.height - (PAD * 2 + 80 + BOSS_SPACE);
    const cell = Math.max(12, Math.floor(Math.min(playW / cols, playH / rows)));
    const offsetX = Math.floor(PAD + (playW - cols * cell) / 2);
    const offsetY = Math.floor(PAD + BOSS_SPACE + (playH - rows * cell) / 2);
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
    
    // Cargar imágenes usando BossCore helpers
    let bgImg = null;
    let bossImg = null;
    
    window.BossCore.loadBossImage('assets/backgrounds/tetris_BG.webp')
      .then(img => { bgImg = img; })
      .catch(() => { bgImg = null; });
    
    window.BossCore.loadBossImage('assets/bosses/desert_boss.webp')
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
        if (cleared >= 10) return window.BossCore.endBossGame(true);
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
      // tablero (fondo) con proporción preservada y ajustado a ALTURA (cover-height)
      if (bgImg && bgImg.complete && bgImg.naturalWidth && bgImg.naturalHeight) {
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

      // Demonio arriba del tablero
      if (bossImg && bossImg.complete && bossImg.naturalWidth && bossImg.naturalHeight) {
        const bwRatio = bossImg.naturalWidth / bossImg.naturalHeight;
        const targetW = Math.max(100, Math.floor(cols * cell * 0.35));
        const bW = targetW;
        const bH = Math.floor(targetW / bwRatio);
        const bx = offsetX + Math.floor((cols * cell) / 2) - Math.floor(bW / 2);
        const by = PAD + 15; // Bajado 5px más
        ctx.drawImage(bossImg, bx, by, bW, bH);
      }

      // HUD al lado derecho del tablero de juego
      const sidebarX = offsetX + cols * cell + 20; // 20px de separación del tablero
      const sidebarY = offsetY + 20; // Empezar un poco abajo del inicio del tablero
      
      // Líneas completadas (texto blanco)
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 20px monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(`Líneas: ${cleared}/10`, sidebarX, sidebarY);
      
      // Instrucciones
      ctx.font = '12px monospace';
      ctx.fillStyle = '#666';
      const instructions = [
        'Click para',
        'rotar',
        '',
        'Controles',
        'para mover'
      ];
      let instY = sidebarY + 35;
      instructions.forEach(line => {
        ctx.fillText(line, sidebarX, instY);
        instY += 14;
      });
      
      // Preview de siguiente pieza
      const pvCell = Math.max(12, Math.floor(cell * 0.7));
      const pvBoxW = pvCell * 4;
      const pvBoxH = pvCell * 3;
      const pvY = sidebarY + 140;
      
      // Fondo y borde para la preview
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fillRect(sidebarX - 4, pvY - 4, pvBoxW + 8, pvBoxH + 8);
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.strokeRect(sidebarX - 4, pvY - 4, pvBoxW + 8, pvBoxH + 8);
      
      // Dibujar la pieza siguiente
      for (let y = 0; y < nextPiece.m.length; y++) {
        for (let x = 0; x < nextPiece.m[y].length; x++) {
          if (nextPiece.m[y][x]) {
            ctx.fillStyle = colors[nextPiece.id];
            ctx.fillRect(sidebarX + x * pvCell, pvY + y * pvCell, pvCell - 1, pvCell - 1);
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
