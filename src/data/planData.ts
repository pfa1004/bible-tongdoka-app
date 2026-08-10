import { PlanDay } from '../types';
import { BIBLE_BOOKS } from './bibleData';

interface FlatChapter {
  bookId: string;
  bookName: string;
  chapter: number;
}

function generate365Plan(): PlanDay[] {
  // Flatten all 1189 chapters across 66 books
  const allChapters: FlatChapter[] = [];
  for (const book of BIBLE_BOOKS) {
    for (let c = 1; c <= book.chapterCount; c++) {
      allChapters.push({
        bookId: book.id,
        bookName: book.name,
        chapter: c,
      });
    }
  }

  // Curated titles for specific key days
  const customTitles: Record<number, string> = {
    1: '창조와 인간의 타락',
    2: '가인과 아벨, 노아의 방주',
    3: '홍수 심판과 바벨탑',
    4: '아브라함의 부르심과 약속',
    5: '소돔과 고모라, 이삭의 출생',
    6: '아브라함의 시험과 야곱',
    7: '이삭의 결혼과 축복',
    8: '야곱의 벧엘 꿈과 라반의 집',
    9: '얍복강 씨름과 요셉의 꿈',
    10: '요셉의 애굽 팔림과 형통',
    11: '애굽 총리 요셉과 형들의 재회',
    12: '야곱의 애굽 이주와 축복',
    13: '이스라엘의 고통과 모세의 부르심',
    14: '열 가지 재앙과 유월절',
    15: '홍해의 기적과 광야',
    16: '만나와 메추라기, 시내산 도착',
    17: '십계명과 언약의 법전',
    18: '성막의 식양과 제사장 의복',
    19: '금송아지 사건과 성막 완성',
    365: '새 하늘과 새 땅, 계시록 완성',
  };

  const totalChapters = allChapters.length; // 1189
  const plan: PlanDay[] = [];

  for (let day = 1; day <= 365; day++) {
    const startIndex = Math.floor(((day - 1) * totalChapters) / 365);
    const endIndex = Math.floor((day * totalChapters) / 365);
    const dayChapters = allChapters.slice(startIndex, endIndex);

    // Group chapters by book into passage ranges
    const passages: { bookId: string; bookName: string; startChapter: number; endChapter: number }[] = [];
    let currentPassage: { bookId: string; bookName: string; startChapter: number; endChapter: number } | null = null;

    for (const ch of dayChapters) {
      if (!currentPassage || currentPassage.bookId !== ch.bookId) {
        if (currentPassage) passages.push(currentPassage);
        currentPassage = {
          bookId: ch.bookId,
          bookName: ch.bookName,
          startChapter: ch.chapter,
          endChapter: ch.chapter,
        };
      } else {
        currentPassage.endChapter = ch.chapter;
      }
    }
    if (currentPassage) passages.push(currentPassage);

    // Build passage description string
    const passageText = passages
      .map((p) => (p.startChapter === p.endChapter ? `${p.bookName} ${p.startChapter}장` : `${p.bookName} ${p.startChapter}~${p.endChapter}장`))
      .join(', ');

    const title = customTitles[day] || passageText;

    plan.push({
      day,
      title,
      passages,
      chapterCount: dayChapters.length,
      isCompleted: false,
    });
  }

  return plan;
}

export const SEQUENTIAL_PLAN_DAYS: PlanDay[] = generate365Plan();

interface ChronoSegment {
  bookId: string;
  bookName: string;
  startChapter: number;
  endChapter: number;
}

