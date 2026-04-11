import type { Lesson } from "@/types/lesson";
import { conceptThemes } from "@/components/ui/conceptThemes";
import { RichText } from "@/components/ui/RichText";

export function StepLessonIntro({ lesson }: { lesson: Lesson }) {
  return (
    <div className="space-y-8">

      <h1 className="text-2xl font-bold text-stone-900 leading-[1.8]">{lesson.title}</h1>

      {/* Single-sentence hook as pull quote */}
      <div className="border-r-4 border-amber-400 pr-5 py-1">
        <p className="text-base font-medium text-amber-600 mb-1 flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z"/>
          </svg>
          الْفِكْرَةُ الرَّئِيسِيَّةُ
        </p>
        <p className="text-xl text-stone-800 leading-[2.4]">
          <RichText text={lesson.introduction} />
        </p>
      </div>

      {/* Concept name badges */}
      <div className="grid grid-cols-3 gap-3">
        {lesson.concepts.map((concept, i) => {
          const theme = conceptThemes[i % conceptThemes.length];
          return (
            <div
              key={concept.type}
              className={`rounded-2xl border ${theme.border} ${theme.bg} flex flex-col items-center gap-3 py-5 px-3`}
            >
              <div className={`w-7 h-7 ${theme.iconColor}`}>{theme.icon}</div>
              <span className={`inline-flex items-center justify-center rounded-xl border px-3 py-1.5 text-xl font-bold ${theme.badgeBg}`}>
                {concept.type}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
