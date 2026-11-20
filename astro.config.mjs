import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

// The site is plain static files served by GitHub Pages at the domain in public/CNAME.
export default defineConfig({
  site: "https://claudecapetown.com",
  trailingSlash: "always",
  // claudecapetown.com/mixer forwards to the Table Mixer app (repo: coffee-chat).
  // The old Gallery page forwards to past events; photos are on each event's page.
  redirects: {
    "/mixer": "https://table-mixer.vercel.app/",
    "/gallery": "/events/#past",
  },
  integrations: [
    sitemap({
      // Utility pages that should not show up in search.
      filter: (page) => !/\/(styleguide|mixer|gallery|404)\/?$/.test(page),
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
