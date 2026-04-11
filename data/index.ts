import type { Lesson } from "@/types/lesson";
import lesson1Data from "./lesson_1.json";
import lesson2Data from "./lesson_2.json";

export const LESSONS = [lesson1Data, lesson2Data] as unknown as Lesson[];
