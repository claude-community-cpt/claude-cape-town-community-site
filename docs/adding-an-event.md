# Adding or changing an event

Each event is one Markdown file in `src/content/events/`. The site builds the
upcoming list, the past list, the event's own page, and the search-engine
data from it. An event moves from "Upcoming" to "Past" by itself once it has
ended (the site rebuilds every night).

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
   status: Registration required       # optional, shown while upcoming
   luma:
     url: https://luma.com/claude-i36b
     embedId: evt-cMvmoNRY1FBSDYH      # optional, see below
     label: Register on Luma           # optional
   ---
   ```

3. Write the longer description under the second `---` in plain Markdown.
4. Open a pull request. The checks build the site and test it; once they pass
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
    url: https://github.com/claude-community-cpt/talks/blob/main/…
photos: https://photos.app.goo.gl/…            # a shared album link
gallery: 2026-12-05-claude-and-coffee          # a folder in src/assets/gallery/
galleryAlt:
  01.jpg: What the photo shows, in a few words
```

- **Slides**: upload the PDF to the `talks` repository and link to it. Ask the
  speaker first, and check no slide shows private or customer information.
- **Photo album**: in Google Photos, share the album by link and turn off
  collaboration and comments so visitors cannot add to it.
- **Photos on the site**: put up to about twelve in
  `src/assets/gallery/<folder>/`. Resize them to 2000px on the long edge
  first; the build makes the small versions. Describe each one in `galleryAlt`.

## What not to put in an event file

- Attendee names, lists or numbers from Luma.
- Personal phone numbers or email addresses.
- "Partner", "sponsor" or "co-host" for a company that is only lending a room.
  Write the venue in `venue.name`; it is shown as the place, nothing more.

## Hide an event without deleting it

Add `draft: true` to the top section.
