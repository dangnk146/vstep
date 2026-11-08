'use client';

import React from 'react';
import { Database, FileDown } from 'lucide-react';
import { TopHeader } from '@/components/TopHeader';

interface PromptHeaderProps {
  totalCount: number;
  isLoading: boolean;
  selectedSchool?: string;
  selectedBatch?: string;
  onOpenExport: () => void;
  onRandomPrompt: () => void;
}

export function PromptHeader({
  totalCount,
  isLoading,
  selectedSchool,
  selectedBatch,
  onOpenExport,
  onRandomPrompt,
}: PromptHeaderProps) {
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
      <button
        type="button"
        onClick={onOpenExport}
        title="Xuất ngân hàng đề ra file Markdown"
        className="flex h-7 items-center gap-1.5 rounded-xs bg-[#7c3aed] px-2.5 text-xs font-bold text-white transition hover:bg-[#6d28d9] cursor-pointer shadow-xs"
      >
        <FileDown className="h-3.5 w-3.5 shrink-0" />
        <span className="hidden sm:inline">Xuất Markdown</span>
      </button>
    </TopHeader>
  );
}
