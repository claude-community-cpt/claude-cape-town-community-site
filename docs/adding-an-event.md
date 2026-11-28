# Adding or changing an event

Each event is one Markdown file in `src/content/events/`. The site builds the
upcoming list, the past list, the event's own page, and the search-engine
data from it. An event moves from "Upcoming" to "Past" by itself once it has
ended (the site rebuilds every night).

If you use Claude Code, ask it to "add an event" and give it the Luma link.
The `add-event` skill in `.claude/skills/add-event/` reads the date, venue and
description from the Luma page, writes the file the way this page describes,
and tidies events that have ended.

## Add an event

1. Copy an existing file in `src/content/events/` and rename it
   `YYYY-MM-DD-short-name.md`. The name becomes the address:
   `2026-12-05-claude-and-coffee.md` is served at
   `/events/2026-12-05-claude-and-coffee/`.
2. Fill in the top section:

   ```yaml
   ---
   title: Claude & Coffee Meetup
   start: 2026-12-05T09:00:00+02:00   # always end with +02:00 (Cape Town time)
   end: 2026-12-05T13:00:00+02:00
   format: Claude & Coffee             # Meetup, Workshop, Conversation, Impact Lab, Build Day, Claude & Coffee
   summary: "One or two sentences for the cards and for Google."
   venue:
     name: Roamwork Harrington
     address: 50 Harrington St, District Six   # optional
   status: Waitlist open                # optional, shown while upcoming. Every event needs
                                        # registration, so do not say that here
   luma:
     url: https://luma.com/claude-i36b
     embedId: evt-cMvmoNRY1FBSDYH      # optional, see below
     label: Register on Luma           # optional
   ---
   ```

3. Write the longer description under the second `---` in plain Markdown.
4. Optional, but worth it: draw the event's share card, the picture people
   see when the event's link is posted in WhatsApp, LinkedIn or Discord. Run
   `node scripts/make-og.mjs` and commit the new file in `public/og/`. Run it
   again if the title, date or venue changes. Without a card the link shows
   the general "Hello, Cape Town" picture instead.
5. Open a pull request. The checks build the site and test it; once they pass
   and it is merged, the site updates in about two minutes.

### The Luma embed

On the event's Luma page choose **Share**, then **Embed event**. Luma gives you
a snippet like this:

```html
<iframe src="https://luma.com/embed/event/evt-cMvmoNRY1FBSDYH/simple" …></iframe>
```

Copy only the `evt-…` part into `embedId`. The site draws the frame itself, at
the same size, styled for light and dark. Leave `embedId` out and the event
shows only the button.

## After the event

Add any of these to the same file:

```yaml
slides:
  - title: "Talk title (PDF)"
    url: /talks/2026-12-05-talk-title.pdf
photos: https://photos.app.goo.gl/…            # a shared album link
gallery: 2026-12-05-claude-and-coffee          # a folder in src/assets/gallery/
galleryAlt:
  01.jpg: What the photo shows, in a few words
```

- **Slides**: put the PDF in `public/talks/`, named with the event date, and
  link to it as `/talks/<file>.pdf`. Ask the speaker first, and check no slide
  shows private or customer information. Keep each file under about 10 MB.
- **Photo removal**: if someone asks for a photo to come down, remove it from
  the gallery folder (and the shared album) and merge straight away.
- **Photo album**: in Google Photos, share the album by link and turn off
  collaboration and comments so visitors cannot add to it.
- **Photos on the site**: put up to about twelve in
  `src/assets/gallery/<folder>/`. Resize them to 2000px on the long edge
  first; the build makes the small versions. Describe each one in `galleryAlt`.
  They appear on the event's own page, where a visitor can open one and step
  through the rest, and the first few show beside the event in the past
  events list. There is no separate gallery page. Photos show in file-name
  order, so name them `01.jpg`, `02.jpg` and so on, best ones first.

Once an event has ended, remove `status` and `luma.label` from its file; they
only make sense while people can still register. To see which files need it:

```bash
node .claude/skills/add-event/check-events.mjs
```

## What not to put in an event file

- Attendee names, lists or numbers from Luma.
- Personal phone numbers or email addresses.
- "Partner", "sponsor" or "co-host" for a company that is only lending a room.
  Write the venue in `venue.name`; it is shown as the place, nothing more.

## Hide an event without deleting it

Add `draft: true` to the top section.
