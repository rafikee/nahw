/**
 * Tashkeel coverage analysis.
 *
 * The rule we enforce is "every consonant carries a haraka or a sukun", not the
 * naive "every letter has a diacritic" — Arabic long vowels (حروف المد), the
 * silent lam of a sun-letter article, and alif in all its roles are correctly
 * bare, and flagging them would bury real errors under false positives.
 *
 * Two severities come out of this, because they mean different things:
 *   - `error`  — a bare consonant mid-word. Always a mistake.
 *   - `pausal` — a bare consonant at the end of a word (الْوَقْف). Legitimate when
 *                citing a form in isolation, as in «كِتَاب», but usually a dropped
 *                i'rab vowel when it appears in running prose.
 */

export const FATHA = "َ";
export const DAMMA = "ُ";
export const KASRA = "ِ";
export const SHADDA = "ّ";
export const SUKUN = "ْ";
export const TANWEEN_FATH = "ً";
export const TANWEEN_DAMM = "ٌ";
export const TANWEEN_KASR = "ٍ";

/** Any mark that can sit on top of a letter. */
const DIACRITIC = /[ً-ٰٕ]/;
/** A mark that actually voices the letter (shadda alone does not). */
const VOWEL_MARK = /[ً-ِْٰ]/;
/** Arabic consonants, including the hamza carriers and alif wasla. */
const LETTER = /[ء-غف-يٱ]/;
/** Markdown emphasis and the punctuation that separates words in lesson copy. */
const STRIP = /\*\*|[^؀-ۿ\s]/g;

/**
 * Every alif form. Plain alif never bears a haraka in voweled text — it is
 * always a long vowel, a hamzat wasl, or silent (the alif of tanween fath, or
 * the one trailing واو الجماعة). Hamza carriers (أ إ ؤ ئ) are separate
 * codepoints and are deliberately not in this set, so they still get checked.
 */
const BARE_BY_NATURE = new Set(["ا", "آ", "ى", "ٱ"]);

/**
 * Split display copy into bare Arabic words, dropping `**bold**` markers,
 * Latin text and punctuation.
 */
export function arabicWords(text) {
  return text
    .replace(STRIP, " ")
    .split(/\s+/)
    .filter((w) => w && LETTER.test(w));
}

/** Decompose a word into `{ letter, marks }` in original order. */
function segment(word) {
  const out = [];
  for (const ch of word) {
    if (DIACRITIC.test(ch)) {
      if (out.length) out[out.length - 1].marks += ch;
      continue;
    }
    if (LETTER.test(ch)) out.push({ letter: ch, marks: "" });
  }
  return out;
}

/** Whether an unvoweled letter at index `i` is legitimately bare. */
function bareIsLegal(segs, i) {
  const { letter } = segs[i];
  const prev = i > 0 ? segs[i - 1] : null;
  const next = i < segs.length - 1 ? segs[i + 1] : null;

  if (BARE_BY_NATURE.has(letter)) return true;

  // Silent lam of a sun-letter article: النَّاس، بِالنُّون. The article's alif sits
  // before it and the assimilated consonant after it carries the shadda.
  if (letter === "ل" && prev && prev.letter === "ا" && next && next.marks.includes(SHADDA)) {
    return true;
  }

  // Long vowel و: a damma on the letter before it, as in يَقُولُ.
  if (letter === "و" && prev && prev.marks.includes(DAMMA)) return true;

  // Long vowel ي: a kasra on the letter before it, as in فِي.
  if (letter === "ي" && prev && prev.marks.includes(KASRA)) return true;

  return false;
}

/**
 * Every letter in `text` that should carry a haraka but doesn't, tagged with
 * the word it came from, its 1-indexed position, and a severity.
 */
export function findBareLetters(text) {
  const findings = [];
  for (const word of arabicWords(text)) {
    const segs = segment(word);
    segs.forEach((seg, i) => {
      if (VOWEL_MARK.test(seg.marks)) return;
      if (bareIsLegal(segs, i)) return;
      findings.push({
        word,
        letter: seg.letter,
        position: i + 1,
        severity: i === segs.length - 1 ? "pausal" : "error",
      });
    });
  }
  return findings;
}

/**
 * Shadda with no accompanying haraka is almost always an OCR artifact — a
 * doubled consonant still needs voicing. Word-final shadda is legitimate in
 * pausal form (ضَارٌّ → ضَارّ), so it gets the lower severity.
 */
export function findLoneShadda(text) {
  const findings = [];
  for (const word of arabicWords(text)) {
    const segs = segment(word);
    segs.forEach((seg, i) => {
      if (!seg.marks.includes(SHADDA)) return;
      if (VOWEL_MARK.test(seg.marks)) return;
      findings.push({
        word,
        letter: seg.letter,
        position: i + 1,
        severity: i === segs.length - 1 ? "pausal" : "error",
      });
    });
  }
  return findings;
}
