"use client";

import Layout from "@/components/Layout";
import Image from "next/image";


export default function DemoPage() {
	const handleKP = () => {
		window.dispatchEvent(new CustomEvent("openKPModal"));
	};

	const handleConsult = () => {
		window.dispatchEvent(new CustomEvent("openConsultModal"));
	};

	return (
		<Layout>
			<div className="font-[Raleway] font-medium lining-nums">
				{/* Hero */}
				<section className="bg-black text-white rounded-b-[20px] relative overflow-hidden">
					<div className="max-w-[1480px] mx-auto px-4 sm:px-6 lg:px-4 py-10 md:py-16">
						<div className="max-w-4xl">
							<h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[56px] font-medium leading-tight">
								Демо‑версия <br></br>АИС «Единая среда»
							</h1>
							<p className="mt-6 text-base sm:text-lg md:text-xl text-gray-300 max-w-3xl">
								Посмотрите, как работает система: интерактивная карта, карточки
								объектов, реестры, поиск, отчеты и аналитика.
							</p>

						</div>
					</div>
				</section>

				{/* What you can see */}
				{/* <section className="py-14 md:py-20">
					<div className="max-w-[1200px] mx-auto px-4">
						<h2 className="text-2xl md:text-3xl lg:text-4xl text-[#313131] font-medium mb-6">
							Что можно посмотреть в демо
						</h2>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
							<div className="bg-white rounded-3xl p-6 shadow-[0_0_0_1px_rgba(15,23,42,0.06)]">
								<h3 className="text-lg md:text-xl font-semibold mb-3 text-[#313131]">
									Интерактивная карта
								</h3>
								<p className="text-gray-600 text-sm md:text-base">
									Слои объектов, поиск по карте, привязка записей к координатам,
									быстрые фильтры и тематические выборки.
								</p>
							</div>
							<div className="bg-white rounded-3xl p-6 shadow-[0_0_0_1px_rgba(15,23,42,0.06)]">
								<h3 className="text-lg md:text-xl font-semibold mb-3 text-[#313131]">
									Реестры и карточки объектов
								</h3>
								<p className="text-gray-600 text-sm md:text-base">
									Единая база, атрибуты, фото, документы, история изменений и
									управление статусами.
								</p>
							</div>
							<div className="bg-white rounded-3xl p-6 shadow-[0_0_0_1px_rgba(15,23,42,0.06)]">
								<h3 className="text-lg md:text-xl font-semibold mb-3 text-[#313131]">
									Отчеты и аналитика
								</h3>
								<p className="text-gray-600 text-sm md:text-base">
									Сводные показатели, выгрузки, контроль качества данных и
									отчеты под задачи муниципалитета.
								</p>
							</div>
						</div>
					</div>
				</section> */}


				{/* Demo iframe */}
				<section className="py-6 md:py-10">
					<div className="max-w-[1480px] mx-auto px-4">
						<div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
							<div>
								<h2 className="text-2xl md:text-3xl lg:text-4xl text-[#313131] font-medium">
									Демо‑интерфейс системы
								</h2>
								<p className="text-gray-600 text-sm md:text-base mt-2 max-w-2xl">
									Интерактивная демонстрация интерфейса. Если демо не загрузилось —
									попробуйте обновить страницу.
								</p>
							</div>

						</div>

						{/* Контейнер с iframe и подсказками */}
						{/* pt-20 — резервируем вертикальное место под подсказки, чтобы они не наезжали на iframe */}
						<div className="relative w-full mt-4 pt-10">
							{/* Подсказка сверху слева: слева стрелка, справа текст, на одной линии */}
							<div className="hidden xl:flex flex-row items-center gap-3 absolute left-6 top-0 z-10">
								<Image
									src="/icons/arrow-demo-left.svg"
									alt="Стрелка к списку паспортов"
									width={20}
									height={20}
									className="w-10 h-10 rotate-20"
								/>
								<p className="text-sm text-[#313131] font-medium leading-tight   max-w-[460px]">
									Нажмите на название паспорта, чтобы к нему переместиться и нажмите на его границы чтобы открыть его
								</p>
							</div>

							{/* Подсказка сверху справа: слева текст, справа стрелка, на одной линии */}
							<div className="hidden xl:flex flex-row items-center gap-3 absolute right-6 top-0 z-10">
								<p className="text-sm text-[#313131] font-medium leading-tight max-w-[360px] text-right">
									Нажмите на кнопку слоев чтобы поменять картографическую подложку
								</p>
								<Image
									src="/icons/arrow-demo-right.svg"
									alt="Стрелка к панели фильтров"
									width={40}
									height={40}
									className="w-10 h-10 -rotate-0"
								/>
							</div>

							<div className="w-full rounded-[20px] overflow-hidden bg-white shadow-[0_0_0_1px_rgba(15,23,42,0.06)]">
								<iframe
									src="https://edinayasreda.ru/widget-api/widgetInfo/3de475668fe4652b8a699f4e317f99fe1f3e90783488d3d18926574b526c32b3"
									title="Демо‑версия АИС «Единая среда»"
									className="w-full h-[70vh] min-h-[560px] border-0"
									loading="lazy"
									allow="clipboard-read; clipboard-write; fullscreen"
								/>
							</div>
						</div>
					</div>
				</section>

				{/* CTA */}
				<section className="py-14 md:py-20">
					<div className="max-w-[900px] mx-auto px-4 text-center">
						<h2 className="text-2xl md:text-3xl lg:text-4xl text-[#313131] font-medium mb-4">
							Хотите посмотреть на систему с менеджером?
						</h2>
						<p className="text-gray-700 text-sm md:text-base mb-6">
							Покажем нужные модули и сценарии, ответим на вопросы и подскажем
							оптимальный формат внедрения.
						</p>
						<div className="flex flex-col sm:flex-row justify-center gap-4">
							<button
								onClick={handleConsult}
								className="inline-flex items-center justify-center bg-[#0077FF] text-white px-8 py-4 rounded-xl font-medium hover:bg-[#0077FF]/90 transition-colors duration-200 focus:outline-none"
							>
								Запросить видеосозвон
							</button>
							<button
								onClick={handleKP}
								className="inline-flex items-center justify-center bg-white text-[#0077FF] border border-[#0077FF] px-8 py-4 rounded-xl font-medium hover:bg-[#0077FF]/10 transition-colors duration-200 focus:outline-none"
							>
								Получить коммерческое предложение
							</button>
						</div>
					</div>
				</section>
			</div>
		</Layout>
	);
}

