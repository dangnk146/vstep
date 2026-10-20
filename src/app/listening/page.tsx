'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Headphones, 
  Flag, 
  Check,
  ChevronLeft,
  ChevronRight,
  Film,
  Save,
  X,
} from 'lucide-react';
import videoData from './listvideo.json';

const YOUTUBE_IFRAME_API_URL = 'https://www.youtube.com/iframe_api';
const VIDEO_JUMP_MINUTES = [2, 3, 4, 5, 6, 8, 10, 12] as const;
const PARTS = [
  { id: 'part1', label: 'Part 1', start: 1, count: 8 },
  { id: 'part2', label: 'Part 2', start: 1, count: 12 },
  { id: 'part3', label: 'Part 3', start: 1, count: 15 },
] as const;

type PartId = (typeof PARTS)[number]['id'];
type AnswerKeysByVideo = Record<string, Record<number, string>>;

const ANSWER_KEY_STORAGE_KEY_V1 = 'vstep_listening_answer_keys_v1';
const ANSWER_KEY_STORAGE_KEY_V2 = 'vstep_listening_answer_keys_v2';
const SAVE_CONFIRMATION_STORAGE_KEY = 'vstep_listening_skip_save_confirmation';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function loadListeningAnswerKeys(): { answerKeys: AnswerKeysByVideo; error: string } {
  if (typeof window === 'undefined') return { answerKeys: {}, error: '' };

  try {
    const savedAnswerKeys = localStorage.getItem(ANSWER_KEY_STORAGE_KEY_V2);
    if (savedAnswerKeys) {
      const parsed: unknown = JSON.parse(savedAnswerKeys);
      if (!isRecord(parsed)) {
        throw new Error('Saved Listening answer keys have an invalid format.');
      }

      const restored: AnswerKeysByVideo = {};
      for (const [vid, videoAnswers] of Object.entries(parsed)) {
        if (!isRecord(videoAnswers)) continue;
        const validAnswers: Record<number, string> = {};
        for (const [qNum, ans] of Object.entries(videoAnswers)) {
          const number = Number(qNum);
          if (
            Number.isInteger(number) &&
            number >= 1 &&
            number <= 35 &&
            typeof ans === 'string' &&
            ['A', 'B', 'C', 'D'].includes(ans)
          ) {
            validAnswers[number] = ans;
          }
        }
        if (Object.keys(validAnswers).length > 0) {
          restored[vid] = validAnswers;
        }
      }
      return { answerKeys: restored, error: '' };
    }

    // Migrate from v1 if present
    const oldSaved = localStorage.getItem(ANSWER_KEY_STORAGE_KEY_V1);
    if (oldSaved) {
      try {
        const parsedOld: unknown = JSON.parse(oldSaved);
        if (isRecord(parsedOld)) {
          const restored: AnswerKeysByVideo = {};
          for (const part of PARTS) {
            const partAnswers = parsedOld[part.id];
            if (!isRecord(partAnswers)) continue;
            const firstVideoId = (videoData as Record<string, string[]>)[part.id]?.[0];
            if (!firstVideoId) continue;
            const validAnswers: Record<number, string> = {};
            for (const [qNum, ans] of Object.entries(partAnswers)) {
              const number = Number(qNum);
              if (
                Number.isInteger(number) &&
                number >= part.start &&
                number < part.start + part.count &&
                typeof ans === 'string' &&
                ['A', 'B', 'C', 'D'].includes(ans)
              ) {
                validAnswers[number] = ans;
              }
            }
            if (Object.keys(validAnswers).length > 0) {
              restored[firstVideoId] = validAnswers;
            }
          }
          if (Object.keys(restored).length > 0) {
            localStorage.setItem(ANSWER_KEY_STORAGE_KEY_V2, JSON.stringify(restored));
            return { answerKeys: restored, error: '' };
          }
        }
      } catch {
        // ignore migration errors
      }
    }

    return { answerKeys: {}, error: '' };
  } catch (error) {
    console.error('Could not restore saved Listening answer keys.', error);
    return {
      answerKeys: {},
      error: 'Không thể tải đáp án đã lưu. Hãy kiểm tra bộ nhớ trình duyệt.',
    };
  }
}

