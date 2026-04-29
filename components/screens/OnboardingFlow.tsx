"use client";

import Image from "next/image";
import { useState } from "react";

interface OnboardingFlowProps {
  onComplete: () => void;
}

type StepIndex = 0 | 1 | 2;
const TOTAL_STEPS = 3;

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState<StepIndex>(0);

  const handleNext = () => {
    if (step === TOTAL_STEPS - 1) {
      onComplete();
    } else {
      setStep((step + 1) as StepIndex);
    }
  };

  const isLast = step === TOTAL_STEPS - 1;
  const ctaLabel = isLast ? "اِبْدَأْ رِحْلَتَكَ" : "التَّالِي";

  return (
    <div
      key={step}
      className="flex-1 min-h-0 flex flex-col px-8 pt-10 pb-8 slide-forward"
    >
      <div className="flex-1 min-h-0 overflow-y-auto">
        {step === 0 && <Step1 />}
        {step === 1 && <Step2 />}
        {step === 2 && <Step3 />}
      </div>

      <div className="space-y-4 pt-6">
        <Dots active={step} />

        <button
          type="button"
          onClick={handleNext}
          className="w-full flex items-center justify-center gap-3 rounded-2xl bg-primary-hover py-4 type-body-lg font-bold text-on-primary hover:bg-primary active:scale-[0.98] transition-all duration-200 shadow-sm"
        >
          {ctaLabel}
          {isLast && (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          )}
        </button>

        {!isLast && (
          <button
            type="button"
            onClick={onComplete}
            className="w-full type-body font-semibold text-muted hover:text-heading transition-colors"
          >
            تَخَطَّ
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Step 1 ── */

function Step1() {
  return (
    <div className="h-full flex flex-col items-center justify-start pt-10 text-center space-y-8">
      <div className="w-28 h-28 rounded-3xl bg-primary-soft flex items-center justify-center shadow-sm">
        <Image
          src="/nahw-mark.png"
          alt="نَحْو"
          width={939}
          height={751}
          priority
          className="h-16 w-auto object-contain"
        />
      </div>


      <div className="space-y-4">
        <h1 className="type-display font-bold text-heading">
          أَتْقِنِ النَّحْوَ خُطْوَةً بِخُطْوَةٍ
        </h1>
        <p className="type-title text-muted">
          تَعَلَّمِ القَوَاعِدَ بِطَرِيقَةٍ سَهْلَةٍ وَمُمْتِعَةٍ
        </p>
      </div>
    </div>
  );
}

/* ── Step 2 ── */

function Step2() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center space-y-8">
      <div className="space-y-3">
        <h2 className="type-heading font-bold text-heading">
          دُرُوسٌ قَصِيرَةٌ وَتَمَارِينُ تَفَاعُلِيَّةٌ
        </h2>
        <p className="type-body-lg text-muted">
          مَعَ تَشْكِيلٍ كَامِلٍ فِي كُلِّ خُطْوَةٍ
        </p>
      </div>

      <MiniExercise />
    </div>
  );
}

const MINI_WORDS: Array<{ word: string; correct: boolean }> = [
  { word: "المَسْجِدِ", correct: false },
  { word: "إِلَى", correct: false },
  { word: "الوَلَدُ", correct: false },
  { word: "ذَهَبَ", correct: true },
];

function MiniExercise() {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="w-full rounded-2xl border border-divider bg-surface px-5 py-6 space-y-5">
      <p className="type-body-lg font-semibold text-label">
        اِضْغَطْ عَلَى الفِعْلِ
      </p>

      <div className="flex flex-wrap justify-center gap-2.5">
        {MINI_WORDS.map(({ word, correct }) => {
          const isSelected = selected === word;
          const classes = isSelected
            ? correct
              ? "bg-success-soft border-success-border text-success-text"
              : "bg-danger-soft border-danger-border text-danger-text"
            : "bg-surface border-divider-strong text-heading hover:bg-surface-hover";
          return (
            <button
              key={word}
              type="button"
              onClick={() => setSelected(word)}
              className={`rounded-xl border px-5 py-2.5 type-title font-bold transition-colors ${classes}`}
            >
              {word}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── Step 3 ── */

const PATH_STEPS: string[] = [
  "أَسَاسِيَّاتُ الكَلِمَةِ",
  "نِظَامُ الإِعْرَابِ",
  "وَظَائِفُ الكَلِمَاتِ فِي الجُمْلَةِ",
  "التَّوَابِعُ وَالأَسَالِيبُ",
  "تَحْلِيلُ النُّصُوصِ وَالإِعْرَابُ الكَامِلُ",
];

const PATH_NUMERALS = ["١", "٢", "٣", "٤", "٥"];

function Step3() {
  return (
    <div className="h-full flex flex-col items-center justify-start text-center space-y-6 pt-2">
      <div className="space-y-2">
        <h2 className="type-heading font-bold text-heading">مَنْهَجٌ كَامِلٌ</h2>
        <p className="type-title font-bold text-primary">
          أَكْثَرُ مِنْ ١٠٠ دَرْسٍ
        </p>
      </div>

      <ol className="w-full pt-2 space-y-0">
        {PATH_STEPS.map((title, i) => {
          const isActive = i === 0;
          const isLast = i === PATH_STEPS.length - 1;
          return (
            <li key={i} className="flex gap-4 items-stretch">
              <div className="flex flex-col items-center shrink-0">
                <div
                  className={`w-11 h-11 rounded-full flex items-center justify-center type-body-lg font-bold ${
                    isActive
                      ? "bg-success text-on-primary"
                      : "bg-track text-muted"
                  }`}
                >
                  {PATH_NUMERALS[i]}
                </div>
                {!isLast && (
                  <div className="w-px flex-1 bg-divider-strong my-1" />
                )}
              </div>

              <div className={`flex-1 text-right pt-2 ${isLast ? "" : "pb-7"}`}>
                <p
                  className={`type-body-lg font-semibold ${
                    isActive ? "text-heading" : "text-muted"
                  }`}
                >
                  {title}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/* ── Pagination dots ── */

function Dots({ active }: { active: StepIndex }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => {
        const isActive = i === active;
        return (
          <span
            key={i}
            aria-hidden="true"
            className={`h-2 rounded-full transition-all duration-300 ${
              isActive ? "w-5 bg-primary" : "w-2 bg-divider-strong"
            }`}
          />
        );
      })}
    </div>
  );
}
