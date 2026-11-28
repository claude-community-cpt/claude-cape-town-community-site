#!/usr/bin/env node
// Reads a public Luma event page and prints the details an event file needs.
//
//   node .claude/skills/add-event/luma-event.mjs https://luma.com/claude-i36b
//
// It reads only what any visitor to the page can see. It never reads guest
// lists, and it leaves the street address out when Luma hides it until a
// guest is accepted.

const input = process.argv[2];
if (!input) {
  console.error("Usage: node .claude/skills/add-event/luma-event.mjs <Luma event link>");
  process.exit(2);
}

let url;
try {
  url = new URL(input);
} catch {
  console.error(`Not a link: ${input}`);
  process.exit(2);
}
if (url.protocol !== "https:" || !["luma.com", "lu.ma"].includes(url.hostname)) {
  console.error("The link must be an https://luma.com/... (or https://lu.ma/...) event page.");
  process.exit(2);
}

const res = await fetch(url, { headers: { "accept-language": "en-GB" } });
if (!res.ok) {
  console.error(`Luma answered ${res.status} for ${url.href}. Check the link, or ask for the details instead.`);
  process.exit(1);
}
const html = await res.text();
const match = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
const data = match && JSON.parse(match[1])?.props?.pageProps?.initialData?.data;
const event = data?.event;
if (!event?.start_at) {
  console.error("Could not find the event details on that page. Luma may have changed its page; ask for the details instead.");
  process.exit(1);
}

/** Cape Town time with its offset: 2026-12-05T09:00:00+02:00 (UTC+2, no daylight saving). */
const capeTown = (iso) => (iso ? new Date(new Date(iso).getTime() + 2 * 60 * 60 * 1000).toISOString().slice(0, 19) + "+02:00" : null);

/** Luma's description as plain Markdown. */
function markdown(node) {
  if (!node) return "";
  const kids = (n) => (n.content ?? []).map(markdown).join("");
  switch (node.type) {
    case "doc":
      return (node.content ?? []).map(markdown).filter(Boolean).join("\n\n");
    case "text": {
      let text = node.text ?? "";
      for (const mark of node.marks ?? []) {
        if (mark.type === "bold") text = `**${text}**`;
        if (mark.type === "italic") text = `*${text}*`;
        if (mark.type === "link" && mark.attrs?.href) text = `[${text}](${mark.attrs.href})`;
      }
      return text;
    }
    case "heading":
      return `${"#".repeat(Math.min((node.attrs?.level ?? 2) + 1, 4))} ${kids(node)}`;
    case "bullet_list":
    case "bulletList":
      return (node.content ?? []).map((item) => `- ${kids(item).trim()}`).join("\n");
    case "ordered_list":
    case "orderedList":
      return (node.content ?? []).map((item, i) => `${i + 1}. ${kids(item).trim()}`).join("\n");
    case "hard_break":
    case "hardBreak":
      return "\n";
    default:
      return kids(node);
  }
}

const geo = event.geo_address_info;
const addressShown = event.geo_address_visibility === "public" && geo?.mode !== "obfuscated";
// "50 Harrington St, District Six, Cape Town" -> "50 Harrington St, District Six"
const address = addressShown && geo?.short_address ? geo.short_address.replace(/,\s*Cape Town.*$/i, "") : null;

const out = {
  // Luma titles start with the city, "Cape Town | Claude & Coffee Meetup"; the site leaves it off.
  title: event.name.replace(/^\s*Cape Town\s*[|:·-]\s*/i, ""),
  lumaTitle: event.name,
  start: capeTown(event.start_at),
  end: capeTown(event.end_at),
  timezone: event.timezone,
  venue: { name: geo?.address ?? null, address },
  addressHiddenOnLuma: !addressShown,
  luma: { url: `https://luma.com/${event.url}`, embedId: event.api_id },
  registration: {
    free: data.ticket_info?.is_free ?? null,
    needsApproval: data.ticket_info?.require_approval ?? null,
    soldOut: data.sold_out ?? data.ticket_info?.is_sold_out ?? null,
    waitlistOpen: data.waitlist_active ?? null,
  },
  description: markdown(data.description_mirror),
};

console.log(JSON.stringify(out, null, 2));
