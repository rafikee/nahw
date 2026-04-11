"use client";

import { useState, useEffect, useCallback } from "react";
import { BOOKS, getLesson, getLessonNumber } from "@/data/course";
import { HomeScreen } from "@/components/screens/HomeScreen";
import { LessonPlayer } from "@/components/screens/LessonPlayer";
import { LessonComplete } from "@/components/screens/LessonComplete";
import { THEMES, ThemePicker, applyTheme, getStoredTheme, type ThemeId } from "@/components/ui/ThemePicker";

/* ── Navigation state ── */

type AppScreen =
  | { screen: "home" }
  | { screen: "lesson"; bookId: string; lessonId: string }
  | { screen: "lesson_complete"; bookId: string; lessonId: string };

export default function Home() {
  const [nav, setNav] = useState<AppScreen>({ screen: "home" });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [theme, setTheme] = useState<ThemeId>(() => getStoredTheme());

  const activeTheme = THEMES.find((option) => option.id === theme) ?? THEMES[0];

  const goHome = useCallback(() => setNav({ screen: "home" }), []);

  const goToLesson = useCallback((bookId: string, lessonId: string) => {
    setNav({ screen: "lesson", bookId, lessonId });
  }, []);

  const goToComplete = useCallback((bookId: string, lessonId: string) => {
    setNav({ screen: "lesson_complete", bookId, lessonId });
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setSettingsOpen(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  function handleThemeChange(nextTheme: ThemeId) {
    setTheme(nextTheme);
    applyTheme(nextTheme);
  }

  const openSettings = useCallback(() => setSettingsOpen(true), []);

  /* ── Resolve current lesson data ── */
  const lesson = nav.screen !== "home" ? getLesson(nav.lessonId) : null;
  const book = nav.screen !== "home" ? BOOKS.find((b) => b.id === nav.bookId) : null;
  const lessonNumber = nav.screen !== "home" && book ? getLessonNumber(nav.bookId, nav.lessonId) : 0;

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

      {/* ── App shell ── */}
      <div className="flex-1 min-h-0 flex flex-col w-full lg:flex-none lg:w-[520px] lg:h-[88vh] lg:rounded-3xl lg:shadow-2xl lg:overflow-hidden bg-page">

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
            onHome={goHome}
          />
        )}

      </div>
    </div>
  );
}
