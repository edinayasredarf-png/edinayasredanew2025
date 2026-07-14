"use client";

import Image from "next/image";

type Card = {
  title: string; // \n → перенос строки (whitespace-pre-line)
  description: string;
  image: string;
  link: string;
};

const CARD_REESTR: Card = {
  title: "Входим в реестр\nотечественного ПО",
  description:
    "Единая среда внесён в реестр отечественного ПО и отвечает требованиям, предъявляемым к нему. Запись №13314 от 15.04.2022",
  image: "/img/reestr.webp",
  link: "https://reestr.digital.gov.ru/reestr/685429/",
};

const CARD_SKOLKOVO: Card = {
  title: "Резидент Сколково\nи участник АСИ",
  description:
    "Статус резидента «Сколково» и участие в инициативах АСИ подтверждают инновационный подход компании и соответствие высоким стандартам развития цифровых решений.",
  image: "/img/skolkovo.webp",
  link: "https://ytevoelicxcecwpetcqj.supabase.co/storage/v1/object/public/docs/Vipiska_iz_reestra_udach_uchastnikov_proekta_Skolkovo_SFERA.pdf",
};

const CARD_FZ: Card = {
  title: "Добросовестный\nподрядчик по 44 и 223-ФЗ",
  description:
    "Компании ООО «Сфера» и ООО «Экострой», входящие в состав ГК «Единая среда», более 15 лет успешно выполняют государственные и коммерческие контракты, доказывая свою надёжность и высокое качество работ.",
  image: "/img/fz.webp",
  link: "https://www.tbank.ru/business/contractor/legal/1106195006378/contracts/1/",
};

function ArrowCircle({ tall }: { tall: boolean }) {
  return (
    <span
      className={`absolute z-20 flex items-center justify-center w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-[#029CDA] text-white shadow-lg opacity-0 scale-90 transition-all duration-700 ease-in-out group-hover:opacity-100 group-hover:scale-100 ${
        tall ? "left-8 bottom-8 lg:left-10 lg:bottom-10" : "right-8 top-8 lg:right-10 lg:top-10"
      }`}
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="m9 6 6 6-6 6" />
      </svg>
    </span>
  );
}

function Card({ card, tall = false }: { card: Card; tall?: boolean }) {
  return (
    <a
      href={card.link}
      target="_blank"
      rel="noopener noreferrer"
      className={`group relative flex flex-col overflow-hidden rounded-[32px] bg-[#F6F7F9] p-8 lg:p-10 min-h-[240px] ${
        tall ? "lg:h-[540px]" : "lg:h-[258px]"
      }`}
    >
      {/* ТЕКСТ (заголовок + описание, всегда видимы) */}
      <div
        className={`relative z-10 ${
          tall ? "lg:max-w-[360px]" : "sm:pr-[230px] lg:pr-[260px]"
        }`}
      >
        <h3 className="font-involve text-[#050c26] text-[22px] md:text-[28px] font-medium leading-[1.2] md:leading-[33.6px] tracking-wide whitespace-pre-line">
          {card.title}
        </h3>
        <p className="mt-4 md:mt-5 font-[Raleway] text-base leading-6 tracking-tight text-[#646b85] font-medium">
          {card.description}
        </p>
      </div>

      {/* КРУГЛАЯ КНОПКА-СТРЕЛКА — плавно появляется при наведении */}
      <ArrowCircle tall={tall} />

      {/* МОБАЙЛ: полноразмерная картинка на всю ширину, после текста */}
      <div className="sm:hidden mt-6 relative w-full h-[200px]">
        <Image
          src={card.image}
          alt={card.title.replace(/\n/g, " ")}
          fill
          className="object-contain"
          sizes="100vw"
        />
      </div>

      {/* ДЕСКТОП/ПЛАНШЕТ: картинка у края, не перекрывает текст */}
      <div
        className={`hidden sm:block pointer-events-none absolute ${
          tall
            ? "right-0 bottom-0 w-[320px] lg:w-[380px] h-[200px] lg:h-[240px]"
            : "right-3 bottom-0 w-[210px] lg:w-[240px] h-[78%]"
        }`}
      >
        <Image
          src={card.image}
          alt=""
          fill
          className="object-contain object-right-bottom"
          sizes={tall ? "380px" : "240px"}
        />
      </div>
    </a>
  );
}

export default function TrustSection() {
  return (
    <section className="bg-white w-full py-16 md:py-24" aria-label="Почему нас выбирают уже более 15 лет">
      <div className="rd-content-column">
        <div className="flex justify-center">
          <h2 className="max-w-[1120px] text-center font-involve text-[#313131] text-[32px] md:text-[40px] font-medium leading-[1.2] md:leading-[55px]">
            Почему нас выбирают уже более 15 лет
          </h2>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-[minmax(0,684px)_minmax(0,447px)] gap-6">
          {/* ЛЕВАЯ КОЛОНКА — две карточки стопкой */}
          <div className="flex flex-col gap-6">
            <Card card={CARD_REESTR} />
            <Card card={CARD_SKOLKOVO} />
          </div>

          {/* ПРАВАЯ КОЛОНКА — высокая карточка */}
          <Card card={CARD_FZ} tall />
        </div>
      </div>
    </section>
  );
}
