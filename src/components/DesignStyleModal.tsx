import React from 'react';
import { ReaderSettings } from '../types';
import { Palette, Check, Sparkles, BookOpen, Layers, Eye, Feather, ShieldCheck, X } from 'lucide-react';

export type DesignPresetId = 'classic' | 'modern' | 'eink';

export interface DesignPresetOption {
  id: DesignPresetId;
  name: string;
  badge: string;
  subtitle: string;
  description: string;
  readerConfig: Partial<ReaderSettings>;
  bgClass: string;
  borderClass: string;
  accentClass: string;
  textColor: string;
  cardStyle: string;
  previewText: string;
  features: string[];
}

export const DESIGN_PRESETS: DesignPresetOption[] = [
  {
    id: 'classic',
    name: '양식 1. 클래식 성지 양장본 (Classic Sacred Parchment)',
    badge: '전통 양장 성경 스타일',
    subtitle: '거룩하고 장엄한 전통 가죽 커버 & 파피루스 세피아 양지',
    description:
      '전통 양장본 성경의 그윽한 감성을 담았습니다. 따뜻한 세피아 톤 캔버스, 정갈한 명조 서체, 골드 버건디 포인트로 거룩한 성경독서 분위기를 선호하는 성도님께 추천합니다.',
    readerConfig: {
      theme: 'sepia',
      fontFamily: 'serif',
      lineHeight: 'normal',
      letterSpacing: 'normal',
    },
    bgClass: 'bg-[#faf3e0]',
    borderClass: 'border-[#e2d3b2]',
    accentClass: 'bg-amber-700 text-white',
    textColor: 'text-[#4a3b32]',
    cardStyle: 'border-2 border-amber-800/20 shadow-md font-serif',
    previewText: '태초에 하나님이 천지를 창조하시니라 (창세기 1:1)',
    features: ['세피아 앤틱 양지 캔버스', '고전 정갈 명조 서체 (Serif)', '양장본 금박 장식 헤더'],
  },
  {
    id: 'modern',
    name: '양식 2. 모던 갤러리 미니멀 (Modern Gallery Minimal)',
    badge: '산뜻한 스포트라이트 스타일',
    subtitle: '슬림한 라인과 세련된 인디고 코발트 대조 뷰어',
    description:
      '현대적이고 감각적인 UI 레이아웃입니다. 여유로운 문단 간격, 깔끔한 산세리프 글꼴, 미드나잇 인디고 포인트로 직관적이고 시원한 가독성을 제공합니다.',
    readerConfig: {
      theme: 'light',
      fontFamily: 'sans',
      lineHeight: 'relaxed',
      letterSpacing: 'tight',
    },
    bgClass: 'bg-slate-50',
    borderClass: 'border-indigo-200',
    accentClass: 'bg-indigo-600 text-white',
    textColor: 'text-slate-900',
    cardStyle: 'border border-indigo-100 shadow-lg font-sans',
    previewText: 'In the beginning God created the heavens and the earth.',
    features: ['크리스탈 클린 캔버스', '모던 산세리프 서체 (Sans-Serif)', '유선형 플루이드 대조 인터페이스'],
  },
  {
    id: 'eink',
    name: '양식 3. 심독 이링크 저반사 (Deep Focus E-Ink Lounge)',
    badge: '눈 피로 제로 집중독서 스타일',
    subtitle: '종이책 전자향 텍스처와 루미너스 세이지 라운지',
    description:
      '눈의 피로를 최소화하는 E-Ink 종이책 디스플레이 스타일입니다. 저반사 페이퍼 펠트 질감, 넉넉한 줄간격, 절 단위 여백 강화로 장시간 통독에 최적화되어 있습니다.',
    readerConfig: {
      theme: 'eink',
      fontFamily: 'serif',
      lineHeight: 'loose',
      letterSpacing: 'wide',
    },
    bgClass: 'bg-[#f4f4f2]',
    borderClass: 'border-zinc-400',
    accentClass: 'bg-zinc-900 text-white',
    textColor: 'text-zinc-900',
    cardStyle: 'border-2 border-zinc-900 shadow-none font-serif',
    previewText: '하나님이 세상을 이처럼 사랑하사 독생자를 주셨으니 (요한복음 3:16)',
    features: ['저반사 페이퍼 펠트 캔버스', '여유로운 줄간격 & 자간 (Loose)', '시각 자극을 줄인 피로 제로 레이아웃'],
  },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  activePreset: DesignPresetId;
  onSelectPreset: (presetId: DesignPresetId) => void;
}

