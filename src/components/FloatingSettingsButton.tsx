import React, { useState, useRef, useEffect } from 'react';
import { Settings } from 'lucide-react';

interface FloatingSettingsButtonProps {
  onOpenSettings: () => void;
}

export const FloatingSettingsButton: React.FC<FloatingSettingsButtonProps> = ({ onOpenSettings }) => {
  const [floatingPos, setFloatingPos] = useState<{ x: number; y: number } | null>(() => {
    try {
      const saved = localStorage.getItem('floating_settings_pos');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return null;
  });

  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ x: number; y: number; initialX: number; initialY: number } | null>(null);
  const lastTouchTimeRef = useRef<number>(0);

  const savePos = (pos: { x: number; y: number }) => {
    try {
      localStorage.setItem('floating_settings_pos', JSON.stringify(pos));
    } catch (e) {}
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    lastTouchTimeRef.current = Date.now();
    const touch = e.touches[0];
    const currentX = floatingPos?.x ?? (window.innerWidth - 75);
    const currentY = floatingPos?.y ?? (window.innerHeight - 230);

    dragStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      initialX: currentX,
      initialY: currentY,
    };
    isDraggingRef.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!dragStartRef.current || e.touches.length !== 1) return;
    if (e.cancelable) e.preventDefault();

    const touch = e.touches[0];
    const dx = touch.clientX - dragStartRef.current.x;
    const dy = touch.clientY - dragStartRef.current.y;

    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      isDraggingRef.current = true;
    }

    if (isDraggingRef.current) {
      const newX = Math.min(Math.max(10, dragStartRef.current.initialX + dx), window.innerWidth - 65);
      const newY = Math.min(Math.max(60, dragStartRef.current.initialY + dy), window.innerHeight - 90);
      const newPos = { x: newX, y: newY };
      setFloatingPos(newPos);
      savePos(newPos);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.cancelable) e.preventDefault();
    lastTouchTimeRef.current = Date.now();
    if (!isDraggingRef.current) {
      onOpenSettings();
    }
    dragStartRef.current = null;
    isDraggingRef.current = false;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (Date.now() - lastTouchTimeRef.current < 500) return;

    const currentX = floatingPos?.x ?? (window.innerWidth - 75);
    const currentY = floatingPos?.y ?? (window.innerHeight - 230);

    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      initialX: currentX,
      initialY: currentY,
    };
    isDraggingRef.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (Date.now() - lastTouchTimeRef.current < 500) return;
    if (!dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;

    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      isDraggingRef.current = true;
    }

    if (isDraggingRef.current) {
      const newX = Math.min(Math.max(10, dragStartRef.current.initialX + dx), window.innerWidth - 65);
      const newY = Math.min(Math.max(60, dragStartRef.current.initialY + dy), window.innerHeight - 90);
      const newPos = { x: newX, y: newY };
      setFloatingPos(newPos);
      savePos(newPos);
    }
  };

  const handleMouseUp = () => {
    if (Date.now() - lastTouchTimeRef.current < 500) return;
    if (!isDraggingRef.current && dragStartRef.current) {
      onOpenSettings();
    }
    dragStartRef.current = null;
    isDraggingRef.current = false;
  };

  return (
    <div
      style={
        floatingPos
          ? { left: `${floatingPos.x}px`, top: `${floatingPos.y}px`, right: 'auto', bottom: 'auto' }
          : {}
      }
      className={
        floatingPos
          ? 'fixed z-60 touch-none select-none'
          : 'fixed bottom-44 right-4 sm:bottom-48 sm:right-6 z-60 touch-none select-none'
      }
    >
      <button
        type="button"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{ touchAction: 'none' }}
        className="p-2 sm:p-2.5 rounded-full flex items-center gap-1 shadow-lg transition-all cursor-move border border-white dark:border-slate-800 bg-slate-800 hover:bg-slate-700 text-amber-400 shadow-slate-900/50"
        title="드래그하여 원하는 위치로 이동 / 클릭하여 설정 열기"
      >
        <Settings className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 pointer-events-none stroke-2 text-amber-400" />
        <span className="text-[10px] font-black pr-0.5 hidden sm:inline pointer-events-none text-slate-100">
          설정
        </span>
      </button>
    </div>
  );
};
