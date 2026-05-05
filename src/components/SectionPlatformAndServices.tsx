"use client";
import React, { useRef, useState } from "react";
import Image from "next/image";
import { motion, useReducedMotion, useScroll, useTransform, spring } from "framer-motion";
import { useModal } from "./ModalProvider";

/* ------------------ UI bits ------------------ */

// Чипы в бегущей строке
const Chip: React.FC<{ label: string }> = ({ label }) => (
  <div className="inline-flex items-center gap-4 rounded-3xl px-3 py-2 whitespace-nowrap bg-white/15 hover:bg-white/25 transition-colors">
    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white text-[#029cda] text-[13px] leading-7">#</span>
    <span className="text-white text-sm md:text-[15px] leading-6">{label}</span>
  </div>
);

// Квадрат с иконкой: прозрачный фон + серая обводка
const IconSquareOutlined: React.FC<{ icon?: string; alt?: string; className?: string }> = ({
  icon,
  alt = "",
  className = "",
}) => (
  <div
    className={`flex h-12 w-12 items-center justify-center rounded-xl border border-gray-200 bg-white ${className}`}
    aria-hidden={!alt}
  >
    {icon ? <Image src={icon} alt={alt} width={24} height={24} className="h-6 w-6 object-contain" /> : <div className="h-6 w-6" />}
  </div>
);

/* Карточка для двух правых блоков — без серой обводки на hover */
const Card: React.FC<{
  title: string;
  text: string;
  icon?: string;
  iconAlt?: string;
  className?: string;
}> = ({ title, text, icon, iconAlt = "", className = "" }) => (
  <div className={`relative rounded-2xl bg-white p-6 lg:p-7 transition-transform ${className}`}>
    <div className="flex items-start justify-between">
      <h3 className="text-[17px] md:text-[19px] font-medium leading-snug text-black max-w-[80%]">{title}</h3>
      <div className="min-w-12">
        <IconSquareOutlined icon={icon} alt={iconAlt} />
      </div>
    </div>
    <p className="mt-3.5 text-[15px] md:text-base leading-7 text-gray-600">{text}</p>
  </div>
);

/* ServiceCard с иконкой и кнопкой в вашем стиле */
const ServiceCard: React.FC = () => (
  <div className="rounded-2xl bg-white p-6 lg:p-7">
    <div className="flex items-start justify-between">
      <h3 className="text-[17px] md:text-[19px] font-medium leading-snug text-black">Инвентаризация и сопровождение</h3>
      <div className="min-w-12">
        <IconSquareOutlined icon="/icons/magic.svg" alt="Сервис" />
      </div>
    </div>
    <p className="mt-3.5 text-[15px] md:text-base leading-7 text-gray-600">
      Мы не просто предлагаем систему, но и предоставляем полный цикл услуг по инвентаризации объектов. Кроме того, мы
      обеспечиваем сопровождение, регулярное обновление и поддержку пользователей, помогая эффективно управлять городской
      средой.
    </p>

    <a href="/services" className="group mt-5 inline-flex">
      <span className="inline-flex items-center justify-center self-start px-6 py-3 bg-[#F6F7F9] text-black text-lg font-medium rounded-xl border border-transparent group-hover:outline-1 group-hover:outline-[#029cda]">
        Подробнее
      </span>
    </a>
  </div>
);

/* ------------------ Бегущая строка с краевой маской ------------------ */
const Marquee: React.FC<{ items: string[]; direction?: "left" | "right"; fadeEdgePx?: number }> = ({
  items,
  direction = "left",
  fadeEdgePx = 56,
}) => {
  const reduce = useReducedMotion();
  const maskStyle: React.CSSProperties = {
    WebkitMaskImage: `linear-gradient(90deg, rgba(0,0,0,0) 0px, #000 ${fadeEdgePx}px, #000 calc(100% - ${fadeEdgePx}px), rgba(0,0,0,0) 100%)`,
    maskImage: `linear-gradient(90deg, rgba(0,0,0,0) 0px, #000 ${fadeEdgePx}px, #000 calc(100% - ${fadeEdgePx}px), rgba(0,0,0,0) 100%)`,
  };

  return (
    <div className="relative overflow-hidden w-full" style={maskStyle}>
      <motion.div
        className="flex gap-3 md:gap-4 whitespace-nowrap pr-3"
        animate={reduce ? undefined : { x: direction === "left" ? ["0%", "-100%"] : ["-100%", "0%"] }}
        transition={reduce ? undefined : { repeat: Infinity, duration: 28, ease: "linear" }}
      >
        {[...items, ...items].map((label, idx) => (
          <Chip key={idx} label={label} />
        ))}
      </motion.div>
    </div>
  );
};

/* --------------- БЕЛАЯ ПАНЕЛЬ 80% с изображением (DESKTOP) --------------- */
const RevealPanel: React.FC<{
  src: string;
  isOpen: boolean;
  onConsult: () => void;
  handleSize?: number;
}> = ({ src, isOpen, onConsult, handleSize = 24 }) => {
  const reduce = useReducedMotion();
  const panelTransition = reduce ? { duration: 0 } : { type: spring, stiffness: 260, damping: 26 };
  const closedY = `calc(100% - ${handleSize / 2}px)`; // показываем половину круга

  return (
    <motion.div
      initial={false}
      animate={{ y: isOpen ? 0 : closedY }}
      transition={panelTransition}
      className="hidden md:block absolute inset-x-0 bottom-0 z-30 h-[76%] rounded-t-2xl overflow-hidden bg-white"
      style={{ willChange: "transform" }}
    >
      <div className="relative h-auto w-auto p-1">
        {/* Изображение: в открытом состоянии 100% opacity, в закрытом 0 */}
        <motion.img
          src={src}
          alt="Превью интерфейса"
          className="h-auto w-auto object-cover"
          loading="lazy"
          initial={false}
          animate={{ opacity: isOpen ? 1 : 0 }}
          transition={{ duration: reduce ? 0 : 0.18 }}
        />

        {/* CTA: открывает модалку консультации */}
        <motion.div
          className="absolute inset-x-0 bottom-0 flex items-center justify-center p-5"
          initial={false}
          animate={{ opacity: isOpen ? 1 : 0 }}
          transition={{ duration: reduce ? 0 : 0.18, delay: reduce ? 0 : 0.05 }}
        >
          <button
            type="button"
            onClick={onConsult}
            className="open-consult-modal inline-flex items-center justify-center rounded-xl px-24 py-3 text-[15px] md:text-base font-medium bg-[#029cda] text-white hover:bg-[#029cda]/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#029cda]"
          >
            Получить консультацию
          </button>
        </motion.div>

        {/* Белый круг-хэндл — только когда панель скрыта */}
        {!isOpen && (
          <div
            className="absolute left-1/2 -translate-x-1/2 -top-[12px] rounded-full bg-white shadow-[0_1px_4px_rgba(0,0,0,0.08)]"
            style={{ width: handleSize, height: handleSize }}
            aria-hidden
          />
        )}
      </div>
    </motion.div>
  );
};

/* --------------- Параллакс-изображение справа-середины (DESKTOP) --------------- */
const ParallaxFloatImage: React.FC<{
  containerRef: React.RefObject<HTMLDivElement | null>; // допускаем null
  src: string;
  isHover?: boolean;
  baseOpacity?: number;
  hoverOpacity?: number;
}> = ({ containerRef, src, isHover = false, baseOpacity = 0.55, hoverOpacity = 0.8 }) => {
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [-8, 8]);

  const styleObj: React.CSSProperties = {
    WebkitMaskImage: "linear-gradient(180deg, rgba(0,0,0,0) 0%, #000 18%, #000 82%, rgba(0,0,0,0) 100%)",
    maskImage: "linear-gradient(180deg, rgba(0,0,0,0) 0%, #000 18%, #000 82%, rgba(0,0,0,0) 100%)",
  };

  return (
    <motion.img
      src={src}
      alt=""
      aria-hidden
      style={{ y, ...styleObj }}
      initial={{ opacity: baseOpacity }}
      animate={{ opacity: isHover ? hoverOpacity : baseOpacity }}
      transition={{ duration: 0.25 }}
      className="
        hidden md:block
        pointer-events-none absolute top-2/5 -translate-y-1/3 right-4 md:right-8
        w-[60%] max-w-[520px] rounded-2xl mix-blend-screen
      "
    />
  );
};

