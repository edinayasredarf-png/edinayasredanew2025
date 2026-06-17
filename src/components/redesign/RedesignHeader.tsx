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
		`px-3 text-[15px] leading-6 text-black font-[Inter] hover:text-[#029cda] transition-colors whitespace-nowrap ${
			isActive(href) ? 'text-[#029cda]' : ''
		}`;

	return (
		<>
			<header
				className={`sticky top-0 w-full bg-[#F6F7F9] border-b border-white transition-shadow duration-300 ${
					mobileOpen ? 'z-[100]' : 'z-50'
				}`}
			>
				<div className="redesign-site-shell h-20 flex items-center justify-between gap-4">
					<Link href="/" className="shrink-0 relative z-[1]" onClick={closeMobile}>
						<Image
							src="/img/logo_dark.svg"
							alt="Единая Среда"
							width={127}
							height={35}
							className="w-[108px] sm:w-[127px] h-auto"
							priority
						/>
					</Link>

					{/* Навигация — центр на десктопе */}
					<nav className="hidden lg:flex items-center justify-center gap-3 flex-1 px-4">
						<Link href="/cases" className={navLinkClass('/cases')}>
							Кейсы
						</Link>

						<div ref={servicesRef} className="relative">
							<button
								type="button"
								onClick={() => setServicesOpen((v) => !v)}
								className={`inline-flex items-center gap-1 px-3 py-2.5 rounded-xl text-[15px] leading-6 text-black font-[Inter] hover:bg-[#f6f7f9] transition-colors ${
									isServicesActive || servicesOpen ? 'bg-[#f6f7f9] text-[#029cda]' : ''
								}`}
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
												className="flex items-center gap-3 py-2.5 px-3 rounded-xl text-[#202020] text-sm font-[Inter] hover:bg-[#f6f7f9] transition-colors"
											>
												<ThemedIcon src={item.icon} size={24} color="#202020" />
												{item.label}
											</Link>
										))}
									</div>
									<div className="mt-3 pt-3 border-t border-white">
										<Link
											href="/services"
											onClick={() => setServicesOpen(false)}
											className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[#f6f7f9] text-[#212121] text-sm font-medium hover:bg-[#eceef2] transition-colors"
										>
											<ThemedIcon src="/icons/arrow-right.svg" size={20} color="#212121" />
											Посмотреть все услуги
										</Link>
									</div>
								</div>
							)}
						</div>

						{NAV_LINKS.filter((item) => item.href !== '/cases').map((item) => (
							<Link key={item.href} href={item.href} className={navLinkClass(item.href)}>
								{item.label}
							</Link>
						))}
					</nav>

					{/* Действия */}
					<div className="hidden lg:flex items-center gap-2 shrink-0">
						<a
							href="https://edinayasreda.ru/"
							className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-black text-base font-medium font-[Raleway] hover:bg-[#f6f7f9] transition-colors"
						>
							<ThemedIcon src="/icons/icon4.svg" size={24} color="#000000" />
							Вход
						</a>
						<button
							type="button"
							onClick={() => openRegister()}
							className="inline-flex items-center justify-center px-5 py-2 rounded-lg border border-[#029cda] text-[#029cda] text-base leading-7 font-[Inter] hover:bg-[#029cda]/5 transition-colors whitespace-nowrap"
						>
							Попробовать
						</button>
					</div>

					<MobileMenuButton open={mobileOpen} onClick={toggleMobile} />
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
					className={`fixed top-20 right-0 bottom-0 z-[90] w-full max-w-sm bg-[#F6F7F9] shadow-2xl overflow-y-auto transition-transform duration-300 ease-out ${
						mobileOpen ? 'translate-x-0' : 'translate-x-full pointer-events-none'
					}`}
				>
					<nav className="flex flex-col gap-1 font-[Inter] px-6 pb-6 pt-12">
						<Link
							href="/cases"
							onClick={closeMobile}
							className={`px-3 py-3 rounded-xl text-[15px] text-black hover:bg-[#f6f7f9] transition-colors ${
								isActive('/cases') ? 'text-[#029cda] bg-[#f6f7f9]' : ''
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
								className="px-3 py-2.5 rounded-xl text-[15px] text-black hover:bg-[#f6f7f9] transition-colors"
							>
								{item.label}
							</Link>
						))}
						<Link
							href="/services"
							onClick={closeMobile}
							className="px-3 py-2.5 rounded-xl text-[15px] text-[#029cda] hover:bg-[#f6f7f9] transition-colors"
						>
							Все услуги
						</Link>
						{NAV_LINKS.filter((item) => item.href !== '/cases').map((item) => (
							<Link
								key={item.href}
								href={item.href}
								onClick={closeMobile}
								className={`px-3 py-3 rounded-xl text-[15px] text-black hover:bg-[#f6f7f9] transition-colors ${
									isActive(item.href) ? 'text-[#029cda] bg-[#f6f7f9]' : ''
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
							className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#f6f7f9] text-black font-medium font-[Raleway]"
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
