import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

const Footer = () => {
  return (
    <footer className="border-t border-white bg-white font-[Raleway]">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">

        {/* Logo */}
        <div className="py-10">
          <Link href="/">
            <Image
              src="/img/logo_footer.svg"
              alt="Единая Среда"
              width={101}
              height={28}
              className="h-auto"
            />
          </Link>
        </div>

        {/* Main Content */}
        <div className="grid gap-10 pb-12 lg:grid-cols-[220px_1fr_260px]">

          {/* Left */}
          <div>
            <ul className="space-y-4 text-base text-black/50">
              <li>
                <Link href="/products">Все продукты</Link>
              </li>
              <li>
                <Link href="/partnership">Партнерство</Link>
              </li>
              <li>
                <Link href="/about">О компании</Link>
              </li>
            </ul>
          </div>

          {/* Center */}
          <div className="grid gap-10 sm:grid-cols-2">

            <ul className="space-y-4 text-base text-[#222]">
              <li>
                <Link href="/features">Возможности</Link>
              </li>
              <li>
                <Link href="/pricing">Все тарифы</Link>
              </li>
              <li>
                <Link href="/blog">Блог</Link>
              </li>
              <li>
                <Link href="/news">Новости</Link>
              </li>
            </ul>

            <ul className="space-y-4 text-base text-[#222]">
              <li>
                <Link href="/documents">Документы</Link>
              </li>
              <li>
                <Link href="/services">Услуги</Link>
              </li>
              <li>
                <Link href="/welcome-bonus">Попробовать</Link>
              </li>
            </ul>

          </div>

          {/* Support */}
          <div>
            <h3 className="mb-4 text-base text-[#222]">
              Центр поддержки
            </h3>

            <ul className="space-y-4 text-base text-[#222]">
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
          </div>

        </div>

        {/* Bottom */}
        <div className="border-t border-white py-8">

          <div className="flex flex-col gap-8 lg:flex-row lg:justify-between">

            {/* Copyright + Cookies */}
            <div className="max-w-[520px]">
              <p className="mb-4 text-sm text-black/50">
                © 2026 Единая Среда
              </p>

              <p className="text-xs leading-6 text-black/50">
                Используем cookies для корректной работы сайта,
                персонализации пользователей и других целей,
                предусмотренных{' '}
                <Link
                  href="/privacy"
                  className="underline"
                >
                  политикой обработки персональных данных
                </Link>.
                На сайте применяются{' '}
                <Link
                  href="/recommendations"
                  className="underline"
                >
                  рекомендательные технологии
                </Link>.
              </p>
            </div>

            {/* App */}
            <div className="flex items-center gap-4">
              <Image
                src="/img/qr-code.png"
                alt="QR"
                width={64}
                height={64}
                className="rounded-lg"
              />

              <div className="text-sm text-[#858585]">
                Скачать
                <br />
                приложение
              </div>
            </div>

            {/* Socials */}
            <div className="flex items-center gap-4">

              <a href="https://max.ru/id6150100608_biz" aria-label="Единая среда в MAX">
                <Image src="/icons/max.svg" alt="MAX" width={24} height={24} />
              </a>

              <a href="https://t.me/edinayasredarf" aria-label="Единая среда в Telegram">
                <Image src="/icons/tg.svg" alt="Telegram" width={24} height={24} />
              </a>

              <a href="https://vk.com/edinayasredarf" aria-label="Единая среда во ВКонтакте">
                <Image src="/icons/vk.svg" alt="ВКонтакте" width={24} height={24} />
              </a>

              <a href="https://vkvideo.ru/@edinayasreda" aria-label="Единая среда в VK Видео">
                <Image src="/icons/vkvideo.svg" alt="VK Видео" width={24} height={24} />
              </a>

              <a href="https://dzen.ru/edinayasreda" aria-label="Единая среда в Дзен">
                <Image src="/icons/dzen.svg" alt="Дзен" width={24} height={24} />
              </a>

              <a href="https://youtube.com/@edinayasreda" aria-label="Единая среда на YouTube">
                <Image src="/icons/youtube.svg" alt="YouTube" width={24} height={24} />
              </a>

            </div>

          </div>

        </div>

      </div>
    </footer>
  );
};

export default Footer;
