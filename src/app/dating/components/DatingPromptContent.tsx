'use client';

import React from 'react';
import {
  FileText,
  HelpCircle,
  Lightbulb,
  Mail,
  MessageSquare,
  RotateCcw,
  Scale,
  Sparkles,
} from 'lucide-react';
import { toReadablePromptText, type ExamPrompt } from '@/utils/examPrompts';

interface DatingPromptContentProps {
  prompt: ExamPrompt;
  reviewCount?: number;
}

function stripMarkdownInline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*([^*\n]+)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .trim();
}

function cleanWritingBoilerplate(text: string): string {
  return text
    .replace(/\s*You should write (?:at least \d+ words|an essay of at least \d+ words[^\n.]*)[.]?/gi, '')
    .replace(/\s*You do not need to include your name or address(?:es)?[.]?/gi, '')
    .replace(/\s*Your response will be evaluated in terms of [^\n.]+[.]?/gi, '')
    .trim();
}

function splitEnglishAndViHint(optionText: string): { main: string; hint?: string } {
  const match = optionText.match(/^(.*?)\s*\(([^()]+)\)\s*$/);
  if (!match) return { main: optionText.trim() };
  const main = match[1].trim();
  const hint = match[2].trim();
  if (/[àáảãạăắằẳẵặâấầẩẫậđèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵ]/i.test(hint)) {
    return { main, hint };
  }
  return { main: optionText.trim() };
}

function capitalizeFirst(str: string): string {
  const trimmed = str.trim();
  if (!trimmed) return '';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function parseSpeakingPart1(content: string): string[] {
  const lines = stripMarkdownInline(content)
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const numbered = lines
    .filter((l) => /^(?:\d+[.)]|[-*•])\s+/.test(l))
    .map((l) => l.replace(/^(?:\d+[.)]|[-*•])\s+/, '').trim())
    .filter(Boolean);

  if (numbered.length > 0) return numbered;
  return lines;
}

function parseSpeakingPart2(content: string): {
  situation: string;
  options: { main: string; hint?: string }[];
  closing: string;
} {
  const lines = stripMarkdownInline(content)
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const situationLines: string[] = [];
  const options: { main: string; hint?: string }[] = [];
  const closingLines: string[] = [];

  for (const line of lines) {
    if (/^[-*•]\s+/.test(line)) {
      const cleanOpt = line.replace(/^[-*•]\s+/, '').trim();
      if (cleanOpt) options.push(splitEnglishAndViHint(cleanOpt));
    } else if (options.length === 0) {
      situationLines.push(line.replace(/^Situation:\s*/i, '').trim());
    } else {
      closingLines.push(line);
    }
  }

  let situation = situationLines.join(' ').trim();
  let closing = closingLines.join(' ').trim();

  if (options.length === 0 && situation) {
    const inlineMatch = situation.match(/^(.*?:\s*)([^.?!]+?)\.\s*((?:Which|What)[^]*)$/i);
    if (inlineMatch) {
      const rawPrefix = inlineMatch[1].replace(/:\s*$/, '').trim();
      const rawItems = inlineMatch[2]
        .split(/,\s*(?:or\s+)?|\s+or\s+/i)
        .map((s) => capitalizeFirst(s))
        .filter(Boolean);
      const rawClosing = inlineMatch[3].trim();

      if (rawItems.length >= 2) {
        situation = rawPrefix;
        rawItems.forEach((item) => options.push(splitEnglishAndViHint(item)));
        closing = rawClosing;
      }
    }
  }

  return { situation, options, closing };
}

function parseSpeakingPart3(title: string, content: string): {
  topic: string;
  suggestions: string[];
  followUpQuestions: string[];
} {
  const lines = stripMarkdownInline(content)
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  let topic = '';
  const topicMatch = content.match(/^Topic:\s*([^\n]+)/im);
  if (topicMatch?.[1]) {
    topic = stripMarkdownInline(topicMatch[1]);
  } else {
    topic = title.replace(/^Part\s*3\s*[-–:]?\s*(?:Topic\s*\d+\s*:\s*)?/i, '').trim() || title;
  }

  const sugIdx = lines.findIndex((l) => /^suggestions\s*:?/i.test(l));
  const qHeaderIdx = lines.findIndex((l) => /(?:follow[\s-]*up|discussion)\s+questions?\s*:?/i.test(l));

  let suggestions: string[] = [];
  if (sugIdx !== -1) {
    const rawSug = lines.slice(sugIdx + 1, qHeaderIdx !== -1 ? qHeaderIdx : undefined);
    suggestions = rawSug
      .map((l) => l.replace(/^[-*•\s]+/, '').replace(/^\[|\]$/g, '').trim())
      .filter(Boolean);
  }

  if (suggestions.length === 3) {
    suggestions = [...suggestions, 'Your own ideas'];
  } else if (suggestions.length > 4) {
    suggestions = suggestions.slice(0, 4);
  }

  let followUpQuestions: string[] = [];
  if (qHeaderIdx !== -1) {
    const inlineFirst = lines[qHeaderIdx]
      .replace(/^.*?(?:follow[\s-]*up|discussion)\s+questions?\s*:?\s*/i, '')
      .trim();
    const rawQs = [...(inlineFirst ? [inlineFirst] : []), ...lines.slice(qHeaderIdx + 1)];
    followUpQuestions = rawQs
      .map((l) => l.replace(/^(?:\d+[.)]|[-*•])\s*/, '').trim())
      .filter(Boolean);
  }

  return { topic, suggestions, followUpQuestions };
}

