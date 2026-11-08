'use client';

import React from 'react';
import Link from 'next/link';
import { Lightbulb, Mic, Settings } from 'lucide-react';
import { TopHeader } from '@/components/TopHeader';

interface SpeakingHeaderProps {
  onRandomPrompt: () => void;
  isLoadingRandomPrompt: boolean;
  isHintOpen?: boolean;
  onToggleHint?: () => void;
}

export function SpeakingHeader({
  onRandomPrompt,
  isLoadingRandomPrompt,
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
          title={isHintOpen ? 'Thu gọn bảng gợi ý' : 'Mở bảng gợi ý'}
          aria-label="Bật tắt bảng gợi ý"
          className={`flex h-7 items-center gap-1 rounded-xs border px-2 text-xs font-medium transition cursor-pointer ${
            isHintOpen
              ? 'border-amber-300 bg-amber-400/25 text-amber-200 hover:bg-amber-400/35'
              : 'border-white/30 bg-white/10 text-white hover:bg-white/20'
          }`}
        >
          <Lightbulb className={`h-3.5 w-3.5 ${isHintOpen ? 'text-amber-300 fill-amber-300/40' : ''}`} />
          <span className="hidden sm:inline">Gợi ý</span>
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
