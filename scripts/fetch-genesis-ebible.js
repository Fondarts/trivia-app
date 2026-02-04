/**
 * Fetch Genesis chapters from ebible.org (World English Bible - eng-web).
 * Source: https://ebible.org/study/ (same content as Browser Bible).
 * Output: www/data/bible/en/gen.json
 * Usage: node scripts/fetch-genesis-ebible.js [chapter]
 */

const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, '..', 'www', 'data', 'bible', 'en');
const GEN_PATH = path.join(OUT_DIR, 'gen.json');
const BASE_URL = 'https://ebible.org/eng-web/';

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
  if (!html.includes('&#160;') && !html.match(/\d+\s+In\s+the/)) return verses;

  let block = html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '');
  block = block.replace(/<a[^>]*>[\s\S]*?<\/a>/gi, ' ');
  block = block.replace(/(\d+)&#160;/g, '\nVERSE_$1\n');
  const parts = block.split(/\nVERSE_(\d+)\n/);
  for (let i = 1; i < parts.length; i += 2) {
    const num = parts[i];
    const rawContent = (parts[i + 1] || '').replace(/<[^>]+>/g, ' ').replace(/&#160;/g, ' ').replace(/\s+/g, ' ').trim();
    if (num && rawContent && /^\d+$/.test(num) && parseInt(num, 10) <= 200) {
      verses.push({ verse: num, text: stripFootnotes(rawContent) });
    }
  }

  if (verses.length === 0) {
    const fallbackRaw = block.replace(/<[^>]+>/g, ' ').replace(/&#160;/g, ' ');
    const re = /(?:^|\s)(\d+)\s+([\s\S]*?)(?=\s\d+\s|$)/g;
    let m;
    while ((m = re.exec(fallbackRaw)) !== null) {
      const num = parseInt(m[1], 10);
      if (num >= 1 && num <= 200) {
        const text = (m[2] || '').trim();
        if (text) verses.push({ verse: String(num), text: stripFootnotes(text) });
      }
    }
  }

  return verses;
}

async function fetchChapter(chapterNum) {
  const pad = String(chapterNum).padStart(2, '0');
  const url = `${BASE_URL}GEN${pad}.htm`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; rv:91.0) Gecko/20100101 Firefox/91.0' }
    });
    const html = await res.text();
    return parseChapterFromHtml(html, chapterNum);
  } catch (e) {
    console.error(`Error chapter ${chapterNum}:`, e.message);
    return [];
  }
}

async function main() {
  const onlyChapter = process.argv[2] ? parseInt(process.argv[2], 10) : null;
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  let data = { book: 'Genesis', chapters: [] };
  if (fs.existsSync(GEN_PATH)) {
    data = JSON.parse(fs.readFileSync(GEN_PATH, 'utf8'));
  }
  if (onlyChapter) {
    data.chapters = data.chapters.filter(c => c.chapter !== String(onlyChapter));
  }
  const existingChapters = new Set((data.chapters || []).map(c => c.chapter));

  const startCh = onlyChapter || 1;
  const endCh = onlyChapter || 50;

  for (let ch = startCh; ch <= endCh; ch++) {
    const chStr = String(ch);
    if (existingChapters.has(chStr)) {
      console.log(`Chapter ${ch} already exists, skipping.`);
      continue;
    }
    console.log(`Fetching chapter ${ch} from ebible.org...`);
    const verses = await fetchChapter(ch);
    if (verses.length > 0) {
      data.chapters.push({ chapter: chStr, verses });
      existingChapters.add(chStr);
      console.log(`  -> ${verses.length} verses.`);
    } else {
      console.log(`  -> No verses extracted.`);
    }
    await new Promise(r => setTimeout(r, 400));
  }

  data.chapters.sort((a, b) => parseInt(a.chapter, 10) - parseInt(b.chapter, 10));
  fs.writeFileSync(GEN_PATH, JSON.stringify(data, null, 0), 'utf8');
  console.log('Saved:', GEN_PATH);
}

main().catch(console.error);