const CHRONO_SEGMENTS: ChronoSegment[] = [
  // 1. 모세오경 ~ 통일왕국 / 분열왕국 초기
  { bookId: 'gen', bookName: '창세기', startChapter: 1, endChapter: 50 },
  { bookId: 'exo', bookName: '출애굽기', startChapter: 1, endChapter: 40 },
  { bookId: 'lev', bookName: '레위기', startChapter: 1, endChapter: 27 },
  { bookId: 'num', bookName: '민수기', startChapter: 1, endChapter: 36 },
  { bookId: 'deu', bookName: '신명기', startChapter: 1, endChapter: 34 },
  { bookId: 'jos', bookName: '여호수아', startChapter: 1, endChapter: 24 },
  { bookId: 'jdg', bookName: '사사기', startChapter: 1, endChapter: 21 },
  { bookId: 'rut', bookName: '룻기', startChapter: 1, endChapter: 4 },
  { bookId: '1sa', bookName: '사무엘상', startChapter: 1, endChapter: 31 },
  { bookId: '2sa', bookName: '사무엘하', startChapter: 1, endChapter: 24 },
  { bookId: '1ki', bookName: '열왕기상', startChapter: 1, endChapter: 22 },

  // 2~3. 열왕기하 & 요엘
  { bookId: '2ki', bookName: '열왕기하', startChapter: 1, endChapter: 11 },
  { bookId: 'jol', bookName: '요엘', startChapter: 1, endChapter: 3 },
  { bookId: '2ki', bookName: '열왕기하', startChapter: 12, endChapter: 13 },

  // 4~6. 요나, 아모스, 호세아, 미가, 이사야
  { bookId: 'jon', bookName: '요나', startChapter: 1, endChapter: 4 },
  { bookId: '2ki', bookName: '열왕기하', startChapter: 14, endChapter: 14 },
  { bookId: 'amo', bookName: '아모스', startChapter: 1, endChapter: 9 },
  { bookId: 'hos', bookName: '호세아', startChapter: 1, endChapter: 14 },
  { bookId: '2ki', bookName: '열왕기하', startChapter: 15, endChapter: 16 },
  { bookId: 'mic', bookName: '미가', startChapter: 1, endChapter: 7 },
  { bookId: 'isa', bookName: '이사야', startChapter: 1, endChapter: 66 },
  { bookId: '2ki', bookName: '열왕기하', startChapter: 17, endChapter: 20 },

  // 7~13. 나훔, 스바냐, 하박국, 멸망/포로기 (예레미야, 에스겔, 애가, 오바댜)
  { bookId: 'nam', bookName: '나훔', startChapter: 1, endChapter: 3 },
  { bookId: '2ki', bookName: '열왕기하', startChapter: 21, endChapter: 21 },
  { bookId: 'zep', bookName: '스바냐', startChapter: 1, endChapter: 3 },
  { bookId: '2ki', bookName: '열왕기하', startChapter: 22, endChapter: 23 },
  { bookId: 'hab', bookName: '하박국', startChapter: 1, endChapter: 3 },
  { bookId: '2ki', bookName: '열왕기하', startChapter: 24, endChapter: 25 },
  { bookId: 'jer', bookName: '예레미야', startChapter: 1, endChapter: 52 },
  { bookId: 'ezk', bookName: '에스겔', startChapter: 1, endChapter: 48 },
  { bookId: 'lam', bookName: '예레미야애가', startChapter: 1, endChapter: 5 },
  { bookId: 'oba', bookName: '오바댜', startChapter: 1, endChapter: 1 },

  // 14~22. 다니엘 1~6, 귀환 역사 (에스라, 학개, 스가랴, 에스더, 느헤미야, 말라기)
  { bookId: 'dan', bookName: '다니엘', startChapter: 1, endChapter: 6 },
  { bookId: 'ezr', bookName: '에스라', startChapter: 1, endChapter: 4 },
  { bookId: 'hag', bookName: '학개', startChapter: 1, endChapter: 2 },
  { bookId: 'zec', bookName: '스가랴', startChapter: 1, endChapter: 14 },
  { bookId: 'ezr', bookName: '에스라', startChapter: 5, endChapter: 6 },
  { bookId: 'est', bookName: '에스더', startChapter: 1, endChapter: 10 },
  { bookId: 'ezr', bookName: '에스라', startChapter: 7, endChapter: 10 },
  { bookId: 'neh', bookName: '느헤미야', startChapter: 1, endChapter: 13 },
  { bookId: 'mal', bookName: '말라기', startChapter: 1, endChapter: 4 },

  // 23. 역대기 & 지혜서 (욥기, 시편, 잠언, 전도서, 아가)
  { bookId: '1ch', bookName: '역대상', startChapter: 1, endChapter: 29 },
  { bookId: '2ch', bookName: '역대하', startChapter: 1, endChapter: 36 },
  { bookId: 'job', bookName: '욥기', startChapter: 1, endChapter: 42 },
  { bookId: 'psa', bookName: '시편', startChapter: 1, endChapter: 150 },
  { bookId: 'pro', bookName: '잠언', startChapter: 1, endChapter: 31 },
  { bookId: 'ecc', bookName: '전도서', startChapter: 1, endChapter: 12 },
  { bookId: 'sng', bookName: '아가', startChapter: 1, endChapter: 8 },

  // 24. 다니엘 7~12장 (신구약 중간사)
  { bookId: 'dan', bookName: '다니엘', startChapter: 7, endChapter: 12 },

  // 25. 신약 복음서
  { bookId: 'mat', bookName: '마태복음', startChapter: 1, endChapter: 28 },
  { bookId: 'mrk', bookName: '마가복음', startChapter: 1, endChapter: 16 },
  { bookId: 'luk', bookName: '누가복음', startChapter: 1, endChapter: 24 },
  { bookId: 'jhn', bookName: '요한복음', startChapter: 1, endChapter: 21 },

  // 26~43. 사도행전 & 서신서 연대순
  { bookId: 'act', bookName: '사도행전', startChapter: 1, endChapter: 15 },
  { bookId: 'gal', bookName: '갈라디아서', startChapter: 1, endChapter: 6 },
  { bookId: 'act', bookName: '사도행전', startChapter: 16, endChapter: 18 },
  { bookId: '1th', bookName: '데살로니가전서', startChapter: 1, endChapter: 5 },
  { bookId: '2th', bookName: '데살로니가후서', startChapter: 1, endChapter: 3 },
  { bookId: 'act', bookName: '사도행전', startChapter: 19, endChapter: 19 },
  { bookId: '1co', bookName: '고린도전서', startChapter: 1, endChapter: 16 },
  { bookId: '2co', bookName: '고린도후서', startChapter: 1, endChapter: 13 },
  { bookId: 'act', bookName: '사도행전', startChapter: 20, endChapter: 20 },
  { bookId: 'rom', bookName: '로마서', startChapter: 1, endChapter: 16 },
  { bookId: 'act', bookName: '사도행전', startChapter: 21, endChapter: 28 },
  { bookId: 'eph', bookName: '에베소서', startChapter: 1, endChapter: 6 },
  { bookId: 'col', bookName: '골로새서', startChapter: 1, endChapter: 4 },
  { bookId: 'phm', bookName: '빌레몬서', startChapter: 1, endChapter: 1 },
  { bookId: 'php', bookName: '빌립보서', startChapter: 1, endChapter: 4 },
  { bookId: '1ti', bookName: '디모데전서', startChapter: 1, endChapter: 6 },
  { bookId: 'tit', bookName: '디도서', startChapter: 1, endChapter: 3 },
  { bookId: '2ti', bookName: '디모데후서', startChapter: 1, endChapter: 4 },
  { bookId: 'jas', bookName: '야고보서', startChapter: 1, endChapter: 5 },
  { bookId: 'heb', bookName: '히브리서', startChapter: 1, endChapter: 13 },
  { bookId: '1pe', bookName: '베드로전서', startChapter: 1, endChapter: 5 },
  { bookId: '2pe', bookName: '베드로후서', startChapter: 1, endChapter: 3 },
  { bookId: 'jud', bookName: '유다서', startChapter: 1, endChapter: 1 },
  { bookId: '1jn', bookName: '요한1서', startChapter: 1, endChapter: 5 },
  { bookId: '2jn', bookName: '요한2서', startChapter: 1, endChapter: 1 },
  { bookId: '3jn', bookName: '요한3서', startChapter: 1, endChapter: 1 },
  { bookId: 'rev', bookName: '요한계시록', startChapter: 1, endChapter: 22 },
];

