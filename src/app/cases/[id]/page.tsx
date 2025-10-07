// src/app/cases/[id]/page.tsx
import React, { Suspense } from 'react';

export const dynamic = 'force-dynamic';

type PageProps = {
  params: { id: string };
  searchParams?: Record<string, string | string[] | undefined>;
};

export default function CasePage({ params, searchParams }: PageProps) {
  const { id } = params;
  // Если нужны query-параметры:
  // const tab = (searchParams?.tab as string) ?? 'overview';

  return (
    <Suspense fallback={null}>
      <main className="max-w-4xl mx-auto px-5 py-8">
        <h1 className="text-2xl font-bold">Кейс #{id}</h1>
        <p className="text-gray-600">Здесь контент кейса. Замените на вашу разметку.</p>

        {/* Клиентские компоненты, которые внутри используют useSearchParams/usePathname,
            рендерите ниже — они уже под Suspense. */}
      </main>
    </Suspense>
  );
}
