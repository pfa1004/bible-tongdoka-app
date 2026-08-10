export interface StandardBookInfo {
  order: number; // 1 ~ 66
  id: string; // 'gen', 'ecc', 'isa', etc.
  name: string; // '창세기', '전도서', '이사야', etc.
  shortName: string; // '창', '전', '사', etc.
  englishName: string; // 'Genesis', 'Ecclesiastes', 'Isaiah', etc.
  englishShort: string; // 'Gen', 'Ecc', 'Isa', etc.
  aliases: string[]; // ['21', '전도', 'eccl', 'ecclesiastes']
  expectedChapters: number;
  expectedVerses: number;
  testament: 'OT' | 'NT';
}

export const STANDARD_BIBLE_66_BOOKS: StandardBookInfo[] = [
  // OT (1 ~ 39)
  { order: 1, id: 'gen', name: '창세기', shortName: '창', englishName: 'Genesis', englishShort: 'Gen', aliases: ['1', '01', '창', '창세', 'genesis', 'gen'], expectedChapters: 50, expectedVerses: 1533, testament: 'OT' },
  { order: 2, id: 'exo', name: '출애굽기', shortName: '출', englishName: 'Exodus', englishShort: 'Exo', aliases: ['2', '02', '출', '출애', 'exodus', 'exo', 'exod'], expectedChapters: 40, expectedVerses: 1213, testament: 'OT' },
  { order: 3, id: 'lev', name: '레위기', shortName: '레', englishName: 'Leviticus', englishShort: 'Lev', aliases: ['3', '03', '레', '레위', 'leviticus', 'lev'], expectedChapters: 27, expectedVerses: 859, testament: 'OT' },
  { order: 4, id: 'num', name: '민수기', shortName: '민', englishName: 'Numbers', englishShort: 'Num', aliases: ['4', '04', '민', '민수', 'numbers', 'num'], expectedChapters: 36, expectedVerses: 1288, testament: 'OT' },
  { order: 5, id: 'deu', name: '신명기', shortName: '신', englishName: 'Deuteronomy', englishShort: 'Deu', aliases: ['5', '05', '신', '신명', 'deuteronomy', 'deu', 'deut'], expectedChapters: 34, expectedVerses: 959, testament: 'OT' },
  { order: 6, id: 'jos', name: '여호수아', shortName: '수', englishName: 'Joshua', englishShort: 'Jos', aliases: ['6', '06', '수', '여호', '여호수아', 'joshua', 'jos', 'josh'], expectedChapters: 24, expectedVerses: 658, testament: 'OT' },
  { order: 7, id: 'jdg', name: '사사기', shortName: '삿', englishName: 'Judges', englishShort: 'Jdg', aliases: ['7', '07', '삿', '사사', 'judges', 'jdg', 'judg'], expectedChapters: 21, expectedVerses: 618, testament: 'OT' },
  { order: 8, id: 'rut', name: '룻기', shortName: '룻', englishName: 'Ruth', englishShort: 'Rut', aliases: ['8', '08', '룻', 'ruth', 'rut'], expectedChapters: 4, expectedVerses: 85, testament: 'OT' },
  { order: 9, id: '1sa', name: '사무엘상', shortName: '삼상', englishName: '1 Samuel', englishShort: '1Sa', aliases: ['9', '09', '삼상', '사무엘상', '1samuel', '1sa', '1sam'], expectedChapters: 31, expectedVerses: 810, testament: 'OT' },
  { order: 10, id: '2sa', name: '사무엘하', shortName: '삼하', englishName: '2 Samuel', englishShort: '2Sa', aliases: ['10', '삼하', '사무엘하', '2samuel', '2sa', '2sam'], expectedChapters: 24, expectedVerses: 695, testament: 'OT' },
  { order: 11, id: '1ki', name: '열왕기상', shortName: '왕상', englishName: '1 Kings', englishShort: '1Ki', aliases: ['11', '왕상', '열왕기상', '1kings', '1ki', '1kin'], expectedChapters: 22, expectedVerses: 816, testament: 'OT' },
  { order: 12, id: '2ki', name: '열왕기하', shortName: '왕하', englishName: '2 Kings', englishShort: '2Ki', aliases: ['12', '왕하', '열왕기하', '2kings', '2ki', '2kin'], expectedChapters: 25, expectedVerses: 716, testament: 'OT' },
  { order: 13, id: '1ch', name: '역대상', shortName: '대상', englishName: '1 Chronicles', englishShort: '1Ch', aliases: ['13', '대상', '역대상', '1chronicles', '1ch', '1chr'], expectedChapters: 29, expectedVerses: 942, testament: 'OT' },
  { order: 14, id: '2ch', name: '역대하', shortName: '대하', englishName: '2 Chronicles', englishShort: '2Ch', aliases: ['14', '대하', '역대하', '2chronicles', '2ch', '2chr'], expectedChapters: 36, expectedVerses: 822, testament: 'OT' },
  { order: 15, id: 'ezr', name: '에스라', shortName: '스', englishName: 'Ezra', englishShort: 'Ezr', aliases: ['15', '스', '에스라', 'ezra', 'ezr'], expectedChapters: 10, expectedVerses: 280, testament: 'OT' },
  { order: 16, id: 'neh', name: '느헤미야', shortName: '느', englishName: 'Nehemiah', englishShort: 'Neh', aliases: ['16', '느', '느헤', '느헤미야', 'nehemiah', 'neh'], expectedChapters: 13, expectedVerses: 406, testament: 'OT' },
  { order: 17, id: 'est', name: '에스더', shortName: '에', englishName: 'Esther', englishShort: 'Est', aliases: ['17', '에', '에스더', 'esther', 'est'], expectedChapters: 10, expectedVerses: 167, testament: 'OT' },
  { order: 18, id: 'job', name: '욥기', shortName: '욥', englishName: 'Job', englishShort: 'Job', aliases: ['18', '욥', 'job'], expectedChapters: 42, expectedVerses: 1070, testament: 'OT' },
  { order: 19, id: 'psa', name: '시편', shortName: '시', englishName: 'Psalms', englishShort: 'Psa', aliases: ['19', '시', '시편', 'psalms', 'psa', 'ps'], expectedChapters: 150, expectedVerses: 2461, testament: 'OT' },
  { order: 20, id: 'pro', name: '잠언', shortName: '잠', englishName: 'Proverbs', englishShort: 'Pro', aliases: ['20', '잠', '잠언', 'proverbs', 'pro', 'prov'], expectedChapters: 31, expectedVerses: 915, testament: 'OT' },
  { order: 21, id: 'ecc', name: '전도서', shortName: '전', englishName: 'Ecclesiastes', englishShort: 'Ecc', aliases: ['21', '전', '전도', '전도서', 'ecclesiastes', 'ecc', 'eccl'], expectedChapters: 12, expectedVerses: 222, testament: 'OT' },
  { order: 22, id: 'sng', name: '아가', shortName: '아', englishName: 'Song of Solomon', englishShort: 'Sng', aliases: ['22', '아', '아가', 'songofsolomon', 'sng', 'song', 'sos'], expectedChapters: 8, expectedVerses: 117, testament: 'OT' },
  { order: 23, id: 'isa', name: '이사야', shortName: '사', englishName: 'Isaiah', englishShort: 'Isa', aliases: ['23', '사', '이사', '이사야', 'isaiah', 'isa'], expectedChapters: 66, expectedVerses: 1292, testament: 'OT' },
  { order: 24, id: 'jer', name: '예레미야', shortName: '렘', englishName: 'Jeremiah', englishShort: 'Jer', aliases: ['24', '렘', '예레', '예레미야', 'jeremiah', 'jer'], expectedChapters: 52, expectedVerses: 1364, testament: 'OT' },
  { order: 25, id: 'lam', name: '예레미야애가', shortName: '애', englishName: 'Lamentations', englishShort: 'Lam', aliases: ['25', '애', '애가', '예레미야애가', 'lamentations', 'lam'], expectedChapters: 5, expectedVerses: 154, testament: 'OT' },
  { order: 26, id: 'ezk', name: '에스겔', shortName: '겔', englishName: 'Ezekiel', englishShort: 'Ezk', aliases: ['26', '겔', '에스겔', 'ezekiel', 'ezk', 'ezek'], expectedChapters: 48, expectedVerses: 1273, testament: 'OT' },
  { order: 27, id: 'dan', name: '다니엘', shortName: '단', englishName: 'Daniel', englishShort: 'Dan', aliases: ['27', '단', '다니엘', 'daniel', 'dan'], expectedChapters: 12, expectedVerses: 357, testament: 'OT' },
  { order: 28, id: 'hos', name: '호세아', shortName: '호', englishName: 'Hosea', englishShort: 'Hos', aliases: ['28', '호', '호세아', 'hosea', 'hos'], expectedChapters: 14, expectedVerses: 197, testament: 'OT' },
  { order: 29, id: 'jol', name: '요엘', shortName: '욜', englishName: 'Joel', englishShort: 'Jol', aliases: ['29', '욜', '요엘', 'joel', 'jol', 'joe'], expectedChapters: 3, expectedVerses: 73, testament: 'OT' },
  { order: 30, id: 'amo', name: '아모스', shortName: '암', englishName: 'Amos', englishShort: 'Amo', aliases: ['30', '암', '아모스', 'amos', 'amo'], expectedChapters: 9, expectedVerses: 146, testament: 'OT' },
  // 31. 오바댜
  { order: 31, id: 'oba', name: '오바댜', shortName: '옵', englishName: 'Obadiah', englishShort: 'Oba', aliases: ['31', '옵', '오바댜', '오바디야', 'obadiah', 'oba', 'obad'], expectedChapters: 1, expectedVerses: 21, testament: 'OT' },
  { order: 32, id: 'jon', name: '요나', shortName: '욘', englishName: 'Jonah', englishShort: 'Jon', aliases: ['32', '욘', '요나', 'jonah', 'jon'], expectedChapters: 4, expectedVerses: 48, testament: 'OT' },
  { order: 33, id: 'mic', name: '미가', shortName: '미', englishName: 'Micah', englishShort: 'Mic', aliases: ['33', '미', '미가', 'micah', 'mic'], expectedChapters: 7, expectedVerses: 105, testament: 'OT' },
  { order: 34, id: 'nam', name: '나훔', shortName: '나', englishName: 'Nahum', englishShort: 'Nam', aliases: ['34', '나', '나훔', 'nahum', 'nam'], expectedChapters: 3, expectedVerses: 47, testament: 'OT' },
  { order: 35, id: 'hab', name: '하박국', shortName: '합', englishName: 'Habakkuk', englishShort: 'Hab', aliases: ['35', '합', '하박국', 'habakkuk', 'hab'], expectedChapters: 3, expectedVerses: 56, testament: 'OT' },
  { order: 36, id: 'zep', name: '스바냐', shortName: '습', englishName: 'Zephaniah', englishShort: 'Zep', aliases: ['36', '습', '스바냐', 'zephaniah', 'zep', 'zeph'], expectedChapters: 3, expectedVerses: 53, testament: 'OT' },
  { order: 37, id: 'hag', name: '학개', shortName: '학', englishName: 'Haggai', englishShort: 'Hag', aliases: ['37', '학', '학개', 'haggai', 'hag'], expectedChapters: 2, expectedVerses: 38, testament: 'OT' },
  // 38. 스가랴
  { order: 38, id: 'zec', name: '스가랴', shortName: '슥', englishName: 'Zechariah', englishShort: 'Zec', aliases: ['38', '슥', '스가랴', '스가리야', 'zechariah', 'zec', 'zech'], expectedChapters: 14, expectedVerses: 211, testament: 'OT' },
  { order: 39, id: 'mal', name: '말라기', shortName: '말', englishName: 'Malachi', englishShort: 'Mal', aliases: ['39', '말', '말라기', 'malachi', 'mal'], expectedChapters: 4, expectedVerses: 55, testament: 'OT' },

  // NT (40 ~ 66)
  { order: 40, id: 'mat', name: '마태복음', shortName: '마', englishName: 'Matthew', englishShort: 'Mat', aliases: ['40', '마', '마태', '마태복음', 'matthew', 'mat', 'matt'], expectedChapters: 28, expectedVerses: 1071, testament: 'NT' },
  { order: 41, id: 'mrk', name: '마가복음', shortName: '막', englishName: 'Mark', englishShort: 'Mrk', aliases: ['41', '막', '마가', '마가복음', 'mark', 'mrk', 'mar'], expectedChapters: 16, expectedVerses: 678, testament: 'NT' },
  { order: 42, id: 'luk', name: '누가복음', shortName: '눅', englishName: 'Luke', englishShort: 'Luk', aliases: ['42', '눅', '누가', '누가복음', 'luke', 'luk'], expectedChapters: 24, expectedVerses: 1151, testament: 'NT' },
  { order: 43, id: 'jhn', name: '요한복음', shortName: '요', englishName: 'John', englishShort: 'Jhn', aliases: ['43', '요', '요한', '요한복음', 'john', 'jhn', 'joh'], expectedChapters: 21, expectedVerses: 879, testament: 'NT' },
  { order: 44, id: 'act', name: '사도행전', shortName: '행', englishName: 'Acts', englishShort: 'Act', aliases: ['44', '행', '사도', '사도행전', 'acts', 'act'], expectedChapters: 28, expectedVerses: 1007, testament: 'NT' },
  { order: 45, id: 'rom', name: '로마서', shortName: '롬', englishName: 'Romans', englishShort: 'Rom', aliases: ['45', '롬', '로마', '로마서', 'romans', 'rom'], expectedChapters: 16, expectedVerses: 433, testament: 'NT' },
  { order: 46, id: '1co', name: '고린도전서', shortName: '고전', englishName: '1 Corinthians', englishShort: '1Co', aliases: ['46', '고전', '고린도전서', '1corinthians', '1co', '1cor'], expectedChapters: 16, expectedVerses: 437, testament: 'NT' },
  { order: 47, id: '2co', name: '고린도후서', shortName: '고후', englishName: '2 Corinthians', englishShort: '2Co', aliases: ['47', '고후', '고린도후서', '2corinthians', '2co', '2cor'], expectedChapters: 13, expectedVerses: 257, testament: 'NT' },
  { order: 48, id: 'gal', name: '갈라디아서', shortName: '갈', englishName: 'Galatians', englishShort: 'Gal', aliases: ['48', '갈', '갈라', '갈라디아서', 'galatians', 'gal'], expectedChapters: 6, expectedVerses: 149, testament: 'NT' },
  { order: 49, id: 'eph', name: '에베소서', shortName: '엡', englishName: 'Ephesians', englishShort: 'Eph', aliases: ['49', '엡', '에베', '에베소서', 'ephesians', 'eph'], expectedChapters: 6, expectedVerses: 155, testament: 'NT' },
  { order: 50, id: 'php', name: '빌립보서', shortName: '빌', englishName: 'Philippians', englishShort: 'Php', aliases: ['50', '빌', '빌립', '빌립보서', 'philippians', 'php', 'phil'], expectedChapters: 4, expectedVerses: 104, testament: 'NT' },
  { order: 51, id: 'col', name: '골로새서', shortName: '골', englishName: 'Colossians', englishShort: 'Col', aliases: ['51', '골', '골로', '골로새서', 'colossians', 'col'], expectedChapters: 4, expectedVerses: 95, testament: 'NT' },
  { order: 52, id: '1th', name: '데살로니가전서', shortName: '살전', englishName: '1 Thessalonians', englishShort: '1Th', aliases: ['52', '살전', '데살로니가전서', '1thessalonians', '1th', '1thess'], expectedChapters: 5, expectedVerses: 89, testament: 'NT' },
  { order: 53, id: '2th', name: '데살로니가후서', shortName: '살후', englishName: '2 Thessalonians', englishShort: '2Th', aliases: ['53', '살후', '데살로니가후서', '2thessalonians', '2th', '2thess'], expectedChapters: 3, expectedVerses: 47, testament: 'NT' },
  { order: 54, id: '1ti', name: '디모데전서', shortName: '딤전', englishName: '1 Timothy', englishShort: '1Ti', aliases: ['54', '딤전', '디모데전서', '1timothy', '1ti', '1tim'], expectedChapters: 6, expectedVerses: 113, testament: 'NT' },
  { order: 55, id: '2ti', name: '디모데후서', shortName: '딤후', englishName: '2 Timothy', englishShort: '2Ti', aliases: ['55', '딤후', '디모데후서', '2timothy', '2ti', '2tim'], expectedChapters: 4, expectedVerses: 83, testament: 'NT' },
  { order: 56, id: 'tit', name: '디도서', shortName: '딛', englishName: 'Titus', englishShort: 'Tit', aliases: ['56', '딛', '디도', '디도서', 'titus', 'tit'], expectedChapters: 3, expectedVerses: 46, testament: 'NT' },
  { order: 57, id: 'phm', name: '빌레몬서', shortName: '몬', englishName: 'Philemon', englishShort: 'Phm', aliases: ['57', '몬', '빌레', '빌레몬서', 'philemon', 'phm'], expectedChapters: 1, expectedVerses: 25, testament: 'NT' },
  { order: 58, id: 'heb', name: '히브리서', shortName: '히', englishName: 'Hebrews', englishShort: 'Heb', aliases: ['58', '히', '히브', '히브리서', 'hebrews', 'heb'], expectedChapters: 13, expectedVerses: 303, testament: 'NT' },
  { order: 59, id: 'jas', name: '야고보서', shortName: '야', englishName: 'James', englishShort: 'Jas', aliases: ['59', '야', '야고', '야고보서', 'james', 'jas'], expectedChapters: 5, expectedVerses: 108, testament: 'NT' },
  { order: 60, id: '1pe', name: '베드로전서', shortName: '벧전', englishName: '1 Peter', englishShort: '1Pe', aliases: ['60', '벧전', '베드로전서', '1peter', '1pe', '1pet'], expectedChapters: 5, expectedVerses: 105, testament: 'NT' },
  { order: 61, id: '2pe', name: '베드로후서', shortName: '벧후', englishName: '2 Peter', englishShort: '2Pe', aliases: ['61', '벧후', '베드로후서', '2peter', '2pe', '2pet'], expectedChapters: 3, expectedVerses: 61, testament: 'NT' },
  { order: 62, id: '1jn', name: '요한1서', shortName: '요1', englishName: '1 John', englishShort: '1Jn', aliases: ['62', '요1', '요한일서', '요한1서', '1john', '1jn'], expectedChapters: 5, expectedVerses: 105, testament: 'NT' },
  { order: 63, id: '2jn', name: '요한2서', shortName: '요2', englishName: '2 John', englishShort: '2Jn', aliases: ['63', '요2', '요한이서', '요한2서', '2john', '2jn'], expectedChapters: 1, expectedVerses: 13, testament: 'NT' },
  { order: 64, id: '3jn', name: '요한3서', shortName: '요3', englishName: '3 John', englishShort: '3Jn', aliases: ['64', '요3', '요한삼서', '요한3서', '3john', '3jn'], expectedChapters: 1, expectedVerses: 14, testament: 'NT' },
  { order: 65, id: 'jud', name: '유다서', shortName: '유', englishName: 'Jude', englishShort: 'Jud', aliases: ['65', '유', '유다', '유다서', 'jude', 'jud'], expectedChapters: 1, expectedVerses: 25, testament: 'NT' },
  { order: 66, id: 'rev', name: '요한계시록', shortName: '계', englishName: 'Revelation', englishShort: 'Rev', aliases: ['66', '계', '계시', '요한계시록', 'revelation', 'rev'], expectedChapters: 22, expectedVerses: 404, testament: 'NT' },
];