function parseWritingPrompt(content: string): {
  context: string;
  quote: string;
  bullets: string[];
  requirement: string;
  extra: string[];
} {
  const cleaned = cleanWritingBoilerplate(stripMarkdownInline(content));
  const blocks = cleaned
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean);

  let context = '';
  let quote = '';
  const bullets: string[] = [];
  let requirement = '';
  const extra: string[] = [];

  for (const block of blocks) {
    const blockLines = block
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    const bulletLines = blockLines.filter((l) => /^[-*•]\s+/.test(l));

    if (bulletLines.length > 0) {
      const nonBullet = blockLines.filter((l) => !/^[-*•]\s+/.test(l));
      if (nonBullet.length > 0) {
        const joined = nonBullet.join(' ');
        if (!requirement && /^(?:Write|In your)/i.test(joined)) {
          requirement = joined;
        } else if (!context) {
          context = joined;
        } else {
          extra.push(joined);
        }
      }
      bulletLines.forEach((b) => bullets.push(b.replace(/^[-*•]\s+/, '').trim()));
      continue;
    }

    const isQuoted =
      (block.startsWith('"') && block.endsWith('"')) ||
      (block.startsWith('“') && block.endsWith('”')) ||
      block.startsWith('"') ||
      block.startsWith('“');

    if (isQuoted) {
      quote = block.replace(/^[“"]+|[”"]+$/g, '').trim();
    } else if (/^Read the following statement:?$/i.test(block)) {
      continue;
    } else if (
      /^(?:Write an essay|Write an email|Write a formal|Write a letter|Discuss|To what extent|In your email|In your letter)/i.test(
        block
      )
    ) {
      requirement = requirement ? `${requirement}\n${block}` : block;
    } else if (!context) {
      context = block;
    } else if (!requirement) {
      requirement = block;
    } else {
      extra.push(block);
    }
  }

  return { context, quote, bullets, requirement, extra };
}

