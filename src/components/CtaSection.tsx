"use client";

import Image from "next/image";
import { useModal } from "@/components/ModalProvider";

export default function CtaSection() {
  const modal = useModal() as { openRegister?: () => void };

  // Та же форма, что открывает кнопка «Попробовать» в хедере (openRegister).
  const handleClick = () => modal?.openRegister?.();

  return (
    <section className="w-full pb-8" aria-label="Развивайте территорию вместе с Единой средой">
      <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-b from-white to-[#f6f7f9]">
        <div className="rd-content-column relative lg:h-[560px] xl:h-[600px]">
          {/* Текст */}
          <div className="relative z-10 max-w-[560px] pt-16 md:pt-24 lg:pt-28 pb-12 lg:pb-0">
            <h2 className="max-w-[600px] font-involve text-[#050c26] text-[32px] md:text-[40px] font-medium leading-[1.15] md:leading-[44px] tracking-wide sm:whitespace-nowrap">
              Развивайте территорию
              <br />
              вместе с Единой средой
            </h2>

            <div className="mt-8 space-y-6">
              <div>
                <h3 className="font-[Raleway] text-[#050c26] text-xl font-medium leading-7 tracking-wide">
                  Реферальная программа
                </h3>
                <p className="mt-3 max-w-[448px] font-[Raleway] text-base leading-6 text-[#646b85]">
                  Рекомендуйте систему коллегам и партнёрам — получайте бонусы за каждое успешное подключение.
                </p>
              </div>
              <div>
                <h3 className="font-[Raleway] text-[#050c26] text-xl font-medium leading-7 tracking-wide">
                  Внедрение под ключ
                </h3>
                <p className="mt-3 max-w-[448px] font-[Raleway] text-base leading-6 text-[#646b85]">
                  Мы настроим систему под задачи вашей организации: слои, справочники, объекты и права доступа.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClick}
              className="mt-8 inline-flex items-center justify-center h-[52px] px-8 rounded-xl bg-[#029cda] text-white text-base font-medium font-involve hover:bg-[#0288bd] transition-colors"
            >
              Подключить систему
            </button>
          </div>

          {/* Картинка — прижата к правому нижнему краю (десктоп) */}
          <div className="hidden lg:block absolute right-0 bottom-0 w-[560px] xl:w-[680px]">
            <Image
              src="/img/cta.webp"
              alt="Развивайте территорию вместе с Единой средой"
              width={719}
              height={553}
              priority
              className="w-full h-auto object-contain object-bottom"
              sizes="680px"
            />
          </div>
        </div>

        {/* Картинка — мобильная версия, под текстом */}
        <div className="lg:hidden flex justify-center">
          <Image
            src="/img/cta.webp"
            alt=""
            width={719}
            height={553}
            className="w-full max-w-[520px] h-auto object-contain"
            sizes="90vw"
          />
        </div>
      </div>
    </section>
  );
}
