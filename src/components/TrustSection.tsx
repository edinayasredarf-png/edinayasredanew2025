"use client";

import Image from "next/image";

type Card = {
  title: string;
  description: string;
  button: string;
  icon: string;
  link: string;
  variant?: "blue" | "light";
};

const cards: Card[] = [
  {
    title: "Входит в реестр отечественного ПО",
    description:
      "Единая среда внесен в реестр отечественного ПО и отвечает требованиям, предъявляемым к нему.",
    button: "Посмотреть",
    icon: "../../icons/check-square.svg",
    link: "https://reestr.digital.gov.ru/reestr/685429/",
    variant: "blue",
  },
  {
    title: "Добросовестный подрядчик по 44 и 223-ФЗ",
    description:
      "Компании «Сфера» и «Экострой», входящие в ГК «Единая среда», более 15 лет выполняют государственные и коммерческие контракты, подтверждая надежность и высокое качество работ.",
    button: "Подробнее о проектах",
    icon: "../../icons/gov.svg",
    link: "https://www.tbank.ru/business/contractor/legal/1106195006378/contracts/1/", 
    variant: "light",
  },
  {
    title: "Резидент Сколково и участник АСИ",
    description:
      "Статус резидента «Сколково» и участие в инициативах АСИ подтверждают инновационный подход компании и соответствие высоким стандартам развития цифровых решений.",
    button: "Узнать подробнее",
    icon: "../../icons/skolkovo1.svg",
    link: "https://ytevoelicxcecwpetcqj.supabase.co/storage/v1/object/public/docs/Vipiska_iz_reestra_udach_uchastnikov_proekta_Skolkovo_SFERA.pdf", 
    variant: "light",
  },
];

export default function TrustSection() {
  return (
    <section className="w-full py-16 md:py-24 bg-white">
      <div className="max-w-[1200px] mx-auto px-5 md:px-8">
        {/* TITLE */}
        <h2 className="font-involve text-[#222222] text-[32px] md:text-[46px] font-medium leading-[1.2] mb-12">
          Почему клиенты доверяют нам более 15 лет
        </h2>

        {/* GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card, i) => {
            const isBlue = card.variant === "blue";

            return (
              <div
                key={i}
                className={`
                  h-[488px]
                  rounded-3xl
                  p-8
                  flex flex-col justify-between
                  transition-all duration-300
                  ${
                    isBlue
                      ? "bg-[#029cda] text-white"
                      : "bg-[#f6f6f6] text-[#222222]"
                  }
                `}
              >
                {/* ICON */}
                <div className="w-16 h-16 relative">
                  <Image
                    src={card.icon}
                    alt={card.title}
                    fill
                    className="object-contain"
                  />
                </div>

                {/* TEXT */}
                <div className="mt-6">
                  <h3 className="font-involve text-2xl font-medium leading-8">
                    {card.title}
                  </h3>

                  <p className="mt-4 font-raleway text-lg leading-[26px]">
                    {card.description}
                  </p>
                </div>

                {/* BUTTON */}
                <a
                  href={card.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`
                    mt-8 inline-flex text-lg font-bold transition-opacity
                    ${isBlue ? "text-white" : "text-[#029cda]"}
                    hover:opacity-70
                  `}
                >
                  {card.button}
                </a>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="mt-10 flex justify-center">
          <a
            href="/about"
            className="px-22 py-3 bg-[#029cda] text-white rounded-lg text-lg font-medium hover:opacity-90 transition"
          >
            Подробнее о компании
          </a>
        </div>
      </div>
    </section>
  );
}