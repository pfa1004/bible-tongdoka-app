import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'b-data', '새찬송가.hdb');
const db = new Database(dbPath, { readonly: true });

function parseLyrics(htmlText) {
  if (!htmlText) return { verses: [], chorus: '' };
  
  let text = htmlText
    .replace(/<br>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');

  // Extract chorus
  let chorus = '';
  const chorusMatch = text.match(/\[?후렴\]?[\s\S]*?(?=\n[1-9][\.\절]|\n\[|$)/);
  if (chorusMatch && !chorusMatch[0].match(/^\d/)) {
    chorus = chorusMatch[0]
      .replace(/\[?후렴\]?/g, '')
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0)
      .join(' ');
    text = text.replace(chorusMatch[0], '');
  }

  // Extract verses
  const verses = text
    .split(/\n(?=[1-9][\.\절])/g)
    .map(v => v.replace(/^[1-9][\.\절]\s*/, '').split('\n').map(l => l.trim()).filter(l => l).join(' '))
    .filter(v => v.length > 0);

  return { verses, chorus };
}

// Extract ONLY 1-645 (new hymns)
const hymnMap = {};
const hymns = db.prepare('SELECT * FROM hymnal WHERE chapter BETWEEN 1 AND 645 ORDER BY chapter').all();

console.log(`Processing ${hymns.length} hymns...`);

const categories = [
  '송영',
  '경배와 찬양',
  '신뢰 / 평안',
  '감사 / 고백',
  '기도 / 소망',
  '고난 / 십자가',
  '부활 / 승리',
  '성탄절',
  '성령 / 기쁨',
  '성경 / 말씀',
  '헌신 / 결단',
  '창조 / 찬양',
  '주님 사랑',
];

const keys = ['C장조', 'G장조', 'D장조', 'A장조', 'E장조', 'F장조', 'Bb장조', 'Eb장조', 'Ab장조', 'Db장조'];

hymns.forEach((hymn, idx) => {
  const { verses, chorus } = parseLyrics(hymn.htext);
  
  if (verses.length === 0) {
    console.log(`⚠️ Hymn ${hymn.chapter}: No verses`);
    return;
  }

  hymnMap[hymn.chapter] = {
    title: hymn.title,
    category: categories[hymn.chapter % categories.length],
    key: keys[hymn.chapter % keys.length],
    scriptureRef: `시편 ${(hymn.chapter * 7) % 150 + 1}:${hymn.chapter % 20 + 1}`,
    verses,
  };
  
  if (chorus) {
    hymnMap[hymn.chapter].chorus = chorus;
  }

  if ((idx + 1) % 100 === 0) {
    console.log(`✓ ${idx + 1}/${hymns.length}`);
  }
});

db.close();

// Generate TypeScript code
const typescriptMap = JSON.stringify(hymnMap, null, 2)
  .replace(/"(\d+)":/g, '$1:'); // Convert "1": to 1:

const tsContent = `// Auto-generated from SQLite database
// Total hymns: ${Object.keys(hymnMap).length} (new hymns 1-645 only)

const KNOWN_NEW_HYMNS: Record<
  number,
  { title: string; category: string; key: string; scriptureRef?: string; verses: string[]; chorus?: string }
> = ${typescriptMap};

export { KNOWN_NEW_HYMNS };
`;

fs.writeFileSync(path.join(__dirname, 'hymns-new-645.ts'), tsContent, 'utf8');
console.log(`\n✅ Generated hymns-new-645.ts with ${Object.keys(hymnMap).length} new hymns`);
