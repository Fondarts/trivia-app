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
    
    // Actualizar HUD para indicar que el juego está iniciando
    window.BossCore.updateBossHUD('Iniciando juego de ciencia...');
    
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
    let misses = 0;
    const maxMisses = 3;
    let baseSpeed = 0.8;
    let speedMultiplier = 1.0;
    let gameTime = 0;
    const objectSize = 35; // Tamaño fijo para los elementos
    
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
          // Si cae un elemento correcto que necesitamos = ERROR (solo cuando sale por abajo completamente)
          if (o.y > baseHeight && o.isCorrect && currentFormula.components.includes(o.element) && !capturedElements.includes(o.element)) {
            misses++;
            if (misses >= maxMisses) {
              window.BossCore.endBossGame(false);
              return false;
            }
          }
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
          if (o.isCorrect && currentFormula.components.includes(o.element)) {
            // Atrapar elemento correcto
            if (!capturedElements.includes(o.element)) {
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
            } else {
              // Atrapar elemento duplicado = ERROR (ya lo tenemos)
              misses++;
              if (misses >= maxMisses) {
                window.BossCore.endBossGame(false);
                return false;
              }
            }
          } else {
            // Atrapar elemento incorrecto = ERROR
            misses++;
            if (misses >= maxMisses) {
              window.BossCore.endBossGame(false);
              return false;
            }
          }
          objects.splice(i, 1);
          continue;
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

      // Aplicar clip (matte) al área del marco - nada fuera del marco será visible
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, baseWidth, baseHeight);
      ctx.clip();

      // Dibujar canasto en lugar de barra (dentro del clip)
      drawBasket(ctx, player.x, player.y, basketWidth, basketHeight);
      
      // zona segura inferior de referencia (opcional visual mínimo)
      // ctx.fillStyle = 'rgba(255,255,255,0.04)'; ctx.fillRect(0, baseHeight - safeBottom, baseWidth, 1);

      // Función para dibujar diferentes formas
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
      
      // Dibujar marco alrededor del área de juego (FUERA del clip para que sea visible)
      ctx.strokeStyle = '#5a9ff2';
      ctx.lineWidth = 4;
      ctx.strokeRect(0, 0, baseWidth, baseHeight);
      
      // Marco interior más sutil
      ctx.strokeStyle = 'rgba(90, 159, 242, 0.3)';
      ctx.lineWidth = 2;
      ctx.strokeRect(2, 2, baseWidth - 4, baseHeight - 4);
      
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
      sidebarY += 25;
      
      const componentsDisplay = currentFormula.components.map(comp => {
        const isCaptured = capturedElements.includes(comp);
        return isCaptured ? `[${comp}]` : comp;
      }).join(' + ');
      
      ctx.font = '18px Arial';
      ctx.fillText(componentsDisplay, sidebarX, sidebarY);
      sidebarY += 40;
      
      // Contador de fórmulas completadas
      ctx.font = 'bold 16px monospace';
      ctx.fillStyle = '#2ecc71';
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
        
        ctx.drawImage(scientistImage, drawX, drawY, drawWidth, drawHeight);
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
