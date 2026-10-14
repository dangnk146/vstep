import importedBank from '@/data/exam-bank.json';

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

function isExamCategory(category: unknown): category is ExamCategory {
  return typeof category === 'string'
    && EXAM_CATEGORIES.some((item) => item.id === category);
}

function isExamSet(set: unknown): set is ExamSet {
  if (typeof set !== 'object' || set === null) return false;
  const record = set as Record<string, unknown>;
  return typeof record.id === 'string'
    && typeof record.title === 'string'
    && Array.isArray(record.categories)
    && record.categories.every(isExamCategory)
    && Array.isArray(record.questionIds)
    && record.questionIds.every((id) => typeof id === 'string');
}

function isExamQuestion(question: unknown): question is ExamQuestion {
  if (typeof question !== 'object' || question === null) return false;
  const record = question as Record<string, unknown>;
  return typeof record.id === 'string'
    && isExamCategory(record.category)
    && typeof record.setId === 'string'
    && typeof record.title === 'string'
    && typeof record.content === 'string';
}

export const EXAM_SETS = importedBank.sets.filter(isExamSet);
const setsById = new Map(EXAM_SETS.map((set) => [set.id, set]));

export const EXAM_QUESTIONS = importedBank.questions
  .filter(isExamQuestion)
  .filter((question) => setsById.has(question.setId));

export const EXAM_PROMPTS: ExamPrompt[] = EXAM_QUESTIONS.map((question) => ({
  ...question,
  group: setsById.get(question.setId)!.title,
}));

export function getExamCategory(category: ExamCategory) {
  return EXAM_CATEGORIES.find((item) => item.id === category)!;
}

export function getExamSets(category: ExamCategory) {
  return EXAM_SETS.filter((set) => set.categories.includes(category));
}

export function getExamQuestions(category: ExamCategory) {
  return EXAM_QUESTIONS.filter((question) => question.category === category);
}

export function getExamQuestionsForSet(setId: string) {
  const set = setsById.get(setId);
  if (!set) return [];
  const questionIds = new Set(set.questionIds);
  return EXAM_QUESTIONS.filter((question) => questionIds.has(question.id));
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
  return toReadablePromptText(content)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^\d+\.\s*/, '').trim())
    .filter(Boolean);
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
      <div style="display:flex; align-items:center; justify-content:center; gap:18px; margin:18px 0; flex-wrap:nowrap;">
        <div style="display:flex; align-items:center; justify-content:center; min-height:72px; min-width:160px; padding:12px 16px; border:2px solid var(--border, #94a3b8); border-radius:18px; background:var(--card, #ffffff); text-align:center; font-size:16px; font-weight:500; color:var(--foreground, #0f172a); line-height:1.2;">${escapeHtml(ideaLabels[0])}</div>
        <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; gap:18px;">
          <div style="display:flex; align-items:center; justify-content:center; min-height:72px; min-width:160px; padding:12px 16px; border:2px solid var(--border, #94a3b8); border-radius:18px; background:var(--card, #ffffff); text-align:center; font-size:16px; font-weight:500; color:var(--foreground, #0f172a); line-height:1.2;">${escapeHtml(ideaLabels[1])}</div>
          <div style="display:flex; align-items:center; justify-content:center; min-height:72px; min-width:190px; padding:12px 16px; border:2px solid var(--border, #94a3b8); border-radius:18px; background:var(--card, #ffffff); text-align:center; font-size:16px; font-weight:500; color:var(--foreground, #0f172a); line-height:1.2;">${escapeHtml(ideaLabels[2])}</div>
        </div>
        <div style="display:flex; align-items:center; justify-content:center; min-height:72px; min-width:160px; padding:12px 16px; border:2px solid var(--border, #94a3b8); border-radius:18px; background:var(--card, #ffffff); text-align:center; font-size:16px; font-weight:500; color:var(--foreground, #0f172a); line-height:1.2;">${escapeHtml(ideaLabels[3])}</div>
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
        <div style="display:flex; align-items:center; justify-content:center; gap:18px; flex-wrap:wrap; margin:0 0 18px 0; position:relative;">
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
