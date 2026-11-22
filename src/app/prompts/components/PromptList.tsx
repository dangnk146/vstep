'use client';

import React, { useMemo, useState } from 'react';
import {
  ArrowDownUp,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Download,
  Eye,
  FileText,
  Layers,
  LayoutGrid,
  Lightbulb,
  LoaderCircle,
  Mail,
  MessageSquare,
  Scale,
  Sparkles,
} from 'lucide-react';
import {
  toReadablePromptText,
  type ExamCategory,
  type ExamPrompt,
} from '@/utils/examPrompts';
import type { PromptSortMode } from '../types';

interface PromptListProps {
  prompts: ExamPrompt[];
  isLoading: boolean;
  isDownloading?: boolean;
  selectedPromptId?: string;
  copiedPromptId: string | null;
  copiedAll: boolean;
  onlyNew: boolean;
  newPromptsCount: number;
  sortMode: PromptSortMode;
  onToggleOnlyNew: () => void;
  onSortModeChange: (mode: PromptSortMode) => void;
  onSelectPrompt: (prompt: ExamPrompt) => void;
  onCopyPrompt: (prompt: ExamPrompt) => void;
  onCopyAll: () => void;
  onDownloadCurrent: () => void;
  onOpenExportCurrent: () => void;
}

type CategoryStyle = {
  id: ExamCategory;
  shortLabel: string;
  label: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  cardBorderLeft: string;
  badgeClass: string;
  headerBg: string;
  headerBorder: string;
  iconBox: string;
  titleColor: string;
  jumpPill: string;
};

const CATEGORY_ORDER: ExamCategory[] = [
  'speaking-part1',
  'speaking-part2',
  'speaking-part3',
  'writing-task1',
  'writing-task2',
];

const CATEGORY_STYLES: Record<ExamCategory, CategoryStyle> = {
  'speaking-part1': {
    id: 'speaking-part1',
    shortLabel: 'SP Part 1',
    label: 'Speaking Part 1',
    subtitle: 'Social Interaction',
    icon: MessageSquare,
    cardBorderLeft: 'border-l-emerald-500',
    badgeClass:
      'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25',
    headerBg: 'bg-emerald-500/8 dark:bg-emerald-500/12',
    headerBorder: 'border-emerald-500/25',
    iconBox: 'bg-emerald-600 text-white',
    titleColor: 'text-emerald-800 dark:text-emerald-300',
    jumpPill:
      'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20',
  },
  'speaking-part2': {
    id: 'speaking-part2',
    shortLabel: 'SP Part 2',
    label: 'Speaking Part 2',
    subtitle: 'Solution Discussion',
    icon: Scale,
    cardBorderLeft: 'border-l-teal-500',
    badgeClass:
      'bg-teal-500/12 text-teal-700 dark:text-teal-300 border border-teal-500/25',
    headerBg: 'bg-teal-500/8 dark:bg-teal-500/12',
    headerBorder: 'border-teal-500/25',
    iconBox: 'bg-teal-600 text-white',
    titleColor: 'text-teal-800 dark:text-teal-300',
    jumpPill:
      'border-teal-500/30 bg-teal-500/10 text-teal-700 dark:text-teal-300 hover:bg-teal-500/20',
  },
  'speaking-part3': {
    id: 'speaking-part3',
    shortLabel: 'SP Part 3',
    label: 'Speaking Part 3',
    subtitle: 'Topic Development',
    icon: Lightbulb,
    cardBorderLeft: 'border-l-amber-500',
    badgeClass:
      'bg-amber-500/14 text-amber-800 dark:text-amber-300 border border-amber-500/30',
    headerBg: 'bg-amber-500/8 dark:bg-amber-500/12',
    headerBorder: 'border-amber-500/25',
    iconBox: 'bg-amber-500 text-white',
    titleColor: 'text-amber-800 dark:text-amber-300',
    jumpPill:
      'border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300 hover:bg-amber-500/20',
  },
  'writing-task1': {
    id: 'writing-task1',
    shortLabel: 'WR Task 1',
    label: 'Writing Task 1',
    subtitle: 'Letter / Email',
    icon: Mail,
    cardBorderLeft: 'border-l-sky-500',
    badgeClass:
      'bg-sky-500/12 text-sky-700 dark:text-sky-300 border border-sky-500/25',
    headerBg: 'bg-sky-500/8 dark:bg-sky-500/12',
    headerBorder: 'border-sky-500/25',
    iconBox: 'bg-sky-600 text-white',
    titleColor: 'text-sky-800 dark:text-sky-300',
    jumpPill:
      'border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300 hover:bg-sky-500/20',
  },
  'writing-task2': {
    id: 'writing-task2',
    shortLabel: 'WR Task 2',
    label: 'Writing Task 2',
    subtitle: 'Essay Writing',
    icon: FileText,
    cardBorderLeft: 'border-l-indigo-500',
    badgeClass:
      'bg-indigo-500/12 text-indigo-700 dark:text-indigo-300 border border-indigo-500/25',
    headerBg: 'bg-indigo-500/8 dark:bg-indigo-500/12',
    headerBorder: 'border-indigo-500/25',
    iconBox: 'bg-indigo-600 text-white',
    titleColor: 'text-indigo-800 dark:text-indigo-300',
    jumpPill:
      'border-indigo-500/30 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-500/20',
  },
};

