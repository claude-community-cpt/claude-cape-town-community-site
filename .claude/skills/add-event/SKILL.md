---
name: add-event
description: Add or update an event on the Claude Community Cape Town website. Use whenever someone wants to add, publish, list, announce or change an event, meetup, workshop or build day on the site, or pastes a Luma link and asks for it to go on the website. Also tidies events that have ended.
---

# Add an event to the website

An event is one Markdown file in `src/content/events/`. The build makes the
upcoming list, the past list, the event's own page and the search-engine data
from those files. `src/content.config.ts` defines the fields and
`docs/adding-an-event.md` explains them; read both before writing, and follow
them exactly. If this skill and those files disagree, those files win.

The people who use this skill are often volunteers who are not developers.
Ask in plain words, one short message at a time, and do the git work for them.

## 1. Collect the details

An upcoming event needs all four of these. Do not write the file until you
have them.

| Needed | Goes in | Notes |
| --- | --- | --- |
| Luma link | `luma.url` | The public event page, `https://luma.com/...` |
| Date and time | `start`, `end` | Cape Town time, written with `+02:00` |
| Location | `venue.name`, `venue.address` | The place's name, and the street address if it is public |
| Description | `summary` and the text under the second `---` | See step 3 |

Ask for the Luma link first, then offer to read the rest from it:

```bash
node .claude/skills/add-event/luma-event.mjs https://luma.com/claude-i36b
```

The script prints the title, start and end (already in `+02:00`), venue,
`embedId`, registration state and Luma's description. It reads only the
public page. If it fails (no network, or Luma changed its page), say so and
ask the person for the details instead. Never guess a date, time or venue.

Show the person what you found and let them correct it before you write
anything. Things to check with them:

- **Title.** The script drops the "Cape Town |" that Luma titles start with.
- **Venue spelling.** Use the name exactly as the host writes it, for example
  "Roamwork", not "Roam Works".
- **Address.** If the output says `addressHiddenOnLuma: true`, Luma only shows
  the address to accepted guests. Leave `venue.address` out and do not ask
  for it.
- **Format.** Pick one of the values listed for `format` in
  `src/content.config.ts`. If none fits, ask; do not invent one.
- **Status.** Optional short pill such as "Waitlist open". Every event needs
  registration, so never write that as a status. If `soldOut` or
  `waitlistOpen` is true, suggest `status: Full, waitlist open` and
  `luma.label: Join the waitlist on Luma`.

An event that has already happened can be added without a Luma link, but
still needs the date, location and description.

## 2. Tidy events that have ended

Do this every time the skill runs, before adding the new file:

```bash
node .claude/skills/add-event/check-events.mjs
```

The site sorts events into Upcoming and Past by itself, from each file's
`end` (or midnight after `start`), and rebuilds every night. So "moving an
event to past" never means moving a file, renaming it, or keeping a list by
hand. It means removing the fields that only make sense before the event:

- delete `status`
- delete `luma.label`

Keep `luma.url` and `luma.embedId`; a past event still links to its Luma
page. Keep everything else. Fix whatever the script lists, in the same pull
request, and tell the person which events you tidied. If the script reports
an upcoming event with something missing, ask for it rather than filling it
in yourself.

## 3. Write the file

Name it `YYYY-MM-DD-short-name.md`, lower case with hyphens, using the start
date. The name becomes the address, so keep it short and do not rename a
file once it is live.

```yaml
---
title: Claude & Coffee Meetup
start: 2026-12-05T09:00:00+02:00
end: 2026-12-05T13:00:00+02:00
format: Claude & Coffee
summary: "A Saturday morning of table conversations. No laptops, no talks. The room picks the topics and the tables reshuffle every round."
venue:
  name: Roamwork Harrington
  address: 50 Harrington St, District Six
luma:
  url: https://luma.com/claude-i36b
  embedId: evt-cMvmoNRY1FBSDYH
---

A Saturday morning of table conversations. No laptops, no talks. The room picks the topics and the tables reshuffle every round, so you meet new people each time.

Doors open at 09:00 and we wrap up by 13:00. Register on Luma; the full details are on the event page there.
```

That is the real file for the 5 December 2026 Claude & Coffee, and the
pattern to copy.

- `summary` is one or two sentences, 260 characters at most, in quotes. It
  shows on cards, in search results and in link previews.
- The text under the second `---` is the description: two or three short
  paragraphs saying what the event is, who it is for, what to bring and when
  doors open. Base it on the Luma description, but shorten it. Luma holds the
  full details; the site points people there. Leave out emoji, and do not
  repeat the date and venue as a list, because the page already shows them.
- Leave out any optional field you have no value for. Do not add fields that
  are not in `src/content.config.ts`.
- `slides`, `photos`, `gallery` and `galleryAlt` are added after the event;
  see "After the event" in `docs/adding-an-event.md`.

### Wording and privacy

These come from `CLAUDE.md` and apply to every event file:

- British English. Plain, friendly, short.
- Events are free and open to everyone. Nothing that suggests paid or
  priority access.
- A company that only lends a room is the venue, nothing more. Never
  "partner", "sponsor" or "co-host".
- No attendee names, lists or numbers from Luma (including how many spots are
  left), no personal phone numbers or email addresses, no WhatsApp invite
  link.
- The community is run by volunteers and does not speak for Anthropic.

## 4. Check and open a pull request

1. Optional but worth it: draw the share card with `node scripts/make-og.mjs`
   and commit the new file in `public/og/`.
2. Run `node .claude/skills/add-event/check-events.mjs` again; it should say
   nothing needs attention.
3. Run `npm run verify`. Fix the cause of any failure; never skip a test.
4. Commit on a branch and open a pull request. Never push to `main`: every
   push to `main` goes live.
5. Tell the person, in a sentence or two, what the event page will show and
   which past events you tidied, and give them the pull request link.
