# Claude Community Cape Town website

The source for [claudecapetown.com](https://claudecapetown.com): events,
photos and how to take part in Cape Town's Claude community. Run by volunteer
Claude Community Ambassadors.

It is a static site built with [Astro](https://astro.build) and served by
GitHub Pages. There is no server, no database and no secret.

## I want to…

| Task | Where |
| --- | --- |
| Add or update an event, slides or photos | [docs/adding-an-event.md](docs/adding-an-event.md) |
| Add or change a page | [docs/adding-a-page.md](docs/adding-a-page.md) |
| Check colours, type and components | [DESIGN.md](DESIGN.md), and the style guide at `/styleguide/` while running `npm run dev` (it is not on the live site) |
| Report a security problem | [SECURITY.md](SECURITY.md) |

## Run it on your computer

You need [Node.js](https://nodejs.org) 22 or newer.

```bash
npm install
npm run dev        # http://localhost:4321, reloads as you edit
```

Before you open a pull request:

```bash
npx playwright install chromium   # once
npm run verify                    # type check, build, HTML and link checks, browser tests
```

## How it is put together

```
src/
  content/events/   one Markdown file per event
  pages/            one file per page; the file name is the address
  components/       header, footer, event row, photos, Luma embed, hero scene
  layouts/Base.astro  the shared <head>: SEO tags, security policy, fonts
  styles/           tokens.css (design tokens) and global.css (shared styles)
  scripts/forms.ts  sends the four forms
  assets/           images that the build resizes
public/             files copied as they are: CNAME, robots.txt, fonts, favicon
  downloads/        the Zoom background videos offered on the Downloads page
tests/              browser tests (Playwright)
scripts/            link checker, share-image generator, live-site QA
```

## Publishing

**Merging to `main` publishes the site.** `.github/workflows/pages.yml` runs
the checks, builds, and deploys to GitHub Pages, then checks the live site. It
also rebuilds every night so finished events move to "Past" by themselves.

Every pull request runs the same checks first (`.github/workflows/ci.yml`) and
attaches the built site as a download called `site-preview`, so a reviewer can
open it before merging.

The domain is set in `public/CNAME` and in the repository's Pages settings.
DNS is held at name.com: four `A` records on the apex pointing at GitHub
Pages, and a `CNAME` for `www`.

## Forms

There are two forms, and both post from the page to Google Forms. No API key
lives in the site.

| Form | Goes to |
| --- | --- |
| Give a talk | Google Form "Speaker pitch" (Responses tab) |
| Host or support an event | Google Form "Partner application" (Responses tab) |

The form IDs and Google `entry.*` field IDs are at the top of
`src/scripts/forms.ts`. If a Google Form question is re-created its `entry` ID
changes; read the new one from the live form's page source.

Each form has a hidden trap field and ignores submissions made within a few
seconds of the page loading, which stops most bots.

There is no join form and no newsletter sign-up. The Join page links out
instead; the Discord invite and the hosts' LinkedIn profiles are in `SITE` in
`src/lib.ts`.
Never publish a WhatsApp invite link.

If you add a form, list what it collects on the [privacy notice](src/pages/privacy.astro).

## Security

- A Content Security Policy in `src/layouts/Base.astro` allows only this
  site's own files, Luma frames and Google Forms. If you add another
  outside service, add it there or the browser will block it.
- GitHub Actions are pinned to exact commits. Renovate keeps them and the
  npm packages current: routine updates arrive as one pull request a week and
  merge by themselves once every check passes; major updates and security
  fixes wait for a person. The rules are in `renovate.json`.
- CodeQL (`.github/workflows/codeql.yml`) scans the code and the workflows on
  every pull request.
- `.github/workflows/security.yml` stops a pull request that adds a package
  with a known vulnerability, checks that installed packages are genuine, and
  checks the workflow files themselves for unsafe patterns.
- Never commit contact details, attendee lists or keys. See [SECURITY.md](SECURITY.md).

## Short links

`claudecapetown.com/mixer` forwards to the Table Mixer app
([coffee-chat](https://github.com/claude-community-cpt/coffee-chat)). It is a
small page, `src/pages/mixer.astro`, so the link shows a preview when it is
shared. Copy it for another short link that people will share. For a plain
forward nobody shares, add a line under `redirects` in `astro.config.mjs`.

## Search engines, AI assistants and link previews

- `public/robots.txt` welcomes every crawler, AI ones included, and points to
  the sitemap. The site has no private pages.
- The sitemap (`/sitemap-index.xml`) is built for you and lists every page
  with the date it last changed. It is the address to submit in Google Search
  Console and Bing Webmaster Tools.
- `/llms.txt` is a plain-text guide to the site for AI assistants, in the
  [llmstxt.org](https://llmstxt.org) layout. It is built from the events, in
  `src/pages/llms.txt.ts`.
- Titles, descriptions, link-preview tags and the data Google reads are set in
  `src/layouts/Base.astro`; the event ones come from `src/lib.ts`.
- Link-preview pictures are drawn by `node scripts/make-og.mjs`: one for the
  site (`public/og.png`) and one per event (`public/og/`). WhatsApp remembers
  the first preview it saw for a link, so to test a change add `?v=2` to the
  address.
- The icons `favicon.ico` and `favicon-96.png` are drawn from `favicon.svg` by
  `node scripts/make-favicon.mjs`.
