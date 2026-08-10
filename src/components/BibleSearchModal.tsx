import React, { useState, useEffect, useMemo } from 'react';
import { Book, TranslationId } from '../types';
import { TRANSLATIONS, BIBLE_BOOKS, searchBibleVerses, SearchVerseResult } from '../data/bibleData';
import { getCustomBibleCache } from '../utils/customBibleStorage';
import {
  Search,
  X,
  BookOpen,
  Sparkles,
  Copy,
  Check,
  ArrowRight,
  Tag,
  Bookmark,
  Filter,
  LayoutList,
  Grid,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToVerse: (book: Book, chapter: number, verseNum: number) => void;
  onCreateVerseCard: (verseText: string, refText: string) => void;
  initialQuery?: string;
}

const PRESET_TOPIC_KEYWORDS = [
  '태초',
  '사랑',
  '구원',
  '은혜',
  '평안',
  '빛',
  '믿음',
  '소망',
  '축복',
  '기도',
  '지혜',
  '목자',
  '하나님',
  '예수',
  '#H1254',
];

export const BibleSearchModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onNavigateToVerse,
  onCreateVerseCard,
  initialQuery,
}) => {
  const [query, setQuery] = useState(initialQuery || '');
  const [selectedTranslation, setSelectedTranslation] = useState<TranslationId>('KRV');
  const [selectedScope, setSelectedScope] = useState<string>('ALL');
  const [results, setResults] = useState<SearchVerseResult[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [customTranslations, setCustomTranslations] = useState<Array<{ id: TranslationId; name: string }>>([]);

  // Simplify & Filter controls
  const [viewMode, setViewMode] = useState<'compact' | 'card'>('compact'); // 'compact' is 1-line list view, 'card' is detailed card
  const [testamentFilter, setTestamentFilter] = useState<'ALL' | 'OT' | 'NT'>('ALL'); // Quick filter by testament in search results
  const [bookFilter, setBookFilter] = useState<string>('ALL'); // Filter within search results by specific book
  const [subQuery, setSubQuery] = useState<string>(''); // Filter within results by secondary term or chapter
  const [pageSize, setPageSize] = useState<number>(10); // 10, 20, 50, or 999(all)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sortBy, setSortBy] = useState<'default' | 'textLengthAsc' | 'textLengthDesc'>('default');

  useEffect(() => {
    try {
      const cache = getCustomBibleCache();
      const list: Array<{ id: TranslationId; name: string }> = [];
      Object.keys(cache).forEach((name) => {
        list.push({ id: name as TranslationId, name });
      });
      setCustomTranslations(list);
      if (list.length > 0) {
        setSelectedTranslation((prev) => {
          const ids = list.map((t) => t.id);
          if (ids.includes(prev)) return prev;
          return ids[0];
        });
      }
    } catch {}
  }, [isOpen]);

  const allTranslations = customTranslations.length > 0
    ? customTranslations.filter(
        (item, index, self) =>
          index === self.findIndex((t) => t.name.trim() === item.name.trim() || t.id === item.id)
      )
    : TRANSLATIONS;

  const performSearch = (searchQuery: string, transId: TranslationId, scope: string = 'ALL') => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }
    const searchRes = searchBibleVerses(searchQuery, transId, scope);
    setResults(searchRes);
    setTestamentFilter('ALL');
    setBookFilter('ALL');
    setSubQuery('');
    setCurrentPage(1);
  };

  useEffect(() => {
    if (isOpen) {
      const q = initialQuery !== undefined ? initialQuery : query;
      if (initialQuery !== undefined && initialQuery !== query) {
        setQuery(initialQuery);
      }
      if (q && q.trim()) {
        performSearch(q, selectedTranslation, selectedScope);
      } else {
        setResults([]);
      }
    }
  }, [isOpen, initialQuery, selectedTranslation, selectedScope]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(query, selectedTranslation, selectedScope);
  };

  const handleKeywordTagClick = (tag: string) => {
    setQuery(tag);
    setSelectedScope('ALL');
    performSearch(tag, selectedTranslation, 'ALL');
  };

  const handleCopyText = (res: SearchVerseResult) => {
    const shortBook = res.book.shortName || res.book.name;
    const textToCopy = `[${shortBook}${res.chapter}:${res.verse.number}] ${res.matchedText}`;
    navigator.clipboard.writeText(textToCopy);
    const key = `${res.book.id}-${res.chapter}-${res.verse.number}`;
    setCopiedId(key);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleNavigate = (res: SearchVerseResult) => {
    onNavigateToVerse(res.book, res.chapter, res.verse.number);
    onClose();
  };

  const handleCardCreate = (res: SearchVerseResult) => {
    const shortBook = res.book.shortName || res.book.name;
    const refStr = `${shortBook}${res.chapter}:${res.verse.number} (${res.book.englishName})`;
    onCreateVerseCard(res.matchedText, refStr);
    onClose();
  };

  // Compute testament counts
  const otCount = useMemo(
    () => results.filter((r) => r.book.testament === 'OT').length,
    [results]
  );
  const ntCount = useMemo(
    () => results.filter((r) => r.book.testament === 'NT').length,
    [results]
  );

  // Compute available book counts in search results (considering testamentFilter if active)
  const bookCounts = useMemo(() => {
    const map = new Map<string, { book: Book; count: number }>();
    const baseList =
      testamentFilter === 'ALL'
        ? results
        : results.filter((res) => res.book.testament === testamentFilter);

    baseList.forEach((res) => {
      const existing = map.get(res.book.id);
      if (existing) {
        existing.count++;
      } else {
        map.set(res.book.id, { book: res.book, count: 1 });
      }
    });
    return Array.from(map.values());
  }, [results, testamentFilter]);

  // Compute filtered & sorted results
  const filteredResults = useMemo(() => {
    let list = [...results];

    // Testament Filter (구약 / 신약)
    if (testamentFilter !== 'ALL') {
      list = list.filter((res) => res.book.testament === testamentFilter);
    }

    // Book Filter
    if (bookFilter !== 'ALL') {
      list = list.filter((res) => res.book.id === bookFilter);
    }

    // Sub-Query Filter
    if (subQuery.trim()) {
      const sq = subQuery.toLowerCase().trim();
      list = list.filter((res) => {
        const refStr = `${res.book.name} ${res.book.shortName || ''} ${res.chapter}장 ${res.verse.number}절`.toLowerCase();
        const textStr = res.matchedText.toLowerCase();
        return refStr.includes(sq) || textStr.includes(sq);
      });
    }

    // Sorting
    if (sortBy === 'textLengthAsc') {
      list.sort((a, b) => a.matchedText.length - b.matchedText.length);
    } else if (sortBy === 'textLengthDesc') {
      list.sort((a, b) => b.matchedText.length - a.matchedText.length);
    }

    return list;
  }, [results, testamentFilter, bookFilter, subQuery, sortBy]);

  // Pagination logic
  const totalItems = filteredResults.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPageClamped = Math.min(currentPage, totalPages);

  const displayedResults = useMemo(() => {
    if (pageSize >= 999) return filteredResults;
    const startIdx = (currentPageClamped - 1) * pageSize;
    return filteredResults.slice(startIdx, startIdx + pageSize);
  }, [filteredResults, currentPageClamped, pageSize]);

  // Helper to highlight matching text
  const renderHighlightedText = (text: string, searchTerm: string) => {
    if (!searchTerm.trim()) return text;
    const escaped = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === searchTerm.toLowerCase() ? (
            <mark
              key={i}
              className="bg-amber-400/50 dark:bg-amber-500/60 text-amber-950 dark:text-amber-100 font-extrabold px-1 py-0.5 rounded-sm"
            >
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  const scopeLabel =
    selectedScope === 'ALL'
      ? '전체 성경'
      : selectedScope === 'OT'
      ? '구약성경'
      : selectedScope === 'NT'
      ? '신약성경'
      : BIBLE_BOOKS.find((b) => b.id === selectedScope)?.name || selectedScope;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-3xl rounded-3xl bg-white dark:bg-zinc-900 shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden text-zinc-900 dark:text-zinc-100 flex flex-col max-h-[92vh]">
        {/* Modal Top Header */}
        <div className="p-3.5 sm:p-5 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-white flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <Search className="w-5 h-5 text-amber-200" />
              <h2 className="text-lg sm:text-xl font-extrabold font-serif">
                말씀 & 구절 검색
              </h2>
            </div>
            <p className="text-xs text-amber-100 hidden sm:block">
              성경 단어, 주제 키워드, 또는 구절 주소(예: 요한복음 3:16, 시편 23)를 검색하세요.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-black/20 hover:bg-black/40 transition-colors text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input Box & Translation/Scope Selector Bar */}
        <div className="p-3 sm:p-4 bg-zinc-50 dark:bg-zinc-900/80 border-b border-zinc-200 dark:border-zinc-800 space-y-2.5 shrink-0">
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-600 dark:text-amber-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  performSearch(e.target.value, selectedTranslation, selectedScope);
                }}
                placeholder="검색어 입력 (예: 소망, 사랑, 요한복음 3:16, 시편 23)..."
                className="w-full pl-10 pr-9 py-2 rounded-2xl text-xs sm:text-sm font-medium bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs text-zinc-900 dark:text-zinc-100"
                autoFocus
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    setResults([]);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex gap-1.5 shrink-0">
              {/* Scope Selector Dropdown */}
              <select
                value={selectedScope}
                onChange={(e) => {
                  setSelectedScope(e.target.value);
                  performSearch(query, selectedTranslation, e.target.value);
                }}
                className="px-2.5 py-2 rounded-2xl text-xs font-bold bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer max-w-[130px] sm:max-w-none"
              >
                <option value="ALL">성경 전체</option>
                <option value="OT">구약 전체</option>
                <option value="NT">신약 전체</option>
                <optgroup label="구약 39권">
                  {BIBLE_BOOKS.filter((b) => b.testament === 'OT').map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="신약 27권">
                  {BIBLE_BOOKS.filter((b) => b.testament === 'NT').map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </optgroup>
              </select>

              {/* Translation Dropdown Filter */}
              <select
                value={selectedTranslation}
                onChange={(e) => setSelectedTranslation(e.target.value as TranslationId)}
                className="px-2.5 py-2 rounded-2xl text-xs font-bold bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
              >
                {allTranslations.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>

              {/* Search Button */}
              <button
                type="submit"
                className="px-3.5 py-2 rounded-2xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-extrabold text-xs transition-all shadow-xs shrink-0 flex items-center gap-1 cursor-pointer"
              >
                <Search className="w-4 h-4" />
                <span>검색</span>
              </button>
            </div>
          </form>

          {/* Quick Popular Keywords Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
            <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 shrink-0 flex items-center gap-1">
              <Tag className="w-3 h-3" />
              <span>추천 키워드:</span>
            </span>
            {PRESET_TOPIC_KEYWORDS.map((kw) => (
              <button
                key={kw}
                onClick={() => handleKeywordTagClick(kw)}
                className={`px-2 py-0.5 rounded-xl text-[11px] font-medium transition-all shrink-0 cursor-pointer ${
                  query === kw
                    ? 'bg-amber-600 text-white font-extrabold shadow-xs'
                    : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:border-amber-400 hover:text-amber-600'
                }`}
              >
                #{kw}
              </button>
            ))}
          </div>
        </div>

        {/* Results Toolbar: View Mode Toggle, Book Filter Chips, Sub-search & Pagination */}
        {results.length > 0 && (
          <div className="p-3 bg-amber-500/5 dark:bg-amber-950/20 border-b border-zinc-200 dark:border-zinc-800 space-y-2 shrink-0">
            {/* Top Toolbar line: Stats + Sub-search + Page Size + View Mode Toggle in single line */}
            <div className="flex items-center justify-between gap-1.5 overflow-x-auto scrollbar-none whitespace-nowrap text-[11px]">
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-zinc-600 dark:text-zinc-300 font-medium shrink-0">
                  총 <strong className="text-amber-600 dark:text-amber-400 font-black">{totalItems}</strong>건
                </span>

                {/* Sub-Search input inside results */}
                <div className="relative shrink-0">
                  <input
                    type="text"
                    value={subQuery}
                    onChange={(e) => {
                      setSubQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="결과 내 검색..."
                    className="pl-2 pr-5 py-0.5 text-[11px] rounded-md bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-500 w-24 sm:w-32"
                  />
                  {subQuery && (
                    <button
                      onClick={() => setSubQuery('')}
                      className="absolute right-1 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {/* Page Size Selector */}
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-1.5 py-0.5 text-[11px] font-bold rounded-md bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 focus:outline-none cursor-pointer shrink-0"
                >
                  <option value={10}>10개씩</option>
                  <option value={20}>20개씩</option>
                  <option value={50}>50개씩</option>
                  <option value={999}>전체보기</option>
                </select>

                {/* View Mode Switcher: Compact (List) vs Card */}
                <div className="flex rounded-lg bg-zinc-200 dark:bg-zinc-800 p-0.5 gap-0.5 shrink-0">
                  <button
                    onClick={() => setViewMode('compact')}
                    className={`px-1.5 py-0.5 rounded-md text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                      viewMode === 'compact'
                        ? 'bg-amber-600 text-white shadow-2xs'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
                    }`}
                    title="간단한 리스트 형태로 보기"
                  >
                    <LayoutList className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setViewMode('card')}
                    className={`px-1.5 py-0.5 rounded-md text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                      viewMode === 'card'
                        ? 'bg-amber-600 text-white shadow-2xs'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
                    }`}
                    title="상세 카드 형태로 보기"
                  >
                    <Grid className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Testament Filter (구약 / 신약) & Book-Level Filter Chips */}
            <div className="flex flex-col gap-1.5 pt-1.5 border-t border-zinc-200/60 dark:border-zinc-800/60">
              {/* Testament Filter row */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none text-[11px]">
                <span className="text-zinc-600 dark:text-zinc-400 font-bold shrink-0 flex items-center gap-1">
                  <Filter className="w-3 h-3 text-amber-600" />
                  <span>성경 범위:</span>
                </span>
                <button
                  onClick={() => {
                    setTestamentFilter('ALL');
                    setBookFilter('ALL');
                    setCurrentPage(1);
                  }}
                  className={`px-2.5 py-0.5 rounded-lg font-extrabold shrink-0 transition-all cursor-pointer ${
                    testamentFilter === 'ALL'
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:bg-amber-50 dark:hover:bg-zinc-700'
                  }`}
                >
                  전체 ({results.length})
                </button>
                <button
                  onClick={() => {
                    setTestamentFilter('OT');
                    setBookFilter('ALL');
                    setCurrentPage(1);
                  }}
                  className={`px-2.5 py-0.5 rounded-lg font-extrabold shrink-0 transition-all cursor-pointer ${
                    testamentFilter === 'OT'
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:bg-amber-50 dark:hover:bg-zinc-700'
                  }`}
                >
                  📜 구약 ({otCount})
                </button>
                <button
                  onClick={() => {
                    setTestamentFilter('NT');
                    setBookFilter('ALL');
                    setCurrentPage(1);
                  }}
                  className={`px-2.5 py-0.5 rounded-lg font-extrabold shrink-0 transition-all cursor-pointer ${
                    testamentFilter === 'NT'
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:bg-amber-50 dark:hover:bg-zinc-700'
                  }`}
                >
                  ✝️ 신약 ({ntCount})
                </button>
              </div>

              {/* Book-Level Quick Filter Chips */}
              {bookCounts.length > 1 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none text-[11px]">
                  <span className="text-zinc-400 dark:text-zinc-500 font-medium shrink-0 text-[10px]">
                    권별 상세:
                  </span>
                  <button
                    onClick={() => {
                      setBookFilter('ALL');
                      setCurrentPage(1);
                    }}
                    className={`px-2 py-0.5 rounded-md font-bold shrink-0 transition-all cursor-pointer ${
                      bookFilter === 'ALL'
                        ? 'bg-amber-500/20 text-amber-800 dark:text-amber-200 border border-amber-500/30'
                        : 'bg-white/80 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 hover:bg-amber-50'
                    }`}
                  >
                    전체
                  </button>
                  {bookCounts.map(({ book, count }) => (
                    <button
                      key={book.id}
                      onClick={() => {
                        setBookFilter(book.id);
                        setCurrentPage(1);
                      }}
                      className={`px-2 py-0.5 rounded-md font-bold shrink-0 transition-all cursor-pointer ${
                        bookFilter === book.id
                          ? 'bg-amber-600 text-white shadow-2xs'
                          : 'bg-white/80 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 hover:bg-amber-50'
                      }`}
                    >
                      {book.shortName || book.name} ({count})
                    </button>
                  ))}
                </div>
              )}
            </div>
        </div>
      )}

        {/* Search Results Display Area */}
        <div className="p-3 sm:p-5 overflow-y-auto space-y-2 flex-1">
          {displayedResults.length > 0 ? (
            viewMode === 'compact' ? (
              /* COMPACT 1-LINE LIST VIEW (간단히 보기) */
              <div className="divide-y divide-zinc-200 dark:divide-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden bg-white dark:bg-zinc-900 shadow-2xs">
                {displayedResults.map((res, index) => {
                  const resKey = `${res.book.id}-${res.chapter}-${res.verse.number}`;
                  const isCopied = copiedId === resKey;

                  return (
                    <div
                      key={index}
                      className="p-3 hover:bg-amber-500/10 dark:hover:bg-amber-950/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2 group"
                    >
                      <div className="flex items-start gap-2 min-w-0 flex-1">
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-800 dark:text-amber-200 text-[11px] font-black border border-amber-500/30 shrink-0">
                          {res.book.shortName || res.book.name} {res.chapter}:{res.verse.number}
                        </span>
                        <p className="text-xs sm:text-sm font-serif text-zinc-800 dark:text-zinc-200 leading-snug line-clamp-2 sm:line-clamp-1">
                          "{renderHighlightedText(res.matchedText, query)}"
                        </p>
                      </div>

                      {/* Quick Action Buttons */}
                      <div className="flex items-center justify-end gap-1 shrink-0">
                        <button
                          onClick={() => handleCopyText(res)}
                          title="구절 복사"
                          className="px-2 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-[11px] font-bold transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          {isCopied ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span className="hidden sm:inline">{isCopied ? '복사됨' : '복사'}</span>
                        </button>

                        <button
                          onClick={() => handleCardCreate(res)}
                          title="말씀카드 생성"
                          className="px-2 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/20 text-[11px] font-bold transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Sparkles className="w-3 h-3 text-amber-500" />
                          <span className="hidden sm:inline">카드</span>
                        </button>

                        <button
                          onClick={() => handleNavigate(res)}
                          className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-extrabold shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <span>이동</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* DETAILED CARD VIEW (상세 카드 보기) */
              <div className="space-y-3">
                {displayedResults.map((res, index) => {
                  const resKey = `${res.book.id}-${res.chapter}-${res.verse.number}`;
                  const isCopied = copiedId === resKey;

                  return (
                    <div
                      key={index}
                      className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800 hover:border-amber-400/60 transition-all space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs font-extrabold border border-amber-500/20">
                          📖 {res.book.shortName || res.book.name}{res.chapter}:{res.verse.number} ({res.book.name})
                        </span>

                        <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
                          {res.book.testament === 'OT' ? '구약' : '신약'} • {res.book.category}
                        </span>
                      </div>

                      <p className="text-sm sm:text-base font-serif text-zinc-800 dark:text-zinc-200 leading-relaxed">
                        "{renderHighlightedText(res.matchedText, query)}"
                      </p>

                      <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                        <button
                          onClick={() => handleCopyText(res)}
                          className="px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:text-amber-600 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                              <span className="text-emerald-600">복사완료</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>구절 복사</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => handleCardCreate(res)}
                          className="px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 hover:bg-amber-500/20 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                          <span>말씀카드 생성</span>
                        </button>

                        <button
                          onClick={() => handleNavigate(res)}
                          className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-extrabold shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <span>본문으로 이동</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            <div className="text-center py-12 text-zinc-500 space-y-3">
              <Search className="w-10 h-10 mx-auto text-zinc-400 stroke-1" />
              <p className="text-sm font-bold">
                {results.length > 0
                  ? '현재 지정한 필터/검색 조건에 맞는 구절이 없습니다.'
                  : `[${scopeLabel}] 범위 내에서 "${query}"에 대한 말씀 검색 결과가 없습니다.`}
              </p>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                필터 조건을 변경하거나 '전체'로 초기화해보세요.
              </p>
            </div>
          )}
        </div>

        {/* Modal Bottom Footer & Pagination Bar */}
        <div className="p-3.5 sm:p-4 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0">
          {/* Pagination Navigation */}
          {pageSize < 999 && totalPages > 1 ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPageClamped <= 1}
                className="p-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed hover:bg-amber-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="text-xs font-extrabold text-zinc-700 dark:text-zinc-300">
                {currentPageClamped} / {totalPages} 페이지
              </span>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPageClamped >= totalPages}
                className="p-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed hover:bg-amber-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <span className="text-xs text-zinc-500">
              💡 '이동' 버튼을 누르면 해당 성경 권/장/절 독서 화면으로 즉시 전환됩니다.
            </span>
          )}

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 font-bold text-xs transition-colors cursor-pointer self-end sm:self-auto"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
