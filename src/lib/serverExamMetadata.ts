import fs from 'fs';
import path from 'path';
import type { Metadata } from 'next';

type RawExamItem = {
  id?: string;
  'Mã câu hỏi'?: string;
  title?: string;
  'Tiêu đề đề bài'?: string;
  content?: string;
  'Nội dung chi tiết'?: string;
  school?: string;
  'Mã trường'?: string;
  batch?: string;
  'Đợt thi'?: string;
  part?: string;
  'Phần thi'?: string;
  group?: string;
  'Bộ đề / Nhóm chủ đề'?: string;
  [key: string]: unknown;
};

type ExamIndex = {
  speaking?: { file: string }[];
  writing?: { file: string }[];
};

let cachedExamMap: Map<string, RawExamItem> | null = null;

function getExamMap(): Map<string, RawExamItem> {
  if (cachedExamMap) return cachedExamMap;
  cachedExamMap = new Map();

  try {
    const dataDir = path.join(process.cwd(), 'src', 'data');
    const indexPath = path.join(dataDir, 'index.json');
    if (!fs.existsSync(indexPath)) return cachedExamMap;

    const rawIndex = fs.readFileSync(indexPath, 'utf8');
    const index = JSON.parse(rawIndex) as ExamIndex;
    const entries = [...(index.speaking || []), ...(index.writing || [])];

    for (const entry of entries) {
      const filePath = path.join(dataDir, entry.file);
      if (fs.existsSync(filePath)) {
        const rawList = fs.readFileSync(filePath, 'utf8');
        const list = JSON.parse(rawList) as RawExamItem[];
        if (Array.isArray(list)) {
          for (const item of list) {
            const rawId = item.id || item['Mã câu hỏi'];
            if (rawId) {
              cachedExamMap.set(String(rawId).toLowerCase().trim(), item);
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Error loading server exam map:', error);
  }

  return cachedExamMap;
}

function cleanTopicTitle(title?: string): string {
  if (!title) return '';
  return title
    .replace(/^Topic\s+\d+:\s*/i, '')
    .replace(/^Part\s+\d+\s*-\s*(?:Topic|Situation)\s+\d+:\s*/i, '')
    .replace(/^Task\s+\d+(?:\.\d+)?:\s*/i, '')
    .replace(/^Writing\s+Task\s+\d+(?:\.\d+)?:\s*/i, '')
    .trim();
}

type Props = {
  params?: Promise<{ part?: string; task?: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

/**
 * Generate Open Graph & Twitter metadata for Speaking pages
 */
export async function generateSpeakingMetadata(props: Props): Promise<Metadata> {
  const resolvedParams = props.params ? await props.params : {};
  const resolvedSearchParams = props.searchParams ? await props.searchParams : {};

  const examMap = getExamMap();
  const rawExam = resolvedSearchParams.exam || resolvedSearchParams.id || '';
  const schoolParam = resolvedSearchParams.matruong || resolvedSearchParams.school || '';
  const school = Array.isArray(schoolParam) ? schoolParam[0]?.toUpperCase() : schoolParam.toUpperCase();

  const partParam = resolvedParams.part || (resolvedSearchParams.part as string) || 'part1';
  const partNormalized = String(partParam).toLowerCase().replace(/\s+/g, '');
  const partNumber = partNormalized.replace(/^part/, '') || '1';

  // Parse exam IDs (e.g. speaking-part1-30+speaking-part1-24)
  const examIdStr = Array.isArray(rawExam) ? rawExam.join('+') : String(rawExam);
  const examIds = examIdStr
    .split(/[+, ]+/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  const foundItems = examIds
    .map((id) => examMap.get(id))
    .filter((item): item is RawExamItem => Boolean(item));

  if (foundItems.length > 0) {
    const topicNames = foundItems
      .map((item) => cleanTopicTitle(item.title || item['Tiêu đề đề bài']))
      .filter(Boolean);
    const combinedTopics = topicNames.join(' & ');
    const effectiveSchool = school || foundItems[0].school || foundItems[0]['Mã trường'] || '';
    const schoolLabel = effectiveSchool ? ` (${effectiveSchool})` : '';

    const title = `Speaking Part ${partNumber}: ${combinedTopics}${schoolLabel} | VSTEP Prep`;

    const descParts = foundItems.map((item, idx) => {
      const topicName = cleanTopicTitle(item.title || item['Tiêu đề đề bài']);
      return `Chủ đề ${idx + 1}: ${topicName}`;
    });
    const description = `${descParts.join(' • ')}. Đề thi VSTEP Speaking Part ${partNumber}${schoolLabel} thực tế có bấm giờ và ghi âm trực tiếp.`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'website',
        siteName: 'Học Bài VSTEP',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
      },
    };
  }

  // Fallback when no specific exam ID is provided
  const partNames: Record<string, string> = {
    part1: 'Part 1: Tương tác Xã hội (Social Interaction)',
    part2: 'Part 2: Thảo luận Giải pháp (Solution Discussion)',
    part3: 'Part 3: Phát triển Chủ đề (Topic Development)',
  };
  const partName = partNames[`part${partNumber}`] || `Part ${partNumber}`;
  const schoolLabel = school ? ` - ${school}` : '';

  const title = `Luyện thi VSTEP Speaking ${partName}${schoolLabel} | VSTEP Prep`;
  const description = `Luyện thi VSTEP Speaking ${partName}${schoolLabel} theo ngân hàng đề thi thực tế các trường VLU, UEH, HCMUE, DTHU với đồng hồ bấm giờ và ghi âm.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      siteName: 'Học Bài VSTEP',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

/**
 * Generate Open Graph & Twitter metadata for Writing pages
 */
export async function generateWritingMetadata(props: Props): Promise<Metadata> {
  const resolvedParams = props.params ? await props.params : {};
  const resolvedSearchParams = props.searchParams ? await props.searchParams : {};

  const examMap = getExamMap();
  const rawExam = resolvedSearchParams.exam || resolvedSearchParams.id || '';
  const schoolParam = resolvedSearchParams.matruong || resolvedSearchParams.school || '';
  const school = Array.isArray(schoolParam) ? schoolParam[0]?.toUpperCase() : schoolParam.toUpperCase();

  const taskParam = resolvedParams.task || (resolvedSearchParams.task as string) || 'task1';
  const taskNormalized = String(taskParam).toLowerCase().replace(/\s+/g, '');
  const taskNumber = taskNormalized.replace(/^(?:task|part)/, '') || '1';

  // Parse exam IDs
  const examIdStr = Array.isArray(rawExam) ? rawExam.join('+') : String(rawExam);
  const examIds = examIdStr
    .split(/[+, ]+/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  const foundItems = examIds
    .map((id) => examMap.get(id))
    .filter((item): item is RawExamItem => Boolean(item));

  if (foundItems.length > 0) {
    const item = foundItems[0];
    const taskTitle = cleanTopicTitle(item.title || item['Tiêu đề đề bài']);
    const effectiveSchool = school || item.school || item['Mã trường'] || '';
    const schoolLabel = effectiveSchool ? ` (${effectiveSchool})` : '';

    const title = `Writing Task ${taskNumber}: ${taskTitle}${schoolLabel} | VSTEP Prep`;
    const snippet = (item.content || item['Nội dung chi tiết'] || '')
      .replace(/\s+/g, ' ')
      .slice(0, 140);
    const description = `Đề thi VSTEP Writing Task ${taskNumber}${schoolLabel}: ${snippet}... Luyện viết có bấm giờ và đếm từ.`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'website',
        siteName: 'Học Bài VSTEP',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
      },
    };
  }

  // Fallback when no specific exam ID is provided
  const taskNames: Record<string, string> = {
    '1': 'Task 1: Viết Thư / Email',
    '2': 'Task 2: Viết Bài luận Học thuật',
  };
  const taskName = taskNames[taskNumber] || `Task ${taskNumber}`;
  const schoolLabel = school ? ` - ${school}` : '';

  const title = `Luyện thi VSTEP Writing ${taskName}${schoolLabel} | VSTEP Prep`;
  const description = `Luyện thi VSTEP Writing ${taskName}${schoolLabel} theo đề thi thực tế các trường với đồng hồ đếm ngược, đếm từ và kiểm tra ngữ pháp.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      siteName: 'Học Bài VSTEP',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}
