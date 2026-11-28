import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { isLive } from "../src/scripts/form-ids";

// Every page of the site. Add new pages here.
const pages = ["/", "/events/", "/speak/", "/partner/", "/join/", "/downloads/", "/privacy/", "/404.html"];

function isLuma(url: string) {
  try {
    return ["luma.com", "lu.ma"].includes(new URL(url).hostname);
  } catch {
    return false;
  }
}

/** Fail the test on any browser console error, including blocked-by-CSP messages. */
function watchConsole(page: Page) {
  const errors: string[] = [];
  page.on("console", (msg) => {
    // Luma's own frame logs its own errors; only this site's are ours to fix.
    if (msg.type() === "error" && !isLuma(msg.location().url)) errors.push(msg.text());
  });
  page.on("pageerror", (error) => errors.push(String(error)));
  return errors;
}

// Luma and the form services are outside the site; tests never call them.
test.beforeEach(async ({ page }) => {
  await page.route(/^https:\/\/(luma\.com|lu\.ma|docs\.google\.com)\//, (route) =>
    route.fulfill({ status: 200, contentType: "text/html", body: "<!doctype html><title>stub</title>" }),
  );
});

for (const path of pages) {
  for (const scheme of ["light", "dark"] as const) {
    test(`${path} renders cleanly in ${scheme}`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme, reducedMotion: "reduce" });
      const errors = watchConsole(page);
      await page.goto(path);

      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator("header.site-header")).toBeVisible();
      await expect(page.locator("footer.site-footer")).toBeVisible();

      // Nothing may be wider than the screen.
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, "page scrolls sideways").toBeLessThanOrEqual(0);

      // Automated accessibility checks, including colour contrast.
      const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).exclude("iframe").analyze();
      expect(axe.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(", ")}`)).toEqual([]);

      expect(errors).toEqual([]);
    });
  }
}

test("head has the SEO and security tags", async ({ page }) => {
  await page.goto("/events/");
  await expect(page).toHaveTitle(/Events \| Claude Community Cape Town/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://claudecapetown.com/events/");
  await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /.{50,}/);
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", "https://claudecapetown.com/og.png");
  const csp = await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute("content");
  expect(csp).toContain("script-src 'self'");
  expect(csp).not.toContain("unsafe-inline");
});

test("the home page title says what the community does, and names the site for Google", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/^Claude Community Cape Town: .*meetups/);
  const data = await page.locator('script[type="application/ld+json"]').allTextContents();
  expect(data.map((json) => JSON.parse(json)["@type"])).toEqual(expect.arrayContaining(["Organization", "WebSite"]));
});

test("a shared link says which community it is", async ({ page }) => {
  for (const path of ["/events/", "/join/", "/speak/", "/partner/"]) {
    await page.goto(path);
    for (const tag of ['meta[property="og:title"]', 'meta[name="twitter:title"]']) {
      await expect(page.locator(tag), path).toHaveAttribute("content", /Claude Community Cape Town/);
    }
  }
});

test("a shared event link shows its date, its place and its own picture", async ({ page, request }) => {
  await page.goto("/events/2026-12-05-claude-and-coffee/");
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", "Sat 5 Dec: Claude & Coffee Meetup, Cape Town");
  await expect(page.locator('meta[property="og:description"]')).toHaveAttribute("content", /^Saturday, 5 December 2026, 09:00 to 13:00 at Roamwork Harrington\./);
  const image = await page.locator('meta[property="og:image"]').getAttribute("content");
  expect(image).toBe("https://claudecapetown.com/og/2026-12-05-claude-and-coffee.png");
  expect((await request.get(new URL(image!).pathname)).status()).toBe(200);

  // Google asks for event times in local time with the offset.
  const data = (await page.locator('script[type="application/ld+json"]').allTextContents()).map((json) => JSON.parse(json));
  const event = data.find((item) => item["@type"] === "Event");
  expect(event.startDate).toBe("2026-12-05T09:00:00+02:00");
  expect(event.endDate).toBe("2026-12-05T13:00:00+02:00");
  expect(event.image).toBe(image);
});

test("robots, sitemap, llms.txt, icons and security.txt are served", async ({ request }) => {
  for (const path of ["/robots.txt", "/sitemap-index.xml", "/sitemap-0.xml", "/llms.txt", "/.well-known/security.txt", "/og.png", "/favicon.ico", "/favicon-96.png", "/CNAME"]) {
    expect((await request.get(path)).status(), path).toBe(200);
  }
});

test("robots.txt lets every crawler in and points to the sitemap", async ({ request }) => {
  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toMatch(/^User-agent: \*$/m);
  expect(robots).toMatch(/^Sitemap: https:\/\/claudecapetown\.com\/sitemap-index\.xml$/m);
  expect(robots).not.toMatch(/^Disallow:/m);
});

test("the sitemap lists every real page and no short links", async ({ request }) => {
  const sitemap = await (await request.get("/sitemap-0.xml")).text();
  for (const path of ["/", "/events/", "/events/2026-12-05-claude-and-coffee/", "/join/", "/speak/", "/partner/", "/privacy/"]) {
    expect(sitemap, path).toContain(`<loc>https://claudecapetown.com${path}</loc>`);
  }
  for (const path of ["/gallery/", "/demos/", "/404/"]) {
    expect(sitemap, path).not.toContain(`<loc>https://claudecapetown.com${path}</loc>`);
  }
});

