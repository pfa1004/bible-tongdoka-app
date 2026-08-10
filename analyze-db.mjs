import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database(path.join(__dirname, 'b-data', '새찬송가.hdb'), { readonly: true });

// Get min and max chapter numbers
const minMax = db.prepare('SELECT MIN(chapter) as min, MAX(chapter) as max, COUNT(*) as total FROM hymnal').get();
console.log('📊 Database Statistics:');
console.log('   Min chapter:', minMax.min);
console.log('   Max chapter:', minMax.max);
console.log('   Total rows:', minMax.total);

// Check for gaps in sequence
const allChapters = db.prepare('SELECT chapter FROM hymnal ORDER BY chapter').all();
const chapters = allChapters.map(r => r.chapter);
console.log('\n📈 Chapter distribution:');
console.log('   First 10:', chapters.slice(0, 10).join(', '));
console.log('   Last 10:', chapters.slice(-10).join(', '));

// Sample from different ranges
console.log('\n📚 Sample from different ranges:');
const ranges = [
  { label: '1-10', start: 1, end: 10 },
  { label: '640-650', start: 640, end: 650 },
  { label: '700-710', start: 700, end: 710 },
  { label: '800-837', start: 800, end: 837 }
];

ranges.forEach(r => {
  const rows = db.prepare(`SELECT chapter, title FROM hymnal WHERE chapter BETWEEN ${r.start} AND ${r.end} ORDER BY chapter`).all();
  if (rows.length > 0) {
    console.log(`\n   Range ${r.label}:`);
    rows.forEach(row => console.log(`     ${row.chapter}: ${row.title}`));
  }
});

db.close();
