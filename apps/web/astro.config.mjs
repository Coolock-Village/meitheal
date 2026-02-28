import { defineConfig } from "astro/config";
import node from "@astrojs/node";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwind from "@astrojs/tailwind";

export default defineConfig({
  site: "https://meitheal.local",
  output: "server",
  adapter: node({ mode: "standalone" }),
  integrations: [
    mdx(),
    tailwind(),
    sitemap()
  ],
  vite: {
    define: {
      __MEITHEAL_ASTRO_FIRST__: true
    }
  }
});
