'use client';

import React from 'react';
import Link from 'next/link';
import { Lightbulb, Mic, Settings } from 'lucide-react';
import { TopHeader } from '@/components/TopHeader';

interface SpeakingHeaderProps {
  onRandomPrompt: () => void;
  isLoadingRandomPrompt: boolean;
  hasHint?: boolean;
  isHintOpen?: boolean;
  onToggleHint?: () => void;
}

export function SpeakingHeader({
  onRandomPrompt,
  isLoadingRandomPrompt,
  hasHint,
  isHintOpen,
  onToggleHint,
}: SpeakingHeaderProps) {
  return (
    <TopHeader
      icon={Mic}
      title="VSTEP Speaking"
      onRandom={onRandomPrompt}
      isLoadingRandom={isLoadingRandomPrompt}
      randomButtonTitle={isLoadingRandomPrompt ? 'Đang tải đề nói…' : 'Bốc đề nói ngẫu nhiên'}
    >
      {onToggleHint && (
        <button
          type="button"
          onClick={onToggleHint}
          title={isHintOpen ? 'Đóng gợi ý' : 'Mở gợi ý VSTEP B2'}
          aria-label="Bật tắt gợi ý VSTEP B2"
          className={`flex h-7 items-center gap-1 rounded-xs border px-2 text-xs font-semibold transition cursor-pointer ${
            isHintOpen
              ? 'border-sky-300 bg-sky-400/25 text-white'
              : 'border-white/30 bg-white/10 text-white hover:bg-white/20'
          }`}
        >
          <Lightbulb className="h-3.5 w-3.5 shrink-0" />
          <span className="hidden sm:inline text-[11px]">Gợi ý</span>
          {hasHint && (
            <span className="h-1.5 w-1.5 rounded-full bg-sky-300 shrink-0" />
          )}
        </button>
      )}

      <Link
        href="/speaking/settings"
        title="Cấu hình Speaking"
        aria-label="Cấu hình Speaking"
        className="grid h-7 w-7 place-items-center rounded-xs border border-white/30 bg-white/10 transition hover:bg-white/20 cursor-pointer"
      >
        <Settings className="h-3.5 w-3.5" />
      </Link>
    </TopHeader>
  );
}
