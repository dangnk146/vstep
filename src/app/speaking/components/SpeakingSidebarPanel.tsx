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
    <aside className="flex flex-col gap-2 p-2.5">
      {/* Waveform visualizer */}
      <div
        className="flex h-[78px] items-end gap-1 overflow-hidden bg-[#171717] p-2"
        role="img"
        aria-label={recorderStatus === 'recording' ? 'Âm lượng microphone đang hoạt động' : 'Trình hiển thị âm thanh'}
      >
        {waveformLevels.map((level, index) => (
          <span
            key={index}
            className="min-w-0 flex-1 rounded-t-sm transition-[height] duration-75"
            style={{
              height: `${Math.max(4, Math.round(level * 55))}px`,
              backgroundColor: `hsl(${Math.round(index * 120 / (waveformLevels.length - 1))} 85% 48%)`,
            }}
          />
        ))}
      </div>

      {/* Practice status card */}
      <div
        className={`flex min-h-[176px] flex-1 flex-col items-center justify-center px-3 py-4 text-center text-white ${
          isSubmitted ? 'bg-emerald-700' : 'bg-[#23aa00]'
        }`}
        aria-live="polite"
      >
        {isSubmitted ? (
          <>
            <Check className="mb-3 h-8 w-8 rounded-full border-2 border-white p-1" />
            <p className="text-[11px] font-extrabold leading-5">LƯỢT LUYỆN ĐÃ KẾT THÚC</p>
            <p className="mt-2 text-[9px] font-semibold leading-4">
              Bản ghi âm được giữ trên thiết bị này. Bạn có thể phát lại hoặc tải xuống.
            </p>
          </>
        ) : (
          <>
            <Mic className="mb-3 h-8 w-8" />
            <p className="text-[11px] font-extrabold leading-5">
              {hasExamContent ? 'ĐỀ THI ĐÃ SẴN SÀNG' : 'CHỌN ĐỀ ĐỂ BẮT ĐẦU'}
            </p>
            <p className="mt-2 text-[9px] font-semibold leading-4">
              Nhấn “NỘP BÀI” ở góc trên để kết thúc lượt luyện.
            </p>
          </>
        )}
      </div>

      {/* Duration settings */}
      <section className="rounded-sm border border-border bg-card p-2.5" aria-labelledby="speaking-duration-heading">
        <div className="mb-2 flex items-center justify-between gap-2 border-b border-border pb-2">
          <div>
            <h2 id="speaking-duration-heading" className="text-[11px] font-extrabold text-foreground">
              Thời lượng từng phần
            </h2>
            <p className="mt-0.5 text-[9px] leading-4 text-muted-foreground">
              Chỉnh giây · Part 1 không có chuẩn bị
            </p>
          </div>
          <span className="shrink-0 rounded-sm bg-primary/10 px-1.5 py-1 text-[9px] font-bold text-primary">
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
              <span className="flex h-7 items-center overflow-hidden rounded-sm border border-border bg-background focus-within:border-primary">
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

