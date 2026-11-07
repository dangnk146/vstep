export type ReadingQuestion = {
  number: number;
  prompt: string;
  options: { label: string; text: string }[];
  answer: string;
};

export type ReadingPassage = {
  id: string;
  title: string;
  paragraphs: string[];
  questions: ReadingQuestion[];
};

export type ReadingTest = {
  id: string;
  title: string;
  directions: string;
  passages: ReadingPassage[];
};

export const READING_TESTS: ReadingTest[] = [];
