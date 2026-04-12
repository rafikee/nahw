"use client";

import { useState } from "react";
import type { Concept } from "@/types/lesson";
import { conceptThemes } from "@/components/ui/conceptThemes";
import { RichText } from "@/components/ui/RichText";

function SpotTheWordExercise({ data }: { data: NonNullable<Concept["spot_the_word"]> }) {
  const [tapped, setTapped] = useState<number | null>(null);
  const answered = tapped !== null;
  const isCorrect = answered && tapped === data.answer;

  function handleTap(index: number) {
    if (answered) return;
    setTapped(index);
  }

  return (
    <div className="rounded-2xl border border-primary-border bg-primary-soft px-7 py-6 shadow-sm space-y-4">
      <p className="type-body-lg font-bold text-label">{data.prompt}</p>
      <div className="flex flex-wrap gap-2.5 justify-center">
        {data.words.map((word, i) => {
          let style = "bg-surface border-divider-strong text-body";

          if (answered && i === data.answer) {
            style = "bg-success-soft border-success text-success-text";
          } else if (answered && i === tapped) {
            style = "bg-danger-soft border-danger text-danger-text";
          } else if (answered) {
            style = "bg-surface border-divider text-faint";
          }

          return (
            <button
              key={i}
              onClick={() => handleTap(i)}
              disabled={answered}
              className={`rounded-xl border px-5 py-2.5 type-title font-semibold transition-all duration-150 ${style} ${
                answered ? "cursor-default" : "cursor-pointer active:scale-[0.96]"
              }`}
            >
              {word}
              {answered && i === data.answer && <span className="mr-2 inline-block">✓</span>}
              {answered && i === tapped && i !== data.answer && <span className="mr-2 inline-block">✗</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function StepConcept({ concept, conceptIndex }: { concept: Concept; conceptIndex: number }) {
  const theme = conceptThemes[conceptIndex % conceptThemes.length];
  return (
    <div className="space-y-6">

      <div className={`border-r-4 ${theme.accentSide} pr-5 py-2`}>
        <p className={`type-heading font-bold ${theme.text}`}>
          {concept.type}
        </p>
      </div>

      <div className="rounded-2xl border border-divider bg-surface px-7 py-6 shadow-sm space-y-2">
        <p className="type-body-lg font-bold text-label">التَّعْرِيفُ</p>
        <p className="type-title text-body">
          <RichText text={concept.definition} />
        </p>
      </div>

      {concept.spot_the_word && (
        <SpotTheWordExercise data={concept.spot_the_word} />
      )}

      <div className="rounded-2xl border border-divider bg-surface px-7 py-6 shadow-sm space-y-4">
        <p className="type-body-lg font-bold text-label">أَمْثِلَةٌ</p>
        <div className="flex flex-wrap gap-2">
          {concept.examples.map((ex) => (
            <span
              key={ex}
              className={`rounded-xl border px-4 py-2 type-title font-semibold ${theme.chipBg}`}
            >
              {ex}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
