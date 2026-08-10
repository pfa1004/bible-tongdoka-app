import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'b-data', '새찬송가.hdb');
console.log(`Opening SQLite database: ${dbPath}`);

try {
  const db = new Database(dbPath, { readonly: true });

  // List all tables
  const tables = db.prepare(`SELECT name FROM sqlite_master WHERE type='table';`).all();
  console.log('\n=== Tables in database ===');
  console.log(tables.map(t => t.name).join(', '));

  // For each table, show schema and first 2 rows
  for (const table of tables) {
    console.log(`\n=== Table: ${table.name} ===`);
    
    // Get schema
    const schema = db.prepare(`PRAGMA table_info(${table.name});`).all();
    console.log('Columns:', schema.map(c => `${c.name}(${c.type})`).join(', '));
    
    // Get row count
    const count = db.prepare(`SELECT COUNT(*) as cnt FROM ${table.name};`).get();
    console.log(`Total rows: ${count.cnt}`);
    
    // Get first 2 rows
    const rows = db.prepare(`SELECT * FROM ${table.name} LIMIT 2;`).all();
    console.log(`Sample rows:`);
    rows.forEach((row, idx) => {
      console.log(`  Row ${idx + 1}:`, JSON.stringify(row, null, 2));
    });
  }

  db.close();
} catch (error) {
  console.error('Error:', error.message);
}
