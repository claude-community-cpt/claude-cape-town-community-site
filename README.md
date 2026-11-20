# Claude Community Cape Town website

The source for [claudecapetown.com](https://claudecapetown.com): events,
photos and sign-up forms for Cape Town's Claude community. Run by volunteer
Claude Community Ambassadors.

It is a static site built with [Astro](https://astro.build) and served by
GitHub Pages. There is no server, no database and no secret.

## I want to…

| Task | Where |
| --- | --- |
| Add or update an event, slides or photos | [docs/adding-an-event.md](docs/adding-an-event.md) |
| Add or change a page | [docs/adding-a-page.md](docs/adding-a-page.md) |
| Check colours, type and components | [DESIGN.md](DESIGN.md) and [/styleguide/](https://claudecapetown.com/styleguide/) |
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
  components/       header, footer, event row, gallery, Luma embed, hero scene
  layouts/Base.astro  the shared <head>: SEO tags, security policy, fonts
  styles/           tokens.css (design tokens) and global.css (shared styles)
  scripts/forms.ts  sends the four forms
  assets/           images that the build resizes
public/             files copied as they are: CNAME, robots.txt, fonts, favicon
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

All four forms post from the page; no API key lives in the site.

| Form | Goes to | Notes |
| --- | --- | --- |
| Newsletter (home) | Kit form "Monthly newsletter", ID `10030128` | Double opt-in. A Kit automation adds the tag `newsletter`. |
| Join | Kit form "Community application", ID `10030161` | Custom fields `whatsapp`, `builds`, `why_join`; tagged `applicant-join`. Only people who tick the box are also added to the newsletter form. |
| Give a talk | Google Form "Speaker pitch" | Responses in the form's Responses tab. |
| Support an event | Google Form "Partner application" | Same. |

Send every newsletter to the tag `newsletter`, never to all subscribers: join
applicants who did not tick the box have not agreed to marketing email.

The form IDs and Google `entry.*` field IDs are at the top of
`src/scripts/forms.ts`. If a Google Form question is re-created its `entry` ID
changes; read the new one from the live form's page source.

Each form has a hidden trap field and ignores submissions made within a few
seconds of the page loading, which stops most bots. Turning on reCAPTCHA in
the Kit form settings adds a second layer.

## Security

- A Content Security Policy in `src/layouts/Base.astro` allows only this
  site's own files, Luma frames, Kit and Google Forms. If you add another
  outside service, add it there or the browser will block it.
- GitHub Actions are pinned to exact commits. Renovate keeps them current.
- Never commit contact details, attendee lists or keys. See [SECURITY.md](SECURITY.md).

## Short links

`claudecapetown.com/mixer` forwards to the Table Mixer app
([coffee-chat](https://github.com/claude-community-cpt/coffee-chat)). Add more
under `redirects` in `astro.config.mjs`.
