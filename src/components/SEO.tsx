import { Helmet } from "react-helmet-async";

const BASE_URL = "https://debshub-diagnostics.lovable.app";

interface SEOProps {
  title: string;
  description: string;
  path: string;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

/**
 * Per-route head metadata. Sets a unique title, description, canonical, and
 * self-referencing og:url/og:title/og:description so social crawlers and
 * search engines see route-specific tags instead of the sitewide fallback.
 */
export function SEO({ title, description, path, jsonLd }: SEOProps) {
  const url = `${BASE_URL}${path}`;
  const trimmedTitle = title.length > 60 ? title.slice(0, 57).trimEnd() + "…" : title;
  const trimmedDesc =
    description.length > 160 ? description.slice(0, 157).trimEnd() + "…" : description;
  const schemas = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];
  return (
    <Helmet>
      <title>{trimmedTitle}</title>
      <meta name="description" content={trimmedDesc} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={trimmedTitle} />
      <meta property="og:description" content={trimmedDesc} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />
      <meta name="twitter:title" content={trimmedTitle} />
      <meta name="twitter:description" content={trimmedDesc} />
      {schemas.map((s, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(s)}
        </script>
      ))}
    </Helmet>
  );
}
