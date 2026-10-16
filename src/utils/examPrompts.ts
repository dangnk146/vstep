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

export type ExamPrompt = ExamQuestion & { group: string };

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

function extractSpeakingPart3Topic(title: string) {
  const parenthesisMatch = title.match(/\(([^)]+)\)/);
  if (parenthesisMatch) return parenthesisMatch[1].trim();

  const cleaned = title.replace(/^.*?:\s*/, '').trim();
  const match = cleaned.match(/^(.*?)(?:\s*\([^)]*\))?\s*$/);
  if (!match) return cleaned;
  return (match[1] || cleaned).trim();
}

function getSpeakingPart3IdeaLabels(prompt: ExamPrompt) {
  const pools = [
    ['Fresh air', 'Cheap cost', 'Friendly neighbors', 'Your own ideas'],
    ['Better environment', 'Lower living costs', 'Strong community', 'Your own ideas'],
    ['Health benefits', 'More space', 'Calm lifestyle', 'Your own ideas'],
    ['Less stress', 'Affordable living', 'Supportive people', 'Your own ideas'],
    ['Cleaner air', 'Higher quality of life', 'Close-knit society', 'Your own ideas'],
  ];

  const seed = [...prompt.id].reduce((total, char) => total + char.charCodeAt(0), 0);
  return pools[seed % pools.length];
}

export function toPromptEditorHtml(prompt: ExamPrompt) {
  if (prompt.category === 'speaking-part3') {
    const topic = extractSpeakingPart3Topic(prompt.title);
    const questions = parsePromptQuestions(prompt.content).slice(0, 3);
    const ideaLabels = getSpeakingPart3IdeaLabels(prompt);

    const ideaBoxes = `
      <div class="speaking-part3-options" style="display:flex; align-items:center; justify-content:center; gap:18px; margin:18px 0; flex-wrap:nowrap;">
        <div class="speaking-part3-option" style="display:flex; align-items:center; justify-content:center; min-height:72px; min-width:160px; padding:12px 16px; border:2px solid var(--border, #94a3b8); border-radius:18px; background:var(--card, #ffffff); text-align:center; font-size:16px; font-weight:500; color:var(--foreground, #0f172a); line-height:1.2;">${escapeHtml(ideaLabels[0])}</div>
        <div class="speaking-part3-options-center" style="display:flex; flex-direction:column; align-items:center; justify-content:center; gap:18px;">
          <div class="speaking-part3-option" style="display:flex; align-items:center; justify-content:center; min-height:72px; min-width:160px; padding:12px 16px; border:2px solid var(--border, #94a3b8); border-radius:18px; background:var(--card, #ffffff); text-align:center; font-size:16px; font-weight:500; color:var(--foreground, #0f172a); line-height:1.2;">${escapeHtml(ideaLabels[1])}</div>
          <div class="speaking-part3-option" style="display:flex; align-items:center; justify-content:center; min-height:72px; min-width:190px; padding:12px 16px; border:2px solid var(--border, #94a3b8); border-radius:18px; background:var(--card, #ffffff); text-align:center; font-size:16px; font-weight:500; color:var(--foreground, #0f172a); line-height:1.2;">${escapeHtml(ideaLabels[2])}</div>
        </div>
        <div class="speaking-part3-option" style="display:flex; align-items:center; justify-content:center; min-height:72px; min-width:160px; padding:12px 16px; border:2px solid var(--border, #94a3b8); border-radius:18px; background:var(--card, #ffffff); text-align:center; font-size:16px; font-weight:500; color:var(--foreground, #0f172a); line-height:1.2;">${escapeHtml(ideaLabels[3])}</div>
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
