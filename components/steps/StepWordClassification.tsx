"use client";

import { useState } from "react";
import type { Exercises } from "@/types/lesson";
import { SectionLabel } from "@/components/ui/SectionLabel";

type Props = {
  data: Exercises["word_classification_list"];
};

export function StepWordClassification({ data }: Props) {
  const [highlighted, setHighlighted] = useState<Set<string>>(new Set());

  function toggle(word: string) {
    setHighlighted((prev) => {
      const next = new Set(prev);
      next.has(word) ? next.delete(word) : next.add(word);
      return next;
    });
  }

  return (
    <div className="space-y-6">
      <SectionLabel>تمرين التصنيف</SectionLabel>
      <div className="rounded-2xl border border-stone-100 bg-white shadow-sm overflow-hidden">
        <div className="px-7 py-5 border-b border-stone-50">
          <p className="text-base leading-8 text-stone-600">{data.instruction}</p>
        </div>
        <div className="px-7 py-7 flex flex-wrap gap-3">
          {data.words.map((word) => (
            <button
              key={word}
              onClick={() => toggle(word)}
              className={`rounded-xl border px-4 py-2 text-xl font-semibold transition-all duration-150 active:scale-95 ${
                highlighted.has(word)
                  ? "bg-amber-50 border-amber-300 text-amber-900"
                  : "bg-stone-50 border-stone-200 text-stone-800 hover:bg-stone-100"
              }`}
            >
              {word}
            </button>
          ))}
        </div>
        <div className="px-7 pb-5">
          <p className="text-xs text-stone-400 text-center">
            اضغط على الكلمات لتمييزها أثناء التفكير
          </p>
        </div>
      </div>
    </div>
  );
}
