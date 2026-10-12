'use client';

import React, { startTransition, useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  Clock,
  Download,
  Mic,
  Play,
  RotateCcw,
  Settings,
  Square,
  Volume2,
} from 'lucide-react';

type SpeakingPart = 'part1' | 'part2' | 'part3';
type TimerPhase = 'idle' | 'preparing' | 'speaking' | 'complete';
type RecorderStatus = 'idle' | 'requesting' | 'recording' | 'ready';
type SettingKey = 'prep' | SpeakingPart;

const PARTS: { id: SpeakingPart; title: string; defaultSeconds: number }[] = [
  { id: 'part1', title: 'Part 1: Tương tác xã hội', defaultSeconds: 180 },
  { id: 'part2', title: 'Part 2: Thảo luận giải pháp', defaultSeconds: 180 },
  { id: 'part3', title: 'Part 3: Phát triển chủ đề', defaultSeconds: 180 },
];

const DEFAULT_SETTINGS: Record<SettingKey, string> = {
  prep: '15',
  part1: '180',
  part2: '180',
  part3: '180',
};

const STORAGE_KEYS: Record<SettingKey, string> = {
  prep: 'vstep_prep_seconds',
  part1: 'vstep_part1_seconds',
  part2: 'vstep_part2_seconds',
  part3: 'vstep_part3_seconds',
};

const CUSTOM_EXAM_KEY = 'vstep_speaking_custom_exam_html';
const SAFE_TAGS = new Set([
  'A', 'B', 'BLOCKQUOTE', 'BR', 'DIV', 'EM', 'H1', 'H2', 'H3', 'H4', 'I',
  'LI', 'OL', 'P', 'S', 'STRONG', 'U', 'UL',
]);

function sanitizeClipboardHtml(html: string) {
  const parsed = new DOMParser().parseFromString(html, 'text/html');
  parsed.querySelectorAll('script,style,iframe,object,embed,svg,math').forEach((node) => node.remove());

  Array.from(parsed.body.querySelectorAll('*')).forEach((element) => {
    if (!SAFE_TAGS.has(element.tagName)) {
      element.replaceWith(...Array.from(element.childNodes));
      return;
    }

    Array.from(element.attributes).forEach((attribute) => {
      if (element.tagName !== 'A' || attribute.name !== 'href') {
        element.removeAttribute(attribute.name);
        return;
      }

      try {
        const url = new URL(attribute.value, window.location.origin);
        if (!['http:', 'https:', 'mailto:'].includes(url.protocol)) {
          element.removeAttribute('href');
        } else {
          element.setAttribute('href', url.href);
        }
      } catch {
        element.removeAttribute('href');
      }
    });
  });

  return parsed.body.innerHTML;
}

