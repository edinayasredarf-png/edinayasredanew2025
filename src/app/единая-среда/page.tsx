import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Единая среда — цифровая платформа для управления территориями | ЕдинаяСреда.рф',
  description: 'Единая среда РФ — современная цифровая платформа для учёта, управления и мониторинга территорий и объектов. Цифровизация территорий, управление лесами, инвентаризация объектов.',
  keywords: [
    'единая среда',
    'единая среда рф', 
    'единаясреда.рф',
    'цифровая платформа',
    'управление территориями',
    'цифровизация территорий',
    'управление лесами',
    'инвентаризация объектов',
    'мониторинг территорий',
    'учёт территорий',
    'цифровые технологии',
    'ГИС платформа',
    'территориальное планирование'
  ],
  alternates: {
    canonical: '/единая-среда',
  },
  openGraph: {
    title: 'Единая среда — цифровая платформа для управления территориями',
    description: 'Цифровизация учёта, управления и мониторинга территорий и объектов.',
    url: '/единая-среда',
  },
};

export default function EdinayaSredaPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            Единая среда — цифровая платформа для управления территориями
          </h1>
          
          <div className="prose prose-lg max-w-none text-gray-700">
            <p className="text-xl mb-6">
              <strong>Единая среда РФ</strong> — это современная цифровая платформа, 
              предназначенная для комплексного учёта, управления и мониторинга территорий и объектов.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
              Что такое Единая среда?
            </h2>
            
            <p className="mb-4">
              <strong>Единая среда</strong> — это инновационная цифровая платформа, которая 
              обеспечивает полный цикл управления территориями: от инвентаризации объектов 
              до мониторинга их состояния в реальном времени.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
              Основные возможности платформы Единая среда
            </h2>

            <ul className="list-disc list-inside space-y-2 mb-6">
              <li><strong>Цифровизация территорий</strong> — полный переход на цифровые технологии учёта</li>
              <li><strong>Управление лесами</strong> — комплексный мониторинг лесных ресурсов</li>
              <li><strong>Инвентаризация объектов</strong> — точный учёт всех территориальных объектов</li>
              <li><strong>Мониторинг территорий</strong> — постоянное отслеживание состояния объектов</li>
              <li><strong>Территориальное планирование</strong> — стратегическое развитие территорий</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
              Преимущества использования Единой среды
            </h2>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">Эффективность</h3>
                <p className="text-blue-800">
                  Автоматизация процессов учёта и управления территориями 
                  значительно повышает эффективность работы.
                </p>
              </div>
              
              <div className="bg-green-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-green-900 mb-2">Точность</h3>
                <p className="text-green-800">
                  Цифровые технологии обеспечивают высокую точность 
                  инвентаризации и мониторинга объектов.
                </p>
              </div>
              
              <div className="bg-purple-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-purple-900 mb-2">Прозрачность</h3>
                <p className="text-purple-800">
                  Полная прозрачность процессов управления территориями 
                  и доступ к актуальной информации.
                </p>
              </div>
              
              <div className="bg-orange-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-orange-900 mb-2">Интеграция</h3>
                <p className="text-orange-800">
                  Возможность интеграции с существующими системами 
                  и ГИС-платформами.
                </p>
              </div>
            </div>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
              Кому подходит Единая среда?
            </h2>

            <p className="mb-4">
              Платформа <strong>Единая среда РФ</strong> предназначена для:
            </p>

            <ul className="list-disc list-inside space-y-2 mb-6">
              <li>Органов государственной власти и местного самоуправления</li>
              <li>Лесных хозяйств и природоохранных организаций</li>
              <li>Муниципальных образований</li>
              <li>Коммерческих организаций, работающих с территориями</li>
              <li>Научно-исследовательских институтов</li>
            </ul>

            <div className="bg-gray-100 p-6 rounded-lg mt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Узнайте больше о Единой среде
              </h3>
              <div className="flex flex-wrap gap-4">
                <Link 
                  href="/services" 
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Наши услуги
                </Link>
                <Link 
                  href="/cases" 
                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Кейсы
                </Link>
                <Link 
                  href="/contacts" 
                  className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Связаться с нами
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
