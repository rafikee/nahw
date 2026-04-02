import type { CourseIntro, Lesson } from "@/types/lesson";
import courseIntroData from "./course_intro.json";
import lesson1Data from "./lesson_1.json";

// JSON imports widen string literals to `string`, so we cast at this boundary.
// The explicit type annotation ensures all consumers see fully-typed data.
export const COURSE_INTRO = courseIntroData as CourseIntro;
export const LESSONS = [lesson1Data] as unknown as Lesson[];