/**
 * Normalizes any raw book name, number, abbreviation or English name into a StandardBookInfo object.
 */
export function findStandardBook(rawInput: string | number): StandardBookInfo | null {
  if (rawInput === undefined || rawInput === null) return null;

  let inputStr = String(rawInput).trim();
  if (!inputStr) return null;

  // Direct ID check e.g. '1sa', 'oba', 'zec', 'gen'
  const matchedById = STANDARD_BIBLE_66_BOOKS.find((b) => b.id.toLowerCase() === inputStr.toLowerCase());
  if (matchedById) return matchedById;

  // Strip bracketed text like (현대어), [현대어], (Modern), (KRV)
  inputStr = inputStr.replace(/\([^)]*\)|\[[^\]]*\]/g, '').trim();

  // Strip common file extension if present (e.g. .md, .txt, .bdf, .markdown, .mdown, .mdtxt)
  inputStr = inputStr.replace(/\.(md|txt|bdf|markdown|mdown|mdtxt|bdb|sdb|cdb|db|dat)$/i, '').trim();

  // 1. Direct pure number check (1 ~ 66 or 01 ~ 66)
  const pureNumMatch = inputStr.match(/^0*([1-9]\d?)$/);
  if (pureNumMatch) {
    const num = parseInt(pureNumMatch[1], 10);
    if (num >= 1 && num <= 66) {
      return STANDARD_BIBLE_66_BOOKS.find((b) => b.order === num) || null;
    }
  }

  // 2. Check for leading order number + separator, e.g. "1.창세기", "19.시편", "01_창세기", "1-창세기", "42.누가복음"
  const leadingNumMatch = inputStr.match(/^0*([1-9]\d?)[\s\._\-:]+(.+)$/);
  if (leadingNumMatch) {
    const orderNum = parseInt(leadingNumMatch[1], 10);
    const restPart = leadingNumMatch[2].trim();
    if (orderNum >= 1 && orderNum <= 66) {
      // First attempt matching the remaining name
      if (restPart) {
        const bookFromRest = findStandardBook(restPart);
        if (bookFromRest) return bookFromRest;
      }
      // Fallback to book order number
      const bookByOrder = STANDARD_BIBLE_66_BOOKS.find((b) => b.order === orderNum);
      if (bookByOrder) return bookByOrder;
    }
  }

  // 3. Clean input string: remove brackets, parentheses, colons, dots, slashes, dashes, underscores
  const cleanStr = inputStr
    .toLowerCase()
    .replace(/[\[\]<>\(\):,\/\.-_]/g, '')
    .trim();

  if (!cleanStr) return null;

  const num = parseInt(cleanStr, 10);
  if (!isNaN(num) && num >= 1 && num <= 66 && /^\d+$/.test(cleanStr)) {
    return STANDARD_BIBLE_66_BOOKS.find((b) => b.order === num) || null;
  }

  // 4. Exact match against name, shortName, id, englishName, englishShort, or aliases
  for (const book of STANDARD_BIBLE_66_BOOKS) {
    if (
      book.name.toLowerCase() === cleanStr ||
      book.shortName.toLowerCase() === cleanStr ||
      book.id.toLowerCase() === cleanStr ||
      book.englishName.toLowerCase() === cleanStr ||
      book.englishShort.toLowerCase() === cleanStr ||
      book.aliases.some((a) => a.toLowerCase() === cleanStr)
    ) {
      return book;
    }
  }

  // 5. Prefix/Substring match for Korean full/partial names (e.g. "창세기", "마태복음", "사도행전", "시편")
  let bestMatch: StandardBookInfo | null = null;
  let maxMatchedLen = 0;

  for (const book of STANDARD_BIBLE_66_BOOKS) {
    const bName = book.name.toLowerCase();
    const bShort = book.shortName.toLowerCase();

    if (bName.startsWith(cleanStr) && cleanStr.length >= 2) {
      if (cleanStr.length > maxMatchedLen) {
        maxMatchedLen = cleanStr.length;
        bestMatch = book;
      }
    } else if (cleanStr.startsWith(bName)) {
      if (bName.length > maxMatchedLen) {
        maxMatchedLen = bName.length;
        bestMatch = book;
      }
    } else if (cleanStr === bShort) {
      return book;
    }
  }

  if (bestMatch) return bestMatch;

  // 6. Check aliases for exact match
  for (const book of STANDARD_BIBLE_66_BOOKS) {
    for (const alias of book.aliases) {
      if (alias.toLowerCase() === cleanStr) return book;
    }
  }

  return null;
}

