import React, { useState } from 'react';
import { PlanSettings, PlanDay } from '../types';
import { SEQUENTIAL_PLAN_DAYS, CHRONOLOGICAL_PLAN_DAYS, RANDOM_PLAN_DAYS, getPlanDay } from '../data/planData';
import {
  X,
  Calendar,
  Flame,
  CheckCircle2,
  Check,
  Clock,
  Bell,
  Sparkles,
  BookOpen,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  settings: PlanSettings;
  onUpdateSettings: (newSettings: Partial<PlanSettings>) => void;
  onSelectPassage: (bookId: string, chapter: number) => void;
}

export const PlanModal: React.FC<Props> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onSelectPassage,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'plan' | 'streak' | 'alarm'>('plan');

  if (!isOpen) return null;

  const isChronoMode = settings.mode === 'free';
  const isRandomMode = settings.mode === 'random';
  const activePlanDays = isRandomMode
    ? RANDOM_PLAN_DAYS
    : isChronoMode
    ? CHRONOLOGICAL_PLAN_DAYS
    : SEQUENTIAL_PLAN_DAYS;
  const nextReadingDay = activePlanDays.find((d) => !settings.completedDays.includes(d.day)) || activePlanDays[0];

  const totalChapters = 1189;
  const completedCount = settings.completedDays.length * 3.25; // approx
  const progressPercent = Math.min(100, Math.round((completedCount / totalChapters) * 100));

  const toggleDayCompletion = (dayNum: number) => {
    let updatedDays = [...settings.completedDays];
    if (updatedDays.includes(dayNum)) {
      updatedDays = updatedDays.filter((d) => d !== dayNum);
    } else {
      updatedDays.push(dayNum);
    }
    const streak = updatedDays.length > 0 ? settings.streakCount + 1 : 0;
    onUpdateSettings({
      completedDays: updatedDays,
      streakCount: streak,
      lastReadDate: new Date().toISOString().split('T')[0],
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-zinc-900 shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden text-zinc-900 dark:text-zinc-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4 border-b border-zinc-200 dark:border-zinc-800 bg-amber-500/10 dark:bg-amber-500/5 shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <span className="p-1.5 sm:p-2 rounded-xl bg-amber-500 text-white shadow-md shrink-0">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
            </span>
            <div className="min-w-0">
              <h3 className="font-bold text-sm sm:text-lg leading-tight whitespace-nowrap">
                {isRandomMode
                  ? '랜덤 365일 통독 플랜'
                  : isChronoMode
                  ? '연대기순 365일 통독 플랜'
                  : '순서대로 365일 통독 플랜'}
              </h3>
              <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 whitespace-nowrap overflow-hidden text-ellipsis">
                {isRandomMode
                  ? '매일 (구약 1장 + 시편 1장 + 신약 1장) 3중 조합으로 균형있게 읽기'
                  : isChronoMode
                  ? '구약 24단계 / 신약 19단계 역사적 사건 발생 순서로 읽기'
                  : '창세기부터 요한계시록까지 1년 1,189장 완독'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode & Navigation Tabs */}
        <div className="flex items-center justify-between px-3 sm:px-6 py-2 sm:py-3 bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setActiveSubTab('plan')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all text-center leading-tight ${
                activeSubTab === 'plan'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800'
              }`}
            >
              <div>플랜</div>
              <div>목록</div>
            </button>
            <button
              onClick={() => setActiveSubTab('streak')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all text-center leading-tight ${
                activeSubTab === 'streak'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800'
              }`}
            >
              <div>연속</div>
              <div>읽기</div>
            </button>
            <button
              onClick={() => setActiveSubTab('alarm')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all text-center leading-tight ${
                activeSubTab === 'alarm'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800'
              }`}
            >
              <div>알람</div>
              <div>설정</div>
            </button>
          </div>

          {/* Mode Switcher Toggle: 권별 순서 | 연대기(자유) | 랜덤읽기 */}
          <div className="flex items-center bg-zinc-200 dark:bg-zinc-800 p-1 rounded-xl gap-1">
            <button
              onClick={() => onUpdateSettings({ mode: 'sequential' })}
              className={`px-2 py-1 text-xs font-semibold rounded-lg transition-all text-center leading-tight ${
                settings.mode === 'sequential'
                  ? 'bg-white dark:bg-zinc-700 text-amber-600 dark:text-amber-300 font-bold shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
              }`}
            >
              <div>권별</div>
              <div>순서</div>
            </button>
            <button
              onClick={() => onUpdateSettings({ mode: 'free' })}
              className={`px-2 py-1 text-xs font-semibold rounded-lg transition-all text-center leading-tight ${
                settings.mode === 'free'
                  ? 'bg-white dark:bg-zinc-700 text-amber-600 dark:text-amber-300 font-bold shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
              }`}
            >
              <div>연대기</div>
              <div>(자유)</div>
            </button>
            <button
              onClick={() => onUpdateSettings({ mode: 'random' })}
              className={`px-2 py-1 text-xs font-semibold rounded-lg transition-all text-center leading-tight ${
                settings.mode === 'random'
                  ? 'bg-white dark:bg-zinc-700 text-amber-600 dark:text-amber-300 font-bold shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
              }`}
            >
              <div>랜덤</div>
              <div>읽기</div>
            </button>
          </div>
        </div>

        {/* Content Panel */}
        <div className="p-3.5 sm:p-6 overflow-y-auto space-y-4 sm:space-y-6 flex-1">
          {/* Overview Progress Card */}
          <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 border border-amber-500/20">
            <div className="flex items-center justify-between gap-1.5 mb-2">
              <div className="flex items-center gap-1.5 shrink-0">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 shrink-0" />
                <span className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
                  {isRandomMode
                    ? '랜덤 통독 달성률'
                    : isChronoMode
                    ? '연대기 통독 달성률'
                    : '권별 순서 통독 달성률'}
                </span>
              </div>
              <span className="text-xs sm:text-sm font-extrabold text-amber-600 dark:text-amber-400 font-mono whitespace-nowrap">
                {progressPercent}% (약 {Math.round(completedCount)} / 1,189장)
              </span>
            </div>
            <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-amber-500 h-full transition-all duration-500 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Sub-tab 1: Plan List */}
          {activeSubTab === 'plan' && (
            <div className="space-y-3">
              {/* Highlight Card for Next Reading Turn */}
              {nextReadingDay && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-amber-100 text-xs font-bold uppercase tracking-wider">
                      <Sparkles className="w-4 h-4 text-amber-200" />
                      <span>✨ 다음 읽을 차례</span>
                    </div>
                    <div className="font-extrabold text-base sm:text-lg">
                      DAY {nextReadingDay.day} - {nextReadingDay.title}
                    </div>
                    {(() => {
                      const passageStr = nextReadingDay.passages
                        .map((p) => (p.startChapter === p.endChapter ? `${p.bookName} ${p.startChapter}장` : `${p.bookName} ${p.startChapter}~${p.endChapter}장`))
                        .join(', ');
                      if (!nextReadingDay.title.includes(passageStr)) {
                        return (
                          <div className="text-xs text-amber-100 font-medium">
                            {passageStr}
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                  <button
                    onClick={() => {
                      const p = nextReadingDay.passages[0];
                      onSelectPassage(p.bookId, p.startChapter);
                      onClose();
                    }}
                    className="px-4 py-2 rounded-xl bg-white text-amber-900 hover:bg-amber-50 font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer shrink-0"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>지금 바로 읽기</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="text-xs text-zinc-500 flex items-center justify-between">
                <span>
                  {isRandomMode
                    ? '🎲 하루 (구약 1장 + 시편 1장 + 신약 1장) 균형 365일 플랜'
                    : isChronoMode
                    ? '📜 구약(1~24단계) -> ✝️ 신약(25~43단계) 연대기순 365일 일정'
                    : '하루 3~4장씩 권별 순서대로 읽는 365일 플랜'}
                </span>
                <span>완료 체크</span>
              </div>

              <div className="space-y-2">
                {activePlanDays.map((dayData) => {
                  const dayNum = dayData.day;
                  const isDone = settings.completedDays.includes(dayNum);

                  return (
                    <div
                      key={dayNum}
                      className={`flex items-center justify-between p-2.5 sm:p-3.5 gap-2 rounded-xl border transition-all ${
                        isDone
                          ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800'
                          : 'bg-white dark:bg-zinc-800/80 border-zinc-200 dark:border-zinc-700/80 hover:border-amber-400'
                      }`}
                    >
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        <button
                          onClick={() => toggleDayCompletion(dayNum)}
                          aria-label={`Day ${dayNum} 완료 체크`}
                          className={`w-5 h-5 sm:w-6 sm:h-6 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
                            isDone
                              ? 'bg-amber-500 text-white shadow-xs'
                              : 'border-2 border-zinc-300 dark:border-zinc-600 hover:border-amber-500'
                          }`}
                        >
                          {isDone && <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />}
                        </button>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-xs sm:text-sm flex items-center gap-1.5 leading-snug">
                            <span className="whitespace-nowrap font-extrabold text-amber-900 dark:text-amber-200">
                              DAY {dayNum}
                            </span>
                            <span className="font-normal text-zinc-700 dark:text-zinc-200 truncate">
                              {dayData.title}
                            </span>
                          </div>
                          {(() => {
                            const passageStr = dayData.passages
                              .map((p) => (p.startChapter === p.endChapter ? `${p.bookName} ${p.startChapter}장` : `${p.bookName} ${p.startChapter}~${p.endChapter}장`))
                              .join(', ');
                            if (!dayData.title.includes(passageStr)) {
                              return (
                                <div className="text-[11px] sm:text-xs text-amber-700 dark:text-amber-400 font-medium leading-snug truncate">
                                  {passageStr}
                                </div>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-1 shrink-0">
                        {dayData.passages.length > 1 ? (
                          dayData.passages.map((p, idx) => (
                            <button
                              key={idx}
                              onClick={() => {
                                onSelectPassage(p.bookId, p.startChapter);
                                onClose();
                              }}
                              className="px-2 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 dark:text-amber-200 text-[11px] font-bold transition-colors cursor-pointer border border-amber-500/30 whitespace-nowrap"
                              title={`${p.bookName} ${p.startChapter}장으로 이동`}
                            >
                              {p.bookName} {p.startChapter}장
                            </button>
                          ))
                        ) : (
                          <button
                            onClick={() => {
                              const p = dayData.passages[0];
                              onSelectPassage(p.bookId, p.startChapter);
                              onClose();
                            }}
                            className="flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-700 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-[11px] sm:text-xs font-semibold text-zinc-800 dark:text-zinc-200 transition-colors shrink-0 whitespace-nowrap cursor-pointer"
                          >
                            <span>읽으러 가기</span>
                            <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sub-tab 2: Streak Tracking */}
          {activeSubTab === 'streak' && (
            <div className="space-y-4 text-center">
              <div className="p-6 rounded-2xl bg-zinc-900 text-white space-y-3">
                <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center border border-amber-500/30">
                  <Flame className="w-8 h-8 animate-bounce" />
                </div>
                <div className="text-3xl font-extrabold text-amber-400 font-mono">
                  {settings.streakCount} 일 연속 읽기 달성!
                </div>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                  매일 말씀과 함께하는 거룩한 습관이 형성되고 있습니다. 오늘 분량을
                  완독하여 연속 기록을 유지해 보세요.
                </p>
              </div>

              {/* Sample Month Calendar Grid */}
              <div className="p-4 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-left">
                <div className="font-bold text-xs text-zinc-500 uppercase tracking-wider mb-3">
                  이번 달 읽기 스탬프
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {Array.from({ length: 28 }).map((_, i) => {
                    const day = i + 1;
                    const isCompleted = day <= settings.streakCount + 3;
                    return (
                      <div
                        key={day}
                        className={`aspect-square rounded-xl flex flex-col items-center justify-center text-xs font-bold transition-all ${
                          isCompleted
                            ? 'bg-amber-500 text-white shadow-xs'
                            : 'bg-white dark:bg-zinc-700 text-zinc-400 border border-zinc-200 dark:border-zinc-600'
                        }`}
                      >
                        <span>{day}</span>
                        {isCompleted && <Check className="w-3 h-3 mt-0.5 stroke-[3]" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Sub-tab 3: Daily Alarm Settings */}
          {activeSubTab === 'alarm' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-zinc-100 dark:bg-zinc-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-amber-600" />
                    <div>
                      <div className="font-bold text-sm">매일 성경 알림 설정</div>
                      <div className="text-xs text-zinc-500">
                        꾸준한 통독 습관을 위해 정해진 시간에 알림을 전달합니다
                      </div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.notificationEnabled}
                    onChange={(e) =>
                      onUpdateSettings({ notificationEnabled: e.target.checked })
                    }
                    className="w-5 h-5 rounded-md text-amber-600 focus:ring-amber-500 border-zinc-300"
                  />
                </div>

                {settings.notificationEnabled && (
                  <div className="flex items-center gap-3 pt-2 border-t border-zinc-200 dark:border-zinc-700">
                    <Clock className="w-4 h-4 text-zinc-400" />
                    <span className="text-xs text-zinc-600 dark:text-zinc-300">
                      알림 시각:
                    </span>
                    <input
                      type="time"
                      value={settings.notificationTime}
                      onChange={(e) =>
                        onUpdateSettings({ notificationTime: e.target.value })
                      }
                      className="py-1 px-3 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 font-mono text-sm"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 text-right">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-amber-600 text-white hover:bg-amber-700 text-sm font-semibold transition-colors"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
};
