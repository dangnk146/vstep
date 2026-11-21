'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  Clock,
  Heart,
  Maximize2,
  Minimize2,
  RotateCcw,
  Sparkles,
  X,
} from 'lucide-react';
import type { ExamPrompt } from '@/utils/examPrompts';
import type { PartFilter, SkillFilter } from '@/app/prompts/types';
import { DatingPromptContent } from './DatingPromptContent';

interface DatingDeckAppProps {
  prompts: ExamPrompt[];
  backHref: string;
  filterSummary: {
    school: string;
    batch: string;
    skill: SkillFilter;
    part: PartFilter;
    search: string;
  };
}

interface ActiveCardItem {
  prompt: ExamPrompt;
  lapses: number;
  isReview: boolean;
}

interface CooldownCardItem {
  prompt: ExamPrompt;
  lapses: number;
  dueAt: number;
}

interface DatingSessionState {
  activeQueue: ActiveCardItem[];
  cooldownQueue: CooldownCardItem[];
  masteredCount: number;
  totalReviewed: number;
}

type SwipePhase = 'idle' | 'stamp' | 'fly';

const SWIPE_THRESHOLD = 90;
const BUTTON_STAMP_HOLD_MS = 270;
const DRAG_STAMP_HOLD_MS = 90;
const FLY_OFF_DURATION_MS = 320;

function getAnkiDelaySeconds(nextLapses: number): number {
  if (nextLapses <= 1) return 20;
  if (nextLapses === 2) return 45;
  return 90;
}

function shufflePrompts(list: ExamPrompt[]): ActiveCardItem[] {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.map((prompt) => ({ prompt, lapses: 0, isReview: false }));
}

function createInitialSession(prompts: ExamPrompt[]): DatingSessionState {
  return {
    activeQueue: shufflePrompts(prompts),
    cooldownQueue: [],
    masteredCount: 0,
    totalReviewed: 0,
  };
}

