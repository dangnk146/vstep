'use client';

import React from 'react';
import { Dices, LoaderCircle, type LucideIcon } from 'lucide-react';
import { useExamSettings } from '@/hooks/useExamSettings';

export interface TopHeaderProps {
  icon: LucideIcon;
  title: React.ReactNode;
  badge?: React.ReactNode;
  showExamFilter?: boolean;
  selectedSchool?: string;
  selectedBatch?: string;
  onRandom?: () => void;
  isLoadingRandom?: boolean;
  randomButtonLabel?: string;
  randomButtonTitle?: string;
  children?: React.ReactNode;
  className?: string;
}

export function TopHeader({
  icon: Icon,
  title,
  badge,
  showExamFilter = true,
  selectedSchool,
  selectedBatch,
  onRandom,
  isLoadingRandom = false,
  randomButtonLabel = 'Bốc đề',
  randomButtonTitle = 'Bốc đề ngẫu nhiên từ bộ lọc hiện tại',
  children,
  className = '',
}: TopHeaderProps) {
  const settings = useExamSettings();

  const activeSchool = selectedSchool !== undefined ? selectedSchool : settings.school;
  const activeBatch = selectedBatch !== undefined ? selectedBatch : settings.batch;

  const schoolText = !activeSchool || activeSchool.toLowerCase() === 'all' ? 'Tất cả' : activeSchool;
  const batchText = !activeBatch || activeBatch.toLowerCase() === 'all' ? 'Tất cả' : activeBatch;

  return (
    <header
      className={`flex h-9 items-center justify-between rounded-sm bg-[#245b86] px-2.5 sm:px-3 text-white shadow-xs ${className}`}
    >
      <div className="flex items-center gap-1.5 sm:gap-2 text-xs font-bold sm:text-sm min-w-0">
        <Icon className="h-4 w-4 shrink-0 text-white" />
        <span className="truncate">{title}</span>

        {badge && (
          <span className="ml-0.5 rounded-full bg-white/20 px-1.5 sm:px-2 py-0.5 text-[10px] font-semibold shrink-0">
            {badge}
          </span>
        )}

        {showExamFilter && (
          <span
            title={`Bộ lọc đề đang áp dụng: Trường ${schoolText} • Đợt ${batchText}`}
            className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] sm:text-[11px] font-bold text-white/80 bg-white/10 hover:bg-amber-400/25 hover:text-amber-200 hover:border-amber-300/40 border border-transparent transition-all duration-300 cursor-help shrink-0 shadow-2xs select-none"
          >
            ({schoolText}, {batchText})
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {onRandom && (
          <button
            type="button"
            onClick={onRandom}
            disabled={isLoadingRandom}
            title={randomButtonTitle}
            aria-label={randomButtonTitle}
            className="relative group overflow-hidden flex h-7 items-center gap-1.5 rounded-xs border border-amber-300 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 px-2 sm:px-2.5 text-xs font-black text-amber-950 shadow-xs hover:brightness-105 active:scale-95 transition cursor-pointer disabled:opacity-50"
          >
            {/* Vệt sáng óng ánh quét qua */}
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/60 to-transparent pointer-events-none" />

            {isLoadingRandom ? (
              <LoaderCircle className="h-3.5 w-3.5 animate-spin shrink-0" />
            ) : (
              <Dices className="h-3.5 w-3.5 shrink-0 transition-transform duration-500 group-hover:rotate-180 group-hover:scale-110" />
            )}
            <span className="text-[11px] font-black">{randomButtonLabel}</span>
          </button>
        )}

        {children}
      </div>
    </header>
  );
}

export default TopHeader;

