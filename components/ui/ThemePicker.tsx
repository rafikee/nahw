"use client";

export const THEMES = [
  { id: "amber", label: "كَهْرَمَانِيّ", color: "#d97706" },
  { id: "indigo", label: "نِيلِيّ", color: "#4f46e5" },
  { id: "rose", label: "وَرْدِيّ", color: "#e11d48" },
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];

export function getStoredTheme(): ThemeId {
  try {
    const storedTheme = localStorage.getItem("nahw-theme");
    if (THEMES.some((theme) => theme.id === storedTheme)) {
      return storedTheme as ThemeId;
    }
    return "amber";
  } catch {
    return "amber";
  }
}

export function applyTheme(id: ThemeId) {
  document.documentElement.setAttribute("data-theme", id);
  try {
    localStorage.setItem("nahw-theme", id);
  } catch {}
}

type ThemePickerProps = {
  currentTheme: ThemeId;
  onChange: (id: ThemeId) => void;
};

export function ThemePicker({ currentTheme, onChange }: ThemePickerProps) {
  const activeTheme = THEMES.find((theme) => theme.id === currentTheme) ?? THEMES[0];

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center justify-center gap-4">
        {THEMES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            title={t.label}
            className={`h-9 w-9 rounded-full border-2 transition-all duration-150 ${
              currentTheme === t.id
                ? "border-heading scale-110 shadow-sm"
                : "border-transparent hover:scale-105"
            }`}
            style={{ backgroundColor: t.color }}
            aria-label={t.label}
            aria-pressed={currentTheme === t.id}
          />
        ))}
      </div>
      <p className="type-body font-semibold text-muted">{activeTheme.label}</p>
    </div>
  );
}
