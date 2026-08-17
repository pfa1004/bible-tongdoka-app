import React, { useState, useEffect } from 'react';
import {
  Book,
  PlanSettings,
  ReaderSettings,
  AudioPlayerState,
  UserHighlight,
  UserBookmark,
  PrayerNote,
  Hymn,
} from './types';
import { BIBLE_BOOKS, getChapterVerses } from './data/bibleData';
import { HYMNS } from './data/hymnData';
import { DICTIONARY_ENTRIES } from './data/dictionaryData';

import { Header } from './components/Header';
import { MobileBottomNav } from './components/MobileBottomNav';
import { PwaInstallBanner } from './components/PwaInstallBanner';
import { BibleTab } from './components/BibleTab';
import { HymnTab } from './components/HymnTab';
import { TodayWordTab } from './components/TodayWordTab';
import { MemoTab } from './components/MemoTab';
import { StudyLinksTab } from './components/StudyLinksTab';

import { ReaderSettingsModal } from './components/ReaderSettingsModal';
import { AudioPlayerBar } from './components/AudioPlayerBar';
import { DictionaryModal } from './components/DictionaryModal';
import { FourLawsModal } from './components/FourLawsModal';
import { PlanModal } from './components/PlanModal';
import { BibleBooksModal } from './components/BibleBooksModal';
import { BibleSearchModal } from './components/BibleSearchModal';
import { BdfImporterModal } from './components/BdfImporterModal';
import { AndroidAppModal } from './components/AndroidAppModal';
import { DailyNotificationModal } from './components/DailyNotificationModal';
import { BibleIntegrityModal } from './components/BibleIntegrityModal';
import {
  DesignStyleModal,
  DesignPresetId,
  DESIGN_PRESETS,
} from './components/DesignStyleModal';
import { FloatingSettingsButton } from './components/FloatingSettingsButton';

import { initCustomBibleStorage } from './utils/customBibleStorage';

