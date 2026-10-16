'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useTimer } from '@/hooks/useTimer';
import {
  ChevronLeft,
  ChevronRight,
  Flag,
  Pause,
  Play,
  RotateCcw,
} from 'lucide-react';
import { READING_TESTS } from './readingTests';
import type { ReadingPassage, ReadingQuestion } from './readingTests';

const READING_TIME = 60 * 60;
const QUESTION_COUNT = 40;

function findWholeWordIndex(text: string, term: string) {
  const normalizedText = text.toLocaleLowerCase();
  const normalizedTerm = term.toLocaleLowerCase();
  let index = normalizedText.indexOf(normalizedTerm);

  while (index >= 0) {
    const before = text[index - 1] ?? '';
    const after = text[index + term.length] ?? '';
    if (!/[a-z]/i.test(before) && !/[a-z]/i.test(after)) return index;
    index = normalizedText.indexOf(normalizedTerm, index + 1);
  }

  return -1;
}

function renderPassageParagraph(
  paragraph: string,
  paragraphIndex: number,
  passage: ReadingPassage,
) {
  const highlights = passage.questions.flatMap((question: ReadingQuestion) => {
    const term = question.prompt.match(/\b(?:word|phrase)\s+["“']([^"”']+)["”']/i)?.[1]?.trim();
    if (!term || findWholeWordIndex(paragraph, term) < 0) return [];

    const referencedParagraph = question.prompt.match(/\bparagraph\s+(\d+)\b/i)?.[1];
    if (referencedParagraph) {
      const targetParagraph = passage.paragraphs[Number(referencedParagraph) - 1];
      if (targetParagraph && findWholeWordIndex(targetParagraph, term) >= 0) {
        return Number(referencedParagraph) === paragraphIndex + 1 ? [term] : [];
      }
    }

    const firstMatchingParagraph = passage.paragraphs.findIndex((text) => findWholeWordIndex(text, term) >= 0);
    return firstMatchingParagraph === paragraphIndex ? [term] : [];
  });

  const uniqueHighlights = Array.from(new Set(highlights.map((term) => term.toLocaleLowerCase())))
    .map((normalizedTerm) => highlights.find((term) => term.toLocaleLowerCase() === normalizedTerm)!)
    .map((term) => ({ term, index: findWholeWordIndex(paragraph, term) }))
    .filter((highlight) => highlight.index >= 0)
    .sort((left, right) => left.index - right.index);

  if (uniqueHighlights.length === 0) return paragraph;

  const rendered: ReactNode[] = [];
  let cursor = 0;
  uniqueHighlights.forEach(({ term, index }) => {
    if (index < cursor) return;
    rendered.push(paragraph.slice(cursor, index));
    rendered.push(<strong key={`${term}-${index}`}><em>{paragraph.slice(index, index + term.length)}</em></strong>);
    cursor = index + term.length;
  });
  rendered.push(paragraph.slice(cursor));
  return rendered;
}

