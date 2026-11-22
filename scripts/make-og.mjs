// Draws the 1200x630 pictures shown when a link to the site is shared (in
// WhatsApp, LinkedIn, Discord and so on):
//
//   public/og.png             the site's card, used by every ordinary page
//   public/og/<event>.png     one card per event, with its date, title and venue
//
// Run `node scripts/make-og.mjs` after adding or renaming an event, or after
// changing its title, date or venue, and commit the pictures it writes. An
// event without a card still works: it falls back to the site's card.
import { chromium } from "@playwright/test";
import { mkdirSync, readdirSync, readFileSync } from "node:fs";

const root = new URL("../", import.meta.url);
const font = (file) => readFileSync(new URL(`public/fonts/${file}`, root)).toString("base64");
const spark = readFileSync(new URL("src/assets/brand/spark-ivory.svg", root), "utf8").replace('fill="#FAF9F5"', 'fill="#141413"');
const escape = (text) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;");

// Text on coral is ink (see DESIGN.md).
const base = `<!doctype html><style>
@font-face{font-family:CCDisplay;src:url(data:font/woff2;base64,${font("AnthropicSerifDisplay-Light.woff2")})}
@font-face{font-family:CCLabel;src:url(data:font/woff2;base64,${font("AnthropicSansDisplay-Semibold.woff2")})}
body{margin:0;width:1200px;height:630px;background:#d97757;color:#141413;display:flex;flex-direction:column;justify-content:space-between;padding:64px 72px;box-sizing:border-box}
svg{width:72px;height:72px}
h1{margin:0;font:300 168px/0.98 CCDisplay;letter-spacing:-0.02em}
h1 span{display:block}h1 span+span{margin-left:120px}
p{margin:0;font:600 22px CCLabel;letter-spacing:.09em;text-transform:uppercase}
.top{display:flex;justify-content:space-between;align-items:center}
.when{font-size:30px}
h1.event{font-size:var(--size);line-height:1.02;text-wrap:balance}
.foot{display:flex;justify-content:space-between;gap:48px}
</style>`;

const siteCard = `${base}${spark}<h1><span>Hello,</span><span>Cape Town</span></h1><p>Claude Community Cape Town</p>`;

/** The few fields a card needs, read from the top of an event's Markdown file. */
function readEvent(file) {
  const text = readFileSync(new URL(`src/content/events/${file}`, root), "utf8");
  const front = text.split(/^---$/m)[1] ?? "";
  const field = (name) => front.match(new RegExp(`^\\s*${name}:\\s*(.+)$`, "m"))?.[1].trim().replace(/^(["'])(.*)\1$/, "$2");
  return { id: file.replace(/\.md$/, ""), title: field("title"), start: new Date(field("start")), venue: field("name") };
}

function eventCard({ title, start, venue }) {
  const format = (options) => new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Johannesburg", ...options }).format(start);
  const when = `${format({ weekday: "short", day: "numeric", month: "short", year: "numeric" }).replace(",", "")} · ${format({ hour: "2-digit", minute: "2-digit", hour12: false })}`;
  // Longer titles get smaller type so they stay within three lines.
  const size = title.length <= 22 ? 132 : title.length <= 34 ? 112 : 92;
  return `${base}<div class="top">${spark}<p class="when">${escape(when)}</p></div>
<h1 class="event" style="--size:${size}px">${escape(title)}</h1>
<div class="foot"><p>${escape(venue)}</p><p>Claude Community Cape Town</p></div>`;
}

const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined });
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });

async function draw(html, path) {
  await page.setContent(html);
  await page.evaluate(() => Promise.all([document.fonts.load("300 100px CCDisplay"), document.fonts.load("600 22px CCLabel")]));
  await page.screenshot({ path: new URL(path, root).pathname });
  console.log(`wrote ${path}`);
}

await draw(siteCard, "public/og.png");
mkdirSync(new URL("public/og/", root), { recursive: true });
for (const file of readdirSync(new URL("src/content/events/", root)).filter((name) => name.endsWith(".md"))) {
  const event = readEvent(file);
  await draw(eventCard(event), `public/og/${event.id}.png`);
}
await browser.close();
