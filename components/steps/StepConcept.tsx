import type { Concept } from "@/types/lesson";
import { conceptThemes } from "@/components/ui/conceptThemes";
import { RichText } from "@/components/ui/RichText";

export function StepConcept({ concept, conceptIndex }: { concept: Concept; conceptIndex: number }) {
  const theme = conceptThemes[conceptIndex % conceptThemes.length];
  return (
    <div className="space-y-6">

      <div className={`border-r-4 ${theme.accentSide} pr-5 py-2`}>
        <p className={`type-heading font-bold ${theme.text}`}>
          {concept.type}
        </p>
      </div>

      <div className="rounded-2xl border border-divider bg-surface px-7 py-6 shadow-sm space-y-2">
        <p className="type-body-lg font-bold text-label">التَّعْرِيفُ</p>
        <p className="type-title text-body">
          <RichText text={concept.definition} />
        </p>
      </div>

      <div className="rounded-2xl border border-divider bg-surface px-7 py-6 shadow-sm space-y-4">
        <p className="type-body-lg font-bold text-label">أَمْثِلَةٌ</p>
        <div className="flex flex-wrap gap-2">
          {concept.examples.map((ex) => (
            <span
              key={ex}
              className={`rounded-xl border px-4 py-2 type-title font-semibold ${theme.chipBg}`}
            >
              {ex}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
