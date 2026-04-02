"use client";

import { useState } from "react";
import lessonData from "@/data/lesson_1.json";

type ParsedWord = (typeof lessonData.interactive_exercise.parsing_breakdown)[0];
type WordState = "idle" | "correct" | "incorrect";

// Step map: 0=splash, 1=intro, 2–4=concepts[0–2], 5=exercise
const TOTAL_STEPS = 6;
const LESSON_STEPS = 5; // steps 1–5, used for progress dots

export default function Home() {
  const [currentStep, setCurrentStep] = useState(0);
  const [wordStates, setWordStates] = useState<Record<string, WordState>>({});
  const [feedback, setFeedback] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const { title, introduction, concepts, interactive_exercise } = lessonData;

  const conceptIndex =
    currentStep >= 2 && currentStep <= 4 ? currentStep - 2 : -1;

  function handleWordClick(parsedWord: ParsedWord) {
    if (wordStates[parsedWord.word] && wordStates[parsedWord.word] !== "idle")
      return;
    setWordStates((prev) => ({
      ...prev,
      [parsedWord.word]: parsedWord.is_correct_answer ? "correct" : "incorrect",
    }));
    setFeedback({
      message: parsedWord.feedback_if_clicked,
      type: parsedWord.is_correct_answer ? "success" : "error",
    });
  }

  function handleRestart() {
    setCurrentStep(0);
    setWordStates({});
    setFeedback(null);
  }

  return (
    <div dir="rtl" className="min-h-screen bg-stone-50 font-arabic flex flex-col">
      {/* ── Step 0: Splash ── */}
      {currentStep === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-16">
          <div className="space-y-10 max-w-sm">
            <div className="space-y-4">
              <h1 className="text-3xl font-bold text-stone-800 leading-[1.8]">
                مرحباً بك في أساسيات النحو
              </h1>
              <p className="text-base text-stone-500 leading-8">
                درس اليوم:{" "}
                <span className="text-stone-700 font-semibold">{title}</span>
              </p>
            </div>
            <button
              onClick={() => setCurrentStep(1)}
              className="inline-flex items-center justify-center rounded-xl bg-amber-600 px-10 py-3.5 text-base font-semibold text-white hover:bg-amber-700 active:scale-95 transition-all duration-200 shadow-sm"
            >
              ابدأ الدرس
            </button>
          </div>
        </div>
      )}

      {/* ── Steps 1–5: header + content + nav ── */}
      {currentStep > 0 && (
        <>
          {/* Header */}
          <header className="sticky top-0 z-10 border-b border-stone-200/80 bg-white/90 backdrop-blur-sm">
            <div className="mx-auto flex max-w-3xl items-center gap-4 px-6 py-4">
              <span className="rounded-md bg-amber-50 px-2.5 py-1 text-xs font-semibold tracking-widest text-amber-700 border border-amber-100">
                نَحْو
              </span>
              <span className="text-stone-200 select-none">|</span>
              <h1 className="text-lg font-semibold text-stone-800 leading-none">
                {title}
              </h1>
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 mx-auto w-full max-w-3xl px-6 py-12">
            {currentStep === 1 && (
              <StepIntro introduction={introduction} concepts={concepts} />
            )}
            {conceptIndex >= 0 && (
              <StepConcept concept={concepts[conceptIndex]} />
            )}
            {currentStep === 5 && (
              <StepExercise
                exercise={interactive_exercise}
                wordStates={wordStates}
                feedback={feedback}
                onWordClick={handleWordClick}
              />
            )}
          </main>

          {/* Nav footer */}
          <footer className="border-t border-stone-100 bg-white">
            <div className="mx-auto max-w-3xl px-6 py-4 flex items-center justify-between">
              {/* In RTL flex, first child = visually rightmost → السابق goes right */}
              <button
                onClick={() => setCurrentStep((s) => Math.max(s - 1, 1))}
                disabled={currentStep <= 1}
                className="inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium text-stone-500 hover:bg-stone-50 disabled:opacity-25 disabled:cursor-not-allowed transition-all"
              >
                السابق
              </button>

              {/* Progress dots */}
              <div className="flex items-center gap-2">
                {Array.from({ length: LESSON_STEPS }, (_, i) => {
                  const stepNum = i + 1;
                  return (
                    <div
                      key={i}
                      className={`rounded-full transition-all duration-300 ${
                        stepNum === currentStep
                          ? "w-5 h-2 bg-amber-500"
                          : stepNum < currentStep
                          ? "w-2 h-2 bg-amber-300"
                          : "w-2 h-2 bg-stone-200"
                      }`}
                    />
                  );
                })}
              </div>

              {/* التالي goes left (last child in RTL) */}
              {currentStep < TOTAL_STEPS - 1 ? (
                <button
                  onClick={() =>
                    setCurrentStep((s) => Math.min(s + 1, TOTAL_STEPS - 1))
                  }
                  className="inline-flex items-center rounded-lg px-4 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-50 transition-all"
                >
                  التالي
                </button>
              ) : (
                <button
                  onClick={handleRestart}
                  className="inline-flex items-center rounded-lg px-4 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-50 transition-all"
                >
                  إعادة الدرس
                </button>
              )}
            </div>
          </footer>
        </>
      )}
    </div>
  );
}

