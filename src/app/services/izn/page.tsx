"use client";
import React, { useState } from 'react';
import Layout from '../../../components/Layout';
import Image from 'next/image';
import Card from '../../../components/Card';
import DemoIframeSection from "../../../components/DemoIframeSection";
import FAQ from "../../../components/FAQ";

export default function GreenInventoryPage() {
  const [openItems, setOpenItems] = useState<number[]>([]);

  const handleKP = () => {
    window.dispatchEvent(new CustomEvent('openKPModal'));
  };

  const handleConsult = () => {
    window.dispatchEvent(new CustomEvent('openConsultModal'));
  };

	 const homeFaqData = [
		{
			question: "Обязательна ли инвентаризация зеленых насаждений?",
			answer:
				"Во многих регионах учет зеленого фонда является частью системы управления территориями и необходим для корректной эксплуатации объектов.",
		},
		{
			question: "Как часто нужно проводить инвентаризацию?",
			answer:
				"Рекомендуется обновлять данные каждые несколько лет или после значительных изменений территории.",
		},
		{
			question: "Что получает заказчик по итогам работ?",
			answer:
				"Цифровую базу насаждений, карту, паспорта объектов и комплект отчетной документации.",
		},
		{
			question: "Сколько времени занимает инвентаризация?",
			answer:
				"Сроки зависят от площади и сложности участка — от нескольких дней до нескольких недель.",
		},
		{
			question: "Можно ли интегрировать данные в существующие системы?",
			answer:
				"Да, цифровой формат позволяет использовать информацию в различных управленческих платформах.",
		},
	];

  const toggleItem = (index: number) => {
    setOpenItems(prev =>
      prev.includes(index)
        ? prev.filter(item => item !== index)
        : [...prev, index]
    );
  };

	const advantages = [
		{
			icon: '/icons/эксперты.svg',
			label: 'Cформировать актуальный реестр зеленого фонда',
			description: 'Создание полного и актуального реестра всех деревьев, кустарников и других зеленых насаждений на вашей территории. Это позволяет отслеживать состояние объектов и вести системное управление.'
		},
		{
			icon: '/icons/Соответстиве требованиям.svg',
			label: 'Выявить аварийные и потенциально опасные деревья',
			description: 'Определение деревьев, представляющих угрозу безопасности, с указанием их местоположения и состояния. Раннее выявление позволяет предотвратить инциденты и снизить риски для людей и инфраструктуры.'
		},
		{
			icon: '/icons/information.svg',
			label: 'Снизить расходы на содержание территории',
			description: 'Система включает возможности для получения полной и развернутой информации по каждому месту захоронения. Данные можно использовать для отчетов и планирования.'
		},
		{
			icon: '/icons/новое оборудование.svg',
			label: 'Подготовиться к благоустройству или строительству',
			description: 'Данные инвентаризации дают документальное обоснование для проведения работ по вырубке или пересадке деревьев. Это снижает юридические риски и делает решения прозрачными для контролирующих органов.'
		},
		{
			icon: '/icons/Безопасность данных.svg',
			label: 'Повысить экологическую устойчивость территории',
			description: 'Анализ состава и состояния зеленых насаждений помогает создавать сбалансированные экосистемы, улучшать микроклимат и повышать экологическое качество городской или частной территории.'
		},
		{
			icon: '/icons/Постоплата.svg',
			label: 'Исключить ошибки в дендропланах',
			description: 'Достоверные данные о возрасте, породе и расположении растений обеспечивают точность дендропланов и карт озеленения, предотвращая ошибки при планировании работ и реконструкции.'
		},
	];

	const AdvantageCard: React.FC<{ icon: string; label: string; description: string; withRightBorder?: boolean; withBottomBorder?: boolean }> = ({ icon, label, description, withRightBorder, withBottomBorder }) => (
		<div className={`flex flex-col h-auto p-8 ${withRightBorder ? 'border-r border-grey-92' : ''} ${withBottomBorder ? 'border-b border-grey-92' : ''}`}>
			<div className="flex items-start mb-4">
				<div className="w-[60px] h-[60px] min-w-[60px] flex items-center justify-center bg-[#0077FF] rounded-[20px] mr-4 flex-shrink-0">
					<Image src={icon} alt="Консультация по вопросам инвентаризации кладбищ и мест захоронений" width={28} height={28} className="w-7 h-7" />
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
      <div className="min-h-screen bg-[#F6F7F9] font-[Raleway] font-medium lining-nums">
        {/* Hero Section */}
        <section className="bg-black text-white rounded-b-[20px] relative overflow-hidden min-h-[400px]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-20 relative z-10">
          <div className="relative flex flex-col lg:flex-row items-center lg:items-stretch gap-16">
            <div className="flex-1 lg:basis-3/5 text-left flex flex-col justify-center z-20">
              <h1 className="text-4xl sm:text-5xl md:text-[68px] font-medium leading-tight">
                Инвентаризация<br />зеленых насаждений
              </h1>
              <p className="mt-8 text-xl sm:text-[20px] text-gray-300 max-w-2xl">
							Выполняем инвентаризация зеленых насаждений с созданием цифрового реестра территории. Проводим профессиональную инвентаризацию деревьев и кустарников с геопривязкой, фотофиксацией и подготовкой всей необходимой документации. </p>
              <div className="mt-10 flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleKP}
                  className="inline-flex items-center justify-center bg-[#0077FF] text-white text-sm md:text-base lg:text-lg font-medium px-6 py-4 md:px-8 md:py-5 text-lg md:text-2xl rounded-xl hover:bg-[#0077FF]/90 transition-colors duration-200 focus:outline-none"
                >
                  Получить расчет
                </button>
                <button
                  onClick={handleConsult}
                  className="inline-block  text-white border border-white text-sm md:text-base lg:text-lg font-medium px-6 py-4 md:px-8 md:py-5 text-lg md:text-2xl rounded-xl hover:bg-white/10 transition-colors"
                >
                 Бесплатная консультация
                </button>
              </div>
            </div>
            <div className="flex-1 w-full h-full relative flex justify-center items-end lg:hidden z-10">
              <Image
                src="/img/izn.png"
                alt="Инвентаризация зеленых насаждений "
                width={500}
                height={400}
                className="w-full max-w-[500px] object-contain"
                style={{ height: 'auto' }}
              />
            </div>
          </div>
          <div className="hidden lg:block absolute right-0 bottom-0 z-10 w-[40%] max-w-[500px] h-auto pointer-events-none">
            <Image
                src="/img/izn.png"
								alt="Инвентаризация мест захоронений"
              width={500}
              height={400}
              className="w-full object-contain"
              style={{ height: 'auto' }}
            />
          </div>
        </div>
      </section>
			<section className="font-[Raleway] py-14 md:py-20">
      <div className="max-w-[1480px] mx-auto px-4 sm:px-6 lg:px-8">

        {/* Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-[50px] items-start">

          {/* Title */}
          <h2 className="
            text-[#313131]
            font-medium
            text-3xl
            sm:text-4xl
            lg:text-[52px]
            leading-tight
            lg:leading-[57px]
            max-w-[720px]
          ">
            Что такое инвентаризация зеленых насаждений
          </h2>

          {/* Text */}
          <div className="text-[#6B7280] text-base sm:text-lg leading-7 max-w-[720px]">
            <p>
              Инвентаризация зеленых насаждений — это комплекс профессиональных работ по учету деревьев, кустарников и других элементов озеленения с последующим формированием реестра территории.
            </p>

            <p className="mt-4">
              В ходе обследования специалисты определяют количественные и качественные характеристики растений, оценивают их состояние, выявляют аварийные экземпляры и фиксируют точное расположение каждого объекта.
            </p>
          </div>

        </div>
      </div>
    </section>

<section className="max-w-[1480px] mx-auto px-4 py-12">


  <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">

    {/* TOP BLOCK — занимает всю ширину */}
    <div className="lg:col-span-3 bg-white rounded-3xl p-2 flex flex-col lg:flex-row gap-2">
      <div className="lg:w-1/2 bg-[#f6f7f9] rounded-2xl flex items-center justify-center p-2">
        <Image
          src="/img/services/izn/1.png"
          alt="Актуальные данные об инвентаризации"
          width={180}
          height={180}
        />
      </div>
      <div className="lg:w-1/2 bg-white rounded-3xl p-4 flex flex-col justify-center">
        <h3 className="text-2xl text-[#313131] py-4	 mb-4">
          Актуальные данные о зеленом фонде необходимы для:
        </h3>
				<ul className="space-y-2 pl-0 text-[#7C8A9A]">
  {[
    "управления городскими и корпоративными территориями",
    "подготовки проектов благоустройства",
    "реконструкции объектов",
    "прохождения проверок",
    "планирования ухода за насаждениями"
  ].map((item, i) => (
    <li
      key={i}
      className="
                  relative pl-6
                  before:content-['']
                  before:absolute
                  before:left-0
                  before:top-1/2
                  before:-translate-y-1/2
                  before:w-2
                  before:h-2
                  before:bg-no-repeat
                  before:bg-contain
                  before:bg-center
                  before:bg-[url('/icons/check_blue.svg')]
                "
    >
      {item}
    </li>
  ))}
</ul>

      </div>
    </div>

    {/* BOTTOM LEFT — маленький блок */}
    <div className="bg-white rounded-3xl p-6 flex flex-col justify-center">
      <h3 className="text-2xl text-[#313131] mb-4">
      Без системного учета невозможно принимать обоснованные управленческие решения
      </h3>
      <p className="text-lg text-[#7c8a9a]">
      Именно поэтому инвентаризация является базовым инструментом современного территориального менеджмента.
      </p>
    </div>

    {/* BOTTOM RIGHT — большой блок */}
    <div className="lg:col-span-2 bg-white rounded-3xl p-2 flex flex-col lg:flex-row gap-2">
      <div className="lg:w-1/2 flex flex-col justify-center px-4 py-4">
        <h3 className="text-2xl text-[#313131] mb-4">
        В отличие от традиционного подхода,мы создаем не просто отчет
        </h3>
        <p className="text-lg text-[#7c8a9a]">
				А цифровую модель зеленых насаждений, готовую к дальнейшему использованию и обновлению.
        </p>
      </div>
      <div className="lg:w-1/2 bg-[#f6f7f9] rounded-2xl flex items-center justify-center p-2">
        <Image
          src="/img/services/izn/2.png"
          alt="Не просто отчет зеленого реестра"
          width={220}
          height={220}
        />
      </div>
    </div>

  </div>
</section>

<section className="bg-[#f5f7fa] py-24" >
					<div className="max-w-[1480px] mx-auto px-4">

						<h2 className="text-center text-[#313131] text-4xl md:text-[56px] font-medium leading-tight mb-16">
						Какие задачи решает инвентаризация						</h2>

						<div className="rounded-[20px] border border-[#e3e8f2] overflow-hidden">

							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
								{advantages.map((item, index) => (
									<div
										key={index}
										className={`
							p-10
							border-[#e3e8f2]
							${index % 3 !== 2 ? "lg:border-r" : ""}
							${index < 3 ? "border-b" : ""}
						`}
									>
										<h3 className="text-[#313131] text-2xl font-medium mb-4">
											{item.label}
										</h3>

										<p className="text-[#7c8a9a] text-lg leading-relaxed">
											{item.description}
										</p>
									</div>
								))}
							</div>

							<div className="flex justify-center py-12">
								<button
									onClick={handleKP}
									className="bg-[#0077FF] hover:bg-[#0066db] text-white text-lg font-medium px-8 py-4 rounded-xl transition"
								>
									Оставить заявку
								</button>
							</div>

						</div>
					</div>
				</section >

<section className="py-24 bg-[#f5f7fa]">
  <div className="max-w-[1480px] mx-auto px-4">

    {/* Заголовок */}
    <h2 className="text-center text-[#313131] text-4xl md:text-[56px] font-medium leading-tight mb-16">
      Кому необходима инвентаризация <br />зеленых насаждений
    </h2>

    {/* Верхний ряд — 3 карточки */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mb-2">
      <div className="bg-white rounded-3xl p-6">
        <h3 className="text-[#313131] text-2xl font-medium mb-4">Муниципалитеты</h3>
        <p className="text-[#7c8a9a] text-lg leading-6">
          Для управления городским зеленым фондом, планирования благоустройства и подготовки к проверкам.
        </p>
      </div>

      <div className="bg-white rounded-3xl p-6">
        <h3 className="text-[#313131] text-2xl font-medium mb-4">Девелоперы</h3>
        <p className="text-[#7c8a9a] text-lg leading-6">
          Для корректной подготовки проектной документации и минимизации рисков при строительстве.
        </p>
      </div>

      <div className="bg-white rounded-3xl p-6">
        <h3 className="text-[#313131] text-2xl font-medium mb-4">Промышленные предприятия</h3>
        <p className="text-[#7c8a9a] text-lg leading-6">
          Для контроля санитарно-защитных зон и соблюдения экологических требований.
        </p>
      </div>
    </div>

    {/* Нижний ряд */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 mb-12">

      {/* Левая карточка */}
      <div className="bg-white rounded-3xl p-6">
        <h3 className="text-[#313131] text-2xl font-medium mb-4">Управляющие компании</h3>
        <p className="text-[#7c8a9a] text-lg leading-6">
          Для системного ухода за придомовыми территориями.
        </p>
      </div>

      {/* Правая большая карточка (занимает 2 колонки) */}
			<div className="lg:col-span-2 bg-white rounded-3xl p-2 flex flex-col lg:flex-row gap-2">
			<div className="lg:w-1/2 flex flex-col p-4">

        <h3 className="text-2xl text-[#313131] mb-4">
        Парки, санатории, образовательные кампусы
        </h3>
        <p className="text-lg text-[#7c8a9a]">
				Для поддержания безопасной и комфортной среды.
        </p>
      </div>
      <div className="lg:w-1/2 bg-[#f6f7f9] rounded-2xl flex items-center justify-center p-2">
        <Image
          src="/img/services/izn/3.png"
          alt="Система нужна всем"
          width={160}
          height={160}
        />
      </div>
    </div>
    </div>


    {/* Кнопка */}
    <div className="flex justify-center">
      <button
        onClick={handleKP}
        className="bg-[#0077ff] hover:bg-[#0066db] text-white text-xl font-medium px-8 py-4 rounded-xl transition"
      >
        Оставить заявку
      </button>
    </div>

  </div>
</section>

<section className="max-w-[1480px] mx-auto px-4 py-24">

  {/* Заголовок */}
  <h2 className="text-center text-[#313131] text-4xl md:text-[52px] leading-tight">
    Что входит в услугу
  </h2>

  {/* Подзаголовок */}
  <p className="text-center text-[#7c8a9a] text-xl mt-6 mb-16 max-w-3xl mx-auto">
    Полный цикл работ — от обследования территории до подготовки
    цифровой модели и отчетной документации.
  </p>

  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
    {[
      {
        title: "Полевой этап",
        list: [
          "обследование территории",
          "таксация деревьев и кустарников",
          "измерение высоты и диаметра",
          "оценка состояния растений",
          "фотофиксация",
          "геопривязка каждого объекта"
        ],
        image: "/img/services/izn/4.png"


      },
      {
        title: "Камеральная обработка",
        list: [
          "создание цифровой карты",
          "формирование реестра насаждений",
          "структурирование данных",
          "подготовка аналитики"
        ],
        image: "/img/services/izn/5.png"
      },
      {
        title: "Документация",
        list: [
          "паспорта зеленых насаждений",
          "ведомости учета",
          "отчетные материалы",
          "рекомендации по содержанию"
        ],
        image: "/img/services/izn/6.png"
      }
    ].map((card, i) => (
      <div
        key={i}
        className="bg-white rounded-3xl flex flex-col overflow-hidden "
      >
        {/* IMAGE */}
        <div className="p-2">
          <div className="bg-[#f6f7f9] rounded-2xl flex items-center justify-center h-[260px]">
            <Image
              src={card.image}
              alt={card.title}
              width={	160}
              height={160}
              className="object-contain"
            />
          </div>
        </div>

        {/* TEXT */}
        <div className="p-6 space-y-4">
          <h3 className="text-[#313131] text-2xl leading-snug">
            {card.title}
          </h3>

          <ul className="space-y-3 text-[#7c8a9a] text-lg leading-relaxed pl-0">
            {card.list.map((item, idx) => (
              <li
                key={idx}
                className="
                  relative pl-6
                  before:content-['']
                  before:absolute
                  before:left-0
                  before:top-1/2
                  before:-translate-y-1/2
                  before:w-2
                  before:h-2
                  before:bg-no-repeat
                  before:bg-contain
                  before:bg-center
                  before:bg-[url('/icons/check_blue.svg')]
                "
              >
                {item}
              </li>
            ))}
          </ul>

        </div>
      </div>
    ))}
  </div>
</section>


<section className="py-24 bg-[#f5f7fa]">
  <div className="max-w-[1480px] mx-auto px-4">

    {/* Заголовок */}
    <h2 className="text-center text-[#313131] text-4xl md:text-[56px] font-medium leading-tight mb-16">
      Создаем цифровую систему управления зеленым фондом
    </h2>

    {/* GRID */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">

      {/* ЛЕВАЯ БОЛЬШАЯ */}
      <div className="bg-white rounded-3xl p-9 flex flex-col justify-between min-h-[420px]">
        <h3 className="text-[#313131] text-2xl md:text-[26px] leading-snug">
          Классическая инвентаризация часто заканчивается передачей таблиц и
          отчетов, которые быстро устаревают.
        </h3>

        <p className="text-[#7c8a9a] text-lg md:text-xl leading-relaxed">
          Мы идем дальше — формируем цифровую платформу управления территорией.
        </p>
      </div>

      {/* ЦЕНТР — ИЗОБРАЖЕНИЕ */}
      <div className="bg-white rounded-3xl p-2 flex items-center">
        <div className="w-full h-full min-h-[420px] bg-[#f6f7f9] rounded-2xl flex items-center justify-center">
          <Image
            src="/img/services/izn/7.png"
            alt="Цифровая система"
            width={260}
            height={220}
            className="object-contain"
          />
        </div>
      </div>

      {/* ПРАВАЯ КОЛОНКА */}
      <div className="flex flex-col gap-2">

        {/* ВЫ ПОЛУЧАЕТЕ */}
        <div className="bg-white rounded-3xl p-9">
          <h3 className="text-[#313131] text-2xl mb-4">
            Вы получаете:
          </h3>

          <ul className="space-y-3 text-[#7c8a9a] text-lg leading-relaxed">
            {[
              "интерактивную карту насаждений",
              "централизованную базу данных",
              "быстрый поиск объектов",
              "возможность обновления информации",
              "основу для долгосрочного планирования"
            ].map((item, i) => (
							<li
							key={i}
							className="
							relative pl-6
							before:content-['']
							before:absolute
							before:left-0
							before:top-1/2
							before:-translate-y-1/2
							before:w-2
							before:h-2
							before:bg-no-repeat
							before:bg-contain
							before:bg-center
							before:bg-[url('/icons/check_blue.svg')]
						"
						>
							{item}
						</li>

            ))}
          </ul>
        </div>

        {/* НИЖНИЙ БЛОК */}
        <div className="bg-white rounded-3xl px-9 py-6">
          <p className="text-[#7c8a9a] text-lg leading-relaxed">
            Такой подход особенно эффективен для крупных территорий и
            муниципальных образований, где важны точность данных и скорость
            доступа к информации.
          </p>
        </div>

      </div>
    </div>
  </div>
</section>

<DemoIframeSection />

<section className="py-24 bg-[#f5f7fa]">
  <div className="w-full max-w-[1480px] mx-auto flex flex-col items-center gap-16 px-4">

    {/* Заголовок */}
    <h2 className="text-center text-[#313131] text-4xl md:text-[64px] font-medium leading-snug md:leading-[70px]">
      Наши преимущества
    </h2>

    {/* Контейнер карточек */}
    <div className="relative w-full h-auto lg:h-[620px]">

      {/* Десктопная версия с absolute */}
      <div className="hidden lg:block relative w-full h-full">

        {/* Карточка 1 */}
        <div className="absolute top-0 left-0 w-[364px] min-h-[300px] bg-white rounded-3xl flex flex-col p-2 pb-[67px]">
          <div className="flex flex-col gap-3 px-7 pt-[27px] pb-7">
            <h3 className="text-[#313131] text-[28px] font-medium leading-9">Новое оборудование
						</h3>
            <p className="text-[#7C8A9A] text-xl leading-7">
						Используем новое оборудование высокой точности, не имеющее аналогов.

</p>
          </div>
        </div>

        {/* Карточка 2 с изображением */}
        <div className="absolute top-0 left-[372px] w-[736px] h-[300px] bg-white rounded-3xl flex gap-2 p-2">
          <div className="w-[356px] flex flex-col gap-3 px-7 pt-[27px] pb-[123px]">
            <h3 className="text-[#313131] text-[28px] font-medium leading-9"> Экспертная команда
						</h3>
            <p className="text-[#7C8A9A] text-xl leading-7">
           Объединяем специалистов в области озеленения и цифровых решений.
            </p>
          </div>
          <div className="w-[356px] bg-[#f6f7f9] rounded-2xl flex items-center justify-center px-10 ">
            <Image
            src="/img/services/izn/8.png"
						alt="Инвентаризация кладбищ"
              width={320}
              height={320}
            />
          </div>
        </div>

        {/* Карточка 3 */}
        <div className="absolute top-0 left-[1116px] w-[364px] min-h-[300px] bg-white rounded-3xl flex flex-col p-2 pb-[67px]">
          <div className="flex flex-col gap-3 px-7 pt-[27px] pb-7">
            <h3 className="text-[#313131] text-[28px] font-medium leading-9">Безопасность данных</h3>
            <p className="text-[#7C8A9A] text-xl leading-7"> Все информация надежно защищена и хранится в соответствии с требованиями законодательства.

            </p>
          </div>
        </div>

        {/* Карточка 4 с изображением */}
        <div className="absolute top-[308px] left-0 w-[736px] min-h-[300px] bg-white rounded-3xl flex gap-2 p-2">
          <div className="w-[356px] bg-[#f6f7f9] rounded-2xl flex items-center justify-center px-10 py-10 ]">
            <Image
            src="/img/services/izn/9.png"
						alt="Инвентаризация кладбищ"
              width={320}
              height={320}
            />
          </div>
          <div className="w-[356px] flex flex-col gap-3 px-7 pt-[27px] pb-[87px]">
            <h3 className="text-[#313131] text-[28px] font-medium leading-9">Масштабируемость</h3>
            <p className="text-[#7c8a9a] text-xl leading-7">
              Работаем как с локальными объектами, так и с территориями в сотни гектаров.
            </p>
          </div>
        </div>

        {/* Карточка 5 с изображением */}
        <div className="absolute top-[308px] left-[744px] w-[736px] min-h-[300px] bg-white rounded-3xl flex gap-2 p-2">
          <div className="w-[356px] flex flex-col gap-3 px-7 pt-[27px] pb-[87px]">
            <h3 className="text-[#313131] text-[28px] font-medium">Постоплата</h3>
            <p className="text-[#7C8A9A] text-xl leading-7">
              Предлагаем уникальную возможность. Сначала получаете услугу, а оплачиваете позже.
            </p>
          </div>
          <div className="w-[356px] bg-[#f6f7f9] rounded-2xl flex items-center justify-center px-10 ">
            <Image
            src="/img/services/izn/10.png"
						alt="Инвентаризация кладбищ"
              width={220}
              height={220}
            />
          </div>
        </div>

      </div>

      {/* Мобильная/планшетная версия */}
      <div className="block lg:hidden flex flex-col gap-8">
        {/* Карточки просто в стеке */}
        {[
          {
            title: "Технологичный подход",
            text: "Хранение от мегабайт до петабайт данных. Скорость передачи 1 Gbit/s.",
            img: null
          },
          {
            title: "Высокая точность данных",
            text: "Минимизируем вероятность ошибок учета.",
            img: "/img/imz4.png"
          },
          {
            title: "Экспертная команда",
            text: "Объединяем специалистов в области озеленения и цифровых решений.",
            img: null
          },
          {
            title: "Масштабируемость",
            text: "Работаем как с локальными объектами, так и с территориями в сотни гектаров.",
            img: "/img/imz4.png"
          },
          {
            title: "Постоплата",
            text: "Предлагаем уникальную возможность воспользоваться услугой с опцией постоплаты. Сначала получаете услугу, а оплачиваете позже.",
            img: "/img/imz4.png"
          },
        ].map((card, idx) => (
          <div key={idx} className="bg-white rounded-3xl flex flex-col md:flex-row gap-4 p-6">
            {card.img && (
              <div className="flex-1 bg-[#f6f7f9] rounded-2xl flex items-center justify-center p-6">
                <Image src={card.img} alt={card.title} width={320} height={320} />
              </div>
            )}
            <div className="flex-1 flex flex-col gap-3">
              <h3 className="text-[#313131] text-2xl font-medium">{card.title}</h3>
              <p className="text-[#7c8a9a] text-base leading-relaxed">{card.text}</p>
            </div>
          </div>
        ))}
      </div>

    </div>
  </div>
</section>



<section className="py-24 bg-[#f5f7fa]">
  <div className="max-w-[1480px] mx-auto px-4 flex flex-col items-center gap-12">

    {/* Заголовок */}
    <h2 className="text-center text-[#313131] text-[64px] font-medium leading-[70px]">
      Как проходит работа
    </h2>

    {/* Контейнер шагов */}
    <div className="relative w-full flex flex-col items-center gap-6">

      {[
        "Предварительный анализ — изучаем территорию и задачи.",
        "Подготовка методики — определяем формат учета.",
        "Полевые работы — проводим обследование.",
        "Оцифровка данных — формируем карту и реестр.",
        "Передача результатов — предоставляем готовую систему и документацию."
      ].map((text, i) => {
        const isLeft = i % 2 === 0;

        return (
          <div
            key={i}
            className="relative w-full flex justify-center items-center"
          >

            {/* СТРЕЛКА → видна только на md+ */}
            {i < 4 && (
              <div
                className={`
                  absolute
                  ${isLeft ? "left-[8%]" : "right-[8%]"}
                  top-[130%]
                  -translate-y-1/2
                  z-0
                  pointer-events-none
                  hidden md:block
                `}
              >
                <img
                  src={
                    isLeft
                      ? "/icons/arrow-step-left.svg"
                      : "/icons/arrow-step-right.svg"
                  }
                  alt="Стрелка"
                  className="w-[420px] h-[420px]"
                />
              </div>
            )}

            {/* Карточка шага */}
            <div
              className={`
                relative z-10
                max-w-full
                bg-white
                rounded-2xl
                px-4 py-2
                flex items-center gap-6
                transition-all duration-300
                justify-center md:${isLeft ? "justify-start" : "justify-end"}
              `}
            >
              {/* Номер */}
              <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-[#0077ff] text-white text-xl font-medium rounded-2xl">
                {i + 1}
              </div>

              {/* Текст */}
              <p className="text-[#313131] text-xl font-medium leading-relaxed text-center md:text-left">
                {text}
              </p>
            </div>

          </div>
        );
      })}
    </div>
  </div>
</section>

<section className="max-w-[980px] mx-auto px-4 py-24">
					<div className="bg-white rounded-3xl p-2 flex flex-col lg:flex-row gap-8 lg:gap-12">

						{/* Текст слева */}
						<div className="lg:w-1/2 flex flex-col justify-center p-6">
							<h2 className="text-[#313131] text-3xl md:text-[28px] font-medium leading-snug mb-6">
								Оставьте запрос на <br />
								консультацию с индивидуальным расчетом
							</h2>

							<p className="text-[#7c8a9a] text-lg leading-relaxed mb-8">
							Цена зависит от нескольких факторов: площади территории, плотности насаждений, сложности ландшафта, объема полевых работ, требований к итоговой документации.  Оставьте заявку — подготовим коммерческое предложение в течение 24 часов.
							</p>

							<div>
								<button
									onClick={handleKP}
									className="bg-[#0077FF] hover:bg-[#0066db] text-white text-lg font-medium px-8 py-4 rounded-xl transition">
									Оставить заявку
								</button>
							</div>
						</div>

						{/* Изображение справа */}
						<div className="lg:w-1/2 bg-[#f6f7f9] rounded-2xl flex items-center justify-center p-6">
							<Image
								src="/img/imz_cta.png"
								alt="Получить консультацию по инвентаризации и оцифровке мест"
								width={320}
								height={320}
							/>
						</div>

					</div>
				</section>






		{/* ✅ FAQ СЕКЦИЯ */}
		<FAQ
				items={homeFaqData}
				title="Часто задаваемые вопросы"
				showContactCard={true}
				contactCardTitle="Не нашли ответ на свой вопрос?"
				contactCardText="Задайте его нам — и мы оперативно ответим."
				contactButtonText="Задать вопрос"
			/>

      </div>
    </Layout>
  );
}
