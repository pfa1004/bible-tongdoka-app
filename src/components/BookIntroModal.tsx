import React, { useState, useEffect } from 'react';
import { Book } from '../types';
import { BIBLE_OVERVIEWS } from '../data/bibleOverviewsData';
import {
  X,
  Edit3,
  Save,
  RotateCcw,
  BookOpen,
  Info,
  CheckCircle2,
  Sparkles,
  User,
  Calendar,
  Bookmark,
  FileText,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentBook: Book;
}

export interface DetailedBookIntro {
  bookId: string;
  bookName: string;
  author: string;
  period: string;
  keyTheme: string;
  keyChapters: string;
  summary: string;
  detailedIntro: string;
}

// Special Detailed Default Intros for Books (Psalms / 시편 is primary)
const SPECIAL_DEFAULT_INTROS: Record<string, Partial<DetailedBookIntro>> = {
  psa: {
    bookId: 'psa',
    bookName: '시편',
    author: '다윗(73편), 아삽(12편), 고라 자손(11편), 솔로몬(2편), 모세(1편: 90편), 에단, 헤만 및 무명 시인들',
    period: 'B.C. 1400경 (모세) ~ B.C. 430경 (포로 귀환 후) 약 1,000년간',
    keyTheme: '하나님께 올리는 찬양과 경배, 고난 중의 탄원과 회개, 메시아 예언, 여호와의 신실하심',
    keyChapters: '1편(복 있는 사람), 23편(여호와는 나의 목자), 51편(다윗의 회개시), 100편(감사시), 119편(성경 최고의 긴 율법시), 150편(대할렐 찬양)',
    summary: '하나님을 향한 찬양, 감사, 탄원, 회개, 메시아 예언과 인생의 깊은 신앙 고백을 담은 150편의 시집입니다.',
    detailedIntro: `[ 시편 (Psalms) 명칭과 역사적 배경 ]
시편의 히브리어 제목은 '텔림(Tehillim)'으로 "찬양들"이라는 뜻이며, 칠십인역(LXX)에서는 현악기에 맞춰 부르는 노래를 뜻하는 '살모이(Psalmoi)'로 번역되었습니다.

[ 시편의 5권 구조 (모세오경과의 대응) ]
시편 150편은 유대 전통에 따라 모세오경의 구조를 반영하여 5권으로 나뉩니다:
• 제1권 (1 ~ 41편): 다윗의 시 중심 - 창세기적 특징 (인간의 창조와 구원)
• 제2권 (42 ~ 72편): 고라 자손과 다윗의 시 - 출애굽기적 특징 (구속과 구원)
• 제3권 (73 ~ 89편): 아삽의 시 중심 - 레위기적 특징 (성소와 예배)
• 제4권 (90 ~ 106편): 모세와 무명 시인 - 민수기적 특징 (광야 여정과 안식)
• 제5권 (107 ~ 150편): 포로 귀환시 및 찬양시 - 신명기적 특징 (하나님의 말씀과 찬양)

[ 시편의 주요 분류 ]
1. 찬양시: 하나님의 위엄과 창조, 구원의 은혜를 높여 찬양 (예: 8편, 19편, 103편, 150편)
2. 탄원시(애가): 개인이나 공동체가 고난과 원수의 압제 속에서 하나님께 부르짖음 (예: 3편, 22편, 130편)
3. 감사시: 기도 응답과 구원의 은혜에 감사 (예: 30편, 116편)
4. 제왕시 & 메시아시: 하나님이 세우신 왕과 오실 메시아를 예언 (예: 2편, 22편, 72편, 110편)
5. 지혜시: 복 있는 자와 악인의 길을 대조하며 여호와를 경외함 (예: 1편, 37편, 73편, 112편)
6. 회개시: 죄를 뉘우치며 용서를 구함 (예: 6편, 32편, 38편, 51편)

[ 묵상과 신앙적 교훈 ]
시편은 성경의 거울이라 불립니다. 기쁠 때나 슬플 때, 억울할 때나 소망이 없을 때, 성도가 하나님 앞에 마음을 있는 그대로 토해놓는 기도의 교과서입니다. 시편 1편의 말씀처럼 복 있는 사람은 여호와의 율법을 즐거워하여 주야로 묵상하는 자입니다.`,
  },
};

const STORAGE_KEY_PREFIX = 'bible_book_custom_intros_v1_';

