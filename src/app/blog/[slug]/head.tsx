import React from 'react';
import { sb_getPostBySlug } from '@/lib/blogStore';

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
  let title = 'Статья — Единая среда';
  let description = 'Статья блога «Единая среда». Новости, практика и кейсы цифровизации.';
  let ogImage = '/img/logo.png';
  try {
    const post = await sb_getPostBySlug(slug);
    if (post) {
      title = post.title ? `${post.title} — Единая среда` : title;
      const text = stripHtml(post.contentHtml || '');
      if (post.subtitle && post.subtitle.trim()) description = post.subtitle.trim();
      else if (text) description = text.slice(0, 180);
      if (post.cover) ogImage = post.cover;
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


