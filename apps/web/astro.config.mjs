import { defineConfig } from "astro/config";
import node from "@astrojs/node";
import tailwind from "@astrojs/tailwind";

export default defineConfig({
  site: process.env.SITE_URL || "http://localhost:3000",
  output: "server",
  adapter: node({ mode: "standalone" }),
  integrations: [
    tailwind({
      // Use our custom global.css (imported in Layout.astro)
      applyBaseStyles: false,
    }),
  ],
  compressHTML: true,
  prefetch: true,
  vite: {
    define: {
      __MEITHEAL_ASTRO_FIRST__: true,
    },
  },
});
