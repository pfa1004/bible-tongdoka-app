import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Book index mapping to 3-letter book ID (e.g. 1 -> gen, 40 -> mat)
const BOOK_ORDER_IDS = [
  'gen', 'exo', 'lev', 'num', 'deu', 'jos', 'jdg', 'rut', '1sa', '2sa',
  '1ki', '2ki', '1ch', '2ch', 'ezr', 'neh', 'est', 'job', 'psa', 'pro',
  'ecc', 'sng', 'isa', 'jer', 'lam', 'ezk', 'dan', 'hos', 'jol', 'amo',
  'oba', 'jon', 'mic', 'nam', 'hab', 'zep', 'hag', 'zec', 'mal',
  'mat', 'mrk', 'luk', 'jhn', 'act', 'rom', '1co', '2co', 'gal', 'eph',
  'php', 'col', '1th', '2th', '1ti', '2ti', 'tit', 'phm', 'heb', 'jas',
  '1pe', '2pe', '1jn', '2jn', '3jn', 'jud', 'rev'
];

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function exportCdbToJson(dbType, dbFileName) {
  console.log(`Starting export for ${dbType} (${dbFileName})...`);
  const dbPath = path.join(rootDir, 'b-data', dbFileName);
  if (!fs.existsSync(dbPath)) {
    console.error(`File not found: ${dbPath}`);
    return;
  }

  const db = new DatabaseSync(dbPath);
  const targetBaseDir = path.join(rootDir, 'public', 'commentary', dbType);
  ensureDir(targetBaseDir);

  const stmt = db.prepare('SELECT book, chapter, verse, btext FROM Bible ORDER BY book, chapter, verse');
  const rows = stmt.all();

  // Group by book & chapter
  const map = new Map(); // key: "bookId-chapter", value: object { verseNum: text }

  for (const row of rows) {
    const bookIdx = row.book; // 1-indexed
    const bookId = BOOK_ORDER_IDS[bookIdx - 1];
    if (!bookId) continue;

    const key = `${bookId}-${row.chapter}`;
    if (!map.has(key)) {
      map.set(key, {});
    }
    map.get(key)[row.verse] = row.btext || '';
  }

  let count = 0;
  for (const [key, data] of map.entries()) {
    const filePath = path.join(targetBaseDir, `${key}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data), 'utf-8');
    count++;
  }

  console.log(`Exported ${count} JSON files for ${dbType}!`);
}

function run() {
  exportCdbToJson('manna', '만나주석.cdb');
  exportCdbToJson('henry', '매튜헨리.cdb');
  exportCdbToJson('cross', '성경관주.cdb');
  console.log('All commentary & cross-reference data exported successfully to /public/commentary/!');
}

run();
