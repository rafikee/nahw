import type { Lesson } from "@/types/lesson";
import lesson1Data from "./lesson_1.json";
import lesson2Data from "./lesson_2.json";
import lesson3Data from "./lesson_3.json";
import lesson4Data from "./lesson_4.json";

export const LESSONS = [lesson1Data, lesson2Data, lesson3Data, lesson4Data] as unknown as Lesson[];
