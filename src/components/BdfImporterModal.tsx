import React, { useState, useRef, useEffect } from 'react';
import { X, FileCode, Upload, Check, AlertCircle, Database, Info, FileText, Folder, Type, ShieldCheck } from 'lucide-react';
import JSZip from 'jszip';
import { fetchBibleDirectoryManifest, BibleDirectoryFile, loadBibleFileFromPath } from '../data/bible/bibleLoader';
import {
  saveCustomBible,
  deleteCustomBible,
  getUploadedBibleList,
  isProtectedBible,
} from '../utils/customBibleStorage';
import { parseBibleTextContent, runBibleIntegrityCheck, IntegrityReport } from '../utils/bibleIntegrityChecker';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess?: (translationName: string, versesCount: number) => void;
  onOpenIntegrityModal?: () => void;
}

interface ParsedVerseSample {
  bookName: string;
  chapter: number;
  verse: number;
  text: string;
}

export const BdfImporterModal: React.FC<Props> = ({ isOpen, onClose, onImportSuccess, onOpenIntegrityModal }) => {
  const [uploadedBibles, setUploadedBibles] = useState<Array<{ name: string; count: number }>>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileBuffer, setFileBuffer] = useState<ArrayBuffer | null>(null);
  const [encoding, setEncoding] = useState<'euc-kr' | 'utf-8'>('euc-kr');
  const [isParsing, setIsParsing] = useState(false);
  const [parsedSamples, setParsedSamples] = useState<ParsedVerseSample[]>([]);
  const [parsedAllVerses, setParsedAllVerses] = useState<ParsedVerseSample[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [customTranslationName, setCustomTranslationName] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [directoryFiles, setDirectoryFiles] = useState<BibleDirectoryFile[]>([]);
  const [loadingPresetPath, setLoadingPresetPath] = useState<string | null>(null);
  const [customPathInput, setCustomPathInput] = useState<string>('/bible/krv_sample.bdf');
  const [importMode, setImportMode] = useState<'file' | 'paste'>('file');
  const [pastedText, setPastedText] = useState<string>('');
  const [confirmDeleteName, setConfirmDeleteName] = useState<string | null>(null);

  const [progressInfo, setProgressInfo] = useState<{ current: number; total: number; filename: string; count: number } | null>(null);
  const [overrideKrvOption, setOverrideKrvOption] = useState<boolean>(false);
  const [latestIntegrityReport, setLatestIntegrityReport] = useState<IntegrityReport | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const folderInputRef = useRef<HTMLInputElement | null>(null);

  const refreshUploadedBibles = () => {
    const list = getUploadedBibleList();
    setUploadedBibles(list);
  };

  const saveToLocalStorageAndNotify = async (transName: string, verses: ParsedVerseSample[]) => {
    if (!verses || verses.length === 0) return false;
    const nameKey = (transName || '사용자성경').trim();
    try {
      const ok = await saveCustomBible(nameKey, verses, true);
      if (ok) {
        refreshUploadedBibles();
        if (onImportSuccess) {
          onImportSuccess(nameKey, verses.length);
        }
        return true;
      } else {
        setErrorMsg(`'${nameKey}' 저장 중 오류가 발생했습니다.`);
        return false;
      }
    } catch (e) {
      console.error('IndexedDB save error:', e);
      setErrorMsg(`'${nameKey}' 저장 중 오류가 발생했습니다.`);
      return false;
    }
  };

  useEffect(() => {
    if (isOpen) {
      refreshUploadedBibles();
      fetchBibleDirectoryManifest().then((files) => {
        setDirectoryFiles(files);
      });
    }
  }, [isOpen]);

  const executeDeleteBible = async (name: string) => {
    try {
      await deleteCustomBible(name);
      refreshUploadedBibles();
      setConfirmDeleteName(null);
      setSuccessMsg(`'${name}' 성경 데이터가 삭제되었습니다.`);
    } catch (err) {
      console.error(err);
      setErrorMsg(`'${name}' 삭제 중 오류가 발생했습니다.`);
    }
  };

  const loadFromBiblePath = async (item: BibleDirectoryFile) => {
    setLoadingPresetPath(item.file);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const buffer = await loadBibleFileFromPath(item.file, item.encoding);
      if (!buffer) {
        setErrorMsg(`${item.file} 경로의 성경 데이터를 불러올 수 없습니다.`);
        setLoadingPresetPath(null);
        return;
      }

      const fileObj = new File([buffer], item.file.split('/').pop() || 'bible.bdf');
      setSelectedFile(fileObj);
      setCustomTranslationName(item.name);
      setFileBuffer(buffer);
      setEncoding(item.encoding);
      
      const { samples, allVerses, count, report } = parseBufferData(buffer, item.encoding);
      setTotalCount(count);
      setParsedSamples(samples);
      setParsedAllVerses(allVerses);
      setLatestIntegrityReport(report);

      const saved = await saveToLocalStorageAndNotify(item.name, allVerses.length > 0 ? allVerses : samples);
      if (saved) {
        setSuccessMsg(`'${item.name}' 성경 데이터가 업로드 및 목록 추가 완료되었습니다! (${count}개 구절 / 무결성 ${report.integrityScore}점)`);
      }
    } catch (e) {
      console.error(e);
      setErrorMsg(`${item.file} 성경 데이터를 읽는 도중 오류가 발생했습니다.`);
    } finally {
      setLoadingPresetPath(null);
    }
  };

  const handleDirectPathLoad = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const path = customPathInput.trim();
    if (path && (path.startsWith('/bible/') || path.endsWith('.bdf') || path.endsWith('.txt'))) {
      setLoadingPresetPath(path);
      setErrorMsg(null);
      setSuccessMsg(null);

      try {
        const buffer = await loadBibleFileFromPath(path, encoding);
        if (buffer) {
          const fileName = path.split('/').pop() || 'custom.bdf';
          const fileObj = new File([buffer], fileName);
          setSelectedFile(fileObj);

          const derivedName = fileName.replace(/\.[^/.]+$/, '').toUpperCase();
          if (!customTranslationName) {
            setCustomTranslationName(derivedName);
          }

          setFileBuffer(buffer);
          parseBuffer(buffer, encoding, path);
          return;
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingPresetPath(null);
      }
    }

    // Always trigger folder/file selection when path is custom or button clicked
    handleSelectFolder();
  };

  if (!isOpen) return null;

  const triggerFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const triggerFolderSelect = () => {
    if (folderInputRef.current) {
      folderInputRef.current.value = '';
      folderInputRef.current.click();
    }
  };

  // Pure data parsing helper for ArrayBuffer using stateful robust Bible parser
  const parseBufferData = (buffer: ArrayBuffer, encMode: 'euc-kr' | 'utf-8', filenameHint?: string) => {
    let text = '';
    if (encMode === 'utf-8') {
      const decoderUtf8 = new TextDecoder('utf-8', { fatal: false });
      text = decoderUtf8.decode(buffer);
    } else {
      try {
        const decoderEucKr = new TextDecoder('euc-kr');
        text = decoderEucKr.decode(buffer);
      } catch {
        const decoderUtf8 = new TextDecoder('utf-8', { fatal: false });
        text = decoderUtf8.decode(buffer);
      }
    }

    const allVerses = parseBibleTextContent(text, filenameHint);
    const samples = allVerses.slice(0, 20);
    const count = allVerses.length;
    const report = runBibleIntegrityCheck(allVerses, filenameHint || '파싱 데이터');

    return { samples, allVerses, count, report };
  };

  // Core BDF & Text Parsing Engine
  const parseBuffer = (buffer: ArrayBuffer, encMode: 'euc-kr' | 'utf-8', fileName: string) => {
    setIsParsing(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const { samples, allVerses, count, report } = parseBufferData(buffer, encMode, fileName);
      setTotalCount(count);
      setParsedSamples(samples);
      setParsedAllVerses(allVerses);
      setLatestIntegrityReport(report);
      setIsParsing(false);
    } catch (err) {
      console.error(err);
      setErrorMsg('파일을 분석하는 도중 오류가 발생하였습니다.');
      setIsParsing(false);
    }
  };

  // Modern FileSystem Access API for Folder selection
  const handleSelectFolder = async () => {
    if ('showDirectoryPicker' in window) {
      try {
        setErrorMsg(null);
        setSuccessMsg(null);
        setIsParsing(true);

        const dirHandle = await (window as any).showDirectoryPicker();
        const collectedFiles: File[] = [];

        async function readDirectory(handle: any, pathPrefix: string = '') {
          const currentPrefix = pathPrefix ? `${pathPrefix}/${handle.name}` : handle.name;
          for await (const entry of handle.values()) {
            if (entry.kind === 'file') {
              const f = await entry.getFile();
              const name = f.name.toLowerCase();
              if (
                !name.startsWith('.') &&
                (name.endsWith('.bdf') ||
                  name.endsWith('.bdb') ||
                  name.endsWith('.sdb') ||
                  name.endsWith('.cdb') ||
                  name.endsWith('.txt') ||
                  name.endsWith('.md') ||
                  name.endsWith('.markdown') ||
                  name.endsWith('.mdown') ||
                  name.endsWith('.mdtxt') ||
                  name.endsWith('.zip') ||
                  name.endsWith('.db') ||
                  name.endsWith('.dat') ||
                  name.endsWith('.dbf') ||
                  !name.includes('.'))
              ) {
                const relPath = `${currentPrefix}/${f.name}`;
                try {
                  Object.defineProperty(f, 'webkitRelativePath', {
                    value: relPath,
                    writable: true,
                    configurable: true,
                  });
                } catch {
                  (f as any).webkitRelativePath = relPath;
                }
                collectedFiles.push(f);
              }
            } else if (entry.kind === 'directory') {
              await readDirectory(entry, currentPrefix);
            }
          }
        }

        await readDirectory(dirHandle, '');

        if (collectedFiles.length > 0) {
          await processFilesArray(collectedFiles, dirHandle.name);
          return;
        } else {
          setErrorMsg(`'${dirHandle.name}' 폴더 내에서 호환되는 성경 파일(.MD / .TXT / .BDF / .ZIP)을 찾지 못했습니다.`);
          setIsParsing(false);
          return;
        }
      } catch (err: any) {
        if (err.name === 'AbortError') {
          setIsParsing(false);
          return;
        }
        console.warn('showDirectoryPicker unavailable or error, fallbacking:', err);
      }
    }

    // Fallback if showDirectoryPicker fails or is not available on mobile
    triggerFolderSelect();
  };

  // Central File Array Processor for files, folders, and ZIP archives
  const processFilesArray = async (allFiles: File[], overrideFolderName?: string) => {
    if (!allFiles || allFiles.length === 0) return;

    setErrorMsg(null);
    setSuccessMsg(null);
    setIsParsing(true);
    setProgressInfo(null);

    try {
      const firstFile = allFiles[0];
      const isZip = firstFile.name.toLowerCase().endsWith('.zip') || firstFile.type.includes('zip');

      if (isZip) {
        try {
          const zip = await JSZip.loadAsync(firstFile);
          const zipEntries = Object.keys(zip.files).filter((fileName) => {
            const lower = fileName.toLowerCase();
            if (
              lower.startsWith('__macosx') ||
              lower.startsWith('.') ||
              lower.includes('/.') ||
              lower.startsWith('.kotlin/') ||
              lower.startsWith('app/') ||
              lower.startsWith('assets/') ||
              lower.startsWith('build/') ||
              lower.startsWith('gradle/') ||
              zip.files[fileName].dir
            ) {
              return false;
            }
            return true;
          });

          if (zipEntries.length === 0) {
            setErrorMsg('ZIP 압축 파일 내에 유효한 성경 데이터 파일이 존재하지 않습니다.');
            setIsParsing(false);
            return;
          }

          zipEntries.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

          // Group ZIP entries by translation subfolder or standalone set
          const translationGroups: Record<string, string[]> = {};

          zipEntries.forEach((entryPath) => {
            const parts = entryPath.split('/').filter(Boolean);
            const fileName = parts[parts.length - 1];
            const lowerFile = fileName.toLowerCase();

            const isAllowedExt =
              lowerFile.endsWith('.md') ||
              lowerFile.endsWith('.markdown') ||
              lowerFile.endsWith('.bdf') ||
              lowerFile.endsWith('.bdb') ||
              lowerFile.endsWith('.sdb') ||
              lowerFile.endsWith('.cdb') ||
              lowerFile.endsWith('.txt') ||
              lowerFile.endsWith('.db') ||
              lowerFile.endsWith('.dat') ||
              lowerFile.endsWith('.dbf') ||
              !lowerFile.includes('.');

            if (!isAllowedExt) return;

            let transName = '';
            if (parts.length > 1) {
              transName = parts[parts.length - 2].trim();
            } else {
              transName = overrideFolderName || firstFile.name.replace(/\.zip$/i, '') || 'ZipBible';
            }

            if (['app', 'assets', 'build', 'gradle', '.kotlin', '찬송가-가사txt-'].includes(transName.toLowerCase())) {
              return;
            }

            if (!translationGroups[transName]) {
              translationGroups[transName] = [];
            }
            translationGroups[transName].push(entryPath);
          });

          const groupKeys = Object.keys(translationGroups);
          if (groupKeys.length === 0) {
            setErrorMsg('ZIP 파일 내에서 성경 데이터 파일(.MD, .TXT, .BDF)을 찾을 수 없습니다.');
            setIsParsing(false);
            return;
          }

          let totalImportedTranslations = 0;
          let grandTotalVerses = 0;
          let lastParsedVersesForDisplay: ParsedVerseSample[] = [];

          for (let gIdx = 0; gIdx < groupKeys.length; gIdx++) {
            const transName = groupKeys[gIdx];
            const entries = translationGroups[transName];

            entries.sort((a, b) => {
              const fileA = a.split('/').pop() || a;
              const fileB = b.split('/').pop() || b;
              return fileA.localeCompare(fileB, undefined, { numeric: true, sensitivity: 'base' });
            });

            let translationVerses: ParsedVerseSample[] = [];

            for (let fIdx = 0; fIdx < entries.length; fIdx++) {
              const entryPath = entries[fIdx];
              const fileName = entryPath.split('/').pop() || entryPath;
              const zipObj = zip.files[entryPath];
              const buf = await zipObj.async('arraybuffer');

              setProgressInfo({
                current: fIdx + 1,
                total: entries.length,
                filename: `[${transName}] ${fileName}`,
                count: translationVerses.length,
              });

              await new Promise((r) => setTimeout(r, 5));

              let enc: 'euc-kr' | 'utf-8' = 'euc-kr';
              try {
                const testUtf8 = new TextDecoder('utf-8', { fatal: true });
                testUtf8.decode(buf);
                enc = 'utf-8';
              } catch {
                enc = 'euc-kr';
              }

              const { allVerses } = parseBufferData(buf, enc, fileName);
              translationVerses = [...translationVerses, ...allVerses];
            }

            if (translationVerses.length > 0) {
              totalImportedTranslations++;
              grandTotalVerses += translationVerses.length;
              lastParsedVersesForDisplay = translationVerses;

              await saveToLocalStorageAndNotify(transName, translationVerses);
            }
          }

          setSelectedFile(firstFile);
          setIsParsing(false);
          setProgressInfo(null);
          setParsedSamples(lastParsedVersesForDisplay.slice(0, 20));
          setTotalCount(grandTotalVerses);

          setSuccessMsg(
            `🎉 ZIP 압축 파일에서 총 ${totalImportedTranslations}개 성경 번역본 (${grandTotalVerses.toLocaleString()}개 구절) 자동 인덱싱 및 성경 서재 등록 완료!`
          );
          return;
        } catch (zipErr) {
          console.error('JSZip error:', zipErr);
          setErrorMsg('ZIP 압축파일을 해제 및 분석하는 도중 오류가 발생했습니다.');
          setIsParsing(false);
          setProgressInfo(null);
          return;
        }
      }

      // Normal multi-file or folder upload
      const filesArr = allFiles.filter((f) => {
        const name = f.name.toLowerCase();
        if (name.startsWith('.')) return false;
        return (
          name.endsWith('.bdb') ||
          name.endsWith('.sdb') ||
          name.endsWith('.cdb') ||
          name.endsWith('.dbf') ||
          name.endsWith('.bdf') ||
          name.endsWith('.txt') ||
          name.endsWith('.md') ||
          name.endsWith('.markdown') ||
          name.endsWith('.mdown') ||
          name.endsWith('.mdtxt') ||
          name.endsWith('.db') ||
          name.endsWith('.dat') ||
          !name.includes('.')
        );
      });

      if (filesArr.length === 0) {
        setErrorMsg('선택한 폴더/파일에서 호환되는 성경 데이터(.MD / .TXT / .BDF / .ZIP)를 찾지 못했습니다.');
        setIsParsing(false);
        return;
      }

      filesArr.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

      // Group files by relative folder path if available
      const folderGroups: Record<string, File[]> = {};
      filesArr.forEach((f) => {
        let groupName = overrideFolderName || '사용자성경';
        if (f.webkitRelativePath) {
          const parts = f.webkitRelativePath.split('/').filter(Boolean);
          if (parts.length > 1) {
            groupName = parts[parts.length - 2];
          }
        }
        if (!folderGroups[groupName]) folderGroups[groupName] = [];
        folderGroups[groupName].push(f);
      });

      const groupNames = Object.keys(folderGroups);
      let totalImportedStandalone = 0;
      let grandTotalCount = 0;
      let lastParsedVerses: ParsedVerseSample[] = [];
      let detectedEnc: 'euc-kr' | 'utf-8' = 'utf-8';

      for (let gIdx = 0; gIdx < groupNames.length; gIdx++) {
        const groupName = groupNames[gIdx];
        const groupFiles = folderGroups[groupName];

        groupFiles.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

        let groupVerses: ParsedVerseSample[] = [];

        for (let i = 0; i < groupFiles.length; i++) {
          const f = groupFiles[i];
          const buf = await f.arrayBuffer();

          setProgressInfo({
            current: i + 1,
            total: groupFiles.length,
            filename: `[${groupName}] ${f.name}`,
            count: groupVerses.length,
          });

          await new Promise((r) => setTimeout(r, 5));

          let enc: 'euc-kr' | 'utf-8' = 'euc-kr';
          try {
            const testUtf8 = new TextDecoder('utf-8', { fatal: true });
            testUtf8.decode(buf);
            enc = 'utf-8';
          } catch {
            enc = 'euc-kr';
          }
          detectedEnc = enc;

          const { allVerses } = parseBufferData(buf, enc, f.name);
          groupVerses = [...groupVerses, ...allVerses];
        }

        if (groupVerses.length > 0) {
          totalImportedStandalone++;
          grandTotalCount += groupVerses.length;
          lastParsedVerses = groupVerses;

          const fallbackName = groupName.replace(/\.[^/.]+$/, '').trim() || '사용자성경';
          const cleanTransName = (customTranslationName.trim() && groupNames.length === 1) ? customTranslationName.trim() : fallbackName;
          await saveToLocalStorageAndNotify(cleanTransName, groupVerses);
        }
      }

      setEncoding(detectedEnc);
      setTotalCount(grandTotalCount);
      setParsedSamples(lastParsedVerses.slice(0, 20));
      setParsedAllVerses(lastParsedVerses);
      setIsParsing(false);
      setProgressInfo(null);

      if (totalImportedStandalone > 1) {
        setSuccessMsg(`🎉 총 ${totalImportedStandalone}개 성경 번역본 (${grandTotalCount.toLocaleString()}개 구절) 인덱싱 및 내 서재 교체 등록 완료!`);
      } else {
        const transName = groupNames[0] || overrideFolderName || '사용자성경';
        setSuccessMsg(`'${transName}' (${grandTotalCount.toLocaleString()}개 구절) 업로드 및 내 서재 교체 등록 완료!`);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('파일 또는 폴더를 읽어오는 중 오류가 발생했습니다.');
      setIsParsing(false);
      setProgressInfo(null);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFiles = e.target.files;
    if (!rawFiles || rawFiles.length === 0) return;
    const allFiles = Array.from(rawFiles) as File[];
    await processFilesArray(allFiles);
    if (e.target) e.target.value = '';
  };

  const handleParsePastedText = async () => {
    if (!pastedText.trim()) {
      setErrorMsg('붙여넣을 텍스트 내용을 입력해주세요.');
      return;
    }

    setIsParsing(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const encoder = new TextEncoder();
      const buffer = encoder.encode(pastedText).buffer;

      const { samples, allVerses, count } = parseBufferData(buffer, 'utf-8');
      setFileBuffer(buffer);
      setTotalCount(count);
      setParsedSamples(samples);
      setParsedAllVerses(allVerses);
      setIsParsing(false);
      setSelectedFile(new File([buffer], '직접입력성경.txt', { type: 'text/plain' }));
      const transTitle = customTranslationName || '직접입력성경';
      setCustomTranslationName(transTitle);

      const dataToSave = allVerses.length > 0 ? allVerses : samples;
      await saveToLocalStorageAndNotify(transTitle, dataToSave);
      setSuccessMsg(`직접 입력한 텍스트에서 총 ${count}개 구절 파싱 및 업로드 목록 저장 완료!`);
    } catch (err) {
      console.error(err);
      setErrorMsg('텍스트 파싱 처리 중 오류가 발생했습니다.');
      setIsParsing(false);
    }
  };

  const handleToggleEncoding = (newEnc: 'euc-kr' | 'utf-8') => {
    if (!fileBuffer || !selectedFile) return;
    setEncoding(newEnc);
    parseBuffer(fileBuffer, newEnc, selectedFile.name);
  };

  const handleSaveToLocal = async () => {
    if (!selectedFile || totalCount === 0) return;

    const transName = customTranslationName || '사용자성경';
    const dataToSave = parsedAllVerses.length > 0 ? parsedAllVerses : parsedSamples;

    const saved = await saveToLocalStorageAndNotify(transName, dataToSave);
    if (saved) {
      setSuccessMsg(`성공적으로 '${transName}' (${dataToSave.length}개 구절) 업로드 목록에 추가/업데이트 되었습니다!`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-3xl rounded-3xl bg-white dark:bg-zinc-900 shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden text-zinc-900 dark:text-zinc-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <FileCode className="w-6 h-6 text-amber-200 shrink-0" />
            <div>
              <h2 className="text-base sm:text-xl font-extrabold font-serif">
                성경 데이터 업로드
              </h2>
              <p className="text-[11px] sm:text-xs text-amber-100">
                보유 중인 .BDF 확장자 및 텍스트 성경 데이터를 모바일/PC에서 직접 분석하고 업로드합니다.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-black/20 hover:bg-black/40 text-white transition-colors shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-3 sm:p-4 overflow-y-auto space-y-3 flex-1">
          {/* 업로드된 성경 데이터 목록 */}
          <div className="p-3 rounded-2xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100">
                  업로드된 성경 데이터 목록 ({uploadedBibles.length}개)
                </span>
              </div>
            </div>

            {uploadedBibles.length === 0 ? (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 py-3 text-center bg-white/60 dark:bg-zinc-900/60 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800">
                아직 업로드된 성경 데이터가 없습니다. 아래에서 성경 파일(.BDF/.TXT)을 불러와 저장하면 이곳에 표시됩니다.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {uploadedBibles.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl border border-amber-500/40 bg-white dark:bg-zinc-900 text-left shadow-xs"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="text-xs font-bold text-amber-700 dark:text-amber-300 truncate">
                        {item.name}
                      </p>
                      <p className="text-[10px] text-zinc-500 font-mono">
                        총 {item.count.toLocaleString()}개 구절 (대조성경 목록에 자동 연동됨)
                      </p>
                    </div>
                    {isProtectedBible(item.name) ? (
                      <span className="text-[10px] font-extrabold px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 shrink-0 flex items-center gap-1">
                        🔒 기본 표준 성경 (보호됨)
                      </span>
                    ) : confirmDeleteName === item.name ? (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => executeDeleteBible(item.name)}
                          className="text-[10px] font-bold px-2 py-1 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors cursor-pointer"
                        >
                          정말 삭제
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteName(null)}
                          className="text-[10px] font-bold px-2 py-1 rounded-lg bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 transition-colors cursor-pointer"
                        >
                          취소
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteName(item.name)}
                        className="text-[10px] font-bold px-2 py-1 rounded-lg bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/80 transition-colors shrink-0 cursor-pointer"
                      >
                        삭제
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>


          {/* Progress Indicator for ZIP / Large Files */}
          {progressInfo && (
            <div className="p-4 rounded-2xl bg-amber-600 text-white space-y-2 shadow-lg animate-in fade-in duration-150">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="flex items-center gap-1.5">
                  <Database className="w-4 h-4 animate-spin text-amber-200" />
                  <span>대용량 ZIP 성경 데이터 분석 중 ({progressInfo.current} / {progressInfo.total})</span>
                </span>
                <span>{Math.round((progressInfo.current / progressInfo.total) * 100)}%</span>
              </div>
              <p className="text-[11px] text-amber-100 truncate font-mono">
                현재 파일: {progressInfo.filename} ({progressInfo.count.toLocaleString()}개 구절 누적)
              </p>
              <div className="w-full bg-amber-900/60 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-amber-300 h-2 rounded-full transition-all duration-200"
                  style={{ width: `${(progressInfo.current / progressInfo.total) * 100}%` }}
                ></div>
              </div>
            </div>
          )}


          {importMode === 'paste' ? (
            /* Text Paste Zone */
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 space-y-3">
              <div>
                <p className="text-xs font-extrabold text-zinc-800 dark:text-zinc-200">
                  모바일 복사/붙여넣기 지원
                </p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                  스마트폰에서 복사한 BDF 내용이나 성경 구절 텍스트를 아래 상자에 붙여넣으면 즉시 성경 데이터로 파싱됩니다.
                </p>
              </div>

              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                rows={6}
                placeholder={`예시:\n창 1:1 태초에 하나님이 천지를 창조하시니라\n창 1:2 땅이 혼돈하고 공허하며...\n또는 BDF 데이터 텍스트 (Ge1:1 ...)`}
                className="w-full p-3 rounded-xl text-xs bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
              />

              <button
                type="button"
                onClick={handleParsePastedText}
                className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2 min-h-[44px]"
              >
                <Check className="w-4 h-4" />
                <span>붙여넣은 텍스트 성경 데이터로 분석하기</span>
              </button>
            </div>
          ) : (
            /* File Upload Zone */
            <div className="border-2 border-dashed border-amber-500/40 hover:border-amber-500 bg-amber-500/5 dark:bg-amber-950/20 rounded-2xl p-3 sm:p-4 text-center space-y-2.5 transition-colors">
              <Upload className="w-7 h-7 mx-auto text-amber-600 dark:text-amber-400" />
              <p className="text-xs sm:text-sm font-extrabold text-zinc-800 dark:text-zinc-200">
                성경 파일 (.BDF / .TXT / .ZIP) 또는 폴더 업로드
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={triggerFileSelect}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-extrabold text-xs sm:text-sm shadow-md cursor-pointer transition-all active:scale-95 min-h-[48px] w-full sm:w-auto"
                >
                  <FileText className="w-4 h-4" />
                  <span>📱 모바일/PC 성경 파일 (.BDB / .SDB / .CDB / .ZIP) 선택</span>
                </button>

                <button
                  type="button"
                  onClick={handleSelectFolder}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-amber-700 hover:bg-amber-800 active:bg-amber-900 text-white font-extrabold text-xs sm:text-sm shadow-md cursor-pointer transition-all active:scale-95 min-h-[48px] w-full sm:w-auto"
                >
                  <Folder className="w-4 h-4" />
                  <span>📁 성경 폴더 선택 (내부 파일 전체 자동 참조)</span>
                </button>
              </div>

              <div className="text-[11px] text-amber-800 dark:text-amber-200 bg-amber-500/10 p-3 rounded-xl text-left leading-relaxed space-y-1">
                <p className="font-extrabold flex items-center gap-1">
                  💡 모바일 및 PC 베들레헴 성경 데이터 업로드 안내:
                </p>
                <p>
                  1. 상단 <strong>[📱 모바일/PC 성경 파일 선택]</strong>을 터치하여 <code>.bdb</code>(일반성경), <code>.sdb</code>(스트롱코드성경), <code>.cdb</code>(주석), <code>.bdf</code> 단일/다중 파일 또는 <code>.zip</code> 압축파일을 바로 선택할 수 있습니다.
                </p>
                <p>
                  2. 상단 <strong>[⚡ 기본 성경 '개역한글' 교체]</strong> 옵션이 켜져있으면, 내가 올린 데이터가 기본 개역한글 본문으로도 100% 교체 저장되어 전체 성경을 한글 오차 없이 읽을 수 있습니다.
                </p>
              </div>

              {/* Hidden File Input for Mobile and PC files - setting accept forces Mobile OS to open File Manager instead of Camera/Gallery */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="*/*"
                onChange={handleFileChange}
                className="hidden"
                style={{ display: 'none' }}
              />

              {/* Hidden File Input for Directory/Folder Select (fallback) */}
              <input
                ref={folderInputRef}
                type="file"
                {...({ webkitdirectory: '', directory: '' } as any)}
                multiple
                onChange={handleFileChange}
                className="hidden"
                style={{ display: 'none' }}
              />
            </div>
          )}

          {/* Selected File & Parsing Status */}
          {selectedFile && (
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5 truncate">
                  <Database className="w-4 h-4 shrink-0" />
                  <span className="truncate">파일명: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                </span>

                {/* Encoding Switcher */}
                <div className="flex items-center gap-1.5 bg-zinc-200 dark:bg-zinc-900 p-1 rounded-xl self-start sm:self-auto">
                  <span className="text-[10px] text-zinc-500 font-bold px-1">인코딩:</span>
                  <button
                    onClick={() => handleToggleEncoding('euc-kr')}
                    className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all ${
                      encoding === 'euc-kr'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
                    }`}
                  >
                    EUC-KR (완성형)
                  </button>
                  <button
                    onClick={() => handleToggleEncoding('utf-8')}
                    className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all ${
                      encoding === 'utf-8'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
                    }`}
                  >
                    UTF-8
                  </button>
                </div>
              </div>

              <div className="text-xs font-mono text-zinc-500">
                {isParsing ? '파싱 분석 중...' : `총 ${totalCount.toLocaleString()}개 구절 데이터 감지`}
              </div>

              {/* Translation Title Input */}
              <div className="flex items-center gap-2 pt-1">
                <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400 shrink-0">
                  성경 이름 설정:
                </label>
                <input
                  type="text"
                  value={customTranslationName}
                  onChange={(e) => setCustomTranslationName(e.target.value)}
                  placeholder="예: 흠정역 KJV, 개역개정"
                  className="flex-1 px-3 py-1.5 rounded-xl text-xs bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Sample Output Preview & Integrity Badge */}
              {parsedSamples.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-zinc-200 dark:border-zinc-700">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-extrabold text-zinc-700 dark:text-zinc-300">
                      🔍 파싱 샘플 결과 (상위 {parsedSamples.length}개 미리보기)
                    </p>
                    {latestIntegrityReport && (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                        무결성 {latestIntegrityReport.integrityScore}점
                      </span>
                    )}
                  </div>

                  <div className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 max-h-36 overflow-y-auto space-y-1.5 text-xs font-serif">
                    {parsedSamples.map((sample, idx) => (
                      <div key={idx} className="flex gap-2 text-zinc-800 dark:text-zinc-200">
                        <span className="font-extrabold text-amber-600 dark:text-amber-400 shrink-0 font-sans">
                          [{sample.bookName} {sample.chapter}:{sample.verse}]
                        </span>
                        <span className="truncate">{sample.text}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <button
                      onClick={handleSaveToLocal}
                      className="flex-1 py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2 min-h-[44px]"
                    >
                      <Check className="w-4 h-4" />
                      <span>내 로컬 성경 서재에 데이터 추가 저장하기</span>
                    </button>

                    {onOpenIntegrityModal && (
                      <button
                        onClick={onOpenIntegrityModal}
                        className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 min-h-[44px] shrink-0"
                      >
                        <ShieldCheck className="w-4 h-4 text-amber-400" />
                        <span>무결성 검사 도구</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* BDF File Format Guide */}
          <div className="space-y-3 pt-2">
            <h3 className="text-sm font-extrabold text-zinc-800 dark:text-zinc-200 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Info className="w-4 h-4 text-amber-600" />
                <span>베들레헴 .BDF 파일 구조 해설</span>
              </span>
              {onOpenIntegrityModal && (
                <button
                  onClick={onOpenIntegrityModal}
                  className="text-xs font-semibold text-amber-600 hover:text-amber-500 underline flex items-center gap-1"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  성경 무결성 검사 도구 열기
                </button>
              )}
            </h3>

            <div className="p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-800 space-y-2.5 text-xs leading-relaxed text-zinc-700 dark:text-zinc-300">
              <p>
                <strong>베들레헴(Bethlehem) .BDF 파일</strong>은 한국에서 널리 쓰이는 베들레헴 성경의 데이터 형식입니다. 스마트폰 카카오톡, 내 파일, 구글 드라이브 등에 저장된 .BDF 파일 및 .TXT 파일을 직접 선택하여 불러올 수 있습니다.
              </p>
              <ul className="list-disc pl-5 space-y-1 font-mono text-[11px] text-zinc-600 dark:text-zinc-400">
                <li>1.BDF : 모세오경 (창세기 ~ 신명기)</li>
                <li>2.BDF : 역사서 (여호수아 ~ 에스더)</li>
                <li>3.BDF : 시가지혜서 (욥기 ~ 아가)</li>
                <li>4.BDF : 선지서 (이사야 ~ 말라기)</li>
                <li>5.BDF : 복음서 (마태복음 ~ 요한복음)</li>
                <li>6.BDF : 서신서 (사도행전 ~ 유다서)</li>
                <li>7.BDF : 요한계시록</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-zinc-500">
            💡 BDF 선택 버튼으로 스마트폰/PC의 파일 탐색기에서 직접 성경을 분석할 수 있습니다.
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 font-bold text-xs transition-colors shrink-0"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
