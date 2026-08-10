import React, { useState, useEffect } from 'react';
import { Book } from '../types';
import { BIBLE_BOOKS, getChapterVerses } from '../data/bibleData';
import { AlertTriangle, Check, X, Send, History, FileEdit, Globe, RefreshCw } from 'lucide-react';
import { collection, doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

export interface ErrorReportItem {
  id: string;
  bookId: string;
  bookName: string;
  chapter: number;
  verseNum: number;
  translation: string;
  category: string;
  currentText: string;
  suggestion: string;
  createdAt: string;
  status: '접수됨' | '검토중' | '반영완료';
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentBook: Book;
  currentChapter: number;
  selectedVerseNum?: number;
}

export const ErrorReportModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentBook,
  currentChapter,
  selectedVerseNum,
}) => {
  const [activeTab, setActiveTab] = useState<'report' | 'history'>('report');
  const [selectedBook, setSelectedBook] = useState<Book>(currentBook);
  const [chapterNum, setChapterNum] = useState<number>(currentChapter);
  const [verseNum, setVerseNum] = useState<number>(selectedVerseNum || 1);
  const [translation, setTranslation] = useState<string>('KRV');
  const [category, setCategory] = useState<string>('오탈자/맞춤법');
  const [suggestion, setSuggestion] = useState<string>('');
  const [submittedToast, setSubmittedToast] = useState<boolean>(false);
  const [reportsHistory, setReportsHistory] = useState<ErrorReportItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Sync state when props change or modal opens
  useEffect(() => {
    setSelectedBook(currentBook);
    setChapterNum(currentChapter);
    setVerseNum(selectedVerseNum || 1);
  }, [currentBook, currentChapter, selectedVerseNum, isOpen]);

  // Real-time synchronization with Firebase Firestore
  useEffect(() => {
    if (!isOpen) return;

    setIsLoading(true);
    const reportsCollection = collection(db, 'error_reports');

    const unsubscribe = onSnapshot(
      reportsCollection,
      (snapshot) => {
        const items: ErrorReportItem[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data && data.bookId && data.suggestion) {
            items.push({
              id: docSnap.id,
              bookId: data.bookId,
              bookName: data.bookName || '',
              chapter: Number(data.chapter) || 1,
              verseNum: Number(data.verseNum) || 1,
              translation: data.translation || 'KRV',
              category: data.category || '기타',
              currentText: data.currentText || '',
              suggestion: data.suggestion || '',
              createdAt: data.createdAt || '',
              status: data.status || '접수됨',
            });
          }
        });

        // Sort descending by report ID/time
        items.sort((a, b) => b.id.localeCompare(a.id));
        setReportsHistory(items);
        setIsLoading(false);
      },
      (error) => {
        console.error('Firestore real-time subscription error:', error);
        setIsLoading(false);
        try {
          handleFirestoreError(error, OperationType.GET, 'error_reports');
        } catch {
          // ignore error throw to prevent modal crash
        }
      }
    );

    return () => unsubscribe();
  }, [isOpen]);

  if (!isOpen) return null;

  const currentVerses = getChapterVerses(selectedBook.id, chapterNum);
  const targetVerse = currentVerses.find((v) => v.number === verseNum) || currentVerses[0];
  const targetText = targetVerse?.text[translation as keyof typeof targetVerse.text] || targetVerse?.text['KRV'] || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suggestion.trim()) {
      alert('수정 요청 내용이나 오류 상세 설명을 입력해주세요.');
      return;
    }

    const reportId = 'rep_' + Date.now().toString();
    const newReport: ErrorReportItem = {
      id: reportId,
      bookId: selectedBook.id,
      bookName: selectedBook.name,
      chapter: chapterNum,
      verseNum: verseNum,
      translation,
      category,
      currentText: targetText,
      suggestion: suggestion.trim(),
      createdAt: new Date().toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      status: '접수됨',
    };

    try {
      setIsSubmitting(true);
      await setDoc(doc(db, 'error_reports', reportId), newReport);
      setSuggestion('');
      setSubmittedToast(true);
      setTimeout(() => {
        setSubmittedToast(false);
      }, 3000);
    } catch (err) {
      console.error('Firebase save error:', err);
      alert('온라인 데이터베이스 저장 중 오류가 발생했습니다. 다시 시도해주세요.');
      try {
        handleFirestoreError(err, OperationType.WRITE, `error_reports/${reportId}`);
      } catch {
        // logged
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/80">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-base font-bold text-zinc-100">성경 데이터 오류 제보</h2>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <Globe className="w-3 h-3" /> 실시간 클라우드 공유
                </span>
              </div>
              <p className="text-xs text-zinc-400">전체 사용자가 제보한 내역이 실시간으로 동기화됩니다.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Header */}
        <div className="flex border-b border-zinc-800 bg-zinc-950/40 px-4 pt-2">
          <button
            onClick={() => setActiveTab('report')}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'report'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FileEdit className="w-3.5 h-3.5" />
            <span>오류 제보 작성</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'history'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>실시간 전체 제보 내역 ({reportsHistory.length})</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-4 text-xs">
          {submittedToast && (
            <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center gap-2 animate-in fade-in duration-200">
              <Check className="w-4 h-4 shrink-0" />
              <span>제보가 온라인 클라우드 데이터베이스에 실시간 등록되었습니다!</span>
            </div>
          )}

          {activeTab === 'report' ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Passage Selectors */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1 font-medium">성경 권</label>
                  <select
                    value={selectedBook.id}
                    onChange={(e) => {
                      const b = BIBLE_BOOKS.find((bk) => bk.id === e.target.value);
                      if (b) {
                        setSelectedBook(b);
                        setChapterNum(1);
                        setVerseNum(1);
                      }
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs focus:outline-none focus:border-amber-500"
                  >
                    {BIBLE_BOOKS.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1 font-medium">장</label>
                  <select
                    value={chapterNum}
                    onChange={(e) => {
                      setChapterNum(Number(e.target.value));
                      setVerseNum(1);
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs focus:outline-none focus:border-amber-500"
                  >
                    {Array.from({ length: selectedBook.chapterCount }, (_, i) => i + 1).map((ch) => (
                      <option key={ch} value={ch}>
                        {ch}장
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1 font-medium">절</label>
                  <select
                    value={verseNum}
                    onChange={(e) => setVerseNum(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs focus:outline-none focus:border-amber-500"
                  >
                    {currentVerses.map((v) => (
                      <option key={v.number} value={v.number}>
                        {v.number}절
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Translation & Category */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1 font-medium">번역본</label>
                  <select
                    value={translation}
                    onChange={(e) => setTranslation(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs focus:outline-none focus:border-amber-500"
                  >
                    <option value="KRV">개역한글 (KRV)</option>
                    <option value="NKRV">개역개정 (NKRV)</option>
                    <option value="KCB">공동번역 (KCB)</option>
                    <option value="KJV">KJV (영어)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1 font-medium">오류 유형</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs focus:outline-none focus:border-amber-500"
                  >
                    <option value="오탈자/맞춤법">오탈자 / 맞춤법 오류</option>
                    <option value="구절누락">구절 또는 텍스트 누락</option>
                    <option value="번역의미오류">번역 / 의미 오류</option>
                    <option value="원어/스트롱코드">원어 / 스트롱코드 오류</option>
                    <option value="기타">기타 오류 제보</option>
                  </select>
                </div>
              </div>

              {/* Current Passage Text Box */}
              <div>
                <label className="block text-[11px] text-zinc-400 mb-1 font-medium">
                  현재 입력되어 있는 구절 내용 ({selectedBook.name} {chapterNum}:{verseNum})
                </label>
                <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs italic font-serif leading-relaxed select-text">
                  "{targetText || '해당 절의 텍스트를 불러올 수 없습니다.'}"
                </div>
              </div>

              {/* Suggestion Text Area */}
              <div>
                <label className="block text-[11px] text-zinc-400 mb-1 font-medium">
                  수정 요청 내용 및 이유 <span className="text-amber-400">*</span>
                </label>
                <textarea
                  rows={4}
                  value={suggestion}
                  onChange={(e) => setSuggestion(e.target.value)}
                  placeholder="예: 창세기 3장 4절 개역개정 기준 '너희가 결코 죽지 아니하리라' 표기로 수정해 주세요."
                  className="w-full p-3 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-100 text-xs focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>{isSubmitting ? '전송 중...' : '클라우드로 제보하기'}</span>
                </button>
              </div>
            </form>
          ) : (
            /* History Tab */
            <div className="space-y-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] flex items-center gap-2">
                <Globe className="w-4 h-4 shrink-0 text-amber-400" />
                <span>
                  온라인 데이터베이스(Firebase Firestore)에 실시간 기록된 모든 사용자들의 제보 리스트입니다.
                </span>
              </div>

              {isLoading ? (
                <div className="text-center py-8 text-zinc-500 space-y-2">
                  <RefreshCw className="w-6 h-6 mx-auto animate-spin text-amber-500" />
                  <p>실시간 데이터베이스 수신 중...</p>
                </div>
              ) : reportsHistory.length === 0 ? (
                <div className="text-center py-8 text-zinc-500 space-y-1">
                  <AlertTriangle className="w-8 h-8 mx-auto opacity-40" />
                  <p>등록된 클라우드 오류 제보 내역이 없습니다.</p>
                </div>
              ) : (
                reportsHistory.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-zinc-800/60 border border-zinc-700/60 space-y-2 relative"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-amber-400">
                          {item.bookName} {item.chapter}:{item.verseNum}절 ({item.translation})
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-zinc-700 text-[10px] text-zinc-300">
                          {item.category}
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-400">{item.createdAt}</span>
                    </div>

                    <div className="text-xs text-zinc-200 bg-zinc-900/60 p-2 rounded border border-zinc-800">
                      <span className="text-zinc-400 text-[11px] block mb-0.5">제보된 요청 내용:</span>
                      {item.suggestion}
                    </div>

                    <div className="flex items-center justify-between pt-1 text-[11px]">
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <Check className="w-3 h-3" /> 상태: {item.status}
                      </span>
                      <span className="text-[10px] text-zinc-500">ID: {item.id.slice(-8)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
