import type { Lesson } from "@/types/lesson";
import { LESSONS } from "./index";

export interface BookMeta {
  id: string;
  title: string;
  subtitle: string;
  lessonIds: string[];
}

export const BOOKS: BookMeta[] = [
  {
    id: "book-1",
    title: "الْجُزْءُ الْأَوَّلُ",
    subtitle: "أَسَاسِيَّاتُ النَّحْوِ",
    lessonIds: ["01_anwaa_al_kalimat", "02_aqsaam_al_fil", "03_al_mudhakkar_wal_muannath", "04_al_mufrad_wal_muthanna_wal_jam"],
  },
];

const LESSON_MAP = new Map<string, Lesson>(
  LESSONS.map((l) => [l.module_id, l])
);

export function getLesson(id: string): Lesson | undefined {
  return LESSON_MAP.get(id);
}

export function getNextLesson(
  bookId: string,
  lessonId: string
): { bookId: string; lessonId: string } | null {
  const bookIndex = BOOKS.findIndex((b) => b.id === bookId);
  if (bookIndex === -1) return null;

  const book = BOOKS[bookIndex];
  const lessonIndex = book.lessonIds.indexOf(lessonId);

  if (lessonIndex < book.lessonIds.length - 1) {
    return { bookId, lessonId: book.lessonIds[lessonIndex + 1] };
  }

  if (bookIndex < BOOKS.length - 1) {
    const nextBook = BOOKS[bookIndex + 1];
    return { bookId: nextBook.id, lessonId: nextBook.lessonIds[0] };
  }

  return null;
}

export function getLessonNumber(bookId: string, lessonId: string): number {
  const book = BOOKS.find((b) => b.id === bookId);
  if (!book) return 0;
  return book.lessonIds.indexOf(lessonId) + 1;
}
