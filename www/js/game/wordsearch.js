/**
 * Sopa de letras - Palabras bíblicas
 * 3 niveles de dificultad según tamaño de la grilla.
 */
const WS_WORDS = [
  'DIOS', 'JESUS', 'BIBLIA', 'FE', 'AMOR', 'GRACIA', 'PACTO', 'LEY', 'REINO',
  'PALABRA', 'ORACION', 'PERDON', 'JUSTICIA', 'VERDAD', 'VIDA', 'LUZ', 'CAMINO',
  'SALVACION', 'ESPERANZA', 'MISERICORDIA', 'PROFETA', 'APOSTOL', 'DISCIPULO',
  'IGLESIA', 'EVANGELIO', 'MILAGRO', 'PARABOLA', 'CRUZ', 'RESURRECCION', 'PECADO',
  'ADAN', 'EVA', 'NOE', 'ABRAHAM', 'MOISES', 'DAVID', 'SALOMON', 'ISAIAS',
  'JEREMIAS', 'DANIEL', 'MARIA', 'PEDRO', 'PABLO', 'JUAN', 'MATEO', 'MARCOS',
  'LUCAS', 'HECHOS', 'ROMANOS', 'APOCALIPSIS', 'ISRAEL', 'JERUSALEN', 'SINAI',
  'EGIPTO', 'DESIERTO', 'TEMPLO', 'ALTAR', 'SACRIFICIO', 'OFRENDA', 'SACERDOTE',
  'AYUNO', 'BAUTISMO', 'ESPIRITU', 'SANTO', 'CIELO', 'TIERRA', 'CREACION',
  'ALIANZA', 'PROMESA', 'MANDAMIENTO', 'TESTAMENTO', 'SABIDURIA', 'SALMO',
  'PROVERBIO', 'JUSTO', 'FIEL', 'HUMILDAD', 'OBEDIENCIA', 'SERVICIO', 'COMUNION',
  'REVELACION', 'GLORIA', 'PODER', 'AUTORIDAD', 'PASTOR', 'OVEJA', 'SEMILLA',
  'COSECHA', 'VID', 'PAN', 'VINOS', 'MANNA', 'ANGEL', 'CORDERO', 'MESIAS',
  'REDENCION', 'EXODO', 'PROMETIDA', 'DISCERNIR', 'TESTIGO'
].map(w => w.normalize('NFD').replace(/\u0300/g, '').toUpperCase()); // sin tildes para la grilla

const DIRECTIONS = [
  { dr: 0, dc: 1 },   // derecha
  { dr: 0, dc: -1 },  // izquierda
  { dr: 1, dc: 0 },   // abajo
  { dr: -1, dc: 0 },  // arriba
  { dr: 1, dc: 1 },   // diagonal abajo-derecha
  { dr: 1, dc: -1 },  // diagonal abajo-izquierda
  { dr: -1, dc: 1 },  // diagonal arriba-derecha
  { dr: -1, dc: -1 }  // diagonal arriba-izquierda
];

const DIFFICULTY = {
  easy:   { rows: 6, cols: 6, numWords: 4,  labelKey: 'difficultyEasy' },
  medium: { rows: 8, cols: 8, numWords: 6,  labelKey: 'difficultyMedium' },
  hard:   { rows: 10, cols: 10, numWords: 10, labelKey: 'difficultyHard' }
};

const ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function canPlace(grid, word, r, c, dr, dc) {
  const rows = grid.length;
  const cols = grid[0].length;
  for (let i = 0; i < word.length; i++) {
    const nr = r + i * dr;
    const nc = c + i * dc;
    if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) return false;
    const cell = grid[nr][nc];
    if (cell !== '' && cell !== word[i]) return false;
  }
  return true;
}

function placeWord(grid, word, r, c, dr, dc) {
  const positions = [];
  for (let i = 0; i < word.length; i++) {
    const nr = r + i * dr;
    const nc = c + i * dc;
    grid[nr][nc] = word[i];
    positions.push({ r: nr, c: nc });
  }
  return positions;
}

export function generateWordSearch(difficultyKey = 'easy') {
  const config = DIFFICULTY[difficultyKey] || DIFFICULTY.easy;
  const { rows, cols, numWords } = config;

  const grid = Array(rows).fill(null).map(() => Array(cols).fill(''));

  const wordsByLen = {};
  WS_WORDS.forEach(w => {
    if (w.length <= Math.max(rows, cols)) {
      if (!wordsByLen[w.length]) wordsByLen[w.length] = [];
      wordsByLen[w.length].push(w);
    }
  });
  const flat = [];
  Object.values(wordsByLen).forEach(arr => flat.push(...arr));
  const shuffled = shuffle(flat);
  const toPlace = shuffled.slice(0, Math.min(numWords * 2, shuffled.length));
  const placed = [];
  const maxAttempts = 200;
  let attempts = 0;

  for (const word of toPlace) {
    if (placed.length >= numWords) break;
    if (attempts >= maxAttempts) break;
    const dirs = shuffle([...DIRECTIONS]);
    let placedThis = false;
    const starts = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) starts.push({ r, c });
    shuffle(starts);
    for (const { r, c } of starts) {
      if (placedThis) break;
      for (const { dr, dc } of dirs) {
        if (canPlace(grid, word, r, c, dr, dc)) {
          const positions = placeWord(grid, word, r, c, dr, dc);
          placed.push({ word, positions });
          placedThis = true;
          break;
        }
      }
      attempts++;
    }
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === '') {
        grid[r][c] = ABC[Math.floor(Math.random() * ABC.length)];
      }
    }
  }

  return { grid, words: placed, config };
}

export function getDifficultyConfig(difficultyKey) {
  return DIFFICULTY[difficultyKey] || DIFFICULTY.easy;
}

export { DIFFICULTY, WS_WORDS };
