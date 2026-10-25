import { toExamPrompt, type ExamPrompt } from '@/utils/examPrompts';

export type ExamSkill = 'speaking' | 'writing' | 'listening' | 'reading';

export type ExamFilterOptions = {
  schools: string[];
  batches: string[];
};

export type RemoteExam = {
  id: string;
  skill: 'speaking' | 'writing' | 'listening';
  part: string;
  title: string;
  content: string;
  school?: string;
  batch?: string;
  group?: string;
  videoId?: string;
  [key: string]: unknown;
};

export type ExamApiResponse<T> = {
  ok: boolean;
  error?: string;
  items?: T[];
  item?: T | null;
  schools?: string[];
  batches?: string[];
  data?: unknown;
};

export type ExamApiSettings = {
  endpoint?: string;
  school: string;
  batch: string;
};

export const EXAM_API_SETTINGS_KEY = 'vstep_exam_api_settings_v1';
export const DEFAULT_EXAM_API_SETTINGS: ExamApiSettings = {
  endpoint: '',
  school: '',
  batch: '',
};

let filterOptionsPromise: Promise<ExamFilterOptions> | null = null;
const queryCache = new Map<string, Promise<ExamPrompt[]>>();

export function getExamApiSettings(): ExamApiSettings {
  if (typeof window === 'undefined') return DEFAULT_EXAM_API_SETTINGS;
  const saved = window.localStorage.getItem(EXAM_API_SETTINGS_KEY);
  if (!saved) return DEFAULT_EXAM_API_SETTINGS;

  try {
    const parsed: unknown = JSON.parse(saved);
    if (typeof parsed !== 'object' || parsed === null) {
      throw new Error('Saved exam API settings have an invalid format.');
    }
    const settings = parsed as Partial<ExamApiSettings>;
    return {
      endpoint: typeof settings.endpoint === 'string' ? settings.endpoint : '',
      school: typeof settings.school === 'string' ? settings.school : '',
      batch: typeof settings.batch === 'string' ? settings.batch : '',
    };
  } catch (error) {
    console.error('Could not read saved exam API settings.', error);
    return DEFAULT_EXAM_API_SETTINGS;
  }
}

export function saveExamApiSettings(settings: Partial<ExamApiSettings>) {
  const current = getExamApiSettings();
  const next = { ...current, ...settings };
  window.localStorage.setItem(EXAM_API_SETTINGS_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event('vstep:exam-api-settings-change'));
}

export function subscribeToExamApiSettings(callback: () => void) {
  window.addEventListener('storage', callback);
  window.addEventListener('vstep:exam-api-settings-change', callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener('vstep:exam-api-settings-change', callback);
  };
}

export function getExamApiSettingsSnapshot() {
  return JSON.stringify(getExamApiSettings());
}

export function getServerExamApiSettingsSnapshot() {
  return JSON.stringify(DEFAULT_EXAM_API_SETTINGS);
}

export function parseExamApiSettingsSnapshot(snapshot: string): ExamApiSettings {
  try {
    const parsed: unknown = JSON.parse(snapshot);
    if (typeof parsed === 'object' && parsed !== null) {
      const record = parsed as Record<string, unknown>;
      return {
        endpoint: typeof record.endpoint === 'string' ? record.endpoint : '',
        school: typeof record.school === 'string' ? record.school : '',
        batch: typeof record.batch === 'string' ? record.batch : '',
      };
    }
  } catch {
    // fallback
  }
  return DEFAULT_EXAM_API_SETTINGS;
}

/**
 * Fetch available filter options (schools, batches) from the server.
 */