export default function ReadingPage() {
  const pathname = usePathname();
  const { timeLeft, setTimeLeft, isRunning, toggle, reset } = useTimer(READING_TIME);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [flags, setFlags] = useState<Record<number, boolean>>({});
  const [questionCursor, setQuestionCursor] = useState({ passageKey: '', index: 0 });
  const [checkedPassageKeys, setCheckedPassageKeys] = useState<Set<string>>(new Set());
  const routeMatch = pathname.match(/^\/reading\/part([1-6])\/passage(\d+)$/);
  const testIndex = routeMatch ? Number(routeMatch[1]) - 1 : 0;
  const activeTest = READING_TESTS[testIndex] ?? READING_TESTS[0];
  const activePassageIndex = routeMatch
    ? Math.min(
        Math.max(Number(routeMatch[2]) - 1, 0),
        activeTest.passages.length - 1,
      )
    : 0;
  const activePassage = activeTest.passages[activePassageIndex];
  const checkedPassageKey = `${activeTest.id}:${activePassage.id}`;
  const activeQuestionIndex = questionCursor.passageKey === checkedPassageKey
    ? questionCursor.index
    : 0;
  const isPassageChecked = checkedPassageKeys.has(checkedPassageKey);
  const previousTestId = useRef(activeTest.id);
  const correctCount = activeTest.passages.reduce((total, passage) => {
    if (!checkedPassageKeys.has(`${activeTest.id}:${passage.id}`)) return total;
    return total + passage.questions.filter((question) => answers[question.number] === question.answer).length;
  }, 0);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const activeElement = document.activeElement;
      if (
        activeElement instanceof HTMLInputElement
        || activeElement instanceof HTMLTextAreaElement
        || activeElement instanceof HTMLSelectElement
        || activeElement?.getAttribute('contenteditable') === 'true'
      ) return;

      if (event.code === 'Space') {
        event.preventDefault();
        toggle();
      } else if (event.code === 'KeyR') {
        event.preventDefault();
        reset(READING_TIME);
      } else if (event.key === 'ArrowUp' || event.key === '+') {
        event.preventDefault();
        setTimeLeft((previous) => Math.min(previous + 60, READING_TIME));
      } else if (event.key === 'ArrowDown' || event.key === '-') {
        event.preventDefault();
        setTimeLeft((previous) => Math.max(previous - 60, 0));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [reset, setTimeLeft, toggle]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const match = pathname.match(/^\/reading\/part([1-6])\/passage(\d+)$/);
    const legacyPart = new URLSearchParams(window.location.search).get('part');
    const partNumber = match
      ? Number(match[1])
      : Number(legacyPart?.match(/^part([1-6])$/)?.[1] ?? 1);
    const passageNumber = match ? Number(match[2]) : 1;
    const test = READING_TESTS[partNumber - 1] ?? READING_TESTS[0];
    const validPassageNumber = Math.min(
      Math.max(passageNumber, 1),
      test.passages.length,
    );
    const canonicalPath = `/reading/part${partNumber}/passage${validPassageNumber}`;

    if (pathname !== canonicalPath || window.location.search) {
      window.history.replaceState(null, '', canonicalPath);
    }

  }, [pathname]);

  useEffect(() => {
    const resetWhenPartChanges = () => {
      const route = window.location.pathname.match(/^\/reading\/part([1-6])\//);
      const legacyPart = new URLSearchParams(window.location.search)
        .get('part')
        ?.match(/^part([1-6])$/)?.[1];
      const partNumber = Number(route?.[1] ?? legacyPart ?? 1);
      const nextTest = READING_TESTS[partNumber - 1] ?? READING_TESTS[0];
      if (previousTestId.current === nextTest.id) return;

      previousTestId.current = nextTest.id;
      setAnswers({});
      setFlags({});
      setCheckedPassageKeys(new Set());
      reset(READING_TIME);
    };
    const handleSectionSelect = (event: Event) => {
      const { skill } = (event as CustomEvent<{ skill: string }>).detail;
      if (skill === 'reading') resetWhenPartChanges();
    };

    window.addEventListener('vstep:select-section', handleSectionSelect);
    window.addEventListener('popstate', resetWhenPartChanges);
    return () => {
      window.removeEventListener('vstep:select-section', handleSectionSelect);
      window.removeEventListener('popstate', resetWhenPartChanges);
    };
  }, [reset]);

  const changePassage = (passageIndex: number) => {
    setQuestionCursor({
      passageKey: `${activeTest.id}:${activeTest.passages[passageIndex].id}`,
      index: 0,
    });
    window.history.pushState(
      null,
      '',
      `/reading/part${testIndex + 1}/passage${passageIndex + 1}`,
    );
  };

  const selectAnswer = (questionNumber: number, option: string) => {
    setAnswers((previous) => ({ ...previous, [questionNumber]: option }));
    setCheckedPassageKeys((previous) => {
      const updated = new Set(previous);
      updated.delete(checkedPassageKey);
      return updated;
    });
  };

  const checkActivePassage = () => {
    setCheckedPassageKeys((previous) => new Set(previous).add(checkedPassageKey));
  };

  const toggleFlag = (questionNumber: number) => {
    setFlags((previous) => ({ ...previous, [questionNumber]: !previous[questionNumber] }));
  };

  return (
    <div className="-mx-3 -mb-24 flex h-[calc(100dvh-6rem)] min-h-[420px] w-[calc(100%+1.5rem)] flex-col overflow-hidden animate-fade-in sm:-mx-5 sm:w-[calc(100%+2.5rem)] lg:-mx-8 lg:-mb-7 lg:h-[calc(100dvh-6.75rem)] lg:min-h-[600px] lg:w-[calc(100%+4rem)]">
      <h1 className="sr-only">VSTEP Reading</h1>

      <main className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_minmax(210px,30dvh)] gap-2 lg:grid-cols-2 lg:grid-rows-1 lg:gap-4">
        <section className="order-2 flex min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-card lg:order-2" aria-labelledby="reading-questions-heading">
          <h2 id="reading-questions-heading" className="sr-only">Câu hỏi của {activePassage.title}</h2>
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border bg-[#245b86] px-2 py-1.5 text-white lg:px-4 lg:py-2">
            <span className="text-xs font-extrabold lg:text-sm">
              <span className="lg:hidden">Câu hỏi</span>
              <span className="hidden lg:inline">{activeTest.title} · {activePassage.title}</span>
            </span>
            <div className="flex shrink-0 items-center gap-1.5">
              <span className="text-[10px] font-bold sm:text-xs" aria-live="polite">
                Điểm tham khảo: {correctCount}/{QUESTION_COUNT}
              </span>
              <button
                type="button"
                onClick={checkActivePassage}
                className="h-7 rounded-md bg-white px-2 text-[10px] font-extrabold text-[#245b86] transition-colors hover:bg-blue-50 lg:h-8 lg:px-2.5 lg:text-xs"
              >
                Kiểm tra thử
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 divide-y divide-border overflow-y-auto">
            {activePassage.questions.map((question, index) => {
              const selectedAnswer = answers[question.number];
              const correctAnswer = question.answer;

              return (
                <article
                  key={question.number}
                  className={`p-2.5 lg:p-4 ${index === activeQuestionIndex ? '' : 'hidden lg:block'}`}
                >
                  <div className="flex items-start gap-2">
                    <h3 className="flex-1 text-xs font-semibold leading-5 text-foreground lg:text-sm lg:leading-6">
                      <span className="mr-1 font-extrabold">{question.number}.</span>
                      {question.prompt}
                    </h3>
                    <button
                      type="button"
                      onClick={() => toggleFlag(question.number)}
                      aria-label={flags[question.number] ? `Bỏ đánh dấu câu ${question.number}` : `Đánh dấu câu ${question.number}`}
                      aria-pressed={Boolean(flags[question.number])}
                      className={`grid h-7 w-7 shrink-0 place-items-center rounded-md ${flags[question.number] ? 'text-amber-500' : 'text-muted-foreground/50 hover:text-amber-500'}`}
                    >
                      <Flag className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-1 grid grid-cols-2 gap-1 lg:mt-1.5 lg:gap-1">
                    {question.options.map((option) => {
                      const isSelected = selectedAnswer === option.label;
                      const isCorrect = isPassageChecked && correctAnswer === option.label;
                      const isWrongSelection = isPassageChecked && isSelected && !isCorrect;

                      return (
                        <button
                          key={option.label}
                          type="button"
                          onClick={() => selectAnswer(question.number, option.label)}
                          aria-pressed={isSelected}
                          className={`flex items-start gap-1 rounded-md border px-1.5 py-1 text-left text-[10px] leading-[14px] transition-colors lg:gap-1.5 lg:px-2 lg:py-1.5 lg:text-xs lg:leading-[18px] ${
                            isCorrect
                              ? 'border-emerald-600 bg-emerald-600 text-white'
                              : isWrongSelection
                                ? 'border-red-600 bg-red-600 text-white'
                                : isSelected
                                  ? 'border-primary/50 bg-primary/10 text-foreground'
                                  : 'border-transparent text-foreground hover:border-border hover:bg-muted'
                          }`}
                        >
                          <span className={`grid h-4 w-4 shrink-0 place-items-center rounded-full border text-[9px] font-extrabold lg:h-5 lg:w-5 lg:text-[10px] ${
                            isCorrect || isWrongSelection
                              ? 'border-white/70 bg-white/15 text-white'
                              : isSelected
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'border-border text-muted-foreground'
                          }`}>
                            {option.label}
                          </span>
                          <span>{option.text}</span>
                        </button>
                      );
                    })}
                  </div>
                </article>
              );
            })}
          </div>

          <div className="flex shrink-0 items-center justify-between gap-2 border-t border-border bg-muted/40 p-1 lg:gap-3 lg:p-3">
            <button
              type="button"
              onClick={() => setQuestionCursor({ passageKey: checkedPassageKey, index: Math.max(activeQuestionIndex - 1, 0) })}
              className="inline-flex h-7 items-center gap-1 rounded-md border border-border bg-card px-1.5 text-xs font-bold text-foreground lg:hidden"
              aria-label="Câu hỏi trước"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs font-bold text-muted-foreground lg:hidden">
              Câu {activeQuestionIndex + 1}/{activePassage.questions.length}
            </span>
            <button
              type="button"
              onClick={() => setQuestionCursor({ passageKey: checkedPassageKey, index: Math.min(activeQuestionIndex + 1, activePassage.questions.length - 1) })}
              className="inline-flex h-7 items-center gap-1 rounded-md border border-border bg-card px-1.5 text-xs font-bold text-foreground lg:hidden"
              aria-label="Câu hỏi tiếp theo"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </section>

        <section className="order-1 flex min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-card lg:order-1" aria-labelledby="reading-passage-heading">
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-x-2 gap-y-1 border-b border-border bg-[#245b86] px-2 py-2 text-white sm:px-3 lg:px-4">
            <div className="flex min-w-0 items-center gap-2">
              <h2 id="reading-passage-heading" className="text-xs font-extrabold sm:text-sm">{activePassage.title}</h2>
              <span className="hidden text-[10px] font-bold sm:inline">{activeTest.title}</span>
            </div>
            <div className="flex items-center gap-1">
              <nav className="flex items-center gap-0.5" aria-label="Chọn passage trong bộ đề">
                {activeTest.passages.map((passage, index) => (
                  <button
                    key={passage.id}
                    type="button"
                    onClick={() => changePassage(index)}
                    aria-label={`Chọn Passage ${index + 1}`}
                    aria-pressed={activePassageIndex === index}
                    className={`grid h-7 min-w-6 place-items-center rounded px-1 text-[10px] font-extrabold transition-colors ${
                      activePassageIndex === index ? 'bg-white text-[#245b86]' : 'text-white/80 hover:bg-white/15 hover:text-white'
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
              </nav>
              <span className="min-w-11 text-center font-mono text-[10px] font-extrabold tabular-nums" aria-live="off">
                {formatTime(timeLeft)}
              </span>
              <button
                type="button"
                onClick={toggle}
                aria-label={isRunning ? 'Tạm dừng đồng hồ' : 'Bắt đầu đồng hồ'}
                className={`grid h-7 w-7 place-items-center rounded text-white ${isRunning ? 'bg-amber-500 hover:bg-amber-600' : 'bg-white/15 hover:bg-white/25'}`}
              >
                {isRunning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              </button>
              <button
                type="button"
                onClick={() => reset(READING_TIME)}
                aria-label="Đặt lại đồng hồ"
                className="grid h-7 w-7 place-items-center rounded text-white/80 hover:bg-white/15 hover:text-white"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-5">
            <div className="space-y-6 text-[13px] leading-6 text-foreground">
              {activePassage.paragraphs.map((paragraph, index) => (
                <p key={`${activePassage.id}-${index}`}>{renderPassageParagraph(paragraph, index, activePassage)}</p>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
