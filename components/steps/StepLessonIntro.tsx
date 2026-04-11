import type { Lesson } from "@/types/lesson";
import { conceptThemes } from "@/components/ui/conceptThemes";
import { RichText } from "@/components/ui/RichText";

export function StepLessonIntro({ lesson }: { lesson: Lesson }) {
  return (
    <div className="space-y-8">

      <h1 className="type-display font-bold text-heading">{lesson.title}</h1>

      <div className="rounded-2xl border border-divider bg-surface px-7 py-6 shadow-sm space-y-3">
        <p className="type-body-lg font-bold text-label">الْفِكْرَةُ الرَّئِيسِيَّةُ</p>
        <p className="type-title text-heading">
          <RichText text={lesson.introduction} />
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {lesson.concepts.map((concept, i) => {
          const theme = conceptThemes[i % conceptThemes.length];
          return (
            <div
              key={concept.type}
              className="rounded-2xl border border-divider border-t-4 border-t-primary bg-surface flex items-center justify-center py-5 px-3"
              style={{ boxShadow: "0 2px 8px var(--theme-primary-soft)" }}
            >
              <span className="type-title font-bold text-heading">
                {concept.type}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
