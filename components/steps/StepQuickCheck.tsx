"use client";

import { useState } from "react";
import type { QuickCheck } from "@/types/lesson";

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
      <h1 className="text-2xl font-bold text-stone-900 leading-relaxed">{data.question}</h1>

      <div className="space-y-3">
        {data.options.map((opt, i) => {
          let style = "bg-white border-stone-200 text-stone-700 hover:bg-stone-50 hover:border-stone-300";

          if (selected === i && !confirmed) {
            style = "bg-amber-50 border-amber-400 text-stone-800 ring-2 ring-amber-200";
          } else if (confirmed && opt.correct) {
            style = "bg-emerald-50 border-emerald-400 text-emerald-800";
          } else if (confirmed && selected === i && !opt.correct) {
            style = "bg-red-50 border-red-300 text-red-700";
          } else if (confirmed) {
            style = "bg-stone-50 border-stone-100 text-stone-400";
          }

          return (
            <button
              key={i}
              onClick={() => handleSelect(i)}
              disabled={confirmed}
              className={`w-full rounded-xl border px-6 py-4 text-right text-lg font-semibold transition-all duration-150 ${style} ${
                confirmed ? "cursor-default" : "cursor-pointer active:scale-[0.98]"
              }`}
            >
              {opt.text}
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
          className="w-full rounded-xl bg-amber-600 py-3 text-base font-bold text-white hover:bg-amber-700 active:scale-[0.98] transition-all duration-150 shadow-sm"
        >
          تَأْكِيدُ الْإِجَابَةِ
        </button>
      )}

      {confirmed && (
        <div className={`rounded-2xl border px-6 py-5 ${
          isCorrect
            ? "bg-emerald-50 border-emerald-200"
            : "bg-red-50 border-red-200"
        }`}>
          <p className={`text-sm font-bold mb-2 ${isCorrect ? "text-emerald-700" : "text-red-700"}`}>
            {isCorrect ? "إِجَابَةٌ صَحِيحَةٌ!" : "إِجَابَةٌ خَاطِئَةٌ"}
          </p>
          <p className="text-base text-stone-700 leading-[2.4]">{data.explanation}</p>
          {!isCorrect && (
            <button
              onClick={handleRetry}
              className="mt-3 rounded-lg bg-white border border-stone-200 px-4 py-2 text-sm font-semibold text-stone-600 hover:bg-stone-50 transition-colors"
            >
              حَاوِلْ مَرَّةً أُخْرَى
            </button>
          )}
        </div>
      )}
    </div>
  );
}
