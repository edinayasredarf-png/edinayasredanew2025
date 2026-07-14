"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";

type Feature = {
  title: string;
  description: string;
  image: string;
  icon: ReactNode;
};

// Интервал автопереключения (мс) — только для десктопной версии.
const AUTO_SWITCH_DELAY = 5000;

// Тематические иконки в фирменном цвете #029cda (для мобильных карточек).
const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "#029CDA",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  className: "w-6 h-6",
};

const features: Feature[] = [
  {
    title: "Контролируйте работы удалённо",
    description: "Подрядчики сами вносят данные — вы принимаете работы онлайн.",
    image: "/img/card1.png",
    icon: (
      <svg {...iconProps} aria-hidden>
        <rect x="8" y="2" width="8" height="4" rx="1" />
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        <path d="m9 14 2 2 4-4" />
      </svg>
    ),
  },
  {
    title: "Всегда актуальная информация",
    description:
      "Система автоматически обновляет информацию и отображает изменения в режиме реального времени.",
    image: "/img/card2.png",
    icon: (
      <svg {...iconProps} aria-hidden>
        <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
        <path d="M21 3v5h-5" />
        <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
        <path d="M3 21v-5h5" />
      </svg>
    ),
  },
  {
    title: "Все объекты в одном интерфейсе",
    description:
      "Получайте доступ ко всем объектам и территориям через единое рабочее пространство.",
    image: "/img/card3.png",
    icon: (
      <svg {...iconProps} aria-hidden>
        <rect width="7" height="7" x="3" y="3" rx="1" />
        <rect width="7" height="7" x="14" y="3" rx="1" />
        <rect width="7" height="7" x="14" y="14" rx="1" />
        <rect width="7" height="7" x="3" y="14" rx="1" />
      </svg>
    ),
  },
  {
    title: "Полная прозрачность процессов",
    description:
      "Все действия подрядчиков и сотрудников фиксируются и доступны для проверки.",
    image: "/img/card4.png",
    icon: (
      <svg {...iconProps} aria-hidden>
        <path d="M2.06 12.35a1 1 0 0 1 0-.7 10.75 10.75 0 0 1 19.88 0 1 1 0 0 1 0 .7 10.75 10.75 0 0 1-19.88 0" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
  {
    title: "Гибкое управление доступами",
    description:
      "Настраивайте права доступа для сотрудников и подрядчиков по ролям.",
    image: "/img/card5.png",
    icon: (
      <svg {...iconProps} aria-hidden>
        <path d="M2.59 17.41A2 2 0 0 0 2 18.83V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.17a2 2 0 0 0 1.42-.59l.81-.81a6.5 6.5 0 1 0-4-4z" />
        <circle cx="16.5" cy="7.5" r=".5" fill="#029CDA" />
      </svg>
    ),
  },
];

export default function FeaturesTabsSection() {
  // Стартуем с верхней вкладки — автопереключение идёт сверху вниз.
  const [activeTab, setActiveTab] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const restartTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      // Сверху вниз: индекс растёт, после нижней — снова к верхней.
      setActiveTab((prev) => (prev + 1) % features.length);
    }, AUTO_SWITCH_DELAY);
  };

  useEffect(() => {
    restartTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTabClick = (index: number) => {
    setActiveTab(index);
    restartTimer();
  };

  const current = features[activeTab];

  return (
    <section className="bg-white w-full pt-6 md:pt-10 pb-6 md:pb-8" aria-label="Всё для удобного цифрового контроля и учёта вашей территории">
      <div className="rd-content-column flex flex-col gap-5">
        {/* HEADER */}
        <div className="flex flex-col items-center">
          <h2 className="max-w-[1120px] text-center font-involve text-[#313131] text-[28px] sm:text-[32px] md:text-[40px] font-medium leading-[1.15] md:leading-[44px] tracking-wide">
            Всё для удобного цифрового контроля
            <br className="hidden sm:block" />
            {" "}и учёта вашей территории
          </h2>
        </div>

        {/* ===== ДЕСКТОП: картинка + вертикальные вкладки ===== */}
        <div className="hidden lg:grid pt-8 grid-cols-[minmax(0,684px)_minmax(0,418px)] gap-12 items-center">
          {/* LEFT — картинка на подложке */}
          <div className="bg-[#F6F7F9] rounded-[32px] flex items-end justify-center px-[72px] pt-[72px] pb-0 h-[572px] overflow-hidden">
            <div className="relative w-full max-w-[500px] aspect-square">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`image-${activeTab}`}
                  initial={{ opacity: 0, scale: 0.96, y: 16 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: -16 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="absolute inset-0"
                >
                  <Image
                    src={current.image}
                    alt={current.title}
                    fill
                    priority
                    className="object-contain object-bottom"
                    sizes="500px"
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* RIGHT — вертикальные вкладки */}
          <div className="relative flex flex-col">
            {features.map((item, index) => {
              const active = index === activeTab;
              return (
                <button
                  key={item.title}
                  type="button"
                  onClick={() => handleTabClick(index)}
                  aria-pressed={active}
                  className="group relative text-left border-l-2 border-transparent pl-6 py-4"
                >
                  {active && (
                    <motion.span
                      layoutId="feature-active-line"
                      className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#029CDA] rounded-full"
                      transition={{ type: "spring", stiffness: 350, damping: 35 }}
                    />
                  )}
                  <span className="block font-involve text-[#313131] text-xl font-medium leading-7 tracking-wide">
                    {item.title}
                  </span>
                  <span
                    className={`mt-2 block font-[Raleway] text-base leading-6 tracking-tight transition-colors duration-300 ${
                      active ? "text-[#646b85]" : "text-[#646b85]/60 group-hover:text-[#646b85]"
                    }`}
                  >
                    {item.description}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ===== МОБИЛЬНАЯ ВЕРСИЯ: только блоки с иконками, без слайдшоу ===== */}
        <div className="lg:hidden pt-2 flex flex-col gap-4">
          {features.map((item) => (
            <div
              key={item.title}
              className="bg-[#F6F7F9] rounded-3xl p-6"
            >
              <div className="w-11 h-11 rounded-2xl bg-white flex items-center justify-center mb-4">
                {item.icon}
              </div>
              <h3 className="font-involve text-[#313131] text-xl font-medium leading-7 tracking-wide">
                {item.title}
              </h3>
              <p className="mt-2 font-[Raleway] text-base leading-6 tracking-tight text-[#646b85]">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
