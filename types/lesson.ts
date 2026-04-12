export type GrammarType = "فِعْل" | "اسْم" | "حَرْف";

export interface SpotTheWord {
  prompt: string;
  words: string[];
  answer: number;
}

export interface Concept {
  type: string;
  definition: string;
  examples: string[];
  group?: string;
  spot_the_word?: SpotTheWord;
}

export interface QuickCheck {
  question: string;
  options: { text: string; correct: boolean }[];
  explanation: string;
}

export interface WordSortCategory {
  key: string;
  label: string;
}

export interface WordSortWord {
  word: string;
  category: string;
}

export interface WordSortExercise {
  instruction: string;
  categories: WordSortCategory[];
  words: WordSortWord[];
}

export interface Exercises {
  review_quiz: QuickCheck[];
  word_sort: WordSortExercise;
}

export interface Lesson {
  module_id: string;
  title: string;
  introduction: string;
  concepts: (Concept & { quick_check: QuickCheck })[];
  exercises: Exercises;
}
