import type { CourseIntro } from "@/types/lesson";
import { SectionLabel } from "@/components/ui/SectionLabel";

export function StepCourseIntro({ data }: { data: CourseIntro }) {
  return (
    <div className="space-y-8">
      <SectionLabel>مقدمة الكتاب</SectionLabel>

      <div className="rounded-2xl border border-stone-100 bg-white px-7 py-7 shadow-sm space-y-5">
        {data.paragraphs.map((p, i) => (
          <p key={i} className="text-lg text-stone-700 leading-[2.6]">
            {p}
          </p>
        ))}
      </div>

      <div className="space-y-4">
        <p className="text-base text-stone-500 leading-8 px-1">{data.word_length_rules_intro}</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {data.word_length_rules.map((rule, i) => (
            <div
              key={i}
              className="rounded-xl border border-stone-100 bg-white px-4 py-4 shadow-sm space-y-2"
            >
              <p className="text-xs font-semibold text-amber-700 leading-6">{rule.length}</p>
              <div className="space-y-1">
                {rule.examples.map((ex, j) => (
                  <p key={j} className="text-sm text-stone-600 leading-7">
                    {ex}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="text-sm text-stone-500 leading-7 px-1">{data.conclusion}</p>
      </div>
    </div>
  );
}
