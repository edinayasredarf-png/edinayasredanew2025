"use client";
import Layout from '../../../components/Layout';
import React, { useState } from 'react';
import Image from 'next/image';
import FAQ from "../../../components/FAQ";



export default function ForestManagementPage() {
  const [openItems, setOpenItems] = useState<number[]>([]);

  const handleKP = () => {
    window.dispatchEvent(new CustomEvent('openKPModal'));
  };

	const advantages = [
		{
			icon: '/icons/эксперты.svg',
			label: 'Инвентаризация лесных ресурсов и получение достоверных данных',
			description: 'Специалисты проводят комплексное обследование территории, фиксируя фактические характеристики лесных участков. Это позволяет сформировать актуальную информационную базу, на которую можно опираться при управлении лесным фондом, планировании работ и принятии стратегических решений.'
		},
		{
			icon: '/icons/Соответстиве требованиям.svg',
			label: 'Определение породного состава и возраста насаждений',
			description: 'Анализ структуры леса помогает понять его текущее состояние и потенциал развития. Знание пород и возрастных групп необходимо для грамотного ухода за насаждениями, прогнозирования их роста и своевременного проведения хозяйственных мероприятий..'
		},
		{
			icon: '/icons/information.svg',
			label: 'Оценка экологического состояния лесных территорий',
			description: 'В ходе лесоустройства выявляются факторы, влияющие на устойчивость экосистем: повреждения, болезни, последствия природных или антропогенных воздействий. Такая оценка помогает сохранить биологическое разнообразие и предотвратить деградацию лесных массивов.'
		},
		{
			icon: '/icons/новое оборудование.svg',
			label: 'Выявление участков, требующих восстановления или защиты',
			description: 'Обследование позволяет определить территории, где необходимы санитарные рубки, лесовосстановление или дополнительные меры охраны. Это снижает риски распространения вредителей, повышает устойчивость лесов и способствует их долгосрочному сохранению.'
		},
		{
			icon: '/icons/Безопасность данных.svg',
			label: 'Планирование лесохозяйственных мероприятий',
			description: 'На основе собранных данных формируется четкий план действий: уход за лесом, восстановление насаждений, противопожарные меры и рациональное использование ресурсов. Системный подход помогает эффективно распределять бюджет и минимизировать экологические риски.'
		},
		{
			icon: '/icons/Постоплата.svg',
			label: 'Обеспечение соответствия требованиям лесного законодательства',
			description: 'Лесоустройство проводится с учетом действующих нормативов и правил. Подготовленная документация подтверждает законность использования лесных территорий и упрощает взаимодействие с контролирующими органами.'
		},
	];



	const homeFaqData = [
		{
			question: "Какой срок исполнения работ?",
			answer:
				"Выполнение комплекса работ занимает от 20 рабочих дней (календарный месяц) до 2х лет",
		},
		{
			question: "Что из себя представляет услуга?",
			answer:
				"Перечень мероприятий, включающих оценку качественного и количественного состояния лесов (лесных участков), а также разработку проектной документации в области охраны, защитных, воспроизводства и их использования, определяющие направление деятельности на ближайшие 10 лет.",
		},
		{
			question: "Как часто проводится лесоустройство?",
			answer:
				"Сроки повторяемости лесоустроительных работ регламентируются лесоустроительной инструкцией. Лесоустроительные работы могут проводиться через каждые 10, 15 или 20 лет в зависимости от интенсивности ведения лесного хозяйства.",
		},
		{
			question: "Сколько времени занимает инвентаризация?",
			answer:
				"Сроки зависят от площади и сложности участка — от нескольких дней до нескольких недель.",
		},
		{
			question: "Для чего нужна таксация леса?",
			answer:
				"Таксация лесов методом дешифрирования проводится для выявления, учета и оценки количественных и качественных характеристик лесных ресурсов (вычисление высоты и возраста лесных насаждений, среднего диаметра, средней высоты, относительной полноты, бонитет древостоя, запас на 1 га).",
		},
	];


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
      <div className="min-h-screen bg-[#F6F7F9] font-[Raleway] font-medium lining-nums">
        {/* Hero Section */}
        <section className="page-hero rounded-b-[20px] relative overflow-hidden min-h-[400px]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-20 relative z-10">
          <div className="relative flex flex-col lg:flex-row items-center lg:items-stretch gap-16">
            <div className="flex-1 lg:basis-3/5 text-left flex flex-col justify-center z-20">
              <h1 className="text-4xl sm:text-5xl md:text-[68px] font-medium leading-tight">
                Лесоустройство
              </h1>
              <p className="mt-8 text-xl sm:text-[20px] text-gray-300 max-w-2xl">
							Комплекс работ по организации лесного фонда, описанию, учету и изучению лесов, разработке проектов ведения лесного хозяйства на перспективный период

</p>
              <div className="mt-10 flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleKP}
                  className="inline-flex items-center justify-center bg-[#029cda] text-white text-sm md:text-base lg:text-lg font-medium px-6 py-4 md:px-8 md:py-5 text-lg md:text-2xl rounded-xl hover:bg-[#029cda]/90 transition-colors duration-200 focus:outline-none"
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
                src="/img/les.png"
                alt="Лесоустройство "
                width={500}
                height={400}
                className="w-full max-w-[400px] object-contain"
                style={{ height: 'auto' }}
              />
            </div>
          </div>
          <div className="hidden lg:block absolute right-0 bottom-0 z-10 w-[40%] max-w-[400px] h-auto pointer-events-none">
            <Image
                src="/img/les.png"
								alt="Лесоустройство"
              width={500}
              height={400}
              className="w-full object-contain"
              style={{ height: 'auto' }}
            />
          </div>
        </div>
      </section>


			<section className="py-24 bg-[#f5f7fa]">
  <div className="max-w-[1480px] mx-auto px-4">

    {/* Заголовок */}
    <h2 className="text-center text-[#313131] text-4xl md:text-[56px] font-medium leading-tight mb-16">
			Мы более 17 лет работаем на этом рынке и знаем об лесоустройстве всё
    </h2>

    {/* GRID */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">

      {/* ЛЕВАЯ БОЛЬШАЯ */}
      <div className="bg-white rounded-3xl p-9 flex flex-col justify-between min-h-[420px]">
        <h3 className="text-[#313131] text-2xl md:text-[26px] leading-snug">
				Что такое лесоустройство
        </h3>

        <p className="text-[#7c8a9a] text-lg md:text-xl leading-relaxed">
				Лесоустройство — это система мероприятий по изучению лесного фонда, оценке его состояния и планированию рационального использования лесных ресурсов.<br></br>

В ходе работ формируется достоверная информационная база о лесных территориях: определяется состав насаждений, их возраст, состояние, экологическая ценность и потенциал использования. </p>
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
					Результаты лесоустройства становятся основой для:
          </h3>

          <ul className="space-y-3 text-[#7c8a9a] text-lg leading-relaxed">
            {[
              "стратегического развития территорий",
              "охраны и восстановления лесов",
              "повышения эффективности управления",
              "экологической безопасности региона"
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
					Грамотно проведённое лесоустройство помогает не только сохранить природный потенциал, но и использовать его максимально рационально.
          </p>
        </div>

      </div>
    </div>
  </div>
</section>


<section className="py-24 bg-[#f5f7fa]">
  <div className="max-w-[1480px] mx-auto px-4">

    {/* Заголовок */}
    <h2 className="text-center text-[#313131] text-4xl md:text-[56px] font-medium leading-tight mb-16">
		Кому необходима лесоустройство
    </h2>

    {/* Верхний ряд — 3 карточки */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mb-2">
      <div className="bg-white rounded-3xl p-6">
        <h3 className="text-[#313131] text-2xl font-medium mb-4">Муниципалитетам</h3>
        <p className="text-[#7c8a9a] text-lg leading-6">
				Для контроля состояния лесного фонда и повышения прозрачности управления.
        </p>
      </div>

      <div className="bg-white rounded-3xl p-6">
        <h3 className="text-[#313131] text-2xl font-medium mb-4">Региональным органам власти</h3>
        <p className="text-[#7c8a9a] text-lg leading-6">
				При развитии территорий и реализации природоохранных программ.
        </p>
      </div>

      <div className="bg-white rounded-3xl p-6">
        <h3 className="text-[#313131] text-2xl font-medium mb-4">Лесничества</h3>
        <p className="text-[#7c8a9a] text-lg leading-6">
				И профильные учреждения, для актуализации данных и планирования работ
        </p>
      </div>
    </div>

    {/* Нижний ряд */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 mb-12">

      {/* Левая карточка */}
      <div className="bg-white rounded-3xl p-6">
        <h3 className="text-[#313131] text-2xl font-medium mb-4">Арендаторам лесных участков</h3>
        <p className="text-[#7c8a9a] text-lg leading-6">
				Для законного и эффективного использования ресурсов
        </p>
      </div>

      {/* Правая большая карточка (занимает 2 колонки) */}
			<div className="lg:col-span-2 bg-white rounded-3xl p-2 flex flex-col lg:flex-row gap-2">
			<div className="lg:w-1/2 flex flex-col p-4">

        <h3 className="text-2xl text-[#313131] mb-4">
        Инвесторам
        </h3>
        <p className="text-lg text-[#7c8a9a]">
				При подготовке проектов освоения территорий.
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
        className="bg-[#029cda] hover:bg-[#0066db] text-white text-xl font-medium px-8 py-4 rounded-xl transition"
      >
        Оставить заявку
      </button>
    </div>

  </div>
</section>


<section className="bg-[#f5f7fa] py-24" >
					<div className="max-w-[1480px] mx-auto px-4">

						<h2 className="text-center text-[#313131] text-4xl md:text-[56px] font-medium leading-tight mb-16">
						Какие задачи решает лесоустройство
						</h2>

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
									className="bg-[#029cda] hover:bg-[#0066db] text-white text-lg font-medium px-8 py-4 rounded-xl transition"
								>
									Оставить заявку
								</button>
							</div>

						</div>
					</div>
				</section >


				<section className="max-w-[880px] mx-auto px-4 py-24">
					<h2 className="text-center text-[#313131] text-4xl md:text-[52px] mb-16">
					Как проводится лесоустройство
					</h2>

					<div className="flex flex-col gap-4">
						{[
							{
								title: "Подготовительный этап",
								text: "Включает проведение первого лесоустроительного совещания, получение сведений от Заказчика, сбор и анализ данных, подготовку топографических карт и обеспечение космической съёмкой.",
								image: "/img/imz6.png"
							},
							{
								title: "Полевые работы",
								text: "Включает выезд на объект работ, проведение тренировок, таксацию лесов с использованием специализированного оборудования и приемку-сдачу полевых работ.",
								image: "/img/imz7.png"
							},
							{
								title: "Камеральные работы",
								text: "Включает камеральную обработку лесоустроительной информации, составление документации, подготовку картографической информации и финальную сдачу работ.",
								image: "/img/imz8.png"
							},
						].map((item, i) => (
							<div
								key={i}
								className="bg-white rounded-3xl p-2 flex flex-col lg:flex-row gap-8 transition "
							>
								{/* IMAGE */}
								<div className="lg:w-1/2 bg-[#f6f7f9] rounded-2xl flex items-center justify-center p-8 min-h-[260px]">
									<Image
										src={item.image}
										alt={item.title}
										width={260}
										height={260}
										className="object-contain"
									/>
								</div>

								{/* TEXT */}
								<div className="lg:w-1/2 flex flex-col justify-center p-6">
									<h3 className="text-2xl mb-4 text-[#313131]">
										{item.title}
									</h3>
									<p className="text-lg text-[#7c8a9a] leading-relaxed">
										{item.text}
									</p>
								</div>
							</div>
						))}
					</div>

					{/* Кнопка */}
					<div className="flex justify-center mt-12">
						<button
							onClick={handleConsult}
							className="bg-[#029cda] hover:bg-[#0066db] text-white text-lg font-medium px-8 py-4 rounded-xl transition hover:scale-[1.03]"
						>
							Получить консультацию
						</button>
					</div>
				</section>


				<section className="max-w-[1480px] mx-auto px-4 py-24">

{/* Заголовок */}
<h2 className="text-center text-[#313131] text-4xl md:text-[52px] leading-tight">
Наши преимущества
</h2>

{/* Подзаголовок */}
<p className="text-center text-[#7c8a9a] text-xl mt-6 mb-16 max-w-3xl mx-auto">
Мы выполняем полный цикл работ — от полевого обследования до передачи готовой цифровой базы.
</p>

<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
	{[
		{
			title: "Опыт и компетенции",
			list: [
				"Более 15 лет работы в отрасли",
				"Совокупный опыт команды более 100 лет",
				"Выполнено более 100 муниципальных и государственных контрактов",
				"Лидеры команды участвуют в разработке отраслевых нормативно-правовых актов",
				"фотофиксация",
				"Опыт работы в группах и комиссиях государственных и муниципальных органах"
			],
			image: "/img/services/izn/4.png"


		},
		{
			title: "Технологии",
			list: [
				"Современное и высококачественное оборудование",
				"Собственный отдел программистов",
				"Собственный сервис «Единая среда» для  эффективного учёта, управления и мониторинга территорий и объектов в организациях любого типа и масштаба",
				"Соответствие отечественным и международным требованиям"
			],
			image: "/img/services/izn/5.png"
		},
		{
			title: "Уверенность в результате",
			list: [
				"Точное понимание целей и задач заказчиков",
				"Продуктовая линейка для органов местного самоуправления",
				"Закрытие большей части вопросов управления городской средой",
				"Учет всех деталей, даже не учтенных в ТЗ",
				"Важность как условий контракта, так и конечного результата"
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

	{/* Консультация */}
	<section className="max-w-[980px] mx-auto px-4 py-24">
					<div className="bg-white rounded-3xl p-2 flex flex-col lg:flex-row gap-8 lg:gap-12">

						{/* Текст слева */}
						<div className="lg:w-1/2 flex flex-col justify-center p-6">
							<h2 className="text-[#313131] text-3xl md:text-[28px] font-medium leading-snug mb-6">
								Оставьте запрос на <br />
								консультацию с индивидуальным расчетом
							</h2>

							<p className="text-[#7c8a9a] text-lg leading-relaxed mb-8">
								Стоимость зависит от площади кладбищ, состояния архивов и необходимого
								объема полевых работ. Оставьте заявку, и мы подготовим расчет под вашу
								задачу.
							</p>

							<div>
								<button
									onClick={handleKP}
									className="bg-[#029cda] hover:bg-[#0066db] text-white text-lg font-medium px-8 py-4 rounded-xl transition">
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

        {/* О компании */}

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