# Design system

How the Claude Community Cape Town website looks and sounds, and how to build
new pages that fit. To see every piece rendered, run `npm run dev` and open
`http://localhost:4321/styleguide/`. The style guide is a working reference for
people and for Claude when preparing a pull request; it is not part of the
published site.

- **Tokens** (colours, type, space, motion): `src/styles/tokens.css`
- **Shared styles and components** (buttons, pills, cards, fields): `src/styles/global.css`
- **Building blocks** (header, footer, event row, gallery, Luma embed): `src/components/`

The brand comes from the Claude Community kit: coral, ivory and ink, a light
display serif, pixel creatures and hand-drawn doodles. This document turns it
into rules for a website.

## Voice

Warm host, few words. Playful in the pictures, plain in the sentences.

- Short lines. "Talks and demos", "Hello, Cape Town", "Thank you, Cape Town".
- Speak to the room, in the second person.
- Sentence case everywhere. Capitals are only for the "CLAUDE COMMUNITY" wordmark.
- Simple verbs, no hype, no exclamation marks, no emoji.
- British spelling: "learnt", "artefact", "organisation".
- A button says what happens: "Register on Luma", "Apply to join".

## Colour

Three brand colours carry everything. Do not add others.

| Token | Value | Use |
| --- | --- | --- |
| `--coral` | `#d97757` | Big surfaces, primary buttons, date chips, underlines |
| `--ivory` | `#faf9f5` | Light background |
| `--ink` | `#141413` | Text and line art |

Components never use those three directly for text or backgrounds. They use
the semantic tokens, which switch between light and dark on their own:

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `--bg` | ivory | `#1a1917` | Page background |
| `--bg-alt` | `#f0eee5` | `#242320` | Every other section |
| `--surface` | white | `#2a2926` | Cards, form fields |
| `--text` | ink | ivory | Body text |
| `--text-muted` | ink 72% | ivory 74% | Secondary text |
| `--text-faint` | ink 60% | ivory 62% | Captions, placeholders |
| `--line` | ink 12% | ivory 14% | Hairlines |
| `--accent-text` | `#a44e2d` | `#e69377` | Links and any small coral-coloured text |
| `--accent-tint` | `#f4ded2` | `#3c2b22` | Pill fill |
| `--on-accent` | ink | ink | Anything sitting on coral |

Rules:

1. **Text on coral is ink, never ivory.** Ivory on coral looks good at poster
   size but is too faint to read at body size (contrast 3.1 to 1; the minimum
   is 4.5 to 1). This is the one place the site departs from the slide deck.
2. **Coral is not a text colour on ivory.** Use `--accent-text` for links.
3. **Flat fills only.** No gradients, no blur, no transparency effects.
4. One background per section: `--bg`, `--bg-alt`, or coral (`.section-coral`).
   Use coral for at most two sections on a page.
5. The footer is ink in both themes.

### Light and dark

The site follows the visitor's system setting. The round switch in the header
overrides it and the choice is remembered in the browser. Technically:
`:root` declares `color-scheme: light dark`, every changing colour is written
once as `light-dark(light, dark)`, and the switch sets `data-theme` on `<html>`.

When you add a colour, add it to `tokens.css` with both values. Never write a
hex colour inside a page or component.

## Type

| Role | Token | Face | Where |
| --- | --- | --- | --- |
| Display | `--font-display` | Anthropic Serif Display, light (falls back to Lora) | `.hero-title`, `.display`, `.heading` |
| Label | `--font-label` | Anthropic Sans Display, semibold (falls back to Poppins) | `.title`, buttons, the wordmark |
| Body | `--font-body` | Poppins 400, 500, 600 | Everything else |
| Reading | `--font-serif` | Lora | `.prose`: event descriptions, long text |
| Caption | `--font-mono` | IBM Plex Mono | `.caption`: small ambient asides only |

The two display faces have one weight each. Do not fake bold or italic with them.
All fonts are served from this site; nothing loads from Google.

| Class | Size | Use |
| --- | --- | --- |
| `.hero-title` | 56 to 152px | The home page greeting. Nowhere else. |
| `.display` | 40 to 72px | The `h1` of a page. One per page. |
| `.heading` | 28 to 44px | Section titles (`h2`). |
| `.title` | 20 to 24px | Card, row and list titles (`h3`). |
| `.lede` | 17 to 20px | One intro paragraph under a title. |
| body | 16px | Default. |
| `.small` | 14px | Meta lines, notes. |
| `.wordmark` | 12px capitals | The lockup, and footer column titles. |

Sizes are fluid: they grow with the screen between a phone and a desktop, so
there are no type breakpoints to maintain. Keep text lines under about 62
characters (`max-width: var(--measure)`).

