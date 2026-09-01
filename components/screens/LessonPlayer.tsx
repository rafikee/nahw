"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import type { Lesson } from "@/types/lesson";
import { lessonOrdinal } from "@/lib/ordinals";
import { StepLessonIntro } from "@/components/steps/StepLessonIntro";
import { StepConcept } from "@/components/steps/StepConcept";
import { StepQuickCheck } from "@/components/steps/StepQuickCheck";
import { StepWordSort } from "@/components/steps/StepWordSort";
import { RichText } from "@/components/ui/RichText";
import { track } from "@/lib/events";

type StepView =
  | { type: "lesson_intro" }
  | { type: "lesson_concept"; conceptIndex: number }
  | { type: "lesson_quick_check"; conceptIndex: number }
  | { type: "lesson_review_quiz"; questionIndex: number }
  | { type: "lesson_word_sort" };

function buildSteps(lesson: Lesson): StepView[] {
  return [
    { type: "lesson_intro" },
    ...lesson.concepts.flatMap((_, ci): StepView[] => [
      { type: "lesson_concept", conceptIndex: ci },
      { type: "lesson_quick_check", conceptIndex: ci },
    ]),
    ...lesson.exercises.review_quiz.map(
      (_, qi): StepView => ({ type: "lesson_review_quiz", questionIndex: qi })
    ),
    { type: "lesson_word_sort" },
  ];
}

function getStepLabel(view: StepView, lesson: Lesson): string {
  if (view.type === "lesson_intro") return "نَظْرَةٌ عَامَّةٌ";
  if (view.type === "lesson_concept") return lesson.concepts[view.conceptIndex].type;
  if (view.type === "lesson_quick_check") return "سُؤَالٌ";
  if (view.type === "lesson_review_quiz") return "مُرَاجَعَةٌ";
  return "تَصْنِيفٌ";
}

interface LessonPlayerProps {
  lesson: Lesson;
  lessonNumber: number;
  levelSubtitle: string;
  onComplete: () => void;
  onHome: () => void;
  onOpenSettings: () => void;
}

