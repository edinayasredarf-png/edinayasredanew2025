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

const NAV = [
	{
		title: 'Услуги',
		links: [
			{ label: 'Инвентаризация мест захоронений', href: '/services/cemetery' },
			{ label: 'Инвентаризация зеленых насаждений', href: '/services/green' },
			{ label: 'Лесоустройство', href: '/services/forest' },
			{ label: 'Все сервисы', href: '/services', accent: true },
		],
	},
	{
		title: 'Решения',
		links: [
			{ label: 'Цифровой двойник города', href: '/solutions/digital-twin' },
			{ label: 'Платформа учёта зелёных насаждений', href: '/solutions/green-platform' },
			{ label: 'Платформа для инвентаризации мест захоронений', href: '/solutions/cemetery-platform' },
		],
	},
	{
		title: 'Партнёрам',
		links: [
			{ label: 'Партнёрская программа', href: '/partnership' },
			{ label: 'Все программы', href: '/partnership/all', accent: true },
		],
	},
	{
		title: 'Поддержка',
		links: [
			{ label: 'Реквизиты', href: '/documents' },
			{ label: 'Техподдержка', href: '/help' },
			{ label: 'Документация', href: '/documents' },
			{ label: 'FAQ', href: '/faq' },
			{ label: 'Предложить идею', href: '/idea' },
			{ label: 'Карта сайта', href: '/sitemap' },
		],
	},
	{
		title: 'Компания',
		links: [
			{ label: 'О нас', href: '/about' },
			{ label: 'Гранты', href: '/grants' },
			{ label: 'Кейсы', href: '/cases' },
			{ label: 'Мероприятия', href: '/events' },
			{ label: 'Блог', href: '/blog' },
			{ label: 'Отзывы', href: '/reviews' },
		],
	},
	{
		title: 'Контакты',
		links: [
			{ label: 'Отдел продаж', href: '/contacts' },
			{ label: 'Пригласить на встречу', href: '/contacts/meeting' },
			{ label: 'Контакты', href: '/contacts' },
		],
	},
];

