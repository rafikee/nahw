"use client";

import { useState, useMemo } from "react";
import { COURSE_INTRO, LESSONS } from "@/data/index";

/* ── Types ── */

type WordLengthRule = { length: string; examples: string[] };
type CourseIntro = typeof COURSE_INTRO;
type Lesson = (typeof LESSONS)[0];
type Concept = Lesson["concepts"][0];
type ParsedWord = Lesson["exercises"]["interactive_paragraph"]["parsing_breakdown"][0];

type View =
  | { type: "splash" }
  | { type: "course_intro" }
  | { type: "lesson_intro"; lessonIndex: number }
  | { type: "lesson_concept"; lessonIndex: number; conceptIndex: number }
  | { type: "lesson_text_questions"; lessonIndex: number }
  | { type: "lesson_word_classification"; lessonIndex: number }
  | { type: "lesson_interactive_paragraph"; lessonIndex: number };

/* ── View builder ── */

function buildViews(): View[] {
  return [
    { type: "splash" },
    { type: "course_intro" },
    ...LESSONS.flatMap((_, li) => [
      { type: "lesson_intro" as const, lessonIndex: li },
      ...LESSONS[li].concepts.map(
        (_, ci): View => ({ type: "lesson_concept", lessonIndex: li, conceptIndex: ci })
      ),
      { type: "lesson_text_questions" as const, lessonIndex: li },
      { type: "lesson_word_classification" as const, lessonIndex: li },
      { type: "lesson_interactive_paragraph" as const, lessonIndex: li },
    ]),
  ];
}

/* ── Helpers ── */

const ARABIC_ORDINALS = ["الأول", "الثاني", "الثالث", "الرابع", "الخامس", "السادس", "السابع", "الثامن", "التاسع", "العاشر"];

function getBreadcrumb(view: View): { lesson: string | null; step: string } {
  if (view.type === "course_intro") {
    return { lesson: null, step: "مقدمة الكتاب" };
  }
  const li = (view as { lessonIndex: number }).lessonIndex;
  const lesson = `الدرس ${ARABIC_ORDINALS[li] ?? li + 1}`;
  let step = "";
  if (view.type === "lesson_intro") step = "نظرة عامة";
  else if (view.type === "lesson_concept") step = LESSONS[li].concepts[view.conceptIndex].type;
  else if (view.type === "lesson_text_questions") step = "أسئلة";
  else if (view.type === "lesson_word_classification") step = "تصنيف";
  else if (view.type === "lesson_interactive_paragraph") step = "تمرين";
  return { lesson, step };
}

// Returns the 1-based index of the current view within its lesson section
// (course_intro = its own 1-step section; each lesson has N steps)
function getLessonProgress(views: View[], idx: number): { step: number; total: number } | null {
  const v = views[idx];
  if (v.type === "splash") return null;

  if (v.type === "course_intro") return { step: 1, total: 1 };

  const li = (v as { lessonIndex: number }).lessonIndex;
  const lessonViews = views.filter(
    (x) => x.type !== "splash" && x.type !== "course_intro" && (x as { lessonIndex: number }).lessonIndex === li
  );
  const posInLesson = lessonViews.findIndex((x) => x === v) + 1;
  return { step: posInLesson, total: lessonViews.length };
}

/* ── Main component ── */

