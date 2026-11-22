import {
  getExamCategory,
  getPromptSortTimestamp,
  toReadablePromptText,
  type ExamPrompt,
} from '@/utils/examPrompts';
import type { SkillFilter, PartFilter, PromptSortMode } from './types';

export function generatePromptsMarkdown(
  prompts: ExamPrompt[],
  options?: {
    categoryLabel?: string;
    schoolsLabel?: string;
    batchesLabel?: string;
    includeMetadata?: boolean;
    numbering?: boolean;
  }
): string {
  const count = prompts.length;
  const today = new Date().toLocaleDateString('vi-VN');
  const partLabel = options?.categoryLabel || 'Danh sách đề thi';
  const schools = options?.schoolsLabel || 'Tất cả các trường';
  const batches = options?.batchesLabel || 'Tất cả các đợt thi';
  const includeMeta = options?.includeMetadata ?? true;
  const numbering = options?.numbering ?? true;

  let md = `# NGÂN HÀNG ĐỀ THI VSTEP\n\n`;
  md += `> **Phần thi:** ${partLabel}  \n`;
  md += `> **Trường thi:** ${schools}  \n`;
  md += `> **Đợt thi:** ${batches}  \n`;
  md += `> **Tổng số lượng đề:** ${count} đề  \n`;
  md += `> **Ngày xuất:** ${today}  \n\n`;
  md += `---\n\n`;

  if (count === 0) {
    md += `*Không có đề thi nào phù hợp với bộ lọc đã chọn.*\n`;
    return md;
  }

  prompts.forEach((item, index) => {
    const cat = getExamCategory(item.category);
    const numPrefix = numbering ? `${index + 1}. ` : '';
    md += `## ${numPrefix}${item.title}\n\n`;

    if (includeMeta) {
      md += `- **Kỹ năng / Phần:** ${cat ? cat.label : item.category}\n`;
      if (item.school) md += `- **Trường thi:** ${item.school}\n`;
      if (item.batch) md += `- **Đợt thi:** ${item.batch}\n`;
      if (item.group) md += `- **Bộ đề / Nhóm:** ${item.group}\n`;
      md += `- **Mã câu hỏi:** \`${item.id}\`\n\n`;
    }

    md += `### Nội dung đề bài:\n\n`;
    md += `${toReadablePromptText(item.content)}\n\n`;
    md += `---\n\n`;
  });

  return md;
}

export function downloadMarkdownFile(filename: string, content: string) {
  try {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 2000);
  } catch (err) {
    console.error('Download error:', err);
    // Fallback using data URI
    const encodedUri = 'data:text/markdown;charset=utf-8,' + encodeURIComponent(content);
    const fallbackLink = document.createElement('a');
    fallbackLink.setAttribute('href', encodedUri);
    fallbackLink.setAttribute('download', filename);
    document.body.appendChild(fallbackLink);
    fallbackLink.click();
    document.body.removeChild(fallbackLink);
  }
}

export interface ParsedPromptsUrlState {
  school?: string;
  batch?: string;
  skill?: SkillFilter;
  part?: PartFilter;
  search?: string;
  examId?: string;
  onlyNew?: boolean;
  sort?: PromptSortMode;
}

export function parsePromptsUrlQuery(searchStr: string): ParsedPromptsUrlState {
  const clean = searchStr.replace(/^\?/, '').trim();
  if (!clean) return {};

  const searchParams = new URLSearchParams(clean);
  const result: ParsedPromptsUrlState = {};

  // School
  const rawSchool = (searchParams.get('matruong') || searchParams.get('school'))?.trim();
  if (rawSchool) {
    result.school = rawSchool.toLowerCase() === 'all' ? 'all' : rawSchool.toUpperCase();
  }

  // Batch
  const rawBatch = (searchParams.get('batch') || searchParams.get('dotthi'))?.trim();
  if (rawBatch) {
    if (rawBatch.toLowerCase() === 'all') {
      result.batch = 'all';
    } else if (/^\d{2}\d{4}$/.test(rawBatch)) {
      result.batch = `${rawBatch.slice(0, 2)}/${rawBatch.slice(2)}`;
    } else if (/^\d{2}-\d{4}$/.test(rawBatch)) {
      result.batch = rawBatch.replace('-', '/');
    } else {
      result.batch = rawBatch;
    }
  }

  // Skill
  const rawSkill = searchParams.get('skill')?.toLowerCase().trim();
  if (rawSkill === 'speaking' || rawSkill === 'writing') {
    result.skill = rawSkill;
  } else if (rawSkill === 'all') {
    result.skill = 'all';
  }

  // Part / Task
  const rawPart = (searchParams.get('part') || searchParams.get('task'))?.toLowerCase().trim();
  if (rawPart) {
    if (rawPart === 'part1' || rawPart === 'speaking-part1') {
      result.skill = 'speaking';
      result.part = 'speaking-part1';
    } else if (rawPart === 'part2' || rawPart === 'speaking-part2') {
      result.skill = 'speaking';
      result.part = 'speaking-part2';
    } else if (rawPart === 'part3' || rawPart === 'speaking-part3') {
      result.skill = 'speaking';
      result.part = 'speaking-part3';
    } else if (rawPart === 'task1' || rawPart === 'writing-task1') {
      result.skill = 'writing';
      result.part = 'writing-task1';
    } else if (rawPart === 'task2' || rawPart === 'writing-task2') {
      result.skill = 'writing';
      result.part = 'writing-task2';
    } else if (rawPart === 'all') {
      result.part = 'all';
    }
  }

  // Search
  const rawSearch = searchParams.get('q') || searchParams.get('search');
  if (rawSearch !== null && rawSearch !== undefined) {
    result.search = rawSearch.trim();
  }

  // Exam
  const rawExam = searchParams.get('exam') || searchParams.get('id');
  if (rawExam) {
    result.examId = rawExam.trim();
  }

  // Only new filter
  const rawNew = searchParams.get('new')?.toLowerCase().trim();
  if (rawNew === '1' || rawNew === 'true') {
    result.onlyNew = true;
  } else if (rawNew === '0' || rawNew === 'false') {
    result.onlyNew = false;
  }

  // Sort mode
  const rawSort = searchParams.get('sort')?.toLowerCase().trim();
  if (rawSort === 'newest' || rawSort === 'oldest' || rawSort === 'default') {
    result.sort = rawSort;
  }

  return result;
}

