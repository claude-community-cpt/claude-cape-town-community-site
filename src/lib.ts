import { existsSync } from "node:fs";
import { join } from "node:path";
import { getCollection, type CollectionEntry } from "astro:content";

export type EventEntry = CollectionEntry<"events">;

export const SITE = {
  name: "Claude Community Cape Town",
  /** Follows the name in the home page's title, so searches for "Claude meetup" find it. */
  tagline: "free Claude meetups and workshops",
  shortName: "Claude Community",
  city: "Cape Town",
  description:
    "Cape Town's Claude community. Free meetups, workshops and build days for people who make things with Claude and Claude Code.",
  lumaCalendar: "https://luma.com/claudecommunity",
  ambassadors: "https://claude.com/community/ambassadors",
  /** Shown on the Join page. Leave empty to hide the button. Never a WhatsApp invite. */
  discord: "https://discord.gg/svgeUnK2j7",
  /** The hosts' public LinkedIn profiles, used wherever the site says "message a host". */
  hosts: [
    { name: "Tessa", linkedin: "https://www.linkedin.com/in/tessa-verster/" },
    { name: "Daniel", linkedin: "https://www.linkedin.com/in/daniel-schwartz-3a4654101/" },
  ],
  repo: "https://github.com/claude-community-cpt/claude-cape-town-community-site",
} as const;

const TZ = "Africa/Johannesburg";

/** When an event stops counting as upcoming: its end, or midnight after it starts. */
export function endOf(event: EventEntry): Date {
  if (event.data.end) return event.data.end;
  const midnight = new Date(event.data.start);
  midnight.setUTCHours(21, 59, 59); // 23:59:59 in Cape Town (UTC+2, no daylight saving)
  return midnight;
}

/** All published events, split around the build time. The site rebuilds daily. */
export async function getEvents(now = new Date()) {
  const all = (await getCollection("events", ({ data }) => !data.draft)).sort(
    (a, b) => a.data.start.getTime() - b.data.start.getTime(),
  );
  const upcoming = all.filter((e) => endOf(e) >= now);
  const past = all.filter((e) => endOf(e) < now).reverse();
  return { all, upcoming, past };
}

const fmt = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-GB", { timeZone: TZ, ...opts });

export const day = (d: Date) => fmt({ day: "2-digit" }).format(d);
export const month = (d: Date) => fmt({ month: "short" }).format(d);
export const year = (d: Date) => fmt({ year: "numeric" }).format(d);
export const longDate = (d: Date) => fmt({ weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(d);
export const time = (d: Date) => fmt({ hour: "2-digit", minute: "2-digit", hour12: false }).format(d);

export function timeRange(event: EventEntry): string {
  const { start, end } = event.data;
  return end ? `${time(start)} to ${time(end)}` : time(start);
}

export function whereLine(event: EventEntry): string {
  const { name, address } = event.data.venue;
  return address ? `${name}, ${address}` : name;
}

/* ---- Search engines and link previews ---- */

const ORIGIN = import.meta.env.SITE ?? "https://claudecapetown.com";
const absolute = (path: string) => new URL(path, ORIGIN).href;

/** Cape Town time with its offset, 2026-12-05T09:00:00+02:00, which is how Google asks for event times. */
export function isoLocal(d: Date): string {
  return new Date(d.getTime() + 2 * 60 * 60 * 1000).toISOString().slice(0, 19) + "+02:00";
}

/** "Sat 5 Dec", for the bold line of a shared link. */
export const shortDate = (d: Date) => fmt({ weekday: "short", day: "numeric", month: "short" }).format(d).replace(",", "");

/**
 * The picture shown when an event's link is shared: its own card from
 * public/og/ if `node scripts/make-og.mjs` has drawn one, otherwise the site's card.
 */
export function shareImage(event: EventEntry): string {
  const own = `/og/${event.id}.png`;
  return existsSync(join(process.cwd(), "public", own)) ? own : "/og.png";
}

/** Title and description for an event's search result and link preview: when and where first. */
export function shareText(event: EventEntry) {
  const { title, start, end, venue, summary } = event.data;
  const when = `${longDate(start)}${end ? `, ${timeRange(event)}` : ""}`;
  return {
    title: `${shortDate(start)}: ${title}, ${SITE.city}`,
    description: `${when} at ${venue.name}. ${summary}`,
  };
}

/** schema.org Event data, which lets Google show the date, place and "free" beside a result. */
export function eventSchema(event: EventEntry, now = new Date()): Record<string, unknown> {
  const { data } = event;
  const past = endOf(event) < now;
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: data.title,
    description: data.summary,
    startDate: isoLocal(data.start),
    endDate: isoLocal(endOf(event)),
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    isAccessibleForFree: true,
    url: absolute(`/events/${event.id}/`),
    image: absolute(shareImage(event)),
    location: {
      "@type": "Place",
      name: data.venue.name,
      address: {
        "@type": "PostalAddress",
        streetAddress: data.venue.address,
        addressLocality: SITE.city,
        addressRegion: "Western Cape",
        addressCountry: "ZA",
      },
    },
    organizer: { "@type": "Organization", name: SITE.name, url: absolute("/") },
    ...(data.luma &&
      !past && {
        offers: { "@type": "Offer", price: 0, priceCurrency: "ZAR", url: data.luma.url, availability: "https://schema.org/InStock" },
      }),
  };
}