export default function Home() {
  const views = useMemo(buildViews, []);
  const [viewIndex, setViewIndex] = useState(0);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [revealedWords, setRevealedWords] = useState<Set<string>>(new Set());

  const currentView = views[viewIndex];
  const isLast = viewIndex === views.length - 1;
  const canGoBack = viewIndex > 0;
  const progress = getLessonProgress(views, viewIndex);

  function goNext() {
    setDirection("forward");
    setViewIndex((i) => Math.min(i + 1, views.length - 1));
    setRevealedWords(new Set());
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  function goPrev() {
    setDirection("backward");
    setViewIndex((i) => Math.max(i - 1, 0));
    setRevealedWords(new Set());
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  function goHome() {
    setDirection("backward");
    setViewIndex(0);
    setRevealedWords(new Set());
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  function revealWord(word: string) {
    setRevealedWords((prev) => new Set(prev).add(word));
  }

  return (
    <div dir="rtl" className="min-h-screen bg-stone-50 font-arabic flex flex-col">
      {/* ── Splash ── */}
      {currentView.type === "splash" && (
        <div className="fixed inset-0 flex flex-col justify-center gap-10 px-8 bg-stone-50">
          {/* Zone 1 — greeting */}
          <div style={{ lineHeight: 1.6 }}>
            <p className="text-2xl font-semibold text-stone-500">
              مرحباً بك في
            </p>
            <h1 className="text-3xl font-bold text-stone-800">
              أساسيات النحو
            </h1>
          </div>

          {/* Zone 2 — lesson hero */}
          <div className="border-r-4 border-amber-400 pr-5" style={{ lineHeight: 1.5 }}>
            <p className="text-lg font-semibold text-amber-600 mb-3">
              درس اليوم
            </p>
            <p className="text-3xl font-bold text-stone-900">
              {LESSONS[0].title}
            </p>
          </div>

          {/* Zone 3 — CTA */}
          <button
            onClick={goNext}
            className="w-full rounded-2xl bg-amber-600 py-4 text-base font-bold text-white hover:bg-amber-700 active:scale-[0.98] transition-all duration-200 shadow-sm"
          >
            ابدأ الدرس
          </button>
        </div>
      )}

      {/* ── Steps 1+ : header + content + nav ── */}
      {currentView.type !== "splash" && (
        <>
          <header className="sticky top-0 z-10 border-b border-stone-200/80 bg-white/90 backdrop-blur-sm">
            <div className="mx-auto flex max-w-3xl items-center gap-2.5 px-6 py-4 min-w-0">
              {(() => {
                const { lesson, step } = getBreadcrumb(currentView);
                return (
                  <>
                    <button
                      onClick={goHome}
                      className="shrink-0 rounded-md bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 border border-amber-100 hover:bg-amber-100 transition-colors"
                      title="العودة إلى الصفحة الرئيسية"
                    >
                      أساسيات النحو
                    </button>
                    {lesson && (
                      <>
                        <span className="text-stone-200 select-none shrink-0">|</span>
                        <span className="shrink-0 text-sm text-stone-400">{lesson}</span>
                      </>
                    )}
                    <span className="text-stone-200 select-none shrink-0">|</span>
                    <h1 className="text-sm font-semibold text-stone-800 truncate min-w-0">
                      {step}
                    </h1>
                  </>
                );
              })()}
            </div>
          </header>

          <main
            key={viewIndex}
            className={`flex-1 mx-auto w-full max-w-3xl px-6 py-12 ${
              direction === "forward" ? "slide-forward" : "slide-backward"
            }`}
          >
            {currentView.type === "course_intro" && (
              <StepCourseIntro data={COURSE_INTRO} />
            )}
            {currentView.type === "lesson_intro" && (
              <StepLessonIntro lesson={LESSONS[currentView.lessonIndex]} concepts={LESSONS[currentView.lessonIndex].concepts} />
            )}
            {currentView.type === "lesson_concept" && (
              <StepConcept
                concept={LESSONS[currentView.lessonIndex].concepts[currentView.conceptIndex]}
                conceptIndex={currentView.conceptIndex}
              />
            )}
            {currentView.type === "lesson_text_questions" && (
              <StepTextQuestions
                questions={LESSONS[currentView.lessonIndex].exercises.text_questions}
              />
            )}
            {currentView.type === "lesson_word_classification" && (
              <StepWordClassification
                data={LESSONS[currentView.lessonIndex].exercises.word_classification_list}
              />
            )}
            {currentView.type === "lesson_interactive_paragraph" && (
              <StepInteractiveParagraph
                data={LESSONS[currentView.lessonIndex].exercises.interactive_paragraph}
                revealedWords={revealedWords}
                onReveal={revealWord}
              />
            )}
          </main>

          <footer className="border-t border-stone-100 bg-white px-6 pt-3 pb-6">
            <div className="mx-auto max-w-3xl space-y-3">
              {/* Progress dots */}
              {progress && (
                <div className="flex items-center justify-center gap-2 py-1">
                  {Array.from({ length: progress.total }, (_, i) => {
                    const stepNum = i + 1;
                    return (
                      <div
                        key={i}
                        className={`rounded-full transition-all duration-300 ${
                          stepNum === progress.step
                            ? "w-5 h-2 bg-amber-500"
                            : stepNum < progress.step
                            ? "w-2 h-2 bg-amber-300"
                            : "w-2 h-2 bg-stone-200"
                        }`}
                      />
                    );
                  })}
                </div>
              )}

              {/* Navigation row */}
              <div className="flex items-stretch gap-3">
                {/* السابق — small, secondary */}
                <button
                  onClick={goPrev}
                  disabled={!canGoBack}
                  className="shrink-0 rounded-2xl border border-stone-200 px-5 py-4 text-sm font-semibold text-stone-500 hover:bg-stone-50 hover:border-stone-300 disabled:opacity-20 disabled:pointer-events-none transition-all"
                >
                  السابق
                </button>

                {/* التالي — takes all remaining space */}
                {!isLast ? (
                  <button
                    onClick={goNext}
                    className="flex-1 rounded-2xl bg-amber-600 py-4 text-base font-bold text-white hover:bg-amber-700 active:scale-[0.98] transition-all duration-150 shadow-sm"
                  >
                    التالي
                  </button>
                ) : (
                  <button
                    onClick={goHome}
                    className="flex-1 rounded-2xl bg-stone-800 py-4 text-base font-bold text-white hover:bg-stone-900 active:scale-[0.98] transition-all duration-150 shadow-sm"
                  >
                    إعادة الدرس
                  </button>
                )}
              </div>
            </div>
          </footer>
        </>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════
   Step Views
══════════════════════════════════════════ */

/* ── Course Intro ── */

function StepCourseIntro({ data }: { data: CourseIntro }) {
  return (
    <div className="space-y-8">
      <SectionLabel>مقدمة الكتاب</SectionLabel>

      {/* Paragraphs */}
      <div className="rounded-2xl border border-stone-100 bg-white px-7 py-7 shadow-sm space-y-5">
        {data.paragraphs.map((p, i) => (
          <p key={i} className="text-lg text-stone-700 leading-[2.6]">
            {p}
          </p>
        ))}
      </div>

      {/* Word length rules */}
      <div className="space-y-4">
        <p className="text-base text-stone-500 leading-8 px-1">{data.word_length_rules_intro}</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {data.word_length_rules.map((rule: WordLengthRule, i) => (
            <div
              key={i}
              className="rounded-xl border border-stone-100 bg-white px-4 py-4 shadow-sm space-y-2"
            >
              <p className="text-xs font-semibold text-amber-700 leading-6">{rule.length}</p>
              <div className="space-y-1">
                {rule.examples.map((ex, j) => (
                  <p key={j} className="text-sm text-stone-600 leading-7">
                    {ex}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="text-sm text-stone-500 leading-7 px-1">{data.conclusion}</p>
      </div>
    </div>
  );
}

/* ── Lesson Intro (overview cards) ── */

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

function StepLessonIntro({ lesson, concepts }: { lesson: Lesson; concepts: Concept[] }) {
  return (
    <div className="space-y-6">
      <SectionLabel>المقدمة</SectionLabel>
      <p className="text-sm leading-8 text-stone-400 px-1">{lesson.introduction}</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {concepts.map((concept, i) => {
          const theme = conceptThemes[i % conceptThemes.length];
          return (
            <div
              key={concept.type}
              className={`relative rounded-2xl border ${theme.border} ${theme.bg} p-6 space-y-5 overflow-hidden`}
            >
              <span
                className={`absolute -bottom-5 -left-2 text-[6.5rem] font-black select-none leading-none pointer-events-none ${theme.watermark}`}
                aria-hidden
              >
                {concept.type}
              </span>
              <div className={`w-9 h-9 ${theme.iconColor}`}>{theme.icon}</div>
              <span className={`inline-flex items-center rounded-xl border px-3 py-1.5 text-2xl font-bold ${theme.badgeBg}`}>
                {concept.type}
              </span>
              <p className="text-sm leading-7 text-stone-600 relative z-10">
                {concept.definition}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Concept deep-dive ── */

function StepConcept({ concept, conceptIndex }: { concept: Concept; conceptIndex: number }) {
  const theme = conceptThemes[conceptIndex % conceptThemes.length];
  return (
    <div className="space-y-6">
      <SectionLabel>النوع</SectionLabel>

      <div className={`flex items-center gap-5 rounded-2xl border ${theme.border} ${theme.bg} px-6 py-5`}>
        <span className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl border text-3xl font-bold shadow-sm shrink-0 ${theme.badgeBg}`}>
          {concept.type}
        </span>
        <div className={`w-8 h-8 shrink-0 ${theme.iconColor}`}>{theme.icon}</div>
      </div>

      <div className="rounded-2xl border border-stone-100 bg-white px-7 py-6 shadow-sm space-y-1">
        <p className="text-xs font-medium text-stone-400">التعريف</p>
        <p className="text-lg leading-[2.6] text-stone-700">{concept.definition}</p>
      </div>

      <div className="rounded-2xl border border-stone-100 bg-white px-7 py-6 shadow-sm space-y-4">
        <p className="text-xs font-medium text-stone-400">أمثلة</p>
        <div className="flex flex-wrap gap-2">
          {concept.examples.map((ex) => (
            <span
              key={ex}
              className="rounded-xl bg-stone-50 border border-stone-100 px-4 py-2 text-lg font-semibold text-stone-800"
            >
              {ex}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Text Questions ── */

function StepTextQuestions({ questions }: { questions: string[] }) {
  return (
    <div className="space-y-6">
      <SectionLabel>أسئلة المراجعة</SectionLabel>
      <div className="rounded-2xl border border-stone-100 bg-white shadow-sm divide-y divide-stone-50">
        {questions.map((q, i) => (
          <div key={i} className="flex items-start gap-4 px-7 py-5">
            <span className="shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-50 border border-amber-100 text-xs font-bold text-amber-700 mt-0.5">
              {i + 1}
            </span>
            <p className="text-base leading-[2.4] text-stone-700">{q}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Word Classification ── */

function StepWordClassification({
  data,
}: {
  data: Lesson["exercises"]["word_classification_list"];
}) {
  const [highlighted, setHighlighted] = useState<Set<string>>(new Set());

  function toggle(word: string) {
    setHighlighted((prev) => {
      const next = new Set(prev);
      next.has(word) ? next.delete(word) : next.add(word);
      return next;
    });
  }

  return (
    <div className="space-y-6">
      <SectionLabel>تمرين التصنيف</SectionLabel>
      <div className="rounded-2xl border border-stone-100 bg-white shadow-sm overflow-hidden">
        <div className="px-7 py-5 border-b border-stone-50">
          <p className="text-base leading-8 text-stone-600">{data.instruction}</p>
        </div>
        <div className="px-7 py-7 flex flex-wrap gap-3">
          {data.words.map((word) => (
            <button
              key={word}
              onClick={() => toggle(word)}
              className={`rounded-xl border px-4 py-2 text-xl font-semibold transition-all duration-150 active:scale-95 ${
                highlighted.has(word)
                  ? "bg-amber-50 border-amber-300 text-amber-900"
                  : "bg-stone-50 border-stone-200 text-stone-800 hover:bg-stone-100"
              }`}
            >
              {word}
            </button>
          ))}
        </div>
        <div className="px-7 pb-5">
          <p className="text-xs text-stone-400 text-center">
            اضغط على الكلمات لتمييزها أثناء التفكير
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Interactive Paragraph ── */

const grammarTypeStyles: Record<string, string> = {
  "فِعْل": "bg-sky-100 text-sky-800 border-sky-200",
  "اسْم": "bg-amber-100 text-amber-800 border-amber-200",
  "حَرْف": "bg-violet-100 text-violet-800 border-violet-200",
};

function StepInteractiveParagraph({
  data,
  revealedWords,
  onReveal,
}: {
  data: Lesson["exercises"]["interactive_paragraph"];
  revealedWords: Set<string>;
  onReveal: (word: string) => void;
}) {
  const wordMap = new Map<string, ParsedWord>(
    data.parsing_breakdown.map((w) => [w.word, w])
  );

  const tokens = data.full_sentence.split(" ");

  return (
    <div className="space-y-6">
      <SectionLabel>التمرين التفاعلي</SectionLabel>
      <div className="rounded-2xl border border-stone-100 bg-white shadow-sm overflow-hidden">
        <div className="px-7 py-5 border-b border-stone-50">
          <p className="text-base leading-8 text-stone-600">{data.instruction}</p>
        </div>

        <div className="px-7 py-8 flex flex-wrap items-end gap-x-3 gap-y-5">
          {tokens.map((token, i) => {
            const parsed = wordMap.get(token);
            const isPunctuation = parsed?.grammar_type === "punctuation" || !parsed;
            const isRevealed = revealedWords.has(token);
            const typeStyle = parsed ? (grammarTypeStyles[parsed.grammar_type] ?? "bg-stone-100 text-stone-700 border-stone-200") : "";

            if (isPunctuation) {
              return (
                <span key={i} className="text-2xl text-stone-400 leading-none pb-2">
                  {token}
                </span>
              );
            }

            return (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <button
                  onClick={() => onReveal(token)}
                  className={`rounded-xl border px-4 py-2 text-2xl font-semibold leading-none shadow-sm transition-all duration-200 ${
                    isRevealed
                      ? `${typeStyle} cursor-default`
                      : "bg-stone-50 border-stone-200 text-stone-800 hover:bg-amber-50 hover:border-amber-200 active:scale-95 cursor-pointer"
                  }`}
                >
                  {token}
                </button>
                {isRevealed && parsed && (
                  <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${typeStyle}`}>
                    {parsed.grammar_type}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <div className="px-7 pb-6">
          <div className="flex flex-wrap gap-3 justify-center">
            {Object.entries(grammarTypeStyles).map(([label, style]) => (
              <span key={label} className={`rounded-full border px-3 py-1 text-sm font-semibold ${style}`}>
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Shared ── */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-widest text-stone-400">
      {children}
    </p>
  );
}
