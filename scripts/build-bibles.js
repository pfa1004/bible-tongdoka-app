import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.resolve(__dirname, '..');
const B_DATA_DIR = path.join(ROOT_DIR, 'b-data');
const PUBLIC_BIBLE_DIR = path.join(ROOT_DIR, 'public', 'bible');

if (!fs.existsSync(PUBLIC_BIBLE_DIR)) {
  fs.mkdirSync(PUBLIC_BIBLE_DIR, { recursive: true });
}

// Book mapping table to standard book IDs
const BOOK_MAP = [
  { match: '창세기', id: 'gen' },
  { match: '출애굽기', id: 'exo' },
  { match: '레위기', id: 'lev' },
  { match: '민수기', id: 'num' },
  { match: '신명기', id: 'deu' },
  { match: '여호수아', id: 'jos' },
  { match: '사사기', id: 'jdg' },
  { match: '룻기', id: 'rut' },
  { match: '사무엘상', id: '1sa' },
  { match: '사무엘하', id: '2sa' },
  { match: '열왕기상', id: '1ki' },
  { match: '열왕기하', id: '2ki' },
  { match: '역대상', id: '1ch' },
  { match: '역대하', id: '2ch' },
  { match: '에스라', id: 'ezr' },
  { match: '느헤미야', id: 'neh' },
  { match: '에스더', id: 'est' },
  { match: '욥기', id: 'job' },
  { match: '시편', id: 'psa' },
  { match: '잠언', id: 'pro' },
  { match: '전도서', id: 'ecc' },
  { match: '아가', id: 'sng' },
  { match: '이사야', id: 'isa' },
  { match: '예레미야', id: 'jer' },
  { match: '예레미야애가', id: 'lam' },
  { match: '에스겔', id: 'ezk' },
  { match: '다니엘', id: 'dan' },
  { match: '호세아', id: 'hos' },
  { match: '요엘', id: 'jol' },
  { match: '아모스', id: 'amo' },
  { match: '오바디야', id: 'oba' },
  { match: '오바댜', id: 'oba' },
  { match: '요나', id: 'jon' },
  { match: '미가', id: 'mic' },
  { match: '나훔', id: 'nam' },
  { match: '하박국', id: 'hab' },
  { match: '스바냐', id: 'zep' },
  { match: '학개', id: 'hag' },
  { match: '스가리야', id: 'zec' },
  { match: '스가랴', id: 'zec' },
  { match: '말라기', id: 'mal' },
  { match: '마태복음', id: 'mat' },
  { match: '마가복음', id: 'mrk' },
  { match: '누가복음', id: 'luk' },
  { match: '요한복음', id: 'jhn' },
  { match: '사도행전', id: 'act' },
  { match: '로마서', id: 'rom' },
  { match: '고린도전서', id: '1co' },
  { match: '고린도후서', id: '2co' },
  { match: '갈라디아서', id: 'gal' },
  { match: '에베소서', id: 'eph' },
  { match: '빌립보서', id: 'php' },
  { match: '골로새서', id: 'col' },
  { match: '데살로니가전서', id: '1th' },
  { match: '데살로니가후서', id: '2th' },
  { match: '디모데전서', id: '1ti' },
  { match: '디모데후서', id: '2ti' },
  { match: '디도서', id: 'tit' },
  { match: '빌레몬서', id: 'phm' },
  { match: '히브리서', id: 'heb' },
  { match: '야고보서', id: 'jas' },
  { match: '베드로전서', id: '1pe' },
  { match: '베드로후서', id: '2pe' },
  { match: '요한1서', id: '1jn' },
  { match: '요한2서', id: '2jn' },
  { match: '요한3서', id: '3jn' },
  { match: '유다서', id: 'jud' },
  { match: '요한계시록', id: 'rev' }
];