test("llms.txt follows the llmstxt.org layout and lists the events", async ({ request }) => {
  const text = await (await request.get("/llms.txt")).text();
  expect(text).toMatch(/^# Claude Community Cape Town\n\n> /);
  expect(text).toContain("## Upcoming events");
  expect(text).toContain("- [Claude Kickoff Build](https://claudecapetown.com/events/2026-08-27-claude-kickoff-build/): ");
  expect(text).not.toMatch(/whatsapp/i);
});

test("theme follows the system, and the switch overrides and remembers", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/speak/");
  const background = () => page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(await background()).toBe("rgb(26, 25, 23)");

  if (!(await page.locator(".theme-btn").isVisible())) await page.locator(".menu-btn").click();
  await page.locator(".theme-btn").click();
  await expect.poll(background).toBe("rgb(250, 249, 245)");

  await page.reload();
  expect(await background()).toBe("rgb(250, 249, 245)");
});

test("events are split into upcoming and past, with Luma embeds", async ({ page }) => {
  await page.goto("/events/");
  const upcoming = page.locator("#upcoming article");
  const past = page.locator("#past article");
  expect((await upcoming.count()) + (await past.count())).toBeGreaterThan(3);
  await expect(past.first()).toBeVisible();
  for (const frame of await page.locator("#upcoming iframe.luma").all()) {
    await expect(frame).toHaveAttribute("src", /^https:\/\/luma\.com\/embed\/event\/evt-[A-Za-z0-9]+\/simple$/);
    await expect(frame).toHaveAttribute("title", /Register on Luma/);
  }
});

test("every event has its own page with event data for search engines", async ({ page }) => {
  await page.goto("/events/");
  const link = page.locator("#past article h3 a").first();
  const title = await link.textContent();
  await link.click();
  await expect(page.locator("h1")).toHaveText(title!);
  const data = await page.locator('script[type="application/ld+json"]').allTextContents();
  expect(data.some((json) => JSON.parse(json)["@type"] === "Event")).toBe(true);
});

