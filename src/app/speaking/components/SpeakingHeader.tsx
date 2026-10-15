'use client';

import React from 'react';
import Link from 'next/link';
import { Dices, Mic, Settings } from 'lucide-react';

interface SpeakingHeaderProps {
  onRandomPrompt: () => void;
  onSubmitPractice: () => void;
}

export function SpeakingHeader({ onRandomPrompt, onSubmitPractice }: SpeakingHeaderProps) {
  return (
    <header className="flex h-10 items-center justify-between rounded-sm bg-[#245b86] px-3 text-white">
      <div className="flex items-center gap-2 text-xs font-bold">
        <Mic className="h-4 w-4" />
        <span>VSTEP SPEAKING</span>
      </div>
      <div className="flex items-center gap-1.5">
        <Link
          href="/speaking/settings"
          title="Cấu hình Speaking"
          aria-label="Cấu hình Speaking"
          className="grid h-8 w-8 place-items-center rounded-sm border border-white/30 bg-white/10 transition hover:bg-white/20"
        >
          <Settings className="h-4 w-4" />
        </Link>
        <button
          type="button"
          onClick={onRandomPrompt}
          title="Lấy đề nói ngẫu nhiên"
          aria-label="Lấy đề nói ngẫu nhiên"
          className="grid h-8 w-8 place-items-center rounded-sm border border-white/30 bg-white/10 transition hover:bg-white/20 cursor-pointer"
        >
          <Dices className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onSubmitPractice}
          className="ml-1 rounded-sm bg-[#df4b24] px-3 py-1.5 text-[10px] font-extrabold text-white transition hover:bg-red-700 cursor-pointer"
        >
          NỘP BÀI
        </button>
      </div>
    </header>
  );
}

