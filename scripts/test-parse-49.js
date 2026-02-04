const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, 'debug-gen49.html'), 'utf8');

const passageMatch = html.match(/passage-content[^>]*>([\s\S]*?)<div class="footnotes"/i)
  || html.match(/text-html[^>]*>([\s\S]*?)<div class="footnotes"/i);
console.log('passageMatch:', !!passageMatch);
console.log('Which:', html.match(/passage-content[^>]*>([\s\S]*?)<div class="footnotes"/i) ? 'passage-content' : 'text-html');
if (passageMatch) {
  const block = passageMatch[1];
  console.log('block length:', block.length);
  console.log('versenum count:', (block.match(/versenum/gi) || []).length);
  console.log('chapternum count:', (block.match(/chapternum/gi) || []).length);
  const withVerse = block.replace(/<sup[^>]*class="[^"]*versenum[^"]*"[^>]*>(\d+)\s*<\/sup>/gi, '\nVERSE_$1\n');
  const parts = withVerse.split(/\nVERSE_(\d+)\n/);
  console.log('parts length:', parts.length);
}
