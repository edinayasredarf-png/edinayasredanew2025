import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Страница не найдена</h2>
        <p className="text-gray-600 mb-8">Страница, которую вы ищете, не существует.</p>
        <Link 
          href="/" 
          className="bg-[#0077FF] text-white px-6 py-3 rounded-lg hover:bg-[#005fcc] transition-colors"
        >
          Вернуться на главную
        </Link>
      </div>
    </div>
  );
}
