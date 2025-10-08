"use client";

import React, { useMemo, useRef, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import localFont from "next/font/local";

/* ---------- КОНТАКТЫ (замени на реальные при необходимости) ---------- */
const WHATSAPP_URL = "https://wa.me/79281020772";
const TELEGRAM_URL = "https://t.me/edinayasreda";

/* ---------- КАСТОМНАЯ ИКОНКА БУРГЕРА (опционально) ---------- */
const BURGER_ICON_SRC = ""; // например: "/icons/burger.svg"

/* ---------- ЛОКАЛЬНЫЙ ШРИФТ GILROY ---------- */
const gilroy = localFont({
  src: [
    { path: "../../../public/fonts/gilroy/Gilroy-Regular.woff2", weight: "400", style: "normal" },
    { path: "../../../public/fonts/gilroy/Gilroy-Medium.woff2", weight: "500", style: "normal" },
    { path: "../../../public/fonts/gilroy/Gilroy-Semibold.woff2", weight: "600", style: "normal" },
    { path: "../../../public/fonts/gilroy/Gilroy-Bold.woff2", weight: "700", style: "normal" },
    { path: "../../../public/fonts/gilroy/Gilroy-Extrabold.woff2", weight: "800", style: "normal" },
  ],
  display: "swap",
});

/* -------------------- Утилиты -------------------- */
function Section({
  className = "",
  children,
  ...props
}: React.ComponentPropsWithoutRef<"section">) {
  return (
    <section className={`w-full ${className}`} {...props}>
      {children}
    </section>
  );
}
function Container({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8 ${className}`}>
      {children}
    </div>
  );
}

/* -------------------- КЕЙСЫ: слайдер (если понадобится) -------------------- */
type CaseItem = {
  id: number | string;
  title: string;
  textHtml: string;
};
function CaseCard({ title, textHtml }: CaseItem) {
  return (
    <article className="rounded-[26px] border border-[#EEF1F7] bg-white p-6 shadow-sm">
      <h3 className="text-[20px] font-extrabold text-[#142251]">{title}</h3>
      <div
        className="prose mt-3 max-w-none text-[14px] leading-relaxed text-[#6B7280] prose-p:my-2 prose-strong:font-extrabold prose-strong:text-[#474B57]"
        dangerouslySetInnerHTML={{ __html: textHtml }}
      />
    </article>
  );
}
function CaseSlider({ items }: { items: CaseItem[] }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [i, setI] = useState(0);
  const max = items.length - 1;

  const snapTo = (idx: number) => {
    const el = ref.current;
    if (!el) return;
    const target = Math.max(0, Math.min(max, idx));
    (el.children[target] as HTMLElement | undefined)?.scrollIntoView({
      behavior: "smooth",
      inline: "start",
      block: "nearest",
    });
    setI(target);
  };

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onScroll = () => {
      const slides = Array.from(el.children) as HTMLElement[];
      let closest = 0;
      let best = Infinity;
      const left = el.getBoundingClientRect().left;
      slides.forEach((s, idx) => {
        const dist = Math.abs(s.getBoundingClientRect().left - left);
        if (dist < best) {
          best = dist;
          closest = idx;
        }
      });
      setI(closest);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    onScroll();
    return () => {
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-70"
        style={{
          background:
            "radial-gradient(700px 450px at 80% 20%, rgba(39,119,255,0.08), transparent), radial-gradient(600px 600px at 20% 80%, rgba(33,56,135,0.06), transparent)",
        }}
      />
      <div
        ref={ref}
        className="flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-px-4 pb-2 [-ms-overflow-style:none] [scrollbar-width:none]"
        aria-roledescription="carousel"
        aria-label="Примеры внедрения"
      >
        <style jsx>{`div::-webkit-scrollbar { display: none; }`}</style>
        {items.map((it) => (
          <div key={it.id} className="snap-start shrink-0 basis-[100%] md:basis-[calc(50%-12px)]">
            <CaseCard {...it} />
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-end gap-3">
        <button
          onClick={() => snapTo(i - 1)}
          className="inline-grid h-10 w-10 place-items-center rounded-full border border-[#E6E9F2] bg-white text-[#2777ff] disabled:opacity-40"
          disabled={i <= 0}
          aria-label="Назад"
        >
          <span className="-mt-[2px] text-lg">←</span>
        </button>
        <button
          onClick={() => snapTo(i + 1)}
          className="inline-grid h-10 w-10 place-items-center rounded-full border border-[#E6E9F2] bg-white text-[#2777ff] disabled:opacity-40"
          disabled={i >= max}
          aria-label="Вперёд"
        >
          <span className="-mt-[2px] text-lg">→</span>
        </button>
      </div>
    </div>
  );
}

/* -------------------- Мобильное меню (ТОП-ШИТОК) -------------------- */
function TopSheetMenu({
  open,
  onClose,
  whatsappUrl,
  telegramUrl,
}: {
  open: boolean;
  onClose: () => void;
  whatsappUrl: string;
  telegramUrl: string;
}) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      {/* оверлей */}
      <div
        onClick={onClose}
        aria-hidden
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      {/* лист сверху */}
      <div
        role="dialog"
        aria-modal="true"
        className={`fixed left-0 right-0 top-0 z-50 mx-auto w-full max-w-[1200px] -translate-y-full transform transition-transform duration-300 ease-out ${
          open ? "!translate-y-0" : ""
        }`}
      >
        <div className="mx-4 mt-3 rounded-b-2xl border border-[#E6E9F2] bg-white shadow-2xl">
          {/* хедер меню */}
          <div className="flex items-center justify-between px-4 py-4">
            <span className="text-base font-extrabold text-[#142251]">Меню</span>
            <button
              onClick={onClose}
              className="grid h-9 w-9 place-items-center rounded-lg border border-[#E6E9F2] text-[#142251] transition hover:bg-[#f7f8fc]"
              aria-label="Закрыть меню"
            >
              ✕
            </button>
          </div>

          {/* контент меню */}
          <div className="max-h-[75vh] overflow-auto px-4 pb-6 pt-1">
            <div className="flex flex-col gap-4">
              {/* WhatsApp */}
              <Link
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onClose}
                className="group flex items-center gap-3 rounded-[14px] border border-[#E6E9F2] bg-[#f9faff] px-4 py-3 text-[#2777ff] transition hover:bg-[#f2f6ff]"
              >
                <Image src="/icons/whatsapp_blue.svg" alt="WhatsApp" width={20} height={20} />
                <span className="text-[15px] font-extrabold">открыть чат (WhatsApp)</span>
              </Link>

              {/* Telegram */}
              <Link
                href={telegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onClose}
                className="group flex items-center gap-3 rounded-[14px] border border-[#E6E9F2] bg-[#f9faff] px-4 py-3 text-[#2777ff] transition hover:bg-[#f2f6ff]"
              >
                <Image src="/icons/telegram_blue.svg" alt="Telegram" width={20} height={20} />
                <span className="text-[15px] font-extrabold">написать в Telegram</span>
              </Link>

              {/* email */}
              <a
                href="mailto:order@единаясреда.рф"
                onClick={onClose}
                className="flex items-center gap-3 rounded-[14px] border border-[#E6E9F2] bg-white px-4 py-3 text-[#2777ff] underline transition hover:bg-[#f7f8fc]"
              >
                <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-[#2777ff]/10 text-[#2777ff]">
                  ✉
                </span>
                order@единаясреда.рф
              </a>

              {/* CTA */}
              <Link
                href="#form"
                onClick={onClose}
                className="inline-flex items-center justify-center gap-2 rounded-[12px] bg-[#2777ff] px-4 py-3 text-white"
              >
                Оставить заявку{" "}
                <span className="grid h-5 w-5 place-items-center rounded-full bg-white text-[#2777ff]">+</span>
              </Link>

              {/* Быстрые ссылки */}
              <div className="mt-2 grid grid-cols-2 gap-3">
                <Link
                  href="#how"
                  onClick={onClose}
                  className="rounded-xl border border-[#E6E9F2] px-3 py-3 text-sm font-extrabold text-[#142251] hover:bg-[#f7f8fc]"
                >
                  Как это работает
                </Link>
                <Link
                  href="#cases"
                  onClick={onClose}
                  className="rounded-xl border border-[#E6E9F2] px-3 py-3 text-sm font-extrabold text-[#142251] hover:bg-[#f7f8fc]"
                >
                  Ситуации
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* -------------------- СЕКЦИЯ ЛОГОТИПОВ -------------------- */
/* На <lg (включая iPad)> — бегущая строка, на ≥lg — статичная полоса */
function SupportLogos() {
  const GAP_REM = 1.25; // интервал между логотипами (rem)

  return (
    <div className="mt-8">
      {/* <lg: бегущая строка */}
      <div className="lg:hidden">
        <p className="text-center text-base font-extrabold text-[#464545]">Разработано при поддержке:</p>

        <div className="relative mt-3 h-12 overflow-hidden rounded-[14px]">
          {/* затемнения слева/справа */}
          <div aria-hidden className="pointer-events-none absolute left-0 top-0 z-10 h-full w-10 bg-gradient-to-r from-white to-transparent" />
          <div aria-hidden className="pointer-events-none absolute right-0 top-0 z-10 h-full w-10 bg-gradient-to-l from-white to-transparent" />

          <div className="relative h-full">
            {/* Трек A */}
            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 flex min-w-max items-center"
              style={{
                gap: `calc(${GAP_REM}rem)`,
                animation: "logos-marquee-a 20s linear infinite",
              }}
            >
              <Image src="/img/logos/asi.svg" alt="АСИ" width={120} height={24} className="h-6 w-auto shrink-0" />
              <Image src="/img/logos/fasie.svg" alt="ФСИ" width={120} height={24} className="h-6 w-auto shrink-0" />
              <Image src="/img/logos/frii_logo.svg" alt="ФРИИ" width={120} height={24} className="h-6 w-auto shrink-0" />
              <Image src="/img/logos/mincifry.svg" alt="Минцифры" width={120} height={24} className="h-6 w-auto shrink-0" />
              <Image src="/img/logos/minstroy.svg" alt="Минстрой" width={120} height={24} className="h-6 w-auto shrink-0" />
              <Image src="/img/logos/myroots.svg" alt="MyRoots" width={120} height={24} className="h-6 w-auto shrink-0" />
            </div>

            {/* Трек B */}
            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 flex min-w-max items-center"
              style={{
                gap: `calc(${GAP_REM}rem)`,
                animation: "logos-marquee-b 20s linear infinite",
              }}
              aria-hidden="true"
            >
              <Image src="/img/logos/asi.svg" alt="" width={120} height={24} className="h-6 w-auto shrink-0" />
              <Image src="/img/logos/fasie.svg" alt="" width={120} height={24} className="h-6 w-auto shrink-0" />
              <Image src="/img/logos/frii_logo.svg" alt="" width={120} height={24} className="h-6 w-auto shrink-0" />
              <Image src="/img/logos/mincifry.svg" alt="" width={120} height={24} className="h-6 w-auto shrink-0" />
              <Image src="/img/logos/minstroy.svg" alt="" width={120} height={24} className="h-6 w-auto shrink-0" />
              <Image src="/img/logos/myroots.svg" alt="" width={120} height={24} className="h-6 w-auto shrink-0" />
            </div>
          </div>
        </div>

        <style jsx>{`
          @keyframes logos-marquee-a {
            0% {
              transform: translateX(0) translateY(-50%);
            }
            100% {
              transform: translateX(-100%) translateY(-50%);
            }
          }
          @keyframes logos-marquee-b {
            0% {
              transform: translateX(100%) translateY(-50%);
            }
            100% {
              transform: translateX(0) translateY(-50%);
            }
          }
          @media (prefers-reduced-motion: reduce) {
            :global([style*="logos-marquee-"]) {
              animation: none !important;
            }
          }
        `}</style>
      </div>

      {/* ≥lg: статичная строка */}
      <div className="relative hidden items-center gap-6 lg:flex">
        <span className="whitespace-nowrap text-base font-extrabold text-[#464545] md:text-xl">
          Разработано при поддержке:
        </span>
        <div className="flex flex-nowrap items-center gap-8 overflow-hidden">
          <Image src="/img/logos/asi.svg" alt="АСИ" width={130} height={28} className="h-7 w-auto shrink-0" />
          <Image src="/img/logos/fasie.svg" alt="ФСИ" width={130} height={28} className="h-7 w-auto shrink-0" />
          <Image src="/img/logos/frii_logo.svg" alt="ФРИИ" width={130} height={28} className="h-7 w-auto shrink-0" />
          <Image src="/img/logos/mincifry.svg" alt="Минцифры" width={130} height={28} className="h-7 w-auto shrink-0" />
          <Image src="/img/logos/minstroy.svg" alt="Минстрой" width={130} height={28} className="h-7 w-auto shrink-0" />
          <Image src="/img/logos/myroots.svg" alt="MyRoots" width={130} height={28} className="h-7 w-auto shrink-0" />
        </div>
      </div>
    </div>
  );
}

/* -------------------- СТРАНИЦА -------------------- */
export default function ImplementationsPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  // --- Bitrix: инициализация формы строго в секции #form ---
  useEffect(() => {
    if (document.getElementById("b24-loader-107")) return;

    const anchor = document.getElementById("b24-form-anchor");
    if (!anchor) return;

    const cfg = document.createElement("script");
    cfg.id = "b24-inline-107";
    cfg.setAttribute("data-b24-form", "inline/107/gixn3g");
    cfg.setAttribute("data-skip-moving", "true");

    cfg.innerHTML = `
      (function(w,d,u){
        var s=d.createElement('script'); s.async=true; s.id='b24-loader-107';
        s.src=u+'?'+(Date.now()/180000|0);
        var h=d.getElementById('b24-inline-107');
        (h.parentNode||d.body).insertBefore(s,h);
      })(window,document,'https://cdn-ru.bitrix24.ru/b32921504/crm/form/loader_107.js');
    `;

    anchor.parentNode?.insertBefore(cfg, anchor);
  }, []);

  const CASES = useMemo<CaseItem[]>(
    () => [
      {
        id: 1,
        title: "Уборка снега в небольшом городе",
        textHtml: `
          <p><strong>Предыстория:</strong> Зимние осадки, жалобы жителей, отчёты подрядчика «на бумаге».</p>
          <p><strong>Проблема:</strong> Нет способа быстро проверить факт уборки.</p>
          <p><strong>Решение:</strong> «Единая Среда»: отметка участков, фото, время, карта.</p>
          <p><strong>Результат:</strong> Жалобы ↓ 70%, приёмка быстрее и прозрачнее.</p>
        `,
      },
      {
        id: 2,
        title: "Контроль сезонных работ ЖКХ",
        textHtml: `
          <p><strong>Предыстория:</strong> Срывы сроков, Excel-учёт.</p>
          <p><strong>Решение:</strong> Чек-листы, журнал действий, единая карта объектов.</p>
          <p><strong>Результат:</strong> Сроки стабилизировались, спорных ситуаций стало меньше.</p>
        `,
      },
      {
        id: 3,
        title: "Учёт зелёных насаждений",
        textHtml: `
          <p><strong>Решение:</strong> Паспорт объектов с геометками, фото и задачами ухода.</p>
          <p><strong>Результат:</strong> Планирование и закупки стали точнее.</p>
        `,
      },
      {
        id: 4,
        title: "Лесоустройство и противопожарные мероприятия",
        textHtml: `
          <p><strong>Решение:</strong> Карта минерализованных полос, заявок, патрулей.</p>
          <p><strong>Результат:</strong> Быстрая оценка готовности и закрытие рисков.</p>
        `,
      },
      {
        id: 5,
        title: "Контроль дорожного ремонта",
        textHtml: `
          <p><strong>Решение:</strong> Фото/видео этапов с привязкой к смете и срокам.</p>
          <p><strong>Результат:</strong> Прозрачность актов, меньше претензий.</p>
        `,
      },
    ],
    []
  );

  return (
    <main className={`${gilroy.className} bg-white overflow-x-hidden`}>
      {/* ---------- ХЕДЕР ---------- */}
      <header className="w-full">
        <Container>
          <div className="relative grid grid-cols-[1fr_auto_1fr] items-center">
            {/* Левая область (десктоп) */}
            <div className="hidden items-center justify-start sm:flex">
              <div className="inline-flex items-center gap-3 rounded-[100px] bg-[#f2f3f8] px-4 py-2 text-[#2777ff]">
                <Link
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-2 text-sm font-extrabold lowercase"
                  aria-label="открыть чат в WhatsApp"
                  title="Открыть чат в WhatsApp"
                >
                  <Image src="/icons/whatsapp_blue.svg" alt="WhatsApp" width={16} height={16} />
                  открыть чат
                </Link>
                <span className="h-5 w-px bg-[#e4e7f1]" />
                <a href="mailto:order@единаясреда.рф" className="text-sm font-extrabold lowercase underline">
                  order@единаясреда.рф
                </a>
              </div>
            </div>

            {/* Центр: ЛОГО */}
            <div className="flex items-stretch justify-center">
              <a
                href="/"
                className="inline-flex items-center gap-2 rounded-b-xl bg-[#2777ff] px-5 py-3"
                aria-label="На главную"
              >
                <img src="/img/logo.svg" width={120} height={36} alt="единая среда.рф" className="h-9 w-auto" />
                <span className="sr-only">единая среда.рф</span>
              </a>
            </div>

            {/* Правая область (десктоп): CTA */}
            <div className="hidden items-center justify-end sm:flex">
              <a href="#form" className="inline-flex items-center gap-2 rounded-[12px] bg-[#2777ff] px-4 py-2 text-white">
                Оставить заявку
                <span className="grid h-5 w-5 place-items-center rounded-full bg-white text-[#2777ff]">+</span>
              </a>
            </div>

            {/* Бургер (мобилка) */}
            <button
              onClick={() => setMenuOpen(true)}
              className="absolute right-0 top-0 grid h-10 w-10 place-items-center rounded-lg border border-[#E6E9F2] text-[#142251] shadow-sm transition hover:bg-[#f7f8fc] sm:hidden"
              aria-label="Открыть меню"
              aria-haspopup="dialog"
              aria-expanded={menuOpen}
              style={{ transform: "translateY(8px)" }}
            >
              {BURGER_ICON_SRC ? (
                <Image src={BURGER_ICON_SRC} alt="menu" width={18} height={18} />
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                  <rect x="3" y="6" width="18" height="2" rx="1" fill="currentColor" />
                  <rect x="3" y="11" width="18" height="2" rx="1" fill="currentColor" />
                  <rect x="3" y="16" width="18" height="2" rx="1" fill="currentColor" />
                </svg>
              )}
            </button>
          </div>
        </Container>
      </header>

      {/* Мобильное меню — ТОП-ШИТОК */}
      <TopSheetMenu open={menuOpen} onClose={() => setMenuOpen(false)} whatsappUrl={WHATSAPP_URL} telegramUrl={TELEGRAM_URL} />

      {/* ---------- Контент ---------- */}

      {/* H1 */}
      <Section className="pb-6 pt-6 md:pt-8">
        <Container>
          <h1 className="text-center text-[34px] font-extrabold leading-tight text-[#2D2D2D] md:text-[54px]">
            Единая среда — эффективный инструмент{" "}
            <span className="text-[#2777ff]">управления и контроля подрядчиков</span>
          </h1>
        </Container>
      </Section>

      {/* Лента логотипов поддержки */}
      <Section>
        <Container>
          <SupportLogos />
        </Container>
      </Section>

      {/* Как это работает — карточки с изображениями, без клика */}
      <Section id="how" className="py-12">
        <Container>
          <div className="rounded-[32px] bg-[#F3F6F9] p-5 md:rounded-[40px] md:p-8 lg:p-10">
            <h2 className="text-left text-[34px] font-extrabold leading-[1] text-[#464545] sm:text-[48px] md:text-[64px]">
              Как это работает
            </h2>

            {(() => {
              const STEPS = [
                { text: "Быстрое внедрение системы, всего за один день", img: "/icons/how1.svg", alt: "Внедрение" },
                { text: "Включение в контракт АИС \"Единая среда\"", img: "/icons/how2.svg", alt: "Включение в контракт" },
                { text: "Внесение данных Подрядчиком в систему.", img: "/icons/how3.svg", alt: "Внесение данных" },
                { text: "Контроль добросовестности исполнения контракта.", img: "/icons/how4.svg", alt: "Контроль" },
                {
                  text: "При выявлении некачественного исполнения — организация претензионных работ",
                  img: "/icons/how5.svg",
                  alt: "Претензионные работы",
                },
                {
                  text: "Устранение нарушений Подрядчиком с фиксацией добросовестности",
                  img: "/icons/how6.svg",
                  alt: "Устранение нарушений",
                },
              ];

              const TopImage = ({ src, alt }: { src: string; alt: string }) => (
                <div className="rounded-[20px] bg-[#F3F6F9] p-3 md:p-4">
                  <div className="flex h-[96px] items-center justify-center overflow-hidden rounded-[12px] md:h-[110px]">
                    <Image
                      src={src}
                      alt={alt}
                      width={320}
                      height={220}
                      className="h-full w-auto object-contain"
                      sizes="(max-width: 768px) 100vw, 33vw"
                      quality={90}
                    />
                  </div>
                </div>
              );

              return (
                <>
                  {/* 3×2 карточки */}
                  <div className="mt-6 grid gap-4 sm:gap-5 md:mt-8 md:grid-cols-3">
                    {STEPS.map((s, idx) => (
                      <article key={idx} className="rounded-[22px] bg-white p-4 sm:p-5 md:rounded-[28px] md:p-6">
                        <TopImage src={s.img} alt={s.alt} />
                        <p className="mt-4 text-[16px] font-extrabold leading-snug text-[#2E2E2E] md:text-[18px]">
                          {s.text}
                        </p>
                      </article>
                    ))}
                  </div>

                  {/* Нижняя длинная карточка */}
                  <div className="mt-6 grid gap-4 sm:gap-5 md:mt-8">
                    <article className="rounded-[22px] bg-white p-4 sm:p-5 md:rounded-[28px] md:p-6">
                      {/* < md — обычная карточка */}
                      <div className="md:hidden">
                        <div className="rounded-[20px] bg-[#F3F6F9] p-3 md:p-4">
                          <div className="flex h-[96px] items-center justify-center overflow-hidden rounded-[12px] md:h-[110px]">
                            <Image
                              src="/icons/how7.svg"
                              alt="Результат"
                              width={320}
                              height={220}
                              className="h-full w-auto object-contain"
                              sizes="(max-width: 768px) 100vw"
                              quality={90}
                            />
                          </div>
                        </div>
                        <p className="mt-4 text-[16px] font-extrabold leading-snug text-[#2E2E2E] md:text-[18px]">
                          Качественное исполнение контракта в срок и полное соблюдение технического задания.
                        </p>
                      </div>

                      {/* ≥ md — текст слева + серый блок с изображением справа */}
                      <div className="hidden items-start gap-6 md:flex">
                        <div className="min-w-0 flex-1">
                          <p className="text-[18px] font-extrabold leading-snug text-[#2E2E2E]">
                            Качественное исполнение контракта в срок и полное соблюдение технического задания.
                          </p>
                        </div>
                        <div className="w-[320px] shrink-0">
                          <div className="rounded-[20px] bg-[#F3F6F9] p-4">
                            <div className="flex h-[110px] items-center justify-center overflow-hidden rounded-[12px]">
                              <Image
                                src="/icons/how7.svg"
                                alt="Результат"
                                width={360}
                                height={240}
                                className="h-full w-auto object-contain"
                                sizes="320px"
                                quality={90}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </article>
                  </div>
                </>
              );
            })()}
          </div>
        </Container>
      </Section>

      {/* Ситуации (3 большие изображения, без открытия по клику) */}
      <Section id="cases" className="bg-[#F3F6F9] py-14">
        <Container>
          <h2 className="mb-6 text-[42px] font-extrabold text-[#2777ff] md:text-[54px]">Ситуации</h2>

          <div className="grid gap-6 md:grid-cols-3">
            {/* item 1 */}
            <div className="rounded-[28px] bg-white p-2 shadow-sm md:rounded-[32px]">
              <Image
                src="/img/primer1.webp"
                alt="Ситуация 1"
                width={1400}
                height={1050}
                className="h-auto w-full rounded-[24px] md:rounded-[28px]"
                sizes="(max-width: 768px) 100vw, 33vw"
                quality={95}
                priority
              />
            </div>

            {/* item 2 */}
            <div className="rounded-[28px] bg-white p-2 shadow-sm md:rounded-[32px]">
              <Image
                src="/img/primer2.webp"
                alt="Ситуация 2"
                width={1400}
                height={1050}
                className="h-auto w-full rounded-[24px] md:rounded-[28px]"
                sizes="(max-width: 768px) 100vw, 33vw"
                quality={95}
              />
            </div>

            {/* item 3 */}
            <div className="rounded-[28px] bg-white p-2 shadow-sm md:rounded-[32px]">
              <Image
                src="/img/primer3.webp"
                alt="Ситуация 3"
                width={1400}
                height={1050}
                className="h-auto w-full rounded-[24px] md:rounded-[28px]"
                sizes="(max-width: 768px) 100vw, 33vw"
                quality={95}
              />
            </div>
          </div>
        </Container>
      </Section>

      {/* Форма (Bitrix24) */}
      <Section id="form" className="py-16">
        <Container>
          <h2 className="text-center text-[42px] font-extrabold text-[#2777ff] md:text-[64px]">Попробуй сейчас</h2>

          <div id="b24-form-wrapper" className="mx-auto mt-10 max-w-[760px] rounded-[20px] bg-white p-4 md:p-6">
            <div id="b24-form-anchor" />
          </div>

          <noscript>
            <p className="text-center text-sm text-gray-500">Для отправки формы включите JavaScript.</p>
          </noscript>
        </Container>
      </Section>

      {/* Нижняя полоска */}
      <div className="mx-auto h-px max-w-[1920px] bg-[#E4E7F1]" />

      {/* Футер */}
      <Section className="py-6">
        <Container>
          <div
            className="
              grid grid-cols-1 items-center gap-6 text-[#979db1]
              sm:grid-cols-2
              lg:grid-cols-[1fr_auto]
            "
          >
            <div className="flex flex-wrap items-center justify-center gap-4 sm:justify-start">
              <Link
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 rounded-[100px] border border-[#afb4c4] px-4 py-2 transition hover:bg-[#f7f8fc]"
                aria-label="Написать в WhatsApp"
              >
                <Image src="/icons/whatsapp_blue.svg" alt="WhatsApp" width={24} height={24} />
                <span className="text-[18px] font-bold lowercase text-[#2777ff] group-hover:underline">whatsapp</span>
              </Link>

              <Link
                href={TELEGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 rounded-[100px] border border-[#afb4c4] px-4 py-2 transition hover:bg-[#f7f8fc]"
                aria-label="Написать в Telegram"
              >
                <Image src="/icons/telegram_blue.svg" alt="Telegram" width={24} height={24} />
                <span className="text-[18px] font-bold lowercase text-[#2777ff] group-hover:underline">telegram</span>
              </Link>

              <a className="inline-flex items-center gap-2 rounded-[100px] border border-[#afb4c4] px-4 py-2 transition hover:bg-[#f7f8fc]" href="mailto:order@единаясреда.рф">
                <span className="text-[18px] font-extrabold lowercase text-[#2777ff] underline">order@единаясреда.рф</span>
              </a>
            </div>

            <div className="flex flex-col items-center gap-2 sm:items-end">
              <Link href="/documents" className="font-extrabold underline">
                Политика конфиденциальности
              </Link>
              <span>© 2025 Все права защищены</span>
            </div>
          </div>
        </Container>
      </Section>
    </main>
  );
}