function cleanCardTitle(title: string): string {
  return (
    title
      .replace(/^Part\s*[123]\s*[-–:]?\s*(?:Situation|Topic)\s*\d*\s*:\s*/i, '')
      .replace(/^Topic\s*\d+\s*:\s*/i, '')
      .replace(/^Task\s*[12](?:\.\d+)?\s*:\s*/i, '')
      .trim() || title
  );
}

function cleanCardSnippet(content: string): string {
  return toReadablePromptText(content)
    .replace(/^Read the following statement:\s*/i, '')
    .replace(/^Situation:\s*/i, '')
    .replace(/^Topic:\s*/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function PromptList({
  prompts,
  isLoading,
  isDownloading,
  selectedPromptId,
  copiedPromptId,
  copiedAll,
  onlyNew,
  newPromptsCount,
  sortMode,
  onToggleOnlyNew,
  onSortModeChange,
  onSelectPrompt,
  onCopyPrompt,
  onCopyAll,
  onDownloadCurrent,
  onOpenExportCurrent,
}: PromptListProps) {
  const [groupByPart, setGroupByPart] = useState(true);
  const [collapsedSections, setCollapsedSections] = useState<Partial<Record<ExamCategory, boolean>>>({});

  const groupedSections = useMemo(() => {
    const map = new Map<ExamCategory, ExamPrompt[]>();
    for (const p of prompts) {
      const list = map.get(p.category) || [];
      list.push(p);
      map.set(p.category, list);
    }
    return CATEGORY_ORDER.map((catId) => ({
      meta: CATEGORY_STYLES[catId],
      items: map.get(catId) || [],
    })).filter((section) => section.items.length > 0);
  }, [prompts]);

  const hasMultipleParts = groupedSections.length > 1;
  const shouldRenderGrouped = groupByPart && hasMultipleParts;

  const toggleSection = (catId: ExamCategory) => {
    setCollapsedSections((prev) => ({ ...prev, [catId]: !prev[catId] }));
  };

  const jumpToSection = (catId: ExamCategory) => {
    setCollapsedSections((prev) => ({ ...prev, [catId]: false }));
    const el = document.getElementById(`prompt-group-${catId}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const renderCard = (prompt: ExamPrompt, showCategoryBadge: boolean) => {
    const isSelected = selectedPromptId === prompt.id;
    const style = CATEGORY_STYLES[prompt.category];
    const isCardCopied = copiedPromptId === prompt.id;
    const metaLine = [prompt.school, prompt.batch].filter(Boolean).join(' · ');

    return (
      <div
        key={prompt.id}
        onClick={() => onSelectPrompt(prompt)}
        className={`group relative flex flex-col justify-between rounded-sm border border-l-3 ${style.cardBorderLeft} p-3 text-left transition hover:shadow-sm cursor-pointer ${
          isSelected
            ? 'border-[#245b86] bg-[#245b86]/6 ring-1 ring-[#245b86]/30'
            : 'border-border bg-card hover:border-primary/45'
        }`}
      >
        <div>
          {/* Clean Top Meta Row */}
          <div className="mb-1.5 flex items-center justify-between gap-1.5">
            <div className="flex flex-wrap items-center gap-1.5 min-w-0">
              {prompt.isNew && (
                <span className="inline-flex items-center rounded-xs bg-gradient-to-r from-pink-500 to-rose-500 px-1.5 py-0.5 text-[9.5px] font-black uppercase tracking-wider text-white shadow-2xs shrink-0">
                  NEW
                </span>
              )}
              {showCategoryBadge && (
                <span
                  className={`rounded-xs px-1.5 py-0.5 text-[10px] font-bold shrink-0 ${style.badgeClass}`}
                >
                  {style.label}
                </span>
              )}
              {metaLine && (
                <span className="text-[10.5px] font-medium text-muted-foreground truncate">
                  {metaLine}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onCopyPrompt(prompt);
              }}
              title="Sao chép nhanh đề này"
              className="grid h-6 w-6 shrink-0 place-items-center rounded-xs text-muted-foreground opacity-75 group-hover:opacity-100 hover:bg-muted hover:text-foreground transition cursor-pointer"
            >
              {isCardCopied ? (
                <Check className="h-3 w-3 text-emerald-600" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </button>
          </div>

          {/* Crisp De-noised Topic Title */}
          <h3 className="text-[13px] font-extrabold leading-snug text-foreground group-hover:text-primary transition-colors">
            {cleanCardTitle(prompt.title)}
          </h3>

          {/* Clean 2-Line Snippet */}
          <p className="mt-1.5 line-clamp-2 text-[11.5px] leading-relaxed text-muted-foreground font-sans">
            {cleanCardSnippet(prompt.content)}
          </p>
        </div>

        {/* Minimal Footer */}
        <div className="mt-2.5 flex items-center justify-end pt-1.5 text-[10.5px]">
          <span className="flex items-center gap-1 font-bold text-primary/90 group-hover:text-primary group-hover:translate-x-0.5 transition-all">
            <span>Xem đề</span>
            <ArrowRight className="h-3 w-3" />
          </span>
        </div>
      </div>
    );
  };

  return (
    <section aria-label="Danh sách đề thi" className="space-y-2.5">
      {/* List Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            {isLoading ? 'Đang tải danh sách...' : 'Danh sách đề thi'}
          </span>

          {!isLoading && (newPromptsCount > 0 || onlyNew) && (
            <button
              type="button"
              onClick={onToggleOnlyNew}
              title="Lọc chỉ hiển thị các đề mới cập nhật"
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-black transition active:scale-95 cursor-pointer ${
                onlyNew
                  ? 'btn-dating-pink text-white shadow-xs'
                  : 'border border-pink-500/40 bg-pink-500/10 text-pink-600 dark:text-pink-400 hover:bg-pink-500/20'
              }`}
            >
              <Sparkles className="h-3 w-3 shrink-0" />
              <span>Đề NEW ({newPromptsCount})</span>
            </button>
          )}

          {!isLoading && (
            <div className="inline-flex items-center gap-1 rounded-xs border border-border bg-card px-2 py-0.5 text-[11px] font-semibold text-foreground shadow-2xs">
              <ArrowDownUp className="h-3 w-3 text-primary shrink-0" />
              <select
                value={sortMode}
                onChange={(e) => onSortModeChange(e.target.value as PromptSortMode)}
                aria-label="Sắp xếp danh sách đề thi"
                className="bg-transparent text-[11px] font-bold text-foreground outline-none cursor-pointer"
              >
                <option value="newest" className="bg-card text-foreground">
                  Mới thêm nhất
                </option>
                <option value="oldest" className="bg-card text-foreground">
                  Cũ nhất trước
                </option>
                <option value="default" className="bg-card text-foreground">
                  Thứ tự gốc
                </option>
              </select>
            </div>
          )}

          {!isLoading && hasMultipleParts && (
            <button
              type="button"
              onClick={() => setGroupByPart((prev) => !prev)}
              title={groupByPart ? 'Đang nhóm theo từng Part — bấm để xem trộn chung' : 'Đang xem trộn chung — bấm để nhóm theo từng Part'}
              className={`inline-flex items-center gap-1 rounded-xs border px-2 py-0.5 text-[11px] font-bold transition cursor-pointer shadow-2xs ${
                groupByPart
                  ? 'border-primary/40 bg-primary/10 text-primary'
                  : 'border-border bg-card text-muted-foreground hover:text-foreground'
              }`}
            >
              {groupByPart ? (
                <>
                  <Layers className="h-3 w-3 shrink-0" />
                  <span>Nhóm theo Part</span>
                </>
              ) : (
                <>
                  <LayoutGrid className="h-3 w-3 shrink-0" />
                  <span>Trộn chung</span>
                </>
              )}
            </button>
          )}
        </div>

        {!isLoading && prompts.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={onDownloadCurrent}
              disabled={isDownloading}
              title="Tải về file Markdown ngay lập tức"
              className="flex items-center gap-1.5 rounded-xs bg-[#7c3aed] px-2.5 py-1 text-xs font-bold text-white shadow-xs transition hover:bg-[#6d28d9] active:scale-95 disabled:opacity-60 cursor-pointer"
            >
              {isDownloading ? (
                <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5" />
              )}
              <span>{isDownloading ? 'Đang tải file...' : 'Xuất Markdown'}</span>
            </button>

            <button
              type="button"
              onClick={onCopyAll}
              title="Sao chép toàn bộ danh sách đề đang lọc vào clipboard"
              className="flex items-center gap-1 rounded-xs border border-border bg-card px-2.5 py-1 text-xs font-bold text-foreground transition hover:bg-muted active:scale-95 cursor-pointer shadow-2xs"
            >
              {copiedAll ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-emerald-700 dark:text-emerald-400">Đã chép ({prompts.length})!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Sao chép nhanh</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onOpenExportCurrent}
              title="Mở bảng xem trước Markdown và tùy biến bộ lọc xuất"
              className="flex items-center gap-1 rounded-xs border border-border bg-card px-2.5 py-1 text-xs font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground cursor-pointer shadow-2xs"
            >
              <Eye className="h-3.5 w-3.5 text-primary" />
              <span>Xem trước</span>
            </button>
          </div>
        )}
      </div>

      {/* Quick-Jump Color Pills across Part Sections */}
      {!isLoading && shouldRenderGrouped && (
        <div className="flex flex-wrap items-center gap-1.5 px-1">
          {groupedSections.map(({ meta, items }) => {
            const Icon = meta.icon;
            return (
              <button
                key={meta.id}
                type="button"
                onClick={() => jumpToSection(meta.id)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold transition active:scale-95 cursor-pointer ${meta.jumpPill}`}
              >
                <Icon className="h-3 w-3 shrink-0" />
                <span>{meta.label}</span>
                <span className="opacity-75">({items.length})</span>
              </button>
            );
          })}
        </div>
      )}

      {/* SKELETON LOADING STATE */}
      {isLoading ? (
        <div className="space-y-3 animate-fade-in">
          <div className="flex items-center justify-between rounded-xs border border-border bg-card p-3 shadow-xs">
            <div className="flex items-center gap-2.5">
              <LoaderCircle className="h-4 w-4 animate-spin text-[#7c3aed]" />
              <span className="text-xs font-bold text-foreground">Đang tải và lọc đề thi VSTEP...</span>
            </div>
            <span className="text-[11px] text-muted-foreground animate-pulse">Vui lòng đợi giây lát</span>
          </div>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div
                key={idx}
                className="rounded-sm border border-border bg-card p-3 space-y-2.5 animate-pulse"
              >
                <div className="flex items-center gap-1.5">
                  <div className="h-4 w-20 rounded-xs bg-muted" />
                  <div className="h-4 w-14 rounded-xs bg-muted" />
                </div>
                <div className="h-4 w-4/5 rounded-xs bg-muted" />
                <div className="space-y-1.5 pt-1">
                  <div className="h-3 w-full rounded-xs bg-muted/60" />
                  <div className="h-3 w-5/6 rounded-xs bg-muted/60" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : prompts.length > 0 ? (
        shouldRenderGrouped ? (
          /* GROUPED BY PART SECTIONS (Clean visual separation between Speaking P1/P2/P3 & Writing T1/T2) */
          <div className="space-y-4">
            {groupedSections.map(({ meta, items }) => {
              const Icon = meta.icon;
              const isCollapsed = Boolean(collapsedSections[meta.id]);
              const sectionNewCount = items.filter((p) => p.isNew).length;

              return (
                <div
                  key={meta.id}
                  id={`prompt-group-${meta.id}`}
                  className="scroll-mt-3 space-y-2.5"
                >
                  {/* Section Header */}
                  <button
                    type="button"
                    onClick={() => toggleSection(meta.id)}
                    className={`flex w-full items-center justify-between gap-2 rounded-sm border ${meta.headerBorder} ${meta.headerBg} px-3 py-2 text-left transition hover:brightness-98 dark:hover:brightness-110 cursor-pointer`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-xs shadow-2xs ${meta.iconBox}`}>
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 min-w-0">
                        <h2 className={`text-xs sm:text-[13px] font-black tracking-tight ${meta.titleColor}`}>
                          {meta.label}
                        </h2>
                        <span className="text-[11px] font-medium text-muted-foreground">
                          {meta.subtitle}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {sectionNewCount > 0 && (
                        <span className="rounded-full bg-pink-500/15 border border-pink-500/30 px-2 py-0.5 text-[10px] font-black text-pink-600 dark:text-pink-400">
                          {sectionNewCount} NEW
                        </span>
                      )}
                      <span className="rounded-xs bg-background/80 border border-border/70 px-2 py-0.5 text-[11px] font-bold text-foreground">
                        {items.length} đề
                      </span>
                      {isCollapsed ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </button>

                  {/* Cards inside this Part (no redundant Part badge repeated on every card) */}
                  {!isCollapsed && (
                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                      {items.map((prompt) => renderCard(prompt, false))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* SINGLE-PART OR FLAT MIXED GRID */
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {prompts.map((prompt) => renderCard(prompt, hasMultipleParts))}
          </div>
        )
      ) : (
        <div className="rounded-sm border border-dashed border-border bg-card p-8 text-center">
          <p className="text-sm font-bold text-foreground">Không tìm thấy đề thi phù hợp</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Thử xóa bớt bộ lọc trường, đợt thi hoặc từ khóa tìm kiếm.
          </p>
        </div>
      )}
    </section>
  );
}
