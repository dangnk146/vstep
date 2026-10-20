import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

type ExamFileEntry = {
  school: string;
  batch: string;
  file: string;
  count: number;
};

type ExamIndex = {
  schools: string[];
  batches: string[];
  speaking: ExamFileEntry[];
  writing: ExamFileEntry[];
  listening: { file: string; totalVideos?: number };
  reading: { file: string; totalTests?: number };
};

type RawExamItem = {
  id: string;
  skill: 'speaking' | 'writing' | 'listening';
  part: string;
  title: string;
  content: string;
  group?: string;
  school?: string;
  batch?: string;
  videoId?: string;
  [key: string]: unknown;
};

const DATA_DIR = path.join(process.cwd(), 'src', 'data');
const fileCache = new Map<string, unknown>();

async function readJsonFile<T>(relativePath: string): Promise<T> {
  if (fileCache.has(relativePath)) {
    return fileCache.get(relativePath) as T;
  }
  const fullPath = path.join(DATA_DIR, relativePath);
  const raw = await fs.readFile(fullPath, 'utf8');
  const parsed = JSON.parse(raw) as T;
  fileCache.set(relativePath, parsed);
  return parsed;
}

async function getIndex(): Promise<ExamIndex> {
  return readJsonFile<ExamIndex>('index.json');
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'data';
    const skill = searchParams.get('skill')?.toLowerCase().trim();
    const school = (searchParams.get('school') || searchParams.get('matruong'))?.trim();
    const batch = (searchParams.get('batch') || searchParams.get('dotthi'))?.trim();
    const part = searchParams.get('part')?.toLowerCase().replace(/\s+/g, '');
    const id = searchParams.get('id')?.trim();
    const countParam = Number(searchParams.get('count')) || 1;

    const index = await getIndex();

    // 1. Action: options -> return available schools and batches
    if (action === 'options') {
      return NextResponse.json({
        ok: true,
        schools: index.schools || [],
        batches: index.batches || [],
      });
    }

    // 2. Action: listening -> return listening.json
    if (action === 'listening' || skill === 'listening') {
      const listeningData = await readJsonFile<unknown>(index.listening?.file || 'listening.json');
      return NextResponse.json({ ok: true, data: listeningData });
    }

    // 3. Action: reading -> return reading.json
    if (action === 'reading' || skill === 'reading') {
      const readingData = await readJsonFile<unknown>(index.reading?.file || 'reading.json');
      return NextResponse.json({ ok: true, data: readingData });
    }

    // 4. Determine matching data files
    const filterMatches = (entry: ExamFileEntry) => {
      // If a specific exam id is requested, search all files for the skill so it can always be found
      if (id) return true;
      if (school && school.toLowerCase() !== 'all' && entry.school.toLowerCase().trim() !== school.toLowerCase().trim()) {
        return false;
      }
      if (batch && batch.toLowerCase() !== 'all' && entry.batch.toLowerCase().trim() !== batch.toLowerCase().trim()) {
        return false;
      }
      return true;
    };

    const targetFiles: string[] = [];
    const includeSpeaking = !skill || skill === 'speaking' || skill === 'all';
    const includeWriting = !skill || skill === 'writing' || skill === 'all';

    if (includeSpeaking && Array.isArray(index.speaking)) {
      for (const entry of index.speaking) {
        if (filterMatches(entry)) targetFiles.push(entry.file);
      }
    }

    if (includeWriting && Array.isArray(index.writing)) {
      for (const entry of index.writing) {
        if (filterMatches(entry)) targetFiles.push(entry.file);
      }
    }

    // Read items from target files
    const itemArrays = await Promise.all(
      targetFiles.map((file) => readJsonFile<RawExamItem[]>(file)),
    );
    let items = itemArrays.flat();

    // Filter by id if requested (supports single ID or multiple IDs separated by +)
    if (id) {
      const requestedIds = id.split('+').map((s) => s.trim()).filter(Boolean);
      const found = items.filter((item) => requestedIds.includes(item.id));
      return NextResponse.json({
        ok: true,
        item: found[0] || null,
        items: found,
      });
    }

    // Filter by part if requested (handles part1, task1, 1 interchangeably)
    if (part) {
      items = items.filter((item) => {
        const itemPart = String(item.part || '').toLowerCase().replace(/\s+/g, '');
        if (itemPart === part) return true;
        const itemNum = itemPart.replace(/^(?:part|task)/, '');
        const reqNum = part.replace(/^(?:part|task)/, '');
        if (itemNum && reqNum && itemNum === reqNum) return true;
        return false;
      });
    }

    // 5. Action: random -> shuffle and pick count items
    if (action === 'random') {
      if (items.length === 0) {
        return NextResponse.json(
          { ok: false, error: 'Không tìm thấy đề thi phù hợp với tiêu chí đã chọn.', items: [] },
          { status: 404 },
        );
      }
      const shuffled = [...items].sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, Math.min(countParam, shuffled.length));
      return NextResponse.json({
        ok: true,
        items: selected,
      });
    }

    // 6. Default action: data -> return items
    return NextResponse.json({
      ok: true,
      total: items.length,
      items,
    });
  } catch (error) {
    console.error('API /api/exams error:', error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Lỗi hệ thống khi tải đề thi.',
      },
      { status: 500 },
    );
  }
}
