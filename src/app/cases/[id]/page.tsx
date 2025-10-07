// src/app/cases/[id]/page.tsx
import React, { Suspense } from 'react';

export const dynamic = 'force-dynamic';

export default async function CasePage(props: any) {
  // В некоторых билдах Next генерит типы, где params — Promise.
  // Универсально распакуем: поддержит и объект, и Promise.
  const raw = props?.params;
  const params = raw && typeof raw.then === 'function' ? await raw : raw;
  const id = params?.id ?? 'unknown';

  // Если нужны query-параметры, берите их серверно из props.searchParams:
  // const tab = (props?.searchParams?.tab as string) ?? 'overview';

  return (
    <Suspense fallback={null}>
      <main className="max-w-4xl mx-auto px-5 py-8">
        <h1 className="text-2xl font-bold">Кейс #{id}</h1>
        <p className="text-gray-600">Здесь контент кейса. Замените на вашу разметку.</p>
        {/* Клиентские компоненты, где используются useSearchParams/usePathname,
            рендерьте ниже — они уже под Suspense. */}
      </main>
    </Suspense>
  );
}
