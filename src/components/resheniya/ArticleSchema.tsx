import React from "react";

const BASE = "https://xn--80aakbcct4b2aj7m.xn--p1ai";

interface ArticleSchemaProps {
  /** относительный путь, напр. /resheniya/blagoustroystvo */
  path: string;
  headline: string;
  description: string;
  /** дата последнего обновления, ISO */
  dateModified?: string;
}

/**
 * Article + Organization publisher JSON-LD для информационных страниц раздела.
 * Сигналы E-E-A-T: автор — ГК «Единая среда», издатель с логотипом.
 */
export default function ArticleSchema({
  path,
  headline,
  description,
  dateModified = "2026-07-20",
}: ArticleSchemaProps) {
  const url = `${BASE}${path}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline,
    description,
    inLanguage: "ru-RU",
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    url,
    datePublished: "2026-07-20",
    dateModified,
    author: {
      "@type": "Organization",
      name: "Единая среда",
      url: BASE,
    },
    publisher: {
      "@type": "Organization",
      name: "Единая среда",
      url: BASE,
      logo: {
        "@type": "ImageObject",
        url: `${BASE}/img/logo.png`,
      },
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
