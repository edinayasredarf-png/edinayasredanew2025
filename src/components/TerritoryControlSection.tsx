"use client";
import React from "react";
import Image from "next/image";

type Card = { title: string; text: string; img: string; imgAlt: string };

const cardsDefault: Card[] = [
  {
    title: "Онлайн-контроль",
    text:
      "Система позволяет контролировать работу подрядчиков в режиме онлайн: проверять соответствие работ, принимать или отклонять результаты прямо из кабинета.",
    img: "/img/reasons-1.png",
    imgAlt: "Онлайн-контроль",
  },
  {
    title: "Аналитика",
    text:
      "Формирование актов, справок и аналитических отчётов происходит автоматически. Это исключает ошибки, экономит время и повышает прозрачность процессов.",
    img: "/img/reasons-2.1.png",
    imgAlt: "Аналитика",
  },
  {
    title: "Инвентаризация и сопровождение",
    text:
      "Мы не просто предлагаем систему, но и предоставляем полный цикл услуг по инвентаризации объектов. Обеспечиваем сопровождение, регулярное обновление и поддержку пользователей.",
    img: "/img/reasons-3.png",
    imgAlt: "Инвентаризация и сопровождение",
  },
];

export default function TerritoryControlSection({
  title = (
    <>
      Всё для удобного цифрового контроля
      <br className="hidden sm:block" />
      и учёта вашей территории
    </>
  ),
  cards = cardsDefault,
}: {
  title?: React.ReactNode;
  cards?: Card[];
}) {
  return (
    <section className="w-full mx-auto max-w-[1480px] px-4 py-12 md:py-16">
      <header className="flex flex-col items-center text-center mb-10 md:mb-14">
        <h2 className="text-[#313131] font-[Raleway] font-medium leading-[1.1] text-[32px] sm:text-[40px] md:text-[52px]">
          {title}
        </h2>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 md:gap-3">
        {cards.map((card, i) => (
          <article key={i} className="w-full bg-white rounded-3xl flex flex-col overflow-hidden">
            {/* --- IMAGE TOP --- */}
            {/* Для средней карточки (i === 1) показываем верхнюю картинку только на мобильных; на десктопе скрываем */}
            <div className={(i === 1 ? "block lg:hidden" : "block") + " p-2"}>
              <div className="bg-[#f6f7f9] rounded-2xl flex items-center justify-center overflow-hidden min-h-[220px] md:min-h-[260px]">
                <div className="relative w-[240px] max-w-[472px] aspect-[240/165] sm:aspect-[472/286]">
                  <Image
                    src={card.img}
                    alt={card.imgAlt}
                    fill
                    className="object-contain"
                    sizes="(max-width: 640px) 240px, 472px"
                    priority={i === 0}
                  />
                </div>
              </div>
            </div>

            {/* --- TEXT --- */}
            <div className="px-6 md:px-8 pt-4 md:pt-6 pb-8 md:pb-10">
              <h3 className="font-[Raleway] text-[#313131] font-medium leading-9 text-[22px] md:text-[28px]">
                {card.title}
              </h3>
              <p className="mt-3.5 text-[#7c8a9a] font-[Raleway] text-base sm:text-lg md:text-xl leading-7">
                {card.text}
              </p>
            </div>

            {/* --- IMAGE BOTTOM (ТОЛЬКО для средней карточки на десктопе) --- */}
            {i === 1 && (
              <div className="hidden lg:block mt-auto p-2">
                <div className="bg-[#f6f7f9] rounded-2xl flex items-center justify-center overflow-hidden min-h-[220px] md:min-h-[252px]">
                  <div className="relative w-[240px] max-w-[472px] aspect-[240/181] sm:aspect-[472/252]">
                    <Image
                      src={card.img}
                      alt={card.imgAlt}
                      fill
                      className="object-contain"
                      sizes="(max-width: 640px) 240px, 472px"
                    />
                  </div>
                </div>
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