function formatCountdown(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function DatingDeckApp({
  prompts,
  backHref,
}: DatingDeckAppProps) {
  const router = useRouter();

  // Pure in-memory session state -> resets 100% whenever leaving /dating route
  const [session, setSession] = useState<DatingSessionState>(() => createInitialSession(prompts));
  const { activeQueue, cooldownQueue, masteredCount, totalReviewed } = session;
  const [now, setNow] = useState(() => Date.now());

  // Fullscreen state (native Fullscreen API + fixed z-60 100dvh edge-to-edge fallback for mobile/iOS)
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Two-phase clear swipe feedback: 'stamp' (visible pop + tilt + colored halo) -> 'fly' (smooth glide off)
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [decisionDir, setDecisionDir] = useState<'left' | 'right' | null>(null);
  const [swipePhase, setSwipePhase] = useState<SwipePhase>('idle');
  const timersRef = useRef<number[]>([]);

  const pointerStateRef = useRef<{
    pointerId: number | null;
    startX: number;
    startY: number;
    startTime: number;
    lock: 'none' | 'horizontal' | 'vertical';
  }>({
    pointerId: null,
    startX: 0,
    startY: 0,
    startTime: 0,
    lock: 'none',
  });

  const clearAnimationTimers = useCallback(() => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  }, []);

  useEffect(() => {
    return () => {
      clearAnimationTimers();
      try {
        const doc = document as Document & {
          webkitFullscreenElement?: Element | null;
          webkitExitFullscreen?: () => Promise<void> | void;
        };
        if (document.fullscreenElement) {
          void document.exitFullscreen?.();
        } else if (doc.webkitFullscreenElement) {
          void doc.webkitExitFullscreen?.();
        }
      } catch {
        // Ignore
      }
    };
  }, [clearAnimationTimers]);

  useEffect(() => {
    const handleFsChange = () => {
      const doc = document as Document & { webkitFullscreenElement?: Element | null };
      const nativeActive = Boolean(document.fullscreenElement || doc.webkitFullscreenElement);
      if (!nativeActive) {
        setIsFullscreen(false);
      }
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
    };
  }, []);

  const handleExitApp = useCallback(() => {
    try {
      const doc = document as Document & {
        webkitFullscreenElement?: Element | null;
        webkitExitFullscreen?: () => Promise<void> | void;
      };
      if (document.fullscreenElement) {
        void document.exitFullscreen?.();
      } else if (doc.webkitFullscreenElement) {
        void doc.webkitExitFullscreen?.();
      }
    } catch {
      // Ignore
    }
    router.push(backHref);
  }, [backHref, router]);

  const toggleFullscreen = useCallback(async () => {
    const el = containerRef.current as (HTMLDivElement & {
      webkitRequestFullscreen?: () => Promise<void> | void;
    }) | null;
    const doc = document as Document & {
      webkitFullscreenElement?: Element | null;
      webkitExitFullscreen?: () => Promise<void> | void;
    };

    if (isFullscreen) {
      setIsFullscreen(false);
      try {
        if (document.fullscreenElement) {
          await document.exitFullscreen?.();
        } else if (doc.webkitFullscreenElement) {
          await doc.webkitExitFullscreen?.();
        }
      } catch {
        // Fallback already disabled
      }
      return;
    }

    setIsFullscreen(true);
    try {
      if (el?.requestFullscreen) {
        await el.requestFullscreen();
      } else if (el?.webkitRequestFullscreen) {
        await el.webkitRequestFullscreen();
      }
    } catch {
      // Keep CSS edge-to-edge fullscreen active
    }
  }, [isFullscreen]);

  // 1-second Anki countdown ticker
  useEffect(() => {
    if (cooldownQueue.length === 0) return;

    const timer = window.setInterval(() => {
      const currentTime = Date.now();
      setNow(currentTime);

      setSession((prev) => {
        const dueItems = prev.cooldownQueue.filter((item) => item.dueAt <= currentTime);
        if (dueItems.length === 0) return prev;

        const remainingCooldown = prev.cooldownQueue.filter((item) => item.dueAt > currentTime);
        const promoted: ActiveCardItem[] = dueItems
          .sort((a, b) => a.dueAt - b.dueAt)
          .map((item) => ({
            prompt: item.prompt,
            lapses: item.lapses,
            isReview: true,
          }));

        const nextActive =
          prev.activeQueue.length === 0
            ? promoted
            : [prev.activeQueue[0], ...promoted, ...prev.activeQueue.slice(1)];

        return {
          ...prev,
          activeQueue: nextActive,
          cooldownQueue: remainingCooldown,
        };
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [cooldownQueue.length]);

  const currentCard = activeQueue[0] ?? null;
  const nextCard = activeQueue[1] ?? null;
  const thirdCard = activeQueue[2] ?? null;

  const commitSwipe = useCallback(
    (direction: 'left' | 'right', fromDrag = false) => {
      if (!currentCard || swipePhase !== 'idle') return;

      clearAnimationTimers();
      setIsDragging(false);
      setDecisionDir(direction);
      setSwipePhase('stamp');

      const holdMs = fromDrag ? DRAG_STAMP_HOLD_MS : BUTTON_STAMP_HOLD_MS;

      const flyTimer = window.setTimeout(() => {
        setSwipePhase('fly');
      }, holdMs);

      const doneTimer = window.setTimeout(() => {
        const actionTime = Date.now();
        setNow(actionTime);

        setSession((prev) => {
          const card = prev.activeQueue[0];
          if (!card) return prev;
          const restActive = prev.activeQueue.slice(1);

          if (direction === 'right') {
            return {
              ...prev,
              activeQueue: restActive,
              masteredCount: prev.masteredCount + 1,
              totalReviewed: prev.totalReviewed + 1,
            };
          }

          const nextLapses = card.lapses + 1;
          const dueAt = actionTime + getAnkiDelaySeconds(nextLapses) * 1000;
          return {
            ...prev,
            activeQueue: restActive,
            cooldownQueue: [
              ...prev.cooldownQueue,
              { prompt: card.prompt, lapses: nextLapses, dueAt },
            ],
            totalReviewed: prev.totalReviewed + 1,
          };
        });

        setDragX(0);
        setDecisionDir(null);
        setSwipePhase('idle');
      }, holdMs + FLY_OFF_DURATION_MS);

      timersRef.current = [flyTimer, doneTimer];
    },
    [clearAnimationTimers, currentCard, swipePhase]
  );

  const handlePullNextCooldownNow = useCallback(() => {
    setSession((prev) => {
      if (prev.cooldownQueue.length === 0) return prev;
      const sorted = [...prev.cooldownQueue].sort((a, b) => a.dueAt - b.dueAt);
      const [earliest, ...rest] = sorted;
      return {
        ...prev,
        activeQueue: [
          ...prev.activeQueue,
          { prompt: earliest.prompt, lapses: earliest.lapses, isReview: true },
        ],
        cooldownQueue: rest,
      };
    });
  }, []);

  const handleRestartSession = useCallback(() => {
    clearAnimationTimers();
    setSession(createInitialSession(prompts));
    setDragX(0);
    setIsDragging(false);
    setDecisionDir(null);
    setSwipePhase('idle');
    setNow(Date.now());
  }, [clearAnimationTimers, prompts]);

  // Desktop keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isFullscreen) {
          void toggleFullscreen();
        } else {
          handleExitApp();
        }
        return;
      }
      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        void toggleFullscreen();
        return;
      }
      if (!currentCard || swipePhase !== 'idle') return;
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        commitSwipe('right', false);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        commitSwipe('left', false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [commitSwipe, currentCard, handleExitApp, isFullscreen, swipePhase, toggleFullscreen]);

  // Smart pointer swipe (horizontal swipe vs native vertical scroll inside card)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (swipePhase !== 'idle' || !currentCard) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;

    pointerStateRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      startTime: performance.now(),
      lock: 'none',
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const st = pointerStateRef.current;
    if (st.pointerId !== e.pointerId || swipePhase !== 'idle') return;

    const dx = e.clientX - st.startX;
    const dy = e.clientY - st.startY;

    if (st.lock === 'none') {
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
      if (Math.abs(dx) > Math.abs(dy) * 1.2) {
        st.lock = 'horizontal';
        setIsDragging(true);
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          // Ignore
        }
      } else {
        st.lock = 'vertical';
        return;
      }
    }

    if (st.lock === 'horizontal') {
      setDragX(dx);
    }
  };

  const finishPointerDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const st = pointerStateRef.current;
    if (st.pointerId !== e.pointerId) return;

    const wasHorizontal = st.lock === 'horizontal';
    const dx = e.clientX - st.startX;
    const elapsed = Math.max(1, performance.now() - st.startTime);
    const velocity = Math.abs(dx) / elapsed;

    pointerStateRef.current.pointerId = null;
    pointerStateRef.current.lock = 'none';

    if (!wasHorizontal) return;

    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // Ignore
    }

    const shouldCommit = Math.abs(dx) >= SWIPE_THRESHOLD || (velocity > 0.45 && Math.abs(dx) > 42);
    if (shouldCommit) {
      commitSwipe(dx > 0 ? 'right' : 'left', true);
    } else {
      setIsDragging(false);
      setDragX(0);
    }
  };

  const nearestCooldown = useMemo(() => {
    if (cooldownQueue.length === 0) return null;
    return cooldownQueue.reduce((min, item) => (item.dueAt < min.dueAt ? item : min), cooldownQueue[0]);
  }, [cooldownQueue]);

  const nearestRemainingMs = nearestCooldown ? Math.max(0, nearestCooldown.dueAt - now) : 0;

  const totalPrompts = prompts.length;
  const progressPct = totalPrompts > 0 ? Math.round((masteredCount / totalPrompts) * 100) : 0;
  const nextAnkiSeconds = currentCard ? getAnkiDelaySeconds(currentCard.lapses + 1) : 20;

  // Card position, rotation & visible stamp calculations
  let effectiveX = dragX;
  let rotateDeg = Math.max(-16, Math.min(16, dragX / 18));
  let cardOpacity = 1;

  if (swipePhase === 'stamp' && decisionDir) {
    // Hold gently tilted in view while stamp pops clearly!
    effectiveX = decisionDir === 'right' ? Math.max(dragX, 54) : Math.min(dragX, -54);
    rotateDeg = decisionDir === 'right' ? 6 : -6;
    cardOpacity = 1;
  } else if (swipePhase === 'fly' && decisionDir) {
    effectiveX = decisionDir === 'right' ? 560 : -560;
    rotateDeg = decisionDir === 'right' ? 22 : -22;
    cardOpacity = 0;
  }

  const likeOpacity =
    decisionDir === 'right'
      ? 1
      : Math.max(0, Math.min(1, (dragX - 16) / 80));
  const nopeOpacity =
    decisionDir === 'left'
      ? 1
      : Math.max(0, Math.min(1, (-dragX - 16) / 80));

  const isStampHighlightRight = decisionDir === 'right' || dragX > 45;
  const isStampHighlightLeft = decisionDir === 'left' || dragX < -45;

  return (
    <div
      ref={containerRef}
      className={
        isFullscreen
          ? 'fixed inset-0 z-[60] flex flex-col h-[100dvh] w-screen bg-background text-foreground overflow-hidden overscroll-none'
          : 'fixed inset-x-0 top-0 bottom-12 z-40 flex flex-col bg-background text-foreground overflow-hidden overscroll-none animate-fade-in'
      }
    >
      {/* Razor-thin 2px top progress hairline */}
      <div className="shrink-0 h-0.5 w-full bg-muted overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-pink-500 via-rose-500 to-sky-500 transition-all duration-300"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* FLOATING SLIM TOP OVERLAY STRIP (Zero bulky header box, hangs cleanly over the deck) */}
      <div className="pointer-events-none absolute inset-x-0 top-1 z-30 mx-auto flex w-full max-w-3xl items-center justify-between gap-2 px-2.5 sm:px-4 pt-[env(safe-area-inset-top)]">
        {/* Left Floating Pill: Tiny title badge + Progress + Live Anki countdown */}
        <div className="pointer-events-auto flex items-center gap-1.5 rounded-full border border-border/80 bg-card/90 backdrop-blur-md px-2 py-1 shadow-xs">
          <span
            title="Prompt Dating"
            className="btn-dating-pink grid h-5 w-5 shrink-0 place-items-center rounded-full"
          >
            <Heart className="h-2.5 w-2.5 fill-white text-white" />
          </span>
          <span className="hidden sm:inline text-[10.5px] font-black tracking-tight text-muted-foreground">
            Dating
          </span>
          <span className="h-3 w-px bg-border/80 hidden sm:inline-block" />
          <span className="text-[11px] font-extrabold tabular-nums text-pink-600 dark:text-pink-400">
            {masteredCount}/{totalPrompts}
          </span>

          {cooldownQueue.length > 0 && (
            <>
              <span className="h-3 w-px bg-border/80" />
              <span className="inline-flex items-center gap-1 font-mono text-[10.5px] font-bold text-amber-600 dark:text-amber-400">
                <Clock className="h-3 w-3 animate-pulse" />
                <span>
                  {cooldownQueue.length} · {formatCountdown(nearestRemainingMs)}
                </span>
              </span>
            </>
          )}
        </div>

        {/* Right Floating Controls: ONLY Fullscreen & Close */}
        <div className="pointer-events-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => void toggleFullscreen()}
            title={isFullscreen ? 'Thu nhỏ màn hình (F)' : 'Phóng toàn màn hình (F)'}
            aria-label={isFullscreen ? 'Thu nhỏ màn hình' : 'Phóng toàn màn hình'}
            className="btn-negative-pill grid h-7.5 w-7.5 place-items-center rounded-full transition active:scale-95 cursor-pointer"
          >
            {isFullscreen ? (
              <Minimize2 className="h-3.5 w-3.5" />
            ) : (
              <Maximize2 className="h-3.5 w-3.5" />
            )}
          </button>

          <button
            type="button"
            onClick={handleExitApp}
            title="Thoát & đặt lại phiên học (Esc)"
            aria-label="Thoát về Ngân hàng đề"
            className="btn-negative-pill grid h-7.5 w-7.5 place-items-center rounded-full transition active:scale-95 cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* HERO CONTENT AREA (Fixed full viewport height, zero outer vertical scroll) */}
      <div
        className={`relative flex-1 min-h-0 flex items-center justify-center px-2 sm:px-4 overflow-hidden select-none pt-[calc(env(safe-area-inset-top)+2.65rem)] ${
          isFullscreen
            ? 'pb-[calc(env(safe-area-inset-bottom)+4.25rem)]'
            : 'pb-16'
        }`}
      >
        {/* Subtle ambient tint */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(236,72,153,0.06),transparent_55%),radial-gradient(circle_at_50%_100%,rgba(2,132,199,0.06),transparent_55%)] dark:bg-[radial-gradient(circle_at_50%_0%,rgba(236,72,153,0.12),transparent_55%),radial-gradient(circle_at_50%_100%,rgba(14,165,233,0.10),transparent_55%)]" />

        {currentCard ? (
          <div className="relative w-full max-w-2xl h-full flex items-center justify-center">
            {/* Subtle stacked card preview underneath */}
            {thirdCard && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-4 top-2 bottom-0 rounded-2xl border border-border/50 bg-card/50 shadow-xs scale-[0.95] translate-y-2 opacity-45"
              />
            )}
            {nextCard && (
              <div
                aria-hidden="true"
                className={`pointer-events-none absolute inset-x-2 top-1 bottom-0 rounded-2xl border border-border/75 bg-card/85 shadow-sm transition-all duration-300 ${
                  swipePhase === 'fly'
                    ? 'scale-[0.99] translate-y-0 opacity-95'
                    : 'scale-[0.975] translate-y-1 opacity-75'
                }`}
              />
            )}

            {/* Active Swipeable Exam Card — Clean, Full Height, Zero Extra Metadata Clutter */}
            <article
              key={`${currentCard.prompt.id}-${currentCard.lapses}`}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={finishPointerDrag}
              onPointerCancel={finishPointerDrag}
              style={{
                transform: `translate3d(${effectiveX}px, ${Math.abs(effectiveX) * 0.03}px, 0) rotate(${rotateDeg}deg)`,
                opacity: cardOpacity,
                transition: isDragging
                  ? 'none'
                  : swipePhase === 'stamp'
                    ? 'transform 0.22s cubic-bezier(0.22, 1, 0.36, 1), border-color 0.2s ease, box-shadow 0.2s ease'
                    : 'transform 0.32s cubic-bezier(0.32, 0.08, 0.24, 1), opacity 0.28s ease',
                touchAction: 'pan-y',
              }}
              className={`relative z-10 flex h-full w-full flex-col rounded-2xl border-2 bg-card shadow-lg overflow-hidden cursor-grab active:cursor-grabbing ${
                isStampHighlightRight
                  ? 'border-pink-500/80 shadow-pink-500/20'
                  : isStampHighlightLeft
                    ? 'border-amber-500/80 shadow-amber-500/20'
                    : 'border-border'
              }`}
            >
              {/* Soft color wash overlay during decision so feedback is unmistakable */}
              {likeOpacity > 0.05 && (
                <div
                  style={{ opacity: likeOpacity * 0.16 }}
                  className="pointer-events-none absolute inset-0 z-20 bg-gradient-to-br from-pink-500 via-rose-500/50 to-transparent"
                />
              )}
              {nopeOpacity > 0.05 && (
                <div
                  style={{ opacity: nopeOpacity * 0.16 }}
                  className="pointer-events-none absolute inset-0 z-20 bg-gradient-to-bl from-amber-500 via-rose-500/40 to-transparent"
                />
              )}

              {/* Big Prominent Centered-Top Decision Stamps */}
              {likeOpacity > 0.04 && (
                <div
                  style={{ opacity: likeOpacity }}
                  className={`pointer-events-none absolute inset-0 z-30 flex items-center justify-center ${
                    decisionDir === 'right' ? 'animate-stamp-pop' : ''
                  }`}
                >
                  <div className="-rotate-10 rounded-2xl border-4 border-pink-500 bg-card/92 dark:bg-slate-950/90 px-5 py-2.5 shadow-2xl backdrop-blur-sm">
                    <span className="flex items-center gap-2 text-2xl sm:text-3xl font-black tracking-wider text-pink-600 dark:text-pink-400">
                      <Heart className="h-7 w-7 fill-current" />
                      ĐÃ HIỂU
                    </span>
                  </div>
                </div>
              )}

              {nopeOpacity > 0.04 && (
                <div
                  style={{ opacity: nopeOpacity }}
                  className={`pointer-events-none absolute inset-0 z-30 flex items-center justify-center ${
                    decisionDir === 'left' ? 'animate-stamp-pop' : ''
                  }`}
                >
                  <div className="rotate-10 rounded-2xl border-4 border-amber-500 bg-card/92 dark:bg-slate-950/90 px-5 py-2.5 shadow-2xl backdrop-blur-sm">
                    <span className="flex items-center gap-2 text-xl sm:text-2xl font-black tracking-wider text-amber-600 dark:text-amber-400">
                      <X className="h-7 w-7 stroke-[3]" />
                      CHƯA HIỂU · +{nextAnkiSeconds}s
                    </span>
                  </div>
                </div>
              )}

              {/* Pure Scrollable Exam Prompt Content (100% of card area!) */}
              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3.5 py-3.5 sm:px-6 sm:py-5 select-text">
                <DatingPromptContent
                  prompt={currentCard.prompt}
                  reviewCount={currentCard.isReview ? currentCard.lapses : 0}
                />
              </div>
            </article>
          </div>
        ) : cooldownQueue.length > 0 ? (
          /* ANKI WAITING CARD */
          <div className="relative z-10 flex w-full max-w-md flex-col items-center rounded-2xl border border-border bg-card p-6 text-center shadow-lg space-y-4">
            <div className="grid h-16 w-16 place-items-center rounded-full border border-amber-400/50 bg-amber-500/12 text-amber-600 dark:text-amber-400">
              <Clock className="h-8 w-8 animate-timer-tick" />
            </div>

            <div className="space-y-1">
              <p className="text-xs font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Hàng chờ Anki đang đếm ngược
              </p>
              <p className="font-mono text-4xl font-black tabular-nums text-foreground">
                {formatCountdown(nearestRemainingMs)}
              </p>
              <p className="text-xs text-muted-foreground">
                Còn <strong>{cooldownQueue.length} đề</strong> chưa hiểu sẽ tự động quay lại ngay khi hết giờ.
              </p>
            </div>

            <button
              type="button"
              onClick={handlePullNextCooldownNow}
              className="btn-dating-pink inline-flex h-10 items-center gap-2 rounded-full px-5 text-xs font-black transition hover:brightness-110 active:scale-95 cursor-pointer"
            >
              <Sparkles className="h-4 w-4" />
              <span>Ôn ngay thẻ tiếp theo</span>
            </button>
          </div>
        ) : (
          /* COMPLETED CARD */
          <div className="relative z-10 flex w-full max-w-md flex-col items-center rounded-2xl border border-border bg-card p-6 text-center shadow-lg space-y-4">
            <div className="btn-dating-pink grid h-16 w-16 place-items-center rounded-full">
              <CheckCircle2 className="h-8 w-8 text-white" />
            </div>

            <div className="space-y-1">
              <h2 className="text-lg font-black text-foreground">
                Hoàn thành toàn bộ bộ đề!
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Bạn đã hiểu <strong className="text-foreground">{masteredCount}/{totalPrompts}</strong> đề sau{' '}
                <strong className="text-foreground">{totalReviewed}</strong> lượt ôn tập.
              </p>
            </div>

            <div className="flex w-full items-center justify-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleRestartSession}
                className="btn-metallic-silver inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full px-4 text-xs font-black transition active:scale-95 cursor-pointer"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Học lại</span>
              </button>
              <button
                type="button"
                onClick={handleExitApp}
                className="btn-dating-pink inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full px-4 text-xs font-black transition hover:brightness-110 active:scale-95 cursor-pointer"
              >
                <span>Về Ngân hàng đề</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* FLOATING COMPACT BOTTOM ACTION PILLS — ONLY 2 BUTTONS, ZERO WASTED SPACE */}
      {currentCard && (
        <div
          className={`pointer-events-none absolute inset-x-0 bottom-0 z-30 flex items-center justify-center px-3 ${
            isFullscreen ? 'pb-[max(0.65rem,env(safe-area-inset-bottom))]' : 'pb-1.5'
          }`}
        >
          <div className="pointer-events-auto flex items-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={() => commitSwipe('left', false)}
              disabled={swipePhase !== 'idle'}
              title={`Chưa hiểu — Ôn lại sau ${nextAnkiSeconds}s (←)`}
              aria-label="Chưa hiểu, đưa vào hàng chờ ôn lại"
              className="btn-metallic-silver group flex h-11 sm:h-12 items-center gap-2 rounded-full px-4 sm:px-5 text-xs sm:text-[13px] font-black transition-transform duration-200 hover:scale-104 active:scale-95 cursor-pointer disabled:opacity-60"
            >
              <X className="h-4.5 w-4.5 stroke-[3] text-rose-600 dark:text-rose-400 group-hover:text-rose-400 dark:group-hover:text-rose-600 transition-colors" />
              <span>Chưa hiểu</span>
              <span className="rounded-full bg-amber-500/18 px-1.5 py-0.5 font-mono text-[10px] font-bold text-amber-700 dark:text-amber-300 group-hover:bg-amber-400/25 group-hover:text-amber-200 dark:group-hover:text-amber-700">
                +{nextAnkiSeconds}s
              </span>
            </button>

            <button
              type="button"
              onClick={() => commitSwipe('right', false)}
              disabled={swipePhase !== 'idle'}
              title="Đã hiểu đề này (→)"
              aria-label="Đã hiểu đề này"
              className="btn-dating-pink group flex h-11 sm:h-12 items-center gap-2 rounded-full px-5 sm:px-6 text-xs sm:text-[13px] font-black transition-transform duration-200 hover:scale-104 active:scale-95 cursor-pointer disabled:opacity-60"
            >
              <Heart className="h-4.5 w-4.5 fill-white text-white transition-transform duration-200 group-hover:scale-115" />
              <span>Đã hiểu</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