export default function SpeakingSimulation() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [remainingTimes, setRemainingTimes] = useState<Record<SpeakingPart, number>>({
    part1: 180,
    part2: 180,
    part3: 180,
  });
  const [preparationRemaining, setPreparationRemaining] = useState<number | null>(null);
  const [timerPhase, setTimerPhase] = useState<TimerPhase>('idle');
  const [runningPart, setRunningPart] = useState<SpeakingPart | null>(null);
  const [recorderStatus, setRecorderStatus] = useState<RecorderStatus>('idle');
  const [recorderError, setRecorderError] = useState('');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [waveformLevels, setWaveformLevels] = useState<number[]>(Array(24).fill(0.08));
  const [hasExamContent, setHasExamContent] = useState(false);

  const preparationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const speakingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const visualizerContextRef = useRef<AudioContext | null>(null);
  const visualizerFrameRef = useRef<number | null>(null);
  const recordingRequestRef = useRef(0);
  const pendingRequestRef = useRef(false);
  const examEditorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const restored = { ...DEFAULT_SETTINGS };
    (Object.keys(STORAGE_KEYS) as SettingKey[]).forEach((key) => {
      const value = localStorage.getItem(STORAGE_KEYS[key]);
      if (value !== null && /^\d+$/.test(value)) restored[key] = value;
    });
    if (restored.part2 === '120') restored.part2 = '180';

    const savedExam = localStorage.getItem(CUSTOM_EXAM_KEY) || '';
    if (examEditorRef.current) examEditorRef.current.innerHTML = sanitizeClipboardHtml(savedExam);
    startTransition(() => {
      setSettings(restored);
      setRemainingTimes({
        part1: Number(restored.part1),
        part2: Number(restored.part2),
        part3: Number(restored.part3),
      });
      setHasExamContent(Boolean(savedExam.trim()));
      setSettingsLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!settingsLoaded) return;
    (Object.keys(STORAGE_KEYS) as SettingKey[]).forEach((key) => {
      localStorage.setItem(STORAGE_KEYS[key], settings[key]);
    });
  }, [settings, settingsLoaded]);

  useEffect(() => () => {
    if (preparationIntervalRef.current) clearInterval(preparationIntervalRef.current);
    if (speakingIntervalRef.current) clearInterval(speakingIntervalRef.current);
    recordingRequestRef.current += 1;
    if (visualizerFrameRef.current !== null) cancelAnimationFrame(visualizerFrameRef.current);
    if (visualizerContextRef.current) void visualizerContextRef.current.close();
    if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
  }, []);

  const getSeconds = (key: SettingKey) => {
    const value = Number.parseInt(settings[key], 10);
    const minimum = key === 'prep' ? 0 : 1;
    return Number.isFinite(value) && value >= minimum ? value : Number(DEFAULT_SETTINGS[key]);
  };

  const clearTimers = () => {
    if (preparationIntervalRef.current) clearInterval(preparationIntervalRef.current);
    if (speakingIntervalRef.current) clearInterval(speakingIntervalRef.current);
    preparationIntervalRef.current = null;
    speakingIntervalRef.current = null;
  };

  const stopVisualizer = () => {
    if (visualizerFrameRef.current !== null) cancelAnimationFrame(visualizerFrameRef.current);
    visualizerFrameRef.current = null;
    if (visualizerContextRef.current) void visualizerContextRef.current.close();
    visualizerContextRef.current = null;
    setWaveformLevels(Array(24).fill(0.08));
  };

  const startVisualizer = (stream: MediaStream) => {
    if (!window.AudioContext) return;

    const context = new AudioContext();
    const analyser = context.createAnalyser();
    analyser.fftSize = 128;
    analyser.smoothingTimeConstant = 0.78;
    context.createMediaStreamSource(stream).connect(analyser);
    visualizerContextRef.current = context;

    const frequencyData = new Uint8Array(analyser.frequencyBinCount);
    let lastUpdate = 0;
    const drawFrame = (timestamp: number) => {
      analyser.getByteFrequencyData(frequencyData);
      if (timestamp - lastUpdate >= 80) {
        const levels = Array.from({ length: 24 }, (_, index) => {
          const start = Math.floor(index * frequencyData.length / 24);
          const end = Math.max(start + 1, Math.floor((index + 1) * frequencyData.length / 24));
          let total = 0;
          for (let bin = start; bin < end; bin += 1) total += frequencyData[bin];
          return Math.min(1, Math.max(0.08, total / (end - start) / 180));
        });
        setWaveformLevels(levels);
        lastUpdate = timestamp;
      }
      visualizerFrameRef.current = requestAnimationFrame(drawFrame);
    };

    void context.resume();
    visualizerFrameRef.current = requestAnimationFrame(drawFrame);
  };

  const stopMedia = (discardRecording: boolean) => {
    stopVisualizer();
    if (pendingRequestRef.current) {
      pendingRequestRef.current = false;
      recordingRequestRef.current += 1;
      setRecorderStatus(audioUrlRef.current ? 'ready' : 'idle');
    } else if (discardRecording && mediaRecorderRef.current?.state === 'recording') {
      recordingRequestRef.current += 1;
      setRecorderStatus(audioUrlRef.current ? 'ready' : 'idle');
    }

    if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setRecorderError('Trình duyệt không hỗ trợ ghi âm.');
      return false;
    }

    const requestId = ++recordingRequestRef.current;
    pendingRequestRef.current = true;
    setRecorderError('');
    setRecorderStatus('requesting');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      pendingRequestRef.current = false;
      if (requestId !== recordingRequestRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return false;
      }

      streamRef.current = stream;
  startVisualizer(stream);
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        if (streamRef.current === stream) streamRef.current = null;
        if (mediaRecorderRef.current === recorder) mediaRecorderRef.current = null;

        if (requestId !== recordingRequestRef.current) return;
        const recording = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        if (recording.size === 0) {
          setRecorderStatus(audioUrlRef.current ? 'ready' : 'idle');
          return;
        }

        const nextUrl = URL.createObjectURL(recording);
        if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = nextUrl;
        setAudioUrl(nextUrl);
        setRecorderStatus('ready');
      };

      recorder.start();
      setRecorderStatus('recording');
      return true;
    } catch {
      pendingRequestRef.current = false;
      setRecorderStatus(audioUrlRef.current ? 'ready' : 'idle');
      setRecorderError('Không thể truy cập microphone. Hãy cấp quyền ghi âm cho trang web.');
      return false;
    }
  };

  const runSpeakingTimer = (part: SpeakingPart, duration: number) => {
    let timeLeft = duration;
    setRemainingTimes((previous) => ({ ...previous, [part]: duration }));
    speakingIntervalRef.current = setInterval(() => {
      timeLeft -= 1;
      setRemainingTimes((previous) => ({ ...previous, [part]: Math.max(timeLeft, 0) }));

      if (timeLeft <= 0) {
        if (speakingIntervalRef.current) clearInterval(speakingIntervalRef.current);
        speakingIntervalRef.current = null;
        setRunningPart(null);
        setTimerPhase('complete');
        stopMedia(false);
      }
    }, 1000);
  };

  const beginSpeaking = async (part: SpeakingPart, duration: number) => {
    const recordingStarted = await startRecording();
    if (!recordingStarted) {
      clearTimers();
      setRunningPart(null);
      setTimerPhase('idle');
      return;
    }

    setTimerPhase('speaking');
    runSpeakingTimer(part, duration);
  };

  const handleRunPart = (part: SpeakingPart) => {
    clearTimers();
    stopMedia(true);
    setRunningPart(part);
    setRemainingTimes((previous) => ({ ...previous, [part]: getSeconds(part) }));

    const prepDuration = part === 'part1' ? 0 : getSeconds('prep');
    const speakingDuration = getSeconds(part);
    if (prepDuration === 0) {
      setPreparationRemaining(0);
      setTimerPhase('speaking');
      void beginSpeaking(part, speakingDuration);
      return;
    }

    setPreparationRemaining(prepDuration);
    setTimerPhase('preparing');
    let timeLeft = prepDuration;
    preparationIntervalRef.current = setInterval(() => {
      timeLeft -= 1;
      setPreparationRemaining(Math.max(timeLeft, 0));
      if (timeLeft <= 0) {
        if (preparationIntervalRef.current) clearInterval(preparationIntervalRef.current);
        preparationIntervalRef.current = null;
        void beginSpeaking(part, speakingDuration);
      }
    }, 1000);
  };

  const handleManualRecord = () => {
    clearTimers();
    stopMedia(true);
    setRunningPart(null);
    setPreparationRemaining(null);
    setTimerPhase('idle');
    void startRecording();
  };

  const handleStopRecording = () => {
    clearTimers();
    setRunningPart(null);
    setPreparationRemaining(null);
    setTimerPhase('idle');
    stopMedia(false);
  };

  const updateSetting = (key: SettingKey, value: string) => {
    setSettings((previous) => ({ ...previous, [key]: value }));
    if (key !== 'prep') {
      setRemainingTimes((previous) => ({ ...previous, [key]: Number(value) || 0 }));
    }
  };

  const handleExamPaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    event.preventDefault();
    const html = event.clipboardData.getData('text/html');
    const text = event.clipboardData.getData('text/plain');
    if (html) {
      document.execCommand('insertHTML', false, sanitizeClipboardHtml(html));
    } else {
      document.execCommand('insertText', false, text);
    }

    if (examEditorRef.current) {
      const content = examEditorRef.current.innerHTML;
      localStorage.setItem(CUSTOM_EXAM_KEY, content);
      setHasExamContent(Boolean(examEditorRef.current.textContent?.trim()));
    }
  };

  const formatSeconds = (seconds: number) => `${Math.max(seconds, 0)}s`;

  return (
    <div className="flex w-full flex-col gap-5 pb-8">
      <header className="flex items-center gap-3 border-b border-border pb-4">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
          <Mic className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-foreground">VSTEP Speaking Simulation</h1>
          <p className="mt-1 text-sm text-muted-foreground">Chuẩn bị, ghi âm và tự canh thời gian cho từng phần thi</p>
        </div>
      </header>

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-12">
        <main className="flex min-w-0 flex-col gap-4 lg:col-span-8">
          <section className="flex items-center justify-between gap-4 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3" aria-live="polite">
            <div>
              <p className="text-xs font-bold uppercase text-muted-foreground">{timerPhase === 'preparing' ? 'Đang chuẩn bị' : 'Thời gian chuẩn bị'}</p>
              <p className={`mt-0.5 font-mono text-2xl font-bold tabular-nums ${timerPhase === 'preparing' ? 'text-amber-500' : 'text-foreground'}`}>
                {timerPhase === 'preparing'
                  ? formatSeconds(preparationRemaining ?? 0)
                  : timerPhase === 'speaking'
                    ? 'Nói ngay'
                    : formatSeconds(getSeconds('prep'))}
              </p>
            </div>
            <span className="text-right text-xs text-muted-foreground">
              {timerPhase === 'speaking' && runningPart
                ? `${PARTS.find((part) => part.id === runningPart)?.title} đang chạy`
                : timerPhase === 'complete'
                  ? 'Đã hoàn thành phần thi'
                  : timerPhase === 'idle'
                    ? 'Chọn Start ở phần muốn luyện'
                    : 'Hết giờ sẽ tự bắt đầu ghi âm'}
            </span>
          </section>

          <section className="overflow-hidden rounded-lg border border-border bg-card" aria-label="Bộ đếm từng phần thi">
            {PARTS.map((part, index) => {
              const active = runningPart === part.id;
              return (
                <div key={part.id} className={`flex flex-wrap items-center justify-between gap-3 px-4 py-4 ${index > 0 ? 'border-t border-border' : ''}`}>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-bold text-foreground">{part.title}</h2>
                    <p className="mt-1 text-xs text-muted-foreground">Thời gian nói: {formatSeconds(remainingTimes[part.id])}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`min-w-14 text-right font-mono text-2xl font-bold tabular-nums ${active ? 'text-primary' : 'text-foreground'}`}>
                      {formatSeconds(remainingTimes[part.id])}
                    </span>
                    <button
                      onClick={() => handleRunPart(part.id)}
                      disabled={recorderStatus === 'requesting'}
                      className="flex h-10 min-w-24 items-center justify-center gap-2 rounded-md bg-primary px-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-wait disabled:opacity-60 cursor-pointer"
                    >
                      <Play className="h-4 w-4 fill-current" />
                      {active ? 'Chạy lại' : 'Start'}
                    </button>
                  </div>
                </div>
              );
            })}
          </section>

          <section className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4" aria-labelledby="recorder-heading">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 id="recorder-heading" className="font-bold">Ghi âm câu trả lời</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {recorderStatus === 'requesting' ? 'Đang chờ quyền microphone…' : recorderStatus === 'recording' ? 'Đang ghi âm' : recorderStatus === 'ready' ? 'Đã có bản ghi' : 'Bản ghi được tạo trên thiết bị của bạn'}
                </p>
              </div>
              {recorderStatus === 'recording' && <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" aria-label="Đang ghi âm" />}
            </div>

            {recorderStatus === 'recording' && (
              <div
                role="img"
                aria-label="Biểu đồ âm lượng microphone đang hoạt động"
                className="rounded-lg border border-border bg-muted/40 px-3 py-3"
              >
                <div className="mb-2 flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
                  <span>Sóng âm trực tiếp</span>
                  <span className="text-red-500">● LIVE</span>
                </div>
                <div className="flex h-12 items-center gap-1" aria-hidden="true">
                  {waveformLevels.map((level, index) => (
                    <span
                      key={index}
                      className="min-w-0 flex-1 rounded-full transition-[height] duration-75"
                      style={{
                        height: `${Math.max(4, Math.round(level * 44))}px`,
                        backgroundColor: `hsl(${Math.round(index * 120 / (waveformLevels.length - 1))} 76% 46%)`,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleManualRecord}
                disabled={recorderStatus === 'recording' || recorderStatus === 'requesting'}
                className="flex h-10 items-center gap-2 rounded-md bg-red-600 px-4 text-sm font-bold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
              >
                <Mic className="h-4 w-4" /> Record
              </button>
              <button
                onClick={handleStopRecording}
                disabled={recorderStatus !== 'recording' && recorderStatus !== 'requesting'}
                className="flex h-10 items-center gap-2 rounded-md border border-border px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
              >
                <Square className="h-4 w-4" /> Stop Recording
              </button>
              <button
                onClick={() => void audioRef.current?.play()}
                disabled={!audioUrl}
                className="flex h-10 items-center gap-2 rounded-md border border-border px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
              >
                <Volume2 className="h-4 w-4" /> Play Recording
              </button>
              {audioUrl && (
                <a
                  href={audioUrl}
                  download="vstep-speaking.webm"
                  aria-label="Tải bản ghi xuống"
                  className="grid h-10 w-10 place-items-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  title="Tải bản ghi xuống"
                >
                  <Download className="h-4 w-4" />
                </a>
              )}
              <button
                onClick={() => {
                  clearTimers();
                  setRunningPart(null);
                  setPreparationRemaining(null);
                  setTimerPhase('idle');
                  stopMedia(true);
                  setRemainingTimes({ part1: getSeconds('part1'), part2: getSeconds('part2'), part3: getSeconds('part3') });
                }}
                className="ml-auto grid h-10 w-10 place-items-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground cursor-pointer"
                title="Đặt lại các bộ đếm"
                aria-label="Đặt lại các bộ đếm"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
            {audioUrl && (
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-foreground">
                  <Volume2 className="h-4 w-4 text-primary" />
                  Bản ghi âm · tua và phát lại
                </div>
                <audio
                  ref={audioRef}
                  src={audioUrl}
                  controls
                  preload="metadata"
                  className="h-10 w-full"
                  aria-label="Phát lại và tua bản ghi câu trả lời"
                />
              </div>
            )}
            {recorderError && (
              <p role="alert" className="flex items-center gap-2 text-xs font-medium text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" /> {recorderError}
              </p>
            )}
          </section>
        </main>

        <aside className="flex min-w-0 flex-col gap-3 rounded-lg border border-border bg-card p-4 lg:col-span-4" aria-labelledby="settings-heading">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Settings className="h-4 w-4 text-primary" />
            <h2 id="settings-heading" className="font-bold">Cài đặt số giây</h2>
          </div>
          <p className="text-xs text-muted-foreground">Cài đặt được lưu tự động. Part 1 bắt đầu nói ngay; Prep áp dụng cho Part 2 và Part 3.</p>

          {([
            { key: 'prep', label: 'Chuẩn bị (Prep)', min: 0 },
            { key: 'part1', label: 'Part 1 (Nói)', min: 1 },
            { key: 'part2', label: 'Part 2 (Nói)', min: 1 },
            { key: 'part3', label: 'Part 3 (Nói)', min: 1 },
          ] as { key: SettingKey; label: string; min: number }[]).map(({ key, label, min }) => (
            <label key={key} className="flex items-center justify-between gap-3 py-1 text-sm">
              <span className="font-medium text-foreground">{label}</span>
              <span className="flex h-10 w-28 shrink-0 items-center overflow-hidden rounded-md border border-border bg-background focus-within:ring-2 focus-within:ring-primary/30">
                <input
                  type="number"
                  min={min}
                  step="1"
                  value={settings[key]}
                  onChange={(event) => updateSetting(key, event.target.value)}
                  className="h-full w-full min-w-0 bg-transparent px-2 text-right font-mono text-sm text-foreground outline-none"
                  aria-label={`${label}, giây`}
                />
                <span className="pr-2 text-xs text-muted-foreground">s</span>
              </span>
            </label>
          ))}

          <div className="mt-1 flex items-start gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>Bấm Start ở từng Part để chạy prep, sau đó tự ghi âm và đếm ngược thời gian nói.</span>
          </div>
        </aside>
      </div>

      <section className="rounded-lg border border-border bg-card p-4 sm:p-5" aria-labelledby="custom-exam-heading">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
          <div>
            <h2 id="custom-exam-heading" className="font-bold">Custom đề thi</h2>
            <p className="mt-1 text-xs text-muted-foreground">Dán đề thi vào đây; nội dung sẽ được lưu tự động.</p>
          </div>
          <button
            onClick={() => {
              if (examEditorRef.current) examEditorRef.current.innerHTML = '';
              localStorage.removeItem(CUSTOM_EXAM_KEY);
              setHasExamContent(false);
            }}
            disabled={!hasExamContent}
            className="flex h-9 items-center gap-2 rounded-md border border-border px-3 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Xóa đề
          </button>
        </div>

        <div className="relative">
          <div
            ref={examEditorRef}
            contentEditable
            suppressContentEditableWarning
            role="textbox"
            aria-label="Nội dung custom đề thi"
            aria-multiline="true"
            onInput={(event) => {
              const editor = event.currentTarget;
              localStorage.setItem(CUSTOM_EXAM_KEY, editor.innerHTML);
              setHasExamContent(Boolean(editor.textContent?.trim()));
            }}
            onPaste={handleExamPaste}
            className="min-h-52 max-h-[60vh] overflow-y-auto rounded-md border border-border bg-background p-4 text-sm leading-7 text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 [&_a]:text-primary [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_h1]:text-xl [&_h1]:font-bold [&_h2]:text-lg [&_h2]:font-bold [&_h3]:font-bold [&_li]:ml-5 [&_ol]:list-decimal [&_ul]:list-disc"
          />
          {!hasExamContent && (
            <span className="pointer-events-none absolute left-4 top-4 text-sm text-muted-foreground">
              Dán đề thi hoặc nhập nội dung tại đây…
            </span>
          )}
        </div>
      </section>
    </div>
  );
}