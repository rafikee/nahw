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
            className="flex h-11 items-center gap-2 rounded-2xl border border-divider-strong bg-surface px-3 type-body-lg font-semibold text-muted shadow-sm transition-colors hover:bg-surface-hover hover:text-heading"
            aria-label="الإعدادات"
            title="الإعدادات"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3v3" /><path d="M12 18v3" /><path d="M3 12h3" /><path d="M18 12h3" />
              <path d="m5.64 5.64 2.12 2.12" /><path d="m16.24 16.24 2.12 2.12" />
              <path d="m5.64 18.36 2.12-2.12" /><path d="m16.24 7.76 2.12-2.12" />
              <circle cx="12" cy="12" r="3.5" />
            </svg>
            الإِعْدَادَاتُ
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
                    className="w-full flex items-center gap-4 rounded-2xl border border-divider bg-surface px-5 py-4 text-right transition-all duration-150 hover:bg-surface-hover hover:border-divider-strong hover:shadow-sm active:scale-[0.98]"
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary-soft flex items-center justify-center shrink-0">
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
