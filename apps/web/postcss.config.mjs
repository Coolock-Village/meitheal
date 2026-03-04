/**
 * PostCSS Configuration — Meitheal
 *
 * ONLY postcss-import here. @astrojs/tailwind automatically appends
 * tailwindcss + autoprefixer AFTER these user plugins.
 *
 * Pipeline: postcss-import → tailwindcss → autoprefixer
 *
 * postcss-import runs first and inlines all CSS @import statements,
 * so by the time tailwindcss processes the file, @tailwind directives
 * and @layer blocks from imported files coexist in a single stylesheet.
 *
 * DO NOT add tailwindcss or autoprefixer here — the Astro integration
 * adds them and having duplicates causes the first tailwindcss to run
 * before postcss-import, breaking @layer anchoring.
 */
export default {
  plugins: {
    'postcss-import': {},
  },
};