function ExamTypeBadge({
  label,
  sub,
  tone,
  icon: Icon,
  reviewCount,
}: {
  label: string;
  sub: string;
  tone: 'speaking' | 'writing';
  icon: React.ComponentType<{ className?: string }>;
  reviewCount?: number;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-1.5 min-w-0">
        <span
          className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10.5px] font-black uppercase tracking-wide text-white shrink-0 ${
            tone === 'speaking' ? 'bg-emerald-600' : 'bg-[#245b86] dark:bg-sky-600'
          }`}
        >
          <Icon className="h-3 w-3 shrink-0" />
          <span>{label}</span>
        </span>
        <span className="text-[11px] font-semibold text-muted-foreground truncate">{sub}</span>
      </div>

      {reviewCount && reviewCount > 0 ? (
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-500/18 border border-amber-500/40 px-2 py-0.5 text-[10px] font-black text-amber-700 dark:text-amber-300">
          <RotateCcw className="h-2.5 w-2.5" />
          Ôn lại · Lần {reviewCount + 1}
        </span>
      ) : null}
    </div>
  );
}

export function DatingPromptContent({ prompt, reviewCount }: DatingPromptContentProps) {
  // 1. SPEAKING PART 1: Social Interaction
  if (prompt.category === 'speaking-part1') {
    const questions = parseSpeakingPart1(prompt.content);
    const cleanTitle = prompt.title.replace(/^Topic\s*\d+\s*:\s*/i, '').trim() || prompt.title;

    return (
      <div className="space-y-3">
        <ExamTypeBadge
          label="Speaking Part 1"
          sub="Social Interaction · 3 phút"
          tone="speaking"
          icon={MessageSquare}
          reviewCount={reviewCount}
        />

        <h2 className="text-base sm:text-lg font-black text-foreground leading-snug">
          {cleanTitle}
        </h2>

        <div className="space-y-2.5">
          {questions.map((q, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2.5 rounded-xl border border-border/85 bg-background/85 dark:bg-background/60 px-3.5 py-3 shadow-2xs"
            >
              <span className="mt-0.5 grid h-5.5 w-5.5 shrink-0 place-items-center rounded-full bg-emerald-600 text-[11px] font-black text-white">
                {idx + 1}
              </span>
              <p className="text-[14.5px] sm:text-[15.5px] leading-relaxed font-medium text-foreground">
                {q}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 2. SPEAKING PART 2: Solution Discussion
  if (prompt.category === 'speaking-part2') {
    const { situation, options, closing } = parseSpeakingPart2(prompt.content);
    const cleanTitle =
      prompt.title.replace(/^Part\s*2\s*[-–:]?\s*Situation\s*\d+\s*:\s*/i, '').trim() ||
      prompt.title;
    const optionLetters = ['A', 'B', 'C', 'D'];

    return (
      <div className="space-y-3">
        <ExamTypeBadge
          label="Speaking Part 2"
          sub="Solution Discussion · 4 phút"
          tone="speaking"
          icon={Scale}
          reviewCount={reviewCount}
        />

        <h2 className="text-base sm:text-lg font-black text-foreground leading-snug">
          {cleanTitle}
        </h2>

        {situation && (
          <div className="rounded-xl border-l-3 border-emerald-500 bg-emerald-500/8 dark:bg-emerald-500/12 px-3.5 py-2.5 text-[14px] sm:text-[15px] leading-relaxed text-foreground">
            <span className="font-extrabold text-emerald-700 dark:text-emerald-400">
              Situation:{' '}
            </span>
            {situation}
          </div>
        )}

        {options.length > 0 && (
          <div className="grid grid-cols-1 gap-2">
            {options.map((opt, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2.5 rounded-xl border border-border bg-background/90 dark:bg-background/60 px-3.5 py-2.5"
              >
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md bg-emerald-600/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 text-xs font-black border border-emerald-500/30">
                  {optionLetters[idx] || idx + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-[14px] sm:text-[15px] font-bold text-foreground leading-snug">
                    {opt.main}
                  </p>
                  {opt.hint && (
                    <p className="mt-0.5 text-xs text-muted-foreground leading-snug">{opt.hint}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {closing && (
          <div className="flex items-start gap-2 rounded-xl border border-border/80 bg-muted/60 px-3.5 py-2.5 text-[13.5px] sm:text-[14.5px] font-bold text-foreground">
            <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>{closing}</span>
          </div>
        )}

        {!situation && options.length === 0 && (
          <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">
            {toReadablePromptText(prompt.content)}
          </p>
        )}
      </div>
    );
  }

  // 3. SPEAKING PART 3: Topic Development
  if (prompt.category === 'speaking-part3') {
    const { topic, suggestions, followUpQuestions } = parseSpeakingPart3(
      prompt.title,
      prompt.content
    );

    return (
      <div className="space-y-3">
        <ExamTypeBadge
          label="Speaking Part 3"
          sub="Topic Development · 5 phút"
          tone="speaking"
          icon={Lightbulb}
          reviewCount={reviewCount}
        />

        {/* VSTEP Part 3 Diagram */}
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/20 p-3 space-y-2.5">
          <div className="mx-auto max-w-lg rounded-xl border-2 border-emerald-600/70 dark:border-emerald-400/70 bg-card px-3.5 py-2.5 text-center shadow-xs">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Topic
            </p>
            <h2 className="mt-0.5 text-[15px] sm:text-base font-black text-foreground leading-snug">
              {topic}
            </h2>
          </div>

          {suggestions.length > 0 && (
            <div className="flex flex-col items-center">
              <div className="h-2.5 w-0.5 bg-emerald-500/50" />
              <div className="h-0.5 w-3/4 bg-emerald-500/40 rounded-full" />
            </div>
          )}

          {suggestions.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {suggestions.map((sug, idx) => {
                const isOwnIdea = /your own ideas?/i.test(sug);
                return (
                  <div
                    key={idx}
                    className={`flex items-center justify-center rounded-xl px-3 py-2 text-center text-[13px] sm:text-[13.5px] leading-snug min-h-[46px] ${
                      isOwnIdea
                        ? 'border border-dashed border-emerald-500/60 bg-background/50 font-semibold italic text-muted-foreground'
                        : 'border border-border bg-card font-semibold text-foreground shadow-2xs'
                    }`}
                  >
                    {sug}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {followUpQuestions.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
              Follow-up Questions
            </p>
            <div className="space-y-1.5">
              {followUpQuestions.map((q, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 rounded-xl border border-border/80 bg-background/80 px-3 py-2 text-[13.5px] sm:text-[14.5px] leading-relaxed text-foreground"
                >
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/15 text-[10.5px] font-black text-primary">
                    {idx + 1}
                  </span>
                  <span>{q}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // 4. WRITING TASK 1: Letter / Email
  if (prompt.category === 'writing-task1') {
    const { context, quote, bullets, requirement, extra } = parseWritingPrompt(prompt.content);
    const cleanTitle =
      prompt.title.replace(/^Task\s*1(?:\.\d+)?\s*:\s*/i, '').trim() || prompt.title;

    return (
      <div className="space-y-3">
        <ExamTypeBadge
          label="Writing Task 1"
          sub="Letter / Email · 20m · ≥120 từ"
          tone="writing"
          icon={Mail}
          reviewCount={reviewCount}
        />

        <h2 className="text-base sm:text-lg font-black text-foreground leading-snug">
          {cleanTitle}
        </h2>

        {context && (
          <p className="text-[13.5px] sm:text-[14.5px] leading-relaxed text-muted-foreground">
            {context}
          </p>
        )}

        {quote && (
          <div className="rounded-xl border border-blue-500/25 bg-blue-500/6 dark:bg-sky-500/10 overflow-hidden">
            <div className="flex items-center gap-1.5 border-b border-blue-500/20 bg-blue-500/10 dark:bg-sky-500/15 px-3.5 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-blue-800 dark:text-sky-300">
              <Mail className="h-3 w-3" />
              <span>Nội dung thư / email</span>
            </div>
            <p className="px-3.5 py-3 text-[14px] sm:text-[15px] italic leading-relaxed text-foreground">
              &ldquo;{quote}&rdquo;
            </p>
          </div>
        )}

        {bullets.length > 0 && (
          <div className="rounded-xl border border-border bg-background/85 px-3.5 py-2.5 space-y-1.5">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-primary">
              Các ý cần trả lời:
            </p>
            <ul className="space-y-1.5">
              {bullets.map((item, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2 text-[14px] sm:text-[14.5px] leading-relaxed text-foreground"
                >
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {requirement && (
          <div className="flex items-start gap-2 rounded-xl border border-blue-500/30 bg-muted/60 px-3.5 py-2.5 text-[14px] sm:text-[14.5px] font-bold text-foreground leading-relaxed">
            <span className="mt-0.5 shrink-0 text-primary">▶</span>
            <span className="whitespace-pre-line">{requirement}</span>
          </div>
        )}

        {extra.length > 0 && (
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {extra.join('\n')}
          </p>
        )}

        {!quote && bullets.length === 0 && !requirement && (
          <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">
            {toReadablePromptText(prompt.content)}
          </p>
        )}
      </div>
    );
  }

  // 5. WRITING TASK 2: Essay Writing
  if (prompt.category === 'writing-task2') {
    const { context, quote, requirement, extra } = parseWritingPrompt(prompt.content);
    const cleanTitle =
      prompt.title.replace(/^Task\s*2(?:\.\d+)?\s*:\s*/i, '').trim() || prompt.title;

    return (
      <div className="space-y-3">
        <ExamTypeBadge
          label="Writing Task 2"
          sub="Essay · 40m · ≥250 từ"
          tone="writing"
          icon={FileText}
          reviewCount={reviewCount}
        />

        <h2 className="text-base sm:text-lg font-black text-foreground leading-snug">
          {cleanTitle}
        </h2>

        {context && !/^Read the following/i.test(context) && (
          <p className="text-[13.5px] sm:text-[14.5px] leading-relaxed text-muted-foreground">
            {context}
          </p>
        )}

        {quote && (
          <div className="rounded-xl border-l-3 border-primary bg-primary/6 dark:bg-primary/12 px-4 py-3 text-[14.5px] sm:text-[15.5px] italic leading-relaxed text-foreground">
            &ldquo;{quote}&rdquo;
          </div>
        )}

        {requirement && (
          <div className="rounded-xl border border-primary/30 bg-muted/65 px-4 py-3 text-[14px] sm:text-[15px] font-bold text-foreground leading-relaxed shadow-2xs">
            <div className="mb-1 flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-primary">
              <Sparkles className="h-3 w-3" />
              <span>Yêu cầu bài luận</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="mt-0.5 shrink-0 text-primary">▶</span>
              <span className="whitespace-pre-line">{requirement}</span>
            </div>
          </div>
        )}

        {extra.length > 0 && (
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {extra.join('\n')}
          </p>
        )}

        {!quote && !requirement && (
          <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">
            {toReadablePromptText(prompt.content)}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      <h2 className="text-base font-black text-foreground">{prompt.title}</h2>
      <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">
        {toReadablePromptText(prompt.content)}
      </p>
    </div>
  );
}
