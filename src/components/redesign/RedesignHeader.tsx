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

// Многослойная «парящая» тень плашки для тестового варианта шапки.
const TEST_PLAQUE_SHADOW =
	'0px 2px 6.8px -4.5px rgba(0,0,0,0.01), 0px 0.241451px 0.820932px -2.25px rgba(0,0,0,0.08), 0px 0px 0px 0.5px rgba(0,0,0,0.05), 0px 6px 6px -3.75px rgba(0,0,0,0.06), 0px 1.37312px 1.37312px -2.5px rgba(0,0,0,0.16), 0px 0.361312px 0.361312px -1.25px rgba(0,0,0,0.18), 2px 4px 8px 0px rgba(0,0,0,0.25), inset 0px 1px 1px 0px rgba(255,255,255,0.90)';

export function RedesignHeader({ variant = 'default' }: { variant?: 'default' | 'test' } = {}) {
	const isTest = variant === 'test';
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
					<div
						className={`flex items-center w-full h-[68px] px-4 relative ${
							isTest ? 'bg-white rounded-xl' : 'bg-[#F6F7F9] rounded-3xl'
						}`}
						style={isTest ? { boxShadow: TEST_PLAQUE_SHADOW } : undefined}
					>

						{/* Логотип — слева */}
						<Link href="/" onClick={closeMobile} className="shrink-0">
							<Image
								src="/img/es_logo_blue.svg"
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
							<div className="absolute left-0 right-0 top-[calc(100%+12px)] bg-[#F6F7F9] rounded-3xl p-4 z-50 animate-fade-in">
								<div className="flex flex-col gap-1">
									{SERVICE_LINKS.map((item) => (
										<Link
											key={item.href}
											href={item.href}
											onClick={() => setServicesOpen(false)}
											className="flex items-center gap-3 py-2.5 px-3 rounded-2xl text-[15px] text-[#222] font-involve font-medium hover:text-[#029cda] hover:bg-white transition-colors"
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
										className="flex items-center justify-center gap-2 w-full py-2.5 rounded-2xl bg-white text-[15px] text-[#222] font-involve font-medium hover:text-[#029cda] hover:bg-[#eceef2] transition-colors"
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
						{isTest ? (
							<div className="ml-auto flex items-center gap-2.5" style={{ fontFamily: 'var(--font-geist-sans)' }}>
								<a
									href="https://edinayasreda.ru/"
									className="inline-flex items-center gap-1 pl-4 py-2.5 rounded-xl text-[#212121] text-sm font-medium leading-6 hover:text-[#029cda] transition-colors whitespace-nowrap"
								>
									Войти
									<ThemedIcon src="/icons/icon4.svg" size={24} color="#212121" />
								</a>
								<button
									type="button"
									onClick={() => openRegister()}
									className="inline-flex h-10 items-center justify-center px-4 py-2 rounded-[10px] bg-gradient-to-r from-[#19dfd9] via-[#029eda] to-[#0c5fe1] text-white text-sm font-semibold leading-6 hover:brightness-105 transition-[filter] whitespace-nowrap"
								>
									Попробовать
								</button>
							</div>
						) : (
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
						)}

					</div>
				</div>

				{/* ── Mobile: full-width bar ── */}
				<div className="lg:hidden bg-white">
					<div className="h-20 flex items-center justify-between gap-4 px-4">
						<Link href="/" onClick={closeMobile}>
							<Image
								src="/img/es_logo_blue.svg"
								alt="Единая Среда"
								width={140}
								height={38}
								className="h-[38px] w-auto object-contain"
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
					className={`fixed top-20 right-0 bottom-0 z-[90] w-full max-w-sm bg-white overflow-y-auto transition-transform duration-300 ease-out ${
						mobileOpen ? 'translate-x-0' : 'translate-x-full pointer-events-none'
					}`}
				>
					<nav className="flex flex-col gap-1 px-6 pb-6 pt-12">
						<Link
							href="/about"
							onClick={closeMobile}
							className={`px-3 py-3 rounded-xl text-[15px] font-involve font-medium text-[#222] hover:text-[#029cda] hover:bg-white transition-colors ${
								isActive('/about') ? 'text-[#029cda]' : ''
							}`}
						>
							О компании
						</Link>
						<Link
							href="/cases"
							onClick={closeMobile}
							className={`px-3 py-3 rounded-xl text-[15px] font-involve font-medium text-[#222] hover:text-[#029cda] hover:bg-white transition-colors ${
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
								className="px-3 py-2.5 rounded-xl text-[15px] font-involve font-medium text-[#222] hover:text-[#029cda] hover:bg-white transition-colors"
							>
								{item.label}
							</Link>
						))}
						<Link
							href="/services"
							onClick={closeMobile}
							className="px-3 py-2.5 rounded-xl text-[15px] font-involve font-medium text-[#029cda] hover:bg-white transition-colors"
						>
							Все услуги
						</Link>
						{NAV_LINKS.filter((item) => item.href !== '/cases').map((item) => (
							<Link
								key={item.href}
								href={item.href}
								onClick={closeMobile}
								className={`px-3 py-3 rounded-xl text-[15px] font-involve font-medium text-[#222] hover:text-[#029cda] hover:bg-white transition-colors ${
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
							className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-white text-[#222] text-[15px] font-involve font-medium hover:text-[#029cda] transition-colors"
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
