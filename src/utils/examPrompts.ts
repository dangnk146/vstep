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

export function toPromptEditorHtml(prompt: ExamPrompt) {
  const lines = toReadablePromptText(prompt.content)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  return [
    `<h2>${escapeHtml(prompt.title)}</h2>`,
    ...lines.map((line) => `<p>${escapeHtml(line)}</p>`),
  ].join('');
}
