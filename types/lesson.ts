export type GrammarType = "فِعْل" | "اسْم" | "حَرْف";

export interface SpotTheWord {
  prompt: string;
  words: string[];
  answer: number;
}

export interface ExamplePair {
  from: string;
  to: string;
}

export interface Concept {
  type: string;
  definition: string;
  examples: string[];
  example_pairs?: ExamplePair[];
  pair_from_label?: string;
  pair_to_label?: string;
  group?: string;
  group_title?: string;
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

export interface IntroBonus {
  title: string;
  body: string;
}

export interface Lesson {
  module_id: string;
  title: string;
  introduction: string;
  intro_bonus?: IntroBonus;
  concepts: (Concept & { quick_check: QuickCheck })[];
  exercises: Exercises;
}
