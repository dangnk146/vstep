'use client';

import React, { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useTimer } from '@/hooks/useTimer';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Keyboard, 
  Headphones, 
  Flag, 
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Film,
  X,
} from 'lucide-react';
import videoData from './listvideo.json';

const LISTENING_TIME = 40 * 60; // 40 minutes in seconds
const PARTS = [
  { id: 'part1', label: 'Part 1', start: 1, count: 8 },
  { id: 'part2', label: 'Part 2', start: 9, count: 12 },
  { id: 'part3', label: 'Part 3', start: 21, count: 15 },
] as const;
type PartId = (typeof PARTS)[number]['id'];

export default function ListeningPage() {
  const pathname = usePathname();
  const router = useRouter();
  const { timeLeft, setTimeLeft, isRunning, toggle, reset } = useTimer(LISTENING_TIME);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [flags, setFlags] = useState<Record<number, boolean>>({});
  const [showShortcuts, setShowShortcuts] = useState(true);
  const videoDialogRef = useRef<HTMLDialogElement>(null);
  const routeMatch = pathname.match(/^\/listening\/(part[123])\/video(\d+)$/);
  const selectedPart = (routeMatch?.[1] ?? 'part1') as PartId;
  const selectedVideo = Number(routeMatch?.[2] ?? 1);
  const partInfo = PARTS.find((item) => item.id === selectedPart)!;
  const partVideos = videoData[selectedPart];
  const videoId = partVideos[selectedVideo - 1];
  const questionNumbers = Array.from(
    { length: partInfo.count },
    (_, index) => partInfo.start + index,
  );

  useEffect(() => {
    if (pathname === '/listening') {
      router.replace('/listening/part1/video1');
    }
  }, [pathname, router]);

  // Keyboard shortcuts listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement?.tagName;
      if (activeEl === 'INPUT' || activeEl === 'TEXTAREA' || activeEl === 'BUTTON' || activeEl === 'SELECT') {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        toggle();
      } else if (e.code === 'KeyR' || e.code === 'Keyr') {
        e.preventDefault();
        reset(LISTENING_TIME);
      } else if (e.key === 'ArrowUp' || e.key === '+') {
        e.preventDefault();
        setTimeLeft(prev => Math.min(prev + 60, LISTENING_TIME));
      } else if (e.key === 'ArrowDown' || e.key === '-') {
        e.preventDefault();
        setTimeLeft(prev => Math.max(prev - 60, 0));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggle, reset, setTimeLeft]);

  // Format time (MM:SS)
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSelectAnswer = (qNumber: number, option: string) => {
    setAnswers(prev => ({ ...prev, [qNumber]: option }));
  };

  const toggleFlag = (qNumber: number) => {
    setFlags(prev => ({ ...prev, [qNumber]: !prev[qNumber] }));
  };

  const navigateToVideo = (part: PartId, video: number) => {
    router.push(`/listening/${part}/video${video}`, { scroll: false });
  };

  const isTimeLow = timeLeft < 300; // < 5 minutes
  const answeredCount = questionNumbers.filter((number) => answers[number]).length;
  const flaggedCount = questionNumbers.filter((number) => flags[number]).length;

  return (
    <div className="flex flex-col space-y-6 w-full animate-fade-in pb-10">
      <header className="flex flex-col gap-5 border-b border-border pb-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <Headphones className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-foreground">VSTEP Listening</h1>
            <p className="mt-1 text-sm text-muted-foreground">Nghe playlist và chọn đáp án cho 35 câu hỏi</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className={`font-mono text-3xl font-bold tabular-nums ${isTimeLow ? 'text-red-500' : 'text-foreground'}`} aria-live="off">
            {formatTime(timeLeft)}
          </div>
          <button
            onClick={toggle}
            className={`flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-bold text-white transition-colors cursor-pointer ${isRunning ? 'bg-amber-500 hover:bg-amber-600' : 'bg-primary hover:bg-primary/90'}`}
          >
            {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {isRunning ? 'Tạm dừng' : 'Bắt đầu'}
          </button>
          <button
            onClick={() => reset(LISTENING_TIME)}
            className="grid h-10 w-10 place-items-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground cursor-pointer"
            title="Đặt lại 40 phút"
            aria-label="Đặt lại đồng hồ"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <select
            aria-label="Chọn thời gian luyện tập"
            defaultValue="40"
            onChange={(event) => setTimeLeft(Number(event.target.value) * 60)}
            className="h-10 rounded-lg border border-border bg-card px-3 text-sm text-foreground"
          >
            <option value="40">40 phút</option>
            <option value="20">20 phút</option>
            <option value="10">10 phút</option>
          </select>
        </div>
      </header>

      <nav aria-label="Chọn phần nghe" className="grid grid-cols-3 gap-2">
        {PARTS.map((item) => {
          const isSelected = item.id === selectedPart;
          return (
            <button
              key={item.id}
              onClick={() => navigateToVideo(item.id, 1)}
              aria-current={isSelected ? 'page' : undefined}
              className={`flex min-h-12 flex-col items-center justify-center rounded-lg border px-2 py-1 transition-colors cursor-pointer ${isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-foreground hover:bg-muted'}`}
            >
              <span className="text-sm font-bold">{item.label}</span>
              <span className={`text-[11px] ${isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                Câu {item.start}–{item.start + item.count - 1}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Keyboard Shortcuts Banner */}
      {showShortcuts && (
        <div className="flex items-start justify-between gap-4 rounded-lg border border-primary/10 bg-primary/5 p-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2.5">
            <Keyboard className="h-4 w-4 text-primary" />
            <span>
              <strong>Phím tắt:</strong> <kbd className="rounded border border-border bg-card px-1.5 py-0.5 text-xs">Space</kbd> Chạy/Dừng <span className="px-1">|</span> <kbd className="rounded border border-border bg-card px-1.5 py-0.5 text-xs">R</kbd> Đặt lại <span className="px-1">|</span> <kbd className="rounded border border-border bg-card px-1.5 py-0.5 text-xs">↑</kbd>/<kbd className="rounded border border-border bg-card px-1.5 py-0.5 text-xs">↓</kbd> Điều chỉnh thời gian
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

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-12">
        <section className="order-2 flex min-w-0 flex-col rounded-xl border border-border bg-card p-4 sm:p-5 lg:order-1 lg:col-span-7" aria-labelledby="answers-heading">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <h2 id="answers-heading" className="flex items-center gap-2 font-extrabold">
              <CheckCircle className="h-5 w-5 text-primary" />
              <span>{partInfo.label} · Trắc nghiệm</span>
            </h2>
            <div className="flex gap-3 text-xs font-semibold text-muted-foreground">
              <span>Đã làm: <strong className="text-primary">{answeredCount}/{partInfo.count}</strong></span>
              <span>Đánh dấu: <strong className="text-amber-500">{flaggedCount}</strong></span>
            </div>
          </div>

          <div className="grid content-start grid-cols-1 gap-2 py-3 sm:grid-cols-2">
            {questionNumbers.map((qNum) => {
              const selectedOpt = answers[qNum];
              const isFlagged = flags[qNum];

              return (
                <div
                  key={qNum}
                  className={`flex min-h-12 items-center gap-2 rounded-lg border px-2.5 transition-colors ${selectedOpt ? 'border-primary/30 bg-primary/5' : 'border-border'}`}
                >
                  <span className="w-8 shrink-0 text-xs font-bold text-muted-foreground">{qNum}.</span>
                  <div className="grid flex-1 grid-cols-4 gap-1">
                    {['A', 'B', 'C', 'D'].map((opt) => (
                      <button
                        key={opt}
                        onClick={() => handleSelectAnswer(qNum, opt)}
                        aria-pressed={selectedOpt === opt}
                        aria-label={`Câu ${qNum}, đáp án ${opt}`}
                        className={`h-8 rounded-md text-xs font-bold transition-colors cursor-pointer ${selectedOpt === opt ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-primary/10 hover:text-foreground'}`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => toggleFlag(qNum)}
                    aria-label={isFlagged ? `Bỏ đánh dấu câu ${qNum}` : `Đánh dấu câu ${qNum} để xem lại`}
                    aria-pressed={Boolean(isFlagged)}
                    className={`grid h-8 w-8 shrink-0 place-items-center rounded-md transition-colors cursor-pointer ${isFlagged ? 'text-amber-500' : 'text-muted-foreground/40 hover:text-amber-500'}`}
                    title="Đánh dấu xem lại"
                  >
                    <Flag className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="mt-auto border-t border-border pt-4">
            <button
              onClick={() => {
                alert(`Bạn đã hoàn thành ${answeredCount}/${partInfo.count} câu ở ${partInfo.label}.`);
              }}
              className="w-full rounded-lg bg-primary py-3 font-bold text-primary-foreground transition-colors hover:bg-primary/90 cursor-pointer"
            >
              Nộp phần này
            </button>
          </div>
        </section>

        <section className="order-1 min-w-0 overflow-hidden rounded-xl border border-border bg-card lg:order-2 lg:col-span-5" aria-labelledby="playlist-heading">
          <div className="flex items-center justify-between gap-3 border-b border-border p-4 sm:p-5">
            <div>
              <h2 id="playlist-heading" className="font-extrabold">{partInfo.label} · Video {selectedVideo}</h2>
              <p className="mt-1 text-xs text-muted-foreground">{selectedVideo}/{partVideos.length} video</p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => navigateToVideo(selectedPart, selectedVideo - 1)}
                disabled={selectedVideo <= 1}
                aria-label="Video trước"
                className="grid h-9 w-9 place-items-center rounded-md border border-border text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => videoDialogRef.current?.showModal()}
                aria-haspopup="dialog"
                className="flex h-9 items-center gap-2 rounded-md border border-border bg-card px-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted cursor-pointer"
              >
                <Film className="h-4 w-4 text-primary" />
                <span>Video {selectedVideo}</span>
              </button>
              <button
                onClick={() => navigateToVideo(selectedPart, selectedVideo + 1)}
                disabled={selectedVideo >= partVideos.length}
                aria-label="Video tiếp theo"
                className="grid h-9 w-9 place-items-center rounded-md border border-border text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
          <dialog
            ref={videoDialogRef}
            aria-labelledby="video-picker-heading"
            className="m-auto w-[min(92vw,36rem)] max-w-none rounded-xl border border-border bg-card p-0 text-foreground shadow-2xl backdrop:bg-black/60"
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div>
                <h3 id="video-picker-heading" className="font-bold">Chọn video · {partInfo.label}</h3>
                <p className="text-xs text-muted-foreground">{partVideos.length} video luyện nghe</p>
              </div>
              <button
                onClick={() => videoDialogRef.current?.close()}
                aria-label="Đóng danh sách video"
                className="grid h-9 w-9 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid max-h-[min(65vh,34rem)] grid-cols-3 gap-2 overflow-y-auto p-4 sm:grid-cols-4">
              {partVideos.map((_, index) => {
                const videoNumber = index + 1;
                const isSelected = videoNumber === selectedVideo;

                return (
                  <button
                    key={videoNumber}
                    onClick={() => {
                      navigateToVideo(selectedPart, videoNumber);
                      videoDialogRef.current?.close();
                    }}
                    aria-pressed={isSelected}
                    className={`min-h-11 rounded-lg border px-2 text-sm font-semibold transition-colors cursor-pointer ${isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-foreground hover:border-primary/40 hover:bg-primary/5'}`}
                  >
                    Video {videoNumber}
                  </button>
                );
              })}
            </div>
          </dialog>
          <div className="aspect-video w-full bg-black">
            <iframe
              key={videoId}
              className="h-full w-full"
              src={`https://www.youtube.com/embed/${videoId}?rel=0`}
              title={`${partInfo.label}, video ${selectedVideo}`}
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
          <div className="flex items-center justify-between gap-2 border-t border-border px-4 py-2">
            <span className="text-xs text-muted-foreground">Video luyện tập {selectedVideo}</span>
            <a
              href={`https://www.youtube.com/watch?v=${videoId}`}
              target="_blank"
              rel="noreferrer"
              className="shrink-0 text-xs font-semibold text-primary underline-offset-4 hover:underline"
            >
              Mở YouTube
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
