"use client";

import { useEffect, useState } from "react";

const ANSWERED_KEY = "nahw-learned-new-answered";
const SUBSCRIBED_EMAIL_KEY = "nahw-subscribed-email";

function getStoredEmail(): string | null {
  try {
    return window.localStorage.getItem(SUBSCRIBED_EMAIL_KEY);
  } catch {
    return null;
  }
}

export function LearnedNew() {
  const [hidden, setHidden] = useState(true);
  const [selected, setSelected] = useState<"yes" | "no" | null>(null);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(ANSWERED_KEY)) return;
    } catch {
      /* ignore */
    }
    setHidden(false);
  }, []);

  if (hidden) return null;

  async function handleSelect(value: "yes" | "no") {
    if (selected !== null) return;
    setSelected(value);
    try {
      window.localStorage.setItem(ANSWERED_KEY, "1");
    } catch {
      /* ignore */
    }
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "learned_new",
          rating: value === "yes" ? 3 : 1,
          email: getStoredEmail(),
        }),
      });
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="w-full rounded-2xl border border-divider bg-surface px-5 py-5 space-y-4 text-right">
      <p className="type-body-lg font-bold text-heading">
        هَلْ تَعَلَّمْتَ شَيْئًا جَدِيدًا؟
      </p>

      <div className="grid grid-cols-2 gap-3">
        {(["no", "yes"] as const).map((value) => {
          const isSelected = selected === value;
          const isDimmed = selected !== null && !isSelected;
          const emoji = value === "yes" ? "👍" : "👎";
          const label = value === "yes" ? "نَعَمْ" : "لَا";
          return (
            <button
              key={value}
              type="button"
              onClick={() => handleSelect(value)}
              disabled={selected !== null}
              aria-label={label}
              className={`flex items-center justify-center rounded-xl border py-3 transition-all duration-150 ${
                isSelected
                  ? "border-primary-border bg-primary-soft scale-[1.03]"
                  : isDimmed
                  ? "border-divider bg-page opacity-40"
                  : "border-divider-strong bg-page hover:bg-surface-hover"
              }`}
            >
              <span className="text-2xl leading-none">{emoji}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
