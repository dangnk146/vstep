'use client';

import React from 'react';
import Link from 'next/link';
import { Dices, LoaderCircle, Mic, Settings } from 'lucide-react';

interface SpeakingHeaderProps {
  onRandomPrompt: () => void;
  isLoadingRandomPrompt: boolean;
}

export function SpeakingHeader({
  onRandomPrompt,
  isLoadingRandomPrompt,
}: SpeakingHeaderProps) {
  return (
    <header className="flex h-9 items-center justify-between rounded-sm bg-[#245b86] px-3 text-white shadow-xs">
      <div className="flex items-center gap-2 text-xs font-bold sm:text-sm">
        <Mic className="h-4 w-4" />
        <span>VSTEP Speaking</span>
      </div>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={onRandomPrompt}
          disabled={isLoadingRandomPrompt}
          title={isLoadingRandomPrompt ? 'Đang tải đề nói…' : 'Lấy đề nói ngẫu nhiên'}
          aria-label={isLoadingRandomPrompt ? 'Đang tải đề nói' : 'Lấy đề nói ngẫu nhiên'}
          aria-busy={isLoadingRandomPrompt}
          className="grid h-7 w-7 place-items-center rounded-xs border border-white/30 bg-white/10 transition hover:bg-white/20 disabled:cursor-wait disabled:opacity-70 cursor-pointer"
        >
          {isLoadingRandomPrompt ? (
            <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Dices className="h-3.5 w-3.5" />
          )}
        </button>
        <Link
          href="/speaking/settings"
          title="Cấu hình Speaking"
          aria-label="Cấu hình Speaking"
          className="grid h-7 w-7 place-items-center rounded-xs border border-white/30 bg-white/10 transition hover:bg-white/20"
        >
          <Settings className="h-3.5 w-3.5" />
        </Link>
      </div>
    </header>
  );
}
