import React, { useState, useMemo, useEffect } from 'react';
import { Hymn } from '../types';
import { HYMNS, DEFAULT_GOSPEL_SONGS } from '../data/hymnData';
import { BIBLE_BOOKS, getChapterVerses } from '../data/bibleData';
import {
  Search,
  Music,
  Play,
  Pause,
  Hash,
  Volume2,
  Radio,
  Piano,
  Youtube,
  Plus,
  Trash2,
  ExternalLink,
  X,
  Sparkles,
  Link as LinkIcon,
  ChevronLeft,
  ChevronRight,
  Edit3,
  RotateCcw,
  Book,
  Upload,
  Download,
  FileText,
} from 'lucide-react';
import { playHymnAudio, stopHymnAudio, HymnAudioMode } from '../utils/hymnAudioSynth';

// YouTube URL parser
function getYouTubeEmbedUrl(url?: string): string | null {
  if (!url) return null;
  // If it's already a search URL, return null so it renders the search button card
  if (url.includes('youtube.com/results')) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  if (match && match[2].length === 11) {
    return `https://www.youtube.com/embed/${match[2]}?rel=0&modestbranding=1`;
  }
  return null;
}

export interface HymnTabProps {
  selectedHymn?: Hymn;
  onSelectHymn?: (hymn: Hymn) => void;
  onPrevHymn?: () => void;
  onNextHymn?: () => void;
  onNavigateToScripture?: (scriptureRef: string) => void;
}

