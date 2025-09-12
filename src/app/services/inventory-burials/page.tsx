"use client";
import Layout from '../../../components/Layout';
import Image from 'next/image';
import InterfaceSlider from '../../../components/InterfaceSlider';


export default function InventoryBurialsPage() {
  const handleKP = () => {
    window.dispatchEvent(new CustomEvent('openKPModal'));
  };

  const handleConsult = () => {
    window.dispatchEvent(new CustomEvent('openConsultModal'));
  };

  const advantages = [
    {
      icon: '/icons/эксперты.svg',
      label: 'Признанные эксперты',
      description: 'Мы – признанные эксперты в проведении инвентаризации кладбищ и оцифровке данных. Наш сервис «Единая среда» включен в реестр Российского программного обеспечения.'
    },
    {
      icon: '/icons/Соответстиве требованиям.svg',
      label: 'Соответствие требованиям',
      description: 'Работаем в соответствии с положениями постановления Правительства №2424-р от 02.09.2021 года. Знаем как правильно организовать процесс инвентаризации.'
    },
    {
      icon: '/icons/information.svg',
      label: 'Полная информация',
      description: 'Система включает возможности для получения полной и развернутой информации по каждому месту захоронения. Данные можно использовать для отчетов и планирования.'
    },
    {
      icon: '/icons/новое оборудование.svg',
      label: 'Новое оборудование',
      description: 'Используем новое оборудование высокой точности, не имеющее аналогов. Обеспечиваем максимальную точность при проведении инвентаризации.'
    },
    {
      icon: '/icons/Безопасность данных.svg',
      label: 'Безопасность данных',
      description: 'Обеспечиваем гарантию и безопасность ваших данных. Все информация надежно защищена и хранится в соответствии с требованиями законодательства.'
    },
    {
      icon: '/icons/Постоплата.svg',
      label: 'Постоплата',
      description: 'Предлагаем уникальную возможность воспользоваться услугой с опцией постоплаты. Сначала получаете услугу, а оплачиваете позже.'
    },
  ];

  const AdvantageCard: React.FC<{ icon: string; label: string; description: string; withRightBorder?: boolean; withBottomBorder?: boolean }> = ({ icon, label, description, withRightBorder, withBottomBorder }) => (
    <div className={`flex flex-col h-auto p-8 ${withRightBorder ? 'border-r border-grey-92' : ''} ${withBottomBorder ? 'border-b border-grey-92' : ''}`}>
      <div className="flex items-start mb-4">
        <div className="w-[60px] h-[60px] min-w-[60px] flex items-center justify-center bg-[#0077FF] rounded-[20px] mr-4 flex-shrink-0">
          <Image src={icon} alt="" width={28} height={28} className="w-7 h-7" />
        </div>
        <div className="flex-1">
          <div className="text-black text-base md:text-lg lg:text-xl font-normal leading-7 mb-3">
            {label}
          </div>
          <div className="text-gray-600 text-sm md:text-base leading-6">
            {description}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Layout>
      
      {/* SEO */}
      {/* Метаданные страницы */}
      
      {/* Hero Section */}
      <section className="bg-black text-white rounded-b-[20px] relative overflow-hidden min-h-[400px]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-20 relative z-10">
          <div className="relative flex flex-col lg:flex-row items-center lg:items-stretch gap-16">
            <div className="flex-1 lg:basis-3/5 text-left flex flex-col justify-center z-20">
              <h1 className="text-4xl sm:text-5xl md:text-[78px] font-medium leading-tight">
                Инвентаризация<br />мест захоронений
              </h1>
              <p className="mt-8 text-xl sm:text-[27px] text-gray-300 max-w-2xl">
                Все муниципалитеты обязаны до 31 декабря 2025 года создать реестр мест захоронений в соответствии с распоряжением Правительства РФ №2424-р
              </p>
              <div className="mt-10 flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleKP}
                  className="inline-flex items-center justify-center bg-[#0077FF] text-white text-sm md:text-base lg:text-lg font-medium px-6 py-4 md:px-8 md:py-5 text-lg md:text-2xl rounded-xl hover:bg-[#0077FF]/90 transition-colors duration-200 focus:outline-none"
                >
                  Получить КП
                </button>
                <button
                  onClick={handleConsult}
                  className="inline-block bg-white text-[#0077FF] border border-[#0077FF] text-sm md:text-base lg:text-lg font-medium px-6 py-4 md:px-8 md:py-5 text-lg md:text-2xl rounded-xl hover:bg-[#0077FF]/10 transition-colors"
                >
                  Получить консультацию
                </button>
              </div>
            </div>
            <div className="flex-1 w-full h-full relative flex justify-center items-end lg:hidden z-10">
              <img
                src="/img/cemetery1.png"
                alt="Инвентаризация мест захоронений"
                className="w-full max-w-[500px] object-contain"
                style={{ height: 'auto' }}
              />
            </div>
          </div>
          <div className="hidden lg:block absolute right-0 bottom-0 z-10 w-[40%] max-w-[500px] h-auto pointer-events-none">
            <img
                src="/img/cemetery1.png"
								alt="Инвентаризация мест захоронений"
              className="w-full object-contain"
              style={{ height: 'auto' }}
            />
          </div>
        </div>
      </section>

      {/* Почему выбирают нас */}
      <section className="w-full flex flex-col items-center mt-16">
        <div className="max-w-[1480px] w-full flex flex-col items-start gap-16 px-5 md:px-8">
          {/* Заголовок */}
          <div className="w-full flex flex-col items-center">
            <h2 className="text-center font-medium text-black text-lg md:text-2xl lg:text-4xl leading-tight">
              Почему выбирают именно нас
            </h2>
          </div>
          {/* Список */}
          <div className="w-full rounded-[20px] outline outline-1 outline-grey-92 grid grid-cols-1 md:grid-cols-3 gap-0">
            {advantages.map((advantage, idx) => (
              <AdvantageCard
                key={advantage.label}
                icon={advantage.icon}
                label={advantage.label}
                description={advantage.description}
                withRightBorder={idx % 3 !== 2 && idx !== advantages.length - 1}
                withBottomBorder={idx < 3}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Что включает услуга */}
      <section className=" py-16 md:py-24">
        <div className="max-w-[1400px] mx-auto px-4">
          <h2 className="text-4xl text-black font-medium mb-12 text-center">
            Что включает услуга
          </h2>

                    {/* 4 шага до полной инвентаризации */}
          <div className="mb-16">
            <h3 className="text-2xl md:text-3xl lg:text-4xl text-black font-medium mb-6 md:mb-12 text-center">
              4 шага до полной инвентаризации
            </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                <div className="bg-white rounded-[20px] p-0 min-h-[160px] md:min-h-[200px] transition-all duration-300 hover:ring-1 hover:ring-[#0077FF] hover:ring-offset-2 hover:ring-offset-grey-97 overflow-hidden">
                  <div className="flex h-full flex-col sm:flex-row">
                  <div className="w-full sm:w-[160px] md:w-[200px] lg:w-[240px] h-[160px] sm:h-auto flex-shrink-0">
                    <Image src="/img/Step 01.png" alt="Выбор программного продукта" width={240} height={160} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 p-4 md:p-8">
                    <h4 className="text-black text-base md:text-lg lg:text-xl font-normal leading-7 mb-3">
                      <span className="text-[#0077FF] font-medium">Шаг 1.</span> Выбор программного продукта
                    </h4>
                    <p className="text-gray-600 text-sm md:text-base leading-6">
                      Выбор АИС «Единая среда» для хранения, обработки и актуализации информации
                    </p>
                  </div>
                </div>
              </div>

                              <div className="bg-white rounded-[20px] p-0 min-h-[160px] md:min-h-[200px] transition-all duration-300 hover:ring-1 hover:ring-[#0077FF] hover:ring-offset-2 hover:ring-offset-grey-97 overflow-hidden">
                  <div className="flex h-full flex-col sm:flex-row">
                  <div className="w-full sm:w-[160px] md:w-[200px] lg:w-[240px] h-[160px] sm:h-auto flex-shrink-0">
                    <Image src="/img/Step 02.png" alt="Внесение имеющихся данных" width={240} height={160} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 p-4 md:p-8">
                    <h4 className="text-black text-base md:text-lg lg:text-xl font-normal leading-7 mb-3">
                      <span className="text-[#0077FF] font-medium">Шаг 2.</span> Внесение имеющихся данных
                    </h4>
                    <p className="text-gray-600 text-sm md:text-base leading-6">
                      Оцифровка существующих архивов и начало ведения цифрового учета
                    </p>
                  </div>
                </div>
              </div>

                              <div className="bg-white rounded-[20px] p-0 min-h-[160px] md:min-h-[200px] transition-all duration-300 hover:ring-1 hover:ring-[#0077FF] hover:ring-offset-2 hover:ring-offset-grey-97 overflow-hidden">
                  <div className="flex h-full flex-col sm:flex-row">
                  <div className="w-full sm:w-[160px] md:w-[200px] lg:w-[240px] h-[160px] sm:h-auto flex-shrink-0">
                    <Image src="/img/Step 03.png" alt="Подготовительные и полевые работы" width={240} height={160} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 p-4 md:p-8">
                    <h4 className="text-black text-base md:text-lg lg:text-xl font-normal leading-7 mb-3">
                      <span className="text-[#0077FF] font-medium">Шаг 3.</span> Подготовительные и полевые работы
                    </h4>
                    <p className="text-gray-600 text-sm md:text-base leading-6">
                      Визуальное обследование, лазерное сканирование, определение координат
                    </p>
                  </div>
                </div>
              </div>

                              <div className="bg-white rounded-[20px] p-0 min-h-[160px] md:min-h-[200px] transition-all duration-300 hover:ring-1 hover:ring-[#0077FF] hover:ring-offset-2 hover:ring-offset-grey-97 overflow-hidden">
                  <div className="flex h-full flex-col sm:flex-row">
                  <div className="w-full sm:w-[160px] md:w-[200px] lg:w-[240px] h-[160px] sm:h-auto flex-shrink-0">
                    <Image src="/img/Step 04.png" alt="Камеральные работы" width={240} height={160} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 p-4 md:p-8">
                    <h4 className="text-black text-base md:text-lg lg:text-xl font-normal leading-7 mb-3">
                      <span className="text-[#0077FF] font-medium">Шаг 4.</span> Камеральные работы
                    </h4>
                    <p className="text-gray-600 text-sm md:text-base leading-6">
                      Анализ результатов, перевод в электронный вид, создание ГИС-карт
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Возможности системы */}
          <div>
            <h3 className="text-2xl font-semibold text-black mb-12 text-center">
              Возможности системы
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-4xl p-3 md:p-4 h-auto flex flex-col gap-2 transition-all duration-300 hover:ring-1 hover:ring-[#0077FF] hover:ring-offset-2 hover:ring-offset-grey-97">
                <div className="w-[60px] h-[60px] flex items-center justify-center bg-[#0077FF] rounded-[20px] mb-4 mx-auto">
                  <Image src="/icons/information.svg" alt="Полная информация" width={28} height={28} className="w-7 h-7" />
                </div>
                <div className="flex flex-col justify-center h-full pl-2 md:pl-4">
                  <div className="flex items-center gap-3 mb-2 justify-center md:justify-start">
                    <h3 className="text-xl font-medium text-black text-center md:text-left">Полная информация</h3>
                  </div>
                  <p className="text-base text-gray-500 text-center md:text-left mx-auto md:mx-0 mb-4">
                    Получение аналитической отчетности в удобном формате, использование данных для планирования новых кладбищ
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-4xl p-3 md:p-4 h-auto flex flex-col gap-2 transition-all duration-300 hover:ring-1 hover:ring-[#0077FF] hover:ring-offset-2 hover:ring-offset-grey-97">
                <div className="w-[60px] h-[60px] flex items-center justify-center bg-[#0077FF] rounded-[20px] mb-4 mx-auto">
								<Image src="/icons/Eye.svg" alt="Контроль и безопасность" width={28} height={28} className="w-7 h-7" />

                </div>
                <div className="flex flex-col justify-center h-full pl-2 md:pl-4">
                  <div className="flex items-center gap-3 mb-2 justify-center md:justify-start">
                    <h3 className="text-xl font-medium text-black text-center md:text-left">Контроль и безопасность</h3>
                  </div>
                  <p className="text-base text-gray-500 text-center md:text-left mx-auto md:mx-0 mb-4">
                    Контроль возможных нарушений и соблюдения правил, планирование мероприятий по уходу
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-4xl p-3 md:p-4 h-auto flex flex-col gap-2 transition-all duration-300 hover:ring-1 hover:ring-[#0077FF] hover:ring-offset-2 hover:ring-offset-grey-97">
                <div className="w-[60px] h-[60px] flex items-center justify-center bg-[#0077FF] rounded-[20px] mb-4 mx-auto">
								<Image src="/icons/Statistic.svg" alt="Статистика" width={28} height={28} className="w-7 h-7" />

                </div>
                <div className="flex flex-col justify-center h-full pl-2 md:pl-4">
                  <div className="flex items-center gap-3 mb-2 justify-center md:justify-start">
                    <h3 className="text-xl font-medium text-black text-center md:text-left">Статистика и анализ</h3>
                  </div>
                  <p className="text-base text-gray-500 text-center md:text-left mx-auto md:mx-0 mb-4">
                    Формирование списка бесхозных мест погребений, подсчет статистики по видам захоронений
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-4xl p-3 md:p-4 h-auto flex flex-col gap-2 transition-all duration-300 hover:ring-1 hover:ring-[#0077FF] hover:ring-offset-2 hover:ring-offset-grey-97">
                <div className="w-[60px] h-[60px] flex items-center justify-center bg-[#0077FF] rounded-[20px] mb-4 mx-auto">
								<Image src="/icons/Actual.svg" alt="Актуальные данные" width={28} height={28} className="w-7 h-7" />

                </div>
                <div className="flex flex-col justify-center h-full pl-2 md:pl-4">
                  <div className="flex items-center gap-3 mb-2 justify-center md:justify-start">
                    <h3 className="text-xl font-medium text-black text-center md:text-left">Актуальные данные</h3>
                  </div>
                  <p className="text-base text-gray-500 text-center md:text-left mx-auto md:mx-0 mb-4">
                    Ежедневная актуальная информация по объекту, обновление данных в реальном времени
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Слайдер интерфейса системы */}
      <InterfaceSlider
        title="Интерфейс системы учета кладбищ"
        subtitle="Управляйте местами захоронений, ведите учет и аналитику — всё в одной цифровой платформе"
        images={[
          { src: '/img/es_interface1.webp', alt: 'Интерфейс системы учета кладбищ - Карта' },
          { src: '/img/es_interface2.webp', alt: 'Интерфейс системы учета кладбищ - База данных' },
          { src: '/img/es_interface3.webp', alt: 'Интерфейс системы учета кладбищ - Аналитика' },
          { src: '/img/es_interface4.webp', alt: 'Интерфейс системы учета кладбищ - Отчеты' },
          { src: '/img/es_interface5.webp', alt: 'Интерфейс системы учета кладбищ - Управление' },
          { src: '/img/es_interface6.webp', alt: 'Интерфейс системы учета кладбищ - Мониторинг' },
        ]}
      />

      {/* Цены */}
      <section className="py-16 md:py-24">
        <div className="max-w-[1400px] mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl text-black font-medium mb-8">
              Стоимость услуги
            </h2>
            <div className="bg-white rounded-4xl p-8 md:p-12 ">

              <p className="text-gray-600 mb-8">
                Точная стоимость рассчитывается индивидуально в зависимости от объема работ и площади территории кладбища
              </p>
              <button
                onClick={handleKP}
                className="inline-flex items-center justify-center bg-[#0077FF] text-white px-8 py-4 rounded-xl font-medium hover:bg-[#0077FF]/90 transition-colors duration-200 focus:outline-none"
              >
                Получить коммерческое предложение
              </button>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}