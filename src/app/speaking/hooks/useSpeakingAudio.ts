'use client';

import { useEffect, useRef, useState } from 'react';
import type { RecorderStatus } from '../types';

export function useSpeakingAudio() {
  const [recorderStatus, setRecorderStatus] = useState<RecorderStatus>('idle');
  const [recorderError, setRecorderError] = useState('');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [waveformLevels, setWaveformLevels] = useState<number[]>(Array(24).fill(0.08));

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const visualizerContextRef = useRef<AudioContext | null>(null);
  const visualizerFrameRef = useRef<number | null>(null);
  const recordingRequestRef = useRef(0);
  const pendingRequestRef = useRef(false);

  const stopVisualizer = () => {
    if (visualizerFrameRef.current !== null) cancelAnimationFrame(visualizerFrameRef.current);
    visualizerFrameRef.current = null;
    if (visualizerContextRef.current) void visualizerContextRef.current.close();
    visualizerContextRef.current = null;
    setWaveformLevels(Array(24).fill(0.08));
  };

  const startVisualizer = (stream: MediaStream) => {
    if (typeof window === 'undefined' || !window.AudioContext) return;

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

  const startRecording = async (): Promise<boolean> => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
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

  useEffect(() => () => {
    recordingRequestRef.current += 1;
    stopVisualizer();
    if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
  }, []);

  return {
    recorderStatus,
    recorderError,
    audioUrl,
    waveformLevels,
    audioRef,
    startRecording,
    stopMedia,
  };
}

