"use client";

import React from "react";
import Image from "next/image";

type Card = {
  title: string;
  text: string;
  img: string;
  imgAlt: string;
  imageBottom?: boolean;
};

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
    imageBottom: true,
  },
  {
    title: "Инвентаризация и сопровождение",
    text:
      "Мы не просто предлагаем систему, но и предоставляем полный цикл услуг по инвентаризации объектов. Обеспечиваем сопровождение, регулярное обновление и поддержку пользователей.",
    img: "/img/reasons-3.png",
    imgAlt: "Инвентаризация и сопровождение",
  },
];

function CardImage({
  card,
  priority = false,
}: {
  card: Card;
  priority?: boolean;
}) {
  return (
    <div className="p-2">
      <div className="bg-white rounded-2xl flex items-center justify-center overflow-hidden min-h-[260px]">
        <div className="relative w-[240px] max-w-full aspect-[240/145]">
          <Image
            src={card.img}
            alt={card.imgAlt}
            fill
            className="object-contain"
            sizes="240px"
            priority={priority}
          />
        </div>
      </div>
    </div>
  );
}

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
    <section
      className="bg-white w-full py-16"
      aria-label="Цифровой контроль территории"
    >
      <div className="rd-content-column">
        <header className="flex flex-col items-center text-center mb-14">
          <h2 className="font-involve text-[#313131] text-[clamp(2rem,4vw,3rem)] font-medium leading-[1.2] md:leading-[57.6px] max-w-[937px]">
            {title}
          </h2>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {cards.map((card, i) => (
            <article
              key={i}
              className="bg-[#F6F7F9] rounded-3xl flex flex-col overflow-hidden h-full"
            >
              {!card.imageBottom && (
                <CardImage card={card} priority={i === 0} />
              )}

              <div className="px-8 pt-6 pb-10 flex-1">
                <h3 className="font-involve text-[#313131] text-[22px] md:text-[28px] font-medium leading-9">
                  {card.title}
                </h3>

                <p className="mt-3.5 text-[#7C8A9A] font-[Raleway] text-[15px] leading-7">
                  {card.text}
                </p>
              </div>

              {card.imageBottom && (
                <div className="mt-auto">
                  <CardImage card={card} />
                </div>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}