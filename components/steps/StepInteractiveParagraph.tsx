import type { InteractiveParagraph, GrammarType } from "@/types/lesson";

const grammarTypeStyles: Record<GrammarType, string> = {
  "فِعْل": "bg-sky-100 text-sky-800 border-sky-200",
  "اسْم": "bg-amber-100 text-amber-800 border-amber-200",
  "حَرْف": "bg-violet-100 text-violet-800 border-violet-200",
  "punctuation": "",
};

type Props = {
  data: InteractiveParagraph;
  revealedIndices: Set<number>;
  onReveal: (index: number) => void;
};

export function StepInteractiveParagraph({ data, revealedIndices, onReveal }: Props) {
  return (
    <div className="space-y-8">

      {/* ── Page title ── */}
      <h1 className="text-2xl font-bold text-stone-900 leading-[1.8]">التمرين التفاعلي</h1>

      <div className="rounded-2xl border border-stone-100 bg-white shadow-sm overflow-hidden">
        <div className="px-7 py-5 border-b border-stone-100">
          <p className="text-lg leading-[2.6] text-stone-600">{data.instruction}</p>
        </div>

        <div className="px-7 py-8 flex flex-wrap items-end gap-x-3 gap-y-5">
          {data.parsing_breakdown.map((parsed, i) => {
            const isPunctuation = parsed.grammar_type === "punctuation";
            const isRevealed = revealedIndices.has(i);
            const typeStyle = grammarTypeStyles[parsed.grammar_type] ?? "bg-stone-100 text-stone-700 border-stone-200";

            if (isPunctuation) {
              return (
                <span key={i} className="text-2xl text-stone-400 leading-none pb-2">
                  {parsed.word}
                </span>
              );
            }

            return (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <button
                  onClick={() => onReveal(i)}
                  disabled={isRevealed}
                  className={`rounded-xl border px-4 py-2 text-2xl font-semibold leading-none shadow-sm transition-all duration-200 ${
                    isRevealed
                      ? `${typeStyle} cursor-default`
                      : "bg-stone-50 border-stone-200 text-stone-800 hover:bg-amber-50 hover:border-amber-200 active:scale-95 cursor-pointer"
                  }`}
                >
                  {parsed.word}
                </button>
                {isRevealed && (
                  <span className={`rounded-full border px-2.5 py-0.5 text-sm font-semibold ${typeStyle}`}>
                    {parsed.grammar_type}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <div className="px-7 pb-6">
          <div className="flex flex-wrap gap-3 justify-center">
            {(["فِعْل", "اسْم", "حَرْف"] as const).map((label) => (
              <span key={label} className={`rounded-full border px-3 py-1 text-base font-semibold ${grammarTypeStyles[label]}`}>
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
