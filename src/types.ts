export type TranslationId = 'KRV' | 'KJV' | 'HKJV' | string;

export interface Translation {
  id: TranslationId;
  name: string;
  shortName: string;
  description: string;
}

export interface Verse {
  number: number;
  text: Record<TranslationId, string>;
  strongs?: Array<{
    word: string;
    code: string; // e.g., H7217, G26
  }>;
  dictionaryTerms?: Array<{
    term: string;
    dictionaryId: string;
  }>;
}

export interface Chapter {
  number: number;
  verses: Verse[];
}

export interface Book {
  id: string;
  name: string; // Korean
  shortName?: string;
  englishName: string;
  testament: 'OT' | 'NT';
  category: string; // e.g. 모세오경, 역사서, 시가서, 대선지서, 소선지서, 복음서, 서신서, 예언서
  chapterCount: number;
}

export interface PlanDay {
  day: number;
  title: string;
  passages: Array<{
    bookId: string;
    bookName: string;
    startChapter: number;
    endChapter: number;
  }>;
  chapterCount: number;
  isCompleted: boolean;
  completedAt?: string;
}

export interface PlanSettings {
  mode: 'sequential' | 'free' | 'random'; // 순서읽기 플랜 vs 자유진행(연대기) 모드 vs 랜덤읽기 모드
  dailyGoalChapters: number;
  notificationEnabled: boolean;
  notificationTime: string; // e.g., "08:00"
  streakCount: number;
  lastReadDate?: string;
  completedDays: number[]; // Day numbers completed
}

export interface DictionaryEntry {
  id: string;
  term: string;
  hanja?: string;
  category: '지명' | '인물' | '용어' | '동식물' | '관습';
  summary: string;
  definition: string;
  imageUrl?: string;
  imageCaption?: string;
  strongCode?: string;
  relatedVerses: Array<{
    bookName: string;
    chapter: number;
    verse: number;
  }>;
}

export interface StrongsEntry {
  code: string; // H1234 or G1234
  language: 'Hebrew' | 'Greek';
  originalWord: string;
  transliteration: string;
  pronunciation: string;
  partOfSpeech: string;
  definition: string;
  usageCount: number;
  kjvTranslation: string;
}

export interface MapWaypoint {
  id: string;
  step: number;
  name: string;
  modernName?: string;
  x: number; // Percentage on SVG 0-100
  y: number; // Percentage on SVG 0-100
  title: string;
  description: string;
  scripture: string;
  imageUrl?: string;
}

export interface HistoricalMap {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  category: '구약' | '신약';
  mapImageUrl?: string;
  waypoints: MapWaypoint[];
}

export interface Hymn {
  id: string;
  number: number;
  type: 'new' | 'gospel'; // 새찬송가 vs 가스펠
  title: string;
  category: string;
  key: string;
  verses: string[];
  chorus?: string;
  scriptureRef?: string;
  artist?: string; // 찬양사역자/팀 (예: 손경민, 마커스워십)
  youtubeUrl?: string; // 유튜브 주소 (예: https://www.youtube.com/watch?v=...)
  isCustom?: boolean; // 사용자 직접 등록 곡 여부
}

export interface VerseCardConfig {
  verseText: string;
  scriptureRef: string;
  theme: 'spring' | 'summer' | 'autumn' | 'winter' | 'comfort' | 'gratitude' | 'peace' | 'hope' | 'nature';
  fontFamily: string;
  fontSize: number;
  textAlign: 'left' | 'center' | 'right';
  textColor: string;
  backgroundColor: string;
  backgroundImageStyle: string;
  overlayOpacity: number;
  showSignature: boolean;
  signatureText: string;
  cardSize?: '1800x700' | '1800x2000' | '1800x4000';
  textPositionX?: number; // 0~1 비율 (0=좌, 0.5=중앙, 1=우)
  textPositionY?: number; // 0~1 비율 (0=상, 0.5=중앙, 1=하)
}

export interface UserHighlight {
  id: string;
  bookId: string;
  chapter: number;
  verseNumber: number;
  color: 'yellow' | 'green' | 'blue' | 'pink' | 'purple';
  createdAt: string;
  note?: string;
}

export interface UserBookmark {
  id: string;
  bookId: string;
  bookName: string;
  chapter: number;
  verseNumber: number;
  createdAt: string;
}

export interface PrayerNote {
  id: string;
  title: string;
  content: string;
  category: '개인' | '가족' | '교회' | '이웃' | '선교';
  isAnswered: boolean;
  answeredAt?: string;
  createdAt: string;
  updatedAt: string;
  scriptureRef?: string;
}

export interface ReaderSettings {
  theme: 'light' | 'dark' | 'sepia' | 'eink';
  fontSize: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  lineHeight: 'tight' | 'normal' | 'relaxed' | 'loose';
  letterSpacing: 'tight' | 'normal' | 'wide';
  fontFamily: 'sans' | 'serif' | 'handwriting';
  showVerseNumbers: boolean;
  paragraphMode: boolean;
  copyFormat: 'verse_break' | 'continuous' | 'with_ref';
}

export interface AudioPlayerState {
  isPlaying: boolean;
  bookId: string;
  chapter: number;
  currentVerseIndex: number;
  speed: number; // 0.8, 1.0, 1.25, 1.5, 1.75, 2.0
  voiceURI?: string;
  pitch?: number; // 0.6 ~ 1.4 (낮은 톤 / 남성 톤 조절)
  sleepTimerMinutes: number; // 0 = off, 15, 30, 60
  autoNextChapter: boolean;
  highlightFollowsVerse: boolean;
}

export interface StudyResourceLink {
  id: string;
  title: string;
  category: '성서공회' | '원어/사전' | '지리/지도' | '통독/주석' | '오디오/미디어' | '전도/사영리' | string;
  description: string;
  url: string;
  badge: string;
}
