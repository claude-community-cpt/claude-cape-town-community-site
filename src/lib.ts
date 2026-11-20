import { getCollection, type CollectionEntry } from "astro:content";

export type EventEntry = CollectionEntry<"events">;

export const SITE = {
  name: "Claude Community Cape Town",
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
