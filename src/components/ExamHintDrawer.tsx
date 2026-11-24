'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ChevronUp, GripHorizontal, Lightbulb, LoaderCircle, X } from 'lucide-react';
import type { ExamHint } from '@/types/examHint';
import { ExamHintContent } from './ExamHintContent';

export interface HintDrawerItem {
  id: string;
  title: string;
  hint?: ExamHint;
}

interface ExamHintDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: HintDrawerItem[];
  isLoading?: boolean;
  /** Use `absolute` when rendered inside a fullscreen-capable container (e.g. Dating). */
  contained?: boolean;
  /**
   * - `auto` (default): desktop (`md+`) floating draggable window + mobile (`<md`) inline dropdown at mount point.
   * - `floating`: only render the desktop (`md+`) floating draggable window.
   * - `inline`: only render the mobile (`<md`) inline dropdown card at mount point.
   */
  mode?: 'auto' | 'floating' | 'inline';
}

export function ExamHintDrawer({
  isOpen,
  onClose,
  items,
  isLoading = false,
  contained = false,
  mode = 'auto',
}: ExamHintDrawerProps) {
  const itemsSignature = items.map((item) => item.id).join('|');
  const [selectedState, setSelectedState] = useState<{ sig: string; index: number }>({
    sig: itemsSignature,
    index: 0,
  });

  // Draggable offset relative to default top-right anchor on desktop
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const floatingRef = useRef<HTMLElement | null>(null);
  const inlineRef = useRef<HTMLDivElement | null>(null);
  const wasOpenRef = useRef<boolean>(isOpen);

  const activeIndex =
    selectedState.sig === itemsSignature
      ? Math.min(selectedState.index, Math.max(0, items.length - 1))
      : 0;

  const showFloating = mode === 'auto' || mode === 'floating';
  const showInline = mode === 'auto' || mode === 'inline';

  // Close with Escape
  useEffect(() => {
    if (!isOpen || !showFloating) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopImmediatePropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, onClose, showFloating]);

  // Smoothly scroll the mobile inline dropdown into view only when user manually toggles it open
  useEffect(() => {
    const didJustOpen = !wasOpenRef.current && isOpen;
    wasOpenRef.current = isOpen;
    if (!didJustOpen || !showInline) return;
    if (typeof window === 'undefined' || window.innerWidth >= 768) return;
    const id = window.requestAnimationFrame(() => {
      inlineRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
    return () => window.cancelAnimationFrame(id);
  }, [isOpen, showInline]);

  // Clamp floating offset on window resize so it never goes off-screen
  useEffect(() => {
    if (!isOpen || !showFloating) return;
    const handleResize = () => {
      setPos({ x: 0, y: 0 });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen, showFloating]);

  const handleDragStart = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement | null;
    if (target?.closest('button')) return;

    const panel = floatingRef.current;
    if (!panel) return;

    e.preventDefault();
    e.stopPropagation();

    const panelRect = panel.getBoundingClientRect();
    const boundsEl = contained ? panel.offsetParent : null;
    const boundsRect = boundsEl
      ? boundsEl.getBoundingClientRect()
      : { left: 0, top: 0, right: window.innerWidth, bottom: window.innerHeight };

    const startMouseX = e.clientX;
    const startMouseY = e.clientY;
    const startX = pos.x;
    const startY = pos.y;

    // Default (pos = 0,0) visual position of panel
    const baseLeft = panelRect.left - startX;
    const baseTop = panelRect.top - startY;

    const minX = boundsRect.left + 8 - baseLeft;
    const maxX = boundsRect.right - 8 - panelRect.width - baseLeft;
    const minY = boundsRect.top + 8 - baseTop;
    const maxY = boundsRect.bottom - 56 - baseTop;

    setIsDragging(true);
    const prevUserSelect = document.body.style.userSelect;
    document.body.style.userSelect = 'none';

    const handleMove = (moveEvent: PointerEvent) => {
      const nextX = startX + (moveEvent.clientX - startMouseX);
      const nextY = startY + (moveEvent.clientY - startMouseY);
      setPos({
        x: Math.min(Math.max(nextX, Math.min(minX, maxX)), Math.max(minX, maxX)),
        y: Math.min(Math.max(nextY, Math.min(minY, maxY)), Math.max(minY, maxY)),
      });
    };

    const handleUp = () => {
      setIsDragging(false);
      document.body.style.userSelect = prevUserSelect;
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleUp);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleUp);
  };

  if (!isOpen) return null;

  const activeItem = items[activeIndex] ?? null;

  const topicTabs =
    items.length > 1 ? (
      <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted/80 p-0.5">
        {items.map((item, idx) => {
          const isSelected = idx === activeIndex;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedState({ sig: itemsSignature, index: idx })}
              className={`truncate rounded-md px-2.5 py-1 text-[11.5px] font-bold transition cursor-pointer ${
                isSelected
                  ? 'bg-card text-primary shadow-2xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Topic {idx + 1}
              {item.hint ? '' : ' (—)'}
            </button>
          );
        })}
      </div>
    ) : null;

  const bodyContent = isLoading ? (
    <div className="flex flex-col items-center justify-center py-8 text-center space-y-2 text-muted-foreground">
      <LoaderCircle className="h-5 w-5 animate-spin text-primary" />
      <p className="text-xs font-medium">Đang tải gợi ý...</p>
    </div>
  ) : activeItem?.hint ? (
    <ExamHintContent hint={activeItem.hint} />
  ) : (
    <div className="flex flex-col items-center justify-center py-7 px-3 text-center space-y-2">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-muted text-muted-foreground">
        <Lightbulb className="h-4.5 w-4.5" />
      </span>
      <p className="text-xs font-bold text-foreground">
        Chưa có gợi ý cho đề này
      </p>
      <p className="text-[11.5px] leading-relaxed text-muted-foreground max-w-xs">
        Hệ thống gợi ý theo Template + A-R-E hiện đã hỗ trợ trọn bộ 416 đề đợt{' '}
        <strong className="text-foreground">10/2026 &amp; 11/2026</strong>. Hãy bốc đề trong đợt này để xem gợi ý nhé.
      </p>
    </div>
  );

  return (
    <>
      {/* MOBILE (< md): Inline dropdown panel appended cleanly at the bottom of the page / prompt */}
      {showInline && (
        <div
          ref={inlineRef}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          className="md:hidden w-full overflow-hidden rounded-xl border border-primary/25 bg-card text-card-foreground shadow-sm animate-fade-in"
        >
          <div className="border-b border-border bg-muted/35 px-3 py-2 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="grid h-6.5 w-6.5 shrink-0 place-items-center rounded-lg bg-primary/12 text-primary">
                  <Lightbulb className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0">
                  <h3 className="text-[12.5px] font-extrabold text-foreground leading-tight">
                    Gợi ý VSTEP B2
                  </h3>
                  {activeItem?.title && (
                    <p
                      className="truncate text-[10.5px] text-muted-foreground"
                      title={activeItem.title}
                    >
                      {activeItem.title}
                    </p>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                title="Thu gọn gợi ý"
                aria-label="Thu gọn gợi ý"
                className="inline-flex h-7 items-center gap-1 rounded-lg border border-border/80 bg-card px-2 text-[11px] font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground cursor-pointer shrink-0"
              >
                <span>Thu gọn</span>
                <ChevronUp className="h-3.5 w-3.5" />
              </button>
            </div>

            {topicTabs}
          </div>

          <div className="px-3 py-3">{bodyContent}</div>
        </div>
      )}

      {/* DESKTOP (>= md): Non-modal, draggable floating panel (NO dark backdrop, full interaction behind) */}
      {showFloating && (
        <aside
          ref={floatingRef}
          role="dialog"
          aria-modal="false"
          aria-label="Gợi ý VSTEP B2"
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          style={{
            transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`,
          }}
          className={`hidden md:flex ${
            contained ? 'absolute top-12 right-4 max-h-[calc(100%-64px)]' : 'fixed top-14 right-4 max-h-[calc(100vh-76px)]'
          } z-50 w-[410px] lg:w-[440px] flex-col overflow-hidden rounded-xl border border-border bg-card/98 dark:bg-card/96 text-card-foreground backdrop-blur-md shadow-[0_18px_48px_-12px_rgba(15,23,42,0.28)] dark:shadow-[0_22px_56px_-12px_rgba(0,0,0,0.7)] ring-1 ring-black/5 dark:ring-white/8 ${
            isDragging ? 'ring-2 ring-primary/45 select-none' : ''
          }`}
        >
          {/* Draggable Header Bar */}
          <div
            onPointerDown={handleDragStart}
            title="Giữ và kéo để di chuyển khung gợi ý"
            className={`shrink-0 border-b border-border bg-muted/45 px-3 py-2 space-y-2 select-none ${
              isDragging ? 'cursor-grabbing' : 'cursor-grab'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-primary/12 text-primary">
                  <Lightbulb className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-[13px] font-extrabold text-foreground leading-tight">
                      Gợi ý VSTEP B2
                    </h3>
                    <GripHorizontal className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                  </div>
                  {activeItem?.title && (
                    <p
                      className="truncate text-[11px] text-muted-foreground"
                      title={activeItem.title}
                    >
                      {activeItem.title}
                    </p>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                title="Đóng gợi ý (Esc)"
                aria-label="Đóng gợi ý"
                className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {topicTabs}
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3.5 py-3">
            {bodyContent}
          </div>
        </aside>
      )}
    </>
  );
}
