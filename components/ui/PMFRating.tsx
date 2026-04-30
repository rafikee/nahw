"use client";

import { useEffect, useState } from "react";

const PMF_ANSWERED_KEY = "nahw-pmf-answered";
const SUBSCRIBED_EMAIL_KEY = "nahw-subscribed-email";

const OPTIONS: Array<{ value: 1 | 2 | 3; emoji: string; label: string }> = [
  { value: 3, emoji: "💔", label: "سَأَفْتَقِدُهُ كَثِيرًا" },
  { value: 2, emoji: "😕", label: "سَأَفْتَقِدُهُ قَلِيلًا" },
  { value: 1, emoji: "🤷", label: "لَنْ أَفْتَقِدَهُ" },
];

function getStoredEmail(): string | null {
  try {
    return window.localStorage.getItem(SUBSCRIBED_EMAIL_KEY);
  } catch {
    return null;
  }
}

export function PMFRating() {
  const [hidden, setHidden] = useState(true);
  const [selected, setSelected] = useState<1 | 2 | 3 | null>(null);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(PMF_ANSWERED_KEY)) return;
    } catch {
      /* ignore */
    }
    setHidden(false);
  }, []);

  if (hidden) return null;

  async function handleSelect(value: 1 | 2 | 3) {
    if (selected !== null) return;
    setSelected(value);
    try {
      window.localStorage.setItem(PMF_ANSWERED_KEY, "1");
    } catch {
      /* ignore */
    }
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "pmf",
          rating: value,
          email: getStoredEmail(),
        }),
      });
    } catch {
      /* ignore — UI already showed selection */
    }
  }

  return (
    <div className="w-full rounded-2xl border border-divider bg-surface px-5 py-5 space-y-4 text-right">
      <h3 className="type-body-lg font-bold text-heading">
        كَيْفَ سَتَشْعُرُ لَوْ تَوَقَّفَ هٰذَا التَّطْبِيقُ؟
      </h3>

      <div className="space-y-2">
        {OPTIONS.map(({ value, emoji, label }) => {
          const isSelected = selected === value;
          const isDimmed = selected !== null && !isSelected;
          return (
            <button
              key={value}
              type="button"
              onClick={() => handleSelect(value)}
              disabled={selected !== null}
              className={`w-full flex items-center gap-3 rounded-xl border px-4 py-3 type-body-lg font-semibold transition-all duration-150 ${
                isSelected
                  ? "border-primary-border bg-primary-soft text-primary-text"
                  : isDimmed
                  ? "border-divider bg-page text-muted opacity-50"
                  : "border-divider-strong bg-page text-heading hover:bg-surface-hover"
              }`}
            >
              <span className="text-xl leading-none shrink-0">{emoji}</span>
              <span className="flex-1 text-right">{label}</span>
            </button>
          );
        })}
      </div>

      {selected !== null && (
        <p className="type-body font-semibold text-success-text text-center">
          شُكْرًا!
        </p>
      )}
    </div>
  );
}
