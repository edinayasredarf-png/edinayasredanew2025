'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Button from '@/components/Button';
import { useModal } from '@/components/ModalProvider';
import ThemedIcon from '@/components/ThemedIcon';

const NAV = [
	{ href: '/cases', label: 'Кейсы' },
	{ href: '/pricing', label: 'Цены' },
	{ href: '/blog', label: 'Блог' },
	{ href: '/contacts', label: 'Контакты' },
	{ href: '/partnership', label: 'Партнерство' },
] as const;

function MobileMenuButton({ open, onClick }: { open: boolean; onClick: () => void }) {
	return (
		<button
			type="button"
			className="lg:hidden relative shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-white/60 text-[#202020]"
			onClick={onClick}
			aria-expanded={open}
			aria-label={open ? 'Закрыть меню' : 'Открыть меню'}
		>
			<span
				className={`absolute block h-0.5 w-6 bg-current rounded-full transition-all duration-300 ease-out ${
					open ? 'top-1/2 -translate-y-1/2 rotate-45' : 'top-[11px]'
				}`}
				aria-hidden
			/>
			<span
				className={`absolute block h-0.5 w-6 bg-current rounded-full transition-all duration-300 ease-out top-1/2 -translate-y-1/2 ${
					open ? 'opacity-0 scale-x-0' : 'opacity-100 scale-x-100'
				}`}
				aria-hidden
			/>
			<span
				className={`absolute block h-0.5 w-6 bg-current rounded-full transition-all duration-300 ease-out ${
					open ? 'top-1/2 -translate-y-1/2 -rotate-45' : 'bottom-[11px]'
				}`}
				aria-hidden
			/>
		</button>
	);
}

export function RedesignHeader() {
	const pathname = usePathname();
	const { openRegister, openConsult } = useModal();
	const [mobileOpen, setMobileOpen] = useState(false);

	useEffect(() => {
		setMobileOpen(false);
	}, [pathname]);

	useEffect(() => {
		document.body.style.overflow = mobileOpen ? 'hidden' : '';
		return () => {
			document.body.style.overflow = '';
		};
	}, [mobileOpen]);

	const isActive = (href: string) => pathname?.startsWith(href);
	const toggleMobile = () => setMobileOpen((v) => !v);
	const closeMobile = () => setMobileOpen(false);

	return (
		<>
			<header
				className={`sticky top-0 w-full bg-[#f2f3f5]/95 backdrop-blur-md border-b border-[#F2F3F5] transition-shadow duration-300 ${
					mobileOpen ? 'z-[100] shadow-sm' : 'z-50'
				}`}
			>
				<div className="redesign-site-shell h-16 md:h-20 flex items-center justify-between gap-4">
					<Link href="/" className="shrink-0 relative z-[1]" onClick={closeMobile}>
						<Image
							src="/img/logo_dark.svg"
							alt="Единая Среда"
							width={166}
							height={45}
							className="w-[120px] md:w-[166px] h-auto"
							priority
						/>
					</Link>

					<nav className="hidden lg:flex items-center gap-9 text-[#202020] text-base font-involve">
						{NAV.map((item) => (
							<Link
								key={item.href}
								href={item.href}
								className={`hover:text-[#029cda] transition-colors ${isActive(item.href) ? 'text-[#029cda]' : ''}`}
							>
								{item.label}
							</Link>
						))}
					</nav>

					<div className="hidden lg:flex items-center gap-2 shrink-0">
						<button
							type="button"
							onClick={() => openConsult()}
							className="hidden xl:inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#00d3e6] text-[#212121] text-base font-involve hover:bg-[#00d3e6]/10 transition-colors"
						>
							<ThemedIcon src="/icons/icon3.svg" size={20} color="#212121" />
							<span className="hidden 2xl:inline">Получить консультацию</span>
							<span className="2xl:hidden">Консультация</span>
						</button>
						<Button
							onClick={() => openRegister()}
							variant="primary"
							className="!bg-[#202020] hover:!bg-[#333] !rounded-xl text-sm md:text-base !py-2.5 !px-4"
						>
							Оставить заявку
						</Button>
					</div>

					<MobileMenuButton open={mobileOpen} onClick={toggleMobile} />
				</div>
			</header>

			{/* Мобильное меню: под шапкой, логотип и крест остаются на месте */}
			<div className="lg:hidden" aria-hidden={!mobileOpen}>
				<button
					type="button"
					className={`fixed inset-x-0 top-16 md:top-20 bottom-0 z-[80] bg-black/40 transition-opacity duration-300 ease-out ${
						mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
					}`}
					aria-label="Закрыть меню"
					tabIndex={mobileOpen ? 0 : -1}
					onClick={closeMobile}
				/>
				<div
					className={`fixed top-16 md:top-20 right-0 bottom-0 z-[90] w-full max-w-sm bg-[#f2f3f5] shadow-2xl overflow-y-auto transition-transform duration-300 ease-out ${
						mobileOpen ? 'translate-x-0' : 'translate-x-full pointer-events-none'
					}`}
				>
					<nav className="flex flex-col gap-1 font-involve px-6 pb-6 pt-12">
						{NAV.map((item, i) => (
							<Link
								key={item.href}
								href={item.href}
								className={`px-3 py-3 rounded-xl text-[#202020] hover:bg-white/80 transition-all duration-300 ${
									mobileOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
								} ${isActive(item.href) ? 'text-[#029cda] bg-white/60' : ''}`}
								style={{ transitionDelay: mobileOpen ? `${60 + i * 40}ms` : '0ms' }}
								onClick={closeMobile}
							>
								{item.label}
							</Link>
						))}
					</nav>
					<div
						className={`px-6 pb-8 flex flex-col gap-3 transition-all duration-300 ease-out ${
							mobileOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
						}`}
						style={{ transitionDelay: mobileOpen ? '280ms' : '0ms' }}
					>
						<button
							type="button"
							onClick={() => {
								openConsult();
								closeMobile();
							}}
							className="w-full py-3 rounded-xl border border-[#00d3e6] text-[#202020] font-medium"
						>
							Получить консультацию
						</button>
						<Button
							onClick={() => {
								openRegister();
								closeMobile();
							}}
							variant="primary"
							className="w-full !bg-[#202020]"
						>
							Оставить заявку
						</Button>
					</div>
				</div>
			</div>
		</>
	);
}