export function LessonPlayer({
  lesson,
  lessonNumber,
  levelSubtitle,
  onComplete,
  onHome,
  onOpenSettings,
}: LessonPlayerProps) {
  const steps = useMemo(() => buildSteps(lesson), [lesson]);
  const [stepIndex, setStepIndex] = useState(0);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");

  /**
   * The answered-quick-check verdict, tagged with the step it belongs to.
   * Tagging rather than clearing on navigation keeps this out of an effect,
   * so revisiting a step shows its own verdict and never a stale one.
   */
  const [feedback, setFeedback] = useState<{
    step: number;
    correct: boolean;
    explanation: string;
  } | null>(null);

  const current = steps[stepIndex];
  const isLast = stepIndex === steps.length - 1;
  const canGoBack = stepIndex > 0;
  const progress = { step: stepIndex + 1, total: steps.length };
  const verdict = feedback?.step === stepIndex ? feedback : null;

  const handleAnswer = useCallback(
    (result: { correct: boolean; explanation: string }) =>
      setFeedback({ step: stepIndex, ...result }),
    [stepIndex]
  );

  useEffect(() => {
    track("lesson_start", { contextId: lesson.module_id });
  }, [lesson.module_id]);

  const goNext = useCallback(() => {
    track("step_complete", {
      contextId: lesson.module_id,
      payload: { step_kind: current.type },
    });
    if (isLast) {
      onComplete();
      return;
    }
    setDirection("forward");
    setStepIndex((i) => i + 1);
  }, [isLast, onComplete, lesson.module_id, current.type]);

  const goPrev = useCallback(() => {
    setDirection("backward");
    setStepIndex((i) => Math.max(i - 1, 0));
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") goNext();
      if (e.key === "ArrowRight") goPrev();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goNext, goPrev]);

  const lessonLabel = `الدَّرْسُ ${lessonOrdinal(lessonNumber)}`;
  const stepLabel = getStepLabel(current, lesson);

  return (
    <>
      <header className="shrink-0 bg-elevated-strong backdrop-blur-sm">
        <div className="flex items-center gap-2.5 px-6 py-3.5 min-w-0">
          <button
            onClick={onHome}
            className="shrink-0 rounded-md bg-primary-soft px-2.5 py-1 type-body font-semibold text-primary-text border border-primary-soft hover:bg-primary-border/30 transition-colors"
            title="الصَّفْحَةُ الرَّئِيسِيَّةُ"
          >
            {levelSubtitle}
          </button>
          <svg className="w-3 h-3 text-faint shrink-0 rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
          <span className="shrink-0 type-body text-faint">{lessonLabel}</span>
          <svg className="w-3 h-3 text-faint shrink-0 rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
          <h1 className="type-body font-semibold text-heading truncate min-w-0">{stepLabel}</h1>
          <button
            type="button"
            onClick={onOpenSettings}
            className="mr-auto shrink-0 rounded-xl border border-divider-strong bg-surface px-2.5 py-1.5 text-muted transition-colors hover:bg-surface-hover hover:text-heading"
            aria-label="الإعدادات"
            title="الإعدادات"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
        </div>
        <div className="h-1.5 bg-track overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300 ease-out"
            style={{
              width: `${(progress.step / progress.total) * 100}%`,
              background: "var(--theme-primary-hover)",
            }}
          />
        </div>
      </header>

      <main
        key={stepIndex}
        className={`flex-1 min-h-0 overflow-y-auto px-6 py-10 ${
          direction === "forward" ? "slide-forward" : "slide-backward"
        }`}
      >
        {current.type === "lesson_intro" && (
          <StepLessonIntro lesson={lesson} />
        )}
        {current.type === "lesson_concept" && (
          <StepConcept
            concept={lesson.concepts[current.conceptIndex]}
            conceptIndex={current.conceptIndex}
          />
        )}
        {current.type === "lesson_quick_check" && (
          <StepQuickCheck
            key={stepIndex}
            data={lesson.concepts[current.conceptIndex].quick_check}
            onAnswer={handleAnswer}
          />
        )}
        {current.type === "lesson_review_quiz" && (
          <StepQuickCheck
            key={stepIndex}
            data={lesson.exercises.review_quiz[current.questionIndex]}
            onAnswer={handleAnswer}
          />
        )}
        {current.type === "lesson_word_sort" && (
          <StepWordSort
            key={stepIndex}
            data={lesson.exercises.word_sort}
          />
        )}
      </main>

      <footer
        className={`shrink-0 border-t px-4 py-1.5 pb-[max(env(safe-area-inset-bottom),0.5rem)] transition-colors duration-200 ${
          verdict
            ? verdict.correct
              ? "border-success-border bg-success-soft"
              : "border-danger-border bg-danger-soft"
            : "border-divider/80 bg-elevated-muted backdrop-blur-sm"
        }`}
      >
        {verdict ? (
          <div className="feedback-enter space-y-2 py-1.5">
            <p
              className={`type-body font-bold ${
                verdict.correct ? "text-success-text" : "text-danger-text"
              }`}
            >
              {verdict.correct ? "✓ إِجَابَةٌ صَحِيحَةٌ!" : "✗ إِجَابَةٌ خَاطِئَةٌ"}
            </p>
            {/* Capped so a long explanation scrolls inside the sheet rather
                than pushing the button back off the screen. */}
            <p className="type-body font-medium text-label max-h-32 overflow-y-auto">
              <RichText text={verdict.explanation} />
            </p>
            {/* Answering used to replace the whole footer with a single forward
                button, so the way back vanished the moment you committed to an
                answer. The verdict is kept when you return — re-answering a
                question you already got wrong teaches nothing. */}
            <div className="flex items-stretch gap-2">
              <button
                onClick={goPrev}
                disabled={!canGoBack}
                className="shrink-0 flex items-center gap-1.5 rounded-lg border border-divider-strong bg-surface/70 px-3 py-2 type-compact font-semibold text-muted hover:bg-surface-hover transition-all disabled:opacity-20 disabled:pointer-events-none"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                السَّابِقُ
              </button>
              <button
                onClick={goNext}
                className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2 type-compact font-bold text-on-primary active:scale-[0.98] transition-all duration-150 shadow-sm ${
                  verdict.correct
                    ? "bg-success-strong hover:bg-success-strong-hover"
                    : "bg-danger-strong hover:bg-danger-strong-hover"
                }`}
              >
                {isLast ? "إِنْهَاءُ الدَّرْسِ" : "التَّالِي"}
                {!isLast && (
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
                )}
              </button>
            </div>
          </div>
        ) : (
        <div className="flex items-stretch gap-2">
          <button
            onClick={goPrev}
            disabled={!canGoBack}
            className="shrink-0 flex items-center gap-1.5 rounded-lg border border-divider-strong px-3 py-1.5 type-compact font-semibold text-muted hover:bg-surface-hover hover:border-divider-strong disabled:opacity-20 disabled:pointer-events-none transition-all"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
            السَّابِقُ
          </button>

          <button
            onClick={goNext}
            className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary-hover py-1.5 type-compact font-bold text-on-primary hover:bg-primary active:scale-[0.98] active:shadow-none transition-all duration-150 shadow-sm"
          >
            {isLast ? "إِنْهَاءُ الدَّرْسِ" : "التَّالِي"}
            {!isLast && (
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
            )}
          </button>
        </div>
        )}
      </footer>
    </>
  );
}
