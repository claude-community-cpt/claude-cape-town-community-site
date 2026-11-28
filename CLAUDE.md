# Claude Community Cape Town website

Static Astro site for claudecapetown.com, served by GitHub Pages. No server, no
database, no secrets. The people who edit it are volunteer community
ambassadors, many of them not developers, so keep things plain and documented.

Read `README.md` for the layout and `DESIGN.md` before any visual change.

## Commands

```bash
npm install
npm run dev          # local preview at http://localhost:4321
npm run verify       # type check, build, HTML and link checks, browser tests
npm test             # browser tests only (needs `npm run build` first)
```

Run `npm run verify` before opening a pull request. CI runs the same thing.

## How changes ship

- Work on a branch and open a pull request. Never push to `main`: every push
  to `main` deploys to the live site.
- Do not change DNS, repository settings or git history.

## Where things go

- An event is one Markdown file in `src/content/events/`, named
  `YYYY-MM-DD-short-name.md`. The fields are defined in `src/content.config.ts`.
  See `docs/adding-an-event.md`. Do not hand-sort events into upcoming or past;
  the build does it by date. To add or change an event, use the `add-event`
  skill in `.claude/skills/add-event/`.
- A page is one file in `src/pages/`. Add new pages to the `pages` list in
  `tests/site.spec.ts` and to the header or footer if they should be linked.
  See `docs/adding-a-page.md`.
- Talk slides go in `public/talks/`. Photos shown on the site go in
  `src/assets/gallery/<event>/`.
- Site-wide links and names live in `SITE` in `src/lib.ts`.

## Rules for the design

- Use the tokens in `src/styles/tokens.css` and the classes in
  `src/styles/global.css`. No hard-coded colours, font sizes or spacing in
  pages, and no new fonts.
- Every colour must work in light and dark. Use `light-dark()` in tokens, not
  separate dark-mode rules.
- Text on coral is ink. Links and small coral text use `--accent-text`.
- Check new work at phone width and in both themes. The style guide
  (`src/dev/styleguide.astro`) shows every component; add new ones there. It
  is served at `/styleguide/` under `npm run dev` only and is never published.
- Respect `prefers-reduced-motion` for any animation.

## Rules for security and privacy

- The Content Security Policy in `src/layouts/Base.astro` allows no inline
  scripts or styles. Put scripts in `src/scripts/` or `public/`, styles in
  `<style>` blocks or the stylesheets, and never use `style=""` attributes.
  A new outside service must be added to the policy.
- Never commit personal contact details, attendee lists or exports from Luma,
  API keys, or a WhatsApp invite link.
- If a form is added or changed, update `src/pages/privacy.astro` to match.
- GitHub Actions are pinned to commit SHAs. Keep them pinned.

## Rules for wording

- British English. Plain, friendly, short.
- Events are free and open to everyone. Do not write anything that suggests
  paid or priority access.
- A company that only provides a room is thanked as "Hosted at". Do not call
  it a partner, sponsor or co-host.
- The community is run by volunteers and does not speak for Anthropic. Use the
  Claude Community marks in `src/assets/brand/` only; never the standalone
  Claude or Anthropic logo.

## Tests

- Do not skip or delete a test to make CI pass. Fix the cause.
- Tests never call outside services; Luma and Google Forms are stubbed in
  `tests/site.spec.ts`.
