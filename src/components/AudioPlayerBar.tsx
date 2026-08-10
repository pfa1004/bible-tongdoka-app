import React, { useState, useEffect, useRef } from 'react';
import { AudioPlayerState, Book } from '../types';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Clock,
  Gauge,
  X,
  Smartphone,
  ChevronUp,
  ChevronDown,
  Mic,
} from 'lucide-react';

interface Props {
  state: AudioPlayerState;
  onUpdateState: (newState: Partial<AudioPlayerState>) => void;
  currentBook: Book;
  currentChapterVerses: string[];
  onVerseChange: (verseIndex: number) => void;
  onNextChapter: () => void;
  onPrevChapter: () => void;
  onClose: () => void;
  onOpenHenryCommentary?: () => void;
}

export const AudioPlayerBar: React.FC<Props> = ({
  state,
  onUpdateState,
  currentBook,
  currentChapterVerses,
  onVerseChange,
  onNextChapter,
  onPrevChapter,
  onClose,
  onOpenHenryCommentary,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;

      const loadVoices = () => {
        if (synthRef.current) {
          const list = synthRef.current.getVoices();
          if (list.length > 0) {
            setVoices(list);
          }
        }
      };

      loadVoices();

      if (synthRef.current.onvoiceschanged !== undefined) {
        synthRef.current.onvoiceschanged = loadVoices;
      }
    } else {
      setSpeechSupported(false);
    }
  }, []);

  // Web Speech API TTS Engine
  useEffect(() => {
    if (!state.isPlaying) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (synthRef.current) synthRef.current.cancel();
      return;
    }

    if (currentChapterVerses.length === 0) return;

    const verseText = currentChapterVerses[state.currentVerseIndex] || '';

    if (synthRef.current) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      synthRef.current.cancel(); // Cancel current speech

      const utterance = new SpeechSynthesisUtterance(verseText);
      utterance.lang = 'ko-KR';
      utterance.rate = state.speed;
      utterance.pitch = state.pitch ?? 1.0;

      if (state.voiceURI && voices.length > 0) {
        const found = voices.find((v) => v.voiceURI === state.voiceURI);
        if (found) {
          utterance.voice = found;
        }
      }

      utterance.onend = () => {
        if (!state.isPlaying) return;

        if (state.currentVerseIndex < currentChapterVerses.length - 1) {
          const nextIndex = state.currentVerseIndex + 1;
          onUpdateState({ currentVerseIndex: nextIndex });
          onVerseChange(nextIndex);
        } else {
          // Chapter finished
          if (state.autoNextChapter) {
            onNextChapter();
            onUpdateState({ currentVerseIndex: 0 });
            onVerseChange(0);
          } else {
            onUpdateState({ isPlaying: false });
          }
        }
      };

      utterance.onerror = (e) => {
        // Do NOT trigger fallback when speech is intentionally stopped, interrupted, or canceled
        if (e.error === 'interrupted' || e.error === 'canceled' || !state.isPlaying) {
          return;
        }

        // Fallback simulation timer if speech synthesis fails in browser
        timerRef.current = setTimeout(() => {
          if (!state.isPlaying) return;

          if (state.currentVerseIndex < currentChapterVerses.length - 1) {
            const nextIndex = state.currentVerseIndex + 1;
            onUpdateState({ currentVerseIndex: nextIndex });
            onVerseChange(nextIndex);
          }
        }, 4000 / state.speed);
      };

      synthRef.current.speak(utterance);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [
    state.isPlaying,
    state.currentVerseIndex,
    state.speed,
    state.voiceURI,
    state.pitch,
    voices,
    currentChapterVerses,
  ]);

  // Sleep Timer Countdown
  useEffect(() => {
    if (state.sleepTimerMinutes > 0 && state.isPlaying) {
      const timeout = setTimeout(() => {
        onUpdateState({ isPlaying: false, sleepTimerMinutes: 0 });
        if (synthRef.current) synthRef.current.cancel();
      }, state.sleepTimerMinutes * 60 * 1000);

      return () => clearTimeout(timeout);
    }
  }, [state.sleepTimerMinutes, state.isPlaying]);

  const togglePlay = () => {
    onUpdateState({ isPlaying: !state.isPlaying });
  };

  const handleNextVerse = () => {
    if (state.currentVerseIndex < currentChapterVerses.length - 1) {
      const nextIndex = state.currentVerseIndex + 1;
      onUpdateState({ currentVerseIndex: nextIndex });
      onVerseChange(nextIndex);
    } else {
      onNextChapter();
      onUpdateState({ currentVerseIndex: 0 });
      onVerseChange(0);
    }
  };

  const handlePrevVerse = () => {
    if (state.currentVerseIndex > 0) {
      const prevIndex = state.currentVerseIndex - 1;
      onUpdateState({ currentVerseIndex: prevIndex });
      onVerseChange(prevIndex);
    } else {
      onPrevChapter();
    }
  };

  const currentVerseNum = state.currentVerseIndex + 1;

  return (
    <div className="fixed bottom-22 md:bottom-0 left-0 right-0 z-40 p-2 sm:p-4 pointer-events-none transition-all">
      <div className="max-w-3xl mx-auto pointer-events-auto bg-zinc-900/95 text-white backdrop-blur-md rounded-2xl shadow-2xl border border-zinc-700/80 p-3 sm:p-4">
        {/* Compact Bar View */}
        <div className="flex items-center justify-between gap-3">
          {/* Chapter / Verse info */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
              <Volume2 className="w-5 h-5 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm sm:text-base text-amber-300 truncate">
                  {currentBook.name} {state.chapter}장 {currentVerseNum}절
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">
                  {state.speed}x
                </span>
              </div>
              <p className="text-xs text-zinc-400 truncate max-w-[200px] sm:max-w-[320px]">
                {currentChapterVerses[state.currentVerseIndex] || '오디오 준비 중...'}
              </p>
            </div>
          </div>

          {/* Quick Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Matthew Henry Commentary Shortcut Button */}
            <button
              onClick={onOpenHenryCommentary}
              className="px-2 py-1.5 rounded-lg text-[11px] font-black bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/30 transition-colors shrink-0 cursor-pointer"
              title="현재 장의 매튜헨리 주석 바로보기"
            >
              매튜헨리 ↗
            </button>

            <button
              onClick={handlePrevVerse}
              className="p-2 rounded-lg text-zinc-300 hover:bg-zinc-800 transition-colors"
              title="이전 절"
            >
              <SkipBack className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <button
              onClick={togglePlay}
              className="p-3 rounded-xl bg-amber-500 text-zinc-950 font-bold hover:bg-amber-400 transition-transform active:scale-95 shadow-md shadow-amber-500/20"
            >
              {state.isPlaying ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current ml-0.5" />
              )}
            </button>

            <button
              onClick={handleNextVerse}
              className="p-2 rounded-lg text-zinc-300 hover:bg-zinc-800 transition-colors"
              title="다음 절"
            >
              <SkipForward className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronUp className="w-4 h-4" />
              )}
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Expanded Controls Panel */}
        {isExpanded && (
          <div className="mt-4 pt-3 border-t border-zinc-800 space-y-3 text-xs">
            {/* Speed, Voice & Sleep Timer settings */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-800/60 p-2.5 rounded-xl">
              {/* Playback speed */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <Gauge className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-zinc-400 mr-1">배속:</span>
                {[0.8, 1.0, 1.25, 1.5, 1.75, 2.0].map((s) => (
                  <button
                    key={s}
                    onClick={() => onUpdateState({ speed: s })}
                    className={`px-2 py-1 rounded-md text-xs font-mono transition-colors cursor-pointer ${
                      state.speed === s
                        ? 'bg-amber-500 text-zinc-950 font-bold'
                        : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>

              {/* Voice selection & Pitch Control */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <Mic className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-zinc-400 mr-1 shrink-0">음성:</span>
                <select
                  value={state.voiceURI || ''}
                  onChange={(e) => onUpdateState({ voiceURI: e.target.value })}
                  className="px-2.5 py-1 rounded-md text-xs bg-zinc-700 text-zinc-100 border border-zinc-600 focus:outline-none focus:ring-1 focus:ring-amber-500 truncate max-w-[170px] sm:max-w-[210px] cursor-pointer"
                >
                  <option value="">기본 음성 (시스템 설정)</option>
                  {voices
                    .filter((v) => v.lang.toLowerCase().includes('ko'))
                    .map((v) => {
                      const isMale =
                        v.name.toLowerCase().includes('male') ||
                        v.name.toLowerCase().includes('injoon') ||
                        v.name.includes('인준') ||
                        v.name.includes('남성') ||
                        v.name.toLowerCase().includes('min-ho');
                      return (
                        <option key={v.voiceURI} value={v.voiceURI}>
                          {v.name} {isMale ? '♂ (남성)' : ''}
                        </option>
                      );
                    })}
                  {voices.some((v) => !v.lang.toLowerCase().includes('ko')) && (
                    <optgroup label="기타 언어 음성">
                      {voices
                        .filter((v) => !v.lang.toLowerCase().includes('ko'))
                        .map((v) => (
                          <option key={v.voiceURI} value={v.voiceURI}>
                            {v.name} ({v.lang})
                          </option>
                        ))}
                    </optgroup>
                  )}
                </select>

                {/* Male/Tone Pitch selector */}
                <div className="flex items-center gap-1 ml-1">
                  <span className="text-zinc-400 text-[11px] shrink-0">톤:</span>
                  {[
                    { label: '낮은톤(남성)', pitch: 0.75 },
                    { label: '기본톤', pitch: 1.0 },
                    { label: '높은톤', pitch: 1.25 },
                  ].map((p) => (
                    <button
                      key={p.pitch}
                      onClick={() => onUpdateState({ pitch: p.pitch })}
                      className={`px-1.5 py-0.5 rounded text-[11px] transition-colors cursor-pointer ${
                        (state.pitch ?? 1.0) === p.pitch
                          ? 'bg-amber-500 text-zinc-950 font-bold'
                          : 'bg-zinc-700/80 text-zinc-300 hover:bg-zinc-600'
                      }`}
                      title={p.pitch === 0.75 ? '남성 음색에 가까운 낮은 피치' : ''}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sleep timer */}
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-zinc-400 mr-1">수면 타이머:</span>
                {[0, 15, 30, 60].map((m) => (
                  <button
                    key={m}
                    onClick={() => onUpdateState({ sleepTimerMinutes: m })}
                    className={`px-2 py-1 rounded-md text-xs transition-colors cursor-pointer ${
                      state.sleepTimerMinutes === m
                        ? 'bg-amber-500 text-zinc-950 font-bold'
                        : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                    }`}
                  >
                    {m === 0 ? '꺼짐' : `${m}분`}
                  </button>
                ))}
              </div>
            </div>

            {/* Features notice */}
            <div className="flex items-center justify-between text-zinc-400 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  화면을 끄거나 다른 작업 중에도 연속 오디오 재생이
                  유지됩니다.
                </span>
              </div>

              <label className="flex items-center gap-2 cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={state.autoNextChapter}
                  onChange={(e) =>
                    onUpdateState({ autoNextChapter: e.target.checked })
                  }
                  className="rounded border-zinc-700 text-amber-500 focus:ring-amber-500"
                />
                <span className="text-zinc-300 text-xs font-medium">
                  다음 장 자동 연결
                </span>
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
