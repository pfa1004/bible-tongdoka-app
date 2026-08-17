import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { db } from '../lib/firebase';
import { doc, writeBatch } from 'firebase/firestore';
import { BIBLE_BOOKS } from '../data/bibleData';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  X,
  Database,
  Download,
  Loader2,
  FileText,
  Sparkles,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccessUpload?: (uploadedCount: number) => void;
}

export interface DailyVerseRow {
  date: string; // YYYY-MM-DD
  bookName: string;
  chapter: number;
  verseNum: number;
  verseText: string;
  isValid: boolean;
  errorMessages: string[];
}

export const AdminUploadModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSuccessUpload,
}) => {
  const [parsedRows, setParsedRows] = useState<DailyVerseRow[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    count: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Validate single parsed row against Bible schema & Date rules
  const validateRow = (
    rawDate: any,
    rawBook: any,
    rawChapter: any,
    rawVerse: any,
    rawText: any
  ): DailyVerseRow => {
    const errors: string[] = [];

    // 1. Date Validation (Normalize to YYYY-MM-DD)
    let cleanDate = String(rawDate || '').trim();
    if (!cleanDate) {
      errors.push('날짜 누락');
    } else {
      // If Excel serial number format
      if (!isNaN(Number(cleanDate)) && Number(cleanDate) > 40000) {
        const dateObj = XLSX.SSF.parse_date_code(Number(cleanDate));
        cleanDate = `${dateObj.y}-${String(dateObj.m).padStart(2, '0')}-${String(dateObj.d).padStart(2, '0')}`;
      } else {
        // Standardize YYYY-MM-DD or MM-DD
        const dateParts = cleanDate.replace(/[/.]/g, '-').split('-');
        if (dateParts.length === 3) {
          cleanDate = `${dateParts[0]}-${String(dateParts[1]).padStart(2, '0')}-${String(dateParts[2]).padStart(2, '0')}`;
        } else if (dateParts.length === 2) {
          const currentYear = new Date().getFullYear();
          cleanDate = `${currentYear}-${String(dateParts[0]).padStart(2, '0')}-${String(dateParts[1]).padStart(2, '0')}`;
        } else {
          errors.push(`잘못된 날짜 형식: ${cleanDate}`);
        }
      }
    }

    // 2. Book Name Validation
    const cleanBook = String(rawBook || '').trim();
    if (!cleanBook) {
      errors.push('책 이름 누락');
    } else {
      const foundBook = BIBLE_BOOKS.find(
        (b) =>
          b.name === cleanBook ||
          b.shortName === cleanBook ||
          b.englishName.toLowerCase() === cleanBook.toLowerCase()
      );
      if (!foundBook) {
        errors.push(`존재하지 않는 성경 책 이름: '${cleanBook}'`);
      }
    }

    // 3. Chapter & Verse Validation
    const chapter = parseInt(String(rawChapter || '0'), 10);
    const verseNum = parseInt(String(rawVerse || '0'), 10);

    if (isNaN(chapter) || chapter <= 0) {
      errors.push(`유효하지 않은 장 번호: ${rawChapter}`);
    }
    if (isNaN(verseNum) || verseNum <= 0) {
      errors.push(`유효하지 않은 절 번호: ${rawVerse}`);
    }

    // 4. Verse Text Validation
    const cleanText = String(rawText || '').trim();
    if (!cleanText) {
      errors.push('구절 내용 비어있음');
    }

    return {
      date: cleanDate,
      bookName: cleanBook,
      chapter,
      verseNum,
      verseText: cleanText,
      isValid: errors.length === 0,
      errorMessages: errors,
    };
  };

  // Helper to map object keys flexibly (날짜, 책이름, 장, 절, 구절내용)
  const processRawDataArray = (dataObjects: any[]) => {
    const rows: DailyVerseRow[] = [];

    dataObjects.forEach((item) => {
      // Find key matching headers flexibly
      const keys = Object.keys(item);
      const dateKey = keys.find((k) => k.includes('날짜') || k.toLowerCase().includes('date')) || keys[0];
      const bookKey = keys.find((k) => k.includes('책') || k.includes('성경') || k.toLowerCase().includes('book')) || keys[1];
      const chKey = keys.find((k) => k.includes('장') || k.toLowerCase().includes('chapter')) || keys[2];
      const verseKey = keys.find((k) => k.includes('절') || k.toLowerCase().includes('verse')) || keys[3];
      const textKey = keys.find((k) => k.includes('구절') || k.includes('내용') || k.includes('본문') || k.toLowerCase().includes('text')) || keys[4];

      if (dateKey && item[dateKey] !== undefined) {
        const validated = validateRow(
          item[dateKey],
          item[bookKey],
          item[chKey],
          item[verseKey],
          item[textKey]
        );
        rows.push(validated);
      }
    });

    setParsedRows(rows);
    setIsParsing(false);
  };

  // Handle File Upload Change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsParsing(true);
    setUploadResult(null);

    const isCsv = file.name.endsWith('.csv');

    if (isCsv) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          processRawDataArray(results.data);
        },
        error: (err) => {
          alert(`CSV 파싱 에러: ${err.message}`);
          setIsParsing(false);
        },
      });
    } else {
      // Excel File Parsing (.xlsx, .xls)
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = new Uint8Array(event.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
          processRawDataArray(jsonData);
        } catch (err) {
          alert('엑셀 파일 분석 실패. 정규 엑셀(.xlsx) 파일인지 확인해주세요.');
          setIsParsing(false);
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  // Perform Firestore Batched Write
  const handleBatchUploadToFirestore = async () => {
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      alert('업로드할 유효한 데이터가 없습니다.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Firestore batch limits: 500 documents per batch
      const BATCH_SIZE = 450;
      let totalUploaded = 0;

      for (let i = 0; i < validRows.length; i += BATCH_SIZE) {
        const chunk = validRows.slice(i, i + BATCH_SIZE);
        const batch = writeBatch(db);

        chunk.forEach((row) => {
          // Document ID: YYYY-MM-DD
          const docRef = doc(db, 'daily_verses', row.date);
          batch.set(docRef, {
            date: row.date,
            bookName: row.bookName,
            chapter: row.chapter,
            verseNum: row.verseNum,
            verseText: row.verseText,
            updatedAt: new Date().toISOString(),
          });
        });

        await batch.commit();
        totalUploaded += chunk.length;
        setUploadProgress(Math.round((totalUploaded / validRows.length) * 100));
      }

      setUploadResult({ success: true, count: totalUploaded });
      if (onSuccessUpload) onSuccessUpload(totalUploaded);
    } catch (err) {
      console.error('Firestore 일괄 등록 오류:', err);
      alert(`Firestore 일괄 쓰기 오류: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsUploading(false);
    }
  };

  // Download Template Sample CSV
  const handleDownloadSampleCsv = () => {
    const sampleData = `날짜,책이름,장,절,구절내용
2026-08-11,여호수아,1,9,내가 네게 명령한 것이 아니냐 강하고 담대하라 두려워하지 말며 놀라지 말라 네가 어디로 가든지 네 하나님 여호와가 너와 함께 하느니라
2026-08-12,이사야,41,10,두려워하지 말라 내가 너와 함께 함이라 놀라지 말라 나는 네 하나님이 됨이라 내가 너를 세엄하게 하리라 참으로 너를 도와 주리라
2026-08-13,시편,23,1,여호와는 나의 목자시니 내게 부족함이 없으리로다`;

    const blob = new Blob(['\uFEFF' + sampleData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '오늘의말씀_샘플양식.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const validCount = parsedRows.filter((r) => r.isValid).length;
  const invalidCount = parsedRows.length - validCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="w-full max-w-4xl max-h-[90vh] rounded-3xl bg-white dark:bg-zinc-900 shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col overflow-hidden text-zinc-900 dark:text-zinc-100">
        {/* Header */}
        <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-gradient-to-r from-amber-600 to-amber-500 text-white shrink-0">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            <h3 className="font-extrabold text-lg font-serif">
              오늘의 말씀 엑셀/CSV 대량 업로드
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-black/20 hover:bg-black/40 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* File Upload Zone & Instructions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Dropzone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="md:col-span-2 p-6 rounded-2xl border-2 border-dashed border-amber-400/80 hover:border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 flex flex-col items-center justify-center text-center cursor-pointer transition-colors group"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".xlsx,.xls,.csv"
                className="hidden"
              />
              <FileSpreadsheet className="w-10 h-10 text-amber-600 dark:text-amber-400 mb-2 group-hover:scale-110 transition-transform" />
              <div className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">
                {fileName ? fileName : '엑셀(.xlsx) 또는 CSV 파일을 드래그하거나 터치하세요'}
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                30일~365일 치 구절 데이터를 1초 만에 일괄 검증 및 Firestore에 등록합니다.
              </p>
            </div>

            {/* Template Info & Sample Download */}
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 text-xs space-y-3 flex flex-col justify-between">
              <div>
                <div className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5 mb-2">
                  <FileText className="w-4 h-4" />
                  <span>엑셀/CSV 필수 열 양식</span>
                </div>
                <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed font-mono">
                  1. 날짜 (YYYY-MM-DD)<br />
                  2. 책이름 (예: 여호수아)<br />
                  3. 장 (숫자)<br />
                  4. 절 (숫자)<br />
                  5. 구절내용 (텍스트)
                </p>
              </div>

              <button
                onClick={handleDownloadSampleCsv}
                className="w-full py-2 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 font-bold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Download className="w-3.5 h-3.5 text-amber-500" />
                <span>샘플 양식 다운로드</span>
              </button>
            </div>
          </div>

          {/* Validation Summary Badges */}
          {parsedRows.length > 0 && (
            <div className="p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <span className="font-bold text-zinc-700 dark:text-zinc-300">
                  총 파싱 건수: <strong className="text-amber-600 dark:text-amber-400">{parsedRows.length}건</strong>
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold flex items-center gap-1 border border-emerald-500/20">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>정상 {validCount}건</span>
                </span>
                {invalidCount > 0 && (
                  <span className="px-2.5 py-1 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 font-extrabold flex items-center gap-1 border border-red-500/20">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>오류 {invalidCount}건</span>
                  </span>
                )}
              </div>

              <button
                onClick={handleBatchUploadToFirestore}
                disabled={isUploading || validCount === 0}
                className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
              >
                {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                <span>Firestore 일괄 등록하기 ({validCount}건)</span>
              </button>
            </div>
          )}

          {/* Upload Progress Bar */}
          {isUploading && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-amber-600 dark:text-amber-400">
                <span>Firestore 일괄 저장 진행 중...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full h-3 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Upload Success Alert */}
          {uploadResult && (
            <div className="p-4 rounded-2xl bg-emerald-500 text-white font-bold text-xs flex items-center justify-between shadow-md animate-in fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                <span>성공적으로 {uploadResult.count}건의 오늘의 말씀이 Firestore에 일괄 저장되었습니다!</span>
              </div>
              <Sparkles className="w-5 h-5 text-amber-200" />
            </div>
          )}

          {/* Data Preview Table */}
          {parsedRows.length > 0 && (
            <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-xs">
              <div className="bg-zinc-100 dark:bg-zinc-800 px-4 py-2.5 text-xs font-bold text-zinc-600 dark:text-zinc-300 border-b border-zinc-200 dark:border-zinc-700">
                파싱 검증 데이터 미리보기
              </div>
              <div className="max-h-60 overflow-y-auto text-xs">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 font-bold text-zinc-500">
                    <tr>
                      <th className="p-2.5">상태</th>
                      <th className="p-2.5">날짜</th>
                      <th className="p-2.5">성경 구절 출처</th>
                      <th className="p-2.5">구절 내용</th>
                      <th className="p-2.5">검증 결과</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 font-mono">
                    {parsedRows.map((row, idx) => (
                      <tr
                        key={idx}
                        className={
                          row.isValid
                            ? 'hover:bg-zinc-50 dark:hover:bg-zinc-800/40'
                            : 'bg-red-500/10 dark:bg-red-950/30 text-red-700 dark:text-red-300'
                        }
                      >
                        <td className="p-2.5 font-bold">
                          {row.isValid ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                          )}
                        </td>
                        <td className="p-2.5 font-bold whitespace-nowrap">{row.date}</td>
                        <td className="p-2.5 font-bold text-amber-600 dark:text-amber-400 whitespace-nowrap">
                          {row.bookName} {row.chapter}:{row.verseNum}절
                        </td>
                        <td className="p-2.5 truncate max-w-xs font-serif text-zinc-800 dark:text-zinc-200">
                          {row.verseText}
                        </td>
                        <td className="p-2.5">
                          {row.isValid ? (
                            <span className="text-emerald-600 font-bold">통과</span>
                          ) : (
                            <span className="text-red-500 font-bold">
                              {row.errorMessages.join(', ')}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
