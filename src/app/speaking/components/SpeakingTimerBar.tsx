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

  const partNames: Record<SpeakingPart, { title: string; desc: string }> = {
    part1: { title: 'Question 1', desc: 'Tương tác xã hội (Social Interaction)' },
    part2: { title: 'Question 2', desc: 'Thảo luận giải pháp (Solution Discussion)' },
    part3: { title: 'Question 3', desc: 'Phát triển chủ đề (Topic Development)' },
  };

  const partInfo = partNames[activePart] || { title: `Question ${activePart.slice(-1)}`, desc: '' };

  return (
    <div className="border-b border-border bg-muted/20 px-3 py-2 sm:px-4 sm:py-2.5">
      <div className="mb-1.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] font-black uppercase tracking-wider text-primary">
            {partInfo.title}
          </span>
          <span className="hidden text-[11px] font-medium text-muted-foreground sm:inline">
            · {partInfo.desc}
          </span>
        </div>
        <span className="text-[10px] font-semibold text-muted-foreground sm:text-[11px]">
          {isPreparing ? 'Giai đoạn chuẩn bị' : timerPhase === 'speaking' ? 'Đang trả lời' : 'Sẵn sàng'}
        </span>
      </div>

      <div className="flex h-9 items-center gap-2 rounded-xs bg-[#48005e] px-2.5 text-white shadow-xs">
        <button
          type="button"
          onClick={onToggleRun}
          disabled={recorderStatus === 'requesting'}
          aria-label={runningPart ? 'Dừng phần thi đang chạy' : `Bắt đầu ${activePart}`}
          className="grid h-6 w-7 shrink-0 place-items-center rounded-xs bg-white/15 transition hover:bg-white/25 active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          {runningPart ? <Square className="h-3 w-3 fill-current" /> : <Play className="h-3 w-3 fill-current" />}
        </button>
        <span className="min-w-12 font-mono text-xs font-black tabular-nums tracking-wide sm:text-sm">
          {formatClock(displayClock)}
        </span>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/20">
          <div
            className="h-full rounded-full bg-white transition-[width] duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <span className="min-w-16 rounded-xs bg-white/10 px-1.5 py-0.5 text-right font-mono text-[11px] font-bold tabular-nums" aria-live="off">
          {isPreparing ? `Prep ${formatClock(preparationRemaining ?? 0)}` : `Còn ${formatClock(remainingTime)}`}
        </span>
      </div>
    </div>
  );
}

