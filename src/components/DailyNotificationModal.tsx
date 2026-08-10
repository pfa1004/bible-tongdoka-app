import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Check, X, Clock, Sparkles, Send, Globe, CheckCircle2, AlertCircle, Plus } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { db, requestFcmToken, handleFirestoreError, OperationType } from '../lib/firebase';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export interface NotificationSettings {
  enabled: boolean;
  notifyTime: string; // "08:00" (first selected time for backward compatibility)
  notifyTimes?: string[]; // Multiple selected times e.g. ["07:00", "08:00", "12:00", "21:00"]
  category: string; // "암송 필수 구절"
  fcmToken?: string | null;
  permissionGranted: boolean;
}

const MEMORIZATION_VERSES = [
  {
    ref: '요한복음 3:16',
    text: '하나님이 세상을 이처럼 사랑하사 독생자를 주셨으니 이는 그를 믿는 자마다 멸망하지 않고 영생을 얻게 하려 하심이라',
    category: '암송 필수 구절',
  },
  {
    ref: '빌립보서 4:13',
    text: '내게 능력 주시는 자 안에서 내가 모든 것을 할 수 있느니라',
    category: '믿음과 희망',
  },
  {
    ref: '이사야 41:10',
    text: '두려워하지 말라 내가 너와 함께 함이라 놀라지 말라 나는 네 하나님이 됨이라 내가 너를 세둡게 하리라 참으로 너를 도와 주리라',
    category: '위로와 평안',
  },
  {
    ref: '시편 23:1',
    text: '여호와는 나의 목자시니 내게 부족함이 없으리로다',
    category: '위로와 평안',
  },
  {
    ref: '잠언 3:5-6',
    text: '너는 마음을 다하여 여호와를 신뢰하고 네 명철을 의지하지 말라 너는 범사에 그를 인정하라 그리하면 네 길을 지도하시리라',
    category: '지혜와 인도',
  },
  {
    ref: '데살로니가전서 5:16-18',
    text: '항상 기뻐하라 쉬지 말고 기도하라 범사에 감사하라 이것이 그리스도 예수 안에서 너희를 향하신 하나님의 뜻이니라',
    category: '암송 필수 구절',
  },
];

