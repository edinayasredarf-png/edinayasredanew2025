'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useModal } from '@/components/ModalProvider';

type CasesHeroProps = {
  onConsult: () => void;
  caseCount?: number;
};

export function CasesHero({ onConsult }: CasesHeroProps) {
  const { openRegister } = useModal();

  return (
    <section className="w-full bg-white pt-6 pb-4 md:pb-6">
      <div className="max-w-[1200px] mx-auto px-4 lg:px-5">
        <div className="relative overflow-hidden rounded-[32px] bg-[#f6f7f9] px-6 sm:px-10 lg:px-[94px] pt-14 lg:pt-20 pb-10 lg:min-h-[425px]">
          {/* Контент слева */}
          <div className="relative z-10 max-w-full lg:max-w-[640px]">
            {/* Хлебные крошки */}
            <nav aria-label="Навигационная цепочка" className="h-7 flex items-center">
              <ol className="flex items-center text-sm font-medium font-involve leading-5 tracking-tight">
                <li className="flex items-center">
                  <Link href="/" className="text-[#050c26] hover:text-[#029cda] transition-colors">
                    Главная
                  </Link>
                  <span className="px-2 text-[#050c26]">/</span>
                </li>
                <li>
                  <span className="text-[#646b85]">Кейсы</span>
                </li>
              </ol>
            </nav>

            {/* Заголовок */}
            <h1 className="pt-4 font-involve text-[#050c26] text-[40px] sm:text-[48px] lg:text-[56px] font-medium leading-[1.05] lg:leading-[56px] tracking-wide">
              Кейсы
            </h1>

            {/* Подзаголовок */}
            <p className="pt-4 font-[Raleway] text-[#050c26] text-base font-medium leading-6 tracking-tight">
              Реальные проекты и решения, которые мы реализовали
              <br className="hidden sm:block" /> для муниципалитетов и бизнеса
            </p>

            {/* Кнопки */}
            <div className="pt-10 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => openRegister()}
                className="inline-flex items-center justify-center h-11 px-5 py-2.5 rounded-xl bg-[#029cda] text-white text-base font-normal font-involve leading-6 tracking-tight hover:bg-[#0288bd] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#029cda]/40"
              >
                Оставить заявку
              </button>
              <button
                type="button"
                onClick={onConsult}
                className="inline-flex items-center justify-center h-11 px-5 py-2.5 rounded-xl text-[#029cda] text-base font-normal font-involve leading-6 tracking-tight hover:bg-[#029cda]/5 transition-colors"
              >
                Получить консультацию
              </button>
            </div>
          </div>

          {/* Изображение справа на постаменте */}
          <div className="pointer-events-none select-none hidden lg:block absolute right-[40px] xl:right-[80px] bottom-0 w-[360px] h-[400px]">
            <Image
              src="/img/cases/cases.webp"
              alt=""
              fill
              sizes="360px"
              className="object-contain object-bottom"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}