test("old #/ links from the single-page site still work", async ({ page }) => {
  await page.goto("/#/events/past");
  await expect(page).toHaveURL(/\/events\/#past$/);
  await page.goto("/#/join");
  await expect(page).toHaveURL(/\/join\/$/);
});

test("the phone menu opens and closes", async ({ page, isMobile }) => {
  test.skip(!isMobile, "desktop shows the links in the header");
  await page.goto("/");
  const nav = page.locator("#site-nav");
  await expect(nav).toBeHidden();
  await page.locator(".menu-btn").click();
  await expect(nav).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(nav).toBeHidden();
});

// An event that has photos on the site.
const eventWithPhotos = "/events/2026-08-27-claude-kickoff-build/";

test("event photos open full size, step through and close with Escape", async ({ page }) => {
  await page.goto(eventWithPhotos);
  const links = page.locator("[data-gallery] a");
  const total = await links.count();
  expect(total).toBeGreaterThan(1);
  await links.first().click();
  const box = page.locator("dialog.lightbox");
  const photo = box.locator("img");
  const count = box.locator("[data-count]");
  await expect(box).toBeVisible();
  await expect(count).toHaveText(`1 of ${total}`);
  const showsPhoto = async (n: number) =>
    expect.poll(() => photo.evaluate((el: HTMLImageElement) => new URL(el.src).pathname)).toBe(await links.nth(n).getAttribute("href"));
  await showsPhoto(0);

  await box.locator("[data-next]").click();
  await expect(count).toHaveText(`2 of ${total}`);
  await showsPhoto(1);

  await page.keyboard.press("ArrowRight");
  await expect(count).toHaveText(`3 of ${total}`);
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("ArrowLeft");
  await expect(count).toHaveText(`1 of ${total}`);
  // Going back from the first photo wraps round to the last.
  await box.locator("[data-prev]").click();
  await expect(count).toHaveText(`${total} of ${total}`);

  // Nothing in the full-screen view may run off the screen.
  const view = page.viewportSize()!;
  for (const part of [photo, box.locator("[data-prev]"), box.locator("[data-next]"), box.locator(".close"), count]) {
    const edges = (await part.boundingBox())!;
    expect(edges.x).toBeGreaterThanOrEqual(0);
    expect(edges.y).toBeGreaterThanOrEqual(0);
    expect(edges.x + edges.width).toBeLessThanOrEqual(view.width + 1);
    expect(edges.y + edges.height).toBeLessThanOrEqual(view.height + 1);
  }

  await page.keyboard.press("Escape");
  await expect(box).toBeHidden();
  await expect(links.last()).toBeFocused();
});

test("the full-screen photo view has no accessibility violations", async ({ page }) => {
  await page.goto(eventWithPhotos);
  await page.locator("[data-gallery] a").first().click();
  await expect(page.locator("dialog.lightbox")).toBeVisible();
  const results = await new AxeBuilder({ page }).include("dialog.lightbox").analyze();
  expect(results.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
});

test("past events show a photo strip that leads to the photos", async ({ page }) => {
  await page.goto("/events/");
  const strip = page.locator("#past a.strip").first();
  await expect(strip).toHaveAttribute("href", `${eventWithPhotos}#photos`);
  await strip.click();
  await expect(page).toHaveURL(new RegExp(`${eventWithPhotos}#photos$`));
  await expect(page.locator("#photos [data-gallery]")).toBeVisible();
});

test("the old gallery and demos addresses forward to events", async ({ request }) => {
  expect(await (await request.get("/gallery/")).text()).toContain("/events/#past");
  expect(await (await request.get("/demos/")).text()).toContain("/events/");
});

test("the next event box and the Claude radio caption are links", async ({ page }) => {
  await page.goto("/");
  const ticket = page.locator("a.ticket");
  if (await ticket.count()) await expect(ticket).toHaveAttribute("href", /^\/events\/[\w-]+\/$/);
  await expect(page.locator("a.nowplaying")).toHaveAttribute("href", "https://www.youtube.com/watch?v=tRsQsTMvPNg");
});

test("the Luma frame is wide enough to use and the sticker spins when clicked", async ({ page }) => {
  await page.goto("/events/");
  const frame = page.locator("iframe.luma").first();
  if (await frame.count()) {
    const size = (await frame.boundingBox())!;
    expect(size.width).toBeGreaterThan(Math.min(page.viewportSize()!.width - 60, 600));
  }
  await page.goto("/");
  // Clawd on the home page: plain, then happy when tickled, then dizzy from spinning.
  const clawd = page.locator("button.sticker[data-mood]");
  await clawd.scrollIntoViewIfNeeded();
  const shown = clawd.locator("img.is-shown");
  await expect(shown).toHaveCount(1);
  const plain = await shown.getAttribute("src");
  await clawd.click();
  await expect(clawd).toHaveAttribute("data-mood", "1");
  await expect(shown).not.toHaveAttribute("src", plain!);
  await clawd.click();
  await expect(clawd).toHaveAttribute("data-mood", "2");
  await expect(clawd).toHaveClass(/is-spinning/);
  await expect(shown).toHaveCount(1);
});

test("a page sticker spins when clicked", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/join/");
  const sticker = page.locator("button.sticker");
  await sticker.click();
  await expect(sticker).toHaveClass(/is-spinning/);
});

test("each ambassador card is one link to their LinkedIn profile", async ({ page }) => {
  await page.goto("/");
  const cards = page.locator("a.host");
  await expect(cards).toHaveCount(2);
  for (const card of await cards.all()) {
    await expect(card).toHaveAttribute("href", /^https:\/\/www\.linkedin\.com\/in\//);
  }
  // The two cards fill the width of the page content.
  const wrap = (await page.locator("#hosts-title").locator("xpath=ancestor::div[contains(@class,'wrap')]").boundingBox())!;
  const last = (await cards.last().boundingBox())!;
  if (page.viewportSize()!.width > 700) expect(wrap.x + wrap.width - (last.x + last.width)).toBeLessThan(80);
});

test("the talk form sends to Google Forms and confirms", async ({ page }) => {
  let posted = "";
  await page.route("https://docs.google.com/forms/**", async (route) => {
    posted = route.request().url();
    await route.fulfill({ status: 200, body: "" });
  });
  await page.goto("/speak/");
  const form = page.locator("#speak-form");
  await form.locator("[name=name]").fill("Test Person");
  await form.locator("[name=email]").fill("test@example.com");
  await form.locator("[name=topic]").fill("What I built with Claude");
  await page.waitForTimeout(2600); // the form ignores anything faster than a person
  await form.locator("button[type=submit]").click();
  await expect(page.locator("#speak-form-done")).toBeVisible();
  expect(posted).toContain("/formResponse");
});

test("a bot that fills the hidden field is not sent anywhere", async ({ page }) => {
  let posted = false;
  await page.route("https://docs.google.com/forms/**", async (route) => {
    posted = true;
    await route.fulfill({ status: 200, body: "" });
  });
  await page.goto("/speak/");
  const form = page.locator("#speak-form");
  await form.locator("[name=name]").fill("Bot");
  await form.locator("[name=email]").fill("bot@example.com");
  await form.locator("[name=topic]").fill("Spam");
  await form.locator("[name=company_url]").evaluate((el: HTMLInputElement) => (el.value = "http://spam.example"));
  await page.waitForTimeout(2600);
  await form.locator("button[type=submit]").click();
  await expect(page.locator("#speak-form-done")).toBeVisible();
  expect(posted).toBe(false);
});

test("no page ever links to the WhatsApp group itself", async ({ page }) => {
  for (const path of ["/join/", "/events/"]) {
    await page.goto(path);
    await expect(page.locator('a[href*="whatsapp.com"], a[href*="wa.me"]'), path).toHaveCount(0);
  }
});

test("the events page invites people to join, with the ways to do it", async ({ page }) => {
  await page.goto("/events/");
  const join = page.locator("#upcoming .join");
  await expect(join.getByRole("heading", { name: "Join the community" })).toBeVisible();
  await expect(join.getByRole("link", { name: "Luma calendar" })).toHaveAttribute("href", /^https:\/\/luma\.com\//);
  await expect(join.getByRole("link", { name: "Discord" })).toHaveAttribute("href", /^https:\/\/discord\.gg\//);
  await expect(join.getByRole("link", { name: /on LinkedIn$/ })).toHaveCount(2);
  await join.getByRole("link", { name: "WhatsApp group" }).click();
  await expect(page).toHaveURL(/\/join\/#whatsapp$/);
  await expect(page.locator("#whatsapp-title")).toBeInViewport();
});

// If the request form ever loses its Google Form (src/scripts/form-ids.ts),
// the page says to ask an ambassador instead.
test("the join page takes WhatsApp requests, or says who to ask", async ({ page }) => {
  let posted = "";
  let sent = "";
  await page.route("https://docs.google.com/forms/**", async (route) => {
    posted = route.request().url();
    sent = route.request().postData() ?? "";
    await route.fulfill({ status: 200, body: "" });
  });
  await page.goto("/join/");
  await expect(page.locator("form")).toHaveCount(isLive("whatsapp-form") ? 1 : 0);
  if (!isLive("whatsapp-form")) {
    await expect(page.locator("#whatsapp")).toContainText("Ask an ambassador at an event");
    return;
  }
  const form = page.locator("#whatsapp-form");
  await form.locator("[name=name]").fill("Test Person");
  await form.locator("[name=phone]").fill("not a number");
  await page.waitForTimeout(2600); // the form ignores anything faster than a person
  await form.locator("button[type=submit]").click();
  await expect(form).toBeVisible();
  expect(posted).toBe("");
  await form.locator("[name=phone]").fill("+27 82 123 4567");
  await form.locator("[name=about]").selectOption("Event");
  await form.locator("button[type=submit]").click();
  await expect(page.locator("#whatsapp-form-done")).toBeVisible();
  expect(posted).toContain("/formResponse");
  expect(sent).toContain("+27 82 123 4567");
  expect(sent).toContain("Event");
});

test("the event page lines its sections up on the same two columns", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/events/");
  const href = await page.locator("#past a[href^='/events/']").first().getAttribute("href");
  await page.goto(href!);
  const rows = page.locator(".event-body .split");
  expect(await rows.count()).toBeGreaterThan(1);
  const edges = [];
  for (const row of await rows.all()) {
    const label = (await row.locator(":scope > *").first().boundingBox())!;
    const content = (await row.locator(":scope > *").nth(1).boundingBox())!;
    edges.push([Math.round(label.x), Math.round(content.x)]);
  }
  // Every heading starts on one line down the page, and so does every content block.
  for (const [label, content] of edges) {
    expect(label).toBe(edges[0][0]);
    expect(content).toBe(edges[0][1]);
  }
});

test("the mountain scene: a click drops a strawberry and poking Clawd makes him speak", async ({ page }) => {
  await page.goto("/");
  const scene = page.locator("[data-scene]");
  await scene.scrollIntoViewIfNeeded();
  const before = await scene.locator(".berry").count();
  const box = (await scene.boundingBox())!;
  await page.mouse.click(box.x + box.width * 0.5, box.y + 30);
  await expect(scene.locator(".berry")).toHaveCount(before + 1);
  const clawd = (await scene.locator("[data-clawd]").boundingBox())!;
  await page.mouse.click(clawd.x + clawd.width / 2, clawd.y + clawd.height / 2);
  await expect(scene.locator("[data-bubble]")).toHaveClass(/is-on/);
  await expect(scene.locator(".berry")).toHaveCount(before + 1);
});

test("with reduced motion Clawd still strolls along the shore", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const clawd = page.locator("[data-clawd]");
  await clawd.scrollIntoViewIfNeeded();
  const start = (await clawd.boundingBox())!.x;
  await expect.poll(async () => (await clawd.boundingBox())!.x, { timeout: 5000 }).toBeGreaterThan(start + 5);
});
