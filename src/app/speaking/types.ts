export type SpeakingPart = 'part1' | 'part2' | 'part3';
export type TimerPhase = 'idle' | 'preparing' | 'speaking' | 'complete';
export type RecorderStatus = 'idle' | 'requesting' | 'recording' | 'ready';
export type SettingKey = 'prep' | SpeakingPart;

export const PARTS: { id: SpeakingPart; title: string; defaultSeconds: number }[] = [
  { id: 'part1', title: 'Part 1: Tương tác xã hội', defaultSeconds: 180 },
  { id: 'part2', title: 'Part 2: Thảo luận giải pháp', defaultSeconds: 180 },
  { id: 'part3', title: 'Part 3: Phát triển chủ đề', defaultSeconds: 180 },
];

export const DEFAULT_SETTINGS: Record<SettingKey, string> = {
  prep: '15',
  part1: '180',
  part2: '180',
  part3: '180',
};

export const STORAGE_KEYS: Record<SettingKey, string> = {
  prep: 'vstep_prep_seconds',
  part1: 'vstep_part1_seconds',
  part2: 'vstep_part2_seconds',
  part3: 'vstep_part3_seconds',
};

export const CUSTOM_EXAM_KEY = 'vstep_speaking_custom_exam_html';
export const ACTIVE_EXAM_KEY = 'vstep_speaking_active_exam';
export const ACTIVE_PART_KEY = 'vstep_speaking_active_part';

export function formatClock(seconds: number): string {
  const safeSeconds = Math.max(seconds, 0);
  return `${Math.floor(safeSeconds / 60).toString().padStart(2, '0')}:${(safeSeconds % 60).toString().padStart(2, '0')}`;
}

