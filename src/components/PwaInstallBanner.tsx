import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Share, PlusSquare, Sparkles, CheckCircle2 } from 'lucide-react';

export const PwaInstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // 1. Check if already running in standalone mode (PWA installed)
    const isStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (isStandaloneMode) {
      setIsStandalone(true);
      return;
    }

    // 2. Check if user dismissed the banner today
    try {
      const dismissedDate = localStorage.getItem('pwa_banner_dismissed_date');
      const today = new Date().toISOString().split('T')[0];
      if (dismissedDate === today) {
        return;
      }
    } catch (e) {}

    // 3. Detect iOS device
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);

    if (isIosDevice) {
      // Show banner after short delay on iOS Safari
      const timer = setTimeout(() => setShowBanner(true), 1500);
      return () => clearTimeout(timer);
    }

    // 4. Android / Desktop Chrome beforeinstallprompt event
    if ((window as any).deferredPwaPrompt) {
      setDeferredPrompt((window as any).deferredPwaPrompt);
      setShowBanner(true);
    }

    const handlePromptReady = (e: CustomEvent) => {
      setDeferredPrompt(e.detail);
      setShowBanner(true);
    };

    window.addEventListener('pwaPromptReady' as any, handlePromptReady as EventListener);

    return () => {
      window.removeEventListener('pwaPromptReady' as any, handlePromptReady as EventListener);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIos) {
      setShowIosGuide(true);
      return;
    }

    if (!deferredPrompt) {
      alert('브라우저 메뉴(⋮)에서 "홈 화면에 추가" 또는 "앱 설치"를 누르시면 됩니다.');
      return;
    }

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    } catch (err) {
      console.error('Install prompt error:', err);
    }
  };

  const handleDismissToday = () => {
    setShowBanner(false);
    try {
      const today = new Date().toISOString().split('T')[0];
      localStorage.setItem('pwa_banner_dismissed_date', today);
    } catch (e) {}
  };

  if (isStandalone || !showBanner) return null;

  return (
    <>
      {/* Top Floating PWA Install Notification Banner */}
      <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-white py-2.5 px-4 shadow-lg flex items-center justify-between gap-3 text-xs sm:text-sm z-50 animate-in slide-in-from-top duration-300">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 border border-white/30">
            <Smartphone className="w-4 h-4 text-amber-100 animate-bounce" />
          </div>
          <div className="min-w-0">
            <div className="font-extrabold text-white flex items-center gap-1.5 truncate">
              <span>바탕화면에 앱 설치하고 바로 읽기</span>
              <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full bg-black/20 text-[10px] font-mono border border-white/20">
                1초 설치
              </span>
            </div>
            <p className="text-[11px] text-amber-100 truncate">
              인터넷 없이도 빠르게 1년 완독과 찬송가를 연결합니다.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleInstallClick}
            className="px-3.5 py-1.5 rounded-xl bg-zinc-950 text-white font-extrabold text-xs hover:bg-zinc-900 transition-all shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95 border border-amber-400/40"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>{isIos ? '설치 방법' : '앱 설치'}</span>
          </button>

          <button
            onClick={handleDismissToday}
            className="p-1 rounded-lg text-amber-200 hover:text-white hover:bg-black/20 transition-colors cursor-pointer"
            title="오늘 하루 보지 않기"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* iOS Safari Guide Modal */}
      {showIosGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-zinc-900 p-6 shadow-2xl border border-zinc-200 dark:border-zinc-800 space-y-4 text-zinc-900 dark:text-zinc-100">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <h3 className="font-extrabold text-base">iPhone 홈 화면에 추가 방법</h3>
              </div>
              <button
                onClick={() => setShowIosGuide(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
              Safari 브라우저에서 아래 2단계로 홈 화면에 바로 설치할 수 있습니다.
            </p>

            <div className="space-y-3 pt-1">
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 text-xs">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold shrink-0">
                  1단계
                </div>
                <div>
                  <div className="font-bold flex items-center gap-1.5 text-amber-600 dark:text-amber-400 mb-0.5">
                    <Share className="w-4 h-4" />
                    <span>하단 [공유] 아이콘 터치</span>
                  </div>
                  <p className="text-[11px] text-zinc-500">
                    사파리 하단 중앙의 내보내기/공유 버튼을 누릅니다.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 text-xs">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold shrink-0">
                  2단계
                </div>
                <div>
                  <div className="font-bold flex items-center gap-1.5 text-amber-600 dark:text-amber-400 mb-0.5">
                    <PlusSquare className="w-4 h-4" />
                    <span>'홈 화면에 추가' 선택</span>
                  </div>
                  <p className="text-[11px] text-zinc-500">
                    메뉴를 스크롤하여 '홈 화면에 추가'를 누르면 완료됩니다!
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIosGuide(false)}
              className="w-full py-3 rounded-xl bg-amber-600 text-white font-bold text-xs hover:bg-amber-700 transition-colors shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>확인했습니다</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};
