'use client';

import React from 'react';
import { Database, Dices, FileDown } from 'lucide-react';

interface PromptHeaderProps {
  totalCount: number;
  isLoading: boolean;
  onOpenExport: () => void;
  onRandomPrompt: () => void;
}

export function PromptHeader({
  totalCount,
  isLoading,
  onOpenExport,
  onRandomPrompt,
}: PromptHeaderProps) {
  return (
    <header className="flex h-9 items-center justify-between rounded-sm bg-[#245b86] px-3 text-white shadow-xs">
      <div className="flex items-center gap-2 text-xs font-bold sm:text-sm">
        <Database className="h-4 w-4" />
        <span>VSTEP Ngân Hàng Đề Thi</span>
        <span className="ml-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold">
          {totalCount} đề
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={onOpenExport}
          title="Xuất ngân hàng đề ra file Markdown"
          className="flex h-7 items-center gap-1.5 rounded-xs bg-[#7c3aed] px-2.5 text-xs font-bold text-white transition hover:bg-[#6d28d9] cursor-pointer shadow-xs"
        >
          <FileDown className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Xuất Markdown</span>
        </button>

        <button
          type="button"
          onClick={onRandomPrompt}
          disabled={isLoading || totalCount === 0}
          title="Bốc đề ngẫu nhiên"
          aria-label="Bốc đề ngẫu nhiên"
          className="grid h-7 w-7 place-items-center rounded-xs border border-white/30 bg-white/10 transition hover:bg-white/20 disabled:opacity-60 cursor-pointer"
        >
          <Dices className="h-3.5 w-3.5" />
        </button>
      </div>
    </header>
  );
}
