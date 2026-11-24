'use client';

import React, { useState } from 'react';
import {
  BookOpen,
  Check,
  CheckCircle2,
  Copy,
  Layers,
  MessageSquare,
  Plus,
  Sparkles,
  XCircle,
} from 'lucide-react';
import type {
  ExamHint,
  SpeakingPart1Hint,
  SpeakingPart2Hint,
  SpeakingPart3Hint,
  WritingTask1Hint,
  WritingTask2Hint,
} from '@/types/examHint';

interface ExamHintContentProps {
  hint: ExamHint;
}

function SectionLabel({
  icon: Icon,
  children,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
      {Icon && <Icon className="h-3.5 w-3.5 text-primary/80" />}
      <span>{children}</span>
    </div>
  );
}

function AreRows({
  answer,
  reason,
  example,
}: {
  answer: string;
  reason: string;
  example: string;
}) {
  return (
    <div className="space-y-1.5 text-[13px] leading-relaxed">
      <div className="flex items-start gap-2">
        <span className="mt-0.5 grid h-4.5 w-4.5 shrink-0 place-items-center rounded bg-primary/12 text-[10px] font-black text-primary">
          A
        </span>
        <p className="text-foreground font-medium">{answer}</p>
      </div>
      <div className="flex items-start gap-2">
        <span className="mt-0.5 grid h-4.5 w-4.5 shrink-0 place-items-center rounded bg-slate-500/12 text-[10px] font-black text-slate-700 dark:text-slate-300">
          R
        </span>
        <p className="text-foreground/90">{reason}</p>
      </div>
      <div className="flex items-start gap-2">
        <span className="mt-0.5 grid h-4.5 w-4.5 shrink-0 place-items-center rounded bg-violet-500/12 text-[10px] font-black text-violet-700 dark:text-violet-300">
          E
        </span>
        <p className="text-muted-foreground">{example}</p>
      </div>
    </div>
  );
}

