'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useModal } from '@/components/ModalProvider';
import ThemedIcon from '@/components/ThemedIcon';

const SERVICE_LINKS = [
	{ href: '/services/imz', label: 'Инвентаризация мест захоронений', icon: '/icons/Cemetery.svg' },
	{ href: '/services/izn', label: 'Инвентаризация зеленых насаждений', icon: '/icons/Tree.svg' },
	{ href: '/services/les', label: 'Лесоустройство', icon: '/icons/Forest.svg' },
] as const;

function ChevronDown({ open }: { open: boolean }) {
	return (
		<svg
			className={`w-[17px] h-[17px] shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
			viewBox="0 0 17 17"
			fill="none"
			aria-hidden
		>
			<path
				d="M12.4911 6.20898L8.50013 10.1999L4.50928 6.20898"
				stroke="currentColor"
				strokeWidth="1.39"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
}

function MobileMenuButton({ open, onClick }: { open: boolean; onClick: () => void }) {
	return (
		<button
			type="button"
			className="lg:hidden relative shrink-0 w-10 h-10 flex items-center justify-center rounded-3xl"
			onClick={onClick}
			aria-expanded={open}
			aria-label={open ? 'Закрыть меню' : 'Открыть меню'}
		>
			<span className={`absolute block h-0.5 w-[18px] bg-[#222] rounded-full transition-all duration-300 ease-out ${open ? 'top-1/2 -translate-y-1/2 rotate-45' : 'top-[12px]'}`} aria-hidden />
			<span className={`absolute block h-0.5 w-[18px] bg-[#222] rounded-full transition-all duration-300 ease-out top-1/2 -translate-y-1/2 ${open ? 'opacity-0 scale-x-0' : 'opacity-100 scale-x-100'}`} aria-hidden />
			<span className={`absolute block h-0.5 w-[18px] bg-[#222] rounded-full transition-all duration-300 ease-out ${open ? 'top-1/2 -translate-y-1/2 -rotate-45' : 'bottom-[12px]'}`} aria-hidden />
		</button>
	);
}

export function RedesignHeader() {
	const pathname = usePathname();
	const { openRegister } = useModal();
	const [mobileOpen, setMobileOpen] = useState(false);
	const [servicesOpen, setServicesOpen] = useState(false);
	const servicesRef = useRef<HTMLDivElement>(null);

	useEffect(() => { setMobileOpen(false); setServicesOpen(false); }, [pathname]);

	useEffect(() => {
		document.body.style.overflow = mobileOpen ? 'hidden' : '';
		return () => { document.body.style.overflow = ''; };
	}, [mobileOpen]);

	useEffect(() => {
		if (!servicesOpen) return;
		const onPointerDown = (e: MouseEvent) => {
			if (servicesRef.current && !servicesRef.current.contains(e.target as Node)) setServicesOpen(false);
		};
		document.addEventListener('mousedown', onPointerDown);
		return () => document.removeEventListener('mousedown', onPointerDown);
	}, [servicesOpen]);

	const isActive = (href: string) => pathname?.startsWith(href);
	const isServicesActive = pathname?.startsWith('/services');
	const toggleMobile = () => setMobileOpen((v) => !v);
	const closeMobile = () => setMobileOpen(false);

	const navCls = (href: string) =>
		`flex items-center gap-0.5 pl-4 pr-1.5 py-3 text-sm font-involve font-medium leading-6 tracking-tight whitespace-nowrap transition-colors hover:text-[#029cda] ${isActive(href) ? 'text-[#029cda]' : 'text-[#313131]'}`;

	return (
		<>
			<header className={`sticky top-0 bg-gradient-to-b from-white to-white/75 ${mobileOpen ? 'z-[100]' : 'z-50'}`}>

				{/* ── Desktop ── */}
				<div className="hidden lg:block">
					<div className="max-w-[1344px] mx-auto px-6">

						{/* Top utility bar */}
						<div className="flex items-center justify-between h-6 mt-4">
							{/* Left: secondary links */}
							<nav className="flex items-center gap-5">
								<Link href="/documents" className="text-sm font-involve font-medium leading-5 tracking-tight text-[#313131] hover:text-[#029cda] transition-colors">
									Документация
								</Link>
								<Link href="/blog" className="text-sm font-involve font-medium leading-5 tracking-tight text-[#313131] hover:text-[#029cda] transition-colors">
									Блог
								</Link>
								<Link href="/contacts" className="text-sm font-involve font-medium leading-5 tracking-tight text-[#313131] hover:text-[#029cda] transition-colors">
									Мероприятия
								</Link>
							</nav>

							{/* Right: utility icons */}
							<div className="flex items-center gap-1">
								{/* Отзывы */}
								<Link href="/contacts" className="flex items-center gap-1.5 px-3 py-0.5 text-sm font-involve font-medium leading-5 tracking-tight text-[#313131] hover:text-[#029cda] transition-colors">
									<svg className="w-[18px] h-[18px] text-[#b1b2c7]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
									</svg>
									Отзывы
								</Link>
								{/* Отдел продаж */}
								<Link href="/contacts" className="flex items-center gap-1.5 px-3 py-0.5 text-sm font-involve font-medium leading-5 tracking-tight text-[#313131] hover:text-[#029cda] transition-colors">
									<svg className="w-[18px] h-[18px] text-[#b1b2c7]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
									</svg>
									Отдел продаж
								</Link>
								{/* Контакты */}
								<Link href="/contacts" className="flex items-center gap-1.5 px-3 py-0.5 text-sm font-involve font-medium leading-5 tracking-tight text-[#313131] hover:text-[#029cda] transition-colors">
									<svg className="w-[18px] h-[18px] text-[#b1b2c7]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
										<path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
									</svg>
									Контакты
								</Link>
							</div>
						</div>

						{/* Main nav row */}
						<div className="flex items-center h-12 mt-5 mb-4 gap-[60px]">
							{/* Logo */}
							<Link href="/" onClick={closeMobile} className="shrink-0">
								<Image src="/img/logo_dark.svg" alt="Единая Среда" width={166} height={45} className="w-[148px] h-auto" priority />
							</Link>

							{/* Nav links */}
							<nav className="flex items-center flex-1">
								<Link href="/about" className={navCls('/about')}>О компании <ChevronDown open={false} /></Link>

								<Link href="/cases" className={navCls('/cases')}>Кейсы</Link>

								{/* Услуги dropdown */}
								<div ref={servicesRef} className="relative">
									<button
										type="button"
										onClick={() => setServicesOpen((v) => !v)}
										className={`flex items-center gap-0.5 pl-4 pr-1.5 py-3 text-sm font-involve font-medium leading-6 tracking-tight whitespace-nowrap transition-colors hover:text-[#029cda] ${isServicesActive || servicesOpen ? 'text-[#029cda]' : 'text-[#313131]'}`}
										aria-expanded={servicesOpen}
									>
										Услуги
										<ChevronDown open={servicesOpen} />
									</button>
									{servicesOpen && (
										<div className="absolute left-0 top-full mt-2 min-w-[320px] bg-white rounded-2xl shadow-xl border border-[#e4e7ec] p-4 z-50 animate-fade-in">
											<div className="flex flex-col gap-1">
												{SERVICE_LINKS.map((item) => (
													<Link
														key={item.href}
														href={item.href}
														onClick={() => setServicesOpen(false)}
														className="flex items-center gap-3 py-2.5 px-3 rounded-xl text-[15px] text-[#222] font-involve font-medium hover:text-[#029cda] hover:bg-[#f6f7f9] transition-colors"
													>
														<ThemedIcon src={item.icon} size={24} color="#202020" />
														{item.label}
													</Link>
												))}
											</div>
											<div className="mt-3 pt-3 border-t border-[#f0f0f0]">
												<Link
													href="/services"
													onClick={() => setServicesOpen(false)}
													className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[#f6f7f9] text-[15px] text-[#222] font-involve font-medium hover:text-[#029cda] hover:bg-[#eceef2] transition-colors"
												>
													<ThemedIcon src="/icons/arrow-right.svg" size={20} color="#212121" />
													Посмотреть все услуги
												</Link>
											</div>
										</div>
									)}
								</div>

								<Link href="/partnership" className={navCls('/partnership')}>Партнерство</Link>
							</nav>

							{/* Right actions */}
							<div className="flex items-center gap-2 shrink-0">
								<a
									href="https://edinayasreda.ru/"
									className="px-4 py-2.5 rounded-xl text-[#313131] text-base font-medium font-[Raleway] leading-6 hover:text-[#029cda] transition-colors"
								>
									Войти
								</a>
								<button
									type="button"
									onClick={() => openRegister()}
									className="px-5 py-2 bg-[#029cda] rounded-xl text-white text-base font-[Inter] leading-7 hover:bg-[#0287be] transition-colors whitespace-nowrap"
								>
									Попробовать
								</button>
							</div>
						</div>

					</div>

					{/* Divider */}
					<div className="border-b border-black/[0.06]" />
				</div>

				{/* ── Mobile ── */}
				<div className="lg:hidden bg-white border-b border-black/[0.06]">
					<div className="h-20 flex items-center justify-between gap-4 px-4">
						<Link href="/" onClick={closeMobile}>
							<Image src="/img/logo_dark.svg" alt="Единая Среда" width={127} height={35} className="w-[108px] h-auto" priority />
						</Link>
						<MobileMenuButton open={mobileOpen} onClick={toggleMobile} />
					</div>
				</div>
			</header>

			{/* Mobile menu */}
			<div className="lg:hidden" aria-hidden={!mobileOpen}>
				<button
					type="button"
					className={`fixed inset-x-0 top-20 bottom-0 z-[80] bg-black/40 transition-opacity duration-300 ${mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
					aria-label="Закрыть меню"
					tabIndex={mobileOpen ? 0 : -1}
					onClick={closeMobile}
				/>
				<div className={`fixed top-20 right-0 bottom-0 z-[90] w-full max-w-sm bg-white shadow-2xl overflow-y-auto transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : 'translate-x-full pointer-events-none'}`}>
					<nav className="flex flex-col gap-1 px-6 pb-6 pt-8">
						<Link href="/about" onClick={closeMobile} className={`px-3 py-3 rounded-xl text-[15px] font-involve font-medium hover:text-[#029cda] hover:bg-[#f6f7f9] transition-colors ${isActive('/about') ? 'text-[#029cda]' : 'text-[#222]'}`}>О компании</Link>
						<Link href="/cases" onClick={closeMobile} className={`px-3 py-3 rounded-xl text-[15px] font-involve font-medium hover:text-[#029cda] hover:bg-[#f6f7f9] transition-colors ${isActive('/cases') ? 'text-[#029cda]' : 'text-[#222]'}`}>Кейсы</Link>
						<p className="px-3 pt-2 pb-1 text-xs font-medium text-[#6d7885] uppercase tracking-wide">Услуги</p>
						{SERVICE_LINKS.map((item) => (
							<Link key={item.href} href={item.href} onClick={closeMobile} className="px-3 py-2.5 rounded-xl text-[15px] font-involve font-medium text-[#222] hover:text-[#029cda] hover:bg-[#f6f7f9] transition-colors">
								{item.label}
							</Link>
						))}
						<Link href="/services" onClick={closeMobile} className="px-3 py-2.5 rounded-xl text-[15px] font-involve font-medium text-[#029cda] hover:bg-[#f6f7f9] transition-colors">Все услуги</Link>
						<Link href="/blog" onClick={closeMobile} className={`px-3 py-3 rounded-xl text-[15px] font-involve font-medium hover:text-[#029cda] hover:bg-[#f6f7f9] transition-colors ${isActive('/blog') ? 'text-[#029cda]' : 'text-[#222]'}`}>Блог</Link>
						<Link href="/partnership" onClick={closeMobile} className={`px-3 py-3 rounded-xl text-[15px] font-involve font-medium hover:text-[#029cda] hover:bg-[#f6f7f9] transition-colors ${isActive('/partnership') ? 'text-[#029cda]' : 'text-[#222]'}`}>Партнерство</Link>
						<Link href="/contacts" onClick={closeMobile} className={`px-3 py-3 rounded-xl text-[15px] font-involve font-medium hover:text-[#029cda] hover:bg-[#f6f7f9] transition-colors ${isActive('/contacts') ? 'text-[#029cda]' : 'text-[#222]'}`}>Контакты</Link>
					</nav>
					<div className="px-6 pb-8 flex flex-col gap-3">
						<a href="https://edinayasreda.ru/" onClick={closeMobile} className="inline-flex items-center justify-center w-full py-3 rounded-xl bg-[#f6f7f9] text-[#222] text-[15px] font-involve font-medium hover:text-[#029cda] transition-colors">Войти</a>
						<button type="button" onClick={() => { openRegister(); closeMobile(); }} className="w-full py-3 rounded-xl bg-[#029cda] text-white text-base font-[Inter] hover:bg-[#0287be] transition-colors">Попробовать</button>
					</div>
				</div>
			</div>
		</>
	);
}