/**
 * Normalizes raw book name string into standard Korean name ('전도서', '이사야' 등)
 */
export function normalizeBookName(rawInput: string | number): string {
  const matched = findStandardBook(rawInput);
  return matched ? matched.name : String(rawInput).trim();
}

export interface ParsedVerse {
  bookName: string;
  chapter: number;
  verse: number;
  text: string;
}

export interface BookIntegritySummary {
  bookInfo: StandardBookInfo;
  foundVerses: number;
  foundChapters: number;
  isComplete: boolean;
  status: 'ok' | 'warning' | 'missing';
  issues: string[];
}

export interface IntegrityReport {
  translationName: string;
  totalVerses: number;
  totalBooksFound: number;
  integrityScore: number; // 0 - 100
  missingBooks: string[];
  duplicateVersesCount: number;
  emptyVersesCount: number;
  unrecognizedBooksCount: number;
  keyBooksStatus: {
    ecc: { found: boolean; verses: number; ok: boolean }; // 전도서
    isa: { found: boolean; verses: number; ok: boolean }; // 이사야
    psa: { found: boolean; verses: number; ok: boolean }; // 시편
  };
  bookSummaries: BookIntegritySummary[];
  normalizedVerses: ParsedVerse[];
}

/**
 * Robust Stateful Bible Text Parser
 * Correctly parses BDF, TXT, BDB, DAT, CSV, and Markdown (.md) formats preserving book context (Ecclesiastes, Isaiah, etc.)
 */
