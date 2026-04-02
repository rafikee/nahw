export type GrammarType = "فِعْل" | "اسْم" | "حَرْف" | "punctuation";

export interface ParsedWord {
  word: string;
  grammar_type: GrammarType;
}

export interface Concept {
  type: string;
  definition: string;
  examples: string[];
}

export interface WordLengthRule {
  length: string;
  examples: string[];
}

export interface CourseIntro {
  id: string;
  title: string;
  paragraphs: string[];
  word_length_rules_intro: string;
  word_length_rules: WordLengthRule[];
  conclusion: string;
}

export interface InteractiveParagraph {
  instruction: string;
  full_sentence: string;
  parsing_breakdown: ParsedWord[];
}

export interface Exercises {
  text_questions: string[];
  word_classification_list: {
    instruction: string;
    words: string[];
  };
  interactive_paragraph: InteractiveParagraph;
}

export interface Lesson {
  module_id: string;
  title: string;
  introduction: string;
  concepts: Concept[];
  exercises: Exercises;
}