export function fetchExamFilterOptions(): Promise<ExamFilterOptions> {
  if (filterOptionsPromise) return filterOptionsPromise;
  filterOptionsPromise = fetch('/api/exams?action=options')
    .then(async (res) => {
      if (!res.ok) throw new Error(`Lỗi tải bộ lọc từ máy chủ (${res.status})`);
      const json = (await res.json()) as ExamApiResponse<never>;
      if (!json.ok) throw new Error(json.error || 'Lỗi tải bộ lọc từ máy chủ');
      return {
        schools: json.schools || [],
        batches: json.batches || [],
      };
    })
    .catch((err) => {
      filterOptionsPromise = null;
      throw err;
    });
  return filterOptionsPromise;
}

/**
 * Alias for backward compatibility
 */
export const fetchExamManifest = fetchExamFilterOptions;

/**
 * Fetch exam prompts from Next.js server route on-demand.
 * Query results are cached in-memory by query key so switching filters is fast.
 */
export async function fetchExamPrompts(options?: {
  skill?: 'speaking' | 'writing';
  school?: string;
  batch?: string;
}): Promise<ExamPrompt[]> {
  const params = new URLSearchParams();
  params.set('action', 'data');
  if (options?.skill) params.set('skill', options.skill);
  if (options?.school) params.set('school', options.school);
  if (options?.batch) params.set('batch', options.batch);

  const cacheKey = params.toString();
  const cached = queryCache.get(cacheKey);
  if (cached) return cached;

  const promise = fetch(`/api/exams?${cacheKey}`)
    .then(async (res) => {
      if (!res.ok) throw new Error(`Lỗi máy chủ khi tải đề thi (${res.status})`);
      const json = (await res.json()) as ExamApiResponse<RemoteExam>;
      if (!json.ok) throw new Error(json.error || 'Không thể tải đề thi từ máy chủ.');
      return (json.items || [])
        .map((item) => toExamPrompt(item))
        .filter((prompt): prompt is ExamPrompt => Boolean(prompt));
    })
    .catch((err) => {
      queryCache.delete(cacheKey);
      throw err;
    });

  queryCache.set(cacheKey, promise);
  return promise;
}

/**
 * Request random prompt(s) from the server for Speaking or Writing.
 */
export async function getRandomExamPrompts(options: {
  skill: 'speaking' | 'writing';
  part?: string;
  school?: string;
  batch?: string;
  count?: number;
}): Promise<ExamPrompt[]> {
  const params = new URLSearchParams();
  params.set('action', 'random');
  params.set('skill', options.skill);
  if (options.part) params.set('part', options.part);
  if (options.school) params.set('school', options.school);
  if (options.batch) params.set('batch', options.batch);
  if (options.count) params.set('count', String(options.count));

  const res = await fetch(`/api/exams?${params.toString()}`);
  if (!res.ok) {
    const errorJson = await res.json().catch(() => null);
    throw new Error(errorJson?.error || `Không có đề ${options.skill === 'speaking' ? 'Speaking' : 'Writing'} phù hợp.`);
  }

  const json = (await res.json()) as ExamApiResponse<RemoteExam>;
  if (!json.ok || !json.items || json.items.length === 0) {
    throw new Error(json.error || `Không có đề ${options.skill === 'speaking' ? 'Speaking' : 'Writing'} phù hợp.`);
  }

  return json.items
    .map((item) => toExamPrompt(item))
    .filter((prompt): prompt is ExamPrompt => Boolean(prompt));
}

/**
 * Fetch one or more prompts by ID(s) from the server.
 * Preserves the exact order of requested IDs.
 */
export async function fetchExamPromptsByIds(
  ids: string | string[],
  skill?: 'speaking' | 'writing',
): Promise<ExamPrompt[]> {
  const idList = (Array.isArray(ids) ? ids : ids.split('+')).map((s) => s.trim()).filter(Boolean);
  if (idList.length === 0) return [];
  const idStr = idList.join('+');
  const params = new URLSearchParams();
  params.set('action', 'data');
  params.set('id', idStr);
  if (skill) params.set('skill', skill);

  try {
    const res = await fetch(`/api/exams?${params.toString()}`);
    if (!res.ok) return [];
    const json = (await res.json()) as ExamApiResponse<RemoteExam>;
    const rawItems = json.items || [];
    const itemMap = new Map(rawItems.map((item) => [item.id, item]));

    // Strictly map in the exact order requested by idList
    return idList
      .map((id) => itemMap.get(id))
      .filter((item): item is RemoteExam => Boolean(item))
      .map((item) => toExamPrompt(item))
      .filter((prompt): prompt is ExamPrompt => Boolean(prompt));
  } catch (error) {
    console.error('fetchExamPromptsByIds error:', error);
    return [];
  }
}

