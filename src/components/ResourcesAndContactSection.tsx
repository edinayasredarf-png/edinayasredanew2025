"use client";

import Image from "next/image";
import { useState, useRef, useEffect } from "react";

const MESSENGERS = [
  {
    label: "Telegram",
    href: "https://t.me/edinayasreda",
    icon: "/icons/telegram_blue.svg",
  },
  {
    label: "MAX",
    href: "https://max.ru/edinayasreda",
    icon: "/icons/max-blue.svg",
  },
  {
    label: "ВКонтакте",
    href: "https://vk.me/edinayasreda",
    icon: "/icons/vk-blue.svg",
  },
];

function MessengerPopup() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-3 bg-white text-[#029CDA] font-involve font-bold text-base md:text-lg px-6 py-3 rounded-2xl hover:bg-white/90 transition-colors"
      >
        Написать нам
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M3 6l5 5 5-5" stroke="#029CDA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <div className="absolute bottom-full mb-3 left-0 bg-white rounded-2xl shadow-xl p-2 flex flex-col gap-1 min-w-[220px] z-50">
          {MESSENGERS.map((m) => (
            <a
              key={m.label}
              href={m.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#F6F7F9] transition-colors text-[#313131] font-involve font-medium text-base"
            >
              <Image src={m.icon} alt={m.label} width={24} height={24} className="shrink-0" />
              {m.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

const resources = [
  {
    title: "С чего начать оцифровку своей территории",
    href: "/files/checklist-digital.pdf",
  },
  {
    title: "Какие требования сейчас к инвентаризации",
    href: "/files/checklist-inventory.pdf",
  },
];

export default function ResourcesAndContactSection() {
  return (
    <section className="bg-[#F6F7F9] w-full py-16 md:py-24">
      <div className="rd-content-column">
        {/* TOP CARDS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {resources.map((item, index) => (
            <article
              key={index}
              className="
                bg-white
                rounded-[32px]
                p-8 md:p-10
                min-h-[258px]
                flex
                flex-col
                justify-between
              "
            >
              <h3
                className="
                  font-involve
                  text-[#222222]
                  text-[28px]
                  md:text-[32px]
                  font-medium
                  leading-[1.25]
                  max-w-[500px]
                "
              >
                {item.title}
              </h3>

              <a
                href={item.href}
                download
                className="
                  inline-flex
                  items-center
                  gap-3
                  text-[#029CDA]
                  font-involve
                  font-bold
                  text-lg
                  md:text-xl
                  hover:opacity-80
                  transition-opacity
                  w-fit
                "
              >
                Скачать чек-лист

                <span
                  className="
                    w-6
                    h-6
                    rounded-full
                    flex
                    items-center
                    justify-center
                    shrink-0
                  "
                >
                  <Image
                    src="/icons/arrow-up-right.svg"
                    alt=""
                    width={12}
                    height={12}
                    className="object-contain"
                  />
                </span>
              </a>
            </article>
          ))}
        </div>

        {/* CTA BLOCK */}
        <div
          className="
            relative
            mt-4
            overflow-hidden
            rounded-[32px]
            bg-[#029CDA]
            min-h-[200px]
          "
        >
          {/* Background Pattern */}
          <div
            className="
              absolute
              right-0
              top-0
              h-full
              w-[220px]
              hidden
              md:block
              pointer-events-none
            "
          >
            <Image
              src="/img/contact-pattern.svg"
              alt=""
              fill
              className="object-contain object-right"
            />
          </div>

          <div
            className="
              relative
              z-10
              flex
              flex-col
              justify-between
              h-full
              p-8
              md:px-10
              md:py-10
            "
          >
            <h3
              className="
                font-involve
                text-white
                text-[24px]
                md:text-[32px]
                font-medium
                leading-[1.3]
                max-w-[700px]
              "
            >
              Напишите нам — проконсультируем
              <br className="hidden md:block" />
              и поможем подобрать тариф под ваши задачи
            </h3>

            <div className="mt-8">
              <MessengerPopup />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}