export const HymnTab: React.FC<HymnTabProps> = ({
  selectedHymn: propSelectedHymn,
  onSelectHymn,
  onPrevHymn,
  onNextHymn,
  onNavigateToScripture,
}) => {
  const [isBannerVisible, setIsBannerVisible] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [jumpNumber, setJumpNumber] = useState('');
  const [selectedType, setSelectedType] = useState<'new' | 'gospel'>('new');
  const [numberRange, setNumberRange] = useState<string>('all');

  // Custom User Registered Gospel Songs
  const [customGospels, setCustomGospels] = useState<Hymn[]>(() => {
    try {
      const saved = localStorage.getItem('custom_gospel_songs');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // User Custom Hymn Lyric Edits Map
  const [editedLyricsMap, setEditedLyricsMap] = useState<
    Record<string, { verses: string[]; chorus?: string }>
  >(() => {
    try {
      const saved = localStorage.getItem('custom_hymn_edits');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Modal for editing current hymn's lyrics
  const [isEditLyricsModalOpen, setIsEditLyricsModalOpen] = useState(false);
  const [editVersesText, setEditVersesText] = useState('');
  const [editChorusText, setEditChorusText] = useState('');

  // Quick Smart Paste & Backup states
  const [isSmartParseOpen, setIsSmartParseOpen] = useState(false);
  const [smartInputText, setSmartInputText] = useState('');
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);

  const applySmartParseText = (rawText: string) => {
    if (!rawText || !rawText.trim()) return;

    let text = rawText.trim();
    let extractedChorus = '';

    // Check for chorus markers like [후렴], (후렴), 후렴:, Chorus:
    const chorusRegex = /(?:\[후렴\]|\(후렴\)|후렴\s*:?|\[Chorus\]|Chorus\s*:?)\s*([\s\S]*?)(?=(?:\n\s*\[?\d+[절\.]?\]?|\n\s*\[후렴\]|\n\s*$))/i;
    const chorusMatch = text.match(chorusRegex);
    if (chorusMatch) {
      extractedChorus = chorusMatch[1].trim();
      text = text.replace(chorusMatch[0], '');
    }

    // Split text into lines, strip verse prefix markers like "1절", "1.", "[1절]", "1)", "Verse 1"
    const cleanedLines = text
      .split('\n')
      .map((line) => line.replace(/^\s*(?:\[?\d+[절\.]?\]?|\d+\)|Verse\s*\d+:?)\s*/i, ''));

    // Rejoin lines and split into blocks by blank lines
    const blocks = cleanedLines
      .join('\n')
      .split(/\n\s*\n/)
      .map((b) => b.trim())
      .filter((b) => b.length > 0);

    if (blocks.length > 0) {
      setEditVersesText(blocks.join('\n\n'));
    }
    if (extractedChorus) {
      setEditChorusText(extractedChorus);
    }
  };

  const handleImportTextFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        applySmartParseText(result);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExportBackupJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(editedLyricsMap, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `찬송가_수정가사_백업_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleImportBackupJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && typeof parsed === 'object') {
          const updated = { ...editedLyricsMap, ...parsed };
          setEditedLyricsMap(updated);
          localStorage.setItem('custom_hymn_edits', JSON.stringify(updated));
          alert('수정된 찬송가 가사 백업을 성공적으로 불러왔습니다!');
          setIsBackupModalOpen(false);
        }
      } catch {
        alert('올바른 백업 JSON 파일이 아닙니다.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Modal for viewing related scripture
  const [scriptureModalState, setScriptureModalState] = useState<{
    isOpen: boolean;
    refText: string;
    bookName: string;
    chapter: number;
    targetVerseNum?: number;
    verses: { number: number; text: string }[];
  } | null>(null);

  const handleOpenScriptureModal = (refText: string) => {
    if (!refText) return;
    const match = refText.trim().match(/^([1-3]?[가-힣]+)\s*(\d+)(?::(\d+)(?:-\d+)?)?/);
    if (!match) {
      if (onNavigateToScripture) onNavigateToScripture(refText);
      return;
    }

    const bookName = match[1];
    const chapter = parseInt(match[2], 10);
    const targetVerseNum = match[3] ? parseInt(match[3], 10) : undefined;

    const foundBook = BIBLE_BOOKS.find(
      (b) => b.name === bookName || b.shortName === bookName || b.name.includes(bookName) || bookName.includes(b.name)
    );

    if (foundBook) {
      const rawVerses = getChapterVerses(foundBook.id, chapter);
      const mapped = rawVerses.map((v) => {
        let textVal = '';
        if (typeof v.text === 'string') {
          textVal = v.text;
        } else if (v.text && typeof v.text === 'object') {
          textVal = (v.text as Record<string, string>).KRV || (v.text as Record<string, string>).NKRV || Object.values(v.text)[0] || '';
        }
        return { number: v.number, text: textVal };
      });

      setScriptureModalState({
        isOpen: true,
        refText,
        bookName: foundBook.name,
        chapter,
        targetVerseNum,
        verses: mapped,
      });
    } else {
      if (onNavigateToScripture) onNavigateToScripture(refText);
    }
  };

  // Modal for adding new Gospel song
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newArtist, setNewArtist] = useState('');
  const [newYoutubeUrl, setNewYoutubeUrl] = useState('');
  const [newCategory, setNewCategory] = useState('가스펠 / CCM');
  const [newScriptureRef, setNewScriptureRef] = useState('');
  const [newLyrics, setNewLyrics] = useState('');

  // Combined list
  const allHymns = useMemo(() => {
    return [...HYMNS, ...customGospels];
  }, [customGospels]);

  const [localSelectedHymn, setLocalSelectedHymn] = useState<Hymn>(allHymns[0]);
  const selectedHymn = propSelectedHymn || localSelectedHymn;

  // Selected Hymn with User Edits Applied
  const activeHymnWithEdits = useMemo(() => {
    const custom = editedLyricsMap[selectedHymn.id];
    if (custom) {
      return {
        ...selectedHymn,
        verses: custom.verses,
        chorus: custom.chorus,
        isEdited: true,
      };
    }
    return { ...selectedHymn, isEdited: false };
  }, [selectedHymn, editedLyricsMap]);

  const handleOpenEditLyricsModal = () => {
    const currentVerses = activeHymnWithEdits.verses.join('\n\n');
    setEditVersesText(currentVerses);
    setEditChorusText(activeHymnWithEdits.chorus || '');
    setIsEditLyricsModalOpen(true);
  };

  const handleSaveLyricsEdit = (e: React.FormEvent) => {
    e.preventDefault();
    const blocks = editVersesText
      .split(/\n\s*\n/)
      .map((block) => block.trim())
      .filter((block) => block.length > 0);

    const finalVerses = blocks.length > 0 ? blocks : [editVersesText.trim()];

    const newMap = {
      ...editedLyricsMap,
      [selectedHymn.id]: {
        verses: finalVerses.length > 0 && finalVerses[0] ? finalVerses : activeHymnWithEdits.verses,
        chorus: editChorusText.trim() || undefined,
      },
    };

    setEditedLyricsMap(newMap);
    try {
      localStorage.setItem('custom_hymn_edits', JSON.stringify(newMap));
    } catch {}
    setIsEditLyricsModalOpen(false);
  };

  const handleResetLyricsEdit = () => {
    if (confirm('수정된 가사를 초기화하고 원본 가사로 복원하시겠습니까?')) {
      const newMap = { ...editedLyricsMap };
      delete newMap[selectedHymn.id];
      setEditedLyricsMap(newMap);
      try {
        localStorage.setItem('custom_hymn_edits', JSON.stringify(newMap));
      } catch {}
      setIsEditLyricsModalOpen(false);
    }
  };

  const handleSelectHymn = (hymn: Hymn, switchView = true) => {
    if (onSelectHymn) {
      onSelectHymn(hymn);
    } else {
      setLocalSelectedHymn(hymn);
    }
    if (switchView) {
      setMobileViewMode('viewer');
    }
  };

  // Audio state
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioMode, setAudioMode] = useState<HymnAudioMode>('audioStream');
  const [audioSpeed, setAudioSpeed] = useState<number>(1.0);
  const [activeVerseIndex, setActiveVerseIndex] = useState<number | null>(null);
  const [mobileViewMode, setMobileViewMode] = useState<'list' | 'viewer'>('list');

  // Stop audio on unmount
  useEffect(() => {
    return () => {
      stopHymnAudio();
    };
  }, []);

  useEffect(() => {
    stopHymnAudio();
    setIsPlayingAudio(false);
    setActiveVerseIndex(null);
  }, [selectedHymn]);

  // Filter Hymns
  const filteredHymns = useMemo(() => {
    return allHymns.filter((h) => {
      const matchesType = h.type === selectedType;

      let matchesRange = true;
      if (numberRange !== 'all' && h.type === 'new') {
        const [min, max] = numberRange.split('-').map(Number);
        matchesRange = h.number >= min && h.number <= max;
      }

      const q = searchQuery.trim().toLowerCase();
      if (!q) return matchesType && matchesRange;

      const cleanQ = q.replace(/장$/, '');
      const matchesNumber = h.number.toString() === cleanQ || h.number.toString().startsWith(cleanQ);
      const matchesTitle = h.title.toLowerCase().includes(q);
      const matchesArtist = h.artist?.toLowerCase().includes(q) ?? false;
      const matchesCategory = h.category.toLowerCase().includes(q);
      const matchesVerse = h.verses.some((v) => v.toLowerCase().includes(q));

      return (
        matchesType &&
        matchesRange &&
        (matchesNumber || matchesTitle || matchesArtist || matchesCategory || matchesVerse)
      );
    });
  }, [allHymns, searchQuery, selectedType, numberRange]);

  // Navigate Prev / Next Hymn
  const handlePrevHymn = () => {
    if (onPrevHymn) {
      onPrevHymn();
      return;
    }
    const list = filteredHymns.length > 0 ? filteredHymns : allHymns;
    const currIdx = list.findIndex((h) => h.id === selectedHymn.id);
    if (currIdx > 0) {
      handleSelectHymn(list[currIdx - 1]);
    } else {
      handleSelectHymn(list[list.length - 1]);
    }
  };

  const handleNextHymn = () => {
    if (onNextHymn) {
      onNextHymn();
      return;
    }
    const list = filteredHymns.length > 0 ? filteredHymns : allHymns;
    const currIdx = list.findIndex((h) => h.id === selectedHymn.id);
    if (currIdx >= 0 && currIdx < list.length - 1) {
      handleSelectHymn(list[currIdx + 1]);
    } else {
      handleSelectHymn(list[0]);
    }
  };

  // Jump to specific hymn number directly
  const handleJumpToNumber = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(jumpNumber.trim(), 10);
    if (!isNaN(num)) {
      const target = allHymns.find((h) => h.number === num && h.type === selectedType);
      if (target) {
        handleSelectHymn(target);
        setJumpNumber('');
      }
    }
  };

  // Add custom Gospel Song
  const handleAddCustomGospel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const versesArray = newLyrics
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const newSong: Hymn = {
      id: `custom-gospel-${Date.now()}`,
      number: DEFAULT_GOSPEL_SONGS.length + customGospels.length + 1,
      type: 'gospel',
      title: newTitle.trim(),
      artist: newArtist.trim() || undefined,
      category: newCategory.trim() || '가스펠 / CCM',
      key: 'G장조',
      scriptureRef: newScriptureRef.trim() || undefined,
      youtubeUrl: newYoutubeUrl.trim() || undefined,
      verses: versesArray.length > 0 ? versesArray : ['등록된 가사가 없습니다.'],
      isCustom: true,
    };

    const updated = [newSong, ...customGospels];
    setCustomGospels(updated);
    try {
      localStorage.setItem('custom_gospel_songs', JSON.stringify(updated));
    } catch {}

    setNewTitle('');
    setNewArtist('');
    setNewYoutubeUrl('');
    setNewCategory('가스펠 / CCM');
    setNewScriptureRef('');
    setNewLyrics('');
    setIsAddModalOpen(false);

    setSelectedType('gospel');
    handleSelectHymn(newSong);
  };

  // Delete custom Gospel Song
  const handleDeleteCustomGospel = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('등록하신 가스펠 곡을 삭제하시겠습니까?')) {
      const updated = customGospels.filter((g) => g.id !== id);
      setCustomGospels(updated);
      try {
        localStorage.setItem('custom_gospel_songs', JSON.stringify(updated));
      } catch {}
      if (selectedHymn.id === id) {
        handleSelectHymn(allHymns[0]);
      }
    }
  };

  const handleTogglePlayAudio = () => {
    if (isPlayingAudio) {
      stopHymnAudio();
      setIsPlayingAudio(false);
      setActiveVerseIndex(null);
    } else {
      setIsPlayingAudio(true);
      playHymnAudio(
        selectedHymn.number,
        selectedHymn.title,
        selectedHymn.verses,
        selectedHymn.key,
        audioMode,
        {
          speed: audioSpeed,
          onVerseChange: (idx) => setActiveVerseIndex(idx),
          onEnd: () => {
            setIsPlayingAudio(false);
            setActiveVerseIndex(null);
          },
        }
      );
    }
  };

  const handleChangeAudioMode = (mode: HymnAudioMode) => {
    setAudioMode(mode);
    stopHymnAudio();
    setIsPlayingAudio(true);
    playHymnAudio(
      selectedHymn.number,
      selectedHymn.title,
      selectedHymn.verses,
      selectedHymn.key,
      mode,
      {
        speed: audioSpeed,
        onVerseChange: (idx) => setActiveVerseIndex(idx),
        onEnd: () => {
          setIsPlayingAudio(false);
          setActiveVerseIndex(null);
        },
      }
    );
  };

  const youtubeEmbedUrl = useMemo(() => {
    return getYouTubeEmbedUrl(selectedHymn.youtubeUrl);
  }, [selectedHymn.youtubeUrl]);

  const youtubeSearchUrl = useMemo(() => {
    if (selectedHymn.type === 'new') {
      return `https://www.youtube.com/results?search_query=${encodeURIComponent(
        `새찬송가 ${selectedHymn.number}장 ${selectedHymn.title} MR 반주`
      )}`;
    }
    const query = selectedHymn.artist
      ? `${selectedHymn.title} ${selectedHymn.artist} MR 반주`
      : `${selectedHymn.title} MR 반주`;
    return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
  }, [selectedHymn]);

  return (
    <div className="space-y-2.5">
      {/* Header Banner */}
      {isBannerVisible && (
        <div className="relative p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-500 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-2.5">
          {/* Banner Close Button */}
          <button
            onClick={() => setIsBannerVisible(false)}
            title="창 닫기"
            className="absolute top-2.5 right-2.5 p-1 rounded-full bg-black/20 hover:bg-black/40 text-amber-100 hover:text-white transition-all cursor-pointer z-10"
          >
            <X className="w-3.5 h-3.5" />
          </button>

          <div className="pr-6">
            <div className="flex items-center gap-1.5 mb-0.5">
              <Music className="w-5 h-5 animate-pulse" />
              <h2 className="text-lg sm:text-xl font-extrabold font-serif leading-tight">
                찬송가 & 가스펠 CCM
              </h2>
            </div>
            <p className="text-xs text-amber-100 font-medium leading-tight">
              새찬송가 645곡, 가스펠ccm
            </p>
          </div>

          {/* Type Switcher & Add Button aligned side-by-side in a single row */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none shrink-0 max-w-full">
            <div className="flex items-center bg-black/20 backdrop-blur-xs p-0.5 rounded-lg border border-white/20 shrink-0">
              <button
                onClick={() => {
                  setSelectedType('new');
                  setNumberRange('all');
                  const firstNew = allHymns.find((h) => h.type === 'new');
                  if (firstNew) handleSelectHymn(firstNew, false);
                  setMobileViewMode('list');
                }}
                className={`px-2 py-1 rounded-md text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                  selectedType === 'new'
                    ? 'bg-white text-amber-900 shadow-xs'
                    : 'text-amber-100 hover:text-white'
                }`}
              >
                새찬송가 (645)
              </button>
              <button
                onClick={() => {
                  setSelectedType('gospel');
                  setNumberRange('all');
                  const firstGospel = allHymns.find((h) => h.type === 'gospel');
                  if (firstGospel) handleSelectHymn(firstGospel, false);
                  setMobileViewMode('list');
                }}
                className={`px-2 py-1 rounded-md text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                  selectedType === 'gospel'
                    ? 'bg-white text-amber-900 shadow-xs'
                    : 'text-amber-100 hover:text-white'
                }`}
              >
                가스펠 ({DEFAULT_GOSPEL_SONGS.length + customGospels.length})
              </button>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setIsBackupModalOpen(true)}
                className="px-2.5 py-1 rounded-lg bg-amber-950/40 hover:bg-amber-950/60 text-amber-100 text-xs font-bold border border-white/25 flex items-center gap-1 transition-all cursor-pointer shadow-xs whitespace-nowrap"
                title="수정한 찬송가 가사 전체 백업 및 복원"
              >
                <Download className="w-3.5 h-3.5 text-amber-300" />
                <span>백업/복원</span>
              </button>

              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-2.5 py-1 rounded-lg bg-amber-950/40 hover:bg-amber-950/60 text-amber-100 text-xs font-bold border border-white/25 flex items-center gap-1 transition-all cursor-pointer shadow-xs whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5 text-amber-300" />
                <span>가스펠 등록</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Mode Toggle (List vs Lyrics Viewer) */}
      <div className="flex md:hidden items-center justify-center p-0.5 rounded-lg bg-zinc-200 dark:bg-zinc-800 text-xs font-bold">
        <button
          onClick={() => setMobileViewMode('list')}
          className={`flex-1 py-1 rounded-md text-center transition-all ${
            mobileViewMode === 'list'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-zinc-600 dark:text-zinc-400'
          }`}
        >
          {selectedType === 'new' ? '새찬송가' : '가스펠'} 목록 ({filteredHymns.length})
        </button>
        <button
          onClick={() => setMobileViewMode('viewer')}
          className={`flex-1 py-1 rounded-md text-center transition-all ${
            mobileViewMode === 'viewer'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-zinc-600 dark:text-zinc-400'
          }`}
        >
          {selectedHymn.title} 가사보기
        </button>
      </div>

      {/* Main Grid: Left List (5 Cols) & Right Viewer (7 Cols) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        {/* Search & Hymn List Column */}
        <div
          className={`md:col-span-5 space-y-2 ${
            mobileViewMode === 'viewer' ? 'hidden md:block' : 'block'
          }`}
        >
          {/* Quick Jump & Search Box */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                <input
                  type="text"
                  placeholder={
                    selectedType === 'new'
                      ? '장 번호, 제목, 가사 검색 (예: 304, 나 같은 죄인)'
                      : '가스펠 곡 제목, 가수, 가사 검색 (예: 은혜, 마커스)'
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-2.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs focus:ring-2 focus:ring-amber-500 font-medium"
                />
              </div>

              {selectedType === 'new' && (
                <form onSubmit={handleJumpToNumber} className="flex items-center gap-1 shrink-0">
                  <div className="relative w-18">
                    <Hash className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                    <input
                      type="number"
                      min={1}
                      max={645}
                      placeholder="장"
                      value={jumpNumber}
                      onChange={(e) => setJumpNumber(e.target.value)}
                      className="w-full pl-6 pr-1.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-bold text-center focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-2.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-extrabold transition-all cursor-pointer shrink-0"
                  >
                    이동
                  </button>
                </form>
              )}
            </div>

            {/* Quick Range Selector Chips (New Hymns only) */}
            {selectedType === 'new' && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px] font-bold">
                <span className="text-zinc-400 shrink-0 text-[10px]">범위:</span>
                <button
                  onClick={() => setNumberRange('all')}
                  className={`px-2.5 py-1 rounded-lg shrink-0 transition-all cursor-pointer ${
                    numberRange === 'all'
                      ? 'bg-amber-500 text-white'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'
                  }`}
                >
                  전체
                </button>
                {['1-100', '101-200', '201-300', '301-400', '401-500', '501-645'].map((range) => (
                  <button
                    key={range}
                    onClick={() => setNumberRange(range)}
                    className={`px-2 py-1 rounded-lg shrink-0 transition-all cursor-pointer ${
                      numberRange === range
                        ? 'bg-amber-500 text-white'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'
                    }`}
                  >
                    {range}장
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Hymns Scrollable List */}
          <div className="space-y-1.5 max-h-[520px] overflow-y-auto pr-1">
            <div className="text-[11px] text-zinc-400 font-semibold px-1 pb-1 flex items-center justify-between">
              <span>검색결과 {filteredHymns.length}곡 목록</span>
              {selectedType === 'gospel' && (
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="text-amber-600 dark:text-amber-400 font-bold hover:underline cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>곡 추가</span>
                </button>
              )}
            </div>

            {filteredHymns.length === 0 ? (
              <div className="p-8 text-center text-zinc-400 text-xs space-y-2">
                <p>검색 조건에 해당되는 찬송가/가스펠 곡이 없습니다.</p>
                {selectedType === 'gospel' && (
                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="px-3 py-1.5 bg-amber-600 text-white rounded-lg font-bold text-xs cursor-pointer inline-flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>새 가스펠 곡 등록하기</span>
                  </button>
                )}
              </div>
            ) : (
              filteredHymns.map((hymn) => {
                const isSelected = selectedHymn.id === hymn.id;
                return (
                  <button
                    key={hymn.id}
                    onClick={() => {
                      handleSelectHymn(hymn);
                      stopHymnAudio();
                      setIsPlayingAudio(false);
                      setMobileViewMode('viewer');
                    }}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500 text-zinc-950 border-amber-500 font-bold shadow-md'
                        : 'bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 border-zinc-200 dark:border-zinc-800 hover:border-amber-400'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`px-2 py-0.5 rounded-lg text-xs font-mono font-extrabold shrink-0 ${
                          isSelected
                            ? 'bg-zinc-950 text-amber-400'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {hymn.type === 'new' ? `${hymn.number}장` : `CCM`}
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm truncate font-extrabold flex items-center gap-1.5">
                          <span className="truncate">{hymn.title}</span>
                          {hymn.isCustom && (
                            <span
                              className={`text-[9px] px-1.5 py-0.2 rounded font-bold shrink-0 ${
                                isSelected ? 'bg-zinc-950 text-amber-300' : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              내등록
                            </span>
                          )}
                        </div>
                        <div
                          className={`text-[11px] font-normal truncate ${
                            isSelected ? 'text-zinc-900' : 'text-zinc-500'
                          }`}
                        >
                          {hymn.artist ? `${hymn.artist} • ` : ''}
                          {hymn.category}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      {hymn.youtubeUrl && (
                        <Youtube
                          className={`w-4 h-4 ${
                            isSelected ? 'text-zinc-950' : 'text-red-500'
                          }`}
                        />
                      )}
                      {hymn.isCustom && (
                        <button
                          onClick={(e) => handleDeleteCustomGospel(hymn.id, e)}
                          title="삭제"
                          className={`p-1 rounded hover:bg-red-500 hover:text-white transition-all cursor-pointer ${
                            isSelected ? 'text-zinc-900' : 'text-zinc-400'
                          }`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Hymn / Gospel Viewer Column */}
        <div
          className={`md:col-span-7 bg-white dark:bg-zinc-900 p-4 sm:p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-3 ${
            mobileViewMode === 'list' ? 'hidden md:block' : 'block'
          }`}
        >
          {/* 모바일 전용: 목록으로 뒤로가기 버튼 */}
          <div className="flex md:hidden items-center mb-2">
            <button
              onClick={() => setMobileViewMode('list')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-zinc-800 hover:bg-amber-100 dark:hover:bg-zinc-700 text-amber-700 dark:text-amber-300 text-xs font-extrabold border border-amber-300 dark:border-zinc-600 transition-all active:scale-95 cursor-pointer shadow-sm"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>← 목록으로</span>
            </button>
          </div>

          {/* Header */}
          <div className="pb-3 border-b border-zinc-200 dark:border-zinc-800 space-y-1.5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-extrabold text-zinc-900 dark:text-zinc-100 font-serif flex items-center gap-2 flex-wrap">
                {activeHymnWithEdits.type === 'new' && (
                  <span className="text-amber-600 dark:text-amber-400 font-mono text-lg sm:text-xl font-bold">
                    {activeHymnWithEdits.number}장
                  </span>
                )}
                <span>{activeHymnWithEdits.title}</span>
                {activeHymnWithEdits.type !== 'new' && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-sans font-bold border border-amber-500/20">
                    가스펠 / CCM
                  </span>
                )}
                {activeHymnWithEdits.isCustom && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-sans font-bold border border-emerald-500/20">
                    직접 등록 곡
                  </span>
                )}
              </h3>

              {/* Prev / Next Hymn Quick Nav + Edit Lyrics Button + IsEdited Badge */}
              <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 whitespace-nowrap">
                {activeHymnWithEdits.isEdited && (
                  <span className="text-xs px-2 py-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 font-sans font-bold border border-blue-500/20 shrink-0">
                    수정됨
                  </span>
                )}
                <button
                  onClick={handleOpenEditLyricsModal}
                  className="px-2 sm:px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer border border-amber-500/30 active:scale-95 shrink-0"
                  title="가사 직접 수정하기"
                >
                  <Edit3 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>가사 수정</span>
                </button>
                <button
                  onClick={handlePrevHymn}
                  className="px-2 sm:px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer border border-zinc-200 dark:border-zinc-700 active:scale-95 shrink-0"
                  title="이전 찬송가"
                >
                  <ChevronLeft className="w-3.5 h-3.5 text-amber-600" />
                  <span>이전 곡</span>
                </button>
                <button
                  onClick={handleNextHymn}
                  className="px-2 sm:px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer border border-zinc-200 dark:border-zinc-700 active:scale-95 shrink-0"
                  title="다음 찬송가"
                >
                  <span>다음 곡</span>
                  <ChevronRight className="w-3.5 h-3.5 text-amber-600" />
                </button>
              </div>
            </div>

            <div className="text-[11px] sm:text-xs text-zinc-500 flex items-center gap-1.5 sm:gap-2.5 font-medium flex-nowrap overflow-x-auto no-scrollbar py-0.5 whitespace-nowrap">
              {activeHymnWithEdits.artist && (
                <span className="font-bold text-zinc-700 dark:text-zinc-300 shrink-0">
                  아티스트: {activeHymnWithEdits.artist}
                </span>
              )}
              <span className="shrink-0">주제: {activeHymnWithEdits.category}</span>
              {activeHymnWithEdits.key && <span className="shrink-0">조성: {activeHymnWithEdits.key}</span>}
              {activeHymnWithEdits.scriptureRef && (
                <button
                  onClick={() => handleOpenScriptureModal(activeHymnWithEdits.scriptureRef!)}
                  className="inline-flex items-center gap-1 text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 font-bold hover:underline cursor-pointer transition-all active:scale-95 bg-amber-500/10 px-1.5 py-0.5 rounded-md border border-amber-500/20 shrink-0"
                  title={`${activeHymnWithEdits.scriptureRef} 성경 구절 읽기`}
                >
                  <Book className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>관련 성경: {activeHymnWithEdits.scriptureRef}</span>
                  <ExternalLink className="w-2.5 h-2.5 shrink-0 opacity-70" />
                </button>
              )}
            </div>
          </div>

          {/* YouTube Embedded Player or Search Link */}
          {youtubeEmbedUrl ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-zinc-700 dark:text-zinc-300 flex-wrap gap-1.5">
                <span className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
                  <Youtube className="w-4 h-4" />
                  <span>유튜브 찬양 영상</span>
                </span>
                <a
                  href={activeHymnWithEdits.youtubeUrl || youtubeSearchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white font-extrabold flex items-center gap-1 text-[11px] shadow-xs transition-all cursor-pointer active:scale-95 shrink-0"
                >
                  <Youtube className="w-3.5 h-3.5" />
                  <span>유튜브 앱에서 보기</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-sm bg-black aspect-video relative">
                <iframe
                  src={youtubeEmbedUrl}
                  title={activeHymnWithEdits.title}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
              <div className="p-2.5 rounded-xl bg-amber-50/80 dark:bg-zinc-800/80 border border-amber-200/80 dark:border-zinc-700/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] text-zinc-600 dark:text-zinc-300">
                <span className="leading-relaxed">
                  💡 저작권 및 보안 설정으로 화면에서 영상 재생이 불가능할 경우, 오른쪽 <strong>'유튜브 앱에서 보기'</strong> 버튼으로 바로 감상하실 수 있습니다.
                </span>
                <a
                  href={youtubeSearchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-red-600 dark:text-red-400 hover:underline font-bold shrink-0 whitespace-nowrap flex items-center gap-1"
                >
                  <span>유튜브 찬양/MR 검색</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ) : (
            <div className="p-2 px-3.5 rounded-2xl bg-red-50/80 dark:bg-zinc-800/80 border border-red-200/80 dark:border-zinc-700/80 flex items-center gap-3">
              <Youtube className="w-5 h-5 text-red-600 shrink-0" />
              <div className="h-4 w-px bg-red-200 dark:bg-zinc-700 shrink-0" />
              <a
                href={youtubeSearchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer active:scale-95"
              >
                <Youtube className="w-4 h-4" />
                <span>유튜브 앱/웹에서 바로 재생</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          {/* Verses & Lyrics */}
          <div className="space-y-2 font-serif text-xs sm:text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
            {activeHymnWithEdits.verses.map((verse, idx) => {
              const isActive = isPlayingAudio && activeVerseIndex === idx;
              return (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border flex items-start gap-2.5 transition-all ${
                    isActive
                      ? 'bg-amber-100/80 dark:bg-amber-900/40 border-amber-500 text-amber-950 dark:text-amber-100 shadow-sm ring-2 ring-amber-500/20'
                      : 'bg-zinc-50 dark:bg-zinc-800/40 border-zinc-200/60 dark:border-zinc-800'
                  }`}
                >
                  <span
                    className={`font-sans font-extrabold text-xs shrink-0 mt-0.5 ${
                      isActive
                        ? 'text-amber-700 dark:text-amber-300'
                        : 'text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    [{idx + 1}]
                  </span>
                  <span className="leading-relaxed [word-break:keep-all] whitespace-pre-line">{verse}</span>
                </div>
              );
            })}

            {activeHymnWithEdits.chorus && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
                <span className="font-sans font-extrabold text-xs text-amber-700 dark:text-amber-400 shrink-0 mt-0.5">
                  [후렴]
                </span>
                <span className="font-semibold leading-relaxed [word-break:keep-all] whitespace-pre-line">
                  {activeHymnWithEdits.chorus}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Register Custom Gospel Song Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 space-y-4 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-600" />
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 font-serif">
                새 가스펠 / CCM 곡 직접 등록
              </h3>
            </div>
            <p className="text-xs text-zinc-500">
              좋아하시는 찬양 곡 제목, 유튜브 영상 링크, 가사를 등록하여 보관하고 감상해 보세요.
            </p>

            <form onSubmit={handleAddCustomGospel} className="space-y-3.5 pt-2">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  곡 제목 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="예: 은혜, 원하고 바라고 기도합니다"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    찬양팀 / 아티스트
                  </label>
                  <input
                    type="text"
                    placeholder="예: 손경민, 마커스워십"
                    value={newArtist}
                    onChange={(e) => setNewArtist(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    카테고리 / 주제
                  </label>
                  <input
                    type="text"
                    placeholder="예: 은혜 / 감사, 기도"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Youtube className="w-3.5 h-3.5 text-red-500" />
                    유튜브 주소 (링크)
                  </span>
                  <span className="text-[10px] text-zinc-400 font-normal">
                    예: https://www.youtube.com/watch?v=...
                  </span>
                </label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type="url"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={newYoutubeUrl}
                    onChange={(e) => setNewYoutubeUrl(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 text-xs sm:text-sm font-mono focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  관련 성경구절 (선택)
                </label>
                <input
                  type="text"
                  placeholder="예: 고린도전서 15:10"
                  value={newScriptureRef}
                  onChange={(e) => setNewScriptureRef(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  가사 (줄바꿈으로 구분)
                </label>
                <textarea
                  rows={4}
                  placeholder="가사를 입력해 주세요. 줄바꿈을 통해 소절을 구분할 수 있습니다."
                  value={newLyrics}
                  onChange={(e) => setNewLyrics(e.target.value)}
                  className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 text-xs sm:text-sm font-serif focus:ring-2 focus:ring-amber-500 leading-relaxed"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>등록하기</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Hymn Lyrics Modal */}
      {isEditLyricsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 space-y-4 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsEditLyricsModalOpen(false)}
              className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-amber-600" />
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 font-serif">
                {activeHymnWithEdits.type === 'new' ? `${activeHymnWithEdits.number}장 ` : ''}
                {activeHymnWithEdits.title} 가사 수정/보완
              </h3>
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed">
              찬송가 가사를 직접 수정하실 수 있습니다. 엔터(줄바꿈)가 가사 화면에 그대로 반영되며, 아래 <b>빠른 도구</b>를 통해 전체가사를 한 번에 붙여넣어 자동 정리하거나 텍스트 파일을 불러오실 수 있습니다.
            </p>

            {/* Quick Action Tools Bar */}
            <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs">
              <button
                type="button"
                onClick={() => setIsSmartParseOpen(!isSmartParseOpen)}
                className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  isSmartParseOpen
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-white dark:bg-zinc-800 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-zinc-700'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>한 번에 붙여넣기 & 자동정리</span>
              </button>

              <label className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 font-bold flex items-center gap-1 transition-all cursor-pointer border border-zinc-200 dark:border-zinc-700">
                <FileText className="w-3.5 h-3.5 text-blue-500" />
                <span>.txt 파일 불러오기</span>
                <input
                  type="file"
                  accept=".txt"
                  onChange={handleImportTextFile}
                  className="hidden"
                />
              </label>
            </div>

            {/* Smart Paste & Auto-Parse Box */}
            {isSmartParseOpen && (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2.5 animate-fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    전체 가사 한 번에 붙여넣기 (인터넷/메모장 복사본)
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsSmartParseOpen(false)}
                    className="text-amber-700 dark:text-amber-400 text-xs hover:underline cursor-pointer"
                  >
                    닫기
                  </button>
                </div>
                <textarea
                  rows={4}
                  placeholder="웹사이트, 카톡, 외부 메모에서 복사한 가사 전체를 여기에 그대로 붙여넣으세요.&#10;예:&#10;1절 찬양 성부 성자 성령...&#10;2절 찬양 하나님...&#10;[후렴] 영원토록 찬양해..."
                  value={smartInputText}
                  onChange={(e) => setSmartInputText(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-amber-500/30 bg-white dark:bg-zinc-900 text-xs font-serif leading-relaxed focus:ring-2 focus:ring-amber-500"
                />
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-amber-700 dark:text-amber-300">
                    * 절 번호(1., 1절, [1절]) 및 후렴구([후렴])를 자동으로 감지하여 깔끔하게 구분해 줍니다.
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      applySmartParseText(smartInputText);
                      setSmartInputText('');
                      setIsSmartParseOpen(false);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>스마트 자동 정리 적용</span>
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleSaveLyricsEdit} className="space-y-3.5 pt-1">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  절별 가사 (엔터/줄바꿈 그대로 반영)
                </label>
                <textarea
                  rows={8}
                  required
                  placeholder="1절 가사...&#10;&#10;2절 가사...&#10;&#10;3절 가사..."
                  value={editVersesText}
                  onChange={(e) => setEditVersesText(e.target.value)}
                  className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 text-xs sm:text-sm font-serif focus:ring-2 focus:ring-amber-500 leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                  후렴 가사 (선택)
                </label>
                <textarea
                  rows={2}
                  placeholder="후렴구가 있을 경우 입력해 주세요."
                  value={editChorusText}
                  onChange={(e) => setEditChorusText(e.target.value)}
                  className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 text-xs sm:text-sm font-serif focus:ring-2 focus:ring-amber-500 leading-relaxed"
                />
              </div>

              <div className="pt-2 flex items-center justify-between gap-2">
                {activeHymnWithEdits.isEdited ? (
                  <button
                    type="button"
                    onClick={handleResetLyricsEdit}
                    className="px-3 py-1.5 rounded-xl border border-red-300 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-xs font-bold hover:bg-red-100 cursor-pointer flex items-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>원래 가사로 복원</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditLyricsModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>가사 저장하기</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Related Scripture View Modal */}
      {scriptureModalState && scriptureModalState.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 space-y-4 relative max-h-[85vh] flex flex-col">
            <button
              onClick={() => setScriptureModalState(null)}
              className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3 shrink-0">
              <Book className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
              <div>
                <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 font-serif">
                  관련 성경 말씀: {scriptureModalState.refText}
                </h3>
                <p className="text-xs text-zinc-500">
                  찬송가와 연관된 성경 본문 구절입니다.
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 font-serif text-xs sm:text-sm leading-relaxed">
              {scriptureModalState.verses.map((v) => {
                const isTarget = scriptureModalState.targetVerseNum === v.number;
                return (
                  <div
                    key={v.number}
                    className={`p-3 rounded-xl border transition-all ${
                      isTarget
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-950 dark:text-amber-100 font-medium shadow-xs'
                        : 'bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200/80 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200'
                    }`}
                  >
                    <span className="font-sans font-extrabold text-amber-600 dark:text-amber-400 mr-2 text-xs">
                      {v.number}절
                    </span>
                    <span>{v.text}</span>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2 shrink-0">
              <button
                onClick={() => setScriptureModalState(null)}
                className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                닫기
              </button>

              {onNavigateToScripture && (
                <button
                  onClick={() => {
                    const ref = scriptureModalState.refText;
                    setScriptureModalState(null);
                    onNavigateToScripture(ref);
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5 active:scale-95 transition-all"
                >
                  <Book className="w-4 h-4" />
                  <span>성경 탭에서 전체 {scriptureModalState.chapter}장 읽기</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bulk Backup / Restore Modal */}
      {isBackupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-6 space-y-4 relative">
            <button
              onClick={() => setIsBackupModalOpen(false)}
              className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <Download className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 font-serif">
                  찬송가 수정 가사 일괄 백업 & 복원
                </h3>
                <p className="text-xs text-zinc-500">
                  수정한 가사 데이터를 JSON 파일로 내보내거나 가져옵니다.
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-1">
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-1.5">
                <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-amber-600" />
                  수정 가사 파일로 백업받기
                </h4>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  현재까지 수정 및 보완하신 모든 찬송가 가사({Object.keys(editedLyricsMap).length}곡)를 내 컴퓨터/기기에 JSON 파일로 보관합니다.
                </p>
                <button
                  onClick={handleExportBackupJSON}
                  disabled={Object.keys(editedLyricsMap).length === 0}
                  className="mt-2 w-full py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center justify-center gap-1.5 transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>내 백업 파일(.json) 다운로드</span>
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 space-y-1.5">
                <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-blue-500" />
                  백업 파일 불러오기 (복원)
                </h4>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  이전에 저장해둔 백업 JSON 파일을 선택하여 수정 가사를 한 번에 불러옵니다.
                </p>
                <label className="mt-2 w-full py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-900 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center justify-center gap-1.5 transition-all">
                  <Upload className="w-4 h-4" />
                  <span>백업 JSON 파일 선택하기</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportBackupJSON}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex justify-end">
              <button
                onClick={() => setIsBackupModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
