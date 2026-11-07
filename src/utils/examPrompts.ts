export const EXAM_CATEGORIES = [
  { id: 'writing-task1', label: 'Writing Task 1', skill: 'writing' },
  { id: 'writing-task2', label: 'Writing Task 2', skill: 'writing' },
  { id: 'speaking-part1', label: 'Speaking Part 1', skill: 'speaking' },
  { id: 'speaking-part2', label: 'Speaking Part 2', skill: 'speaking' },
  { id: 'speaking-part3', label: 'Speaking Part 3', skill: 'speaking' },
] as const;

export type ExamCategory = (typeof EXAM_CATEGORIES)[number]['id'];

export type ExamSet = {
  id: string;
  title: string;
  categories: ExamCategory[];
  questionIds: string[];
};

export type ExamQuestion = {
  id: string;
  category: ExamCategory;
  setId: string;
  title: string;
  content: string;
};

export type ExamPrompt = ExamQuestion & {
  group: string;
  school?: string;
  batch?: string;
};

export function getExamCategory(category: ExamCategory) {
  return EXAM_CATEGORIES.find((item) => item.id === category)!;
}

export function toExamPrompt(record: {
  id: string;
  skill: 'speaking' | 'writing' | 'listening';
  part: string;
  title: string;
  content: string;
  group?: string;
  school?: string;
  batch?: string;
}): ExamPrompt | null {
  const part = record.part.toLowerCase().replace(/\s+/g, '');
  let category: ExamCategory;
  if (record.skill === 'speaking' && /^part[123]$/.test(part)) {
    category = `speaking-${part}` as ExamCategory;
  } else if (record.skill === 'writing' && /^(?:part|task)[12]$/.test(part)) {
    category = `writing-task${part.slice(-1)}` as ExamCategory;
  } else {
    return null;
  }

  const group = record.group || [record.school, record.batch].filter(Boolean).join(' · ') || 'Chưa phân nhóm';
  const setId = `${category}:${group}`;
  return {
    id: record.id,
    category,
    setId,
    title: record.title,
    content: record.content,
    group,
    school: record.school,
    batch: record.batch,
  };
}

export function getExamSets(category: ExamCategory, prompts: ExamPrompt[]): ExamSet[] {
  const groups = new Map<string, ExamPrompt[]>();
  prompts.filter((prompt) => prompt.category === category).forEach((prompt) => {
    const group = groups.get(prompt.setId) || [];
    group.push(prompt);
    groups.set(prompt.setId, group);
  });
  return Array.from(groups, ([id, questions]) => ({
    id,
    title: questions[0].group,
    categories: [category],
    questionIds: questions.map((question) => question.id),
  }));
}

export function toReadablePromptText(content: string) {
  return content
    .replace(/^\s*>\s?/gm, '')
    .replace(/^\s*[-*]\s+/gm, '• ')
    .replace(/^\s*\d+\.\s+/gm, '• ')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*([^*\n]+)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\s*You should write (?:at least \d+ words|an essay of at least \d+ words[^\n.]*)[.]?/gi, '')
    .replace(/\s*You do not need to include your name or address(?:es)?[.]?/gi, '')
    .replace(/\s*Your response will be evaluated in terms of [^\n.]+[.]?/gi, '')
    .trim();
}

function escapeHtml(text: string) {
  const replacements: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return text.replace(/[&<>"']/g, (character) => replacements[character] ?? character);
}

function parsePromptQuestions(content: string) {
  const lines = content
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*([^*\n]+)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  const questionHeading = /(?:discussion|follow[\s-]*up)\s+questions?\s*:/i;
  const headingIndex = lines.findIndex((line) => questionHeading.test(line));
  const questionLines = headingIndex >= 0
    ? [
        lines[headingIndex].replace(/^.*?(?:discussion|follow[\s-]*up)\s+questions?\s*:\s*/i, ''),
        ...lines.slice(headingIndex + 1),
      ]
    : lines;

  const parsedLines = questionLines
    .map((line) => line.replace(/^(?:(?:\d+[.)])|[•*-])\s*/, '').trim())
    .filter((line) => line && !/^(?:discussion|follow[\s-]*up)\s+questions?\s*:?\s*$/i.test(line));
  const questions = parsedLines.filter((line) => line.endsWith('?'));
  if (questions.length > 0) return questions.slice(0, 3);

  return headingIndex >= 0
    ? parsedLines.slice(0, 3)
    : questionLines
        .filter((line) => /^\s*\d+[.)]\s*/.test(line))
        .map((line) => line.replace(/^\s*\d+[.)]\s*/, '').trim())
        .filter(Boolean)
        .slice(0, 3);
}

function extractSpeakingPart3Topic(title: string, content?: string): string {
  if (content) {
    const topicMatch = content.match(/^Topic:\s*([^\n]+)/im);
    if (topicMatch && topicMatch[1].trim()) {
      return topicMatch[1].trim();
    }
  }

  const parenthesisMatch = title.match(/\(([^)]+)\)/);
  if (parenthesisMatch) return parenthesisMatch[1].trim();

  const cleaned = title.replace(/^.*?:\s*/, '').trim();
  const match = cleaned.match(/^(.*?)(?:\s*\([^)]*\))?\s*$/);
  if (!match) return cleaned;
  return (match[1] || cleaned).trim();
}