/**
 * Fetch a specific prompt by ID from the server.
 */
export async function fetchExamPromptById(id: string, skill?: 'speaking' | 'writing'): Promise<ExamPrompt | null> {
  const prompts = await fetchExamPromptsByIds(id, skill);
  return prompts[0] || null;
}

export type ExamUrlQuery = {
  exam?: string;
  matruong?: string;
  batch?: string;
  task?: string;
  part?: string;
};

/**
 * Parses query strings from the URL supporting both standard '&' and legacy '-' separators.
 * Normalizes batch format (e.g. "102026" or "10/2026" -> "10/2026").
 */
export function parseExamQueryString(search: string): ExamUrlQuery {
  const clean = search.replace(/^\?/, '').trim();
  if (!clean) return {};

  const result: ExamUrlQuery = {};
  const tokens = clean.split(/[&]|-(?=(?:matruong|school|batch|dotthi|exam|task|part)=)/i);

  for (const token of tokens) {
    const eq = token.indexOf('=');
    if (eq === -1) continue;
    const key = token.slice(0, eq).trim().toLowerCase();
    let val = decodeURIComponent(token.slice(eq + 1).trim());
    if (key === 'exam') {
      result.exam = val;
    } else if (key === 'matruong' || key === 'school') {
      result.matruong = val;
    } else if (key === 'batch' || key === 'dotthi') {
      // Normalize batch format:
      // If "102026" (MMYYYY) -> convert to standard "10/2026"
      if (/^\d{2}\d{4}$/.test(val)) {
        val = `${val.slice(0, 2)}/${val.slice(2)}`;
      } else if (/^\d{2}-\d{4}$/.test(val)) {
        val = val.replace('-', '/');
      }
      result.batch = val;
    } else if (key === 'task') {
      result.task = val;
    } else if (key === 'part') {
      result.part = val;
    }
  }

  return result;
}

/**
 * Builds standard query string formatted with '&' separators.
 * Batch is formatted cleanly without slashes or dashes (e.g. 10/2026 -> 102026).
 * Example: ?matruong=VLU&batch=102026
 * If exam is present -> &exam=...
 */
export function buildExamQueryString(query: ExamUrlQuery): string {
  const parts: string[] = [];
  const school = query.matruong?.trim();
  const rawBatch = query.batch?.trim();
  const exam = query.exam?.trim();

  // Strip slashes and dashes for clean safe URL (e.g. "10/2026" -> "102026")
  const cleanBatch = rawBatch ? rawBatch.replace(/[\/-]/g, '').trim() : '';

  const isSchoolSet = Boolean(school && school.toLowerCase() !== 'all');
  const isBatchSet = Boolean(cleanBatch && cleanBatch.toLowerCase() !== 'all');

  if (isSchoolSet && isBatchSet) {
    parts.push(`matruong=${encodeURIComponent(school!)}`);
    parts.push(`batch=${encodeURIComponent(cleanBatch)}`);
  } else if (isSchoolSet) {
    parts.push(`matruong=${encodeURIComponent(school!)}`);
  } else if (isBatchSet) {
    parts.push(`batch=${encodeURIComponent(cleanBatch)}`);
  } else {
    parts.push('matruong=all');
    parts.push('batch=all');
  }

  if (exam) {
    parts.push(`exam=${encodeURIComponent(exam)}`);
  }

  return parts.join('&');
}

