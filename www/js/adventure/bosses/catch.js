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

    // Mantener una zona segura inferior para no tapar con el botón "Rendirse"
    const safeBottom = 90;
    const player = { x: baseWidth / 2 - 55, y: baseHeight - safeBottom, width: 110, height: 16, speed: 9 * (handicap.playerSpeed || 1) };
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

    function spawnObject() {
      // 75% buenos, 25% malos
      const isGood = Math.random() < 0.75;
      const goodSpritesArray = goodSprites();
      const sprite = (isGood ? goodSpritesArray : badSprites)[Math.floor(Math.random() * (isGood ? goodSpritesArray.length : badSprites.length))];
      const size = 28 + Math.floor(Math.random() * 10);
      objects.push({ x: Math.random() * (baseWidth - size), y: -size, size, speed: 2.7 + Math.random() * 1.8, sprite, good: isGood });
    }

    const keys = {};
    document.addEventListener('keydown', (e) => keys[e.key] = true);
    document.addEventListener('keyup', (e) => keys[e.key] = false);

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
      window.BossCore.updateBossHUD(`Puntos: ${score}/10 · Fallos: ${misses}/${maxMisses} · Evita los rojos`);
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