function getBookInfo(fileName) {
  // Clean file name by stripping extension and bracketed text like (현대어)
  const cleanName = fileName.replace(/\.[^/.]+$/, '').replace(/\([^)]*\)/g, '').trim();
  
  // Sort by match string length descending so '예레미야애가' matches before '예레미야'
  const sortedMap = [...BOOK_MAP].sort((a, b) => b.match.length - a.match.length);
  for (const item of sortedMap) {
    if (cleanName.includes(item.match)) {
      return { id: item.id, name: item.match };
    }
  }
  return null;
}

function parseMarkdownBibleFolder(folderName) {
  const folderPath = path.join(B_DATA_DIR, folderName);
  if (!fs.existsSync(folderPath)) {
    console.error(`Folder not found: ${folderPath}`);
    return null;
  }

  const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.md'));
  const versesList = []; // Format: [{ bookId, bookName, chapter, verse, text }]

  // Sort files numerically if they start with number (e.g. 1.창세기.md)
  files.sort((a, b) => {
    const numA = parseInt(a.match(/^\d+/)?.[0] || '999', 10);
    const numB = parseInt(b.match(/^\d+/)?.[0] || '999', 10);
    return numA - numB;
  });

  for (const file of files) {
    const bookInfo = getBookInfo(file);
    if (!bookInfo) continue;

    const content = fs.readFileSync(path.join(folderPath, file), 'utf-8');
    const lines = content.split('\n');

    let currentChapter = 1;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Chapter header: ## 1장, ## 1, # 1장, ### Chapter 1
      const chapterMatch = trimmed.match(/^(?:#+|=|제)?\s*(\d+)\s*(?:장|Chapter|ch)?(?:\s*[:\.\-])?$/i);
      if (chapterMatch) {
        currentChapter = parseInt(chapterMatch[1], 10);
        continue;
      }

      // Verse line: **1:1** text, **1:1**text, 1:1 text, **1** text
      const verseMatch = trimmed.match(/^(?:\*\*)?(\d+):(\d+)(?:\*\*)?\s*(.*)$/);
      if (verseMatch) {
        const ch = parseInt(verseMatch[1], 10);
        const v = parseInt(verseMatch[2], 10);
        let verseText = verseMatch[3].trim();
        verseText = verseText.replace(/\\$/, '').trim();

        versesList.push({
          bookId: bookInfo.id,
          bookName: bookInfo.name,
          chapter: ch,
          verse: v,
          text: verseText
        });
      }
    }
  }

  return versesList;
}

console.log('Parsing b-data bibles...');

const targets = [
  { folder: '킹흠정역', id: 'HKJV', name: '킹흠정역', fileName: 'hkjv.json' },
  { folder: 'KJV1769', id: 'KJV', name: '킹제임스(KJV1769)', fileName: 'kjv.json' },
  { folder: 'KJV1611', id: 'KJV1611', name: '킹제임스(KJV1611)', fileName: 'kjv1611.json' },
  { folder: '개역한글', id: 'KRV', name: '개역한글', fileName: 'krv.json' }
];

const manifest = [];

for (const target of targets) {
  console.log(`Processing ${target.folder}...`);
  const data = parseMarkdownBibleFolder(target.folder);
  if (data && data.length > 0) {
    console.log(`Successfully parsed ${target.name}: ${data.length} verses.`);

    const outputPath = path.join(PUBLIC_BIBLE_DIR, target.fileName);
    fs.writeFileSync(outputPath, JSON.stringify(data), 'utf-8');

    manifest.push({
      id: target.id,
      name: target.name,
      file: `/bible/${target.fileName}`,
      description: `b-data에서 추출한 ${target.name} 66권 완독 성경 데이터`
    });
  } else {
    console.warn(`Skipped ${target.name}: No verses found or folder missing.`);
  }
}

const manifestPath = path.join(PUBLIC_BIBLE_DIR, 'bible_manifest.json');
fs.writeFileSync(manifestPath, JSON.stringify({ files: manifest }, null, 2), 'utf-8');

console.log('Bible parsing & JSON generation completed successfully!');

