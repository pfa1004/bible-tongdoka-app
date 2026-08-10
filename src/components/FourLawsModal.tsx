import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Heart,
  AlertTriangle,
  Cross,
  UserCheck,
  BookOpen,
  Volume2,
  Copy,
  Check,
  Sparkles,
  ArrowRight,
  Share2,
  ChevronRight,
  Info,
  ShieldCheck,
  Flame,
  MessageSquare,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelectScripture?: (bookName: string, chapter: number) => void;
}

export const FourLawsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSelectScripture,
}) => {
  const [activeTab, setActiveTab] = useState<'law1' | 'law2' | 'law3' | 'law4' | 'prayer' | 'growth'>('law1');
  const [copiedPrayer, setCopiedPrayer] = useState(false);
  const [isReadingAloud, setIsReadingAloud] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [activeTab, isOpen]);

  if (!isOpen) return null;

  const prayerText = `주 예수님, 나는 예수님을 믿고 싶습니다.

십자가에서 죽으심으로
내 죄 값을 담당해 주셔서 감사합니다.

지금 나는 내 마음의 문을 열고
예수님을 나의 구주, 나의 하나님으로 영접합니다.

나의 죄를 용서하시고
영생을 주심에 감사합니다.

나의 삶을 다스려 주시고,
나를 예수님이 원하시는 사람으로 만들어 주옵소서.

예수님의 이름으로 기도합니다. 아멘.`;

  const handleCopyPrayer = () => {
    navigator.clipboard.writeText(prayerText);
    setCopiedPrayer(true);
    setTimeout(() => setCopiedPrayer(false), 2000);
  };

  const handleSpeech = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const synth = window.speechSynthesis;
    if (isReadingAloud) {
      synth.cancel();
      setIsReadingAloud(false);
    } else {
      synth.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ko-KR';
      utterance.rate = 0.95;
      utterance.onend = () => setIsReadingAloud(false);
      synth.speak(utterance);
      setIsReadingAloud(true);
    }
  };

  const handleScriptureClick = (bookName: string, chapter: number) => {
    if (onSelectScripture) {
      onSelectScripture(bookName, chapter);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-2 sm:p-4 pt-[calc(env(safe-area-inset-top,0px)+0.75rem)] pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)] bg-zinc-950/75 backdrop-blur-md animate-fade-in overflow-hidden">
      <div className="bg-white dark:bg-zinc-900 border border-amber-200 dark:border-zinc-800 rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-4xl h-[calc(100dvh-1.75rem)] sm:h-auto sm:max-h-[90vh] flex flex-col overflow-hidden transition-all my-auto">
        {/* Header Bar */}
        <div className="p-3.5 sm:p-5 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700 text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center font-extrabold text-xl shadow-inner border border-white/30">
              ✝
            </div>
            <div>
              <h2 className="text-sm sm:text-xl font-extrabold font-sans tracking-tight whitespace-nowrap">
                사영리 (The Four Spiritual Laws)
              </h2>
              <p className="text-xs text-amber-100/90 font-medium mt-0.5">
                하나님과 사람 사이의 4가지 영적 원리와 구원의 메시지
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Navigation Tabs */}
        <div className="flex items-center justify-between px-2 sm:px-4 py-2 border-b border-zinc-200 dark:border-zinc-800 bg-amber-50/50 dark:bg-zinc-950/50 overflow-x-auto no-scrollbar shrink-0 text-xs font-bold gap-1">
          <button
            onClick={() => setActiveTab('law1')}
            className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'law1'
                ? 'bg-amber-500 text-zinc-950 shadow-sm font-extrabold'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-amber-100/60 dark:hover:bg-zinc-800'
            }`}
          >
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <span>제1원리 (사랑/계획)</span>
          </button>

          <button
            onClick={() => setActiveTab('law2')}
            className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'law2'
                ? 'bg-amber-500 text-zinc-950 shadow-sm font-extrabold'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-amber-100/60 dark:hover:bg-zinc-800'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>제2원리 (죄/분리)</span>
          </button>

          <button
            onClick={() => setActiveTab('law3')}
            className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'law3'
                ? 'bg-amber-500 text-zinc-950 shadow-sm font-extrabold'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-amber-100/60 dark:hover:bg-zinc-800'
            }`}
          >
            <Cross className="w-3.5 h-3.5 text-indigo-500" />
            <span>제3원리 (구원의 길)</span>
          </button>

          <button
            onClick={() => setActiveTab('law4')}
            className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'law4'
                ? 'bg-amber-500 text-zinc-950 shadow-sm font-extrabold'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-amber-100/60 dark:hover:bg-zinc-800'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>제4원리 (영접)</span>
          </button>

          <button
            onClick={() => setActiveTab('prayer')}
            className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'prayer'
                ? 'bg-amber-500 text-zinc-950 shadow-sm font-extrabold'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-amber-100/60 dark:hover:bg-zinc-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>영접 기도</span>
          </button>

          <button
            onClick={() => setActiveTab('growth')}
            className={`px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'growth'
                ? 'bg-amber-500 text-zinc-950 shadow-sm font-extrabold'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-amber-100/60 dark:hover:bg-zinc-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
            <span>신앙의 성장</span>
          </button>
        </div>

        {/* Modal Main Content View */}
        <div ref={scrollRef} className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 scroll-smooth [word-break:keep-all]">
          {/* Law 1 */}
          {activeTab === 'law1' && (
            <div className="space-y-6 animate-fade-in">
              <div className="p-5 rounded-2xl bg-gradient-to-br from-rose-50 to-amber-50 dark:from-rose-950/20 dark:to-amber-950/20 border border-rose-200/80 dark:border-rose-900/40">
                <div className="flex items-center justify-between mb-3">
                  <span className="px-3 py-1 rounded-full bg-rose-500 text-white font-black text-xs uppercase tracking-wider">
                    제1원리
                  </span>
                  <button
                    onClick={() =>
                      handleSpeech(
                        '제1원리. 하나님은 당신을 사랑하시며 당신을 위한 놀라운 계획을 가지고 계십니다.'
                      )
                    }
                    className="p-1.5 rounded-lg bg-white dark:bg-zinc-800 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 hover:bg-rose-100 transition-colors cursor-pointer"
                    title="낭독 들으려 하기"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
                <h3 className="text-base sm:text-lg font-extrabold font-sans text-zinc-900 dark:text-zinc-100 leading-snug">
                  하나님은 당신을 사랑하시며,<br />
                  당신을 위한 놀라운 계획을 가지고 계십니다.
                </h3>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-extrabold text-amber-800 dark:text-amber-400 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  <span>주요 성경 말씀</span>
                </h4>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-800 space-y-2">
                    <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-rose-600 dark:text-rose-400">
                      <span>하나님의 사랑</span>
                      <button
                        onClick={() => handleScriptureClick('요한복음', 3)}
                        className="hover:underline flex items-center gap-0.5 cursor-pointer"
                      >
                        요한복음 3:16 <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-sm sm:text-base text-zinc-800 dark:text-zinc-200 font-sans leading-relaxed">
                      "하나님이 세상을 이처럼 사랑하사 독생자를 주셨으니 이는 그를 믿는 자마다 멸망하지 않고 영생을 얻게 하려 하심이라"
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-800 space-y-2">
                    <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-amber-600 dark:text-amber-400">
                      <span>하나님의 계획</span>
                      <button
                        onClick={() => handleScriptureClick('요한복음', 10)}
                        className="hover:underline flex items-center gap-0.5 cursor-pointer"
                      >
                        요한복음 10:10 <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-sm sm:text-base text-zinc-800 dark:text-zinc-200 font-sans leading-relaxed">
                      "내가 온 것은 양으로 생명을 얻게 하고 더 풍성히 얻게 하려는 것이라"
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-amber-50 dark:bg-zinc-800/40 border border-amber-200 dark:border-zinc-700/60 text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed font-sans">
                <strong className="text-amber-900 dark:text-amber-300 block mb-1">
                  질문: 왜 대다수의 사람들은 이 풍성한 삶을 누리지 못하고 있습니까?
                </strong>
                그것은 사람이 제2원리에 빠져 있기 때문입니다.
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setActiveTab('law2')}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-zinc-950 font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                >
                  <span>제2원리 보기</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Law 2 */}
          {activeTab === 'law2' && (
            <div className="space-y-6 animate-fade-in">
              <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 border border-amber-300/80 dark:border-amber-900/40">
                <div className="flex items-center justify-between mb-3">
                  <span className="px-3 py-1 rounded-full bg-amber-600 text-white font-black text-xs uppercase tracking-wider">
                    제2원리
                  </span>
                  <button
                    onClick={() =>
                      handleSpeech(
                        '제2원리. 사람은 죄에 빠져 하나님으로부터 떠나 있습니다. 그러므로 하나님의 사랑과 계획을 알 수 없고 또 그것을 체험할 수 없습니다.'
                      )
                    }
                    className="p-1.5 rounded-lg bg-white dark:bg-zinc-800 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50 hover:bg-amber-100 transition-colors cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
                <h3 className="text-base sm:text-lg font-extrabold font-sans text-zinc-900 dark:text-zinc-100 leading-snug">
                  사람은 죄에 빠져 하나님으로부터 떠나 있습니다.<br />
                  그러므로 하나님의 사랑과 계획을 알 수 없고 또 체험할 수 없습니다.
                </h3>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-extrabold text-amber-800 dark:text-amber-400 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  <span>주요 성경 말씀</span>
                </h4>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-800 space-y-2">
                    <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-amber-700 dark:text-amber-400">
                      <span>사람의 죄</span>
                      <button
                        onClick={() => handleScriptureClick('로마서', 3)}
                        className="hover:underline flex items-center gap-0.5 cursor-pointer"
                      >
                        로마서 3:23 <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-sm sm:text-base text-zinc-800 dark:text-zinc-200 font-sans leading-relaxed">
                      "모든 사람이 죄를 범하였으매 하나님의 영광에 이르지 못하더니"
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-800 space-y-2">
                    <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-amber-700 dark:text-amber-400">
                      <span>하나님과의 분리</span>
                      <button
                        onClick={() => handleScriptureClick('로마서', 6)}
                        className="hover:underline flex items-center gap-0.5 cursor-pointer"
                      >
                        로마서 6:23 <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-sm sm:text-base text-zinc-800 dark:text-zinc-200 font-sans leading-relaxed">
                      "죄의 삯은 사망이요 하나님의 은사는 그리스도 예수 우리 주 안에 있는 영생이니라"
                    </p>
                  </div>
                </div>
              </div>

              {/* Separation Graphic Illustration */}
              <div className="p-5 rounded-2xl bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-300 dark:border-zinc-700 space-y-3">
                <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200 text-center uppercase tracking-wider">
                  거룩하신 하나님과 죄에 빠진 사람 사이의 큰 간격
                </div>
                <div className="flex items-center justify-between gap-2 max-w-lg mx-auto py-4">
                  <div className="flex-1 p-3 bg-blue-100 dark:bg-blue-950/50 text-blue-900 dark:text-blue-200 text-center font-bold text-xs rounded-xl border border-blue-300 dark:border-blue-800">
                    거룩하신<br />하나님
                  </div>
                  <div className="flex flex-col items-center justify-center text-[10px] text-rose-600 dark:text-rose-400 font-extrabold shrink-0 px-2">
                    <span className="text-lg">❌</span>
                    <span>영적 분리(사망)</span>
                  </div>
                  <div className="flex-1 p-3 bg-amber-100 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200 text-center font-bold text-xs rounded-xl border border-amber-300 dark:border-amber-800">
                    죄에 빠진<br />사람
                  </div>
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 text-center">
                  인간이 선행, 철학, 종교적 노력으로 하나님께 다다르려 하지만 그 간격을 메울 수 없습니다.
                </p>
              </div>

              <div className="flex justify-between pt-2">
                <button
                  onClick={() => setActiveTab('law1')}
                  className="px-4 py-2.5 rounded-xl bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-bold text-xs cursor-pointer"
                >
                  이전
                </button>
                <button
                  onClick={() => setActiveTab('law3')}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-zinc-950 font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                >
                  <span>제3원리 보기</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Law 3 */}
          {activeTab === 'law3' && (
            <div className="space-y-6 animate-fade-in">
              <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/20 border border-indigo-200/80 dark:border-indigo-900/40">
                <div className="flex items-center justify-between mb-3">
                  <span className="px-3 py-1 rounded-full bg-indigo-600 text-white font-black text-xs uppercase tracking-wider">
                    제3원리
                  </span>
                  <button
                    onClick={() =>
                      handleSpeech(
                        '제3원리. 예수 그리스도만이 사람의 죄를 해결할 수 있는 하나님의 유일한 길입니다. 당신은 그를 통하여 당신에 대한 하나님의 사랑과 계획을 알게 되며, 또 그것을 체험하게 됩니다.'
                      )
                    }
                    className="p-1.5 rounded-lg bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/50 hover:bg-indigo-100 transition-colors cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
                <h3 className="text-base sm:text-lg font-extrabold font-sans text-zinc-900 dark:text-zinc-100 leading-snug">
                  예수 그리스도만이 사람의 죄를 해결할 수 있는 하나님의 유일한 길입니다.<br />
                  그를 통해 하나님의 사랑과 계획을 알게 되고 체험하게 됩니다.
                </h3>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-extrabold text-amber-800 dark:text-amber-400 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  <span>주요 성경 말씀</span>
                </h4>

                <div className="grid sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-800 space-y-2">
                    <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-indigo-600 dark:text-indigo-400">
                      <span>대속의 죽음</span>
                      <button
                        onClick={() => handleScriptureClick('로마서', 5)}
                        className="hover:underline flex items-center gap-0.5 cursor-pointer text-xs"
                      >
                        로마서 5:8 <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 font-sans leading-relaxed">
                      "우리가 아직 죄인 되었을 때에 그리스도께서 우리를 위하여 죽으심으로 하나님께서 우리에 대한 자기의 사랑을 확증하셨느니라"
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-800 space-y-2">
                    <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-indigo-600 dark:text-indigo-400">
                      <span>부활하심</span>
                      <button
                        onClick={() => handleScriptureClick('고린도전서', 15)}
                        className="hover:underline flex items-center gap-0.5 cursor-pointer text-xs"
                      >
                        고린도전서 15:3-4 <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 font-sans leading-relaxed">
                      "그리스도께서 우리 죄를 위하여 죽으시고 장사 지낸 바 되셨다가 성경대로 사흘 만에 다시 살아나사"
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-800 space-y-2">
                    <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-indigo-600 dark:text-indigo-400">
                      <span>유일한 길</span>
                      <button
                        onClick={() => handleScriptureClick('요한복음', 14)}
                        className="hover:underline flex items-center gap-0.5 cursor-pointer text-xs"
                      >
                        요한복음 14:6 <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 font-sans leading-relaxed">
                      "내가 곧 길이요 진리요 생명이니 나로 말미암지 않고는 아버지께로 올 자가 없느니라"
                    </p>
                  </div>
                </div>
              </div>

              {/* Cross Bridge Illustration */}
              <div className="p-5 rounded-2xl bg-indigo-50/50 dark:bg-zinc-800/60 border border-indigo-200 dark:border-zinc-700 space-y-3">
                <div className="text-xs font-bold text-indigo-900 dark:text-indigo-300 text-center uppercase tracking-wider">
                  십자가의 다리 (예수 그리스도)
                </div>
                <div className="flex items-center justify-between gap-2 max-w-lg mx-auto py-2">
                  <div className="p-3 bg-blue-100 dark:bg-blue-950/50 text-blue-900 dark:text-blue-200 text-center font-bold text-xs rounded-xl">
                    하나님
                  </div>
                  <div className="flex-1 flex flex-col items-center justify-center bg-indigo-600 text-white p-2.5 rounded-xl text-center shadow-md">
                    <div className="flex flex-col items-center font-black text-sm sm:text-base leading-tight mb-1">
                      <span>✝ 예수</span>
                      <span>그리스도</span>
                    </div>
                    <span className="text-[10px] text-indigo-100 leading-tight">하나님과 사람 사이의 유일한 다리</span>
                  </div>
                  <div className="p-3 bg-amber-100 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200 text-center font-bold text-xs rounded-xl">
                    사람
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-2">
                <button
                  onClick={() => setActiveTab('law2')}
                  className="px-4 py-2.5 rounded-xl bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-bold text-xs cursor-pointer"
                >
                  이전
                </button>
                <button
                  onClick={() => setActiveTab('law4')}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-zinc-950 font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                >
                  <span>제4원리 보기</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Law 4 */}
          {activeTab === 'law4' && (
            <div className="space-y-6 animate-fade-in">
              <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/20 border border-emerald-200/80 dark:border-emerald-900/40">
                <div className="flex items-center justify-between mb-3">
                  <span className="px-3 py-1 rounded-full bg-emerald-600 text-white font-black text-xs uppercase tracking-wider">
                    제4원리
                  </span>
                  <button
                    onClick={() =>
                      handleSpeech(
                        '제4원리. 우리는 개인적으로 예수 그리스도를 나의 구주, 나의 하나님으로 영접해야 합니다. 그러면 우리는 우리 각 사람에 대한 하나님의 사랑과 계획을 알게 되며 또 그것을 체험하게 됩니다.'
                      )
                    }
                    className="p-1.5 rounded-lg bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50 hover:bg-emerald-100 transition-colors cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
                <h3 className="text-base sm:text-lg font-extrabold font-sans text-zinc-900 dark:text-zinc-100 leading-snug">
                  우리는 개인적으로 예수 그리스도를 나의 구주, 나의 하나님으로 영접해야 합니다.<br />
                  그러면 하나님의 사랑과 계획을 알게 되며 체험하게 됩니다.
                </h3>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-extrabold text-amber-800 dark:text-amber-400 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  <span>주요 성경 말씀</span>
                </h4>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-800 space-y-2">
                    <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      <span>영접하는 자의 권세</span>
                      <button
                        onClick={() => handleScriptureClick('요한복음', 1)}
                        className="hover:underline flex items-center gap-0.5 cursor-pointer"
                      >
                        요한복음 1:12 <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-sm sm:text-base text-zinc-800 dark:text-zinc-200 font-sans leading-relaxed">
                      "영접하는 자 곧 그 이름을 믿는 자들에게는 하나님의 자녀가 되는 권세를 주셨으니"
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-800 space-y-2">
                    <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      <span>마음의 문을 두드리심</span>
                      <button
                        onClick={() => handleScriptureClick('요한계시록', 3)}
                        className="hover:underline flex items-center gap-0.5 cursor-pointer"
                      >
                        요한계시록 3:20 <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-sm sm:text-base text-zinc-800 dark:text-zinc-200 font-sans leading-relaxed">
                      "볼지어다 내가 문 밖에 서서 두드리노니 누구든지 내 음성을 듣고 문을 열면 내가 그에게로 들어가 그와 더불어 먹고 그는 나와 더불어 먹으리라"
                    </p>
                  </div>
                </div>
              </div>

              {/* Two Hearts / Chairs Diagram */}
              <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 space-y-4">
                <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200 text-center uppercase tracking-wider">
                  두 가지 종류의 삶 (왕좌 비유)
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 space-y-2 text-center">
                    <div className="text-2xl">🪑</div>
                    <h5 className="font-extrabold text-xs text-rose-800 dark:text-rose-300">
                      1. 내가 주인이 된 삶 (자아 중심)
                    </h5>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                      왕좌에 내 자아가 앉아 있고, 그리스도는 삶 밖에 계심. 혼란과 마찰, 불안과 좌절.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 space-y-2 text-center">
                    <div className="text-2xl">👑</div>
                    <h5 className="font-extrabold text-xs text-emerald-800 dark:text-emerald-300">
                      2. 예수님이 주인이 되신 삶 (크리스천)
                    </h5>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                      예수 그리스도가 중심 왕좌에 앉으시고 내 자아가 복종함. 하나님과의 화평과 조화.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-2">
                <button
                  onClick={() => setActiveTab('law3')}
                  className="px-4 py-2.5 rounded-xl bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-bold text-xs cursor-pointer"
                >
                  이전
                </button>
                <button
                  onClick={() => setActiveTab('prayer')}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-zinc-950 font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>영접 기도문 보기</span>
                </button>
              </div>
            </div>
          )}

          {/* Prayer */}
          {activeTab === 'prayer' && (
            <div className="space-y-6 animate-fade-in">
              <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-100 via-amber-50 to-orange-100 dark:from-amber-950/40 dark:to-orange-950/30 border border-amber-300 dark:border-amber-800">
                <div className="flex items-center justify-between mb-3">
                  <span className="px-3 py-1 rounded-full bg-amber-600 text-white font-black text-xs uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    영접 기도문
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleSpeech(prayerText)}
                      className="p-1.5 rounded-lg bg-white dark:bg-zinc-800 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 transition-colors cursor-pointer"
                      title="기도문 낭독"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleCopyPrayer}
                      className="px-3 py-1.5 rounded-lg bg-amber-600 text-white font-bold text-xs flex items-center gap-1 cursor-pointer hover:bg-amber-700 transition-colors"
                    >
                      {copiedPrayer ? (
                        <>
                          <Check className="w-3.5 h-3.5" /> 복사됨
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" /> 기도문 복사
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="p-5 sm:p-8 rounded-2xl bg-white/90 dark:bg-zinc-900/90 border border-amber-200 dark:border-zinc-800 shadow-inner">
                  <p className="text-sm sm:text-base font-sans font-medium text-zinc-900 dark:text-zinc-100 leading-relaxed sm:leading-loose whitespace-pre-line text-center [word-break:keep-all]">
                    {prayerText}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-700 dark:text-zinc-300 space-y-2">
                <div className="font-extrabold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                  <Info className="w-4 h-4" />
                  <span>기도의 의미</span>
                </div>
                <p className="leading-relaxed">
                  기도는 하나님께 이야기하는 것입니다. 하나님은 우리의 말보다 마음의 중심을 아십니다. 진심으로 이 기도를 고백하셨다면, 약속대로 예수님께서 마음속에 들어오셨으며 당신은 하나님의 자녀가 되었습니다.
                </p>
              </div>

              <div className="flex justify-between pt-2">
                <button
                  onClick={() => setActiveTab('law4')}
                  className="px-4 py-2.5 rounded-xl bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-bold text-xs cursor-pointer"
                >
                  이전 (제4원리)
                </button>
                <button
                  onClick={() => setActiveTab('growth')}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-zinc-950 font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>신앙의 확신과 성장</span>
                </button>
              </div>
            </div>
          )}

          {/* Growth & Assurance */}
          {activeTab === 'growth' && (
            <div className="space-y-6 animate-fade-in">
              <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/20 border border-blue-200/80 dark:border-blue-900/40">
                <div className="flex items-center justify-between mb-2">
                  <span className="px-3 py-1 rounded-full bg-blue-600 text-white font-black text-xs uppercase tracking-wider">
                    구원의 확신과 성장
                  </span>
                </div>
                <h3 className="text-xl font-extrabold font-sans text-zinc-900 dark:text-zinc-100">
                  예수님을 영접한 당신에게 일어난 놀라운 변화
                </h3>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-800 space-y-2">
                  <h4 className="font-extrabold text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                    <Check className="w-4 h-4" />
                    <span>영생을 소유함 (요한일서 5:11-13)</span>
                  </h4>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-sans">
                    "하나님이 우리에게 영생을 주신 것과 이 생명이 그의 아들 안에 있는 그것이니라. 아들이 있는 자에게는 생명이 있고..."
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-800 space-y-2">
                  <h4 className="font-extrabold text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                    <Check className="w-4 h-4" />
                    <span>새로운 피조물이 됨 (고린도후서 5:17)</span>
                  </h4>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-sans">
                    "그런즉 누구든지 그리스도 안에 있으면 새로운 피조물이라 이전 것은 지나갔으니 보라 새 것이 되었도다"
                  </p>
                </div>
              </div>

              {/* Growth 5 Steps */}
              <div className="p-5 rounded-2xl bg-amber-50/60 dark:bg-zinc-800/50 border border-amber-200 dark:border-zinc-700 space-y-3">
                <h4 className="font-extrabold text-sm text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-amber-600" />
                  <span>크리스천 성장의 5가지 지침 (G.R.O.W.T.H)</span>
                </h4>

                <ul className="space-y-2 text-xs text-zinc-700 dark:text-zinc-300">
                  <li className="flex flex-col gap-1 p-3 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                    <span className="font-bold text-amber-600 sm:text-xs">1. 기도 (G - Go to God in prayer)</span>
                    <span className="text-zinc-700 dark:text-zinc-300">매일 기도함으로 하나님과 대화하십시오.</span>
                  </li>
                  <li className="flex flex-col gap-1 p-3 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                    <span className="font-bold text-amber-600 sm:text-xs">2. 말씀 (R - Read God's word)</span>
                    <span className="text-zinc-700 dark:text-zinc-300">매일 성경 말씀을 읽고 묵상하십시오.</span>
                  </li>
                  <li className="flex flex-col gap-1 p-3 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                    <span className="font-bold text-amber-600 sm:text-xs">3. 순종 (O - Obey God moment by moment)</span>
                    <span className="text-zinc-700 dark:text-zinc-300">순간순간 하나님의 말씀에 순종하십시오.</span>
                  </li>
                  <li className="flex flex-col gap-1 p-3 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                    <span className="font-bold text-amber-600 sm:text-xs">4. 증거 (W - Witness for Christ)</span>
                    <span className="text-zinc-700 dark:text-zinc-300">말과 삶으로 그리스도를 증거하십시오.</span>
                  </li>
                  <li className="flex flex-col gap-1 p-3 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                    <span className="font-bold text-amber-600 sm:text-xs">5. 교제 (T - Trust God for every detail & Fellowship)</span>
                    <span className="text-zinc-700 dark:text-zinc-300">교회와 공동체에서 그리스도인들과 깊이 교제하십시오.</span>
                  </li>
                </ul>
              </div>

              <div className="flex justify-between pt-2">
                <button
                  onClick={() => setActiveTab('prayer')}
                  className="px-4 py-2.5 rounded-xl bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-bold text-xs cursor-pointer"
                >
                  이전 (영접 기도)
                </button>
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-zinc-950 font-extrabold text-xs transition-all shadow-md cursor-pointer"
                >
                  확인 및 닫기
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
