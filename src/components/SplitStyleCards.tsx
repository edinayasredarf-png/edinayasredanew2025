"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";


import { AnimatePresence, motion } from "framer-motion";

type Feature = {
  tab: string;
  title: string;
  description: string;
  image: string;
  link?: string;
};

const AUTO_SWITCH_DELAY = 12000;

const features: Feature[] = [
  {
    tab: "Контролируйте работы удаленно",
    title: "Контролируйте работы удалённо",
    description:
      "Подрядчики сами вносят данные — вы принимаете работы онлайн.",
    image: "/img/card1.png",
    link: "#",
  },
  {
    tab: "Актуальные данные",
    title: "Всегда актуальная информация",
    description:
      "Система автоматически обновляет информацию и отображает изменения в режиме реального времени.",
    image: "/img/card2.png",
    link: "#",
  },
  {
    tab: "Все объекты",
    title: "Все объекты в одном интерфейсе",
    description:
      "Получайте доступ ко всем объектам и территориям через единое рабочее пространство.",
    image: "/img/card3.png",
    link: "#",
  },
  {
    tab: "Прозрачность действий",
    title: "Полная прозрачность процессов",
    description:
      "Все действия подрядчиков и сотрудников фиксируются и доступны для проверки.",
    image: "/img/card4.png",
    link: "#",
  },
  {
    tab: "Доступы",
    title: "Гибкое управление доступами",
    description:
      "Настраивайте права доступа для сотрудников и подрядчиков по ролям.",
    image: "/img/card5.png",
    link: "#",
  },
];

export default function FeaturesTabsSection() {
  const [activeTab, setActiveTab] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const restartTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      setActiveTab((prev) => (prev + 1) % features.length);
    }, AUTO_SWITCH_DELAY);
  };

  useEffect(() => {
    restartTimer();

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const container = tabsContainerRef.current;
    const activeElement = tabRefs.current[activeTab];

    if (!container || !activeElement) return;

    const containerWidth = container.offsetWidth;

    const targetScroll =
      activeElement.offsetLeft -
      containerWidth / 2 +
      activeElement.offsetWidth / 2;

    container.scrollTo({
      left: targetScroll,
      behavior: "smooth",
    });
  }, [activeTab]);

  const handleTabClick = (index: number) => {
    setActiveTab(index);
    restartTimer();
  };

  const current = features[activeTab];

  return (
    <section className="w-full py-16 md:py-20 overflow-hidden">
      <div className="rd-content-column">
        {/* HEADER */}

        <div className="flex justify-center">
          <h2 className="max-w-[900px] text-center font-involve text-[#222222] text-[32px] md:text-[48px] font-medium leading-[1.2]">
            Все возможности в одном месте
          </h2>
        </div>

        {/* TABS */}

        <div className="mt-10 border-b border-[#E7EBF0]">
          <div
            ref={tabsContainerRef}
            className="
              flex
              flex-nowrap
              lg:justify-center
              gap-8
              overflow-x-auto
              overflow-y-hidden
              px-4
              lg:px-0

              snap-x
              snap-mandatory

              [-ms-overflow-style:none]
              [scrollbar-width:none]
              [&::-webkit-scrollbar]:hidden
            "
          >
            {features.map((item, index) => {
              const active = index === activeTab;

              return (
                <button
                  key={item.tab}
                  ref={(el) => {
                    tabRefs.current[index] = el;
                  }}
                  onClick={() => handleTabClick(index)}
                  className="
                    relative
                    shrink-0
                    whitespace-nowrap
                    pb-4
                    snap-center
                    group
                  "
                >
                  <span
                    className={`
                      font-involve
                      transition-colors
                      duration-300
                      text-[18px]
                      lg:text-xl
                      leading-8

                      ${
                        active
                          ? "text-[#029CDA] font-bold"
                          : "text-[#7C8A9A] font-medium group-hover:text-[#029CDA]"
                      }
                    `}
                  >
                    {item.tab}
                  </span>

                  {active && (
                    <>
                      <motion.div
                        layoutId="active-tab"
                        className="absolute bottom-0 left-0 h-[2px] w-full bg-[#029CDA]"
                        transition={{
                          type: "spring",
                          stiffness: 350,
                          damping: 35,
                        }}
                      />

                      {/* Progress Bar */}
                      <motion.div
                        key={activeTab}
                        className="absolute bottom-0 left-0 h-[2px] bg-[#029CDA]"
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{
                          duration: AUTO_SWITCH_DELAY / 1000,
                          ease: "linear",
                        }}
                      />
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* CONTENT */}

        <div className="mt-8 bg-[#F6F7F9] rounded-[32px] overflow-hidden">
          <div className="grid lg:grid-cols-[420px_1fr] min-h-[530px]">
            {/* LEFT */}

            <div className="flex items-center px-6 md:px-10 py-8 md:py-10">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`content-${activeTab}`}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -24 }}
                  transition={{
                    duration: 0.35,
                    ease: "easeOut",
                  }}
                >
                  <h3 className="font-involve text-[#222222] text-[24px] md:text-[28px] font-medium leading-9">
                    {current.title}
                  </h3>

									<p className="mt-6 font-raleway font-medium lining-nums text-[#7C8A9A] text-[18px] leading-7">
  {current.description}
</p>

                  {current.link && (
                    <a
                      href={current.link}
                      className="
                        inline-flex
                        items-center
                        mt-10
                        text-[#029CDA]
                        text-lg
                        md:text-xl
                        font-bold
                        hover:opacity-80
                        transition-opacity
                      "
                    >
                      Подробнее
                    </a>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* IMAGE */}

						<div className="relative flex items-end justify-center px-6 md:px-8 pt-6 md:pt-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`image-${activeTab}`}
                  initial={{
                    opacity: 0,
                    scale: 0.95,
                    x: 30,
                  }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    x: 0,
                  }}
                  exit={{
                    opacity: 0,
                    scale: 0.95,
                    x: -30,
                  }}
                  transition={{
                    duration: 0.45,
                    ease: "easeOut",
                  }}
                  className="
                    relative
                    w-full
                    max-w-[320px]
                    md:max-w-[420px]
                    lg:max-w-[506px]
                    aspect-square
                  "
                >
                  <Image
                    src={current.image}
                    alt={current.title}
                    fill
                    priority
                    className="object-contain"
                    sizes="(max-width: 768px) 320px, (max-width: 1024px) 420px, 506px"
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}