export function RedesignFooter() {
	return (
		<footer className="bg-[#F6F7F9] font-[Raleway]">
			<div className="mx-auto max-w-[1200px] px-5 lg:px-5">

				{/* ── Верхняя полоса: соцсети + рассылка ── */}
				<div className="py-5">
					<div className="bg-white rounded-2xl px-5 py-3 flex flex-wrap items-center gap-3">
						{/* Иконки соцсетей */}
						<div className="flex items-center gap-2 flex-wrap">
							{SOCIALS.map((s) => (
								<a key={s.href} href={s.href} target="_blank" rel="noopener noreferrer"
									className="w-11 h-11 bg-[#f6f7f9] rounded-2xl flex items-center justify-center hover:bg-[#e8eaed] transition-colors shrink-0">
									<Image src={s.src} alt={s.alt} width={22} height={22} />
								</a>
							))}
						</div>

						{/* Подпись */}
						<span className="text-[#646b85] text-sm hidden sm:block ml-1">Мы в социальных сетях</span>

						{/* Кнопка рассылки — прижата вправо */}
						<a href="mailto:info@edinayasreda.ru"
							className="ml-auto flex items-center gap-3 h-11 px-5 bg-[#029cda] rounded-xl text-white text-sm font-semibold hover:bg-[#0280b5] transition-colors shrink-0 whitespace-nowrap">
							<svg width="20" height="16" viewBox="0 0 20 16" fill="none" xmlns="http://www.w3.org/2000/svg">
								<rect x="0" y="0" width="20" height="16" rx="3" fill="white" fillOpacity="0.3"/>
								<path d="M1 1L10 9L19 1" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
							</svg>
							<div className="w-px h-4 bg-white/40" />
							Подписаться на рассылку
						</a>
					</div>
				</div>

				{/* ── Основной блок: лого + навигация ── */}
				<div className="pt-8 pb-10 flex flex-col lg:flex-row gap-10 lg:gap-6">

					{/* Левая колонка */}
					<div className="shrink-0 lg:w-[240px] flex flex-col gap-6">
						<Link href="/">
							<Image src="/img/logo_footer.svg" alt="Единая Среда" width={150} height={42} className="h-auto" />
						</Link>

						<div className="flex flex-col gap-2 text-[15px] text-[#050c26]">
							<a href="/contacts" className="flex items-center gap-2 hover:text-[#029cda] transition-colors">
								<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="1" y="1" width="16" height="16" rx="3" stroke="#b1b2c7" strokeWidth="1.5"/><path d="M4 6h5M4 9h3" stroke="#b1b2c7" strokeWidth="1.5" strokeLinecap="round"/></svg>
								Отдел продаж
							</a>
							<a href="tel:88005505612" className="flex items-center gap-2 hover:text-[#029cda] transition-colors">
								<svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="1" y="1" width="16" height="16" rx="8" stroke="#b1b2c7" strokeWidth="1.5"/><path d="M6 8a6 6 0 005 5" stroke="#b1b2c7" strokeWidth="1.5" strokeLinecap="round"/></svg>
								8 (800) 550-56-12
							</a>
						</div>

						<a href="mailto:info@edinayasreda.ru"
							className="inline-flex items-center justify-center h-[52px] px-5 bg-[#029cda] rounded-xl text-white text-[15px] font-semibold hover:bg-[#0280b5] transition-colors">
							Подписаться на рассылку
						</a>

						{/* QR + приложения */}
						<div className="flex items-start gap-3">
							<div className="w-[90px] h-[90px] bg-[#f5f6fe] rounded-[18px] flex items-center justify-center shrink-0">
								<Image src="/img/qr_apps.svg" alt="QR код" width={70} height={70} />
							</div>
							<div className="flex flex-col gap-2">
								<a href="https://apps.apple.com" target="_blank" rel="noopener noreferrer"
									className="w-[60px] h-[60px] bg-[#f5f6fe] rounded-[18px] flex items-center justify-center hover:bg-[#e8eaed] transition-colors">
									<svg width="28" height="28" viewBox="0 0 28 28" fill="none"><path d="M14 4C8.48 4 4 8.48 4 14s4.48 10 10 10 10-4.48 10-10S19.52 4 14 4z" fill="#0077ff"/><path d="M11 9.5l6 4.5-6 4.5V9.5z" fill="white"/></svg>
								</a>
								<a href="https://www.rustore.ru/catalog/app/ru.edinayasreda" target="_blank" rel="noopener noreferrer"
									className="w-[60px] h-[60px] bg-[#f5f6fe] rounded-[18px] flex items-center justify-center hover:bg-[#e8eaed] transition-colors">
									<svg width="22" height="28" viewBox="0 0 22 28" fill="none"><path d="M1 2h12l8 8-8 8H1V2z" fill="#34a853"/><path d="M1 18h12l4 4H1v-4z" fill="#ea4335"/><path d="M13 10h5l4 4-4 4h-5" fill="#fbbc04"/><path d="M1 2v16" stroke="#4285f4" strokeWidth="2"/></svg>
								</a>
							</div>
						</div>
						<p className="text-xs text-[#646b85]">Наведите камеру, чтобы<br/>скачать приложение</p>
					</div>

					{/* Навигация — 6 колонок */}
					<div className="flex-1 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 lg:gap-4">
						{NAV.map((col) => (
							<div key={col.title}>
								<p className="text-[#050c26] text-[15px] font-semibold font-involve mb-4">{col.title}</p>
								<ul className="space-y-3">
									{col.links.map((l) => (
										<li key={l.label}>
											<Link href={l.href}
												className={`text-[13px] leading-[1.5] transition-colors hover:text-[#029cda] ${l.accent ? 'text-[#029cda]' : 'text-[#646b85]'}`}>
												{l.label}
											</Link>
										</li>
									))}
								</ul>
							</div>
						))}
					</div>
				</div>

				{/* ── Нижняя строка: копирайт ── */}
				<div className="border-t border-[#e8eaed] py-6 flex flex-col sm:flex-row gap-3 sm:gap-8 text-xs text-[#646b85]">
					<span>© 2026 ООО «СФЕРА». Все права защищены.</span>
					<Link href="/privacy" className="hover:text-[#029cda] transition-colors">
						Политика ООО «СФЕРА» в отношении обработки персональных данных.
					</Link>
					<span>ПО «АИС Единая среда» включена в Единый реестр российских программ. Запись в реестре №15725 от 05.12.2022 г.</span>
				</div>

			</div>
		</footer>
	);
}
