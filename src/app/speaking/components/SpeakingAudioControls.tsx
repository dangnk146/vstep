'use client';

import React from 'react';
import { AlertCircle, Mic, RotateCcw, Square } from 'lucide-react';
import type { RecorderStatus, TimerPhase } from '../types';
import { SpeakingWaveformPlayer } from './SpeakingWaveformPlayer';

interface SpeakingAudioControlsProps {
  recorderStatus: RecorderStatus;
  recorderError: string;
  timerPhase: TimerPhase;
  isRunning: boolean;
  audioUrl: string | null;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  onManualRecord: () => void;
  onStopRecording: () => void;
  onResetTimers: () => void;
}

export function SpeakingAudioControls({
  recorderStatus,
  recorderError,
  timerPhase,
  isRunning,
  audioUrl,
  audioRef,
  onManualRecord,
  onStopRecording,
  onResetTimers,
}: SpeakingAudioControlsProps) {
  const statusMessage = recorderStatus === 'requesting'
    ? 'Đang chờ quyền microphone…'
    : recorderStatus === 'recording'
      ? 'Đang ghi âm · LIVE'
      : recorderStatus === 'ready'
        ? 'Đã có bản ghi âm'
        : timerPhase === 'preparing'
          ? 'Chuẩn bị trước khi trả lời'
          : 'Nhấn Start để bắt đầu';

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 border-t border-border bg-muted/40 px-3 py-1.5 sm:px-4 sm:py-2">
        <div className="mr-auto flex items-center gap-1.5">
          {recorderStatus === 'recording' ? (
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
            </span>
          ) : timerPhase === 'preparing' ? (
            <span className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
          ) : audioUrl ? (
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
          ) : (
            <span className="h-2 w-2 rounded-full bg-muted-foreground/40" />
          )}
          <span className="text-[11px] font-semibold text-muted-foreground">
            {statusMessage}
          </span>
        </div>

        <button
          type="button"
          onClick={onManualRecord}
          disabled={isRunning || recorderStatus === 'recording' || recorderStatus === 'requesting'}
          aria-busy={timerPhase === 'preparing' || recorderStatus === 'requesting'}
          className="flex h-7 items-center gap-1.5 rounded-xs bg-red-600 px-2.5 text-[11px] font-bold text-white transition hover:bg-red-700 active:scale-95 disabled:opacity-50 cursor-pointer shadow-xs"
        >
          <Mic className="h-3 w-3" /> {timerPhase === 'preparing' ? 'ĐANG CHUẨN BỊ' : 'GHI ÂM'}
        </button>

        <button
          type="button"
          onClick={onStopRecording}
          disabled={recorderStatus !== 'recording' && recorderStatus !== 'requesting'}
          className="flex h-7 items-center gap-1.5 rounded-xs border border-border bg-card px-2.5 text-[11px] font-bold text-foreground transition hover:bg-muted active:scale-95 disabled:opacity-50 cursor-pointer shadow-xs"
        >
          <Square className="h-3 w-3" /> DỪNG
        </button>

        <button
          type="button"
          onClick={onResetTimers}
          className="grid h-7 w-7 place-items-center rounded-xs border border-border bg-card text-muted-foreground transition hover:bg-muted hover:text-foreground active:scale-95 cursor-pointer shadow-xs"
          title="Đặt lại và xóa bản ghi âm"
          aria-label="Đặt lại và xóa bản ghi âm"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      </div>

      {audioUrl && (
        <div className="border-t border-border/50 bg-muted/20 px-3 py-2 sm:px-4">
          <SpeakingWaveformPlayer audioUrl={audioUrl} audioRef={audioRef} />
        </div>
      )}
      {recorderError && (
        <p role="alert" className="flex items-center gap-2 px-3 pb-2 text-[10px] font-medium text-red-600 dark:text-red-400">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {recorderError}
        </p>
      )}
    </>
  );
}
