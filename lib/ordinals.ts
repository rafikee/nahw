/**
 * Arabic ordinals for lesson numbering, e.g. «الدَّرْسُ الْحَادِيَ عَشَرَ».
 *
 * Lived in two components as separate copies that both stopped at ten, so
 * lessons 11 and 12 silently fell back to «الدَّرْسُ 12» — a Latin digit in an
 * Arabic-only UI. Shared here so the next batch does not reintroduce it.
 *
 * 11-19 are compounds, مبني على فتح الجزأين, so they keep this form whatever
 * case the phrase is in. Twenty declines, and the only place these are used is
 * after «الدَّرْسُ», so the nominative form is the right one.
 */
export const ARABIC_ORDINALS = [
  "الْأَوَّلُ", "الثَّانِي", "الثَّالِثُ", "الرَّابِعُ", "الْخَامِسُ",
  "السَّادِسُ", "السَّابِعُ", "الثَّامِنُ", "التَّاسِعُ", "الْعَاشِرُ",
  "الْحَادِيَ عَشَرَ", "الثَّانِيَ عَشَرَ", "الثَّالِثَ عَشَرَ", "الرَّابِعَ عَشَرَ",
  "الْخَامِسَ عَشَرَ", "السَّادِسَ عَشَرَ", "السَّابِعَ عَشَرَ", "الثَّامِنَ عَشَرَ",
  "التَّاسِعَ عَشَرَ", "الْعِشْرُونَ",
];

/** One-based lesson number to its ordinal, falling back to the numeral. */
export const lessonOrdinal = (n: number): string =>
  ARABIC_ORDINALS[n - 1] ?? String(n);
