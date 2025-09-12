import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

const Footer = () => {
  return (
    <footer className="bg-white rounded-2xl mt-8 w-full">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Footer Top */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 pb-8">
          <Link href="/" title="Единая Среда">
            <Image src="/img/logo_footer.svg" alt="ES Cloud Logo" width={208} height={60} className="w-[208px] h-auto" />
          </Link>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Link href="welcome-bonus" className="flex items-center gap-2 px-6 py-3.5 text-black text-xl font-medium rounded-xl hover:bg-gray-100 transition-colors">
              <Image src="/icons/icon6.svg" alt="" width={24} height={24} /> Приветственный бонус
            </Link>
            <a
              href="https://t.me/es_faq"
              className="flex items-center gap-2 px-6 py-3.5 text-black text-xl font-medium rounded-xl bg-[#F6F7F9] hover:bg-gray-200 transition-colors"
            >
              <Image src="/icons/icon5.svg" alt="" width={24} height={24} /> Чат пользователей
            </a>
          </div>
        </div>

        <div className="border-t border-grey-84"></div>

        {/* Footer Navigation Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 md:gap-8 py-8">
          {/* Products */}
          <div>
            <h3 className="text-base md:text-xl lg:text-2xl font-medium text-black mb-3 md:mb-6 break-words leading-tight">
              Продукты
            </h3>
            <ul className="space-y-3">
              <li><a href="https://edinayasreda.ru/" className="text-base text-black hover:text-azure">Единая Среда</a></li>
              <li><a href="https://myroots.pro/" className="text-base text-black hover:text-azure">My Roots</a></li>
              <li><a href="https://oblastrazvitiya.ru/" className="text-base text-black hover:text-azure">Область Развития</a></li>
            </ul>
          </div>

          {/* Platform */}
          <div>
            <h3 className="text-base md:text-xl lg:text-2xl font-medium text-black mb-3 md:mb-6 break-words leading-tight">Платформа</h3>
            <ul className="space-y-3">
              <li><a href="https://edinayasreda.ru/" className="text-base text-black hover:text-azure">Войти в ЛК</a></li>
              <li><Link href="#" className="text-base text-black hover:text-azure">Тех. характеристики</Link></li>
              <li><a href="https://www.rustore.ru/catalog/app/ru.edinayasreda" className="text-base text-black hover:text-azure">Мобильное приложение</a></li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-base md:text-xl lg:text-2xl font-medium text-black mb-3 md:mb-6 break-words leading-tight">Услуги</h3>
            <ul className="space-y-3">
              {/* ✅ Добавлено: страница со всеми услугами */}
              <li><Link href="/services/inventory-burials" className="text-base text-black hover:text-azure">Инвентаризация мест захоронений</Link></li>
              <li><Link href="/services/green-inventory" className="text-base text-black hover:text-azure">Инвентаризация зеленых насаждений</Link></li>
              <li><Link href="/services/forest-management" className="text-base text-black hover:text-azure">Лесоустройство</Link></li>
							<li><Link href="/services" className="text-base text-black hover:text-azure">Посмотреть все услуги</Link></li>

            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-base md:text-xl lg:text-2xl font-medium text-black mb-3 md:mb-6 break-words leading-tight">Компания</h3>
            <ul className="space-y-3">
              <li><Link href="/about" className="text-base text-black hover:text-azure">О компании</Link></li>
              <li><Link href="/cases" className="text-base text-black hover:text-azure">Кейсы</Link></li>
              <li><Link href="/contacts" className="text-base text-black hover:text-azure">Контакты</Link></li>
              <li><Link href="/career" className="text-base text-black hover:text-azure">Карьера</Link></li>
              <li><Link href="/partnership" className="text-base text-black hover:text-azure">Партнерство</Link></li>
            </ul>
          </div>

          {/* Conditions */}
          <div>
            <h3 className="text-base md:text-xl lg:text-2xl font-medium text-black mb-3 md:mb-6 break-words leading-tight">Условия</h3>
            <ul className="space-y-3">
              <li><Link href="/pricing" className="text-base text-black hover:text-azure">Тарифы и цены</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-base md:text-xl lg:text-2xl font-medium text-black mb-3 md:mb-6 break-words leading-tight">Техподдержка</h3>
            <ul className="space-y-4">
              <li>
                <Link href="/documents" className="flex items-center gap-2 text-base text-black hover:text-azure">
                  <Image src="/icons/document.svg" alt="" width={20} height={20} /> Документация
                </Link>
              </li>
              <li>
                <Link href="/course" className="flex items-center gap-2 text-base text-black hover:text-azure">
                  <Image src="/icons/play.svg" alt="" width={24} height={24} /> Видекурс
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-grey-84"></div>

        {/* Footer Bottom */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-8 text-black text-lg">
          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <span>© Единая Среда, 2025. Все права защищены.</span>
          </div>
          <div className="flex-1 text-center">
            <Link href="/documents" className="hover:text-azure">Политика конфиденциальности</Link>
          </div>
          <div className="flex items-center gap-6">
            <a href="https://max.ru/u/f9LHodD0cOJZILKNb4kxSrf65ZDrDC8VHBCUT7OOQCkDcv8MzTDP_8tCiWU" title="Max">
              <Image src="/icons/max.svg" alt="" width={24} height={24} />
            </a>
            <a href="https://t.me/edinayasredarf" title="Telegram">
              <Image src="/icons/tg.svg" alt="" width={24} height={24} />
            </a>
            <a href="https://vk.com/edinayasredarf" title="VK">
              <Image src="/icons/vk.svg" alt="" width={24} height={24} />
            </a>
            <a href="https://vkvideo.ru/@edinayasreda" title="VK Video">
              <Image src="/icons/vkvideo.svg" alt="" width={24} height={24} />
            </a>
            <a href="https://dzen.ru/edinayasreda" title="Dzen">
              <Image src="/icons/dzen.svg" alt="" width={24} height={24} />
            </a>
            <a href="https://www.youtube.com/@edinayasreda" title="Youtube">
              <Image src="/icons/youtube.svg" alt="" width={24} height={24} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