export default function App() {
  // Navigation & Tab State
  const [activeTab, setActiveTab] = useState<'bible' | 'hymn' | 'today' | 'memo' | 'links'>('bible');

  // Active Passage State (loaded from localStorage to restore last viewed verse)
  const [currentBook, setCurrentBook] = useState<Book>(() => {
    try {
      const savedBookId = localStorage.getItem('bible_last_book_id');
      if (savedBookId) {
        const found = BIBLE_BOOKS.find((b) => b.id === savedBookId || b.name === savedBookId);
        if (found) return found;
      }
    } catch (e) { }
    return BIBLE_BOOKS[0]; // Genesis default
  });

  const [currentChapter, setCurrentChapter] = useState<number>(() => {
    try {
      const savedCh = localStorage.getItem('bible_last_chapter');
      if (savedCh) {
        const parsed = parseInt(savedCh, 10);
        if (!isNaN(parsed) && parsed > 0) return parsed;
      }
    } catch (e) { }
    return 1;
  });

  // Save last viewed passage to localStorage
  useEffect(() => {
    try {
      if (currentBook) {
        localStorage.setItem('bible_last_book_id', currentBook.id);
      }
      localStorage.setItem('bible_last_chapter', String(currentChapter));
    } catch (e) { }
  }, [currentBook, currentChapter]);

  // Attempt auto-fullscreen on app launch (and on first user interaction if blocked by browser policy)
  useEffect(() => {
    const enterFullscreen = () => {
      if (!document.fullscreenElement) {
        const docEl = document.documentElement as any;
        if (docEl.requestFullscreen) {
          docEl.requestFullscreen().catch(() => { });
        } else if (docEl.webkitRequestFullscreen) {
          docEl.webkitRequestFullscreen();
        }
      }
    };

    // 1. Immediate attempt on page load
    enterFullscreen();

    // 2. Mobile address bar scroll trick is not needed with 100dvh
    // window.scrollTo(0, 1);

    // 3. Fallback: Request on first touch/click interaction (browser policy compliant)
    const handleFirstTouch = () => {
      enterFullscreen();
      window.removeEventListener('touchstart', handleFirstTouch);
      window.removeEventListener('click', handleFirstTouch);
    };

    window.addEventListener('touchstart', handleFirstTouch, { passive: true });
    window.addEventListener('click', handleFirstTouch, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleFirstTouch);
      window.removeEventListener('click', handleFirstTouch);
    };
  }, []);

  // Modal Open States
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isFourLawsModalOpen, setIsFourLawsModalOpen] = useState<boolean>(() => {
    try {
      const hasSeen = localStorage.getItem('four_laws_seen');
      if (hasSeen === 'true') {
        return false;
      } else {
        localStorage.setItem('four_laws_seen', 'true');
        return true;
      }
    } catch (e) {
      return false;
    }
  });
  const [isReaderSettingsOpen, setIsReaderSettingsOpen] = useState(false);
  const [isDesignStyleModalOpen, setIsDesignStyleModalOpen] = useState(false);
  const [bibleBooksModalState, setBibleBooksModalState] = useState<{
    isOpen: boolean;
    mode: 'list' | 'overview';
  }>({
    isOpen: false,
    mode: 'list',
  });

  const closeOverlappingModals = () => {
    setBibleBooksModalState((prev) => ({ ...prev, isOpen: false }));
    setIsReaderSettingsOpen(false);
    setIsBibleSearchModalOpen(false);
  };

  const handleTabChange = (tab: Parameters<typeof setActiveTab>[0]) => {
    closeOverlappingModals();
    setActiveTab(tab);
    setTimeout(() => {
      document.querySelector('main')?.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    }, 10);
  };

  const handleOpenBibleBooksModal = (mode: 'list' | 'overview' = 'list') => {
    closeOverlappingModals();
    setBibleBooksModalState({ isOpen: true, mode });
  };

  const handleOpenReaderSettingsModal = () => {
    closeOverlappingModals();
    setIsReaderSettingsOpen(true);
  };
  const [isBibleSearchModalOpen, setIsBibleSearchModalOpen] = useState(false);
  const [searchInitialQuery, setSearchInitialQuery] = useState('');
  const [lastSearchQuery, setLastSearchQuery] = useState<string | null>(null);
  const [targetVerseNumber, setTargetVerseNumber] = useState<number | null>(null);
  const [isBdfImporterModalOpen, setIsBdfImporterModalOpen] = useState(false);
  const [isAndroidAppModalOpen, setIsAndroidAppModalOpen] = useState(false);
  const [isDailyNotificationOpen, setIsDailyNotificationOpen] = useState(false);
  const [isBibleIntegrityModalOpen, setIsBibleIntegrityModalOpen] = useState(false);
  const [openHenryTrigger, setOpenHenryTrigger] = useState(0);

  // Device Frame Mockup View State (Android Smartphone Frame vs Full Responsive)
  const [isDeviceFrameActive, setIsDeviceFrameActive] = useState(false);

  // Active Design Preset State
  const [activeDesignPreset, setActiveDesignPreset] = useState<DesignPresetId>(() => {
    const saved = localStorage.getItem('bible_design_preset');
    return (saved as DesignPresetId) || 'classic';
  });

  const handleSelectDesignPreset = (presetId: DesignPresetId) => {
    setActiveDesignPreset(presetId);
    localStorage.setItem('bible_design_preset', presetId);
    const found = DESIGN_PRESETS.find((p) => p.id === presetId);
    if (found) {
      setReaderSettings((prev) => ({
        ...prev,
        ...found.readerConfig,
      }));
    }
  };

  // Dictionary Modal State
  const [dictState, setDictState] = useState<{
    isOpen: boolean;
    entryId?: string | null;
    strongCode?: string | null;
  }>({ isOpen: false });

  // Today's Word Verse Card transfer state
  const [cardVerseTransfer, setCardVerseTransfer] = useState<{
    text?: string;
    ref?: string;
  }>({});

  // Local-First Persistent State: Reading Plan
  const [planSettings, setPlanSettings] = useState<PlanSettings>(() => {
    const saved = localStorage.getItem('bible_plan_settings');
    return saved
      ? JSON.parse(saved)
      : {
        mode: 'sequential',
        dailyGoalChapters: 3,
        notificationEnabled: true,
        notificationTime: '08:00',
        streakCount: 5,
        completedDays: [1, 2, 3, 4, 5],
      };
  });

  useEffect(() => {
    localStorage.setItem('bible_plan_settings', JSON.stringify(planSettings));
  }, [planSettings]);

  // Local-First Persistent State: E-Book Reader Settings
  const [readerSettings, setReaderSettings] = useState<ReaderSettings>(() => {
    let initial: ReaderSettings = {
      theme: 'light',
      fontSize: 'md',
      lineHeight: 'normal',
      letterSpacing: 'normal',
      fontFamily: 'sans',
      showVerseNumbers: true,
      paragraphMode: false,
      copyFormat: 'verse_break',
    };
    try {
      const saved = localStorage.getItem('bible_reader_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        initial = {
          theme: parsed.theme || 'light',
          fontSize: parsed.fontSize || 'md',
          lineHeight: parsed.lineHeight || 'normal',
          letterSpacing: parsed.letterSpacing || 'normal',
          fontFamily: parsed.fontFamily || 'sans',
          showVerseNumbers: parsed.showVerseNumbers ?? true,
          paragraphMode: parsed.paragraphMode ?? false,
          copyFormat: parsed.copyFormat === 'verse_break' || parsed.copyFormat === 'continuous' || parsed.copyFormat === 'with_ref' ? parsed.copyFormat : 'verse_break',
        };
      }
    } catch (e) { }

    if (typeof document !== 'undefined') {
      if (initial.theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    return initial;
  });

  useEffect(() => {
    try {
      localStorage.setItem('bible_reader_settings', JSON.stringify(readerSettings));
    } catch (e) { }

    // Apply theme class to document element
    if (readerSettings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [readerSettings]);

  // Local-First Persistent State: Highlights
  const [highlights, setHighlights] = useState<UserHighlight[]>(() => {
    const saved = localStorage.getItem('bible_highlights');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('bible_highlights', JSON.stringify(highlights));
  }, [highlights]);

  // Local-First Persistent State: Bookmarks
  const [bookmarks, setBookmarks] = useState<UserBookmark[]>(() => {
    const saved = localStorage.getItem('bible_bookmarks');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('bible_bookmarks', JSON.stringify(bookmarks));
  }, [bookmarks]);

  // Local-First Persistent State: Prayer Notes
  const [prayers, setPrayers] = useState<PrayerNote[]>(() => {
    const saved = localStorage.getItem('bible_prayer_notes');
    return saved
      ? JSON.parse(saved)
      : [
        {
          id: 'pr-1',
          title: '1년 성경 완독과 말씀 중심 삶을 위한 기도',
          content: '매일 아침 3장씩 꾸준히 읽고 하나님의 뜻을 깨닫게 하소서.',
          category: '개인',
          isAnswered: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
  });

  useEffect(() => {
    initCustomBibleStorage();
  }, []);

  useEffect(() => {
    localStorage.setItem('bible_prayer_notes', JSON.stringify(prayers));
  }, [prayers]);

  // Audio Player State
  const [audioState, setAudioState] = useState<AudioPlayerState>(() => {
    let savedSpeed = 1.0;
    let savedVoice = '';
    let savedPitch = 1.0;
    if (typeof window !== 'undefined' && localStorage) {
      try {
        const rawSpeed = localStorage.getItem('bible_audio_speed');
        if (rawSpeed) {
          const parsed = parseFloat(rawSpeed);
          if (!isNaN(parsed) && parsed > 0) savedSpeed = parsed;
        }
        savedVoice = localStorage.getItem('bible_audio_voice') || '';
        const rawPitch = localStorage.getItem('bible_audio_pitch');
        if (rawPitch) {
          const parsed = parseFloat(rawPitch);
          if (!isNaN(parsed) && parsed > 0) savedPitch = parsed;
        }
      } catch { }
    }
    return {
      isPlaying: false,
      bookId: BIBLE_BOOKS[0].id,
      chapter: 1,
      currentVerseIndex: 0,
      speed: savedSpeed,
      voiceURI: savedVoice,
      pitch: savedPitch,
      sleepTimerMinutes: 0,
      autoNextChapter: true,
      highlightFollowsVerse: true,
    };
  });

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage) {
      try {
        localStorage.setItem('bible_audio_speed', String(audioState.speed));
        if (audioState.voiceURI) {
          localStorage.setItem('bible_audio_voice', audioState.voiceURI);
        } else {
          localStorage.removeItem('bible_audio_voice');
        }
        if (audioState.pitch !== undefined) {
          localStorage.setItem('bible_audio_pitch', String(audioState.pitch));
        }
      } catch { }
    }
  }, [audioState.speed, audioState.voiceURI, audioState.pitch]);

  const [isAudioBarOpen, setIsAudioBarOpen] = useState(false);

  const handleToggleAudioPlayer = () => {
    if (!isAudioBarOpen) {
      setIsAudioBarOpen(true);
      setAudioState((prev) => ({ ...prev, isPlaying: true }));
    } else {
      setAudioState((prev) => ({ ...prev, isPlaying: !prev.isPlaying }));
    }
  };

  // Sync audio player book/chapter
  useEffect(() => {
    setAudioState((prev) => ({
      ...prev,
      bookId: currentBook.id,
      chapter: currentChapter,
      currentVerseIndex: targetVerseNumber && targetVerseNumber > 0 ? Math.max(0, targetVerseNumber - 1) : 0,
    }));
  }, [currentBook.id, currentChapter, targetVerseNumber]);

  const handleUpdateAudioState = (update: Partial<AudioPlayerState>) => {
    setAudioState((prev) => ({
      ...prev,
      ...update,
    }));
  };

  // User Action Handlers
  const handleToggleHighlight = (
    bookId: string,
    chapter: number,
    verseNumber: number,
    color: UserHighlight['color']
  ) => {
    const existingIndex = highlights.findIndex(
      (h) => h.bookId === bookId && h.chapter === chapter && h.verseNumber === verseNumber
    );

    if (existingIndex >= 0) {
      const existing = highlights[existingIndex];
      if (existing.color === color) {
        // Same color clicked -> remove highlight
        setHighlights(highlights.filter((_, i) => i !== existingIndex));
      } else {
        // Different color clicked -> update highlight color
        const updated = [...highlights];
        updated[existingIndex] = { ...existing, color };
        setHighlights(updated);
      }
    } else {
      setHighlights([
        ...highlights,
        {
          id: `h-${Date.now()}`,
          bookId,
          chapter,
          verseNumber,
          color,
          createdAt: new Date().toISOString(),
        },
      ]);
    }
  };

  const handleSaveVerseNote = (
    bookId: string,
    chapter: number,
    verseNumber: number,
    note: string
  ) => {
    const existingIndex = highlights.findIndex(
      (h) => h.bookId === bookId && h.chapter === chapter && h.verseNumber === verseNumber
    );

    if (existingIndex >= 0) {
      const updated = [...highlights];
      updated[existingIndex] = { ...updated[existingIndex], note };
      setHighlights(updated);
    } else {
      if (note.trim() !== '') {
        setHighlights([
          ...highlights,
          {
            id: `h-${Date.now()}`,
            bookId,
            chapter,
            verseNumber,
            color: 'yellow',
            note,
            createdAt: new Date().toISOString(),
          },
        ]);
      }
    }
  };

  const handleToggleBookmark = (
    bookId: string,
    chapter: number,
    verseNumber: number
  ) => {
    const existingIndex = bookmarks.findIndex(
      (b) => b.bookId === bookId && b.chapter === chapter && b.verseNumber === verseNumber
    );

    if (existingIndex >= 0) {
      setBookmarks(bookmarks.filter((_, i) => i !== existingIndex));
    } else {
      setBookmarks([
        ...bookmarks,
        {
          id: `b-${Date.now()}`,
          bookId,
          bookName: currentBook.name,
          chapter,
          verseNumber,
          createdAt: new Date().toISOString(),
        },
      ]);
    }
  };

  const handleAddPrayer = (
    note: Omit<PrayerNote, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    const newPrayer: PrayerNote = {
      ...note,
      id: `p-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setPrayers([newPrayer, ...prayers]);
  };

  const handleTogglePrayerAnswered = (id: string) => {
    setPrayers(
      prayers.map((p) =>
        p.id === id ? { ...p, isAnswered: !p.isAnswered } : p
      )
    );
  };

  const handleDeletePrayer = (id: string) => {
    setPrayers(prayers.filter((p) => p.id !== id));
  };

  const handleUpdatePrayer = (id: string, title: string, content: string, category: PrayerNote['category']) => {
    setPrayers(
      prayers.map((p) =>
        p.id === id ? { ...p, title, content, category, updatedAt: new Date().toISOString() } : p
      )
    );
  };

  const handleOpenDictionary = (entryOrCode: string, isStrong?: boolean) => {
    if (isStrong) {
      setDictState({ isOpen: true, strongCode: entryOrCode });
    } else {
      setDictState({ isOpen: true, entryId: entryOrCode });
    }
  };

  const handleCreateVerseCardFromBible = (verseText: string, refText: string) => {
    setCardVerseTransfer({ text: verseText, ref: refText });
    setActiveTab('today');
  };

  const handleJumpToPassage = (bookNameOrId: string, chapter: number) => {
    if (!bookNameOrId) return;
    const query = bookNameOrId.trim();
    const found = BIBLE_BOOKS.find(
      (b) =>
        b.id === query ||
        b.name === query ||
        b.shortName === query ||
        (b as any).aliases?.some((a: string) => a === query) ||
        b.name.includes(query) ||
        query.includes(b.name)
    );
    if (found) {
      const validChapter = Math.min(Math.max(1, chapter || 1), found.chapterCount);
      setCurrentBook(found);
      setCurrentChapter(validChapter);
      setActiveTab('bible');
      // Reset scroll position to top when jumping to passage from reading plan
      setTimeout(() => {
        const mainEl = document.querySelector('main');
        if (mainEl) mainEl.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
      }, 50);
    }
  };

  const handleNavigateToScripture = (scriptureRef: string) => {
    if (!scriptureRef) return;
    const match = scriptureRef.trim().match(/^([1-3]?[가-힣]+)\s*(\d+)/);
    if (match) {
      const bookName = match[1];
      const chapter = parseInt(match[2], 10);
      const found = BIBLE_BOOKS.find(
        (b) => b.name === bookName || b.shortName === bookName || b.name.includes(bookName) || bookName.includes(b.name)
      );
      if (found) {
        setCurrentBook(found);
        setCurrentChapter(chapter);
        setActiveTab('bible');
      }
    }
  };

  const [selectedHymn, setSelectedHymn] = useState<Hymn>(HYMNS[0]);

  const handlePrevHymn = () => {
    let customGospels: Hymn[] = [];
    try {
      const saved = localStorage.getItem('custom_gospel_songs');
      if (saved) customGospels = JSON.parse(saved);
    } catch { }
    const allHymns = [...HYMNS, ...customGospels];
    const currentIndex = allHymns.findIndex((h) => h.id === selectedHymn.id);
    if (currentIndex > 0) {
      setSelectedHymn(allHymns[currentIndex - 1]);
    } else {
      setSelectedHymn(allHymns[allHymns.length - 1]);
    }
  };

  const handleNextHymn = () => {
    let customGospels: Hymn[] = [];
    try {
      const saved = localStorage.getItem('custom_gospel_songs');
      if (saved) customGospels = JSON.parse(saved);
    } catch { }
    const allHymns = [...HYMNS, ...customGospels];
    const currentIndex = allHymns.findIndex((h) => h.id === selectedHymn.id);
    if (currentIndex >= 0 && currentIndex < allHymns.length - 1) {
      setSelectedHymn(allHymns[currentIndex + 1]);
    } else {
      setSelectedHymn(allHymns[0]);
    }
  };

  const handleGlobalPrev = () => {
    if (activeTab === 'bible') {
      if (currentChapter > 1) {
        setCurrentChapter(currentChapter - 1);
      } else {
        const bookIndex = BIBLE_BOOKS.findIndex((b) => b.id === currentBook.id);
        if (bookIndex > 0) {
          const prevBook = BIBLE_BOOKS[bookIndex - 1];
          setCurrentBook(prevBook);
          setCurrentChapter(prevBook.chapterCount);
        }
      }
    } else if (activeTab === 'hymn') {
      handlePrevHymn();
    }
    if (typeof document !== 'undefined') {
      document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleGlobalNext = () => {
    if (activeTab === 'bible') {
      if (currentChapter < currentBook.chapterCount) {
        setCurrentChapter(currentChapter + 1);
      } else {
        const bookIndex = BIBLE_BOOKS.findIndex((b) => b.id === currentBook.id);
        if (bookIndex < BIBLE_BOOKS.length - 1) {
          const nextBook = BIBLE_BOOKS[bookIndex + 1];
          setCurrentBook(nextBook);
          setCurrentChapter(1);
        }
      }
    } else if (activeTab === 'hymn') {
      handleNextHymn();
    }
    if (typeof document !== 'undefined') {
      document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const currentVerses = getChapterVerses(currentBook.id, currentChapter);

  // Robust helper to extract exact verse text for selected translation ID
  const getVerseTextForTranslation = (v: any, selectedId: string): string => {
    if (!v || !v.text) return '';
    let targetId = selectedId;
    if (!targetId) {
      try {
        const saved = localStorage.getItem('bible_active_translations_v6') || localStorage.getItem('bible_active_translations_v5');
        if (saved) {
          const list = JSON.parse(saved);
          if (list && list[0]) targetId = list[0];
        }
      } catch { }
    }
    if (targetId && v.text[targetId]) {
      return v.text[targetId];
    }
    const norm = (targetId || '').trim().toUpperCase();
    if (norm.includes('HKJV') || norm.includes('킹흠정') || norm.includes('흠정')) {
      return v.text['HKJV'] || v.text['킹흠정역'] || v.text['KRV'] || '';
    }
    if (norm.includes('1611')) {
      return v.text['KJV1611'] || v.text['킹제임스(KJV1611)'] || v.text['KJV'] || '';
    }
    if (norm.includes('KJV') || norm.includes('1769') || norm.includes('킹제임스')) {
      return v.text['KJV1769'] || v.text['KJV'] || v.text['킹제임스(KJV1769)'] || '';
    }
    return v.text['KRV'] || v.text['개역한글'] || (Object.values(v.text)[0] as string) || '';
  };

  const currentVerseStrings = currentVerses.map((v) =>
    getVerseTextForTranslation(v, audioState.selectedTranslationId)
  );

  return (
    <div className={`h-[100dvh] h-screen w-screen overflow-hidden bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col transition-colors ${isDeviceFrameActive ? 'p-2 sm:p-4 items-center justify-center' : ''}`}>
      {/* PWA Home Screen Install Banner */}
      <PwaInstallBanner />

      {/* Android Smartphone Device Frame Wrapper (Galaxy Note20 Spec: 412px x 915px) */}
      <div className={isDeviceFrameActive ? "w-full max-w-[412px] h-[915px] max-h-[95vh] bg-black rounded-[44px] p-3 shadow-2xl ring-1 ring-zinc-800 relative flex flex-col overflow-hidden border-4 border-zinc-700/50" : "w-full h-full flex flex-col overflow-hidden"}>
        {/* Android Top Status Bar (Clock, Camera Hole, Battery, Wi-Fi) */}
        {isDeviceFrameActive && (
          <div className="bg-zinc-900 text-white px-6 pt-2 pb-1 flex items-center justify-between text-[11px] font-mono shrink-0 select-none z-50">
            <span className="font-bold">09:41</span>
            <div className="w-3.5 h-3.5 rounded-full bg-zinc-950 ring-2 ring-zinc-800 mx-auto"></div>
            <div className="flex items-center gap-1.5 text-[10px]">
              <span>5G</span>
              <span>100%</span>
            </div>
          </div>
        )}

        <div className={`flex-1 flex flex-col h-full overflow-hidden relative ${isDeviceFrameActive ? 'bg-zinc-50 dark:bg-zinc-950 rounded-[32px]' : ''}`}>
          {/* Fixed Top App Header */}
          <div className="sticky top-0 left-0 right-0 z-50 shrink-0">
            <Header
              activeTab={activeTab}
              onTabChange={handleTabChange}
              planSettings={planSettings}
              onOpenPlanModal={() => setIsPlanModalOpen(true)}
              onOpenMapsModal={() => window.open('https://bible.bskorea.or.kr/resources/study/nkt_maps', '_blank')}
              onOpenFourLawsModal={() => setIsFourLawsModalOpen(true)}
              onOpenReaderSettingsModal={() => setIsReaderSettingsOpen(true)}
              onOpenDesignStyleModal={() => setIsDesignStyleModalOpen(true)}
              onOpenBibleBooksModal={handleOpenBibleBooksModal}
              onOpenBibleSearchModal={() => setIsBibleSearchModalOpen(true)}
              onOpenBdfImporterModal={() => setIsBdfImporterModalOpen(true)}
              onOpenAndroidAppModal={() => setIsAndroidAppModalOpen(true)}
              onOpenDailyNotificationModal={() => setIsDailyNotificationOpen(true)}
              activeDesignPreset={activeDesignPreset}
              audioState={audioState}
              onToggleAudioPlayer={handleToggleAudioPlayer}
            />
          </div>

          {/* Main Container Content - Remove top padding since flex-col header takes space */}
          <main className="w-full max-w-7xl mx-auto px-0 sm:px-6 pt-0 flex-1 overflow-y-auto pb-24">
            {activeTab === 'bible' && (
              <BibleTab
                currentBook={currentBook}
                currentChapter={currentChapter}
                targetVerseNumber={targetVerseNumber}
                onBookChange={(book) => {
                  setTargetVerseNumber(null);
                  setCurrentBook(book);
                }}
                onChapterChange={(ch) => {
                  setTargetVerseNumber(null);
                  setCurrentChapter(ch);
                }}
                readerSettings={readerSettings}
                highlights={highlights}
                bookmarks={bookmarks}
                onToggleHighlight={handleToggleHighlight}
                onToggleBookmark={handleToggleBookmark}
                onSaveVerseNote={handleSaveVerseNote}
                onOpenDictionary={handleOpenDictionary}
                onCreateVerseCard={handleCreateVerseCardFromBible}
                activeDesignPreset={activeDesignPreset}
                onSelectDesignPreset={handleSelectDesignPreset}
                onOpenDesignStyleModal={() => setIsDesignStyleModalOpen(true)}
                onOpenBibleBooksModal={handleOpenBibleBooksModal}
                onOpenBibleSearchModal={() => setIsBibleSearchModalOpen(true)}
                openHenryTrigger={openHenryTrigger}
                audioState={audioState}
                onToggleAudioPlayer={handleToggleAudioPlayer}
                onUpdateAudioState={handleUpdateAudioState}
              />
            )}

            {activeTab === 'hymn' && (
              <HymnTab
                selectedHymn={selectedHymn}
                onSelectHymn={setSelectedHymn}
                onPrevHymn={handlePrevHymn}
                onNextHymn={handleNextHymn}
                onNavigateToScripture={handleNavigateToScripture}
                onClose={() => setActiveTab('bible')}
              />
            )}

            {activeTab === 'today' && (
              <TodayWordTab
                initialVerseText={cardVerseTransfer.text}
                initialScriptureRef={cardVerseTransfer.ref}
                onClose={() => setActiveTab('bible')}
              />
            )}

            {activeTab === 'memo' && (
              <MemoTab
                highlights={highlights}
                bookmarks={bookmarks}
                prayers={prayers}
                onAddPrayer={handleAddPrayer}
                onUpdatePrayer={handleUpdatePrayer}
                onTogglePrayerAnswered={handleTogglePrayerAnswered}
                onDeletePrayer={handleDeletePrayer}
                onDeleteHighlight={(id) => setHighlights(highlights.filter((h) => h.id !== id))}
                onDeleteBookmark={(id) => setBookmarks(bookmarks.filter((b) => b.id !== id))}
                onSelectVerse={(bookId, ch, v) => handleJumpToPassage(bookId, ch)}
                onClose={() => setActiveTab('bible')}
              />
            )}

            {activeTab === 'links' && (
              <StudyLinksTab onClose={() => setActiveTab('bible')} />
            )}
          </main>
        </div>

        {/* Android Bottom Navigation Gesture Indicator */}
        {isDeviceFrameActive && (
          <div className="bg-zinc-900 py-1.5 flex justify-center shrink-0">
            <div className="w-32 h-1 bg-zinc-600 rounded-full"></div>
          </div>
        )}
      </div>

      {/* Modals & Audio Player Bar */}
      <BibleBooksModal
        isOpen={bibleBooksModalState.isOpen}
        initialMode={bibleBooksModalState.mode}
        onClose={() => setBibleBooksModalState((prev) => ({ ...prev, isOpen: false }))}
        currentBook={currentBook}
        currentChapter={currentChapter}
        onSelectBookAndChapter={(book, ch) => {
          setCurrentBook(book);
          setCurrentChapter(ch);
          setActiveTab('bible');
        }}
      />

      <BibleSearchModal
        isOpen={isBibleSearchModalOpen}
        onClose={() => setIsBibleSearchModalOpen(false)}
        initialQuery={searchInitialQuery}
        onNavigateToVerse={(book, ch, v, searchQ) => {
          if (searchQ) setLastSearchQuery(searchQ);
          setCurrentBook(book);
          setCurrentChapter(ch);
          setTargetVerseNumber(v);
          setIsBibleSearchModalOpen(false);
          setActiveTab('bible');
        }}
        onCreateVerseCard={(verseText, refText, searchQ) => {
          if (searchQ) setLastSearchQuery(searchQ);
          setCardVerseTransfer({ text: verseText, ref: refText });
          setIsBibleSearchModalOpen(false);
          setActiveTab('today');
        }}
      />

      <DesignStyleModal
        isOpen={isDesignStyleModalOpen}
        onClose={() => setIsDesignStyleModalOpen(false)}
        activePreset={activeDesignPreset}
        onSelectPreset={handleSelectDesignPreset}
      />

      <ReaderSettingsModal
        isOpen={isReaderSettingsOpen}
        onClose={() => setIsReaderSettingsOpen(false)}
        settings={readerSettings}
        onUpdate={(newS) => setReaderSettings({ ...readerSettings, ...newS })}
        activeDesignPreset={activeDesignPreset}
        onSelectDesignPreset={handleSelectDesignPreset}
        onOpenDesignStyleModal={() => setIsDesignStyleModalOpen(true)}
        onOpenAndroidAppModal={() => setIsAndroidAppModalOpen(true)}
        onOpenBdfImporterModal={() => setIsBdfImporterModalOpen(true)}
        onOpenDailyNotificationModal={() => setIsDailyNotificationOpen(true)}
        onOpenIntegrityModal={() => setIsBibleIntegrityModalOpen(true)}
      />

      <PlanModal
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        settings={planSettings}
        onUpdateSettings={(newS) => setPlanSettings({ ...planSettings, ...newS })}
        onSelectPassage={(bookId, ch) => handleJumpToPassage(bookId, ch)}
      />

      <FourLawsModal
        isOpen={isFourLawsModalOpen}
        onClose={() => {
          setIsFourLawsModalOpen(false);
          setIsPlanModalOpen(true);
        }}
        onSelectScripture={(bookName, ch) => handleJumpToPassage(bookName, ch)}
      />

      <DictionaryModal
        isOpen={dictState.isOpen}
        onClose={() => setDictState({ isOpen: false })}
        entry={DICTIONARY_ENTRIES.find((d) => d.id === dictState.entryId)}
        strongCode={dictState.strongCode}
        onSelectVerse={(bookName, ch) => handleJumpToPassage(bookName, ch)}
        onSearchStrongCode={(code) => {
          setSearchInitialQuery(code);
          setIsBibleSearchModalOpen(true);
        }}
      />

      {isAudioBarOpen && (
        <AudioPlayerBar
          state={audioState}
          onUpdateState={(newS) => setAudioState({ ...audioState, ...newS })}
          currentBook={currentBook}
          currentChapterVerses={currentVerseStrings}
          versesData={currentVerses}
          onVerseChange={(idx) =>
            setAudioState((prev) => ({ ...prev, currentVerseIndex: idx }))
          }
          onNextChapter={() => {
            if (currentChapter < currentBook.chapterCount) {
              setCurrentChapter(currentChapter + 1);
            }
          }}
          onPrevChapter={() => {
            if (currentChapter > 1) {
              setCurrentChapter(currentChapter - 1);
            }
          }}
          onClose={() => setIsAudioBarOpen(false)}
          onOpenHenryCommentary={() => {
            setOpenHenryTrigger((prev) => prev + 1);
            setActiveTab('bible');
          }}
        />
      )}

      <BdfImporterModal
        isOpen={isBdfImporterModalOpen}
        onClose={() => setIsBdfImporterModalOpen(false)}
        onOpenIntegrityModal={() => setIsBibleIntegrityModalOpen(true)}
      />

      <AndroidAppModal
        isOpen={isAndroidAppModalOpen}
        onClose={() => setIsAndroidAppModalOpen(false)}
        onToggleDeviceFrame={() => setIsDeviceFrameActive(!isDeviceFrameActive)}
        isDeviceFrameActive={isDeviceFrameActive}
      />

      <DailyNotificationModal
        isOpen={isDailyNotificationOpen}
        onClose={() => setIsDailyNotificationOpen(false)}
      />

      <BibleIntegrityModal
        isOpen={isBibleIntegrityModalOpen}
        onClose={() => setIsBibleIntegrityModalOpen(false)}
      />


      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onOpenDesignStyleModal={() => setIsDesignStyleModalOpen(true)}
        onOpenReaderSettingsModal={handleOpenReaderSettingsModal}
        onOpenPlanModal={() => setIsPlanModalOpen(true)}
        onOpenMapsModal={() => window.open('https://bible.bskorea.or.kr/resources/study/nkt_maps', '_blank')}
        onOpenBibleBooksModal={handleOpenBibleBooksModal}
        onOpenBibleSearchModal={() => setIsBibleSearchModalOpen(true)}
        onOpenBdfImporterModal={() => setIsBdfImporterModalOpen(true)}
        onOpenAndroidAppModal={() => setIsAndroidAppModalOpen(true)}
        onOpenFourLawsModal={() => setIsFourLawsModalOpen(true)}
        audioState={audioState}
        onToggleAudioPlayer={handleToggleAudioPlayer}
        onOpenHenryCommentary={() => {
          closeOverlappingModals();
          setActiveTab('bible');
          setOpenHenryTrigger((prev) => prev + 1);
        }}
        onPrev={handleGlobalPrev}
        onNext={handleGlobalNext}
      />
    </div>
  );
}
