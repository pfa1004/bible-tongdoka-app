import React, { useState, useEffect, useRef } from 'react';
import {
  Book,
  TranslationId,
  Translation,
  Verse,
  ReaderSettings,
  UserHighlight,
  UserBookmark,
} from '../types';
import { DesignPresetId, DESIGN_PRESETS } from './DesignStyleModal';
import { BIBLE_BOOKS, TRANSLATIONS, getChapterVerses } from '../data/bibleData';
import { getCustomBibleCache } from '../utils/customBibleStorage';
import { DICTIONARY_ENTRIES } from '../data/dictionaryData';
import { ErrorReportModal } from './ErrorReportModal';
import { BookIntroModal } from './BookIntroModal';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Columns,
  Highlighter,
  Bookmark,
  Copy,
  Share2,
  Check,
  BookOpen,
  Hash,
  Sparkles,
  Palette,
  Eye,
  List,
  Search,
  X,
  AlertTriangle,
  CheckCircle2,
  ArrowUp,
  FileText,
  Volume2,
} from 'lucide-react';

interface Props {
  currentBook: Book;
  currentChapter: number;
  targetVerseNumber?: number | null;
  onBookChange: (book: Book) => void;
  onChapterChange: (chapter: number) => void;
  readerSettings: ReaderSettings;
  highlights: UserHighlight[];
  bookmarks: UserBookmark[];
  onToggleHighlight: (
    bookId: string,
    chapter: number,
    verseNum: number,
    color: UserHighlight['color']
  ) => void;
  onToggleBookmark: (bookId: string, chapter: number, verseNum: number) => void;
  onSaveVerseNote?: (bookId: string, chapter: number, verseNum: number, note: string) => void;
  onOpenDictionary: (entryOrCode: string, isStrong?: boolean) => void;
  onCreateVerseCard: (verseText: string, refText: string) => void;
  activeDesignPreset: DesignPresetId;
  onSelectDesignPreset: (presetId: DesignPresetId) => void;
  onOpenDesignStyleModal: () => void;
  onOpenBibleBooksModal?: (mode?: 'list' | 'overview') => void;
  onOpenBibleSearchModal?: () => void;
  openHenryTrigger?: number;
  audioState?: any;
  onToggleAudioPlayer?: () => void;
  onUpdateAudioState?: (update: any) => void;
}

