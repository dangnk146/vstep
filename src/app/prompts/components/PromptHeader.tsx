'use client';

import React from 'react';
import Link from 'next/link';
import { Database, FileDown, Heart } from 'lucide-react';
import { TopHeader } from '@/components/TopHeader';

interface PromptHeaderProps {
  totalCount: number;
  filteredCount: number;
  datingHref: string;
  isLoading: boolean;
  selectedSchool?: string;
  selectedBatch?: string;
  onOpenExport: () => void;
  onRandomPrompt: () => void;
}

export function PromptHeader({
  totalCount,
  filteredCount,
  datingHref,
  isLoading,
  selectedSchool,
  selectedBatch,
  onOpenExport,
  onRandomPrompt,
}: PromptHeaderProps) {
  const isDatingDisabled = isLoading || filteredCount === 0;

  return (
    <TopHeader
      icon={Database}
      title="VSTEP Ngân Hàng Đề Thi"
      badge={`${totalCount} đề`}
      selectedSchool={selectedSchool}
      selectedBatch={selectedBatch}
      onRandom={onRandomPrompt}
      isLoadingRandom={isLoading || totalCount === 0}
    >
      {isDatingDisabled ? (
        <span
          aria-disabled="true"
          title="Không có đề phù hợp bộ lọc để ôn nhanh"
          className="btn-dating-pink flex h-7 w-7 sm:w-auto items-center justify-center gap-1.5 rounded-xs sm:px-2.5 text-xs font-extrabold opacity-50 cursor-not-allowed shrink-0"
        >
          <Heart className="h-3.5 w-3.5 shrink-0 fill-white text-white" />
          <span className="hidden sm:inline text-[11px] font-black tracking-tight">Dating</span>
        </span>
      ) : (
        <Link
          href={datingHref}
          title={`Mở app ôn đề kiểu Dating (${filteredCount} đề đang lọc)`}
          aria-label="Mở ứng dụng ôn đề kiểu Dating"
          className="btn-dating-pink group flex h-7 w-7 sm:w-auto items-center justify-center gap-1.5 rounded-xs sm:px-2.5 text-xs font-extrabold transition hover:brightness-110 active:scale-95 cursor-pointer shrink-0"
        >
          <Heart className="h-3.5 w-3.5 shrink-0 fill-white text-white transition-transform duration-300 group-hover:scale-115" />
          <span className="hidden sm:inline text-[11px] font-black tracking-tight">Dating</span>
        </Link>
      )}

      <button
        type="button"
        onClick={onOpenExport}
        title="Xuất ngân hàng đề ra file Markdown"
        aria-label="Xuất ngân hàng đề ra file Markdown"
        className="flex h-7 w-7 sm:w-auto items-center justify-center gap-1.5 rounded-xs bg-[#7c3aed] sm:px-2.5 text-xs font-bold text-white transition hover:bg-[#6d28d9] active:scale-95 cursor-pointer shadow-xs shrink-0"
      >
        <FileDown className="h-3.5 w-3.5 shrink-0" />
        <span className="hidden sm:inline">Xuất Markdown</span>
      </button>
    </TopHeader>
  );
}
