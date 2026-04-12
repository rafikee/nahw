"use client";

import { useState } from "react";
import type { QuickCheck } from "@/types/lesson";
import { RichText } from "@/components/ui/RichText";

export function StepQuickCheck({ data }: { data: QuickCheck }) {
  const [selected, setSelected] = useState<number | null>(null);

  const answered = selected !== null;
  const isCorrect = answered && data.options[selected].correct;

  function handleSelect(index: number) {
    if (answered) return;
    setSelected(index);
  }

  return (
    <div className="space-y-6">
      <h1 className="type-heading font-bold text-heading">
        <RichText text={data.question} />
      </h1>

      <div className="space-y-3">
        {data.options.map((opt, i) => {
          let style = "bg-surface border-divider-strong text-body hover:bg-surface-hover";

          if (answered && opt.correct) {
            style = "bg-success-soft border-success text-success-text";
          } else if (answered && selected === i && !opt.correct) {
            style = "bg-danger-soft border-danger text-danger-text";
          } else if (answered) {
            style = "bg-surface-hover border-divider text-faint";
          }

          return (
            <button
              key={i}
              onClick={() => handleSelect(i)}
              disabled={answered}
              className={`w-full rounded-xl border px-6 py-4 text-right type-title font-semibold transition-all duration-150 ${style} ${
                answered ? "cursor-default" : "cursor-pointer active:scale-[0.98]"
              }`}
            >
              <RichText text={opt.text} />
              {answered && opt.correct && (
                <span className="mr-3 inline-block">✓</span>
              )}
              {answered && selected === i && !opt.correct && (
                <span className="mr-3 inline-block">✗</span>
              )}
            </button>
          );
        })}
      </div>

      {answered && (
        <div className={`feedback-enter rounded-2xl border px-6 py-5 ${
          isCorrect
            ? "bg-success-soft border-success-border"
            : "bg-danger-soft border-danger-border"
        }`}>
          <p className={`type-body font-bold mb-2 ${isCorrect ? "text-success-text" : "text-danger-text"}`}>
            {isCorrect ? "إِجَابَةٌ صَحِيحَةٌ!" : "إِجَابَةٌ خَاطِئَةٌ"}
          </p>
          <p className="type-body font-medium text-label">
            <RichText text={data.explanation} />
          </p>
        </div>
      )}
    </div>
  );
}
