"use client";

import { useState } from "react";
import type { TextQuestion } from "@/types/lesson";

const ARABIC_NUMERALS = ["١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩", "١٠"];

export function StepTextQuestions({ questions }: { questions: TextQuestion[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  function toggle(i: number) {
    setOpenIndex((prev) => (prev === i ? null : i));
  }

  return (
    <div className="space-y-8">

      {/* ── Page title ── */}
      <h1 className="text-2xl font-bold text-stone-900 leading-[1.8]">أسئلة المراجعة</h1>

      <div className="rounded-2xl border border-stone-100 bg-white shadow-sm divide-y divide-stone-100">
        {questions.map((q, i) => {
          const isOpen = openIndex === i;
          return (
            <div key={i}>
              <button
                onClick={() => toggle(i)}
                className="w-full flex items-start gap-4 px-7 py-5 text-right hover:bg-stone-50 transition-colors duration-150"
              >
                <span className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-50 border border-amber-100 text-base font-bold text-amber-700 mt-0.5">
                  {ARABIC_NUMERALS[i] ?? i + 1}
                </span>
                <p className="flex-1 text-lg leading-[2.6] text-stone-700">{q.question}</p>
                <span className={`shrink-0 mt-2 text-stone-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </span>
              </button>

              {isOpen && (
                <div className="px-7 pb-6 flex gap-4">
                  <div className="w-8 shrink-0" />
                  <div className="flex-1 rounded-xl bg-amber-50 border border-amber-100 px-5 py-4">
                    <p className="text-sm font-semibold text-amber-600 mb-1">الجواب</p>
                    <p className="text-lg leading-[2.6] text-stone-700">{q.answer}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