export const BookIntroModal: React.FC<Props> = ({ isOpen, onClose, currentBook }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showSavedToast, setShowSavedToast] = useState(false);

  // Form State for Editing
  const [author, setAuthor] = useState('');
  const [period, setPeriod] = useState('');
  const [keyTheme, setKeyTheme] = useState('');
  const [keyChapters, setKeyChapters] = useState('');
  const [summary, setSummary] = useState('');
  const [detailedIntro, setDetailedIntro] = useState('');

  // Load Intro Data (from localStorage or defaults)
  useEffect(() => {
    if (!isOpen) return;

    setIsEditing(false);
    const bookId = currentBook.id;
    const localDataStr = localStorage.getItem(`${STORAGE_KEY_PREFIX}${bookId}`);

    if (localDataStr) {
      try {
        const parsed: DetailedBookIntro = JSON.parse(localDataStr);
        setAuthor(parsed.author || '');
        setPeriod(parsed.period || '');
        setKeyTheme(parsed.keyTheme || '');
        setKeyChapters(parsed.keyChapters || '');
        setSummary(parsed.summary || '');
        setDetailedIntro(parsed.detailedIntro || '');
        return;
      } catch {
        // Fallback to default
      }
    }

    // Fallback to Special Intros or General Overview
    const special = SPECIAL_DEFAULT_INTROS[bookId];
    const baseOverview = BIBLE_OVERVIEWS[bookId];

    const defaultAuthor = special?.author || baseOverview?.author || '성경 기자';
    const defaultPeriod = special?.period || 'B.C. / A.D. 기록';
    const defaultKeyTheme = special?.keyTheme || baseOverview?.keyTheme || '하나님의 구속사와 신앙';
    const defaultKeyChapters = special?.keyChapters || baseOverview?.keyChapters || '주요 본문';
    const defaultSummary = special?.summary || baseOverview?.summary || `${currentBook.name} 말씀 개요입니다.`;
    const defaultDetailed =
      special?.detailedIntro ||
      `[ ${currentBook.name} (${currentBook.englishName || currentBook.name}) 서론 ]\n\n${
        baseOverview?.summary || ''
      }\n\n• 저자: ${baseOverview?.author || '미상'}\n• 핵심 주제: ${
        baseOverview?.keyTheme || '하나님 경배와 구원'
      }\n• 주요 장: ${baseOverview?.keyChapters || '1장'}\n\n[ 본문 묵상 가이드 ]\n${currentBook.name} 말씀을 통해 주시는 하나님의 마음과 교훈을 묵상해 보세요. 상단 '편집' 버튼을 눌러 나만의 서론이나 묵상 노트를 직접 작성하고 저장하실 수 있습니다.`;

    setAuthor(defaultAuthor);
    setPeriod(defaultPeriod);
    setKeyTheme(defaultKeyTheme);
    setKeyChapters(defaultKeyChapters);
    setSummary(defaultSummary);
    setDetailedIntro(defaultDetailed);
  }, [isOpen, currentBook.id, currentBook.name]);

  if (!isOpen) return null;

  const handleSave = () => {
    const dataToSave: DetailedBookIntro = {
      bookId: currentBook.id,
      bookName: currentBook.name,
      author,
      period,
      keyTheme,
      keyChapters,
      summary,
      detailedIntro,
    };

    localStorage.setItem(`${STORAGE_KEY_PREFIX}${currentBook.id}`, JSON.stringify(dataToSave));
    setIsEditing(false);
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 2500);
  };

  const handleResetToDefault = () => {
    if (confirm(`${currentBook.name} 서론을 초기 기본 내용으로 원복하시겠습니까?`)) {
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}${currentBook.id}`);
      const bookId = currentBook.id;
      const special = SPECIAL_DEFAULT_INTROS[bookId];
      const baseOverview = BIBLE_OVERVIEWS[bookId];

      setAuthor(special?.author || baseOverview?.author || '성경 기자');
      setPeriod(special?.period || 'B.C. / A.D. 기록');
      setKeyTheme(special?.keyTheme || baseOverview?.keyTheme || '하나님의 구속사와 신앙');
      setKeyChapters(special?.keyChapters || baseOverview?.keyChapters || '주요 본문');
      setSummary(special?.summary || baseOverview?.summary || `${currentBook.name} 말씀 개요입니다.`);
      setDetailedIntro(
        special?.detailedIntro ||
          `[ ${currentBook.name} 서론 ]\n\n${baseOverview?.summary || ''}`
      );
      setIsEditing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-white dark:bg-zinc-900 border border-amber-500/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-zinc-900 dark:text-zinc-100">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 bg-amber-500/10 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-amber-500 text-zinc-950 font-black shadow-md">
              <BookOpen className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold flex items-center gap-2">
                <span>{currentBook.name} 서론</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-mono">
                  {currentBook.testament === 'OT' ? '구약' : '신약'} {currentBook.chapterCount}장
                </span>
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {isEditing ? '서론 내용을 수정 후 저장해 보세요.' : '성경 개요, 역사적 배경 및 주요 주제'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isEditing ? (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>서론 편집</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSave}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>저장</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content View or Edit Form */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Saved Toast Banner */}
          {showSavedToast && (
            <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{currentBook.name} 서론 내용이 성공적으로 저장되었습니다!</span>
            </div>
          )}

          {isEditing ? (
            /* EDIT MODE */
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-200 flex items-center justify-between">
                <span>✏️ 내용을 수정한 뒤 오른쪽 상단 <strong>[저장]</strong> 버튼을 누르세요.</span>
                <button
                  type="button"
                  onClick={handleResetToDefault}
                  className="px-2 py-1 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[11px] font-bold hover:text-red-500 flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>초기화</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-1">
                    저자 (Author)
                  </label>
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-xs font-medium focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-1">
                    기록 시기 (Period)
                  </label>
                  <input
                    type="text"
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-xs font-medium focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-1">
                  핵심 주제 (Key Theme)
                </label>
                <input
                  type="text"
                  value={keyTheme}
                  onChange={(e) => setKeyTheme(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-xs font-medium focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-1">
                  주요 장/본문 (Key Chapters)
                </label>
                <input
                  type="text"
                  value={keyChapters}
                  onChange={(e) => setKeyChapters(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-xs font-medium focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-1">
                  한 줄 요약 (Summary)
                </label>
                <input
                  type="text"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-xs font-medium focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 mb-1">
                  상세 서론 및 묵상 가이드 (Detailed Preface)
                </label>
                <textarea
                  value={detailedIntro}
                  onChange={(e) => setDetailedIntro(e.target.value)}
                  rows={12}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-xs sm:text-sm font-serif leading-relaxed focus:ring-2 focus:ring-amber-500"
                  placeholder="서론 내용을 자유롭게 입력하세요..."
                />
              </div>
            </div>
          ) : (
            /* VIEW MODE */
            <div className="space-y-4">
              {/* Key Overview Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-amber-500/5 dark:bg-zinc-800/60 border border-amber-500/20 space-y-1">
                  <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <User className="w-3.5 h-3.5" />
                    <span>저자</span>
                  </span>
                  <p className="text-xs sm:text-sm font-bold text-zinc-800 dark:text-zinc-200">{author}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-500/5 dark:bg-zinc-800/60 border border-amber-500/20 space-y-1">
                  <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>기록 시기</span>
                  </span>
                  <p className="text-xs sm:text-sm font-bold text-zinc-800 dark:text-zinc-200">{period}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-500/5 dark:bg-zinc-800/60 border border-amber-500/20 space-y-1">
                  <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>핵심 주제</span>
                  </span>
                  <p className="text-xs sm:text-sm font-bold text-zinc-800 dark:text-zinc-200">{keyTheme}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-500/5 dark:bg-zinc-800/60 border border-amber-500/20 space-y-1">
                  <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>주요 장</span>
                  </span>
                  <p className="text-xs sm:text-sm font-bold text-zinc-800 dark:text-zinc-200">{keyChapters}</p>
                </div>
              </div>

              {/* Summary Banner */}
              {summary && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs sm:text-sm font-bold leading-snug flex items-start gap-2">
                  <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>{summary}</span>
                </div>
              )}

              {/* Detailed Intro Text */}
              <div className="p-4 sm:p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-950/80 border border-zinc-200 dark:border-zinc-800 space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-zinc-800">
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                    <FileText className="w-4 h-4" />
                    <span>{currentBook.name} 상세 서론 및 해설</span>
                  </span>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-[11px] font-bold text-zinc-500 hover:text-amber-600 flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>수정하기</span>
                  </button>
                </div>

                <div className="whitespace-pre-line text-xs sm:text-sm font-serif leading-relaxed text-zinc-800 dark:text-zinc-200 pt-1">
                  {detailedIntro}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 shrink-0">
          <span>💡 서론 편집 기능으로 나만의 성경 연구 노트와 묵상을 기록해보세요.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold transition-all cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
