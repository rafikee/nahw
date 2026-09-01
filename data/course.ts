import type { Lesson } from "@/types/lesson";
import { LESSONS } from "./index";

export interface LevelMeta {
  id: string;
  subtitle: string;
  lessonIds: string[];
}

export const LEVELS: LevelMeta[] = [
  {
    id: "level-1",
    subtitle: "أَسَاسِيَّاتُ النَّحْوِ",
    lessonIds: [
      "01_anwaa_al_kalimat",
      "02_aqsaam_al_fil",
      "03_al_mudhakkar_wal_muannath",
      "04_al_mufrad_wal_muthanna_wal_jam",
      "05_al_kalaam",
      "06_al_mabni_wal_murab",
      "07_anwaa_al_binaa",
      "08_al_mabni_min_al_huruf_wal_afaal",
      "09_al_asmaa_al_mabniyya",
      "10_anwaa_al_irab",
      "11_irab_al_muthanna_wal_jam",
      "12_irab_al_fil_al_mutall",
    ],
  },
];

const LESSON_MAP = new Map<string, Lesson>(
  LESSONS.map((l) => [l.module_id, l])
);

export function getLesson(id: string): Lesson | undefined {
  return LESSON_MAP.get(id);
}

export function getLevel(id: string): LevelMeta | undefined {
  return LEVELS.find((l) => l.id === id);
}

export function getNextLesson(
  levelId: string,
  lessonId: string
): { levelId: string; lessonId: string } | null {
  const levelIndex = LEVELS.findIndex((l) => l.id === levelId);
  if (levelIndex === -1) return null;

  const level = LEVELS[levelIndex];
  const lessonIndex = level.lessonIds.indexOf(lessonId);

  if (lessonIndex < level.lessonIds.length - 1) {
    return { levelId, lessonId: level.lessonIds[lessonIndex + 1] };
  }

  if (levelIndex < LEVELS.length - 1) {
    const nextLevel = LEVELS[levelIndex + 1];
    return { levelId: nextLevel.id, lessonId: nextLevel.lessonIds[0] };
  }

  return null;
}

export function getLessonNumber(levelId: string, lessonId: string): number {
  const level = LEVELS.find((l) => l.id === levelId);
  if (!level) return 0;
  return level.lessonIds.indexOf(lessonId) + 1;
}
