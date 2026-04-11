const shared = {
  accentTop: "border-t-primary-hover",
  accentSide: "border-r-primary-hover",
  text: "text-heading",
  chipBg: "bg-surface-hover border-divider-strong text-body",
} as const;

export const conceptThemes = [shared, shared, shared] as const;
