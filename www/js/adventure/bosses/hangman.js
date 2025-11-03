// bosses/hangman.js - Boss del Atlas Mundial (Hangman)
(function(window) {
  'use strict';

  // === BASE DE DATOS DE PALABRAS PARA HANGMAN ===
  // Solo países y capitales conocidos, traducidos según el idioma de la app
  function getGeographyWords() {
    // Obtener idioma actual de la app
    let lang = 'es'; // Por defecto español
    try {
      // Intentar obtener el idioma desde localStorage
      const savedLang = localStorage.getItem('trivia_lang') || localStorage.getItem('lang') || 'es';
      lang = (savedLang === 'en' || savedLang === 'es') ? savedLang : 'es';
    } catch (e) {
      // Si hay error, usar español por defecto
      lang = 'es';
    }
    
    // Países y capitales conocidos en español
    const wordsEs = {
      countries: [
        'ARGENTINA', 'AUSTRALIA', 'AUSTRIA', 'BELGICA', 'BRASIL', 'CANADA',
        'CHILE', 'CHINA', 'COLOMBIA', 'CROACIA', 'DINAMARCA', 'ECUADOR',
        'EGIPTO', 'ESPAÑA', 'ESTADOS_UNIDOS', 'FINLANDIA', 'FRANCIA', 'ALEMANIA',
        'GRECIA', 'GUATEMALA', 'HONDURAS', 'HUNGRIA', 'INDIA', 'INDONESIA',
        'IRLANDA', 'ISRAEL', 'ITALIA', 'JAMAICA', 'JAPON', 'JORDANIA',
        'KENIA', 'MARRUECOS', 'MEXICO', 'NUEVA_ZELANDA', 'NIGERIA', 'NORUEGA',
        'PAKISTAN', 'PANAMA', 'PERU', 'FILIPINAS', 'POLONIA', 'PORTUGAL',
        'REINO_UNIDO', 'RUMANIA', 'RUSIA', 'SENEGAL', 'SINGAPUR', 'SUDAFRICA',
        'COREA_DEL_SUR', 'SUECIA', 'SUIZA', 'TAILANDIA', 'TURQUIA', 'UCRANIA',
        'URUGUAY', 'VENEZUELA', 'VIETNAM'
      ],
      capitals: [
        'MADRID', 'PARIS', 'LONDRES', 'BERLIN', 'ROMA', 'LISBOA', 'VIENA',
        'ATENAS', 'DUBLIN', 'OSLO', 'ESTOCOLMO', 'HELSINKI', 'COPENHAGUE',
        'BRUSELAS', 'AMSTERDAM', 'PRAGA', 'VARSOVIA', 'BUDAPEST', 'MOSCU',
        'ANKARA', 'CAIRO', 'TOKIO', 'PEKIN', 'SEUL', 'NUEVA_DELHI',
        'BANGKOK', 'HANOI', 'MANILA', 'BAGDAD', 'DOHA', 'JERUSALEN',
        'BOGOTA', 'LIMA', 'SANTIAGO', 'BUENOS_AIRES', 'MONTEVIDEO', 'QUITO',
        'BRASILIA', 'CARACAS', 'LA_HABANA', 'SAN_JOSE', 'CIUDAD_DE_PANAMA',
        'KINGSTON', 'SANTO_DOMINGO', 'MEXICO', 'GUATEMALA', 'OTTAWA',
        'WASHINGTON', 'WELLINGTON'
      ]
    };
    
    // Países y capitales conocidos en inglés
    const wordsEn = {
      countries: [
        'ARGENTINA', 'AUSTRALIA', 'AUSTRIA', 'BELGIUM', 'BRAZIL', 'CANADA',
        'CHILE', 'CHINA', 'COLOMBIA', 'CROATIA', 'DENMARK', 'ECUADOR',
        'EGYPT', 'SPAIN', 'UNITED_STATES', 'FINLAND', 'FRANCE', 'GERMANY',
        'GREECE', 'GUATEMALA', 'HONDURAS', 'HUNGARY', 'INDIA', 'INDONESIA',
        'IRELAND', 'ISRAEL', 'ITALY', 'JAMAICA', 'JAPAN', 'JORDAN',
        'KENYA', 'MOROCCO', 'MEXICO', 'NEW_ZEALAND', 'NIGERIA', 'NORWAY',
        'PAKISTAN', 'PANAMA', 'PERU', 'PHILIPPINES', 'POLAND', 'PORTUGAL',
        'UNITED_KINGDOM', 'ROMANIA', 'RUSSIA', 'SENEGAL', 'SINGAPORE', 'SOUTH_AFRICA',
        'SOUTH_KOREA', 'SWEDEN', 'SWITZERLAND', 'THAILAND', 'TURKEY', 'UKRAINE',
        'URUGUAY', 'VENEZUELA', 'VIETNAM'
      ],
      capitals: [
        'MADRID', 'PARIS', 'LONDON', 'BERLIN', 'ROME', 'LISBON', 'VIENNA',
        'ATHENS', 'DUBLIN', 'OSLO', 'STOCKHOLM', 'HELSINKI', 'COPENHAGEN',
        'BRUSSELS', 'AMSTERDAM', 'PRAGUE', 'WARSAW', 'BUDAPEST', 'MOSCOW',
        'ANKARA', 'CAIRO', 'TOKYO', 'BEIJING', 'SEOUL', 'NEW_DELHI',
        'BANGKOK', 'HANOI', 'MANILA', 'BAGHDAD', 'DOHA', 'JERUSALEM',
        'BOGOTA', 'LIMA', 'SANTIAGO', 'BUENOS_AIRES', 'MONTEVIDEO', 'QUITO',
        'BRASILIA', 'CARACAS', 'HAVANA', 'SAN_JOSE', 'PANAMA_CITY',
        'KINGSTON', 'SANTO_DOMINGO', 'MEXICO_CITY', 'GUATEMALA_CITY', 'OTTAWA',
        'WASHINGTON', 'WELLINGTON'
      ]
    };
    
    return lang === 'en' ? wordsEn : wordsEs;
  }
  
  const GEOGRAPHY_WORDS = getGeographyWords();

  function initGeographyHangman(handicap) {
    const canvas = window.bossGameState.canvas;
    const ctx = window.bossGameState.ctx;
    
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
    
    // Almacenar dimensiones naturales de las imágenes cuando carguen
    const partDimensions = {};
    
    // Función para verificar si todas las imágenes están cargadas
    function checkImageLoaded(image, imageName) {
      if (image.complete && image.naturalWidth > 0) {
        hangmanPartsLoaded++;
        // Guardar dimensiones naturales
        partDimensions[imageName] = {
          width: image.naturalWidth,
          height: image.naturalHeight,
          ratio: image.naturalWidth / image.naturalHeight
        };
        console.log(`${imageName} loaded: ${hangmanPartsLoaded}/${totalHangmanParts} - ${image.naturalWidth}x${image.naturalHeight} (ratio: ${(image.naturalWidth/image.naturalHeight).toFixed(2)})`);
      } else {
        image.onload = () => {
          hangmanPartsLoaded++;
          // Guardar dimensiones naturales
          partDimensions[imageName] = {
            width: image.naturalWidth,
            height: image.naturalHeight,
            ratio: image.naturalWidth / image.naturalHeight
          };
          console.log(`${imageName} loaded: ${hangmanPartsLoaded}/${totalHangmanParts} - ${image.naturalWidth}x${image.naturalHeight} (ratio: ${(image.naturalWidth/image.naturalHeight).toFixed(2)})`);
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
    function selectRandomWord() {
      const countries = Array.isArray(GEOGRAPHY_WORDS.countries) ? GEOGRAPHY_WORDS.countries : [];
      const capitals = Array.isArray(GEOGRAPHY_WORDS.capitals) ? GEOGRAPHY_WORDS.capitals : [];
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
      animationFrame: 0,
      
      // Configuración del handicap
      hints: handicap.hints || 0
    };
    
    // Crear teclado virtual con distribución QWERTY mejorado
    function createVirtualKeyboard() {
      // Limpiar teclado existente si hay
      cleanupVirtualKeyboard();
      
      const keyboard = document.createElement('div');
      keyboard.id = 'hangman-virtual-keyboard';
      keyboard.style.cssText = `
        position: fixed;
        bottom: 40px;
        left: 0;
        right: 0;
        background: transparent;
        padding: 12px 8px 16px 8px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        z-index: 10000;
      `;
      
      // Distribución QWERTY estándar
      const qwertyRows = [
        ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
        ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
        ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
      ];
      
      // Detectar si es móvil
      const isMobile = window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      qwertyRows.forEach((row, rowIndex) => {
        const rowDiv = document.createElement('div');
        const gap = isMobile ? 4 : 5;
        const padding = isMobile ? 4 : 0;
        
        rowDiv.style.cssText = `
          display: flex;
          justify-content: center;
          gap: ${gap}px;
          width: 100%;
          max-width: ${isMobile ? '100%' : '600px'};
          padding: 0 ${padding}px;
        `;
        
        row.forEach(letter => {
          const button = document.createElement('button');
          button.textContent = letter;
          button.dataset.letter = letter;
          
          // Calcular ancho para móvil: distribuir el espacio disponible entre las teclas
          const buttonWidth = isMobile ? 'calc((100% - ' + (padding * 2) + 'px - ' + (gap * (row.length - 1)) + 'px) / ' + row.length + ')' : 'auto';
          
          button.style.cssText = `
            background: #4a5568;
            color: #ffffff;
            border: none;
            border-radius: 8px;
            padding: ${isMobile ? '12px 8px' : '16px 12px'};
            font-size: ${isMobile ? '15px' : '17px'};
            font-weight: 600;
            cursor: pointer;
            transition: all 0.1s ease;
            min-width: ${isMobile ? buttonWidth : '38px'};
            width: ${isMobile ? buttonWidth : 'auto'};
            flex: ${isMobile ? '0 1 auto' : '0 1 auto'};
            height: ${isMobile ? '44px' : '48px'};
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3),
                        inset 0 1px 0 rgba(255, 255, 255, 0.1);
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
            position: relative;
            user-select: none;
            -webkit-tap-highlight-color: transparent;
          `;
          
          // Efecto hover
          button.addEventListener('mouseenter', () => {
            if (!button.disabled) {
              button.style.background = '#5a667a';
              button.style.transform = 'scale(1.05)';
              button.style.boxShadow = '0 3px 6px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.15)';
            }
          });
          
          button.addEventListener('mouseleave', () => {
            if (!button.disabled) {
              button.style.background = '#4a5568';
              button.style.transform = 'scale(1)';
              button.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)';
            }
          });
          
          // Efecto click/touch
          button.addEventListener('mousedown', () => {
            if (!button.disabled) {
              button.style.transform = 'scale(0.95)';
              button.style.background = '#3a4558';
            }
          });
          
          button.addEventListener('mouseup', () => {
            if (!button.disabled) {
              button.style.transform = 'scale(1)';
              button.style.background = '#4a5568';
            }
          });
          
          button.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (!button.disabled) {
              button.style.transform = 'scale(0.95)';
              button.style.background = '#3a4558';
            }
          });
          
          button.addEventListener('touchend', (e) => {
            e.preventDefault();
            if (!button.disabled) {
              button.style.transform = 'scale(1)';
              button.style.background = '#4a5568';
            }
          });
          
          // Evento click
          button.addEventListener('click', () => {
            if (!button.disabled && !game.gameOver) {
              processLetter(letter);
              updateKeyboardButtons();
            }
          });
          
          rowDiv.appendChild(button);
        });
        
        keyboard.appendChild(rowDiv);
      });
      
      document.body.appendChild(keyboard);
      
      // Función para actualizar el estado de los botones
      function updateKeyboardButtons() {
        const buttons = keyboard.querySelectorAll('button');
        buttons.forEach(btn => {
          const letter = btn.dataset.letter;
          const isGuessed = game.guessedLetters.includes(letter);
          
          if (isGuessed || game.gameOver) {
            btn.disabled = true;
            btn.style.cursor = 'not-allowed';
            if (game.word.includes(letter)) {
              // Letra correcta (verde)
              btn.style.background = '#2ecc71';
              btn.style.boxShadow = '0 2px 4px rgba(46, 204, 113, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.15)';
              btn.style.opacity = '0.9';
            } else {
              // Letra incorrecta (rojo)
              btn.style.background = '#e74c3c';
              btn.style.boxShadow = '0 2px 4px rgba(231, 76, 60, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.15)';
              btn.style.opacity = '0.9';
            }
            btn.style.transform = 'none';
          } else {
            btn.disabled = false;
            btn.style.cursor = 'pointer';
            btn.style.background = '#4a5568';
            btn.style.opacity = '1';
            btn.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)';
          }
        });
      }
      
      // Guardar función de actualización para poder llamarla desde fuera
      window.updateHangmanKeyboard = updateKeyboardButtons;
      
      // Actualizar estado inicial
      updateKeyboardButtons();
    }
    
    // Función para limpiar el teclado virtual
    function cleanupVirtualKeyboard() {
      const keyboard = document.getElementById('hangman-virtual-keyboard');
      if (keyboard) {
        keyboard.remove();
      }
      // Limpiar función global
      if (window.updateHangmanKeyboard) {
        delete window.updateHangmanKeyboard;
      }
    }

    // Función para procesar una letra
    function processLetter(letter) {
      if (game.gameOver) return;
      
      if (letter >= 'A' && letter <= 'Z' && letter.length === 1 && !game.guessedLetters.includes(letter)) {
        game.guessedLetters.push(letter);
        
        // Actualizar teclado virtual si existe
        if (window.updateHangmanKeyboard) {
          window.updateHangmanKeyboard();
        }
        
        if (game.word.includes(letter)) {
          // Letra correcta
          if (game.word.split('').every(char => char === '_' || game.guessedLetters.includes(char))) {
            game.won = true;
            game.gameOver = true;
            game.message = '¡VICTORIA! ¡Adivinaste la palabra!';
            setTimeout(() => {
              cleanupVirtualKeyboard();
              window.BossCore.endBossGame(true);
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
              window.BossCore.endBossGame(false);
            }, 2000);
          }
        }
      }
    }

    // Controles del teclado físico
    document.addEventListener('keydown', (e) => {
      processLetter(e.key.toUpperCase());
    });

    // Detectar si es móvil para deshabilitar teclado nativo
    const isMobileDevice = window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Solo crear input oculto si NO es móvil (para desktops/laptops con teclado físico)
    if (!isMobileDevice) {
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
    }
    
    // Ocultar HUD para hangman (no se necesita)
    const hud = document.getElementById('bossGameHUD');
    if (hud) hud.style.display = 'none';
    
    // Crear teclado virtual
    createVirtualKeyboard();
    
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // === DIBUJAR FONDO CON PROPORCIÓN CORRECTA ===
      ctx.save();
      ctx.translate(offsetX, offsetY);
      ctx.scale(scale, scale);
      
      // Calcular dimensiones del fondo manteniendo proporción original
      // IMPORTANTE: El fondo y todas las partes tienen las mismas dimensiones (1536x2720)
      // Por lo tanto, todas deben dibujarse con el mismo tamaño y posición
      let targetWidth, targetHeight, bgOffsetX, bgOffsetY;
      
      if (hangmanBgLoaded && hangmanBgImage.complete && hangmanBgImage.naturalWidth && hangmanBgImage.naturalHeight) {
        // Obtener proporción real de la imagen
        const bgImgRatio = hangmanBgImage.naturalWidth / hangmanBgImage.naturalHeight;
        const baseRatio = baseWidth / baseHeight;
        
        if (bgImgRatio > baseRatio) {
          // Imagen más ancha: fit vertical (mantener altura)
          targetHeight = baseHeight;
          targetWidth = targetHeight * bgImgRatio;
          bgOffsetX = (baseWidth - targetWidth) / 2;
          bgOffsetY = 0;
        } else {
          // Imagen más alta: fit horizontal (mantener ancho)
          targetWidth = baseWidth;
          targetHeight = targetWidth / bgImgRatio;
          bgOffsetX = 0;
          bgOffsetY = (baseHeight - targetHeight) / 2;
        }
        
        // Dibujar fondo una sola vez con proporción correcta
        ctx.drawImage(hangmanBgImage, bgOffsetX, bgOffsetY, targetWidth, targetHeight);
      } else {
        // Fallback: fondo de color
        const gradient = ctx.createLinearGradient(0, 0, 0, baseHeight);
        gradient.addColorStop(0, '#0a0a0a');
        gradient.addColorStop(1, '#1a1a2e');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, baseWidth, baseHeight);
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
      
      // === DIBUJAR PARTES DEL MUÑECO EN EL MISMO SISTEMA DE COORDENADAS ===
      // Pasar las dimensiones calculadas del fondo a drawGallows para que las partes
      // se dibujen exactamente igual (mismo tamaño y posición)
      // Solo dibujar si el fondo fue calculado correctamente
      if (typeof targetWidth !== 'undefined' && typeof targetHeight !== 'undefined') {
        drawGallows(0, 0, baseWidth, baseHeight, targetWidth, targetHeight, bgOffsetX, bgOffsetY);
      }
      
      // Dibujar palabra oculta (más arriba)
      drawHiddenWord(baseWidth/2, baseHeight * 0.58, game.word, game.guessedLetters);
      
      // Dibujar letras usadas (en la parte inferior)
      drawUsedLetters(12, baseHeight - 16, game.guessedLetters);
      
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
    
    function drawGallows(x, y, width, height, targetWidth, targetHeight, bgOffsetX, bgOffsetY) {
      // === DIBUJAR PARTES DEL MUÑECO ===
      // IMPORTANTE: Todas las imágenes (fondo y partes) tienen las MISMAS dimensiones: 1536x2720
      // Por lo tanto, cada parte debe dibujarse exactamente igual que el fondo:
      // - Mismo tamaño que el fondo (targetWidth x targetHeight)
      // - Misma posición (bgOffsetX, bgOffsetY)
      // - Simplemente se superponen porque tienen las mismas dimensiones
      // Las áreas transparentes de cada imagen no se verán, solo las partes visibles
      
      // Dibujar partes del muñeco según errores (1-6)
      // Cada parte se dibuja exactamente igual que el fondo (mismo tamaño y posición)
      // Como todas tienen las mismas dimensiones y el contenido está en las mismas posiciones relativas,
      // simplemente se superponen correctamente
      
      if (game.wrongGuesses >= 1 && headImage.complete && headImage.naturalWidth > 0) {
        // Cabeza: dibujar con mismo tamaño y posición que el fondo
        ctx.drawImage(headImage, bgOffsetX, bgOffsetY, targetWidth, targetHeight);
      }
      
      if (game.wrongGuesses >= 2 && bodyImage.complete && bodyImage.naturalWidth > 0) {
        // Cuerpo: dibujar con mismo tamaño y posición que el fondo
        ctx.drawImage(bodyImage, bgOffsetX, bgOffsetY, targetWidth, targetHeight);
      }
      
      if (game.wrongGuesses >= 3 && rightArmImage.complete && rightArmImage.naturalWidth > 0) {
        // Brazo derecho: dibujar con mismo tamaño y posición que el fondo
        ctx.drawImage(rightArmImage, bgOffsetX, bgOffsetY, targetWidth, targetHeight);
      }
      
      if (game.wrongGuesses >= 4 && leftArmImage.complete && leftArmImage.naturalWidth > 0) {
        // Brazo izquierdo: dibujar con mismo tamaño y posición que el fondo
        ctx.drawImage(leftArmImage, bgOffsetX, bgOffsetY, targetWidth, targetHeight);
      }
      
      if (game.wrongGuesses >= 5 && leftLegImage.complete && leftLegImage.naturalWidth > 0) {
        // Pierna izquierda: dibujar con mismo tamaño y posición que el fondo
        ctx.drawImage(leftLegImage, bgOffsetX, bgOffsetY, targetWidth, targetHeight);
      }
      
      if (game.wrongGuesses >= 6 && rightLegImage.complete && rightLegImage.naturalWidth > 0) {
        // Pierna derecha: dibujar con mismo tamaño y posición que el fondo
        ctx.drawImage(rightLegImage, bgOffsetX, bgOffsetY, targetWidth, targetHeight);
      }
      
      // Fallback: dibujar horca simple solo si las imágenes no están cargadas
      if (hangmanPartsLoaded < totalHangmanParts && !headImage.complete) {
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
        window.bossGameState.animationId = requestAnimationFrame(gameLoop);
      }
    }
    
    // Iniciar el juego
    gameLoop();
  }

  // Exponer función y datos
  window.BossGames = window.BossGames || {};
  window.BossGames.initGeographyHangman = initGeographyHangman;
  window.BossGames.GEOGRAPHY_WORDS = GEOGRAPHY_WORDS; // Exponer para uso en selectRandomWord

})(window);
