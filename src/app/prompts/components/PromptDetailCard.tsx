'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Check, Copy, X } from 'lucide-react';
import { getExamCategory, toReadablePromptText, type ExamPrompt } from '@/utils/examPrompts';
import { buildExamQueryString } from '@/lib/examApi';

interface PromptDetailCardProps {
  prompt: ExamPrompt;
  copied: boolean;
  defaultSchool: string;
  defaultBatch: string;
  onCopy: () => void;
  onClose: () => void;
  onPracticeWriting: (prompt: ExamPrompt) => void;
  onPracticeSpeaking: (prompt: ExamPrompt) => void;
}

export function PromptDetailCard({
  prompt,
  copied,
  defaultSchool,
  defaultBatch,
  onCopy,
  onClose,
  onPracticeWriting,
  onPracticeSpeaking,
}: PromptDetailCardProps) {
  const category = getExamCategory(prompt.category);
  const isWriting = prompt.category.startsWith('writing-');

  return (
    <section
      className="scroll-mt-4 rounded-sm border border-[#245b86]/40 bg-card shadow-sm overflow-hidden animate-fade-in"
      aria-labelledby="selected-prompt-heading"
    >
      <div className="flex items-center justify-between bg-[#245b86]/10 px-3.5 py-2.5 border-b border-[#245b86]/20">
        <div className="flex items-center gap-2">
          <span className="rounded-xs bg-[#245b86] px-2 py-0.5 text-[11px] font-bold text-white uppercase tracking-wider">
            {category ? category.label : prompt.category}
          </span>
          {prompt.school && (
            <span className="rounded-xs bg-muted px-2 py-0.5 text-[11px] font-semibold text-foreground">
              {prompt.school}
            </span>
          )}
          {prompt.batch && (
            <span className="rounded-xs bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
              Đợt {prompt.batch}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onCopy}
            className="flex items-center gap-1 rounded-xs border border-border bg-background px-2.5 py-1 text-xs font-semibold text-foreground transition hover:bg-muted cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" />
                <span>Đã chép</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Sao chép</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="grid h-7 w-7 place-items-center rounded-xs text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
            title="Đóng đề"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div>
          <h2 id="selected-prompt-heading" className="text-base font-extrabold text-foreground">
            {prompt.title}
          </h2>
          {prompt.group && (
            <p className="mt-0.5 text-xs font-medium text-muted-foreground">{prompt.group}</p>
          )}
        </div>

        <div className="rounded-sm border border-border/80 bg-background/80 p-3.5 text-[14px] leading-relaxed text-foreground whitespace-pre-line font-sans">
          {toReadablePromptText(prompt.content)}
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="text-[11px] text-muted-foreground">
            Mã đề: <code className="font-mono">{prompt.id}</code>
          </div>

          {isWriting ? (
            <Link
              href={`/writing/${prompt.category === 'writing-task1' ? 'task1' : 'task2'}?${buildExamQueryString({
                matruong: prompt.school || defaultSchool,
                batch: prompt.batch || defaultBatch,
                exam: prompt.id,
              })}`}
              onClick={() => onPracticeWriting(prompt)}
              className="flex items-center gap-1.5 rounded-sm bg-[#245b86] px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-[#1e4d72]"
            >
              <span>Luyện viết đề này</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          ) : (
            <Link
              href={`/speaking/${prompt.category.replace('speaking-', '')}?${buildExamQueryString({
                matruong: prompt.school || defaultSchool,
                batch: prompt.batch || defaultBatch,
                exam: prompt.id,
              })}`}
              onClick={() => onPracticeSpeaking(prompt)}
              className="flex items-center gap-1.5 rounded-sm bg-[#245b86] px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-[#1e4d72]"
            >
              <span>Luyện nói đề này</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
