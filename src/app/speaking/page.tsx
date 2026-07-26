'use client';

import React, { useState, useEffect, useRef } from 'react';
import { diffChars, DiffToken } from '@/utils/diff';
import { 
  Mic, 
  Square, 
  Play, 
  Pause, 
  RotateCcw, 
  Check, 
  RefreshCw, 
  Info,
  Clock,
  Volume2,
  Award,
  AlertCircle,
  Download,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';

type SpeakingPart = 'part1' | 'part2' | 'part3';

interface VstepSpeakingConfig {
  title: string;
  prepTime: number; // in seconds
  speakingTime: number; // in seconds
  prompt: string;
  guide: string;
}

const SPEAKING_CONFIG: Record<SpeakingPart, VstepSpeakingConfig> = {
  part1: {
    title: 'Part 1: Tương Tác Xã Hội (Social Interaction)',
    prepTime: 0,
    speakingTime: 180,
    prompt: `Topic 1: Hobbies\n- What do you like doing in your free time? Why?\n- Do you prefer spending your free time alone or with friends?\n\nTopic 2: Travel\n- Where do you want to travel in the future?\n- Do you prefer traveling alone or in a group?`,
    guide: 'Trả lời nhanh, trôi chảy các câu hỏi về bản thân. Cố gắng phát triển ý từ 2-3 câu cho mỗi câu hỏi.'
  },
  part2: {
    title: 'Part 2: Thảo Luận Giải Pháp (Solution Discussion)',
    prepTime: 60,
    speakingTime: 120,
    prompt: `Situation: A group of friends wants to celebrate a birthday. There are three options:\n1. Dining at a fancy restaurant\n2. Having a barbecue in the park\n3. Holding a house party\n\nWhich option do you think is the best choice? Explain your decision.`,
    guide: 'Nêu rõ lựa chọn của bạn, giải thích lý do tại sao chọn phương án đó và đưa ra điểm hạn chế của 2 phương án còn lại.'
  },
  part3: {
    title: 'Part 3: Phát Triển Chủ Đề (Topic Development)',
    prepTime: 60,
    speakingTime: 180,
    prompt: `Topic: Online learning has become highly popular in modern education.\n- Flexibility & Convenience\n- Cost-effectiveness\n- Self-paced learning\n\n(You can add your own ideas to develop the topic further)`,
    guide: 'Phát biểu có cấu trúc rõ ràng: Mở bài (nêu chủ đề), Thân bài (nêu 3 ý chính và ví dụ dẫn chứng), Kết bài (tóm tắt ý kiến).'
  }
};

export default function SpeakingPage() {
  const [activePart, setActivePart] = useState<SpeakingPart>('part1');

  // Templates & Notes
  const [template1, setTemplate1] = useState('');
  const [template2, setTemplate2] = useState('');
  const [template3, setTemplate3] = useState('');
  const [notes1, setNotes1] = useState('');
  const [notes2, setNotes2] = useState('');
  const [notes3, setNotes3] = useState('');

  // Diff results
  const [diffResult1, setDiffResult1] = useState<DiffToken[] | null>(null);
  const [diffResult2, setDiffResult2] = useState<DiffToken[] | null>(null);
  const [diffResult3, setDiffResult3] = useState<DiffToken[] | null>(null);

  const activeTemplate = activePart === 'part1' ? template1 : activePart === 'part2' ? template2 : template3;
  const activeNotes = activePart === 'part1' ? notes1 : activePart === 'part2' ? notes2 : notes3;
  const setActiveNotes = activePart === 'part1' ? setNotes1 : activePart === 'part2' ? setNotes2 : setNotes3;
  const activeDiffResult = activePart === 'part1' ? diffResult1 : activePart === 'part2' ? diffResult2 : diffResult3;
  const setActiveDiffResult = activePart === 'part1' ? setDiffResult1 : activePart === 'part2' ? setDiffResult2 : setDiffResult3;

  const config = SPEAKING_CONFIG[activePart];

  // Timers
  const [prepTime, setPrepTime] = useState(config.prepTime);
  const [speakingTime, setSpeakingTime] = useState(config.speakingTime);
  const [isPrepping, setIsPrepping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  // Recorder states
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const prepTimerRef = useRef<NodeJS.Timeout | null>(null);
  const speakingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const notesTextareaRef = useRef<HTMLTextAreaElement>(null);
  const notesGutterRef = useRef<HTMLDivElement>(null);

  const handleNotesScroll = () => {
    if (notesTextareaRef.current && notesGutterRef.current) {
      notesGutterRef.current.scrollTop = notesTextareaRef.current.scrollTop;
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

  // Load templates from LocalStorage
  useEffect(() => {
    setTemplate1(localStorage.getItem('vstep_speaking_part1_template') || '');
    setTemplate2(localStorage.getItem('vstep_speaking_part2_template') || '');
    setTemplate3(localStorage.getItem('vstep_speaking_part3_template') || '');
  }, [activePart]);

  // Update timers on Part change
  useEffect(() => {
    resetPractice();
    setPrepTime(SPEAKING_CONFIG[activePart].prepTime);
    setSpeakingTime(SPEAKING_CONFIG[activePart].speakingTime);
  }, [activePart]);

  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, []);

  const clearAllTimers = () => {
    if (prepTimerRef.current) clearInterval(prepTimerRef.current);
    if (speakingTimerRef.current) clearInterval(speakingTimerRef.current);
  };

  const resetPractice = () => {
    clearAllTimers();
    setIsPrepping(false);
    setIsRecording(false);
    setPrepTime(config.prepTime);
    setSpeakingTime(config.speakingTime);
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setAudioUrl(null);
  };

  const handleStartPractice = () => {
    resetPractice();
    if (config.prepTime > 0) {
      setIsPrepping(true);
      setPrepTime(config.prepTime);
      prepTimerRef.current = setInterval(() => {
        setPrepTime(prev => {
          if (prev <= 1) {
            if (prepTimerRef.current) clearInterval(prepTimerRef.current);
            setIsPrepping(false);
            handleStartRecording();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      handleStartRecording();
    }
  };

  const handleSkipPrep = () => {
    if (prepTimerRef.current) clearInterval(prepTimerRef.current);
    setIsPrepping(false);
    handleStartRecording();
  };

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        stream.getTracks().forEach(track => track.stop());
      };

      setAudioChunks(chunks);
      setMediaRecorder(recorder);
      recorder.start();
      setIsRecording(true);
      setSpeakingTime(config.speakingTime);

      speakingTimerRef.current = setInterval(() => {
        setSpeakingTime(prev => {
          if (prev <= 1) {
            if (speakingTimerRef.current) clearInterval(speakingTimerRef.current);
            recorder.stop();
            setIsRecording(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      console.error('Lỗi truy cập micro:', err);
      alert('Không thể sử dụng micro. Hãy cấp quyền truy cập microphone cho trang web này!');
    }
  };

  const handleStopRecording = () => {
    if (speakingTimerRef.current) clearInterval(speakingTimerRef.current);
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    setIsRecording(false);
  };

  const handleCheckDiff = () => {
    if (!activeTemplate.trim()) {
      alert('Vui lòng nhập mẫu nói trước ở trang Cài đặt mẫu nói!');
      return;
    }
    const diffs = diffChars(activeTemplate, activeNotes);
    setActiveDiffResult(diffs);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getWordCount = (text: string) => {
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  };

  return (
    <div className="flex flex-col space-y-6 h-full w-full">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border border-border p-6 rounded-2xl shadow-sm">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-primary/10 rounded-xl text-primary">
            <Mic className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight">VSTEP Speaking Prep</h1>
            <p className="text-muted-foreground text-sm font-medium">Luyện nói theo thời gian chuẩn VSTEP, ghi âm giọng nói</p>
          </div>
        </div>

        {/* Part Tabs */}
        <div className="flex bg-muted p-1 rounded-xl border border-border">
          {(['part1', 'part2', 'part3'] as SpeakingPart[]).map((p) => (
            <button
              key={p}
              onClick={() => setActivePart(p)}
              className={`px-4 py-2 text-sm font-bold rounded-lg transition-all cursor-pointer ${
                activePart === p ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Part {p === 'part1' ? '1' : p === 'part2' ? '2' : '3'}
            </button>
          ))}
        </div>
      </div>

      {/* Warning if no template */}
      {!activeTemplate.trim() && (
        <div className="flex items-center gap-3 p-4 bg-amber-500/10 border border-amber-500/20 text-amber-650 dark:text-amber-500 rounded-xl text-sm font-semibold">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <div className="flex-1">
            <span>Bạn chưa cấu hình mẫu nói cho <strong>{activePart === 'part1' ? 'Part 1' : activePart === 'part2' ? 'Part 2' : 'Part 3'}</strong>. Hãy tạo cấu hình mẫu nói để đối chiếu kết quả nháp!</span>
          </div>
          <Link href="/speaking/settings" className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer">
            Cài Đặt Mẫu
          </Link>
        </div>
      )}

      {/* Main Grid */}
      <div className="flex flex-col space-y-6">
        {/* Left: Prompt Situation */}
        <div className="flex flex-col space-y-4">
          <div className="bg-card border border-border p-5 rounded-2xl space-y-3 shadow-sm h-full">
            <h2 className="font-extrabold text-base border-b border-border pb-2.5 text-foreground">
              {config.title}
            </h2>
            <div className="text-xs text-primary font-bold bg-primary/10 px-3 py-1.5 rounded-lg w-max flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              <span>Chuẩn VSTEP: Chuẩn bị {config.prepTime > 0 ? `${config.prepTime}s` : '0s'} | Nói {config.speakingTime / 60} phút</span>
            </div>
            
            <div className="bg-muted/40 p-4 rounded-xl border border-border text-sm whitespace-pre-wrap font-sans text-muted-foreground leading-relaxed">
              {config.prompt}
            </div>

            <div className="flex items-start gap-2 text-xs text-muted-foreground bg-blue-500/5 p-3 rounded-lg border border-blue-500/10">
              <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
              <span><strong>Mẹo:</strong> {config.guide}</span>
            </div>
          </div>
        </div>

        {/* Right: Recorder & Draft Notes Outline */}
        <div className="flex flex-col space-y-5">
          {/* Voice Recorder */}
          <div className="bg-card border border-border p-6 rounded-2xl flex flex-col space-y-4 shadow-sm">
            <h2 className="font-bold text-base border-b border-border pb-2.5">
              Phòng Luyện Nói VSTEP
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div className={`p-[1.5px] rounded-xl transition-all duration-300 ${
                isPrepping ? 'animate-gradient-flow shadow-md scale-105' : 'bg-border'
              }`}>
                <div className={`p-4 rounded-[10px] flex flex-col items-center justify-center space-y-1 bg-card ${
                  isPrepping ? 'text-amber-500' : 'text-muted-foreground'
                }`}>
                  <span className="text-[10px] uppercase font-bold tracking-wider font-semibold">Thời gian chuẩn bị</span>
                  <span className="font-mono text-2xl font-black">{formatTime(prepTime)}</span>
                </div>
              </div>

              <div className={`p-[1.5px] rounded-xl transition-all duration-300 ${
                isRecording ? 'animate-gradient-flow shadow-md scale-105' : 'bg-border'
              }`}>
                <div className={`p-4 rounded-[10px] flex flex-col items-center justify-center space-y-1 bg-card ${
                  isRecording ? 'text-red-500' : 'text-muted-foreground'
                }`}>
                  <span className="text-[10px] uppercase font-bold tracking-wider font-semibold">Thời gian nói</span>
                  <span className="font-mono text-2xl font-black">{formatTime(speakingTime)}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              {!isPrepping && !isRecording ? (
                <button
                  onClick={handleStartPractice}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/95 font-bold transition-all shadow-md shadow-primary/20 hover:scale-105 active:scale-95 duration-200 cursor-pointer text-sm"
                >
                  <Play className="h-4.5 w-4.5 fill-current" />
                  <span>Bắt Đầu Luyện Nói</span>
                </button>
              ) : (
                <>
                  {isPrepping && (
                    <button
                      onClick={handleSkipPrep}
                      className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-amber-500 text-white hover:bg-amber-600 font-bold transition-all cursor-pointer text-sm"
                    >
                      <ArrowRight className="h-4 w-4" />
                      <span>Nói Ngay (Skip Prep)</span>
                    </button>
                  )}
                  {isRecording && (
                    <button
                      onClick={handleStopRecording}
                      className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-red-500 text-white hover:bg-red-600 font-bold transition-all cursor-pointer text-sm animate-pulse"
                    >
                      <Square className="h-4 w-4 fill-current" />
                      <span>Kết Thúc Sớm</span>
                    </button>
                  )}
                </>
              )}

              <button
                onClick={resetPractice}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-border hover:bg-muted text-muted-foreground hover:text-foreground font-bold transition-all cursor-pointer text-xs"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Đặt lại</span>
              </button>
            </div>

            {isPrepping && (
              <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-xl text-xs justify-center">
                <AlertCircle className="h-4 w-4 animate-spin" />
                <span>Đang đếm ngược thời gian chuẩn bị ý tưởng...</span>
              </div>
            )}
            {isRecording && (
              <div className="flex flex-col items-center justify-center p-4 bg-red-500/5 border border-red-500/20 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-red-500 text-xs justify-center animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-red-500 inline-block animate-ping mr-1" />
                  <span><strong>ĐANG GHI ÂM...</strong> Nói vào microphone của bạn. Tự động dừng khi hết giờ.</span>
                </div>
                
                <div className="flex items-end justify-center gap-1.5 h-8">
                  <span className="w-1 bg-red-500 rounded-full animate-soundwave-1" />
                  <span className="w-1 bg-red-500 rounded-full animate-soundwave-2" />
                  <span className="w-1 bg-red-500 rounded-full animate-soundwave-3" />
                  <span className="w-1 bg-red-500 rounded-full animate-soundwave-4" />
                  <span className="w-1 bg-red-500 rounded-full animate-soundwave-5" />
                </div>
              </div>
            )}

            {audioUrl && (
              <div className="p-4 bg-muted/40 border border-border rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 text-xs text-foreground font-semibold">
                  <Volume2 className="h-4.5 w-4.5 text-primary" />
                  <span>Bài nói đã ghi âm:</span>
                </div>
                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <audio src={audioUrl} controls className="h-9 w-full sm:w-48" />
                  <a 
                    href={audioUrl} 
                    download={`vstep-speaking-${activePart}.webm`}
                    className="p-2 rounded-lg bg-card border border-border text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                    title="Tải bài nói xuống"
                  >
                    <Download className="h-4 w-4" />
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Outline / Note draft */}
          <div className="bg-card border border-border p-6 rounded-2xl flex flex-col space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <h2 className="font-bold text-sm">
                Nháp nhanh dàn ý chuẩn bị nói
              </h2>
              <div className="text-xs text-muted-foreground font-semibold">
                Từ nháp: <strong className="text-primary">{getWordCount(activeNotes)} từ</strong>
              </div>
            </div>
            
            <div className={`relative p-[2px] rounded-2xl transition-all duration-300 ${
              isPrepping || isRecording ? 'animate-gradient-flow shadow-lg shadow-primary/10 scale-[1.002]' : 'bg-border'
            }`}>
              <div className="flex bg-card rounded-[14px] overflow-hidden text-sm font-mono h-[350px]">
                {/* VS Code style Gutter */}
                <div 
                  ref={notesGutterRef}
                  className="w-10 bg-muted/30 border-r border-border text-muted-foreground select-none text-right pr-2 py-4 overflow-hidden leading-[22px] shrink-0"
                >
                  {Array.from({ length: Math.max(1, activeNotes.split('\n').length) }).map((_, i) => (
                    <div key={i} className="h-[22px]">{i + 1}</div>
                  ))}
                </div>
                {/* Textarea */}
                <textarea
                  ref={notesTextareaRef}
                  onScroll={handleNotesScroll}
                  value={activeNotes}
                  onChange={(e) => setActiveNotes(e.target.value)}
                  placeholder="Nháp nhanh dàn ý bài nói tại đây để luyện phản xạ nói..."
                  className="flex-1 p-4 bg-transparent focus:outline-none text-foreground leading-[22px] resize-none h-full overflow-y-auto"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setActiveNotes('');
                  setActiveDiffResult(null);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border hover:bg-muted text-xs font-bold transition-all cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Xóa nháp</span>
              </button>

              <button
                onClick={handleCheckDiff}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-bold transition-all cursor-pointer shadow-md shadow-primary/20 hover:scale-105 active:scale-95 duration-200"
              >
                <Check className="h-3.5 w-3.5" />
                <span>Đo Đối Chiếu Template</span>
              </button>
            </div>

            {/* Compare Result */}
            {activeDiffResult && (
              <div className="pt-3 border-t border-border mt-3 space-y-3">
                <div className="flex items-center gap-2">
                  <Award className="h-4.5 w-4.5 text-primary" />
                  <h3 className="text-xs font-bold text-foreground">Đối chiếu nháp với cấu hình mẫu nói:</h3>
                </div>
                
                <div className="p-4 bg-muted/40 border border-border rounded-xl max-h-[200px] overflow-y-auto font-mono text-[12px] leading-[22px] flex flex-col space-y-0.5">
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
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
