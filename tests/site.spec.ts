import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// Every page of the site. Add new pages here.
const pages = ["/", "/events/", "/speak/", "/partner/", "/join/", "/privacy/", "/styleguide/", "/404.html"];

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

test("robots, sitemap and security.txt are served", async ({ request }) => {
  for (const path of ["/robots.txt", "/sitemap-index.xml", "/.well-known/security.txt", "/og.png", "/CNAME"]) {
    expect((await request.get(path)).status(), path).toBe(200);
  }
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

test("the join page has no form and never links to WhatsApp", async ({ page }) => {
  await page.goto("/join/");
  await expect(page.locator("form")).toHaveCount(0);
  await expect(page.locator('a[href*="whatsapp.com"], a[href*="wa.me"]')).toHaveCount(0);
});

test("the mixer short link forwards to the app", async ({ request }) => {
  const html = await (await request.get("/mixer/")).text();
  expect(html).toContain("https://table-mixer.vercel.app/");
});
