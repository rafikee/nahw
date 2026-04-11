"use client";

import { useState, useCallback } from "react";
import type { WordSortExercise } from "@/types/lesson";

const bucketColors: Record<number, { bg: string; border: string; badge: string; wrongBg: string }> = {
  0: { bg: "bg-sky-50", border: "border-sky-200", badge: "bg-sky-100 border-sky-200 text-sky-800", wrongBg: "bg-red-50 border-red-200 text-red-600" },
  1: { bg: "bg-amber-50", border: "border-amber-200", badge: "bg-amber-100 border-amber-200 text-amber-800", wrongBg: "bg-red-50 border-red-200 text-red-600" },
  2: { bg: "bg-violet-50", border: "border-violet-200", badge: "bg-violet-100 border-violet-200 text-violet-800", wrongBg: "bg-red-50 border-red-200 text-red-600" },
};

interface PlacedWord {
  wordIndex: number;
  categoryKey: string;
  correct: boolean;
}

export function StepWordSort({ data }: { data: WordSortExercise }) {
  const [selectedWord, setSelectedWord] = useState<number | null>(null);
  const [placed, setPlaced] = useState<PlacedWord[]>([]);

  const placedIndices = new Set(placed.map((p) => p.wordIndex));
  const isComplete = placed.length === data.words.length;
  const correctCount = placed.filter((p) => p.correct).length;

  const handleWordTap = useCallback((index: number) => {
    if (placedIndices.has(index)) return;
    setSelectedWord((prev) => (prev === index ? null : index));
  }, [placedIndices]);

  const handleCategoryTap = useCallback((categoryKey: string) => {
    if (selectedWord === null) return;

    const word = data.words[selectedWord];
    const isCorrect = word.category === categoryKey;

    setPlaced((prev) => [...prev, { wordIndex: selectedWord, categoryKey, correct: isCorrect }]);
    setSelectedWord(null);
  }, [selectedWord, data.words]);

  const correctCategoryLabel = (wordIndex: number): string => {
    const word = data.words[wordIndex];
    const cat = data.categories.find((c) => c.key === word.category);
    return cat?.label ?? word.category;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-stone-900 leading-relaxed">{data.instruction}</h1>

      {/* Word pool */}
      <div className="rounded-2xl border border-stone-100 bg-white px-5 py-5 shadow-sm">
        <div className="flex flex-wrap gap-2 justify-center min-h-[3rem]">
          {data.words.map((w, i) => {
            if (placedIndices.has(i)) return null;

            const isSelected = selectedWord === i;

            return (
              <button
                key={i}
                onClick={() => handleWordTap(i)}
                className={`rounded-xl border px-4 py-2 text-lg font-semibold transition-all duration-150 ${
                  isSelected
                    ? "bg-amber-50 border-amber-400 ring-2 ring-amber-200 text-stone-800 scale-105"
                    : "bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100"
                }`}
              >
                {w.word}
              </button>
            );
          })}
          {isComplete && (
            <p className="text-sm text-stone-400 py-2">تَمَّ تَصْنِيفُ جَمِيعِ الْكَلِمَاتِ</p>
          )}
        </div>
      </div>

      {/* Category buckets */}
      <div className="grid gap-3">
        {data.categories.map((cat, ci) => {
          const color = bucketColors[ci % Object.keys(bucketColors).length];
          const wordsInBucket = placed.filter((p) => p.categoryKey === cat.key);

          return (
            <button
              key={cat.key}
              onClick={() => handleCategoryTap(cat.key)}
              disabled={selectedWord === null}
              className={`rounded-2xl border-2 border-dashed px-5 py-4 text-right transition-all duration-150 ${
                selectedWord !== null
                  ? `${color.border} ${color.bg} cursor-pointer hover:shadow-sm`
                  : "border-stone-200 bg-stone-50 cursor-default"
              }`}
            >
              <span className={`inline-block rounded-lg border px-3 py-1 text-base font-bold mb-2 ${color.badge}`}>
                {cat.label}
              </span>
              {wordsInBucket.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {wordsInBucket.map((pw) => (
                    <span
                      key={pw.wordIndex}
                      className={`rounded-lg border px-3 py-1 text-base font-semibold ${
                        pw.correct ? color.badge : color.wrongBg
                      }`}
                    >
                      {data.words[pw.wordIndex].word}
                      {!pw.correct && (
                        <span className="text-xs mr-1 opacity-70">
                          ← {correctCategoryLabel(pw.wordIndex)}
                        </span>
                      )}
                    </span>
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {isComplete && (
        <div className={`rounded-2xl border px-6 py-4 text-center ${
          correctCount === data.words.length
            ? "border-emerald-200 bg-emerald-50"
            : "border-amber-200 bg-amber-50"
        }`}>
          <p className={`text-lg font-bold ${
            correctCount === data.words.length ? "text-emerald-700" : "text-amber-700"
          }`}>
            {correctCount === data.words.length
              ? "أَحْسَنْتَ! جَمِيعُ الْإِجَابَاتِ صَحِيحَةٌ."
              : `أَصَبْتَ ${correctCount} مِنْ ${data.words.length}`}
          </p>
        </div>
      )}
    </div>
  );
}
