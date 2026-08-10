import React, { useState, useEffect } from 'react';
import { Book } from '../types';
import { BIBLE_BOOKS } from '../data/bibleData';
import { BIBLE_OVERVIEWS, BibleOverview } from '../data/bibleOverviewsData';
import {
  Search,
  X,
  BookOpen,
  BookOpenCheck,
  List,
  Check,
  ChevronRight,
  Sparkles,
  UserCheck,
  FileText,
  Tag,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentBook: Book;
  currentChapter: number;
  onSelectBookAndChapter: (book: Book, chapter: number) => void;
  initialMode?: 'list' | 'overview';
}

export const BibleBooksModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentBook,
  currentChapter,
  onSelectBookAndChapter,
  initialMode = 'list',
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'overview'>(initialMode);
  const [activeTestament, setActiveTestament] = useState<'all' | 'OT' | 'NT'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedBookId, setExpandedBookId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setViewMode(initialMode);
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const filteredBooks = BIBLE_BOOKS.filter((book) => {
    const matchesTestament = activeTestament === 'all' || book.testament === activeTestament;
    const cleanSearch = searchQuery.trim().toLowerCase();
    const overview = BIBLE_OVERVIEWS[book.id];
    const matchesSearch =
      !cleanSearch ||
      book.name.toLowerCase().includes(cleanSearch) ||
      book.englishName.toLowerCase().includes(cleanSearch) ||
      book.category.toLowerCase().includes(cleanSearch) ||
      (overview && overview.summary.toLowerCase().includes(cleanSearch)) ||
      (overview && overview.keyTheme.toLowerCase().includes(cleanSearch));

    return matchesTestament && matchesSearch;
  });

  const otBooks = filteredBooks.filter((b) => b.testament === 'OT');
  const ntBooks = filteredBooks.filter((b) => b.testament === 'NT');

  const handleBookClick = (book: Book) => {
    if (expandedBookId === book.id) {
      setExpandedBookId(null);
    } else {
      setExpandedBookId(book.id);
    }
  };

  const handleChapterClick = (book: Book, chapter: number) => {
    onSelectBookAndChapter(book, chapter);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-4xl rounded-3xl bg-white dark:bg-zinc-900 shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden text-zinc-900 dark:text-zinc-100 flex flex-col max-h-[92vh]">
        {/* Modal Top Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-700 via-emerald-600 to-amber-600 text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-inner shrink-0">
              {viewMode === 'overview' ? (
                <BookOpenCheck className="w-6 h-6 text-amber-200" />
              ) : (
                <BookOpen className="w-6 h-6 text-amber-200" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-extrabold font-serif tracking-tight">
                  {viewMode === 'overview' ? '성경 66권 전체 개요 및 요약' : '성경 66권 한눈에 보기'}
                </h2>
              </div>
              <p className="text-xs text-amber-100/90 leading-tight">
                {viewMode === 'overview'
                  ? '각 성경 권별 핵심 주제, 저자, 요약 개요를 확인하고 원하는 장으로 이동할 수 있습니다.'
                  : '원하는 성경 책을 클릭한 뒤 장 번호를 누르면 즉시 해당 본문으로 이동합니다.'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-black/20 hover:bg-black/40 transition-colors text-white shrink-0 cursor-pointer"
            title="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* View Mode Toggle Bar (성경목록 vs 성경개요) */}
        <div className="p-2.5 sm:p-3 bg-amber-500/10 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 w-full">
            <button
              onClick={() => setViewMode('overview')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                viewMode === 'overview'
                  ? 'bg-amber-600 text-white shadow-md ring-2 ring-amber-400/50'
                  : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-amber-500/10'
              }`}
            >
              <BookOpenCheck className="w-4 h-4 text-amber-300 shrink-0" />
              <span>💡 성경개요 (요약/주제)</span>
            </button>

            <button
              onClick={() => setViewMode('list')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-400/50'
                  : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-emerald-500/10'
              }`}
            >
              <List className="w-4 h-4 text-emerald-300 shrink-0" />
              <span>📖 성경목록 (빠른 장선택)</span>
            </button>
          </div>
        </div>

        {/* Filter Controls & Search Input Bar */}
        <div className="p-3 sm:p-4 bg-zinc-50 dark:bg-zinc-900/80 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          {/* Testament Tabs */}
          <div className="flex items-center gap-1.5 bg-zinc-200 dark:bg-zinc-800 p-1 rounded-xl w-full sm:w-auto">
            <button
              onClick={() => setActiveTestament('all')}
              className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTestament === 'all'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              전체 66권
            </button>
            <button
              onClick={() => setActiveTestament('OT')}
              className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTestament === 'OT'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              구약 39권
            </button>
            <button
              onClick={() => setActiveTestament('NT')}
              className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTestament === 'NT'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              신약 27권
            </button>
          </div>

          {/* Search Input Box */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="성경 이름, 주제, 개요 키워드 검색..."
              className="w-full pl-9 pr-8 py-1.5 rounded-xl text-xs bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-zinc-400 hover:text-zinc-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Main Content Area */}
        <div className="p-3 sm:p-5 overflow-y-auto space-y-6 flex-1">
          {/* OVERVIEW MODE */}
          {viewMode === 'overview' ? (
            <div className="space-y-6">
              {/* Old Testament Overview List */}
              {(activeTestament === 'all' || activeTestament === 'OT') && otBooks.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-amber-500/30 pb-2">
                    <span className="text-sm font-extrabold text-amber-700 dark:text-amber-400 flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-amber-500 shadow-xs" />
                      <span>구약성경 개요 (39권)</span>
                    </span>
                    <span className="text-xs text-amber-600 dark:text-amber-400 font-bold">
                      율법서 · 역사서 · 시가서 · 선지서
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {otBooks.map((book) => {
                      const overview = BIBLE_OVERVIEWS[book.id];
                      const isCurrent = currentBook.id === book.id;
                      const isExpanded = expandedBookId === book.id;

                      return (
                        <div
                          key={book.id}
                          className={`rounded-2xl border transition-all overflow-hidden ${
                            isCurrent
                              ? 'border-amber-500 bg-amber-500/10 dark:bg-amber-950/30 shadow-md ring-1 ring-amber-500/40'
                              : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/90 hover:border-amber-400'
                          }`}
                        >
                          <div className="p-4 space-y-2.5">
                            {/* Header row */}
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="text-base font-extrabold font-serif text-amber-900 dark:text-amber-200">
                                    {book.name}
                                  </h3>
                                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                                    ({book.englishName})
                                  </span>
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                                    {book.category} • {book.chapterCount}장
                                  </span>
                                </div>

                                {overview?.author && (
                                  <div className="flex items-center gap-1 mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                                    <UserCheck className="w-3 h-3 text-amber-600 shrink-0" />
                                    <span>{overview.author}</span>
                                  </div>
                                )}
                              </div>

                              <button
                                onClick={() => handleBookClick(book)}
                                className="px-2.5 py-1 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shrink-0 transition-transform active:scale-95 cursor-pointer shadow-xs"
                              >
                                {isExpanded ? '장 닫기' : '읽기/장선택'}
                              </button>
                            </div>

                            {/* Key Theme Badge */}
                            {overview?.keyTheme && (
                              <div className="flex items-start gap-1.5 p-2 rounded-xl bg-amber-500/10 dark:bg-zinc-950/60 text-xs font-bold text-amber-800 dark:text-amber-300 border border-amber-500/20">
                                <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                                <span>핵심 주제: {overview.keyTheme}</span>
                              </div>
                            )}

                            {/* Summary Text */}
                            {overview?.summary && (
                              <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed font-sans">
                                {overview.summary}
                              </p>
                            )}

                            {/* Key Chapters info if available */}
                            {overview?.keyChapters && (
                              <div className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1 border-t border-zinc-100 dark:border-zinc-800/80 pt-2">
                                <Tag className="w-3 h-3 text-amber-600 shrink-0" />
                                <span className="font-semibold">주요장:</span>
                                <span>{overview.keyChapters}</span>
                              </div>
                            )}

                            {/* Expanded Chapter Jump Buttons */}
                            {isExpanded && (
                              <div className="pt-3 border-t border-amber-500/20 animate-in fade-in duration-150">
                                <div className="text-xs font-extrabold text-amber-700 dark:text-amber-400 mb-2">
                                  📖 이동할 장 번호를 선택하세요 (총 {book.chapterCount}장)
                                </div>
                                <div className="grid grid-cols-6 sm:grid-cols-10 gap-1.5 max-h-36 overflow-y-auto p-1 bg-zinc-50 dark:bg-zinc-900 rounded-xl">
                                  {Array.from({ length: book.chapterCount }, (_, i) => i + 1).map(
                                    (chNum) => (
                                      <button
                                        key={chNum}
                                        onClick={() => handleChapterClick(book, chNum)}
                                        className="py-1 rounded-lg text-xs font-bold bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-amber-600 hover:text-white transition-all cursor-pointer shadow-2xs text-center"
                                      >
                                        {chNum}장
                                      </button>
                                    )
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* New Testament Overview List */}
              {(activeTestament === 'all' || activeTestament === 'NT') && ntBooks.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between border-b border-indigo-500/30 pb-2">
                    <span className="text-sm font-extrabold text-indigo-700 dark:text-indigo-400 flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-indigo-500 shadow-xs" />
                      <span>신약성경 개요 (27권)</span>
                    </span>
                    <span className="text-xs text-indigo-600 dark:text-indigo-400 font-bold">
                      복음서 · 역사서 · 서신서 · 예언서
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {ntBooks.map((book) => {
                      const overview = BIBLE_OVERVIEWS[book.id];
                      const isCurrent = currentBook.id === book.id;
                      const isExpanded = expandedBookId === book.id;

                      return (
                        <div
                          key={book.id}
                          className={`rounded-2xl border transition-all overflow-hidden ${
                            isCurrent
                              ? 'border-indigo-500 bg-indigo-500/10 dark:bg-indigo-950/30 shadow-md ring-1 ring-indigo-500/40'
                              : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/90 hover:border-indigo-400'
                          }`}
                        >
                          <div className="p-4 space-y-2.5">
                            {/* Header row */}
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="text-base font-extrabold font-serif text-indigo-900 dark:text-indigo-200">
                                    {book.name}
                                  </h3>
                                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                                    ({book.englishName})
                                  </span>
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
                                    {book.category} • {book.chapterCount}장
                                  </span>
                                </div>

                                {overview?.author && (
                                  <div className="flex items-center gap-1 mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                                    <UserCheck className="w-3 h-3 text-indigo-600 shrink-0" />
                                    <span>{overview.author}</span>
                                  </div>
                                )}
                              </div>

                              <button
                                onClick={() => handleBookClick(book)}
                                className="px-2.5 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shrink-0 transition-transform active:scale-95 cursor-pointer shadow-xs"
                              >
                                {isExpanded ? '장 닫기' : '읽기/장선택'}
                              </button>
                            </div>

                            {/* Key Theme Badge */}
                            {overview?.keyTheme && (
                              <div className="flex items-start gap-1.5 p-2 rounded-xl bg-indigo-500/10 dark:bg-zinc-950/60 text-xs font-bold text-indigo-800 dark:text-indigo-300 border border-indigo-500/20">
                                <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                                <span>핵심 주제: {overview.keyTheme}</span>
                              </div>
                            )}

                            {/* Summary Text */}
                            {overview?.summary && (
                              <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed font-sans">
                                {overview.summary}
                              </p>
                            )}

                            {/* Key Chapters info if available */}
                            {overview?.keyChapters && (
                              <div className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1 border-t border-zinc-100 dark:border-zinc-800/80 pt-2">
                                <Tag className="w-3 h-3 text-indigo-600 shrink-0" />
                                <span className="font-semibold">주요장:</span>
                                <span>{overview.keyChapters}</span>
                              </div>
                            )}

                            {/* Expanded Chapter Jump Buttons */}
                            {isExpanded && (
                              <div className="pt-3 border-t border-indigo-500/20 animate-in fade-in duration-150">
                                <div className="text-xs font-extrabold text-indigo-700 dark:text-indigo-400 mb-2">
                                  📖 이동할 장 번호를 선택하세요 (총 {book.chapterCount}장)
                                </div>
                                <div className="grid grid-cols-6 sm:grid-cols-10 gap-1.5 max-h-36 overflow-y-auto p-1 bg-zinc-50 dark:bg-zinc-900 rounded-xl">
                                  {Array.from({ length: book.chapterCount }, (_, i) => i + 1).map(
                                    (chNum) => (
                                      <button
                                        key={chNum}
                                        onClick={() => handleChapterClick(book, chNum)}
                                        className="py-1 rounded-lg text-xs font-bold bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-indigo-600 hover:text-white transition-all cursor-pointer shadow-2xs text-center"
                                      >
                                        {chNum}장
                                      </button>
                                    )
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* COMPACT LIST MODE (성경목록) */
            <div className="space-y-6">
              {/* Old Testament Section */}
              {(activeTestament === 'all' || activeTestament === 'OT') && otBooks.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
                    <span className="text-sm font-extrabold text-amber-700 dark:text-amber-400 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                      <span>구약성경 (39권)</span>
                    </span>
                    <span className="text-xs text-zinc-500 font-mono">39권</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                    {otBooks.map((book) => {
                      const isCurrent = currentBook.id === book.id;
                      const isExpanded = expandedBookId === book.id;

                      return (
                        <div
                          key={book.id}
                          className={`col-span-1 rounded-2xl border transition-all overflow-hidden ${
                            isExpanded
                              ? 'col-span-2 sm:col-span-3 md:col-span-4 lg:col-span-6 border-amber-500 ring-2 ring-amber-500/30 bg-amber-500/5 dark:bg-amber-950/20 shadow-md'
                              : isCurrent
                              ? 'border-amber-500 bg-amber-500/10 text-amber-900 dark:text-amber-300 font-bold'
                              : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/80 hover:border-amber-400 hover:bg-amber-50 dark:hover:bg-zinc-800'
                          }`}
                        >
                          {/* Book Button */}
                          <button
                            onClick={() => handleBookClick(book)}
                            className="w-full p-3 text-left flex items-center justify-between gap-2 cursor-pointer"
                          >
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-extrabold text-sm">{book.name}</span>
                                {isCurrent && (
                                  <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                                )}
                              </div>
                              <div className="flex items-center gap-1 mt-0.5">
                                <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                                  {book.category}
                                </span>
                                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">
                                  • {book.chapterCount}장
                                </span>
                              </div>
                            </div>

                            <ChevronRight
                              className={`w-4 h-4 text-zinc-400 transition-transform ${
                                isExpanded ? 'rotate-90 text-amber-600' : ''
                              }`}
                            />
                          </button>

                          {/* Expanded Chapter Selector Grid */}
                          {isExpanded && (
                            <div className="p-3 border-t border-amber-500/20 bg-white/80 dark:bg-zinc-900/80 animate-in fade-in duration-150">
                              <div className="flex items-center justify-between mb-2 text-xs font-extrabold text-amber-700 dark:text-amber-400">
                                <span>📖 {book.name} 총 {book.chapterCount}장 중 이동할 장을 선택하세요</span>
                              </div>

                              <div className="grid grid-cols-5 sm:grid-cols-10 md:grid-cols-12 lg:grid-cols-15 gap-1.5 max-h-48 overflow-y-auto p-1">
                                {Array.from({ length: book.chapterCount }, (_, i) => i + 1).map(
                                  (chNum) => {
                                    const isSelCh = isCurrent && currentChapter === chNum;
                                    return (
                                      <button
                                        key={chNum}
                                        onClick={() => handleChapterClick(book, chNum)}
                                        className={`py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                                          isSelCh
                                            ? 'bg-amber-600 text-white shadow-xs font-black ring-2 ring-amber-300'
                                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-amber-500 hover:text-white'
                                        }`}
                                      >
                                        {chNum}
                                      </button>
                                    );
                                  }
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* New Testament Section */}
              {(activeTestament === 'all' || activeTestament === 'NT') && ntBooks.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between border-b border-indigo-500/20 pb-2">
                    <span className="text-sm font-extrabold text-indigo-700 dark:text-indigo-400 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                      <span>신약성경 (27권)</span>
                    </span>
                    <span className="text-xs text-zinc-500 font-mono">27권</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                    {ntBooks.map((book) => {
                      const isCurrent = currentBook.id === book.id;
                      const isExpanded = expandedBookId === book.id;

                      return (
                        <div
                          key={book.id}
                          className={`col-span-1 rounded-2xl border transition-all overflow-hidden ${
                            isExpanded
                              ? 'col-span-2 sm:col-span-3 md:col-span-4 lg:col-span-6 border-indigo-500 ring-2 ring-indigo-500/30 bg-indigo-500/5 dark:bg-indigo-950/20 shadow-md'
                              : isCurrent
                              ? 'border-indigo-500 bg-indigo-500/10 text-indigo-900 dark:text-indigo-300 font-bold'
                              : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/80 hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-zinc-800'
                          }`}
                        >
                          {/* Book Button */}
                          <button
                            onClick={() => handleBookClick(book)}
                            className="w-full p-3 text-left flex items-center justify-between gap-2 cursor-pointer"
                          >
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-extrabold text-sm">{book.name}</span>
                                {isCurrent && (
                                  <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                                )}
                              </div>
                              <div className="flex items-center gap-1 mt-0.5">
                                <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                                  {book.category}
                                </span>
                                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">
                                  • {book.chapterCount}장
                                </span>
                              </div>
                            </div>

                            <ChevronRight
                              className={`w-4 h-4 text-zinc-400 transition-transform ${
                                isExpanded ? 'rotate-90 text-indigo-600' : ''
                              }`}
                            />
                          </button>

                          {/* Expanded Chapter Selector Grid */}
                          {isExpanded && (
                            <div className="p-3 border-t border-indigo-500/20 bg-white/80 dark:bg-zinc-900/80 animate-in fade-in duration-150">
                              <div className="flex items-center justify-between mb-2 text-xs font-extrabold text-indigo-700 dark:text-indigo-400">
                                <span>📖 {book.name} 총 {book.chapterCount}장 중 이동할 장을 선택하세요</span>
                              </div>

                              <div className="grid grid-cols-5 sm:grid-cols-10 md:grid-cols-12 lg:grid-cols-15 gap-1.5 max-h-48 overflow-y-auto p-1">
                                {Array.from({ length: book.chapterCount }, (_, i) => i + 1).map(
                                  (chNum) => {
                                    const isSelCh = isCurrent && currentChapter === chNum;
                                    return (
                                      <button
                                        key={chNum}
                                        onClick={() => handleChapterClick(book, chNum)}
                                        className={`py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                                          isSelCh
                                            ? 'bg-indigo-600 text-white shadow-xs font-black ring-2 ring-indigo-300'
                                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-indigo-500 hover:text-white'
                                        }`}
                                      >
                                        {chNum}
                                      </button>
                                    );
                                  }
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
