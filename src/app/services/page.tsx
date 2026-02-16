"use client";
import React from "react";
import Layout from "@/components/Layout";
import { useModal } from "@/components/ModalProvider";
import Image from "next/image";
import Link from "next/link";


const handleKP = () => {
	window.dispatchEvent(new CustomEvent('openKPModal'));
};


const handleConsult = () => {
	window.dispatchEvent(new CustomEvent('openConsultModal'));
};


const advantages = [
	{
		icon: '/icons/эксперты.svg',
		label: 'Огромный опыт в отрасли',
		description: 'Более 17-летний практический опыт позволяет нам применять проверенные решения и адаптировать методологию под задачи каждого проекта.'
	},
	{
		icon: '/icons/Соответстиве требованиям.svg',
		label: 'Прозрачные бюджеты и прогнозируемые сроки',
		description: 'Фиксируем стоимость и этапы работ заранее, чтобы вы могли точно планировать ресурсы и избегать неожиданных расходов.'
	},
	{
		icon: '/icons/information.svg',
		label: 'Современное оборудование. ',
		description: 'Используем RTK-технологии, мобильные комплексы и актуальное программное обеспечение для быстрого сбора и максимально точной обработки данных.'
	},
	{
		icon: '/icons/новое оборудование.svg',
		label: 'Квалифицированные специалисты. ',
		description: 'Над проектами работают ГИС-инженеры, полевые эксперты и аналитики данных, обеспечивая высокий профессиональный уровень на каждом этапе.'
	},
	{
		icon: '/icons/Безопасность данных.svg',
		label: 'Собственная платформа «Единая Среда».',
		description: 'Предоставляем безопасную цифровую среду для хранения, анализа и управления данными с удобным доступом к отчетности.'
	},
	{
		icon: '/icons/Постоплата.svg',
		label: 'Поддержка и обучение.',
		description: 'Сопровождаем внедрение системы, обучаем команды и предоставляем всю необходимую документацию для эффективной работы.'
	},
];


