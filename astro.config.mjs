import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import { execFileSync } from "node:child_process";

// When each page last changed, read from git, for the sitemap. Search engines
// use it to decide what to fetch again. If the history is not available (a
// shallow checkout, or no git) the date is simply left out.
const git = (...args) => {
  try {
    return execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return "";
  }
};
const fullHistory = git("rev-parse", "--is-shallow-repository") === "false";
function lastChanged(pageUrl) {
  if (!fullHistory) return undefined;
  const path = new URL(pageUrl).pathname.replace(/^\/|\/$/g, "");
  const event = path.match(/^events\/(.+)$/);
  const sources = event
    ? [`src/content/events/${event[1]}.md`]
    : path === "events"
      ? ["src/content/events", "src/pages/events/index.astro"]
      : path === ""
        ? ["src/content/events", "src/pages/index.astro"]
        : [`src/pages/${path}.astro`];
  return git("log", "-1", "--format=%cI", "--", ...sources) || undefined;
}

// The style guide (src/dev/styleguide.astro) shows every colour, type size and
// component. It is a working reference, so it exists only while running
// `npm run dev` (at /styleguide/) and is never part of the published site.
const devStyleguide = {
  name: "dev-styleguide",
  hooks: {
    "astro:config:setup": ({ command, injectRoute }) => {
      if (command === "dev") injectRoute({ pattern: "/styleguide", entrypoint: "./src/dev/styleguide.astro" });
    },
  },
};

// The site is plain static files served by GitHub Pages at the domain in public/CNAME.
export default defineConfig({
  site: "https://claudecapetown.com",
  trailingSlash: "always",
  // The old Gallery page forwards to past events; photos are on each event's page.
  // (claudecapetown.com/mixer also forwards, to the Table Mixer app. It is a
  // page of its own, src/pages/mixer.astro, so that the link has a preview.)
  redirects: {
    "/gallery": "/events/#past",
    // The Demos page is retired until there are demos to show.
    "/demos": "/events/",
  },
  integrations: [
    devStyleguide,
    sitemap({
      // Utility pages that should not show up in search.
      filter: (page) => !/\/(mixer|gallery|demos|404)\/?$/.test(page),
      serialize: (item) => ({ ...item, lastmod: lastChanged(item.url) }),
    }),
  ],
  build: {
    // Every stylesheet and script is its own file so the Content Security
    // Policy in src/layouts/Base.astro can forbid inline code.
    inlineStylesheets: "never",
  },
  vite: {
    build: { assetsInlineLimit: 0 },
  },
});
