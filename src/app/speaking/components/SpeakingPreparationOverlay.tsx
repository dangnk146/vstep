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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 px-4 py-6 backdrop-blur-xs animate-fade-in">
      <section
        role="status"
        aria-label="Thời gian chuẩn bị nói"
        className="flex min-h-[320px] w-full max-w-[340px] flex-col items-center rounded-sm border-2 border-primary/50 bg-card px-5 py-7 text-center text-foreground shadow-2xl"
      >
        <div className="mb-4 grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary">
          <Headphones aria-hidden="true" className="h-9 w-9" strokeWidth={2.2} />
        </div>
        <p className="text-xs font-black uppercase tracking-wider text-primary">
          Hãy đeo tai nghe để làm bài thi nói
        </p>
        <p className="mt-3 text-xs sm:text-sm font-semibold text-foreground/90">
          Bạn có <span className="font-bold text-foreground">{durationSeconds} giây</span> để chuẩn bị.
        </p>
        <p className="mt-4 font-mono text-4xl font-black tabular-nums text-[#df4b24] animate-pulse" aria-live="off">
          {remainingSeconds}s
        </p>
        <p className="mt-auto pt-6 text-[10px] font-medium leading-relaxed text-muted-foreground">
          Bài nói sẽ được tự động ghi âm sau khi hết thời gian chuẩn bị. Hãy sẵn sàng trả lời!
        </p>
      </section>
    </div>
  );
}
