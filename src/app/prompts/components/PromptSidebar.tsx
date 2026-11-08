'use client';

import React from 'react';
import {
  BookOpen,
  CheckCircle2,
  Dices,
  FileDown,
  Layers,
  Mic,
  PenTool,
  Search,
  SlidersHorizontal,
  Sparkles,
  X,
} from 'lucide-react';
import type { SkillFilter, PartFilter } from '../types';
import { SCHOOL_DISPLAY_NAMES } from '../types';

interface PromptSidebarProps {
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
  onOpenExport: () => void;
  onRandomPrompt: () => void;
}

export function PromptSidebar({
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
  onOpenExport,
  onRandomPrompt,
}: PromptSidebarProps) {
  const isAllSelected = selectedSkill === 'all' && selectedPart === 'all';

  return (
    <aside className="w-full md:w-64 lg:w-72 xl:w-80 shrink-0 space-y-2.5">
      {/* 1. Search Box */}
      <div className="rounded-sm border border-border bg-card p-2.5 shadow-xs">
        <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
          <Search className="h-3 w-3 text-primary" />
          Tìm kiếm đề thi
        </label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Từ khóa, chủ đề, nội dung..."
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

      {/* 2. Phần thi & Kỹ năng (Vertical Navigation) */}
      <div className="rounded-sm border border-border bg-card p-2.5 shadow-xs space-y-2">
        <div className="flex items-center justify-between pb-1.5 border-b border-border/60">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-primary" />
            Phần thi & Kỹ năng
          </span>
          <span className="text-[11px] font-bold text-primary">
            {filteredCount}/{totalCount} đề
          </span>
        </div>

        {/* All Prompts Button */}
        <button
          type="button"
          onClick={() => onSkillSelect('all', 'all')}
          className={`flex w-full items-center justify-between rounded-xs px-2.5 py-1.5 text-xs font-bold transition cursor-pointer ${
            isAllSelected
              ? 'bg-[#245b86] text-white shadow-xs'
              : 'text-foreground hover:bg-muted'
          }`}
        >
          <span className="flex items-center gap-2">
            <BookOpen className="h-3.5 w-3.5" />
            <span>Tất cả đề thi</span>
          </span>
          <span className={`rounded-xs px-1.5 py-0.5 text-[10px] ${isAllSelected ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'}`}>
            {counts.all || 0}
          </span>
        </button>

        {/* Speaking Section */}
        <div className="space-y-0.5 pt-1">
          <div className="flex items-center justify-between px-2 py-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
            <span className="flex items-center gap-1.5">
              <Mic className="h-3.5 w-3.5" />
              <span>SPEAKING</span>
            </span>
            <button
              type="button"
              onClick={() => onSkillSelect('speaking', 'all')}
              className={`rounded-xs px-1.5 py-0.2 text-[10px] font-bold cursor-pointer transition ${
                selectedSkill === 'speaking' && selectedPart === 'all'
                  ? 'bg-emerald-600 text-white'
                  : 'text-emerald-600 hover:underline'
              }`}
            >
              Tất cả ({counts.speaking || 0})
            </button>
          </div>

          <div className="space-y-0.5 pl-2">
            {[
              { id: 'speaking-part1', label: 'Part 1: Social Interaction', count: counts['speaking-part1'] },
              { id: 'speaking-part2', label: 'Part 2: Solution Discussion', count: counts['speaking-part2'] },
              { id: 'speaking-part3', label: 'Part 3: Topic Development', count: counts['speaking-part3'] },
            ].map((p) => {
              const active = selectedPart === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onSkillSelect('speaking', p.id as PartFilter)}
                  className={`flex w-full items-center justify-between rounded-xs px-2 py-1.5 text-xs transition cursor-pointer ${
                    active
                      ? 'bg-emerald-600 text-white font-bold shadow-xs'
                      : 'text-muted-foreground hover:bg-emerald-500/10 hover:text-foreground'
                  }`}
                >
                  <span className="truncate pr-1">{p.label}</span>
                  <span className={`rounded-xs px-1.5 py-0.2 text-[10px] ${active ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'}`}>
                    {p.count || 0}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Writing Section */}
        <div className="space-y-0.5 pt-1 border-t border-border/50">
          <div className="flex items-center justify-between px-2 py-1 text-[11px] font-bold text-blue-700 dark:text-blue-400">
            <span className="flex items-center gap-1.5">
              <PenTool className="h-3.5 w-3.5" />
              <span>WRITING</span>
            </span>
            <button
              type="button"
              onClick={() => onSkillSelect('writing', 'all')}
              className={`rounded-xs px-1.5 py-0.2 text-[10px] font-bold cursor-pointer transition ${
                selectedSkill === 'writing' && selectedPart === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'text-blue-600 hover:underline'
              }`}
            >
              Tất cả ({counts.writing || 0})
            </button>
          </div>

          <div className="space-y-0.5 pl-2">
            {[
              { id: 'writing-task1', label: 'Task 1: Letter / Email', count: counts['writing-task1'] },
              { id: 'writing-task2', label: 'Task 2: Essay Writing', count: counts['writing-task2'] },
            ].map((p) => {
              const active = selectedPart === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onSkillSelect('writing', p.id as PartFilter)}
                  className={`flex w-full items-center justify-between rounded-xs px-2 py-1.5 text-xs transition cursor-pointer ${
                    active
                      ? 'bg-blue-600 text-white font-bold shadow-xs'
                      : 'text-muted-foreground hover:bg-blue-500/10 hover:text-foreground'
                  }`}
                >
                  <span className="truncate pr-1">{p.label}</span>
                  <span className={`rounded-xs px-1.5 py-0.2 text-[10px] ${active ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'}`}>
                    {p.count || 0}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Trường thi & Đợt thi (Nổi bật tông vàng hổ phách, Hướng dẫn đồng bộ Speaking & Writing) */}
      <div className="rounded-sm border-2 border-amber-400/90 dark:border-amber-500/60 bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-card dark:from-amber-950/25 dark:via-card dark:to-card p-2.5 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between pb-1.5 border-b border-amber-300/60 dark:border-amber-600/30">
          <span className="text-[11px] font-black uppercase tracking-wider text-amber-900 dark:text-amber-400 flex items-center gap-1.5">
            <SlidersHorizontal className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
            Trường thi & Đợt thi
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 text-amber-900 dark:text-amber-300 px-2 py-0.5 text-[10px] font-bold">
            <Sparkles className="h-3 w-3 text-amber-600 dark:text-amber-400 animate-pulse" />
            Đồng bộ toàn web
          </span>
        </div>

        {/* Hướng dẫn ngắn cho người mới */}
        <div className="rounded-xs border border-amber-300/80 bg-amber-100/70 dark:border-amber-800/60 dark:bg-amber-950/40 p-2 text-[11px] leading-relaxed text-amber-950 dark:text-amber-200">
          <p className="font-bold flex items-center gap-1 text-amber-950 dark:text-amber-100">
            <span>🎯</span> Cấu hình đề ôn thi trọng tâm:
          </p>
          <p className="mt-0.5 text-[10.5px]">
            Chọn trường & đợt bạn sắp thi tại đây. Toàn bộ các tab <strong>Speaking</strong> & <strong>Writing</strong> sẽ tự động đồng bộ và bốc đúng bộ đề thi thật của trường đó!
          </p>
        </div>

        {/* Trạng thái áp dụng trực quan */}
        {selectedSchool !== 'all' ? (
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-1.5 rounded-xs border border-emerald-300 dark:border-emerald-800/60">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">
              Đang áp dụng: <strong>{SCHOOL_DISPLAY_NAMES[selectedSchool] || selectedSchool}</strong> {selectedBatch !== 'all' ? `(Đợt ${selectedBatch})` : ''}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground bg-muted/40 px-2 py-1.5 rounded-xs border border-border/70">
            <span>Đang áp dụng: Tất cả trường & đợt thi</span>
          </div>
        )}

        {/* School Dropdown */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-foreground">Trường thi mục tiêu:</label>
          <select
            value={selectedSchool}
            onChange={(e) => onSchoolChange(e.target.value)}
            className="h-8 w-full rounded-xs border-2 border-amber-300 dark:border-amber-600 bg-background px-2 text-xs font-bold text-foreground outline-none focus:border-amber-500 shadow-2xs"
          >
            <option value="all">Tất cả các trường</option>
            {availableSchools.map((s) => (
              <option key={s} value={s}>
                {SCHOOL_DISPLAY_NAMES[s] || s}
              </option>
            ))}
          </select>
        </div>

        {/* Batch Dropdown */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-muted-foreground">Đợt thi:</label>
          <select
            value={selectedBatch}
            onChange={(e) => onBatchChange(e.target.value)}
            className="h-8 w-full rounded-xs border border-border bg-background px-2 text-xs font-semibold text-foreground outline-none focus:border-primary"
          >
            <option value="all">Tất cả các đợt thi</option>
            {availableBatches.map((b) => (
              <option key={b} value={b}>
                Đợt {b}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 4. Quick Actions in Sidebar */}
      <div className="grid grid-cols-2 gap-1.5">
        <button
          type="button"
          onClick={onOpenExport}
          className="flex h-8 items-center justify-center gap-1.5 rounded-xs border border-[#7c3aed]/40 bg-[#7c3aed]/10 text-xs font-bold text-[#7c3aed] dark:text-purple-400 transition hover:bg-[#7c3aed]/20 cursor-pointer"
        >
          <FileDown className="h-3.5 w-3.5" />
          <span>Xuất .md</span>
        </button>

        {/* Nút Bốc ngẫu nhiên: Óng ánh vàng + Animation xoay xúc xắc */}
        <button
          type="button"
          onClick={onRandomPrompt}
          className="relative group overflow-hidden flex h-8 items-center justify-center gap-1.5 rounded-xs border border-amber-400 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 text-xs font-black text-amber-950 shadow-xs hover:brightness-105 active:scale-95 transition cursor-pointer"
        >
          {/* Vệt sáng óng ánh quét qua (Shimmer Gleam) */}
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/60 to-transparent pointer-events-none" />
          <Dices className="h-3.5 w-3.5 transition-transform duration-500 group-hover:rotate-180 group-hover:scale-110" />
          <span>Bốc ngẫu nhiên</span>
        </button>
      </div>
    </aside>
  );
}
