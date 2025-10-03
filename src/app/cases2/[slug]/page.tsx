// src/app/cases2/[slug]/page.tsx
import React from 'react';

export const dynamic = 'force-dynamic';

export default async function CaseSlugPage(props: any) {
  const raw = props?.params;
  const params = (raw && typeof raw.then === 'function') ? await raw : raw;
  const slug = params?.slug ?? 'unknown';

  return (
    <main className="max-w-4xl mx-auto px-5 py-8">
      <h1 className="text-2xl font-bold">Кейс: {slug}</h1>
      <p className="text-gray-600">Контент для {slug}. Замените на вашу разметку.</p>
    </main>
  );
}
