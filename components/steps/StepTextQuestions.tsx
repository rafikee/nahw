import { SectionLabel } from "@/components/ui/SectionLabel";

export function StepTextQuestions({ questions }: { questions: string[] }) {
  return (
    <div className="space-y-6">
      <SectionLabel>أسئلة المراجعة</SectionLabel>
      <div className="rounded-2xl border border-stone-100 bg-white shadow-sm divide-y divide-stone-50">
        {questions.map((q, i) => (
          <div key={i} className="flex items-start gap-4 px-7 py-5">
            <span className="shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-50 border border-amber-100 text-xs font-bold text-amber-700 mt-0.5">
              {i + 1}
            </span>
            <p className="text-base leading-[2.4] text-stone-700">{q}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
