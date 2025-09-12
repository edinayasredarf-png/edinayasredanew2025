import React from 'react';
import Image from 'next/image';
import { useModal } from './ModalProvider';

interface SectionQuickStartProps {
  onTestClick?: () => void;
}

const cards = (onTestClick?: () => void) => [
  {
    title: 'Бесплатный тестовый период 30 дней',
    description: 'Получите полный доступ к платформе для оценки возможностей управления территориями',
    button: <button type="button" onClick={onTestClick} className="mt-8 inline-flex items-center justify-center self-start w-full md:w-auto px-6 py-3 bg-white text-black text-lg font-medium rounded-xl border border-transparent hover:ring-1 hover:ring-[#0077FF] hover:ring-offset-2 hover:ring-offset-[#F1F2F4] group-hover:outline-1 group-hover:outline-[#0077FF]">Начать бесплатно</button>,
    href: '#',
    image: '/img/30free.png',
    imageAlt: 'Тестовый период',
    imageClass: 'w-[90%] max-w-[320px] mx-auto object-contain',
    cardClass: 'min-h-[340px] md:min-h-[400px] lg:min-h-[420px] xl:min-h-[480px]'
  },
  {
    title: 'Обучающий курс по работе с платформой',
    description: 'Освойте все возможности системы управления территориями за короткое время',
    button: <span className="mt-8 inline-flex items-center justify-center self-start w-full md:w-auto gap-2 px-6 py-3 text-[#0077FF] text-lg font-medium rounded-xl border border-[#0077FF] hover:ring-1 hover:ring-[#0077FF] hover:ring-offset-2 hover:ring-offset-[#F1F2F4]"><Image src="/icons/play.svg" alt="" width={24} height={24} />Смотреть курс</span>,
    href: '/course',
    image: '/img/study.png',
    imageAlt: 'Обучающий курс',
    imageClass: 'w-[90%] max-w-[320px] mx-auto object-contain',
    cardClass: 'min-h-[340px] md:min-h-[400px] lg:min-h-[420px] xl:min-h-[480px]'
  },
  {
    title: 'Грант на цифровизацию территорий',
    description: 'Получите поддержку для внедрения системы управления территориями в вашей организации',
    button: <span className="group inline-flex items-center justify-center w-16 h-14 bg-white rounded-xl border border-transparent group-hover:border-[#0077FF] transition-all duration-300"><svg className="w-6 h-6 text-black transition-transform duration-300 group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14.43 5.92999L20.5 12L14.43 18.07" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"></path><path d="M3.5 12H20.33" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"></path></svg></span>,
    href: '#',
    image: '/img/grant.png',
    imageAlt: 'Грант на цифровизацию',
    imageClass: 'w-[90%] max-w-[320px] mx-auto object-contain',
    cardClass: 'min-h-[80px] md:min-h-[100px] lg:min-h-[120px]', textWide: true
  },
  {
    title: 'Специальные условия для муниципалитетов',
    description: 'Льготные тарифы и дополнительная поддержка для органов местного самоуправления',
    button: <span className="group inline-flex items-center justify-center w-16 h-14 bg-white rounded-xl border border-transparent group-hover:border-[#0077FF] transition-all duration-300"><svg className="w-6 h-6 text-black transition-transform duration-300 group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14.43 5.92999L20.5 12L14.43 18.07" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"></path><path d="M3.5 12H20.33" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"></path></svg></span>,
    href: '#',
    image: '/img/municipal.png',
    imageAlt: 'Условия для муниципалитетов',
    imageClass: 'w-[90%] max-w-[320px] mx-auto object-contain',
    cardClass: 'min-h-[80px] md:min-h-[100px] lg:min-h-[120px]', textWide: true
  },
];

const QuickStartCard = ({ title, description, button, href, image, imageAlt, imageClass, cardClass, textWide, onTestClick }: any) => {
  // Если это демо-доступ (href === '#'), то клик по всей карточке открывает модалку
  const isDemo = href === '#';
  const handleClick = (e: React.MouseEvent) => {
    if (isDemo && onTestClick) {
      e.preventDefault();
      onTestClick();
    }
  };
  return (
    <a
      href={href}
      className="group bg-white rounded-3xl p-2.5 flex h-full transition-all duration-300 outline outline-1 outline-transparent hover:outline-[#0077FF]"
      target={href?.startsWith('http') ? '_blank' : undefined}
      rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
      onClick={handleClick}
      style={isDemo ? { cursor: 'pointer' } : {}}
    >
                      <div className={`bg-[#F6F7F9] rounded-2xl p-8 flex flex-col md:flex-row h-full items-stretch relative overflow-hidden ${cardClass}`}>
        {/* Левая часть */}
        <div className={`w-full ${textWide ? 'md:w-full' : 'md:flex-[1.5]'} flex flex-col justify-center py-2 md:py-8 pr-2 md:pr-8 ${!textWide ? 'flex-1' : ''}`}>
          <h3 className={`${textWide ? 'text-xl md:text-2xl' : 'text-2xl md:text-3xl lg:text-4xl'} font-bold text-black leading-tight mb-2`}>{title}</h3>
          <p className={`${textWide ? 'text-sm md:text-base mb-2' : 'text-base md:text-lg lg:text-xl mb-6'} text-black`}>{description}</p>
          {!textWide
            ? React.cloneElement(button, { className: (button.props.className || '') + ' mt-auto' })
            : React.cloneElement(button, { className: (button.props.className || '') + ' mt-4' })}
        </div>
        {/* Правая часть: всегда показываем изображение справа */}
        <div className={`w-full ${textWide ? 'md:w-1/2' : 'md:w-auto md:flex-shrink-0'} flex justify-center items-end mt-8 md:mt-0 ${textWide ? 'relative' : ''}`}>
          <Image
            src={image}
            alt={imageAlt}
            width={textWide ? 160 : 180}
            height={textWide ? 160 : 120}
            className={
              textWide
                ? 'absolute right-0 bottom-0 max-w-[160px] md:max-w-[200px] opacity-95 pointer-events-none'
                : 'max-w-[180px] md:max-w-[220px] object-contain'
            }
          />
        </div>
      </div>
    </a>
  );
};

const SectionQuickStart: React.FC = () => {
  const { openDemo } = useModal();
  return (
    <section className="py-10 lg:py-20">
      <div className="max-w-[1480px] mx-auto px-5 md:px-8">
        <div className="text-center mb-10 lg:mb-12">
          <h2 className="text-center text-black text-2xl md:text-4xl lg:text-[50px] font-medium leading-[1.1] mb-12">
            Быстрый старт
          </h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {cards(openDemo).map((card, idx) => (
            <QuickStartCard key={idx} {...card} onTestClick={openDemo} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default SectionQuickStart; 