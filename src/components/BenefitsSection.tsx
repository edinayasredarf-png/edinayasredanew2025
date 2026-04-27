"use client";
import React from "react";
import Image from "next/image";
import { useModal } from "./ModalProvider";

type Benefit = { title: string; desc: string };

const items: Benefit[] = [
  { title: "Выгода на содержание", desc: "система способствует эффективному планированию муниципального бюджета" },
  { title: "Экономия на оцифровке", desc: "проведение повторной инвентаризации и ввод данных самостоятельно" },
  { title: "Адаптация сотрудников", desc: "Вся необходимая документация сосредоточена в единой системе" },
  { title: "Быстрое внедрение системы", desc: "в течение 1 рабочего дня" },
  { title: "Снижение рисков срывов государственных контрактов до 0", desc: "контроль подрядчиков и актуализация данных в онлайн режиме" },
  { title: "Одна программа для всех решений", desc: "все объекты городской среды и необходимые документы в едином поле" },
];

export default function BenefitsSection({
  imageSrc = "/icons/es-blue.svg",
  imageAlt = "Иллюстрация преимуществ",
  leftBg = "bg-white",
  onRegisterClick,
  showTitle = true,
  ctaText = "Оставить заявку на регистрацию",
}: {
  imageSrc?: string;
  imageAlt?: string;
  leftBg?: string;
  onRegisterClick?: () => void;
  showTitle?: boolean;
  ctaText?: string;
}) {
  const { openRegister } = useModal();

  return (
    <section
      className="mx-auto w-full max-w-[1480px] px-4 py-8 md:py-10 mt-10 md:mt-14 lg:mt-20"
      aria-label="Преимущества системы"
    >
      {showTitle && (
        <header className="text-center mb-6 md:mb-8">
          <h2 className="font-[Raleway] font-medium leading-tight text-[26px] sm:text-[34px] md:text-[44px] text-[#313131]">
            6 веских причин зарегистрироваться в системе{" "}
            <span className="text-[#0077FF]">Единая среда</span>
          </h2>
        </header>
      )}

      {/* Основная сетка */}
      <div className="grid grid-cols-1 lg:[grid-template-columns:210px_1fr] gap-1 md:gap-2">
        {/* Левый высокий блок — только на десктопе */}
        <div
          className={`relative rounded-2xl hidden lg:flex ${leftBg} h-[280px] lg:min-h-[344px] p-3 items-center justify-center`}
        >
          <div className="relative w-full h-full flex items-center justify-center">
            <div className="relative w-[60%] max-w-[200px] aspect-square">
              <Image
                src={imageSrc}
                alt={imageAlt}
                fill
                className="object-contain"
                sizes="(max-width: 1024px) 160px, 200px"
              />
            </div>
          </div>
        </div>

        {/* Правая часть — карточки */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1 md:gap-2">
          {items.map((it, idx) => (
            <article
              key={it.title}
              className="relative rounded-2xl bg-white p-5 md:p-6 min-h-[150px] flex flex-col"
            >
              {/* На мобильных изображение появляется в первой карточке над текстом, слева */}
              {idx === 0 && (
                <div className="md:hidden mb-3 -mt-1 flex justify-start">
                  <div className="relative w-[60px] h-[60px]">
                    <Image
                      src={imageSrc}
                      alt={imageAlt}
                      fill
                      className="object-contain opacity-90"
                      sizes="60px"
                    />
                  </div>
                </div>
              )}

              <h3 className="text-[15px] md:text-[16px] font-semibold leading-6 text-[#313131] font-[Raleway]">
                {it.title}
              </h3>
              <p className="mt-2.5 text-[14px] md:text-[15px] leading-6 text-[#7C8A9A] font-[Raleway]">
                {it.desc}
              </p>
            </article>
          ))}
        </div>
      </div>

      {/* CTA — кнопка регистрации */}
      <div className="mt-6 flex justify-center">
        <button
          type="button"
          onClick={onRegisterClick ?? openRegister}
          className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-3.5 rounded-xl bg-[#0077FF] hover:bg-[#005fd1] transition-colors text-white text-lg md:text-xl font-medium leading-7 font-[Raleway]"
        >
          {ctaText}
        </button>
      </div>
    </section>
  );
}
