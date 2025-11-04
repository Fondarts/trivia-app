// bosses/catch.js - Boss del Reino de la Ciencia (Catch)
(function(window) {
  'use strict';

  function initScienceCatch(handicap) {
    // Verificar que BossCore esté disponible
    if (!window.BossCore) {
      console.error('❌ BossCore no está disponible. Asegúrate de cargar bosses.js antes que catch.js');
      window.BossCore.updateBossHUD('❌ Error: BossCore no disponible');
      return;
    }
    
    const canvas = window.bossGameState.canvas;
    const ctx = window.bossGameState.ctx;
    
    if (!canvas || !ctx) {
      console.error('❌ Canvas o contexto no están disponibles');
      window.BossCore.updateBossHUD('❌ Error: Canvas no disponible');
      return;
    }
    
    // Usar BossCore.calculateScale para responsive design
    const scaleConfig = window.BossCore.calculateScale(360, 640, canvas, {
      mobileWidth: 360,
      mobileHeight: 640
    });
    const { scale, offsetX, offsetY, baseWidth, baseHeight } = scaleConfig;

    // Cargar imagen de fondo
    let bgImage = null;
    let bgImageLoaded = false;
    window.BossCore.loadBossImage('assets/backgrounds/ciencia_bg.png')
      .then(img => { 
        bgImage = img; 
        bgImageLoaded = true; 
      })
      .catch(() => { 
        bgImageLoaded = false; 
      });

    // Cargar imagen del científico
    let scientistImage = null;
    let scientistImageLoaded = false;
    window.BossCore.loadBossImage('assets/bosses/cientifico.webp')
      .then(img => { 
        scientistImage = img; 
        scientistImageLoaded = true; 
      })
      .catch(() => { 
        scientistImageLoaded = false; 
      });

    // Obtener avatar del usuario
    function getUserAvatar() {
      if (window.getCurrentUser) {
        const user = window.getCurrentUser();
        if (user && user.avatar) {
          return { type: 'image', src: user.avatar };
        }
      }
      return { type: 'emoji', value: '🔬' };
    }

    const userAvatar = getUserAvatar();
    let avatarImage = null;
    if (userAvatar.type === 'image') {
      avatarImage = new Image();
      avatarImage.src = userAvatar.src;
      avatarImage.onerror = () => {
        userAvatar.type = 'emoji';
        userAvatar.value = '🔬';
      };
    }

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

    // Sistema de fórmulas químicas con sus nombres
    const chemicalFormulas = [
      { formula: 'H₂O', name: 'Agua', components: ['H₂', 'O'] },
      { formula: 'CO₂', name: 'Dióxido de carbono', components: ['C', 'O₂'] },
      { formula: 'NH₃', name: 'Amoníaco', components: ['N', 'H₃'] },
      { formula: 'H₂SO₄', name: 'Ácido sulfúrico', components: ['H₂', 'S', 'O₄'] },
      { formula: 'C₆H₁₂O₆', name: 'Glucosa', components: ['C₆', 'H₁₂', 'O₆'] },
      { formula: 'CH₄', name: 'Metano', components: ['C', 'H₄'] },
      { formula: 'NaCl', name: 'Cloruro de sodio', components: ['Na', 'Cl'] },
      { formula: 'CaCO₃', name: 'Carbonato de calcio', components: ['Ca', 'C', 'O₃'] },
      { formula: 'H₂O₂', name: 'Peróxido de hidrógeno', components: ['H₂', 'O₂'] },
      { formula: 'Fe₂O₃', name: 'Óxido de hierro', components: ['Fe₂', 'O₃'] }
    ];
    
    // Mezclar las fórmulas para que no sean siempre las mismas
    const shuffledFormulas = [...chemicalFormulas].sort(() => Math.random() - 0.5);
    let currentFormulaIndex = 0;
    let currentFormula = shuffledFormulas[0];
    let capturedElements = []; // Elementos capturados para la fórmula actual
    
    // Todos los elementos químicos posibles (buenos y malos) con colores y formas asignados
    const elementConfigs = {
      'H': { color: '#3498db', shape: 'circle' },      // Azul - Círculo
      'H₂': { color: '#3498db', shape: 'square' },     // Azul - Cuadrado
      'H₃': { color: '#3498db', shape: 'hexagon' },     // Azul - Hexágono
      'H₄': { color: '#5dade2', shape: 'circle' },     // Azul claro - Círculo
      'H₁₂': { color: '#5dade2', shape: 'square' },    // Azul claro - Cuadrado
      'O': { color: '#e74c3c', shape: 'circle' },       // Rojo - Círculo
      'O₂': { color: '#e74c3c', shape: 'square' },      // Rojo - Cuadrado
      'O₃': { color: '#c0392b', shape: 'hexagon' },     // Rojo oscuro - Hexágono
      'O₄': { color: '#c0392b', shape: 'circle' },     // Rojo oscuro - Círculo
      'O₆': { color: '#e74c3c', shape: 'hexagon' },     // Rojo - Hexágono
      'C': { color: '#2ecc71', shape: 'square' },      // Verde - Cuadrado
      'C₆': { color: '#27ae60', shape: 'hexagon' },     // Verde oscuro - Hexágono
      'N': { color: '#9b59b6', shape: 'circle' },       // Morado - Círculo
      'S': { color: '#f39c12', shape: 'square' },       // Naranja - Cuadrado
      'Na': { color: '#e67e22', shape: 'circle' },      // Naranja oscuro - Círculo
      'Cl': { color: '#1abc9c', shape: 'hexagon' },     // Turquesa - Hexágono
      'Ca': { color: '#16a085', shape: 'square' },       // Verde azulado - Cuadrado
      'Fe₂': { color: '#95a5a6', shape: 'circle' },     // Gris - Círculo
      'Au': { color: '#f1c40f', shape: 'hexagon' },     // Dorado - Hexágono
      'Ag': { color: '#ecf0f1', shape: 'square' },      // Plateado - Cuadrado
      'Pb': { color: '#34495e', shape: 'circle' },       // Gris oscuro - Círculo
      'Hg': { color: '#e8f8f5', shape: 'hexagon' },      // Blanco azulado - Hexágono
      'Cu': { color: '#d35400', shape: 'square' },       // Marrón - Cuadrado
      'Zn': { color: '#7f8c8d', shape: 'circle' }        // Gris - Círculo
    };
    
    const allElements = Object.keys(elementConfigs).filter(el => !['Au', 'Ag', 'Pb', 'Hg', 'Cu', 'Zn'].includes(el));
    // Elementos incorrectos (que no pertenecen a ninguna fórmula común)
    const wrongElements = ['Au', 'Ag', 'Pb', 'Hg', 'Cu', 'Zn'];
    
    // Mantener una zona segura inferior
    const safeBottom = 90;
    const player = { x: baseWidth / 2 - 40, y: baseHeight - safeBottom, width: 80, height: 25, speed: 9 * (handicap.playerSpeed || 1) };
    const basketWidth = player.width;
    const basketHeight = player.height;
    
    const objects = [];
    let spawnTimer = 0;
    let spawnInterval = 1200; // Aumentar intervalo inicial
    const maxObjectsOnScreen = 4; // Máximo de objetos simultáneos
    let completedFormulas = 0;
    let lives = 3; // Vidas (corazones) - empezar con 3 vidas
    let baseSpeed = 0.8;
    let speedMultiplier = 1.0;
    let gameTime = 0;
    const objectSize = 35; // Tamaño fijo para los elementos
    
    // Actualizar HUD inicial con las vidas
    const playerName = window.BossCore.getPlayerNameForBoss();
    window.BossCore.updateBossHUD(`Vidas: ${'❤️'.repeat(lives)} | Completadas: ${completedFormulas}/10`);
    
    // Función para verificar si hay superposición al spawnear
    function canSpawnAt(x, size) {
      const minDistance = size + 10; // Distancia mínima entre objetos
      for (const obj of objects) {
        const distance = Math.abs(obj.x - x);
        if (distance < minDistance && obj.y < 100) { // Solo verificar si está cerca de la parte superior
          return false;
        }
      }
      return true;
    }
    
    function spawnObject() {
      // 70% probabilidad de elemento correcto, 30% incorrecto
      const isCorrect = Math.random() < 0.7;
      let element;
      
      if (isCorrect) {
        // Seleccionar un elemento que necesitamos para la fórmula actual
        const neededElements = currentFormula.components.filter(c => !capturedElements.includes(c));
        if (neededElements.length > 0) {
          element = neededElements[Math.floor(Math.random() * neededElements.length)];
        } else {
          // Si ya tenemos todos, seleccionar uno al azar de los componentes
          element = currentFormula.components[Math.floor(Math.random() * currentFormula.components.length)];
        }
      } else {
        // Elemento incorrecto: algo que no está en la fórmula actual
        const wrongOptions = allElements.filter(el => !currentFormula.components.includes(el))
                                      .concat(wrongElements);
        element = wrongOptions[Math.floor(Math.random() * wrongOptions.length)];
      }
      
      // Obtener configuración del elemento (color y forma)
      const elementConfig = elementConfigs[element] || { color: '#95a5a6', shape: 'circle' };
      
      // Intentar spawnear en una posición sin superposición
      let attempts = 0;
      let x;
      do {
        x = Math.random() * (baseWidth - objectSize);
        attempts++;
      } while (!canSpawnAt(x, objectSize) && attempts < 20);
      
      if (attempts >= 20) {
        // Si no se puede encontrar posición, usar posición aleatoria normal
        x = Math.random() * (baseWidth - objectSize);
      }
      
      const currentSpeed = (baseSpeed + Math.random() * 0.6) * speedMultiplier;
      objects.push({ 
        x, 
        y: -objectSize, 
        size: objectSize, 
        speed: currentSpeed, 
        element, 
        isCorrect,
        color: elementConfig.color,
        shape: elementConfig.shape,
        alpha: 1.0, // Opacidad inicial
        prevY: -objectSize // Posición Y anterior para detectar colisiones
      });
    }
    
    function nextFormula() {
      currentFormulaIndex++;
      if (currentFormulaIndex >= shuffledFormulas.length) {
        // Mezclar de nuevo si se acabaron
        shuffledFormulas.sort(() => Math.random() - 0.5);
        currentFormulaIndex = 0;
      }
      currentFormula = shuffledFormulas[currentFormulaIndex];
      capturedElements = [];
    }

    const keys = {};
    document.addEventListener('keydown', (e) => keys[e.key] = true);
    document.addEventListener('keyup', (e) => keys[e.key] = false);

    function update(dt) {
      // Aceleración progresiva: aumentar la velocidad a medida que avanza el juego
      gameTime += dt;
      // Aumentar el multiplicador de velocidad cada 2 segundos (progresión gradual)
      speedMultiplier = 1.0 + (gameTime / 3000) * 0.3; // Progresión más lenta
      // Limitar la velocidad máxima a un valor más conservador
      if (speedMultiplier > 1.8) speedMultiplier = 1.8;

      // teclado opcional
      if (keys['ArrowLeft'] || keys['a'] || keys['A']) player.x -= player.speed;
      if (keys['ArrowRight'] || keys['d'] || keys['D']) player.x += player.speed;
      player.x = Math.max(0, Math.min(baseWidth - player.width, player.x));

      spawnTimer += dt;
      // Solo spawnear si hay menos de maxObjectsOnScreen objetos en pantalla
      if (spawnTimer >= spawnInterval && objects.length < maxObjectsOnScreen) {
        spawnTimer = 0;
        spawnObject();
        spawnInterval = Math.max(800, spawnInterval - 5); // Limitar mínimo a 800ms
      } else if (spawnTimer >= spawnInterval) {
        spawnTimer = 0; // Resetear timer pero no spawnear
      }

      for (let i = objects.length - 1; i >= 0; i--) {
        const o = objects[i];
        // Guardar posición anterior antes de actualizar (importante para detectar colisiones)
        if (o.prevY === undefined) o.prevY = o.y;
        const previousY = o.prevY; // Guardar temporalmente
        o.prevY = o.y; // Actualizar prevY con la posición actual antes de mover
        o.y += o.speed; // Mover el objeto
        
        // Calcular opacidad basada en qué tan fuera del marco está el objeto
        // El objeto comienza a desvanecerse cuando empieza a salir del marco
        const fadeZoneHeight = o.size; // Zona de desvanecimiento de 1 vez el tamaño del objeto
        
        // Verificar si el objeto está dentro del marco visual (0 a baseHeight, 0 a baseWidth)
        const isInsideFrame = o.y >= 0 && o.y + o.size <= baseHeight && o.x >= 0 && o.x + o.size <= baseWidth;
        
        if (isInsideFrame) {
          // El objeto está completamente dentro del marco, opacidad completa
          o.alpha = 1.0;
        } else {
          // El objeto está saliendo del marco, calcular opacidad basada en la distancia
          let distanceOut = 0;
          
          // Salir por abajo (lo más común)
          if (o.y + o.size > baseHeight) {
            distanceOut = (o.y + o.size) - baseHeight;
          }
          // Salir por arriba (no debería pasar, pero por si acaso)
          else if (o.y < 0) {
            distanceOut = Math.abs(o.y);
          }
          // Salir por la derecha
          else if (o.x + o.size > baseWidth) {
            distanceOut = (o.x + o.size) - baseWidth;
          }
          // Salir por la izquierda
          else if (o.x < 0) {
            distanceOut = Math.abs(o.x);
          }
          
          // Calcular opacidad: se desvanece gradualmente en la zona de desvanecimiento
          o.alpha = Math.max(0, 1.0 - (distanceOut / fadeZoneHeight));
        }
        
        // Eliminar objeto solo cuando esté completamente invisible y fuera del marco
        // O cuando esté completamente fuera del área visible (con margen)
        const removalMargin = o.size * 2;
        if (o.alpha <= 0 || o.y + o.size < -removalMargin || o.y > baseHeight + removalMargin || o.x + o.size < -removalMargin || o.x > baseWidth + removalMargin) {
          // NO penalizar si un elemento correcto cae sin ser atrapado - simplemente desaparece
          // Solo eliminar el objeto sin penalización
          objects.splice(i, 1);
          continue;
        }
        
        // ===== COLISIÓN CON EL CIENTÍFICO - LÓGICA SIMPLE Y DIRECTA =====
        // Solo cuenta si el elemento toca la parte SUPERIOR del científico desde ARRIBA
        // El beaker está por encima de la cabeza del científico, así que la zona de colisión debe estar más arriba
        
        // 1. El objeto debe estar cayendo (movimiento hacia abajo)
        if (o.speed <= 0) continue;
        
        // 2. Calcular posiciones del elemento
        const elementBottom = o.y + o.size; // Parte inferior del elemento
        const elementTop = o.y; // Parte superior del elemento
        const elementPrevBottom = previousY + o.size; // Parte inferior anterior
        
        // 3. La zona de colisión está más arriba del científico (donde está el beaker)
        // El beaker está sostenido por encima de la cabeza del científico
        // Necesitamos calcular dónde está el beaker en la pantalla
        // Si la imagen del científico se dibuja desde player.y, el beaker está en la parte superior de esa imagen
        // Calcular la posición real del beaker considerando cómo se dibuja la imagen
        let beakerY = player.y;
        
        if (scientistImageLoaded && scientistImage) {
          // Calcular cómo se dibuja realmente la imagen
          const imgAspect = scientistImage.naturalWidth / scientistImage.naturalHeight;
          let actualDrawHeight = player.height;
          let actualDrawY = player.y;
          
          if (imgAspect <= 1) {
            // Si la imagen es más alta que ancha, se ajusta por ancho y se centra verticalmente
            actualDrawHeight = (player.width / imgAspect);
            actualDrawY = player.y + (player.height - actualDrawHeight) / 2;
          }
          
          // El beaker está en la parte superior de la imagen (aproximadamente en el 5% superior)
          const beakerOffsetInImage = actualDrawHeight * 0.05;
          beakerY = actualDrawY + beakerOffsetInImage;
        } else {
          // Fallback: usar un offset fijo si la imagen no está cargada
          beakerY = player.y - (player.height * 0.5);
        }
        
        const scientistTopY = beakerY; // Zona de colisión donde está el beaker
        
        // 4. Verificar superposición horizontal (con margen para evitar costados)
        const sideMargin = 8; // Margen para evitar capturas por los costados
        const elementLeft = o.x;
        const elementRight = o.x + o.size;
        const scientistLeft = player.x + sideMargin;
        const scientistRight = player.x + player.width - sideMargin;
        
        // Hay superposición horizontal si el elemento está dentro del área del científico (con margen)
        const hasHorizontalOverlap = elementRight > scientistLeft && elementLeft < scientistRight;
        
        // 5. Detectar si el elemento está tocando la parte superior del científico
        // Condición A: La parte inferior del elemento acaba de cruzar la parte superior del científico
        const justCrossedTop = elementPrevBottom < scientistTopY && elementBottom >= scientistTopY;
        
        // Condición B: La parte inferior del elemento está en contacto con la parte superior (tolerancia de 5 píxeles)
        const isTouchingTop = elementBottom >= scientistTopY && elementBottom <= scientistTopY + 5 && elementTop <= scientistTopY;
        
        // 6. El elemento debe estar por encima o tocando la parte superior (no debe haber pasado completamente)
        const isAboveOrTouching = elementTop <= scientistTopY + 5;
        
        // 7. SOLO cuenta si hay superposición horizontal Y el elemento toca la parte superior
        if (hasHorizontalOverlap && isAboveOrTouching && (justCrossedTop || isTouchingTop)) {
          // Verificar si el elemento está en la fórmula actual
          const isInFormula = currentFormula.components.includes(o.element);
          
          if (isInFormula) {
            // Atrapar elemento correcto (está en la fórmula)
            const alreadyCaptured = capturedElements.includes(o.element);
            
            if (!alreadyCaptured) {
              // Agregar el elemento a los capturados (primera vez)
              capturedElements.push(o.element);
              
              // Verificar si se completó la fórmula
              const allCaptured = currentFormula.components.every(comp => capturedElements.includes(comp));
              if (allCaptured) {
                completedFormulas++;
                if (completedFormulas >= 10) {
                  window.BossCore.endBossGame(true);
                  return false;
                }
                // No limpiar objetos, solo cambiar a la siguiente fórmula
                nextFormula();
              }
              
              // Eliminar el objeto después de capturarlo correctamente
              objects.splice(i, 1);
              continue;
            } else {
              // Si ya lo tenemos capturado, restar vida (segunda vez)
              lives--;
              
              // Actualizar HUD con las vidas restantes
              const playerName = window.BossCore.getPlayerNameForBoss();
              window.BossCore.updateBossHUD(`Vidas: ${'❤️'.repeat(lives)} | Completadas: ${completedFormulas}/10`);
              
              // Verificar si aún quedan vidas
              if (lives <= 0) {
                // Sin vidas, perder la partida
                window.BossCore.endBossGame(false);
                return false;
              }
              
              // Eliminar el objeto después de penalizar
              objects.splice(i, 1);
              continue;
            }
          } else {
            // Atrapar elemento INCORRECTO (no está en la fórmula) = RESTAR UN CORAZÓN
            lives--;
            
            // Actualizar HUD con las vidas restantes
            const playerName = window.BossCore.getPlayerNameForBoss();
            window.BossCore.updateBossHUD(`Vidas: ${'❤️'.repeat(lives)} | Completadas: ${completedFormulas}/10`);
            
            // Verificar si aún quedan vidas
            if (lives <= 0) {
              // Sin vidas, perder la partida
              window.BossCore.endBossGame(false);
              return false;
            }
            
            // Eliminar el objeto después de capturarlo
            objects.splice(i, 1);
            continue;
          }
        }
      }

      return true;
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      
      // Dibujar fondo de color base primero
      ctx.fillStyle = '#0b1a2b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Dibujar imagen de fondo con 50% de opacidad encima
      if (bgImageLoaded && bgImage) {
        // Calcular dimensiones manteniendo proporción (fit de altura)
        const bgAspect = bgImage.naturalWidth / bgImage.naturalHeight;
        const baseAspect = baseWidth / baseHeight;
        
        let bgDrawWidth, bgDrawHeight, bgDrawX, bgDrawY;
        
        if (bgAspect > baseAspect) {
          // Imagen más ancha: ajustar a altura (fit vertical)
          bgDrawHeight = baseHeight;
          bgDrawWidth = bgDrawHeight * bgAspect;
          bgDrawX = (baseWidth - bgDrawWidth) / 2;
          bgDrawY = 0;
        } else {
          // Imagen más alta: ajustar a ancho (fit horizontal)
          bgDrawWidth = baseWidth;
          bgDrawHeight = bgDrawWidth / bgAspect;
          bgDrawX = 0;
          bgDrawY = (baseHeight - bgDrawHeight) / 2;
        }
        
        ctx.save();
        ctx.translate(offsetX, offsetY);
        ctx.scale(scale, scale);
        // Establecer opacidad al 50%
        ctx.globalAlpha = 0.5;
        // Dibujar imagen de fondo con proporción correcta
        ctx.drawImage(bgImage, bgDrawX, bgDrawY, bgDrawWidth, bgDrawHeight);
        ctx.restore();
      }
      
      ctx.translate(offsetX, offsetY);
      ctx.scale(scale, scale);

      // Función para desaturar un color (convertir a escala de grises)
      function desaturateColor(hexColor, amount = 0.7) {
        // Convertir hex a RGB
        const r = parseInt(hexColor.slice(1, 3), 16);
        const g = parseInt(hexColor.slice(3, 5), 16);
        const b = parseInt(hexColor.slice(5, 7), 16);
        
        // Calcular el promedio (gris)
        const gray = (r + g + b) / 3;
        
        // Interpolar entre el color original y el gris
        const desaturatedR = Math.round(r * (1 - amount) + gray * amount);
        const desaturatedG = Math.round(g * (1 - amount) + gray * amount);
        const desaturatedB = Math.round(b * (1 - amount) + gray * amount);
        
        // Convertir de vuelta a hex
        return `#${desaturatedR.toString(16).padStart(2, '0')}${desaturatedG.toString(16).padStart(2, '0')}${desaturatedB.toString(16).padStart(2, '0')}`;
      }

      // Función para dibujar diferentes formas (definida antes del clip para que esté disponible en el sidebar)
      function drawShape(ctx, x, y, size, shape, color) {
        ctx.fillStyle = color;
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        
        const centerX = x + size / 2;
        const centerY = y + size / 2;
        const radius = size / 2 - 2;
        
        if (shape === 'circle') {
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
          ctx.lineWidth = 2;
          ctx.stroke();
        } else if (shape === 'square') {
          const padding = 2;
          ctx.fillRect(x + padding, y + padding, size - padding * 2, size - padding * 2);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
          ctx.lineWidth = 2;
          ctx.strokeRect(x + padding, y + padding, size - padding * 2, size - padding * 2);
        } else if (shape === 'hexagon') {
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i;
            const hx = centerX + radius * Math.cos(angle);
            const hy = centerY + radius * Math.sin(angle);
            if (i === 0) {
              ctx.moveTo(hx, hy);
            } else {
              ctx.lineTo(hx, hy);
            }
          }
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }

      // Aplicar clip (matte) al área del marco - nada fuera del marco será visible
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, baseWidth, baseHeight);
      ctx.clip();

      // Dibujar canasto en lugar de barra (dentro del clip)
      drawBasket(ctx, player.x, player.y, basketWidth, basketHeight);
      
      // zona segura inferior de referencia (opcional visual mínimo)
      // ctx.fillStyle = 'rgba(255,255,255,0.04)'; ctx.fillRect(0, baseHeight - safeBottom, baseWidth, 1);
      
      // Dibujar elementos químicos (solo la parte dentro del marco será visible gracias al clip)
      for (const o of objects) {
        // Guardar el estado del contexto
        ctx.save();
        
        // Aplicar opacidad al objeto
        ctx.globalAlpha = o.alpha || 1.0;
        
        // Dibujar forma con su color asignado
        drawShape(ctx, o.x, o.y, o.size, o.shape, o.color);
        
        // Texto del elemento químico
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(o.element, o.x + o.size / 2, o.y + o.size / 2);
        
        // Restaurar el estado del contexto
        ctx.restore();
      }

      // Restaurar el clip después de dibujar todos los elementos
      ctx.restore();
      
      // Dibujar marco mejorado alrededor del área de juego (FUERA del clip para que sea visible)
      ctx.save();
      
      // Marco exterior con efecto glow
      ctx.strokeStyle = '#5a9ff2';
      ctx.lineWidth = 5;
      ctx.shadowColor = '#00ffff';
      ctx.shadowBlur = 15;
      ctx.strokeRect(0, 0, baseWidth, baseHeight);
      
      // Marco interior brillante
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 2;
      ctx.shadowBlur = 8;
      ctx.strokeRect(2, 2, baseWidth - 4, baseHeight - 4);
      
      // Marco interior más sutil para profundidad
      ctx.strokeStyle = 'rgba(90, 159, 242, 0.4)';
      ctx.lineWidth = 1;
      ctx.shadowBlur = 0;
      ctx.strokeRect(4, 4, baseWidth - 8, baseHeight - 8);
      
      ctx.restore();
      
      // Restaurar transformaciones
      ctx.restore();
      
      // Mostrar fórmula actual a la derecha (como en Tetris)
      const sidebarX = offsetX + (baseWidth * scale) + 20;
      let sidebarY = offsetY + 20;
      
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 20px monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      
      // Fórmula objetivo con nombre
      ctx.fillText(`Fórmula:`, sidebarX, sidebarY);
      sidebarY += 25;
      ctx.font = 'bold 24px Arial';
      ctx.fillText(`${currentFormula.formula} = ${currentFormula.name}`, sidebarX, sidebarY);
      sidebarY += 35;
      
      // Componentes necesarios
      ctx.font = 'bold 16px monospace';
      ctx.fillText('Necesitas:', sidebarX, sidebarY);
      sidebarY += 30;
      
      // Dibujar cada componente visualmente con su forma y color
      let currentX = sidebarX;
      const elementDisplaySize = 35; // Tamaño para mostrar los elementos en la fórmula (aumentado para mejor visibilidad)
      const elementSpacing = 45; // Espacio entre elementos (aumentado proporcionalmente)
      
      currentFormula.components.forEach((comp, index) => {
        const isCaptured = capturedElements.includes(comp);
        const elementConfig = elementConfigs[comp] || { color: '#95a5a6', shape: 'circle' };
        
        // Determinar el color a usar: original si está capturado, desaturado si no
        const displayColor = isCaptured ? elementConfig.color : desaturateColor(elementConfig.color, 0.9);
        
        // Dibujar el elemento con su forma y color
        ctx.save();
        ctx.globalAlpha = 1.0; // Siempre opacidad completa para mejor legibilidad
        
        // Dibujar la forma del elemento
        const elementY = sidebarY;
        drawShape(ctx, currentX, elementY, elementDisplaySize, elementConfig.shape, displayColor);
        
        // Dibujar el texto del elemento (siempre con buena visibilidad)
        ctx.fillStyle = '#fff'; // Texto siempre blanco y visible
        ctx.font = isCaptured ? 'bold 16px Arial' : '16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(comp, currentX + elementDisplaySize / 2, elementY + elementDisplaySize / 2);
        
        ctx.restore();
        
        // Agregar el símbolo "+" entre elementos (excepto el último)
        if (index < currentFormula.components.length - 1) {
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 16px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          // Centrar verticalmente el "+" en el centro exacto del elemento
          const plusX = currentX + elementDisplaySize + (elementSpacing / 2);
          const plusY = elementY + elementDisplaySize / 2;
          ctx.fillText('+', plusX, plusY);
        }
        
        currentX += elementDisplaySize + elementSpacing;
      });
      
      sidebarY += elementDisplaySize + 20;
      
      // Vidas (corazones)
      ctx.font = 'bold 16px monospace';
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(`Vidas: ${'❤️'.repeat(lives)}`, sidebarX, sidebarY);
      sidebarY += 25;
      
      // Contador de fórmulas completadas (alineado correctamente)
      ctx.font = 'bold 16px monospace';
      ctx.fillStyle = '#2ecc71';
      ctx.textAlign = 'left'; // Asegurar alineamiento a la izquierda
      ctx.textBaseline = 'top'; // Asegurar alineamiento superior
      ctx.fillText(`Completadas: ${completedFormulas}/10`, sidebarX, sidebarY);
    }

    // Función para dibujar el científico (reemplaza al canasto)
    function drawBasket(ctx, x, y, width, height) {
      ctx.save();
      
      if (scientistImageLoaded && scientistImage) {
        // Dibujar imagen del científico escalada al tamaño del área del jugador
        // Ajustar altura para mantener proporción, centrando horizontalmente
        const imgAspect = scientistImage.naturalWidth / scientistImage.naturalHeight;
        let drawWidth = width;
        let drawHeight = height;
        let drawX = x;
        let drawY = y;
        
        // Si la imagen es más ancha que alta, ajustar por altura
        if (imgAspect > 1) {
          drawHeight = height;
          drawWidth = drawHeight * imgAspect;
          drawX = x + (width - drawWidth) / 2;
        } else {
          // Si la imagen es más alta que ancha, ajustar por ancho
          drawWidth = width;
          drawHeight = drawWidth / imgAspect;
          drawY = y + (height - drawHeight) / 2;
        }
        
        // Dibujar la imagen del científico
        ctx.drawImage(scientistImage, drawX, drawY, drawWidth, drawHeight);
        
        // Dibujar avatar del usuario en la cara del científico
        // La cara está aproximadamente en el 35% superior de la imagen y centrada horizontalmente
        const faceSize = drawHeight * 0.14; // Tamaño de la cara (14% de la altura de la imagen)
        const faceX = drawX + drawWidth / 2; // Centrado horizontal
        const faceY = drawY + drawHeight * 0.38; // Aproximadamente en el 38% superior (bajado un poco)
        
        ctx.save();
        // Crear círculo de recorte para el avatar
        ctx.beginPath();
        ctx.arc(faceX, faceY, faceSize, 0, Math.PI * 2);
        ctx.clip();
        
        if (userAvatar.type === 'image' && avatarImage && avatarImage.complete) {
          // Dibujar la imagen del avatar del usuario
          ctx.drawImage(avatarImage, 
            faceX - faceSize, 
            faceY - faceSize, 
            faceSize * 2, 
            faceSize * 2);
        } else {
          // Si no hay imagen, usar fondo blanco con emoji
          ctx.fillStyle = '#fff';
          ctx.fillRect(faceX - faceSize, faceY - faceSize, faceSize * 2, faceSize * 2);
          ctx.fillStyle = '#000';
          ctx.font = `${faceSize * 0.8}px Arial`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(userAvatar.value, faceX, faceY);
        }
        ctx.restore();
        
        // Borde alrededor del avatar (opcional, para que se vea mejor)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(faceX, faceY, faceSize, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        // Fallback: dibujar un rectángulo simple si la imagen no está cargada
        ctx.fillStyle = '#3498db';
        ctx.fillRect(x, y, width, height);
      }
      
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

    // Ocultar HUD antes de iniciar el loop (ya no se usa)
    const hud = document.getElementById('bossGameHUD');
    if (hud) hud.style.display = 'none';
    
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
