"use client";
import Layout from '../../../components/Layout';
import Image from 'next/image';
import FAQService from "@/components/FAQService";



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
			<div className="font-[Raleway] font-medium lining-nums">

				{/* HERO */}
				<section className="bg-black text-white rounded-b-[20px] relative overflow-hidden min-h-[400px]">
					<div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-20 relative z-10">
						<div className="relative flex flex-col lg:flex-row items-center lg:items-stretch gap-16">
							<div className="flex-1 lg:basis-3/5 text-left flex flex-col justify-center z-20">
								<h1 className="text-4xl sm:text-5xl md:text-[68px] font-medium leading-tight">
									Инвентаризация<br /> мест захоронений

								</h1>

								<p className="mt-8 text-xl sm:text-[22px] text-gray-300 max-w-2xl">
									Выполняем инвентаризацию кладбищ и инвентаризацию мест
									захоронений с созданием электронной карты, реестра захоронений и удобного
									поиска для муниципалитетов, операторов кладбищ и граждан.
								</p>

								<div className="mt-10 flex flex-col sm:flex-row gap-4">
									<button
										onClick={handleKP}
										className="inline-flex items-center justify-center bg-[#0077FF] text-white font-medium text-xl px-16 py-5 rounded-2xl hover:bg-[#0077FF]/90 transition"
									>
										Получить КП
									</button>

									<button
										onClick={handleConsult}
										className="inline-flex items-center justify-center border border-white text-white font-medium text-xl px-16 py-5 rounded-2xl hover:bg-[#ffff]/10 transition"
									>
										Получить консультацию
									</button>
								</div>
							</div>

							<div className="hidden lg:block absolute right-0 bottom-0 w-[40%] max-w-[500px]">
								<Image
									src="/img/cemetery1.png"
									alt="Инвентаризация и оцифровка кладбищ"
									width={500}
									height={400}
									className="w-full object-contain"
								/>
							</div>
						</div>
					</div>
				</section >

				{/* ДЛЯ КОГО */}
				<section className="max-w-[1480px] mx-auto px-4 py-24" >
					<h2 className="text-center text-[#313131] text-4xl md:text-[52px] leading-tight mb-16">
						Для кого подходит система инвентаризации мест захоронений
					</h2>

					<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">

						{/* CARD */}
						{[
							{
								title: "Органы местного самоуправления",
								text: "Выполнение нормативных требований по ведению реестра мест захоронений, формирование отчетности и планирование развития кладбищ."
							},
							{
								title: "Муниципальные кладбища и МУПы",
								text: "Ведение единой базы захоронений и учета мест на кладбище, исключение ошибок и потерь записей."
							},
							{
								title: "Подрядчики по инвентаризации кладбищ",
								text: "Профессиональный инструмент для инвентаризации мест погребения и передачи результатов заказчику."
							}
						].map((card, i) => (
							<div key={i} className="bg-white rounded-3xl flex flex-col overflow-hidden">
								<div className="p-2">
									<div className="bg-[#f6f7f9] rounded-2xl flex items-center justify-center h-[260px]">
										<Image
											src="/img/reasons-3.png"
											alt="Инвентаризация кладбищ"
											width={320}
											height={320}
										/>
									</div>
								</div>

								<div className="px-8 py-4 space-y-4">
									<h3 className="text-[#313131] text-2xl leading-snug">
										{card.title}
									</h3>
									<p className="text-[#7c8a9a] text-lg leading-relaxed">
										{card.text}
									</p>
								</div>
							</div>
						))}
					</div>
				</section >

				{/* ЗАДАЧИ */}
				<section className="max-w-[1480px] mx-auto px-4 py-24" >
					<h2 className="text-center text-[#313131] text-4xl md:text-[56px] mb-16">
						Какие задачи решает инвентаризация кладбищ
					</h2>

					<div className="grid grid-cols-1 lg:grid-cols-3 gap-2">

						{/* BIG LEFT */}
						<div className="lg:col-span-2 bg-white rounded-3xl p-2 flex flex-col lg:flex-row gap-2">
							<div className="lg:w-1/2 bg-[#f6f7f9] rounded-2xl flex items-center justify-center">
								<Image
									src="/img/reasons-3.png"
									alt="Инвентаризация кладбищ"
									width={320}
									height={320}
								/>
							</div>

							<div className="lg:w-1/2 flex flex-col justify-center px-8 py-4">
								<h3 className="text-2xl  text-[#313131] mb-4">
									Полная картина заполненности кладбищ
								</h3>
								<p className="text-lg text-[#7c8a9a]">
									Определение фактического количества захоронений, свободных мест,
									резервов и реестра бесхозных захоронений.
								</p>
							</div>
						</div>

						{/* TOP RIGHT */}
						<div className="bg-white rounded-3xl px-8 py-6 flex flex-col justify-center">
							<h3 className="text-2xl text-[#313131] mb-4">
								Наведение порядка в книгах захоронений
							</h3>
							<p className="text-lg text-[#7c8a9a]">
								Сопоставление архивных записей с фактическими данными,
								устранение дубликатов и ошибок.
							</p>
						</div>

						{/* BOTTOM LEFT */}
						<div className="bg-white rounded-3xl px-8 py-6 flex flex-col justify-center">
							<h3 className="text-2xl text-[#313131] mb-4">
								Исполнение нормативных требований
							</h3>
							<p className="text-lg text-[#7c8a9a]">
								Подготовка к переходу на государственные системы учета.
							</p>
						</div>

						{/* BIG RIGHT */}
						<div className="lg:col-span-2 bg-white rounded-3xl p-2 flex flex-col lg:flex-row gap-2">
							<div className="lg:w-1/2 flex flex-col justify-center px-8 py-4">
								<h3 className="text-2xl text-[#313131] mb-4">
									Повышение качества сервисов для граждан
								</h3>
								<p className="text-lg text-[#7c8a9a]">
									Поиск захоронений по фамилии и оформление обращений онлайн
									на основе актуальных данных.
								</p>
							</div>

							<div className="lg:w-1/2 bg-[#f6f7f9] rounded-2xl flex items-center justify-center">
								<Image
									src="/img/reasons-3.png"
									alt="Инвентаризация кладбищ"
									width={320}
									height={320}
								/>
							</div>
						</div>

					</div>
				</section >

				{/* ПОЧЕМУ ВЫБИРАЮТ НАС */}
				<section className="bg-[#f5f7fa] py-24" >
					<div className="max-w-[1480px] mx-auto px-4">

						<h2 className="text-center text-[#313131] text-4xl md:text-[56px] font-medium leading-tight mb-16">
							Почему выбирают именно нас
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
									className="bg-[#0077FF] hover:bg-[#0066db] text-white text-lg font-medium px-8 py-4 rounded-xl transition"
								>
									Оставить заявку
								</button>
							</div>

						</div>
					</div>
				</section >

				{/* КАК ПРОВОДИТСЯ ИНВЕНТАРИЗАЦИЯ */}
				{/* КАК ПРОВОДИТСЯ */}
				<section className="max-w-[880px] mx-auto px-4 py-24">
					<h2 className="text-center text-[#313131] text-4xl md:text-[52px] mb-16">
						Как проводится инвентаризация кладбищ
					</h2>

					<div className="flex flex-col gap-4">
						{[
							{
								title: "Подготовка и анализ архивов",
								text: "Изучение книг захоронений, схем участков и электронных данных для формирования точного плана работ.",
							},
							{
								title: "Полевые работы",
								text: "GPS-съемка, фотофиксация и сбор данных по каждому месту захоронения.",
							},
							{
								title: "Создание цифрового реестра",
								text: "Формирование электронной карты кладбища и запуск системы учета.",
							},
						].map((item, i) => (
							<div
								key={i}
								className="bg-white rounded-3xl p-2 flex flex-col lg:flex-row gap-8"
							>
								<div className="lg:w-1/2 bg-[#f6f7f9] rounded-2xl flex items-center justify-center p-6">
									<Image
										src="/img/reasons-3.png"
										alt="Процесс инвентаризации кладбищ"
										width={260}
										height={260}
									/>
								</div>

								<div className="lg:w-1/2 flex flex-col justify-center p-6">
									<h3 className="text-2xl mb-4 text-[#313131]">
										{item.title}
									</h3>
									<p className="text-lg text-[#7c8a9a]">{item.text}</p>
								</div>
							</div>
						))}
					</div>


					{/* Кнопка внизу */}
					<div className="flex justify-center mt-12">
						<button
							onClick={handleConsult}
							className="bg-[#0077FF] hover:bg-[#0066db] text-white text-lg font-medium px-8 py-4 rounded-xl transition">
							Получить консультацию
						</button>
					</div>
				</section>

				{/* Соответствие требованиям государства */}
				<section className="max-w-[1020px] mx-auto px-4 ">
					<div className="flex flex-col gap-2">
						<div className="bg-white rounded-3xl p-2 flex flex-col lg:flex-row gap-6 lg:gap-10">
							{/* Изображение слева с внутренним отступом */}
							<div className="lg:w-1/2 bg-[#f6f7f9] rounded-2xl flex items-center justify-center p-4">
								<Image
									src="/img/reasons-3.png"
									alt="Инвентаризация кладбищ"
									width={320}
									height={320}
								/>
							</div>

							{/* Текст справа */}
							<div className="lg:w-1/2 flex flex-col justify-center px-4 lg:px-4 py-8">
								<h3 className="text-[#313131] text-2xl md:text-2xl font-medium mb-4">
									Соответствие требованиям государства и подготовка к единой базе
								</h3>
								<p className="text-[#7c8a9a] text-lg md:text-xl leading-relaxed">
									Инвентаризация мест захоронений и ведение электронного реестра выполняются с
									учетом действующих требований и будущей интеграции с государственными и
									региональными системами учета.
								</p>
							</div>
						</div>
					</div>
				</section>

				{/* Результат для муниципалитета и граждан */}
				<section className="max-w-[880px] mx-auto px-4 py-24">
					<h2 className="text-center text-[#313131] text-4xl md:text-[52px] font-medium leading-tight mb-16">
						Результат для муниципалитета и граждан
					</h2>

					<div className="flex flex-col lg:flex-row gap-2">
						{/* Карточка для администрации и служб */}
						<div className="bg-white rounded-3xl p-6 flex-1 relative flex flex-col">
							<h3 className="text-[#313131] text-xl md:text-2xl font-semibold mb-4">
								Для администрации и служб
							</h3>




							<p className="text-[#7c8a9a] text-lg leading-relaxed mt-4">
								Актуальная электронная карта кладбищ и реестр мест захоронений, отчетность, планирование развития территорий и сокращение ручного труда.
							</p>
						</div>

						{/* Карточка для жителей */}
						<div className="bg-white rounded-3xl p-6 flex-1 relative flex flex-col">
							<h3 className="text-[#313131] text-xl md:text-2xl font-semibold mb-4">
								Для жителей
							</h3>



							<p className="text-[#7c8a9a] text-lg leading-relaxed mt-4">
								Удобный поиск захоронений по фамилии, доступ к информации онлайн и возможность заказать услуги по уходу за местом захоронения.
							</p>
						</div>
					</div>

					{/* Кнопка внизу */}
					<div className="flex justify-center mt-12">
						<button className="bg-[#0077FF] hover:bg-[#0066db] text-white text-lg font-medium px-8 py-4 rounded-xl transition">
							Получить консультацию
						</button>
					</div>
				</section>

				{/* Demo iframe */}
				<section className="py-6 md:py-10">

					<div className="max-w-[1480px] mx-auto px-4">

						<div>
							<h2 className="text-center text-[#313131] text-4xl md:text-[52px] font-medium leading-tight mb-4">
								Интерфейс системы учета кладбищ
							</h2>

							<p className="text-center text-[#7c8a9a] text-lg md:text-xl max-w-3xl mx-auto mb-16">
								Управляйте местами захоронений, ведите учет и аналитику — всё в одной цифровой платформе							</p>
						</div>
						<div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">


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
									className="bg-[#0077FF] hover:bg-[#0066db] text-white text-lg font-medium px-8 py-4 rounded-xl transition">
									Оставить заявку
								</button>
							</div>
						</div>

						{/* Изображение справа */}
						<div className="lg:w-1/2 bg-[#f6f7f9] rounded-2xl flex items-center justify-center p-6">
							<Image
								src="/img/reasons-3.png"
								alt="Получить консультацию по инвентаризации и оцифровке мест"
								width={320}
								height={320}
							/>
						</div>

					</div>
				</section>
				<FAQService />


			</div >
		</Layout >);
}