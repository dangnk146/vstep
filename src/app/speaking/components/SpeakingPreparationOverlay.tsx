'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Headphones } from 'lucide-react';

interface SpeakingPreparationOverlayProps {
  remainingSeconds: number;
  durationSeconds: number;
}

export function SpeakingPreparationOverlay({
  remainingSeconds,
  durationSeconds,
}: SpeakingPreparationOverlayProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  if (!mounted || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="prep-heading"
      className="fixed inset-0 z-[9999] flex h-[100dvh] w-screen items-center justify-center bg-black/80 p-4 backdrop-blur-xs"
    >
      <section
        role="status"
        aria-label="Thời gian chuẩn bị nói"
        className="flex min-h-[300px] w-full max-w-[340px] flex-col items-center rounded-sm border-2 border-primary/50 bg-card px-5 py-7 text-center text-foreground shadow-2xl animate-fade-in"
      >
        <div className="mb-4 grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary">
          <Headphones aria-hidden="true" className="h-9 w-9" strokeWidth={2.2} />
        </div>
        <p id="prep-heading" className="text-xs font-black uppercase tracking-wider text-primary">
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
    </div>,
    document.body
  );
}
