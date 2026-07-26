'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTimer } from '@/hooks/useTimer';
import { diffChars, DiffToken } from '@/utils/diff';
import { 
  PenTool, 
  Clock, 
  Play, 
  Pause, 
  RotateCcw, 
  Check, 
  RefreshCw, 
  Award,
  FileText,
  BookOpen,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';

const TASK1_TIME = 20 * 60; // 20 minutes
const TASK2_TIME = 40 * 60; // 40 minutes

export default function WritingPage() {
  const [activeTask, setActiveTask] = useState<'task1' | 'task2'>('task1');

  // Timers
  const timer1 = useTimer(TASK1_TIME);
  const timer2 = useTimer(TASK2_TIME);

  // States
  const [template1, setTemplate1] = useState('');
  const [template2, setTemplate2] = useState('');
  const [typed1, setTyped1] = useState('');
  const [typed2, setTyped2] = useState('');
  const [diffResult1, setDiffResult1] = useState<DiffToken[] | null>(null);
  const [diffResult2, setDiffResult2] = useState<DiffToken[] | null>(null);

  // Load saved templates from LocalStorage on mount & updates
  useEffect(() => {
    const savedT1 = localStorage.getItem('vstep_writing_t1_template') || '';
    const savedT2 = localStorage.getItem('vstep_writing_t2_template') || '';
    setTemplate1(savedT1);
    setTemplate2(savedT2);
  }, [activeTask]);

  const activeTimer = activeTask === 'task1' ? timer1 : timer2;
  const activeTemplate = activeTask === 'task1' ? template1 : template2;
  const activeTyped = activeTask === 'task1' ? typed1 : typed2;
  const setActiveTyped = activeTask === 'task1' ? setTyped1 : setTyped2;
  const activeDiffResult = activeTask === 'task1' ? diffResult1 : diffResult2;
  const setActiveDiffResult = activeTask === 'task1' ? setDiffResult1 : setDiffResult2;
  const activeTimeLimit = activeTask === 'task1' ? TASK1_TIME : TASK2_TIME;

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (textareaRef.current && gutterRef.current) {
      gutterRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

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
    <div className="flex flex-col space-y-6 w-full animate-fade-in pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border border-border p-6 rounded-2xl shadow-sm">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-primary/10 rounded-xl text-primary">
            <PenTool className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight">VSTEP Writing Practice</h1>
            <p className="text-muted-foreground text-sm font-medium">Luyện gõ bài luận, email và đo lường độ chính xác</p>
          </div>
        </div>

        {/* Task Tabs */}
        <div className="flex bg-muted p-1 rounded-xl border border-border">
          <button
            onClick={() => setActiveTask('task1')}
            className={`flex items-center space-x-2 px-4 py-2 text-sm font-bold rounded-lg transition-all cursor-pointer ${
              activeTask === 'task1' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Task 1: Viết Thư</span>
          </button>
          <button
            onClick={() => setActiveTask('task2')}
            className={`flex items-center space-x-2 px-4 py-2 text-sm font-bold rounded-lg transition-all cursor-pointer ${
              activeTask === 'task2' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <BookOpen className="h-4 w-4" />
            <span>Task 2: Viết Luận</span>
          </button>
        </div>
      </div>

      {/* Warning if no template */}
      {!activeTemplate.trim() && (
        <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/20 text-amber-650 dark:text-amber-500 rounded-xl text-sm font-semibold">
          <AlertCircle className="h-5 w-5 shrink-0 animate-bounce" />
          <div className="flex-1">
            <span>Bạn chưa cấu hình bài mẫu cho <strong>{activeTask === 'task1' ? 'Task 1' : 'Task 2'}</strong>. Hãy tạo cấu hình mẫu để so khớp kết quả gõ!</span>
          </div>
          <Link href="/writing/settings" className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer">
            Cài Đặt Mẫu
          </Link>
        </div>
      )}

      {/* Practice Editor Card */}
      <div className="bg-card border border-border p-6 rounded-2xl flex flex-col space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <h2 className="text-lg font-bold text-foreground">Khung viết bài làm</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Bắt đầu gõ bài để đếm giờ tự động</p>
          </div>

          {/* Timer Widget */}
          <div className={`p-[1.5px] rounded-xl transition-all duration-300 ${
            activeTimer.isRunning ? 'animate-gradient-flow shadow-md scale-105' : 'bg-border'
          }`}>
            <div className={`flex items-center space-x-3 px-4 py-2 rounded-[10px] bg-card text-foreground ${
              activeTimer.timeLeft < 180 && activeTimer.timeLeft > 0
                ? 'text-red-500 bg-red-500/5'
                : ''
            }`}>
              <Clock className="h-4 w-4 text-primary animate-pulse" />
              <span className="font-mono font-bold text-lg">{formatTime(activeTimer.timeLeft)}</span>
              <div className="flex gap-1">
                <button
                  onClick={activeTimer.toggle}
                  className="p-1 rounded bg-muted hover:bg-muted-foreground/10 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  {activeTimer.isRunning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                </button>
                <button
                  onClick={() => activeTimer.reset(activeTimeLimit)}
                  className="p-1 rounded bg-muted hover:bg-muted-foreground/10 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className={`relative p-[2px] rounded-2xl transition-all duration-300 ${
          activeTimer.isRunning ? 'animate-gradient-flow shadow-lg shadow-primary/10 scale-[1.002]' : 'bg-border'
        }`}>
          <div className="flex bg-card rounded-[14px] overflow-hidden text-sm font-mono h-[350px]">
            {/* VS Code style Gutter */}
            <div 
              ref={gutterRef}
              className="w-10 bg-muted/30 border-r border-border text-muted-foreground select-none text-right pr-2 py-4 overflow-hidden leading-[22px] shrink-0"
            >
              {Array.from({ length: Math.max(1, activeTyped.split('\n').length) }).map((_, i) => (
                <div key={i} className="h-[22px]">{i + 1}</div>
              ))}
            </div>
            {/* Editor Textarea */}
            <textarea
              ref={textareaRef}
              onScroll={handleScroll}
              value={activeTyped}
              onChange={(e) => {
                setActiveTyped(e.target.value);
                if (!activeTimer.isRunning && e.target.value.length === 1 && activeTimer.timeLeft === activeTimeLimit) {
                  activeTimer.start();
                }
              }}
              placeholder="Hãy ghi nhớ bài mẫu và gõ lại nội dung bài viết của bạn tại đây..."
              className="flex-1 p-4 bg-transparent focus:outline-none text-foreground leading-[22px] resize-none h-full overflow-y-auto"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-xs text-muted-foreground font-semibold">
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
              <div key={i} className="flex items-start min-h-[22px]">
                <div className="w-8 text-muted-foreground select-none text-right pr-2 shrink-0 border-r border-border mr-3">
                  {i + 1}
                </div>
                <div className="flex-1 whitespace-pre-wrap break-all">
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
