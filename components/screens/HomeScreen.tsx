"use client";

import Image from "next/image";
import { BOOKS, getLesson } from "@/data/course";

interface HomeScreenProps {
  onSelectLesson: (bookId: string, lessonId: string) => void;
  onOpenSettings: () => void;
}

const ARABIC_ORDINALS = [
  "الْأَوَّلُ", "الثَّانِي", "الثَّالِثُ", "الرَّابِعُ", "الْخَامِسُ",
  "السَّادِسُ", "السَّابِعُ", "الثَّامِنُ", "التَّاسِعُ", "الْعَاشِرُ",
];

const BOOK_ORDINALS = [
  "الْأَوَّلُ", "الثَّانِي", "الثَّالِثُ", "الرَّابِعُ",
];

export function HomeScreen({ onSelectLesson, onOpenSettings }: HomeScreenProps) {
  return (
    <div className="flex-1 min-h-0 overflow-y-auto">
      <div className="px-8 pt-6 pb-10 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <Image
            src="/nahw-mark.png"
            alt="نَحْو"
            width={939}
            height={751}
            priority
            className="h-10 w-auto object-contain"
          />

          <button
            type="button"
            onClick={onOpenSettings}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-divider-strong bg-surface text-muted shadow-sm transition-colors hover:bg-surface-hover hover:text-heading"
            aria-label="الإعدادات"
            title="الإعدادات"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
        </div>

        {/* Books */}
        {BOOKS.map((book, bookIdx) => (
          <section key={book.id} className="space-y-4">
            <div className="border-r-4 border-primary-hover pr-4 py-1">
              <p className="type-body font-semibold text-primary">
                الْكِتَابُ {BOOK_ORDINALS[bookIdx] ?? bookIdx + 1}
              </p>
              <h2 className="type-title font-bold text-heading">{book.subtitle}</h2>
            </div>

            <div className="space-y-2">
              {book.lessonIds.map((lessonId, lessonIdx) => {
                const lesson = getLesson(lessonId);
                if (!lesson) return null;

                return (
                  <button
                    key={lessonId}
                    onClick={() => onSelectLesson(book.id, lessonId)}
                    className="w-full flex items-center gap-4 rounded-2xl border border-primary-border bg-primary-soft px-5 py-4 text-right transition-all duration-150 hover:bg-primary-border/30 hover:shadow-sm active:scale-[0.98]"
                  >
                    <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center shrink-0">
                      <span className="type-body font-bold text-primary-text">
                        {lessonIdx + 1}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="type-body text-muted font-semibold">
                        الدَّرْسُ {ARABIC_ORDINALS[lessonIdx] ?? lessonIdx + 1}
                      </p>
                      <p className="type-body-lg font-bold text-heading truncate">
                        {lesson.title}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        ))}

      </div>
    </div>
  );
}
