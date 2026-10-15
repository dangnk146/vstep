'use client';

import { useEffect, useRef, useState } from 'react';
import {
  DEFAULT_SETTINGS,
  STORAGE_KEYS,
  type SettingKey,
  type SpeakingPart,
  type TimerPhase,
} from '../types';

export function useSpeakingTimer() {
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

  const preparationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const speakingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Restore settings from localStorage on mount
  useEffect(() => {
    const restored = { ...DEFAULT_SETTINGS };
    (Object.keys(STORAGE_KEYS) as SettingKey[]).forEach((key) => {
      const value = localStorage.getItem(STORAGE_KEYS[key]);
      if (value !== null && /^\d+$/.test(value)) restored[key] = value;
    });
    if (restored.part2 === '120') restored.part2 = '180';

    setSettings(restored);
    setRemainingTimes({
      part1: Number(restored.part1),
      part2: Number(restored.part2),
      part3: Number(restored.part3),
    });
    setSettingsLoaded(true);
  }, []);

  // Save settings on update
  useEffect(() => {
    if (!settingsLoaded) return;
    (Object.keys(STORAGE_KEYS) as SettingKey[]).forEach((key) => {
      localStorage.setItem(STORAGE_KEYS[key], settings[key]);
    });
  }, [settings, settingsLoaded]);

  // Clean intervals on unmount
  useEffect(() => () => {
    if (preparationIntervalRef.current) clearInterval(preparationIntervalRef.current);
    if (speakingIntervalRef.current) clearInterval(speakingIntervalRef.current);
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

  const runSpeakingTimer = (
    part: SpeakingPart,
    duration: number,
    onComplete: () => void,
  ) => {
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
        onComplete();
      }
    }, 1000);
  };

  const startPreparationCountdown = (
    part: SpeakingPart,
    prepDuration: number,
    onPrepComplete: () => void,
  ) => {
    setPreparationRemaining(prepDuration);
    setTimerPhase('preparing');
    let timeLeft = prepDuration;
    preparationIntervalRef.current = setInterval(() => {
      timeLeft -= 1;
      setPreparationRemaining(Math.max(timeLeft, 0));
      if (timeLeft <= 0) {
        if (preparationIntervalRef.current) clearInterval(preparationIntervalRef.current);
        preparationIntervalRef.current = null;
        onPrepComplete();
      }
    }, 1000);
  };

  return {
    settings,
    settingsLoaded,
    remainingTimes,
    preparationRemaining,
    timerPhase,
    runningPart,
    getSeconds,
    updateSetting,
    clearTimers,
    runSpeakingTimer,
    startPreparationCountdown,
    setRunningPart,
    setTimerPhase,
    setPreparationRemaining,
    setRemainingTimes,
  };
}