/* ── Step Views ── */

type IntroProps = {
  introduction: string;
  concepts: typeof lessonData.concepts;
};

const conceptThemes = [
  {
    bg: "bg-sky-50",
    border: "border-sky-100",
    badgeBg: "bg-sky-100 border-sky-200 text-sky-900",
    iconColor: "text-sky-400",
    watermark: "text-sky-200",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
        <path d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    bg: "bg-amber-50",
    border: "border-amber-100",
    badgeBg: "bg-amber-100 border-amber-200 text-amber-900",
    iconColor: "text-amber-400",
    watermark: "text-amber-200",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
        <line x1="7" y1="7" x2="7.01" y2="7" />
      </svg>
    ),
  },
  {
    bg: "bg-violet-50",
    border: "border-violet-100",
    badgeBg: "bg-violet-100 border-violet-200 text-violet-900",
    iconColor: "text-violet-400",
    watermark: "text-violet-200",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
    ),
  },
] as const;

function StepIntro({ introduction, concepts }: IntroProps) {
  return (
    <div className="space-y-6">
      <SectionLabel>المقدمة</SectionLabel>

      <p className="text-sm leading-8 text-stone-400 px-1">{introduction}</p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {concepts.map((concept, i) => {
          const theme = conceptThemes[i];
          return (
            <div
              key={concept.type}
              className={`relative rounded-2xl border ${theme.border} ${theme.bg} p-6 space-y-5 overflow-hidden`}
            >
              {/* Watermark */}
              <span
                className={`absolute -bottom-5 -left-2 text-[6.5rem] font-black select-none leading-none pointer-events-none ${theme.watermark}`}
                aria-hidden
              >
                {concept.type}
              </span>

              {/* Icon */}
              <div className={`w-9 h-9 ${theme.iconColor}`}>{theme.icon}</div>

              {/* Type badge */}
              <span
                className={`inline-flex items-center rounded-xl border px-3 py-1.5 text-2xl font-bold ${theme.badgeBg}`}
              >
                {concept.type}
              </span>

              {/* Rule */}
              <p className="text-sm leading-7 text-stone-600 relative z-10">
                {concept.rule}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

type ConceptProps = { concept: (typeof lessonData.concepts)[0] };

function StepConcept({ concept }: ConceptProps) {
  return (
    <div className="space-y-6">
      <SectionLabel>النوع</SectionLabel>

      {/* Large type badge */}
      <div className="flex items-center gap-5">
        <span className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-50 border border-amber-100 text-3xl font-bold text-amber-800 shadow-sm shrink-0">
          {concept.type}
        </span>
        <div>
          <p className="text-xs font-medium text-stone-400 mb-1">القاعدة</p>
          <p className="text-base font-semibold text-stone-800 leading-8">
            {concept.rule}
          </p>
        </div>
      </div>

      {/* Definition */}
      <div className="rounded-2xl border border-stone-100 bg-white px-7 py-6 shadow-sm space-y-1">
        <p className="text-xs font-medium text-stone-400">التعريف</p>
        <p className="text-lg leading-[2.6] text-stone-700">{concept.definition}</p>
      </div>

      {/* Examples */}
      <div className="rounded-2xl border border-stone-100 bg-white px-7 py-6 shadow-sm space-y-4">
        <p className="text-xs font-medium text-stone-400">أمثلة</p>
        <div className="flex flex-wrap gap-3">
          {concept.examples.map((ex) => (
            <div
              key={ex.arabic}
              className="flex items-center gap-3 rounded-xl bg-stone-50 border border-stone-100 px-4 py-3"
            >
              <span className="text-xl font-bold text-stone-800">
                {ex.arabic}
              </span>
              <span className="text-stone-200 select-none">·</span>
              <span
                className="text-xs text-stone-400 font-mono tracking-widest"
                dir="ltr"
              >
                {ex.root}
              </span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  ex.context === "حديث"
                    ? "bg-sky-50 text-sky-600 border border-sky-100"
                    : "bg-amber-50 text-amber-600 border border-amber-100"
                }`}
              >
                {ex.context}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

type ExerciseProps = {
  exercise: typeof lessonData.interactive_exercise;
  wordStates: Record<string, WordState>;
  feedback: { message: string; type: "success" | "error" } | null;
  onWordClick: (word: ParsedWord) => void;
};

function StepExercise({
  exercise,
  wordStates,
  feedback,
  onWordClick,
}: ExerciseProps) {
  const { instruction, full_sentence, parsing_breakdown } = exercise;
  const wordMap = new Map<string, ParsedWord>(
    parsing_breakdown.map((w) => [w.word, w])
  );
  const sentenceWords = full_sentence.split(" ");

  return (
    <div className="space-y-6">
      <SectionLabel>التمرين التفاعلي</SectionLabel>

      <div className="rounded-2xl border border-stone-100 bg-white shadow-sm overflow-hidden">
        {/* Instruction */}
        <div className="px-7 py-5 border-b border-stone-50">
          <p className="text-base leading-8 text-stone-600">{instruction}</p>
        </div>

        {/* Sentence */}
        <div className="px-7 py-8">
          <div className="flex flex-wrap items-center gap-3">
            {sentenceWords.map((word, i) => {
              const parsedWord = wordMap.get(word);
              if (!parsedWord) {
                return (
                  <span
                    key={i}
                    className="text-2xl font-semibold text-stone-700 leading-none py-2"
                  >
                    {word}
                  </span>
                );
              }
              const state = wordStates[word] ?? "idle";
              return (
                <WordButton
                  key={i}
                  word={word}
                  state={state}
                  onClick={() => onWordClick(parsedWord)}
                />
              );
            })}
          </div>
        </div>

        {/* Feedback */}
        <div className="px-7 pb-7">
          {feedback ? (
            <div
              className={`rounded-xl px-5 py-4 text-base leading-8 border transition-all ${
                feedback.type === "success"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : "bg-rose-50 border-rose-200 text-rose-800"
              }`}
            >
              <span className="me-2 text-lg">
                {feedback.type === "success" ? "✓" : "✗"}
              </span>
              {feedback.message}
            </div>
          ) : (
            <div className="rounded-xl px-5 py-4 text-sm text-stone-400 border border-dashed border-stone-200 text-center">
              اضغط على كلمة لترى التحليل النحوي
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Shared components ── */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-widest text-stone-400">
      {children}
    </p>
  );
}

type WordButtonProps = {
  word: string;
  state: WordState;
  onClick: () => void;
};

function WordButton({ word, state, onClick }: WordButtonProps) {
  const stateStyles: Record<WordState, string> = {
    idle: "bg-stone-50 border-stone-200 text-stone-800 hover:bg-amber-50 hover:border-amber-200 hover:text-amber-900 active:scale-95 cursor-pointer",
    correct:
      "bg-emerald-50 border-emerald-200 text-emerald-800 cursor-default",
    incorrect: "bg-rose-50 border-rose-200 text-rose-800 cursor-default",
  };

  return (
    <button
      onClick={onClick}
      disabled={state !== "idle"}
      className={`inline-flex items-center rounded-xl border px-4 py-2 text-2xl font-semibold leading-none shadow-sm transition-all duration-200 ${stateStyles[state]}`}
    >
      {word}
    </button>
  );
}
