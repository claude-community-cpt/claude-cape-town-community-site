// Serves /llms.txt: a short plain-text guide to the site for AI assistants,
// in the format described at https://llmstxt.org. It is rebuilt with the site,
// so the event lists stay current without anyone editing this file.
import type { APIRoute } from "astro";
import { SITE, getEvents, longDate, timeRange, type EventEntry } from "../lib";

const url = (path: string, site: URL | undefined) => new URL(path, site).href;

export const GET: APIRoute = async ({ site }) => {
  const { upcoming, past } = await getEvents();

  const line = (event: EventEntry) => {
    const { title, start, end, venue, summary, format } = event.data;
    const when = `${longDate(start)}${end ? `, ${timeRange(event)}` : ""}`;
    return `- [${title}](${url(`/events/${event.id}/`, site)}): ${format}. ${when} at ${venue.name}, ${SITE.city}. ${summary}`;
  };

  const text = `# ${SITE.name}

> ${SITE.description} Every event is free, in person and open to everyone. You register on Luma.

The community is run by volunteer Claude Community Ambassadors. It is not run by Anthropic and does not speak for Anthropic. Event times are Cape Town time (UTC+2). The people to contact are the hosts, ${SITE.hosts.map((host) => host.name).join(" and ")}, through the Join page.

## Pages

- [Home](${url("/", site)}): What the community is, the next event and the kinds of events it runs
- [Events](${url("/events/", site)}): Every upcoming and past event, with dates, venues and links to register
- [Join](${url("/join/", site)}): How to take part. There is nothing to sign up for: come to an event
- [Give a talk](${url("/speak/", site)}): How to offer a ten-minute talk or demo. First-time speakers are welcome
- [Host or support an event](${url("/partner/", site)}): How to offer a room, food and drink, or prizes

## Upcoming events

${upcoming.length ? upcoming.map(line).join("\n") : `- [Events](${url("/events/", site)}): Nothing is scheduled right now. New events are listed here first`}

## Past events

${past.map(line).join("\n")}

## Optional

- [Privacy notice](${url("/privacy/", site)}): What the site collects and your rights under POPIA
- [Luma calendar](${SITE.lumaCalendar}): Where registration happens
- [Website source](${SITE.repo}): The code for this site
`;

  return new Response(text, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
};
