import test1 from './tests/test-01.json';
import test2 from './tests/test-02.json';
import test3 from './tests/test-03.json';
import test4 from './tests/test-04.json';
import test5 from './tests/test-05.json';
import test6 from './tests/test-06.json';

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

export const READING_TESTS: ReadingTest[] = [test1, test2, test3, test4, test5, test6];
