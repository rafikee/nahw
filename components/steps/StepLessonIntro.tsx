import type { Lesson, Concept } from "@/types/lesson";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { conceptThemes } from "@/components/ui/conceptThemes";

export function StepLessonIntro({ lesson, concepts }: { lesson: Lesson; concepts: Concept[] }) {
  return (
    <div className="space-y-6">
      <SectionLabel>المقدمة</SectionLabel>
      <p className="text-sm leading-8 text-stone-400 px-1">{lesson.introduction}</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {concepts.map((concept, i) => {
          const theme = conceptThemes[i % conceptThemes.length];
          return (
            <div
              key={concept.type}
              className={`relative rounded-2xl border ${theme.border} ${theme.bg} p-6 space-y-5 overflow-hidden`}
            >
              <span
                className={`absolute -bottom-5 -left-2 text-[6.5rem] font-black select-none leading-none pointer-events-none ${theme.watermark}`}
                aria-hidden
              >
                {concept.type}
              </span>
              <div className={`w-9 h-9 ${theme.iconColor}`}>{theme.icon}</div>
              <span className={`inline-flex items-center rounded-xl border px-3 py-1.5 text-2xl font-bold ${theme.badgeBg}`}>
                {concept.type}
              </span>
              <p className="text-sm leading-7 text-stone-600 relative z-10">
                {concept.definition}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
