# Nahw app — Onboarding redesign prompt (v7)

Paste this into v0, Figma AI, or any design tool to generate the onboarding screens.

---

## Prompt

Design a 3-screen mobile onboarding flow for "Nahw" (نَحْو), an Arabic grammar learning app. The entire UI is in Arabic (RTL) with full tashkeel/harakat. The audience is heritage Arabic speakers and Muslim learners who want to master classical Arabic grammar from their phone. The app prioritizes readability — large text, full tashkeel, generous spacing.

### Global specs
- Mobile-first, 390x844pt (iPhone 14 frame)
- Direction: RTL throughout
- Typography: Noto Naskh Arabic for all text. Headlines 24–26px weight 500, subtitles 17–18px weight 400, body 15–16px, line-height 1.5–1.8
- Color palette: warm amber (#BA7517) as the single CTA button color on ALL screens. Teal (#0F6E56) for success states. Purple (#534AB7) for accent stats. White backgrounds, dark text (#1A1A1A), muted text (#6B6B6B)
- Style: flat, minimal, generous whitespace, no gradients or shadows. Rounded corners (12px on buttons/cards, full-round on icon containers)
- CTA button: always amber (#BA7517), consistent across all screens
- Dot indicators: elongated pill (20x8px) for active screen, 8x8 circle for inactive. Dot color can shift per screen (amber → teal → purple) while button stays amber

### Screen 1 — "What is this"
- Top: open book icon (72px) in a light amber (#FAEEDA) circle, stroke #854F0B
- Headline (26px): أَتقِن النَّحوَ خُطوَةً بِخُطوَةٍ
- Subtitle (18px): تَعَلَّم القَواعِدَ بِطَريقَةٍ سَهلَةٍ وَمُمتِعَةٍ
- Clean and spacious — no cards or previews, let the headline breathe
- CTA: "التّالي" (amber filled button)
- Purpose: emotional hook, simple and confident

### Screen 2 — "How it works" — interactive exercise preview
- Top: checkmark-in-circle icon (64px) in a light teal (#E1F5EE) circle, stroke #0F6E56
- Headline (22px): دُروسٌ قَصيرَةٌ وتَمارينُ تَفاعُلِيَّةٌ
- Subtitle (16px): مَعَ تَشكيلٍ كامِلٍ في كُلِّ خُطوَةٍ
- Below: an interactive word-tap exercise preview in a light gray card. This is a LIVE mini-exercise the user can actually tap:
  - Instruction (16px): اضغَط عَلى الفِعلِ
  - Four word chips in a row (20px each, generous padding 10px 18px): المَسجِدِ، إِلى، الوَلَدُ، ذَهَبَ
  - Tapping the correct word (ذَهَبَ) highlights it green; wrong words highlight red
  - Word chips have white background, thin border, rounded corners — matching the actual app's exercise style
- Nothing below the exercise card — let it breathe, no tags or labels
- CTA: "التّالي" (amber filled button)
- Purpose: the user experiences the app's interactivity before starting their first lesson

### Screen 3 — "Full curriculum" — scope and progression
- Top: star icon (56px) in a light purple (#EEEDFE) circle, stroke #534AB7
- Headline (24px): مَنهَجٌ كامِلٌ
- Prominent stat (20px, purple #534AB7, weight 500): أَكثَرُ مِن ١٠٠ دَرسٍ
- No subtitle — the headline, stat, and path are enough
- Below: a vertical progress path showing five high-level curriculum milestones. Each is a numbered circle + a short title. Connected by thin vertical lines:
  1. Active (teal #0F6E56 circle with ١): أَساسِيّاتُ الكَلِمَةِ
  2. Locked (gray circle with ٢): نِظامُ الإِعرابِ
  3. Locked (gray circle with ٣): وَظائِفُ الكَلِماتِ في الجُملَةِ
  4. Locked (gray circle with ٤): التَّوابِعُ والأَساليبُ
  5. Locked (gray circle with ٥): تَحليلُ النُّصوصِ والإِعرابُ الكامِلُ
- Stage titles are 15px weight 500 — no subtopics, clean and aspirational
- CTA: "اِبدَأ رِحلَتَكَ" (amber filled button — same color as other screens)
- Skip link disappears on this screen
- Purpose: show the full scope (100+ lessons, 5 levels) so the user knows this is serious and complete — they level up bit by bit

### Interaction notes
- Swipeable left/right between screens (RTL: swipe left = next)
- "تَخطّى" (skip) link below the CTA on screens 1 and 2 only, small and muted gray
- Transition: slide + fade, ~300ms ease
- The exercise on screen 2 is interactive — tapping words gives immediate feedback

### Design rationale
The app prioritizes readability: large Arabic text with full tashkeel, generous padding, clean white cards. The onboarding must reflect this same commitment — nothing should feel small or cramped. The interactive exercise on screen 2 lets users experience the app before committing, which is more persuasive than describing it.

### What to avoid
- No Q&A or FAQ-style copy ("لماذا نتعلم النحو؟" / "لمن هذا التطبيق؟")
- No beta/test disclaimers on onboarding
- No walls of text — max 2 short lines per text block
- No small text — minimum 15px for anything the user needs to read
- No decorative illustrations or mascots — typographic with simple line icons
- No dark backgrounds — light and clean
- No tags, pills, or labels below the exercise — keep it focused