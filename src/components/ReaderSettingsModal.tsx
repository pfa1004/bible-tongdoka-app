import React from 'react';
import { ReaderSettings } from '../types';
import { DesignPresetId } from './DesignStyleModal';
import { X, Settings, Palette, Eye, Smartphone, Sparkles, FolderOpen, Bell, ShieldCheck } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  settings: ReaderSettings;
  onUpdate: (newSettings: Partial<ReaderSettings>) => void;
  activeDesignPreset?: DesignPresetId;
  onSelectDesignPreset?: (presetId: DesignPresetId) => void;
  onOpenDesignStyleModal?: () => void;
  onOpenAndroidAppModal?: () => void;
  onOpenBdfImporterModal?: () => void;
  onOpenDailyNotificationModal?: () => void;
  onOpenIntegrityModal?: () => void;
}

export const ReaderSettingsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  settings,
  onUpdate,
  activeDesignPreset = 'classic',
  onSelectDesignPreset,
  onOpenDesignStyleModal,
  onOpenAndroidAppModal,
  onOpenBdfImporterModal,
  onOpenDailyNotificationModal,
  onOpenIntegrityModal,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden text-zinc-900 dark:text-zinc-100">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-2 font-extrabold text-base sm:text-lg">
            <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 dark:text-amber-400 animate-spin-slow" />
            <span>앱 및 본문 읽기 설정</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3.5 space-y-3 max-h-[85vh] overflow-y-auto">
          {/* 안드로이드 & BDF & FCM 알림 & 무결성 검사 기능 바로가기 */}
          {(onOpenAndroidAppModal || onOpenBdfImporterModal || onOpenDailyNotificationModal || onOpenIntegrityModal) && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {onOpenDailyNotificationModal && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenDailyNotificationModal();
                  }}
                  className="flex flex-col items-start p-2 rounded-xl bg-amber-500/10 dark:bg-amber-950/40 border border-amber-500/30 hover:bg-amber-500/20 transition-all text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-1 text-amber-700 dark:text-amber-400 font-extrabold text-[11px] mb-0.5">
                    <Bell className="w-3.5 h-3.5 text-amber-600 group-hover:scale-110 transition-transform" />
                    <span>암송 알림</span>
                  </div>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-tight">
                    FCM 알림
                  </p>
                </button>
              )}

              {onOpenAndroidAppModal && (
                <button
                  onClick={() => {
                    onOpenAndroidAppModal();
                  }}
                  className="flex flex-col items-start p-2 rounded-xl bg-emerald-500/10 dark:bg-emerald-950/40 border border-emerald-500/30 hover:bg-emerald-500/20 transition-all text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-extrabold text-[11px] mb-0.5">
                    <Smartphone className="w-3.5 h-3.5 text-emerald-600 group-hover:scale-110 transition-transform" />
                    <span>앱 설치</span>
                  </div>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-tight">
                    모바일 앱
                  </p>
                </button>
              )}

              {onOpenBdfImporterModal && (
                <button
                  onClick={() => {
                    onOpenBdfImporterModal();
                  }}
                  className="flex flex-col justify-center items-start p-2 rounded-xl bg-indigo-500/10 dark:bg-indigo-950/40 border border-indigo-500/30 hover:bg-indigo-500/20 transition-all text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-1 text-indigo-700 dark:text-indigo-400 font-extrabold text-[11px]">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600 group-hover:scale-110 transition-transform" />
                    <span>성경 데이터</span>
                  </div>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-tight">
                    가져오기
                  </p>
                </button>
              )}

              {onOpenIntegrityModal && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenIntegrityModal();
                  }}
                  className="flex flex-col justify-center items-start p-2 rounded-xl bg-amber-500/10 dark:bg-amber-950/40 border border-amber-500/30 hover:bg-amber-500/20 transition-all text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-1 text-amber-700 dark:text-amber-400 font-extrabold text-[11px]">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-600 group-hover:scale-110 transition-transform" />
                    <span>무결성 검사</span>
                  </div>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-tight">
                    관리자 도구
                  </p>
                </button>
              )}
            </div>
          )}

          {/* 3가지 디자인 테마 & 레이아웃 선택 */}
          <div className="p-2.5 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-white shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-amber-200" />
                <span className="text-xs font-extrabold uppercase tracking-wider">디자인 테마 & 레이아웃</span>
              </div>
              {onOpenDesignStyleModal && (
                <button
                  onClick={onOpenDesignStyleModal}
                  className="px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-extrabold bg-amber-400 text-zinc-950 hover:bg-amber-300 transition-colors flex items-center gap-1"
                >
                  <Eye className="w-3 h-3" />
                  <span>상세 비교</span>
                </button>
              )}
            </div>

            {onSelectDesignPreset && (
              <div className="grid grid-cols-3 gap-1 bg-black/20 p-0.5 rounded-lg">
                <button
                  onClick={() => onSelectDesignPreset('classic')}
                  className={`py-1 px-1 rounded-md text-[11px] font-extrabold whitespace-nowrap transition-all text-center ${
                    activeDesignPreset === 'classic'
                      ? 'bg-white text-amber-950 shadow-xs'
                      : 'text-amber-100 hover:text-white'
                  }`}
                >
                  양식 1. 클래식
                </button>
                <button
                  onClick={() => onSelectDesignPreset('modern')}
                  className={`py-1 px-1 rounded-md text-[11px] font-extrabold whitespace-nowrap transition-all text-center ${
                    activeDesignPreset === 'modern'
                      ? 'bg-white text-amber-950 shadow-xs'
                      : 'text-amber-100 hover:text-white'
                  }`}
                >
                  양식 2. 모던
                </button>
                <button
                  onClick={() => onSelectDesignPreset('eink')}
                  className={`py-1 px-1 rounded-md text-[11px] font-extrabold whitespace-nowrap transition-all text-center ${
                    activeDesignPreset === 'eink'
                      ? 'bg-white text-amber-950 shadow-xs'
                      : 'text-amber-100 hover:text-white'
                  }`}
                >
                  양식 3. 이링크
                </button>
              </div>
            )}
          </div>

          {/* 읽기 테마 */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
              화면 테마 (피로 방지)
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              <button
                onClick={() => onUpdate({ theme: 'light' })}
                className={`flex flex-col items-center justify-center py-1 px-1 rounded-lg border transition-all ${
                  settings.theme === 'light'
                    ? 'border-amber-600 bg-amber-50 text-zinc-900 shadow-xs'
                    : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
                }`}
              >
                <div className="w-3.5 h-3.5 rounded-full bg-white border border-zinc-300 shadow-xs mb-0.5" />
                <span className="text-[10px] sm:text-[11px] font-medium">라이트</span>
              </button>

              <button
                onClick={() => onUpdate({ theme: 'sepia' })}
                className={`flex flex-col items-center justify-center py-1 px-1 rounded-lg border transition-all ${
                  settings.theme === 'sepia'
                    ? 'border-amber-700 bg-amber-100/80 text-amber-950 shadow-xs'
                    : 'border-amber-200/80 bg-[#fbf0d9] text-amber-900 hover:bg-[#f6e6c5]'
                }`}
              >
                <div className="w-3.5 h-3.5 rounded-full bg-[#fbf0d9] border border-amber-300 mb-0.5" />
                <span className="text-[10px] sm:text-[11px] font-medium">세피아</span>
              </button>

              <button
                onClick={() => onUpdate({ theme: 'dark' })}
                className={`flex flex-col items-center justify-center py-1 px-1 rounded-lg border transition-all ${
                  settings.theme === 'dark'
                    ? 'border-amber-500 bg-zinc-800 text-white shadow-xs'
                    : 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800'
                }`}
              >
                <div className="w-3.5 h-3.5 rounded-full bg-zinc-900 border border-zinc-700 mb-0.5" />
                <span className="text-[10px] sm:text-[11px] font-medium">다크</span>
              </button>

              <button
                onClick={() => onUpdate({ theme: 'eink' })}
                className={`flex flex-col items-center justify-center py-1 px-1 rounded-lg border transition-all ${
                  settings.theme === 'eink'
                    ? 'border-zinc-900 bg-zinc-100 text-zinc-950 font-bold shadow-xs'
                    : 'border-zinc-300 bg-zinc-50 text-zinc-800 hover:bg-zinc-200'
                }`}
              >
                <div className="w-3.5 h-3.5 rounded-full bg-zinc-100 border-2 border-zinc-900 mb-0.5" />
                <span className="text-[10px] sm:text-[11px] font-medium">E-ink</span>
              </button>
            </div>
          </div>

          {/* 글꼴 서체 */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
              글꼴 체
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                onClick={() => onUpdate({ fontFamily: 'sans' })}
                className={`py-1 px-1 rounded-lg border text-[10px] sm:text-[11px] font-sans whitespace-nowrap transition-all ${
                  settings.fontFamily === 'sans'
                    ? 'border-amber-600 bg-amber-50 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200 font-bold'
                    : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                고딕 (Sans)
              </button>
              <button
                onClick={() => onUpdate({ fontFamily: 'serif' })}
                className={`py-1 px-1 rounded-lg border text-[10px] sm:text-[11px] font-serif whitespace-nowrap transition-all ${
                  settings.fontFamily === 'serif'
                    ? 'border-amber-600 bg-amber-50 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200 font-bold'
                    : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                명조 (KoPub)
              </button>
              <button
                onClick={() => onUpdate({ fontFamily: 'handwriting' })}
                className={`py-1 px-1 rounded-lg border text-[10px] sm:text-[11px] whitespace-nowrap transition-all italic ${
                  settings.fontFamily === 'handwriting'
                    ? 'border-amber-600 bg-amber-50 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200 font-bold'
                    : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                손글씨 체
              </button>
            </div>
          </div>

          {/* 글자 크기 */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                글자 크기
              </label>
              <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                {settings.fontSize.toUpperCase()}
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1 bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-lg">
              {(['sm', 'md', 'lg', 'xl', '2xl'] as const).map((size) => (
                <button
                  key={size}
                  onClick={() => onUpdate({ fontSize: size })}
                  className={`py-1 text-[10px] sm:text-[11px] font-medium rounded-md transition-all ${
                    settings.fontSize === size
                      ? 'bg-white dark:bg-zinc-700 text-amber-600 dark:text-amber-300 shadow-xs font-bold'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                  }`}
                >
                  {size === 'sm' && '작게'}
                  {size === 'md' && '보통'}
                  {size === 'lg' && '크게'}
                  {size === 'xl' && '아주크게'}
                  {size === '2xl' && '최대'}
                </button>
              ))}
            </div>
          </div>

          {/* 행간 (Line Height) & 자간 (Letter Spacing) */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
                행간 (줄 간격)
              </label>
              <select
                value={settings.lineHeight}
                onChange={(e) => onUpdate({ lineHeight: e.target.value as any })}
                className="w-full py-1 px-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="tight">좁게 (1.4)</option>
                <option value="normal">보통 (1.7)</option>
                <option value="relaxed">넓게 (2.0)</option>
                <option value="loose">여유있게 (2.3)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
                자간 (글자 간격)
              </label>
              <select
                value={settings.letterSpacing}
                onChange={(e) => onUpdate({ letterSpacing: e.target.value as any })}
                className="w-full py-1 px-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="tight">좁게 (-0.02em)</option>
                <option value="normal">보통 (Normal)</option>
                <option value="wide">넓게 (+0.03em)</option>
              </select>
            </div>
          </div>

          {/* 절 번호 & 문단 보기 모드 */}
          <div className="space-y-1.5 pt-2 border-t border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold">절 번호 항상 보기</div>
                <div className="text-[10px] text-zinc-500">각 절 앞에 숫자 표기</div>
              </div>
              <input
                type="checkbox"
                checked={settings.showVerseNumbers}
                onChange={(e) => onUpdate({ showVerseNumbers: e.target.checked })}
                className="w-4 h-4 rounded-md text-amber-600 focus:ring-amber-500 border-zinc-300"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold">문단 정렬 보기</div>
                <div className="text-[10px] text-zinc-500">절별 줄바꿈 대신 문단형 정렬</div>
              </div>
              <input
                type="checkbox"
                checked={settings.paragraphMode}
                onChange={(e) => onUpdate({ paragraphMode: e.target.checked })}
                className="w-4 h-4 rounded-md text-amber-600 focus:ring-amber-500 border-zinc-300"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 text-right">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-amber-600 text-white hover:bg-amber-700 text-xs font-semibold transition-colors"
          >
            적용 완료
          </button>
        </div>
      </div>
    </div>
  );
};
