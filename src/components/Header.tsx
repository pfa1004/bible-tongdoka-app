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
  Home,
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
  const [isSubBarHidden, setIsSubBarHidden] = useState<boolean>(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Scroll direction detection: hide sub-bar on scroll down, show on scroll up
  // Triple detection: document capture scroll + window scroll + touch events
  const headerRef = React.useRef<HTMLElement>(null);

  useEffect(() => {
    let lastScrollTop = 0;
    let touchStartY = 0;

    // Universal scroll handler - works for any scrolling element (capture phase catches all)
    const handleAnyScroll = (e: Event) => {
      const target = e.target as HTMLElement | Document;
      let currentScrollTop: number;

      if (target === document || target === document.documentElement) {
        currentScrollTop = window.scrollY || document.documentElement.scrollTop;
      } else if (target instanceof HTMLElement) {
        currentScrollTop = target.scrollTop;
      } else {
        return;
      }

      const delta = currentScrollTop - lastScrollTop;

      if (Math.abs(delta) < 5) return; // ignore tiny micro-scrolls

      if (delta > 0) {
        setIsSubBarHidden(true); // scrolling down → hide
      } else {
        setIsSubBarHidden(false); // scrolling up → show
      }

      if (currentScrollTop <= 5) {
        setIsSubBarHidden(false);
      }

      lastScrollTop = currentScrollTop;
    };

    // Mobile: touch-based scroll direction detection
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      const touchCurrentY = e.touches[0].clientY;
      const deltaY = touchStartY - touchCurrentY;

      if (deltaY > 25) {
        setIsSubBarHidden(true); // finger moving up = scrolling down → hide
        touchStartY = touchCurrentY;
      } else if (deltaY < -25) {
        setIsSubBarHidden(false); // finger moving down = scrolling up → show
        touchStartY = touchCurrentY;
      }
    };

    // Capture phase: catches scroll events from ANY element before they bubble
    document.addEventListener('scroll', handleAnyScroll, { capture: true, passive: true });
    window.addEventListener('scroll', handleAnyScroll, { passive: true });
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    return () => {
      document.removeEventListener('scroll', handleAnyScroll, { capture: true } as EventListenerOptions);
      window.removeEventListener('scroll', handleAnyScroll);
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
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
    <header ref={headerRef} className="sticky top-0 z-90 bg-[#0f172a]/95 text-slate-100 backdrop-blur-md border-b border-slate-800 transition-colors shadow-md">
      <div className="max-w-7xl mx-auto px-1.5 sm:px-6">
        {/* Top Branding & Quick Actions Bar */}
        <div className="flex items-center justify-between h-14 sm:h-16 gap-1 sm:gap-4">
          {/* Logo, Title & Left Quick Icons */}
          <div className="flex items-center gap-1 sm:gap-2 shrink min-w-0">
            {/* Home Icon + '성경통독' Title (Click to return to Bible Reading screen) */}
            <button
              onClick={() => onTabChange('bible')}
              className="flex items-center gap-1.5 group cursor-pointer focus:outline-hidden min-w-0 shrink"
              title="메인 화면(성경 읽기)으로 이동"
            >
              <div className="flex items-center justify-center p-1 sm:p-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-extrabold shadow-xs shrink-0 transition-transform group-hover:scale-105 border border-amber-400">
                <Home className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-zinc-950 stroke-zinc-950 shrink-0" />
              </div>
              <div className="min-w-0 shrink">
                <div className="flex items-center">
                  <h1 className="font-extrabold text-sm sm:text-xl tracking-tight text-slate-100 font-serif group-hover:text-amber-400 transition-colors whitespace-nowrap overflow-hidden text-ellipsis">
                    성경통독
                  </h1>
                </div>
              </div>
            </button>

            {/* Left Quick Action Buttons (Notification, Mobile App & Fullscreen) */}
            <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
              {onOpenDailyNotificationModal && (
                <button
                  onClick={onOpenDailyNotificationModal}
                  className="flex items-center justify-center p-1 sm:p-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-zinc-950 font-extrabold border border-amber-400 transition-all text-xs shadow-xs shrink-0 cursor-pointer"
                  title="하루 한 구절 암송 알림 설정 (FCM 연동)"
                >
                  <Bell className="w-3.5 h-3.5 fill-zinc-950 shrink-0" />
                </button>
              )}

              {onOpenAndroidAppModal && (
                <button
                  onClick={onOpenAndroidAppModal}
                  className="flex items-center justify-center p-1 sm:p-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all border border-emerald-400/30 shrink-0 cursor-pointer"
                  title="안드로이드 모바일 앱 설치 및 안드로이드 설정"
                >
                  <Smartphone className="w-3.5 h-3.5 text-emerald-100 shrink-0" />
                </button>
              )}

              {/* Fullscreen Toggle Button */}
              <button
                onClick={toggleFullscreen}
                className="flex items-center gap-1 px-1.5 py-1 sm:px-2 sm:py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all border border-blue-400/30 shrink-0 cursor-pointer text-[11px] sm:text-xs font-extrabold"
                title={isFullscreen ? '전체화면 해제 (주소창 표시)' : '전체화면으로 보기 (상단 주소창 숨기기)'}
              >
                {isFullscreen ? (
                  <Minimize className="w-3.5 h-3.5 text-blue-100 shrink-0" />
                ) : (
                  <Maximize className="w-3.5 h-3.5 text-blue-100 shrink-0" />
                )}
                <span className="whitespace-nowrap">전체화면</span>
              </button>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">

            {/* Plan Progress Button */}
            <button
              onClick={onOpenPlanModal}
              className="flex items-center gap-0.5 px-1.5 py-1 sm:px-2.5 sm:py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all border border-blue-400/30 text-[11px] sm:text-xs font-extrabold shrink-0 cursor-pointer"
              title="365일 통독 플랜 및 진도율 확인"
            >
              <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-blue-100 shrink-0" />
              <span className="whitespace-nowrap">통독플랜</span>
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

            {/* Settings Button */}
            <button
              onClick={onOpenReaderSettingsModal}
              className="flex items-center gap-0.5 px-1.5 py-1 sm:px-2.5 sm:py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all border border-blue-400/30 text-[11px] sm:text-xs font-extrabold shrink-0 cursor-pointer"
              title="앱 설정 및 보기 스타일 변경"
            >
              <Settings className="w-3 h-3 sm:w-4 sm:h-4 text-blue-100 shrink-0" />
              <span className="whitespace-nowrap">설정</span>
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
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all text-xs font-bold shrink-0 cursor-pointer ${activeTab === 'links'
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

    </header>
  );
};
