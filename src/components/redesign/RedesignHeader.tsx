'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useModal } from '@/components/ModalProvider';
import ThemedIcon from '@/components/ThemedIcon';

const NAV_LINKS = [
	{ href: '/cases', label: 'Кейсы' },
	{ href: '/blog', label: 'Блог' },
	{ href: '/partnership', label: 'Партнерство' },
	{ href: '/contacts', label: 'Контакты' },
] as const;

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
			<span
				className={`absolute block h-0.5 w-[18px] bg-[#222] rounded-full transition-all duration-300 ease-out ${
					open ? 'top-1/2 -translate-y-1/2 rotate-45' : 'top-[12px]'
				}`}
				aria-hidden
			/>
			<span
				className={`absolute block h-0.5 w-[18px] bg-[#222] rounded-full transition-all duration-300 ease-out top-1/2 -translate-y-1/2 ${
					open ? 'opacity-0 scale-x-0' : 'opacity-100 scale-x-100'
				}`}
				aria-hidden
			/>
			<span
				className={`absolute block h-0.5 w-[18px] bg-[#222] rounded-full transition-all duration-300 ease-out ${
					open ? 'top-1/2 -translate-y-1/2 -rotate-45' : 'bottom-[12px]'
				}`}
				aria-hidden
			/>
		</button>
	);
}

