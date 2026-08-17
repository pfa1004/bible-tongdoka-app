import React, { useState, useRef, useCallback } from 'react';
import { VerseCardConfig } from '../types';
import {
  HeartHandshake,
  Sparkles,
  Download,
  Share2,
  Type,
  Palette,
  Image as ImageIcon,
  Check,
  RefreshCw,
  Copy,
  Loader2,
  X,
  Move,
  Eye,
} from 'lucide-react';
import {
  downloadImage,
  shareToSNS,
} from '../utils/shareUtils';

// 카드 Canvas 직접 렌더링 함수 (외부 라이브러리 의존 없이 100% 안정적 동작)
async function renderCardToBlob(config: {
  backgroundImageStyle: string;
  overlayOpacity: number;
  textColor: string;
  verseText: string;
  scriptureRef: string;
  fontSize: number;
  fontFamily: string;
  cardSize?: '1800x700' | '1800x2000' | '1800x4000';
  textPositionX?: number;
  textPositionY?: number;
}): Promise<Blob | null> {
  const isLongCard = config.cardSize === '1800x4000';
  const W = 1800;
  const H = config.cardSize === '1800x4000' ? 4000 : config.cardSize === '1800x2000' ? 2000 : 700;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // 1. 배경 그리기 (업로드 이미지 or 그라디언트)
  const bgStyle = config.backgroundImageStyle;
  if (bgStyle.startsWith('url(')) {
    // 사용자 업로드 이미지 (data URL)
    const urlMatch = bgStyle.match(/url\(['"]?(data:[^'"]+)['"]?\)/);
    if (urlMatch) {
      await new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => {
          // 사용자가 선택한 카드 크기(W x H) 전체에 맞게 이미지를 정확히 리사이즈하여 채움
          ctx.drawImage(img, 0, 0, W, H);
          resolve();
        };
        img.onerror = () => resolve();
        img.src = urlMatch[1];
      });
    }
  } else if (bgStyle.includes('linear-gradient')) {
    // linear-gradient 파싱: 색상값만 추출
    const colorRegex = /#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3}/g;
    const colors = bgStyle.match(colorRegex) || ['#1e3a8a', '#3b82f6', '#93c5fd'];
    // 방향 파싱
    const angleMatch = bgStyle.match(/(\d+)deg/);
    const angle = angleMatch ? parseInt(angleMatch[1]) : 135;
    const rad = (angle - 90) * Math.PI / 180;
    const cx = W / 2; const cy = H / 2;
    const len = Math.sqrt(W * W + H * H) / 2;
    const x0 = cx - Math.cos(rad) * len;
    const y0 = cy - Math.sin(rad) * len;
    const x1 = cx + Math.cos(rad) * len;
    const y1 = cy + Math.sin(rad) * len;
    const grad = ctx.createLinearGradient(x0, y0, x1, y1);
    colors.forEach((c, i) => grad.addColorStop(i / (colors.length - 1), c));
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  } else {
    // 단색 fallback
    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(0, 0, W, H);
  }

  // 2. 어두운 오버레이
  ctx.fillStyle = `rgba(0,0,0,${config.overlayOpacity ?? 0.3})`;
  ctx.fillRect(0, 0, W, H);

  const sideMargin = 80;

  // 3. 상단 텍스트 (사용자 요청으로 '오늘의 말씀', '성경장절' 표식 제거됨)

  // 4. 본문 말씀 (줄바꿈 처리)
  // 미리보기 렌더링 비율과 동일하도록 글자 크기 스케일 조율
  const fontSize = Math.round((config.fontSize || 20) * (W / 400));
  ctx.font = `bold ${fontSize}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = config.textColor || '#ffffff';
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 10;

  const maxWidth = W * 0.8;
  const lineHeight = Math.round(fontSize * 1.6);
  const paragraphs = (config.verseText || '').split('\n');
  const lines: string[] = [];
  for (const para of paragraphs) {
    if (!para.trim()) {
      lines.push('');
      continue;
    }
    const chars = para.split('');
    let line = '';
    for (const ch of chars) {
      const test = line + ch;
      if (ctx.measureText(test).width > maxWidth && line !== '') {
        lines.push(line);
        line = ch;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
  }

  // 미리보기(CSS)의 left/top % 및 transform(-50%, -50%)와 100% 동일한 정중앙 위치 좌표 계산
  const posX = (config.textPositionX ?? 0.5) * W;
  const posY = (config.textPositionY ?? 0.5) * H;

  // 전체 텍스트 블록 높이 (본문 줄들 + 출처 구절 줄들 - fontSize에 맞춰 동적 조절)
  const refFontSize = Math.max(16, Math.round(fontSize * 0.7));
  const refLineHeight = Math.round(refFontSize * 1.5);
  const refLines = (config.scriptureRef || '').split('\n');
  const refTotalHeight = refLines.length * refLineHeight;

  const bodyHeight = lines.length * lineHeight;
  const totalBlockHeight = bodyHeight + refTotalHeight;

  // 전체 블록의 시작 Y 위치 (정중앙 렌더링)
  let startY = posY - (totalBlockHeight / 2);

  // 1) 본문 말씀
  ctx.font = `bold ${fontSize}px serif`;
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 10;
  let currentY = startY + (lineHeight / 2);
  for (const l of lines) {
    ctx.fillText(l, posX, currentY);
    currentY += lineHeight;
  }

  // 3) 하단 성경 구절 (2번째 이미지 미리보기와 100% 동일하게 엔터키 줄바꿈 반영)
  ctx.shadowBlur = 0;
  
  // 사용자가 선택한 캘리그라피 폰트명을 Canvas Context에 매핑하여 동일한 분위기 연출
  const fontName = config.fontFamily === 'font-sans' ? 'sans-serif' :
                   config.fontFamily === 'font-flow' ? 'cursive' :
                   config.fontFamily === 'font-warm' ? 'fantasy' : 'serif';
  
  ctx.font = `bold ${refFontSize}px ${fontName}`;
  ctx.globalAlpha = 0.9;
  let refY = currentY + (refLineHeight / 3);
  for (const rLine of refLines) {
    ctx.fillText(rLine, posX, refY);
    refY += refLineHeight;
  }
  ctx.globalAlpha = 1;

  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png', 1.0));
}

interface Props {
  initialVerseText?: string;
  initialScriptureRef?: string;
  onClose?: () => void;
}

const CALLIGRAPHY_FONTS = [
  { id: 'font-serif', name: '정갈한 명조', class: 'font-serif font-bold' },
  { id: 'font-sans', name: '모던 고딕', class: 'font-sans font-bold tracking-tight' },
  { id: 'font-flow', name: '자연스러운 흘림체', class: 'font-serif font-light' },
  { id: 'font-warm', name: '따뜻한 감성체', class: 'font-sans font-medium' },
];

const PRESET_VERSES = [
  {
    ref: '여호수아 1:9',
    text: '내가 네게 명령한 것이 아니냐 강하고 담대하라 두려워하지 말며 놀라지 말라 네가 어디로 가든지 네 하나님 여호와가 너와 함께 하느니라',
    theme: 'comfort',
  },
  {
    ref: '이사야 41:10',
    text: '두려워하지 말라 내가 너와 함께 함이라 놀라지 말라 나는 네 하나님이 됨이라 내가 너를 굳세게 하리라 참으로 너를 도와 주리라',
    theme: 'peace',
  },
  {
    ref: '빌립보서 4:6-7',
    text: '아무 것도 염려하지 말고 다만 모든 일에 기도와 간구로, 너희 구할 것을 감사함으로 하나님께 아뢰라',
    theme: 'gratitude',
  },
  {
    ref: '시편 23:1-2',
    text: '여호와는 나의 목자시니 내게 부족함이 없으리로다 그가 나를 푸른 밭에 누이시며 쉬어갈 만한 물 가로 인도하시는도다',
    theme: 'spring',
  },
  {
    ref: '데살로니가전서 5:16-18',
    text: '항상 기뻐하라 쉬지 말고 기도하라 범사에 감사하라 이것이 그리스도 예수 안에서 너희를 향하신 하나님의 뜻이니라',
    theme: 'hope',
  },
  {
    ref: '요한복음 14:27',
    text: '평안을 너희에게 미치노니 곧 나의 평안을 너희에게 주노라 내가 너희에게 주는 것은 세상이 주는 것과 같지 아니하니라 너희는 마음에 근심하지도 말고 두려워하지도 말라',
    theme: 'comfort',
  },
];

export const TodayWordTab: React.FC<Props> = ({
  initialVerseText,
  initialScriptureRef,
  onClose,
}) => {
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);
  const cardRef = useRef<HTMLDivElement>(null);

  const [cardConfig, setCardConfig] = useState<VerseCardConfig>({
    verseText:
      initialVerseText ||
      '여호와는 나의 목자시니 내게 부족함이 없으리로다 그가 나를 푸른 밭에 누이시며 쉬어갈 만한 물 가로 인도하시는도다',
    scriptureRef: initialScriptureRef || '시편 23:1-2',
    theme: 'spring',
    fontFamily: CALLIGRAPHY_FONTS[0].id,
    fontSize: 20,
    textAlign: 'center',
    textColor: '#ffffff',
    backgroundColor: '#92400e',
    backgroundImageStyle:
      'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #93c5fd 100%)',
    overlayOpacity: 0.3,
    showSignature: true,
    signatureText: '성경통독 365 말씀카드',
    cardSize: '1800x700',
    textPositionX: undefined,
    textPositionY: undefined,
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  // 미리보기 모달 상태 및 수정 취소용 백업
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const previewBackupRef = useRef<VerseCardConfig | null>(null);

  const handleOpenPreviewModal = () => {
    previewBackupRef.current = { ...cardConfig };
    setShowPreviewModal(true);
  };

  const handleCancelPreviewModal = () => {
    if (previewBackupRef.current) {
      setCardConfig(previewBackupRef.current);
    }
    setShowPreviewModal(false);
  };
  // 미리보기 모달이 열려 있는 동안 모바일 브라우저 전체 바디 스크롤 및 지면 흔들림 100% 완전 차단
  React.useEffect(() => {
    if (!showPreviewModal) return;

    const originalOverflow = document.body.style.overflow;
    const originalTouchAction = document.body.style.touchAction;

    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    const preventTouchMove = (e: TouchEvent) => {
      if (e.cancelable) {
        e.preventDefault();
      }
    };

    window.addEventListener('touchmove', preventTouchMove, { passive: false });

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.touchAction = originalTouchAction;
      window.removeEventListener('touchmove', preventTouchMove);
    };
  }, [showPreviewModal]);

  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ startX: number; startY: number; origPosX: number; origPosY: number } | null>(null);
  const touchDistRef = useRef<{ initialDist: number; initialFontSize: number } | null>(null);

  // 두 터치점 사이 거리 계산
  const getTouchDistance = (t1: React.Touch | Touch, t2: React.Touch | Touch) => {
    const dx = t1.clientX - t2.clientX;
    const dy = t1.clientY - t2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // 미리보기 모달 내 드래그 / 핀치 줌 시작
  const handleDragStart = useCallback((clientX: number, clientY: number) => {
    setIsDragging(true);
    dragStartRef.current = {
      startX: clientX,
      startY: clientY,
      origPosX: cardConfig.textPositionX ?? 0.5,
      origPosY: cardConfig.textPositionY ?? 0.5,
    };
  }, [cardConfig.textPositionX, cardConfig.textPositionY]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // 두 손가락 핀치 줌 시작
      const dist = getTouchDistance(e.touches[0], e.touches[1]);
      touchDistRef.current = {
        initialDist: dist,
        initialFontSize: cardConfig.fontSize || 20,
      };
      setIsDragging(false);
    } else if (e.touches.length === 1) {
      touchDistRef.current = null;
      handleDragStart(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, [cardConfig.fontSize, handleDragStart]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchDistRef.current) {
      if (e.cancelable) e.preventDefault();
      // 핀치 줌으로 글자 크기 변경 (10px ~ 48px)
      const currentDist = getTouchDistance(e.touches[0], e.touches[1]);
      const scale = currentDist / touchDistRef.current.initialDist;
      const newFontSize = Math.max(10, Math.min(48, Math.round(touchDistRef.current.initialFontSize * scale)));
      setCardConfig(prev => ({ ...prev, fontSize: newFontSize }));
    } else if (e.touches.length === 1 && isDragging && dragStartRef.current && previewContainerRef.current) {
      if (e.cancelable) e.preventDefault();
      const rect = previewContainerRef.current.getBoundingClientRect();
      const deltaX = (e.touches[0].clientX - dragStartRef.current.startX) / rect.width;
      const deltaY = (e.touches[0].clientY - dragStartRef.current.startY) / rect.height;
      const newX = Math.max(0.05, Math.min(0.95, dragStartRef.current.origPosX + deltaX));
      const newY = Math.max(0.05, Math.min(0.95, dragStartRef.current.origPosY + deltaY));
      setCardConfig(prev => ({ ...prev, textPositionX: newX, textPositionY: newY }));
    }
  }, [isDragging]);

  // 마우스 휠로 글자 크기 변경 (PC 편의성)
  const handleWheelZoom = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 1 : -1;
    setCardConfig(prev => ({
      ...prev,
      fontSize: Math.max(10, Math.min(48, (prev.fontSize || 20) + delta)),
    }));
  }, []);

  // 드래그 이동 (마우스 전용)
  const handleDragMove = useCallback((clientX: number, clientY: number) => {
    if (!isDragging || !dragStartRef.current || !previewContainerRef.current) return;
    const rect = previewContainerRef.current.getBoundingClientRect();
    const deltaX = (clientX - dragStartRef.current.startX) / rect.width;
    const deltaY = (clientY - dragStartRef.current.startY) / rect.height;
    const newX = Math.max(0.05, Math.min(0.95, dragStartRef.current.origPosX + deltaX));
    const newY = Math.max(0.05, Math.min(0.95, dragStartRef.current.origPosY + deltaY));
    setCardConfig(prev => ({ ...prev, textPositionX: newX, textPositionY: newY }));
  }, [isDragging]);

  // 드래그/핀치 종료
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    dragStartRef.current = null;
    touchDistRef.current = null;
  }, []);

  const themeStyles = {
    spring: 'linear-gradient(135deg, #059669 0%, #10b981 50%, #a7f3d0 100%)',
    summer: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 50%, #bae6fd 100%)',
    autumn: 'linear-gradient(135deg, #b45309 0%, #f59e0b 50%, #fef3c7 100%)',
    winter: 'linear-gradient(135deg, #334155 0%, #64748b 50%, #e2e8f0 100%)',
    comfort: 'linear-gradient(135deg, #4c1d95 0%, #8b5cf6 50%, #ddd6fe 100%)',
    gratitude: 'linear-gradient(135deg, #831843 0%, #f43f5e 50%, #fecdd3 100%)',
    peace: 'linear-gradient(135deg, #14532d 0%, #22c55e 50%, #bbf7d0 100%)',
    hope: 'linear-gradient(135deg, #78350f 0%, #d97706 50%, #fef3c7 100%)',
    nature: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
  };

  const getFontClass = (fontId: string) => {
    const found = CALLIGRAPHY_FONTS.find((f) => f.id === fontId);
    return found ? found.class : 'font-serif';
  };

  const handleDownloadCard = async () => {
    if (!cardRef.current) return;
    setIsGenerating(true);
    try {
      // 카드 설정으로 Canvas에 직접 그려 이미지 생성
      const blob = await renderCardToBlob(cardConfig);

      if (blob) {
        const cleanRef = cardConfig.scriptureRef.replace(/[^a-zA-Z0-9가-힣]/g, '_');
        const filename = `말씀카드_${cleanRef}.png`;
        downloadImage(blob, filename);
        setNoticeMessage(`'${filename}' 이미지가 다운로드되었습니다!`);
        setTimeout(() => setNoticeMessage(null), 4000);
      } else {
        alert('말씀 카드 이미지 생성 실패');
      }
    } catch (e) {
      console.error(e);
      alert(`말씀 카드 이미지 다운로드 실패: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShareCard = async () => {
    if (!cardRef.current) return;
    setIsGenerating(true);
    try {
      const blob = await renderCardToBlob(cardConfig);

      const cleanRef = cardConfig.scriptureRef.replace(/[^a-zA-Z0-9가-힣]/g, '_');
      const filename = `말씀카드_${cleanRef}.png`;
      const shareText = `✝️ 오늘의 말씀 | ${cardConfig.scriptureRef}\n\n"${cardConfig.verseText}"\n\n📖 성경통독 365`;

      const result = await shareToSNS(
        `[오늘의 말씀] ${cardConfig.scriptureRef}`,
        shareText,
        blob,
        filename
      );

      if (result.method === 'native_share') {
        setNoticeMessage('말씀 텍스트가 복사되었습니다. 카카오톡 등에서 붙여넣기 해주세요!');
      } else if (result.method === 'download' || result.method === 'clipboard') {
        setNoticeMessage('말씀 텍스트 복사 & 이미지 다운로드 완료! 카카오톡 대화창에 붙여넣어 공유하세요.');
      }
      setTimeout(() => setNoticeMessage(null), 5000);
    } catch (e) {
      console.error(e);
      alert(`공유하기 실패: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // 카드 비율 계산
  const getAspectRatio = () => {
    if (cardConfig.cardSize === '1800x4000') return '1800 / 4000';
    if (cardConfig.cardSize === '1800x2000') return '1800 / 2000';
    return '1800 / 700';
  };

  // 미리보기용 카드 렌더 (공통)
  const renderPreviewCard = (isDragEnabled: boolean, containerRef?: React.RefObject<HTMLDivElement | null>) => (
    <div
      ref={(el) => {
        if (containerRef) (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
        if (!isDragEnabled) (cardRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
      }}
      style={{
        background: cardConfig.backgroundImageStyle,
        backgroundSize: '100% 100%',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        aspectRatio: getAspectRatio(),
        color: cardConfig.textColor || '#ffffff',
        userSelect: 'none',
      }}
      className="w-full h-full rounded-2xl shadow-2xl relative overflow-hidden border border-white/20 text-white"
    >
      {/* Background Overlay */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-[1px] pointer-events-none"
        style={{ opacity: cardConfig.overlayOpacity }}
      />

      {/* 말씀 텍스트 - absolute 배치 (드래그 위치 반영) */}
      <div
        className="absolute z-10 text-center select-none"
        style={{
          color: cardConfig.textColor || '#ffffff',
          left: `${(cardConfig.textPositionX ?? 0.5) * 100}%`,
          top: `${(cardConfig.textPositionY ?? 0.5) * 100}%`,
          transform: 'translate(-50%, -50%)',
          width: '80%',
          maxWidth: '90%',
          cursor: isDragEnabled ? (isDragging ? 'grabbing' : 'grab') : 'default',
          padding: '12px',
        }}
        onMouseDown={isDragEnabled ? (e) => { e.preventDefault(); e.stopPropagation(); handleDragStart(e.clientX, e.clientY); } : undefined}
        onTouchStart={isDragEnabled ? handleTouchStart : undefined}
        onWheel={isDragEnabled ? handleWheelZoom : undefined}
      >
        <div
          contentEditable={true}
          suppressContentEditableWarning
          onBlur={(e) => {
            const html = e.currentTarget.innerHTML;
            let converted = html.replace(/<br\s*\/?>/gi, '\n')
                                .replace(/<\/div>/gi, '')
                                .replace(/<div>/gi, '\n')
                                .replace(/&nbsp;/g, ' ')
                                .replace(/&lt;/g, '<')
                                .replace(/&gt;/g, '>')
                                .replace(/&amp;/g, '&');
            const temp = document.createElement('div');
            temp.innerHTML = converted;
            const cleanText = temp.innerText || temp.textContent || '';
            setCardConfig((prev) => ({ ...prev, verseText: cleanText }));
          }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            color: cardConfig.textColor || '#ffffff',
            fontSize: `${cardConfig.fontSize || 18}px`,
            lineHeight: '1.6',
          }}
          className={`tracking-wide drop-shadow-md outline-none focus:ring-2 focus:ring-amber-400 focus:bg-black/40 rounded-lg p-2 transition-all cursor-text hover:ring-1 hover:ring-amber-300/60 whitespace-pre-line ${getFontClass(cardConfig.fontFamily)}`}
          title="터치/클릭하여 말씀 글자를 직접 수정하세요"
        >
          {cardConfig.verseText}
        </div>
        <div
          contentEditable={true}
          suppressContentEditableWarning
          onBlur={(e) => {
            const html = e.currentTarget.innerHTML;
            let converted = html.replace(/<br\s*\/?>/gi, '\n')
                                .replace(/<\/div>/gi, '')
                                .replace(/<div>/gi, '\n')
                                .replace(/&nbsp;/g, ' ')
                                .replace(/&lt;/g, '<')
                                .replace(/&gt;/g, '>')
                                .replace(/&amp;/g, '&');
            const temp = document.createElement('div');
            temp.innerHTML = converted;
            const cleanRef = temp.innerText || temp.textContent || '';
            setCardConfig((prev) => ({ ...prev, scriptureRef: cleanRef }));
          }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          className="font-semibold opacity-90 tracking-widest pt-1.5 outline-none focus:ring-2 focus:ring-amber-400 focus:bg-black/40 rounded-md transition-all cursor-text hover:ring-1 hover:ring-amber-300/60 whitespace-pre-line"
          style={{
            color: cardConfig.textColor || '#ffffff',
            fontSize: `${Math.max(10, Math.round((cardConfig.fontSize || 18) * 0.7))}px`,
          }}
          title="터치/클릭하여 성경 구절을 직접 수정하세요"
        >
          {cardConfig.scriptureRef}
        </div>
      </div>

      {/* 드래그 가이드 테두리 표시 */}
      {isDragEnabled && (
        <div
          className="absolute z-20 border-2 border-dashed border-amber-400/60 rounded-lg pointer-events-none"
          style={{
            left: `${(cardConfig.textPositionX ?? 0.5) * 100}%`,
            top: `${(cardConfig.textPositionY ?? 0.5) * 100}%`,
            transform: 'translate(-50%, -50%)',
            width: '82%',
            height: 'auto',
            minHeight: '30%',
            maxHeight: '70%',
          }}
        />
      )}
    </div>
  );

  return (
    <div className="space-y-1.5 p-0">
      {/* 1. 간단 미리보기 + 미리보기 버튼 (상단 고정 Sticky) */}
      <div className="sticky top-0 z-30 bg-[#0f172a] rounded-2xl border border-slate-800 p-2.5 relative overflow-hidden h-[220px] sm:h-[260px] flex flex-col items-center justify-center shadow-lg">
        {/* Close (X) Button at Top Right */}
        <button
          onClick={() => {
            if (onClose) {
              onClose();
            } else {
              window.location.hash = '';
            }
          }}
          className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white z-20 transition-all cursor-pointer shadow-md"
          title="말씀 카드 닫기 (성경 읽기로 이동)"
        >
          <X className="w-4 h-4" />
        </button>

        {/* 미리보기 열기 버튼 */}
        <button
          onClick={handleOpenPreviewModal}
          className="absolute top-2.5 left-2.5 p-1.5 rounded-full bg-amber-500/90 hover:bg-amber-500 text-zinc-950 z-20 transition-all cursor-pointer shadow-md flex items-center gap-1 text-[10px] font-bold px-2.5"
          title="미리보기 열기 (글자 직접 수정 / 드래그로 말씀 위치 조정)"
        >
          <Eye className="w-3.5 h-3.5" /> 미리보기
        </button>

        {/* 간단 카드 프레임 (드래그 불가, 미리보기용) */}
        <div className="w-full max-w-md h-full flex items-center justify-center">
          {renderPreviewCard(false)}
        </div>
      </div>

      {/* ===== 미리보기 모달 (전체화면 - 실제 비율 & 드래그로 위치/크기 조정) ===== */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4 touch-none overscroll-none select-none"
          onMouseMove={(e) => handleDragMove(e.clientX, e.clientY)}
          onMouseUp={handleDragEnd}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleDragEnd}
        >
          {/* 상단 툴바 */}
          <div className="w-full max-w-lg flex items-center justify-between mb-3 gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCardConfig(prev => ({ ...prev, textPositionX: undefined, textPositionY: undefined, fontSize: 20 }))}
                className="py-1.5 px-3 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-white text-[11px] font-bold flex items-center gap-1.5 cursor-pointer transition-all shrink-0"
              >
                <RefreshCw className="w-3 h-3" /> 초기화
              </button>
              <span className="text-zinc-300 text-[10px] font-medium hidden sm:inline">
                ✨ 글자 터치(수정) | 드래그(위치) | 핀치(크기)
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={handleCancelPreviewModal}
                className="py-1.5 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all border border-zinc-700"
                title="수정 취소하고 이전 상태로 되돌리기"
              >
                <X className="w-3.5 h-3.5 text-zinc-400" /> 취소
              </button>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="py-1.5 px-3.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all shadow-xs"
                title="수정 완료하고 적용하기"
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" /> 완료
              </button>
            </div>
          </div>

          {/* 카드 미리보기 (실제 비율, 스크롤 가능) */}
          <div className="flex-1 w-full max-w-lg overflow-y-auto flex items-start justify-center pb-4 scrollbar-thin">
            <div className="w-full" style={{ maxWidth: cardConfig.cardSize === '1800x4000' ? '320px' : '100%' }}>
              {renderPreviewCard(true, previewContainerRef)}
            </div>
          </div>



          {/* 하단 안내 */}
          <div className="text-zinc-400 text-[10px] flex items-center gap-1.5 mt-1.5 font-medium">
            <Move className="w-3.5 h-3.5 text-amber-400" /> 한 손가락: 말씀 위치 이동 | 두 손가락(핀치)/마우스 휠: 글자 크기 조절
          </div>
        </div>
      )}

      {/* 3-Step Wizard Navigation */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-3">
        <button
          onClick={() => setActiveStep(1)}
          className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
            activeStep === 1
              ? 'bg-amber-500 text-zinc-950 font-bold border-amber-500 shadow-xs'
              : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
          }`}
        >
          <span className="text-[9px] uppercase font-mono block">Step 1</span>
          <span className="text-xs font-bold">1.말씀구절</span>
        </button>

        <button
          onClick={() => setActiveStep(2)}
          className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
            activeStep === 2
              ? 'bg-amber-500 text-zinc-950 font-bold border-amber-500 shadow-xs'
              : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
          }`}
        >
          <span className="text-[9px] uppercase font-mono block">Step 2</span>
          <span className="text-xs font-bold">2.테마&서체</span>
        </button>

        <button
          onClick={() => setActiveStep(3)}
          className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
            activeStep === 3
              ? 'bg-amber-500 text-zinc-950 font-bold border-amber-500 shadow-xs'
              : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
          }`}
        >
          <span className="text-[9px] uppercase font-mono block">Step 3</span>
          <span className="text-xs font-bold">3.카드공유</span>
        </button>
      </div>

      {/* Main Builder Area */}
      <div className="w-full">
        {/* Step Controls Panel */}
        <div className="w-full bg-white dark:bg-zinc-900 p-3.5 sm:p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-3">
          {/* STEP 1: Select Verse */}
          {activeStep === 1 && (
            <div className="space-y-3">
              <h3 className="font-bold text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5 text-amber-600" />
                <span>성구 입력 및 추천 말씀 선택</span>
              </h3>

              {/* Preset recommendations (Scrollable list when items increase) */}
              <div>
                <label className="text-[11px] text-zinc-500 block mb-1.5 font-medium">
                  추천 오늘의 말씀 선택:
                </label>
                <div className="space-y-1.5 max-h-80 sm:max-h-96 overflow-y-auto pr-1 scrollbar-thin">
                  {PRESET_VERSES.map((pv, i) => (
                    <button
                      key={i}
                      onClick={() =>
                        setCardConfig({
                          ...cardConfig,
                          verseText: pv.text,
                          scriptureRef: pv.ref,
                          theme: pv.theme as any,
                          backgroundImageStyle: themeStyles[pv.theme as keyof typeof themeStyles],
                        })
                      }
                      className="w-full text-left p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 hover:bg-amber-50 dark:hover:bg-amber-950/30 text-xs border border-zinc-200 dark:border-zinc-700 transition-colors cursor-pointer"
                    >
                      <span className="font-bold text-amber-600 dark:text-amber-400 block">
                        {pv.ref}
                      </span>
                      <span className="line-clamp-1 text-zinc-600 dark:text-zinc-300">
                        {pv.text}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom verse text input */}
              <div className="space-y-1.5 pt-1">
                <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                  직접 말씀 문구 수정
                </label>
                <textarea
                  rows={2}
                  value={cardConfig.verseText}
                  onChange={(e) =>
                    setCardConfig({ ...cardConfig, verseText: e.target.value })
                  }
                  className="w-full p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                  성경 출처
                </label>
                <input
                  type="text"
                  value={cardConfig.scriptureRef}
                  onChange={(e) =>
                    setCardConfig({ ...cardConfig, scriptureRef: e.target.value })
                  }
                  className="w-full p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <button
                onClick={() => setActiveStep(2)}
                className="w-full py-2 rounded-xl bg-amber-600 text-white font-bold text-xs hover:bg-amber-700 transition-colors cursor-pointer"
              >
                다음: 테마 & 서체 디자인 설정
              </button>
            </div>
          )}

          {/* STEP 2: Themes & Calligraphy Fonts */}
          {activeStep === 2 && (
            <div className="space-y-3">
              <h3 className="font-bold text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-amber-600" />
                <span>8종 손글씨 서체 & 절기 테마</span>
              </h3>

              {/* Font Color & Font Size Selectors Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* Font Color Selector (White vs Black) */}
                <div className="p-2 sm:p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 space-y-1.5">
                  <label className="text-xs font-extrabold text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                    <span>🎨 글자 색상 선택:</span>
                    <span className="text-[10px] text-zinc-500 font-normal">순백색 / 검정색</span>
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setCardConfig({ ...cardConfig, textColor: '#ffffff' })}
                      className={`flex items-center justify-center gap-1.5 p-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                        cardConfig.textColor === '#ffffff' || !cardConfig.textColor
                          ? 'border-amber-600 bg-amber-50 dark:bg-amber-950/40 text-amber-950 dark:text-amber-200 shadow-xs'
                          : 'border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50'
                      }`}
                    >
                      <span className="w-3 h-3 rounded-full bg-white border border-zinc-300 shadow-xs shrink-0" />
                      <span>순백색</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCardConfig({ ...cardConfig, textColor: '#18181b' })}
                      className={`flex items-center justify-center gap-1.5 p-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                        cardConfig.textColor === '#18181b'
                          ? 'border-amber-600 bg-amber-50 dark:bg-amber-950/40 text-amber-950 dark:text-amber-200 shadow-xs'
                          : 'border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50'
                      }`}
                    >
                      <span className="w-3 h-3 rounded-full bg-zinc-900 border border-zinc-700 shadow-xs shrink-0" />
                      <span>검정색</span>
                    </button>
                  </div>
                </div>

                {/* Font Size Selector (14px, 18px, 22px, 26px) */}
                <div className="p-2 sm:p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 space-y-1.5">
                  <label className="text-xs font-extrabold text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                    <span>🔤 글자 크기 지정:</span>
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">{cardConfig.fontSize || 18}px</span>
                  </label>
                  <div className="grid grid-cols-4 gap-1">
                    {[
                      { label: '작게', size: 14 },
                      { label: '보통', size: 18 },
                      { label: '크게', size: 22 },
                      { label: '최대', size: 26 },
                    ].map((s) => (
                      <button
                        key={s.size}
                        type="button"
                        onClick={() => setCardConfig({ ...cardConfig, fontSize: s.size })}
                        className={`py-1 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                          (cardConfig.fontSize || 18) === s.size
                            ? 'border-amber-600 bg-amber-500 text-zinc-950 shadow-xs'
                            : 'border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Card Size Selector (1800x700 vs 1800x2000 vs 1800x4000) */}
                <div className="p-2 sm:p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-extrabold text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                    <span>📐 카드 크기(비율) 선택:</span>
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setCardConfig({ ...cardConfig, cardSize: '1800x700' })}
                      className={`py-1.5 text-[11px] font-bold rounded-lg border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                        cardConfig.cardSize === '1800x700' || !cardConfig.cardSize
                          ? 'border-amber-600 bg-amber-50 dark:bg-amber-950/40 text-amber-950 dark:text-amber-200 shadow-xs'
                          : 'border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50'
                      }`}
                    >
                      <span className="w-3.5 h-2 border-2 border-current rounded-sm opacity-70"></span>
                      1800×700
                    </button>
                    <button
                      type="button"
                      onClick={() => setCardConfig({ ...cardConfig, cardSize: '1800x2000' })}
                      className={`py-1.5 text-[11px] font-bold rounded-lg border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                        cardConfig.cardSize === '1800x2000'
                          ? 'border-amber-600 bg-amber-50 dark:bg-amber-950/40 text-amber-950 dark:text-amber-200 shadow-xs'
                          : 'border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50'
                      }`}
                    >
                      <span className="w-3.5 h-2.5 border-2 border-current rounded-sm opacity-70"></span>
                      1800×2000
                    </button>
                    <button
                      type="button"
                      onClick={() => setCardConfig({ ...cardConfig, cardSize: '1800x4000' })}
                      className={`py-1.5 text-[11px] font-bold rounded-lg border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                        cardConfig.cardSize === '1800x4000'
                          ? 'border-amber-600 bg-amber-50 dark:bg-amber-950/40 text-amber-950 dark:text-amber-200 shadow-xs'
                          : 'border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50'
                      }`}
                    >
                      <span className="w-2.5 h-4 border-2 border-current rounded-sm opacity-70"></span>
                      1800×4000
                    </button>
                  </div>
                </div>
              </div>

              {/* Calligraphy Fonts */}
              <div>
                <label className="text-[11px] font-semibold text-zinc-500 block mb-1.5">
                  캘리그라피 / 손글씨 서체 선택 (8종):
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {CALLIGRAPHY_FONTS.map((font) => (
                    <button
                      key={font.id}
                      onClick={() =>
                        setCardConfig({ ...cardConfig, fontFamily: font.id })
                      }
                      className={`p-1.5 sm:p-2 rounded-xl border text-xs text-left transition-all cursor-pointer ${
                        cardConfig.fontFamily === font.id
                          ? 'border-amber-600 bg-amber-50 text-amber-950 dark:bg-amber-950/40 dark:text-amber-200 font-bold'
                          : 'border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                      }`}
                    >
                      <span className={font.class}>{font.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Image Upload Section */}
              <div className="p-2 sm:p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1.5">
                <label className="text-xs font-extrabold text-amber-700 dark:text-amber-300 flex items-center justify-between">
                  <span>🖼️ 나만의 배경 이미지 첨부:</span>
                  <span className="text-[10px] text-zinc-500 font-normal">스마트폰/PC 사진 선택</span>
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        if (event.target?.result) {
                          setCardConfig({
                            ...cardConfig,
                            backgroundImageStyle: `url(${event.target.result}) center/100% 100% no-repeat`,
                          });
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="w-full text-xs text-zinc-600 dark:text-zinc-300 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[11px] file:font-bold file:bg-amber-500 file:text-zinc-950 hover:file:bg-amber-400 cursor-pointer"
                />
              </div>

              {/* Seasonal & Theme Presets */}
              <div>
                <label className="text-xs font-semibold text-zinc-500 block mb-2">
                  절기 / 감성 테마 기본 배경:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'spring', name: '🌸 봄 (새생명)' },
                    { id: 'summer', name: '🌿 여름 (청량)' },
                    { id: 'autumn', name: '🍁 가을 (풍성)' },
                    { id: 'winter', name: '❄️ 겨울 (평안)' },
                    { id: 'comfort', name: '💜 위로' },
                    { id: 'gratitude', name: '💖 감사' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() =>
                        setCardConfig({
                          ...cardConfig,
                          theme: t.id as any,
                          backgroundImageStyle:
                            themeStyles[t.id as keyof typeof themeStyles],
                        })
                      }
                      className={`p-2 rounded-xl text-xs font-medium border text-center transition-all ${
                        cardConfig.theme === t.id
                          ? 'border-amber-600 bg-amber-50 text-amber-950 font-bold'
                          : 'border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* 미리보기 열기 버튼 */}
              <button
                onClick={() => setShowPreviewModal(true)}
                className="w-full py-2 rounded-xl bg-zinc-800 dark:bg-zinc-700 text-white font-bold text-xs hover:bg-zinc-700 transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <Eye className="w-4 h-4" /> 미리보기 & 말씀 위치 조정
              </button>

              <button
                onClick={() => setActiveStep(3)}
                className="w-full py-2.5 rounded-xl bg-amber-600 text-white font-bold text-sm hover:bg-amber-700 transition-colors"
              >
                다음: 말씀 카드 보기 & 저장
              </button>
            </div>
          )}

          {/* STEP 3: Preview & Share */}
          {activeStep === 3 && (
            <div className="space-y-4">
              <h3 className="font-bold text-sm text-zinc-800 dark:text-zinc-200 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>완성된 말씀 카드 저장 및 공유</span>
              </h3>

              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
                나만의 손글씨 캘리그라피 말씀 카드가 성공적으로 완성되었습니다! 고화질 이미지로 저장하거나 카카오톡 및 SNS로 공유하세요.
              </div>

              <div className="space-y-2">
                <button
                  onClick={handleDownloadCard}
                  disabled={isGenerating}
                  className="w-full py-3 rounded-xl bg-amber-500 text-zinc-950 font-bold text-sm hover:bg-amber-400 transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  <span>말씀 카드 이미지 저장하기</span>
                </button>

                <button
                  onClick={handleShareCard}
                  disabled={isGenerating}
                  className="w-full py-3 rounded-xl bg-zinc-900 dark:bg-zinc-800 text-white font-bold text-sm hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-md"
                >
                  {isGenerating ? <Loader2 className="w-4 h-4 animate-spin text-amber-400" /> : <Share2 className="w-4 h-4 text-amber-400" />}
                  <span>카카오톡 및 SNS로 친구와 공유하기</span>
                </button>
              </div>

              {noticeMessage && (
                <div className="p-3.5 rounded-xl bg-emerald-600 text-white text-xs font-bold text-center flex items-center justify-center gap-2 animate-in fade-in shadow-md">
                  <Check className="w-4 h-4 shrink-0 stroke-[3]" />
                  <span>{noticeMessage}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
