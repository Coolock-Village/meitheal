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
    plugins: [
      // Fix font 404s in HA ingress: @fontsource CSS embeds absolute
      // url(/_astro/font.woff2) paths. Static CSS files bypass middleware
      // rewriting, so browsers resolve against HA root → 404.
      // Since fonts & CSS both live in _astro/, relative paths work.
      {
        name: "fontsource-relative-paths",
        enforce: "post",
        generateBundle(_, bundle) {
          for (const [, chunk] of Object.entries(bundle)) {
            if (chunk.type === "asset" && chunk.fileName.endsWith(".css")) {
              chunk.source = String(chunk.source).replace(
                /url\(\s*(["']?)\/_astro\//g,
                "url($1./"
              );
            }
          }
        },
      },
    ],
    define: {
      __MEITHEAL_ASTRO_FIRST__: true,
    },
  },
});
