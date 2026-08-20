# Design - IMGo Web

This file is the design source of truth for the IMGo marketing and embedded web pages.

## Genre

modern-minimal

## Tone

utilitarian

## Macrostructure Family

- Marketing pages: Workbench with real product captures, F4 step sequences, and F5 annotated screenshots.
- App pages: functional shell only; the embedded tool is the page.

## Theme

Use the existing Coral tokens in `tokens.css`.

- Paper: warm near-white
- Ink: warm charcoal
- Accent: restrained coral
- Focus: coral

## Typography

- Display: Geist, 700, normal
- Body: IBM Plex Sans, 400/600
- Mono: IBM Plex Mono, 400/500
- Headings are always upright.

## Spacing

Use the named 4-point-derived scale in `tokens.css`. Components must consume semantic tokens rather than raw spacing values.

## Motion

- No scroll reveals.
- Animate opacity and transform only.
- Use `--ease-out` and `--dur-short`.
- Reduced motion collapses transitions to near-instant state changes.

## Navigation

N9 Edge-aligned minimal: wordmark left, language utility and one primary action right.

## Footer

Ft5 Statement: one factual privacy statement followed by a small metadata row.

## CTA Voice

- Primary: direct action, dark filled pill.
- Secondary: bordered pill.
- Labels use concrete verbs: "Open web app", "Download desktop app".

## Shared Rules

- The primary message is local, private, multi-file image processing.
- Product claims must be traceable to implementation.
- Do not invent compression ratios, speed claims, user counts, testimonials, customer logos, certifications, or upload-security claims.
- The homepage workbench embeds the real web app in a non-interactive macOS-style application window.
- Do not draw fake browser chrome or use static interface illustrations in place of the real app.
- App pages do not add decorative enrichment.
