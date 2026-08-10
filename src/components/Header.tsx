import React, { useState, useEffect } from 'react';
import { PlanSettings, ReaderSettings, AudioPlayerState } from '../types';
import { DesignPresetId } from './DesignStyleModal';
import {
  BookOpen,
  Music,
  HeartHandshake,
  FileText,
  Link,
  Flame,
  Calendar,
  Compass,
  Settings,
  Sparkles,
  Search,
  List,
  BookOpenCheck,
  Smartphone,
  Bell,
  Maximize,
  Minimize,
  ExternalLink,
} from 'lucide-react';

interface Props {
  activeTab: 'bible' | 'hymn' | 'today' | 'memo' | 'links';
  onTabChange: (tab: 'bible' | 'hymn' | 'today' | 'memo' | 'links') => void;
  planSettings: PlanSettings;
  onOpenPlanModal: () => void;
  onOpenMapsModal: () => void;
  onOpenFourLawsModal?: () => void;
  onOpenReaderSettingsModal: () => void;
  onOpenDesignStyleModal: () => void;
  onOpenBibleBooksModal: (mode?: 'list' | 'overview') => void;
  onOpenBibleSearchModal: () => void;
  onOpenBdfImporterModal?: () => void;
  onOpenAndroidAppModal?: () => void;
  onOpenDailyNotificationModal?: () => void;
  activeDesignPreset: DesignPresetId;
  audioState: AudioPlayerState;
  onToggleAudioPlayer: () => void;
}

