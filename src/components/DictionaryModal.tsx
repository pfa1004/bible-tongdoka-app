import React, { useState, useEffect } from 'react';
import { DictionaryEntry, StrongsEntry } from '../types';
import { DICTIONARY_ENTRIES, STRONGS_ENTRIES } from '../data/dictionaryData';
import { X, BookOpen, MapPin, User, FileText, ExternalLink, Hash, Bookmark, Volume2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  entry?: DictionaryEntry | null;
  strongCode?: string | null;
  onSelectVerse?: (bookName: string, chapter: number, verse: number) => void;
  onSearchStrongCode?: (code: string) => void;
}

export const DictionaryModal: React.FC<Props> = ({
  isOpen,
  onClose,
  entry,
  strongCode,
  onSelectVerse,
  onSearchStrongCode,
}) => {
  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
    }
  }, []);

  if (!isOpen) return null;

  const targetCode = strongCode || entry?.strongCode;
  const strongData: StrongsEntry | undefined = targetCode
    ? STRONGS_ENTRIES[targetCode] || {
        code: targetCode,
        language: targetCode.startsWith('H') ? 'Hebrew' : 'Greek',
        originalWord: targetCode,
        transliteration: targetCode,
        pronunciation: targetCode,
        partOfSpeech: '원어 단어',
        definition: `${targetCode} 원어 단어 항목입니다. 아래 '검색하기' 버튼으로 성경 구절을 찾아보실 수 있습니다.`,
        usageCount: 1,
        kjvTranslation: targetCode,
      }
    : undefined;

  const getKoreanPronunciationText = (strong: StrongsEntry): string => {
    const knownMap: Record<string, string> = {
      H216: '오르',
      H430: '엘로힘',
      H559: '아마르',
      H802: '이샤',
      H1254: '바라',
      H1697: '다바르',
      H1961: '하야',
      H2617: '헤세드',
      H2822: '호셰크',
      H3068: '야훼 여호와',
      H3117: '욤',
      H3335: '야차르',
      H4191: '무트',
      H4325: '마임',
      H5175: '나하쉬',
      H5315: '네페쉬',
      H6754: '체렘',
      H7218: '레시트',
      H7307: '루아흐',
      H7549: '라키아',
      H776: '에레츠',
      H8064: '샤마임',
      H8085: '샤마',
      G25: '아가파오',
      G26: '아가페',
      G3056: '로고스',
      G312: '아가파오',
      G4102: '피스티스',
      G4151: '프뉴마',
      G5485: '카리스',
    };

    if (knownMap[strong.code]) {
      return knownMap[strong.code];
    }

    // Extract first Korean definition or clean pronunciation if short and valid
    const firstDef = strong.definition.split(',')[0].split('(')[0].split('.')[0].trim();
    if (firstDef && /[가-힣]/.test(firstDef) && firstDef.length <= 10 && !firstDef.includes('원어')) {
      return firstDef;
    }

    if (strong.pronunciation && /[가-힣]/.test(strong.pronunciation)) {
      return strong.pronunciation;
    }

    return strong.transliteration ? strong.transliteration.replace(/[-'`"]/g, ' ') : strong.code;
  };

  const playOriginalPronunciation = (strong: StrongsEntry) => {
    if (!('speechSynthesis' in window)) {
      alert('현재 사용 중인 브라우저에서는 음성 합성(TTS) 기능이 지원되지 않습니다.');
      return;
    }

    window.speechSynthesis.cancel();

    const isHebrew = strong.language === 'Hebrew';
    const langCode = isHebrew ? 'he' : 'el';
    const voices = window.speechSynthesis.getVoices() || [];

    // Search for Hebrew/Greek native voice on system
    const nativeVoice = voices.find((v) => v.lang.toLowerCase().startsWith(langCode));

    if (nativeVoice) {
      const utterance = new SpeechSynthesisUtterance(strong.originalWord);
      utterance.voice = nativeVoice;
      utterance.lang = nativeVoice.lang;
      utterance.rate = 0.8;
      window.speechSynthesis.speak(utterance);
    } else {
      // Clean transliteration string for English TTS (e.g., "Elohim", "Yahweh", "Ruach", "Logos")
      const translitText = (strong.transliteration || strong.pronunciation || strong.originalWord)
        .replace(/[`'"]/g, '')
        .split('/')[0]
        .split('(')[0]
        .trim();

      const utterance = new SpeechSynthesisUtterance(translitText);
      utterance.lang = 'en-US';
      utterance.rate = 0.85;

      const enVoice = voices.find((v) => v.lang.toLowerCase().startsWith('en'));
      if (enVoice) {
        utterance.voice = enVoice;
      }

      window.speechSynthesis.speak(utterance);
    }
  };

  const playKoreanPronunciation = (strong: StrongsEntry) => {
    if (!('speechSynthesis' in window)) {
      alert('현재 사용 중인 브라우저에서는 음성 합성(TTS) 기능이 지원되지 않습니다.');
      return;
    }

    window.speechSynthesis.cancel();

    const koreanText = getKoreanPronunciationText(strong);
    const utterance = new SpeechSynthesisUtterance(koreanText);
    utterance.lang = 'ko-KR';
    utterance.rate = 0.85;

    const voices = window.speechSynthesis.getVoices() || [];
    const koVoice = voices.find((v) => v.lang.toLowerCase().startsWith('ko'));
    if (koVoice) {
      utterance.voice = koVoice;
    }

    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-zinc-900 shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden text-zinc-900 dark:text-zinc-100 animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-200 dark:border-zinc-800 bg-amber-500/10 dark:bg-amber-500/5">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500 text-white">
              <BookOpen className="w-4 h-4" />
            </span>
            <div>
              <div className="font-bold text-lg leading-tight flex items-center gap-2">
                <span>{entry?.term || strongData?.originalWord || '성경사전'}</span>
                {entry?.hanja && (
                  <span className="text-xs font-normal text-zinc-500">
                    ({entry.hanja})
                  </span>
                )}
              </div>
              <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                {entry?.category ? `${entry.category} 백과사전` : '스트롱코드 원어사전'}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Dictionary Entry Content */}
          {entry && (
            <div className="space-y-4">
              {/* Summary Banner */}
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-amber-900 dark:text-amber-200 font-medium text-sm">
                "{entry.summary}"
              </div>

              {/* Photo / Illustration if available */}
              {entry.imageUrl && (
                <div className="rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 relative bg-zinc-100 dark:bg-zinc-800">
                  <img
                    src={entry.imageUrl}
                    alt={entry.term}
                    className="w-full h-44 object-cover"
                  />
                  {entry.imageCaption && (
                    <div className="p-2 bg-black/60 backdrop-blur-xs text-white text-xs text-center">
                      {entry.imageCaption}
                    </div>
                  )}
                </div>
              )}

              {/* Detailed Definition */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                  상세 용어 설명
                </h4>
                <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                  {entry.definition}
                </p>
              </div>

              {/* Related Verses */}
              {entry.relatedVerses && entry.relatedVerses.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                    관련 성경 구절
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {entry.relatedVerses.map((v, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          if (onSelectVerse) {
                            onSelectVerse(v.bookName, v.chapter, v.verse);
                            onClose();
                          }
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-xs font-medium text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 transition-colors"
                      >
                        <Bookmark className="w-3.5 h-3.5 text-amber-600" />
                        <span>
                          {v.bookName} {v.chapter}:{v.verse}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Strong's Code Lexicon Details */}
          {strongData && (
            <div className="space-y-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1 text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-zinc-900 text-amber-400 border border-zinc-700">
                  <Hash className="w-3.5 h-3.5" />
                  {strongData.code} ({strongData.language})
                </span>
                <span className="text-xs text-zinc-500">
                  성경 총 {strongData.usageCount}회 출현
                </span>
              </div>

              <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 space-y-2.5">
                <div className="flex items-baseline justify-between flex-wrap gap-2">
                  <span className="text-2xl font-serif font-bold text-amber-700 dark:text-amber-300">
                    {strongData.originalWord}
                  </span>
                  <span className="text-xs text-zinc-500 italic">
                    음역: {strongData.transliteration} ({strongData.pronunciation})
                  </span>
                </div>

                {/* Pronunciation Audio Buttons */}
                <div className="flex items-center gap-2 pt-0.5 flex-wrap">
                  <button
                    onClick={() => playOriginalPronunciation(strongData)}
                    className="px-2.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95"
                    title={`${strongData.language === 'Hebrew' ? '히브리어' : '헬라어'} 원어 음성 듣기`}
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>🔊 원어 발음 ({strongData.transliteration})</span>
                  </button>

                  <button
                    onClick={() => playKoreanPronunciation(strongData)}
                    className="px-2.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95"
                    title="한글 음성 발음 듣기"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>🔊 한글 발음 ({getKoreanPronunciationText(strongData)})</span>
                  </button>
                </div>

                <div className="text-xs text-zinc-600 dark:text-zinc-400">
                  품사: <span className="font-semibold">{strongData.partOfSpeech}</span>
                </div>
                <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 pt-1">
                  원어 의미: {strongData.definition}
                </p>
                <div className="text-xs text-zinc-500 pt-1 border-t border-zinc-200 dark:border-zinc-700">
                  KJV 번역: {strongData.kjvTranslation}
                </div>

                {onSearchStrongCode && (
                  <button
                    onClick={() => {
                      onSearchStrongCode(`#${strongData.code}`);
                      onClose();
                    }}
                    className="w-full mt-2 py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                  >
                    <Hash className="w-4 h-4" />
                    <span>#{strongData.code} 원어가 사용된 성경 구절 전체 검색하기 (Word Study)</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 text-right">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-200 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
