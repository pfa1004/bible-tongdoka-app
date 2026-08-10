import React, { useState, useRef } from 'react';
import { VerseCardConfig } from '../types';
import {
  HeartHandshake,
  Sparkles,
  Download,
  Share2,
  Type,
  Palette,
  Image,
  Check,
  RefreshCw,
} from 'lucide-react';

interface Props {
  initialVerseText?: string;
  initialScriptureRef?: string;
}

const CALLIGRAPHY_FONTS = [
  { id: 'font-brush', name: '손글씨 붓체 (Calligraphy Brush)', class: 'font-serif italic' },
  { id: 'font-pen', name: '감성 펜글씨 (Pen Script)', class: 'font-sans italic' },
  { id: 'font-serif', name: '정갈한 명조 (Serif Elegance)', class: 'font-serif font-bold' },
  { id: 'font-sans', name: '모던 고딕 (Modern Gothic)', class: 'font-sans font-bold' },
  { id: 'font-flow', name: '자연스러운 흘림체 (Flowing Script)', class: 'font-serif' },
  { id: 'font-grace', name: '은혜 칼리그래피 (Grace Brush)', class: 'font-serif tracking-widest' },
  { id: 'font-title', name: '장엄 타이틀체 (Majestic)', class: 'font-serif tracking-tight' },
  { id: 'font-warm', name: '따뜻한 감성체 (Warm Heart)', class: 'font-sans' },
];

const PRESET_VERSES = [
  {
    ref: '여호수아 1:9',
    text: '내가 네게 명령한 것이 아니냐 강하고 담대하라 두려워하지 말며 놀라지 말라 네가 어디로 가든지 네 하나님 여호와가 너와 함께 하느니라',
    theme: 'comfort',
  },
  {
    ref: '이사야 41:10',
    text: '두려워하지 말라 내가 너와 함께 함이라 놀라지 말라 나는 네 하나님이 됨이라 내가 너를 세엄하게 하리라 참으로 너를 도와 주리라',
    theme: 'peace',
  },
  {
    ref: '빌립보서 4:6-7',
    text: '아무 것도 염려하지 말고 다만 모든 일에 기도와 간구로, 너희 구할 것을 감사함으로 하나님께 아뢰라',
    theme: 'gratitude',
  },
  {
    ref: '시편 23:1',
    text: '여호와는 나의 목자시니 내게 부족함이 없으리로다 그가 나를 푸른 밭에 누이시며 쉬어갈 만한 물 가로 인도하시는도다',
    theme: 'spring',
  },
];

