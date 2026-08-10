import React, { useState, useRef, useEffect } from 'react';
import { UserHighlight, UserBookmark, PrayerNote } from '../types';
import { BIBLE_BOOKS, getChapterVerses } from '../data/bibleData';
import {
  FileText,
  Bookmark,
  Highlighter,
  Heart,
  Plus,
  CheckCircle2,
  Trash2,
  Download,
  Upload,
  HardDrive,
  Sparkles,
  Mic,
  MicOff,
  Radio,
  RotateCcw,
  X,
  ChevronDown,
  ChevronUp,
  BookOpen,
  ExternalLink,
} from 'lucide-react';

interface Props {
  highlights: UserHighlight[];
  bookmarks: UserBookmark[];
  prayers: PrayerNote[];
  onAddPrayer: (note: Omit<PrayerNote, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onTogglePrayerAnswered: (id: string) => void;
  onDeletePrayer: (id: string) => void;
  onDeleteHighlight: (id: string) => void;
  onDeleteBookmark: (id: string) => void;
  onSelectVerse: (bookId: string, chapter: number, verseNum: number) => void;
  onClose?: () => void;
}

export const MemoTab: React.FC<Props> = ({
  highlights,
  bookmarks,
  prayers,
  onAddPrayer,
  onTogglePrayerAnswered,
  onDeletePrayer,
  onDeleteHighlight,
  onDeleteBookmark,
  onSelectVerse,
  onClose,
}) => {
  const [subTab, setSubTab] = useState<'prayers' | 'highlights' | 'bookmarks'>('prayers');
  const [showAddPrayerModal, setShowAddPrayerModal] = useState(false);

  // New prayer form
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<PrayerNote['category']>('개인');

  // Voice recognition states
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [voiceTitle, setVoiceTitle] = useState('');
  const [voiceContent, setVoiceContent] = useState('');
  const [voiceCategory, setVoiceCategory] = useState<PrayerNote['category']>('개인');
  const [formMicField, setFormMicField] = useState<'title' | 'content' | null>(null);

  const recognitionRef = useRef<any>(null);

  // Expanded cards state for highlights and bookmarks
  const [expandedHighlightIds, setExpandedHighlightIds] = useState<string[]>(() =>
    highlights.map((h) => h.id)
  );
  const [expandedBookmarkIds, setExpandedBookmarkIds] = useState<string[]>(() =>
    bookmarks.map((b) => b.id)
  );

  // Sync expanded IDs when highlights/bookmarks lists update
  useEffect(() => {
    setExpandedHighlightIds((prev) => {
      const newIds = highlights.map((h) => h.id);
      const combined = Array.from(new Set([...prev, ...newIds]));
      return combined;
    });
  }, [highlights]);

  useEffect(() => {
    setExpandedBookmarkIds((prev) => {
      const newIds = bookmarks.map((b) => b.id);
      const combined = Array.from(new Set([...prev, ...newIds]));
      return combined;
    });
  }, [bookmarks]);

  // Helper to fetch verse text dynamically
  const getVerseTextHelper = (bookId: string, chapter: number, verseNum: number): string => {
    try {
      const verses = getChapterVerses(bookId, chapter);
      const found = verses.find((v) => v.number === verseNum);
      if (found && found.text) {
        return (
          found.text['KRV'] ||
          found.text['NKRV'] ||
          found.text['HKJV'] ||
          Object.values(found.text)[0] ||
          ''
        );
      }
    } catch (e) {
      console.error('Failed to get verse text', e);
    }
    return '';
  };

  const getBookNameHelper = (bookId: string): string => {
    const b = BIBLE_BOOKS.find((book) => book.id.toLowerCase() === bookId.toLowerCase());
    return b ? b.name : bookId;
  };

  const getColorStyles = (color: string) => {
    switch (color) {
      case 'yellow':
        return {
          label: '노랑',
          bg: 'bg-amber-100/90 dark:bg-amber-950/40',
          border: 'border-amber-300 dark:border-amber-700/60',
          text: 'text-amber-950 dark:text-amber-100',
          badge: 'bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-400/30',
        };
      case 'green':
        return {
          label: '초록',
          bg: 'bg-emerald-100/90 dark:bg-emerald-950/40',
          border: 'border-emerald-300 dark:border-emerald-700/60',
          text: 'text-emerald-950 dark:text-emerald-100',
          badge: 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-400/30',
        };
      case 'blue':
        return {
          label: '파랑',
          bg: 'bg-sky-100/90 dark:bg-sky-950/40',
          border: 'border-sky-300 dark:border-sky-700/60',
          text: 'text-sky-950 dark:text-sky-100',
          badge: 'bg-sky-500/20 text-sky-800 dark:text-sky-300 border-sky-400/30',
        };
      case 'pink':
        return {
          label: '분홍',
          bg: 'bg-pink-100/90 dark:bg-pink-950/40',
          border: 'border-pink-300 dark:border-pink-700/60',
          text: 'text-pink-950 dark:text-pink-100',
          badge: 'bg-pink-500/20 text-pink-800 dark:text-pink-300 border-pink-400/30',
        };
      case 'purple':
        return {
          label: '보라',
          bg: 'bg-purple-100/90 dark:bg-purple-950/40',
          border: 'border-purple-300 dark:border-purple-700/60',
          text: 'text-purple-950 dark:text-purple-100',
          badge: 'bg-purple-500/20 text-purple-800 dark:text-purple-300 border-purple-400/30',
        };
      default:
        return {
          label: color,
          bg: 'bg-amber-100/90 dark:bg-amber-950/40',
          border: 'border-amber-300 dark:border-amber-700/60',
          text: 'text-amber-950 dark:text-amber-100',
          badge: 'bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-400/30',
        };
    }
  };

  // Stop speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, []);

  const startVoiceRecognition = (onTranscriptUpdate: (text: string) => void) => {
    const SpeechRecognitionAPI =
      typeof window !== 'undefined' &&
      ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

    if (!SpeechRecognitionAPI) {
      alert('이 브라우저는 음성 인식을 지원하지 않습니다. Chrome, Safari, Edge 브라우저를 이용해 주세요.');
      return;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = 'ko-KR';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      let currentFinal = '';
      let currentInterim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptPart = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          currentFinal += transcriptPart;
        } else {
          currentInterim += transcriptPart;
        }
      }
      if (currentFinal) {
        onTranscriptUpdate(currentFinal);
      }
      setInterimTranscript(currentInterim);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      setInterimTranscript('');
      if (event.error === 'not-allowed') {
        alert('마이크 접근 권한이 거부되었습니다. 브라우저 설정에서 마이크 사용을 허용해 주세요.');
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript('');
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
    } catch (err) {
      console.error('Failed to start speech recognition', err);
    }
  };

