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
import { getExamApiSettings, requestExamApi, type RemoteExam } from '@/lib/examApi';

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
      const params = new URLSearchParams(window.location.search);
      const pathTask = window.location.pathname.match(/^\/writing\/(task1|task2|free)$/)?.[1];
      const queryTask = params.get('task');
      const examId = params.get('exam');
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
            if (typeof prompt.title === 'string' && typeof prompt.content === 'string') {
              promptContent = {
                title: prompt.title,
                content: toReadablePromptText(prompt.content),
              };
              if (prompt.task === 'task1' || prompt.task === 'task2') task = prompt.task;
              if (typeof prompt.id === 'string') selectedExamId = prompt.id;
            } else {
              console.error('Invalid Writing prompt received from the exam API.');
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
      const nextParams = new URLSearchParams();
      if (selectedExamId) nextParams.set('exam', selectedExamId);
      const query = nextParams.toString();
      const canonicalUrl = `/writing/${task}${query ? `?${query}` : ''}`;
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
      }
    };

    window.addEventListener('vstep:select-section', handleSectionSelect);
    return () => window.removeEventListener('vstep:select-section', handleSectionSelect);
  }, []);

  const handleRandomPrompt = async () => {
    const apiSettings = getExamApiSettings();
    if (apiSettings.endpoint) {
      setIsLoadingRandomPrompt(true);
      try {
        const result = await requestExamApi<RemoteExam>(apiSettings.endpoint, {
          action: 'random',
          skill: 'writing',
          maTruong: apiSettings.school,
          dotThi: apiSettings.batch,
          part: activeTask === 'task1' || activeTask === 'task2' ? activeTask : '',
          count: '1',
          limit: '1000',
        });
        const prompt = result.items?.[0];
        if (!prompt) {
          throw new Error('Không có đề Writing phù hợp với trường, đợt thi và Task đã chọn.');
        }
        const task = prompt.part === 'part2' || prompt.part === 'task2' ? 'task2' : 'task1';
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
        window.history.pushState(
          null,
          '',
          `/writing/${task}?exam=${encodeURIComponent(prompt.id)}`,
        );
        return;
      } catch (error) {
        console.error('Could not load a random Writing prompt from Apps Script.', error);
        window.alert(error instanceof Error ? error.message : 'Không thể tải đề Writing.');
      } finally {
        setIsLoadingRandomPrompt(false);
      }
      return;
    }

    window.alert('Không tìm thấy cấu hình nguồn đề. Hãy mở mục Đề thi để kiểm tra kết nối.');
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
    <div className="mx-auto flex w-full max-w-6xl flex-col space-y-4 animate-fade-in pb-10">
      {/* Header */}
      <div className="flex flex-col gap-3 overflow-hidden rounded-md border border-border bg-card shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 bg-[#245b86] px-4 py-3 text-white sm:px-5">
          <div className="flex items-center gap-2 text-sm font-bold">
            <PenTool className="h-4 w-4" />
            <h1>VSTEP Writing</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void handleRandomPrompt()}
              disabled={isLoadingRandomPrompt}
              title={isLoadingRandomPrompt ? 'Đang tải đề viết…' : 'Lấy đề viết ngẫu nhiên'}
              aria-label={isLoadingRandomPrompt ? 'Đang tải đề viết' : 'Lấy đề viết ngẫu nhiên'}
              aria-busy={isLoadingRandomPrompt}
              className="grid h-9 w-9 place-items-center rounded-sm border border-white/30 bg-white/10 transition hover:bg-white/20 disabled:cursor-wait disabled:opacity-70"
            >
              {isLoadingRandomPrompt
                ? <LoaderCircle className="h-5 w-5 animate-spin" />
                : <Dices className="h-5 w-5" />}
            </button>
            <Link
              href="/writing/settings"
              title="Cấu hình Writing"
              aria-label="Cấu hình Writing"
              className="grid h-9 w-9 place-items-center rounded-sm border border-white/30 bg-white/10 transition hover:bg-white/20"
            >
              <Settings className="h-4 w-4" />
            </Link>
          </div>
        </div>

      </div>

      {/* Warning if no template */}
      {!activeTemplate.trim() && (
        <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/20 text-amber-650 dark:text-amber-500 rounded-xl text-sm font-semibold">
          <AlertCircle className="h-5 w-5 shrink-0 animate-bounce" />
          <div className="flex-1">
            {activeTask === 'free' ? (
              <span>Bạn chưa thêm đề viết tự do nào trong Cài Đặt, hoặc chưa chọn đề thi để luyện tập. Hãy thêm đề tự do để tiến hành gõ đối chiếu!</span>
            ) : (
              <span>Bạn chưa cấu hình bài mẫu cho <strong>{activeTask === 'task1' ? 'Task 1' : 'Task 2'}</strong>. Hãy tạo cấu hình mẫu để so khớp kết quả gõ!</span>
            )}
          </div>
          <Link href="/writing/settings" className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer">
            {activeTask === 'free' ? 'Thêm Đề Tự Do' : 'Cài Đặt Mẫu'}
          </Link>
        </div>
      )}

      {bankPrompt && (
        <section className="overflow-hidden rounded-md border border-border bg-card" aria-labelledby="bank-prompt-heading">
          <div className="border-b border-border bg-muted/70 px-4 py-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-primary">Đề thi · {activeTask === 'task1' ? 'Writing Task 1' : 'Writing Task 2'}</p>
              <h2 id="bank-prompt-heading" className="mt-0.5 text-sm font-bold text-foreground">{bankPrompt.title}</h2>
            </div>
          </div>
          <p className="max-h-[34vh] overflow-y-auto whitespace-pre-line px-4 py-3 text-sm leading-6 text-foreground">{bankPrompt.content}</p>
        </section>
      )}

      {/* Practice Editor Card */}
      <div className="overflow-hidden rounded-md border border-border bg-card shadow-sm">
        <div className="border-b border-border bg-muted/70 px-4 py-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <h2 className="text-sm font-bold text-foreground">Bài làm của bạn</h2>
                <p className="text-[11px] text-muted-foreground">Bắt đầu gõ để chạy đồng hồ đếm giờ</p>
              </div>
              {activeTask === 'free' && freeTemplates.length > 0 && (
                <select
                  value={selectedFreeId}
                  onChange={(e) => setSelectedFreeId(e.target.value)}
                  className="px-3 py-1.5 bg-muted border border-border rounded-xl text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary cursor-pointer"
                >
                  {freeTemplates.map((t) => (
                    <option key={t.id} value={t.id}>
                      🎯 {t.title}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div className="flex items-center gap-1">
              <span className={`mr-2 rounded-sm px-2 py-1 font-mono text-sm font-extrabold tabular-nums ${activeTimer.timeLeft < 180 && activeTimer.timeLeft > 0 ? 'bg-red-500/10 text-red-600' : 'bg-[#df4b24] text-white'}`}>
                Còn lại {formatTime(activeTimer.timeLeft)}
              </span>
              <button
                onClick={activeTimer.toggle}
                aria-label={activeTimer.isRunning ? 'Tạm dừng đồng hồ' : 'Bắt đầu đồng hồ'}
                className="grid h-8 w-8 place-items-center rounded-sm border border-border bg-card text-muted-foreground hover:text-foreground cursor-pointer"
              >
                {activeTimer.isRunning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              </button>
              <button
                onClick={() => activeTimer.reset(activeTimeLimit)}
                aria-label="Đặt lại đồng hồ"
                className="grid h-8 w-8 place-items-center rounded-sm border border-border bg-card text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        <div className={`relative mx-3 mb-3 rounded-sm border transition-all duration-300 ${
          isFocused ? 'animate-gradient-flow shadow-lg shadow-primary/10 scale-[1.002]' : 'bg-border'
        }`}>
          <div className="flex min-h-[340px] overflow-hidden bg-card text-sm sm:h-[52vh]">
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
              placeholder="Hãy ghi nhớ bài mẫu và gõ lại nội dung bài viết của bạn tại đây..."
              height="52vh"
              theme="none"
              className="flex-1 text-sm font-mono focus:outline-none"
              basicSetup={EDITOR_BASIC_SETUP}
              extensions={EDITOR_EXTENSIONS}
            />
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-border bg-muted/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs font-semibold text-muted-foreground">
            Số từ đã gõ: <strong className="text-primary">{getWordCount(activeTyped)} từ</strong>
            {activeTemplate && <span className="ml-2 font-normal">(Mẫu có: {getWordCount(activeTemplate)} từ)</span>}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                setActiveTyped('');
                setActiveDiffResult(null);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border hover:bg-muted text-xs font-bold transition-all cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Xóa làm lại</span>
            </button>

            <button
              onClick={handleCheckDiff}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/95 font-bold transition-all cursor-pointer shadow-md shadow-primary/20 hover:scale-105 active:scale-95 duration-200"
            >
              <Check className="h-3.5 w-3.5" />
              <span>Kiểm Tra Đáp Án</span>
            </button>
          </div>
        </div>
      </div>

      {/* Diff Result Card */}
      {activeDiffResult && (
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm transition-all animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4 mb-4">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold">Độ trùng khớp chi tiết</h2>
            </div>
            
            {diffStats && (
              <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
                <div className="px-3 py-1.5 bg-primary/10 rounded-lg text-primary">
                  Độ khớp: <strong className="text-sm font-black">{diffStats.score}%</strong>
                </div>
                <div className="text-emerald-600 dark:text-emerald-400">Đúng: {diffStats.correct} ký tự</div>
                <div className="text-rose-500">Dư: {diffStats.extra} ký tự</div>
                <div className="text-amber-500">Thiếu: {diffStats.missing} ký tự</div>
              </div>
            )}
          </div>

          <div className="p-5 bg-muted/30 border border-border rounded-xl overflow-y-auto max-h-[350px] font-mono text-[13.5px] leading-[22px] flex flex-col space-y-0.5">
            {activeDiffResult && getDiffLines(activeDiffResult).map((line, i) => (
              <div key={i} className="flex items-start min-h-[22px] shrink-0">
                <div className="w-8 text-muted-foreground select-none text-right pr-2 shrink-0 border-r border-border mr-3">
                  {i + 1}
                </div>
                <div className="flex-1 whitespace-pre-wrap break-words leading-[22px]">
                  {line.map((token, idx) => {
                    if (token.type === 'correct') {
                      return <span key={idx} className="text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 font-semibold">{token.char}</span>;
                    }
                    if (token.type === 'extra') {
                      return <span key={idx} className="text-rose-600 dark:text-rose-400 bg-rose-500/20 line-through font-bold animate-char-pop" title="Ký tự dư thừa">{token.char === '\n' ? '↵\n' : token.char}</span>;
                    }
                    if (token.type === 'missing') {
                      return <span key={idx} className="text-slate-400 dark:text-slate-600 bg-amber-500/10 border-b border-amber-500/50 animate-char-pop" title="Ký tự thiếu">{token.char === '\n' ? '↵\n' : token.char}</span>;
                    }
                    return null;
                  })}
                  {line.length === 0 && <span className="opacity-0"> </span>}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-4 mt-3 text-[11px] text-muted-foreground px-1">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-emerald-500/30 inline-block" /> Đúng</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-rose-500/30 inline-block line-through" /> Dư</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-amber-500/20 inline-block border-b border-amber-500/50" /> Thiếu</span>
          </div>
        </div>
      )}
    </div>
  );
}