export default function ServicesPage() {
  // Достаём модалки; если openKP нет в типах — безопасно вызовем через any.
  const modal = useModal() as any;
  const handleOpenKP = () => {
    if (typeof modal?.openKP === "function") modal.openKP();
    else if (typeof modal?.openConsult === "function") modal.openConsult();
  };
  const handleOpenConsult = () => modal?.openConsult?.();

  // Единый стиль заголовков/текста — совпадает со страницей партнёрства
  const headingBase = "font-medium leading-[1.15]";
  const headingColor = "text-[#101828]";
  const paragraphMuted = "text-[#667085]";

  // Карточки услуг (поле icon оставлено, но не используется в UI)
  const services = [
    {
      icon: "/icons/document_list_outline_28.svg",
      title: "Оцифровка мест захоронений",
      desc:
        "Создание точного реестра, схема участков, поиск онлайн. Поддержка инвентаризации, оплат и публикации на портале.",
      href: "/services/imz",
      image: "/img/услуга_имз.png",
    },
    {
      icon: "/icons/users_outline_28.svg",
      title: "Инвентаризация зелёных насаждений",
      desc:
        "Паспортизация деревьев и кустарников, учёт работ (КР/ТР), планирование агротехмероприятий, визуализации и отчётность.",
      href: "/services/izn",
      image: "/img/услуга_изн.png",
    },
    {
      icon: "/icons/archive_outline_28.svg",
      title: "Лесоустройство",
      desc:
        "Учёт выделов, мероприятия, мониторинг. Мобильные обходы, офлайн-режим и последующая синхронизация с хранилищем.",
      href: "/services/les",
      image: "/img/услуга_лес.png",
    },
  ];

  const benefits = [
    { icon: "/icons/education_outline_28.svg", text: "Огромный опыт в отрасли и  своя уникальная методология работы " },
    { icon: "/icons/coins_outline_28.svg", text: "Прозрачные бюджеты и прогнозируемые сроки" },
    { icon: "/icons/user_outline_28.svg", text: "Современное оборудование. RTK-точность, мобильные комплексы и актуальный софт — быстро и достоверно." },
    { icon: "/icons/user_switch_outline_28.svg", text: "Квалифицированные специалисты. ГИС-инженеры, полевые группы, аналитики данных." },
    { icon: "/icons/document_list_outline_28.svg", text: "Собственная платформа «Единая Среда». Безопасное хранение данных, аналитика, отчеты." },
    { icon: "/icons/vw_active_outline_28.svg", text: "Поддержка и обучение. Документация, обучение команд" },
  ];

  return (
    <Layout>
      <div className="min-h-screen font-[Raleway] font-medium lining-nums">

			<section className="bg-black text-white rounded-b-[20px] relative overflow-hidden min-h-[400px]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-20 relative z-10">
          <div className="relative flex flex-col lg:flex-row items-center lg:items-stretch gap-16">
            <div className="flex-1 lg:basis-3/5 text-left flex flex-col justify-center z-20">
              <h1 className="text-4xl sm:text-5xl md:text-[68px] font-medium leading-tight">
							Услуги
              </h1>
              <p className="mt-8 text-xl sm:text-[20px] text-gray-300 max-w-2xl">
							Простые и надёжные решения для цифрового управления территориями и объектами — от оцифровки и инвентаризации до интеграций и сопровождения.

</p>
              <div className="mt-10 flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleKP}
                  className="inline-flex items-center justify-center bg-[#0077FF] text-white text-sm md:text-base lg:text-lg font-medium px-6 py-4 md:px-8 md:py-5 text-lg md:text-2xl rounded-xl hover:bg-[#0077FF]/90 transition-colors duration-200 focus:outline-none"
                >
                  Запросить КП
                </button>
                <button
                  onClick={handleConsult}
                  className="inline-block  text-white border border-white text-sm md:text-base lg:text-lg font-medium px-6 py-4 md:px-8 md:py-5 text-lg md:text-2xl rounded-xl hover:bg-white/10 transition-colors"
                >
                 Бесплатная консультация
                </button>
              </div>
            </div>
            <div className="flex-1 w-full h-full relative flex justify-center items-end lg:hidden z-10  ">
              <Image
                src="/img/services.webp"
                alt="Услуги"
                width={500}
                height={500}
                className="w-full max-w-[500px] object-contain "
              />
            </div>
          </div>
          <div className="hidden lg:block absolute right-0 bottom-0 z-10 w-[40%] max-w-[500px] h-auto pointer-events-none">
            <Image
                src="/img/services.webp"
								alt="Услуги"
              width={500}
              height={500}
              className="w-full object-contain"
            />
          </div>
        </div>
      </section>

        {/* КАТАЛОГ УСЛУГ — карточки с изображением сверху и аккуратным ховером */}
        <section id="catalog" className="max-w-[1400px] mx-auto mt-8 px-2 py-2">
          {/* Заголовок/подзаголовок как в примере */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-12">
            <h2 className=" text-[#313131] text-4xl md:text-[56px] font-medium leading-tight text-left">Каталог услуг</h2>
            <div className="text-[#7c8a9a] text-lg leading-relaxed">
              Выберите нужную услугу — и оставьте заявку или проконсультируйтесь с нашими менеджерами.
            </div>
          </div>

          {/* Сетка карточек */}
          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* “Единая среда” — первая карточка */}
            <div className="bg-white rounded-4xl p-3 md:p-4 h-auto flex flex-col gap-6 transition-all duration-300">
              <Image
                src="/img/ес.svg"
                alt="Единая среда"
                width={360}
                height={360}
                className="object-contain max-w-[100%] max-h-[100%] mr-4"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
              />
              <div className="flex flex-col justify-center h-full ">
                <div className="mb-2 text-center md:text-left pl-2 md:pl-4">
                  <h3 className="text-[#313131] text-2xl font-medium mb-4">Единая среда</h3>
                </div>
                <p className="text-[#7c8a9a] text-lg leading-relaxed text-center md:text-left mx-auto md:mx-0 mb-4 pl-2 md:pl-4">
                  Платформа для цифрового управления территориями, автоматизации процессов и аналитики для организаций любого масштаба.
                </p>
                <div className="flex flex-col gap-2 w-full mt-auto">
                  <Link
                    href="/"
                    className="w-full bg-gray-100 text-gray-700 font-medium py-4 rounded-2xl text-base hover:bg-gray-200 transition-colors text-center inline-flex items-center justify-center"
                  >
                    Подробнее о системе
                  </Link>
                  <button
                    onClick={handleOpenKP}
                    className="w-full bg-white text-[#0077FF] border border-[#0077FF] hover:bg-[#0077FF]/10 font-bold py-4 rounded-2xl text-base transition-colors"
                  >
                    Оставить заявку
                  </button>
                </div>
              </div>
            </div>

            {/* Остальные карточки — без иконок в заголовке */}
            {services.map((s, i) => (
              <div
                key={i}
                className="bg-white rounded-4xl p-3 md:p-4 h-auto flex flex-col gap-6 transition-all duration-300 "
              >
                {/* Изображение услуги */}
                <Image
                  src={s.image}
                  alt={s.title}
                  width={360}
                  height={360}
                  className="object-contain max-w-[100%] max-h-[100%] mr-4"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                />

                {/* Текстовый блок */}
                <div className="flex flex-col justify-center h-full ">
                  {/* ТОЛЬКО заголовок — без иконки */}
                  <div className="mb-2 text-center md:text-left pl-2 md:pl-4">
                    <h3 className="text-[#313131] text-2xl font-medium mb-4">{s.title}</h3>
                  </div>

                  <p className="text-[#7c8a9a] text-lg leading-relaxed text-center md:text-left mx-auto md:mx-0 mb-4 pl-2 md:pl-4">
                    {s.desc}
                  </p>

                  <div className="flex flex-col gap-2 w-full mt-auto">
                    <Link
                      href={s.href}
                      className="w-full bg-gray-100 text-gray-700 font-medium py-4 rounded-2xl text-base hover:bg-gray-200 transition-colors text-center"
                    >
                      Подробнее об услуге
                    </Link>

                    <button
                      onClick={handleOpenKP}
                      className="w-full bg-white text-[#0077FF] border border-[#0077FF] hover:bg-[#0077FF]/10 font-bold py-4 rounded-2xl text-base transition-colors"
                    >
                      Оставить заявку
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Общая кнопка под сеткой */}
          <div className="flex justify-center mt-10">
            <button
              onClick={handleOpenKP}
              className="px-5 py-3.5 bg-[#0077FF] text-white text-lg font-medium rounded-xl hover:bg-[#0077FF]/90 transition-colors"
            >
              Обсудить проект
            </button>
          </div>
        </section>


				<section className="bg-[#f5f7fa] py-24" >
					<div className="max-w-[1480px] mx-auto px-4">

						<h2 className="text-center text-[#313131] text-4xl md:text-[56px] font-medium leading-tight mb-16">
						Почему выбирают нас	</h2>

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

				<section className="max-w-[980px] mx-auto px-4 py-24">
					<div className="bg-white rounded-3xl p-2 flex flex-col lg:flex-row gap-8 lg:gap-12">

						{/* Текст слева */}
						<div className="lg:w-1/2 flex flex-col justify-center p-6">
							<h2 className="text-[#313131] text-3xl md:text-[28px] font-medium leading-snug mb-6">
								Оставьте запрос на <br />
								консультацию с индивидуальным расчетом
							</h2>

							<p className="text-[#7c8a9a] text-lg leading-relaxed mb-8">
							Готовы обсудить задачи — оставьте заявку, предложим варианты запуска и подготовим смету с этапами работ.


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




      </div>
    </Layout>
  );
}
