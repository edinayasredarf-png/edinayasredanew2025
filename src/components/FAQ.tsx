'use client';

import React, { useEffect, useId, useRef, useState } from 'react';
import { useModal } from './ModalProvider';

/* Тип данных: поддерживает и {question, answer}, и {title, content} */
export type FaqItem =
  | { question: string; answer: React.ReactNode }
  | { title: string; content: React.ReactNode };

type FAQProps = {
  items: FaqItem[];
  title?: string;
  subtitle?: string;
  showContactCard?: boolean;
  contactCardTitle?: string;
  contactCardText?: string;
  contactButtonText?: string;
  onContactClick?: () => void; // опциональный обработчик кнопки
  singleOpen?: boolean;        // если true — аккордеон в режиме «только один открыт»
  maxW?: string;               // кастомная ширина контейнера
};

function getTitle(i: FaqItem) {
  // @ts-ignore
  return i.title ?? i.question ?? '';
}
function getContent(i: FaqItem) {
  // @ts-ignore
  return i.content ?? i.answer ?? null;
}

const Row: React.FC<{
  title: string;
  children: React.ReactNode;
  open?: boolean;
  onToggle?: () => void;
}> = ({ title, children, open = false, onToggle }) => {
  const [isOpen, setIsOpen] = useState(open);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [h, setH] = useState(0);
  const triggerId = useId();
  const panelId = useId();

  // синхронизация внешнего состояния (на случай singleOpen)
  useEffect(() => setIsOpen(open), [open]);

  // измерение контента и плавная высота
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const measure = () => setH(el.scrollHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const toggle = () => {
    if (onToggle) onToggle();
    else setIsOpen((v) => !v);
  };

  return (
    <div className="rounded-2xl rd-block font-medium">
      <button
        id={triggerId}
        aria-controls={panelId}
        aria-expanded={isOpen}
        onClick={toggle}
        className="group w-full flex items-center justify-between gap-4 p-5 md:p-6 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#029cda]/40 rounded-2xl"
      >
        <span className="text-[#313131] text-[18px] md:text-[20px] font-medium font-raleway leading-7 lining-nums">
          {title}
        </span>

        {/* Плюс/минус — плавная анимация, фиксированный размер, не сжимается */}
        <span
          aria-hidden
          className="relative inline-flex h-7 w-7 min-h-[28px] min-w-[28px] shrink-0 items-center justify-center rounded-lg bg-[#F6F7F9]"
        >
          {/* горизонтальная — всегда */}
          <span className="block absolute h-0.5 w-4 bg-[#313131] rounded-full transition-transform duration-300 ease-[cubic-bezier(.2,.8,.2,1)]" />
          {/* вертикальная — схлопывается */}
          <span
            className={`block absolute h-4 w-0.5 bg-[#313131] rounded-full transition-transform duration-300 ease-[cubic-bezier(.2,.8,.2,1)] ${
              isOpen ? 'scale-y-0' : 'scale-y-100'
            }`}
          />
        </span>
      </button>

      {/* Контейнер с анимацией высоты */}
      <div
        id={panelId}
        role="region"
        aria-labelledby={triggerId}
        style={{ height: isOpen ? h : 0 }}
        className="overflow-hidden transition-[height] duration-350 ease-[cubic-bezier(.2,.8,.2,1)]"
      >
        <div
          ref={contentRef}
          className={`px-5 md:px-6 pb-5 md:pb-6 text-[#4B5563] text-[16px] md:text-[17px] leading-7 font-raleway
                      transition-[opacity,transform] duration-300 ease-[cubic-bezier(.2,.8,.2,1)]
                      ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1'}`}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

const FAQ: React.FC<FAQProps> = ({
  items,
  title = 'Часто задаваемые вопросы',
  subtitle,
  showContactCard = false,
  contactCardTitle = 'Не нашли ответ на свой вопрос?',
  contactCardText = 'Задайте его нам — и мы оперативно ответим.',
  contactButtonText = 'Задать вопрос',
  onContactClick,
  singleOpen = false,
  maxW,
}) => {
  const { openConsult } = useModal();
  const [openIndex, setOpenIndex] = useState<number>(0); // по умолчанию открыт первый

  const handleContact = () => {
    if (onContactClick) {
      onContactClick();
    } else {
      openConsult?.();
    }
  };

  return (
    <section className="bg-white w-full py-10 md:py-14 lg:py-16 font-raleway">
      <div className={maxW ?? 'rd-content-column'}>
        <div className="text-center mb-8 md:mb-10">
          <h2 className="font-involve text-[#313131] text-[clamp(1.75rem,4vw,2.5rem)] leading-[1.2] lining-nums">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-2 text-[#7C8A9A] text-[16px] md:text-[18px]">
              {subtitle}
            </p>
          )}
        </div>

        {/* Аккордеон */}
        <div className="space-y-3 md:space-y-4">
          {items.map((raw, i) => {
            const t = getTitle(raw);
            const c = getContent(raw);
            const controlledOpen = singleOpen ? openIndex === i : i === 0 ? true : undefined;

            return (
              <Row
                key={i}
                title={t}
                open={controlledOpen}
                onToggle={
                  singleOpen
                    ? () => setOpenIndex((idx) => (idx === i ? -1 : i))
                    : undefined
                }
              >
                {c}
              </Row>
            );
          })}
        </div>

        {/* Контактная карточка (опционально) */}
        {showContactCard && (
          <div className="mt-6 md:mt-8">
            <div className="rounded-2xl rd-block p-5 md:p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h3 className="text-[#313131] text-[18px] md:text-[20px] font-medium leading-7">
                  {contactCardTitle}
                </h3>
                <p className="mt-1 text-[#7C8A9A]">{contactCardText}</p>
              </div>
              <div className="w-full md:w-auto">
                <button
                  type="button"
                  onClick={handleContact}
                  className="w-full md:w-auto px-5 py-3.5 bg-[#029cda] text-white rounded-xl text-base md:text-lg font-medium hover:bg-[#0066DD] focus:outline-none focus:ring-4 focus:ring-[#029cda]/30"
                >
                  {contactButtonText}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default FAQ;
