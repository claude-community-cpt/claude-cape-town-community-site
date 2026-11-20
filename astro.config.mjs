import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

// The site is plain static files served by GitHub Pages at the domain in public/CNAME.
export default defineConfig({
  site: "https://claudecapetown.com",
  trailingSlash: "always",
  // claudecapetown.com/mixer forwards to the Table Mixer app (repo: coffee-chat).
  redirects: {
    "/mixer": "https://table-mixer.vercel.app/",
  },
  integrations: [
    sitemap({
      // Utility pages that should not show up in search.
      filter: (page) => !/\/(styleguide|mixer|404)\/?$/.test(page),
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
