// bosses/hangman.js - Boss del Atlas Mundial (Hangman)
(function(window) {
  'use strict';

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
    
    // Ocultar HUD para hangman (no se necesita)
    const hud = document.getElementById('bossGameHUD');
    if (hud) hud.style.display = 'none';
    
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
      
      // Dibujar palabra oculta (centrada verticalmente)
      drawHiddenWord(baseWidth/2, baseHeight * 0.78, game.word, game.guessedLetters);
      
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
