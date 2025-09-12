"use client";
import React, { useState } from 'react';
import Layout from '../../../components/Layout';
import Image from 'next/image';
import Card from '../../../components/Card';

export default function GreenInventoryPage() {
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

  const features = [
    {
      size: 'big' as const,
      imageSrc: '/img/proverka.svg',
      imageAlt: 'Инвентаризация зеленых насаждений',
      title: 'Профессиональная инвентаризация',
      description: 'Полное обследование всех зеленых насаждений с использованием современного оборудования',
    },
    {
      size: 'small' as const,
      imageAlt: 'Актуальные данные',
      title: 'Актуальные данные 24/7',
      description: 'Полная информация о количестве, состоянии и породах растений',
    },
    {
      size: 'small' as const,
      imageAlt: 'ГИС-платформа',
      title: 'ГИС-платформа для всех данных',
      description: 'Объекты с координатами, границами, атрибутами на карте',
    },
    {
      size: 'small' as const,
      imageAlt: 'Качественное исполнение',
      title: 'Качественное исполнение',
      description: 'Профессиональное обследование с использованием современного оборудования',
    },
    {
      size: 'small' as const,
      imageAlt: 'Современное оборудование',
      title: 'Современное оборудование',
      description: 'Использование лазерного сканирования и геодезических приборов',
    },
    {
      size: 'big' as const,
      imageSrc: '/img/support.svg',
      imageAlt: 'Поддержка и обучение',
      title: 'Поддержка и обучение',
      description: 'Наши эксперты помогут на каждом этапе инвентаризации',
    },
    {
      size: 'big' as const,
      imageSrc: '/img/pole.svg',
      imageAlt: 'Работайте в поле',
      title: 'Работайте в поле',
      description: 'Вносите данные с мобильных устройств — даже без интернета',
    },
    {
      size: 'small' as const,
      imageAlt: 'Экологическая безопасность',
      title: 'Экологическая безопасность',
      description: 'Выявление аварийных деревьев и контроль состояния зелёных зон',
    },
    {
      size: 'small' as const,
      imageAlt: 'Экономия бюджета',
      title: 'Экономия бюджета',
      description: 'Оптимизация расходов на содержание, уход и благоустройство',
    },
  ];

  const workSteps = [
    { icon: '/icons/po2.svg', label: 'Выбор ПО' },
    { icon: '/icons/import.svg', label: 'Внесение имеющихся данных' },
    { icon: '/icons/pole.svg', label: 'Полевые работы' },
    { icon: '/icons/po.svg', label: 'Камеральные работы' },
  ];

  const advantages = [
    { icon: '/icons/Forest-blue.svg', label: 'Учет всех деревьев, кустарников, цветников' },
    { icon: '/icons/parametrs-blue.svg', label: 'Основные параметры состояния и рекомендации по уходу' },
    { icon: '/icons/Shop.svg', label: 'Учет малых архитектурных объектов' },
    { icon: '/icons/Passport.svg', label: 'Подготовка паспорта объекта' },
    { icon: '/icons/Analitics-blue.svg', label: 'Подробная аналитика и отчеты в реальном времени' },
    { icon: '/icons/es-blue.svg', label: 'Доступ к системе Единая Среда' },
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-[#F6F7F9]">
        {/* Hero Section */}
        <section className="bg-black text-white rounded-b-[20px] relative overflow-hidden min-h-[400px]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-20 relative z-10">
          <div className="relative flex flex-col lg:flex-row items-center lg:items-stretch gap-16">
            <div className="flex-1 lg:basis-3/5 text-left flex flex-col justify-center z-20">
              <h1 className="text-4xl sm:text-5xl md:text-[78px] font-medium leading-tight">
                Инвентаризация<br />зеленых насаждений
              </h1>
              <p className="mt-8 text-xl sm:text-[27px] text-gray-300 max-w-2xl">
Установление границ озелененной/природной территории и их документального закрепления         </p>
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
                src="/img/izn.png"
                alt="Инвентаризация зеленых насаждений "
                className="w-full max-w-[500px] object-contain"
                style={{ height: 'auto' }}
              />
            </div>
          </div>
          <div className="hidden lg:block absolute right-0 bottom-0 z-10 w-[40%] max-w-[500px] h-auto pointer-events-none">
            <img
                src="/img/izn.png"
								alt="Инвентаризация мест захоронений"
              className="w-full object-contain"
              style={{ height: 'auto' }}
            />
          </div>
        </div>
      </section>

        {/* Features Section - как на главной */}
        <section className="max-w-[1400px] mx-auto mt-8">
          <div className="max-w-[1400px] mx-auto px-2 py-2">
            <h2 className="text-4xl text-black font-medium mb-12 text-left">
              Всё для удобного цифрового контроля и учёта зеленых насаждений
            </h2>
            <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {features.map((f, i) => (
                <Card key={i} {...f} textColor="text-black" descColor="text-black" />
              ))}
            </div>
          </div>
        </section>

        {/* Work Steps - как SectionAllObjects */}
        <section className="w-full flex flex-col items-center mt-16">
          <div className="max-w-[1480px] w-full flex flex-col items-start gap-16 px-5 md:px-8">
            <div className="w-full flex flex-col items-center">
              <h2 className="text-center font-medium text-black text-lg md:text-2xl lg:text-4xl leading-tight">
                Схема работы
              </h2>
            </div>
            <div className="w-full rounded-[20px] outline outline-1 outline-grey-92 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0">
              {workSteps.map((step, idx) => (
                <div key={step.label} className={`flex flex-col h-auto p-8 ${idx % 4 !== 3 && idx !== workSteps.length - 1 ? 'border-r border-grey-92' : ''} ${idx < 4 ? 'border-b border-grey-92' : ''}`}>
                  <div className="flex items-center mb-4">
                    <div className="w-[60px] h-[60px] min-w-[60px] flex items-center justify-center bg-[#0077FF] rounded-[20px] mr-4">
                      <Image src={step.icon} alt="" width={28} height={28} className="w-7 h-7" />
                    </div>
                    <div className="text-black text-base md:text-lg lg:text-xl font-normal leading-7">
                      {step.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Advantages - как SectionBestSolution */}
        <section className="max-w-[1480px] mx-auto px-5 md:px-8 mt-16">
          <h2 className="text-center text-black text-2xl md:text-4xl lg:text-[50px] font-medium leading-[1.1] mb-12">
            Что вы получаете
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {advantages.map((advantage, idx) => (
              <div key={advantage.label} className="outline outline-[6px] outline-white rounded-3xl flex items-center p-4 h-auto">
                <div className="w-12 h-12 bg-grey-97 rounded-xl flex-shrink-0 flex items-center justify-center mr-4">
                  <Image src={advantage.icon} alt="" width={48} height={48} />
                </div>
                <div className="text-black text-sm md:text-base lg:text-lg">
                  {advantage.label}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Company Info - в стиле SectionExpertise */}
        <section className="py-10 lg:py-20">
          <div className="max-w-[1480px] mx-auto px-5 md:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Left Big Card */}
              <a href="/about" className="group bg-white rounded-3xl p-8 flex flex-col relative overflow-hidden h-full transition-all duration-300 outline outline-1 outline-transparent hover:outline-[#0077FF]">
                <div className="relative z-10 flex flex-col flex-grow h-full w-full">
                  <h3 className="text-3xl md:text-4xl lg:text-[40px] font-medium text-black leading-tight">
                    17 лет<br />помогаем муниципалитетам<br />в управлении зелеными насаждениями
                  </h3>
                  <div className="flex-grow"></div>
                  <div className="mt-8 inline-flex items-center justify-center self-start px-8 py-3.5 bg-[#0077FF] text-white text-lg font-medium rounded-xl group-hover:bg-opacity-80 transition-all duration-300">
                    Подробнее о нас
                  </div>
                </div>
                {/* Картинка для десктопа */}
                <div className="hidden md:block absolute right-0 bottom-0 w-1/2 h-auto z-0">
                  <Image src="/img/17izn.png" alt="" width={300} height={300} className="w-full h-auto object-contain" />
                </div>
              </a>
              {/* Right Column */}
              <div className="flex flex-col gap-5 h-full">
                {/* Top Card */}
                <div className="group bg-white rounded-3xl p-8 flex flex-col md:flex-row items-start md:items-center gap-8 transition-all duration-300 outline outline-1 outline-transparent hover:outline-[#0077FF] flex-grow">
                  <div className="order-2 md:order-1 w-full md:w-auto">
                    <h4 className="text-2xl font-normal text-black leading-snug mb-4 md:mb-0">
                      Лидер в инвентаризации зелёных насаждений – точность, качество, технологии по всей России.
                    </h4>
                  </div>
                  <div className="bg-[#F6F7F9] rounded-2xl flex items-center justify-center p-2.5 w-full md:w-1/2 h-full mx-auto">
                    <div className="text-center">
                      <div className="text-4xl mb-2">🥇</div>
                      <div className="text-2xl font-bold text-black">Топ-1</div>
                    </div>
                  </div>
                </div>
                {/* Bottom 3 Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  {[
                    {
                      icon: <Image src="/icons/actual-blue.svg" alt="Актуальные данные" width={32} height={32} className="w-8 h-8" />,
                      text: 'Актуальные данные с точностью до 99%',
                    },
                    {
                      icon: <Image src="/icons/job-like-blue.svg" alt="Качественное исполнение" width={32} height={32} className="w-8 h-8" />,
                      text: 'Качественное исполнение работ',
                    },
                    {
                      icon: <Image src="/icons/oborudovanie-blue.svg" alt="Современное оборудование" width={32} height={32} className="w-8 h-8" />,
                      text: 'Современное оборудование',
                    },
                  ].map((card, idx) => (
                    <div
                      key={idx}
                      className="group bg-white rounded-3xl p-5 flex flex-col gap-4 transition-all duration-300 outline outline-1 outline-transparent hover:outline-[#0077FF]"
                    >
                      <div className="w-16 h-16 bg-[#F6F7F9] rounded-full flex items-center justify-center transition-all duration-300 group-hover:bg-[#0077FF]/10">
                        {card.icon}
                      </div>
                      <p className="text-base text-gray-400">
                        {card.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

                {/* FAQ Section */}
        <section className="py-10 lg:py-20">
          <div className="max-w-[1480px] mx-auto px-5 md:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - FAQ */}
              <div className="lg:col-span-2">
                <h2 className="text-4xl md:text-5xl font-bold text-black mb-12">FAQ</h2>
                <div className="space-y-0">
                  {[
                    {
                      question: "Какой минимальный объём работ можно заказать?",
                      answer: "Минимальный объём работ — от 1 гектара для площадных объектов."
                    },
                    {
                      question: "Сколько времени занимает выполнение работ?",
                      answer: "До 10 га — до 3 месяцев, От 10 до 40 га — до 4 месяцев, Свыше 40 га — 6-8 месяцев."
                    },
                    {
                      question: "Что входит в услугу инвентаризации?",
                      answer: "Оформленный паспорт объекта озеленения, ведомости и планы инвентаризации, картографические материалы."
                    },
                    {
                      question: "Какие данные необходимы для начала работ?",
                      answer: "Точное местоположение объектов, названия участков или их границы, кадастровые номера участков."
                    },
                    {
                      question: "Какое оборудование используется для инвентаризации?",
                      answer: "Используем современное геодезическое оборудование, дроны с высокоточными камерами и специализированное ПО для обработки данных."
                    },
                    {
                      question: "Предоставляете ли вы техническую поддержку после завершения работ?",
                      answer: "Да, мы предоставляем полную техническую поддержку и консультации по вопросам эксплуатации системы учета зеленых насаждений."
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
              Рассчитайте стоимость инвентаризации для своего объекта
            </h2>
            <p className="text-base md:text-xl text-blue-100 mb-8 md:mb-12 max-w-3xl mx-auto leading-relaxed px-2 md:px-0">
              Узнайте точную цену услуги за пару минут! Просто укажи параметры объекта, и мы сразу подготовим расчёт.
            </p>
            <button
              onClick={handleKP}
              className="inline-flex items-center justify-center bg-white text-[#0077FF] px-6 md:px-10 py-3 md:py-5 rounded-xl md:rounded-2xl font-bold text-base md:text-lg hover:bg-gray-100 transition-colors duration-200 focus:outline-none"
            >
              Рассчитать стоимость
            </button>
          </div>
        </section>
      </div>
    </Layout>
  );
}
