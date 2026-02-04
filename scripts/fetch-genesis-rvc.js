/**
 * Script para descargar Génesis capítulos 4-50 (RVC) desde Bible Gateway
 * y añadirlos a www/data/bible/es/gen.json
 * Uso: node scripts/fetch-genesis-rvc.js
 */

const fs = require('fs');
const path = require('path');

const GEN_PATH = path.join(__dirname, '..', 'www', 'data', 'bible', 'es', 'gen.json');
const BASE_URL = 'https://www.biblegateway.com/passage/?search=Génesis+';
const VERSION = 'RVC';

function stripFootnotes(text) {
  return text
    .replace(/\([A-Za-z]\)/g, '')
    .replace(/\[\d*[a-z]*\]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseVersesFromHtml(html, chapterNum) {
  const verses = [];
  // Bible Gateway: versenum en span o texto "1 ", "2 " en párrafos
  const passageMatch = html.match(/passage-content[^>]*>([\s\S]*?)<div class="footnotes"/i)
    || html.match(/text-html[^>]*>([\s\S]*?)<div class="footnotes"/i)
    || html.match(/text-html[^>]*>([\s\S]*?)<h4>Cross references<\/h4>/i)
    || html.match(/class="passage-text"[^>]*>([\s\S]*?)<div class="footnotes"/i)
    || html.match(/class="result-text"[^>]*>([\s\S]*?)<\/div>/i);
  if (!passageMatch) return verses;

  let block = passageMatch[1];
  // Quitar scripts, estilos, notas al pie y referencias cruzadas
  block = block.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '');
  block = block.replace(/<sup[^>]*class="[^"]*footnote[^"]*"[^>]*>[\s\S]*?<\/sup>/gi, '');
  block = block.replace(/<sup[^>]*class="[^"]*crossreference[^"]*"[^>]*>[\s\S]*?<\/sup>/gi, '');
  // Capítulos con poesía: el v.1 puede ir con chapternum; marcar como VERSE_1 para no perderlo
  block = block.replace(/<span[^>]*class="[^"]*chapternum[^"]*"[^>]*>\d+\s*<\/span>/gi, '\nVERSE_1\n');
  // Marcar versículos: <span class="versenum">1</span> o <sup class="versenum">1 </sup> (poesía)
  block = block.replace(/<span[^>]*class="[^"]*versenum[^"]*"[^>]*>(\d+)\s*<\/span>/gi, '\nVERSE_$1\n');
  block = block.replace(/<sup[^>]*class="[^"]*versenum[^"]*"[^>]*>(\d+)\s*<\/sup>/gi, '\nVERSE_$1\n');
  block = block.replace(/<span[^>]*class="[^"]*verse[^"]*"[^>]*>(\d+)\s*<\/span>/gi, '\nVERSE_$1\n');
  const parts = block.split(/\nVERSE_(\d+)\n/);
  for (let i = 1; i < parts.length; i += 2) {
    let num = parts[i];
    const rawContent = (parts[i + 1] || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&#8220;/g, '«').replace(/&#8221;/g, '»').replace(/\s+/g, ' ').trim();
    if (!rawContent) continue;
    if (num === String(chapterNum) && verses.length === 0) num = '1';
    verses.push({ verse: num, text: stripFootnotes(rawContent) });
  }

  if (verses.length === 0) {
    // Fallback: split por número de versículo al inicio (patrón "\d+ " o "\d+.")
    const re = new RegExp(`(?:^|\\s)(\\d+)\\s+`, 'g');
    let lastIndex = 0;
    let m;
    const raw = block.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    while ((m = re.exec(raw)) !== null) {
      const num = parseInt(m[1], 10);
      if (num >= 1 && num <= 200) {
        const start = m.index + m[0].length;
        const next = raw.indexOf(' ' + (num + 1) + ' ', start);
        const textPart = (next > start ? raw.slice(start, next) : raw.slice(start)).trim();
        if (textPart && !verses.find(v => v.verse === String(num))) verses.push({ verse: String(num), text: stripFootnotes(textPart) });
      }
      lastIndex = m.index;
    }
  }

  return verses;
}

async function fetchChapter(chapterNum, debugHtmlPath) {
  const url = `${BASE_URL}${chapterNum}&version=${VERSION}`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; rv:91.0) Gecko/20100101 Firefox/91.0' }
    });
    const html = await res.text();
    if (debugHtmlPath) fs.writeFileSync(debugHtmlPath, html, 'utf8');
    return parseVersesFromHtml(html, chapterNum);
  } catch (e) {
    console.error(`Error capítulo ${chapterNum}:`, e.message);
    return [];
  }
}

async function main() {
  const onlyChapter = process.argv[2] ? parseInt(process.argv[2], 10) : null;
  const data = JSON.parse(fs.readFileSync(GEN_PATH, 'utf8'));
  if (onlyChapter) {
    data.chapters = data.chapters.filter(c => c.chapter !== String(onlyChapter));
  }
  const existingChapters = new Set((data.chapters || []).map(c => c.chapter));

  const startCh = onlyChapter || 4;
  const endCh = onlyChapter || 50;

  for (let ch = startCh; ch <= endCh; ch++) {
    const chStr = String(ch);
    if (existingChapters.has(chStr)) {
      console.log(`Capítulo ${ch} ya existe, omitiendo.`);
      continue;
    }
    console.log(`Descargando capítulo ${ch}...`);
    const debugPath = onlyChapter === ch ? path.join(__dirname, 'debug-gen49.html') : null;
    const verses = await fetchChapter(ch, debugPath);
    if (verses.length > 0) {
      data.chapters.push({ chapter: chStr, verses });
      existingChapters.add(chStr);
      console.log(`  -> ${verses.length} versículos.`);
    } else {
      console.log(`  -> No se pudieron extraer versículos.`);
    }
    await new Promise(r => setTimeout(r, 800));
  }

  data.chapters.sort((a, b) => parseInt(a.chapter, 10) - parseInt(b.chapter, 10));
  fs.writeFileSync(GEN_PATH, JSON.stringify(data, null, 0), 'utf8');
  console.log('Guardado:', GEN_PATH);
}

main().catch(console.error);