## Space and layout

- Use the space tokens (`--space-1` 4px up to `--space-9` 96px). Do not invent values.
- `.wrap` centres content at up to 76rem with a fluid gutter. Every section's
  content sits in one.
- `.wrap-narrow` has the same left edge and keeps forms and text at 44rem.
- `.section` gives a section its vertical padding. Add `.section-alt` or
  `.section-coral` for the background.
- Content is left-aligned. Only empty states are centred.
- Layouts are built to reflow without breakpoints where possible
  (`repeat(auto-fit, minmax(...))`). Check every new page at 390px wide.

## Shape

- Sections and colour blocks are square.
- Rounding belongs to components: 8px (chips, frames), 14px (cards, fields),
  20px (large tiles), pill (buttons, pills), 18px with a white edge (stickers).
- Hairlines are `1px solid var(--line)`. Doodle-style boxes are `2px solid` ink.
- Cards use `--shadow-card`. Stickers use `--shadow-sticker`. Nothing else has a shadow.

## Components

| Component | How to use it |
| --- | --- |
| Button | `<a class="btn btn-primary">`. Variants: `btn-primary` (coral), `btn-solid` (ink, for coral sections), `btn-outline`. Sizes: `btn-sm`, default, `btn-lg`. One primary button per section. |
| Text link | `<a class="textlink">` for a secondary action beside a button. |
| Pill | `<span class="pill">` for format; `pill pill-outline` for venue and status; `<a class="pill pill-link">` for a link that sits with pills. |
| Date chip | `<div class="date-chip"><b>05</b><span>Dec</span></div>`. Add `is-past` for past events. |
| Card | `<div class="card">` for forms and host cards. Do not put cards inside cards. |
| Field | `<label class="field"><span class="field-label">…</span><input class="field-input"></label>` |
| Two-column row | `<section class="split">` with a heading first and its content second: a narrow column for the heading, a wide one for the content, stacking on phones. Add `split-frame` when the content is the Luma frame. The privacy notice, event pages and upcoming events all use it, so their edges line up. |
| Sticker | `<Sticker name="coffee" width={160} />`, or `sticker="coffee"` on `PageHead`. The Clawd stickers live in `src/assets/brand/stickers/` and the name is the file name. Clicking one spins it. Set `--tilt` between -8deg and 8deg. They are there for fun: one or two per page, never on top of text. |
| Spark | `<Spark size={24} />`. Takes the current text colour. |
| Event row | `<EventRow event={event} />`. Built from an event file. |
| Luma embed | `<LumaEmbed embedId="evt-…" title="…" />`. Rendered for upcoming events automatically. |
| Gallery | `<Gallery folder="2026-08-27-claude-kickoff-build" />`. The photos of one event, shown on its page. A photo opens a full-screen view with previous and next arrows, arrow keys, swipe and a counter. |
| Photo strip | `<PhotoStrip folder="…" href="…" label="…" />`. The first few photos as one link. Past event rows add it automatically. |
| Page head | `<PageHead title="…" lede="…" />` at the top of every page except home. |

## Illustration

Three registers, all from the brand kit. Use the files in `src/assets/brand/`
and never redraw them.

1. **Line doodles** (high five, speech bubbles, window and hand, globe): ink
   line with ivory fills, made for coral backgrounds.
2. **Pixel creatures**: coral, always with `image-rendering: pixelated`.
3. **Dither texture**: fields of small dots, as in the Table Mountain scene on
   the home page.

There is no icon set. Use words, or a plain text glyph (the theme switch is "◐").

## Motion

Motion is for delight in one place and feedback everywhere else.

- **The one big moment** is the home page hero: the greeting rises, the
  mountain fades up, the creature walks. Do not add a second showpiece.
- **Feedback**: buttons press down 1px, underlines draw in, chips and tiles
  straighten on hover. Use `--speed-quick` (140ms) or `--speed-move` (420ms)
  with `--ease-out`. No bounces.
- **Scroll**: add `class="reveal"` to list items that should rise in as they
  appear. Use it for lists, not for every block.
- **Pages** cross-fade into each other, and the theme switch wipes outward
  from the button.
- Everything stops for visitors who ask their device to reduce motion. This is
  handled globally; if you write a JavaScript animation, check
  `prefers-reduced-motion` yourself.

## Accessibility checklist for a new page

- One `h1` (`.display`), then `h2`, then `h3`, in order.
- Every image has `alt`. Decorative images have `alt=""`.
- Links and buttons say where they go. No "click here".
- It works with the keyboard and shows a focus ring.
- It reads well at 390px wide, in light and in dark.
- `npm test` passes: it runs automated accessibility checks on every page.