export const Header: React.FC<Props> = ({
  activeTab,
  onTabChange,
  planSettings,
  onOpenPlanModal,
  onOpenMapsModal,
  onOpenFourLawsModal,
  onOpenReaderSettingsModal,
  onOpenDesignStyleModal,
  onOpenBibleBooksModal,
  onOpenBibleSearchModal,
  onOpenBdfImporterModal,
  onOpenAndroidAppModal,
  onOpenDailyNotificationModal,
  activeDesignPreset,
  audioState,
  onToggleAudioPlayer,
}) => {
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {
          // Fallback: If in an iframe that blocks fullscreen, offer to open in a standalone tab
          if (window.self !== window.top) {
            window.open(window.location.href, '_blank');
          }
        });
      } else if ((document.documentElement as any).webkitRequestFullscreen) {
        (document.documentElement as any).webkitRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      }
    }
  };
  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 transition-colors">
      <div className="max-w-7xl mx-auto px-1.5 sm:px-6">
        {/* Top Branding & Quick Actions Bar */}
        <div className="flex items-center justify-between h-14 sm:h-16 gap-1 sm:gap-4">
          {/* Logo, Title & Left Quick Icons */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <button
              onClick={() => onTabChange('bible')}
              className="flex items-center gap-1.5 sm:gap-2 text-left group cursor-pointer focus:outline-hidden"
              title="메인 화면(성경 읽기)으로 이동"
            >
              <img
                src="/icon-192.png"
                alt="성경통독"
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl object-cover shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform shrink-0 border border-emerald-500/30"
              />
              <div>
                <div className="flex items-center gap-1 sm:gap-2">
                  <h1 className="font-extrabold text-base sm:text-xl tracking-tight text-zinc-900 dark:text-zinc-100 font-serif group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors whitespace-nowrap">
                    성경통독
                  </h1>
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 hidden sm:block">
                  창세기부터 요한계시록까지 안드로이드 모바일 특화 성경연구
                </p>
              </div>
            </button>

            {/* Left Quick Action Buttons (Notification, Mobile App & Fullscreen) */}
            <div className="flex items-center gap-1 ml-0.5 sm:ml-2">
              {onOpenDailyNotificationModal && (
                <button
                  onClick={onOpenDailyNotificationModal}
                  className="flex items-center justify-center p-1.5 sm:p-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-zinc-950 font-extrabold border border-amber-400 transition-all text-xs shadow-xs shrink-0 cursor-pointer"
                  title="하루 한 구절 암송 알림 설정 (FCM 연동)"
                >
                  <Bell className="w-4 h-4 fill-zinc-950 shrink-0" />
                </button>
              )}

              {onOpenAndroidAppModal && (
                <button
                  onClick={onOpenAndroidAppModal}
                  className="flex items-center justify-center p-1.5 sm:p-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all border border-emerald-400/30 shrink-0 cursor-pointer"
                  title="안드로이드 모바일 앱 설치 및 안드로이드 설정"
                >
                  <Smartphone className="w-4 h-4 text-emerald-100 shrink-0" />
                </button>
              )}

              {/* Fullscreen Toggle Button */}
              <button
                onClick={toggleFullscreen}
                className="flex items-center justify-center p-1.5 sm:p-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all border border-blue-400/30 shrink-0 cursor-pointer"
                title={isFullscreen ? '전체화면 해제 (주소창 표시)' : '전체화면으로 보기 (상단 주소창 숨기기)'}
              >
                {isFullscreen ? (
                  <Minimize className="w-4 h-4 text-blue-100 shrink-0" />
                ) : (
                  <Maximize className="w-4 h-4 text-blue-100 shrink-0" />
                )}
              </button>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* 66 Books Overview Button */}
            <button
              onClick={() => onOpenBibleBooksModal('overview')}
              className="flex items-center gap-1 px-2 py-1.5 sm:px-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 transition-colors text-xs font-extrabold border border-amber-500/30 shrink-0 cursor-pointer shadow-2xs"
              title="성경 66권 전체 개요 및 요약 보기"
            >
              <BookOpenCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600 shrink-0" />
              <span className="whitespace-nowrap">성경개요</span>
            </button>

            {/* Scripture Search Button */}
            <button
              onClick={onOpenBibleSearchModal}
              className="flex items-center gap-1 px-2 py-1.5 sm:px-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 transition-all text-xs font-extrabold shrink-0"
              title="성경 구절 및 키워드 검색"
            >
              <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600 shrink-0" />
              <span className="whitespace-nowrap">말씀찾기</span>
            </button>

            {/* Streak Flame Badge */}
            <button
              onClick={onOpenPlanModal}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/20 transition-all text-xs font-bold"
              title="연속 읽기 스트릭 관리"
            >
              <Flame className="w-4 h-4 text-amber-500 animate-pulse fill-current" />
              <span>{planSettings.streakCount}일</span>
            </button>

            {/* Plan Progress Button */}
            <button
              onClick={onOpenPlanModal}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors text-xs font-medium"
            >
              <Calendar className="w-4 h-4 text-amber-600" />
              <span>통독 플랜</span>
            </button>

            {/* Historical Maps Button */}
            <button
              onClick={() => window.open('https://bible.bskorea.or.kr/resources/study/nkt_maps', '_blank')}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors text-xs font-bold cursor-pointer"
              title="대한성서공회 성경 역사지도 사이트 바로가기 (새 창)"
            >
              <Compass className="w-4 h-4 text-amber-600 shrink-0" />
              <span>역사 지도</span>
              <ExternalLink className="w-3 h-3 text-zinc-400 shrink-0" />
            </button>

            {/* Four Spiritual Laws (사영리) Button */}
            <button
              onClick={onOpenFourLawsModal}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30 transition-all text-xs font-bold shrink-0"
              title="사영리 (복음전도 4가지 영적 원리)"
            >
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>사영리</span>
            </button>

            {/* Study Links (참고링크) Button */}
            <button
              onClick={() => onTabChange('links')}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all text-xs font-bold shrink-0 cursor-pointer ${
                activeTab === 'links'
                  ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow-xs'
                  : 'bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700'
              }`}
              title="성경연구 참고링크"
            >
              <Link className="w-4 h-4 text-amber-600" />
              <span>참고링크</span>
            </button>

            {/* Memo & Prayer Note Button */}
            <button
              onClick={() => onTabChange('memo')}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors text-xs font-medium"
              title="메모 및 기도노트"
            >
              <FileText className="w-4 h-4 text-amber-600" />
              <span>메모</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Sub-bar: Reading Plan, Historical Maps & Four Laws */}
      <div className="sm:hidden flex items-center justify-center gap-1.5 py-1.5 px-2 bg-amber-500/5 dark:bg-zinc-950/40 border-t border-zinc-100 dark:border-zinc-800/60 text-xs font-bold overflow-x-auto no-scrollbar">
        <button
          onClick={onOpenPlanModal}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/20 transition-all active:scale-95 cursor-pointer shrink-0"
        >
          <Calendar className="w-3.5 h-3.5 text-amber-600" />
          <span>통독플랜</span>
        </button>
        <button
          onClick={() => window.open('https://bible.bskorea.or.kr/resources/study/nkt_maps', '_blank')}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 transition-all active:scale-95 cursor-pointer shrink-0"
          title="대한성서공회 성경 역사지도 사이트 바로가기 (새 창)"
        >
          <Compass className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>역사지도</span>
          <ExternalLink className="w-3 h-3 text-zinc-400 shrink-0" />
        </button>
        <button
          onClick={onOpenFourLawsModal}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500 text-zinc-950 hover:bg-amber-600 border border-amber-400 transition-all active:scale-95 cursor-pointer shrink-0 shadow-xs"
        >
          <Sparkles className="w-3.5 h-3.5 fill-current" />
          <span>사영리</span>
        </button>
        <button
          onClick={() => onTabChange('links')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border transition-all active:scale-95 cursor-pointer shrink-0 ${
            activeTab === 'links'
              ? 'bg-amber-500 text-zinc-950 font-extrabold border-amber-400 shadow-xs'
              : 'bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 font-bold'
          }`}
        >
          <Link className="w-3.5 h-3.5 text-amber-600" />
          <span>참고링크</span>
        </button>
      </div>
    </header>
  );
};