function generateChronological365Plan(): PlanDay[] {
  const allChronoChapters: FlatChapter[] = [];
  for (const seg of CHRONO_SEGMENTS) {
    for (let c = seg.startChapter; c <= seg.endChapter; c++) {
      allChronoChapters.push({
        bookId: seg.bookId,
        bookName: seg.bookName,
        chapter: c,
      });
    }
  }

  const totalChapters = allChronoChapters.length; // 1189
  const plan: PlanDay[] = [];

  for (let day = 1; day <= 365; day++) {
    const startIndex = Math.floor(((day - 1) * totalChapters) / 365);
    const endIndex = Math.floor((day * totalChapters) / 365);
    const dayChapters = allChronoChapters.slice(startIndex, endIndex);

    const passages: { bookId: string; bookName: string; startChapter: number; endChapter: number }[] = [];
    let currentPassage: { bookId: string; bookName: string; startChapter: number; endChapter: number } | null = null;

    for (const ch of dayChapters) {
      if (!currentPassage || currentPassage.bookId !== ch.bookId) {
        if (currentPassage) passages.push(currentPassage);
        currentPassage = {
          bookId: ch.bookId,
          bookName: ch.bookName,
          startChapter: ch.chapter,
          endChapter: ch.chapter,
        };
      } else {
        currentPassage.endChapter = ch.chapter;
      }
    }
    if (currentPassage) passages.push(currentPassage);

    const passageText = passages
      .map((p) => (p.startChapter === p.endChapter ? `${p.bookName} ${p.startChapter}장` : `${p.bookName} ${p.startChapter}~${p.endChapter}장`))
      .join(', ');

    plan.push({
      day,
      title: passageText,
      passages,
      chapterCount: dayChapters.length,
      isCompleted: false,
    });
  }

  return plan;
}

