import { defineConfig } from "astro/config";
import node from "@astrojs/node";
import tailwind from "@astrojs/tailwind";

export default defineConfig({
  site: process.env.SITE_URL || "http://localhost:3000",
  output: "server",
  trailingSlash: "never",
  adapter: node({ mode: "standalone" }),
  integrations: [tailwind()],
  compressHTML: true,
  prefetch: true,
  vite: {
    define: {
      __MEITHEAL_ASTRO_FIRST__: true,
    },
  },
});
