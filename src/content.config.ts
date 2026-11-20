import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

/**
 * One Markdown file per event in src/content/events/.
 * The file name becomes the address: 2026-12-05-claude-and-coffee.md is
 * served at /events/2026-12-05-claude-and-coffee/.
 * docs/adding-an-event.md explains every field.
 */
const events = defineCollection({
  loader: glob({ pattern: "*.md", base: "./src/content/events" }),
  schema: z.object({
    title: z.string(),
    /** Start, with the +02:00 offset: 2026-12-05T09:00:00+02:00 */
    start: z.coerce.date(),
    /** End, same format. Leave out if unknown; the event then lasts until midnight. */
    end: z.coerce.date().optional(),
    format: z.enum(["Meetup", "Workshop", "Conversation", "Impact Lab", "Build Day", "Claude & Coffee"]),
    /** One or two sentences for cards and search results. */
    summary: z.string().max(260),
    venue: z.object({
      name: z.string(),
      address: z.string().optional(),
    }),
    /** Short status shown as a pill while the event is upcoming, e.g. "Waitlist open". */
    status: z.string().optional(),
    luma: z
      .object({
        /** Public event page, e.g. https://luma.com/claude-i36b */
        url: z.url(),
        /** The evt-... id from Luma's embed snippet. Leave out to show only the button. */
        embedId: z.string().regex(/^evt-[A-Za-z0-9]+$/).optional(),
        /** Button label. Defaults to "Register on Luma". */
        label: z.string().optional(),
      })
      .optional(),
    /** Talk slides: a PDF in public/talks/ (written as /talks/file.pdf) or a full link. */
    slides: z.array(z.object({ title: z.string(), url: z.union([z.url(), z.string().startsWith("/talks/")]) })).default([]),
    /** Link to a shared photo album (Google Photos). */
    photos: z.url().optional(),
    /** Folder name under src/assets/gallery/ holding photos to show on the site. */
    gallery: z.string().optional(),
    /** Alt text for gallery photos, keyed by file name. */
    galleryAlt: z.record(z.string(), z.string()).default({}),
    /** Hide from the site without deleting the file. */
    draft: z.boolean().default(false),
  }),
});

export const collections = { events };