export interface PromptsFilterCriteria {
  skill: SkillFilter;
  part: PartFilter;
  school: string;
  batch: string;
  search: string;
  onlyNew?: boolean;
  sort?: PromptSortMode;
}

function getPromptNumericSuffix(id: string): number {
  const m = id.match(/(\d+)$/);
  return m ? Number(m[1]) : 0;
}

export function filterExamPrompts(
  allPrompts: ExamPrompt[],
  criteria: PromptsFilterCriteria
): ExamPrompt[] {
  const query = criteria.search.trim().toLowerCase();

  const indexed = allPrompts
    .map((prompt, idx) => ({ prompt, idx }))
    .filter(({ prompt }) => {
      if (criteria.onlyNew && !prompt.isNew) return false;

      if (criteria.skill === 'speaking' && !prompt.category.startsWith('speaking-')) return false;
      if (criteria.skill === 'writing' && !prompt.category.startsWith('writing-')) return false;

      if (criteria.part !== 'all' && prompt.category !== criteria.part) return false;

      if (criteria.school !== 'all') {
        const promptSchool = (prompt.school || '').toUpperCase().trim();
        if (promptSchool !== criteria.school.toUpperCase().trim()) return false;
      }

      if (criteria.batch !== 'all') {
        const cleanReq = criteria.batch.replace(/[\/-]/g, '').toLowerCase().trim();
        const cleanPrompt = (prompt.batch || '').replace(/[\/-]/g, '').toLowerCase().trim();
        if (cleanReq !== cleanPrompt && prompt.batch !== criteria.batch) return false;
      }

      if (query) {
        const matchString = `${prompt.title} ${prompt.group} ${prompt.content} ${prompt.school || ''} ${prompt.batch || ''}`.toLowerCase();
        if (!matchString.includes(query)) return false;
      }

      return true;
    });

  const sortMode: PromptSortMode = criteria.sort ?? 'newest';
  if (sortMode === 'default') {
    return indexed.map((item) => item.prompt);
  }

  indexed.sort((a, b) => {
    if (sortMode === 'newest') {
      const aNew = a.prompt.isNew ? 1 : 0;
      const bNew = b.prompt.isNew ? 1 : 0;
      if (aNew !== bNew) return bNew - aNew;

      const aTime = getPromptSortTimestamp(a.prompt);
      const bTime = getPromptSortTimestamp(b.prompt);
      if (aTime !== bTime) return bTime - aTime;

      const aNum = getPromptNumericSuffix(a.prompt.id);
      const bNum = getPromptNumericSuffix(b.prompt.id);
      if (aNum !== bNum) return bNum - aNum;

      return b.idx - a.idx;
    }

    // oldest first
    const aTime = getPromptSortTimestamp(a.prompt);
    const bTime = getPromptSortTimestamp(b.prompt);
    if (aTime !== bTime) return aTime - bTime;

    const aNew = a.prompt.isNew ? 1 : 0;
    const bNew = b.prompt.isNew ? 1 : 0;
    if (aNew !== bNew) return aNew - bNew;

    return a.idx - b.idx;
  });

  return indexed.map((item) => item.prompt);
}

export function buildPromptsUrlQuery({
  school,
  batch,
  skill,
  part,
  search,
  examId,
  onlyNew,
  sort,
}: {
  school?: string;
  batch?: string;
  skill?: SkillFilter;
  part?: PartFilter;
  search?: string;
  examId?: string;
  onlyNew?: boolean;
  sort?: PromptSortMode;
}): string {
  const parts: string[] = [];

  // 1. matruong (e.g. ?matruong=VLU)
  if (school && school !== 'all') {
    parts.push(`matruong=${encodeURIComponent(school.toUpperCase().trim())}`);
  }

  // 2. batch (e.g. &batch=092026)
  if (batch && batch !== 'all') {
    const cleanBatch = batch.replace(/[\/-]/g, '').trim();
    if (cleanBatch) {
      parts.push(`batch=${encodeURIComponent(cleanBatch)}`);
    }
  }

  // 3. skill (e.g. &skill=speaking)
  if (skill && skill !== 'all') {
    parts.push(`skill=${encodeURIComponent(skill)}`);
  }

  // 4. part (e.g. &part=part3 or &part=task1)
  if (part && part !== 'all') {
    const cleanPart = part.replace(/^(speaking-|writing-)/, '');
    parts.push(`part=${encodeURIComponent(cleanPart)}`);
  }

  // 5. search query (e.g. &q=...)
  if (search && search.trim()) {
    parts.push(`q=${encodeURIComponent(search.trim())}`);
  }

  // 6. onlyNew filter
  if (onlyNew) {
    parts.push('new=1');
  }

  // 7. sort mode (omit default 'newest' to keep URLs clean)
  if (sort && sort !== 'newest') {
    parts.push(`sort=${encodeURIComponent(sort)}`);
  }

  // 8. selected exam id (e.g. &exam=...)
  if (examId && examId.trim()) {
    parts.push(`exam=${encodeURIComponent(examId.trim())}`);
  }

  return parts.join('&');
}
