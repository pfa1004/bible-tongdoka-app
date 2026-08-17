import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Play, Pause, Square, Loader2, UserCheck } from 'lucide-react';
import { fetchVoices, generateSpeechAudioUrl, VoiceOption } from '../services/ttsService';

interface BibleTTSPlayerProps {
  textToRead: string;
  title?: string;
  onVerseChange?: (verseIndex: number) => void;
}

export const BibleTTSPlayer: React.FC<BibleTTSPlayerProps> = ({ textToRead, title = '성경 읽어주기' }) => {
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('ko-KR-SunHiNeural');
  const [selectedRate, setSelectedRate] = useState<string>('+0%');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentAudioUrlRef = useRef<string | null>(null);

  useEffect(() => {
    fetchVoices().then((data) => {
      if (data && data.length > 0) {
        setVoices(data);
      }
    });

    return () => {
      if (currentAudioUrlRef.current) {
        URL.revokeObjectURL(currentAudioUrlRef.current);
      }
    };
  }, []);

  const handlePlayPause = async () => {
    setErrorMessage(null);

    // 오디오가 이미 로드되어 재생 중이면 일시 정지
    if (audioRef.current && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    // 일시정지 상태에서 다시 재생
    if (audioRef.current && !isPlaying && audioRef.current.src) {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
        return;
      } catch (err) {
        console.error('재생 실패:', err);
      }
    }

    // 새로운 음성 생성 요청
    if (!textToRead || !textToRead.strip ? !textToRead.trim() : false) {
      setErrorMessage('읽을 성경 본문이 없습니다.');
      return;
    }

    setIsLoading(true);

    try {
      if (currentAudioUrlRef.current) {
        URL.revokeObjectURL(currentAudioUrlRef.current);
      }

      const url = await generateSpeechAudioUrl(textToRead, selectedVoice, selectedRate);
      currentAudioUrlRef.current = url;

      if (!audioRef.current) {
        audioRef.current = new Audio();
      }

      audioRef.current.src = url;
      
      audioRef.current.onended = () => {
        setIsPlaying(false);
      };

      audioRef.current.onerror = () => {
        setIsPlaying(false);
        setErrorMessage('음성 재생 실패');
      };

      await audioRef.current.play();
      setIsPlaying(true);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'TTS 음성 생성을 완료할 수 없습니다. (서버 연결 확인 필요)');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
  };

  return (
    <div className="bg-slate-800/90 backdrop-blur-md text-white rounded-xl p-3 shadow-lg border border-slate-700/80 my-3 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center space-x-2">
        <div className="p-2 bg-indigo-600 rounded-lg text-white">
          <Volume2 className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <h4 className="font-semibold text-sm text-indigo-200">{title}</h4>
          <p className="text-xs text-slate-400">edge-tts AI 고음질 목소리</p>
        </div>
      </div>

      <div className="flex items-center space-x-2 flex-wrap gap-y-2">
        {/* 목소리 선택 */}
        <select
          value={selectedVoice}
          onChange={(e) => setSelectedVoice(e.target.value)}
          disabled={isLoading || isPlaying}
          className="bg-slate-900 border border-slate-700 text-xs rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          {voices.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </select>

        {/* 속도 선택 */}
        <select
          value={selectedRate}
          onChange={(e) => setSelectedRate(e.target.value)}
          disabled={isLoading || isPlaying}
          className="bg-slate-900 border border-slate-700 text-xs rounded-lg px-2 py-1.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="-20%">느리게 (-20%)</option>
          <option value="+0%">보통 (+0%)</option>
          <option value="+10%">약간 빠르게 (+10%)</option>
          <option value="+20%">빠르게 (+20%)</option>
        </select>

        {/* 재생 / 일시정지 버튼 */}
        <button
          onClick={handlePlayPause}
          disabled={isLoading}
          className="flex items-center space-x-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white font-medium text-xs px-3 py-1.5 rounded-lg transition-colors shadow-sm"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-1" />
              <span>생성 중...</span>
            </>
          ) : isPlaying ? (
            <>
              <Pause className="w-4 h-4 mr-1" />
              <span>일시정지</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-1 fill-white" />
              <span>읽어주기</span>
            </>
          )}
        </button>

        {/* 정지 버튼 */}
        {isPlaying && (
          <button
            onClick={handleStop}
            className="flex items-center space-x-1 bg-red-600/80 hover:bg-red-600 text-white font-medium text-xs px-2.5 py-1.5 rounded-lg transition-colors"
          >
            <Square className="w-3.5 h-3.5 fill-white" />
            <span>정지</span>
          </button>
        )}
      </div>

      {errorMessage && (
        <div className="w-full text-xs text-rose-400 bg-rose-950/40 border border-rose-800/50 rounded p-1.5 mt-1">
          {errorMessage}
        </div>
      )}
    </div>
  );
};
