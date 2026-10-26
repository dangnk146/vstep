'use client';

import React from 'react';
import {
  ArrowRight,
  Check,
  Copy,
  Download,
  Eye,
  LoaderCircle,
} from 'lucide-react';
import { getExamCategory, toReadablePromptText, type ExamPrompt } from '@/utils/examPrompts';

interface PromptListProps {
  prompts: ExamPrompt[];
  isLoading: boolean;
  isDownloading?: boolean;
  selectedPromptId?: string;
  copiedPromptId: string | null;
  copiedAll: boolean;
  onSelectPrompt: (prompt: ExamPrompt) => void;
  onCopyPrompt: (prompt: ExamPrompt) => void;
  onCopyAll: () => void;
  onDownloadCurrent: () => void;
  onOpenExportCurrent: () => void;
}

export function PromptList({
  prompts,
  isLoading,
  isDownloading,
  selectedPromptId,
  copiedPromptId,
  copiedAll,
  onSelectPrompt,
  onCopyPrompt,
  onCopyAll,
  onDownloadCurrent,
  onOpenExportCurrent,
}: PromptListProps) {
  return (
    <section aria-label="Danh sách đề thi" className="space-y-2.5">
      {/* List Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          {isLoading ? 'Đang tải danh sách...' : `Danh sách đề thi (${prompts.length})`}
        </span>

        {!isLoading && prompts.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {/* 1. NÚT XUẤT MARKDOWN TRỰC TIẾP - MÀU TÍM NỔI BẬT */}
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
              <span>{isDownloading ? 'Đang tải file...' : `Xuất kết quả này ra Markdown (${prompts.length})`}</span>
            </button>

            {/* 2. NÚT SAO CHÉP NHANH TOÀN BỘ KẾT QUẢ ĐANG LỌC */}
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

            {/* 3. NÚT XEM TRƯỚC (PREVIEW MODAL) */}
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

      {/* SKELETON LOADING STATE */}
      {isLoading ? (
        <div className="space-y-3 animate-fade-in">
          {/* Shimmer loading banner */}
          <div className="flex items-center justify-between rounded-xs border border-border bg-card p-3 shadow-xs">
            <div className="flex items-center gap-2.5">
              <LoaderCircle className="h-4 w-4 animate-spin text-[#7c3aed]" />
              <span className="text-xs font-bold text-foreground">Đang tải và lọc đề thi VSTEP...</span>
            </div>
            <span className="text-[11px] text-muted-foreground animate-pulse">Vui lòng đợi giây lát</span>
          </div>

          {/* Grid Skeleton Cards */}
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div
                key={idx}
                className="rounded-sm border border-border bg-card p-3 space-y-2.5 animate-pulse"
              >
                <div className="flex items-center gap-1.5">
                  <div className="h-4 w-20 rounded-xs bg-muted" />
                  <div className="h-4 w-12 rounded-xs bg-muted" />
                  <div className="h-4 w-14 rounded-xs bg-muted" />
                </div>
                <div className="h-4 w-4/5 rounded-xs bg-muted" />
                <div className="space-y-1.5 pt-1">
                  <div className="h-3 w-full rounded-xs bg-muted/60" />
                  <div className="h-3 w-5/6 rounded-xs bg-muted/60" />
                </div>
                <div className="flex justify-between items-center pt-2.5 border-t border-border/40">
                  <div className="h-3 w-24 rounded-xs bg-muted/60" />
                  <div className="h-3 w-14 rounded-xs bg-muted/60" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : prompts.length > 0 ? (
        /* PROMPTS GRID */
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4">
          {prompts.map((prompt) => {
            const isSelected = selectedPromptId === prompt.id;
            const isSpeaking = prompt.category.startsWith('speaking-');
            const category = getExamCategory(prompt.category);
            const isCardCopied = copiedPromptId === prompt.id;

            return (
              <div
                key={prompt.id}
                onClick={() => onSelectPrompt(prompt)}
                className={`group relative flex flex-col justify-between rounded-sm border p-3 text-left transition hover:shadow-xs cursor-pointer ${
                  isSelected
                    ? 'border-[#245b86] bg-[#245b86]/5'
                    : 'border-border bg-card hover:border-primary/50'
                }`}
              >
                <div>
                  {/* Header Tags & Quick Copy Button */}
                  <div className="mb-2 flex items-center justify-between gap-1">
                    <div className="flex flex-wrap items-center gap-1">
                      <span
                        className={`rounded-xs px-1.5 py-0.5 text-[10px] font-bold ${
                          isSpeaking
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                            : 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20'
                        }`}
                      >
                        {category ? category.label : prompt.category}
                      </span>
                      {prompt.school && (
                        <span className="rounded-xs bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-foreground border border-border">
                          {prompt.school}
                        </span>
                      )}
                      {prompt.batch && (
                        <span className="rounded-xs bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                          {prompt.batch}
                        </span>
                      )}
                    </div>

                    {/* Quick Copy on Card */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCopyPrompt(prompt);
                      }}
                      title="Sao chép nhanh đề này"
                      className="grid h-6 w-6 shrink-0 place-items-center rounded-xs text-muted-foreground hover:bg-muted hover:text-foreground transition cursor-pointer"
                    >
                      {isCardCopied ? (
                        <Check className="h-3 w-3 text-emerald-600" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </button>
                  </div>

                  {/* Title */}
                  <h3 className="text-xs font-bold leading-snug text-foreground group-hover:text-primary transition-colors">
                    {prompt.title}
                  </h3>

                  {/* Content snippet */}
                  <p className="mt-1.5 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground font-sans">
                    {toReadablePromptText(prompt.content)}
                  </p>
                </div>

                {/* Card Footer */}
                <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-2 text-[10px]">
                  <span className="text-muted-foreground truncate max-w-[130px]">
                    {prompt.group || prompt.id}
                  </span>
                  <span className="flex items-center gap-1 font-bold text-primary group-hover:translate-x-0.5 transition-transform">
                    <span>Xem đề</span>
                    <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
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
