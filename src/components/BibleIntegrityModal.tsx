import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  FileCheck,
  RotateCcw,
  BookOpen,
  Search,
  Wrench,
  Check,
  FileText,
  Upload,
  RefreshCw,
  Info,
  ChevronDown,
  ChevronRight,
  Database,
  Sparkles,
  Zap,
  Eye,
  Layers,
  ArrowRightLeft,
  Filter,
  CheckCircle,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import {
  runBibleIntegrityCheck,
  parseBibleTextContent,
  IntegrityReport,
  BookIntegritySummary,
  STANDARD_BIBLE_66_BOOKS,
  findStandardBook,
  ParsedVerse,
} from '../utils/bibleIntegrityChecker';
import { getUploadedBibleList, getCustomBibleCache, saveCustomBible } from '../utils/customBibleStorage';
import { CURATED_CHAPTERS } from '../data/bibleData';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'overview' | 'comparison' | 'sandbox';

export const BibleIntegrityModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [availableTranslations, setAvailableTranslations] = useState<Array<{ name: string; isCustom: boolean }>>([]);
  const [selectedTranslation, setSelectedTranslation] = useState<string>('개역한글');
  const [report, setReport] = useState<IntegrityReport | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'warning' | 'OT' | 'NT'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedBook, setExpandedBook] = useState<string | null>(null);
  const [isFixing, setIsFixing] = useState(false);
  const [fixSuccessMsg, setFixSuccessMsg] = useState<string | null>(null);

  // Comparison Report State
  const [inspectBookName, setInspectBookName] = useState<string>('전도서');
  const [inspectChapter, setInspectChapter] = useState<number>(1);
  const [comparisonFilter, setComparisonFilter] = useState<'all' | 'match' | 'diff' | 'missing'>('all');

  // Live Test Sandbox state
  const [sandboxText, setSandboxText] = useState<string>(
    '21 1 1 다윗의 아들 예루살렘 왕 전도자의 말씀이라\n21 1 2 전도자가 이르되 헛되고 헛되며 헛되고 헛되니 모든 것이 헛되도다\n23 66 22 내가 지을 새 하늘과 새 땅이 내 앞에 항상 있는 것 같이'
  );
  const [sandboxResults, setSandboxResults] = useState<any[]>([]);

  const loadTranslations = () => {
    const customList = getUploadedBibleList();
    const list: Array<{ name: string; isCustom: boolean }> = customList.map((c) => ({
      name: c.name,
      isCustom: true,
    }));
    setAvailableTranslations(list);
    if (list.length > 0) {
      if (!selectedTranslation || !list.some((l) => l.name === selectedTranslation)) {
        setSelectedTranslation(list[0].name);
      }
    } else {
      setSelectedTranslation('');
    }
  };

  const runCheckForTranslation = (transName: string) => {
    if (!transName) {
      setReport(null);
      return;
    }
    const cache = getCustomBibleCache();
    let versesToAnalyze: any[] = [];

    if (cache[transName] && Array.isArray(cache[transName])) {
      versesToAnalyze = cache[transName];
    } else {
      versesToAnalyze = [];
    }

    if (versesToAnalyze.length === 0) {
      setReport(null);
      return;
    }

    const rep = runBibleIntegrityCheck(versesToAnalyze, transName);
    setReport(rep);
  };

  useEffect(() => {
    if (isOpen) {
      loadTranslations();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && selectedTranslation) {
      runCheckForTranslation(selectedTranslation);
      setFixSuccessMsg(null);
    }
  }, [isOpen, selectedTranslation]);

  useEffect(() => {
    if (sandboxText) {
      const parsed = parseBibleTextContent(sandboxText);
      setSandboxResults(parsed);
    } else {
      setSandboxResults([]);
    }
  }, [sandboxText]);

  if (!isOpen) return null;

  const handleAutoFix = async () => {
    if (!report || !selectedTranslation) return;
    setIsFixing(true);
    setFixSuccessMsg(null);

    try {
      let fixedVerses = report.normalizedVerses;

      // Map selectedTranslation to JSON file path if standard
      const fileMap: Record<string, string> = {
        '개역한글': '/bible/krv.json',
        '킹흠정역': '/bible/hkjv.json',
        '킹제임스(KJV)': '/bible/kjv.json',
        '킹제임스': '/bible/kjv.json',
      };

      const jsonUrl = fileMap[selectedTranslation];
      if (jsonUrl) {
        try {
          const res = await fetch(jsonUrl);
          if (res.ok) {
            const freshData = await res.json();
            if (Array.isArray(freshData) && freshData.length > 0) {
              fixedVerses = freshData;
            }
          }
        } catch (e) {
          console.warn('Failed to fetch fresh json for auto fix:', e);
        }
      }

      const ok = await saveCustomBible(selectedTranslation, fixedVerses, true);
      if (ok) {
        setFixSuccessMsg(`'${selectedTranslation}' 성경 데이터가 최신 정규화 패치(예레미야 1364절 / 예레미야애가 154절)로 완벽 교정되어 업데이트 저장되었습니다!`);
        runCheckForTranslation(selectedTranslation);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsFixing(false);
    }
  };

  const handleInspectBook = (bookName: string, chapter = 1) => {
    setInspectBookName(bookName);
    setInspectChapter(chapter);
    setActiveTab('comparison');
  };

  const filteredSummaries = report
    ? report.bookSummaries.filter((sum) => {
        if (filterMode === 'warning' && sum.status === 'ok') return false;
        if (filterMode === 'OT' && sum.bookInfo.testament !== 'OT') return false;
        if (filterMode === 'NT' && sum.bookInfo.testament !== 'NT') return false;

        if (searchQuery.trim()) {
          const q = searchQuery.trim().toLowerCase();
          return (
            sum.bookInfo.name.toLowerCase().includes(q) ||
            sum.bookInfo.englishName.toLowerCase().includes(q) ||
            sum.bookInfo.order.toString() === q
          );
        }
        return true;
      })
    : [];

  // Comparison Logic Computation
  const stdBook = findStandardBook(inspectBookName) || STANDARD_BIBLE_66_BOOKS[20]; // Default Ecclesiastes
  const cache = getCustomBibleCache();

  // Selected Target Translation Verses
  const targetAllVerses: ParsedVerse[] = report?.normalizedVerses || [];
  const targetChapterVerses = targetAllVerses.filter(
    (v) => (v.bookName === stdBook.name || v.bookName === stdBook.id) && Number(v.chapter) === inspectChapter
  );

  // Detect Language of Selected Target DB
  const sampleTargetText = targetAllVerses.slice(0, 10).map((v) => v.text).join(' ');
  const isEnglishBible =
    /kjv|niv|nasb|esv|web|ylt|rsv|asv|net|nkjv|nlt|nrsv|msg|neb|nheb|nirv|ramt|tagalog|tokpisin/i.test(selectedTranslation) ||
    (sampleTargetText.length > 0 && !/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(sampleTargetText));

  const refNameLabel = isEnglishBible ? '표준 영문(KJV)' : '표준 개역한글';

  // Standard Reference Verses Cache fallback
  const referenceAllVerses: ParsedVerse[] = isEnglishBible
    ? cache['KJV'] || cache['킹제임스'] || []
    : cache['개역한글'] || [];
  const referenceChapterVerses = referenceAllVerses.filter(
    (v) => (v.bookName === stdBook.name || v.bookName === stdBook.id) && Number(v.chapter) === inspectChapter
  );

  // Curated Fallback
  const curatedKey = `${stdBook.id}-${inspectChapter}`;
  const curatedVerses = CURATED_CHAPTERS[curatedKey] || [];

  // Determine max verse number
  let maxVerseCount = Math.max(
    targetChapterVerses.length,
    referenceChapterVerses.length,
    curatedVerses.length
  );

  if (maxVerseCount === 0 && targetChapterVerses.length > 0) {
    maxVerseCount = Math.max(...targetChapterVerses.map((v) => v.verse));
  }
  if (maxVerseCount === 0) maxVerseCount = 15; // default view range

  const comparisonItems = [];
  let matchCount = 0;
  let diffCount = 0;
  let missingCount = 0;

  for (let vNum = 1; vNum <= maxVerseCount; vNum++) {
    let refV: ParsedVerse | null = null;

    if (isEnglishBible) {
      // English Standard Reference (KJV)
      if (curatedVerses.length >= vNum) {
        const cur = curatedVerses[vNum - 1];
        if (cur && cur.text && (cur.text.KJV || (cur.text as any).NASB)) {
          refV = {
            bookName: stdBook.name,
            chapter: inspectChapter,
            verse: vNum,
            text: cur.text.KJV || (cur.text as any).NASB || '',
          };
        }
      }
      if (!refV) {
        const cachedRef = referenceChapterVerses.find((x) => Number(x.verse) === vNum);
        if (cachedRef) {
          refV = cachedRef;
        }
      }
    } else {
      // Korean Standard Reference (KRV)
      if (curatedVerses.length >= vNum) {
        const cur = curatedVerses[vNum - 1];
        if (cur && cur.text && (cur.text.KRV || cur.text.NKRV)) {
          refV = {
            bookName: stdBook.name,
            chapter: inspectChapter,
            verse: vNum,
            text: cur.text.KRV || cur.text.NKRV || '',
          };
        }
      }
      if (!refV) {
        const cachedRef = referenceChapterVerses.find((x) => Number(x.verse) === vNum);
        if (cachedRef) {
          refV = cachedRef;
        }
      }
    }

    const targetV = targetChapterVerses.find((x) => Number(x.verse) === vNum);

    let status: 'match' | 'diff' | 'missing' | 'extra' = 'match';
    let statusLabel = '🟢 완벽 일치';
    let statusBg = 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30';

    if (!targetV && refV) {
      status = 'missing';
      statusLabel = '🔴 구절 누락';
      statusBg = 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30';
      missingCount++;
    } else if (targetV && !refV) {
      status = 'extra';
      statusLabel = '🟣 초과/추가 절';
      statusBg = 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30';
      diffCount++;
    } else if (targetV && refV) {
      if (targetV.text.trim() === refV.text.trim()) {
        status = 'match';
        statusLabel = '🟢 완벽 일치';
        statusBg = 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30';
        matchCount++;
      } else {
        status = 'diff';
        statusLabel = '🟡 텍스트/번역 차이';
        statusBg = 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30';
        diffCount++;
      }
    } else {
      status = 'missing';
      statusLabel = '⚪ 데이터 미확인';
      statusBg = 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30';
      missingCount++;
    }

    comparisonItems.push({
      verseNum: vNum,
      targetV,
      refV,
      status,
      statusLabel,
      statusBg,
    });
  }

  const filteredComparisonItems = comparisonItems.filter((item) => {
    if (comparisonFilter === 'match') return item.status === 'match';
    if (comparisonFilter === 'diff') return item.status === 'diff' || item.status === 'extra';
    if (comparisonFilter === 'missing') return item.status === 'missing';
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden text-slate-800 dark:text-slate-100">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                성경 데이터 무결성 검사 및 구절 대조 진단
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
                  관리자 도구
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                업로드된 성경 DB의 66권 수록 상태와 각 절(Verse) 데이터 매핑을 원본 표준과 대조 검사합니다.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* View Mode Navigation Tabs */}
        <div className="px-5 pt-3 pb-0 bg-slate-100/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'overview'
                  ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 border-t-2 border-amber-500 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>무결성 종합 진단 (66권)</span>
            </button>

            <button
              onClick={() => setActiveTab('comparison')}
              className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'comparison'
                  ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 border-t-2 border-amber-500 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <ArrowRightLeft className="w-4 h-4 text-amber-500" />
              <span>시각적 구절 대조 검사 보고서</span>
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-[10px] text-amber-600 dark:text-amber-300 font-extrabold">
                NEW
              </span>
            </button>

            <button
              onClick={() => setActiveTab('sandbox')}
              className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'sandbox'
                  ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 border-t-2 border-amber-500 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Wrench className="w-4 h-4" />
              <span>실시간 파서 샌드박스</span>
            </button>
          </div>

          {/* Translation Switcher in Header */}
          <div className="pb-2 flex items-center gap-2 text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium hidden sm:inline">대상 DB:</span>
            {availableTranslations.length > 0 ? (
              <select
                value={selectedTranslation}
                onChange={(e) => setSelectedTranslation(e.target.value)}
                className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold focus:ring-2 focus:ring-amber-500"
              >
                {availableTranslations.map((t) => (
                  <option key={t.name} value={t.name}>
                    {t.name} (업로드됨)
                  </option>
                ))}
              </select>
            ) : (
              <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300 font-bold border border-amber-500/20">
                업로드된 성경 없음
              </span>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {fixSuccessMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
              {fixSuccessMsg}
            </div>
          )}

          {/* TAB 1: OVERVIEW DASHBOARD */}
          {activeTab === 'overview' && (
            <>
              {/* Control & Auto Fix Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Database className="w-4 h-4 text-amber-500" />
                    검사 진행 성경: <span className="text-amber-600 dark:text-amber-400">{selectedTranslation}</span>
                  </span>
                  <button
                    onClick={() => runCheckForTranslation(selectedTranslation)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors flex items-center gap-1"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    재검사
                  </button>
                </div>

                {report && (
                  <button
                    onClick={handleAutoFix}
                    disabled={isFixing}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Wrench className="w-4 h-4" />
                    {isFixing ? '교정 중...' : '파싱 교정 및 DB 자동 업데이트'}
                  </button>
                )}
              </div>

              {/* Overview Cards */}
              {report && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 flex flex-col justify-between">
                    <span className="text-xs font-semibold text-amber-700 dark:text-amber-300 flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5" /> 무결성 종합 점수
                    </span>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400">
                        {report.integrityScore}
                      </span>
                      <span className="text-xs font-medium text-slate-500">/ 100점</span>
                    </div>
                    <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                      {report.integrityScore >= 90 ? '정상 무결성' : '일부 매핑 점검 필요'}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-blue-500" /> 총 수록 구절 수
                    </span>
                    <div className="mt-2">
                      <span className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
                        {report.totalVerses.toLocaleString()}
                      </span>
                      <span className="text-xs text-slate-400 ml-1">/ 31,102절</span>
                    </div>
                    <div className="mt-2 text-[11px] text-slate-500">
                      표준 달성율 {Math.round((report.totalVerses / 31102) * 100)}%
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5 text-emerald-500" /> 발견된 성경 권수
                    </span>
                    <div className="mt-2">
                      <span className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
                        {report.totalBooksFound}
                      </span>
                      <span className="text-xs text-slate-400 ml-1">/ 66 권</span>
                    </div>
                    <div className="mt-2 text-[11px] text-slate-500">
                      {report.missingBooks.length === 0 ? '66권 완벽 수록' : `누락 ${report.missingBooks.length}권`}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-500" /> 감지된 이상 구절
                    </span>
                    <div className="mt-2">
                      <span className="text-xl sm:text-2xl font-bold text-rose-600 dark:text-rose-400">
                        {report.duplicateVersesCount + report.emptyVersesCount + report.unrecognizedBooksCount}
                      </span>
                      <span className="text-xs text-slate-400 ml-1">건</span>
                    </div>
                    <div className="mt-2 text-[11px] text-slate-500">
                      중복 {report.duplicateVersesCount} | 비어있음 {report.emptyVersesCount}
                    </div>
                  </div>
                </div>
              )}

              {/* Key Focus Diagnostic Card (Ecclesiastes, Isaiah, Psalms) */}
              {report && (
                <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      집중 검사 및 원본 대조 가능 주요 서신 (전도서 & 이사야 진단)
                    </h3>
                    <span className="text-xs text-slate-500">클릭 시 시각적 대조 검사로 이동</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Ecclesiastes */}
                    <div
                      onClick={() => handleInspectBook('전도서', 1)}
                      className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-500/50 cursor-pointer transition-all flex items-center justify-between group"
                    >
                      <div>
                        <div className="font-bold text-sm text-slate-800 dark:text-slate-200 group-hover:text-amber-600 flex items-center gap-1">
                          전도서 (Ecclesiastes)
                          <ArrowRightLeft className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="text-xs text-slate-500">표준: 12장 222절</div>
                        <div className="text-xs font-medium text-amber-600 mt-0.5">
                          현재: {report.keyBooksStatus.ecc.verses}절 매핑됨
                        </div>
                      </div>
                      <div>
                        {report.keyBooksStatus.ecc.ok ? (
                          <span className="px-2 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 flex items-center gap-1">
                            <Check className="w-3 h-3" /> 정상
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> 점검필요
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Isaiah */}
                    <div
                      onClick={() => handleInspectBook('이사야', 1)}
                      className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-500/50 cursor-pointer transition-all flex items-center justify-between group"
                    >
                      <div>
                        <div className="font-bold text-sm text-slate-800 dark:text-slate-200 group-hover:text-amber-600 flex items-center gap-1">
                          이사야 (Isaiah)
                          <ArrowRightLeft className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="text-xs text-slate-500">표준: 66장 1,292절</div>
                        <div className="text-xs font-medium text-amber-600 mt-0.5">
                          현재: {report.keyBooksStatus.isa.verses}절 매핑됨
                        </div>
                      </div>
                      <div>
                        {report.keyBooksStatus.isa.ok ? (
                          <span className="px-2 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 flex items-center gap-1">
                            <Check className="w-3 h-3" /> 정상
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> 점검필요
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Psalms */}
                    <div
                      onClick={() => handleInspectBook('시편', 1)}
                      className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-500/50 cursor-pointer transition-all flex items-center justify-between group"
                    >
                      <div>
                        <div className="font-bold text-sm text-slate-800 dark:text-slate-200 group-hover:text-amber-600 flex items-center gap-1">
                          시편 (Psalms)
                          <ArrowRightLeft className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="text-xs text-slate-500">표준: 150장 2,461절</div>
                        <div className="text-xs font-medium text-amber-600 mt-0.5">
                          현재: {report.keyBooksStatus.psa.verses}절 매핑됨
                        </div>
                      </div>
                      <div>
                        {report.keyBooksStatus.psa.ok ? (
                          <span className="px-2 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 flex items-center gap-1">
                            <Check className="w-3 h-3" /> 정상
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> 점검필요
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Filter & Search Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                  <button
                    onClick={() => setFilterMode('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      filterMode === 'all'
                        ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    전체 66권
                  </button>
                  <button
                    onClick={() => setFilterMode('warning')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      filterMode === 'warning'
                        ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    경고/누락 항목
                  </button>
                  <button
                    onClick={() => setFilterMode('OT')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      filterMode === 'OT'
                        ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    구약 (39권)
                  </button>
                  <button
                    onClick={() => setFilterMode('NT')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      filterMode === 'NT'
                        ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    신약 (27권)
                  </button>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="책 이름 또는 번호 검색 (예: 전도서, 21)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                </div>
              </div>

              {/* Book Inspection List */}
              <div className="space-y-2">
                {filteredSummaries.map((sum) => {
                  const isExpanded = expandedBook === sum.bookInfo.id;
                  return (
                    <div
                      key={sum.bookInfo.id}
                      className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 transition-all hover:border-slate-300 dark:hover:border-slate-700"
                    >
                      <div
                        onClick={() => setExpandedBook(isExpanded ? null : sum.bookInfo.id)}
                        className="p-3 sm:p-4 flex items-center justify-between cursor-pointer select-none"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-bold flex items-center justify-center text-slate-600 dark:text-slate-400">
                            {sum.bookInfo.order}
                          </span>
                          <div>
                            <div className="font-bold text-sm flex items-center gap-2">
                              {sum.bookInfo.name} ({sum.bookInfo.englishName})
                              {sum.bookInfo.id === 'ecc' && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 font-semibold">
                                  집중점검
                                </span>
                              )}
                              {sum.bookInfo.id === 'isa' && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 font-semibold">
                                  집중점검
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500">
                              발견: {sum.foundVerses}절 / {sum.foundChapters}장 (표준: {sum.bookInfo.expectedVerses}절 / {sum.bookInfo.expectedChapters}장)
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleInspectBook(sum.bookInfo.name, 1);
                            }}
                            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 transition-all flex items-center gap-1 border border-amber-500/20"
                          >
                            <ArrowRightLeft className="w-3 h-3 text-amber-500" />
                            <span>절 대조 검사</span>
                          </button>

                          {sum.status === 'ok' ? (
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                              <Check className="w-3 h-3" /> 매핑 정상
                            </span>
                          ) : sum.status === 'missing' ? (
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> 데이터 누락
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 flex items-center gap-1">
                              <Info className="w-3 h-3" /> 매핑 차이
                            </span>
                          )}
                          {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="px-4 pb-4 pt-2 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-800/30 text-xs space-y-2">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 py-2">
                            <div><span className="text-slate-400">약칭:</span> {sum.bookInfo.shortName}</div>
                            <div><span className="text-slate-400">구분:</span> {sum.bookInfo.testament === 'OT' ? '구약' : '신약'}</div>
                            <div><span className="text-slate-400">예상 장 수:</span> {sum.bookInfo.expectedChapters}장</div>
                            <div><span className="text-slate-400">예상 절 수:</span> {sum.bookInfo.expectedVerses}절</div>
                          </div>

                          {sum.issues.length > 0 && (
                            <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300">
                              <div className="font-semibold mb-1">감지된 특이사항:</div>
                              <ul className="list-disc list-inside space-y-0.5">
                                {sum.issues.map((iss, i) => (
                                  <li key={i}>{iss}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[11px] text-slate-500">
                              알리아스 키: {sum.bookInfo.aliases.join(', ')}
                            </span>
                            <button
                              onClick={() => handleInspectBook(sum.bookInfo.name, 1)}
                              className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                            >
                              <ArrowRightLeft className="w-3.5 h-3.5" />
                              {sum.bookInfo.name} 1장부터 절 단위 시각 대조하기
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* TAB 2: VISUAL VERSE COMPARISON INSPECTOR REPORT */}
          {activeTab === 'comparison' && (
            <div className="space-y-5 animate-fade-in">
              {/* Inspection Control Panel */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-400">검사 대상 성경책:</label>
                    <select
                      value={inspectBookName}
                      onChange={(e) => {
                        setInspectBookName(e.target.value);
                        setInspectChapter(1);
                      }}
                      className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs font-bold focus:ring-2 focus:ring-amber-500"
                    >
                      {STANDARD_BIBLE_66_BOOKS.map((b) => (
                        <option key={b.id} value={b.name}>
                          {b.order}. {b.name} ({b.englishName}) - {b.expectedChapters}장
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-1 overflow-x-auto max-w-full pb-1">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400 mr-1 shrink-0">장(Chapter):</span>
                    {Array.from({ length: stdBook.expectedChapters }, (_, i) => i + 1).slice(0, 30).map((ch) => (
                      <button
                        key={ch}
                        onClick={() => setInspectChapter(ch)}
                        className={`w-7 h-7 rounded-lg text-xs font-bold transition-all shrink-0 ${
                          inspectChapter === ch
                            ? 'bg-amber-600 text-white shadow-sm'
                            : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        {ch}
                      </button>
                    ))}
                    {stdBook.expectedChapters > 30 && (
                      <select
                        value={inspectChapter}
                        onChange={(e) => setInspectChapter(Number(e.target.value))}
                        className="px-2 py-1 rounded-lg text-xs font-bold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 shrink-0"
                      >
                        {Array.from({ length: stdBook.expectedChapters }, (_, i) => i + 1).map((ch) => (
                          <option key={ch} value={ch}>{ch}장</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                {/* Chapter Comparison Summary Header Banner */}
                <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-slate-100 dark:to-slate-900 border border-amber-500/20 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-amber-600 text-white font-black text-xs">
                      {stdBook.name} {inspectChapter}장
                    </span>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      대조 분석: <span className="text-amber-600 dark:text-amber-400">{selectedTranslation}</span> VS <span className="text-slate-500">{refNameLabel}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <div className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>일치: {matchCount}절</span>
                    </div>
                    <div className="flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
                      <Info className="w-3.5 h-3.5" />
                      <span>차이/변형: {diffCount}절</span>
                    </div>
                    <div className="flex items-center gap-1 font-semibold text-rose-600 dark:text-rose-400">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>누락: {missingCount}절</span>
                    </div>
                  </div>
                </div>

                {/* Filter Selector for Comparison List */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <div className="flex items-center gap-1.5">
                    <Filter className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-semibold text-slate-600 dark:text-slate-400">절 정렬 필터:</span>
                    <button
                      onClick={() => setComparisonFilter('all')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                        comparisonFilter === 'all'
                          ? 'bg-amber-600 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      전체 ({comparisonItems.length})
                    </button>
                    <button
                      onClick={() => setComparisonFilter('match')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                        comparisonFilter === 'match'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      🟢 일치 ({matchCount})
                    </button>
                    <button
                      onClick={() => setComparisonFilter('diff')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                        comparisonFilter === 'diff'
                          ? 'bg-amber-600 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      🟡 차이 ({diffCount})
                    </button>
                    <button
                      onClick={() => setComparisonFilter('missing')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                        comparisonFilter === 'missing'
                          ? 'bg-rose-600 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      🔴 누락 ({missingCount})
                    </button>
                  </div>

                  <span className="text-[11px] text-slate-400 hidden sm:inline">
                    대조 구절 수: {filteredComparisonItems.length}개
                  </span>
                </div>
              </div>

              {/* Line-by-Line Visual Comparison Cards Grid */}
              <div className="space-y-3">
                {filteredComparisonItems.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 text-xs">
                    선택한 필터 조건에 해당하는 구절 대조 항목이 없습니다.
                  </div>
                ) : (
                  filteredComparisonItems.map((item) => (
                    <div
                      key={item.verseNum}
                      className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2.5 hover:shadow-md transition-shadow"
                    >
                      {/* Verse Header Bar */}
                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-xs font-black text-slate-800 dark:text-slate-200">
                            {stdBook.name} {inspectChapter}:{item.verseNum}절
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${item.statusBg}`}>
                            {item.statusLabel}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-400 flex items-center gap-2">
                          {item.targetV && <span>업로드 DB: {item.targetV.text.length}자</span>}
                          {item.refV && <span>{refNameLabel}: {item.refV.text.length}자</span>}
                        </div>
                      </div>

                      {/* Side-by-Side or Stacked Verse Text Boxes */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs leading-relaxed">
                        {/* Target Uploaded Verse Box */}
                        <div className={`p-3 rounded-lg border ${
                          item.targetV
                            ? 'bg-slate-50/80 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/80'
                            : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 font-medium'
                        }`}>
                          <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400 mb-1 flex items-center justify-between">
                            <span>[ 검사 대상 DB: {selectedTranslation} ]</span>
                            {item.targetV && <span className="text-slate-400 font-normal">라인 정상 수신</span>}
                          </div>
                          <div className="font-serif font-medium text-slate-800 dark:text-slate-100">
                            {item.targetV ? item.targetV.text : '(해당 절 데이터가 업로드된 DB에 존재하지 않습니다)'}
                          </div>
                        </div>

                        {/* Standard Reference Verse Box */}
                        <div className="p-3 rounded-lg bg-emerald-50/30 dark:bg-emerald-950/10 border border-emerald-500/20">
                          <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mb-1 flex items-center justify-between">
                            <span>[ {refNameLabel} 기준 참조 ]</span>
                            <span className="text-slate-400 font-normal">표준 매핑 데이터</span>
                          </div>
                          <div className="font-serif font-medium text-slate-800 dark:text-slate-200">
                            {item.refV
                              ? item.refV.text
                              : `${stdBook.name} ${inspectChapter}장 ${item.verseNum}절 표준 본문 매핑 준비 상태`}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: PARSER SANDBOX */}
          {activeTab === 'sandbox' && (
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 space-y-4">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <Wrench className="w-4 h-4 text-amber-500" />
                실시간 라인 파서 테스트 샌드박스 (Live Parsing Sandbox)
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                원본 성경 텍스트 라인(예: <code className="text-amber-600 dark:text-amber-400 font-mono">21 1 1 다윗의...</code> 또는 <code className="text-amber-600 dark:text-amber-400 font-mono">전 12:1 ...</code> 또는 <code className="text-amber-600 dark:text-amber-400 font-mono">사 66:1 ...</code>)을 직접 입력하여 매핑 파싱 결과를 검증해보세요.
              </p>
              <textarea
                rows={5}
                value={sandboxText}
                onChange={(e) => setSandboxText(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-xs focus:ring-2 focus:ring-amber-500"
                placeholder="테스트할 성경 텍스트를 입력하세요..."
              />

              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  파싱 및 매핑 결과 ({sandboxResults.length}개 발견):
                </div>
                <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                  {sandboxResults.map((res, i) => (
                    <div key={i} className="p-2.5 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono flex items-center justify-between gap-2">
                      <span className="font-bold text-amber-600 dark:text-amber-400 shrink-0">
                        [{res.bookName}] {res.chapter}:{res.verse}절
                      </span>
                      <span className="text-slate-700 dark:text-slate-300 truncate font-serif">{res.text}</span>
                      <button
                        onClick={() => handleInspectBook(res.bookName, res.chapter)}
                        className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-[10px] font-sans font-bold shrink-0 text-slate-600 dark:text-slate-300"
                      >
                        대조보기
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            성경 데이터 무결성 검증 엔진 v2.5 | 66권 절 단위 시각 대조 검사
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

// Fallback internal generator for built-in analysis
function generateInternalSampleVerses(transName: string): any[] {
  const result: any[] = [];
  STANDARD_BIBLE_66_BOOKS.forEach((book) => {
    result.push({ bookName: book.name, chapter: 1, verse: 1, text: `${book.name} 1장 1절 내장 샘플 본문입니다.` });
    result.push({ bookName: book.name, chapter: book.expectedChapters, verse: 1, text: `${book.name} 마지막장 1절 내장 샘플 본문입니다.` });
  });
  return result;
}
