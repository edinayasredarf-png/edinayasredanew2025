// src/app/cases/[id]/page.tsx
import React from 'react';

export const dynamic = 'force-dynamic';

export default async function CasePage(props: any) {
  // Универсально распаковываем params: поддерживает объект и Promise
  const raw = props?.params;
  const params = (raw && typeof raw.then === 'function') ? await raw : raw;
  const id = params?.id ?? 'unknown';

  return (
    <main className="max-w-4xl mx-auto px-5 py-8">
      <h1 className="text-2xl font-bold">Кейс #{id}</h1>
      <p className="text-gray-600">Здесь контент кейса. Замените на вашу разметку.</p>
    </main>
  );
}
