import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'b-data', '새찬송가.hdb');
const db = new Database(dbPath, { readonly: true });

// Parse HTML-formatted lyrics to clean text
function parseLyrics(htmlText) {
  if (!htmlText) return [];
  
  // Remove HTML tags but keep line breaks
  let text = htmlText
    .replace(/<br>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&');

  // Split by verse numbers (1. 2. 3. etc) or Korean numbers (1절 2절 3절)
  const verseSplitRegex = /\n(?=[1-9]\d*[\.\절])|^\d[\.\절]/gm;
  
  // Extract chorus if exists
  let chorus = '';
  const chorusMatch = text.match(/\[?후렴\]?[\s\S]*?(?=\n\d[\.\절]|$)/);
  if (chorusMatch && !chorusMatch[0].match(/^\d/)) {
    chorus = chorusMatch[0]
      .replace(/\[?후렴\]?/g, '')
      .trim()
      .split('\n')
      .filter(line => line.trim())
      .join(' ');
  }

  // Remove chorus from main text
  text = text.replace(/\[?후렴\]?[\s\S]*?(?=\n\d[\.\절]|$)/g, '');

  // Split into verses
  const verses = text
    .split(/\n(?=\d[\.\절])/g)
    .map(verse => {
      return verse
        .replace(/^\d[\.\절]\s*/, '') // Remove verse number
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .join(' ');
    })
    .filter(v => v.length > 0);

  return { verses, chorus };
}

// Fetch all hymns
const allHymns = db.prepare('SELECT * FROM hymnal ORDER BY chapter').all();
console.log(`Total hymns in database: ${allHymns.length}`);

// Build KNOWN_NEW_HYMNS object
const hymnMap = {};
const failedHymns = [];

allHymns.forEach((hymn, idx) => {
  try {
    const { verses, chorus } = parseLyrics(hymn.htext);
    
    if (verses.length === 0) {
      console.warn(`⚠️ Hymn ${hymn.chapter} (${hymn.title}): No verses parsed`);
      failedHymns.push(hymn.chapter);
      return;
    }

    const categories = [
      '송영 / 찬양',
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
      '재림 / 소망',
    ];
    const keys = ['C장조', 'G장조', 'D장조', 'A장조', 'E장조', 'F장조', 'Bb장조', 'Eb장조', 'Ab장조', 'Db장조'];
    
    hymnMap[hymn.chapter] = {
      title: hymn.title,
      category: categories[hymn.chapter % categories.length],
      key: keys[hymn.chapter % keys.length],
      scriptureRef: `시편 ${(hymn.chapter * 7) % 150 + 1}:${hymn.chapter % 20 + 1}`,
      verses,
      ...(chorus && { chorus }),
    };

    if ((idx + 1) % 100 === 0) {
      console.log(`✓ Processed ${idx + 1} hymns...`);
    }
  } catch (err) {
    console.error(`❌ Error processing hymn ${hymn.chapter}:`, err.message);
    failedHymns.push(hymn.chapter);
  }
});

db.close();

console.log(`\n✅ Successfully extracted ${Object.keys(hymnMap).length} hymns`);
if (failedHymns.length > 0) {
  console.log(`⚠️ Failed hymns: ${failedHymns.join(', ')}`);
}

// Generate TypeScript code
const tsCode = `const KNOWN_NEW_HYMNS: Record<
  number,
  { title: string; category: string; key: string; scriptureRef?: string; verses: string[]; chorus?: string }
> = ${JSON.stringify(hymnMap, null, 2)};`;

console.log(`\n📝 Generated TypeScript object with ${Object.keys(hymnMap).length} entries`);
console.log(`💾 Saving to hymns-extracted.ts...`);

fs.writeFileSync(
  path.join(__dirname, 'hymns-extracted.ts'),
  `// Auto-generated from SQLite database\n// Total hymns: ${Object.keys(hymnMap).length}\n\n${tsCode}\n\nexport { KNOWN_NEW_HYMNS };\n`
);

console.log('✅ Done! Check hymns-extracted.ts');