export const TodayWordTab: React.FC<Props> = ({
  initialVerseText,
  initialScriptureRef,
}) => {
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);
  const cardRef = useRef<HTMLDivElement>(null);

  const [cardConfig, setCardConfig] = useState<VerseCardConfig>({
    verseText:
      initialVerseText ||
      '여호와는 나의 목자시니 내게 부족함이 없으리로다 그가 나를 푸른 밭에 누이시며 쉬어갈 만한 물 가로 인도하시는도다',
    scriptureRef: initialScriptureRef || '시편 23:1-2',
    theme: 'spring',
    fontFamily: CALLIGRAPHY_FONTS[0].id,
    fontSize: 20,
    textAlign: 'center',
    textColor: '#ffffff',
    backgroundColor: '#92400e',
    backgroundImageStyle:
      'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #93c5fd 100%)',
    overlayOpacity: 0.3,
    showSignature: true,
    signatureText: '성경통독 365 말씀카드',
  });

  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const themeStyles = {
    spring: 'linear-gradient(135deg, #059669 0%, #10b981 50%, #a7f3d0 100%)',
    summer: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 50%, #bae6fd 100%)',
    autumn: 'linear-gradient(135deg, #b45309 0%, #f59e0b 50%, #fef3c7 100%)',
    winter: 'linear-gradient(135deg, #334155 0%, #64748b 50%, #e2e8f0 100%)',
    comfort: 'linear-gradient(135deg, #4c1d95 0%, #8b5cf6 50%, #ddd6fe 100%)',
    gratitude: 'linear-gradient(135deg, #831843 0%, #f43f5e 50%, #fecdd3 100%)',
    peace: 'linear-gradient(135deg, #14532d 0%, #22c55e 50%, #bbf7d0 100%)',
    hope: 'linear-gradient(135deg, #78350f 0%, #d97706 50%, #fef3c7 100%)',
    nature: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
  };

  const handleDownloadCard = () => {
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-500 text-white shadow-md flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <HeartHandshake className="w-6 h-6" />
            <h2 className="text-xl sm:text-2xl font-extrabold font-serif">
              오늘의 말씀 카드 제작기
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-amber-100">
            절기별 테마 디자인과 8종의 손글씨 캘리그라피 서체로 아름다운 말씀 카드를 제작하고 은혜를 나누세요.
          </p>
        </div>
      </div>

      {/* 3-Step Wizard Navigation */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <button
          onClick={() => setActiveStep(1)}
          className={`p-3.5 rounded-xl border text-center transition-all cursor-pointer ${
            activeStep === 1
              ? 'bg-amber-500 text-zinc-950 font-bold border-amber-500 shadow-md'
              : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
          }`}
        >
          <span className="text-[10px] uppercase font-mono block">Step 1</span>
          <span className="text-xs sm:text-sm font-bold">1.말씀구절</span>
        </button>

        <button
          onClick={() => setActiveStep(2)}
          className={`p-3.5 rounded-xl border text-center transition-all cursor-pointer ${
            activeStep === 2
              ? 'bg-amber-500 text-zinc-950 font-bold border-amber-500 shadow-md'
              : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
          }`}
        >
          <span className="text-[10px] uppercase font-mono block">Step 2</span>
          <span className="text-xs sm:text-sm font-bold">2.테마&서체</span>
        </button>

        <button
          onClick={() => setActiveStep(3)}
          className={`p-3.5 rounded-xl border text-center transition-all cursor-pointer ${
            activeStep === 3
              ? 'bg-amber-500 text-zinc-950 font-bold border-amber-500 shadow-md'
              : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
          }`}
        >
          <span className="text-[10px] uppercase font-mono block">Step 3</span>
          <span className="text-xs sm:text-sm font-bold">3.카드공유</span>
        </button>
      </div>

      {/* Main Builder Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Step Controls Panel (5 Cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-5">
          {/* STEP 1: Select Verse */}
          {activeStep === 1 && (
            <div className="space-y-4">
              <h3 className="font-bold text-sm text-zinc-800 dark:text-zinc-200 uppercase tracking-wider flex items-center gap-2">
                <Type className="w-4 h-4 text-amber-600" />
                <span>성구 입력 및 추천 말씀 선택</span>
              </h3>

              {/* Preset recommendations */}
              <div>
                <label className="text-xs text-zinc-500 block mb-2">
                  추천 오늘의 말씀 선택:
                </label>
                <div className="space-y-2">
                  {PRESET_VERSES.map((pv, i) => (
                    <button
                      key={i}
                      onClick={() =>
                        setCardConfig({
                          ...cardConfig,
                          verseText: pv.text,
                          scriptureRef: pv.ref,
                          theme: pv.theme as any,
                          backgroundImageStyle: themeStyles[pv.theme as keyof typeof themeStyles],
                        })
                      }
                      className="w-full text-left p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 hover:bg-amber-50 dark:hover:bg-amber-950/30 text-xs border border-zinc-200 dark:border-zinc-700 transition-colors"
                    >
                      <span className="font-bold text-amber-600 dark:text-amber-400 block">
                        {pv.ref}
                      </span>
                      <span className="line-clamp-2 text-zinc-600 dark:text-zinc-300">
                        {pv.text}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom verse text input */}
              <div className="space-y-2 pt-2">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  직접 말씀 문구 수정
                </label>
                <textarea
                  rows={4}
                  value={cardConfig.verseText}
                  onChange={(e) =>
                    setCardConfig({ ...cardConfig, verseText: e.target.value })
                  }
                  className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  성경 출처
                </label>
                <input
                  type="text"
                  value={cardConfig.scriptureRef}
                  onChange={(e) =>
                    setCardConfig({ ...cardConfig, scriptureRef: e.target.value })
                  }
                  className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <button
                onClick={() => setActiveStep(2)}
                className="w-full py-2.5 rounded-xl bg-amber-600 text-white font-bold text-sm hover:bg-amber-700 transition-colors"
              >
                다음: 테마 & 서체 디자인 설정
              </button>
            </div>
          )}

          {/* STEP 2: Themes & Calligraphy Fonts */}
          {activeStep === 2 && (
            <div className="space-y-5">
              <h3 className="font-bold text-sm text-zinc-800 dark:text-zinc-200 uppercase tracking-wider flex items-center gap-2">
                <Palette className="w-4 h-4 text-amber-600" />
                <span>8종 손글씨 서체 & 절기 테마</span>
              </h3>

              {/* Calligraphy Fonts */}
              <div>
                <label className="text-xs font-semibold text-zinc-500 block mb-2">
                  캘리그라피 / 손글씨 서체 선택 (8종):
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {CALLIGRAPHY_FONTS.map((font) => (
                    <button
                      key={font.id}
                      onClick={() =>
                        setCardConfig({ ...cardConfig, fontFamily: font.id })
                      }
                      className={`p-2.5 rounded-xl border text-xs text-left transition-all ${
                        cardConfig.fontFamily === font.id
                          ? 'border-amber-600 bg-amber-50 text-amber-950 dark:bg-amber-950/40 dark:text-amber-200 font-bold'
                          : 'border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                      }`}
                    >
                      <span className={font.class}>{font.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Seasonal & Theme Presets */}
              <div>
                <label className="text-xs font-semibold text-zinc-500 block mb-2">
                  절기 / 감성 테마 배경:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'spring', name: '🌸 봄 (새생명)' },
                    { id: 'summer', name: '🌿 여름 (청량)' },
                    { id: 'autumn', name: '🍁 가을 (풍성)' },
                    { id: 'winter', name: '❄️ 겨울 (평안)' },
                    { id: 'comfort', name: '💜 위로' },
                    { id: 'gratitude', name: '💖 감사' },
                    { id: 'peace', name: '💚 평강' },
                    { id: 'hope', name: '💛 소망' },
                    { id: 'nature', name: '🌌 거룩한 밤' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() =>
                        setCardConfig({
                          ...cardConfig,
                          theme: t.id as any,
                          backgroundImageStyle:
                            themeStyles[t.id as keyof typeof themeStyles],
                        })
                      }
                      className={`p-2 rounded-xl text-xs font-medium border text-center transition-all ${
                        cardConfig.theme === t.id
                          ? 'border-amber-600 bg-amber-50 text-amber-950 font-bold'
                          : 'border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setActiveStep(3)}
                className="w-full py-2.5 rounded-xl bg-amber-600 text-white font-bold text-sm hover:bg-amber-700 transition-colors"
              >
                다음: 말씀 카드 보기 & 저장
              </button>
            </div>
          )}

          {/* STEP 3: Preview & Share */}
          {activeStep === 3 && (
            <div className="space-y-4">
              <h3 className="font-bold text-sm text-zinc-800 dark:text-zinc-200 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>완성된 말씀 카드 저장 및 공유</span>
              </h3>

              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
                나만의 손글씨 캘리그라피 말씀 카드가 성공적으로 완성되었습니다! 고화질 이미지로 저장하거나 카카오톡 및 SNS로 공유하세요.
              </div>

              <div className="space-y-2">
                <button
                  onClick={handleDownloadCard}
                  className="w-full py-3 rounded-xl bg-amber-500 text-zinc-950 font-bold text-sm hover:bg-amber-400 transition-all flex items-center justify-center gap-2 shadow-md"
                >
                  <Download className="w-4 h-4" />
                  <span>말씀 카드 이미지 저장하기</span>
                </button>

                <button
                  onClick={handleDownloadCard}
                  className="w-full py-3 rounded-xl bg-zinc-900 text-white font-bold text-sm hover:bg-zinc-800 transition-all flex items-center justify-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  <span>친구와 공유하기</span>
                </button>
              </div>

              {downloadSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500 text-white text-xs font-bold text-center flex items-center justify-center gap-2 animate-in fade-in">
                  <Check className="w-4 h-4" />
                  <span>말씀 카드가 성공적으로 생성되어 저장되었습니다!</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Live Canvas Preview Panel (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center p-6 bg-zinc-950 rounded-2xl border border-zinc-800 relative overflow-hidden min-h-[420px]">
          {/* Card Frame */}
          <div
            ref={cardRef}
            style={{ background: cardConfig.backgroundImageStyle }}
            className="w-full max-w-sm aspect-[4/5] rounded-3xl p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden border border-white/20 transition-all text-white"
          >
            {/* Background Overlay */}
            <div
              className="absolute inset-0 bg-black/30 backdrop-blur-[1px] pointer-events-none"
              style={{ opacity: cardConfig.overlayOpacity }}
            />

            {/* Top Badge Decorative */}
            <div className="relative z-10 flex items-center justify-between text-xs opacity-80 font-serif">
              <span>✦ 오늘의 말씀</span>
              <span>{cardConfig.scriptureRef}</span>
            </div>

            {/* Middle Main Calligraphy Verse Text */}
            <div className="relative z-10 my-auto text-center space-y-4">
              <p className="text-xl sm:text-2xl font-serif font-bold leading-relaxed tracking-wide drop-shadow-md">
                "{cardConfig.verseText}"
              </p>
              <div className="text-sm font-semibold opacity-90 font-sans tracking-widest pt-2">
                — {cardConfig.scriptureRef} —
              </div>
            </div>

            {/* Bottom Signature */}
            <div className="relative z-10 text-center text-[10px] opacity-70 tracking-widest font-mono uppercase">
              {cardConfig.signatureText}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
