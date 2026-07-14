"use client";

import Image from "next/image";
import Link from "next/link";

const IMG = "/img/inventory-support.webp";

export default function InventorySupportSection() {
  return (
    <section className="bg-white w-full py-4 md:py-6" aria-label="Инвентаризация и сопровождение">
      <div className="rd-content-column flex flex-col items-center gap-6 md:gap-8">
        {/* КАРТОЧКА */}
        <div className="relative w-full bg-[#F6F7F9] rounded-[32px] overflow-hidden flex flex-col md:block md:h-[348px]">
          {/* Текст (шрифты как в секции «Всё для удобного цифрового контроля…») */}
          <div className="relative z-10 p-8 pb-4 md:p-[72px] md:max-w-[600px]">
            <h2 className="font-involve text-[#313131] text-[28px] sm:text-[32px] md:text-[40px] font-medium leading-[1.15] md:leading-[44px] tracking-wide">
              Инвентаризация
              <br className="hidden sm:block" />
              {" "}и сопровождение
            </h2>
            <p className="mt-4 font-[Raleway] text-base leading-6 tracking-tight text-[#646b85]/60 max-w-[580px]">
              Мы не просто предлагаем систему, но и предоставляем полный цикл
              услуг по инвентаризации объектов. Обеспечиваем сопровождение,
              регулярное обновление и поддержку пользователей.
            </p>
          </div>

          {/* МОБАЙЛ: картинка после текста, прижата к низу блока */}
          <div className="md:hidden mt-auto flex justify-center">
            <div className="relative w-[280px] h-[220px]">
              <Image
                src={IMG}
                alt="Оборудование для инвентаризации"
                fill
                className="object-contain object-bottom"
                sizes="280px"
              />
            </div>
          </div>

          {/* ДЕСКТОП: картинка у правого нижнего края */}
          <div className="pointer-events-none absolute right-0 bottom-0 hidden md:block w-[460px] lg:w-[504px] h-full">
            <Image
              src={IMG}
              alt="Оборудование для инвентаризации"
              fill
              className="object-contain object-right-bottom"
              sizes="504px"
            />
          </div>
        </div>

        {/* КНОПКА → страница услуг */}
        <Link
          href="/services"
          className="w-full max-w-[369px] h-[52px] bg-[#029CDA] rounded-2xl flex items-center justify-center text-white text-base font-medium font-involve leading-6 tracking-tight hover:bg-[#0288bd] transition-colors"
        >
          Заказать услуги
        </Link>
      </div>
    </section>
  );
}
