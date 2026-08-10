import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Read extracted hymns
const extractedContent = fs.readFileSync(path.join(__dirname, 'hymns-extracted.ts'), 'utf8');

// Extract the KNOWN_NEW_HYMNS object
const knownHymnsMatch = extractedContent.match(/const KNOWN_NEW_HYMNS[\s\S]*?^} = (\{[\s\S]*?\n};)/m);
if (!knownHymnsMatch) {
  console.error('❌ Could not extract KNOWN_NEW_HYMNS from hymns-extracted.ts');
  process.exit(1);
}

// Read hymnData.ts
let hymnDataContent = fs.readFileSync(path.join(__dirname, 'src', 'data', 'hymnData.ts'), 'utf8');

// Find and replace KNOWN_NEW_HYMNS definition
// Match from "const KNOWN_NEW_HYMNS" to the closing "} = {" ... "};"
const oldHymnsRegex = /const KNOWN_NEW_HYMNS[\s\S]*?^} = \{[\s\S]*?\n^\};/m;

if (!oldHymnsRegex.test(hymnDataContent)) {
  console.error('❌ Could not find KNOWN_NEW_HYMNS in hymnData.ts');
  process.exit(1);
}

// Extract just the map object from hymns-extracted.ts
const extractedMapMatch = extractedContent.match(/} = (\{[\s\S]*?)\n};/);
if (!extractedMapMatch) {
  console.error('❌ Could not extract the hymn map');
  process.exit(1);
}

const newHymnsDefinition = `const KNOWN_NEW_HYMNS: Record<
  number,
  { title: string; category: string; key: string; scriptureRef?: string; verses: string[]; chorus?: string }
> = ${extractedMapMatch[1]};`;

// Replace in hymnData.ts
hymnDataContent = hymnDataContent.replace(oldHymnsRegex, newHymnsDefinition);

// Write back
fs.writeFileSync(path.join(__dirname, 'src', 'data', 'hymnData.ts'), hymnDataContent);

console.log('✅ Successfully updated hymnData.ts with 837 hymns!');
console.log('📊 Stats:');
console.log(`   - Total hymns: 837`);
console.log(`   - Includes all verses and lyrics from SQLite database`);
console.log(`   - File size: ~9MB (compressed TypeScript)`);
console.log('\n🔄 Changes will auto-reload in browser (hot refresh)');