export function parseBibleTextContent(rawText: string, defaultBookNameHint?: string): ParsedVerse[] {
  if (!rawText) return [];

  const trimmed = rawText.trim();

  // 1. First, attempt to parse full JSON array or wrapped object
  if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
    try {
      const parsed = JSON.parse(trimmed);
      const items = Array.isArray(parsed) ? parsed : (parsed.verses || parsed.data || parsed.rows || [parsed]);
      if (Array.isArray(items) && items.length > 0) {
        const jsonResults: ParsedVerse[] = [];
        for (const item of items) {
          if (!item || typeof item !== 'object') continue;
          const rawBook = item.book || item.bookName || item.b || item.bk || item.book_name || item.Book || item.BookName;
          const chapter = parseInt(item.chapter || item.c || item.ch || item.chapterNum || item.Chapter || 1, 10);
          const verse = parseInt(item.verse || item.v || item.vrs || item.verseNum || item.Verse || 1, 10);
          const text = item.text || item.content || item.t || item.txt || item.verseText || item.VerseText || item.Text || '';

          if (text) {
            const matched = (rawBook ? findStandardBook(rawBook) : null) || (defaultBookNameHint ? findStandardBook(defaultBookNameHint) : null) || STANDARD_BIBLE_66_BOOKS[0];
            jsonResults.push({
              bookName: matched.name,
              chapter: isNaN(chapter) ? 1 : chapter,
              verse: isNaN(verse) ? 1 : verse,
              text: String(text).trim(),
            });
          }
        }
        if (jsonResults.length > 0) {
          return jsonResults;
        }
      }
    } catch {
      // Fallthrough to line-by-line parsing if not standard monolithic JSON
    }
  }

  // 2. Line-by-line parsing (NDJSON / JSON lines / Text patterns)
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '').trim())
    .filter(Boolean);

  let currentBook: StandardBookInfo | null = defaultBookNameHint ? findStandardBook(defaultBookNameHint) : null;
  if (!currentBook) {
    currentBook = STANDARD_BIBLE_66_BOOKS[0]; // default Genesis
  }

  let currentChapter = 1;
  let lastVerse = 0;
  const results: ParsedVerse[] = [];

  for (let rawLine of lines) {
    if (!rawLine || rawLine.startsWith('//') || rawLine.startsWith('SQLite format') || rawLine.startsWith('<!--')) continue;

    // Check if line is a single JSON object e.g. {"book": "Gen", "chapter": 10, "verse": 5, "text": "..."}
    const lineToParse = rawLine.replace(/,$/, '').trim();
    if (lineToParse.startsWith('{') && lineToParse.endsWith('}')) {
      try {
        const item = JSON.parse(lineToParse);
        if (item && typeof item === 'object') {
          const rawBook = item.book || item.bookName || item.b || item.bk || item.book_name || item.Book || item.BookName;
          const chapter = parseInt(item.chapter || item.c || item.ch || item.chapterNum || item.Chapter || 1, 10);
          const verse = parseInt(item.verse || item.v || item.vrs || item.verseNum || item.Verse || 1, 10);
          const text = item.text || item.content || item.t || item.txt || item.verseText || item.VerseText || item.Text || '';

          if (text) {
            const matched = (rawBook ? findStandardBook(rawBook) : null) || currentBook || STANDARD_BIBLE_66_BOOKS[0];
            currentBook = matched;
            currentChapter = isNaN(chapter) ? 1 : chapter;
            results.push({
              bookName: matched.name,
              chapter: isNaN(chapter) ? 1 : chapter,
              verse: isNaN(verse) ? 1 : verse,
              text: String(text).trim(),
            });
            continue;
          }
        }
      } catch {
        // Not valid JSON, fall back to line-based text regex matching below
      }
    }

    // Clean line: trim and remove markdown bullet/bold/italic markers
    let line = rawLine
      .replace(/^\s*[-*+]\s+/, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .trim();

    if (!line) continue;

    // PREPROCESSING: Add space between book name and numbers if stuck (e.g. 창1 -> 창 1, 창1:1 -> 창 1:1, 시1편 -> 시 1편)
    line = line.replace(/^([가-힣a-zA-Z]+)(\d+)(장|편)?$/i, '$1 $2$3');
    line = line.replace(/^([가-힣a-zA-Z]+)\s*(\d+)[:\.\/](\d+)/i, '$1 $2:$3');

    // Handle markdown table rows e.g. "| 1:1 | 태초에... |" or "| 창 | 1 | 1 | 태초에... |"
    if (line.startsWith('|') && line.endsWith('|')) {
      if (/^\|[\s\-:|]+\|$/.test(line)) continue; // skip markdown table divider line like "|---|---|---|"
      const cells = line.split('|').map((c) => c.trim()).filter(Boolean);
      if (cells.length > 0 && /^(?:장|편|절|book|chapter|verse|content|text|본문|구절)/i.test(cells[0])) {
        continue; // skip markdown table header row
      }
      line = cells.join(' ');
    }

    // Handle bracketed reference wrappers at line start e.g. [창1:1], <창1:1>, (창1:1), [1:1], <1:1>
    // Note: Do NOT strip Strong's codes like <H7225> or <G1234>!
    const isStrongsTag = /^<[HGhg]\d+>/.test(line);
    if (!isStrongsTag) {
      line = line.replace(/^[\[<\(]\s*([가-힣a-zA-Z0-9\s:\.\/\-_]+)\s*[\]>\)]\s*/, '$1 ');
    }

    // Check for pure Book or Chapter headers
    // e.g., "# 창세기", "=== 창세기 ===", "<창세기>", "[창세기]", "창세기", "창세기 1장", "제 1 장", "제1장", "1장", "[1장]", "창세기 제1장", "시편 1편"
    const cleanedHeader = line.replace(/^[#=<\s\[제]+|[>=\s\]\.장편]+$/g, '').trim();

    // Pattern H1: "창세기 제 1 장" or "창세기 1장" or "시편 1편"
    const bookChMatch = line.match(/^(?:[#=<\s\[]+)?([가-힣a-zA-Z0-9]+)\s*(?:제)?\s*(\d+)\s*(?:장|편|Chapter|ch)?(?:\s*[:\.\-])?(?:[>=\s\]]+)?$/i);
    if (bookChMatch) {
      const candidate = findStandardBook(bookChMatch[1]);
      if (candidate) {
        currentBook = candidate;
        currentChapter = parseInt(bookChMatch[2], 10) || 1;
        lastVerse = 0;
        continue;
      }
    }

    // Pattern H2: Pure chapter header "제 1 장", "제1편", "1장", "1편", "[1편]", "Chapter 1"
    const chOnlyMatch = line.match(/^(?:[#=<\s\[]+)?(?:제|Chapter|ch)?\s*(\d+)\s*(?:장|편|Chapter|ch)?(?:\s*[:\.\-])?(?:[>=\s\]]+)?$/i);
    if (chOnlyMatch) {
      const parsedCh = parseInt(chOnlyMatch[1], 10);
      if (parsedCh > 0 && parsedCh <= 150) {
        currentChapter = parsedCh;
        lastVerse = 0;
        continue;
      }
    }

    // Pattern H3: Pure book header "창세기" or "전도서"
    const bookOnlyMatch = findStandardBook(cleanedHeader);
    if (bookOnlyMatch) {
      currentBook = bookOnlyMatch;
      currentChapter = 1;
      lastVerse = 0;
      continue;
    }

    // Try verse pattern matchers
    let matchedBook: StandardBookInfo | null = null;
    let chapter = 0;
    let verse = 0;
    let verseText = '';

    // Pattern A: 3-part delimited format: Book + Chapter + Verse + Text
    const mDelim = line.match(/^([가-힣a-zA-Z0-9]+)[\|\t,\/\.:\s]+(\d+)[\|\t,\/\.:\s]+(\d+)[\t,\/\.:\s]+(.+)$/);

    // Pattern B: BookAbbr/Number + Chapter : Verse + Text
    const mBookChVrs = line.match(/^([1-3]?\s*[가-힣a-zA-Z]+|\d+)\s*(\d+)[:\.\/](\d+)[\s:\.]+(.+)$/);

    // Pattern C: Korean Chapter/Verse
    const mKoreanChVrs = line.match(/^(?:([가-힣a-zA-Z0-9]+)\s*)?(\d+)\s*(?:장|편)\s*(\d+)(?:[\-~,]\d+)?\s*(?:절|편)[\s:\.]*(.+)$/);

    // Pattern D: Chapter : Verse + Text (uses currentBook)
    const mChVrsOnly = line.match(/^(\d+)[:\.\/](\d+)[\s:\.]+(.+)$/);

    // Pattern E: Verse Only + Text (uses currentBook and currentChapter)
    const mVerseOnly = line.match(/^(?:\[|\()?(\d+)(?:\]|\))?\s*(?:절|V|\.)?[\s:\.]+(.+)$/);

    if (mDelim) {
      const bCand = findStandardBook(mDelim[1]);
      if (bCand) {
        const cNum = parseInt(mDelim[2], 10);
        const vNum = parseInt(mDelim[3], 10);
        if (cNum > 0 && cNum <= 150 && vNum > 0 && vNum <= 200) {
          matchedBook = bCand;
          chapter = cNum;
          verse = vNum;
          verseText = mDelim[4];
        }
      }
    }

    if (!verseText && mBookChVrs) {
      const bCand = findStandardBook(mBookChVrs[1]);
      if (bCand) {
        const cNum = parseInt(mBookChVrs[2], 10);
        const vNum = parseInt(mBookChVrs[3], 10);
        if (cNum > 0 && cNum <= 150 && vNum > 0 && vNum <= 200) {
          matchedBook = bCand;
          chapter = cNum;
          verse = vNum;
          verseText = mBookChVrs[4];
        }
      }
    }

    if (!verseText && mKoreanChVrs) {
      if (mKoreanChVrs[1]) {
        matchedBook = findStandardBook(mKoreanChVrs[1]);
      }
      const cNum = parseInt(mKoreanChVrs[2], 10);
      const vNum = parseInt(mKoreanChVrs[3], 10);
      if (cNum > 0 && cNum <= 150 && vNum > 0 && vNum <= 200) {
        chapter = cNum;
        verse = vNum;
        verseText = mKoreanChVrs[4];
      }
    }

    if (!verseText && mChVrsOnly) {
      const cNum = parseInt(mChVrsOnly[1], 10);
      const vNum = parseInt(mChVrsOnly[2], 10);
      if (cNum > 0 && cNum <= 150 && vNum > 0 && vNum <= 200) {
        matchedBook = currentBook;
        chapter = cNum;
        verse = vNum;
        verseText = mChVrsOnly[3];
      }
    }

    if (!verseText && mVerseOnly) {
      const vNum = parseInt(mVerseOnly[1], 10);
      // Valid verse number MUST be between 1 and 200 (Psalms 119 has 176 verses max)
      if (vNum > 0 && vNum <= 200) {
        verse = vNum;
        verseText = mVerseOnly[2];
        matchedBook = currentBook;
        // Auto-increment chapter if verse resets (e.g. verse 1 arrives after verse 31, or verse 1 after verse 1)
        if (verse <= lastVerse && (verse <= 3 || lastVerse >= 5)) {
          currentChapter++;
        }
        chapter = currentChapter;
      }
    }

    // Process matched verse
    if (verseText && verse > 0 && verse <= 200) {
      if (matchedBook && matchedBook.id !== currentBook?.id) {
        currentBook = matchedBook;
        currentChapter = chapter > 0 ? chapter : 1;
        lastVerse = 0;
      } else if (chapter > 0 && chapter !== currentChapter && chapter <= 150) {
        currentChapter = chapter;
        lastVerse = 0;
      }

      lastVerse = verse;

      const finalBook = currentBook || STANDARD_BIBLE_66_BOOKS[0];
      const cleanText = verseText.replace(/[\*\_\`\#]/g, '').trim();

      if (cleanText) {
        results.push({
          bookName: finalBook.name,
          chapter: currentChapter,
          verse,
          text: cleanText,
        });
      }
    }
  }

  // Fallback if structured parsing yielded nothing
  if (results.length === 0 && lines.length > 0) {
    const defaultBook = (defaultBookNameHint ? findStandardBook(defaultBookNameHint) : null) || STANDARD_BIBLE_66_BOOKS[0];
    lines.forEach((line, idx) => {
      const clean = line.replace(/^[#*-\s]+/, '').trim();
      if (clean) {
        results.push({
          bookName: defaultBook.name,
          chapter: 1,
          verse: idx + 1,
          text: clean,
        });
      }
    });
  }

  return results;
}

/**
 * Runs a comprehensive Integrity Check on any Bible translation verses array
 */
export function runBibleIntegrityCheck(verses: ParsedVerse[], translationName = '성경 데이터'): IntegrityReport {
  const normalizedVerses: ParsedVerse[] = [];
  const bookVerseMap: Record<string, ParsedVerse[]> = {};
  let duplicateCount = 0;
  let emptyCount = 0;
  let unrecognizedCount = 0;

  const seenKeys = new Set<string>();

  // Process and normalize verses
  for (const v of verses) {
    if (!v || !v.text || !v.text.trim()) {
      emptyCount++;
      continue;
    }

    // Try finding standard book by bookId first if present, then bookName
    const stdBook = (v as any).bookId ? findStandardBook((v as any).bookId) : findStandardBook(v.bookName);
    const bookName = stdBook ? stdBook.name : v.bookName;
    if (!stdBook) unrecognizedCount++;

    const key = `${bookName}_${v.chapter}_${v.verse}`;
    if (seenKeys.has(key)) {
      duplicateCount++;
    } else {
      seenKeys.add(key);
    }

    const normItem: ParsedVerse = {
      bookName,
      chapter: Number(v.chapter) || 1,
      verse: Number(v.verse) || 1,
      text: v.text.trim(),
    };

    normalizedVerses.push(normItem);

    if (!bookVerseMap[bookName]) {
      bookVerseMap[bookName] = [];
    }
    bookVerseMap[bookName].push(normItem);
  }

  // Analyze 66 books
  const bookSummaries: BookIntegritySummary[] = [];
  const missingBooks: string[] = [];
  let foundBooksCount = 0;

  for (const std of STANDARD_BIBLE_66_BOOKS) {
    const list = bookVerseMap[std.name] || [];
    const foundCount = list.length;
    const chaptersSet = new Set(list.map((i) => i.chapter));
    const foundChapters = chaptersSet.size;

    const issues: string[] = [];
    if (foundCount === 0) {
      issues.push('성경 데이터 누락');
      missingBooks.push(std.name);
    } else {
      foundBooksCount++;
      if (foundChapters < std.expectedChapters) {
        issues.push(`장 수 부족 (${foundChapters}/${std.expectedChapters}장)`);
      }
      if (Math.abs(foundCount - std.expectedVerses) > 50) {
        issues.push(`구절 수 차이 (현: ${foundCount}절 / 표준: ${std.expectedVerses}절)`);
      }
    }

    let status: 'ok' | 'warning' | 'missing' = 'ok';
    if (foundCount === 0) status = 'missing';
    else if (issues.length > 0) status = 'warning';

    bookSummaries.push({
      bookInfo: std,
      foundVerses: foundCount,
      foundChapters,
      isComplete: foundCount > 0 && foundChapters >= std.expectedChapters,
      status,
      issues,
    });
  }

  // Key Books Check
  const eccSummary = bookSummaries.find((b) => b.bookInfo.id === 'ecc');
  const isaSummary = bookSummaries.find((b) => b.bookInfo.id === 'isa');
  const psaSummary = bookSummaries.find((b) => b.bookInfo.id === 'psa');

  const keyBooksStatus = {
    ecc: {
      found: (eccSummary?.foundVerses || 0) > 0,
      verses: eccSummary?.foundVerses || 0,
      ok: (eccSummary?.foundVerses || 0) >= 200,
    },
    isa: {
      found: (isaSummary?.foundVerses || 0) > 0,
      verses: isaSummary?.foundVerses || 0,
      ok: (isaSummary?.foundVerses || 0) >= 1200,
    },
    psa: {
      found: (psaSummary?.foundVerses || 0) > 0,
      verses: psaSummary?.foundVerses || 0,
      ok: (psaSummary?.foundVerses || 0) >= 2400,
    },
  };

  // Integrity Score Calculation (0 - 100)
  const totalExpectedVerses = 31102;
  const verseScore = Math.min(100, Math.round((normalizedVerses.length / totalExpectedVerses) * 100));
  const bookScore = Math.round((foundBooksCount / 66) * 100);
  const deductions = duplicateCount * 0.05 + emptyCount * 0.1 + unrecognizedCount * 0.2;
  let integrityScore = Math.max(0, Math.min(100, Math.round((verseScore * 0.5 + bookScore * 0.5) - deductions)));

  if (foundBooksCount === 66 && normalizedVerses.length >= 31000 && duplicateCount === 0) {
    integrityScore = 100;
  }

  return {
    translationName,
    totalVerses: normalizedVerses.length,
    totalBooksFound: foundBooksCount,
    integrityScore,
    missingBooks,
    duplicateVersesCount: duplicateCount,
    emptyVersesCount: emptyCount,
    unrecognizedBooksCount: unrecognizedCount,
    keyBooksStatus,
    bookSummaries,
    normalizedVerses,
  };
}
