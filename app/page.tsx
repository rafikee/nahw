"use client";

import { useState, useEffect, useCallback } from "react";
import { BOOKS, getLesson, getLessonNumber, getNextLesson } from "@/data/course";
import { HomeScreen } from "@/components/screens/HomeScreen";
import { LessonPlayer } from "@/components/screens/LessonPlayer";
import { LessonComplete } from "@/components/screens/LessonComplete";
import { OnboardingFlow } from "@/components/screens/OnboardingFlow";
import { CurriculumComplete } from "@/components/screens/CurriculumComplete";

/* ── Navigation state ── */

type AppScreen =
  | { screen: "welcome" }
  | { screen: "home" }
  | { screen: "lesson"; bookId: string; lessonId: string }
  | { screen: "lesson_complete"; bookId: string; lessonId: string }
  | { screen: "curriculum_complete" };

const RATED_LESSONS_KEY = "nahw-lessons-rated";

function getRatedLessons(): Set<string> {
  try {
    const raw = window.localStorage.getItem(RATED_LESSONS_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return new Set(parsed.filter((s) => typeof s === "string"));
  } catch {
    /* ignore */
  }
  return new Set();
}

function markLessonRated(lessonId: string) {
  try {
    const set = getRatedLessons();
    set.add(lessonId);
    window.localStorage.setItem(RATED_LESSONS_KEY, JSON.stringify([...set]));
  } catch {
    /* ignore */
  }
}

function allCurriculumQuestionsAnswered(): boolean {
  try {
    return (
      !!window.localStorage.getItem("nahw-subscribed") &&
      !!window.localStorage.getItem("nahw-pmf-answered") &&
      !!window.localStorage.getItem("nahw-learned-new-answered")
    );
  } catch {
    return false;
  }
}

export default function Home() {
  const [nav, setNav] = useState<AppScreen>({ screen: "welcome" });
  const [settingsOpen, setSettingsOpen] = useState(false);

  const goHome = useCallback(() => setNav({ screen: "home" }), []);

  const dismissWelcome = useCallback(() => setNav({ screen: "home" }), []);

  const goToWelcome = useCallback(() => {
    setSettingsOpen(false);
    setNav({ screen: "welcome" });
  }, []);

  const goToLesson = useCallback((bookId: string, lessonId: string) => {
    setNav({ screen: "lesson", bookId, lessonId });
  }, []);

  const goToCurriculumComplete = useCallback(() => {
    if (allCurriculumQuestionsAnswered()) {
      setNav({ screen: "home" });
      return;
    }
    setNav({ screen: "curriculum_complete" });
  }, []);

  const goToComplete = useCallback(
    (bookId: string, lessonId: string) => {
      // Skip the rating dialog if this lesson was already rated.
      if (getRatedLessons().has(lessonId)) {
        const next = getNextLesson(bookId, lessonId);
        if (next) {
          setNav({ screen: "lesson", bookId: next.bookId, lessonId: next.lessonId });
        } else {
          goToCurriculumComplete();
        }
        return;
      }
      markLessonRated(lessonId);
      setNav({ screen: "lesson_complete", bookId, lessonId });
    },
    [goToCurriculumComplete]
  );

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setSettingsOpen(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const openSettings = useCallback(() => setSettingsOpen(true), []);

  /* ── Resolve current lesson data ── */
  const inLesson = nav.screen === "lesson" || nav.screen === "lesson_complete";
  const lesson = inLesson ? getLesson(nav.lessonId) : null;
  const book = inLesson ? BOOKS.find((b) => b.id === nav.bookId) : null;
  const lessonNumber = inLesson && book ? getLessonNumber(nav.bookId, nav.lessonId) : 0;

  return (
    <div dir="rtl" className="relative h-dvh font-arabic flex flex-col lg:items-center lg:justify-center bg-page lg:bg-page-outer/60 overflow-hidden">
      {/* ── Settings sheet ── */}
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
                <h2 className="type-title font-bold text-heading">الإِعْدَادَاتُ</h2>
                <p className="mt-1 type-body text-muted">نُسْخَةٌ تَجْرِيبِيَّةٌ · v0.3.0</p>
              </div>
              <button
                type="button"
                onClick={() => setSettingsOpen(false)}
                className="rounded-xl border border-divider-strong px-3 py-2 type-body font-semibold text-muted transition-colors hover:bg-surface-hover hover:text-heading"
              >
                إِغْلَاقٌ
              </button>
            </div>

            <button
              type="button"
              onClick={goToWelcome}
              className="w-full rounded-2xl border border-divider-strong bg-surface px-4 py-3 type-body font-semibold text-label transition-colors hover:bg-surface-hover hover:text-heading"
            >
              شَاهِدِ الْمُقَدِّمَةَ مَرَّةً أُخْرَى
            </button>
          </div>
        </div>
      )}

      {/* ── App shell ── */}
      <div className="flex-1 min-h-0 flex flex-col w-full lg:flex-none lg:w-[520px] lg:h-[88vh] lg:rounded-3xl lg:shadow-2xl lg:overflow-hidden bg-page">

        {nav.screen === "welcome" && (
          <OnboardingFlow onComplete={dismissWelcome} />
        )}

        {nav.screen === "home" && (
          <HomeScreen
            onSelectLesson={goToLesson}
            onOpenSettings={openSettings}
          />
        )}

        {nav.screen === "lesson" && lesson && book && (
          <LessonPlayer
            key={nav.lessonId}
            lesson={lesson}
            lessonNumber={lessonNumber}
            bookSubtitle={book.subtitle}
            onComplete={() => goToComplete(nav.bookId, nav.lessonId)}
            onHome={goHome}
            onOpenSettings={openSettings}
          />
        )}

        {nav.screen === "lesson_complete" && lesson && (
          <LessonComplete
            lesson={lesson}
            bookId={nav.bookId}
            lessonId={nav.lessonId}
            onNextLesson={goToLesson}
            onCurriculumComplete={goToCurriculumComplete}
          />
        )}

        {nav.screen === "curriculum_complete" && (
          <CurriculumComplete onDone={goHome} />
        )}

      </div>
    </div>
  );
}
