'use client';

import React from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import type { SkillFilter, PartFilter } from '../types';
import { SCHOOL_DISPLAY_NAMES } from '../types';

interface PromptFilterBarProps {
  selectedSkill: SkillFilter;
  selectedPart: PartFilter;
  selectedSchool: string;
  selectedBatch: string;
  search: string;
  filteredCount: number;
  totalCount: number;
  counts: Record<string, number>;
  availableSchools: string[];
  availableBatches: string[];
  onSkillSelect: (skill: SkillFilter, part: PartFilter) => void;
  onSchoolChange: (school: string) => void;
  onBatchChange: (batch: string) => void;
  onSearchChange: (query: string) => void;
}

export function PromptFilterBar({
  selectedSkill,
  selectedPart,
  selectedSchool,
  selectedBatch,
  search,
  filteredCount,
  totalCount,
  counts,
  availableSchools,
  availableBatches,
  onSkillSelect,
  onSchoolChange,
  onBatchChange,
  onSearchChange,
}: PromptFilterBarProps) {
  return (
    <section className="rounded-sm border border-border bg-card p-3 shadow-xs space-y-3" aria-label="Bộ lọc ngân hàng đề">
      {/* Row 1: Skill & Part Selector Tabs */}
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <SlidersHorizontal className="h-3 w-3 text-primary" />
            Chọn phần thi & kỹ năng
          </span>
          <span className="text-xs font-semibold text-primary">
            Hiển thị {filteredCount} / {totalCount} đề
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => onSkillSelect('all', 'all')}
            className={`rounded-sm px-2.5 py-1 text-xs font-bold transition cursor-pointer ${
              selectedSkill === 'all' && selectedPart === 'all'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
            }`}
          >
            Tất cả ({counts.all || 0})
          </button>

          {/* Speaking Group */}
          <div className="flex items-center rounded-sm border border-emerald-500/30 bg-emerald-500/5 p-0.5 gap-1">
            <button
              type="button"
              onClick={() => onSkillSelect('speaking', 'all')}
              className={`rounded-xs px-2 py-0.5 text-xs font-bold transition cursor-pointer ${
                selectedSkill === 'speaking' && selectedPart === 'all'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10'
              }`}
            >
              Speaking ({counts.speaking || 0})
            </button>
            <button
              type="button"
              onClick={() => onSkillSelect('speaking', 'speaking-part1')}
              className={`rounded-xs px-2 py-0.5 text-[11px] font-semibold transition cursor-pointer ${
                selectedPart === 'speaking-part1'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Part 1 ({counts['speaking-part1'] || 0})
            </button>
            <button
              type="button"
              onClick={() => onSkillSelect('speaking', 'speaking-part2')}
              className={`rounded-xs px-2 py-0.5 text-[11px] font-semibold transition cursor-pointer ${
                selectedPart === 'speaking-part2'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Part 2 ({counts['speaking-part2'] || 0})
            </button>
            <button
              type="button"
              onClick={() => onSkillSelect('speaking', 'speaking-part3')}
              className={`rounded-xs px-2 py-0.5 text-[11px] font-semibold transition cursor-pointer ${
                selectedPart === 'speaking-part3'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Part 3 ({counts['speaking-part3'] || 0})
            </button>
          </div>

          {/* Writing Group */}
          <div className="flex items-center rounded-sm border border-blue-500/30 bg-blue-500/5 p-0.5 gap-1">
            <button
              type="button"
              onClick={() => onSkillSelect('writing', 'all')}
              className={`rounded-xs px-2 py-0.5 text-xs font-bold transition cursor-pointer ${
                selectedSkill === 'writing' && selectedPart === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-blue-700 dark:text-blue-400 hover:bg-blue-500/10'
              }`}
            >
              Writing ({counts.writing || 0})
            </button>
            <button
              type="button"
              onClick={() => onSkillSelect('writing', 'writing-task1')}
              className={`rounded-xs px-2 py-0.5 text-[11px] font-semibold transition cursor-pointer ${
                selectedPart === 'writing-task1'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Task 1 ({counts['writing-task1'] || 0})
            </button>
            <button
              type="button"
              onClick={() => onSkillSelect('writing', 'writing-task2')}
              className={`rounded-xs px-2 py-0.5 text-[11px] font-semibold transition cursor-pointer ${
                selectedPart === 'writing-task2'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Task 2 ({counts['writing-task2'] || 0})
            </button>
          </div>
        </div>
      </div>

      {/* Row 2: School, Batch & Search filters */}
      <div className="grid grid-cols-1 gap-2 pt-2 border-t border-border/60 sm:grid-cols-12 sm:items-center">
        {/* School filter */}
        <div className="sm:col-span-4 flex items-center gap-1.5">
          <span className="text-xs font-semibold text-muted-foreground shrink-0">Trường:</span>
          <select
            value={selectedSchool}
            onChange={(e) => onSchoolChange(e.target.value)}
            className="h-8 w-full rounded-xs border border-border bg-background px-2 text-xs font-semibold text-foreground outline-none focus:border-primary"
          >
            <option value="all">Tất cả các trường</option>
            {availableSchools.map((s) => (
              <option key={s} value={s}>
                {SCHOOL_DISPLAY_NAMES[s] || s}
              </option>
            ))}
          </select>
        </div>

        {/* Batch filter */}
        <div className="sm:col-span-3 flex items-center gap-1.5">
          <span className="text-xs font-semibold text-muted-foreground shrink-0">Đợt:</span>
          <select
            value={selectedBatch}
            onChange={(e) => onBatchChange(e.target.value)}
            className="h-8 w-full rounded-xs border border-border bg-background px-2 text-xs font-semibold text-foreground outline-none focus:border-primary"
          >
            <option value="all">Tất cả các đợt</option>
            {availableBatches.map((b) => (
              <option key={b} value={b}>
                Đợt {b}
              </option>
            ))}
          </select>
        </div>

        {/* Search bar */}
        <div className="sm:col-span-5 relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm theo chủ đề, từ khóa, nội dung..."
            className="h-8 w-full rounded-xs border border-border bg-background pl-8 pr-7 text-xs text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
