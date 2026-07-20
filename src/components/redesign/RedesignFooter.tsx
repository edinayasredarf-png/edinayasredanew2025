import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

const SOCIALS = [
	{ href: 'https://max.ru/id6150100608_biz', src: '/icons/max.svg', alt: 'MAX' },
	{ href: 'https://t.me/edinayasredarf', src: '/icons/tg.svg', alt: 'Telegram' },
	{ href: 'https://vk.com/edinayasredarf', src: '/icons/vk.svg', alt: 'ВКонтакте' },
	{ href: 'https://vkvideo.ru/@edinayasredarf', src: '/icons/vkvideo.svg', alt: 'VK Видео' },
	{ href: 'https://www.youtube.com/@edinayasredarf', src: '/icons/youtube.svg', alt: 'YouTube' },
	{ href: 'https://dzen.ru/edinayasreda', src: '/icons/dzen.svg', alt: 'Дзен' },
];

export function RedesignFooter() {
	return (
		<footer className="bg-white font-[Raleway]">
			<div className="mx-auto max-w-[1200px] px-5">

				{/* ── Верхняя полоса: соцсети + рассылка ── */}
				<div className="py-5">
					<div className="bg-[#F6F7F9] rounded-2xl px-5 py-3 flex flex-wrap items-center gap-3">
						<div className="flex items-center gap-2 flex-wrap">
							{SOCIALS.map((s) => (
								<a key={s.href} href={s.href} target="_blank" rel="noopener noreferrer"
									className="w-11 h-11 bg-white rounded-2xl flex items-center justify-center hover:bg-[#e8eaed] transition-colors shrink-0">
									<Image src={s.src} alt={s.alt} width={22} height={22} />
								</a>
							))}
						</div>
						<span className="text-[#646b85] text-sm hidden sm:block ml-1">Мы в социальных сетях</span>
						<a href="mailto:info@edinayasreda.ru"
							className="ml-auto flex items-center gap-3 h-11 px-5 bg-[#029cda] rounded-xl text-white text-sm font-semibold hover:bg-[#0280b5] transition-colors shrink-0 whitespace-nowrap">
							<svg width="20" height="16" viewBox="0 0 20 16" fill="none">
								<rect x="0" y="0" width="20" height="16" rx="3" fill="white" fillOpacity="0.3"/>
								<path d="M1 1L10 9L19 1" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
							</svg>
							<div className="w-px h-4 bg-[#F6F7F9]/40" />
							Подписаться на рассылку
						</a>
					</div>
				</div>

				{/* ── Основной блок ── */}
				<div className="pt-8 pb-10 flex flex-col lg:flex-row gap-10 lg:gap-8">

					{/* Левая колонка */}
					<div className="shrink-0 lg:w-[220px] flex flex-col gap-5">
						<Link href="/">
							<Image src="/img/logoes_blue.svg" alt="Единая Среда" width={150} height={42} className="h-auto" />
						</Link>

						<div className="flex flex-col gap-2.5 text-[15px] text-[#050c26]">
							<a href="tel:88005505612" className="flex items-center gap-2 hover:text-[#029cda] transition-colors">
								<Image src="/icons/phone.svg" alt="" width={18} height={18} className="shrink-0 opacity-50" />
								8 (800) 550-56-12
							</a>
						</div>

						{/* QR + текст + RuStore */}
						<div className="hidden lg:flex flex-col items-start gap-3">
							<div className="w-[150px] h-[150px] bg-[#f5f6fe] rounded-[18px] flex items-center justify-center shrink-0 p-2">
								<Image src="/img/qr_apps.svg" alt="QR код" width={130} height={130} />
							</div>
							<p className="text-xs text-[#646b85] leading-[1.5]">Наведите камеру, чтобы<br/>скачать приложение</p>
							<a href="https://www.rustore.ru/catalog/app/ru.edinayasreda" target="_blank" rel="noopener noreferrer"
								className="w-[150px] shrink-0 hover:opacity-80 transition-opacity">
								<Image src="/icons/Rustore Logo Color Light.svg" alt="Скачать в RuStore" width={111} height={40} className="w-full h-auto" />
							</a>
						</div>
					</div>

					{/* ── Навигация ── */}
					<div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_1fr_1fr_1fr] gap-y-8 gap-x-6">

						{/* Услуги */}
						<div className="flex flex-col gap-4">
							<p className="text-[#050c26] text-[22px] font-bold font-involve leading-7">Услуги</p>
							<ul className="space-y-3">
								<li><Link href="/services/imz" className="text-[16px] lg:text-[15px] text-[#646b85] leading-6 hover:text-[#029cda] transition-colors">Инвентаризация мест захоронений</Link></li>
								<li><Link href="/services/izn" className="text-[16px] lg:text-[15px] text-[#646b85] leading-6 hover:text-[#029cda] transition-colors">Инвентаризация зеленых насаждений</Link></li>
								<li><Link href="/services/les" className="text-[16px] lg:text-[15px] text-[#646b85] leading-6 hover:text-[#029cda] transition-colors">Лесоустройство</Link></li>
								<li><Link href="/services" className="text-[16px] lg:text-[15px] text-[#029cda] leading-6 hover:text-[#0280b5] transition-colors">Все сервисы</Link></li>
							</ul>
							{/* Копирайт под Услугами */}
							<div className="mt-auto pt-8 hidden lg:flex flex-col gap-1 text-[12px] text-[#646b85] leading-5">
								<span>© 2026 ООО «СФЕРА». Все права защищены.</span>
								<Link href="/privacy" className="hover:text-[#029cda] transition-colors">Политика ООО «СФЕРА» в отношении обработки персональных данных.</Link>
								<span>ПО «АИС Единая среда» включена в Единый реестр российских программ. Запись в реестре №15725 от 05.12.2022 г.</span>
							</div>
						</div>

						{/* Решения */}
						<div className="flex flex-col gap-4">
							<p className="text-[#050c26] text-[22px] font-bold font-involve leading-7">Решения</p>
							<ul className="space-y-3">
								<li><Link href="/solutions/digital-twin" className="text-[16px] lg:text-[15px] text-[#646b85] leading-6 hover:text-[#029cda] transition-colors">Цифровой двойник города</Link></li>
								<li><Link href="/solutions/green-platform" className="text-[16px] lg:text-[15px] text-[#646b85] leading-6 hover:text-[#029cda] transition-colors">Платформа учёта зелёных насаждений города</Link></li>
								<li><Link href="/solutions/cemetery-platform" className="text-[16px] lg:text-[15px] text-[#646b85] leading-6 hover:text-[#029cda] transition-colors">Платформа для инвентаризации мест захоронений</Link></li>
							</ul>
						</div>

						{/* Партнерам + Поддержка */}
						<div className="flex flex-col gap-8">
							<div className="flex flex-col gap-4">
								<p className="text-[#050c26] text-[22px] font-bold font-involve leading-7">Партнёрам</p>
								<ul className="space-y-3">
									<li><Link href="/partnership" className="text-[16px] lg:text-[15px] text-[#646b85] leading-6 hover:text-[#029cda] transition-colors">Партнёрская программа</Link></li>
									<li><Link href="/partnership/all" className="text-[16px] lg:text-[15px] text-[#029cda] leading-6 hover:text-[#0280b5] transition-colors">Все программы</Link></li>
								</ul>
							</div>
							<div className="flex flex-col gap-4">
								<p className="text-[#050c26] text-[22px] font-bold font-involve leading-7">Поддержка</p>
								<ul className="space-y-3">
									<li><Link href="/requisites" className="text-[16px] lg:text-[15px] text-[#646b85] leading-6 hover:text-[#029cda] transition-colors">Реквизиты</Link></li>
									<li><a href="https://max.ru/join/o9Qsp_ls9FThf7PTGJkQIm1as_Uknlw_zFRNV28FtVY" target="_blank" rel="noopener noreferrer" className="text-[16px] lg:text-[15px] text-[#646b85] leading-6 hover:text-[#029cda] transition-colors">Техподдержка</a></li>
									<li><Link href="/documents" className="text-[16px] lg:text-[15px] text-[#646b85] leading-6 hover:text-[#029cda] transition-colors">Документация</Link></li>
									<li><Link href="/faq" className="text-[16px] lg:text-[15px] text-[#646b85] leading-6 hover:text-[#029cda] transition-colors">FAQ</Link></li>
									<li><Link href="/idea" className="text-[16px] lg:text-[15px] text-[#646b85] leading-6 hover:text-[#029cda] transition-colors">Предложить идею</Link></li>
									<li><Link href="/sitemap" className="text-[16px] lg:text-[15px] text-[#646b85] leading-6 hover:text-[#029cda] transition-colors">Карта сайта</Link></li>
								</ul>
							</div>
						</div>

						{/* Компания + Контакты */}
						<div className="flex flex-col gap-8">
							<div className="flex flex-col gap-4">
								<p className="text-[#050c26] text-[22px] font-bold font-involve leading-7">Компания</p>
								<ul className="space-y-3">
									<li><Link href="/about" className="text-[16px] lg:text-[15px] text-[#646b85] leading-6 hover:text-[#029cda] transition-colors">О нас</Link></li>
									<li><Link href="/grants" className="text-[16px] lg:text-[15px] text-[#646b85] leading-6 hover:text-[#029cda] transition-colors">Гранты</Link></li>
									<li><Link href="/cases" className="text-[16px] lg:text-[15px] text-[#646b85] leading-6 hover:text-[#029cda] transition-colors">Кейсы</Link></li>
									<li><Link href="/events" className="text-[16px] lg:text-[15px] text-[#646b85] leading-6 hover:text-[#029cda] transition-colors">Мероприятия</Link></li>
									<li><Link href="/blog" className="text-[16px] lg:text-[15px] text-[#646b85] leading-6 hover:text-[#029cda] transition-colors">Блог</Link></li>
									<li><Link href="/reviews" className="text-[16px] lg:text-[15px] text-[#646b85] leading-6 hover:text-[#029cda] transition-colors">Отзывы</Link></li>
								</ul>
							</div>
							<div className="flex flex-col gap-4">
								<p className="text-[#050c26] text-[22px] font-bold font-involve leading-7">Контакты</p>
								<ul className="space-y-3">
									<li><Link href="/contacts" className="text-[16px] lg:text-[15px] text-[#646b85] leading-6 hover:text-[#029cda] transition-colors">Отдел продаж</Link></li>
									<li><Link href="/contacts/meeting" className="text-[16px] lg:text-[15px] text-[#646b85] leading-6 hover:text-[#029cda] transition-colors">Пригласить на встречу</Link></li>
									<li><Link href="/contacts" className="text-[16px] lg:text-[15px] text-[#646b85] leading-6 hover:text-[#029cda] transition-colors">Контакты</Link></li>
								</ul>
							</div>
						</div>

					</div>
				</div>

				{/* Копирайт на мобиле */}
				<div className="lg:hidden border-t border-[#e8eaed] py-6 flex flex-col gap-2 text-[12px] text-[#646b85]">
					<span>© 2026 ООО «СФЕРА». Все права защищены.</span>
					<Link href="/privacy" className="hover:text-[#029cda] transition-colors">Политика ООО «СФЕРА» в отношении обработки персональных данных.</Link>
					<span>ПО «АИС Единая среда» включена в Единый реестр российских программ. Запись в реестре №15725 от 05.12.2022 г.</span>
				</div>

			</div>
		</footer>
	);
}
