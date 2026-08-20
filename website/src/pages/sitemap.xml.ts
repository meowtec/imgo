export const prerender = true;

const urls = [
  {
    loc: 'https://imgo.app/',
    en: 'https://imgo.app/',
    zh: 'https://imgo.app/zh/',
  },
  {
    loc: 'https://imgo.app/zh/',
    en: 'https://imgo.app/',
    zh: 'https://imgo.app/zh/',
  },
];

export function GET() {
  const entries = urls
    .map(
      ({ loc, en, zh }) => `<url>
  <loc>${loc}</loc>
  <xhtml:link rel="alternate" hreflang="en" href="${en}" />
  <xhtml:link rel="alternate" hreflang="zh-CN" href="${zh}" />
  <xhtml:link rel="alternate" hreflang="x-default" href="${en}" />
</url>`,
    )
    .join('\n');

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries}
</urlset>
`,
    {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
      },
    },
  );
}
