'use client';

import React from 'react';
import { Headphones } from 'lucide-react';

interface SpeakingPreparationOverlayProps {
  remainingSeconds: number;
  durationSeconds: number;
}

export function SpeakingPreparationOverlay({
  remainingSeconds,
  durationSeconds,
}: SpeakingPreparationOverlayProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 px-4 py-6">
      <section
        role="status"
        aria-label="Thời gian chuẩn bị nói"
        className="flex min-h-[350px] w-full max-w-[320px] flex-col items-center border-4 border-sky-400 bg-white px-4 py-8 text-center text-slate-800 shadow-2xl"
      >
        <Headphones aria-hidden="true" className="mb-4 h-16 w-16 text-sky-500" strokeWidth={2.5} />
        <p className="text-xs font-extrabold uppercase">
          Hãy đeo tai nghe để làm bài thi nói
        </p>
        <p className="mt-4 text-sm font-semibold uppercase">
          Bạn có {durationSeconds} giây để chuẩn bị.
        </p>
        <p className="mt-4 font-mono text-lg font-bold tabular-nums text-red-600" aria-live="off">
          {remainingSeconds}s
        </p>
        <p className="mt-auto pt-6 text-[10px] font-medium uppercase leading-relaxed text-slate-600">
          Bài nói sẽ được tự động ghi âm sau khi hết thời gian chuẩn bị. Hãy sẵn sàng trả lời.
        </p>
      </section>
    </div>
  );
}
