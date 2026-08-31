import { getLocalePath, localeConfig, locales } from '../i18n';

export const prerender = true;

const baseUrl = 'https://imgo.app';

export function GET() {
  const alternates = locales
    .map(
      (locale) =>
        `  <xhtml:link rel="alternate" hreflang="${localeConfig[locale].htmlLang}" href="${new URL(getLocalePath(locale, 'home'), baseUrl)}" />`,
    )
    .join('\n');

  const entries = locales
    .map(
      (locale) => `<url>
  <loc>${new URL(getLocalePath(locale, 'home'), baseUrl)}</loc>
${alternates}
  <xhtml:link rel="alternate" hreflang="x-default" href="${new URL('/', baseUrl)}" />
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
