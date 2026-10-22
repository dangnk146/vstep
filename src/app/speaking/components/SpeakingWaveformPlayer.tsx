'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Download, Pause, Play, RotateCcw } from 'lucide-react';

interface SpeakingWaveformPlayerProps {
  audioUrl: string;
  audioRef?: React.RefObject<HTMLAudioElement | null>;
  onEnded?: () => void;
}

function formatClock(seconds: number): string {
  if (isNaN(seconds) || !isFinite(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Generates natural voice speech envelopes matching the user's reference image
function generateRealisticVoicePeaks(count: number): number[] {
  const result: number[] = [];
  const phraseCount = Math.max(3, Math.round(count / 18));
  const phraseCenters: number[] = [];

  for (let p = 0; p < phraseCount; p++) {
    phraseCenters.push(((p + 0.5) / phraseCount) * count);
  }

  for (let i = 0; i < count; i++) {
    let envelope = 0.04;
    for (let p = 0; p < phraseCount; p++) {
      const dist = Math.abs(i - phraseCenters[p]);
      const width = 5 + (p % 3) * 2.5;
      if (dist < width * 2) {
        const peakHeight = 0.65 + 0.3 * Math.sin(p * 2.1 + 1.2);
        const g = Math.exp(-Math.pow(dist / width, 2)) * peakHeight;
        envelope = Math.max(envelope, g);
      }
    }

    // Add voice syllable harmonic variations
    const texture = 0.85 + 0.15 * Math.sin(i * 1.5) + 0.08 * Math.cos(i * 3.2);
    let val = envelope * texture;

    // Smooth exponential decay at the end down to tiny dots (exact match to user image)
    const decayStart = count - Math.min(18, Math.round(count * 0.25));
    if (i > decayStart) {
      const taper = Math.pow((count - 1 - i) / (count - decayStart), 1.6);
      val = Math.max(0.03, val * taper);
    }

    result.push(Math.max(0.03, Math.min(0.98, val)));
  }

  return result;
}

export function SpeakingWaveformPlayer({
  audioUrl,
  audioRef: externalAudioRef,
  onEnded,
}: SpeakingWaveformPlayerProps) {
  const internalAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioEl = externalAudioRef?.current || internalAudioRef.current;

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [peaks, setPeaks] = useState<number[]>(() => generateRealisticVoicePeaks(80));

  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isScrubbingRef = useRef(false);
  const animFrameRef = useRef<number | null>(null);

  // Reset playback state when audioUrl changes
  useEffect(() => {
    setCurrentTime(0);
    setIsPlaying(false);
    setPeaks(generateRealisticVoicePeaks(80));
  }, [audioUrl]);

  // Decode audio data for real peaks with fallback
  useEffect(() => {
    let cancelled = false;
    if (!audioUrl) return;

    fetch(audioUrl)
      .then((res) => res.arrayBuffer())
      .then((buffer) => {
        if (cancelled) return;
        const AudioContextClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioContextClass) return;

        const ctx = new AudioContextClass();
        return ctx.decodeAudioData(buffer).then((decoded) => {
          if (cancelled) return;
          const channelData = decoded.getChannelData(0);
          const sampleCount = 100;
          const blockSize = Math.floor(channelData.length / sampleCount);
          const rawPeaks: number[] = [];

          for (let i = 0; i < sampleCount; i++) {
            const start = i * blockSize;
            const end = Math.min(start + blockSize, channelData.length);
            let sumSq = 0;
            for (let j = start; j < end; j++) {
              sumSq += channelData[j] * channelData[j];
            }
            const rms = Math.sqrt(sumSq / Math.max(end - start, 1));
            rawPeaks.push(rms);
          }

          const maxRms = Math.max(...rawPeaks, 0.001);
          const realPeaks = rawPeaks.map((v) => {
            const norm = v / maxRms;
            // Preserves low floor for tiny dots and scales voice syllables
            return Math.max(0.03, Math.min(0.98, Math.pow(norm, 0.75)));
          });

          setPeaks(realPeaks);
          if (decoded.duration && !isNaN(decoded.duration) && isFinite(decoded.duration)) {
            setDuration(decoded.duration);
          }
        });
      })
      .catch(() => {
        // Fallback already pre-set
      });

    return () => {
      cancelled = true;
    };
  }, [audioUrl]);

  // Canvas drawing routine
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height || 38;
    if (width === 0) return;

    const dpr = window.devicePixelRatio || 1;
    const targetW = Math.round(width * dpr);
    const targetH = Math.round(height * dpr);

    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    // Styling constants matching reference image
    const barWidth = 2.5;
    const gap = 2.0;
    const step = barWidth + gap; // 4.5px
    const barCount = Math.floor(width / step);
    const offsetX = (width - barCount * step) / 2;

    const isDark = document.documentElement.classList.contains('dark');
    // Played: Deep blue-slate in light, bright sky blue in dark
    const playedColor = isDark ? '#38bdf8' : '#1e3a5f';
    // Unplayed: Softer muted blue-slate
    const unplayedColor = isDark ? '#334155' : '#cbd5e1';
    const playheadColor = '#df4b24';

    const curTime = audioEl ? audioEl.currentTime : currentTime;
    const curDur = duration || (audioEl && isFinite(audioEl.duration) ? audioEl.duration : 0) || 1;
    const progress = Math.max(0, Math.min(1, curDur > 0 ? curTime / curDur : 0));
    const progressX = progress * width;

    const centerY = height / 2;
    const maxBarHeight = height - 8;

    ctx.lineWidth = barWidth;
    ctx.lineCap = 'round';

    for (let i = 0; i < barCount; i++) {
      const x = offsetX + i * step + barWidth / 2;
      const progressAtBar = i / (barCount - 1 || 1);

      let amp = 0.04;
      if (peaks.length > 0) {
        const peakIdx = Math.min(peaks.length - 1, Math.floor(progressAtBar * peaks.length));
        amp = peaks[peakIdx];
      }

      // Height centered vertically around centerY
      const barHeight = Math.max(2.5, amp * maxBarHeight);
      const topY = centerY - barHeight / 2;
      const bottomY = centerY + barHeight / 2;

      ctx.strokeStyle = x <= progressX ? playedColor : unplayedColor;
      ctx.beginPath();
      ctx.moveTo(x, topY);
      ctx.lineTo(x, bottomY);
      ctx.stroke();
    }

    // Draw playhead indicator
    if (progress > 0 || isPlaying) {
      const cursorX = Math.max(1, Math.min(width - 1, progressX));
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = playheadColor;
      ctx.beginPath();
      ctx.moveTo(cursorX, 2);
      ctx.lineTo(cursorX, height - 2);
      ctx.stroke();

      // Small rounded top pin
      ctx.fillStyle = playheadColor;
      ctx.beginPath();
      ctx.arc(cursorX, 3.5, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }, [audioEl, currentTime, duration, isPlaying, peaks]);

  // Redraw when peaks, isPlaying, or currentTime change
  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // ResizeObserver to handle container width changes smoothly
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const ro = new ResizeObserver(() => {
      renderCanvas();
    });
    ro.observe(container);

    return () => ro.disconnect();
  }, [renderCanvas]);

  // Smooth 60fps playhead animation loop when playing
  useEffect(() => {
    if (!isPlaying) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
      return;
    }

    const loop = () => {
      if (audioEl && !isScrubbingRef.current) {
        setCurrentTime(audioEl.currentTime);
        renderCanvas();
      }
      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    };
  }, [isPlaying, audioEl, renderCanvas]);

  // Audio element events
  const handleTimeUpdate = () => {
    if (audioEl && !isScrubbingRef.current) {
      setCurrentTime(audioEl.currentTime);
      if (audioEl.duration && !isNaN(audioEl.duration) && isFinite(audioEl.duration) && duration === 0) {
        setDuration(audioEl.duration);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (audioEl && audioEl.duration && !isNaN(audioEl.duration) && isFinite(audioEl.duration)) {
      setDuration(audioEl.duration);
    }
  };

  const handlePlay = () => setIsPlaying(true);
  const handlePause = () => setIsPlaying(false);
  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (audioEl) audioEl.currentTime = 0;
    renderCanvas();
    onEnded?.();
  };

  const togglePlayPause = () => {
    if (!audioEl) return;
    if (isPlaying) {
      audioEl.pause();
    } else {
      audioEl.play().catch(console.error);
    }
  };

  const handleSeek = useCallback(
    (clientX: number) => {
      if (!containerRef.current || !audioEl) return;
      const rect = containerRef.current.getBoundingClientRect();
      const progress = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const dur = duration || (isFinite(audioEl.duration) ? audioEl.duration : 0) || 1;
      const targetTime = progress * dur;
      audioEl.currentTime = targetTime;
      setCurrentTime(targetTime);
      renderCanvas();
    },
    [audioEl, duration, renderCanvas]
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isScrubbingRef.current = true;
    handleSeek(e.clientX);

    const onPointerMove = (moveEvent: PointerEvent) => {
      handleSeek(moveEvent.clientX);
    };

    const onPointerUp = () => {
      isScrubbingRef.current = false;
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  return (
    <div className="flex w-full items-center gap-2 rounded-sm border border-border/70 bg-card p-2 sm:gap-3 sm:px-3 sm:py-2 shadow-xs">
      {/* Hidden native audio element */}
      <audio
        ref={(el) => {
          internalAudioRef.current = el;
          if (externalAudioRef) {
            (externalAudioRef as React.MutableRefObject<HTMLAudioElement | null>).current = el;
          }
        }}
        src={audioUrl}
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={handlePlay}
        onPause={handlePause}
        onEnded={handleEnded}
        className="hidden"
      />

      {/* Play / Pause circular button */}
      <button
        type="button"
        onClick={togglePlayPause}
        className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground shadow-xs transition hover:bg-primary/90 active:scale-95 cursor-pointer sm:h-9 sm:w-9"
        aria-label={isPlaying ? 'Tạm dừng bản ghi' : 'Phát lại bản ghi'}
        title={isPlaying ? 'Tạm dừng' : 'Phát'}
      >
        {isPlaying ? (
          <Pause className="h-4 w-4 fill-current" />
        ) : (
          <Play className="h-4 w-4 fill-current ml-0.5" />
        )}
      </button>

      {/* Symmetrical Waveform Canvas & Scrubber matching phone reference */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        role="slider"
        aria-label="Tua nhanh đoạn ghi âm"
        aria-valuemin={0}
        aria-valuemax={duration || 100}
        aria-valuenow={currentTime}
        className="group relative flex h-10 flex-1 cursor-pointer select-none items-center overflow-hidden px-1 touch-none"
      >
        <canvas ref={canvasRef} className="h-full w-full block pointer-events-none" />
      </div>

      {/* Time & Download */}
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <span className="font-mono text-[11px] font-bold tabular-nums text-foreground/90">
          {formatClock(currentTime)}
          <span className="text-muted-foreground/60"> / </span>
          <span className="text-muted-foreground">{formatClock(duration)}</span>
        </span>

        {/* Replay / Reset to start */}
        <button
          type="button"
          onClick={() => {
            if (audioEl) {
              audioEl.currentTime = 0;
              setCurrentTime(0);
              renderCanvas();
            }
          }}
          className="hidden grid h-7 w-7 place-items-center rounded-xs border border-border text-muted-foreground transition hover:bg-muted hover:text-foreground active:scale-95 cursor-pointer sm:grid"
          title="Về đầu bản ghi"
          aria-label="Về đầu bản ghi"
        >
          <RotateCcw className="h-3 w-3" />
        </button>

        {/* Download file */}
        <a
          href={audioUrl}
          download="vstep-speaking.webm"
          aria-label="Tải bản ghi xuống"
          title="Tải bản ghi xuống"
          className="grid h-7 w-7 place-items-center rounded-xs border border-border bg-card text-foreground transition hover:bg-muted active:scale-95 cursor-pointer shadow-xs"
        >
          <Download className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
}
