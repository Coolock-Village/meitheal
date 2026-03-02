import { defineConfig } from "astro/config";
import node from "@astrojs/node";

export default defineConfig({
  site: process.env.SITE_URL || "http://localhost:3000",
  output: "server",
  adapter: node({ mode: "standalone" }),
  integrations: [],
  compressHTML: true,
  prefetch: true,
  vite: {
    base: "./",
    define: {
      __MEITHEAL_ASTRO_FIRST__: true,
    },
  },
});
