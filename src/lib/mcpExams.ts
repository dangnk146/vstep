import fs from 'fs/promises';
import path from 'path';
import {
  getExamCategory,
  toExamPrompt,
  toReadablePromptText,
  type ExamCategory,
  type ExamPrompt,
} from '@/utils/examPrompts';

type ExamFileEntry = {
  school: string;
  batch: string;
  file: string;
  count?: number;
};

type ExamIndex = {
  schools: string[];
  batches: string[];
  speaking: ExamFileEntry[];
  writing: ExamFileEntry[];
};

type RawExamRecord = {
  id: string;
  skill: 'speaking' | 'writing' | 'listening';
  part: string;
  title: string;
  content: string;
  group?: string;
  school?: string;
  batch?: string;
};

export type ExamFilterInput = {
  batches?: string[];
  schools?: string[];
  skill?: 'all' | 'speaking' | 'writing';
  part?: 'all' | ExamCategory | 'part1' | 'part2' | 'part3' | 'task1' | 'task2';
  group?: string;
  query?: string;
};

type CachedDataset = {
  loadedAt: number;
  schools: string[];
  batches: string[];
  prompts: ExamPrompt[];
};

const DATA_DIR = path.join(process.cwd(), 'src', 'data');
const CACHE_TTL_MS = process.env.NODE_ENV === 'production' ? 5 * 60 * 1000 : 2000;
let datasetCache: CachedDataset | null = null;

/**
 * Load and normalize all Speaking & Writing prompts from src/data on the server.
 */
export async function loadExamDataset(): Promise<CachedDataset> {
  const now = Date.now();
  if (datasetCache && now - datasetCache.loadedAt < CACHE_TTL_MS) {
    return datasetCache;
  }

  const indexRaw = await fs.readFile(path.join(DATA_DIR, 'index.json'), 'utf8');
  const index = JSON.parse(indexRaw) as ExamIndex;

  const entries = [...(index.speaking || []), ...(index.writing || [])];
  const arrays = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(DATA_DIR, entry.file);
      const raw = await fs.readFile(fullPath, 'utf8');
      return JSON.parse(raw) as RawExamRecord[];
    }),
  );

  const prompts: ExamPrompt[] = [];
  for (const record of arrays.flat()) {
    const normalized = toExamPrompt(record);
    if (normalized) {
      prompts.push(normalized);
    }
  }

  datasetCache = {
    loadedAt: now,
    schools: index.schools || [],
    batches: index.batches || [],
    prompts,
  };
  return datasetCache;
}

/**
 * Match a prompt batch (e.g. "09/2026") against flexible user/AI inputs
 * such as "09/2026", "9/2026", "092026", "09-2026", or month-only "09" / "9".
 */
function matchesSingleBatch(promptBatch: string | undefined, rawFilter: string): boolean {
  const filter = rawFilter.trim().toLowerCase();
  if (!filter || filter === 'all') return true;
  if (!promptBatch) return false;

  const normalizedPrompt = promptBatch.trim().toLowerCase();
  const compactPrompt = normalizedPrompt.replace(/[\/-]/g, '');
  const compactFilter = filter.replace(/[\/-]/g, '');

  if (normalizedPrompt === filter || compactPrompt === compactFilter) {
    return true;
  }

  const promptMatch = normalizedPrompt.match(/^(\d{1,2})\/(\d{4})$/);
  if (!promptMatch) return false;

  const promptMonth = promptMatch[1].padStart(2, '0');
  const promptYear = promptMatch[2];

  // Month + Year with single-digit month (e.g. "9/2026" or "9-2026")
  const fullFilterMatch = filter.match(/^(\d{1,2})[\/-](\d{4})$/);
  if (fullFilterMatch) {
    return fullFilterMatch[1].padStart(2, '0') === promptMonth && fullFilterMatch[2] === promptYear;
  }

  // Month-only input (e.g. "9", "09", "tháng 9")
  const monthOnlyMatch = filter.match(/^(?:tháng\s*)?(\d{1,2})$/i);
  if (monthOnlyMatch) {
    return monthOnlyMatch[1].padStart(2, '0') === promptMonth;
  }

  return false;
}

function normalizePartCategory(
  part: ExamFilterInput['part'],
  skill: ExamFilterInput['skill'],
): ExamCategory | 'all' | null {
  if (!part || part === 'all') return 'all';
  const clean = part.toLowerCase().trim();
  if (
    clean === 'speaking-part1' ||
    clean === 'speaking-part2' ||
    clean === 'speaking-part3' ||
    clean === 'writing-task1' ||
    clean === 'writing-task2'
  ) {
    return clean;
  }
  if (clean === 'part1' || clean === 'part2' || clean === 'part3') {
    if (skill === 'writing') return null;
    return `speaking-${clean}` as ExamCategory;
  }
  if (clean === 'task1' || clean === 'task2') {
    if (skill === 'speaking') return null;
    return `writing-${clean}` as ExamCategory;
  }
  return null;
}

