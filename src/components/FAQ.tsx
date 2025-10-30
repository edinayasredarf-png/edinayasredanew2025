// components/FAQ.tsx

'use client'

import React, { useState } from 'react';
import { useModal } from '@/components/ModalProvider';

interface FAQItem {
  question: string;
  answer: string | React.ReactNode;
}

interface FAQProps {
  title?: string;
  subtitle?: string;
  items: FAQItem[];
  showContactCard?: boolean;
  contactCardTitle?: string;
  contactCardText?: string;
  contactButtonText?: string;
}

export default function FAQ({
  title = "Часто задаваемые вопросы",
  subtitle = "О платформе Единая среда (единаясреда.рф)",
  items,
  showContactCard = true,
  contactCardTitle = "Не нашли ответ на свой вопрос?",
  contactCardText = "Задайте его нам — и мы оперативно ответим.",
  contactButtonText = "Задать вопрос"
}: FAQProps) {
  const { openConsult } = useModal();
  const [openFaq, setOpenFaq] = useState<number>(0);

  // Стили
  const headingBase = "font-medium leading-[1.15]";
  const headingColor = "text-[#101828]";

  // JSON-LD для поисковиков
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": items.map(item => ({
      "@type": "Question",
      "name": item.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": typeof item.answer === 'string' ? item.answer : item.question
      }
    }))
  };

  return (
    <section className="py-16 md:py-24" itemScope itemType="https://schema.org/FAQPage">
      {/* JSON-LD разметка */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="max-w-[1480px] mx-auto px-5 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-8 lg:gap-12 items-start">
          {/* Левая колонка: FAQ список */}
          <div className="relative">
            {/* Заголовок */}
            <div className="mb-8">
              <h2 className={`text-[clamp(26px,4vw,48px)] ${headingBase} ${headingColor} mb-3`}>
                {title}
              </h2>
              {subtitle && (
                <p className="text-lg text-[#667085]">
                  {subtitle}
                </p>
              )}
            </div>

            {/* FAQ аккордеон */}
            <div className="flex flex-col">
              {items.map((item, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div
                    key={idx}
                    className="border-top border-[#E5E7EB]"
                    itemScope
                    itemProp="mainEntity"
                    itemType="https://schema.org/Question"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? -1 : idx)}
                      className="w-full py-5 flex items-center gap-6 text-left border-t border-[#E5E7EB] hover:bg-gray-50/50 transition-colors"
                      aria-expanded={isOpen}
                      aria-controls={`faq-answer-${idx}`}
                    >
                      <h3
                        className="flex-1 text-[19px] md:text-xl font-medium leading-7 text-[#101828]"
                        itemProp="name"
                      >
                        {item.question}
                      </h3>
                      <span className="relative inline-flex items-center justify-center w-5 h-5 flex-shrink-0">
                        <span className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[2px] w-full bg-[#101828]" />
                        <span
                          className={`absolute left-1/2 top-0 -translate-x-1/2 w-[2px] h-full bg-[#101828] transition-all duration-300 ease-in-out ${
                            isOpen ? "scale-y-0 opacity-0" : "scale-y-100 opacity-100"
                          }`}
                        />
                      </span>
                    </button>

                    {/* Контент с плавным раскрытием */}
                    <div
                      id={`faq-answer-${idx}`}
                      className="grid transition-all duration-500 ease-in-out"
                      style={{
                        gridTemplateRows: isOpen ? '1fr' : '0fr'
                      }}
                      itemScope
                      itemProp="acceptedAnswer"
                      itemType="https://schema.org/Answer"
                    >
                      <div className="overflow-hidden">
                        <div className="pb-6 pr-0 md:pr-10" itemProp="text">
                          {typeof item.answer === 'string' ? (
                            <p className="text-[19px] leading-7 text-[#475467]">{item.answer}</p>
                          ) : (
                            item.answer
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div className="border-t border-[#E5E7EB]" />
            </div>
          </div>

          {/* Правая колонка: Контактная карточка */}
          {showContactCard && (
            <aside className="lg:pl-6">
              <div className="rounded-3xl border border-[#E5E7EB] p-7 md:p-9 flex flex-col justify-between min-h-[280px]">
                <div>
                  <h3 className={`text-[clamp(20px,3vw,24px)] ${headingBase} ${headingColor}`}>
                    {contactCardTitle}
                  </h3>
                  <p className="mt-4 text-xl leading-7 text-[#7B88A0]">
                    {contactCardText}
                  </p>
                </div>
                <div className="mt-8">
                  <button
                    onClick={openConsult}
                    className="inline-flex rounded-xl text-base font-medium text-[#0077FF] hover:text-[#0761C8] transition-colors duration-300"
                  >
                    {contactButtonText}
                  </button>
                </div>
              </div>
            </aside>
          )}
        </div>
      </div>
    </section>
  );
}
