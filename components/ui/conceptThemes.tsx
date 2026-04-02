export const conceptThemes = [
  {
    bg: "bg-sky-50",
    border: "border-sky-100",
    badgeBg: "bg-sky-100 border-sky-200 text-sky-900",
    iconColor: "text-sky-400",
    watermark: "text-sky-200",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
        <path d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    bg: "bg-amber-50",
    border: "border-amber-100",
    badgeBg: "bg-amber-100 border-amber-200 text-amber-900",
    iconColor: "text-amber-400",
    watermark: "text-amber-200",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
        <line x1="7" y1="7" x2="7.01" y2="7" />
      </svg>
    ),
  },
  {
    bg: "bg-violet-50",
    border: "border-violet-100",
    badgeBg: "bg-violet-100 border-violet-200 text-violet-900",
    iconColor: "text-violet-400",
    watermark: "text-violet-200",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
    ),
  },
] as const;
