import React, { useState, useEffect } from 'react';
import {
  X,
  Smartphone,
  Download,
  Check,
  Share2,
  FolderOpen,
  Info,
  Sparkles,
  Settings,
  Layers,
  Globe,
  ExternalLink,
  HelpCircle,
  Apple,
  Monitor,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onToggleDeviceFrame?: () => void;
  isDeviceFrameActive?: boolean;
}

export const AndroidAppModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onToggleDeviceFrame,
  isDeviceFrameActive = false,
}) => {
  const [activeTab, setActiveTab] = useState<'pwa' | 'bdf' | 'apk'>('pwa');
  const [copied, setCopied] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(() => {
    return (window as any).deferredPwaPrompt || null;
  });
  const [isInstalled, setIsInstalled] = useState(false);
  const [installStatusMsg, setInstallStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    if ((window as any).deferredPwaPrompt) {
      setDeferredPrompt((window as any).deferredPwaPrompt);
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      (window as any).deferredPwaPrompt = e;
      setDeferredPrompt(e);
    };

    const handlePwaPromptReady = (e: Event) => {
      const customEv = e as CustomEvent;
      if (customEv.detail) {
        setDeferredPrompt(customEv.detail);
      }
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      (window as any).deferredPwaPrompt = null;
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('pwaPromptReady', handlePwaPromptReady);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('pwaPromptReady', handlePwaPromptReady);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  if (!isOpen) return null;

  const currentUrl = window.location.href;
  const isInIframe = window.self !== window.top;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTriggerInstall = async () => {
    const promptObj = deferredPrompt || (window as any).deferredPwaPrompt;
    
    // Check if already running as standalone app (installed)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
    if (isStandalone || isInstalled) {
      setInstallStatusMsg('✅ 이미 "성경통독" 앱이 스마트폰/PC에 설치되어 실행 중입니다!');
      return;
    }

    if (promptObj) {
      try {
        promptObj.prompt();
        const choiceResult = await promptObj.userChoice;
        if (choiceResult.outcome === 'accepted') {
          setIsInstalled(true);
          setInstallStatusMsg('🎉 성경통독 앱이 성공적으로 설치되었습니다!');
        } else {
          setInstallStatusMsg('앱 설치가 취소되었습니다. 언제든 다시 설치하실 수 있습니다.');
        }
        setDeferredPrompt(null);
        (window as any).deferredPwaPrompt = null;
      } catch (err) {
        console.error('PWA Install Prompt error:', err);
        setInstallStatusMsg('설치 팝업 호출 중 오류가 발생했습니다. 브라우저 메뉴(⋮) -> [홈 화면에 추가]를 이용해 주세요.');
      }
    } else {
      if (isInIframe) {
        // AI Studio preview environment is in an iframe where beforeinstallprompt is suppressed by browser policy
        const opened = window.open(currentUrl, '_blank');
        if (opened) {
          setInstallStatusMsg('🔗 iFrame 안에서는 브라우저 보안상 설치 팝업이 제한되어 새 탭으로 이동했습니다. 새 탭 창에서 다시 설치 버튼이나 브라우저 메뉴(⋮)를 눌러주세요!');
        } else {
          setInstallStatusMsg('⚠️ 팝업 차단이 설정되어 있습니다. 상단의 [새 탭으로 열기] 버튼을 누른 후 새 탭에서 설치해주세요!');
        }
      } else {
        setInstallStatusMsg('💡 사용 중이신 브라우저가 자동 설치 팝업을 제공하지 않거나 이미 설치되어 있습니다. 아래 [스마트폰/PC 수동 설치 방법]의 안내(브라우저 메뉴 ⋮ -> [홈 화면에 추가])를 따라주세요!');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl rounded-3xl bg-white dark:bg-zinc-900 shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden text-zinc-900 dark:text-zinc-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/20 backdrop-blur-md">
              <Smartphone className="w-6 h-6 text-emerald-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-extrabold font-serif">
                  안드로이드(Android) 전용 모드
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-400/30 text-emerald-100 text-[10px] font-mono font-bold">
                  v2.5 Android Edition
                </span>
              </div>
              <p className="text-xs text-emerald-100/90 mt-0.5">
                스마트폰 최적화 터치 UI, PWA 원클릭 설치 및 BDF 성경파일 지원
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-black/20 hover:bg-black/40 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Frame Toggle Bar */}
        <div className="bg-emerald-950/20 dark:bg-zinc-950 p-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-5 text-xs">
          <span className="font-extrabold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
            <Smartphone className="w-4 h-4" />
            <span>화면 시뮬레이션:</span>
          </span>
          <button
            onClick={onToggleDeviceFrame}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
              isDeviceFrameActive
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{isDeviceFrameActive ? '📱 스마트폰 프레임 ON' : '💻 데스크톱 전체 화면'}</span>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
          <button
            onClick={() => setActiveTab('pwa')}
            className={`flex-1 py-3 text-xs font-extrabold transition-colors border-b-2 ${
              activeTab === 'pwa'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-white dark:bg-zinc-900'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            📲 1초 앱 설치 (PWA)
          </button>
          <button
            onClick={() => setActiveTab('bdf')}
            className={`flex-1 py-3 text-xs font-extrabold transition-colors border-b-2 ${
              activeTab === 'bdf'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-white dark:bg-zinc-900'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            📂 안드로이드 BDF 연동
          </button>
          <button
            onClick={() => setActiveTab('apk')}
            className={`flex-1 py-3 text-xs font-extrabold transition-colors border-b-2 ${
              activeTab === 'apk'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 bg-white dark:bg-zinc-900'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            ⚙️ APK 변환 / 안내
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 text-xs leading-relaxed">
          {activeTab === 'pwa' && (
            <div className="space-y-4">
              {/* App Icon Preview Card */}
              <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-emerald-950/60 dark:bg-emerald-950/80 border border-emerald-500/40 text-emerald-100 shadow-sm">
                <img
                  src="/icon-192.png"
                  alt="성경통독 앱 아이콘"
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl object-cover shadow-md border-2 border-emerald-400/60 shrink-0"
                />
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-extrabold text-sm text-white">성경통독 홈 화면 전용 아이콘</span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/30 border border-emerald-400/40 text-[10px] text-emerald-300 font-extrabold">
                      192x192 / 512x512 PWA
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-200/90 leading-snug">
                    홈 화면에 추가하시면 스마트폰 바탕화면 및 앱 목록에 해당 성경 아이콘 이미지로 등록됩니다.
                  </p>
                </div>
              </div>

              {/* Direct Install Banner & Button */}
              <div className={`p-4 rounded-2xl border transition-all ${
                deferredPrompt
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-500 shadow-lg'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 border-emerald-500/30'
              }`}>
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-sm flex items-center gap-1.5">
                    <Sparkles className={`w-4 h-4 ${deferredPrompt ? 'text-amber-300 animate-bounce' : 'text-emerald-600 dark:text-emerald-400'}`} />
                    <span>원클릭 앱 설치 (설치 팝업 호출)</span>
                  </h3>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    deferredPrompt ? 'bg-white/20 text-white' : 'bg-emerald-200/60 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300'
                  }`}>
                    {deferredPrompt ? '✨ 팝업 호출 준비 완료' : '브라우저 캡처 모드'}
                  </span>
                </div>
                <p className={`text-xs mt-1.5 ${deferredPrompt ? 'text-emerald-100' : 'text-zinc-600 dark:text-zinc-300'}`}>
                  {deferredPrompt
                    ? '브라우저의 설치 이벤트(beforeinstallprompt)가 준비되었습니다. 아래 버튼을 누르면 설치 팝업이 즉시 실행됩니다.'
                    : isInIframe
                    ? '💡 현재 미리보기(iFrame) 화면 안에서는 브라우저 보안 규정상 설치 팝업이 제한됩니다. [새 탭에서 열기] 후 설치 버튼을 눌러주세요!'
                    : '아래 버튼을 누르면 브라우저의 원클릭 앱 설치 팝업창을 호출하거나 가이드를 확인합니다.'}
                </p>
                <div className="flex flex-col sm:flex-row gap-2 mt-3">
                  <button
                    onClick={handleTriggerInstall}
                    className={`flex-1 py-2.5 px-3 rounded-xl font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      deferredPrompt
                        ? 'bg-white text-emerald-800 hover:bg-emerald-50 active:scale-[0.99]'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20 active:scale-[0.99]'
                    }`}
                  >
                    <Download className="w-4 h-4" />
                    <span>📲 [원클릭] 앱 설치 팝업 실행</span>
                  </button>

                  <a
                    href={currentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-zinc-950 font-extrabold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all shrink-0 cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>🌐 외부 브라우저(새 탭)로 열기</span>
                  </a>

                  <button
                    type="button"
                    onClick={handleCopyUrl}
                    className="py-2.5 px-3 rounded-xl bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all shrink-0 cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
                    <span>{copied ? '복사 완료!' : '📋 주소 복사'}</span>
                  </button>
                </div>
              </div>

              {/* Status Banner notification if triggered */}
              {installStatusMsg && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs font-semibold flex items-center justify-between animate-in fade-in duration-200">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>{installStatusMsg}</span>
                  </div>
                  <button onClick={() => setInstallStatusMsg(null)} className="text-amber-700 dark:text-amber-400 font-bold ml-2">
                    ✕
                  </button>
                </div>
              )}

              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 space-y-2">
                <h3 className="font-extrabold text-zinc-800 dark:text-zinc-200 text-sm flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-emerald-600" />
                  <span>스마트폰/PC 수동 설치 방법</span>
                </h3>
                <p className="text-zinc-600 dark:text-zinc-300">
                  원클릭 설치 팝업 외에도 구글 크롬(Chrome)이나 삼성 인터넷 메뉴에서 <strong>[홈 화면에 추가]</strong>를 누르면 Play 스토어 앱처럼 주소창 없이 완벽한 독립 스마트폰 앱으로 설치됩니다!
                </p>
              </div>

              {/* Browser-specific Step Guides */}
              <div className="space-y-3">
                {/* Samsung Internet Guide */}
                <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border-2 border-blue-500/40 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-blue-900 dark:text-blue-200 text-xs flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 text-blue-600" />
                      <span>삼성 인터넷 브라우저 (갤럭시 기본)</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white font-bold text-[10px]">
                      스샷 화면 브라우저
                    </span>
                  </div>

                  <div className="space-y-1.5 text-[11px] text-zinc-700 dark:text-zinc-300">
                    <div className="flex items-start gap-2 bg-white/80 dark:bg-zinc-900/80 p-2 rounded-xl">
                      <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">1</span>
                      <div>
                        <strong>화면 우측 아래 `⋮` (세 점 버튼)</strong>을 터치합니다.
                        <p className="text-[10px] text-zinc-500">※ 화면 맨 밑 하단바의 맨 우측 끝 3개 점 아이콘입니다.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 bg-white/80 dark:bg-zinc-900/80 p-2 rounded-xl">
                      <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">2</span>
                      <div>
                        메뉴 중 <strong>`+` (페이지 추가)</strong> 버튼을 누릅니다.
                        <p className="text-[10px] text-zinc-500">※ 메뉴에 바로 '홈 화면에 추가'가 보이면 바로 누르셔도 됩니다.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 bg-white/80 dark:bg-zinc-900/80 p-2 rounded-xl">
                      <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">3</span>
                      <div>
                        <strong>[홈 화면]</strong>을 누르시면 메뉴 창이 닫히며 즉시 추가됩니다.
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-amber-100/80 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 mt-2 space-y-1">
                      <p className="font-extrabold flex items-center gap-1">
                        <span>💡 [홈 화면] 누른 뒤 창이 그냥 사라진 경우</span>
                      </p>
                      <p className="text-[10.5px] leading-relaxed text-zinc-700 dark:text-zinc-300">
                        삼성 인터넷은 별도 확인 창 없이 <strong>스마트폰 바탕화면 맨 오른쪽 마지막 페이지</strong> 또는 <strong>전체 앱 목록(앱스 화면)</strong>에 <strong>[성경통독]</strong> 아이콘을 바로 생성합니다! 스마트폰 바탕화면 맨 우측으로 스와이프해 보세요.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Chrome Guide */}
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/40 space-y-2.5">
                  <div className="font-extrabold text-emerald-900 dark:text-emerald-200 text-xs flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-emerald-600" />
                    <span>구글 크롬 (Chrome) 브라우저</span>
                  </div>

                  <div className="space-y-1.5 text-[11px] text-zinc-700 dark:text-zinc-300">
                    <div className="flex items-start gap-2 bg-white/80 dark:bg-zinc-900/80 p-2 rounded-xl">
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">1</span>
                      <div>
                        화면 <strong>우측 상단 `⋮` (세 점 버튼)</strong>을 터치합니다.
                      </div>
                    </div>

                    <div className="flex items-start gap-2 bg-white/80 dark:bg-zinc-900/80 p-2 rounded-xl">
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">2</span>
                      <div>
                        <strong>'앱 설치'</strong> 또는 <strong>'홈 화면에 추가'</strong>를 선택합니다.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Troubleshooting Card */}
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-500/40 space-y-3">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-extrabold text-xs">
                  <HelpCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>❓ '앱 설치' 또는 '홈 화면에 추가' 메뉴가 안 보일 때 해결 방법</span>
                </div>
                <div className="space-y-2 text-[11px] text-zinc-700 dark:text-zinc-300">
                  <div className="p-2.5 rounded-xl bg-white/70 dark:bg-zinc-900/70 border border-amber-200 dark:border-amber-900/50">
                    <p className="font-bold text-amber-900 dark:text-amber-200">
                      1. 현재 미리보기(iframe)나 앱 내부 창에서 접속된 경우
                    </p>
                    <p className="mt-0.5 text-zinc-600 dark:text-zinc-400">
                      브라우저 보안 규정상 웹뷰/프레임 내부에서는 설치 메뉴가 숨겨집니다. 상단의 <strong>[🌐 외부 브라우저(새 탭)로 열기]</strong>를 누르거나, 크롬/삼성인터넷 주소창에 직접 주소를 붙여넣어 실행해 주세요.
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white/70 dark:bg-zinc-900/70 border border-amber-200 dark:border-amber-900/50">
                    <p className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1">
                      <Apple className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" />
                      <span>2. 아이폰(iOS Safari)을 사용하는 경우</span>
                    </p>
                    <p className="mt-0.5 text-zinc-600 dark:text-zinc-400">
                      iOS Safari에서는 우측 상단 메뉴(⋮) 대신, Safari 브라우저 <strong>하단 중앙의 [공유 버튼 📤]</strong>을 누른 뒤 목록에서 <strong>'홈 화면에 추가'</strong>를 선택하셔야 합니다.
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white/70 dark:bg-zinc-900/70 border border-amber-200 dark:border-amber-900/50">
                    <p className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1">
                      <Monitor className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300" />
                      <span>3. 데스크톱(PC Chrome)을 사용하는 경우</span>
                    </p>
                    <p className="mt-0.5 text-zinc-600 dark:text-zinc-400">
                      PC Chrome에서는 브라우저 맨 우측 상단 주소창 끝에 있는 <strong>[다운로드/모니터 아이콘 💻]</strong>을 클릭하거나, `⋮` 메뉴 -&gt; <strong>[저장 및 공유] -&gt; [앱으로 설치]</strong>를 클릭하시면 됩니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'bdf' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-500/30 space-y-2">
                <h3 className="font-extrabold text-amber-800 dark:text-amber-300 text-sm flex items-center gap-1.5">
                  <FolderOpen className="w-4 h-4 text-amber-600" />
                  <span>안드로이드 내장 저장소 BDF 성경 불러오기</span>
                </h3>
                <p className="text-zinc-700 dark:text-zinc-300">
                  안드로이드 스마트폰의 <strong>Download</strong> 폴더나 <strong>Bethany / Bible</strong> 폴더에 보관된 `.BDF` 파일(예: ENGKJV1.BDF, NKRV1.BDF)을 바로 파싱할 수 있습니다.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 space-y-3">
                <p className="font-bold text-zinc-800 dark:text-zinc-200">
                  📍 안드로이드 BDF 성경 파일 탐색 위치 안내:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-zinc-600 dark:text-zinc-300">
                  <li>
                    <strong>내 파일(File Manager)</strong> → <code>내장 메모리 / Download /</code>
                  </li>
                  <li>
                    <strong>베들레헴 앱 폴더</strong> → <code>/Bethany/bible/</code> 또는 <code>/SelectBible/</code>
                  </li>
                  <li>
                    상단 <strong>[BDF 파일분석]</strong> 버튼을 누른 후 파일 선택창에서 해당 <code>.BDF</code> 파일 선택!
                  </li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'apk' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-500/30 space-y-2">
                <h3 className="font-extrabold text-indigo-800 dark:text-indigo-300 text-sm flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-indigo-600" />
                  <span>Android APK 파일 패키징 안내</span>
                </h3>
                <p className="text-zinc-700 dark:text-zinc-300">
                  본 앱은 최신 Web/React standards로 작성되어 <strong>Capacitor</strong> 또는 <strong>Bubblewrap (TWA)</strong>을 이용해 몇 분 만에 <code>.apk</code> 또는 <code>.aab</code> 파일로 패키징하여 구글 플레이스토어 등록이 가능합니다.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-950 text-emerald-400 font-mono text-[10px] space-y-1 overflow-x-auto">
                <p className="text-zinc-400">// Android Capacitor CLI 명령어</p>
                <p>npm install @capacitor/core @capacitor/cli @capacitor/android</p>
                <p>npx cap init "BibleApp" "com.bible.android"</p>
                <p>npm run build</p>
                <p>npx cap add android</p>
                <p>npx cap open android // Android Studio 실행</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400">
              안드로이드 모바일 반응형 UI 가동 중
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
};

