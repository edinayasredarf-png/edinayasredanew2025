// src/app/cases/[id]/page.tsx
import React, { Suspense } from 'react';

export const dynamic = 'force-dynamic';

type PageProps = {
  params: { id: string } | Promise<{ id: string }>;
  searchParams?: Record<string, string | string[] | undefined>;
};

export default async function CasePage(props: PageProps) {
  // Универсально распаковываем params: поддерживает объект и Promise
  const raw = props?.params;
  const resolved = (raw && typeof (raw as any).then === 'function') ? await raw : raw;
  const id = resolved?.id ?? 'unknown';

  // Если нужны query-параметры, бери их из props.searchParams (серверно)
  // const tab = (props.searchParams?.tab as string) ?? 'overview';

  return (
    <Suspense fallback={null}>
      <main className="max-w-4xl mx-auto px-5 py-8">
        <h1 className="text-2xl font-bold">Кейс #{id}</h1>
        <p className="text-gray-600">Здесь контент кейса. Замените на вашу разметку.</p>
        {/* Если ниже будут клиентские компоненты, которые внутри используют useSearchParams/usePathname,
            они уже находятся под Suspense-границей этой страницы. */}
      </main>
    </Suspense>
  );
}