function VocabFooter({
  reusedVocab,
  extraVocab,
}: {
  reusedVocab: string[];
  extraVocab: string[];
}) {
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const handleCopy = (raw: string) => {
    const clean = raw.replace(/^\[\+\]\s*/, '').trim();
    if (!clean) return;
    navigator.clipboard?.writeText(clean).catch(() => {});
    setCopiedText(clean);
    window.setTimeout(() => {
      setCopiedText((prev) => (prev === clean ? null : prev));
    }, 1400);
  };

  if (reusedVocab.length === 0 && extraVocab.length === 0) return null;

  return (
    <div className="space-y-2.5 border-t border-border/80 pt-3">
      {reusedVocab.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <SectionLabel icon={BookOpen}>Từ vựng từ tài liệu</SectionLabel>
            <span className="text-[10px] text-muted-foreground">Chạm để sao chép</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {reusedVocab.map((phrase, idx) => {
              const clean = phrase.trim();
              const isCopied = copiedText === clean;
              return (
                <button
                  key={`${clean}-${idx}`}
                  type="button"
                  onClick={() => handleCopy(clean)}
                  title="Sao chép cụm từ"
                  className="inline-flex items-center gap-1 rounded-md border border-primary/20 bg-primary/8 px-2 py-0.5 text-left text-[11.5px] font-medium text-primary transition hover:bg-primary/15 active:scale-[0.98] cursor-pointer"
                >
                  <span>{clean}</span>
                  {isCopied ? (
                    <Check className="h-3 w-3 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <Copy className="h-2.5 w-2.5 shrink-0 opacity-45" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {extraVocab.length > 0 && (
        <div className="space-y-1.5">
          <SectionLabel icon={Sparkles}>Bổ sung B1–B2 sát đề</SectionLabel>
          <div className="flex flex-wrap gap-1.5">
            {extraVocab.map((phrase, idx) => {
              const clean = phrase.replace(/^\[\+\]\s*/, '').trim();
              const isCopied = copiedText === clean;
              return (
                <button
                  key={`${clean}-${idx}`}
                  type="button"
                  onClick={() => handleCopy(clean)}
                  title="Sao chép cụm từ bổ sung"
                  className="inline-flex items-center gap-1 rounded-md border border-amber-500/25 bg-amber-500/10 px-2 py-0.5 text-left text-[11.5px] font-medium text-amber-800 dark:text-amber-300 transition hover:bg-amber-500/18 active:scale-[0.98] cursor-pointer"
                >
                  <Plus className="h-2.5 w-2.5 shrink-0 opacity-75" />
                  <span>{clean}</span>
                  {isCopied && (
                    <Check className="h-3 w-3 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function SpeakingPart1View({ hint }: { hint: SpeakingPart1Hint }) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">
          {hint.topic}
        </span>
        {hint.reusedSource && (
          <span className="rounded-md border border-border bg-muted/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            {hint.reusedSource}
          </span>
        )}
      </div>

      <div className="space-y-2.5">
        {hint.questions.map((item, idx) => (
          <div
            key={idx}
            className="rounded-lg border border-border/80 bg-muted/25 p-3 space-y-2"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-[12.5px] font-bold text-foreground leading-snug">
                {item.q}
              </p>
              {item.pillar && (
                <span className="shrink-0 rounded bg-accent px-1.5 py-0.5 text-[10px] font-bold text-accent-foreground">
                  {item.pillar}
                </span>
              )}
            </div>
            <AreRows
              answer={item.answer}
              reason={item.reason}
              example={item.example}
            />
          </div>
        ))}
      </div>

      <VocabFooter reusedVocab={hint.reusedVocab} extraVocab={hint.extraVocab} />
    </div>
  );
}

function SpeakingPart2View({ hint }: { hint: SpeakingPart2Hint }) {
  return (
    <div className="space-y-3">
      {/* Rewritten situation */}
      <div className="rounded-lg border-l-2 border-primary bg-primary/5 px-3 py-2 text-[12.5px] leading-relaxed text-foreground/90">
        <span className="mr-1.5 text-[10.5px] font-bold uppercase tracking-wide text-primary">
          Mở bài:
        </span>
        {hint.situation}
      </div>

      {/* Chosen option */}
      <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/[0.04] dark:bg-emerald-500/[0.06] p-3 space-y-2.5">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Chọn phương án tối ưu
            </span>
            <h4 className="text-[13.5px] font-extrabold text-foreground leading-snug">
              {hint.chosen.option}
            </h4>
          </div>
        </div>

        {/* KHEN 1 */}
        <div className="space-y-1 text-[12.5px] leading-relaxed">
          <span className="inline-block rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300">
            {hint.chosen.khen1Code} · Lý do 1
          </span>
          <p className="text-foreground/90">{hint.chosen.khen1Text}</p>
        </div>

        {/* KHEN 2 A-R-E */}
        <div className="rounded-md border border-border/70 bg-card/80 p-2.5 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-primary">
              KHEN 2 · A-R-E cốt lõi
            </span>
            {hint.chosen.khen2Pillar && (
              <span className="rounded bg-accent px-1.5 py-0.5 text-[10px] font-bold text-accent-foreground">
                {hint.chosen.khen2Pillar}
              </span>
            )}
          </div>
          <AreRows
            answer={hint.chosen.khen2ARE.answer}
            reason={hint.chosen.khen2ARE.reason}
            example={hint.chosen.khen2ARE.example}
          />
        </div>

        {/* KHEN 3 */}
        <div className="space-y-1 text-[12.5px] leading-relaxed">
          <span className="inline-block rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300">
            {hint.chosen.khen3Code} · Lý do 3
          </span>
          <p className="text-foreground/90">{hint.chosen.khen3Text}</p>
        </div>
      </div>

      {/* Rejected options */}
      <div className="space-y-2">
        <SectionLabel>Từ chối 2 phương án còn lại</SectionLabel>
        {hint.rejected.map((rej, idx) => (
          <div
            key={idx}
            className="rounded-lg border border-rose-500/25 bg-rose-500/[0.03] dark:bg-rose-500/[0.06] p-2.5 space-y-1"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <XCircle className="h-3.5 w-3.5 shrink-0 text-rose-500" />
                <span className="text-[12.5px] font-bold text-foreground truncate">
                  {rej.option}
                </span>
              </div>
              <span className="shrink-0 rounded bg-rose-500/15 px-1.5 py-0.5 text-[10px] font-extrabold text-rose-700 dark:text-rose-300">
                {rej.cheCode}
              </span>
            </div>
            <p className="text-[12.5px] leading-relaxed text-foreground/85 pl-5">
              {rej.reason}
            </p>
          </div>
        ))}
      </div>

      <VocabFooter reusedVocab={hint.reusedVocab} extraVocab={hint.extraVocab} />
    </div>
  );
}

function SpeakingPart3View({ hint }: { hint: SpeakingPart3Hint }) {
  return (
    <div className="space-y-3.5">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-bold uppercase text-primary">
          {hint.macroTopic}
        </span>
        <span className="rounded-md border border-border bg-muted/60 px-2 py-0.5 text-[11px] font-medium text-foreground/85">
          {hint.coreTopic}
        </span>
      </div>

      {/* Mindmap cues */}
      <div className="space-y-2">
        <SectionLabel icon={Layers}>3 Ý Mindmap (Biến đổi từ loại)</SectionLabel>
        {hint.mindmapPoints.map((pt, idx) => (
          <div
            key={idx}
            className="rounded-lg border border-border/80 bg-muted/25 p-2.5 space-y-1.5"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11.5px] font-bold text-muted-foreground">
                Ý {idx + 1}: {pt.cue}
              </span>
              <span className="shrink-0 rounded bg-primary/12 px-1.5 py-0.5 font-mono text-[10px] font-bold text-primary">
                {pt.wordForm}
              </span>
            </div>
            <p className="text-[13px] font-semibold text-foreground leading-snug">
              {pt.sentence}
            </p>
            <p className="text-[12.5px] text-foreground/85 leading-relaxed">
              {pt.expand}
            </p>
            <p className="text-[12px] text-muted-foreground leading-relaxed">
              ➔ {pt.impact}
            </p>
          </div>
        ))}

        {hint.ownIdea && (
          <div className="rounded-md border border-dashed border-border bg-muted/20 px-2.5 py-1.5 text-[11.5px] text-muted-foreground">
            <strong className="text-foreground/80">Own idea:</strong> {hint.ownIdea}
          </div>
        )}
      </div>

      {/* Follow-up questions */}
      <div className="space-y-2">
        <SectionLabel icon={MessageSquare}>Câu hỏi Follow-up (A-R-E)</SectionLabel>
        {hint.followUps.map((fu, idx) => (
          <div
            key={idx}
            className="rounded-lg border border-border/80 bg-muted/25 p-3 space-y-2"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-[12.5px] font-bold text-foreground leading-snug">
                Q{idx + 1}. {fu.q}
              </p>
              {fu.formula && (
                <span className="shrink-0 rounded bg-accent px-1.5 py-0.5 text-[10px] font-bold text-accent-foreground">
                  {fu.formula}
                </span>
              )}
            </div>
            <AreRows answer={fu.answer} reason={fu.reason} example={fu.example} />
          </div>
        ))}
      </div>

      <VocabFooter reusedVocab={hint.reusedVocab} extraVocab={hint.extraVocab} />
    </div>
  );
}

function WritingTask1View({ hint }: { hint: WritingTask1Hint }) {
  const isFormal = hint.letterType.toLowerCase().includes('formal') && !hint.letterType.toLowerCase().includes('informal');
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-1.5">
        <span
          className={`rounded-md px-2 py-0.5 text-[11px] font-extrabold ${
            isFormal
              ? 'bg-primary/12 text-primary'
              : 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300'
          }`}
        >
          {hint.letterType}
        </span>
        <span className="rounded-md border border-border bg-muted/60 px-2 py-0.5 text-[11px] font-medium text-foreground/85">
          {hint.purpose}
        </span>
      </div>

      {/* Opening */}
      <div className="rounded-lg border-l-2 border-primary bg-primary/5 px-3 py-2 text-[12.5px] leading-relaxed">
        <span className="mr-1.5 text-[10.5px] font-bold uppercase tracking-wide text-primary">
          Mở thư ({hint.opening.template}):
        </span>
        <span className="text-foreground">{hint.opening.fill}</span>
      </div>

      {/* Body */}
      <div className="space-y-2.5">
        <SectionLabel icon={Layers}>Thân bài theo yêu cầu đề</SectionLabel>
        {hint.body.map((item, idx) => (
          <div
            key={idx}
            className="rounded-lg border border-border/80 bg-muted/25 p-3 space-y-2"
          >
            <div className="space-y-1">
              <div className="flex items-start justify-between gap-2">
                <p className="text-[12.5px] font-bold text-foreground leading-snug">
                  Y{idx + 1}: {item.requirement}
                </p>
              </div>
              <span className="inline-block rounded bg-accent px-1.5 py-0.5 text-[10.5px] font-semibold text-accent-foreground">
                Khung: {item.frame}
              </span>
            </div>
            <AreRows
              answer={item.answer}
              reason={item.reason}
              example={item.example}
            />
          </div>
        ))}
      </div>

      {/* Closing */}
      <div className="rounded-lg border border-border/80 bg-muted/30 px-3 py-2 text-[12.5px] leading-relaxed">
        <span className="mr-1.5 text-[10.5px] font-bold uppercase tracking-wide text-muted-foreground">
          Kết thư ({hint.closing.template}):
        </span>
        <span className="text-foreground">{hint.closing.topic}</span>
      </div>

      <VocabFooter reusedVocab={hint.reusedVocab} extraVocab={hint.extraVocab} />
    </div>
  );
}

function WritingTask2View({ hint }: { hint: WritingTask2Hint }) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="rounded-md bg-primary/12 px-2 py-0.5 text-[11px] font-extrabold text-primary">
          {hint.essayType}
        </span>
        {hint.reusedSource && (
          <span className="rounded-md border border-border bg-muted/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            {hint.reusedSource}
          </span>
        )}
      </div>

      {/* Intro */}
      <div className="rounded-lg border-l-2 border-primary bg-primary/5 p-3 space-y-1.5 text-[12.5px] leading-relaxed">
        <div className="text-[10.5px] font-bold uppercase tracking-wider text-primary">
          Mở bài · Điền Template
        </div>
        <p>
          <span className="font-bold text-muted-foreground">[debai]:</span>{' '}
          <span className="font-semibold text-foreground">{hint.intro.debai}</span>
        </p>
        <p>
          <span className="font-bold text-muted-foreground">[ld1]:</span>{' '}
          <span className="text-foreground/90">{hint.intro.ld1}</span>
        </p>
        <p>
          <span className="font-bold text-muted-foreground">[ld2]:</span>{' '}
          <span className="text-foreground/90">{hint.intro.ld2}</span>
        </p>
      </div>

      {/* Body 1 & Body 2 */}
      {[
        { label: 'Thân bài 1', data: hint.body1 },
        { label: 'Thân bài 2', data: hint.body2 },
      ].map(({ label, data }) => (
        <div
          key={label}
          className="rounded-lg border border-border/80 bg-muted/25 p-3 space-y-2"
        >
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-primary">
                {label} · {data.focus}
              </span>
            </div>
            <span className="inline-block rounded bg-accent px-1.5 py-0.5 text-[10.5px] font-semibold text-accent-foreground">
              Khung: {data.frame}
            </span>
          </div>
          <p className="text-[13px] text-foreground leading-relaxed">
            {data.point}
          </p>
          <p className="rounded-md bg-card/70 border border-border/60 px-2.5 py-1.5 text-[12.5px] text-muted-foreground leading-relaxed">
            <strong className="text-foreground/80">Ví dụ:</strong> {data.example}
          </p>
        </div>
      ))}

      {/* Conclusion */}
      <div className="rounded-lg border border-border/80 bg-muted/30 px-3 py-2 text-[12.5px] leading-relaxed">
        <span className="mr-1.5 text-[10.5px] font-bold uppercase tracking-wide text-muted-foreground">
          Kết bài:
        </span>
        <span className="text-foreground">{hint.conclusion}</span>
      </div>

      <VocabFooter reusedVocab={hint.reusedVocab} extraVocab={hint.extraVocab} />
    </div>
  );
}

export function ExamHintContent({ hint }: ExamHintContentProps) {
  switch (hint.part) {
    case 'speaking-part1':
      return <SpeakingPart1View hint={hint} />;
    case 'speaking-part2':
      return <SpeakingPart2View hint={hint} />;
    case 'speaking-part3':
      return <SpeakingPart3View hint={hint} />;
    case 'writing-task1':
      return <WritingTask1View hint={hint} />;
    case 'writing-task2':
      return <WritingTask2View hint={hint} />;
  }
}

