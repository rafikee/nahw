"use client";

import { useState, useMemo, useEffect } from "react";
import { LESSONS } from "@/data/index";
import { StepLessonIntro } from "@/components/steps/StepLessonIntro";
import { StepConcept } from "@/components/steps/StepConcept";
import { StepQuickCheck } from "@/components/steps/StepQuickCheck";
import { StepWordSort } from "@/components/steps/StepWordSort";

/* ── Types ── */

type View =
  | { type: "splash" }
  | { type: "lesson_intro"; lessonIndex: number }
  | { type: "lesson_concept"; lessonIndex: number; conceptIndex: number }
  | { type: "lesson_quick_check"; lessonIndex: number; conceptIndex: number }
  | { type: "lesson_review_quiz"; lessonIndex: number; questionIndex: number }
  | { type: "lesson_word_sort"; lessonIndex: number };

/* ── View builder ── */

function buildViews(): View[] {
  return [
    { type: "splash" },
    ...LESSONS.flatMap((lesson, li) => [
      { type: "lesson_intro" as const, lessonIndex: li },
      ...lesson.concepts.flatMap((_, ci): View[] => [
        { type: "lesson_concept", lessonIndex: li, conceptIndex: ci },
        { type: "lesson_quick_check", lessonIndex: li, conceptIndex: ci },
      ]),
      ...lesson.exercises.review_quiz.map(
        (_, qi): View => ({ type: "lesson_review_quiz", lessonIndex: li, questionIndex: qi })
      ),
      { type: "lesson_word_sort" as const, lessonIndex: li },
    ]),
  ];
}

/* ── Helpers ── */

const ARABIC_ORDINALS = [
  "الْأَوَّلُ", "الثَّانِي", "الثَّالِثُ", "الرَّابِعُ", "الْخَامِسُ",
  "السَّادِسُ", "السَّابِعُ", "الثَّامِنُ", "التَّاسِعُ", "الْعَاشِرُ",
];

function getBreadcrumb(view: View): { lesson: string | null; step: string } {
  if (view.type === "splash") return { lesson: null, step: "" };

  const li = (view as { lessonIndex: number }).lessonIndex;
  const lesson = `الدَّرْسُ ${ARABIC_ORDINALS[li] ?? li + 1}`;
  let step = "";

  if (view.type === "lesson_intro") step = "نَظْرَةٌ عَامَّةٌ";
  else if (view.type === "lesson_concept") step = LESSONS[li].concepts[view.conceptIndex].type;
  else if (view.type === "lesson_quick_check") step = "سُؤَالٌ";
  else if (view.type === "lesson_review_quiz") step = "مُرَاجَعَةٌ";
  else if (view.type === "lesson_word_sort") step = "تَصْنِيفٌ";

  return { lesson, step };
}

function getLessonProgress(views: View[], idx: number): { step: number; total: number } | null {
  const v = views[idx];
  if (v.type === "splash") return null;

  const li = (v as { lessonIndex: number }).lessonIndex;
  const lessonViews = views.filter(
    (x) => x.type !== "splash" && (x as { lessonIndex: number }).lessonIndex === li
  );
  const posInLesson = lessonViews.findIndex((x) => x === v) + 1;
  return { step: posInLesson, total: lessonViews.length };
}

/* ── Main component ── */

