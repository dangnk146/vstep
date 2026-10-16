'use client';

import React from 'react';
import { AlertCircle, Download, Mic, RotateCcw, Square, Volume2 } from 'lucide-react';
import type { RecorderStatus, TimerPhase } from '../types';

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
      <div className="flex flex-wrap items-center gap-2 border-t border-border bg-muted/40 px-3 py-2">
        <span className="mr-auto text-[10px] font-semibold text-muted-foreground">
          {statusMessage}
        </span>
        <button
          type="button"
          onClick={onManualRecord}
          disabled={isRunning || recorderStatus === 'recording' || recorderStatus === 'requesting'}
          aria-busy={timerPhase === 'preparing' || recorderStatus === 'requesting'}
          className="flex h-7 items-center gap-1 rounded-sm bg-red-600 px-2 text-[10px] font-bold text-white hover:bg-red-700 disabled:opacity-50 cursor-pointer"
        >
          <Mic className="h-3 w-3" /> {timerPhase === 'preparing' ? 'ĐANG CHUẨN BỊ' : 'GHI ÂM'}
        </button>
        <button
          type="button"
          onClick={onStopRecording}
          disabled={recorderStatus !== 'recording' && recorderStatus !== 'requesting'}
          className="flex h-7 items-center gap-1 rounded-sm border border-border px-2 text-[10px] font-bold text-foreground hover:bg-muted disabled:opacity-50 cursor-pointer"
        >
          <Square className="h-3 w-3" /> DỪNG
        </button>
        <button
          type="button"
          onClick={() => void audioRef.current?.play()}
          disabled={!audioUrl}
          className="grid h-7 w-7 place-items-center rounded-sm border border-border text-foreground hover:bg-muted disabled:opacity-50 cursor-pointer"
          aria-label="Phát bản ghi"
          title="Phát bản ghi"
        >
          <Volume2 className="h-3.5 w-3.5" />
        </button>
        {audioUrl && (
          <a
            href={audioUrl}
            download="vstep-speaking.webm"
            aria-label="Tải bản ghi xuống"
            title="Tải bản ghi xuống"
            className="grid h-7 w-7 place-items-center rounded-sm border border-border text-foreground hover:bg-muted"
          >
            <Download className="h-3.5 w-3.5" />
          </a>
        )}
        <button
          type="button"
          onClick={onResetTimers}
          className="grid h-7 w-7 place-items-center rounded-sm border border-border text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
          title="Đặt lại bộ đếm"
          aria-label="Đặt lại bộ đếm"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      </div>

      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          controls
          preload="metadata"
          className="h-8 w-full px-3 py-1"
          aria-label="Phát lại và tua bản ghi câu trả lời"
        />
      )}
      {recorderError && (
        <p role="alert" className="flex items-center gap-2 px-3 pb-2 text-[10px] font-medium text-red-600 dark:text-red-400">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {recorderError}
        </p>
      )}
    </>
  );
}
