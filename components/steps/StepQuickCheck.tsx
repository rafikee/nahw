"use client";

import { useState } from "react";
import type { QuickCheck } from "@/types/lesson";
import { RichText } from "@/components/ui/RichText";

export function StepQuickCheck({ data }: { data: QuickCheck }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const isCorrect = selected !== null && data.options[selected].correct;

  function handleSelect(index: number) {
    if (confirmed) return;
    setSelected(index);
  }

  function handleConfirm() {
    if (selected === null) return;
    setConfirmed(true);
  }

  function handleRetry() {
    setSelected(null);
    setConfirmed(false);
  }

  return (
    <div className="space-y-6">
      <h1 className="type-display font-bold text-heading">
        <RichText text={data.question} />
      </h1>

      <div className="space-y-3">
        {data.options.map((opt, i) => {
          let style = "bg-surface border-divider-strong text-body hover:bg-surface-hover";

          if (selected === i && !confirmed) {
            style = "bg-primary-soft border-primary text-heading ring-2 ring-primary-border";
          } else if (confirmed && opt.correct) {
            style = "bg-success-soft border-success text-success-text";
          } else if (confirmed && selected === i && !opt.correct) {
            style = "bg-danger-soft border-danger text-danger-text";
          } else if (confirmed) {
            style = "bg-surface-hover border-divider text-faint";
          }

          return (
            <button
              key={i}
              onClick={() => handleSelect(i)}
              disabled={confirmed}
              className={`w-full rounded-xl border px-6 py-4 text-right type-title font-semibold transition-all duration-150 ${style} ${
                confirmed ? "cursor-default" : "cursor-pointer active:scale-[0.98]"
              }`}
            >
              <RichText text={opt.text} />
              {confirmed && opt.correct && (
                <span className="mr-3 inline-block">✓</span>
              )}
              {confirmed && selected === i && !opt.correct && (
                <span className="mr-3 inline-block">✗</span>
              )}
            </button>
          );
        })}
      </div>

      {!confirmed && selected !== null && (
        <button
          onClick={handleConfirm}
          className="w-full rounded-xl bg-primary py-3 type-body font-bold text-on-primary hover:bg-primary-hover active:scale-[0.98] transition-all duration-150 shadow-sm"
        >
          تَأْكِيدُ الْإِجَابَةِ
        </button>
      )}

      {confirmed && (
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
          {!isCorrect && (
            <button
              onClick={handleRetry}
              className="mt-3 rounded-lg bg-surface border border-divider-strong px-4 py-2 type-body font-semibold text-label hover:bg-surface-hover transition-colors"
            >
              حَاوِلْ مَرَّةً أُخْرَى
            </button>
          )}
        </div>
      )}
    </div>
  );
}
