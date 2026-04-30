"use client";

import { useState } from "react";

interface LessonRatingProps {
  contextId: string;
}

const SUBSCRIBED_EMAIL_KEY = "nahw-subscribed-email";

const RATINGS: Array<{ value: 1 | 2 | 3; emoji: string; label: string }> = [
  { value: 1, emoji: "😕", label: "لَا" },
  { value: 2, emoji: "🤔", label: "نَوْعًا مَا" },
  { value: 3, emoji: "😊", label: "نَعَمْ" },
];

function getStoredEmail(): string | null {
  try {
    return window.localStorage.getItem(SUBSCRIBED_EMAIL_KEY);
  } catch {
    return null;
  }
}

export function LessonRating({ contextId }: LessonRatingProps) {
  const [selected, setSelected] = useState<1 | 2 | 3 | null>(null);

  function handleSelect(value: 1 | 2 | 3) {
    if (selected !== null) return;
    setSelected(value);
    void fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "lesson_rating",
        rating: value,
        context_id: contextId,
        email: getStoredEmail(),
      }),
    });
  }

  return (
    <div className="w-full space-y-3">
      <p className="type-body-lg font-semibold text-heading">
        هَلْ كَانَ الدَّرْسُ سَهْلَ الْفَهْمِ؟
      </p>

      <div className="flex justify-around gap-2">
        {RATINGS.map(({ value, emoji, label }) => {
          const isSelected = selected === value;
          const isDimmed = selected !== null && !isSelected;
          return (
            <button
              key={value}
              type="button"
              onClick={() => handleSelect(value)}
              disabled={selected !== null}
              className={`flex-1 flex flex-col items-center gap-1 rounded-xl border px-2 py-3 transition-all duration-150 ${
                isSelected
                  ? "border-primary-border bg-primary-soft scale-[1.03]"
                  : isDimmed
                  ? "border-divider bg-page opacity-40"
                  : "border-divider bg-surface hover:bg-surface-hover"
              }`}
              aria-label={label}
            >
              <span className="text-2xl leading-none">{emoji}</span>
              <span className="type-body font-semibold text-muted leading-tight">
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
