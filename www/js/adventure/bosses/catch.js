// bosses/catch.js - Boss del Reino de la Ciencia (Catch)
(function(window) {
  'use strict';

  function initScienceCatch(handicap) {
    const canvas = window.bossGameState.canvas;
    const ctx = window.bossGameState.ctx;
    
    // Usar BossCore.calculateScale para responsive design
    const scaleConfig = window.BossCore.calculateScale(360, 640, canvas, {
      mobileWidth: 360,
      mobileHeight: 640
    });
    const { scale, offsetX, offsetY, baseWidth, baseHeight } = scaleConfig;

    // Cargar imagen del demonio usando BossCore helper
    let demonImage = null;
    let demonLoaded = false;
    window.BossCore.loadBossImage('assets/bosses/demon_boss.webp')
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
    window.BossCore.loadScienceImages().then(images => {
      scienceImages = images;
    });

    // Mantener una zona segura inferior
    const safeBottom = 90;
    const player = { x: baseWidth / 2 - 40, y: baseHeight - safeBottom, width: 80, height: 25, speed: 9 * (handicap.playerSpeed || 1) };
    const basketWidth = player.width;
    const basketHeight = player.height;
    // Usar scienceImages de BossCore (se actualizará cuando se carguen)
    const goodSprites = () => {
      return scienceImages.testTube && scienceImages.burner ? 
        [scienceImages.testTube, scienceImages.burner, scienceImages.flask, scienceImages.lab, scienceImages.microscope].filter(img => img) : [];
    };
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
    let baseSpeed = 0.8; // Velocidad base inicial (muy lento)
    let speedMultiplier = 1.0; // Multiplicador que aumenta con el tiempo
    let gameTime = 0; // Tiempo transcurrido en el juego

    function spawnObject() {
      // 75% buenos (ciencia), 25% malos (no ciencia)
      const isGood = Math.random() < 0.75;
      const goodSpritesArray = goodSprites();
      const sprite = (isGood ? goodSpritesArray : badSprites)[Math.floor(Math.random() * (isGood ? goodSpritesArray.length : badSprites.length))];
      const size = 28 + Math.floor(Math.random() * 10);
      // Velocidad base + aleatorio, multiplicado por el multiplicador de velocidad
      // Reducido el rango aleatorio también para empezar más lento
      const currentSpeed = (baseSpeed + Math.random() * 0.6) * speedMultiplier;
      objects.push({ x: Math.random() * (baseWidth - size), y: -size, size, speed: currentSpeed, sprite, good: isGood });
    }

    const keys = {};
    document.addEventListener('keydown', (e) => keys[e.key] = true);
    document.addEventListener('keyup', (e) => keys[e.key] = false);

    function update(dt) {
      // Aceleración progresiva: aumentar la velocidad a medida que avanza el juego
      gameTime += dt;
      // Aumentar el multiplicador de velocidad cada 2 segundos (progresión gradual)
      speedMultiplier = 1.0 + (gameTime / 2000) * 0.5; // Máximo ~2.5x después de mucho tiempo
      // Limitar la velocidad máxima para que el juego siga siendo jugable
      if (speedMultiplier > 3.0) speedMultiplier = 3.0;

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
        // Actualizar velocidad del objeto con el multiplicador actual
        o.y += o.speed;
        
        // Colisión con el canasto
        if (o.y + o.size >= player.y && o.y <= player.y + player.height && o.x + o.size >= player.x && o.x <= player.x + player.width) {
          if (o.good) {
            // Atrapar objeto de CIENCIA = CORRECTO, suma puntos
            score++;
          } else {
            // Atrapar objeto NO CIENCIA = ERROR, pierde vida
            misses++;
          }
          objects.splice(i, 1);
          continue;
        }
        
        // Objeto cae al suelo
        if (o.y > baseHeight) {
          if (o.good) {
            // Dejar caer objeto de CIENCIA = ERROR, pierde vida
            misses++;
          } else {
            // Dejar caer objeto NO CIENCIA = CORRECTO, no pasa nada
            // No incrementamos misses ni score
          }
          objects.splice(i, 1);
        }
      }

      if (score >= 10) { window.BossCore.endBossGame(true); return false; }
      if (misses >= maxMisses) { window.BossCore.endBossGame(false); return false; }
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

      // Dibujar canasto en lugar de barra
      drawBasket(ctx, player.x, player.y, basketWidth, basketHeight);
      
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
      window.BossCore.updateBossHUD(`Puntos: ${score}/10 · Fallos: ${misses}/${maxMisses} · Atrapa solo ciencia`);
    }

    // Función para dibujar el canasto
    function drawBasket(ctx, x, y, width, height) {
      ctx.save();
      
      // Cuerpo del canasto (parte inferior)
      ctx.fillStyle = '#8B4513'; // Color marrón
      ctx.fillRect(x, y + height * 0.4, width, height * 0.6);
      
      // Borde superior del canasto (arco)
      ctx.strokeStyle = '#654321';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x + width / 2, y + height * 0.4, width / 2, 0, Math.PI);
      ctx.stroke();
      
      // Líneas horizontales del tejido del canasto
      ctx.strokeStyle = '#654321';
      ctx.lineWidth = 2;
      for (let i = 1; i < 3; i++) {
        const lineY = y + height * 0.4 + (height * 0.6 / 4) * i;
        ctx.beginPath();
        ctx.moveTo(x + 5, lineY);
        ctx.lineTo(x + width - 5, lineY);
        ctx.stroke();
      }
      
      // Líneas verticales del tejido del canasto
      ctx.strokeStyle = '#654321';
      ctx.lineWidth = 1.5;
      for (let i = 1; i < 5; i++) {
        const lineX = x + (width / 6) * i;
        ctx.beginPath();
        ctx.moveTo(lineX, y + height * 0.4);
        ctx.lineTo(lineX, y + height);
        ctx.stroke();
      }
      
      // Asas del canasto (opcional, para mejor visual)
      ctx.strokeStyle = '#654321';
      ctx.lineWidth = 3;
      // Asa izquierda
      ctx.beginPath();
      ctx.arc(x - 5, y + height * 0.5, 8, Math.PI / 2, Math.PI * 1.5);
      ctx.stroke();
      // Asa derecha
      ctx.beginPath();
      ctx.arc(x + width + 5, y + height * 0.5, 8, -Math.PI / 2, Math.PI / 2);
      ctx.stroke();
      
      ctx.restore();
    }

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
      window.bossGameState.animationId = requestAnimationFrame(loop);
      if (!last) last = t; const dt = t - last; last = t;
      if (!update(dt)) return;
      draw();
    }
    loop(0);
  }

  // Exponer función
  window.BossGames = window.BossGames || {};
  window.BossGames.initScienceCatch = initScienceCatch;

})(window);
