import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

export function RedesignFooter() {
	return (
		<footer className="bg-[#F6F7F9] font-involve">
			<div className="mx-auto max-w-[1200px] px-5 lg:px-10">
				{/* top border */}
				<div className="border-t border-white" />

				{/* logo */}
				<div className="pt-14 pb-20">
					<Link href="/">
						<Image
							src="/img/logo_footer.svg"
							alt="Единая Среда"
							width={150}
							height={42}
							className="h-auto"
						/>
					</Link>
				</div>

				{/* ===================== */}
				{/* DESKTOP */}
				{/* ===================== */}
				<div className="hidden lg:block">
					<div className="grid grid-cols-4 gap-x-24">
						{/* col 1 */}
						<div>
							<ul className="space-y-6 text-[18px] leading-[1.35]">
								<li>
									<Link
										href="/products"
										className="text-[#8C8C8C] transition-colors hover:text-black"
									>
										Все продукты
									</Link>
								</li>

								<li>
									<Link
										href="/partnership"
										className="text-[#8C8C8C] transition-colors hover:text-black"
									>
										Партнерство
									</Link>
								</li>

								<li>
									<Link
										href="/about"
										className="text-[#8C8C8C] transition-colors hover:text-black"
									>
										О компании
									</Link>
								</li>
							</ul>
						</div>

						{/* col 2 */}
						<div>
							<ul className="space-y-6 text-[18px] leading-[1.35] text-[#222]">
								<li>
									<Link href="/cases">
										Кейсы
									</Link>
								</li>

								<li>
									<Link href="/pricing">
										Все тарифы
									</Link>
								</li>

								<li>
									<Link href="/blog">
										Блог
									</Link>
								</li>

								<li>
									<Link href="/news">
										Новости
									</Link>
								</li>
							</ul>
						</div>

						{/* col 3 */}
						<div>
							<ul className="space-y-6 text-[18px] leading-[1.35] text-[#222]">
								<li>
									<Link href="/documents">
										Документация
									</Link>
								</li>

								<li>
									<Link href="/services">
										Услуги
									</Link>
								</li>

								<li>
									<Link href="/welcome-bonus">
										Попробовать
									</Link>
								</li>
							</ul>
						</div>

						{/* col 4 */}
						<div>
							<ul className="space-y-6 text-[18px] leading-[1.35] text-[#222]">
								<li>Центр поддержки</li>

								<li>
									<a
										href="tel:88005505612"
										className="transition-colors hover:text-black"
									>
										8 800 550-56-12
									</a>
								</li>

								<li>
									<Link href="/contacts">
										Заказать звонок
									</Link>
								</li>

								<li>
									<a
										href="https://t.me/es_faq"
										target="_blank"
										rel="noopener noreferrer"
									>
										Написать в чат
									</a>
								</li>

								<li>
									<Link href="/help">
										Помощь
									</Link>
								</li>
							</ul>
						</div>
					</div>

					{/* bottom */}
					<div className="grid grid-cols-[1fr_260px_260px] items-start gap-16 pt-28 pb-20">
						{/* legal */}
						<div>
							<p className="mb-8 text-[18px] text-[#777]">
								© 2026 Единая Среда
							</p>

							<p className="max-w-[720px] text-[15px] leading-8 text-[#8A8A8A]">
								Используем cookies для корректной работы сайта,
								персонализации пользователей и других целей,
								предусмотренных{' '}
								<Link
									href="/privacy"
									className="underline"
								>
									политикой обработки персональных данных
								</Link>
								
								</p>
						</div>

						{/* qr */}
						<div className="flex items-center gap-4">
							<Image
								src="/img/qr_apps.svg"
								alt="QR код приложения"
								width={90}
								height={90}
							/>

							<div className="text-[18px] leading-[1.3] text-[#8A8A8A]">
							<a href="https://www.rustore.ru/catalog/app/ru.edinayasreda" target="_blank" rel="noopener noreferrer">Скачать
								<br />
								приложение</a>	
							</div>
						</div>

						{/* socials */}
						<div className="flex items-center gap-3">
						<a
								href="https://max.ru/id6150100608_biz"
								target="_blank"
								rel="noopener noreferrer"
							>
								<Image
									src="/icons/max.svg"
									alt="VK"
									width={32}
									height={32}
								/>
							</a>
							
							
							<a
								href="https://vk.com/edinayasredarf"
								target="_blank"
								rel="noopener noreferrer"
							>
								<Image
									src="/icons/vk.svg"
									alt="VK"
									width={32}
									height={32}
								/>
							</a>

						

							<a
								href="https://dzen.ru/edinayasreda"
								target="_blank"
								rel="noopener noreferrer"
							>
								<Image
									src="/icons/dzen.svg"
									alt="Youtube"
									width={32}
									height={32}
								/>
							</a>

							<a
								href="https://t.me/edinayasredarf"
								target="_blank"
								rel="noopener noreferrer"
							>
								<Image
									src="/icons/tg.svg"
									alt="Telegram"
									width={32}
									height={32}
								/>
							</a>
						</div>
					</div>
				</div>

				{/* ===================== */}
				{/* MOBILE */}
				{/* ===================== */}
				<div className="pb-10 lg:hidden">
					<div className="space-y-4 text-[16px] text-[#222]">
						<Link href="/products" className="block">
							Все продукты
						</Link>

						<Link href="/partnership" className="block">
							Партнерство
						</Link>

						<Link href="/about" className="block">
							О компании
						</Link>

						<Link href="/cases" className="block">
							Кейсы
						</Link>

						<Link href="/pricing" className="block">
							Все тарифы
						</Link>

						<Link href="/blog" className="block">
							Блог
						</Link>

						<Link href="/news" className="block">
							Новости
						</Link>

						<Link href="/documents" className="block">
							Документы
						</Link>

						<Link href="/services" className="block">
							Услуги
						</Link>

						<Link href="/welcome-bonus" className="block">
							Попробовать
						</Link>
					</div>

					

						<ul className="space-y-4 text-[16px]">
							<li>
								<a href="tel:88005505612">
									8 800 550-56-12
								</a>
							</li>

							<li>
								<Link href="/contacts">
									Заказать звонок
								</Link>
							</li>

							<li>
								<a href="https://t.me/es_faq">
									Написать в чат
								</a>
							</li>

							<li>
								<Link href="/help">
									Помощь
								</Link>
							</li>
						</ul>
				

					<div className="mt-8 flex gap-3">
					<a
								href="https://max.ru/id6150100608_biz"
								target="_blank"
								rel="noopener noreferrer"
							>
								<Image
									src="/icons/max.svg"
									alt="VK"
									width={32}
									height={32}
								/>
							</a>
							
							
							<a
								href="https://vk.com/edinayasredarf"
								target="_blank"
								rel="noopener noreferrer"
							>
								<Image
									src="/icons/vk.svg"
									alt="VK"
									width={32}
									height={32}
								/>
							</a>

						

							<a
								href="https://dzen.ru/edinayasreda"
								target="_blank"
								rel="noopener noreferrer"
							>
								<Image
									src="/icons/dzen.svg"
									alt="Youtube"
									width={32}
									height={32}
								/>
							</a>

							<a
								href="https://t.me/edinayasredarf"
								target="_blank"
								rel="noopener noreferrer"
							>
								<Image
									src="/icons/tg.svg"
									alt="Telegram"
									width={32}
									height={32}
								/>
							</a>
					</div>

					<div className="mt-8">
						<p className="mb-4 text-sm text-[#777]">
							© 2026 Единая Среда
						</p>

						<p className="text-xs leading-6 text-[#8A8A8A]">
							Используем cookies для корректной работы сайта.
						</p>
					</div>
				</div>
			</div>
		</footer>
	);
}