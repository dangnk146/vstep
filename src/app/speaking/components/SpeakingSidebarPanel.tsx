'use client';

import React from 'react';
import { Check, Mic } from 'lucide-react';
import {
  PARTS,
  formatClock,
  type RecorderStatus,
  type SettingKey,
  type SpeakingPart,
  type TimerPhase,
} from '../types';

interface SpeakingSidebarPanelProps {
  recorderStatus: RecorderStatus;
  waveformLevels: number[];
  isSubmitted: boolean;
  hasExamContent: boolean;
  timerPhase: TimerPhase;
  activePart: SpeakingPart;
  preparationRemaining: number | null;
  remainingTimes: Record<SpeakingPart, number>;
  settings: Record<SettingKey, string>;
  getSeconds: (key: SettingKey) => number;
  updateSetting: (key: SettingKey, value: string) => void;
}

export function SpeakingSidebarPanel({
  recorderStatus,
  waveformLevels,
  isSubmitted,
  hasExamContent,
  timerPhase,
  activePart,
  preparationRemaining,
  remainingTimes,
  settings,
  getSeconds,
  updateSetting,
}: SpeakingSidebarPanelProps) {
  const isPreparingOrSpeaking = timerPhase === 'preparing' || timerPhase === 'speaking';

  return (
    <aside className="flex flex-col gap-2.5 border-t border-border bg-muted/20 p-2.5 lg:border-t-0 lg:border-l">
      {/* Waveform visualizer */}
      <div
        className="flex h-[72px] items-end gap-1 overflow-hidden rounded-xs border border-border/50 bg-[#121212] p-2"
        role="img"
        aria-label={recorderStatus === 'recording' ? 'Âm lượng microphone đang hoạt động' : 'Trình hiển thị âm thanh'}
      >
        {waveformLevels.map((level, index) => (
          <span
            key={index}
            className="min-w-0 flex-1 rounded-t-xs transition-[height] duration-75"
            style={{
              height: `${Math.max(4, Math.round(level * 52))}px`,
              backgroundColor: `hsl(${Math.round((index * 120) / (waveformLevels.length - 1))} 85% 48%)`,
            }}
          />
        ))}
      </div>

      {/* Practice status card */}
      <div
        className={`flex min-h-[150px] flex-1 flex-col items-center justify-center rounded-xs p-3.5 text-center text-white shadow-xs ${
          isSubmitted
            ? 'border border-emerald-500/30 bg-gradient-to-br from-emerald-600 to-teal-700'
            : 'border border-emerald-600/30 bg-gradient-to-br from-[#1a8800] to-[#125e00]'
        }`}
        aria-live="polite"
      >
        {isSubmitted ? (
          <>
            <Check className="mb-2.5 h-7 w-7 rounded-full border-2 border-white p-1" />
            <p className="text-[11px] font-black uppercase tracking-wide leading-snug">LƯỢT LUYỆN ĐÃ KẾT THÚC</p>
            <p className="mt-1.5 text-[9px] font-semibold leading-4 text-white/90">
              Bản ghi âm được giữ an toàn trên thiết bị. Bạn có thể nghe lại hoặc tải về.
            </p>
          </>
        ) : (
          <>
            <Mic className="mb-2.5 h-7 w-7 opacity-90" />
            <p className="text-[11px] font-black uppercase tracking-wide leading-snug">
              {hasExamContent ? 'ĐỀ THI ĐÃ SẴN SÀNG' : 'CHỌN ĐỀ ĐỂ BẮT ĐẦU'}
            </p>
            <p className="mt-1.5 text-[9px] font-semibold leading-4 text-white/90">
              Nhấn “GHI ÂM” hoặc nút Play trên thanh thời gian để bắt đầu.
            </p>
          </>
        )}
      </div>

      {/* Duration settings */}
      <section className="rounded-xs border border-border bg-card p-2.5 shadow-xs" aria-labelledby="speaking-duration-heading">
        <div className="mb-2 flex items-center justify-between gap-2 border-b border-border/70 pb-2">
          <div>
            <h2 id="speaking-duration-heading" className="text-[10px] font-black uppercase tracking-wider text-foreground">
              Thời lượng từng phần
            </h2>
            <p className="mt-0.5 text-[9px] leading-3 text-muted-foreground">
              Chỉnh giây · P1 không có chuẩn bị
            </p>
          </div>
          <span className="shrink-0 rounded-xs bg-primary/10 px-1.5 py-0.5 font-mono text-[9px] font-bold text-primary">
            {timerPhase === 'preparing'
              ? `Prep ${formatClock(preparationRemaining ?? 0)}`
              : `${PARTS.find((part) => part.id === activePart)?.title.split(': ')[0]} ${formatClock(remainingTimes[activePart])}`}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-x-2 gap-y-1.5">
          {([
            { key: 'prep', label: `Chuẩn bị · ${formatClock(getSeconds('prep'))}`, min: 0 },
            { key: 'part1', label: `Part 1 · ${formatClock(getSeconds('part1'))}`, min: 1 },
            { key: 'part2', label: `Part 2 · ${formatClock(getSeconds('part2'))}`, min: 1 },
            { key: 'part3', label: `Part 3 · ${formatClock(getSeconds('part3'))}`, min: 1 },
          ] as { key: SettingKey; label: string; min: number }[]).map(({ key, label, min }) => (
            <label key={key} className="flex min-w-0 flex-col gap-1 text-[9px] font-semibold text-muted-foreground">
              <span className="truncate" title={label}>{label}</span>
              <span className="flex h-7 items-center overflow-hidden rounded-xs border border-border bg-background focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/40">
                <input
                  type="number"
                  min={min}
                  step="1"
                  value={settings[key]}
                  disabled={isPreparingOrSpeaking}
                  onChange={(event) => updateSetting(key, event.target.value)}
                  className="h-full w-full min-w-0 bg-transparent px-1.5 text-right font-mono text-[10px] font-bold text-foreground outline-none disabled:cursor-not-allowed disabled:opacity-60"
                  aria-label={`${label}, giây`}
                />
                <span className="pr-1.5 text-[9px]">s</span>
              </span>
            </label>
          ))}
        </div>
        {isPreparingOrSpeaking && (
          <p className="mt-2 text-[9px] leading-4 text-muted-foreground">
            Dừng lượt luyện để chỉnh thời lượng.
          </p>
        )}
      </section>
    </aside>
  );
}

