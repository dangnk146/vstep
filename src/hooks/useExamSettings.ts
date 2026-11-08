'use client';

import { useSyncExternalStore } from 'react';
import {
  subscribeToExamApiSettings,
  getExamApiSettingsSnapshot,
  getServerExamApiSettingsSnapshot,
  parseExamApiSettingsSnapshot,
  type ExamApiSettings,
} from '@/lib/examApi';

export function useExamSettings(): ExamApiSettings {
  const snapshot = useSyncExternalStore(
    subscribeToExamApiSettings,
    getExamApiSettingsSnapshot,
    getServerExamApiSettingsSnapshot
  );
  return parseExamApiSettingsSnapshot(snapshot);
}

