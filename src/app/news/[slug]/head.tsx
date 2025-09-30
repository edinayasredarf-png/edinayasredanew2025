import React from 'react';
import { sb_getNewsBySlug } from '@/lib/blogStore';

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export default async function Head({ params }: { params: { slug: string } }) {
  const slug = params?.slug;
  let title = 'Новость — Единая среда';
  let description = 'Новости платформы «Единая среда». Обновления, анонсы и события.';
  let ogImage = '/img/logo.png';
  try {
    const n = await sb_getNewsBySlug(slug);
    if (n) {
      title = n.title ? `${n.title} — Единая среда` : title;
      const text = stripHtml(n.contentHtml || '');
      if (text) description = text.slice(0, 180);
      if (n.cover) ogImage = n.cover;
    }
  } catch {}

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta property="og:type" content="article" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
    </>
  );
}


