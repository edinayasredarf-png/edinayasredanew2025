import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

export function RedesignFooter() {
	return (
		<footer className="w-full bg-black text-white mt-auto overflow-hidden font-[Inter]">
			<div className="redesign-site-shell py-8 md:py-10">
				<div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 pb-8 border-b border-[#202020]">
					<Link href="/">
						<Image src="/img/logo_footer.svg" alt="Единая Среда" width={208} height={51} className="w-40 md:w-52 h-auto" />
					</Link>
					<span className="text-lg uppercase text-white/80 self-start md:self-center">ru</span>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 py-10">
					<div className="sm:col-span-2 lg:col-span-1">
						<h3 className="text-xl mb-4">О компании</h3>
						<p className="text-[17px] leading-[25px] text-white/90 max-w-md">
							Единая среда — платформа для эффективного учёта, управления и мониторинга территорий и объектов
							в организациях любого типа и масштаба. Также наша команда выполняет услуги под ключ
							инвентаризации и оцифровки.
						</p>
						<Link
							href="https://edinayasreda.ru/"
							className="inline-flex mt-6 px-4 py-3 bg-[#F2F3F5] text-[#202020] rounded-lg text-base hover:bg-white transition-colors"
						>
							Регистрация
						</Link>
					</div>

					<div>
						<h3 className="text-xl mb-4">Обучение</h3>
						<ul className="space-y-3 text-base">
							<li>
								<Link href="/documents" className="hover:text-[#029cda] transition-colors">
									Документация
								</Link>
							</li>
							<li>
								<Link href="/course" className="hover:text-[#029cda] transition-colors">
									Видеокурсы
								</Link>
							</li>
						</ul>
					</div>

					<div>
						<h3 className="text-xl mb-4">Клиентам</h3>
						<ul className="space-y-3 text-base">
							<li>
								<a href="https://edinayasreda.ru/" className="hover:text-[#029cda] transition-colors">
									Войти в ЛК
								</a>
							</li>
							<li>
								<Link href="/cases" className="hover:text-[#029cda] transition-colors">
									Кейсы
								</Link>
							</li>
							<li>
								<a
									href="https://www.rustore.ru/catalog/app/ru.edinayasreda"
									className="hover:text-[#029cda] transition-colors"
								>
									Мобильное приложение
								</a>
							</li>
							<li>
								<Link href="/documents" className="hover:text-[#029cda] transition-colors">
									Документы
								</Link>
							</li>
						</ul>
					</div>

					<div>
						<h3 className="text-xl mb-4">Услуги</h3>
						<ul className="space-y-3 text-base">
							<li>
								<Link href="/services/imz" className="hover:text-[#029cda] transition-colors">
									Инвентаризация мест захоронений
								</Link>
							</li>
							<li>
								<Link href="/services/izn" className="hover:text-[#029cda] transition-colors">
									Инвентаризация зеленых насаждений
								</Link>
							</li>
							<li>
								<Link href="/services/les" className="hover:text-[#029cda] transition-colors">
									Лесоустройство
								</Link>
							</li>
						</ul>
					</div>

					<div>
						<h3 className="text-xl mb-4">О компании</h3>
						<ul className="space-y-3 text-base">
							<li>
								<Link href="/contacts" className="hover:text-[#029cda] transition-colors">
									Контакты
								</Link>
							</li>
							<li>
								<Link href="/partnership" className="hover:text-[#029cda] transition-colors">
									Партнерство
								</Link>
							</li>
						</ul>
					</div>
				</div>

				<div className="border-t border-[#202020] pt-8 flex flex-col lg:flex-row lg:items-center gap-6">
					<Link
						href="/welcome-bonus"
						className="inline-flex items-center gap-3 text-white text-lg font-medium font-[Raleway] hover:opacity-80"
					>
						<Image src="/icons/icon6.svg" alt="" width={24} height={24} />
						Приветственный бонус
					</Link>
					<div className="flex items-center gap-4 lg:ml-auto">
						<a href="https://t.me/edinayasredarf" title="Telegram">
							<Image src="/icons/tg.svg" alt="Telegram" width={22} height={22} className="invert" />
						</a>
						<a href="https://vk.com/edinayasredarf" title="VK">
							<Image src="/icons/vk.svg" alt="VK" width={22} height={22} className="invert" />
						</a>
						<a href="https://dzen.ru/edinayasreda" title="Дзен">
							<Image src="/icons/dzen.svg" alt="Дзен" width={22} height={22} className="invert" />
						</a>
						<a href="https://www.youtube.com/@edinayasreda" title="YouTube">
							<Image src="/icons/youtube.svg" alt="YouTube" width={22} height={22} className="invert" />
						</a>
					</div>
				</div>

				<div className="mt-8 pt-6 border-t border-[#202020] flex flex-col md:flex-row md:flex-wrap gap-4 text-[#7c8a9a] text-[15px]">
					<span>© Единая Среда, {new Date().getFullYear()}. Все права защищены.</span>
					<Link href="/documents" className="hover:text-white transition-colors md:mx-auto">
						Политика конфиденциальности
					</Link>
					<span className="md:ml-auto">Ростов-на-Дону, Комарова 28/2</span>
				</div>
			</div>
		</footer>
	);
}
