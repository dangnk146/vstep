'use client';

import React, { startTransition, useState, useEffect } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { EditorView } from '@codemirror/view';
import { useTimer } from '@/hooks/useTimer';
import { diffChars, DiffToken } from '@/utils/diff';
import { 
  PenTool, 
  Play, 
  Pause, 
  RotateCcw, 
  Check, 
  RefreshCw, 
  Award,
  AlertCircle,
  Dices,
  LoaderCircle,
  Settings,
} from 'lucide-react';
import Link from 'next/link';
import { toReadablePromptText } from '@/utils/examPrompts';
import {
  buildExamQueryString,
  getExamApiSettings,
  getRandomExamPrompts,
  fetchExamPromptById,
  parseExamQueryString,
  saveExamApiSettings,
} from '@/lib/examApi';

const EDITOR_BASIC_SETUP = {
  lineNumbers: true,
  foldGutter: false,
  dropCursor: false,
  allowMultipleSelections: false,
  indentOnInput: false,
};

const EDITOR_EXTENSIONS = [
  EditorView.lineWrapping,
  EditorView.theme({
    "&": {
      height: "100%",
      backgroundColor: "transparent",
      color: "var(--foreground)",
    },
    ".cm-scroller": {
      fontFamily: "var(--font-mono), monospace",
      overflow: "auto",
    },
    ".cm-gutters": {
      backgroundColor: "var(--muted)",
      color: "var(--muted-foreground)",
      borderRight: "1px solid var(--border)",
    },
    "&.cm-focused": {
      outline: "none",
    },
    ".cm-content": {
      padding: "16px",
      caretColor: "var(--foreground)",
      color: "var(--foreground)",
    },
    ".cm-line": {
      color: "var(--foreground)",
    },
    ".cm-cursor, &.cm-focused .cm-cursor": {
      borderLeftColor: "var(--foreground) !important",
    },
    "&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground": {
      backgroundColor: "var(--selection-bg, #bae6fd) !important",
    },
    ".cm-selectionMatch": {
      backgroundColor: "var(--selection-match-bg, rgba(2, 132, 199, 0.2)) !important",
    },
    ".cm-placeholder": {
      color: "var(--muted-foreground) !important",
    },
    ".cm-gutterElement": {
      paddingRight: "8px",
    }
  })
];

const TASK1_TIME = 20 * 60; // 20 minutes
const TASK2_TIME = 40 * 60; // 40 minutes

export interface FreeTemplate {
  id: string;
  title: string;
  type: 'writing' | 'speaking';
  content: string;
}

