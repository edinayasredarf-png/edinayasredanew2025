"use client";
import Layout from '../../../components/Layout';
import React, { useState } from 'react';

export default function ForestManagementPage() {
  const [openItems, setOpenItems] = useState<number[]>([]);

  const handleKP = () => {
    window.dispatchEvent(new CustomEvent('openKPModal'));
  };

  const handleConsult = () => {
    window.dispatchEvent(new CustomEvent('openConsultModal'));
  };

  const toggleItem = (index: number) => {
    setOpenItems(prev =>
      prev.includes(index)
        ? prev.filter(item => item !== index)
        : [...prev, index]
    );
  };

  return (
    <Layout>
      <div className="min-h-screen bg-[#F6F7F9]">
        {/* Hero Section */}
        <section className="bg-black text-white rounded-b-[20px] relative overflow-hidden min-h-[400px]">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-20 relative z-10">
            <div className="relative flex flex-col lg:flex-row items-center lg:items-stretch gap-16">
              <div className="flex-1 lg:basis-3/5 text-left flex flex-col justify-center z-20">
                <h1 className="text-4xl sm:text-5xl md:text-[78px] font-medium leading-tight">
                  Лесоустройство
                </h1>
                <p className="mt-8 text-xl sm:text-[27px] text-grey-92 max-w-2xl">
                  Комплекс работ по организации лесного фонда, описанию, учету и изучению лесов, разработке проектов ведения лесного хозяйства на перспективный период
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
                  src="/img/les.png"
                  alt="Лесоустройство"
                  className="w-full max-w-[500px] object-contain"
                  style={{ height: 'auto' }}
                />
              </div>
            </div>
            <div className="hidden lg:block absolute right-0 bottom-0 z-10 w-[40%] max-w-[500px] h-auto pointer-events-none">
              <img
                src="/img/les.png"
                alt="Лесоустройство"
                className="w-full object-contain"
                style={{ height: 'auto' }}
              />
            </div>
          </div>
        </section>

        {/* О компании */}
        <section className="py-16 md:py-24 ">
          <div className="max-w-[1480px] mx-auto px-5 md:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Левая колонка - Опыт и экспертиза */}
              <div className="flex flex-col justify-center">
                <div className="mb-8">
                  <div className="inline-flex items-center bg-[#0077FF]/10 text-[#0077FF] px-4 py-2 rounded-full text-sm font-medium mb-4">
                    <span className="mr-2">🏆</span>
                    Лидер в лесоустройстве
                  </div>
                  <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-black leading-tight mb-6">
                    Мы более 10 лет работаем на этом рынке и знаем об лесоустройстве всё
                  </h2>
                  <p className="text-lg text-gray-600 leading-relaxed">
                    Также мы работаем по всей стране, предоставляя качественные услуги лесоустройства с соблюдением всех требований законодательства.
                  </p>
                </div>

                {/* Статистика */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center">
                    <div className="text-3xl md:text-4xl font-bold text-[#0077FF] mb-2">10+</div>
                    <div className="text-sm text-gray-600">Лет опыта</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl md:text-4xl font-bold text-[#0077FF] mb-2">100+</div>
                    <div className="text-sm text-gray-600">Реализованных проектов</div>
                  </div>
                </div>
              </div>

              {/* Правая колонка - Что получаете */}
                              <div className="bg-[#F6F7F9] rounded-3xl p-8 bg-white">
                <h3 className="text-2xl font-bold text-black mb-6">
                  Предоставьте мероприятия по лесоустройству и вы получите
                </h3>
                <p className="text-gray-600 mb-8">
                  комплекс работ состоящих из:
                </p>
                <div className="space-y-6">
                  <div className="flex items-start group">
                    <div className="flex-shrink-0 w-12 h-12 bg-[#0077FF] rounded-full flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                      <span className="text-white font-bold text-lg">1</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-black mb-2">Проектирования</h4>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        Осуществляется как в отношении лесничеств, эксплуатационных, защитных и резервных лесов и особо защитных участков лесов, так и в отношении мероприятий, направленных на сохранение лесов
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start group">
                    <div className="flex-shrink-0 w-12 h-12 bg-[#0077FF] rounded-full flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                      <span className="text-white font-bold text-lg">2</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-black mb-2">Закрепления на местности</h4>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        Проводится в отношении лесничеств, участковых лесничеств, а также земель под эксплуатационными, защитными и резервными лесами и особо защитными участками лесов
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start group">
                    <div className="flex-shrink-0 w-12 h-12 bg-[#0077FF] rounded-full flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                      <span className="text-white font-bold text-lg">3</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-black mb-2">Таксации</h4>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        Качественно и в срок выполненную работу от экспертов в своей области
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleKP}
                  className="mt-8 inline-flex items-center justify-center bg-[#0077FF] text-white px-8 py-4 rounded-xl font-medium hover:bg-[#0077FF]/90 transition-colors duration-200 focus:outline-none w-full md:w-auto"
                >
                  Получить коммерческое предложение
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Для чего нужно */}
        <section className="py-16 md:py-24 ">
          <div className="max-w-[1480px] mx-auto px-5 md:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Левая карточка - Преимущества лесоустройства */}
              <div className="bg-white rounded-[20px] p-8 flex flex-col md:flex-row min-h-[276px]">
                <div className="flex-1 flex flex-col justify-between h-full">
                  <h3 className="font-medium text-black text-lg md:text-xl lg:text-2xl leading-9 mb-4">
                    Преимущества лесоустройства
                  </h3>
                  <ul className="text-black text-sm md:text-base lg:text-lg leading-7 mb-6 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-[#0077FF] text-lg">✓</span>
                      <span>Планирование деятельности по работе в лесах</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#0077FF] text-lg">✓</span>
                      <span>Достоверная информация о лесных участках</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#0077FF] text-lg">✓</span>
                      <span>Выполнение полномочий органов местного самоуправления</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#0077FF] text-lg">✓</span>
                      <span>Разработка Лесохозяйственного регламента</span>
                    </li>
                  </ul>
                  <button
                    onClick={handleConsult}
                    className="bg-[#0077FF] text-white px-6 py-3 rounded-xl font-medium hover:bg-[#005fcc] transition-colors self-start"
                  >
                    Получить консультацию
                  </button>
                </div>
                <div className="flex-shrink-0 flex justify-center items-end w-full md:w-auto mt-8 md:mt-0 md:ml-8">
                  <img
                    src="/img/услуга_лес.png"
                    alt="Лесоустройство"
                    className="w-auto h-auto max-w-[176px] object-contain"
                  />
                </div>
              </div>

              {/* Правая карточка - Проблемы, которые решает лесоустройство */}
              <div className="bg-white rounded-[20px] p-8 flex flex-col md:flex-row min-h-[276px]">
                <div className="flex-1 flex flex-col justify-between h-full">
                  <h3 className="font-medium text-black text-lg md:text-xl lg:text-2xl leading-9 mb-4">
                    Проблемы, которые решает лесоустройство
                  </h3>
                  <ul className="text-black text-sm md:text-base lg:text-lg leading-7 mb-6 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-rose-500 text-lg">✖</span>
                      <span>Отсутствие достоверной информации о лесных ресурсах</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-rose-500 text-lg">✖</span>
                      <span>Неэффективное планирование лесопользования</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-rose-500 text-lg">✖</span>
                      <span>Нарушения лесного законодательства</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-rose-500 text-lg">✖</span>
                      <span>Отсутствие контроля за лесными участками</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-rose-500 text-lg">✖</span>
                      <span>Сложности в управлении лесным фондом</span>
                    </li>
                  </ul>
                </div>
                <div className="flex-shrink-0 flex justify-center items-end w-full md:w-auto mt-8 md:mt-0 md:ml-8">
                  <img
                    src="/img/problem.png"
                    alt="Проблемы"
                    className="w-auto h-auto max-w-[176px] object-contain"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Как проводится лесоустройство */}
        <section className="py-16 md:py-24 bg-[#F6F7F9]">
          <div className="max-w-[1480px] mx-auto px-5 md:px-8">
            <h2 className="text-3xl md:text-4xl font-bold text-black text-center mb-16">
              Как проводится лесоустройство?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Карточка 1 - Подготовительный этап */}
              <div className="bg-white rounded-3xl p-8 hover:ring-2 hover:ring-[#0077FF] hover:ring-offset-2 transition-all duration-300">
                <div className="flex items-center mb-6">
                  <div className="w-16 h-16 bg-[#0077FF] rounded-full flex items-center justify-center mr-4">
                    <span className="text-white font-bold text-2xl">1</span>
                  </div>
                  <h3 className="text-xl font-bold text-black">Подготовительный этап</h3>
                </div>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Включает проведение первого лесоустроительного совещания, получение сведений от Заказчика, сбор и анализ данных, подготовку топографических карт и обеспечение космической съёмкой.
                </p>
                <button
                  onClick={() => toggleItem(0)}
                  className="text-[#0077FF] font-medium hover:text-[#0056CC] transition-colors flex items-center gap-2"
                >
                  <span>{openItems.includes(0) ? 'Скрыть' : 'Подробнее'}</span>
                  <svg
                    className={`w-5 h-5 transition-transform duration-300 ${
                      openItems.includes(0) ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    openItems.includes(0)
                      ? 'max-h-96 opacity-100 mt-6'
                      : 'max-h-0 opacity-0 mt-0'
                  }`}
                >
                  <div className="space-y-4 text-sm text-gray-600">
                    <div className="flex items-start">
                      <span className="text-[#0077FF] font-bold text-xs mr-3 mt-0.5">1</span>
                      <div>
                        <h4 className="font-semibold text-black mb-1">Проведение первого лесоустроительного совещания</h4>
                        <p className="text-gray-600 text-sm">
                          До начала полевых работ по вопросам организации выполнения лесоустройства, определения особенностей объекта лесотаксационных работ.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <span className="text-[#0077FF] font-bold text-xs mr-3 mt-0.5">2</span>
                      <div>
                        <h4 className="font-semibold text-black mb-1">Получение сведений от Заказчика</h4>
                        <p className="text-gray-600 text-sm">
                          О границах объекта таксации лесов и выполненных мероприятиях по охране, защите, воспроизводству лесов.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <span className="text-[#0077FF] font-bold text-xs mr-3 mt-0.5">3</span>
                      <div>
                        <h4 className="font-semibold text-black mb-1">Сбор и анализ данных</h4>
                        <p className="text-gray-600 text-sm">
                          Об изменениях, произошедших в лесах в результате хозяйственной деятельности, пожаров, воздействия вредных организмов.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <span className="text-[#0077FF] font-bold text-xs mr-3 mt-0.5">4</span>
                      <div>
                        <h4 className="font-semibold text-black mb-1">Подготовка топографических карт</h4>
                        <p className="text-gray-600 text-sm">
                          Подбор, установление наличия, заказ и приобретение топографических карт на территорию объекта работ.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <span className="text-[#0077FF] font-bold text-xs mr-3 mt-0.5">5</span>
                      <div>
                        <h4 className="font-semibold text-black mb-1">Обеспечение космической съёмкой</h4>
                        <p className="text-gray-600 text-sm">
                          Обеспечение работ материалами космической съёмки в соответствии с требованиями охвата всей площади лесничества.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Карточка 2 - Полевые работы */}
              <div className="bg-white rounded-3xl p-8 hover:ring-2 hover:ring-[#0077FF] hover:ring-offset-2 transition-all duration-300">
                <div className="flex items-center mb-6">
                  <div className="w-16 h-16 bg-[#0077FF] rounded-full flex items-center justify-center mr-4">
                    <span className="text-white font-bold text-2xl">2</span>
                  </div>
                  <h3 className="text-xl font-bold text-black">Полевые работы</h3>
                </div>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Включает выезд на объект работ, проведение тренировок, таксацию лесов с использованием специализированного оборудования и приемку-сдачу полевых работ.
                </p>
                <button
                  onClick={() => toggleItem(1)}
                  className="text-[#0077FF] font-medium hover:text-[#0056CC] transition-colors flex items-center gap-2"
                >
                  <span>{openItems.includes(1) ? 'Скрыть' : 'Подробнее'}</span>
                  <svg
                    className={`w-5 h-5 transition-transform duration-300 ${
                      openItems.includes(1) ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    openItems.includes(1)
                      ? 'max-h-96 opacity-100 mt-6'
                      : 'max-h-0 opacity-0 mt-0'
                  }`}
                >
                  <div className="space-y-4 text-sm text-gray-600">
                    <div className="flex items-start">
                      <span className="text-[#0077FF] font-bold text-xs mr-3 mt-0.5">1</span>
                      <div>
                        <h4 className="font-semibold text-black mb-1">Выезд на объект работ</h4>
                        <p className="text-gray-600 text-sm">
                          Начало полевых работ с выездом на объект.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <span className="text-[#0077FF] font-bold text-xs mr-3 mt-0.5">2</span>
                      <div>
                        <h4 className="font-semibold text-black mb-1">Проведение тренировок</h4>
                        <p className="text-gray-600 text-sm">
                          Тренировки представителя Заказчика и Исполнителя работ.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <span className="text-[#0077FF] font-bold text-xs mr-3 mt-0.5">3</span>
                      <div>
                        <h4 className="font-semibold text-black mb-1">Таксация лесов</h4>
                        <p className="text-gray-600 text-sm">
                          Таксация лесов с загрузкой собранных данных в облако хранения информации для выявления, учета и оценки характеристик лесных ресурсов.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <span className="text-[#0077FF] font-bold text-xs mr-3 mt-0.5">4</span>
                      <div>
                        <h4 className="font-semibold text-black mb-1">Методы таксации</h4>
                        <p className="text-gray-600 text-sm">
                          Таксация лесов осуществляется по первому таксационному разряду с использованием материалов ДЗЗ глазомерно-измерительным способом.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <span className="text-[#0077FF] font-bold text-xs mr-3 mt-0.5">5</span>
                      <div>
                        <h4 className="font-semibold text-black mb-1">Специализированное оборудование</h4>
                        <p className="text-gray-600 text-sm">
                          Использование специализированных программ, мерной вилки, маятникового высотомера, измерительной ленты и другого оборудования.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <span className="text-[#0077FF] font-bold text-xs mr-3 mt-0.5">6</span>
                      <div>
                        <h4 className="font-semibold text-black mb-1">Приемка-сдача полевых работ</h4>
                        <p className="text-gray-600 text-sm">
                          Специалистами Заказчика и Исполнителя проведена совместная проверка работ по таксации, приемка-сдача полевых работ.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Карточка 3 - Камеральные работы */}
              <div className="bg-white rounded-3xl p-8 hover:ring-2 hover:ring-[#0077FF] hover:ring-offset-2 transition-all duration-300">
                <div className="flex items-center mb-6">
                  <div className="w-16 h-16 bg-[#0077FF] rounded-full flex items-center justify-center mr-4">
                    <span className="text-white font-bold text-2xl">3</span>
                  </div>
                  <h3 className="text-xl font-bold text-black">Камеральные работы</h3>
                </div>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Включает камеральную обработку лесоустроительной информации, составление документации, подготовку картографической информации и финальную сдачу работ.
                </p>
                <button
                  onClick={() => toggleItem(2)}
                  className="text-[#0077FF] font-medium hover:text-[#0056CC] transition-colors flex items-center gap-2"
                >
                  <span>{openItems.includes(2) ? 'Скрыть' : 'Подробнее'}</span>
                  <svg
                    className={`w-5 h-5 transition-transform duration-300 ${
                      openItems.includes(2) ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    openItems.includes(2)
                      ? 'max-h-96 opacity-100 mt-6'
                      : 'max-h-0 opacity-0 mt-0'
                  }`}
                >
                  <div className="space-y-4 text-sm text-gray-600">
                    <div className="flex items-start">
                      <span className="text-[#0077FF] font-bold text-xs mr-3 mt-0.5">1</span>
                      <div>
                        <h4 className="font-semibold text-black mb-1">Камеральная обработка</h4>
                        <p className="text-gray-600 text-sm">
                          Камеральная обработка лесоустроительной информации.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <span className="text-[#0077FF] font-bold text-xs mr-3 mt-0.5">2</span>
                      <div>
                        <h4 className="font-semibold text-black mb-1">Составление документации</h4>
                        <p className="text-gray-600 text-sm">
                          Составление лесоустроительной документации и подготовка пояснительной записки по результатам лесоустройства.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <span className="text-[#0077FF] font-bold text-xs mr-3 mt-0.5">3</span>
                      <div>
                        <h4 className="font-semibold text-black mb-1">Подготовка картографической информации</h4>
                        <p className="text-gray-600 text-sm">
                          Подготовка картографической и атрибутивной информации, совмещенной на повыдельном уровне в форматах ГИС.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <span className="text-[#0077FF] font-bold text-xs mr-3 mt-0.5">4</span>
                      <div>
                        <h4 className="font-semibold text-black mb-1">Обработка информации</h4>
                        <p className="text-gray-600 text-sm">
                          Перевод атрибутивной информации с бумажных носителей в электронный вид, обработка информации специализированным программным обеспечением.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <span className="text-[#0077FF] font-bold text-xs mr-3 mt-0.5">5</span>
                      <div>
                        <h4 className="font-semibold text-black mb-1">Зонирование и составление карт</h4>
                        <p className="text-gray-600 text-sm">
                          Зонирование запроектированных мероприятий по охране, защите, воспроизводству лесов. Составление лесных карт в цифровом виде.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <span className="text-[#0077FF] font-bold text-xs mr-3 mt-0.5">6</span>
                      <div>
                        <h4 className="font-semibold text-black mb-1">Финальная подготовка</h4>
                        <p className="text-gray-600 text-sm">
                          Составление пояснительной записки по лесничеству, подготовка проекта изменений в лесохозяйственный регламент.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <span className="text-[#0077FF] font-bold text-xs mr-3 mt-0.5">7</span>
                      <div>
                        <h4 className="font-semibold text-black mb-1">Сдача работ</h4>
                        <p className="text-gray-600 text-sm">
                          Проведение второго лесоустроительного совещания по итогам работ, печать, размножение, компоновка документов и сдача Заказчику.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Почему выбирать нас */}
        <section className="py-16 md:py-24 ">
          <div className="max-w-[1480px] mx-auto px-5 md:px-8">
            <h2 className="text-3xl md:text-4xl font-bold text-black text-center mb-16">
              Почему выбирать нас выгодно
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {[
                {
                  title: "Опыт и компетенции",
                  icon: "🏆",
                  items: [
                    "Более 15 лет работы в отрасли",
                    "Совокупный опыт команды более 100 лет",
                    "Выполнено более 100 муниципальных и государственных контрактов",
                    "Лидеры команды участвуют в разработке отраслевых нормативно-правовых актов",
                    "Опыт работы в группах и комиссиях государственных и муниципальных органах"
                  ]
                },
                {
                  title: "Технологии",
                  icon: "⚡",
                  items: [
                    "Современное и высококачественное оборудование с поверками",
                    "Новейшее программное обеспечение",
                    "Взаимодействие с разработчиками ПО",
                    "Собственный отдел программистов",
                    "Разработка сервиса «Единая среда»",
                    "Соответствие отечественным и международным требованиям"
                  ]
                },
                {
                  title: "Уверенность в результате",
                  icon: "🎯",
                  items: [
                    "Точное понимание целей и задач заказчиков",
                    "Продуктовая линейка для органов местного самоуправления",
                    "Закрытие большей части вопросов управления городской средой",
                    "Учет всех деталей, даже не учтенных в ТЗ",
                    "Важность как условий контракта, так и конечного результата"
                  ]
                }
              ].map((item, index) => (
                <div key={index} className="bg-white rounded-3xl p-8 hover:ring-2 hover:ring-[#0077FF] hover:ring-offset-2 transition-all duration-300 shadow-sm hover:shadow-lg">
                  <div className="flex items-center mb-6">
                    <div className="w-16 h-16 bg-[#0077FF]/10 rounded-2xl flex items-center justify-center mr-4">
                      <span className="text-2xl">{item.icon}</span>
                    </div>
                    <h3 className="text-xl font-bold text-black">{item.title}</h3>
                  </div>
                  <ul className="space-y-3">
                    {item.items.map((listItem, itemIndex) => (
                      <li key={itemIndex} className="flex items-start">
                        <div className="w-2 h-2 bg-[#0077FF] rounded-full mt-2 mr-3 flex-shrink-0"></div>
                        <span className="text-gray-600 text-sm leading-relaxed">{listItem}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 md:py-24">
          <div className="max-w-[1480px] mx-auto px-5 md:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - FAQ */}
              <div className="lg:col-span-2">
                <h2 className="text-4xl md:text-5xl font-bold text-black mb-12">FAQ</h2>
                <div className="space-y-0">
                  {[
                    {
                      question: "Какой срок исполнения работ?",
                      answer: "Выполнение комплекса работ занимает от 20 рабочих дней (календарный месяц) до 2х лет."
                    },
                    {
                      question: "Что из себя представляет услуга?",
                      answer: "Перечень мероприятий, включающих оценку качественного и количественного состояния лесов (лесных участков), а также разработку проектной документации в области охраны, защитных, воспроизводства и их использования, определяющие направление деятельности на ближайшие 10 лет."
                    },
                    {
                      question: "Как часто проводится лесоустройство?",
                      answer: "Сроки повторяемости лесоустроительных работ регламентируются лесоустроительной инструкцией. Лесоустроительные работы могут проводиться через каждые 10, 15 или 20 лет в зависимости от интенсивности ведения лесного хозяйства."
                    },
                    {
                      question: "Для чего нужна таксация леса?",
                      answer: "Таксация лесов методом дешифрирования проводится для выявления, учета и оценки количественных и качественных характеристик лесных ресурсов (вычисление высоты и возраста лесных насаждений, среднего диаметра, средней высоты, относительной полноты, бонитет древостоя, запас на 1 га)."
                    }
                  ].map((faq, index) => (
                    <div key={index} className="border-b border-gray-200 py-6">
                      <div
                        className="flex items-center justify-between cursor-pointer group"
                        onClick={() => toggleItem(index)}
                      >
                        <h3 className="text-lg font-medium text-black pr-8">{faq.question}</h3>
                        <div className="flex-shrink-0">
                          <svg
                            className={`w-6 h-6 text-black group-hover:text-[#0077FF] transition-all duration-300 ${
                              openItems.includes(index) ? 'rotate-45' : ''
                            }`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </div>
                      </div>
                      <div
                        className={`overflow-hidden transition-all duration-300 ease-in-out ${
                          openItems.includes(index)
                            ? 'max-h-96 opacity-100 mt-4'
                            : 'max-h-0 opacity-0 mt-0'
                        }`}
                      >
                        <div className="text-gray-600 leading-relaxed">
                          {faq.answer}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column - Support Block */}
              <div className="space-y-6">
                {/* Support Block */}
                <div className="bg-[#F6F7F9] rounded-3xl p-8">
                  <h3 className="text-2xl font-bold text-black mb-4">Не нашли ответ на свой вопрос?</h3>
                  <p className="text-gray-600 mb-6">Задайте его нам на портале поддержки, и мы оперативно ответим.</p>
                  <a
                    href="mailto:info@единаясреда.рф?subject=Вопрос"
                    className="text-[#0077FF] hover:text-[#0056CC] transition-colors font-medium"
                  >
                    Задать вопрос
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="max-w-[1480px] mx-auto px-5 md:px-8 mt-16 mb-16">
          <div className="bg-[#0077FF] rounded-[20px] md:rounded-[30px] p-6 md:p-12 text-center text-white">
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-8">
              Оформить заявку на лесоустройство
            </h2>
            <p className="text-base md:text-xl text-blue-100 mb-8 md:mb-12 max-w-3xl mx-auto leading-relaxed px-2 md:px-0">
              Получите профессиональное лесоустройство с соблюдением всех требований законодательства
            </p>
            <button
              onClick={handleKP}
              className="inline-flex items-center justify-center bg-white text-[#0077FF] px-6 md:px-10 py-3 md:py-5 rounded-xl md:rounded-2xl font-bold text-base md:text-lg hover:bg-gray-100 transition-colors duration-200 focus:outline-none"
            >
              Получить коммерческое предложение
            </button>
          </div>
        </section>
      </div>
    </Layout>
  );
}