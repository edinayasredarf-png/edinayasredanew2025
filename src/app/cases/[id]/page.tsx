// src/app/cases/[id]/page.tsx
import React from 'react';

// Чтобы не кэшировало, если у тебя данные динамические
export const dynamic = 'force-dynamic';

type Params = { id: string };
type MaybePromise<T> = T | Promise<T>;

export default async function CasePage({
  params,
}: {
  params: MaybePromise<Params>;
}) {
  // Универсально "распаковываем" params: поддерживает объект и Promise
  const resolvedParams: Params =
    typeof (params as any)?.then === 'function'
      ? await (params as Promise<Params>)
      : (params as Params);

  const { id } = resolvedParams;

  return (
    <main className="max-w-4xl mx-auto px-5 py-8">
      <h1 className="text-2xl font-bold">Кейс #{id}</h1>
      <p className="text-gray-600">
        Здесь контент кейса. Замените на вашу разметку.
      </p>
    </main>
  );
}
