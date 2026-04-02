import type { CourseIntro } from "@/types/lesson";
import { RichText } from "@/components/ui/RichText";

const ARABIC_NUMERALS = ["١", "٢", "٣", "٤", "٥", "٦", "٧"];

// Progressively deepening amber backgrounds for the 7 cards
const CARD_BG = [
  "bg-amber-50",
  "bg-amber-50",
  "bg-amber-100/70",
  "bg-amber-100/70",
  "bg-amber-100",
  "bg-amber-200/60",
  "bg-amber-200/60",
];

function isQuranic(example: string): boolean {
  return example.includes("﴿") || example.includes("﴾");
}

export function StepCourseIntro({ data }: { data: CourseIntro }) {
  const [pullQuote, ...bodyParagraphs] = data.paragraphs;

  return (
    <div className="space-y-8">

      {/* ── Page title ── */}
      <h1 className="text-2xl font-bold text-stone-900 leading-[1.8]">{data.title}</h1>

      {/* ── Pull-quote (para 1) ── */}
      <div className="border-r-4 border-amber-400 pr-5 py-1">
        <p className="text-xl text-stone-800 leading-[2.4]">
          <RichText text={pullQuote} />
        </p>
      </div>

      {/* ── Supporting paragraphs (paras 2 & 3) ── */}
      <div className="rounded-2xl border border-stone-100 bg-white px-6 py-6 shadow-sm space-y-4">
        {bodyParagraphs.map((p, i) => (
          <p key={i} className="text-lg text-stone-600 leading-[2.6]">
            <RichText text={p} />
          </p>
        ))}
      </div>

      {/* ── Word-length rules ── */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-stone-800 leading-8 px-1">{data.word_length_rules_intro}</h2>

        <div className="flex flex-col gap-3">
          {data.word_length_rules.map((rule, i) => (
            <div
              key={i}
              className={`rounded-xl border border-amber-200/60 ${CARD_BG[i] ?? "bg-amber-50"} px-5 py-4 shadow-sm flex items-center gap-5`}
            >
              {/* Number badge */}
              <span className="text-3xl font-bold text-amber-400/70 leading-none tabular-nums shrink-0 w-8 text-center">
                {ARABIC_NUMERALS[i]}
              </span>

              {/* Divider */}
              <div className="w-px self-stretch bg-amber-200/60 shrink-0" />

              {/* Label + examples */}
              <div className="flex-1 space-y-2">
                <p className="text-base font-semibold text-amber-800 leading-7">{rule.length}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  {rule.examples.map((ex, j) =>
                    isQuranic(ex) ? (
                      <p
                        key={j}
                        className="text-base text-amber-900/70 leading-8 bg-amber-100/80 rounded-md px-2 py-0.5"
                      >
                        {ex}
                      </p>
                    ) : (
                      <p key={j} className="text-lg text-stone-700 leading-9">
                        {ex}
                      </p>
                    )
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Conclusion ── */}
        <div className="text-center">
          <p className="text-xl font-semibold text-stone-700 leading-[2.2]">{data.conclusion}</p>
        </div>
      </div>
    </div>
  );
}
