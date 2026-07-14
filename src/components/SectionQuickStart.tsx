'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useModal } from './ModalProvider';

/** Унифицированная кнопка */
const ButtonLike: React.FC<
  ({ as: 'button'; onClick: () => void } | { as: 'link'; href: string }) & {
    label: string;
    className?: string;
  }
> = (props) => {
  const base =
    'inline-flex items-center justify-center h-[54px] rounded-xl bg-white text-black text-[17px] leading-7 font-medium font-[Raleway] ' +
    'hover:ring-1 hover:ring-[#029cda] transition-colors ' +
    'w-full md:w-[201.5px]'; // на мобильных — 100% ширины

  if (props.as === 'button') {
    return (
      <button type="button" onClick={props.onClick} className={`${base} ${props.className ?? ''}`}>
        {props.label}
      </button>
    );
  }
  return (
    <Link href={props.href} className={`${base} ${props.className ?? ''}`}>
      {props.label}
    </Link>
  );
};

type CardProps = {
  title: string;
  description: string;
  buttonLabel: string;
  image: string;
  imageAlt: string;
  onClick?: () => void;
  href?: string;
};

const QuickStartCard: React.FC<CardProps> = ({
  title,
  description,
  buttonLabel,
  image,
  imageAlt,
  onClick,
  href,
}) => {
  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) =>
    href ? (
      <Link
        href={href}
        className="group block bg-[#F6F7F9] rounded-2xl outline outline-1 outline-[#fff] hover:outline-[#029cda] transition-colors overflow-hidden"
      >
        {/* как в карточках с серым блоком: зазор между белым и серым = p-2 (8px) */}
        <div className="p-2 h-full flex flex-col">{children}</div>
      </Link>
    ) : (
      <div
        onClick={onClick}
        className={`group bg-[#F6F7F9] rounded-2xl outline outline-1 outline-[#fff] hover:outline-[#029cda] transition-colors overflow-hidden ${
          onClick ? 'cursor-pointer' : ''
        }`}
      >
        {/* как в карточках с серым блоком: зазор между белым и серым = p-2 (8px) */}
        <div className="p-2 h-full flex flex-col">{children}</div>
      </div>
    );

  return (
    <Wrapper>
      <div className="rd-block rounded-2xl w-full h-full overflow-hidden p-8 min-h-[180px] md:min-h-[260px] md:grid md:grid-cols-[3fr_2fr] md:gap-6">
        {/* Левая колонка: заголовок + описание + кнопка (≈ 60%) */}
        <div className="min-h-0 min-w-0 flex flex-col">
          <h3 className="text-[#313131] text-[26px] md:text-[34.7px] font-medium font-[Raleway] leading-[1.25] md:leading-[45px] max-w-[520px] mb-3">
            {title}
          </h3>
          <p className="text-[#7c8a9a] text-[16.5px] md:text-[18.9px] font-medium font-[Raleway] leading-7 max-w-[560px]">
            {description}
          </p>

          {/* Мобильное изображение — ниже текста, над кнопкой */}
          <div className="md:hidden flex justify-center mt-6">
            <Image
              src={image}
              alt={imageAlt}
              width={180}
              height={180}
              className="object-contain pointer-events-none select-none"
            />
          </div>

          {/* Кнопка — прижимается к низу текста на десктопе */}
          <div className="mt-auto pt-6 md:pt-8">
            {href ? (
              <span className="inline-flex items-center justify-center h-[54px] rounded-xl bg-white text-black text-[17px] leading-7 font-medium font-[Raleway] hover:ring-1 hover:ring-[#029cda] transition-colors w-full md:w-[201.5px]">
                {buttonLabel}
              </span>
            ) : (
              <ButtonLike as="button" onClick={onClick!} label={buttonLabel} />
            )}
          </div>
        </div>

        {/* Правая колонка: изображение (≈ 40% на десктопе) */}
        <div className="hidden md:flex min-w-0 justify-end items-center">
          <div className="relative w-full h-full max-w-[320px] max-h-[320px]">
            <Image
              src={image}
              alt={imageAlt}
              fill
              className="object-contain pointer-events-none select-none"
            />
          </div>
        </div>
      </div>
    </Wrapper>
  );
};

const SectionQuickStart: React.FC = () => {
  const { openDemo } = useModal();

  const cards: CardProps[] = [
    {
      title: 'Бесплатный тестовый период',
      description:
        'Получите полный доступ к платформе для оценки возможностей управления территориями',
      buttonLabel: 'Начать бесплатно',
      image: '/img/free-test.png',
      imageAlt: 'Тестовый период',
      onClick: openDemo,
    },
    {
      title: 'Обучающий курс по работе с платформой',
      description:
        'Освойте все возможности системы управления территориями за короткое время с помощью видеокурса',
      buttonLabel: 'Смотреть курс',
      image: '/img/study1.png',
      imageAlt: 'Обучающий курс',
      href: '/course',
    },
  ];

  return (
    <section className="bg-white w-full py-10 md:py-14 lg:py-16 font-[Raleway]">
      <div className="rd-content-column">
        <h2 className="text-center font-involve text-[#313131] text-[clamp(1.75rem,4vw,2.5rem)] leading-[1.2] mb-10 md:mb-12">
          Быстрый старт
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-2.5">
          {cards.map((card, idx) => (
            <QuickStartCard key={idx} {...card} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default SectionQuickStart;