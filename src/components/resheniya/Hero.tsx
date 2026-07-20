"use client";

import React, { ReactNode } from "react";

interface HeroProps {
  h1: string;
  children?: ReactNode;
  kpLabel?: string;
  consultLabel?: string;
}

/**
 * Шапка (H1 + подзаголовок + CTA) для страниц раздела «Решения».
 * Использует те же события модалок, что и продуктовые страницы.
 */
export default function Hero({
  h1,
  children,
  kpLabel = "Получить коммерческое предложение",
  consultLabel = "Бесплатная консультация",
}: HeroProps) {
  const openKP = () => window.dispatchEvent(new CustomEvent("openKPModal"));
  const openConsult = () =>
    window.dispatchEvent(new CustomEvent("openConsultModal"));

  return (
    <section className="page-hero rounded-b-[20px] relative overflow-hidden">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
        <div className="max-w-4xl">
          <h1 className="text-[clamp(2rem,5.5vw,3.4rem)] leading-[1.14] tracking-[0.6px] font-involve font-medium">
            {h1}
          </h1>
          {children && (
            <div className="mt-6 text-base sm:text-lg md:text-xl text-gray-300 max-w-3xl space-y-4">
              {children}
            </div>
          )}
          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <button
              onClick={openKP}
              className="inline-flex items-center justify-center bg-[#029cda] text-white text-sm md:text-base lg:text-lg font-medium px-6 py-4 md:px-8 md:py-5 rounded-xl hover:bg-[#029cda]/90 transition-colors duration-200 focus:outline-none"
            >
              {kpLabel}
            </button>
            <button
              onClick={openConsult}
              className="inline-flex items-center justify-center bg-[#F6F7F9] text-[#029cda] border border-[#029cda] text-sm md:text-base lg:text-lg font-medium px-6 py-4 md:px-8 md:py-5 rounded-xl hover:bg-[#029cda]/10 transition-colors duration-200 focus:outline-none"
            >
              {consultLabel}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