/* ------------------ MAIN SECTION ------------------ */

const SectionPlatformAndServices: React.FC = () => {
  const chips = [
    "места погребения",
    "зеленые насаждения",
    "городские леса",
    "Элементы благоустройства",
    "Места складирования отходов",
    "Особо охраняемые природные территории",
    "места размещения НТО",
    "места накопленного ущерба",
    "Рекламные конструкции",
  ];

  const { openConsult } = useModal();
  const [openPreview, setOpenPreview] = useState(false);
  const leftRef = useRef<HTMLDivElement | null>(null);

  return (
    <section className="mx-auto w-full max-w-[1480px] px-4 py-8 lg:py-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-4">
        {/* Левая большая карточка (синяя) */}
        <motion.div
          ref={leftRef}
          className="relative rounded-2xl bg-[#029cda] p-6 lg:p-8 overflow-hidden"
          onMouseEnter={() => setOpenPreview(true)}
          onMouseLeave={() => setOpenPreview(false)}
          onFocus={() => setOpenPreview(true)}
          onBlur={() => setOpenPreview(false)}
        >
          <h2 className="mb-3.5 max-w-[660px] text-2xl md:text-[32px] font-semibold leading-tight text-white">
            Единая цифровая платформа для муниципалитетов и подрядчиков
          </h2>
          <p className="max-w-[740px] text-base md:text-lg leading-7 text-white/90">
            «Единая Среда» — это комплексная ГИС-система, объединяющая все данные об объектах городской инфраструктуры.
          </p>

          {/* Параллакс-изображение справа-середины (desktop) */}
          <ParallaxFloatImage
            containerRef={leftRef}
            src="/img/float_ui.webp"
            isHover={openPreview}
            baseOpacity={0.55}
            hoverOpacity={0.8}
          />

          {/* Бегущие чипы:
              - на md+: прижаты к низу (absolute)
              - на мобилке: в потоке после текста (не перекрывают) */}
          <div className="md:absolute md:inset-x-0 md:bottom-0 z-20 md:p-4 md:pt-0 mt-6">
            <div className="space-y-3.5">
              <Marquee items={chips} direction="left" />
              <Marquee items={chips} direction="right" />
            </div>
          </div>

          {/* Белая панель 80% (только desktop) */}
          <RevealPanel
            src="/img/platform_shot.webp"
            isOpen={openPreview}
            onConsult={openConsult}
            handleSize={24}
          />
        </motion.div>

        {/* Правый столбец */}
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card
              title="Онлайн-контроль"
              text="Система позволяет контролировать работу подрядчиков в режиме онлайн: проверять соответствие работ, принимать или отклонять результаты прямо из кабинета."
              icon="/icons/eye_ blue.svg"
              iconAlt="Онлайн-контроль"
            />
            <Card
              title="Аналитика"
              text="Формирование актов, справок и аналитических отчётов происходит автоматически. Это исключает ошибки, экономит время и повышает прозрачность процессов."
              icon="/icons/analitics_blue.svg"
              iconAlt="Аналитика"
            />
          </div>
          <ServiceCard />
        </div>
      </div>
    </section>
  );
};

export default SectionPlatformAndServices;
