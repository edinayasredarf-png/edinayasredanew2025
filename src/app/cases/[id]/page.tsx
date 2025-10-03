// src/app/cases/[id]/page.tsx
import React from 'react'; // делает файл модулем для TS

type PageProps = {
  params: { id: string };
  searchParams?: Record<string, string | string[] | undefined>;
};

// если страница зависит от БД/запросов — отключи SSG:
export const dynamic = 'force-dynamic';

export default function CasePage({ params }: PageProps) {
  const { id } = params;
  return (
    <main className="max-w-4xl mx-auto px-5 py-8">
      <h1 className="text-2xl font-bold">Кейс #{id}</h1>
      <p className="text-gray-600">Здесь контент кейса. Замените на вашу разметку.</p>
    </main>
  );
}

