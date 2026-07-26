'use client';

import React, { useEffect, useState } from 'react';
import { useTimer } from '@/hooks/useTimer';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Keyboard, 
  BookOpen, 
  Flag, 
  CheckCircle,
  Clock
} from 'lucide-react';

const READING_TIME = 60 * 60; // 60 minutes in seconds

export default function ReadingPage() {
  const { timeLeft, setTimeLeft, isRunning, toggle, reset } = useTimer(READING_TIME);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [flags, setFlags] = useState<Record<number, boolean>>({});
  const [showShortcuts, setShowShortcuts] = useState(true);

  // Keyboard shortcuts listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement?.tagName;
      if (activeEl === 'INPUT' || activeEl === 'TEXTAREA') {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        toggle();
      } else if (e.code === 'KeyR' || e.code === 'Keyr') {
        e.preventDefault();
        reset(READING_TIME);
      } else if (e.key === 'ArrowUp' || e.key === '+') {
        e.preventDefault();
        setTimeLeft(prev => Math.min(prev + 60, READING_TIME));
      } else if (e.key === 'ArrowDown' || e.key === '-') {
        e.preventDefault();
        setTimeLeft(prev => Math.max(prev - 60, 0));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggle, reset, setTimeLeft]);

  // Format time (HH:MM:SS)
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h.toString().padStart(2, '0') + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSelectAnswer = (qNumber: number, option: string) => {
    setAnswers(prev => ({ ...prev, [qNumber]: option }));
  };

  const toggleFlag = (qNumber: number) => {
    setFlags(prev => ({ ...prev, [qNumber]: !prev[qNumber] }));
  };

  const isTimeLow = timeLeft < 300; // < 5 minutes
  const answeredCount = Object.keys(answers).length;
  const flaggedCount = Object.values(flags).filter(Boolean).length;

  return (
    <div className="flex flex-col space-y-6 w-full animate-fade-in pb-10">
      {/* Top Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border border-border p-6 rounded-2xl shadow-sm">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-primary/10 rounded-xl text-primary">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight">VSTEP Reading Timer</h1>
            <p className="text-muted-foreground text-sm font-medium">Bấm giờ và mô phỏng thời gian thi đọc VSTEP thực tế</p>
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts Banner */}
      {showShortcuts && (
        <div className="flex items-center justify-between p-4 bg-primary/5 border border-primary/10 rounded-xl text-sm text-muted-foreground">
          <div className="flex items-center gap-2.5">
            <Keyboard className="h-4 w-4 text-primary" />
            <span>
              <strong>Phím tắt điều khiển:</strong> <kbd className="px-1.5 py-0.5 bg-card border border-border rounded text-xs">Space</kbd> Chạy/Dừng | <kbd className="px-1.5 py-0.5 bg-card border border-border rounded text-xs">R</kbd> Đặt lại | <kbd className="px-1.5 py-0.5 bg-card border border-border rounded text-xs">↑</kbd> Tăng 1 phút | <kbd className="px-1.5 py-0.5 bg-card border border-border rounded text-xs">↓</kbd> Giảm 1 phút
            </span>
          </div>
          <button 
            onClick={() => setShowShortcuts(false)} 
            className="text-muted-foreground hover:text-foreground font-semibold px-2 cursor-pointer"
          >
            Ẩn
          </button>
        </div>
      )}

      {/* Layout Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Column: Big Timer Card */}
        <div className="lg:col-span-7 flex flex-col justify-between bg-card border border-border p-8 md:p-12 rounded-3xl shadow-sm text-center relative overflow-hidden min-h-[400px]">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center justify-center flex-1 space-y-8">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
              {isRunning ? 'Đang chạy' : 'Đang tạm dừng'}
            </span>
            
            {/* Giant Countdown Clock */}
            <div className={`transition-all duration-300 ${
              isRunning ? 'animate-timer-tick' : ''
            } ${
              isTimeLow 
                ? 'text-red-500 scale-105 filter drop-shadow-[0_0_15px_rgba(239,68,68,0.2)] animate-pulse' 
                : 'text-primary'
            }`}>
              <span className="font-mono text-7xl md:text-8xl font-black tracking-wider leading-none">
                {formatTime(timeLeft)}
              </span>
            </div>

            {/* Core Controls */}
            <div className="flex items-center gap-4">
              <button
                onClick={toggle}
                className={`flex items-center gap-2 px-8 py-4 rounded-2xl text-white font-extrabold text-base transition-all cursor-pointer shadow-lg ${
                  isRunning 
                    ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/10' 
                    : 'bg-primary hover:bg-primary/95 shadow-primary/10'
                }`}
              >
                {isRunning ? (
                  <>
                    <Pause className="h-5 w-5 fill-current" />
                    <span>Tạm Dừng</span>
                  </>
                ) : (
                  <>
                    <Play className="h-5 w-5 fill-current" />
                    <span>Bắt Đầu</span>
                  </>
                )}
              </button>
              
              <button
                onClick={() => reset(READING_TIME)}
                className="flex items-center justify-center p-4 rounded-2xl bg-muted hover:bg-muted-foreground/10 text-muted-foreground hover:text-foreground transition-all cursor-pointer border border-border"
                title="Đặt lại"
              >
                <RotateCcw className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Quick config */}
          <div className="relative z-10 border-t border-border pt-6 mt-6 flex flex-wrap justify-center gap-4 text-xs font-semibold text-muted-foreground">
            <button 
              onClick={() => setTimeLeft(60 * 60)} 
              className="px-3 py-1.5 rounded-lg bg-muted hover:bg-muted-foreground/10 hover:text-foreground cursor-pointer"
            >
              Thi đọc VSTEP (60m)
            </button>
            <button 
              onClick={() => setTimeLeft(30 * 60)} 
              className="px-3 py-1.5 rounded-lg bg-muted hover:bg-muted-foreground/10 hover:text-foreground cursor-pointer"
            >
              Luyện nhanh (30m)
            </button>
            <button 
              onClick={() => setTimeLeft(15 * 60)} 
              className="px-3 py-1.5 rounded-lg bg-muted hover:bg-muted-foreground/10 hover:text-foreground cursor-pointer"
            >
              Luyện nhanh (15m)
            </button>
          </div>
        </div>

        {/* Right Column: Answer Board Grid */}
        <div className="lg:col-span-5 flex flex-col space-y-4 bg-card border border-border p-6 rounded-3xl">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <h2 className="font-extrabold text-base flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              <span>Bảng Trả Lời Trắc Nghiệm</span>
            </h2>
            <div className="text-xs font-semibold text-muted-foreground flex gap-3">
              <span>Đã làm: <strong className="text-primary">{answeredCount}/40</strong></span>
              <span>Đánh dấu: <strong className="text-amber-500">{flaggedCount}</strong></span>
            </div>
          </div>

          {/* Question Navigator */}
          <div className="grid grid-cols-4 gap-2 overflow-y-auto max-h-[380px] pr-1 py-1">
            {Array.from({ length: 40 }, (_, i) => i + 1).map((qNum) => {
              const selectedOpt = answers[qNum];
              const isFlagged = flags[qNum];

              return (
                <div 
                  key={qNum} 
                  className={`p-2 border rounded-xl flex flex-col items-center justify-center space-y-1.5 transition-all ${
                    selectedOpt 
                      ? 'border-primary/20 bg-primary/5' 
                      : 'border-border bg-card'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[10px] font-bold text-muted-foreground"># {qNum}</span>
                    <button
                      onClick={() => toggleFlag(qNum)}
                      className={`text-xs cursor-pointer ${isFlagged ? 'text-amber-500' : 'text-muted-foreground/30 hover:text-amber-500'}`}
                      title="Đánh dấu xem lại"
                    >
                      <Flag className="h-3.5 w-3.5 fill-current" />
                    </button>
                  </div>
                  
                  {/* Select Options A, B, C, D */}
                  <div className="grid grid-cols-2 gap-1 w-full text-[9px]">
                    {['A', 'B', 'C', 'D'].map((opt) => (
                      <button
                        key={opt}
                        onClick={() => handleSelectAnswer(qNum, opt)}
                        className={`py-1 rounded font-bold text-center cursor-pointer transition-all active:scale-95 duration-200 ${
                          selectedOpt === opt
                            ? 'bg-vstep-gradient text-white scale-110 rotate-2 shadow-md shadow-primary/20'
                            : 'bg-muted hover:bg-muted-foreground/15 text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t border-border pt-4 mt-auto">
            <button
              onClick={() => {
                alert(`Bạn đã hoàn thành ${answeredCount}/40 câu hỏi. Chúc mừng bạn đã nỗ lực luyện tập!`);
              }}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/95 font-bold transition-all shadow-md shadow-primary/10 cursor-pointer"
            >
              Nộp Bài Luyện Tập
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
