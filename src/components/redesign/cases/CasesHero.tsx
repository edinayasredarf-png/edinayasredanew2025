'use client';

import Image from 'next/image';

type CasesHeroProps = {
  onConsult: () => void;
  caseCount?: number;
};

export function CasesHero({ onConsult, caseCount }: CasesHeroProps) {
  return (
    <section className="w-full page-hero relative overflow-hidden lining-nums pb-4 md:pb-6">
      <div className="case-page-column py-12 md:py-20">
        <div className="flex flex-col lg:flex-row lg:items-end gap-10 lg:gap-16">
          <div className="flex-1 max-w-3xl">
            <p className="inline-flex items-center gap-2 text-sm text-[#667085] mb-6">
              <span className="w-8 h-px bg-[#029cda]" aria-hidden />
              Портфолио проектов
            </p>
            <h1 className="font-involve text-[#101828] text-[2.75rem] sm:text-5xl md:text-[4.5rem] leading-[1.05] tracking-tight">
              Кейсы
            </h1>
            <p className="mt-6 text-lg md:text-2xl text-[#667085] max-w-xl leading-relaxed">
              Реальные проекты и решения, которые мы реализовали для муниципалитетов и бизнеса
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={onConsult}
                className="inline-flex items-center justify-center bg-[#029cda] text-white text-base font-medium px-7 py-4 rounded-2xl hover:bg-[#0288bd] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#029cda]/40"
              >
                Получить консультацию
              </button>
              <a
                href="#cases-grid"
                className="inline-flex items-center justify-center text-[#202020] text-base font-medium px-7 py-4 rounded-2xl border border-[#d0d5dd] bg-transparent hover:bg-[#f2f3f5] transition-colors"
              >
                Смотреть проекты
              </a>
            </div>
            {typeof caseCount === 'number' && caseCount > 0 && (
              <p className="mt-8 text-sm text-[#98a2b3]">
                {caseCount} {caseCount === 1 ? 'проект' : caseCount < 5 ? 'проекта' : 'проектов'} в каталоге
              </p>
            )}
          </div>
          <div className="flex-shrink-0 w-full max-w-[380px] lg:max-w-[420px] mx-auto lg:mx-0 lg:ml-auto">
            <Image
              src="/img/cases/cases-hero.svg"
              alt=""
              width={420}
              height={340}
              className="w-full h-auto object-contain"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}