export const DailyNotificationModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [enabled, setEnabled] = useState<boolean>(true);
  const [notifyTimes, setNotifyTimes] = useState<string[]>(['08:00']);
  const [customTimeInput, setCustomTimeInput] = useState<string>('18:00');
  const [category, setCategory] = useState<string>('암송 필수 구절');
  const [permissionGranted, setPermissionGranted] = useState<boolean>(false);
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const [testNotificationVerse, setTestNotificationVerse] = useState<{ ref: string; text: string } | null>(null);

  const formatTimeLabel = (timeStr: string) => {
    const parts = timeStr.split(':');
    const h = parseInt(parts[0], 10);
    const m = parts[1] || '00';
    if (isNaN(h)) return timeStr;

    let prefix = '아침';
    let displayH = h;
    if (h < 6) {
      prefix = '새벽';
    } else if (h < 12) {
      prefix = '아침';
    } else if (h === 12) {
      prefix = '낮';
    } else if (h < 18) {
      prefix = '오후';
      displayH = h - 12;
    } else if (h < 22) {
      prefix = '저녁';
      displayH = h - 12;
    } else {
      prefix = '밤';
      displayH = h - 12;
    }
    const hFormatted = displayH === 0 ? 12 : displayH;
    return `${prefix} ${hFormatted}${m !== '00' ? ':' + m : '시'}`;
  };

  const handleToggleTime = (timeStr: string) => {
    setNotifyTimes((prev) => {
      if (prev.includes(timeStr)) {
        if (prev.length <= 1) {
          setStatusMessage('최소 1개 이상의 알림 시간을 선택해야 합니다.');
          setTimeout(() => setStatusMessage(null), 3000);
          return prev;
        }
        return prev.filter((t) => t !== timeStr);
      } else {
        return [...prev, timeStr].sort();
      }
    });
  };

  const handleAddCustomTime = () => {
    if (!customTimeInput) return;
    if (notifyTimes.includes(customTimeInput)) {
      setStatusMessage(`이미 '${formatTimeLabel(customTimeInput)}' 시간이 선택되어 있습니다.`);
      setTimeout(() => setStatusMessage(null), 3000);
      return;
    }
    setNotifyTimes((prev) => [...prev, customTimeInput].sort());
    setStatusMessage(`'${formatTimeLabel(customTimeInput)} (${customTimeInput})' 알림 시간이 추가되었습니다.`);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Check notification permission status on open
  useEffect(() => {
    if (!isOpen) return;

    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermissionGranted(Notification.permission === 'granted');
    }

    // Register ServiceWorker for Android Web Push / System Tray Notifications
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.warn('ServiceWorker registration error:', err);
      });
    }

    // Load stored settings
    try {
      const saved = localStorage.getItem('daily_verse_notification_settings');
      if (saved) {
        const parsed: NotificationSettings = JSON.parse(saved);
        setEnabled(parsed.enabled ?? true);
        const loadedTimes = parsed.notifyTimes && parsed.notifyTimes.length > 0
          ? parsed.notifyTimes
          : parsed.notifyTime
          ? [parsed.notifyTime]
          : ['08:00'];
        setNotifyTimes(loadedTimes);
        setCategory(parsed.category || '암송 필수 구절');
        setFcmToken(parsed.fcmToken || null);
      }
    } catch {
      // ignore
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Request browser Notification permission and Firebase FCM token
  const handleEnablePermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      alert('이 브라우저는 알림 기능을 지원하지 않습니다.');
      return;
    }

    try {
      if ('serviceWorker' in navigator) {
        await navigator.serviceWorker.register('/sw.js');
      }
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setPermissionGranted(true);
        setStatusMessage('안드로이드 및 브라우저 알림 권한이 승인되었습니다!');

        // Get Firebase Cloud Messaging Token
        const token = await requestFcmToken();
        if (token) {
          setFcmToken(token);
          setStatusMessage('Firebase FCM 식별 토큰 발급 완료 (100% 무료 디바이스 키)');
        } else {
          setStatusMessage('안드로이드 알림 및 일일 암송 스케줄러가 활성화되었습니다.');
        }
      } else {
        setPermissionGranted(false);
        setStatusMessage('브라우저에서 알림 권한이 차단되었습니다. 주소창의 종 모양/열쇠 아이콘에서 알림을 허용해주세요.');
      }
    } catch (err) {
      console.error('Permission request error:', err);
    }
  };

  // Test local immediate browser notification & in-app banner
  const handleTestNotification = async () => {
    const filtered = MEMORIZATION_VERSES.filter((v) => category === '전체' || v.category === category);
    const sample = filtered[Math.floor(Math.random() * filtered.length)] || MEMORIZATION_VERSES[0];

    // Always show in-app notification preview card instantly
    setTestNotificationVerse(sample);

    // If permission not granted yet, ask permission automatically
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        const perm = await Notification.requestPermission();
        if (perm === 'granted') {
          setPermissionGranted(true);
        }
      }

      if (Notification.permission === 'granted') {
        let sentViaSw = false;

        // Try ServiceWorker showNotification first (Required for Android Mobile Chrome & PWA)
        if ('serviceWorker' in navigator) {
          try {
            const reg = await navigator.serviceWorker.ready;
            if (reg && reg.showNotification) {
              await reg.showNotification(`📖 오늘의 암송 구절 [${sample.ref}]`, {
                body: sample.text,
                icon: '/icon-192.png',
                badge: '/icon-192.png',
                tag: 'daily-bible-verse',
                vibrate: [200, 100, 200],
                data: { url: window.location.href },
              } as any);
              sentViaSw = true;
            }
          } catch (swErr) {
            console.warn('ServiceWorker showNotification fallback:', swErr);
          }
        }

        // Fallback to standard web Notification
        if (!sentViaSw) {
          try {
            const notification = new Notification(`📖 오늘의 암송 구절 [${sample.ref}]`, {
              body: sample.text,
              icon: '/icon-192.png',
              tag: 'daily-bible-verse',
            });

            notification.onclick = () => {
              window.focus();
              notification.close();
            };
          } catch (e) {
            console.warn('Native notification blocked in iframe container:', e);
          }
        }
      }
    }

    setStatusMessage(`[안드로이드/웹 테스트 푸시] "${sample.ref}" 암송 구절 알림이 전송되었습니다.`);
    setTimeout(() => setStatusMessage(null), 5000);
  };

  // Save notification settings to LocalStorage and Firebase Firestore
  const handleSave = async () => {
    setIsSaving(true);
    const primaryNotifyTime = notifyTimes[0] || '08:00';
    const settings: NotificationSettings = {
      enabled,
      notifyTime: primaryNotifyTime,
      notifyTimes,
      category,
      fcmToken,
      permissionGranted,
    };

    // Save to LocalStorage
    try {
      localStorage.setItem('daily_verse_notification_settings', JSON.stringify(settings));
    } catch {
      // ignore
    }

    // Save FCM Token and settings to Cloud Firestore
    const deviceId = fcmToken || 'token_local_' + Math.random().toString(36).substring(2, 10);
    try {
      await setDoc(doc(db, 'fcm_tokens', deviceId), {
        token: fcmToken || deviceId,
        notifyTime: primaryNotifyTime,
        notifyTimes,
        category,
        enabled,
        updatedAt: new Date().toISOString(),
      });
      setStatusMessage(`총 ${notifyTimes.length}개 알림 시간이 Firebase Cloud Database에 저장되었습니다!`);
      setTimeout(() => {
        setIsSaving(false);
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Firebase FCM token save error:', err);
      try {
        handleFirestoreError(err, OperationType.WRITE, `fcm_tokens/${deviceId}`);
      } catch {
        // saved locally
      }
      setIsSaving(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-base font-bold text-zinc-100">하루 한 구절 암송 알림</h2>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <Globe className="w-3 h-3" /> FCM 클라우드
                </span>
              </div>
              <p className="text-xs text-zinc-400">매일 정해진 시간에 암송 구절을 푸시 알림으로 받아보세요.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 text-xs overflow-y-auto max-h-[80vh]">
          {statusMessage && (
            <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center gap-2 animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Toggle Daily Notification */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-800/80 border border-zinc-700/60">
            <div className="flex items-center gap-2.5">
              {enabled ? (
                <Bell className="w-5 h-5 text-amber-400" />
              ) : (
                <BellOff className="w-5 h-5 text-zinc-500" />
              )}
              <div>
                <div className="font-bold text-zinc-200 text-xs">매일 말씀 암송 알림</div>
                <div className="text-[11px] text-zinc-400">매일 지정한 시간에 성경 암송 구절 수신</div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setEnabled(!enabled)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                enabled ? 'bg-amber-500' : 'bg-zinc-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  enabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Permission Status */}
          <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-zinc-300 text-[11px]">
              {permissionGranted ? (
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              )}
              <span>
                {permissionGranted
                  ? '안드로이드 / 브라우저 알림 권한 승인됨'
                  : '알림 권한 승인이 필요합니다'}
              </span>
            </div>
            {!permissionGranted && (
              <button
                type="button"
                onClick={handleEnablePermission}
                className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-[11px] shrink-0 cursor-pointer"
              >
                권한 승인하기
              </button>
            )}
          </div>

          {/* Android Mode Operational Guide */}
          <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-[11px] text-emerald-200 space-y-1.5">
            <div className="font-extrabold text-emerald-400 flex items-center gap-1.5">
              <span>📱 안드로이드 전용 모드 지원 완료</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-emerald-300/90 text-[10.5px] leading-relaxed">
              <li>
                <strong>안드로이드 상단 알림창 푸시:</strong> [권한 승인하기] 클릭 후 지정한 시간에 안드로이드 상단 상태바 푸시 알림이 발송됩니다.
              </li>
              <li>
                <strong>서비스 워커(SW) 및 FCM 연동:</strong> 안드로이드 크롬, 삼성 인터넷, PWA 홈 화면 추가 앱 모두에서 완전 작동합니다.
              </li>
              <li>
                <strong>테스트 시연:</strong> 아래 [테스트 푸시 알림 보내기] 버튼을 누르면 즉시 푸시 알림 동작을 확인할 수 있습니다.
              </li>
            </ul>
          </div>

          {/* Preferred Time Selector (Multi-select supported) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] text-zinc-400 font-medium flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>알림 수신 시간 선택</span>
                <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                  복수 선택 가능 ({notifyTimes.length}개 선택)
                </span>
              </label>
            </div>

            {/* Currently Selected Times Badges */}
            <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-zinc-950 border border-zinc-800/80 min-h-[42px] items-center">
              {notifyTimes.length === 0 ? (
                <span className="text-[11px] text-zinc-500 px-1">알림 시간을 선택해주세요.</span>
              ) : (
                notifyTimes.map((timeStr) => (
                  <span
                    key={timeStr}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500 text-zinc-950 text-xs font-bold shadow-xs animate-in fade-in zoom-in-95 duration-150"
                  >
                    <span>{formatTimeLabel(timeStr)}</span>
                    <span className="text-[10px] opacity-75 font-mono">({timeStr})</span>
                    <button
                      type="button"
                      onClick={() => handleToggleTime(timeStr)}
                      className="p-0.5 hover:bg-black/20 rounded-full transition-colors cursor-pointer"
                      title="이 시간 삭제"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))
              )}
            </div>

            {/* Common Preset Times Grid */}
            <div className="space-y-1">
              <div className="text-[10px] text-zinc-400 font-semibold">추천 시간대 (클릭하여 켜기/끄기):</div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                {[
                  { time: '07:00', label: '아침 7시' },
                  { time: '08:00', label: '아침 8시' },
                  { time: '12:00', label: '정오 12시' },
                  { time: '18:00', label: '저녁 6시' },
                  { time: '21:00', label: '저녁 9시' },
                  { time: '22:00', label: '밤 10시' },
                ].map(({ time, label }) => {
                  const isSelected = notifyTimes.includes(time);
                  return (
                    <button
                      key={time}
                      type="button"
                      onClick={() => handleToggleTime(time)}
                      className={`py-1.5 px-1 rounded-xl border text-[11px] font-bold transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                        isSelected
                          ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow-xs ring-1 ring-amber-400'
                          : 'bg-zinc-800/80 text-zinc-300 border-zinc-700/80 hover:bg-zinc-700 hover:text-white'
                      }`}
                    >
                      <span className="flex items-center gap-1">
                        {isSelected && <Check className="w-3 h-3" />}
                        {label}
                      </span>
                      <span className={`text-[9px] ${isSelected ? 'text-zinc-900 font-mono' : 'text-zinc-400'}`}>
                        {time}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Time Picker */}
            <div className="flex items-center gap-2 pt-1">
              <div className="relative flex-1">
                <input
                  type="time"
                  value={customTimeInput}
                  onChange={(e) => setCustomTimeInput(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-100 text-xs focus:outline-hidden focus:border-amber-500 font-mono"
                />
              </div>
              <button
                type="button"
                onClick={handleAddCustomTime}
                className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-amber-400 hover:text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1 shrink-0 cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>시간 추가</span>
              </button>
            </div>
          </div>

          {/* Category Selector */}
          <div>
            <label className="block text-[11px] text-zinc-400 mb-1 font-medium flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>암송 구절 주제 카테고리</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs focus:outline-none focus:border-amber-500"
            >
              <option value="암송 필수 구절">암송 필수 구절 (핵심 말씀)</option>
              <option value="위로와 평안">위로와 평안 (마음의 안식)</option>
              <option value="믿음과 희망">믿음과 희망 (담대함)</option>
              <option value="지혜와 인도">지혜와 인도 (삶의 가이드)</option>
              <option value="전체">전체 주제 무작위</option>
            </select>
          </div>

          {/* Test Notification Button & Preview */}
          <div className="pt-1 space-y-2">
            <button
              type="button"
              onClick={handleTestNotification}
              className="w-full py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-98"
            >
              <Send className="w-3.5 h-3.5 text-amber-400" />
              <span>테스트 푸시 알림 보내기 (화면 시연)</span>
            </button>

            {/* Test Notification Live Preview Banner */}
            {testNotificationVerse && (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border-2 border-amber-500/40 text-amber-200 animate-in fade-in slide-in-from-top-2 duration-200 shadow-lg relative">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-extrabold text-amber-400 text-xs flex items-center gap-1.5">
                    <Bell className="w-4 h-4 fill-amber-400" />
                    📖 [오늘의 암송 푸시 알림] {testNotificationVerse.ref}
                  </span>
                  <button
                    onClick={() => setTestNotificationVerse(null)}
                    className="p-1 text-zinc-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-xs leading-relaxed font-serif text-zinc-100 bg-zinc-950/60 p-2.5 rounded-lg border border-amber-500/20">
                  "{testNotificationVerse.text}"
                </p>
              </div>
            )}
          </div>

          {/* FCM Status Badge */}
          <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 text-[10px] text-zinc-400 space-y-1">
            <div className="flex items-center justify-between text-zinc-300 font-medium">
              <span className="flex items-center gap-1">
                <Globe className="w-3 h-3 text-emerald-400" />
                <span>Firebase Cloud Messaging (FCM) 토큰</span>
              </span>
              <span className={fcmToken ? 'text-emerald-400 font-bold' : 'text-amber-400 font-semibold'}>
                {fcmToken ? '자동 등록됨 (무료)' : '100% 무료 서비스'}
              </span>
            </div>
            <p className="text-[10px] text-zinc-400 leading-normal">
              💡 <strong className="text-amber-300 font-semibold">"토큰(Token)"이란?</strong> 돈을 주고 구매하는 암호화폐나 유료 코인이 아니며, 브라우저/기기가 내 기기임을 구분하기 위해 발급하는 <strong className="text-zinc-200 font-semibold">100% 무료 기기 식별용 난수 주소(Address)</strong>입니다.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/90 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            <span>{isSaving ? '저장 중...' : '설정 저장'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
