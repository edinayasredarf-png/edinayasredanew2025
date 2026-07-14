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
  onContactClick?: () => void;
  singleOpen?: boolean;
  maxW?: string;
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

  useEffect(() => setIsOpen(open), [open]);

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
    <div className="rounded-[32px] bg-[#F6F7F9] overflow-hidden">
      <button
        id={triggerId}
        aria-controls={panelId}
        aria-expanded={isOpen}
        onClick={toggle}
        className="group w-full flex items-center justify-between gap-6 px-6 md:px-8 py-5 md:py-6 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#029cda]/40 rounded-[32px]"
      >
        <span className="text-[#050c26] text-lg md:text-xl font-medium font-[Raleway] leading-7 tracking-wide">
          {title}
        </span>

        {/* Шеврон #029cda — поворот при раскрытии */}
        <span
          aria-hidden
          className={`shrink-0 text-[#029cda] transition-transform duration-300 ease-out ${
            isOpen ? 'rotate-180' : ''
          }`}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>
      </button>

      <div
        id={panelId}
        role="region"
        aria-labelledby={triggerId}
        style={{ height: isOpen ? h : 0 }}
        className="overflow-hidden transition-[height] duration-300 ease-[cubic-bezier(.2,.8,.2,1)]"
      >
        <div
          ref={contentRef}
          className={`px-6 md:px-8 pb-5 md:pb-6 text-[#646b85] text-base md:text-[17px] leading-7 font-[Raleway]
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
  title = 'Подробный FAQ',
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
  const [openIndex, setOpenIndex] = useState<number>(0);

  const handleContact = () => {
    if (onContactClick) onContactClick();
    else openConsult?.();
  };

  // FAQPage-разметка (SEO) — только по вопросам с текстовым ответом
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items
      .map((it) => ({ q: getTitle(it), a: getContent(it) }))
      .filter((x) => typeof x.a === 'string' && x.a)
      .map((x) => ({
        '@type': 'Question',
        name: x.q,
        acceptedAnswer: { '@type': 'Answer', text: x.a as string },
      })),
  };

  return (
    <section className="bg-white w-full py-16 md:py-24 font-[Raleway]" aria-label="Подробный FAQ">
      {faqSchema.mainEntity.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
      <div className={maxW ?? 'rd-content-column'}>
        <div className="text-center mb-8 md:mb-10">
          <h2 className="font-involve text-[#050c26] text-[32px] md:text-[40px] font-medium leading-[1.2] md:leading-[44px] tracking-wide">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-3 text-[#646b85] text-base md:text-lg">{subtitle}</p>
          )}
        </div>

        {/* Аккордеон */}
        <div className="max-w-[720px] mx-auto w-full space-y-3 md:space-y-4">
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
                  singleOpen ? () => setOpenIndex((idx) => (idx === i ? -1 : i)) : undefined
                }
              >
                {c}
              </Row>
            );
          })}

          {/* Контактная карточка (опционально) */}
          {showContactCard && (
            <div className="mt-6 md:mt-8">
              <div className="rounded-[32px] bg-[#F6F7F9] p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h3 className="text-[#050c26] text-lg md:text-xl font-medium leading-7 font-[Raleway]">
                    {contactCardTitle}
                  </h3>
                  <p className="mt-1 text-[#646b85]">{contactCardText}</p>
                </div>
                <div className="w-full md:w-auto">
                  <button
                    type="button"
                    onClick={handleContact}
                    className="w-full md:w-auto px-6 h-[52px] bg-[#029cda] text-white rounded-2xl text-base font-medium hover:bg-[#0288bd] transition-colors focus:outline-none focus:ring-4 focus:ring-[#029cda]/30"
                  >
                    {contactButtonText}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
