import React, { useState } from 'react';
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
  MoreHorizontal,
  Link,
  ExternalLink,
  X,
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
  onOpenFourLawsModal?: () => void;
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
  onOpenFourLawsModal,
  audioState,
  onToggleAudioPlayer,
  onOpenHenryCommentary,
  onPrev,
  onNext,
}) => {
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isStudyMaterialsOpen, setIsStudyMaterialsOpen] = useState(false);

  const studyMaterials = [
    { title: '성경의 단위', url: 'https://bible.bskorea.or.kr/resources/study/nkt_units' },
    { title: '성경지도', url: 'https://bible.bskorea.or.kr/resources/study/nkt_maps' },
    { title: '성경시청각자료', url: 'https://bible.bskorea.or.kr/resources/handbook' },
    { title: '용어해설', url: 'https://bible.bskorea.or.kr/resources/study/nkt_glossary' },
  ];

  return (
    <>
      {/* More Options Popover Menu */}
      {isMoreOpen && (
        <div className="md:hidden fixed inset-0 z-80 flex items-end justify-center bg-black/60 backdrop-blur-xs transition-opacity" onClick={() => { setIsMoreOpen(false); setIsStudyMaterialsOpen(false); }}>
          <div
            className="w-full max-w-md bg-[#0f172a] text-slate-100 rounded-t-3xl p-5 border-t border-slate-800 shadow-2xl space-y-4 animate-in slide-in-from-bottom duration-200 mb-14"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="font-extrabold text-base text-amber-400 flex items-center gap-2">
                <MoreHorizontal className="w-5 h-5 text-amber-400" />
                더보기 메뉴
              </h3>
              <button
                onClick={() => { setIsMoreOpen(false); setIsStudyMaterialsOpen(false); }}
                className="p-1 rounded-full text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 성경탐구자료 서브버튼 목록 (클릭 시 펼쳐짐) */}
            {isStudyMaterialsOpen && (
              <div className="p-3 bg-slate-900/90 rounded-2xl border border-amber-500/30 space-y-2 animate-in fade-in zoom-in-95 duration-150">
                <div className="text-xs font-bold text-amber-400 mb-1 flex items-center justify-between px-1">
                  <span>📖 성경탐구자료 목록</span>
                  <button onClick={() => setIsStudyMaterialsOpen(false)} className="text-slate-400 hover:text-slate-200 text-[11px]">닫기</button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {studyMaterials.map((mat) => (
                    <button
                      key={mat.title}
                      onClick={() => {
                        setIsMoreOpen(false);
                        setIsStudyMaterialsOpen(false);
                        window.open(mat.url, '_blank');
                      }}
                      className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-bold border border-slate-700 transition-all active:scale-95 text-left"
                    >
                      <span>{mat.title}</span>
                      <ExternalLink className="w-3 h-3 text-amber-400 shrink-0 ml-1" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-3 py-2">
              {/* 성경탐구자료 */}
              <button
                onClick={() => setIsStudyMaterialsOpen(!isStudyMaterialsOpen)}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border active:scale-95 transition-all gap-2 cursor-pointer ${isStudyMaterialsOpen
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                  : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700/60 text-slate-200'
                  }`}
              >
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <Compass className="w-6 h-6 text-amber-400" />
                </div>
                <span className="text-xs font-bold text-center leading-tight">성경탐구자료</span>
              </button>

              {/* 사영리 */}
              <button
                onClick={() => {
                  setIsMoreOpen(false);
                  setIsStudyMaterialsOpen(false);
                  if (onOpenFourLawsModal) onOpenFourLawsModal();
                }}
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 active:scale-95 transition-all gap-2 text-slate-200 cursor-pointer"
              >
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <Sparkles className="w-6 h-6 text-amber-400 fill-current" />
                </div>
                <span className="text-xs font-bold">사영리</span>
              </button>

              {/* 참고링크 */}
              <button
                onClick={() => {
                  setIsMoreOpen(false);
                  setIsStudyMaterialsOpen(false);
                  onTabChange('links');
                }}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border active:scale-95 transition-all gap-2 cursor-pointer ${activeTab === 'links'
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                  : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700/60 text-slate-200'
                  }`}
              >
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <Link className="w-6 h-6 text-amber-400" />
                </div>
                <span className="text-xs font-bold">참고링크</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="md:hidden fixed bottom-0 left-0 right-0 z-90 bg-[#0f172a]/95 text-slate-100 backdrop-blur-md border-t border-slate-800 shadow-2xl transition-all pb-safe">
        {/* Primary Bottom Bar: 7 Core Navigation Tabs */}
        <nav className="flex items-center h-14 px-1 bg-[#0f172a]/95">
          <div className="grid grid-cols-7 w-full h-full">
            {/* 1. 성경 */}
            <button
              onClick={() => {
                onTabChange('bible');
                onOpenBibleBooksModal('list');
                const mainEl = document.querySelector('main');
                if (mainEl) mainEl.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
                if (mainEl) mainEl.scrollTop = 0;
              }}
              className={`flex flex-col items-center justify-center gap-0.5 relative transition-all active:scale-95 cursor-pointer ${activeTab === 'bible'
                ? 'text-amber-400 font-extrabold'
                : 'text-slate-400 hover:text-slate-200'
                }`}
              title="성경 목록 및 읽기"
            >
              {activeTab === 'bible' && (
                <span className="absolute top-0 w-6 h-0.5 bg-amber-400 rounded-full" />
              )}
              <BookOpen className={`w-4 h-4 sm:w-5 sm:h-5 ${activeTab === 'bible' ? 'stroke-[2.5]' : 'stroke-2'}`} />
              <span className="text-[10px]">성경</span>
            </button>

            {/* 2. 주석 */}
            <button
              onClick={onOpenHenryCommentary}
              className="flex flex-col items-center justify-center gap-0.5 relative transition-all active:scale-95 cursor-pointer text-slate-400 hover:text-amber-400"
              title="매튜헨리 & 만나 성경 주석 해설 보기"
            >
              <BookOpenCheck className="w-4 h-4 sm:w-5 sm:h-5 stroke-2 text-amber-400" />
              <span className="text-[10px]">주석</span>
            </button>

            {/* 3. 찬송가 */}
            <button
              onClick={() => onTabChange('hymn')}
              className={`flex flex-col items-center justify-center gap-0.5 relative transition-all active:scale-95 cursor-pointer ${activeTab === 'hymn'
                ? 'text-amber-400 font-extrabold'
                : 'text-slate-400 hover:text-slate-200'
                }`}
            >
              {activeTab === 'hymn' && (
                <span className="absolute top-0 w-6 h-0.5 bg-amber-400 rounded-full" />
              )}
              <Music className={`w-4 h-4 sm:w-5 sm:h-5 ${activeTab === 'hymn' ? 'stroke-[2.5]' : 'stroke-2'}`} />
              <span className="text-[10px]">찬송가</span>
            </button>

            {/* 4. 말씀카드 */}
            <button
              onClick={() => onTabChange('today')}
              className={`flex flex-col items-center justify-center gap-0.5 relative transition-all active:scale-95 cursor-pointer ${activeTab === 'today'
                ? 'text-amber-400 font-extrabold'
                : 'text-slate-400 hover:text-slate-200'
                }`}
            >
              {activeTab === 'today' && (
                <span className="absolute top-0 w-6 h-0.5 bg-amber-400 rounded-full" />
              )}
              <HeartHandshake className={`w-4 h-4 sm:w-5 sm:h-5 ${activeTab === 'today' ? 'stroke-[2.5]' : 'stroke-2'}`} />
              <span className="text-[10px]">말씀카드</span>
            </button>

            {/* 5. 메모 */}
            <button
              onClick={() => onTabChange('memo')}
              className={`flex flex-col items-center justify-center gap-0.5 relative transition-all active:scale-95 cursor-pointer ${activeTab === 'memo'
                ? 'text-amber-400 font-extrabold'
                : 'text-slate-400 hover:text-slate-200'
                }`}
            >
              {activeTab === 'memo' && (
                <span className="absolute top-0 w-6 h-0.5 bg-amber-400 rounded-full" />
              )}
              <FileText className={`w-4 h-4 sm:w-5 sm:h-5 ${activeTab === 'memo' ? 'stroke-[2.5]' : 'stroke-2'}`} />
              <span className="text-[10px]">메모</span>
            </button>

            {/* 6. 말씀찾기 */}
            <button
              onClick={onOpenBibleSearchModal}
              className="flex flex-col items-center justify-center gap-0.5 relative transition-all active:scale-95 cursor-pointer text-slate-400 hover:text-slate-200"
              title="성경 구절 및 키워드 검색"
            >
              <Search className="w-4 h-4 sm:w-5 sm:h-5 stroke-2 text-amber-400" />
              <span className="text-[10px]">말씀찾기</span>
            </button>

            {/* 7. 더보기 (역사지도, 사영리, 참고링크) */}
            <button
              onClick={() => setIsMoreOpen(!isMoreOpen)}
              className={`flex flex-col items-center justify-center gap-0.5 relative transition-all active:scale-95 cursor-pointer ${isMoreOpen || activeTab === 'links'
                ? 'text-amber-400 font-extrabold'
                : 'text-slate-400 hover:text-slate-200'
                }`}
              title="더보기 (역사지도, 사영리, 참고링크)"
            >
              {(isMoreOpen || activeTab === 'links') && (
                <span className="absolute top-0 w-6 h-0.5 bg-amber-400 rounded-full" />
              )}
              <MoreHorizontal className="w-4 h-4 sm:w-5 sm:h-5 stroke-2" />
              <span className="text-[10px]">더보기</span>
            </button>
          </div>
        </nav>
      </div>
    </>
  );
};
