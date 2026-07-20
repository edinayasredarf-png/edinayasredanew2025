"use client";

import React from "react";

interface CtaBlockProps {
  title?: string;
  text?: string;
  kpLabel?: string;
  consultLabel?: string;
}

/**
 * Блок призыва к действию. Использует те же события модальных окон,
 * что и продуктовые страницы услуг: openKPModal / openConsultModal.
 */
export default function CtaBlock({
  title = "Обсудим вашу задачу",
  text = "Расскажем, как «Единая среда» закроет вашу задачу, и подготовим коммерческое предложение под ваш объём объектов.",
  kpLabel = "Получить коммерческое предложение",
  consultLabel = "Бесплатная консультация",
}: CtaBlockProps) {
  const openKP = () => window.dispatchEvent(new CustomEvent("openKPModal"));
  const openConsult = () =>
    window.dispatchEvent(new CustomEvent("openConsultModal"));

  return (
    <section className="py-14 md:py-20">
      <div className="max-w-[1200px] mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-xl md:text-2xl lg:text-3xl font-semibold mb-4 text-[#313131]">
            {title}
          </h2>
          <p className="text-gray-600 text-sm md:text-base mb-6">{text}</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={openKP}
              className="inline-flex items-center justify-center bg-[#029cda] text-white px-8 py-4 rounded-xl font-medium hover:bg-[#029cda]/90 transition-colors duration-200 focus:outline-none"
            >
              {kpLabel}
            </button>
            <button
              onClick={openConsult}
              className="inline-flex items-center justify-center bg-[#F6F7F9] text-[#029cda] border border-[#029cda] px-8 py-4 rounded-xl font-medium hover:bg-[#029cda]/10 transition-colors duration-200 focus:outline-none"
            >
              {consultLabel}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
