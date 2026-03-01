import type { APIRoute } from "astro";

export const GET: APIRoute = ({ url }) => {
  const text = `
User-agent: *
Allow: /

Sitemap: ${url.origin}/sitemap.xml
`.trim();

  return new Response(text, {
    headers: {
      "Content-Type": "text/plain",
      "Cache-Control": "public, max-age=86400",
    },
  });
};
