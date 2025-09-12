"use client";
import React from "react";
import Layout from "@/components/Layout";
import { useModal } from "@/components/ModalProvider";
import Image from "next/image";
import Link from "next/link";

export default function ServicesPage() {
  // Достаём модалки; если openKP нет в типах — безопасно вызовем через any.
  const modal = useModal() as any;
  const handleOpenKP = () => {
    if (typeof modal?.openKP === "function") modal.openKP();
    else if (typeof modal?.openConsult === "function") modal.openConsult();
  };
  const handleOpenConsult = () => modal?.openConsult?.();

  // Единый стиль заголовков/текста — совпадает со страницей партнёрства
  const headingBase = "font-medium leading-[1.15]";
  const headingColor = "text-[#101828]";
  const paragraphMuted = "text-[#667085]";

  // Карточки услуг (поле icon оставлено, но не используется в UI)
  const services = [
    {
      icon: "/icons/document_list_outline_28.svg",
      title: "Оцифровка мест захоронений",
      desc:
        "Создание точного реестра, схема участков, поиск онлайн. Поддержка инвентаризации, оплат и публикации на портале.",
      href: "/services/inventory-burials",
      image: "/img/услуга_имз.png",
    },
    {
      icon: "/icons/users_outline_28.svg",
      title: "Инвентаризация зелёных насаждений",
      desc:
        "Паспортизация деревьев и кустарников, учёт работ (КР/ТР), планирование агротехмероприятий, визуализации и отчётность.",
      href: "/services/green-inventory",
      image: "/img/услуга_изн.png",
    },
    {
      icon: "/icons/archive_outline_28.svg",
      title: "Лесоустройство",
      desc:
        "Учёт выделов, мероприятия, мониторинг. Мобильные обходы, офлайн-режим и последующая синхронизация с хранилищем.",
      href: "/services/forest-management",
      image: "/img/услуга_лес.png",
    },
  ];

  const benefits = [
    { icon: "/icons/education_outline_28.svg", text: "Огромный опыт в отрасли и  своя уникальная методология работы " },
    { icon: "/icons/coins_outline_28.svg", text: "Прозрачные бюджеты и прогнозируемые сроки" },
    { icon: "/icons/user_outline_28.svg", text: "Современное оборудование. RTK-точность, мобильные комплексы и актуальный софт — быстро и достоверно." },
    { icon: "/icons/user_switch_outline_28.svg", text: "Квалифицированные специалисты. ГИС-инженеры, полевые группы, аналитики данных." },
    { icon: "/icons/document_list_outline_28.svg", text: "Собственная платформа «Единая Среда». Безопасное хранение данных, аналитика, отчеты." },
    { icon: "/icons/vw_active_outline_28.svg", text: "Поддержка и обучение. Документация, обучение команд" },
  ];

  return (
    <Layout>
      <div className="min-h-screen">

        {/* HERO — минимализм: слева текст и кнопки, справа изображение */}
        <section className="bg-black text-white rounded-b-[20px] relative overflow-hidden min-h-[420px]">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-20 relative z-10">
            <div className="relative flex flex-col lg:flex-row items-center lg:items-stretch gap-16">
              {/* Лево */}
              <div className="flex-1 lg:basis-3/5 text-left flex flex-col justify-center z-20">
                <h1 className={`text-4xl sm:text-5xl md:text-[72px] ${headingBase}`}>
                  Услуги
                </h1>
                <p className="mt-8 text-xl sm:text-[27px] text-grey-92 max-w-2xl">
                  Простые и надёжные решения для цифрового управления территориями и объектами — от оцифровки и инвентаризации до интеграций и сопровождения.
                </p>
                <div className="mt-10 flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={handleOpenKP}
                    className="inline-flex items-center justify-center bg-[#0077FF] text-white font-semibold px-8 py-4 rounded-xl hover:bg-[#0062D8] transition-colors"
                  >
                    Запросить КП
                  </button>
                  <a
                    href="#catalog"
                    className="inline-flex items-center justify-center border border-white/30 text-white px-8 py-4 rounded-xl hover:bg-white hover:text-black transition-colors"
                  >
                    Каталог услуг
                  </a>
                </div>
              </div>

              {/* Право — изображение (на мобиле уходит вниз) */}
              <div className="flex-1 w-full h-full relative flex justify-center items-end lg:hidden z-10">
                <img
                  src="/img/price.png" // при желании замените на /img/services-hero.png
                  alt="Иллюстрация услуг"
                  className="w-full max-w-[520px] object-contain"
                  style={{ height: "auto" }}
                />
              </div>
            </div>

            {/* Картинка справа на десктопе */}
            <div className="hidden lg:block absolute right-0 bottom-0 z-10 w-[40%] max-w-[620px] h-auto pointer-events-none">
              <img
                src="/img/price.png"
                alt="Иллюстрация услуг"
                className="w-full object-contain"
                style={{ height: "auto" }}
              />
            </div>
          </div>
        </section>

        {/* КАТАЛОГ УСЛУГ — карточки с изображением сверху и аккуратным ховером */}
        <section id="catalog" className="max-w-[1400px] mx-auto mt-8 px-2 py-2">
          {/* Заголовок/подзаголовок как в примере */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-12">
            <h2 className="text-4xl text-black font-medium text-left">Каталог услуг</h2>
            <div className="text-black text-xl max-w-xl">
              Выберите нужную услугу — и оставьте заявку или проконсультируйтесь с нашими менеджерами.
            </div>
          </div>

          {/* Сетка карточек */}
          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* “Единая среда” — первая карточка */}
            <div className="bg-white rounded-4xl p-3 md:p-4 h-auto flex flex-col gap-2 transition-all duration-300 hover:ring-1 hover:ring-[#0077FF] hover:ring-offset-2 hover:ring-offset-grey-97">
              <Image
                src="/img/ес.svg"
                alt="Единая среда"
                width={360}
                height={360}
                className="object-contain max-w-[100%] max-h-[100%] mr-4"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
              />
              <div className="flex flex-col justify-center h-full pl-2 md:pl-4">
                <div className="mb-2 text-center md:text-left">
                  <h3 className="text-xl font-medium text-black">Единая среда</h3>
                </div>
                <p className="text-base text-gray-500 text-center md:text-left mx-auto md:mx-0 mb-4">
                  Платформа для цифрового управления территориями, автоматизации процессов и аналитики для организаций любого масштаба.
                </p>
                <div className="flex flex-col gap-2 w-full mt-auto">
                  <Link
                    href="/"
                    className="w-full bg-gray-100 text-gray-700 font-medium py-2 rounded-xl text-base hover:bg-gray-200 transition-colors text-center inline-flex items-center justify-center"
                  >
                    Подробнее о системе
                  </Link>
                  <button
                    onClick={handleOpenKP}
                    className="w-full bg-white text-[#0077FF] border border-[#0077FF] hover:bg-[#0077FF]/10 font-bold py-2 rounded-xl text-base transition-colors"
                  >
                    Оставить заявку
                  </button>
                </div>
              </div>
            </div>

            {/* Остальные карточки — без иконок в заголовке */}
            {services.map((s, i) => (
              <div
                key={i}
                className="bg-white rounded-4xl p-3 md:p-4 h-auto flex flex-col gap-2 transition-all duration-300 hover:ring-1 hover:ring-[#0077FF] hover:ring-offset-2 hover:ring-offset-grey-97"
              >
                {/* Изображение услуги */}
                <Image
                  src={s.image}
                  alt={s.title}
                  width={360}
                  height={360}
                  className="object-contain max-w-[100%] max-h-[100%] mr-4"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                />

                {/* Текстовый блок */}
                <div className="flex flex-col justify-center h-full pl-2 md:pl-4">
                  {/* ТОЛЬКО заголовок — без иконки */}
                  <div className="mb-2 text-center md:text-left">
                    <h3 className="text-xl font-medium text-black">{s.title}</h3>
                  </div>

                  <p className="text-base text-gray-500 text-center md:text-left mx-auto md:mx-0 mb-4">
                    {s.desc}
                  </p>

                  <div className="flex flex-col gap-2 w-full mt-auto">
                    <Link
                      href={s.href}
                      className="w-full bg-gray-100 text-gray-700 font-medium py-2 rounded-xl text-base hover:bg-gray-200 transition-colors text-center"
                    >
                      Подробнее об услуге
                    </Link>

                    <button
                      onClick={handleOpenKP}
                      className="w-full bg-white text-[#0077FF] border border-[#0077FF] hover:bg-[#0077FF]/10 font-bold py-2 rounded-xl text-base transition-colors"
                    >
                      Оставить заявку
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Общая кнопка под сеткой */}
          <div className="flex justify-center mt-10">
            <button
              onClick={handleOpenKP}
              className="px-5 py-3.5 bg-[#0077FF] text-white text-lg font-medium rounded-xl hover:bg-[#0077FF]/90 transition-colors"
            >
              Обсудить проект
            </button>
          </div>
        </section>

        {/* Почему выбирают нас */}
        <section className="py-16 md:py-24 bg-[#F6F7F9]">
          <div className="max-w-[1480px] mx-auto px-5 md:px-8">
            <h2 className={`text-3xl md:text-4xl lg:text-[48px] text-center mb-10 ${headingBase} ${headingColor}`}>
              Почему выбирают нас
            </h2>

            <div className="rounded-3xl border border-[#E5E7EB] bg-white p-5 md:p-6 relative overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-3 md:grid-rows-2 gap-8 relative">
                {/* Разделители на md+ */}
                <div className="hidden md:block absolute left-0 right-0 top-1/2 h-px bg-[#E5E7EB]" />
                <div className="hidden md:block absolute top-0 bottom-0 left-1/3 w-px bg-[#E5E7EB]" />
                <div className="hidden md:block absolute top-0 bottom-0 left-2/3 w-px bg-[#E5E7EB]" />

                {benefits.map((b, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="inline-flex w-12 h-12 rounded-lg bg-[#0077FF] items-center justify-center shrink-0">
                      <Image src={b.icon} alt="" width={20} height={20} />
                    </span>
                    <p className="text-[18px] leading-7 text-[#101828]">{b.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>



        {/* Минималистичный CTA: слева текст+кнопки, справа картинка */}
        <section className="py-16 md:py-24 bg-[#F6F7F9]">
          <div className="max-w-[1480px] mx-auto px-5 md:px-8">
            <div className="rounded-3xl border border-[#E5E7EB] bg-white overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-2">
                {/* Лево */}
                <div className="p-8 md:p-12 flex flex-col justify-center">
                  <h2 className={`text-3xl md:text-4xl lg:text-5xl mb-4 ${headingBase} ${headingColor}`}>
                    Готовы обсудить задачу?
                  </h2>
                  <p className={`text-lg md:text-xl ${paragraphMuted} mb-8 max-w-xl`}>
                    Оставьте заявку — предложим варианты запуска и подготовим смету с этапами работ.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button
                      onClick={handleOpenKP}
                      className="bg-[#0077FF] text-white px-8 py-4 rounded-xl font-semibold hover:bg-[#0062D8] transition-colors"
                    >
                      Запросить КП
                    </button>
                    <a
                      href="mailto:hello@edinayasreda.ru"
                      className="px-8 py-4 rounded-xl border border-[#0077FF] text-[#0077FF] font-semibold hover:bg-[#0077FF] hover:text-white transition-colors text-center"
                    >
                      Написать письмо
                    </a>
                  </div>
                </div>

                {/* Право — изображение */}
                <div className="p-8 md:p-12 flex items-end justify-center bg-[#F8FAFC]">
                  <img
                    src="/img/price.png" // можно заменить на тематичную /img/services-cta.png
                    alt="Иллюстрация к услугам"
                    className="w-full max-w-[520px] h-auto object-contain"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

      </div>
    </Layout>
  );
}