export default function Home() {
  const views = useMemo(buildViews, []);
  const [viewIndex, setViewIndex] = useState(0);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");

  const currentView = views[viewIndex];
  const isLast = viewIndex === views.length - 1;
  const canGoBack = viewIndex > 0;
  const progress = getLessonProgress(views, viewIndex);

  function goNext() {
    setDirection("forward");
    setViewIndex((i) => Math.min(i + 1, views.length - 1));
  }
  function goPrev() {
    setDirection("backward");
    setViewIndex((i) => Math.max(i - 1, 0));
  }
  function goHome() {
    setDirection("backward");
    setViewIndex(0);
  }

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") goNext();
      if (e.key === "ArrowRight") goPrev();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div dir="rtl" className="h-dvh font-arabic flex flex-col lg:items-center lg:justify-center bg-stone-50 lg:bg-stone-200/60 overflow-hidden">
      <div className="flex-1 min-h-0 flex flex-col w-full lg:flex-none lg:w-[520px] lg:h-[88vh] lg:rounded-3xl lg:shadow-2xl lg:overflow-hidden bg-stone-50">

        {/* ── Splash ── */}
        {currentView.type === "splash" && (
          <div className="flex-1 flex flex-col justify-center gap-10 px-8">

            {/* App identity */}
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                  </svg>
                </div>
                <p className="text-base font-semibold text-stone-500">مَرْحَبًا بِكَ فِي</p>
              </div>
              <h1 className="text-4xl font-bold text-stone-900" style={{ lineHeight: 1.5 }}>أَسَاسِيَّاتُ النَّحْوِ</h1>
            </div>

            {/* Lesson of the day */}
            <div className="relative border-r-4 border-amber-400 pr-5 bg-amber-50/60 rounded-l-xl py-4 pl-4" style={{ lineHeight: 1.5 }}>
              <p className="text-sm font-semibold text-amber-600 mb-2">دَرْسُ الْيَوْمِ</p>
              <p className="text-2xl font-bold text-stone-900">{LESSONS[0].title}</p>
            </div>

            {/* CTA */}
            <button
              onClick={goNext}
              className="relative w-full flex items-center justify-center gap-3 rounded-2xl bg-amber-600 py-4 text-base font-bold text-white hover:bg-amber-700 active:scale-[0.98] active:shadow-none transition-all duration-200 shadow-sm"
            >
              ابْدَأِ الدَّرْسَ
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
          </div>
        )}

        {/* ── Steps: header + content + nav ── */}
        {currentView.type !== "splash" && (
          <>
            <header className="shrink-0 bg-white/90 backdrop-blur-sm">
              <div className="flex items-center gap-2.5 px-6 py-3.5 min-w-0">
                {(() => {
                  const { lesson, step } = getBreadcrumb(currentView);
                  return (
                    <>
                      <button
                        onClick={goHome}
                        className="shrink-0 rounded-md bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 border border-amber-100 hover:bg-amber-100 transition-colors"
                        title="الصَّفْحَةُ الرَّئِيسِيَّةُ"
                      >
                        أَسَاسِيَّاتُ النَّحْوِ
                      </button>
                      {lesson && (
                        <>
                          <svg className="w-3 h-3 text-stone-300 shrink-0 rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                          <span className="shrink-0 text-sm text-stone-400">{lesson}</span>
                        </>
                      )}
                      <svg className="w-3 h-3 text-stone-300 shrink-0 rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                      <h1 className="text-sm font-semibold text-stone-800 truncate min-w-0">{step}</h1>
                      {progress && (
                        <span className="mr-auto shrink-0 text-xs font-medium text-stone-400 tabular-nums">
                          {progress.step}/{progress.total}
                        </span>
                      )}
                    </>
                  );
                })()}
              </div>
              <div className="h-1.5 bg-stone-100 overflow-hidden">
                {progress && (
                  <div
                    className="h-full bg-gradient-to-l from-amber-500 to-amber-400 transition-all duration-300 ease-out"
                    style={{ width: `${(progress.step / progress.total) * 100}%` }}
                  />
                )}
              </div>
            </header>

            <main
              key={viewIndex}
              className={`flex-1 min-h-0 overflow-y-auto px-6 py-10 ${
                direction === "forward" ? "slide-forward" : "slide-backward"
              }`}
            >
              {currentView.type === "lesson_intro" && (
                <StepLessonIntro lesson={LESSONS[currentView.lessonIndex]} />
              )}
              {currentView.type === "lesson_concept" && (
                <StepConcept
                  concept={LESSONS[currentView.lessonIndex].concepts[currentView.conceptIndex]}
                  conceptIndex={currentView.conceptIndex}
                />
              )}
              {currentView.type === "lesson_quick_check" && (
                <StepQuickCheck
                  key={viewIndex}
                  data={LESSONS[currentView.lessonIndex].concepts[currentView.conceptIndex].quick_check}
                />
              )}
              {currentView.type === "lesson_review_quiz" && (
                <StepQuickCheck
                  key={viewIndex}
                  data={LESSONS[currentView.lessonIndex].exercises.review_quiz[currentView.questionIndex]}
                />
              )}
              {currentView.type === "lesson_word_sort" && (
                <StepWordSort
                  key={viewIndex}
                  data={LESSONS[currentView.lessonIndex].exercises.word_sort}
                />
              )}
            </main>

            <footer className="shrink-0 border-t border-stone-100/80 bg-white/80 backdrop-blur-sm px-6 pt-2 pb-[max(env(safe-area-inset-bottom),0.75rem)]">
              <div className="flex items-stretch gap-3">
                <button
                  onClick={goPrev}
                  disabled={!canGoBack}
                  className="shrink-0 flex items-center gap-1.5 rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-semibold text-stone-500 hover:bg-stone-50 hover:border-stone-300 disabled:opacity-20 disabled:pointer-events-none transition-all"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                  السَّابِقُ
                </button>

                {!isLast ? (
                  <button
                    onClick={goNext}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-amber-600 py-2.5 text-sm font-bold text-white hover:bg-amber-700 active:scale-[0.98] active:shadow-none transition-all duration-150 shadow-sm"
                  >
                    التَّالِي
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
                  </button>
                ) : (
                  <button
                    onClick={goHome}
                    className="flex-1 rounded-xl bg-stone-800 py-2.5 text-sm font-bold text-white hover:bg-stone-900 active:scale-[0.98] active:shadow-none transition-all duration-150 shadow-sm"
                  >
                    إِعَادَةُ الدَّرْسِ
                  </button>
                )}
              </div>
            </footer>
          </>
        )}
      </div>
    </div>
  );
}
