export interface WritingTask1BodyItem {
  requirement: string;
  frame: string;
  answer: string;
  reason: string;
  example: string;
}

export interface WritingTask1Hint {
  part: 'writing-task1';
  letterType: 'Formal' | 'Informal' | string;
  purpose: string;
  opening: {
    template: 'Formal' | 'Informal' | string;
    fill: string;
  };
  body: WritingTask1BodyItem[];
  closing: {
    template: 'Formal' | 'Informal' | string;
    topic: string;
  };
  reusedVocab: string[];
  extraVocab: string[];
}

export interface WritingTask2BodyBlock {
  focus: string;
  frame: string;
  point: string;
  example: string;
}

export interface WritingTask2Hint {
  part: 'writing-task2';
  essayType: string;
  reusedSource: string;
  intro: {
    debai: string;
    ld1: string;
    ld2: string;
  };
  body1: WritingTask2BodyBlock;
  body2: WritingTask2BodyBlock;
  conclusion: string;
  reusedVocab: string[];
  extraVocab: string[];
}

export interface SpeakingPart1QuestionHint {
  q: string;
  pillar: string;
  answer: string;
  reason: string;
  example: string;
}

export interface SpeakingPart1Hint {
  part: 'speaking-part1';
  topic: string;
  reusedSource: string;
  questions: SpeakingPart1QuestionHint[];
  reusedVocab: string[];
  extraVocab: string[];
}

export interface SpeakingPart2RejectedOption {
  option: string;
  cheCode: string;
  reason: string;
}

export interface SpeakingPart2Hint {
  part: 'speaking-part2';
  situation: string;
  chosen: {
    option: string;
    khen1Code: string;
    khen1Text: string;
    khen2Pillar: string;
    khen2ARE: {
      answer: string;
      reason: string;
      example: string;
    };
    khen3Code: string;
    khen3Text: string;
  };
  rejected: SpeakingPart2RejectedOption[];
  reusedVocab: string[];
  extraVocab: string[];
}

export interface SpeakingPart3MindmapPoint {
  cue: string;
  wordForm: string;
  sentence: string;
  expand: string;
  impact: string;
}

export interface SpeakingPart3FollowUp {
  q: string;
  formula: string;
  answer: string;
  reason: string;
  example: string;
}

export interface SpeakingPart3Hint {
  part: 'speaking-part3';
  macroTopic: string;
  coreTopic: string;
  mindmapPoints: SpeakingPart3MindmapPoint[];
  ownIdea: string;
  followUps: SpeakingPart3FollowUp[];
  reusedVocab: string[];
  extraVocab: string[];
}

export type ExamHint =
  | WritingTask1Hint
  | WritingTask2Hint
  | SpeakingPart1Hint
  | SpeakingPart2Hint
  | SpeakingPart3Hint;

const VALID_HINT_PARTS = new Set([
  'writing-task1',
  'writing-task2',
  'speaking-part1',
  'speaking-part2',
  'speaking-part3',
]);

export function isExamHint(value: unknown): value is ExamHint {
  if (!value || typeof value !== 'object') return false;
  const part = (value as { part?: unknown }).part;
  return typeof part === 'string' && VALID_HINT_PARTS.has(part);
}

