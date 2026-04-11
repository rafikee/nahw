"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { LESSONS } from "@/data/index";
import { StepLessonIntro } from "@/components/steps/StepLessonIntro";
import { StepConcept } from "@/components/steps/StepConcept";
import { StepQuickCheck } from "@/components/steps/StepQuickCheck";
import { StepWordSort } from "@/components/steps/StepWordSort";
import { THEMES, ThemePicker, applyTheme, getStoredTheme, type ThemeId } from "@/components/ui/ThemePicker";

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
  const views = useMemo(() => buildViews(), []);
  const [viewIndex, setViewIndex] = useState(0);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [theme, setTheme] = useState<ThemeId>(() => getStoredTheme());

  const currentView = views[viewIndex];
  const isLast = viewIndex === views.length - 1;
  const canGoBack = viewIndex > 0;
  const progress = getLessonProgress(views, viewIndex);
  const activeTheme = THEMES.find((option) => option.id === theme) ?? THEMES[0];

  const goNext = useCallback(() => {
    setDirection("forward");
    setViewIndex((i) => Math.min(i + 1, views.length - 1));
  }, [views.length]);

  const goPrev = useCallback(() => {
    setDirection("backward");
    setViewIndex((i) => Math.max(i - 1, 0));
  }, []);

  const goHome = useCallback(() => {
    setDirection("backward");
    setViewIndex(0);
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setSettingsOpen(false);
        return;
      }
      if (settingsOpen) return;
      if (e.key === "ArrowLeft") goNext();
      if (e.key === "ArrowRight") goPrev();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goNext, goPrev, settingsOpen]);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  function handleThemeChange(nextTheme: ThemeId) {
    setTheme(nextTheme);
    applyTheme(nextTheme);
  }

  return (
    <div dir="rtl" className="relative h-dvh font-arabic flex flex-col lg:items-center lg:justify-center bg-page lg:bg-page-outer/60 overflow-hidden">
      {settingsOpen && (
        <div
          className="overlay-fade fixed inset-0 z-40 bg-overlay backdrop-blur-[2px]"
          onClick={() => setSettingsOpen(false)}
          aria-hidden="true"
        >
          <div
            className="sheet-enter fixed inset-x-0 bottom-0 mx-auto w-full max-w-[520px] rounded-t-[2rem] border border-b-0 border-divider-strong bg-elevated px-5 pb-[max(env(safe-area-inset-bottom),1.25rem)] pt-3 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="الإعدادات"
          >
            <div className="mx-auto mb-4 h-1.5 w-14 rounded-full bg-divider-strong" />
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="type-body font-semibold text-faint">الإِعْدَادَاتُ</p>
                <h2 className="mt-1 type-title font-bold text-heading">اللَّوْنُ</h2>
                <p className="mt-2 type-body text-muted">غَيِّرْ لَوْنَ التَّطْبِيقِ وَشَاهِدِ النَّتِيجَةَ مُبَاشَرَةً</p>
              </div>
              <button
                type="button"
                onClick={() => setSettingsOpen(false)}
                className="rounded-xl border border-divider-strong px-3 py-2 type-body font-semibold text-muted transition-colors hover:bg-surface-hover hover:text-heading"
              >
                إِغْلَاقٌ
              </button>
            </div>

            <div className="rounded-2xl border border-divider bg-page px-4 py-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="type-body font-semibold text-label">المِظْهَرُ</p>
                  <p className="type-body text-faint">هٰذِهِ هِيَ الإِعْدَادَاتُ الْمُتَاحَةُ حَالِيًّا</p>
                </div>
                <div className="rounded-full bg-primary-soft px-3 py-1.5 type-body font-semibold text-primary-text">
                  {activeTheme.label}
                </div>
              </div>
              <ThemePicker currentTheme={theme} onChange={handleThemeChange} />
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 min-h-0 flex flex-col w-full lg:flex-none lg:w-[520px] lg:h-[88vh] lg:rounded-3xl lg:shadow-2xl lg:overflow-hidden bg-page">

        {/* ── Splash ── */}
        {currentView.type === "splash" && (
          <div className="flex-1 flex flex-col justify-center gap-10 px-8">
            <div className="flex items-center justify-between">
              <div className="rounded-full bg-primary-soft px-3 py-1 type-body-lg font-semibold text-primary-text">
                أَسَاسِيَّاتُ النَّحْوِ
              </div>
              <button
                type="button"
                onClick={() => setSettingsOpen(true)}
                className="flex h-11 items-center gap-2 rounded-2xl border border-divider-strong bg-surface px-3 type-body-lg font-semibold text-muted shadow-sm transition-colors hover:bg-surface-hover hover:text-heading"
                aria-label="الإعدادات"
                title="الإعدادات"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3v3" />
                  <path d="M12 18v3" />
                  <path d="M3 12h3" />
                  <path d="M18 12h3" />
                  <path d="m5.64 5.64 2.12 2.12" />
                  <path d="m16.24 16.24 2.12 2.12" />
                  <path d="m5.64 18.36 2.12-2.12" />
                  <path d="m16.24 7.76 2.12-2.12" />
                  <circle cx="12" cy="12" r="3.5" />
                </svg>
                الإِعْدَادَاتُ
              </button>
            </div>

            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary-soft flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                  </svg>
                </div>
                <p className="type-body-lg font-semibold text-muted">مَرْحَبًا بِكَ فِي</p>
              </div>
              <h1 className="type-display font-bold text-heading">أَسَاسِيَّاتُ النَّحْوِ</h1>
            </div>

            <div className="relative border-r-4 border-primary-hover pr-5 bg-primary-soft/60 rounded-l-xl py-4 pl-4">
              <p className="type-body-lg font-semibold text-primary mb-2">دَرْسُ الْيَوْمِ</p>
              <p className="type-display font-bold text-heading">{LESSONS[0].title}</p>
            </div>

            <button
              onClick={goNext}
              className="relative w-full flex items-center justify-center gap-3 rounded-2xl bg-primary-hover py-4 type-body-lg font-bold text-on-primary hover:bg-primary active:scale-[0.98] active:shadow-none transition-all duration-200 shadow-sm"
            >
              ابْدَأِ الدَّرْسَ
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
            </button>

          </div>
        )}

        {/* ── Steps: header + content + nav ── */}
        {currentView.type !== "splash" && (
          <>
            <header className="shrink-0 bg-elevated-strong backdrop-blur-sm">
              <div className="flex items-center gap-2.5 px-6 py-3.5 min-w-0">
                {(() => {
                  const { lesson, step } = getBreadcrumb(currentView);
                  return (
                    <>
                      <button
                        onClick={goHome}
                        className="shrink-0 rounded-md bg-primary-soft px-2.5 py-1 type-body font-semibold text-primary-text border border-primary-soft hover:bg-primary-border/30 transition-colors"
                        title="الصَّفْحَةُ الرَّئِيسِيَّةُ"
                      >
                        أَسَاسِيَّاتُ النَّحْوِ
                      </button>
                      {lesson && (
                        <>
                          <svg className="w-3 h-3 text-faint shrink-0 rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                          <span className="shrink-0 type-body text-faint">{lesson}</span>
                        </>
                      )}
                      <svg className="w-3 h-3 text-faint shrink-0 rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                      <h1 className="type-body font-semibold text-heading truncate min-w-0">{step}</h1>
                      <button
                        type="button"
                        onClick={() => setSettingsOpen(true)}
                        className="mr-auto shrink-0 rounded-xl border border-divider-strong bg-surface px-2.5 py-1.5 text-muted transition-colors hover:bg-surface-hover hover:text-heading"
                        aria-label="الإعدادات"
                        title="الإعدادات"
                      >
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 3v3" />
                          <path d="M12 18v3" />
                          <path d="M3 12h3" />
                          <path d="M18 12h3" />
                          <path d="m5.64 5.64 2.12 2.12" />
                          <path d="m16.24 16.24 2.12 2.12" />
                          <path d="m5.64 18.36 2.12-2.12" />
                          <path d="m16.24 7.76 2.12-2.12" />
                          <circle cx="12" cy="12" r="3.5" />
                        </svg>
                      </button>
                    </>
                  );
                })()}
              </div>
              <div className="h-1.5 bg-track overflow-hidden">
                {progress && (
                  <div
                    className="h-full rounded-full transition-all duration-300 ease-out"
                    style={{
                      width: `${(progress.step / progress.total) * 100}%`,
                      background: "var(--theme-primary-hover)",
                    }}
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

            <footer className="shrink-0 border-t border-divider/80 bg-elevated-muted backdrop-blur-sm px-4 py-1.5 pb-[max(env(safe-area-inset-bottom),0.5rem)]">
              <div className="flex items-stretch gap-2">
                <button
                  onClick={goPrev}
                  disabled={!canGoBack}
                  className="shrink-0 flex items-center gap-1.5 rounded-lg border border-divider-strong px-3 py-1.5 type-compact font-semibold text-muted hover:bg-surface-hover hover:border-divider-strong disabled:opacity-20 disabled:pointer-events-none transition-all"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                  السَّابِقُ
                </button>

                {!isLast ? (
                  <button
                    onClick={goNext}
                    className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-primary-hover py-1.5 type-compact font-bold text-on-primary hover:bg-primary active:scale-[0.98] active:shadow-none transition-all duration-150 shadow-sm"
                  >
                    التَّالِي
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
                  </button>
                ) : (
                  <button
                    onClick={goHome}
                    className="flex-1 rounded-lg bg-primary-hover py-1.5 type-compact font-bold text-on-primary hover:bg-primary active:scale-[0.98] active:shadow-none transition-all duration-150 shadow-sm"
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
