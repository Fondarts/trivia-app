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
    
    // Países y capitales organizados por dificultad (fácil, medio, difícil)
    const wordsEs = {
      easy: {
        // Fácil: 4-6 letras, muy conocidos
        countries: [
          'PERU', 'CHILE', 'CHINA', 'INDIA', 'JAPON', 'IRAN', 'IRAK', 'CUBA',
          'ITALIA', 'FRANCIA', 'ESPAÑA', 'GRECIA', 'EGIPTO', 'KENIA', 'TUNIS',
          'SUIZA', 'SUECIA', 'NORUEGA', 'CANADA', 'BRASIL', 'MEXICO', 'PANAMA',
          'ISRAEL', 'IRLANDA', 'POLONIA', 'TURQUIA', 'RUSIA', 'CHAD', 'YEMEN',
          'OMAN', 'QATAR', 'KUWAIT', 'BAHRAIN', 'MALTA', 'BELARUS', 'MOLDOVA'
        ],
        capitals: [
          'ROMA', 'PARIS', 'LIMA', 'OSLO', 'DOHA', 'SEUL', 'CAIRO', 'LISBOA',
          'BERLIN', 'MADRID', 'ATENAS', 'PRAGA', 'VIENA', 'DUBLIN', 'OSLO',
          'ANKARA', 'TOKIO', 'PEKIN', 'QUITO', 'BOGOTA', 'LONDRES', 'AMMAN',
          'KUWAIT', 'MANAMA', 'RIYADH', 'MUSCAT', 'TUNIS', 'KIGALI', 'LUSAKA',
          'NDJAMENA', 'KHARTOUM', 'BAMAKO', 'NIAMEY', 'DAKAR', 'BANJUL'
        ]
      },
      medium: {
        // Medio: 7-9 letras, conocidos
        countries: [
          'ARGENTINA', 'AUSTRALIA', 'AUSTRIA', 'BELGICA', 'COLOMBIA', 'CROACIA',
          'DINAMARCA', 'ECUADOR', 'FINLANDIA', 'ALEMANIA', 'GUATEMALA', 'HONDURAS',
          'HUNGRIA', 'INDONESIA', 'JAMAICA', 'JORDANIA', 'MARRUECOS', 'NIGERIA',
          'PAKISTAN', 'FILIPINAS', 'PORTUGAL', 'RUMANIA', 'SENEGAL', 'SINGAPUR',
          'SUDAFRICA', 'TAILANDIA', 'UCRANIA', 'URUGUAY', 'VENEZUELA', 'VIETNAM',
          'BOLIVIA', 'ECUADOR', 'URUGUAY', 'PARAGUAY', 'NICARAGUA', 'COSTA_RICA',
          'ESTONIA', 'LETONIA', 'LITUANIA', 'ESLOVENIA', 'ESLOVAQUIA', 'BULGARIA',
          'SERBIA', 'MONTENEGRO', 'BOSNIA', 'ALBANIA', 'MACEDONIA', 'GEORGIA',
          'ARMENIA', 'AZERBAIYAN', 'KAZAJISTAN', 'UZBEKISTAN', 'TURKMENISTAN',
          'AFGANISTAN', 'BANGLADESH', 'SRI_LANKA', 'MALASIA', 'CAMBODIA', 'MYANMAR',
          'LAOS', 'BRUNEI', 'MALDIVAS', 'NEPAL', 'BHUTAN', 'MONGOLIA', 'TAIWAN'
        ],
        capitals: [
          'ESTOCOLMO', 'HELSINKI', 'COPENHAGUE', 'BRUSELAS', 'AMSTERDAM', 'VARSOVIA',
          'BUDAPEST', 'MOSCU', 'BANGKOK', 'HANOI', 'MANILA', 'BAGDAD', 'JERUSALEN',
          'SANTIAGO', 'BUENOS_AIRES', 'MONTEVIDEO', 'BRASILIA', 'CARACAS', 'OTTAWA',
          'KINGSTON', 'TALLINN', 'RIGA', 'VILNIUS', 'LJUBLJANA', 'BRATISLAVA',
          'SOFIA', 'BELGRADO', 'PODGORICA', 'SARAJEVO', 'TIRANA', 'SKOPJE', 'TBILISI',
          'YEREVAN', 'BAKU', 'ASTANA', 'TASHKENT', 'ASHGABAT', 'KABUL', 'DACCA',
          'COLOMBO', 'KUALA_LUMPUR', 'PHNOM_PENH', 'NAY_PYI_TAW', 'VIENTIANE',
          'BANDAR_SERI_BEGAWAN', 'MALE', 'KATMANDU', 'THIMPHU', 'ULAANBAATAR', 'TAIPEI'
        ]
      },
      hard: {
        // Difícil: 10+ letras o menos conocidos
        countries: [
          'ESTADOS_UNIDOS', 'NUEVA_ZELANDA', 'REINO_UNIDO', 'COREA_DEL_SUR', 'COREA_DEL_NORTE',
          'REPUBLICA_DOMINICANA', 'REPUBLICA_CHECA', 'REPUBLICA_DEL_CONGO', 'REPUBLICA_CENTROAFRICANA',
          'BOSNIA_HERZEGOVINA', 'ANTIGUA_Y_BARBUDA', 'SAN_CRISTOBAL_Y_NIEVES', 'SAN_VICENTE_Y_LAS_GRANADINAS',
          'SANTA_LUCIA', 'TRINIDAD_Y_TOBAGO', 'PAPUA_NUEVA_GUINEA', 'TIMOR_ORIENTAL',
          'GUINEA_ECUATORIAL', 'GUINEA_BISAU', 'GUINEA_CONAKRY', 'SIERRA_LEONA',
          'BURKINA_FASO', 'REPUBLICA_DEMOCRATICA_DEL_CONGO', 'SUDAFRICA', 'SUDAN_DEL_SUR',
          'REINO_UNIDO_DE_GRAN_BRETANA_E_IRLANDA_DEL_NORTE', 'ESTADOS_FEDERADOS_DE_MICRONESIA',
          'REPUBLICA_ISLAMICA_DE_IRAN', 'REPUBLICA_ARABE_SIRIA', 'REPUBLICA_ARABE_DE_EGIPTO',
          'EMIRATOS_ARABES_UNIDOS', 'REINO_DE_ARABIA_SAUDITA', 'REINO_DE_BAHREIN',
          'REINO_DE_MARRUECOS', 'REINO_DE_JORDANIA', 'REINO_DE_BUTAN', 'REINO_DE_TONGA',
          'REINO_DE_LESOTHO', 'REINO_DE_ESWATINI', 'REINO_UNIDO_DE_LAS_NACIONES',
          'REPUBLICA_DEL_SUDAN', 'REPUBLICA_DE_GUINEA', 'REPUBLICA_DE_MAURITANIA',
          'REPUBLICA_DE_MADAGASCAR', 'REPUBLICA_DE_MOZAMBIQUE', 'REPUBLICA_DE_ANGOLA',
          'REPUBLICA_DE_ZIMBABUE', 'REPUBLICA_DE_ZAMBIA', 'REPUBLICA_DE_MALAWI',
          'REPUBLICA_DE_BOTSWANA', 'REPUBLICA_DE_NAMIBIA', 'REPUBLICA_DE_GABON',
          'REPUBLICA_DE_CAMERUN', 'REPUBLICA_DE_CHAD', 'REPUBLICA_DE_NIGER',
          'REPUBLICA_DE_MALI', 'REPUBLICA_DE_BURUNDI', 'REPUBLICA_DE_RWANDA',
          'REPUBLICA_DE_UGANDA', 'REPUBLICA_DE_TANZANIA', 'REPUBLICA_DE_KENIA',
          'REPUBLICA_DE_ETIOPIA', 'REPUBLICA_DE_ERITREA', 'REPUBLICA_DE_YIBUTI',
          'REPUBLICA_DE_SOMALIA', 'REPUBLICA_DE_SEYCHELLES', 'REPUBLICA_DE_MAURICIO',
          'REPUBLICA_DE_COMORAS', 'REPUBLICA_DE_CABO_VERDE', 'REPUBLICA_DE_GUINEA_ECUATORIAL'
        ],
        capitals: [
          'CIUDAD_DE_PANAMA', 'GUATEMALA_CITY', 'MEXICO_CITY', 'SANTO_DOMINGO', 'LA_HABANA',
          'NUEVA_DELHI', 'NUEVA_YORK', 'SAN_JUAN', 'SAN_SALVADOR', 'TEGUCIGALPA',
          'MANAGUA', 'SAN_JOSE', 'CIUDAD_DE_GUATEMALA', 'CIUDAD_DE_MEXICO', 'CIUDAD_DE_LA_HABANA',
          'WELLINGTON', 'CANBERRA', 'SUVA', 'APIA', 'NUKUALOFA', 'PORT_VILA', 'NOUMEA',
          'HONIARA', 'PORT_MORESBY', 'DILI', 'JAKARTA', 'BANDAR_SERI_BEGAWAN', 'PHNOM_PENH',
          'NAY_PYI_TAW', 'VIENTIANE', 'HANOI', 'BANGKOK', 'KUALA_LUMPUR', 'SINGAPUR',
          'DACCA', 'COLOMBO', 'KATMANDU', 'THIMPHU', 'ULAANBAATAR', 'TAIPEI', 'PEKIN',
          'PYONGYANG', 'SEUL', 'TOKIO', 'MANILA', 'HANOI', 'PHNOM_PENH', 'VIENTIANE',
          'BANDAR_SERI_BEGAWAN', 'KUALA_LUMPUR', 'SINGAPUR', 'JAKARTA', 'DILI',
          'PORT_MORESBY', 'HONIARA', 'PORT_VILA', 'NUKUALOFA', 'APIA', 'SUVA',
          'WELLINGTON', 'CANBERRA', 'REPUBLICA_DEMOCRATICA_DEL_CONGO_KINSHASA',
          'REPUBLICA_DEL_CONGO_BRAZZAVILLE', 'REPUBLICA_CENTROAFRICANA_BANGUI',
          'REPUBLICA_DEL_SUDAN_JUBA', 'REPUBLICA_DE_ETIOPIA_ADDIS_ABEBA',
          'REPUBLICA_DE_ERITREA_ASMARA', 'REPUBLICA_DE_YIBUTI_DJIBOUTI',
          'REPUBLICA_DE_SOMALIA_MOGADISCIO', 'REPUBLICA_DE_SEYCHELLES_VICTORIA',
          'REPUBLICA_DE_MAURICIO_PORT_LOUIS', 'REPUBLICA_DE_COMORAS_MORONI',
          'REPUBLICA_DE_CABO_VERDE_PRAIA', 'REPUBLICA_DE_GUINEA_ECUATORIAL_MALABO',
          'REPUBLICA_DE_GABON_LIBREVILLE', 'REPUBLICA_DE_CAMERUN_YAOUNDE',
          'REPUBLICA_DE_CHAD_NDJAMENA', 'REPUBLICA_DE_NIGER_NIAMEY',
          'REPUBLICA_DE_MALI_BAMAKO', 'REPUBLICA_DE_BURKINA_FASO_OUAGADOUGOU',
          'REPUBLICA_DE_BURUNDI_BUJUMBURA', 'REPUBLICA_DE_RWANDA_KIGALI',
          'REPUBLICA_DE_UGANDA_KAMPALA', 'REPUBLICA_DE_TANZANIA_DODOMA',
          'REPUBLICA_DE_KENIA_NAIROBI', 'REPUBLICA_DE_ETIOPIA_ADDIS_ABEBA',
          'REINO_DE_ARABIA_SAUDITA_RIYADH', 'EMIRATOS_ARABES_UNIDOS_ABU_DHABI',
          'REINO_DE_BAHREIN_MANAMA', 'REINO_DE_KUWAIT_KUWAIT', 'REINO_DE_OMAN_MUSCAT',
          'REINO_DE_QATAR_DOHA', 'REINO_DE_JORDANIA_AMMAN', 'REINO_DE_MARRUECOS_RABAT',
          'REINO_DE_BUTAN_THIMPHU', 'REINO_DE_TONGA_NUKUALOFA', 'REINO_DE_LESOTHO_MASERU',
          'REINO_DE_ESWATINI_MBABANE', 'REPUBLICA_ISLAMICA_DE_IRAN_TEHERAN',
          'REPUBLICA_ARABE_SIRIA_DAMASCO', 'REPUBLICA_ARABE_DE_EGIPTO_EL_CAIRO',
          'REPUBLICA_ARABE_DE_LIBIA_TRIPOLI', 'REPUBLICA_ARABE_DE_ARGELIA_ARGEL',
          'REPUBLICA_ARABE_DE_TUNEZ_TUNEZ', 'REPUBLICA_ARABE_DE_MAURITANIA_NOUAKCHOTT',
          'REPUBLICA_ARABE_DE_SUDAN_JARTUM', 'REPUBLICA_ARABE_DE_SIRIA_DAMASCO',
          'REPUBLICA_ARABE_DE_YEMEN_SANA', 'REPUBLICA_ARABE_DE_OMAN_MUSCAT',
          'REPUBLICA_ARABE_DE_BAHREIN_MANAMA', 'REPUBLICA_ARABE_DE_KUWAIT_KUWAIT',
          'REPUBLICA_ARABE_DE_QATAR_DOHA', 'REPUBLICA_ARABE_DE_EMIRATOS_ARABES_UNIDOS_ABU_DHABI',
          'REPUBLICA_ARABE_DE_ARABIA_SAUDITA_RIYADH', 'REPUBLICA_ARABE_DE_JORDANIA_AMMAN',
          'REPUBLICA_ARABE_DE_MARRUECOS_RABAT', 'REPUBLICA_ARABE_DE_IRAN_TEHERAN',
          'REPUBLICA_ARABE_DE_IRAK_BAGDAD', 'REPUBLICA_ARABE_DE_LIBANO_BEIRUT',
          'REPUBLICA_ARABE_DE_PALESTINA_RAMALLAH', 'REPUBLICA_ARABE_DE_SIRIA_DAMASCO',
          'ESTADOS_FEDERADOS_DE_MICRONESIA_PALIKIR', 'REPUBLICA_DE_NAURU_YAREN',
          'REPUBLICA_DE_KIRIBATI_TARAWA', 'REPUBLICA_DE_TUVALU_FUNAFUTI',
          'REPUBLICA_DE_MARSHALL_MAJURO', 'REPUBLICA_DE_PALAOS_MELEKEOK',
          'REINO_UNIDO_DE_GRAN_BRETANA_E_IRLANDA_DEL_NORTE_LONDRES',
          'REPUBLICA_DE_IRLANDA_DUBLIN', 'REPUBLICA_DE_ISLANDIA_REIKIAVIK',
          'REPUBLICA_DE_FEROE_TORSHAVN', 'REPUBLICA_DE_GROENLANDIA_NUUK',
          'REPUBLICA_DE_SVALBARD_LONGYEARBYEN', 'REPUBLICA_DE_JAN_MAYEN_OLONKINBYEN',
          'REPUBLICA_DE_BOUVET_BOUVETOYA', 'REPUBLICA_DE_PETER_I_PETER_I_OY',
          'REPUBLICA_DE_NAURU', 'REPUBLICA_DE_KIRIBATI', 'REPUBLICA_DE_TUVALU',
          'REPUBLICA_DE_MARSHALL', 'REPUBLICA_DE_PALAOS', 'REPUBLICA_DE_FIJI',
          'REPUBLICA_DE_SAMOA', 'REPUBLICA_DE_TONGA', 'REPUBLICA_DE_VANUATU',
          'REINO_DE_TONGA', 'REPUBLICA_DE_PAPUA_NUEVA_GUINEA', 'REPUBLICA_DE_TIMOR_ORIENTAL'
        ]
      }
    };
    
    // Países y capitales organizados por dificultad en inglés
    const wordsEn = {
      easy: {
        countries: [
          'PERU', 'CHILE', 'CHINA', 'INDIA', 'JAPAN', 'IRAN', 'IRAQ', 'CUBA',
          'ITALY', 'FRANCE', 'SPAIN', 'GREECE', 'EGYPT', 'KENYA', 'TUNISIA',
          'SWITZERLAND', 'SWEDEN', 'NORWAY', 'CANADA', 'BRAZIL', 'MEXICO', 'PANAMA',
          'ISRAEL', 'IRELAND', 'POLAND', 'TURKEY', 'RUSSIA', 'CHAD', 'YEMEN',
          'OMAN', 'QATAR', 'KUWAIT', 'BAHRAIN', 'MALTA', 'BELARUS', 'MOLDOVA'
        ],
        capitals: [
          'ROME', 'PARIS', 'LIMA', 'OSLO', 'DOHA', 'SEOUL', 'CAIRO', 'LISBON',
          'BERLIN', 'MADRID', 'ATHENS', 'PRAGUE', 'VIENNA', 'DUBLIN', 'OSLO',
          'ANKARA', 'TOKYO', 'BEIJING', 'QUITO', 'BOGOTA', 'LONDON', 'AMMAN',
          'KUWAIT', 'MANAMA', 'RIYADH', 'MUSCAT', 'TUNIS', 'KIGALI', 'LUSAKA',
          'NDJAMENA', 'KHARTOUM', 'BAMAKO', 'NIAMEY', 'DAKAR', 'BANJUL'
        ]
      },
      medium: {
        countries: [
          'ARGENTINA', 'AUSTRALIA', 'AUSTRIA', 'BELGIUM', 'COLOMBIA', 'CROATIA',
          'DENMARK', 'ECUADOR', 'FINLAND', 'GERMANY', 'GUATEMALA', 'HONDURAS',
          'HUNGARY', 'INDONESIA', 'JAMAICA', 'JORDAN', 'MOROCCO', 'NIGERIA',
          'PAKISTAN', 'PHILIPPINES', 'PORTUGAL', 'ROMANIA', 'SENEGAL', 'SINGAPORE',
          'SOUTH_AFRICA', 'THAILAND', 'UKRAINE', 'URUGUAY', 'VENEZUELA', 'VIETNAM',
          'BOLIVIA', 'ECUADOR', 'URUGUAY', 'PARAGUAY', 'NICARAGUA', 'COSTA_RICA',
          'ESTONIA', 'LATVIA', 'LITHUANIA', 'SLOVENIA', 'SLOVAKIA', 'BULGARIA',
          'SERBIA', 'MONTENEGRO', 'BOSNIA', 'ALBANIA', 'MACEDONIA', 'GEORGIA',
          'ARMENIA', 'AZERBAIJAN', 'KAZAKHSTAN', 'UZBEKISTAN', 'TURKMENISTAN',
          'AFGHANISTAN', 'BANGLADESH', 'SRI_LANKA', 'MALAYSIA', 'CAMBODIA', 'MYANMAR',
          'LAOS', 'BRUNEI', 'MALDIVES', 'NEPAL', 'BHUTAN', 'MONGOLIA', 'TAIWAN'
        ],
        capitals: [
          'STOCKHOLM', 'HELSINKI', 'COPENHAGEN', 'BRUSSELS', 'AMSTERDAM', 'WARSAW',
          'BUDAPEST', 'MOSCOW', 'BANGKOK', 'HANOI', 'MANILA', 'BAGHDAD', 'JERUSALEM',
          'SANTIAGO', 'BUENOS_AIRES', 'MONTEVIDEO', 'BRASILIA', 'CARACAS', 'OTTAWA',
          'KINGSTON', 'TALLINN', 'RIGA', 'VILNIUS', 'LJUBLJANA', 'BRATISLAVA',
          'SOFIA', 'BELGRADE', 'PODGORICA', 'SARAJEVO', 'TIRANA', 'SKOPJE', 'TBILISI',
          'YEREVAN', 'BAKU', 'ASTANA', 'TASHKENT', 'ASHGABAT', 'KABUL', 'DACCA',
          'COLOMBO', 'KUALA_LUMPUR', 'PHNOM_PENH', 'NAY_PYI_TAW', 'VIENTIANE',
          'BANDAR_SERI_BEGAWAN', 'MALE', 'KATHMANDU', 'THIMPHU', 'ULAANBAATAR', 'TAIPEI'
        ]
      },
      hard: {
        countries: [
          'UNITED_STATES', 'NEW_ZEALAND', 'UNITED_KINGDOM', 'SOUTH_KOREA', 'NORTH_KOREA',
          'DOMINICAN_REPUBLIC', 'CZECH_REPUBLIC', 'REPUBLIC_OF_CONGO', 'CENTRAL_AFRICAN_REPUBLIC',
          'BOSNIA_HERZEGOVINA', 'ANTIGUA_AND_BARBUDA', 'SAINT_KITTS_AND_NEVIS', 'SAINT_VINCENT_AND_THE_GRENADINES',
          'SAINT_LUCIA', 'TRINIDAD_AND_TOBAGO', 'PAPUA_NEW_GUINEA', 'EAST_TIMOR',
          'EQUATORIAL_GUINEA', 'GUINEA_BISSAU', 'GUINEA', 'SIERRA_LEONE',
          'BURKINA_FASO', 'DEMOCRATIC_REPUBLIC_OF_CONGO', 'SOUTH_AFRICA', 'SOUTH_SUDAN',
          'UNITED_KINGDOM_OF_GREAT_BRITAIN_AND_NORTHERN_IRELAND', 'FEDERATED_STATES_OF_MICRONESIA',
          'ISLAMIC_REPUBLIC_OF_IRAN', 'SYRIAN_ARAB_REPUBLIC', 'ARAB_REPUBLIC_OF_EGYPT',
          'UNITED_ARAB_EMIRATES', 'KINGDOM_OF_SAUDI_ARABIA', 'KINGDOM_OF_BAHRAIN',
          'KINGDOM_OF_MOROCCO', 'KINGDOM_OF_JORDAN', 'KINGDOM_OF_BHUTAN', 'KINGDOM_OF_TONGA',
          'KINGDOM_OF_LESOTHO', 'KINGDOM_OF_ESWATINI', 'REPUBLIC_OF_SUDAN', 'REPUBLIC_OF_GUINEA',
          'REPUBLIC_OF_MAURITANIA', 'REPUBLIC_OF_MADAGASCAR', 'REPUBLIC_OF_MOZAMBIQUE', 'REPUBLIC_OF_ANGOLA',
          'REPUBLIC_OF_ZIMBABWE', 'REPUBLIC_OF_ZAMBIA', 'REPUBLIC_OF_MALAWI',
          'REPUBLIC_OF_BOTSWANA', 'REPUBLIC_OF_NAMIBIA', 'REPUBLIC_OF_GABON',
          'REPUBLIC_OF_CAMEROON', 'REPUBLIC_OF_CHAD', 'REPUBLIC_OF_NIGER',
          'REPUBLIC_OF_MALI', 'REPUBLIC_OF_BURUNDI', 'REPUBLIC_OF_RWANDA',
          'REPUBLIC_OF_UGANDA', 'REPUBLIC_OF_TANZANIA', 'REPUBLIC_OF_KENIA',
          'FEDERAL_REPUBLIC_OF_ETHIOPIA', 'STATE_OF_ERITREA', 'REPUBLIC_OF_DJIBOUTI',
          'FEDERAL_REPUBLIC_OF_SOMALIA', 'REPUBLIC_OF_SEYCHELLES', 'REPUBLIC_OF_MAURITIUS',
          'UNION_OF_COMOROS', 'REPUBLIC_OF_CAPE_VERDE', 'REPUBLIC_OF_EQUATORIAL_GUINEA'
        ],
        capitals: [
          'PANAMA_CITY', 'GUATEMALA_CITY', 'MEXICO_CITY', 'SANTO_DOMINGO', 'HAVANA',
          'NEW_DELHI', 'NEW_YORK', 'SAN_JUAN', 'SAN_SALVADOR', 'TEGUCIGALPA',
          'MANAGUA', 'SAN_JOSE', 'WELLINGTON', 'CANBERRA', 'SUVA', 'APIA', 'NUKUALOFA',
          'PORT_VILA', 'NOUMEA', 'HONIARA', 'PORT_MORESBY', 'DILI', 'JAKARTA',
          'BANDAR_SERI_BEGAWAN', 'PHNOM_PENH', 'NAY_PYI_TAW', 'VIENTIANE', 'HANOI',
          'BANGKOK', 'KUALA_LUMPUR', 'SINGAPORE', 'DACCA', 'COLOMBO', 'KATHMANDU',
          'THIMPHU', 'ULAANBAATAR', 'TAIPEI', 'BEIJING', 'PYONGYANG', 'SEOUL',
          'TOKYO', 'MANILA', 'JAKARTA', 'PORT_MORESBY', 'HONIARA', 'PORT_VILA',
          'NUKUALOFA', 'APIA', 'SUVA', 'WELLINGTON', 'CANBERRA', 'KINSHASA',
          'BRAZZAVILLE', 'BANGUI', 'JUBA', 'ADDIS_ABABA', 'ASMARA', 'DJIBOUTI',
          'MOGADISHU', 'VICTORIA', 'PORT_LOUIS', 'MORONI', 'PRAIA', 'MALABO',
          'LIBREVILLE', 'YAOUNDE', 'NDJAMENA', 'NIAMEY', 'BAMAKO', 'OUAGADOUGOU',
          'BUJUMBURA', 'KIGALI', 'KAMPALA', 'DODOMA', 'NAIROBI', 'ADDIS_ABABA',
          'RIYADH', 'ABU_DHABI', 'MANAMA', 'KUWAIT_CITY', 'MUSCAT', 'DOHA',
          'AMMAN', 'RABAT', 'THIMPHU', 'NUKUALOFA', 'MASERU', 'MBABANE',
          'TEHRAN', 'DAMASCUS', 'CAIRO', 'TRIPOLI', 'ALGIERS', 'TUNIS',
          'NOUAKCHOTT', 'KHARTOUM', 'SANA', 'BEIRUT', 'RAMALLAH', 'PALIKIR',
          'YAREN', 'TARAWA', 'FUNAFUTI', 'MAJURO', 'MELEKEOK', 'LONDON',
          'REYKJAVIK', 'TORSHAVN', 'NUUK', 'LONGYEARBYEN'
        ]
      }
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
    
    const isMobile = canvas.height > canvas.width;
    
    // Calcular escalado: en móvil usar fit vertical, en PC usar fit completo
    const scaleX = canvas.width / baseWidth;
    const scaleY = canvas.height / baseHeight;
    const scale = isMobile ? scaleY : Math.min(scaleX, scaleY); // En móvil: fit vertical, en PC: fit completo
    const offsetX = (canvas.width - baseWidth * scale) / 2;
    const offsetY = (canvas.height - baseHeight * scale) / 2;

    // Primero cargar la imagen de fondo para obtener sus proporciones reales
    const hangmanBgImage = new Image();
    hangmanBgImage.src = './assets/hangman/pizarronaulaV03.webp';
    let hangmanBgLoaded = false;
    hangmanBgImage.onload = () => { hangmanBgLoaded = true; };
    
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
    
    headImage.src = './assets/hangman/parts/01_head_v02.webp';
    bodyImage.src = './assets/hangman/parts/02_body_V\'2.webp';
    rightArmImage.src = './assets/hangman/parts/03_rightArm_V02.webp';
    leftArmImage.src = './assets/hangman/parts/04_leftArm_V02.webp';
    leftLegImage.src = './assets/hangman/parts/05_leftLeg_V02.webp';
    rightLegImage.src = './assets/hangman/parts/06_rightLeg_V02.webp';
    
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
    
    // Seleccionar palabra aleatoria según dificultad del handicap
    function selectRandomWord() {
      const difficulty = handicap.wordDifficulty || 'medium'; // 'easy', 'medium', 'hard'
      
      // Obtener palabras según dificultad
      const wordSet = GEOGRAPHY_WORDS[difficulty] || GEOGRAPHY_WORDS.medium;
      const countries = Array.isArray(wordSet.countries) ? wordSet.countries : [];
      const capitals = Array.isArray(wordSet.capitals) ? wordSet.capitals : [];
      const all = [...countries, ...capitals];
      
      // Si no hay palabras en la categoría, usar medium como fallback
      if (all.length === 0) {
        const fallback = GEOGRAPHY_WORDS.medium || GEOGRAPHY_WORDS.easy;
        const fbCountries = Array.isArray(fallback.countries) ? fallback.countries : [];
        const fbCapitals = Array.isArray(fallback.capitals) ? fallback.capitals : [];
        const fbAll = [...fbCountries, ...fbCapitals];
        if (fbAll.length > 0) {
          return fbAll[Math.floor(Math.random() * fbAll.length)];
        }
      }
      
      const valid = all.filter(w => typeof w === 'string' && w.length >= 4);
      return valid.length > 0 ? valid[Math.floor(Math.random() * valid.length)] : 'MADRID';
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
          
          // Evento click (funciona tanto en desktop como móvil)
          button.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (!button.disabled && !game.gameOver) {
              processLetter(letter);
              updateKeyboardButtons();
            }
          });
          
          // Eventos táctiles para móvil
          let touchStarted = false;
          button.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            touchStarted = true;
            if (!button.disabled) {
              button.style.transform = 'scale(0.95)';
              button.style.background = '#3a4558';
            }
          });
          
          button.addEventListener('touchend', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (touchStarted && !button.disabled && !game.gameOver) {
              // Procesar la letra cuando se levanta el dedo
              processLetter(letter);
              updateKeyboardButtons();
              touchStarted = false;
            }
            if (!button.disabled) {
              button.style.transform = 'scale(1)';
              button.style.background = '#4a5568';
            }
          });
          
          button.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            e.stopPropagation();
            touchStarted = false;
            if (!button.disabled) {
              button.style.transform = 'scale(1)';
              button.style.background = '#4a5568';
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
            // Guardar la palabra para mostrarla debajo de la imagen de ganaste
            window.bossGameState.wonWord = game.word;
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
            // Guardar la palabra para mostrarla debajo de la imagen de perdiste
            window.bossGameState.lostWord = game.word;
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
        
        // Forzar fit vertical (mantener altura, ajustar ancho)
        targetHeight = baseHeight;
        targetWidth = targetHeight * bgImgRatio;
        bgOffsetX = (baseWidth - targetWidth) / 2;
        bgOffsetY = 0;
        
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
      drawHiddenWord(baseWidth/2, baseHeight * 0.52, game.word, game.guessedLetters);
      
      // Dibujar letras usadas (en la parte inferior)
      drawUsedLetters(12, baseHeight - 16, game.guessedLetters);
      
      // === MENSAJES DE JUEGO ===
      // Los mensajes de victoria/derrota se muestran en endBossGame, no aquí
      if (game.gameOver) {
        // No mostrar mensajes aquí, se manejan en endBossGame
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
