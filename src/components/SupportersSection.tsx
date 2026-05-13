"use client";
import React from "react";
import Image from "next/image";

type Logo = {
  src: string;
  alt: string;
};

export default function SupportersSection({
  title = "Разработано при поддержке",
  subtitle = "Нам доверяют крупные организации. Совместно проводим пилоты и внедряем решения на государственном уровне.",
  logos = [
    { src: "/img/logos/asi.svg", alt: "АСИ" },
    { src: "/img/logos/fasie1.svg", alt: "ФАСИИ" },
    { src: "/img/logos/frii_logo.svg", alt: "ФРИИ" },
    { src: "/img/logos/mincifry.svg", alt: "Минцифры" },
    { src: "/img/logos/minstroy.svg", alt: "Минстрой" },
    { src: "/img/logos/myroots.svg", alt: "myroots" },
		{ src: "/img/logos/skolkovo.svg", alt: "Сколково" },
  ],
}: {
  title?: string;
  subtitle?: string;
  logos?: Logo[];
}) {
  return (
    <section className="w-full mx-auto max-w-page px-4 py-10 md:py-14">
      {/* Заголовок */}
      <div className="flex flex-col items-center text-center mb-8 md:mb-10">
        <h2 className="text-[#313131] font-[Raleway] font-medium text-[30px] sm:text-[40px] md:text-[48px] leading-[1.2]">
          {title}
        </h2>
        <p className="text-[#7c8a9a] font-[Raleway] text-base sm:text-lg md:text-xl leading-7 max-w-[600px] mt-3">
          {subtitle}
        </p>
      </div>

      {/* Контейнер с логотипами */}
      <div className="flex justify-center">
        <div
          className="
            flex flex-row flex-wrap justify-center items-center
            gap-3 sm:gap-4 md:gap-6
            overflow-x-auto sm:overflow-visible
            snap-x snap-mandatory sm:snap-none
            pb-2 sm:pb-0
            max-w-[1260px]
          "
        >
          {logos.map((logo, i) => (
            <div
              key={`${logo.alt}-${i}`}
              className="
                snap-start shrink-0
                w-[110px] h-[70px] sm:w-[120px] sm:h-[80px]
                rounded-2xl bg-white
                flex items-center justify-center
                px-2
              "
            >
              <div className="relative w-[90px] h-[50px]">
                <Image
                  src={logo.src}
                  alt={logo.alt}
                  fill
                  sizes="(max-width: 968px) 90px, 120px"
                  className="object-contain"
                  loading="lazy"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
