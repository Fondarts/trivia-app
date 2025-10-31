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
    
    // Cargar imagen del demonio
    const demonImage = new Image();
    demonImage.src = 'assets/bosses/demon_boss.webp';
    let demonLoaded = false;
    demonImage.onload = () => { demonLoaded = true; };
    
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
    
    // Actualizar HUD inicial
    window.BossCore.updateBossHUD(`Errores: ${game.wrongGuesses}/${game.maxWrongGuesses} - Usa el teclado nativo`);
    
    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(offsetX, offsetY);
      ctx.scale(scale, scale);
      
      // Fondo principal (imagen de pizarra) con FIT VERTICAL (cover height)
      if (hangmanBgLoaded && hangmanBgImage.complete && hangmanBgImage.naturalWidth && hangmanBgImage.naturalHeight) {
        // Calcular dimensiones para fit vertical (mantener altura completa, centrar ancho)
        const imgRatio = hangmanBgImage.naturalWidth / hangmanBgImage.naturalHeight;
        const targetHeight = baseHeight;
        const targetWidth = targetHeight * imgRatio;
        const offsetXImg = (baseWidth - targetWidth) / 2;
        
        ctx.drawImage(hangmanBgImage, offsetXImg, 0, targetWidth, targetHeight);
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
