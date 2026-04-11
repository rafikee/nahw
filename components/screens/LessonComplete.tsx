"use client";

import type { Lesson } from "@/types/lesson";
import { getNextLesson, getLesson, BOOKS } from "@/data/course";

interface LessonCompleteProps {
  lesson: Lesson;
  bookId: string;
  lessonId: string;
  onNextLesson: (bookId: string, lessonId: string) => void;
  onHome: () => void;
}

export function LessonComplete({
  lesson,
  bookId,
  lessonId,
  onNextLesson,
  onHome,
}: LessonCompleteProps) {
  const next = getNextLesson(bookId, lessonId);
  const nextLesson = next ? getLesson(next.lessonId) : null;
  const nextBook = next ? BOOKS.find((b) => b.id === next.bookId) : null;
  const isNewBook = next ? next.bookId !== bookId : false;

  return (
    <div className="flex-1 min-h-0 overflow-y-auto">
      <div className="flex flex-col items-center justify-center min-h-full px-8 py-10 text-center space-y-8">

        {/* Celebration icon */}
        <div className="w-20 h-20 rounded-3xl bg-success-soft border-2 border-success-border flex items-center justify-center">
          <svg className="w-10 h-10 text-success" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5"/>
          </svg>
        </div>

        <div className="space-y-3">
          <h1 className="type-display font-bold text-heading">أَحْسَنْتَ!</h1>
          <p className="type-body-lg text-muted">
            لَقَدْ أَتْمَمْتَ دَرْسَ
          </p>
          <p className="type-title font-bold text-heading">
            {lesson.title}
          </p>
        </div>

        <div className="w-full max-w-xs rounded-2xl border border-divider bg-surface px-6 py-5 space-y-2">
          <div className="flex justify-between type-body">
            <span className="text-muted">الْمَفَاهِيمُ</span>
            <span className="font-bold text-heading">{lesson.concepts.length}</span>
          </div>
          <div className="flex justify-between type-body">
            <span className="text-muted">الْأَسْئِلَةُ</span>
            <span className="font-bold text-heading">
              {lesson.concepts.length + lesson.exercises.review_quiz.length}
            </span>
          </div>
        </div>

        <div className="w-full space-y-3 pt-2">
          {next && nextLesson && (
            <div className="space-y-2">
              {isNewBook && nextBook && (
                <p className="type-body font-semibold text-primary">
                  {nextBook.subtitle}
                </p>
              )}
              <button
                onClick={() => onNextLesson(next.bookId, next.lessonId)}
                className="w-full flex items-center justify-center gap-3 rounded-2xl bg-primary-hover py-4 type-body-lg font-bold text-on-primary hover:bg-primary active:scale-[0.98] transition-all duration-200 shadow-sm"
              >
                الدَّرْسُ التَّالِي: {nextLesson.title}
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
              </button>
            </div>
          )}

          <button
            onClick={onHome}
            className={`w-full rounded-2xl py-4 type-body-lg font-bold transition-all duration-200 active:scale-[0.98] ${
              next
                ? "border border-divider-strong text-muted hover:bg-surface-hover hover:text-heading"
                : "bg-primary-hover text-on-primary hover:bg-primary shadow-sm"
            }`}
          >
            {next ? "قَائِمَةُ الدُّرُوسِ" : "الْعَوْدَةُ إِلَى الرَّئِيسِيَّةِ"}
          </button>
        </div>

      </div>
    </div>
  );
}