export function applyExamFilters(prompts: ExamPrompt[], input: ExamFilterInput): ExamPrompt[] {
  const skill = input.skill || 'all';
  const resolvedPart = normalizePartCategory(input.part, skill);
  if (resolvedPart === null) return [];

  const schoolSet = new Set(
    (input.schools || [])
      .map((s) => s.trim().toUpperCase())
      .filter((s) => s && s !== 'ALL'),
  );

  const batchList = (input.batches || [])
    .map((b) => b.trim())
    .filter((b) => b && b.toLowerCase() !== 'all');

  const groupQuery = input.group?.trim().toLowerCase() || '';
  const searchQuery = input.query?.trim().toLowerCase() || '';

  return prompts.filter((prompt) => {
    if (skill === 'speaking' && !prompt.category.startsWith('speaking-')) return false;
    if (skill === 'writing' && !prompt.category.startsWith('writing-')) return false;

    if (resolvedPart !== 'all' && prompt.category !== resolvedPart) return false;

    if (schoolSet.size > 0) {
      const promptSchool = (prompt.school || '').trim().toUpperCase();
      if (!schoolSet.has(promptSchool)) return false;
    }

    if (batchList.length > 0) {
      const anyBatchMatches = batchList.some((b) => matchesSingleBatch(prompt.batch, b));
      if (!anyBatchMatches) return false;
    }

    if (groupQuery && !prompt.group.toLowerCase().includes(groupQuery)) {
      return false;
    }

    if (searchQuery) {
      const haystack = `${prompt.id} ${prompt.title} ${prompt.group} ${prompt.content} ${prompt.school || ''} ${prompt.batch || ''}`.toLowerCase();
      if (!haystack.includes(searchQuery)) return false;
    }

    return true;
  });
}

export function buildCounts(prompts: ExamPrompt[]) {
  const counts: Record<string, number> = {
    all: prompts.length,
    speaking: 0,
    writing: 0,
    'speaking-part1': 0,
    'speaking-part2': 0,
    'speaking-part3': 0,
    'writing-task1': 0,
    'writing-task2': 0,
  };

  for (const prompt of prompts) {
    if (prompt.category.startsWith('speaking-')) counts.speaking++;
    if (prompt.category.startsWith('writing-')) counts.writing++;
    if (counts[prompt.category] !== undefined) counts[prompt.category]++;
  }

  return counts;
}

export async function getExamMetadata(filters?: { school?: string; batch?: string }) {
  const dataset = await loadExamDataset();
  const filtered = applyExamFilters(dataset.prompts, {
    schools: filters?.school ? [filters.school] : undefined,
    batches: filters?.batch ? [filters.batch] : undefined,
  });

  const groups = Array.from(new Set(filtered.map((p) => p.group))).filter(Boolean);
  const byBatch: Record<string, number> = {};
  for (const b of dataset.batches) {
    byBatch[b] = applyExamFilters(filtered, { batches: [b] }).length;
  }

  return {
    schools: dataset.schools,
    batches: dataset.batches,
    totalInBank: dataset.prompts.length,
    matchedTotal: filtered.length,
    counts: buildCounts(filtered),
    byBatch,
    groups,
  };
}

export function toCleanExamRecord(prompt: ExamPrompt) {
  return {
    id: prompt.id,
    category: prompt.category,
    categoryLabel: getExamCategory(prompt.category)?.label || prompt.category,
    school: prompt.school || null,
    batch: prompt.batch || null,
    group: prompt.group,
    title: prompt.title,
    content: toReadablePromptText(prompt.content),
  };
}

export function formatExamsAsMarkdown(
  prompts: ExamPrompt[],
  options?: {
    title?: string;
    includeMetadata?: boolean;
    numbering?: boolean;
  },
): string {
  const includeMeta = options?.includeMetadata ?? true;
  const numbering = options?.numbering ?? true;

  let md = `# ${options?.title || 'NGÂN HÀNG ĐỀ THI VSTEP'}\n\n`;
  md += `> **Tổng số lượng đề:** ${prompts.length} đề\n\n---\n\n`;

  if (prompts.length === 0) {
    return `${md}*Không có đề thi nào phù hợp với bộ lọc đã chọn.*\n`;
  }

  prompts.forEach((item, index) => {
    const cat = getExamCategory(item.category);
    const numPrefix = numbering ? `${index + 1}. ` : '';
    md += `## ${numPrefix}${item.title}\n\n`;

    if (includeMeta) {
      md += `- **Phần thi:** ${cat ? cat.label : item.category}\n`;
      if (item.school) md += `- **Trường:** ${item.school}\n`;
      if (item.batch) md += `- **Đợt thi:** ${item.batch}\n`;
      if (item.group) md += `- **Nhóm đề:** ${item.group}\n`;
      md += `- **Mã đề:** \`${item.id}\`\n\n`;
    }

    md += `${toReadablePromptText(item.content)}\n\n---\n\n`;
  });

  return md;
}