  const stopVoiceRecognition = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }
    setIsListening(false);
    setInterimTranscript('');
  };

  const handleOpenVoiceModal = () => {
    const now = new Date();
    const defaultTitle = `음성 기도 메모 (${now.getMonth() + 1}/${now.getDate()} ${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')})`;
    setVoiceTitle(defaultTitle);
    setVoiceContent('');
    setVoiceCategory('개인');
    setShowVoiceModal(true);

    // Automatically start listening when modal opens
    setTimeout(() => {
      startVoiceRecognition((text) => {
        setVoiceContent((prev) => (prev ? prev + ' ' + text : text));
      });
    }, 150);
  };

  const handleCloseVoiceModal = () => {
    stopVoiceRecognition();
    setShowVoiceModal(false);
  };

  const handleSaveVoiceMemo = () => {
    if (!voiceContent.trim() && !voiceTitle.trim()) {
      alert('음성을 말하거나 내용을 입력해 주세요.');
      return;
    }
    const finalTitle = voiceTitle.trim() || '음성 기도 메모';
    onAddPrayer({
      title: finalTitle,
      content: voiceContent.trim(),
      category: voiceCategory,
      isAnswered: false,
    });
    stopVoiceRecognition();
    setShowVoiceModal(false);
  };

  const handleCreatePrayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onAddPrayer({
      title: newTitle,
      content: newContent,
      category: newCategory,
      isAnswered: false,
    });
    setNewTitle('');
    setNewContent('');
    setShowAddPrayerModal(false);
    stopVoiceRecognition();
    setFormMicField(null);
  };

  // Local-first Export JSON backup file
  const handleExportBackup = () => {
    const backupData = {
      highlights,
      bookmarks,
      prayers,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bible-memo-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Header Banner */}
      <div className="p-3.5 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-500 text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative">
        <div className="pr-10 sm:pr-0">
          <div className="flex items-center gap-2 mb-0.5">
            <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
            <h2 className="text-lg sm:text-2xl font-extrabold font-serif">
              메모 기도 노트
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-amber-100">
            하이라이트, 북마크, 기도 제목이 로그인이나 네트워크 연결 없이 사용자 기기에 안전하게 지속 저장됩니다.
          </p>
        </div>

        {/* Local storage status indicator & Backup export */}
        <div className="flex items-center gap-2 pr-8 sm:pr-10">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-black/20 text-xs font-semibold border border-white/20">
            <HardDrive className="w-3.5 h-3.5 text-emerald-300" />
            <span>오프라인 기기 저장됨</span>
          </span>

          <button
            onClick={handleExportBackup}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white text-zinc-900 hover:bg-amber-50 text-xs font-bold transition-colors shadow-xs cursor-pointer"
            title="백업 파일 다운로드"
          >
            <Download className="w-3.5 h-3.5" />
            <span>백업 저장</span>
          </button>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 rounded-xl bg-black/20 hover:bg-black/40 text-white transition-all cursor-pointer shadow-xs active:scale-95"
            title="메모 기도 노트 닫기 (성경 읽기로 이동)"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Sub-tabs Navigation */}
      <div className="flex items-center gap-1.5 border-b border-zinc-200 dark:border-zinc-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setSubTab('prayers')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
            subTab === 'prayers'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
          }`}
        >
          <Heart className="w-3.5 h-3.5" />
          <span>기도 노트 ({prayers.length})</span>
        </button>

        <button
          onClick={() => setSubTab('highlights')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
            subTab === 'highlights'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
          }`}
        >
          <Highlighter className="w-3.5 h-3.5" />
          <span>형광펜 구절 ({highlights.length})</span>
        </button>

        <button
          onClick={() => setSubTab('bookmarks')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
            subTab === 'bookmarks'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
          }`}
        >
          <Bookmark className="w-3.5 h-3.5" />
          <span>북마크 ({bookmarks.length})</span>
        </button>
      </div>

      {/* Sub-tab 1: Prayer Journal */}
      {subTab === 'prayers' && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-bold text-sm sm:text-base text-zinc-900 dark:text-zinc-100">
              마음의 기도를 기록하고 응답의 은혜를 기억하세요
            </h3>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={handleOpenVoiceModal}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-red-500 to-amber-600 text-white font-bold text-xs hover:from-red-600 hover:to-amber-700 transition-all shadow-xs cursor-pointer"
                title="음성으로 빠르게 기도 메모 작성"
              >
                <Mic className="w-3.5 h-3.5 animate-pulse text-amber-200" />
                <span>음성 메모 작성</span>
              </button>

              <button
                onClick={() => setShowAddPrayerModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 text-white font-bold text-xs hover:bg-amber-700 transition-colors shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>새 기도 제목 작성</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {prayers.length === 0 ? (
              <div className="col-span-full p-12 text-center text-zinc-400 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-2xl space-y-2">
                <Heart className="w-8 h-8 mx-auto text-amber-500/40" />
                <p className="font-medium text-sm">아직 작성된 기도 제목이 없습니다.</p>
                <p className="text-xs">상단의 버튼을 눌러 기도 제목을 작성해 보세요.</p>
              </div>
            ) : (
              prayers.map((prayer) => (
                <div
                  key={prayer.id}
                  className={`p-5 rounded-2xl border transition-all space-y-3 ${
                    prayer.isAnswered
                      ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/80'
                      : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-xs">
                        {prayer.category}
                      </span>
                      {prayer.isAnswered && (
                        <span className="px-2 py-0.5 rounded bg-emerald-500 text-white font-bold text-xs flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          <span>기도 응답! 🙏</span>
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => onDeletePrayer(prayer.id)}
                      className="text-zinc-400 hover:text-red-500 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <h4 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                    {prayer.title}
                  </h4>
                  <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed whitespace-pre-line">
                    {prayer.content}
                  </p>

                  <div className="flex items-center justify-between pt-3 border-t border-zinc-200/60 dark:border-zinc-800/60 text-xs text-zinc-400">
                    <span>작성일: {prayer.createdAt.split('T')[0]}</span>

                    <button
                      onClick={() => onTogglePrayerAnswered(prayer.id)}
                      className={`flex items-center gap-1 px-3 py-1 rounded-lg font-bold transition-colors ${
                        prayer.isAnswered
                          ? 'bg-emerald-600 text-white'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-emerald-100'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{prayer.isAnswered ? '응답 완료' : '응답 표시'}</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Sub-tab 2: Highlights */}
      {subTab === 'highlights' && (
        <div className="space-y-3">
          {highlights.length === 0 ? (
            <div className="p-12 text-center text-zinc-400 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-2xl">
              형광펜으로 강조한 구절이 아직 없습니다. 성경 탭에서 말씀 구절을 터치하여 형광펜을 칠해 보세요.
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between px-1 text-xs text-zinc-500">
                <span>총 <strong className="text-amber-600 dark:text-amber-400">{highlights.length}개</strong>의 형광펜 구절</span>
                <button
                  type="button"
                  onClick={() => {
                    if (expandedHighlightIds.length === highlights.length) {
                      setExpandedHighlightIds([]);
                    } else {
                      setExpandedHighlightIds(highlights.map((h) => h.id));
                    }
                  }}
                  className="font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                >
                  {expandedHighlightIds.length === highlights.length ? '모두 접기' : '모두 펼치기'}
                </button>
              </div>

              {highlights.map((h) => {
                const isExpanded = expandedHighlightIds.includes(h.id);
                const bookName = getBookNameHelper(h.bookId);
                const verseText = getVerseTextHelper(h.bookId, h.chapter, h.verseNumber);
                const colorStyle = getColorStyles(h.color);

                const toggleExpand = () => {
                  setExpandedHighlightIds((prev) =>
                    prev.includes(h.id) ? prev.filter((id) => id !== h.id) : [...prev, h.id]
                  );
                };

                return (
                  <div
                    key={h.id}
                    className={`rounded-2xl border transition-all duration-200 overflow-hidden shadow-xs ${
                      isExpanded
                        ? 'bg-white dark:bg-zinc-900 border-amber-400/80 dark:border-amber-600/80 ring-2 ring-amber-500/10'
                        : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-amber-300 dark:hover:border-amber-700'
                    }`}
                  >
                    {/* Header bar - Click anywhere to toggle expansion */}
                    <div
                      onClick={toggleExpand}
                      className="p-3.5 sm:p-4 flex items-center justify-between cursor-pointer select-none hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-extrabold text-base text-amber-600 dark:text-amber-400">
                          {bookName} {h.chapter}:{h.verseNumber}절
                        </span>
                        <span className={`px-2 py-0.5 rounded-md text-xs font-bold border ${colorStyle.badge}`}>
                          형광펜: {colorStyle.label}
                        </span>
                        <span className="text-[11px] text-zinc-400">
                          {isExpanded ? '터치하여 접기' : '터치하여 말씀 본문 보기'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => onSelectVerse(h.bookId, h.chapter, h.verseNumber)}
                          className="px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 font-extrabold text-xs flex items-center gap-1 transition-all cursor-pointer"
                          title="성경 본문으로 이동"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">본문 이동</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteHighlight(h.id)}
                          className="p-1.5 text-zinc-400 hover:text-red-500 rounded-lg hover:bg-red-500/10 transition-colors cursor-pointer"
                          title="형광펜 삭제"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={toggleExpand}
                          className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Expanded Content Section */}
                    {isExpanded && (
                      <div className="p-3.5 sm:p-4 pt-0 space-y-2.5 border-t border-zinc-100 dark:border-zinc-800/80 animate-in fade-in duration-150">
                        <div className={`p-3.5 rounded-xl border ${colorStyle.bg} ${colorStyle.border} ${colorStyle.text} text-sm sm:text-base font-medium leading-relaxed mt-3`}>
                          {verseText ? (
                            <p>
                              <span className="font-extrabold mr-1.5 opacity-80">
                                {h.verseNumber}.
                              </span>
                              {verseText}
                            </p>
                          ) : (
                            <p className="text-xs text-zinc-500 italic">성경 구절 본문을 불러오는 중입니다...</p>
                          )}
                        </div>

                        {h.note && (
                          <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 text-xs text-zinc-600 dark:text-zinc-300">
                            <span className="font-bold text-amber-600 dark:text-amber-400 mr-1.5">메모:</span>
                            {h.note}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}

      {/* Sub-tab 3: Bookmarks */}
      {subTab === 'bookmarks' && (
        <div className="space-y-3">
          {bookmarks.length === 0 ? (
            <div className="p-12 text-center text-zinc-400 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-2xl">
              북마크한 말씀이 없습니다.
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between px-1 text-xs text-zinc-500">
                <span>총 <strong className="text-amber-600 dark:text-amber-400">{bookmarks.length}개</strong>의 북마크</span>
                <button
                  type="button"
                  onClick={() => {
                    if (expandedBookmarkIds.length === bookmarks.length) {
                      setExpandedBookmarkIds([]);
                    } else {
                      setExpandedBookmarkIds(bookmarks.map((b) => b.id));
                    }
                  }}
                  className="font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                >
                  {expandedBookmarkIds.length === bookmarks.length ? '모두 접기' : '모두 펼치기'}
                </button>
              </div>

              {bookmarks.map((b) => {
                const isExpanded = expandedBookmarkIds.includes(b.id);
                const bookName = b.bookName || getBookNameHelper(b.bookId);
                const verseText = getVerseTextHelper(b.bookId, b.chapter, b.verseNumber);

                const toggleExpand = () => {
                  setExpandedBookmarkIds((prev) =>
                    prev.includes(b.id) ? prev.filter((id) => id !== b.id) : [...prev, b.id]
                  );
                };

                return (
                  <div
                    key={b.id}
                    className={`rounded-2xl border transition-all duration-200 overflow-hidden shadow-xs ${
                      isExpanded
                        ? 'bg-white dark:bg-zinc-900 border-amber-400/80 dark:border-amber-600/80 ring-2 ring-amber-500/10'
                        : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-amber-300 dark:hover:border-amber-700'
                    }`}
                  >
                    {/* Header bar */}
                    <div
                      onClick={toggleExpand}
                      className="p-3.5 sm:p-4 flex items-center justify-between cursor-pointer select-none hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="font-extrabold text-base text-amber-600 dark:text-amber-400">
                          {bookName} {b.chapter}:{b.verseNumber}절
                        </span>
                        <span className="text-xs text-zinc-400">
                          {b.createdAt.split('T')[0]}
                        </span>
                        <span className="text-[11px] text-zinc-400">
                          {isExpanded ? '터치하여 접기' : '터치하여 말씀 본문 보기'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => onSelectVerse(b.bookId, b.chapter, b.verseNumber)}
                          className="px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 font-extrabold text-xs flex items-center gap-1 transition-all cursor-pointer"
                          title="성경 본문으로 이동"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">본문 이동</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteBookmark(b.id)}
                          className="p-1.5 text-zinc-400 hover:text-red-500 rounded-lg hover:bg-red-500/10 transition-colors cursor-pointer"
                          title="북마크 삭제"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={toggleExpand}
                          className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="p-3.5 sm:p-4 pt-0 space-y-2.5 border-t border-zinc-100 dark:border-zinc-800/80 animate-in fade-in duration-150">
                        <div className="p-3.5 rounded-xl bg-amber-50/80 dark:bg-zinc-800/60 border border-amber-200/80 dark:border-zinc-700/60 text-zinc-900 dark:text-zinc-100 text-sm sm:text-base font-medium leading-relaxed mt-3">
                          {verseText ? (
                            <p>
                              <span className="font-extrabold text-amber-600 dark:text-amber-400 mr-1.5">
                                {b.verseNumber}.
                              </span>
                              {verseText}
                            </p>
                          ) : (
                            <p className="text-xs text-zinc-500 italic">성경 구절 본문을 불러오는 중입니다...</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}

      {/* Add Prayer Form Modal */}
      {showAddPrayerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <form
            onSubmit={handleCreatePrayer}
            className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 p-6 shadow-2xl border border-zinc-200 dark:border-zinc-800 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100">새 기도 제목 작성</h3>
              <button
                type="button"
                onClick={() => {
                  stopVoiceRecognition();
                  setFormMicField(null);
                  setShowAddPrayerModal(false);
                }}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                title="닫기"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-500 block mb-1">
                기도 분류
              </label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as any)}
                className="w-full p-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm"
              >
                <option value="개인">개인 기도</option>
                <option value="가족">가족 / 자녀</option>
                <option value="교회">교회 / 공동체</option>
                <option value="이웃">이웃 / 환우</option>
                <option value="선교">열방 / 선교</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-zinc-500">
                  기도 제목
                </label>
                <button
                  type="button"
                  onClick={() => {
                    if (isListening && formMicField === 'title') {
                      stopVoiceRecognition();
                      setFormMicField(null);
                    } else {
                      setFormMicField('title');
                      startVoiceRecognition((text) =>
                        setNewTitle((prev) => (prev ? prev + ' ' + text : text))
                      );
                    }
                  }}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold transition-all ${
                    isListening && formMicField === 'title'
                      ? 'bg-red-500 text-white animate-pulse'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-amber-600'
                  }`}
                  title="음성으로 기도 제목 받아쓰기"
                >
                  <Mic className="w-3 h-3" />
                  <span>{isListening && formMicField === 'title' ? '받아쓰는 중...' : '음성 입력'}</span>
                </button>
              </div>
              <input
                type="text"
                required
                placeholder="기도 제목을 입력하거나 음성으로 말하세요"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-zinc-500">
                  세부 기도 내용
                </label>
                <button
                  type="button"
                  onClick={() => {
                    if (isListening && formMicField === 'content') {
                      stopVoiceRecognition();
                      setFormMicField(null);
                    } else {
                      setFormMicField('content');
                      startVoiceRecognition((text) =>
                        setNewContent((prev) => (prev ? prev + ' ' + text : text))
                      );
                    }
                  }}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold transition-all ${
                    isListening && formMicField === 'content'
                      ? 'bg-red-500 text-white animate-pulse'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-amber-600'
                  }`}
                  title="음성으로 세부 기도 내용 받아쓰기"
                >
                  <Mic className="w-3 h-3" />
                  <span>{isListening && formMicField === 'content' ? '받아쓰는 중...' : '음성 입력'}</span>
                </button>
              </div>
              <textarea
                rows={3}
                placeholder="구체적인 기도 내용이나 약속의 말씀 구절을 적거나 음성으로 말씀하세요"
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm focus:ring-2 focus:ring-amber-500"
              />
              {isListening && (
                <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 font-medium flex items-center gap-1">
                  <Radio className="w-3 h-3 animate-ping" />
                  <span>마이크가 켜져 있습니다. 말씀하시면 텍스트로 자동 변환됩니다.</span>
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  stopVoiceRecognition();
                  setFormMicField(null);
                  setShowAddPrayerModal(false);
                }}
                className="px-4 py-2 rounded-xl bg-zinc-200 dark:bg-zinc-800 text-xs font-bold"
              >
                취소
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-amber-600 text-white font-bold text-xs hover:bg-amber-700"
              >
                기도 제목 저장
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Voice Recognition Dedicated Modal */}
      {showVoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-zinc-900 p-6 shadow-2xl border border-zinc-200 dark:border-zinc-800 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400">
                  <Mic className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base sm:text-lg text-zinc-900 dark:text-zinc-100">
                    음성 인식 메모 작성
                  </h3>
                  <p className="text-xs text-zinc-500">
                    마이크에대해 말씀하시면 실시간 텍스트로 자동 변환됩니다.
                  </p>
                </div>
              </div>

              <button
                onClick={handleCloseVoiceModal}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mic Animated Center Controller */}
            <div className="flex flex-col items-center justify-center py-4 bg-amber-500/5 dark:bg-amber-500/10 rounded-2xl border border-amber-500/20">
              <button
                type="button"
                onClick={() => {
                  if (isListening) {
                    stopVoiceRecognition();
                  } else {
                    startVoiceRecognition((text) =>
                      setVoiceContent((prev) => (prev ? prev + ' ' + text : text))
                    );
                  }
                }}
                className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-lg ${
                  isListening
                    ? 'bg-red-500 text-white ring-8 ring-red-500/30 animate-pulse'
                    : 'bg-amber-600 text-white hover:bg-amber-700'
                }`}
              >
                {isListening ? (
                  <Mic className="w-9 h-9" />
                ) : (
                  <MicOff className="w-9 h-9" />
                )}
                {isListening && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white dark:border-zinc-900 animate-ping" />
                )}
              </button>

              <div className="mt-3 text-center">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold ${
                    isListening
                      ? 'bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30'
                      : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  <Radio
                    className={`w-3.5 h-3.5 ${isListening ? 'animate-spin text-red-500' : ''}`}
                  />
                  <span>
                    {isListening ? '음성 듣는 중... 자유롭게 말씀하세요' : '마이크 일시정지됨 (버튼 터치시 시작)'}
                  </span>
                </span>
              </div>
            </div>

            {/* Form Fields: Category & Title */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-1">
                <label className="text-xs font-semibold text-zinc-500 block mb-1">
                  분류
                </label>
                <select
                  value={voiceCategory}
                  onChange={(e) => setVoiceCategory(e.target.value as any)}
                  className="w-full p-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-bold"
                >
                  <option value="개인">개인 기도</option>
                  <option value="가족">가족 / 자녀</option>
                  <option value="교회">교회 / 공동체</option>
                  <option value="이웃">이웃 / 환우</option>
                  <option value="선교">열방 / 선교</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-zinc-500 block mb-1">
                  메모 제목
                </label>
                <input
                  type="text"
                  value={voiceTitle}
                  onChange={(e) => setVoiceTitle(e.target.value)}
                  placeholder="메모 제목"
                  className="w-full p-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-bold"
                />
              </div>
            </div>

            {/* Voice Recognized Transcript Area */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-zinc-500">
                  변환된 음성 텍스트 (직접 수정 가능)
                </label>
                {voiceContent && (
                  <button
                    type="button"
                    onClick={() => setVoiceContent('')}
                    className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-red-500"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>초기화</span>
                  </button>
                )}
              </div>

              <div className="relative">
                <textarea
                  rows={4}
                  value={voiceContent + (interimTranscript ? ' ' + interimTranscript : '')}
                  onChange={(e) => setVoiceContent(e.target.value)}
                  placeholder="말씀하시는 내용이 이곳에 실시간 텍스트로 나타납니다..."
                  className="w-full p-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm font-medium leading-relaxed focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-zinc-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={handleCloseVoiceModal}
                className="px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 text-xs font-bold"
              >
                닫기
              </button>

              <button
                type="button"
                onClick={handleSaveVoiceMemo}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-amber-600 text-white font-extrabold text-xs hover:bg-amber-700 transition-colors shadow-md cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>메모로 즉시 저장</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