function subscribeToHydration() {
  return () => {};
}

function getClientHydrationSnapshot() {
  return true;
}

function getServerHydrationSnapshot() {
  return false;
}

type YouTubePlayer = {
  getCurrentTime: () => number;
  getDuration: () => number;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  loadVideoById: (videoId: string) => void;
  destroy: () => void;
};

type YouTubeIframeApi = {
  Player: new (
    iframe: HTMLIFrameElement,
    options: {
      events: {
        onReady: (event: { target: YouTubePlayer }) => void;
      };
    },
  ) => YouTubePlayer;
};

declare global {
  interface Window {
    YT?: YouTubeIframeApi;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let youtubeApiPromise: Promise<YouTubeIframeApi> | undefined;

function loadYouTubeIframeApi() {
  if (window.YT) {
    return Promise.resolve(window.YT);
  }

  if (youtubeApiPromise) {
    return youtubeApiPromise;
  }

  youtubeApiPromise = new Promise<YouTubeIframeApi>((resolve, reject) => {
    const previousReadyCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (window.YT) {
        resolve(window.YT);
      } else {
        youtubeApiPromise = undefined;
        reject(new Error('YouTube Player API failed to initialize.'));
      }
      previousReadyCallback?.();
    };

    const script = document.createElement('script');
    script.src = YOUTUBE_IFRAME_API_URL;
    script.onerror = () => {
      youtubeApiPromise = undefined;
      reject(new Error('Failed to load the YouTube Player API.'));
    };
    document.head.appendChild(script);
  });

  return youtubeApiPromise;
}

export default function ListeningPage() {
  const pathname = usePathname();
  const router = useRouter();
  const [initialSavedAnswerKeys] = useState(loadListeningAnswerKeys);
  const isHydrated = useSyncExternalStore(
    subscribeToHydration,
    getClientHydrationSnapshot,
    getServerHydrationSnapshot,
  );
  const [answersByVideo, setAnswersByVideo] = useState<Record<string, Record<number, string>>>({});
  const [flagsByVideo, setFlagsByVideo] = useState<Record<string, Record<number, boolean>>>({});
  const [answerKeysByVideo, setAnswerKeysByVideo] = useState<AnswerKeysByVideo>(initialSavedAnswerKeys.answerKeys);
  const [checkedVideoIds, setCheckedVideoIds] = useState<Set<string>>(new Set());
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [skipSaveConfirmation, setSkipSaveConfirmation] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [storageError, setStorageError] = useState(initialSavedAnswerKeys.error);

  const videoDialogRef = useRef<HTMLDialogElement>(null);
  const saveDialogRef = useRef<HTMLDialogElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const playerRef = useRef<YouTubePlayer | null>(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [playerError, setPlayerError] = useState(false);

  const routeMatch = pathname.match(/^\/listening\/(part[123])\/video(\d+)$/);
  const isVideoRoute = routeMatch !== null;
  const selectedPart = (routeMatch?.[1] ?? 'part1') as PartId;
  const selectedVideo = Number(routeMatch?.[2] ?? 1);
  const partInfo = PARTS.find((item) => item.id === selectedPart)!;
  const partVideos = videoData[selectedPart];
  const videoId = partVideos[selectedVideo - 1] ?? partVideos[0];
  const loadedVideoIdRef = useRef(videoId);

  const questionNumbers = Array.from(
    { length: partInfo.count },
    (_, index) => partInfo.start + index,
  );
  const answers = answersByVideo[videoId] ?? {};
  const flags = flagsByVideo[videoId] ?? {};
  const answerKey = isHydrated ? (answerKeysByVideo[videoId] ?? {}) : {};
  const isChecked = checkedVideoIds.has(videoId);

  const answeredCount = questionNumbers.filter((number) => answers[number]).length;
  const flaggedCount = questionNumbers.filter((number) => flags[number]).length;

  const questionGroups = (() => {
    if (selectedPart === 'part1') {
      return [{
        title: 'Part 1 · Thông báo & Chỉ dẫn ngắn',
        subtitle: `Câu ${partInfo.start} – ${partInfo.start + partInfo.count - 1}`,
        questions: questionNumbers,
      }];
    }

    const groups: { title: string; subtitle: string; questions: number[] }[] = [];
    const chunkSize = 5;
    for (let i = 0; i < questionNumbers.length; i += chunkSize) {
      const chunk = questionNumbers.slice(i, i + chunkSize);
      const groupNum = Math.floor(i / chunkSize) + 1;
      const typeLabel = selectedPart === 'part2' ? 'Hội thoại' : 'Bài thuyết trình';
      groups.push({
        title: `${typeLabel} ${groupNum}`,
        subtitle: `Câu ${chunk[0]} – Câu ${chunk[chunk.length - 1]}`,
        questions: chunk,
      });
    }
    return groups;
  })();

  useEffect(() => {
    if (!isVideoRoute) {
      return;
    }

    let cancelled = false;

    loadYouTubeIframeApi()
      .then((youtubeApi) => {
        if (cancelled || !iframeRef.current) {
          return;
        }

        playerRef.current = new youtubeApi.Player(iframeRef.current, {
          events: {
            onReady: ({ target }) => {
              playerRef.current = target;
              setIsPlayerReady(true);
            },
          },
        });
      })
      .catch(() => {
        if (!cancelled) {
          setPlayerError(true);
        }
      });

    return () => {
      cancelled = true;
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [isVideoRoute]);

  useEffect(() => {
    if (isPlayerReady && loadedVideoIdRef.current !== videoId) {
      playerRef.current?.loadVideoById(videoId);
      loadedVideoIdRef.current = videoId;
    }
  }, [isPlayerReady, videoId]);

  const seekVideoToMinute = (minute: number) => {
    const player = playerRef.current;
    if (!player || !isPlayerReady) {
      return;
    }

    const targetTime = minute * 60;
    const duration = player.getDuration();
    player.seekTo(duration > 0 ? Math.min(targetTime, duration) : targetTime, true);
  };

  useEffect(() => {
    if (pathname === '/listening') {
      router.replace('/listening/part1/video1');
    }
  }, [pathname, router]);

  useEffect(() => {
    const dialog = saveDialogRef.current;
    if (!dialog) return;
    if (isSaveDialogOpen && !dialog.open) dialog.showModal();
    if (!isSaveDialogOpen && dialog.open) dialog.close();
  }, [isSaveDialogOpen]);

  const handleSelectAnswer = (qNumber: number, option: string) => {
    setAnswersByVideo((previous) => ({
      ...previous,
      [videoId]: {
        ...previous[videoId],
        [qNumber]: option,
      },
    }));
    setCheckedVideoIds((previous) => {
      const updated = new Set(previous);
      updated.delete(videoId);
      return updated;
    });
    setFeedback('');
  };

  const toggleFlag = (qNumber: number) => {
    setFlagsByVideo((previous) => ({
      ...previous,
      [videoId]: {
        ...previous[videoId],
        [qNumber]: !previous[videoId]?.[qNumber],
      },
    }));
  };

  const navigateToVideo = useCallback((part: PartId, video: number) => {
    router.push(`/listening/${part}/video${video}`, { scroll: false });
  }, [router]);

  useEffect(() => {
    const handleSectionSelect = (event: Event) => {
      const { skill, section } = (event as CustomEvent<{ skill: string; section: string }>).detail;
      if (skill === 'listening' && (section === 'part1' || section === 'part2' || section === 'part3')) {
        navigateToVideo(section, 1);
      }
    };

    window.addEventListener('vstep:select-section', handleSectionSelect);
    return () => window.removeEventListener('vstep:select-section', handleSectionSelect);
  }, [navigateToVideo]);

  const saveAnswers = () => {
    const enteredAnswerKey = answersByVideo[videoId] ?? {};
    if (Object.keys(enteredAnswerKey).length === 0) {
      setFeedback('Hãy chọn ít nhất một đáp án chuẩn trước khi lưu.');
      return false;
    }

    try {
      const updatedAnswerKeys: AnswerKeysByVideo = {
        ...answerKeysByVideo,
        [videoId]: {
          ...(answerKeysByVideo[videoId] ?? {}),
          ...enteredAnswerKey,
        },
      };
      localStorage.setItem(ANSWER_KEY_STORAGE_KEY_V2, JSON.stringify(updatedAnswerKeys));
      setAnswerKeysByVideo(updatedAnswerKeys);
      setAnswersByVideo((previous) => ({ ...previous, [videoId]: {} }));
      setCheckedVideoIds((previous) => {
        const updated = new Set(previous);
        updated.delete(videoId);
        return updated;
      });
      setStorageError('');
      setFeedback(`Đã lưu ${Object.keys(enteredAnswerKey).length} đáp án chuẩn cho ${partInfo.label} · Video ${selectedVideo}.`);
      setIsSaveDialogOpen(false);
      return true;
    } catch (error) {
      console.error('Could not save Listening answer keys.', error);
      setStorageError('Không thể lưu đáp án chuẩn. Hãy kiểm tra bộ nhớ trình duyệt.');
      return false;
    }
  };

  const handleSaveClick = () => {
    try {
      if (localStorage.getItem(SAVE_CONFIRMATION_STORAGE_KEY) === 'true') {
        saveAnswers();
        return;
      }
      setSkipSaveConfirmation(false);
      setIsSaveDialogOpen(true);
    } catch (error) {
      console.error('Could not read Listening save preferences.', error);
      setStorageError('Không thể đọc cài đặt lưu đáp án trong trình duyệt.');
    }
  };

  const confirmSave = () => {
    if (!saveAnswers() || !skipSaveConfirmation) return;

    try {
      localStorage.setItem(SAVE_CONFIRMATION_STORAGE_KEY, 'true');
    } catch (error) {
      console.error('Could not save the Listening confirmation preference.', error);
      setFeedback('Đã lưu đáp án, nhưng không thể lưu cài đặt bỏ qua xác nhận.');
    }
  };

  const handleCheckAnswers = () => {
    const comparableCount = questionNumbers.filter((number) => answerKey[number]).length;
    if (comparableCount === 0) {
      setFeedback(`Chưa có đáp án chuẩn cho Video ${selectedVideo}. Hãy chọn đáp án rồi bấm Lưu đáp án trước.`);
      return;
    }

    const correctCount = questionNumbers.filter((number) => (
      answers[number] && answerKey[number] && answers[number] === answerKey[number]
    )).length;
    const incorrectCount = questionNumbers.filter((number) => (
      answers[number] && answerKey[number] && answers[number] !== answerKey[number]
    )).length;
    const unansweredCount = questionNumbers.filter((number) => !answers[number]).length;
    const missingKeyCount = partInfo.count - comparableCount;
    const missingMessage = missingKeyCount > 0
      ? ` (Chưa có đáp án chuẩn cho ${missingKeyCount} câu)`
      : '';

    setCheckedVideoIds((previous) => new Set(previous).add(videoId));
    setFeedback(`Đúng: ${correctCount} · Sai: ${incorrectCount} · Chưa làm: ${unansweredCount}${missingMessage}`);
  };

  if (!isVideoRoute) {
    return (
      <div className="flex h-[30vh] min-h-[120px] items-center justify-center text-sm text-muted-foreground" role="status">
        Đang mở bài nghe…
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100dvh-5.5rem)] min-h-[420px] w-full flex-col overflow-hidden animate-fade-in lg:min-h-[580px]">
      <h1 className="sr-only">VSTEP Listening</h1>

      <main className="grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)] gap-2 lg:grid-cols-[minmax(0,7fr)_minmax(0,3fr)] lg:grid-rows-1 lg:gap-3">
        {/* Video Section */}
        <section
          className="order-1 flex min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-card lg:order-1"
          aria-labelledby="video-section-heading"
        >
          {/* Video Header */}
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border bg-[#245b86] px-2 py-1.5 text-white sm:px-3 lg:px-4 lg:py-2">
            <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
              <h2 id="video-section-heading" className="truncate text-xs font-extrabold sm:text-sm">
                {partInfo.label}
              </h2>
              <span className="text-[10px] font-bold text-white/80">
                ({selectedVideo}/{partVideos.length})
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => navigateToVideo(selectedPart, selectedVideo - 1)}
                disabled={selectedVideo <= 1}
                aria-label="Video trước"
                className="grid h-7 w-7 place-items-center rounded text-white/80 transition-colors hover:bg-white/15 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => videoDialogRef.current?.showModal()}
                aria-haspopup="dialog"
                className="flex h-7 items-center gap-1 rounded bg-white/15 px-2 text-[11px] font-extrabold text-white transition-colors hover:bg-white/25 cursor-pointer"
              >
                <Film className="h-3.5 w-3.5" />
                <span>Video {selectedVideo}</span>
              </button>
              <button
                type="button"
                onClick={() => navigateToVideo(selectedPart, selectedVideo + 1)}
                disabled={selectedVideo >= partVideos.length}
                aria-label="Video tiếp theo"
                className="grid h-7 w-7 place-items-center rounded text-white/80 transition-colors hover:bg-white/15 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* YouTube Video Player */}
          <div className="relative aspect-video w-full shrink-0 bg-black">
            <iframe
              ref={iframeRef}
              className="h-full w-full"
              src={`https://www.youtube.com/embed/${videoId}?rel=0&enablejsapi=1`}
              title={`${partInfo.label}, video ${selectedVideo}`}
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>

          {/* Compact Jump Minutes */}
          <div className="flex shrink-0 items-center justify-center gap-1 border-t border-border bg-muted/20 px-2 py-1 sm:gap-2 sm:py-1.5">
            <span className="hidden text-[10px] font-bold text-muted-foreground sm:inline">Tua nhanh:</span>
            {VIDEO_JUMP_MINUTES.map((minute) => (
              <button
                key={minute}
                type="button"
                onClick={() => seekVideoToMinute(minute)}
                disabled={!isPlayerReady}
                aria-label={`Tua đến phút thứ ${minute}`}
                className="h-6 min-w-8 rounded border border-border bg-card px-1.5 text-[10px] font-bold text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40 sm:h-7 sm:px-2.5 sm:text-xs"
              >
                <span className="sm:hidden">{minute}p</span>
                <span className="hidden sm:inline">{minute} phút</span>
              </button>
            ))}
          </div>

          {playerError && (
            <p role="status" className="px-2 py-1 text-center text-[10px] text-muted-foreground">
              Không tải được bộ điều khiển YouTube; nút tua không khả dụng.
            </p>
          )}

          {/* Filler note on Desktop */}
          <div className="hidden min-h-0 flex-1 flex-col items-center justify-center p-4 text-center text-xs text-muted-foreground lg:flex">
            <Headphones className="mb-2 h-8 w-8 text-primary/40" />
            <p className="font-semibold text-foreground/80">
              {partInfo.label}: {partInfo.count} câu hỏi (Câu {partInfo.start} - {partInfo.start + partInfo.count - 1})
            </p>
            <p className="mt-1 max-w-xs text-muted-foreground/80">
              Lắng nghe kỹ đoạn băng và chọn đáp án ở khung bên phải.
            </p>
          </div>
        </section>

        {/* Questions Section */}
        <section
          className="order-2 flex min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-card lg:order-2"
          aria-labelledby="answers-heading"
        >
          {/* Question Header with Title, Stats, and Actions */}
          <div className="flex shrink-0 items-center justify-between gap-1.5 border-b border-border bg-[#245b86] px-2 py-1.5 text-white sm:px-3 lg:px-4 lg:py-2">
            <div className="flex min-w-0 items-center gap-1.5 sm:gap-3">
              <h2 id="answers-heading" className="truncate text-xs font-extrabold lg:text-sm">
                <span className="sm:hidden">{partInfo.label}</span>
                <span className="hidden sm:inline">{partInfo.label} · Trắc nghiệm</span>
              </h2>
              <div className="flex items-center gap-1.5 text-[10px] font-semibold sm:gap-2.5 sm:text-xs">
                <span>
                  Làm: <strong className="text-white">{answeredCount}/{partInfo.count}</strong>
                </span>
                <span>
                  Dấu: <strong className="text-amber-300">{flaggedCount}</strong>
                </span>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
              <button
                type="button"
                onClick={handleSaveClick}
                aria-label={`Lưu đáp án ${partInfo.label} Video ${selectedVideo}`}
                title="Lưu đáp án chuẩn cho video này"
                className="grid h-7 w-7 place-items-center rounded bg-white/15 text-white transition-colors hover:bg-white/25 sm:w-auto sm:px-2 sm:gap-1 sm:inline-flex sm:items-center sm:text-[11px] sm:font-bold cursor-pointer"
              >
                <Save className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Lưu</span>
              </button>
              <button
                type="button"
                onClick={handleCheckAnswers}
                className="inline-flex h-7 items-center gap-1 rounded bg-white px-2 text-[10px] font-extrabold text-[#245b86] transition-colors hover:bg-blue-50 sm:px-2.5 sm:text-xs cursor-pointer shadow-sm"
              >
                <Check className="h-3.5 w-3.5 text-[#245b86]" />
                <span>Kiểm tra</span>
              </button>
            </div>
          </div>

          {/* Conditional Feedback Banner */}
          {(feedback || (isHydrated && storageError)) && (
            <div className="flex shrink-0 items-start justify-between gap-2 border-b border-border bg-muted/80 px-3 py-2 text-xs">
              <p
                className={`flex-1 text-xs leading-relaxed ${isHydrated && storageError ? 'font-medium text-red-600 dark:text-red-400' : 'text-foreground'}`}
                role={isHydrated && storageError ? 'alert' : 'status'}
              >
                {(isHydrated && storageError) || feedback}
              </p>
              <button
                type="button"
                onClick={() => {
                  setFeedback('');
                  setStorageError('');
                }}
                className="grid h-5 w-5 shrink-0 place-items-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground cursor-pointer"
                aria-label="Đóng thông báo"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Scrollable Questions List Grouped */}
          <div className="min-h-0 flex-1 overflow-y-auto p-2 pb-24 space-y-2 sm:p-2.5 sm:pb-28 lg:p-3 lg:pb-32">
            {questionGroups.map((group, groupIdx) => (
              <div
                key={groupIdx}
                className="overflow-hidden rounded-lg border border-border bg-card/70 shadow-xs"
              >
                <div className="flex items-center justify-between border-b border-border/80 bg-muted/60 px-2.5 py-1 text-xs font-bold text-foreground">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <span className="truncate">{group.title}</span>
                    <span className="shrink-0 text-[10px] font-medium text-muted-foreground">({group.subtitle})</span>
                  </div>
                  <span className="shrink-0 text-[10px] font-semibold text-muted-foreground">
                    {group.questions.filter((n) => answers[n]).length}/{group.questions.length}
                  </span>
                </div>
                <div className="p-1.5 space-y-1.5 sm:p-2 sm:space-y-2">
                  {group.questions.map((qNum) => {
                    const selectedOpt = answers[qNum];
                    const isFlagged = flags[qNum];

                    return (
                      <div
                        key={qNum}
                        className={`flex min-h-9 items-center gap-1.5 rounded-md border px-2 py-0.5 transition-colors sm:min-h-10 sm:gap-2 sm:px-2.5 ${selectedOpt ? 'border-primary/40 bg-primary/5' : 'border-border/80 bg-card'}`}
                      >
                        <span className="w-5 shrink-0 text-xs font-bold text-muted-foreground sm:w-6">{qNum}.</span>
                        <div className="grid flex-1 grid-cols-4 gap-1">
                          {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                            const isSelected = selectedOpt === opt;
                            const isCorrect = isChecked && answerKey[qNum] === opt;
                            const isWrongSelection = isChecked
                              && isSelected
                              && answerKey[qNum] !== undefined
                              && !isCorrect;

                            return (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => handleSelectAnswer(qNum, opt)}
                                aria-pressed={isSelected}
                                aria-label={`Câu ${qNum}, đáp án ${opt}`}
                                className={`h-6.5 rounded text-xs font-bold transition-colors cursor-pointer sm:h-7.5 ${
                                  isCorrect
                                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                    : isWrongSelection
                                      ? 'bg-red-600 text-white hover:bg-red-700'
                                      : isSelected
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted text-muted-foreground hover:bg-primary/10 hover:text-foreground'
                                }`}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleFlag(qNum)}
                          aria-label={isFlagged ? `Bỏ đánh dấu câu ${qNum}` : `Đánh dấu câu ${qNum} để xem lại`}
                          aria-pressed={Boolean(isFlagged)}
                          className={`grid h-6.5 w-6.5 shrink-0 place-items-center rounded transition-colors cursor-pointer sm:h-7.5 sm:w-7.5 ${isFlagged ? 'text-amber-500' : 'text-muted-foreground/40 hover:text-amber-500'}`}
                          title="Đánh dấu xem lại"
                        >
                          <Flag className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Bottom spacer */}
            <div className="h-20 sm:h-24 lg:h-28 shrink-0" aria-hidden="true" />
          </div>
        </section>
      </main>

      {/* Video Selection Dialog */}
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
            type="button"
            onClick={() => videoDialogRef.current?.close()}
            aria-label="Đóng danh sách video"
            className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground cursor-pointer"
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
                type="button"
                onClick={() => {
                  navigateToVideo(selectedPart, videoNumber);
                  videoDialogRef.current?.close();
                }}
                aria-pressed={isSelected}
                className={`min-h-10 rounded-lg border px-2 text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-foreground hover:border-primary/40 hover:bg-primary/5'}`}
              >
                Video {videoNumber}
              </button>
            );
          })}
        </div>
      </dialog>

      {/* Save Answer Key Dialog */}
      <dialog
        ref={saveDialogRef}
        aria-labelledby="save-answers-heading"
        onCancel={(event) => {
          event.preventDefault();
          setIsSaveDialogOpen(false);
        }}
        className="m-auto w-[min(92vw,24rem)] max-w-none rounded-xl border border-border bg-card p-0 text-foreground shadow-2xl backdrop:bg-black/60"
      >
        <div className="space-y-4 p-5">
          <div>
            <h2 id="save-answers-heading" className="font-extrabold">Lưu đáp án chuẩn {partInfo.label} · Video {selectedVideo}?</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Các lựa chọn hiện tại sẽ được lưu làm đáp án chuẩn cho video này để đối chiếu khi làm bài. Sau khi lưu, màn hình sẽ được xóa lựa chọn để bạn bắt đầu nghe và làm bài.
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={skipSaveConfirmation}
              onChange={(event) => setSkipSaveConfirmation(event.target.checked)}
              className="h-4 w-4 accent-primary"
            />
            Không hỏi lại lần sau
          </label>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsSaveDialogOpen(false)}
              className="h-9 rounded-md border border-border px-3 text-sm font-semibold text-foreground hover:bg-muted"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={confirmSave}
              className="h-9 rounded-md bg-primary px-3 text-sm font-bold text-primary-foreground hover:bg-primary/90"
            >
              Lưu đáp án chuẩn
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}