export function RedesignHeader() {
	const pathname = usePathname();
	const { openRegister } = useModal();
	const [mobileOpen, setMobileOpen] = useState(false);
	const [servicesOpen, setServicesOpen] = useState(false);
	const servicesRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		setMobileOpen(false);
		setServicesOpen(false);
	}, [pathname]);

	useEffect(() => {
		document.body.style.overflow = mobileOpen ? 'hidden' : '';
		return () => {
			document.body.style.overflow = '';
		};
	}, [mobileOpen]);

	useEffect(() => {
		if (!servicesOpen) return;
		const onPointerDown = (e: MouseEvent) => {
			if (servicesRef.current && !servicesRef.current.contains(e.target as Node)) {
				setServicesOpen(false);
			}
		};
		document.addEventListener('mousedown', onPointerDown);
		return () => document.removeEventListener('mousedown', onPointerDown);
	}, [servicesOpen]);

	const isActive = (href: string) => pathname?.startsWith(href);
	const isServicesActive = pathname?.startsWith('/services');
	const toggleMobile = () => setMobileOpen((v) => !v);
	const closeMobile = () => setMobileOpen(false);

	const navLinkClass = (href: string) =>
		`px-3 text-[15px] leading-6 text-[#222] font-involve font-medium hover:text-[#029cda] transition-colors whitespace-nowrap ${
			isActive(href) ? 'text-[#029cda]' : ''
		}`;

	return (
		<>
			<header className={`sticky top-0 bg-transparent ${mobileOpen ? 'z-[100]' : 'z-50'}`}>
				{/* ── Desktop: единая плашка ── */}
				<div className="hidden lg:flex items-center w-full max-w-[1200px] mx-auto px-5 pt-3 pb-0 relative">
					<div className="flex items-center w-full h-[68px] bg-white rounded-3xl px-4 relative">

						{/* Логотип — слева */}
						<Link href="/" onClick={closeMobile} className="shrink-0">
							<Image
								src="/img/logo_dark.svg"
								alt="Единая Среда"
								width={148}
								height={40}
								className="w-[148px] h-auto"
								priority
							/>
						</Link>

						{/* Навигация — строго по центру */}
						<div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
						<div ref={servicesRef} style={{ position: 'relative' }} className="flex items-center">
						<nav className="flex items-center">
							<Link
								href="/about"
								className={`pl-4 pr-3 py-3 text-[15px] font-involve font-medium leading-6 tracking-tight whitespace-nowrap transition-colors hover:text-[#029cda] ${isActive('/about') ? 'text-[#029cda]' : 'text-[#313131]'}`}
							>
								О компании
							</Link>
							<Link
								href="/cases"
								className={`pl-4 pr-3 py-3 text-[15px] font-involve font-medium leading-6 tracking-tight whitespace-nowrap transition-colors hover:text-[#029cda] ${isActive('/cases') ? 'text-[#029cda]' : 'text-[#313131]'}`}
							>
								Кейсы
							</Link>
							<button
								type="button"
								onClick={() => setServicesOpen((v) => !v)}
								className={`flex items-center gap-0.5 pl-4 pr-3 py-3 text-[15px] font-involve font-medium leading-6 tracking-tight whitespace-nowrap transition-colors hover:text-[#029cda] ${isServicesActive || servicesOpen ? 'text-[#029cda]' : 'text-[#313131]'}`}
								aria-expanded={servicesOpen}
							>
								Услуги
								<ChevronDown open={servicesOpen} />
							</button>
							<Link
								href="/blog"
								className={`pl-4 pr-3 py-3 text-[15px] font-involve font-medium leading-6 tracking-tight whitespace-nowrap transition-colors hover:text-[#029cda] ${isActive('/blog') ? 'text-[#029cda]' : 'text-[#313131]'}`}
							>
								Блог
							</Link>
							<Link
								href="/contacts"
								className={`pl-4 pr-3 py-3 text-[15px] font-involve font-medium leading-6 tracking-tight whitespace-nowrap transition-colors hover:text-[#029cda] ${isActive('/contacts') ? 'text-[#029cda]' : 'text-[#313131]'}`}
							>
								Контакты
							</Link>
						</nav>

						{/* Дропдаун под навигацией */}
						{servicesOpen && (
							<div className="absolute left-0 right-0 top-[calc(100%+12px)] bg-white rounded-3xl p-4 z-50 animate-fade-in">
								<div className="flex flex-col gap-1">
									{SERVICE_LINKS.map((item) => (
										<Link
											key={item.href}
											href={item.href}
											onClick={() => setServicesOpen(false)}
											className="flex items-center gap-3 py-2.5 px-3 rounded-2xl text-[15px] text-[#222] font-involve font-medium hover:text-[#029cda] hover:bg-[#f6f7f9] transition-colors"
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
										className="flex items-center justify-center gap-2 w-full py-2.5 rounded-2xl bg-[#f6f7f9] text-[15px] text-[#222] font-involve font-medium hover:text-[#029cda] hover:bg-[#eceef2] transition-colors"
									>
										<ThemedIcon src="/icons/arrow-right.svg" size={20} color="#212121" />
										Посмотреть все услуги
									</Link>
								</div>
							</div>
						)}
						</div>
						</div>

						{/* Войти + Попробовать — справа */}
						<div className="ml-auto flex items-center gap-1">
							<a
								href="https://edinayasreda.ru/"
								className="inline-flex items-center gap-1.5 pl-4 pr-2 py-3 text-[15px] font-involve font-medium text-[#313131] hover:text-[#029cda] transition-colors whitespace-nowrap"
							>
								Войти
								<ThemedIcon src="/icons/icon4.svg" size={20} color="#313131" />
							</a>
							<button
								type="button"
								onClick={() => openRegister()}
								className="inline-flex items-center justify-center px-5 py-2.5 bg-[#e0f2fd] rounded-2xl text-[#029cda] text-[15px] font-semibold font-involve leading-6 hover:bg-[#c8eaf9] transition-colors whitespace-nowrap"
							>
								Попробовать
							</button>
						</div>

					</div>
				</div>

				{/* ── Mobile: full-width bar ── */}
				<div className="lg:hidden bg-[#F6F7F9]">
					<div className="h-20 flex items-center justify-between gap-4 px-4">
						<Link href="/" onClick={closeMobile}>
							<Image
								src="/img/logo_dark.svg"
								alt="Единая Среда"
								width={127}
								height={35}
								className="w-[108px] h-auto"
								priority
							/>
						</Link>
						<MobileMenuButton open={mobileOpen} onClick={toggleMobile} />
					</div>
				</div>
			</header>

			{/* Мобильное меню */}
			<div className="lg:hidden" aria-hidden={!mobileOpen}>
				<button
					type="button"
					className={`fixed inset-x-0 top-20 bottom-0 z-[80] bg-black/40 transition-opacity duration-300 ease-out ${
						mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
					}`}
					aria-label="Закрыть меню"
					tabIndex={mobileOpen ? 0 : -1}
					onClick={closeMobile}
				/>
				<div
					className={`fixed top-20 right-0 bottom-0 z-[90] w-full max-w-sm bg-[#F6F7F9] overflow-y-auto transition-transform duration-300 ease-out ${
						mobileOpen ? 'translate-x-0' : 'translate-x-full pointer-events-none'
					}`}
				>
					<nav className="flex flex-col gap-1 px-6 pb-6 pt-12">
						<Link
							href="/about"
							onClick={closeMobile}
							className={`px-3 py-3 rounded-xl text-[15px] font-involve font-medium text-[#222] hover:text-[#029cda] hover:bg-[#f6f7f9] transition-colors ${
								isActive('/about') ? 'text-[#029cda]' : ''
							}`}
						>
							О компании
						</Link>
						<Link
							href="/cases"
							onClick={closeMobile}
							className={`px-3 py-3 rounded-xl text-[15px] font-involve font-medium text-[#222] hover:text-[#029cda] hover:bg-[#f6f7f9] transition-colors ${
								isActive('/cases') ? 'text-[#029cda]' : ''
							}`}
						>
							Кейсы
						</Link>
						<p className="px-3 pt-2 pb-1 text-xs font-medium text-[#6d7885] uppercase tracking-wide">Услуги</p>
						{SERVICE_LINKS.map((item) => (
							<Link
								key={item.href}
								href={item.href}
								onClick={closeMobile}
								className="px-3 py-2.5 rounded-xl text-[15px] font-involve font-medium text-[#222] hover:text-[#029cda] hover:bg-[#f6f7f9] transition-colors"
							>
								{item.label}
							</Link>
						))}
						<Link
							href="/services"
							onClick={closeMobile}
							className="px-3 py-2.5 rounded-xl text-[15px] font-involve font-medium text-[#029cda] hover:bg-[#f6f7f9] transition-colors"
						>
							Все услуги
						</Link>
						{NAV_LINKS.filter((item) => item.href !== '/cases').map((item) => (
							<Link
								key={item.href}
								href={item.href}
								onClick={closeMobile}
								className={`px-3 py-3 rounded-xl text-[15px] font-involve font-medium text-[#222] hover:text-[#029cda] hover:bg-[#f6f7f9] transition-colors ${
									isActive(item.href) ? 'text-[#029cda]' : ''
								}`}
							>
								{item.label}
							</Link>
						))}
					</nav>
					<div className="px-6 pb-8 flex flex-col gap-3">
						<a
							href="https://edinayasreda.ru/"
							onClick={closeMobile}
							className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#f6f7f9] text-[#222] text-[15px] font-involve font-medium hover:text-[#029cda] transition-colors"
						>
							<ThemedIcon src="/icons/icon4.svg" size={20} color="#000000" />
							Вход
						</a>
						<button
							type="button"
							onClick={() => {
								openRegister();
								closeMobile();
							}}
							className="w-full py-3 rounded-lg border border-[#029cda] text-[#029cda] text-base font-[Inter] hover:bg-[#029cda]/5 transition-colors"
						>
							Попробовать
						</button>
					</div>
				</div>
			</div>
		</>
	);
}
