"use client";

import { useState, useCallback } from "react";
import type { WordSortExercise } from "@/types/lesson";

const bucketStyle = {
  active: { bg: "bg-primary-soft", border: "border-primary-border", badge: "bg-primary-soft border-primary-border text-heading" },
  inactive: { bg: "bg-surface-hover", border: "border-divider-strong" },
  wrong: "bg-danger-soft border-danger text-danger-text",
} as const;

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
      <h1 className="type-display font-bold text-heading">{data.instruction}</h1>

      <div className="rounded-2xl border border-divider bg-surface px-5 py-5 shadow-sm">
        <div className="flex flex-wrap gap-2 justify-center min-h-[3rem]">
          {data.words.map((w, i) => {
            if (placedIndices.has(i)) return null;

            const isSelected = selectedWord === i;

            return (
              <button
                key={i}
                onClick={() => handleWordTap(i)}
                className={`rounded-xl border px-4 py-2 type-title font-semibold transition-all duration-150 ${
                  isSelected
                    ? "bg-primary-soft border-primary ring-2 ring-primary-border text-heading scale-105"
                    : "bg-surface-hover border-divider-strong text-body hover:bg-track"
                }`}
              >
                {w.word}
              </button>
            );
          })}
          {isComplete && (
            <p className="type-body text-faint py-2">تَمَّ تَصْنِيفُ جَمِيعِ الْكَلِمَاتِ</p>
          )}
        </div>
      </div>

      <div className="grid gap-3">
        {data.categories.map((cat) => {
          const wordsInBucket = placed.filter((p) => p.categoryKey === cat.key);

          return (
            <button
              key={cat.key}
              onClick={() => handleCategoryTap(cat.key)}
              disabled={selectedWord === null}
              className={`rounded-2xl border-2 border-dashed px-5 py-4 text-right transition-all duration-150 ${
                selectedWord !== null
                  ? `${bucketStyle.active.border} ${bucketStyle.active.bg} cursor-pointer hover:shadow-sm`
                  : `${bucketStyle.inactive.border} ${bucketStyle.inactive.bg} cursor-default`
              }`}
            >
              <span className={`inline-block rounded-lg border px-3 py-1 type-body-lg font-bold mb-2 ${bucketStyle.active.badge}`}>
                {cat.label}
              </span>
              {wordsInBucket.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {wordsInBucket.map((pw) => (
                    <span
                      key={pw.wordIndex}
                      className={`rounded-lg border px-3 py-1 type-body font-semibold ${
                        pw.correct ? bucketStyle.active.badge : bucketStyle.wrong
                      }`}
                    >
                      {data.words[pw.wordIndex].word}
                      {!pw.correct && (
                        <span className="type-body mr-1 opacity-70">
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
        <div className={`completion-pop rounded-2xl border px-6 py-4 text-center ${
          correctCount === data.words.length
            ? "border-success-border bg-success-soft"
            : "border-primary-border bg-primary-soft"
        }`}>
          <p className={`type-body-lg font-bold ${
            correctCount === data.words.length ? "text-success-text" : "text-primary-text"
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
