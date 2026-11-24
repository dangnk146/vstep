'use client';

import React from 'react';
import Link from 'next/link';
import { Mic, Settings } from 'lucide-react';
import { TopHeader } from '@/components/TopHeader';

interface SpeakingHeaderProps {
  onRandomPrompt: () => void;
  isLoadingRandomPrompt: boolean;
}

export function SpeakingHeader({
  onRandomPrompt,
  isLoadingRandomPrompt,
}: SpeakingHeaderProps) {
  return (
    <TopHeader
      icon={Mic}
      title="VSTEP Speaking"
      onRandom={onRandomPrompt}
      isLoadingRandom={isLoadingRandomPrompt}
      randomButtonTitle={isLoadingRandomPrompt ? 'Đang tải đề nói…' : 'Bốc đề nói ngẫu nhiên'}
    >
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
