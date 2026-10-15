'use client';

import React, { startTransition, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  Check,
  Dices,
  Download,
  Mic,
  Play,
  RotateCcw,
  Settings,
  Square,
  Volume2,
} from 'lucide-react';
import { EXAM_PROMPTS, toPromptEditorHtml } from '@/utils/examPrompts';

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
const ACTIVE_EXAM_KEY = 'vstep_speaking_active_exam';
const SAFE_TAGS = new Set([
  'A', 'B', 'BLOCKQUOTE', 'BR', 'DIV', 'EM', 'H1', 'H2', 'H3', 'H4', 'I',
  'LI', 'OL', 'P', 'S', 'STRONG', 'U', 'UL',
]);
const SAFE_CLASSES = new Set([
  'speaking-part3-layout',
  'speaking-part3-options',
  'speaking-part3-options-center',
  'speaking-part3-option',
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
      if (attribute.name === 'class') {
        const safeClasses = attribute.value
          .split(/\s+/)
          .filter((className) => SAFE_CLASSES.has(className));
        if (safeClasses.length > 0) {
          element.className = safeClasses.join(' ');
        } else {
          element.removeAttribute('class');
        }
      } else if (element.tagName !== 'A' || attribute.name !== 'href') {
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
  const [activePart, setActivePart] = useState<SpeakingPart>('part1');
  const [isSubmitted, setIsSubmitted] = useState(false);

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
  const suppressEditorInputRef = useRef(false);

  const setExamEditorContent = useCallback((content: string) => {
    if (!examEditorRef.current) return;
    suppressEditorInputRef.current = true;
    examEditorRef.current.innerHTML = content;
    window.setTimeout(() => {
      suppressEditorInputRef.current = false;
    }, 0);
  }, []);

  useEffect(() => {
    const restored = { ...DEFAULT_SETTINGS };
    (Object.keys(STORAGE_KEYS) as SettingKey[]).forEach((key) => {
      const value = localStorage.getItem(STORAGE_KEYS[key]);
      if (value !== null && /^\d+$/.test(value)) restored[key] = value;
    });
    if (restored.part2 === '120') restored.part2 = '180';

    const savedExam = localStorage.getItem(CUSTOM_EXAM_KEY) || '';
    const params = new URLSearchParams(window.location.search);
    const queryPart = params.get('part');
    const pathPart = window.location.pathname.match(/^\/speaking\/(part[123])$/)?.[1];
    const savedPart = localStorage.getItem('vstep_speaking_active_part');
    const restoredPart = pathPart === 'part1' || pathPart === 'part2' || pathPart === 'part3'
      ? pathPart
      : queryPart === 'part1' || queryPart === 'part2' || queryPart === 'part3'
        ? queryPart
      : savedPart === 'part1' || savedPart === 'part2' || savedPart === 'part3'
        ? savedPart
        : null;
    const requestedExamId = params.get('exam');
    const examPrompt = EXAM_PROMPTS.find((prompt) => (
      prompt.id === requestedExamId
      && prompt.category === `speaking-${restoredPart}`
    ));
    const restoredExam = examPrompt ? toPromptEditorHtml(examPrompt) : savedExam;
    const sanitizedExam = sanitizeClipboardHtml(restoredExam);
    setExamEditorContent(sanitizedExam);
    startTransition(() => {
      setSettings(restored);
      setRemainingTimes({
        part1: Number(restored.part1),
        part2: Number(restored.part2),
        part3: Number(restored.part3),
      });
      setHasExamContent(Boolean(restoredExam.trim()));
      if (restoredPart) {
        setActivePart(restoredPart);
        localStorage.setItem('vstep_speaking_active_part', restoredPart);
      }
      if (examPrompt) {
        localStorage.setItem(CUSTOM_EXAM_KEY, restoredExam);
        localStorage.setItem(ACTIVE_EXAM_KEY, examPrompt.id);
      } else {
        localStorage.removeItem(ACTIVE_EXAM_KEY);
      }
      setSettingsLoaded(true);
    });
    const canonicalUrl = `/speaking/${restoredPart ?? 'part1'}${examPrompt ? `?exam=${encodeURIComponent(examPrompt.id)}` : ''}`;
    if (`${window.location.pathname}${window.location.search}` !== canonicalUrl) {
      window.history.replaceState(null, '', canonicalUrl);
    }
  }, [setExamEditorContent]);

  useEffect(() => {
    if (!settingsLoaded) return;
    (Object.keys(STORAGE_KEYS) as SettingKey[]).forEach((key) => {
      localStorage.setItem(STORAGE_KEYS[key], settings[key]);
    });
  }, [settings, settingsLoaded]);

  useEffect(() => {
    const handleSectionSelect = (event: Event) => {
      const { skill, section } = (event as CustomEvent<{ skill: string; section: string }>).detail;
      if (skill !== 'speaking' || (section !== 'part1' && section !== 'part2' && section !== 'part3')) return;
      setActivePart(section);
      setIsSubmitted(false);
      localStorage.setItem('vstep_speaking_active_part', section);
      localStorage.removeItem(ACTIVE_EXAM_KEY);
    };

    window.addEventListener('vstep:select-section', handleSectionSelect);
    const handlePopState = () => {
      const part = window.location.pathname.match(/^\/speaking\/(part[123])$/)?.[1];
      if (part !== 'part1' && part !== 'part2' && part !== 'part3') return;
      setActivePart(part);
      localStorage.setItem('vstep_speaking_active_part', part);
      const examId = new URLSearchParams(window.location.search).get('exam');
      const prompt = EXAM_PROMPTS.find((item) => (
        item.id === examId && item.category === `speaking-${part}`
      ));
      if (!prompt || !examEditorRef.current) return;
      const content = toPromptEditorHtml(prompt);
      const sanitizedContent = sanitizeClipboardHtml(content);
      setExamEditorContent(sanitizedContent);
      localStorage.setItem(CUSTOM_EXAM_KEY, content);
      localStorage.setItem(ACTIVE_EXAM_KEY, prompt.id);
      setHasExamContent(true);
      setIsSubmitted(false);
    };
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('vstep:select-section', handleSectionSelect);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [setExamEditorContent]);

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

  const updateSetting = (key: SettingKey, value: string) => {
    setSettings((previous) => ({ ...previous, [key]: value }));

    const seconds = Number.parseInt(value, 10);
    const minimum = key === 'prep' ? 0 : 1;
    if (!Number.isFinite(seconds) || seconds < minimum || key === 'prep') return;

    setRemainingTimes((previous) => ({ ...previous, [key]: seconds }));
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
    setActivePart(part);
    setIsSubmitted(false);
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

  const handleManualRecord = async () => {
    clearTimers();
    stopMedia(true);
    const part = activePart;
    const duration = getSeconds(part);
    setRunningPart(part);
    setRemainingTimes((previous) => ({ ...previous, [part]: duration }));
    setPreparationRemaining(null);
    setTimerPhase('speaking');
    const recordingStarted = await startRecording();
    if (recordingStarted) {
      runSpeakingTimer(part, duration);
    } else {
      setRunningPart(null);
      setTimerPhase('idle');
    }
  };

  const handleStopRecording = () => {
    clearTimers();
    setRunningPart(null);
    setPreparationRemaining(null);
    setTimerPhase('idle');
    stopMedia(false);
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

  const handleRandomPrompt = () => {
    const pathPart = window.location.pathname.match(/^\/speaking\/(part[123])$/)?.[1];
    const selectedPart = pathPart === 'part1' || pathPart === 'part2' || pathPart === 'part3'
      ? pathPart
      : activePart;
    const prompts = EXAM_PROMPTS.filter((prompt) => prompt.category === `speaking-${selectedPart}`);
    const prompt = prompts[Math.floor(Math.random() * prompts.length)];
    if (!prompt || !examEditorRef.current) return;
    const content = toPromptEditorHtml(prompt);
    localStorage.setItem(CUSTOM_EXAM_KEY, content);
    localStorage.setItem(ACTIVE_EXAM_KEY, prompt.id);
    const part = prompt.category.replace('speaking-', 'part');
    if (part === 'part1' || part === 'part2' || part === 'part3') {
      localStorage.setItem('vstep_speaking_active_part', part);
      window.location.assign(`/speaking/${part}?exam=${encodeURIComponent(prompt.id)}`);
    }
  };

  const handleSubmitPractice = () => {
    clearTimers();
    setRunningPart(null);
    setPreparationRemaining(null);
    setTimerPhase('complete');
    stopMedia(false);
    setIsSubmitted(true);
  };

  const formatClock = (seconds: number) => {
    const safeSeconds = Math.max(seconds, 0);
    return `${Math.floor(safeSeconds / 60).toString().padStart(2, '0')}:${(safeSeconds % 60).toString().padStart(2, '0')}`;
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 pb-4">
      <header className="flex h-10 items-center justify-between rounded-sm bg-[#245b86] px-3 text-white">
        <div className="flex items-center gap-2 text-xs font-bold">
          <Mic className="h-4 w-4" />
          <span>VSTEP SPEAKING</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Link
            href="/speaking/settings"
            title="Cấu hình Speaking"
            aria-label="Cấu hình Speaking"
            className="grid h-8 w-8 place-items-center rounded-sm border border-white/30 bg-white/10 transition hover:bg-white/20"
          >
            <Settings className="h-4 w-4" />
          </Link>
          <button
            type="button"
            onClick={handleRandomPrompt}
            title="Lấy đề nói ngẫu nhiên"
            aria-label="Lấy đề nói ngẫu nhiên"
            className="grid h-8 w-8 place-items-center rounded-sm border border-white/30 bg-white/10 transition hover:bg-white/20 cursor-pointer"
          >
            <Dices className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleSubmitPractice}
            className="ml-1 rounded-sm bg-[#df4b24] px-3 py-1.5 text-[10px] font-extrabold text-white transition hover:bg-red-700 cursor-pointer"
          >
            NỘP BÀI
          </button>
        </div>
      </header>

      <section className="grid overflow-hidden border border-border bg-white shadow-sm dark:bg-card lg:grid-cols-[minmax(0,1fr)_190px]">
        <main className="min-w-0 border-b border-border lg:border-b-0 lg:border-r">
          <div className="px-3 pt-3">
            <p className="mb-1 text-[10px] font-extrabold uppercase tracking-wide text-slate-600 dark:text-muted-foreground">
              Question {activePart.slice(-1)}
            </p>
            <div className="flex h-9 items-center gap-2 bg-[#48005e] px-2 text-white">
              <button
                type="button"
                onClick={() => runningPart ? handleStopRecording() : handleRunPart(activePart)}
                disabled={recorderStatus === 'requesting'}
                aria-label={runningPart ? 'Dừng phần thi đang chạy' : `Bắt đầu ${activePart}`}
                className="grid h-6 w-7 shrink-0 place-items-center bg-white/15 hover:bg-white/25 disabled:opacity-50 cursor-pointer"
              >
                {runningPart ? <Square className="h-3 w-3 fill-current" /> : <Play className="h-3 w-3 fill-current" />}
              </button>
              <span className="min-w-12 font-mono text-xs font-bold tabular-nums">
                {formatClock(timerPhase === 'preparing' ? preparationRemaining ?? 0 : remainingTimes[activePart])}
              </span>
              <div className="h-1.5 flex-1 overflow-hidden bg-white/25">
                <div
                  className="h-full bg-white transition-[width] duration-500"
                  style={{
                    width: `${Math.max(0, Math.min(100, (remainingTimes[activePart] / Math.max(getSeconds(activePart), 1)) * 100))}%`,
                  }}
                />
              </div>
              <span className="min-w-16 text-right font-mono text-xs font-bold tabular-nums" aria-live="off">
                {timerPhase === 'preparing' ? `Prep ${formatClock(preparationRemaining ?? 0)}` : `Còn ${formatClock(remainingTimes[activePart])}`}
              </span>
            </div>
          </div>

          <div className="px-3 py-3">
            <div
              ref={examEditorRef}
              contentEditable
              suppressContentEditableWarning
              role="textbox"
              aria-label="Nội dung đề Speaking"
              aria-multiline="true"
              onInput={(event) => {
                if (suppressEditorInputRef.current) return;
                const editor = event.currentTarget;
                localStorage.setItem(CUSTOM_EXAM_KEY, editor.innerHTML);
                localStorage.removeItem(ACTIVE_EXAM_KEY);
                const params = new URLSearchParams(window.location.search);
                if (params.has('exam')) {
                  params.delete('exam');
                  const query = params.toString();
                  window.history.replaceState(
                    null,
                    '',
                    `${window.location.pathname}${query ? `?${query}` : ''}`,
                  );
                }
                setHasExamContent(Boolean(editor.textContent?.trim()));
                setIsSubmitted(false);
              }}
              onPaste={handleExamPaste}
              data-placeholder="Chọn đề trong Ngân hàng đề hoặc bấm xúc xắc để bắt đầu luyện nói…"
              className="speaking-editor min-h-[230px] max-h-[48vh] overflow-y-auto bg-white p-3 text-[11px] leading-5 text-slate-800 outline-none dark:bg-card dark:text-foreground [&_a]:text-primary [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_h1]:text-base [&_h1]:font-bold [&_h2]:mb-2 [&_h2]:text-sm [&_h2]:font-extrabold [&_h3]:font-bold [&_li]:ml-5 [&_ol]:list-decimal [&_ul]:list-disc"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-border bg-muted/40 px-3 py-2">
            <span className="mr-auto text-[10px] font-semibold text-muted-foreground">
              {recorderStatus === 'requesting' ? 'Đang chờ quyền microphone…' : recorderStatus === 'recording' ? 'Đang ghi âm · LIVE' : recorderStatus === 'ready' ? 'Đã có bản ghi âm' : timerPhase === 'preparing' ? 'Chuẩn bị trước khi trả lời' : 'Nhấn Start để bắt đầu'}
            </span>
            <button
              type="button"
              onClick={handleManualRecord}
              disabled={recorderStatus === 'recording' || recorderStatus === 'requesting'}
              className="flex h-7 items-center gap-1 rounded-sm bg-red-600 px-2 text-[10px] font-bold text-white hover:bg-red-700 disabled:opacity-50 cursor-pointer"
            >
              <Mic className="h-3 w-3" /> GHI ÂM
            </button>
            <button
              type="button"
              onClick={handleStopRecording}
              disabled={recorderStatus !== 'recording' && recorderStatus !== 'requesting'}
              className="flex h-7 items-center gap-1 rounded-sm border border-border px-2 text-[10px] font-bold text-foreground hover:bg-muted disabled:opacity-50 cursor-pointer"
            >
              <Square className="h-3 w-3" /> DỪNG
            </button>
            <button
              type="button"
              onClick={() => void audioRef.current?.play()}
              disabled={!audioUrl}
              className="grid h-7 w-7 place-items-center rounded-sm border border-border text-foreground hover:bg-muted disabled:opacity-50 cursor-pointer"
              aria-label="Phát bản ghi"
              title="Phát bản ghi"
            >
              <Volume2 className="h-3.5 w-3.5" />
            </button>
            {audioUrl && (
              <a href={audioUrl} download="vstep-speaking.webm" aria-label="Tải bản ghi xuống" title="Tải bản ghi xuống" className="grid h-7 w-7 place-items-center rounded-sm border border-border text-foreground hover:bg-muted">
                <Download className="h-3.5 w-3.5" />
              </a>
            )}
            <button
              type="button"
              onClick={() => {
                clearTimers();
                setRunningPart(null);
                setPreparationRemaining(null);
                setTimerPhase('idle');
                setIsSubmitted(false);
                stopMedia(true);
                setRemainingTimes({ part1: getSeconds('part1'), part2: getSeconds('part2'), part3: getSeconds('part3') });
              }}
              className="grid h-7 w-7 place-items-center rounded-sm border border-border text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
              title="Đặt lại bộ đếm"
              aria-label="Đặt lại bộ đếm"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>

          {audioUrl && (
            <audio ref={audioRef} src={audioUrl} controls preload="metadata" className="h-8 w-full px-3 py-1" aria-label="Phát lại và tua bản ghi câu trả lời" />
          )}
          {recorderError && (
            <p role="alert" className="flex items-center gap-2 px-3 pb-2 text-[10px] font-medium text-red-600 dark:text-red-400">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {recorderError}
            </p>
          )}
        </main>

        <aside className="flex flex-col gap-2 p-2.5">
          <div className="flex h-[78px] items-end gap-1 overflow-hidden bg-[#171717] p-2" role="img" aria-label={recorderStatus === 'recording' ? 'Âm lượng microphone đang hoạt động' : 'Trình hiển thị âm thanh'}>
            {waveformLevels.map((level, index) => (
              <span
                key={index}
                className="min-w-0 flex-1 rounded-t-sm transition-[height] duration-75"
                style={{
                  height: `${Math.max(4, Math.round(level * 55))}px`,
                  backgroundColor: `hsl(${Math.round(index * 120 / (waveformLevels.length - 1))} 85% 48%)`,
                }}
              />
            ))}
          </div>

          <div className={`flex min-h-[176px] flex-1 flex-col items-center justify-center px-3 py-4 text-center text-white ${isSubmitted ? 'bg-emerald-700' : 'bg-[#23aa00]'}`} aria-live="polite">
            {isSubmitted ? (
              <>
                <Check className="mb-3 h-8 w-8 rounded-full border-2 border-white p-1" />
                <p className="text-[11px] font-extrabold leading-5">LƯỢT LUYỆN ĐÃ KẾT THÚC</p>
                <p className="mt-2 text-[9px] font-semibold leading-4">Bản ghi âm được giữ trên thiết bị này. Bạn có thể phát lại hoặc tải xuống.</p>
              </>
            ) : (
              <>
                <Mic className="mb-3 h-8 w-8" />
                <p className="text-[11px] font-extrabold leading-5">{hasExamContent ? 'ĐỀ THI ĐÃ SẴN SÀNG' : 'CHỌN ĐỀ ĐỂ BẮT ĐẦU'}</p>
                <p className="mt-2 text-[9px] font-semibold leading-4">Nhấn “NỘP BÀI” ở góc trên để kết thúc lượt luyện.</p>
              </>
            )}
          </div>

          <section className="rounded-sm border border-border bg-card p-2.5" aria-labelledby="speaking-duration-heading">
            <div className="mb-2 flex items-center justify-between gap-2 border-b border-border pb-2">
              <div>
                <h2 id="speaking-duration-heading" className="text-[11px] font-extrabold text-foreground">Thời lượng từng phần</h2>
                <p className="mt-0.5 text-[9px] leading-4 text-muted-foreground">Chỉnh giây · Part 1 không có chuẩn bị</p>
              </div>
              <span className="shrink-0 rounded-sm bg-primary/10 px-1.5 py-1 text-[9px] font-bold text-primary">
                {timerPhase === 'preparing'
                  ? `Prep ${formatClock(preparationRemaining ?? 0)}`
                  : `${PARTS.find((part) => part.id === activePart)?.title.split(': ')[0]} ${formatClock(remainingTimes[activePart])}`}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1.5">
              {([
                { key: 'prep', label: `Chuẩn bị · ${formatClock(getSeconds('prep'))}`, min: 0 },
                { key: 'part1', label: `Part 1 · ${formatClock(getSeconds('part1'))}`, min: 1 },
                { key: 'part2', label: `Part 2 · ${formatClock(getSeconds('part2'))}`, min: 1 },
                { key: 'part3', label: `Part 3 · ${formatClock(getSeconds('part3'))}`, min: 1 },
              ] as { key: SettingKey; label: string; min: number }[]).map(({ key, label, min }) => (
                <label key={key} className="flex min-w-0 flex-col gap-1 text-[9px] font-semibold text-muted-foreground">
                  <span className="truncate" title={label}>{label}</span>
                  <span className="flex h-7 items-center overflow-hidden rounded-sm border border-border bg-background focus-within:border-primary">
                    <input
                      type="number"
                      min={min}
                      step="1"
                      value={settings[key]}
                      disabled={timerPhase === 'preparing' || timerPhase === 'speaking'}
                      onChange={(event) => updateSetting(key, event.target.value)}
                      className="h-full w-full min-w-0 bg-transparent px-1.5 text-right font-mono text-[10px] font-bold text-foreground outline-none disabled:cursor-not-allowed disabled:opacity-60"
                      aria-label={`${label}, giây`}
                    />
                    <span className="pr-1.5 text-[9px]">s</span>
                  </span>
                </label>
              ))}
            </div>
            {(timerPhase === 'preparing' || timerPhase === 'speaking') && (
              <p className="mt-2 text-[9px] leading-4 text-muted-foreground">Dừng lượt luyện để chỉnh thời lượng.</p>
            )}
          </section>
        </aside>
      </section>

    </div>
  );
}