export default function WritingPage() {
  const [activeTask, setActiveTask] = useState<'task1' | 'task2' | 'free'>('task1');
  const [bankPrompt, setBankPrompt] = useState<{ title: string; content: string } | null>(null);

  // Timers
  const timer1 = useTimer(TASK1_TIME);
  const timer2 = useTimer(TASK2_TIME);
  const timerFree = useTimer(30 * 60);

  // States
  const [template1, setTemplate1] = useState('');
  const [template2, setTemplate2] = useState('');
  const [typed1, setTyped1] = useState('');
  const [typed2, setTyped2] = useState('');
  const [typedFree, setTypedFree] = useState('');
  const [diffResult1, setDiffResult1] = useState<DiffToken[] | null>(null);
  const [diffResult2, setDiffResult2] = useState<DiffToken[] | null>(null);
  const [diffResultFree, setDiffResultFree] = useState<DiffToken[] | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Free templates
  const [freeTemplates, setFreeTemplates] = useState<FreeTemplate[]>([]);
  const [selectedFreeId, setSelectedFreeId] = useState<string>('');
  const [isLoadingRandomPrompt, setIsLoadingRandomPrompt] = useState(false);

  // Synchronize active task with URL query parameter
  useEffect(() => {
    const syncFromLocation = (consumeStoredPrompt: boolean) => {
      const parsedQuery = parseExamQueryString(window.location.search);
      const pathTask = window.location.pathname.match(/^\/writing\/(task1|task2|free)$/)?.[1];
      const queryTask = parsedQuery.task;
      const examId = parsedQuery.exam;
      const urlSchool = parsedQuery.matruong;
      const urlBatch = parsedQuery.batch;

      // Sync filter from URL to localStorage if provided
      const hasFilterInUrl = urlSchool !== undefined || urlBatch !== undefined;
      const currentSettings = getExamApiSettings();
      let nextSchool = currentSettings.school;
      let nextBatch = currentSettings.batch;

      if (hasFilterInUrl) {
        nextSchool = urlSchool && urlSchool.toLowerCase() !== 'all' ? urlSchool : '';
        nextBatch = urlBatch && urlBatch.toLowerCase() !== 'all' ? urlBatch : '';
        if (nextSchool !== currentSettings.school || nextBatch !== currentSettings.batch) {
          saveExamApiSettings({ school: nextSchool, batch: nextBatch });
        }
      }

      let task: 'task1' | 'task2' | 'free' =
        pathTask === 'task1' || pathTask === 'task2' || pathTask === 'free'
          ? pathTask
          : queryTask === 'task1' || queryTask === 'task2' || queryTask === 'free'
            ? queryTask
            : 'task1';
      let promptContent: { title: string; content: string } | null = null;
      let selectedExamId = examId || undefined;

      if (consumeStoredPrompt) {
        const savedBankPrompt = sessionStorage.getItem('vstep_bank_writing_prompt');
        if (savedBankPrompt) {
          try {
            const prompt = JSON.parse(savedBankPrompt) as {
              id?: unknown;
              title?: unknown;
              content?: unknown;
              task?: unknown;
            };
            const promptId = typeof prompt.id === 'string' ? prompt.id : undefined;
            if (!examId || examId === promptId) {
              if (typeof prompt.title === 'string' && typeof prompt.content === 'string') {
                promptContent = {
                  title: prompt.title,
                  content: toReadablePromptText(prompt.content),
                };
                if (prompt.task === 'task1' || prompt.task === 'task2') task = prompt.task;
                if (promptId) selectedExamId = promptId;
              }
            }
          } catch (error) {
            console.error('Could not read the Writing prompt from the exam API.', error);
          } finally {
            sessionStorage.removeItem('vstep_bank_writing_prompt');
          }
        }
      }

      startTransition(() => {
        setActiveTask(task);
        setBankPrompt(promptContent);
      });

      if (selectedExamId && !promptContent) {
        fetchExamPromptById(selectedExamId, 'writing')
          .then((p) => {
            if (p) {
              const taskFromPrompt = p.category === 'writing-task2' ? 'task2' : 'task1';
              startTransition(() => {
                setBankPrompt({
                  title: p.title,
                  content: toReadablePromptText(p.content),
                });
                setActiveTask(taskFromPrompt);
              });

              if (!hasFilterInUrl) {
                const promptSchool = p.school || '';
                const promptBatch = p.batch || '';
                if (promptSchool || promptBatch) {
                  saveExamApiSettings({ school: promptSchool, batch: promptBatch });
                }
              }
            }
          })
          .catch(console.error);
      }

      const queryStr = buildExamQueryString({
        matruong: nextSchool,
        batch: nextBatch,
        exam: selectedExamId,
      });
      const canonicalUrl = `/writing/${task}${queryStr ? `?${queryStr}` : ''}`;
      if (`${window.location.pathname}${window.location.search}` !== canonicalUrl) {
        window.history.replaceState(null, '', canonicalUrl);
      }
    };

    syncFromLocation(true);
    const handlePopState = () => syncFromLocation(false);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const handleSectionSelect = (event: Event) => {
      const { skill, section } = (event as CustomEvent<{ skill: string; section: string }>).detail;
      if (skill === 'writing' && (section === 'task1' || section === 'task2' || section === 'free')) {
        setActiveTask(section);
        setBankPrompt(null);

        const parsed = parseExamQueryString(window.location.search);
        delete parsed.exam;
        const queryStr = buildExamQueryString(parsed);
        window.history.replaceState(
          null,
          '',
          `/writing/${section}${queryStr ? `?${queryStr}` : ''}`,
        );
      }
    };

    window.addEventListener('vstep:select-section', handleSectionSelect);
    return () => window.removeEventListener('vstep:select-section', handleSectionSelect);
  }, []);

  const handleRandomPrompt = async () => {
    const apiSettings = getExamApiSettings();
    setIsLoadingRandomPrompt(true);
    try {
      const prompts = await getRandomExamPrompts({
        skill: 'writing',
        part: activeTask === 'task1' || activeTask === 'task2' ? activeTask : undefined,
        school: apiSettings.school,
        batch: apiSettings.batch,
        count: 1,
      });
      const prompt = prompts[0];
      if (!prompt) {
        throw new Error('Không có đề Writing phù hợp với trường, đợt thi và Task đã chọn.');
      }
      const task = prompt.category === 'writing-task2' ? 'task2' : 'task1';
      const title = prompt.title || prompt.id;
      const content = prompt.content || title;
      setBankPrompt({ title, content });
      setActiveTask(task);
      sessionStorage.setItem('vstep_bank_writing_prompt', JSON.stringify({
        id: prompt.id,
        title,
        content,
        task,
      }));

      const queryStr = buildExamQueryString({
        matruong: apiSettings.school,
        batch: apiSettings.batch,
        exam: prompt.id,
      });
      window.history.pushState(
        null,
        '',
        `/writing/${task}${queryStr ? `?${queryStr}` : ''}`,
      );
    } catch (error) {
      console.error('Could not load a random Writing prompt.', error);
      window.alert(error instanceof Error ? error.message : 'Không thể tải đề Writing.');
    } finally {
      setIsLoadingRandomPrompt(false);
    }
  };

  // Load saved templates from LocalStorage on mount & updates
  useEffect(() => {
    const savedT1 = localStorage.getItem('vstep_writing_t1_template') || '';
    const savedT2 = localStorage.getItem('vstep_writing_t2_template') || '';
    let filtered: FreeTemplate[] = [];
    const savedFree = localStorage.getItem('vstep_free_templates');
    if (savedFree) {
      try {
        const parsed = JSON.parse(savedFree) as FreeTemplate[];
        filtered = parsed.filter(t => t.type === 'writing');
      } catch (e) {
        console.error(e);
      }
    }
    startTransition(() => {
      setTemplate1(savedT1);
      setTemplate2(savedT2);
      setFreeTemplates(filtered);
      if (filtered.length > 0 && !selectedFreeId) setSelectedFreeId(filtered[0].id);
    });
  }, [activeTask, selectedFreeId]);

  const activeTimer = activeTask === 'task1' ? timer1 : activeTask === 'task2' ? timer2 : timerFree;
  const activeTemplate = activeTask === 'task1' ? template1 : activeTask === 'task2' ? template2 : (freeTemplates.find(t => t.id === selectedFreeId)?.content || '');
  const activeTyped = activeTask === 'task1' ? typed1 : activeTask === 'task2' ? typed2 : typedFree;
  const setActiveTyped = activeTask === 'task1' ? setTyped1 : activeTask === 'task2' ? setTyped2 : setTypedFree;
  const activeDiffResult = activeTask === 'task1' ? diffResult1 : activeTask === 'task2' ? diffResult2 : diffResultFree;
  const setActiveDiffResult = activeTask === 'task1' ? setDiffResult1 : activeTask === 'task2' ? setDiffResult2 : setDiffResultFree;
  const activeTimeLimit = activeTask === 'task1' ? TASK1_TIME : activeTask === 'task2' ? TASK2_TIME : 30 * 60;



  // Split tokens into lines for diff gutter
  const getDiffLines = (tokens: DiffToken[]) => {
    const lines: DiffToken[][] = [[]];
    tokens.forEach((token) => {
      if (token.char === '\n') {
        lines[lines.length - 1].push(token);
        lines.push([]);
      } else {
        lines[lines.length - 1].push(token);
      }
    });
    return lines;
  };

  const handleCheckDiff = () => {
    if (!activeTemplate.trim()) {
      alert('Vui lòng cài đặt bài mẫu trước ở mục "Cài đặt bài mẫu"!');
      return;
    }
    const diffs = diffChars(activeTemplate, activeTyped);
    setActiveDiffResult(diffs);
  };

  const getWordCount = (text: string) => {
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getStats = (diffs: DiffToken[]) => {
    let correct = 0;
    let extra = 0;
    let missing = 0;
    diffs.forEach(t => {
      if (t.type === 'correct') correct++;
      else if (t.type === 'extra') extra++;
      else if (t.type === 'missing') missing++;
    });
    
    const total = correct + missing;
    const score = total > 0 ? Math.round((correct / Math.max(total, correct + extra)) * 100) : 0;
    
    return { score, correct, extra, missing };
  };

  const diffStats = activeDiffResult ? getStats(activeDiffResult) : null;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col space-y-2 animate-fade-in pb-4">
      {/* Top Header */}
      <header className="flex h-9 items-center justify-between rounded-sm bg-[#245b86] px-3 text-white shadow-xs">
        <div className="flex items-center gap-2 text-xs font-bold sm:text-sm">
          <PenTool className="h-4 w-4" />
          <span>VSTEP Writing</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => void handleRandomPrompt()}
            disabled={isLoadingRandomPrompt}
            title={isLoadingRandomPrompt ? 'Đang tải đề viết…' : 'Lấy đề viết ngẫu nhiên'}
            aria-label={isLoadingRandomPrompt ? 'Đang tải đề viết' : 'Lấy đề viết ngẫu nhiên'}
            aria-busy={isLoadingRandomPrompt}
            className="grid h-7 w-7 place-items-center rounded-xs border border-white/30 bg-white/10 transition hover:bg-white/20 disabled:cursor-wait disabled:opacity-70 cursor-pointer"
          >
            {isLoadingRandomPrompt ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Dices className="h-3.5 w-3.5" />}
          </button>
          <Link
            href="/writing/settings"
            title="Cấu hình Writing"
            aria-label="Cấu hình Writing"
            className="grid h-7 w-7 place-items-center rounded-xs border border-white/30 bg-white/10 transition hover:bg-white/20"
          >
            <Settings className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      {/* Warning if no template */}
      {!activeTemplate.trim() && (
        <div className="flex items-center justify-between gap-2 rounded-xs border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-700 dark:text-amber-400">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>
              Chưa có bài mẫu cho <strong>{activeTask === 'task1' ? 'Task 1' : activeTask === 'task2' ? 'Task 2' : 'Tự do'}</strong>. Cài đặt mẫu để so khớp đáp án chi tiết!
            </span>
          </div>
          <Link href="/writing/settings" className="rounded-xs bg-amber-500 px-2 py-0.5 text-[11px] font-bold text-white hover:bg-amber-600 whitespace-nowrap">
            Cài Đặt Mẫu
          </Link>
        </div>
      )}

      {/* Prompt Section (Compact, boxed stimulus) */}
      <section className="rounded-sm border border-border bg-card px-3 py-2 text-foreground shadow-xs sm:px-4 sm:py-2.5">
        <p className="text-[11px] font-semibold text-muted-foreground sm:text-xs">
          You should spend about {activeTask === 'task1' ? '20' : '40'} minutes on this task.
        </p>

        {bankPrompt ? (
          <div className="mt-1 space-y-1.5 text-xs sm:text-[13px]">
            <h2 className="font-bold text-foreground">{bankPrompt.title}</h2>
            <div className="max-h-[130px] overflow-y-auto rounded-xs border border-border/80 bg-muted/20 p-2.5 text-xs italic leading-relaxed text-foreground whitespace-pre-line sm:text-[13px]">
              {bankPrompt.content}
            </div>
          </div>
        ) : activeTask === 'task1' ? (
          <div className="mt-1 space-y-1.5 text-xs sm:text-[13px]">
            <p className="font-semibold text-foreground">
              You received an email from your English friend, Jane. She asked you for some information about one of your friends. Read part of her email below.
            </p>
            <div className="rounded-xs border border-border/80 bg-muted/20 p-2.5 text-xs italic leading-relaxed text-foreground sm:text-[13px]">
              I&apos;ve just got an email from your friend, An. She said she&apos;s going to take a course in London this summer. She asked if she could stay with my family until she could find an apartment. Can you tell me a bit about her (things like her personality, hobbies and interests, and her current work or study if possible)? I want to see if she will fit in with my family.
            </div>
            <div className="text-[11px] sm:text-xs">
              <p className="font-bold text-foreground">Write an email responding to Jane.</p>
              <p className="text-muted-foreground">
                You should write at least 120 words. You do not need to include your name or addresses. Your response will be evaluated in terms of Task Fulfillment, Organization, Vocabulary and Grammar.
              </p>
            </div>
          </div>
        ) : activeTask === 'task2' ? (
          <div className="mt-1 space-y-1.5 text-xs sm:text-[13px]">
            <p className="font-semibold text-foreground">
              In many countries, online learning is becoming more common than traditional classroom learning.
            </p>
            <div className="rounded-xs border border-border/80 bg-muted/20 p-2.5 text-xs italic leading-relaxed text-foreground sm:text-[13px]">
              Some people think that online learning brings great benefits to students and schools, while others argue that traditional face-to-face education cannot be replaced.
            </div>
            <div className="text-[11px] sm:text-xs">
              <p className="font-bold text-foreground">Write an essay to discuss both views and give your own opinion.</p>
              <p className="text-muted-foreground">
                Give reasons for your answer and include any relevant examples from your own knowledge or experience. You should write at least 250 words.
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-1 space-y-1 text-xs">
            <p className="font-medium text-foreground">Luyện tập viết tự do theo mẫu cấu hình.</p>
            {freeTemplates.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-muted-foreground">Chọn bài mẫu:</span>
                <select
                  value={selectedFreeId}
                  onChange={(e) => setSelectedFreeId(e.target.value)}
                  className="rounded-xs border border-border bg-muted px-2 py-0.5 text-xs font-semibold text-foreground focus:outline-none"
                >
                  {freeTemplates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Editor Section */}
      <section className="overflow-hidden rounded-sm border border-border bg-card shadow-xs">
        {/* Editor Top Bar with Timer and Word Count */}
        <div className="flex items-center justify-between border-b border-border bg-muted/70 px-3 py-1.5 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              {activeTask === 'task1' ? 'Writing Task 1' : activeTask === 'task2' ? 'Writing Task 2' : 'Free Writing'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Word Count */}
            <div className="font-mono text-xs font-bold text-foreground">
              Words: <span className="text-sm font-black text-primary">{getWordCount(activeTyped)}</span>
              {activeTemplate && <span className="ml-1 text-[11px] font-normal text-muted-foreground">(mẫu: {getWordCount(activeTemplate)})</span>}
            </div>

            {/* Timer Block */}
            <div className="flex items-center gap-1">
              <span className={`rounded-xs px-2 py-0.5 font-mono text-xs font-extrabold tabular-nums ${
                activeTimer.timeLeft < 180 && activeTimer.timeLeft > 0 ? 'bg-red-500/10 text-red-600' : 'bg-[#df4b24] text-white'
              }`}>
                Còn lại {formatTime(activeTimer.timeLeft)}
              </span>
              <button
                type="button"
                onClick={activeTimer.toggle}
                title={activeTimer.isRunning ? 'Tạm dừng đồng hồ' : 'Bắt đầu đồng hồ'}
                aria-label={activeTimer.isRunning ? 'Tạm dừng đồng hồ' : 'Bắt đầu đồng hồ'}
                className="grid h-6 w-6 place-items-center rounded-xs border border-border bg-card text-muted-foreground hover:text-foreground cursor-pointer transition"
              >
                {activeTimer.isRunning ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
              </button>
              <button
                type="button"
                onClick={() => activeTimer.reset(activeTimeLimit)}
                title="Đặt lại đồng hồ"
                aria-label="Đặt lại đồng hồ"
                className="grid h-6 w-6 place-items-center rounded-xs border border-border bg-card text-muted-foreground hover:text-foreground cursor-pointer transition"
              >
                <RotateCcw className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>

        {/* CodeMirror */}
        <div className="bg-card text-xs sm:text-sm">
          <CodeMirror
            value={activeTyped}
            onChange={(value) => {
              setActiveTyped(value);
              if (!activeTimer.isRunning && value.length === 1 && activeTimer.timeLeft === activeTimeLimit) {
                activeTimer.start();
              }
            }}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Type your response here..."
            height="210px"
            theme="none"
            className="text-xs font-mono focus:outline-none sm:text-sm"
            basicSetup={EDITOR_BASIC_SETUP}
            extensions={EDITOR_EXTENSIONS}
          />
        </div>

        {/* Sub-toolbar underneath editor */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border bg-muted/40 px-3 py-1.5 text-xs">
          <div className="text-[11px] text-muted-foreground">
            Thời gian: {activeTask === 'task1' ? '20 phút' : activeTask === 'task2' ? '40 phút' : '30 phút'}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setActiveTyped('');
                setActiveDiffResult(null);
              }}
              className="inline-flex items-center gap-1 rounded-xs border border-border bg-card px-2.5 py-1 text-xs font-semibold text-foreground transition hover:bg-muted cursor-pointer"
            >
              <RefreshCw className="h-3 w-3" />
              <span>Xóa làm lại</span>
            </button>
            <button
              type="button"
              onClick={handleCheckDiff}
              className="inline-flex items-center gap-1 rounded-xs bg-primary px-3 py-1 text-xs font-bold text-primary-foreground transition hover:bg-primary/90 cursor-pointer shadow-xs"
            >
              <Check className="h-3 w-3" />
              <span>Kiểm Tra Đáp Án</span>
            </button>
          </div>
        </div>
      </section>

      {/* Diff Result Card (Rendered only when active) */}
      {activeDiffResult && (
        <div className="animate-fade-in rounded-sm border border-border bg-card p-3 shadow-xs">
          <div className="mb-2 flex flex-col justify-between gap-2 border-b border-border pb-2 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-bold">Độ trùng khớp chi tiết</h2>
            </div>
            {diffStats && (
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                <div className="rounded-xs bg-primary/10 px-2 py-0.5 text-primary">
                  Độ khớp: <strong className="font-black">{diffStats.score}%</strong>
                </div>
                <div className="text-emerald-600 dark:text-emerald-400">Đúng: {diffStats.correct}</div>
                <div className="text-rose-500">Dư: {diffStats.extra}</div>
                <div className="text-amber-500">Thiếu: {diffStats.missing}</div>
              </div>
            )}
          </div>

          <div className="flex max-h-[180px] flex-col space-y-0.5 overflow-y-auto rounded-xs border border-border bg-muted/30 p-2.5 font-mono text-xs leading-[20px]">
            {activeDiffResult && getDiffLines(activeDiffResult).map((line, i) => (
              <div key={i} className="flex min-h-[20px] shrink-0 items-start">
                <div className="mr-2 w-6 shrink-0 select-none border-r border-border pr-1 text-right text-muted-foreground">
                  {i + 1}
                </div>
                <div className="flex-1 break-words whitespace-pre-wrap leading-[20px]">
                  {line.map((token, idx) => {
                    if (token.type === 'correct') {
                      return <span key={idx} className="bg-emerald-500/5 font-semibold text-emerald-600 dark:text-emerald-400">{token.char}</span>;
                    }
                    if (token.type === 'extra') {
                      return <span key={idx} className="bg-rose-500/20 font-bold text-rose-600 line-through dark:text-rose-400" title="Ký tự dư">{token.char === '\n' ? '↵\n' : token.char}</span>;
                    }
                    if (token.type === 'missing') {
                      return <span key={idx} className="border-b border-amber-500/50 bg-amber-500/10 text-slate-400 dark:text-slate-600" title="Ký tự thiếu">{token.char === '\n' ? '↵\n' : token.char}</span>;
                    }
                    return null;
                  })}
                  {line.length === 0 && <span className="opacity-0"> </span>}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-2 flex gap-3 px-1 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-xs bg-emerald-500/40" /> Đúng</span>
            <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-xs bg-rose-500/40 line-through" /> Dư</span>
            <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-xs border-b border-amber-500/50 bg-amber-500/30" /> Thiếu</span>
          </div>
        </div>
      )}
    </div>
  );
}