export const CHRONOLOGICAL_PLAN_DAYS: PlanDay[] = generateChronological365Plan();

function generateRandom365Plan(): PlanDay[] {
  // 1. 구약 트랙 (시편 제외: 창세기 ~ 욥기, 잠언 ~ 말라기)
  const otChapters: FlatChapter[] = [];
  for (const book of BIBLE_BOOKS) {
    if (book.testament === 'OT' && book.id !== 'psa') {
      for (let c = 1; c <= book.chapterCount; c++) {
        otChapters.push({ bookId: book.id, bookName: book.name, chapter: c });
      }
    }
  }

  // 2. 시편 트랙 (시편 1~150장)
  const psaChapters: FlatChapter[] = [];
  const psaBook = BIBLE_BOOKS.find((b) => b.id === 'psa');
  if (psaBook) {
    for (let c = 1; c <= psaBook.chapterCount; c++) {
      psaChapters.push({ bookId: psaBook.id, bookName: psaBook.name, chapter: c });
    }
  }

  // 3. 신약 트랙 (마태복음 ~ 요한계시록)
  const ntChapters: FlatChapter[] = [];
  for (const book of BIBLE_BOOKS) {
    if (book.testament === 'NT') {
      for (let c = 1; c <= book.chapterCount; c++) {
        ntChapters.push({ bookId: book.id, bookName: book.name, chapter: c });
      }
    }
  }

  const plan: PlanDay[] = [];

  for (let day = 1; day <= 365; day++) {
    // 구약 (시편 제외) 약 677장에서 365일 배분 (하루 1~2장)
    const otStart = Math.floor(((day - 1) * otChapters.length) / 365);
    const otEnd = Math.floor((day * otChapters.length) / 365);
    const otSel = otChapters.slice(otStart, otEnd);

    // 시편 150장 순환 (하루 1장)
    const psaCh = psaChapters[(day - 1) % psaChapters.length];

    // 신약 260장에서 365일 배분 (하루 1장씩 순환)
    const ntStart = Math.floor(((day - 1) * ntChapters.length) / 365);
    const ntEnd = Math.max(ntStart + 1, Math.floor((day * ntChapters.length) / 365));
    const ntSel = ntChapters.slice(ntStart, ntEnd);

    const dayChapters = [...otSel, psaCh, ...ntSel].filter(Boolean);

    // 연속된 동일 책의 장들은 하나의 구절 범위로 묶기
    const passages: { bookId: string; bookName: string; startChapter: number; endChapter: number }[] = [];
    for (const ch of dayChapters) {
      const last = passages[passages.length - 1];
      if (last && last.bookId === ch.bookId && last.endChapter + 1 === ch.chapter) {
        last.endChapter = ch.chapter;
      } else {
        passages.push({
          bookId: ch.bookId,
          bookName: ch.bookName,
          startChapter: ch.chapter,
          endChapter: ch.chapter,
        });
      }
    }

    const passageText = passages
      .map((p) => (p.startChapter === p.endChapter ? `${p.bookName} ${p.startChapter}장` : `${p.bookName} ${p.startChapter}~${p.endChapter}장`))
      .join(' + ');

    plan.push({
      day,
      title: passageText,
      passages,
      chapterCount: dayChapters.length,
      isCompleted: false,
    });
  }

  return plan;
}

export const RANDOM_PLAN_DAYS: PlanDay[] = generateRandom365Plan();

export function getPlanDay(dayNumber: number, mode: 'sequential' | 'free' | 'random' = 'sequential'): PlanDay {
  const list = mode === 'random' ? RANDOM_PLAN_DAYS : mode === 'free' ? CHRONOLOGICAL_PLAN_DAYS : SEQUENTIAL_PLAN_DAYS;
  const day = list.find((d) => d.day === dayNumber);
  if (day) return day;
  return list[0];
}
