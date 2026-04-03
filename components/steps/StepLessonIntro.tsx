import type { Lesson, Concept } from "@/types/lesson";
import { conceptThemes } from "@/components/ui/conceptThemes";
import { RichText } from "@/components/ui/RichText";

export function StepLessonIntro({ lesson, concepts }: { lesson: Lesson; concepts: Concept[] }) {
  return (
    <div className="space-y-8">

      {/* ── Page title ── */}
      <h1 className="text-2xl font-bold text-stone-900 leading-[1.8]">{lesson.title}</h1>

      {/* ── Lesson introduction ── */}
      <div className="rounded-2xl border border-stone-100 bg-white px-7 py-6 shadow-sm">
        <p className="text-lg text-stone-700 leading-[2.6]">
          <RichText text={lesson.introduction} />
        </p>
      </div>

      {/* ── Concept preview cards ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {concepts.map((concept, i) => {
          const theme = conceptThemes[i % conceptThemes.length];
          return (
            <div
              key={concept.type}
              className={`rounded-2xl border ${theme.border} ${theme.bg} p-6 space-y-5`}
            >
              <div className={`w-9 h-9 ${theme.iconColor}`}>{theme.icon}</div>
              <span className={`inline-flex items-center rounded-xl border px-3 py-1.5 text-2xl font-bold ${theme.badgeBg}`}>
                {concept.type}
              </span>
              <p className="text-lg leading-[2.4] text-stone-600 relative z-10">
                <RichText text={concept.definition} />
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
