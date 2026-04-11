import type { Concept } from "@/types/lesson";
import { conceptThemes } from "@/components/ui/conceptThemes";
import { RichText } from "@/components/ui/RichText";

export function StepConcept({ concept, conceptIndex }: { concept: Concept; conceptIndex: number }) {
  const theme = conceptThemes[conceptIndex % conceptThemes.length];
  return (
    <div className="space-y-6">

      <div className={`flex items-center gap-5 rounded-2xl border ${theme.border} ${theme.bg} px-6 py-5`}>
        <span className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl border text-3xl font-bold shadow-sm shrink-0 ${theme.badgeBg}`}>
          {concept.type}
        </span>
        <div className={`w-8 h-8 shrink-0 ${theme.iconColor}`}>{theme.icon}</div>
      </div>

      <div className="rounded-2xl border border-stone-100 bg-white px-7 py-6 shadow-sm space-y-2">
        <p className="text-sm font-semibold text-stone-400">التَّعْرِيفُ</p>
        <p className="text-lg leading-[2.6] text-stone-700">
          <RichText text={concept.definition} />
        </p>
      </div>

      <div className="rounded-2xl border border-stone-100 bg-white px-7 py-6 shadow-sm space-y-4">
        <p className="text-sm font-semibold text-stone-400">أَمْثِلَةٌ</p>
        <div className="flex flex-wrap gap-2">
          {concept.examples.map((ex) => (
            <span
              key={ex}
              className="rounded-xl bg-stone-50 border border-stone-100 px-4 py-2 text-lg font-semibold text-stone-800"
            >
              {ex}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