function extractSpeakingPart3Suggestions(content: string): string[] {
  const lines = content.split('\n').map((line) => line.trim());
  const sugIdx = lines.findIndex((line) => /^suggestions\s*:?/i.test(line));
  let suggestions: string[] = [];

  if (sugIdx !== -1) {
    const nextHeaderIdx = lines.findIndex(
      (line, idx) => idx > sugIdx && /(?:follow[\s-]*up|discussion)\s+questions?\s*:/i.test(line)
    );
    const rawLines = lines.slice(sugIdx + 1, nextHeaderIdx === -1 ? undefined : nextHeaderIdx);
    suggestions = rawLines
      .map((line) => line.replace(/^[-*•\s]+/, '').replace(/^\[|\]$/g, '').trim())
      .filter(Boolean);
  }

  if (suggestions.length === 0) {
    return ['Idea 1', 'Idea 2', 'Idea 3', 'Your own ideas'];
  }

  if (suggestions.length === 3) {
    return [...suggestions, 'Your own ideas'];
  }

  if (suggestions.length >= 4) {
    return suggestions.slice(0, 4);
  }

  while (suggestions.length < 4) {
    suggestions.push(suggestions.length === 3 ? 'Your own ideas' : `Idea ${suggestions.length + 1}`);
  }

  return suggestions;
}

export function toPromptEditorHtml(prompt: ExamPrompt) {
  if (prompt.category === 'speaking-part3') {
    const topic = extractSpeakingPart3Topic(prompt.title, prompt.content);
    const questions = parsePromptQuestions(prompt.content).slice(0, 3);
    const ideaLabels = extractSpeakingPart3Suggestions(prompt.content);

    const ideaBoxes = `
      <div class="speaking-part3-options" style="display:flex; align-items:center; justify-content:center; gap:18px; margin:18px 0; flex-wrap:nowrap;">
        <div class="speaking-part3-option" style="display:flex; align-items:center; justify-content:center; min-height:72px; min-width:160px; max-width:220px; padding:12px 14px; border:2px solid var(--border, #94a3b8); border-radius:18px; background:var(--card, #ffffff); text-align:center; font-size:14px; font-weight:500; color:var(--foreground, #0f172a); line-height:1.3; overflow-wrap:anywhere;">${escapeHtml(ideaLabels[0])}</div>
        <div class="speaking-part3-options-center" style="display:flex; flex-direction:column; align-items:center; justify-content:center; gap:18px;">
          <div class="speaking-part3-option" style="display:flex; align-items:center; justify-content:center; min-height:72px; min-width:160px; max-width:220px; padding:12px 14px; border:2px solid var(--border, #94a3b8); border-radius:18px; background:var(--card, #ffffff); text-align:center; font-size:14px; font-weight:500; color:var(--foreground, #0f172a); line-height:1.3; overflow-wrap:anywhere;">${escapeHtml(ideaLabels[1])}</div>
          <div class="speaking-part3-option" style="display:flex; align-items:center; justify-content:center; min-height:72px; min-width:190px; max-width:220px; padding:12px 14px; border:2px solid var(--border, #94a3b8); border-radius:18px; background:var(--card, #ffffff); text-align:center; font-size:14px; font-weight:500; color:var(--foreground, #0f172a); line-height:1.3; overflow-wrap:anywhere;">${escapeHtml(ideaLabels[2])}</div>
        </div>
        <div class="speaking-part3-option" style="display:flex; align-items:center; justify-content:center; min-height:72px; min-width:160px; max-width:220px; padding:12px 14px; border:2px solid var(--border, #94a3b8); border-radius:18px; background:var(--card, #ffffff); text-align:center; font-size:14px; font-weight:500; color:var(--foreground, #0f172a); line-height:1.3; overflow-wrap:anywhere;">${escapeHtml(ideaLabels[3])}</div>
      </div>
    `;

    const questionsHtml = questions
      .map((question, index) => `<div style="margin:0 0 10px 0; font-size:15px; line-height:1.6; color:var(--foreground, #0f172a);">${index + 1}. ${escapeHtml(question)}</div>`)
      .join('');

    return `
      <div style="font-family: Arial, Helvetica, sans-serif; color:var(--foreground, #0f172a); background:transparent;">
        <div style="text-align:center; font-size:18px; font-weight:500; margin:0 0 18px 0; color:var(--foreground, #0f172a);">
          <strong>Topic :</strong> ${escapeHtml(topic)}
        </div>
        <div class="speaking-part3-layout" style="display:flex; align-items:center; justify-content:center; gap:18px; flex-wrap:wrap; margin:0 0 18px 0; position:relative;">
          ${ideaBoxes}
        </div>
        <div style="margin-top:10px; font-size:18px; font-weight:700; margin-bottom:10px; color:var(--foreground, #0f172a);">Follow-up Questions</div>
        <div style="display:block;">${questionsHtml}</div>
      </div>
    `;
  }

  const lines = toReadablePromptText(prompt.content)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  return [
    `<h2>${escapeHtml(prompt.title)}</h2>`,
    ...lines.map((line) => `<p>${escapeHtml(line)}</p>`),
  ].join('');
}