export const DesignStyleModal: React.FC<Props> = ({
  isOpen,
  onClose,
  activePreset,
  onSelectPreset,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-3xl rounded-3xl bg-white dark:bg-zinc-900 shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden text-zinc-900 dark:text-zinc-100 flex flex-col max-h-[90vh]">
        {/* Modal Top Header */}
        <div className="p-6 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-white flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-5 h-5 text-amber-200" />
              <h2 className="text-xl font-extrabold font-serif">
                디자인 테마 & 레이아웃 스타일 3가지 선택
              </h2>
            </div>
            <p className="text-xs text-amber-100">
              원하시는 분위기의 디자인 양식을 클릭하여 앱 전체와 성경 읽기 화면에 적용해 보세요.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-black/20 hover:bg-black/40 transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3 Preset Options Grid */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {DESIGN_PRESETS.map((preset) => {
            const isSelected = activePreset === preset.id;
            return (
              <div
                key={preset.id}
                onClick={() => onSelectPreset(preset.id)}
                className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                  isSelected
                    ? 'border-amber-500 bg-amber-500/5 ring-2 ring-amber-500/30 shadow-md'
                    : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-amber-400/60'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-extrabold text-zinc-900 dark:text-zinc-100">
                        {preset.name}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        {preset.badge}
                      </span>
                    </div>
                    <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                      {preset.subtitle}
                    </p>
                  </div>

                  {/* Radio / Selection State Button */}
                  <div className="shrink-0">
                    {isSelected ? (
                      <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 text-zinc-950 font-extrabold text-xs shadow-sm">
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>현재 적용 중</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-bold text-xs hover:bg-amber-100 dark:hover:bg-amber-950/40 hover:text-amber-700 transition-colors">
                        <span>이 스타일 선택하기</span>
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
                  {preset.description}
                </p>

                {/* Live Interactive Canvas Preview Card */}
                <div
                  className={`p-4 rounded-xl ${preset.bgClass} ${preset.borderClass} ${preset.textColor} ${preset.cardStyle} space-y-2`}
                >
                  <div className="flex items-center justify-between text-[11px] opacity-80 font-mono border-b border-current/15 pb-1.5">
                    <span className="font-bold">📖 성경 본문 라이브 미리보기</span>
                    <span>{preset.readerConfig.fontFamily?.toUpperCase()} • {preset.readerConfig.theme?.toUpperCase()}</span>
                  </div>
                  <p className="text-sm font-medium leading-relaxed">
                    "{preset.previewText}"
                  </p>
                </div>

                {/* Feature Pills List */}
                <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                  {preset.features.map((feat, fIdx) => (
                    <span
                      key={fIdx}
                      className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-[11px] font-medium flex items-center gap-1"
                    >
                      <Check className="w-3 h-3 text-amber-500" />
                      <span>{feat}</span>
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Bottom Footer */}
        <div className="p-4 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
          <span className="text-xs text-zinc-500">
            💡 적용 후에도 상단 '디자인 양식' 버튼으로 언제든지 자유롭게 변경할 수 있습니다.
          </span>
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-amber-600 text-white font-bold text-sm hover:bg-amber-700 transition-colors shadow-sm"
          >
            확인 및 닫기
          </button>
        </div>
      </div>
    </div>
  );
};
