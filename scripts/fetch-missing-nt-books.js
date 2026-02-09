/**
 * Fetch missing New Testament books from ebible.org (World English Bible - eng-web).
 * Source: https://ebible.org/study/ (same content as Browser Bible).
 * Output: www/data/bible/en/[bookId].json
 * Usage: node scripts/fetch-missing-nt-books.js [bookId]
 */

const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, '..', 'www', 'data', 'bible', 'en');
const BASE_URL = 'https://ebible.org/eng-web/';

// Mapeo de bookId a código ebible.org y nombre del libro
const BOOK_MAP = {
  'matt': { code: 'MAT', name: 'Matthew', chapters: 28 },
  'mark': { code: 'MRK', name: 'Mark', chapters: 16 },
  'luke': { code: 'LUK', name: 'Luke', chapters: 24 },
  'acts': { code: 'ACT', name: 'Acts', chapters: 28 },
  'rom': { code: 'ROM', name: 'Romans', chapters: 16 },
  '1cor': { code: '1CO', name: '1 Corinthians', chapters: 16 },
  '2cor': { code: '2CO', name: '2 Corinthians', chapters: 13 },
  'gal': { code: 'GAL', name: 'Galatians', chapters: 6 },
  'eph': { code: 'EPH', name: 'Ephesians', chapters: 6 },
  'phil': { code: 'PHP', name: 'Philippians', chapters: 4 },
  'col': { code: 'COL', name: 'Colossians', chapters: 4 },
  '1thess': { code: '1TH', name: '1 Thessalonians', chapters: 5 },
  '2thess': { code: '2TH', name: '2 Thessalonians', chapters: 3 },
  '1tim': { code: '1TI', name: '1 Timothy', chapters: 6 },
  '2tim': { code: '2TI', name: '2 Timothy', chapters: 4 },
  'titus': { code: 'TIT', name: 'Titus', chapters: 3 },
  'phlm': { code: 'PHM', name: 'Philemon', chapters: 1 },
  'heb': { code: 'HEB', name: 'Hebrews', chapters: 13 },
  'jas': { code: 'JAS', name: 'James', chapters: 5 },
  '1pet': { code: '1PE', name: '1 Peter', chapters: 5 },
  '2pet': { code: '2PE', name: '2 Peter', chapters: 3 },
  '2jn': { code: '2JN', name: '2 John', chapters: 1 },
  '3jn': { code: '3JN', name: '3 John', chapters: 1 },
  'jude': { code: 'JUD', name: 'Jude', chapters: 1 },
  'rev': { code: 'REV', name: 'Revelation', chapters: 22 }
};

function stripFootnotes(text) {
  return text
    .replace(/\s*\[\†‡§\d*[a-z]*\]\s*\([^)]*\)/gi, '')
    .replace(/\s*\[\†‡§\][^\]]*\]\s*\([^)]*\)/gi, '')
    .replace(/\s*\[\d*[a-z]*\]\s*\(#?[^)]*\)/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseChapterFromHtml(html, chapterNum) {
  const verses = [];
  
  let block = html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '');
  block = block.replace(/<a[^>]*>[\s\S]*?<\/a>/gi, ' ');
  
  // Intentar parsear con formato &#160; (non-breaking space)
  block = block.replace(/(\d+)&#160;/g, '\nVERSE_$1\n');
  const parts = block.split(/\nVERSE_(\d+)\n/);
  for (let i = 1; i < parts.length; i += 2) {
    const num = parts[i];
    const rawContent = (parts[i + 1] || '').replace(/<[^>]+>/g, ' ').replace(/&#160;/g, ' ').replace(/\s+/g, ' ').trim();
    if (num && rawContent && /^\d+$/.test(num) && parseInt(num, 10) <= 200) {
      verses.push({ verse: num, text: stripFootnotes(rawContent) });
    }
  }

  // Fallback: buscar patrones de versículos
  if (verses.length === 0) {
    const fallbackRaw = block.replace(/<[^>]+>/g, ' ').replace(/&#160;/g, ' ');
    const re = /(?:^|\s)(\d+)\s+([\s\S]*?)(?=\s\d+\s|$)/g;
    let m;
    while ((m = re.exec(fallbackRaw)) !== null) {
      const num = parseInt(m[1], 10);
      if (num >= 1 && num <= 200) {
        const text = (m[2] || '').trim();
        if (text && text.length > 3) {
          verses.push({ verse: String(num), text: stripFootnotes(text) });
        }
      }
    }
  }

  return verses;
}

async function fetchChapter(bookCode, chapterNum) {
  const pad = String(chapterNum).padStart(2, '0');
  const url = `${BASE_URL}${bookCode}${pad}.htm`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; rv:91.0) Gecko/20100101 Firefox/91.0' }
    });
    if (!res.ok) {
      console.error(`  HTTP ${res.status} for chapter ${chapterNum}`);
      return [];
    }
    const html = await res.text();
    return parseChapterFromHtml(html, chapterNum);
  } catch (e) {
    console.error(`  Error chapter ${chapterNum}:`, e.message);
    return [];
  }
}

async function fetchBook(bookId) {
  const bookInfo = BOOK_MAP[bookId];
  if (!bookInfo) {
    console.error(`Unknown book: ${bookId}`);
    return;
  }

  const { code, name, chapters: maxChapters } = bookInfo;
  const bookPath = path.join(OUT_DIR, `${bookId}.json`);

  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  let data = { book: name, chapters: [] };
  if (fs.existsSync(bookPath)) {
    data = JSON.parse(fs.readFileSync(bookPath, 'utf8'));
  }
  
  const existingChapters = new Set((data.chapters || []).map(c => c.chapter));

  console.log(`\nFetching ${name} (${bookId})...`);
  for (let ch = 1; ch <= maxChapters; ch++) {
    const chStr = String(ch);
    if (existingChapters.has(chStr)) {
      console.log(`  Chapter ${ch} already exists, skipping.`);
      continue;
    }
    console.log(`  Fetching chapter ${ch}...`);
    const verses = await fetchChapter(code, ch);
    if (verses.length > 0) {
      data.chapters.push({ chapter: chStr, verses });
      existingChapters.add(chStr);
      console.log(`    -> ${verses.length} verses.`);
    } else {
      console.log(`    -> No verses extracted.`);
    }
    await new Promise(r => setTimeout(r, 500)); // Rate limiting
  }

  data.chapters.sort((a, b) => parseInt(a.chapter, 10) - parseInt(b.chapter, 10));
  fs.writeFileSync(bookPath, JSON.stringify(data, null, 0), 'utf8');
  console.log(`✓ Saved: ${bookPath}`);
}

async function main() {
  const specificBook = process.argv[2];
  
  if (specificBook) {
    await fetchBook(specificBook);
  } else {
    // Descargar todos los libros faltantes
    const missingBooks = Object.keys(BOOK_MAP);
    console.log(`Fetching ${missingBooks.length} missing New Testament books...\n`);
    
    for (const bookId of missingBooks) {
      await fetchBook(bookId);
      await new Promise(r => setTimeout(r, 1000)); // Pausa entre libros
    }
    
    console.log('\n✓ All books fetched!');
  }
}

main().catch(console.error);