export const BibleTab: React.FC<Props> = ({
  currentBook,
  currentChapter,
  targetVerseNumber,
  onBookChange,
  onChapterChange,
  readerSettings,
  highlights,
  bookmarks,
  onToggleHighlight,
  onToggleBookmark,
  onSaveVerseNote,
  onOpenDictionary,
  onCreateVerseCard,
  activeDesignPreset,
  onSelectDesignPreset,
  onOpenDesignStyleModal,
  onOpenBibleBooksModal,
  onOpenBibleSearchModal,
  openHenryTrigger,
  audioState,
  onToggleAudioPlayer,
  onUpdateAudioState,
}) => {
  const [columnCount, setColumnCount] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('bible_column_count');
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= 1 && parsed <= 4) return parsed;
      }
    } catch { }
    return 2;
  }); // 1, 2, 3, or 4 parallel translations

  const [activeTranslations, setActiveTranslations] = useState<TranslationId[]>(() => {
    const DEFAULT_TRANSLATIONS = ['KRV' as TranslationId, 'KJV' as TranslationId, 'KJV1611' as TranslationId];
    try {
      const saved = localStorage.getItem('bible_active_translations_v6');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const cleaned = parsed.filter((t) => t !== 'NKRV');
          if (cleaned.length > 0) return cleaned;
        }
      }
    } catch { }
    return DEFAULT_TRANSLATIONS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('bible_column_count', String(columnCount));
    } catch { }
  }, [columnCount]);

  useEffect(() => {
    try {
      localStorage.setItem('bible_active_translations_v6', JSON.stringify(activeTranslations));
      localStorage.setItem('bible_active_translations_v5', JSON.stringify(activeTranslations));
      localStorage.setItem('bible_active_translations', JSON.stringify(activeTranslations));
    } catch { }
    if (onUpdateAudioState && activeTranslations.length > 0) {
      onUpdateAudioState({ selectedTranslationId: activeTranslations[0] });
    }
  }, [activeTranslations, onUpdateAudioState]);

  // Persistent Read / Unread Chapter Completion State
  const [readChapters, setReadChapters] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('bible_read_chapters');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) { }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('bible_read_chapters', JSON.stringify(readChapters));
    } catch (e) { }
  }, [readChapters]);

  // Sync state when changed externally (e.g. PlanModal)
  useEffect(() => {
    const syncReadChapters = () => {
      try {
        const saved = localStorage.getItem('bible_read_chapters');
        if (saved) {
          setReadChapters(JSON.parse(saved));
        }
      } catch { }
    };
    window.addEventListener('storage', syncReadChapters);
    return () => window.removeEventListener('storage', syncReadChapters);
  }, []);

  const currentChapterKey = `${currentBook.id}_${currentChapter}`;
  const isChapterRead = readChapters.includes(currentChapterKey);

  const toggleChapterRead = () => {
    saveCurrentScrollPosition();
    setReadChapters((prev) => {
      if (prev.includes(currentChapterKey)) {
        return prev.filter((k) => k !== currentChapterKey);
      } else {
        return [...prev, currentChapterKey];
      }
    });
  };

  const handleScrollToTop = () => {
    // Scroll only the main container to keep header/footer fixed
    document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
    const mainContainer = document.querySelector('main');
    if (mainContainer) {
      mainContainer.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const [selectedVerses, setSelectedVerses] = useState<Verse[]>([]);
  const [showCopyToast, setShowCopyToast] = useState(false);
  const [showErrorReportModal, setShowErrorReportModal] = useState(false);
  const [isBookIntroOpen, setIsBookIntroOpen] = useState(false);

  // Long press & Inline Memo state
  const [editingMemoVerseNumber, setEditingMemoVerseNumber] = useState<number | null>(null);
  const [memoInputText, setMemoInputText] = useState('');
  const [isSwipingSmoothly, setIsSwipingSmoothly] = useState(false);

  // Touch Swipe Navigation Handlers (Y-Axis Fixed, Pure Horizontal Navigation)
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  const triggerSmoothChapterNavigation = (direction: 'next' | 'prev') => {
    if (isSwipingSmoothly) return;
    setIsSwipingSmoothly(true);

    setTimeout(() => {
      if (direction === 'next') {
        handleNextChapter();
      } else {
        handlePrevChapter();
      }
      setTimeout(() => {
        setIsSwipingSmoothly(false);
      }, 120);
    }, 180);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const deltaX = touchEndX - touchStartXRef.current;
    const deltaY = touchEndY - touchStartYRef.current;

    // Trigger horizontal swipe ONLY when horizontal drag is clearly dominant (dx > dy * 2.0 & dx > 60px)
    // This allows 100% natural, smooth vertical scrolling without any hindrance
    if (Math.abs(deltaX) > 60 && Math.abs(deltaX) > Math.abs(deltaY) * 2.0) {
      if (deltaX < 0) {
        triggerSmoothChapterNavigation('next'); // Swipe Left -> Next Chapter
      } else {
        triggerSmoothChapterNavigation('prev'); // Swipe Right -> Prev Chapter
      }
    }

    touchStartXRef.current = null;
    touchStartYRef.current = null;
  };

  // Study commentary font size and pinch-to-zoom touch gesture state
  const [studyFontSize, setStudyFontSize] = useState<number>(14);
  const studyPinchDistRef = useRef<{ initialDist: number; initialFontSize: number } | null>(null);

  const handleStudyTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      studyPinchDistRef.current = {
        initialDist: dist,
        initialFontSize: studyFontSize,
      };
    } else {
      studyPinchDistRef.current = null;
    }
  };

  const handleStudyTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && studyPinchDistRef.current) {
      if (e.cancelable) e.preventDefault();
      e.stopPropagation();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const currentDist = Math.sqrt(dx * dx + dy * dy);
      const scale = currentDist / studyPinchDistRef.current.initialDist;
      const newSize = Math.max(10, Math.min(36, Math.round(studyPinchDistRef.current.initialFontSize * scale)));
      setStudyFontSize(newSize);
    }
  };

  const handleStudyTouchEnd = () => {
    studyPinchDistRef.current = null;
  };

  // Draggable Floating Audio Speaker Button State & Mobile Touch Drag Handlers
  const [floatingPos, setFloatingPos] = useState<{ x: number; y: number } | null>(null);
  const isDraggingSpeakerRef = useRef(false);
  const dragSpeakerStartRef = useRef<{ x: number; y: number; initialX: number; initialY: number } | null>(null);
  const lastTouchTimeRef = useRef<number>(0);

  const handleSpeakerTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    lastTouchTimeRef.current = Date.now();
    const touch = e.touches[0];
    const currentX = floatingPos?.x ?? (window.innerWidth - 75);
    const currentY = floatingPos?.y ?? (window.innerHeight - 160);

    dragSpeakerStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      initialX: currentX,
      initialY: currentY,
    };
    isDraggingSpeakerRef.current = false;
  };

  const handleSpeakerTouchMove = (e: React.TouchEvent) => {
    if (!dragSpeakerStartRef.current || e.touches.length !== 1) return;
    if (e.cancelable) e.preventDefault(); // Stop mobile browser vertical scroll interference during drag

    const touch = e.touches[0];
    const dx = touch.clientX - dragSpeakerStartRef.current.x;
    const dy = touch.clientY - dragSpeakerStartRef.current.y;

    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      isDraggingSpeakerRef.current = true;
    }

    if (isDraggingSpeakerRef.current) {
      const newX = Math.min(Math.max(10, dragSpeakerStartRef.current.initialX + dx), window.innerWidth - 65);
      const newY = Math.min(Math.max(60, dragSpeakerStartRef.current.initialY + dy), window.innerHeight - 90);
      setFloatingPos({ x: newX, y: newY });
    }
  };

  const handleSpeakerTouchEnd = (e: React.TouchEvent) => {
    if (e.cancelable) e.preventDefault();
    lastTouchTimeRef.current = Date.now();
    if (!isDraggingSpeakerRef.current && onToggleAudioPlayer) {
      onToggleAudioPlayer(); // Short tap without dragging -> Toggle Audio
    }
    dragSpeakerStartRef.current = null;
    isDraggingSpeakerRef.current = false;
  };

  const handleSpeakerMouseDown = (e: React.MouseEvent) => {
    // Prevent ghost click from mouse event fired right after touch event
    if (Date.now() - lastTouchTimeRef.current < 500) return;

    const currentX = floatingPos?.x ?? (window.innerWidth - 75);
    const currentY = floatingPos?.y ?? (window.innerHeight - 160);

    dragSpeakerStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      initialX: currentX,
      initialY: currentY,
    };
    isDraggingSpeakerRef.current = false;
  };

  const handleSpeakerMouseMove = (e: React.MouseEvent) => {
    if (Date.now() - lastTouchTimeRef.current < 500) return;
    if (!dragSpeakerStartRef.current) return;
    const dx = e.clientX - dragSpeakerStartRef.current.x;
    const dy = e.clientY - dragSpeakerStartRef.current.y;

    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      isDraggingSpeakerRef.current = true;
    }

    if (isDraggingSpeakerRef.current) {
      const newX = Math.min(Math.max(10, dragSpeakerStartRef.current.initialX + dx), window.innerWidth - 65);
      const newY = Math.min(Math.max(60, dragSpeakerStartRef.current.initialY + dy), window.innerHeight - 90);
      setFloatingPos({ x: newX, y: newY });
    }
  };

  const handleSpeakerMouseUp = () => {
    if (Date.now() - lastTouchTimeRef.current < 500) return;
    if (!isDraggingSpeakerRef.current && onToggleAudioPlayer) {
      onToggleAudioPlayer();
    }
    dragSpeakerStartRef.current = null;
    isDraggingSpeakerRef.current = false;
  };

  // Custom Dropdown State for OT, NT, and Chapter Selection
  const [openDropdown, setOpenDropdown] = useState<'OT' | 'NT' | 'chapter' | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // TTS 낭독 중 현재 읽고 있는 구절 위치로 화면 자동 스크롤 (Auto Scroll)
  useEffect(() => {
    if (audioState && audioState.isPlaying && typeof audioState.currentVerseIndex === 'number') {
      const verseNum = audioState.currentVerseIndex + 1;
      const element = document.getElementById(`v-${verseNum}`);
      if (element) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
    }
  }, [audioState?.currentVerseIndex, audioState?.isPlaying]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Study Resource Drawer Panel States
  const [isStudyPanelOpen, setIsStudyPanelOpen] = useState(false);
  const [isStudyFullscreen, setIsStudyFullscreen] = useState(false);
  const [studyPanelVerse, setStudyPanelVerse] = useState<Verse | null>(null);
  const [activeStudyTab, setActiveStudyTab] = useState<'cross' | 'manna' | 'henry'>('cross');
  const [studyData, setStudyData] = useState<{ cross: string; manna: string; henry: string }>({
    cross: '',
    manna: '',
    henry: '',
  });
  const [isStudyLoading, setIsStudyLoading] = useState(false);

  // Study Resource Panel Drag-to-Resize States
  const [studyPanelHeight, setStudyPanelHeight] = useState(400);
  const [isDraggingHeight, setIsDraggingHeight] = useState(false);
  const startDragYRef = useRef(0);
  const startHeightRef = useRef(400);
  const dragHandleRef = useRef<HTMLDivElement | null>(null);

  const handleHeightDragStart = (clientY: number) => {
    setIsDraggingHeight(true);
    startDragYRef.current = clientY;
    startHeightRef.current = studyPanelHeight;
  };

  useEffect(() => {
    const handle = dragHandleRef.current;
    if (!handle) return;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 0) return;
      e.stopPropagation();
      if (e.cancelable) {
        e.preventDefault();
      }
      handleHeightDragStart(e.touches[0].clientY);
    };

    const onMouseDown = (e: MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      handleHeightDragStart(e.clientY);
    };

    handle.addEventListener('touchstart', onTouchStart, { passive: false });
    handle.addEventListener('mousedown', onMouseDown);

    return () => {
      handle.removeEventListener('touchstart', onTouchStart);
      handle.removeEventListener('mousedown', onMouseDown);
    };
  }, [studyPanelHeight]);

  useEffect(() => {
    if (isDraggingHeight) {
      document.body.style.overflow = 'hidden';
      document.body.style.userSelect = 'none';
      document.body.style.touchAction = 'none';
    } else {
      document.body.style.overflow = '';
      document.body.style.userSelect = '';
      document.body.style.touchAction = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.userSelect = '';
      document.body.style.touchAction = '';
    };
  }, [isDraggingHeight]);

  useEffect(() => {
    if (!isDraggingHeight) return;

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      const deltaY = startDragYRef.current - e.clientY;
      const newHeight = Math.max(200, Math.min(window.innerHeight - 60, startHeightRef.current + deltaY));
      setStudyPanelHeight(newHeight);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 0) return;
      if (e.cancelable) {
        e.preventDefault();
      }
      const deltaY = startDragYRef.current - e.touches[0].clientY;
      const newHeight = Math.max(200, Math.min(window.innerHeight - 60, startHeightRef.current + deltaY));
      setStudyPanelHeight(newHeight);
    };

    const handleMouseUp = () => {
      setIsDraggingHeight(false);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: false });
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDraggingHeight]);

  const replaceBlueColors = (htmlText: string) => {
    if (!htmlText) return '';
    return htmlText
      .replace(/color=["']?#0000[0-9a-fA-F]{2}["']?/gi, 'color="#FBBF24"')
      .replace(/color=["']?blue["']?/gi, 'color="#FBBF24"')
      .replace(/color=["']?navy["']?/gi, 'color="#FBBF24"')
      .replace(/style=["']color:\s*#0000[0-9a-fA-F]{2};?["']/gi, 'style="color:#FBBF24;"')
      .replace(/style=["']color:\s*blue;?["']/gi, 'style="color:#FBBF24;"');
  };

  const fetchStudyData = async (verse: Verse) => {
    setIsStudyLoading(true);
    const bookId = currentBook.id;
    const ch = currentChapter;
    const vs = verse.number;

    try {
      // 1. Load Cross References
      let crossText = '';
      try {
        const crossRes = await fetch(`/commentary/cross/${bookId}-${ch}.json`);
        if (crossRes.ok) {
          const crossJson = await crossRes.json();
          crossText = crossJson[vs] || '';
        }
      } catch (e) { }

      // 2. Load Manna Commentary
      let mannaText = '';
      try {
        const mannaRes = await fetch(`/commentary/manna/${bookId}-${ch}.json`);
        if (mannaRes.ok) {
          const mannaJson = await mannaRes.json();
          mannaText = mannaJson[vs] || '';
        }
      } catch (e) { }

      // 3. Load Matthew Henry Commentary (find nearest verse <= vs)
      let henryText = '';
      try {
        const henryRes = await fetch(`/commentary/henry/${bookId}-${ch}.json`);
        if (henryRes.ok) {
          const henryJson = await henryRes.json();
          if (henryJson[vs]) {
            henryText = henryJson[vs];
          } else {
            // Find closest verse number <= vs
            const availVerses = Object.keys(henryJson).map(Number).filter((vNum) => vNum <= vs).sort((a, b) => b - a);
            if (availVerses.length > 0) {
              const matchedVerse = availVerses[0];
              const rawText = henryJson[matchedVerse];
              henryText = `<div style="margin-bottom: 12px; padding: 10px 12px; border-radius: 12px; background-color: rgba(245, 158, 11, 0.15); color: #FBBF24; font-size: 11px; font-weight: 800; border: 1px solid rgba(245, 158, 11, 0.25);">💡 이 구절은 ${matchedVerse}절부터 시작하는 통합 주석 문단에 포함되어 있어, 해당 주석 내용으로 안내합니다.</div>` + rawText;
            }
          }
        }
      } catch (e) { }

      setStudyData({
        cross: crossText,
        manna: mannaText ? replaceBlueColors(mannaText) : '',
        henry: henryText ? replaceBlueColors(henryText) : '',
      });
    } catch (err) {
      console.error('Failed to load study resources:', err);
    } finally {
      setIsStudyLoading(false);
    }
  };

  const prevTriggerRef = useRef<number>(openHenryTrigger || 0);

  useEffect(() => {
    if (openHenryTrigger && openHenryTrigger > 0 && openHenryTrigger !== prevTriggerRef.current) {
      prevTriggerRef.current = openHenryTrigger;
      const targetVerse = selectedVerses[0] || verses[0];
      if (targetVerse) {
        setStudyPanelVerse(targetVerse);
        setActiveStudyTab('henry');
        setIsStudyPanelOpen(true);
        setIsStudyFullscreen(false);
        fetchStudyData(targetVerse);
      }
    } else {
      prevTriggerRef.current = openHenryTrigger || 0;
    }
  }, [openHenryTrigger]);

  const handleJumpToStudyVerse = (refStr: string) => {
    // refStr format: "시 8:3", "요 1:1" 등
    const match = refStr.match(/^([1-3]?\s*[가-힣a-zA-Z]+)\s*(\d+)[:\.](\d+)/);
    if (!match) return;

    const bookName = match[1].trim();
    const chapterNum = parseInt(match[2], 10);
    const verseNum = parseInt(match[3], 10);

    const bookInfo = BIBLE_BOOKS.find(
      (b) =>
        b.name.toLowerCase() === bookName.toLowerCase() ||
        b.shortName.toLowerCase() === bookName.toLowerCase() ||
        (b as any).aliases?.some((a: string) => a.toLowerCase() === bookName.toLowerCase())
    );

    if (bookInfo && chapterNum > 0 && chapterNum <= bookInfo.chapterCount) {
      onBookChange(bookInfo);
      onChapterChange(chapterNum);
      setIsStudyPanelOpen(false);

      // Auto-scroll to specific verse element after change
      setTimeout(() => {
        const element = document.getElementById(`v-${verseNum}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          const matchedVerse = {
            number: verseNum,
            text: {} as any
          };
          setSelectedVerses([matchedVerse as Verse]);
        }
      }, 500);
    }
  };

  const renderCrossReferences = (htmlText: string) => {
    if (!htmlText) return <div className="text-zinc-400 dark:text-zinc-500 text-xs py-6 text-center font-bold">관주 데이터가 존재하지 않습니다.</div>;

    const items = htmlText.split('<br><br>').filter(Boolean);
    return (
      <div className="space-y-2 select-text pb-6">
        {items.map((item, idx) => {
          const citationMatch = item.match(/\(([^)]+)\)$/);
          let mainText = item;
          let citation = '';

          if (citationMatch) {
            citation = citationMatch[1];
            mainText = item.replace(/\([^)]+\)$/, '').trim();
          }

          return (
            <div key={idx} className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/50 dark:border-zinc-700/50 text-xs leading-relaxed">
              <span className="text-zinc-800 dark:text-zinc-200">{mainText}</span>
              {citation && (
                <button
                  onClick={() => handleJumpToStudyVerse(citation)}
                  className="ml-1.5 inline-block px-1.5 py-0.5 rounded-md bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 font-extrabold cursor-pointer border border-amber-500/20 active:scale-95 transition-all"
                >
                  {citation} ↗
                </button>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Dynamic list of custom BDF translations from localStorage
  const [customTranslations, setCustomTranslations] = useState<Translation[]>([]);

  useEffect(() => {
    const loadCustomBdfs = (importedName?: string) => {
      try {
        const cache = getCustomBibleCache();
        const list: Translation[] = [];
        Object.keys(cache).forEach((name) => {
          list.push({
            id: name as TranslationId,
            name: name,
            shortName: name.length > 5 ? name.slice(0, 5) : name,
            description: '사용자 BDF 성경 번역본',
          });
        });
        setCustomTranslations(list);

        const activeList = list.length > 0 ? list : TRANSLATIONS;
        const validIds = activeList.map((t) => t.id);

        setActiveTranslations((prev) => {
          let updated = [...prev];

          updated = updated.map((item, idx) => {
            if (validIds.includes(item)) return item;
            return validIds[idx % validIds.length] || validIds[0];
          });

          if (importedName && validIds.includes(importedName as TranslationId)) {
            if (updated.length > 1) {
              updated[1] = importedName as TranslationId;
            } else {
              updated[0] = importedName as TranslationId;
            }
          }

          if (updated.length >= 2 && updated[0] === updated[1] && validIds.length >= 2) {
            const alt = validIds.find((id) => id !== updated[0]);
            if (alt) updated[1] = alt;
          }

          return updated;
        });
      } catch {
        // Ignore
      }
    };

    const handleImportEvent = (e: Event) => {
      const customEv = e as CustomEvent;
      const importedName = customEv.detail?.translationName;
      loadCustomBdfs(importedName);
    };

    loadCustomBdfs();
    window.addEventListener('storage', () => loadCustomBdfs());
    window.addEventListener('bibleImported', handleImportEvent);

    return () => {
      window.removeEventListener('storage', () => loadCustomBdfs());
      window.removeEventListener('bibleImported', handleImportEvent);
    };
  }, []);

  const scrollPositionsRef = useRef<Record<string, number>>({});

  const getScrollContainer = (): Element | Window => {
    const mainWrapper = document.querySelector('.overflow-y-auto');
    if (mainWrapper && mainWrapper.scrollHeight > mainWrapper.clientHeight) {
      return mainWrapper;
    }
    return window;
  };

  const getScrollTop = (): number => {
    const container = getScrollContainer();
    if (container === window) {
      return window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
    }
    return (container as Element).scrollTop || 0;
  };

  const setScrollTop = (top: number) => {
    const targetTop = Math.max(0, top);
    const scrollables = document.querySelectorAll('.overflow-y-auto, .overflow-auto');
    if (scrollables.length > 0) {
      scrollables.forEach((el) => {
        el.scrollTop = targetTop;
      });
    }
    document.querySelector('main')?.scrollTo({ top: targetTop, left: 0, behavior: 'instant' as ScrollBehavior });
  };

  const saveCurrentScrollPosition = (bookId = currentBook.id, chapter = currentChapter) => {
    const pos = getScrollTop();
    const key = `${bookId}_${chapter}`;
    scrollPositionsRef.current[key] = pos;
    try {
      const savedMapStr = localStorage.getItem('bible_scroll_positions_v1');
      const savedMap = savedMapStr ? JSON.parse(savedMapStr) : {};
      savedMap[key] = pos;
      localStorage.setItem('bible_scroll_positions_v1', JSON.stringify(savedMap));
    } catch {
      // Ignore
    }
  };

  const restoreScrollPosition = (bookId: string, chapter: number) => {
    const key = `${bookId}_${chapter}`;
    const targetPos = scrollPositionsRef.current[key] || 0;

    requestAnimationFrame(() => {
      setScrollTop(targetPos);
    });
  };

  // Listen to scroll events to continuously remember reading position
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const handleScroll = () => {
      const pos = getScrollTop();
      if (pos > 0) {
        const key = `${currentBook.id}_${currentChapter}`;
        scrollPositionsRef.current[key] = pos;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    const scrollables = document.querySelectorAll('.overflow-y-auto, .overflow-auto');
    scrollables.forEach((el) => el.addEventListener('scroll', handleScroll, { passive: true }));

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('scroll', handleScroll);
      scrollables.forEach((el) => el.removeEventListener('scroll', handleScroll));
    };
  }, [currentBook.id, currentChapter]);

  const availableTranslations = customTranslations.length > 0
    ? customTranslations.filter(
      (item, index, self) =>
        index === self.findIndex((t) => t.name.trim() === item.name.trim() || t.id === item.id)
    )
    : TRANSLATIONS;

  const handleTranslationChange = (colIndex: number, newTransId: TranslationId) => {
    setActiveTranslations((prev) => {
      const next = [...prev];
      next[colIndex] = newTransId;
      return next;
    });
  };

  const verses = getChapterVerses(currentBook.id, currentChapter);

  // Whenever Book, Chapter, or targetVerseNumber changes
  useEffect(() => {
    if (targetVerseNumber && targetVerseNumber > 0) {
      const timer = setTimeout(() => {
        const element = document.getElementById(`v-${targetVerseNumber}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          const matchedVerse = verses.find((v) => v.number === targetVerseNumber);
          if (matchedVerse) {
            setSelectedVerses([matchedVerse]);
          }
        } else {
          setScrollTop(0);
        }
      }, 150);
      return () => clearTimeout(timer);
    } else {
      setScrollTop(0);
      setSelectedVerses([]);
    }
  }, [currentBook.id, currentChapter, targetVerseNumber]);

  // E-Book Reader Styling Maps (Image 1 Warm Parchment & Slate Slate Theme)
  const themeClasses = {
    light: 'bg-[#fffbeb] text-[#292524] border-[#fde047]/40 shadow-sm',
    sepia: 'bg-[#fffbeb] text-[#292524] border-[#fde047]/40 shadow-sm',
    dark: 'bg-[#0f172a] text-slate-100 border-slate-800 shadow-sm',
    eink: 'bg-[#fcfbf7] text-[#1c1917] border-zinc-300 font-medium',
  }[readerSettings.theme];

  const fontSizeClasses = {
    sm: 'text-xs sm:text-sm',
    md: 'text-sm sm:text-base',
    lg: 'text-base sm:text-lg',
    xl: 'text-lg sm:text-xl',
    '2xl': 'text-xl sm:text-2xl',
  }[readerSettings.fontSize];

  const lineHeightClasses = {
    tight: 'leading-tight',
    normal: 'leading-normal',
    relaxed: 'leading-relaxed',
    loose: 'leading-loose',
  }[readerSettings.lineHeight];

  const letterSpacingClasses = {
    tight: 'tracking-tight',
    normal: 'tracking-normal',
    wide: 'tracking-wide',
  }[readerSettings.letterSpacing];

  const fontFamilyClasses = {
    sans: 'font-sans',
    serif: 'font-serif',
    handwriting: 'font-serif italic',
  }[readerSettings.fontFamily];

  const handleOpenBookIntro = () => {
    saveCurrentScrollPosition();
    setIsBookIntroOpen(true);
  };

  const handleCloseBookIntro = () => {
    setIsBookIntroOpen(false);
    restoreScrollPosition(currentBook.id, currentChapter);
  };

  const handlePrevChapter = () => {
    saveCurrentScrollPosition();
    if (currentChapter > 1) {
      onChapterChange(currentChapter - 1);
    } else {
      const bookIndex = BIBLE_BOOKS.findIndex((b) => b.id === currentBook.id);
      if (bookIndex > 0) {
        const prevBook = BIBLE_BOOKS[bookIndex - 1];
        onBookChange(prevBook);
        onChapterChange(prevBook.chapterCount);
      }
    }
  };

  const handleNextChapter = () => {
    saveCurrentScrollPosition();
    if (currentChapter < currentBook.chapterCount) {
      onChapterChange(currentChapter + 1);
    } else {
      const bookIndex = BIBLE_BOOKS.findIndex((b) => b.id === currentBook.id);
      if (bookIndex < BIBLE_BOOKS.length - 1) {
        const nextBook = BIBLE_BOOKS[bookIndex + 1];
        onBookChange(nextBook);
        onChapterChange(1);
      }
    }
  };

  const stripVersePrefix = (text: string): string => {
    if (!text) return '';
    return text.replace(/^([가-힣a-zA-Z0-9]+\s*)?\d+[:\.]\d+[\s:\.\-]+\s*/, '').trim();
  };

  const getVerseTextForTranslation = (verse: Verse, transId: string): string => {
    if (!verse || !verse.text) return '';
    // 1. Direct match by exact transId key
    if (verse.text[transId as TranslationId] !== undefined) return verse.text[transId as TranslationId];
    // 2. Direct match by trimmed transId
    const trimmed = transId.trim();
    if (verse.text[trimmed as TranslationId] !== undefined) return verse.text[trimmed as TranslationId];
    // 3. Case-insensitive / normalized key search in verse.text
    const targetNorm = trimmed.toLowerCase();
    const foundKey = Object.keys(verse.text).find(
      (k) => k.trim().toLowerCase() === targetNorm
    );
    if (foundKey && verse.text[foundKey as TranslationId] !== undefined) {
      return verse.text[foundKey as TranslationId];
    }
    // 4. Fallback to HKJV or first available value
    return verse.text['HKJV'] || Object.values(verse.text)[0] || '';
  };

  const copyVersesFormatted = (selectedList: Verse[]) => {
    if (selectedList.length === 0) return;
    const sorted = [...selectedList].sort((a, b) => a.number - b.number);
    const formatMode = readerSettings.copyFormat || 'verse_break';
    const shortBook = currentBook.shortName || currentBook.name;

    let formatted = '';
    if (formatMode === 'continuous') {
      // 2. 단락 연속형 복사 (한 줄 연속 문단)
      formatted = sorted
        .map((verse) => {
          const rawText = verse.text[activeTranslations[0]] || Object.values(verse.text)[0] || '';
          const text = stripVersePrefix(rawText);
          return `${verse.number}. ${text}`;
        })
        .join(' ');
    } else if (formatMode === 'with_ref') {
      // 3. 출처 자동명시 (예: [창세기 1:1] 태초에...)
      formatted = sorted
        .map((verse) => {
          const rawText = verse.text[activeTranslations[0]] || Object.values(verse.text)[0] || '';
          const text = stripVersePrefix(rawText);
          return `[${shortBook} ${currentChapter}:${verse.number}] ${text}`;
        })
        .join('\n');
    } else {
      // 1. 절번+줄바꿈유지 (기본)
      formatted = sorted
        .map((verse) => {
          const rawText = verse.text[activeTranslations[0]] || Object.values(verse.text)[0] || '';
          const text = stripVersePrefix(rawText);
          return `${verse.number}. ${text}`;
        })
        .join('\n');
    }

    navigator.clipboard.writeText(formatted);
    setShowCopyToast(true);
    setTimeout(() => setShowCopyToast(false), 2500);
  };

  // Helper to render verse text with blue highlighting for Strong's Code words & Dictionary terms
  const renderHighlightedVerseText = (
    verseText: string,
    verse: Verse,
    transId: TranslationId
  ) => {
    if (!verseText) return <span>{verseText}</span>;

    // First, process <i>...</i> italic tags and {note} brackets into readable JSX if present
    const cleanVerseText = verseText;

    // Check for inline Strong's tags like <H1234>, <G5678>, {H1234}, [H1234] in text
    const inlineTagRegex = /(<[HG]?\d+>|\{[HG]?\d+\}|\[[HG]?\d+\]|<i>.*?<\/i>|\{.*?\})/gi;
    if (inlineTagRegex.test(cleanVerseText)) {
      const parts = cleanVerseText.split(/(<[HG]?\d+>|\{[HG]?\d+\}|\[[HG]?\d+\]|<i>.*?<\/i>|\{.*?\})/g);
      return (
        <span>
          {parts.map((part, i) => {
            if (/^<i>(.*?)<\/i>$/i.test(part)) {
              const inner = part.replace(/<\/?i>/gi, '');
              return (
                <i key={i} className="italic text-zinc-600 dark:text-zinc-400 font-serif mx-0.5">
                  {inner}
                </i>
              );
            }
            if (/^\{.*?\}$/.test(part)) {
              return (
                <span key={i} className="text-[11px] text-amber-700 dark:text-amber-300 font-bold bg-amber-500/10 border border-amber-500/20 rounded px-1 mx-0.5 inline-block">
                  {part}
                </span>
              );
            }
            const isTag = /^(<[HG]?\d+>|\{[HG]?\d+\}|\[[HG]?\d+\])$/i.test(part);
            if (isTag) {
              const codeDigits = part.replace(/[^\d]/g, '');
              const isGreek = part.toUpperCase().includes('G');
              const cleanCode = isGreek ? `G${codeDigits}` : `H${codeDigits}`;
              return (
                <span
                  key={i}
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenDictionary(cleanCode, true);
                  }}
                  className="text-blue-600 dark:text-blue-400 text-[11px] font-mono font-bold bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800 rounded px-1 mx-0.5 cursor-pointer hover:bg-blue-100 transition-all inline-block align-middle"
                  title={`스트롱코드 #${cleanCode} 원어 사전 보기`}
                >
                  {cleanCode}
                </span>
              );
            }
            return <React.Fragment key={i}>{part}</React.Fragment>;
          })}
        </span>
      );
    }

    const strongs = verse.strongs || [];
    const dictTerms = verse.dictionaryTerms || [];

    interface TargetMatch {
      word: string;
      type: 'strong' | 'dict';
      codeOrId: string;
    }

    const matches: TargetMatch[] = [];

    // Global Key Bible Terms for Old & New Testament support
    const GLOBAL_BIBLE_TERMS: Array<{ word: string; code: string; type: 'strong' | 'dict' }> = [
      // New Testament Key Terms (Greek)
      { word: '예수', code: 'G2424', type: 'strong' },
      { word: '그리스도', code: 'G5547', type: 'strong' },
      { word: '성령', code: 'G4151', type: 'strong' },
      { word: '성령님', code: 'G4151', type: 'strong' },
      { word: '말씀', code: 'G3056', type: 'strong' },
      { word: '로고스', code: 'G3056', type: 'strong' },
      { word: '믿음', code: 'G4102', type: 'strong' },
      { word: '은혜', code: 'G5485', type: 'strong' },
      { word: '사랑', code: 'G26', type: 'strong' },
      { word: '바울', code: 'paul', type: 'dict' },
      { word: '사울', code: 'paul', type: 'dict' },
      { word: '사도', code: 'G652', type: 'strong' },
      { word: '제자', code: 'G3101', type: 'strong' },
      { word: '복음', code: 'G2098', type: 'strong' },
      { word: '구원', code: 'G4991', type: 'strong' },
      { word: '영생', code: 'G166', type: 'strong' },
      { word: '천국', code: 'G932', type: 'strong' },
      { word: '하나님', code: 'H430', type: 'strong' },
      { word: '여호와', code: 'H3068', type: 'strong' },
      { word: '주님', code: 'G2962', type: 'strong' },
      { word: '목격자', code: 'G845', type: 'strong' },
      { word: '사역자', code: 'G5257', type: 'strong' },
      { word: '저술하려고', code: 'G392', type: 'strong' },

      // Old Testament Key Terms (Hebrew)
      { word: '태초에', code: 'H7218', type: 'strong' },
      { word: '처음에', code: 'H7218', type: 'strong' },
      { word: '창조하시니라', code: 'H1254', type: 'strong' },
      { word: '창조', code: 'H1254', type: 'strong' },
      { word: '빛', code: 'H216', type: 'strong' },
      { word: '아브라함', code: 'abraham', type: 'dict' },
      { word: '가나안', code: 'canaan', type: 'dict' },
      { word: '벧엘', code: 'bethel', type: 'dict' },
      { word: '세켐', code: 'shechem', type: 'dict' },
      { word: '헤세드', code: 'hesed', type: 'dict' },
      { word: '모세', code: 'moses', type: 'dict' },
    ];

    GLOBAL_BIBLE_TERMS.forEach((gt) => {
      if (gt.word && verseText.includes(gt.word)) {
        matches.push({ word: gt.word, type: gt.type, codeOrId: gt.code });
      }
    });

    strongs.forEach((st) => {
      if (st.word && verseText.includes(st.word) && !matches.some((m) => m.word === st.word)) {
        matches.push({ word: st.word, type: 'strong', codeOrId: st.code });
      }
    });
    dictTerms.forEach((dt) => {
      if (dt.term && verseText.includes(dt.term) && !matches.some((m) => m.word === dt.term)) {
        matches.push({ word: dt.term, type: 'dict', codeOrId: dt.dictionaryId });
      }
    });

    if (matches.length === 0) {
      return <span>{verseText}</span>;
    }

    // Sort longest words first to prevent partial overlaps
    matches.sort((a, b) => b.word.length - a.word.length);

    const escapedWords = matches.map((m) => m.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const regex = new RegExp(`(${escapedWords.join('|')})`, 'g');

    const parts = verseText.split(regex);

    return (
      <span>
        {parts.map((part, i) => {
          const matchObj = matches.find((m) => m.word === part);
          if (matchObj) {
            const isStrong = matchObj.type === 'strong';
            return (
              <span
                key={i}
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenDictionary(matchObj.codeOrId, isStrong);
                }}
                className="text-[#0284c7] dark:text-[#38bdf8] font-extrabold hover:bg-sky-100/50 dark:hover:bg-sky-950/60 rounded px-0.5 cursor-pointer transition-all inline-block my-0.5 shadow-2xs"
                title={
                  isStrong
                    ? `스트롱코드 #${matchObj.codeOrId} 원어 사전 보기 (Word Study)`
                    : `성경 사전 보기`
                }
              >
                {part}
              </span>
            );
          }
          return <React.Fragment key={i}>{part}</React.Fragment>;
        })}
      </span>
    );
  };

  return (
    <div className="space-y-1 sm:space-y-2">
      {/* Top Bible Navigation & Parallel Translation Selectors Bar */}
      <div className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-1.5 sm:gap-2 p-1.5 sm:p-3 rounded-none sm:rounded-2xl bg-[#0f172a]/95 text-slate-100 border-b sm:border border-slate-800 shadow-md backdrop-blur-md">
        {/* Row 1: Bible Translation Selection & Parallel Comparison Controls (Small Compact Size) */}
        <div className="flex flex-wrap items-center gap-1.5 shrink-0 max-w-full">
          {activeTranslations.slice(0, columnCount).map((transId, idx) => (
            <div
              key={idx}
              className="flex items-center gap-1 bg-[#38bdf8] text-[#0f172a] font-extrabold px-2 py-1.5 rounded-xl border border-sky-300 shadow-xs shrink-0 max-w-[110px] sm:max-w-[125px]"
            >
              {columnCount > 1 && (
                <span className="text-xs font-black text-slate-900 shrink-0">
                  {idx + 1}:
                </span>
              )}
              <select
                value={transId}
                onChange={(e) => handleTranslationChange(idx, e.target.value as TranslationId)}
                className="bg-transparent text-xs sm:text-sm font-extrabold cursor-pointer focus:outline-none w-full truncate text-[#0f172a]"
              >
                {availableTranslations.map((t) => (
                  <option
                    key={t.id}
                    value={t.id}
                    className="bg-slate-900 text-slate-100 font-bold text-xs"
                  >
                    {t.name}
                  </option>
                ))}
              </select>

              {columnCount > 1 && idx > 0 && (
                <button
                  onClick={() => setColumnCount((prev) => Math.max(1, prev - 1))}
                  className="ml-0.5 text-slate-900 hover:text-red-700 p-0.5 rounded transition-colors cursor-pointer shrink-0"
                  title="대조 컬럼 삭제"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}

          {columnCount < 4 && (
            <button
              onClick={() => setColumnCount((prev) => Math.min(4, prev + 1))}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-700 hover:border-sky-400 bg-[#1e293b] text-sky-300 hover:text-white text-xs font-extrabold transition-all cursor-pointer shrink-0 whitespace-nowrap"
              title="대조 성경 추가 (최대 4개)"
            >
              <span>+ 대조 추가</span>
            </button>
          )}
        </div>

        {/* Row 2: Book & Chapter Pickers */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 relative" ref={dropdownRef}>
          {/* 구약 커스텀 드롭다운 버튼 */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenDropdown(openDropdown === 'OT' ? null : 'OT')}
              className={`py-1.5 px-3 sm:px-4 rounded-xl font-extrabold text-xs sm:text-sm flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${currentBook.testament === 'OT'
                ? 'bg-[#0284c7] text-white ring-2 ring-sky-400/40'
                : 'bg-[#1e293b] text-slate-200 hover:bg-[#334155] border border-slate-700'
                }`}
            >
              <span>{currentBook.testament === 'OT' ? `${currentBook.name} (${currentBook.chapterCount}장)` : '구약성경 (39권)'}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openDropdown === 'OT' ? 'rotate-180 text-sky-300' : ''}`} />
            </button>

            {/* 구약성경 (39권) 드롭다운 팝업 - 처음 1.창세기부터 아래로 죽 보임 */}
            {openDropdown === 'OT' && (
              <div className="absolute left-0 top-full mt-1.5 w-60 max-h-80 overflow-y-auto bg-white dark:bg-zinc-900 border border-amber-500/40 rounded-2xl shadow-2xl z-50 p-1.5 animate-in fade-in duration-150 scrollbar-thin">
                <div className="px-3 py-1.5 text-[11px] font-extrabold text-amber-700 dark:text-amber-400 border-b border-zinc-100 dark:border-zinc-800 mb-1 sticky top-0 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xs flex items-center justify-between">
                  <span>📜 구약성경 (39권 목록)</span>
                  <span className="text-[10px] text-zinc-400">1.창세기 ~ 39.말라기</span>
                </div>
                {BIBLE_BOOKS.filter((b) => b.testament === 'OT').map((b, idx) => {
                  const isSelected = currentBook.id === b.id;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => {
                        saveCurrentScrollPosition();
                        onBookChange(b);
                        onChapterChange(1);
                        setOpenDropdown(null);
                      }}
                      className={`w-full px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer text-left ${isSelected
                        ? 'bg-amber-500 text-white font-extrabold shadow-xs'
                        : 'hover:bg-amber-500/10 text-zinc-800 dark:text-zinc-200'
                        }`}
                    >
                      <span>
                        <span className="text-zinc-400 font-mono mr-1.5">{idx + 1}.</span>
                        {b.name}
                      </span>
                      <span className={`text-[10px] ${isSelected ? 'text-white' : 'text-amber-600 dark:text-amber-400'}`}>
                        {b.chapterCount}장
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 신약 커스텀 드롭다운 버튼 */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenDropdown(openDropdown === 'NT' ? null : 'NT')}
              className={`py-1.5 px-3 sm:px-4 rounded-xl font-extrabold text-xs sm:text-sm flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${currentBook.testament === 'NT'
                ? 'bg-[#0284c7] text-white ring-2 ring-sky-400/40'
                : 'bg-[#1e293b] text-slate-200 hover:bg-[#334155] border border-slate-700'
                }`}
            >
              <span>{currentBook.testament === 'NT' ? `${currentBook.name} (${currentBook.chapterCount}장)` : '신약성경 (27권)'}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openDropdown === 'NT' ? 'rotate-180 text-sky-300' : ''}`} />
            </button>

            {/* 신약성경 (27권) 드롭다운 팝업 - 처음 1.마태복음부터 아래로 죽 보임 */}
            {openDropdown === 'NT' && (
              <div className="absolute left-0 top-full mt-1.5 w-60 max-h-80 overflow-y-auto bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-50 p-1.5 animate-in fade-in duration-150 scrollbar-thin text-slate-100">
                <div className="px-3 py-1.5 text-[11px] font-extrabold text-sky-400 border-b border-slate-800 mb-1 sticky top-0 bg-slate-900/95 backdrop-blur-xs flex items-center justify-between">
                  <span>✝️ 신약성경 (27권 목록)</span>
                  <span className="text-[10px] text-slate-400">1.마태복음 ~ 27.요한계시록</span>
                </div>
                {BIBLE_BOOKS.filter((b) => b.testament === 'NT').map((b, idx) => {
                  const isSelected = currentBook.id === b.id;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => {
                        saveCurrentScrollPosition();
                        onBookChange(b);
                        onChapterChange(1);
                        setOpenDropdown(null);
                      }}
                      className={`w-full px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer text-left ${isSelected
                        ? 'bg-[#0284c7] text-white font-extrabold shadow-xs'
                        : 'hover:bg-slate-800 text-slate-200'
                        }`}
                    >
                      <span>
                        <span className="text-slate-400 font-mono mr-1.5">{idx + 1}.</span>
                        {b.name}
                      </span>
                      <span className={`text-[10px] ${isSelected ? 'text-white' : 'text-sky-400'}`}>
                        {b.chapterCount}장
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 장 선택 커스텀 드롭다운 버튼 */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setOpenDropdown(openDropdown === 'chapter' ? null : 'chapter')}
              className="py-1.5 px-3 rounded-xl border border-slate-700 bg-[#334155] text-slate-100 font-black text-xs sm:text-sm flex items-center gap-1 cursor-pointer shadow-xs font-mono hover:bg-slate-600 transition-colors"
            >
              <span>{currentChapter}장</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openDropdown === 'chapter' ? 'rotate-180 text-sky-300' : ''}`} />
            </button>

            {/* 장 선택 드롭다운 팝업 - 1장부터 아래로 죽 보임 */}
            {openDropdown === 'chapter' && (
              <div className="absolute right-0 top-full mt-1.5 w-48 max-h-72 overflow-y-auto bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-2xl shadow-2xl z-50 p-2 animate-in fade-in duration-150 scrollbar-thin">
                <div className="px-2 py-1 text-[11px] font-extrabold text-zinc-500 border-b border-zinc-100 dark:border-zinc-800 mb-1 sticky top-0 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xs">
                  {currentBook.name} 장 선택 (1~{currentBook.chapterCount}장)
                </div>
                <div className="grid grid-cols-4 gap-1 pt-1">
                  {Array.from({ length: currentBook.chapterCount }).map((_, i) => {
                    const chNum = i + 1;
                    const isSelected = currentChapter === chNum;
                    return (
                      <button
                        key={chNum}
                        type="button"
                        onClick={() => {
                          saveCurrentScrollPosition();
                          onChapterChange(chNum);
                          setOpenDropdown(null);
                        }}
                        className={`py-1.5 rounded-lg text-xs font-extrabold font-mono transition-all cursor-pointer text-center ${isSelected
                          ? 'bg-amber-500 text-white shadow-xs scale-105'
                          : 'hover:bg-amber-500/10 text-zinc-800 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800'
                          }`}
                      >
                        {chNum}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Scripture Passage View Area (Full Vertical Scroll & Horizontal Touch Swipe) */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className={`p-2 sm:p-5 rounded-none sm:rounded-xl border-y sm:border shadow-xs min-h-[400px] ${themeClasses} ${fontFamilyClasses} select-text relative transition-opacity duration-200 ${isSwipingSmoothly ? 'opacity-50' : 'opacity-100'
          }`}
      >
        {/* Chapter Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-current/15 mb-3 select-none">
          <button
            type="button"
            onClick={handleOpenBookIntro}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-extrabold text-xs shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
            title={`${currentBook.name} 서론 및 개요 보기 (편집 가능)`}
          >
            <BookOpen className="w-4 h-4 shrink-0" />
            <span>서론</span>
          </button>

          <div className="text-center">
            <h2 className="text-base sm:text-lg font-extrabold tracking-tight font-serif flex items-center gap-1.5 justify-center">
              <span>{currentBook.name}</span>
              <span className="text-amber-600 dark:text-amber-400 font-mono">{currentChapter}장</span>
              {isChapterRead ? (
                <span className="ml-1 px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  읽음 ✓
                </span>
              ) : (
                <span className="ml-1 px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
                  읽지않음
                </span>
              )}
            </h2>
          </div>

        </div>

        {/* Scripture Verses Grid */}
        <div className="space-y-2">
          {verses.map((verse) => {
            const isHighlighted = highlights.find(
              (h) =>
                h.bookId === currentBook.id &&
                h.chapter === currentChapter &&
                h.verseNumber === verse.number
            );
            const isBookmarked = bookmarks.some(
              (b) =>
                b.bookId === currentBook.id &&
                b.chapter === currentChapter &&
                b.verseNumber === verse.number
            );

            const highlightStyle = isHighlighted
              ? {
                yellow: 'bg-yellow-200/80 text-yellow-950 dark:bg-yellow-500/30 dark:text-yellow-100',
                green: 'bg-emerald-200/80 text-emerald-950 dark:bg-emerald-500/30 dark:text-emerald-100',
                blue: 'bg-sky-200/80 text-sky-950 dark:bg-sky-500/30 dark:text-sky-100',
                pink: 'bg-pink-200/80 text-pink-950 dark:bg-pink-500/30 dark:text-pink-100',
                purple: 'bg-purple-200/80 text-purple-950 dark:bg-purple-500/30 dark:text-purple-100',
              }[isHighlighted.color]
              : '';

            const isSelected = selectedVerses.some((v) => v.number === verse.number);
            const isAudioCurrentVerse = audioState?.isPlaying && (audioState?.currentVerseIndex + 1) === verse.number;
            const audioActiveStyle = isAudioCurrentVerse ? 'ring-2 ring-amber-400 dark:ring-amber-500 bg-amber-400/20 dark:bg-amber-400/15 shadow-md scale-[1.01]' : '';
            const selectionStyle = isSelected ? 'ring-2 ring-amber-500 bg-amber-500/10 dark:bg-amber-500/5' : '';

            return (
              <div id={`v-${verse.number}`} key={verse.number} className="space-y-1.5 transition-transform duration-300">
                <div
                  className={`p-1 sm:p-1.5 rounded-lg transition-all cursor-pointer group hover:bg-black/5 dark:hover:bg-white/5 relative ${highlightStyle} ${selectionStyle} ${audioActiveStyle}`}
                  onClick={() => {
                    setSelectedVerses((prev) => {
                      const exists = prev.some((v) => v.number === verse.number);
                      if (exists) {
                        return prev.filter((v) => v.number !== verse.number);
                      } else {
                        return [...prev, verse].sort((a, b) => a.number - b.number);
                      }
                    });
                  }}
                >
                  <div
                    className={`grid gap-1.5 sm:gap-3 ${columnCount === 1
                      ? 'grid-cols-1'
                      : columnCount === 2
                        ? 'grid-cols-2'
                        : columnCount === 3
                          ? 'grid-cols-1 sm:grid-cols-3'
                          : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
                      }`}
                  >
                    {activeTranslations.slice(0, columnCount).map((transId, colIdx) => {
                      const rawVerseText = getVerseTextForTranslation(verse, transId);
                      const verseText = stripVersePrefix(rawVerseText);

                      return (
                        <div
                          key={`${transId}-${colIdx}`}
                          className={`${fontSizeClasses} ${lineHeightClasses} ${letterSpacingClasses}`}
                        >
                          {/* Verse Number (Image 1 Sky Blue Color) */}
                          {readerSettings.showVerseNumbers && (
                            <span className="font-mono font-black text-[#0284c7] dark:text-[#38bdf8] mr-2 text-xs sm:text-sm select-none">
                              {verse.number}
                            </span>
                          )}

                          {/* Verse Text */}
                          {renderHighlightedVerseText(verseText, verse, transId as TranslationId)}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Inline Saved Memo Display */}
                {isHighlighted?.note && editingMemoVerseNumber !== verse.number && (
                  <div className="ml-6 mr-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2 shadow-xs group">
                    <span className="text-amber-600 mt-0.5 font-bold shrink-0">📝 메모:</span>
                    <div className="flex-1 whitespace-pre-wrap leading-relaxed">{isHighlighted.note}</div>
                    <div className="flex items-center gap-1.5 shrink-0 select-none">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingMemoVerseNumber(verse.number);
                          setMemoInputText(isHighlighted.note || '');
                        }}
                        className="px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-800 dark:text-amber-200 hover:bg-amber-500/30 transition-colors text-[10px] font-bold cursor-pointer"
                        title="메모 수정"
                      >
                        수정
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onSaveVerseNote) {
                            onSaveVerseNote(currentBook.id, currentChapter, verse.number, '');
                          }
                        }}
                        className="px-2 py-0.5 rounded-lg bg-red-500/20 text-red-600 dark:text-red-300 hover:bg-red-500/30 transition-colors text-[10px] font-bold cursor-pointer"
                        title="메모 삭제"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                )}

                {/* Inline Memo Editor Box */}
                {editingMemoVerseNumber === verse.number && (
                  <div className="ml-6 mr-2 p-3.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 shadow-lg space-y-2.5">
                    <div className="text-xs font-bold text-zinc-600 dark:text-zinc-400 flex items-center justify-between">
                      <span>✍️ {currentBook.name} {currentChapter}장 {verse.number}절 메모 작성</span>
                      <button
                        onClick={() => setEditingMemoVerseNumber(null)}
                        className="text-zinc-400 hover:text-zinc-600"
                      >
                        닫기
                      </button>
                    </div>
                    <textarea
                      value={memoInputText}
                      onChange={(e) => setMemoInputText(e.target.value)}
                      placeholder="이 구절에 대한 은혜로운 묵상이나 메모를 남겨보세요..."
                      className="w-full min-h-[70px] p-2.5 text-xs rounded-xl border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 focus:ring-1 focus:ring-amber-500 focus:border-amber-500 resize-y"
                    />
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => setEditingMemoVerseNumber(null)}
                        className="px-3 py-1.5 rounded-lg bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 text-xs font-bold transition-colors cursor-pointer"
                      >
                        취소
                      </button>
                      <button
                        onClick={() => {
                          if (onSaveVerseNote) {
                            onSaveVerseNote(currentBook.id, currentChapter, verse.number, memoInputText);
                          }
                          setEditingMemoVerseNumber(null);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors cursor-pointer"
                      >
                        메모 저장
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom Compact Read/Unread & Top Bar */}
        <div className="mt-6 pt-4 border-t border-dashed border-current/20 flex flex-wrap items-center justify-between gap-2.5 p-2.5 sm:p-3 rounded-2xl bg-zinc-500/5 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-700/60 transition-all">
          <button
            type="button"
            onClick={toggleChapterRead}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer shadow-xs active:scale-95 ${isChapterRead
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
              : 'bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-200'
              }`}
            title={isChapterRead ? '클릭하여 읽지않음 상태로 변경' : '클릭하여 읽었음으로 표시'}
          >
            <CheckCircle2 className={`w-4 h-4 ${isChapterRead ? 'text-white' : 'text-zinc-400'}`} />
            <span>{currentBook.name} {currentChapter}장 {isChapterRead ? '읽었음 (완료)' : '읽었음으로 표시'}</span>
          </button>

          <button
            type="button"
            onClick={handleScrollToTop}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-200/80 hover:bg-amber-600 hover:text-white dark:bg-zinc-700/80 dark:hover:bg-amber-600 dark:hover:text-white font-bold text-xs text-zinc-700 dark:text-zinc-200 transition-all cursor-pointer active:scale-95 shrink-0"
            title="성경 본문 맨 위로 가기"
          >
            <ArrowUp className="w-3.5 h-3.5" />
            <span>맨 위로 가기</span>
          </button>
        </div>

        {/* Data Error Report Link */}
        <div className="mt-3 flex items-center justify-center">
          <button
            onClick={() => setShowErrorReportModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-500 hover:text-amber-600 dark:text-zinc-400 dark:hover:text-amber-400 hover:bg-amber-500/10 transition-all cursor-pointer"
            title="성경 텍스트 오탈자 및 데이터 오류 제보"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            <span>⚠️ 데이터 오류 제보 및 수정 요청</span>
          </button>
        </div>

      </div>

      {/* Draggable Floating Audio Speaker Button (Move anywhere by dragging!) */}
      {onToggleAudioPlayer && (
        <div
          style={
            floatingPos
              ? { left: `${floatingPos.x}px`, top: `${floatingPos.y}px`, right: 'auto', bottom: 'auto' }
              : {}
          }
          className={
            floatingPos
              ? 'fixed z-60 touch-none select-none'
              : 'fixed bottom-28 right-4 sm:bottom-32 sm:right-6 z-60 touch-none select-none'
          }
        >
          <button
            type="button"
            onTouchStart={handleSpeakerTouchStart}
            onTouchMove={handleSpeakerTouchMove}
            onTouchEnd={handleSpeakerTouchEnd}
            onMouseDown={handleSpeakerMouseDown}
            onMouseMove={handleSpeakerMouseMove}
            onMouseUp={handleSpeakerMouseUp}
            style={{ touchAction: 'none' }}
            className={`p-2 sm:p-2.5 rounded-full flex items-center gap-1 shadow-lg transition-all cursor-move border border-white dark:border-slate-800 ${audioState?.isPlaying
              ? 'bg-amber-500 text-zinc-950 ring-2 ring-amber-500/50 animate-pulse shadow-amber-500/60'
              : 'bg-[#0284c7] hover:bg-sky-500 text-white shadow-sky-600/40'
              }`}
            title="드래그하여 원하는 위치로 이동 / 클릭하여 성경 오디오 재생"
          >
            <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 pointer-events-none" />
            <span className="text-[10px] font-black pr-0.5 hidden sm:inline pointer-events-none">
              {audioState?.isPlaying ? '낭독 중' : '오디오'}
            </span>
          </button>
        </div>
      )}



      {/* Selected Verse Actions Popup Drawer */}
      {selectedVerses.length > 0 && (() => {
        // Find if the first selected verse has a highlight color as a reference
        const refVerse = selectedVerses[0];
        const currentVerseHighlight = highlights.find(
          (h) =>
            h.bookId === currentBook.id &&
            h.chapter === currentChapter &&
            h.verseNumber === refVerse.number
        );

        return (
          <div className="fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-xl px-4 animate-in slide-in-from-bottom duration-200">
            <div className="p-4 rounded-2xl bg-zinc-900 text-white shadow-2xl border border-zinc-700 flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <span className="text-xs font-bold text-amber-400">
                  {currentBook.name} {currentChapter}장 {selectedVerses.map(v => v.number).join(', ')}절 선택됨 ({selectedVerses.length}개 절)
                </span>
                <button
                  onClick={() => setSelectedVerses([])}
                  className="text-xs text-zinc-400 hover:text-white cursor-pointer"
                >
                  선택 해제 (닫기)
                </button>
              </div>

              {/* Quick Action Tools */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                {/* Highlight colors */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-zinc-400 text-[11px] font-bold mr-0.5">형광펜:</span>
                  {(
                    [
                      'yellow',
                      'green',
                      'blue',
                      'pink',
                      'purple',
                    ] as UserHighlight['color'][]
                  ).map((color) => {
                    const isSelectedColor = currentVerseHighlight?.color === color;
                    return (
                      <button
                        key={color}
                        onClick={() => {
                          selectedVerses.forEach((verse) => {
                            onToggleHighlight(
                              currentBook.id,
                              currentChapter,
                              verse.number,
                              color
                            );
                          });
                        }}
                        title={`${color} 형광펜 일괄 적용`}
                        className={`w-6 h-6 rounded-full border transition-all flex items-center justify-center cursor-pointer ${isSelectedColor
                          ? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-900 scale-110 border-transparent shadow-md'
                          : 'border-white/30 hover:scale-110 opacity-80 hover:opacity-100'
                          } ${color === 'yellow'
                            ? 'bg-yellow-400'
                            : color === 'green'
                              ? 'bg-emerald-400'
                              : color === 'blue'
                                ? 'bg-sky-400'
                                : color === 'pink'
                                  ? 'bg-pink-400'
                                  : 'bg-purple-400'
                          }`}
                      >
                        {isSelectedColor && <Check className="w-3.5 h-3.5 text-zinc-950 font-black" />}
                      </button>
                    );
                  })}

                  {/* Explicit Clear Highlight Color Button */}
                  {currentVerseHighlight && (
                    <button
                      onClick={() => {
                        selectedVerses.forEach((verse) => {
                          const vHighlight = highlights.find(
                            (h) =>
                              h.bookId === currentBook.id &&
                              h.chapter === currentChapter &&
                              h.verseNumber === verse.number
                          );
                          if (vHighlight) {
                            onToggleHighlight(
                              currentBook.id,
                              currentChapter,
                              verse.number,
                              vHighlight.color
                            );
                          }
                        });
                      }}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 text-[11px] font-extrabold ml-1 transition-all active:scale-95 cursor-pointer"
                      title="선택 구절 색상 지우기"
                    >
                      <X className="w-3.5 h-3.5 text-red-400" />
                      <span>색 지우기</span>
                    </button>
                  )}
                </div>

                {/* Bookmark toggle */}
                <button
                  onClick={() => {
                    selectedVerses.forEach((verse) => {
                      onToggleBookmark(
                        currentBook.id,
                        currentChapter,
                        verse.number
                      );
                    });
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium cursor-pointer"
                >
                  <Bookmark className="w-3.5 h-3.5 text-amber-400" />
                  <span>북마크</span>
                </button>

                {/* Inline Memo edit trigger button */}
                <button
                  onClick={() => {
                    const targetVerse = selectedVerses[0];
                    if (targetVerse) {
                      setEditingMemoVerseNumber(targetVerse.number);
                      const existing = highlights.find(
                        (h) =>
                          h.bookId === currentBook.id &&
                          h.chapter === currentChapter &&
                          h.verseNumber === targetVerse.number
                      );
                      setMemoInputText(existing?.note || '');
                    }
                    setSelectedVerses([]);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium cursor-pointer"
                  title="선택 구절에 메모 쓰기"
                >
                  <FileText className="w-3.5 h-3.5 text-amber-400" />
                  <span>메모</span>
                </button>

                {/* Smart Copy */}
                <button
                  onClick={() => {
                    copyVersesFormatted(selectedVerses);
                    setSelectedVerses([]);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5 text-amber-400" />
                  <span>정식 복사</span>
                </button>

                {/* Verse Error Report Button */}
                <button
                  onClick={() => setShowErrorReportModal(true)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 font-medium cursor-pointer"
                  title="오류 제보"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                  <span>오류 제보</span>
                </button>



                {/* Verse Card Generator Link */}
                <button
                  onClick={() => {
                    const sorted = [...selectedVerses].sort((a, b) => a.number - b.number);
                    const shortBook = currentBook.shortName || currentBook.name;
                    const ref = `${shortBook} ${currentChapter}:${sorted.map(v => v.number).join(',')}`;
                    const formatMode = readerSettings.copyFormat || 'verse_break';

                    let text = '';
                    if (formatMode === 'continuous') {
                      text = sorted
                        .map(v => `${v.number}. ${stripVersePrefix(v.text['KRV'] || Object.values(v.text)[0] || '')}`)
                        .join(' ');
                    } else if (formatMode === 'with_ref') {
                      text = sorted
                        .map(v => `[${shortBook} ${currentChapter}:${v.number}] ${stripVersePrefix(v.text['KRV'] || Object.values(v.text)[0] || '')}`)
                        .join('\n');
                    } else {
                      text = sorted
                        .map(v => `${v.number}. ${stripVersePrefix(v.text['KRV'] || Object.values(v.text)[0] || '')}`)
                        .join('\n');
                    }
                    onCreateVerseCard(text, ref);
                    setSelectedVerses([]);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500 text-zinc-950 font-bold hover:bg-amber-400 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>말씀 카드 만들기</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Copy Toast Banner */}
      {showCopyToast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-amber-500 text-zinc-950 font-bold shadow-lg flex items-center gap-2 text-xs animate-in fade-in zoom-in duration-150">
          <Check className="w-4 h-4" />
          <span>성경 구절과 출처가 클립보드에 깔끔하게 복사되었습니다.</span>
        </div>
      )}

      {/* Error Report Modal */}
      <ErrorReportModal
        isOpen={showErrorReportModal}
        onClose={() => setShowErrorReportModal(false)}
        currentBook={currentBook}
        currentChapter={currentChapter}
        selectedVerseNum={selectedVerses[0]?.number}
      />

      {/* Book Introduction Modal */}
      <BookIntroModal
        isOpen={isBookIntroOpen}
        onClose={handleCloseBookIntro}
        currentBook={currentBook}
      />

      {/* Bible Study Integration Drawer Panel (Full Screen Panel above bottom nav) */}
      {isStudyPanelOpen && studyPanelVerse && (
        <div className="fixed inset-x-0 top-0 bottom-14 md:bottom-0 z-50 animate-in slide-in-from-bottom duration-200 bg-zinc-950/98 text-white flex flex-col shadow-2xl">
          <div className="w-full h-full flex flex-col pointer-events-auto">
            {/* Top Drag Handle Indicator Bar for Resizing */}
            <div
              ref={dragHandleRef}
              onMouseDown={(e) => handleHeightDragStart(e.clientY)}
              onTouchStart={(e) => handleHeightDragStart(e.touches[0].clientY)}
              className="w-full h-5 flex items-center justify-center cursor-ns-resize shrink-0 select-none group/handle bg-zinc-950/20 hover:bg-zinc-950/50 border-b border-zinc-800/30 transition-colors"
              title="위아래로 드래그하여 높이 조절"
            >
              <div className="w-12 h-1 rounded-full bg-zinc-600 group-hover/handle:bg-amber-500 transition-colors" />
            </div>

            {/* Sticky Fixed Drawer Header Container (Title + Tabs) */}
            <div className="sticky top-0 z-20 bg-zinc-950/98 backdrop-blur-md shrink-0">
              {/* Drawer Header */}
              <div className="px-5 py-3 border-b border-zinc-800/80 flex items-center justify-between select-none">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded-lg bg-amber-500/10 text-amber-500 font-extrabold text-xs">📖 성경연구</span>
                  <h3 className="text-sm font-black text-amber-400">
                    {currentBook.name} {currentChapter}장 {studyPanelVerse.number}절
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setIsStudyPanelOpen(false);
                    setStudyPanelVerse(null);
                  }}
                  className="p-1 rounded-full hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-white cursor-pointer"
                  title="연구 패널 닫기"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Tabs Navigation */}
              <div className="px-5 py-2.5 bg-zinc-950/90 border-b border-zinc-800/60 flex items-center gap-2 select-none">
                {(
                  [
                    { id: 'cross', label: '🔗 관련 관주' },
                    { id: 'manna', label: '💡 만나주석' },
                    { id: 'henry', label: '✍️ 매튜헨리' },
                  ] as const
                ).map((tab) => {
                  const isActive = activeStudyTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveStudyTab(tab.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${isActive
                        ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                        : 'bg-zinc-800/60 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                        }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Drawer Body (Content Load Area with Pinch Zoom support) */}
            <div
              onTouchStart={handleStudyTouchStart}
              onTouchMove={handleStudyTouchMove}
              onTouchEnd={handleStudyTouchEnd}
              className="flex-1 overflow-y-auto p-5 min-h-0 select-text"
              style={{ fontSize: `${studyFontSize}px` }}
            >
              {isStudyLoading ? (
                <div className="h-full flex flex-col items-center justify-center gap-2.5 py-12">
                  <div className="w-7 h-7 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs text-zinc-400 font-bold animate-pulse">SQLite 데이터베이스에서 데이터를 쿼리하는 중...</span>
                </div>
              ) : (
                <div className="h-full">
                  {activeStudyTab === 'cross' && renderCrossReferences(studyData.cross)}

                  {activeStudyTab === 'manna' && (
                    <div className="space-y-3 select-text pb-6">
                      {studyData.manna ? (
                        <div
                          style={{ fontSize: `${studyFontSize}px` }}
                          className="leading-relaxed text-zinc-200 whitespace-pre-wrap select-text"
                          dangerouslySetInnerHTML={{ __html: studyData.manna }}
                        />
                      ) : (
                        <div className="text-zinc-400 dark:text-zinc-500 text-xs py-6 text-center font-bold">만나주석 데이터가 존재하지 않습니다.</div>
                      )}
                    </div>
                  )}

                  {activeStudyTab === 'henry' && (
                    <div className="space-y-3 select-text pb-6">
                      {studyData.henry ? (
                        <div
                          style={{ fontSize: `${studyFontSize}px` }}
                          className="leading-relaxed text-zinc-200 whitespace-pre-wrap select-text"
                          dangerouslySetInnerHTML={{ __html: studyData.henry }}
                        />
                      ) : (
                        <div className="text-zinc-400 dark:text-zinc-500 text-xs py-6 text-center font-bold">매튜헨리주석 데이터가 존재하지 않습니다.</div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Study Modal (for Matthew Henry shortcut) */}
      {isStudyFullscreen && studyPanelVerse && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-start justify-center p-4">
          <div className="w-full h-full max-w-5xl bg-zinc-900 text-white rounded-md overflow-auto shadow-2xl border border-zinc-800/60">
            <div className="px-6 py-4 border-b border-zinc-800/70 flex items-center justify-between sticky top-0 bg-zinc-900/95 z-10">
              <div className="flex items-center gap-3">
                <span className="p-1 rounded-lg bg-amber-500/10 text-amber-500 font-extrabold text-sm">📖 성경연구</span>
                <h3 className="text-base font-black text-amber-400">
                  {currentBook.name} {currentChapter}장 {studyPanelVerse.number}절
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-2 py-1 bg-zinc-800/40 rounded-full">
                  {(
                    [
                      { id: 'cross', label: '🔗 관련 관주' },
                      { id: 'manna', label: '💡 만나주석' },
                      { id: 'henry', label: '✍️ 매튜헨리' },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveStudyTab(tab.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeStudyTab === tab.id
                        ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                        : 'bg-zinc-800/60 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                        }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => {
                    setIsStudyFullscreen(false);
                    setStudyPanelVerse(null);
                  }}
                  className="p-2 rounded-full hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-white"
                  title="닫기"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div
              onTouchStart={handleStudyTouchStart}
              onTouchMove={handleStudyTouchMove}
              onTouchEnd={handleStudyTouchEnd}
              className="p-6 select-text"
              style={{ fontSize: `${studyFontSize}px` }}
            >
              {isStudyLoading ? (
                <div className="h-96 flex flex-col items-center justify-center gap-2.5 py-12">
                  <div className="w-7 h-7 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-zinc-400 font-bold animate-pulse">데이터를 불러오는 중...</span>
                </div>
              ) : (
                <div className="prose prose-invert max-w-none leading-relaxed" style={{ fontSize: `${studyFontSize}px` }}>
                  {activeStudyTab === 'cross' && renderCrossReferences(studyData.cross)}

                  {activeStudyTab === 'manna' && (
                    <div>
                      {studyData.manna ? (
                        <div style={{ fontSize: `${studyFontSize}px` }} dangerouslySetInnerHTML={{ __html: studyData.manna }} />
                      ) : (
                        <div className="text-zinc-400 text-center py-12 font-bold">만나주석 데이터가 존재하지 않습니다.</div>
                      )}
                    </div>
                  )}

                  {activeStudyTab === 'henry' && (
                    <div>
                      {studyData.henry ? (
                        <div style={{ fontSize: `${studyFontSize}px` }} dangerouslySetInnerHTML={{ __html: studyData.henry }} />
                      ) : (
                        <div className="text-zinc-400 text-center py-12 font-bold">매튜헨리주석 데이터가 존재하지 않습니다.</div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
