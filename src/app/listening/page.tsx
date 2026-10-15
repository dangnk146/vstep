'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Headphones, 
  Flag, 
  CheckCircle,
  Check,
  ChevronLeft,
  ChevronRight,
  Film,
  Save,
  X,
} from 'lucide-react';
import videoData from './listvideo.json';

const YOUTUBE_IFRAME_API_URL = 'https://www.youtube.com/iframe_api';
const VIDEO_JUMP_MINUTES = [2, 3, 4, 5, 6] as const;
const PARTS = [
  { id: 'part1', label: 'Part 1', start: 1, count: 8 },
  { id: 'part2', label: 'Part 2', start: 9, count: 12 },
  { id: 'part3', label: 'Part 3', start: 21, count: 15 },
] as const;
type PartId = (typeof PARTS)[number]['id'];
type AnswersByPart = Partial<Record<PartId, Record<number, string>>>;

const ANSWER_KEY_STORAGE_KEY = 'vstep_listening_answer_keys_v1';
const SAVE_CONFIRMATION_STORAGE_KEY = 'vstep_listening_skip_save_confirmation';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function loadListeningAnswerKeys(): { answerKeys: AnswersByPart; error: string } {
  if (typeof window === 'undefined') return { answerKeys: {}, error: '' };

  try {
    const savedAnswerKeys = localStorage.getItem(ANSWER_KEY_STORAGE_KEY);
    if (!savedAnswerKeys) return { answerKeys: {}, error: '' };

    const parsed: unknown = JSON.parse(savedAnswerKeys);
    if (!isRecord(parsed)) {
      throw new Error('Saved Listening answer keys have an invalid format.');
    }

    const restoredAnswerKeys: AnswersByPart = {};
    for (const part of PARTS) {
      const partAnswerKeys = parsed[part.id];
      if (partAnswerKeys === undefined) continue;
      if (!isRecord(partAnswerKeys)) {
        throw new Error(`Saved answer key for ${part.label} has an invalid format.`);
      }

      const validAnswerKeys: Record<number, string> = {};
      for (const [questionNumber, answer] of Object.entries(partAnswerKeys)) {
        const number = Number(questionNumber);
        const isValidQuestion = Number.isInteger(number)
          && number >= part.start
          && number < part.start + part.count;
        if (!isValidQuestion || typeof answer !== 'string' || !['A', 'B', 'C', 'D'].includes(answer)) {
          throw new Error(`Saved answer key for ${part.label}, question ${questionNumber} is invalid.`);
        }
        validAnswerKeys[number] = answer;
      }
      restoredAnswerKeys[part.id] = validAnswerKeys;
    }
    return { answerKeys: restoredAnswerKeys, error: '' };
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
  const [answersByPart, setAnswersByPart] = useState<AnswersByPart>({});
  const [answerKeysByPart, setAnswerKeysByPart] = useState<AnswersByPart>(initialSavedAnswerKeys.answerKeys);
  const [checkedPartId, setCheckedPartId] = useState<PartId | null>(null);
  const [flags, setFlags] = useState<Record<number, boolean>>({});
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [skipSaveConfirmation, setSkipSaveConfirmation] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [storageError, setStorageError] = useState(initialSavedAnswerKeys.error);
  const videoDialogRef = useRef<HTMLDialogElement>(null);
  const saveDialogRef = useRef<HTMLDialogElement>(null);
  const examRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const playerRef = useRef<YouTubePlayer | null>(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [playerError, setPlayerError] = useState(false);
  const routeMatch = pathname.match(/^\/listening\/(part[123])\/video(\d+)$/);
  const selectedPart = (routeMatch?.[1] ?? 'part1') as PartId;
  const selectedVideo = Number(routeMatch?.[2] ?? 1);
  const partInfo = PARTS.find((item) => item.id === selectedPart)!;
  const partVideos = videoData[selectedPart];
  const videoId = partVideos[selectedVideo - 1];
  const loadedVideoIdRef = useRef(videoId);
  const questionNumbers = Array.from(
    { length: partInfo.count },
    (_, index) => partInfo.start + index,
  );
  const answers = answersByPart[selectedPart] ?? {};
  const answerKey = isHydrated ? answerKeysByPart[selectedPart] ?? {} : {};

  useEffect(() => {
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
  }, []);

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

  useEffect(() => {
    if (!pathname.match(/^\/listening\/part[123]\/video\d+$/)) {
      return;
    }

    requestAnimationFrame(() => {
      examRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, [pathname]);

  const handleSelectAnswer = (qNumber: number, option: string) => {
    setAnswersByPart((previous) => ({
      ...previous,
      [selectedPart]: {
        ...previous[selectedPart],
        [qNumber]: option,
      },
    }));
    setCheckedPartId(null);
    setFeedback('');
  };

  const toggleFlag = (qNumber: number) => {
    setFlags(prev => ({ ...prev, [qNumber]: !prev[qNumber] }));
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

  const answeredCount = questionNumbers.filter((number) => answers[number]).length;
  const flaggedCount = questionNumbers.filter((number) => flags[number]).length;

  const saveAnswers = () => {
    const enteredAnswerKey = answersByPart[selectedPart] ?? {};
    if (Object.keys(enteredAnswerKey).length === 0) {
      setFeedback('Hãy nhập ít nhất một đáp án chuẩn trước khi lưu.');
      return false;
    }

    try {
      const updatedAnswerKeys: AnswersByPart = {
        ...answerKeysByPart,
        [selectedPart]: {
          ...answerKeysByPart[selectedPart],
          ...enteredAnswerKey,
        },
      };
      localStorage.setItem(ANSWER_KEY_STORAGE_KEY, JSON.stringify(updatedAnswerKeys));
      setAnswerKeysByPart(updatedAnswerKeys);
      setAnswersByPart((previous) => ({ ...previous, [selectedPart]: {} }));
      setCheckedPartId(null);
      setStorageError('');
      setFeedback(`Đã lưu ${Object.keys(enteredAnswerKey).length} đáp án chuẩn cho ${partInfo.label}. Các lựa chọn đã được xóa để bạn làm bài.`);
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

  return (
    <div className="flex flex-col space-y-6 w-full animate-fade-in pb-10">
      <header className="border-b border-border pb-5">
        <div className="flex items-center gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <Headphones className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-foreground">VSTEP Listening</h1>
            <p className="mt-1 text-sm text-muted-foreground">Nghe playlist và chọn đáp án cho 35 câu hỏi</p>
          </div>
        </div>
      </header>

      <div ref={examRef} className="grid scroll-mt-0 grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(24rem,3fr)_minmax(0,7fr)]">
        <section className="order-2 flex min-w-0 flex-col rounded-xl border border-border bg-card p-4 sm:p-5 lg:order-1" aria-labelledby="answers-heading">
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

          <div className="grid content-start grid-cols-1 gap-2 py-3">
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
                    {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                      const isSelected = selectedOpt === opt;
                      const isCorrect = checkedPartId === selectedPart && answerKey[qNum] === opt;
                      const isWrongSelection = checkedPartId === selectedPart
                        && isSelected
                        && answerKey[qNum] !== undefined
                        && !isCorrect;

                      return (
                        <button
                          key={opt}
                          onClick={() => handleSelectAnswer(qNum, opt)}
                          aria-pressed={isSelected}
                          aria-label={`Câu ${qNum}, đáp án ${opt}`}
                          className={`h-8 rounded-md text-xs font-bold transition-colors cursor-pointer ${
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

          <div className="mt-auto border-t border-border pt-3">
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleSaveClick}
                aria-label={`Lưu đáp án ${partInfo.label}`}
                title="Lưu đáp án"
                className="grid h-8 w-8 place-items-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Save className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  const comparableCount = questionNumbers.filter((number) => answerKey[number]).length;
                  if (comparableCount === 0) {
                    setFeedback(`Chưa có đáp án chuẩn cho ${partInfo.label}. Nhập đáp án chuẩn rồi bấm Lưu trước.`);
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
                    ? ` Chưa có đáp án chuẩn cho ${missingKeyCount} câu.`
                    : '';

                  setCheckedPartId(selectedPart);
                  setFeedback(`Đúng: ${correctCount} · Sai: ${incorrectCount} · Chưa làm: ${unansweredCount}.${missingMessage}`);
                }}
                className="inline-flex h-8 items-center gap-1 rounded-md bg-primary px-2.5 text-[11px] font-bold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <Check className="h-4 w-4" />
                Kiểm tra đáp án
              </button>
            </div>
            {(feedback || (isHydrated && storageError)) && (
              <p className={`mt-2 text-right text-xs ${isHydrated && storageError ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'}`} role={isHydrated && storageError ? 'alert' : 'status'}>
                {(isHydrated && storageError) || feedback}
              </p>
            )}
          </div>
        </section>

        <section className="order-1 -mx-3 w-[calc(100%+1.5rem)] min-w-0 overflow-hidden border-y border-border bg-card sm:mx-0 sm:w-auto sm:rounded-xl sm:border lg:order-2" aria-labelledby="playlist-heading">
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
          <div className="grid grid-cols-3 gap-2 border-t border-border px-3 py-3 sm:grid-cols-5">
            {VIDEO_JUMP_MINUTES.map((minute) => {
              return (
                <button
                  key={minute}
                  type="button"
                  onClick={() => seekVideoToMinute(minute)}
                  disabled={!isPlayerReady}
                  aria-label={`Tua đến phút thứ ${minute}`}
                  className={`flex min-h-9 w-full items-center justify-center rounded-md border border-border bg-card px-3 text-xs font-semibold text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50 ${minute === 4 || minute === 5 ? 'hidden sm:flex' : ''}`}
                >
                  {minute} phút
                </button>
              );
            })}
          </div>
          {playerError && (
            <p role="status" className="px-4 pb-2 text-xs text-muted-foreground">
              Không tải được bộ điều khiển YouTube; video vẫn có thể xem nhưng nút tua không khả dụng.
            </p>
          )}
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
            <h2 id="save-answers-heading" className="font-extrabold">Lưu đáp án chuẩn {partInfo.label}?</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Các lựa chọn hiện tại sẽ được lưu trên trình duyệt làm đáp án chuẩn để đối chiếu. Sau khi lưu, màn hình sẽ được xóa lựa chọn để bạn làm bài.
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
