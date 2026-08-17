import React, { useState, useEffect } from 'react';
import { Book } from '../types';
import { BIBLE_OVERVIEWS } from '../data/bibleOverviewsData';
import { BOOK_DETAILED_INTROS } from '../data/bookIntrosData';
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
  Download,
  Upload,
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
    const markdownIntro = BOOK_DETAILED_INTROS[bookId];
    const localDataStr = localStorage.getItem(`${STORAGE_KEY_PREFIX}${bookId}`);

    if (localDataStr) {
      try {
        const parsed = JSON.parse(localDataStr);
        setAuthor(parsed.author || '');
        setPeriod(parsed.period || '');
        setKeyTheme(parsed.keyTheme || '');
        setKeyChapters(parsed.keyChapters || '');
        setSummary(parsed.summary || '');
        // If user actively saved custom edit in UI, use it; otherwise use real-time markdownIntro
        if (parsed.isUserCustomEdited && parsed.detailedIntro) {
          setDetailedIntro(parsed.detailedIntro);
          return;
        }
      } catch {
        // Fallback
      }
    }

    // Fallback or Live Markdown Intro
    const special = SPECIAL_DEFAULT_INTROS[bookId];
    const baseOverview = BIBLE_OVERVIEWS[bookId];

    const defaultAuthor = special?.author || baseOverview?.author || '성경 기자';
    const defaultPeriod = special?.period || 'B.C. / A.D. 기록';
    const defaultKeyTheme = special?.keyTheme || baseOverview?.keyTheme || '하나님의 구속사와 신앙';
    const defaultKeyChapters = special?.keyChapters || baseOverview?.keyChapters || '주요 본문';
    const defaultSummary = special?.summary || baseOverview?.summary || `${currentBook.name} 말씀 개요입니다.`;
    const defaultDetailed =
      markdownIntro ||
      special?.detailedIntro ||
      `[ ${currentBook.name} (${currentBook.englishName || currentBook.name}) 서론 ]`;

    setAuthor(defaultAuthor);
    setPeriod(defaultPeriod);
    setKeyTheme(defaultKeyTheme);
    setKeyChapters(defaultKeyChapters);
    setSummary(defaultSummary);
    setDetailedIntro(defaultDetailed);
  }, [isOpen, currentBook.id, currentBook.name, BOOK_DETAILED_INTROS[currentBook.id]]);

  if (!isOpen) return null;

  const handleSave = () => {
    const dataToSave = {
      bookId: currentBook.id,
      bookName: currentBook.name,
      author,
      period,
      keyTheme,
      keyChapters,
      summary,
      detailedIntro,
      isUserCustomEdited: true,
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
        BOOK_DETAILED_INTROS[bookId] ||
          special?.detailedIntro ||
          `[ ${currentBook.name} 서론 ]\n\n${baseOverview?.summary || ''}`
      );
      setIsEditing(false);
    }
  };

  // Export All Custom Intros to JSON File Backup
  const handleExportAllIntros = () => {
    const allIntros: Record<string, any> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_KEY_PREFIX)) {
        try {
          const val = localStorage.getItem(key);
          if (val) allIntros[key] = JSON.parse(val);
        } catch (e) {}
      }
    }

    const dataStr = JSON.stringify(allIntros, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `성경서론_전체백업_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import Custom Intros JSON File Backup
  const handleImportIntros = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        let count = 0;
        Object.keys(parsed).forEach((key) => {
          if (key.startsWith(STORAGE_KEY_PREFIX)) {
            localStorage.setItem(key, JSON.stringify(parsed[key]));
            count++;
          }
        });
        alert(`성공적으로 ${count}개 성경 서론 데이터가 복구되었습니다!`);
        window.location.reload();
      } catch (err) {
        alert('백업 파일 분석 중 오류가 발생했습니다. 올바른 서론 백업 JSON 파일인지 확인해 주세요.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-x-0 top-14 bottom-14 z-80 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl h-full bg-white dark:bg-zinc-900 border border-amber-500/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-zinc-900 dark:text-zinc-100">
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
            <button
              type="button"
              onClick={handleExportAllIntros}
              className="px-2.5 py-1.5 rounded-xl bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer"
              title="작성하신 성경 서론 전체를 JSON 백업 파일로 저장합니다"
            >
              <Download className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden sm:inline">서론 백업</span>
            </button>

            <label
              className="px-2.5 py-1.5 rounded-xl bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer"
              title="백업해 둔 서론 JSON 파일을 불러와 복구합니다"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-500" />
              <span className="hidden sm:inline">서론 복구</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportIntros}
                className="hidden"
              />
            </label>

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
            <div className="flex flex-col h-full space-y-3">
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-200 flex items-center justify-between shrink-0">
                <span>✏️ 서론 내용을 수정한 뒤 오른쪽 상단 <strong>[저장]</strong> 버튼을 누르세요.</span>
                <button
                  type="button"
                  onClick={handleResetToDefault}
                  className="px-2 py-1 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[11px] font-bold hover:text-red-500 flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>초기화</span>
                </button>
              </div>

              <div className="flex-1 flex flex-col min-h-0 space-y-1">
                <label className="block text-xs font-bold text-amber-600 dark:text-amber-400 shrink-0 flex items-center gap-1.5">
                  <FileText className="w-4 h-4" />
                  <span>{currentBook.name} 상세 서론 및 해설 편집</span>
                </label>
                <textarea
                  value={detailedIntro}
                  onChange={(e) => setDetailedIntro(e.target.value)}
                  className="w-full flex-1 p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/90 border border-zinc-300 dark:border-zinc-700 text-xs sm:text-sm font-serif leading-relaxed focus:ring-2 focus:ring-amber-500 focus:outline-none resize-none min-h-[380px]"
                  placeholder="서론 내용을 자유롭게 입력하세요..."
                />
              </div>
            </div>
          ) : (
            /* VIEW MODE */
            <div className="space-y-4">

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
