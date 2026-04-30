"use client";

import type { Lesson } from "@/types/lesson";
import { getNextLesson, BOOKS } from "@/data/course";
import { LessonRating } from "@/components/ui/LessonRating";

interface LessonCompleteProps {
  lesson: Lesson;
  bookId: string;
  lessonId: string;
  onNextLesson: (bookId: string, lessonId: string) => void;
  onCurriculumComplete: () => void;
}

export function LessonComplete({
  lesson,
  bookId,
  lessonId,
  onNextLesson,
  onCurriculumComplete,
}: LessonCompleteProps) {
  const next = getNextLesson(bookId, lessonId);
  const nextBook = next ? BOOKS.find((b) => b.id === next.bookId) : null;
  const isNewBook = next ? next.bookId !== bookId : false;

  function handleAdvance() {
    if (next) {
      onNextLesson(next.bookId, next.lessonId);
    } else {
      onCurriculumComplete();
    }
  }

  return (
    <div className="flex-1 min-h-0 flex items-center justify-center px-6 py-10 bg-overlay">
      <div
        className="sheet-enter w-full max-w-[420px] rounded-3xl border border-divider-strong bg-elevated px-6 py-7 space-y-6 shadow-2xl text-right"
        role="dialog"
        aria-modal="true"
      >
        <LessonRating contextId={lesson.module_id} />

        {isNewBook && nextBook && (
          <p className="type-body font-semibold text-primary text-center">
            {nextBook.subtitle}
          </p>
        )}

        <button
          onClick={handleAdvance}
          className="w-full flex items-center justify-center gap-3 rounded-2xl bg-primary-hover py-4 type-body-lg font-bold text-on-primary hover:bg-primary active:scale-[0.98] transition-all duration-200 shadow-sm"
        >
          {next ? "الدَّرْسُ التَّالِي" : "تَابِعْ"}
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
      </div>
    </div>
  );
}
