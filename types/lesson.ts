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
  /**
   * A few words of context shown under the concept's name on the lesson intro
   * preview. Without it the preview lists bare technical terms the learner has
   * no way to interpret yet, which is noise rather than a preview.
   */
  preview_hint?: string;
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

/**
 * A second content box on the intro page, shown directly under the main idea.
 *
 * Distinct from `intro_bonus`, which is styled as an aside. This is for a
 * lesson whose opening idea needs two sequential beats — the hook, then the
 * thing itself with examples — so the first concept step does not end up
 * restating the introduction.
 */
export interface IntroDetail {
  title: string;
  body: string;
  examples?: string[];
}

export interface Lesson {
  module_id: string;
  title: string;
  introduction: string;
  intro_detail?: IntroDetail;
  intro_bonus?: IntroBonus;
  concepts: (Concept & { quick_check: QuickCheck })[];
  exercises: Exercises;
}
