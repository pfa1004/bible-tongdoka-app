import React, { useState, useEffect, useRef } from 'react';
import { AudioPlayerState, Book } from '../types';
import { generateSpeechAudioUrl } from '../services/ttsService';
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
  versesData?: any[];
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
  versesData,
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
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentObjectUrlRef = useRef<string | null>(null);
  const wakeLockRef = useRef<any>(null);
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const keepAliveIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 1. 화면 켜짐 유지 (Screen Wake Lock API) - 모바일 대기모드 진입 자동 방지
  useEffect(() => {
    if (state.isPlaying && typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
      (navigator as any).wakeLock.request('screen')
        .then((lock: any) => {
          wakeLockRef.current = lock;
        })
        .catch(() => { });
    } else {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => { });
        wakeLockRef.current = null;
      }
    }
    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => { });
        wakeLockRef.current = null;
      }
    };
  }, [state.isPlaying]);

  // 2. 모바일 잠금화면 미디어 컨트롤 등록 (Media Session API) - 백그라운드 재생 지속
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: `${currentBook.name} ${state.chapter}장 ${state.currentVerseIndex + 1}절`,
          artist: '성경통독 (1년 완독)',
          album: currentBook.name,
        });

        navigator.mediaSession.setActionHandler('play', () => {
          onUpdateState({ isPlaying: true });
        });
        navigator.mediaSession.setActionHandler('pause', () => {
          onUpdateState({ isPlaying: false });
        });
        navigator.mediaSession.setActionHandler('previoustrack', () => {
          if (state.currentVerseIndex > 0) {
            const prevIndex = state.currentVerseIndex - 1;
            onUpdateState({ currentVerseIndex: prevIndex });
            onVerseChange(prevIndex);
          }
        });
        navigator.mediaSession.setActionHandler('nexttrack', () => {
          if (state.currentVerseIndex < currentChapterVerses.length - 1) {
            const nextIndex = state.currentVerseIndex + 1;
            onUpdateState({ currentVerseIndex: nextIndex });
            onVerseChange(nextIndex);
          }
        });
      } catch (e) { }
    }
  }, [currentBook.name, currentBook.id, state.chapter, state.currentVerseIndex, state.isPlaying]);

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

  const lastSpokenKeyRef = useRef<string | null>(null);

  // Web Speech API / edge-tts AI Audio Engine
  useEffect(() => {
    const currentKey = `${currentBook.id}-${state.chapter}-${state.currentVerseIndex}-${state.isPlaying}-${state.speed}-${state.voiceURI}-${state.pitch}`;

    if (!state.isPlaying) {
      lastSpokenKeyRef.current = null;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (synthRef.current) synthRef.current.cancel();
      if (audioRef.current) {
        audioRef.current.pause();
      }
      return;
    }

    // 이미 동일한 구절/설정으로 재생 중이면 re-render로 인한 cancel/restart 방지
    if (lastSpokenKeyRef.current === currentKey) {
      return;
    }

    let verseText = (currentChapterVerses && currentChapterVerses[state.currentVerseIndex]) || '';

    // 만약 currentChapterVerses가 비어있다면 versesData에서 직접 텍스트 추출
    if (!verseText.trim() && versesData && versesData[state.currentVerseIndex]) {
      const vObj = versesData[state.currentVerseIndex];
      if (vObj && vObj.text) {
        verseText = vObj.text['HKJV'] || vObj.text['개역한글'] || Object.values(vObj.text)[0] || '';
      }
    }

    if (!verseText.trim()) {
      verseText = '성경 구절 오디오 준비 중입니다.';
    }

    lastSpokenKeyRef.current = currentKey;

    const speakWithWebSpeech = (text: string) => {
      const synth = synthRef.current || (typeof window !== 'undefined' ? window.speechSynthesis : null);
      if (!synth) return;

      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (keepAliveIntervalRef.current) {
        clearInterval(keepAliveIntervalRef.current);
        keepAliveIntervalRef.current = null;
      }

      try {
        synth.cancel();
      } catch (e) { }

      const utterance = new SpeechSynthesisUtterance(text);
      activeUtteranceRef.current = utterance;

      const isEnglish = 
        Boolean(state.selectedTranslationId?.toLowerCase().includes('kjv')) ||
        Boolean(state.voiceURI?.toLowerCase().includes('en-us')) ||
        Boolean(state.voiceURI?.toLowerCase().includes('guy')) ||
        /^[A-Za-z0-9\s.,!?:;'"]+$/.test(text.trim());

      const isMaleSelected =
        state.voiceURI?.toLowerCase().includes('injoon') ||
        state.voiceURI?.toLowerCase().includes('hyunsu') ||
        state.voiceURI?.toLowerCase().includes('guy') ||
        state.voiceURI?.toLowerCase().includes('male') ||
        (state.pitch !== undefined && state.pitch < 0.9);

      utterance.lang = isEnglish ? 'en-US' : 'ko-KR';
      utterance.rate = state.speed || 1.0;
      utterance.pitch = isMaleSelected ? 0.65 : (state.pitch ?? 1.0);

      const currentVoices = voices.length > 0 ? voices : (typeof window !== 'undefined' && window.speechSynthesis ? window.speechSynthesis.getVoices() : []);

      if (currentVoices.length > 0) {
        if (state.voiceURI && !state.voiceURI.startsWith('edge:') && state.voiceURI !== 'default-system') {
          const found = currentVoices.find((v) => v.voiceURI === state.voiceURI);
          if (found) utterance.voice = found;
        } else if (isEnglish) {
          const englishVoice = currentVoices.find((v) => v.lang.toLowerCase().startsWith('en'));
          if (englishVoice) utterance.voice = englishVoice;
        } else {
          const koreanVoice = currentVoices.find((v) => v.lang.toLowerCase().startsWith('ko'));
          if (koreanVoice) utterance.voice = koreanVoice;
        }
      }

      const isAdvancingRef = { current: false };

      const advanceToNext = () => {
        if (isAdvancingRef.current) return;
        isAdvancingRef.current = true;

        if (keepAliveIntervalRef.current) {
          clearInterval(keepAliveIntervalRef.current);
          keepAliveIntervalRef.current = null;
        }
        activeUtteranceRef.current = null;
        lastSpokenKeyRef.current = null;
        if (!state.isPlaying) return;

        if (state.currentVerseIndex < currentChapterVerses.length - 1) {
          const nextIndex = state.currentVerseIndex + 1;
          onUpdateState({ currentVerseIndex: nextIndex });
          onVerseChange(nextIndex);
        } else {
          if (state.autoNextChapter) {
            onNextChapter();
            onUpdateState({ currentVerseIndex: 0 });
            onVerseChange(0);
          } else {
            onUpdateState({ isPlaying: false });
          }
        }
      };

      utterance.onend = () => {
        advanceToNext();
      };

      utterance.onerror = (e) => {
        if (e.error === 'interrupted' || e.error === 'canceled' || !state.isPlaying) {
          activeUtteranceRef.current = null;
          return;
        }
        advanceToNext();
      };

      try {
        synth.resume();
        synth.speak(utterance);
      } catch (err) {
        console.error('Speech synthesis speak error:', err);
      }
    };

    speakWithWebSpeech(verseText);
  }, [
    state.isPlaying,
    currentBook.id,
    state.chapter,
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
    try {
      if (!state.isPlaying) {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          try { window.speechSynthesis.resume(); } catch (e) { }
        }
        if (!audioRef.current) {
          audioRef.current = new Audio();
        }
        audioRef.current.src = 'data:audio/mp3;base64,//OExAAAAANIAAAAAExBTUUzLjEwMKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq';
        audioRef.current.play().catch(() => { });
      }
    } catch (e) { }
    onUpdateState({ isPlaying: !state.isPlaying });
  };

  const handleNextVerse = () => {
    lastSpokenKeyRef.current = null;
    if (synthRef.current) {
      try { synthRef.current.cancel(); } catch (e) { }
    }
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
    lastSpokenKeyRef.current = null;
    if (synthRef.current) {
      try { synthRef.current.cancel(); } catch (e) { }
    }
    if (state.currentVerseIndex > 0) {
      const prevIndex = state.currentVerseIndex - 1;
      onUpdateState({ currentVerseIndex: prevIndex });
      onVerseChange(prevIndex);
    } else {
      onPrevChapter();
    }
  };

  const currentVerseNum = state.currentVerseIndex + 1;

  const displayVerseText = currentChapterVerses[state.currentVerseIndex] || '오디오 준비 중...';

  return (
    <div className="fixed bottom-16 sm:bottom-4 left-2 right-2 sm:left-4 sm:right-4 z-50 pointer-events-none transition-all">
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
                {displayVerseText}
              </p>
            </div>
          </div>

          {/* Quick Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">

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
                    className={`px-2 py-1 rounded-md text-xs font-mono transition-colors cursor-pointer ${state.speed === s
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
                  value={state.voiceURI || 'default-system'}
                  onChange={(e) => {
                    const v = e.target.value;
                    const isMale = v.includes('InJoon') || v.includes('Hyunsu') || v.includes('Guy');
                    onUpdateState({
                      voiceURI: v,
                      pitch: isMale ? 0.65 : (v.includes('SunHi') || v.includes('Aria') ? 1.0 : state.pitch),
                    });
                  }}
                  className="px-2.5 py-1 rounded-md text-xs bg-zinc-700 text-zinc-100 border border-zinc-600 focus:outline-none focus:ring-1 focus:ring-amber-500 truncate max-w-[170px] sm:max-w-[210px] cursor-pointer"
                >
                  <option value="default-system">📱 스마트폰/기기 기본 내장 음성</option>
                  <option value="edge:ko-KR-InJoonNeural">👨 AI 남성 음성 (인준)</option>
                  <option value="edge:ko-KR-HyunsuMultilingualNeural">👨 AI 남성 음성 (현수)</option>
                  <option value="edge:ko-KR-SunHiNeural">👩 AI 여성 음성 (선희)</option>
                  <option value="edge:en-US-GuyNeural">👱‍♂️ AI 영어 남성 (Guy / KJV)</option>
                </select>

                {/* Male/Tone Pitch selector */}
                <div className="flex items-center gap-1 ml-1">
                  <span className="text-zinc-400 text-[11px] shrink-0">톤:</span>
                  {[
                    { label: '남성톤', pitch: 0.65 },
                    { label: '기본톤', pitch: 1.0 },
                    { label: '높은톤', pitch: 1.25 },
                  ].map((p) => (
                    <button
                      key={p.pitch}
                      onClick={() => onUpdateState({ pitch: p.pitch })}
                      className={`px-1.5 py-0.5 rounded text-[11px] transition-colors cursor-pointer ${(state.pitch ?? 1.0) === p.pitch || (p.pitch === 0.65 && (state.pitch ?? 1.0) <= 0.75)
                        ? 'bg-amber-500 text-zinc-950 font-bold'
                        : 'bg-zinc-700/80 text-zinc-300 hover:bg-zinc-600'
                        }`}
                      title={p.pitch === 0.65 ? '중저음 남성 목소리' : ''}
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
                    className={`px-2 py-1 rounded-md text-xs transition-colors cursor-pointer ${state.sleepTimerMinutes === m
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
