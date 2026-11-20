import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

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
  // claudecapetown.com/mixer forwards to the Table Mixer app (repo: coffee-chat).
  // The old Gallery page forwards to past events; photos are on each event's page.
  redirects: {
    "/mixer": "https://table-mixer.vercel.app/",
    "/gallery": "/events/#past",
    // The Demos page is retired until there are demos to show.
    "/demos": "/events/",
  },
  integrations: [
    devStyleguide,
    sitemap({
      // Utility pages that should not show up in search.
      filter: (page) => !/\/(mixer|gallery|demos|404)\/?$/.test(page),
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
