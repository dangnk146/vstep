'use client';

import React from 'react';
import { Play, Square } from 'lucide-react';
import { formatClock, type RecorderStatus, type SpeakingPart, type TimerPhase } from '../types';

interface SpeakingTimerBarProps {
  activePart: SpeakingPart;
  runningPart: SpeakingPart | null;
  recorderStatus: RecorderStatus;
  timerPhase: TimerPhase;
  preparationRemaining: number | null;
  remainingTime: number;
  maxDuration: number;
  onToggleRun: () => void;
}

export function SpeakingTimerBar({
  activePart,
  runningPart,
  recorderStatus,
  timerPhase,
  preparationRemaining,
  remainingTime,
  maxDuration,
  onToggleRun,
}: SpeakingTimerBarProps) {
  const isPreparing = timerPhase === 'preparing';
  const displayClock = isPreparing ? preparationRemaining ?? 0 : remainingTime;
  const progressPercent = Math.max(0, Math.min(100, (remainingTime / Math.max(maxDuration, 1)) * 100));

  return (
    <div className="px-3 pt-3">
      <p className="mb-1 text-[10px] font-extrabold uppercase tracking-wide text-slate-600 dark:text-muted-foreground">
        Question {activePart.slice(-1)}
      </p>
      <div className="flex h-9 items-center gap-2 bg-[#48005e] px-2 text-white">
        <button
          type="button"
          onClick={onToggleRun}
          disabled={recorderStatus === 'requesting'}
          aria-label={runningPart ? 'Dừng phần thi đang chạy' : `Bắt đầu ${activePart}`}
          className="grid h-6 w-7 shrink-0 place-items-center bg-white/15 hover:bg-white/25 disabled:opacity-50 cursor-pointer"
        >
          {runningPart ? <Square className="h-3 w-3 fill-current" /> : <Play className="h-3 w-3 fill-current" />}
        </button>
        <span className="min-w-12 font-mono text-xs font-bold tabular-nums">
          {formatClock(displayClock)}
        </span>
        <div className="h-1.5 flex-1 overflow-hidden bg-white/25">
          <div
            className="h-full bg-white transition-[width] duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <span className="min-w-16 text-right font-mono text-xs font-bold tabular-nums" aria-live="off">
          {isPreparing ? `Prep ${formatClock(preparationRemaining ?? 0)}` : `Còn ${formatClock(remainingTime)}`}
        </span>
      </div>
    </div>
  );
}

