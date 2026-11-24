'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ChevronUp, Lightbulb, LoaderCircle, X } from 'lucide-react';
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
  /**
   * - `auto` (default): desktop (`md+`) 30% right docked split-panel + mobile (`<md`) inline dropdown at mount point.
   * - `desktop`: only render the desktop (`md+`) 30% right panel.
   * - `inline`: only render the mobile (`<md`) inline dropdown card at mount point.
   */
  mode?: 'auto' | 'desktop' | 'inline';
  /**
   * - `fixed-dock` (default, Speaking & Writing): fixed `30vw` right column from `top-0` to `bottom-12` (above bottom nav).
   * - `flex-pane` (Dating): `30%` flex sibling column inside a full-height container (works in Fullscreen too).
   */
  desktopLayout?: 'fixed-dock' | 'flex-pane';
}

export function ExamHintDrawer({
  isOpen,
  onClose,
  items,
  isLoading = false,
  mode = 'auto',
  desktopLayout = 'fixed-dock',
}: ExamHintDrawerProps) {
  const itemsSignature = items.map((item) => item.id).join('|');
  const [selectedState, setSelectedState] = useState<{ sig: string; index: number }>({
    sig: itemsSignature,
    index: 0,
  });

  const inlineRef = useRef<HTMLDivElement | null>(null);
  const wasOpenRef = useRef<boolean>(isOpen);

  const activeIndex =
    selectedState.sig === itemsSignature
      ? Math.min(selectedState.index, Math.max(0, items.length - 1))
      : 0;

  const showDesktop = mode === 'auto' || mode === 'desktop';
  const showInline = mode === 'auto' || mode === 'inline';

  // Close with Escape on desktop
  useEffect(() => {
    if (!isOpen || !showDesktop) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopImmediatePropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, onClose, showDesktop]);

  // Smoothly scroll the mobile inline dropdown into view only when user manually toggles it open
  useEffect(() => {
    const didJustOpen = !wasOpenRef.current && isOpen;
    wasOpenRef.current = isOpen;
    if (!didJustOpen || !showInline) return;
    if (typeof window === 'undefined' || window.innerWidth >= 768) return;
    const timer = window.setTimeout(() => {
      inlineRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 80);
    return () => window.clearTimeout(timer);
  }, [isOpen, showInline]);

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
      {/* MOBILE (< md): Smoothly unfolding inline dropdown at the bottom of the page / prompt */}
      {showInline && (
        <div
          ref={inlineRef}
          aria-hidden={!isOpen}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          className={`md:hidden grid w-full transition-[grid-template-rows,opacity,margin] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            isOpen
              ? 'grid-rows-[1fr] opacity-100'
              : 'grid-rows-[0fr] opacity-0 pointer-events-none'
          }`}
        >
          <div className="overflow-hidden">
            <div className="w-full overflow-hidden rounded-xl border border-primary/25 bg-card text-card-foreground shadow-sm">
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
          </div>
        </div>
      )}

      {/* DESKTOP (>= md): Smoothly sliding 30% docked right split-pane */}
      {showDesktop &&
        (desktopLayout === 'flex-pane' ? (
          <aside
            aria-label="Gợi ý VSTEP B2"
            aria-hidden={!isOpen}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            className={`hidden md:flex shrink-0 h-full overflow-hidden bg-card text-card-foreground transition-[width,opacity,border-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              isOpen
                ? 'w-[30%] border-l border-border opacity-100'
                : 'w-0 border-l border-transparent opacity-0 pointer-events-none'
            }`}
          >
            {/* Fixed-width inner wrapper prevents text reflow jitter while width animates */}
            <div className="flex h-full w-[30vw] min-w-[300px] flex-col overflow-hidden">
              <div className="shrink-0 border-b border-border bg-muted/40 px-3.5 py-2.5 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-primary/12 text-primary">
                      <Lightbulb className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-[13px] font-extrabold text-foreground leading-tight">
                        Gợi ý VSTEP B2
                      </h3>
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
                    title="Đóng bảng gợi ý (Esc)"
                    aria-label="Đóng bảng gợi ý"
                    className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {topicTabs}
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3.5 py-3">
                {bodyContent}
              </div>
            </div>
          </aside>
        ) : (
          <aside
            aria-label="Gợi ý VSTEP B2"
            aria-hidden={!isOpen}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            className={`hidden md:flex fixed top-0 right-0 bottom-12 z-40 w-[30vw] flex-col overflow-hidden border-l border-border bg-card text-card-foreground shadow-[-8px_0_24px_-12px_rgba(15,23,42,0.14)] dark:shadow-[-8px_0_28px_-12px_rgba(0,0,0,0.45)] transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform ${
              isOpen
                ? 'translate-x-0 opacity-100'
                : 'translate-x-full opacity-0 pointer-events-none'
            }`}
          >
            <div className="shrink-0 border-b border-border bg-muted/40 px-3.5 py-2.5 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-primary/12 text-primary">
                    <Lightbulb className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-[13px] font-extrabold text-foreground leading-tight">
                      Gợi ý VSTEP B2
                    </h3>
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
                  title="Đóng bảng gợi ý (Esc)"
                  aria-label="Đóng bảng gợi ý"
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {topicTabs}
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3.5 py-3">
              {bodyContent}
            </div>
          </aside>
        ))}
    </>
  );
}
