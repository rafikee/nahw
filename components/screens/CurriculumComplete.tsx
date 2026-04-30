"use client";

import { EmailCapture } from "@/components/ui/EmailCapture";
import { LearnedNew } from "@/components/ui/LearnedNew";
import { PMFRating } from "@/components/ui/PMFRating";

interface CurriculumCompleteProps {
  onDone: () => void;
}

export function CurriculumComplete({ onDone }: CurriculumCompleteProps) {
  return (
    <div className="flex-1 min-h-0 overflow-y-auto">
      <div className="px-8 py-10 space-y-8">

        {/* Milestone hero */}
        <div className="flex flex-col items-center text-center space-y-4 completion-pop">
          <h1 className="type-title font-bold text-heading inline-flex items-center justify-center gap-2">
            <span>أَتْمَمْتَ جَمِيعَ الدُّرُوسِ الْمُتَاحَةِ</span>
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-md bg-success-soft border border-success-border shrink-0">
              <svg className="w-6 h-6 text-success-text" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </span>
          </h1>
        </div>

        <LearnedNew />

        <PMFRating />

        <EmailCapture source="curriculum_complete" withComment />

        <button
          type="button"
          onClick={onDone}
          className="w-full rounded-2xl border border-divider-strong py-4 type-body-lg font-bold text-muted hover:bg-surface-hover hover:text-heading active:scale-[0.98] transition-all duration-200"
        >
          إِنْهَاءٌ
        </button>

      </div>
    </div>
  );
}
