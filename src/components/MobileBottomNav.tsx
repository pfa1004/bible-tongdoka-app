import React from 'react';
import { PlanSettings, AudioPlayerState } from '../types';
import { DesignPresetId } from './DesignStyleModal';
import {
  BookOpen,
  BookOpenCheck,
  Music,
  HeartHandshake,
  FileText,
  Settings,
  Volume2,
  Calendar,
  Compass,
  List,
  Search,
  Sparkles,
  Smartphone,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface Props {
  activeTab: 'bible' | 'hymn' | 'today' | 'memo' | 'links';
  onTabChange: (tab: 'bible' | 'hymn' | 'today' | 'memo' | 'links') => void;
  onOpenDesignStyleModal: () => void;
  onOpenReaderSettingsModal?: () => void;
  onOpenPlanModal: () => void;
  onOpenMapsModal: () => void;
  onOpenBibleBooksModal: (mode?: 'list' | 'overview') => void;
  onOpenBibleSearchModal: () => void;
  onOpenBdfImporterModal?: () => void;
  onOpenAndroidAppModal?: () => void;
  audioState: AudioPlayerState;
  onToggleAudioPlayer: () => void;
  onOpenHenryCommentary?: () => void;
  onPrev?: () => void;
  onNext?: () => void;
}

export const MobileBottomNav: React.FC<Props> = ({
  activeTab,
  onTabChange,
  onOpenDesignStyleModal,
  onOpenReaderSettingsModal,
  onOpenPlanModal,
  onOpenMapsModal,
  onOpenBibleBooksModal,
  onOpenBibleSearchModal,
  onOpenBdfImporterModal,
  onOpenAndroidAppModal,
  audioState,
  onToggleAudioPlayer,
  onOpenHenryCommentary,
  onPrev,
  onNext,
}) => {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-70 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 shadow-2xl transition-all pb-safe">
      {/* Secondary Quick Action Mini Bar for Mobile */}
      <div className="flex items-center justify-around px-3 py-1.5 border-b border-zinc-100 dark:border-zinc-800/60 bg-amber-500/5 dark:bg-zinc-950/40 text-[11px] font-bold">
        <button
          onClick={onOpenHenryCommentary}
          className="flex items-center gap-1 text-zinc-700 dark:text-zinc-300 hover:text-amber-600 active:scale-95 transition-transform font-bold shrink-0 cursor-pointer"
        >
          <BookOpenCheck className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span className="whitespace-nowrap">매튜헨리</span>
        </button>

        <span className="text-zinc-300 dark:text-zinc-700 shrink-0">•</span>

        <button
          onClick={onToggleAudioPlayer}
          className={`flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[11px] transition-all shrink-0 cursor-pointer ${
            audioState.isPlaying
              ? 'bg-amber-500 text-zinc-950 shadow-xs'
              : 'text-amber-600 dark:text-amber-400 bg-amber-500/10'
          }`}
        >
          <Volume2 className="w-3.5 h-3.5 shrink-0" />
          <span className="whitespace-nowrap">{audioState.isPlaying ? '재생 중' : '오디오'}</span>
        </button>

        <span className="text-zinc-300 dark:text-zinc-700 shrink-0">•</span>

        <button
          onClick={() => onTabChange('memo')}
          className="flex items-center gap-1 text-zinc-700 dark:text-zinc-300 hover:text-amber-600 active:scale-95 transition-transform font-bold shrink-0 cursor-pointer"
        >
          <FileText className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span className="whitespace-nowrap">메모</span>
        </button>

        <span className="text-zinc-300 dark:text-zinc-700 shrink-0">•</span>

        <button
          onClick={onOpenReaderSettingsModal || onOpenDesignStyleModal}
          className="flex items-center gap-1 text-zinc-700 dark:text-zinc-300 hover:text-amber-600 active:scale-95 transition-transform font-bold shrink-0 cursor-pointer"
        >
          <Settings className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span className="whitespace-nowrap">설정</span>
        </button>
      </div>

      {/* Primary Bottom Bar: 4 Core Navigation Tabs */}
      <nav className="flex items-center h-14 px-2 bg-white/95 dark:bg-zinc-900/95">
        <div className="grid grid-cols-4 w-full h-full">
          <button
            onClick={() => {
              onTabChange('bible');
              onOpenBibleBooksModal('list');
            }}
            className={`flex flex-col items-center justify-center gap-0.5 relative transition-all active:scale-95 cursor-pointer ${
              activeTab === 'bible'
                ? 'text-amber-600 dark:text-amber-400 font-extrabold'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
            title="성경 목록 및 빠른 장 선택"
          >
            {activeTab === 'bible' && (
              <span className="absolute top-0 w-8 h-0.5 bg-amber-500 rounded-full" />
            )}
            <BookOpen className={`w-5 h-5 ${activeTab === 'bible' ? 'stroke-[2.5]' : 'stroke-2'}`} />
            <span className="text-[10px]">성경</span>
          </button>

          <button
            onClick={() => onTabChange('hymn')}
            className={`flex flex-col items-center justify-center gap-0.5 relative transition-all active:scale-95 cursor-pointer ${
              activeTab === 'hymn'
                ? 'text-amber-600 dark:text-amber-400 font-extrabold'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            {activeTab === 'hymn' && (
              <span className="absolute top-0 w-8 h-0.5 bg-amber-500 rounded-full" />
            )}
            <Music className={`w-5 h-5 ${activeTab === 'hymn' ? 'stroke-[2.5]' : 'stroke-2'}`} />
            <span className="text-[10px]">찬송가</span>
          </button>

          <button
            onClick={() => onTabChange('today')}
            className={`flex flex-col items-center justify-center gap-0.5 relative transition-all active:scale-95 cursor-pointer ${
              activeTab === 'today'
                ? 'text-amber-600 dark:text-amber-400 font-extrabold'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            {activeTab === 'today' && (
              <span className="absolute top-0 w-8 h-0.5 bg-amber-500 rounded-full" />
            )}
            <HeartHandshake className={`w-5 h-5 ${activeTab === 'today' ? 'stroke-[2.5]' : 'stroke-2'}`} />
            <span className="text-[10px]">말씀카드</span>
          </button>

          <button
            onClick={() => onTabChange('memo')}
            className={`flex flex-col items-center justify-center gap-0.5 relative transition-all active:scale-95 cursor-pointer ${
              activeTab === 'memo'
                ? 'text-amber-600 dark:text-amber-400 font-extrabold'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            {activeTab === 'memo' && (
              <span className="absolute top-0 w-8 h-0.5 bg-amber-500 rounded-full" />
            )}
            <FileText className={`w-5 h-5 ${activeTab === 'memo' ? 'stroke-[2.5]' : 'stroke-2'}`} />
            <span className="text-[10px]">메모/기도</span>
          </button>
        </div>
      </nav>
    </div>
  );
};
