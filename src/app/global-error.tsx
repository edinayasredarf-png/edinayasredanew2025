'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-6xl font-bold text-gray-900 mb-4">500</h1>
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">Критическая ошибка</h2>
            <p className="text-gray-600 mb-8">Произошла критическая ошибка в приложении.</p>
            <button
              onClick={reset}
              className="bg-[#0077FF] text-white px-6 py-3 rounded-lg hover:bg-[#005fcc] transition-colors"
            >
              Попробовать снова
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
