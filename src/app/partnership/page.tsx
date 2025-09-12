"use client";
import React from "react";
import Layout from "@/components/Layout";
import { useModal } from "@/components/ModalProvider";
import Image from "next/image";
import Link from "next/link";
import PartnersModal from "@/components/PartnersModal";

export default function PartnershipPage() {
  const { openConsult } = useModal(); // оставляем для кнопки "Задать вопрос"
  const [partnersOpen, setPartnersOpen] = React.useState(false);

  // Единый стиль заголовков
  const headingBase = "font-medium leading-[1.15]";
  const headingColor = "text-[#101828]";
  const paragraphMuted = "text-[#667085]";

  const whoIsItFor = [
{ icon: "/icons/partners/7.svg", title: "Муниципалитеты и подрядчики благоустройства" },
    { icon: "/icons/partners/8.svg", title: "Службы кладбищ и ритуальные предприятия" },
    { icon: "/icons/partners/9.svg", title: "Лесничества и ведомства природопользования" },
    { icon: "/icons/partners/10.svg", title: "Парки, дирекции ООПТ, городские экосистемы" },
    { icon: "/icons/partners/11.svg", title: "Промышленность и девелопмент (эко-департаменты)" },
    { icon: "/icons/partners/12.svg", title: "Дорожные и коммунальные службы" },
    { icon: "/icons/partners/13.svg", title: "Агро- и водохозяйственные организации" },
    { icon: "/icons/partners/14.svg", title: "Образование и наука (вузы, НИИ)" },
    { icon: "/icons/partners/15.svg", title: "НКО и городские инициативы" },


  ] as const;

  const faqItems = [
    {
      title: "Какие продукты «Единая Среда» входят в партнёрскую программу?",
      content: (
        <div className="flex flex-col gap-6">
          <p className="text-[19px] leading-7 text-[#475467]">
            Партнёрская программа охватывает всю линейку: облачную платформу «Единая Среда», а также профильные сервисы:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-[19px] leading-7 text-[#475467]">
            <li>Оцифровка кладбищ (реестры, схема участков, онлайн-поиск)</li>
            <li>Инвентаризация зелёных насаждений (паспорт объекта, работы и КР/ТР)</li>
            <li>Городские реестры и ГИС-сервисы</li>
            <li>Решения для лесного хозяйства</li>
            <li>Интеграции по API/SDK (облако и on-prem)</li>
          </ul>
        </div>
      ),
    },
    {
      title: "Как стать агентом?",
      content: (
        <p className="text-[19px] leading-7 text-[#475467]">
          Оставьте заявку — менеджер свяжется, подтвердит условия и поможет зарегистрировать лид. После оплаты клиентом
          вы получаете агентское вознаграждение.
        </p>
      ),
    },
    {
      title: "Как агент получает вознаграждение за приведённых клиентов?",
      content: (
        <p className="text-[19px] leading-7 text-[#475467]">
          Вознаграждение — фиксированный процент от оплаченных услуг/лицензий. Выплата в рублях на расчётный счёт.
        </p>
      ),
    },
    {
      title: "Как стать партнёром?",
      content: (
        <p className="text-[19px] leading-7 text-[#475467]">
          Партнёром может стать юрлицо или ИП, готовые активно продавать решения и развивать экспертизу. Оставьте заявку — проведём онбординг.
        </p>
      ),
    },
    {
      title: "Как и когда партнёр получает скидку?",
      content: (
        <p className="text-[19px] leading-7 text-[#475467]">
          Скидка предоставляется на SaaS и On-prem и становится вашим бонусом при продаже конечному клиенту.
        </p>
      ),
    },
  ] as const;

  const [openFaq, setOpenFaq] = React.useState<number>(0);

  return (
    <Layout>
      <div className="min-h-screen">

        {/* HERO с картинкой справа */}
        <section className="bg-black text-white rounded-b-[20px] relative overflow-hidden min-h-[420px]">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-20 relative z-10">
            <div className="relative flex flex-col lg:flex-row items-center lg:items-stretch gap-16">
              <div className="flex-1 lg:basis-3/5 text-left flex flex-col justify-center z-20">
                <h1 className={`text-4xl sm:text-5xl md:text-[72px] ${headingBase}`}>
                  Партнёрство
                </h1>
                <p className="mt-8 text-xl sm:text-[27px] text-grey-92 max-w-2xl">
                  Станьте частью нашей экосистемы и развивайте бизнес вместе с лидером в области цифровых экологических решений.
                </p>
                <div className="mt-10">
                  <button
                    onClick={() => setPartnersOpen(true)}
                    className="inline-flex items-center justify-center bg-[#0077FF] text-white text-sm md:text-base lg:text-lg font-medium px-6 py-4 md:px-8 md:py-5 rounded-xl hover:bg-[#0077FF]/90 transition-colors"
                  >
                    Стать партнёром
                  </button>
                </div>
              </div>

              <div className="flex-1 w-full h-full relative flex justify-center items-end lg:hidden z-10">
                <img
                  src="/img/partner-hero.png"
                  alt="Иллюстрация партнёрской программы"
                  className="w-full max-w-[520px] object-contain"
                  style={{ height: "auto" }}
                />
              </div>
            </div>

            <div className="hidden lg:block absolute right-0 bottom-0 z-10 w-[40%] max-w-[620px] h-full pointer-events-none">
              <img
                src="/img/partners/hero.png"
                alt="Иллюстрация партнёрской программы"
                className="w-full object-contain"
                style={{ height: "auto" }}
              />
            </div>
          </div>
        </section>

        {/* Настройте партнёрскую программу */}
        <section className="py-16 md:py-24">
          <div className="max-w-[1480px] mx-auto px-5 md:px-8">
            <div className="text-center mb-12 md:mb-16">
              <h2 className={`text-3xl md:text-4xl lg:text-[48px] ${headingBase} ${headingColor}`}>
                Настройте партнёрскую программу так, как выгодно вам
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Карточка 1 */}
              <div className="flex-1 p-2 bg-white rounded-3xl flex flex-col md:flex-row gap-2">
                <div className="w-full md:w-[244px] md:flex-shrink-0 bg-white rounded-2xl flex justify-center items-center overflow-hidden order-1 md:order-none">
                  <Image
                    src="/img/partners/1.svg"
                    alt="Продукты Единая Среда"
                    width={244}
                    height={268}
                    className="w-full max-w-[244px] h-auto"
                  />
                </div>
                <div className="flex-1 px-7 pt-6 pb-10 flex flex-col gap-4">
                  <p className="text-[19px] leading-7 text-[#101828]">
                    <span className="font-semibold">Выберите продукты «Единая Среда»</span>, подходящие вашей аудитории, или зарабатывайте на продаже всей линейки.
                  </p>
                  <p className={`${paragraphMuted} text-lg leading-7`}>
                    Партнёрская программа охватывает облачные сервисы «Единая Среда» и профильные решения.
                  </p>
                </div>
              </div>

              {/* Карточка 2 */}
              <div className="flex-1 p-2 bg-white rounded-3xl flex flex-col md:flex-row gap-2">
                <div className="w-full md:w-[244px] md:flex-shrink-0 bg-white rounded-2xl flex justify-center items-center overflow-hidden order-1 md:order-none">
                  <Image
                    src="/img/partners/2.svg"
                    alt="Варианты участия"
                    width={244}
                    height={268}
                    className="w-full max-w-[244px] h-auto"
                  />
                </div>
                <div className="flex-1 px-7 pt-6 pb-10 flex flex-col gap-4">
                  <p className="text-[19px] leading-7 text-[#101828]">
                    <span className="font-semibold">Выберите вариант участия</span>, который позволит вашему бизнесу зарабатывать эффективнее.
                  </p>
                  <p className={`${paragraphMuted} text-[19px] leading-7`}>
                    Присоединяйтесь как партнёр или как агент — условия прозрачны, старт быстрый.
                  </p>
                </div>
              </div>
            </div>

            <div className="max-w-[1480px] mx-auto flex justify-center mt-10">
              <button
                type="button"
                onClick={() => setPartnersOpen(true)}
                className="px-5 py-3.5 bg-[#0077FF] text-white text-xl font-medium rounded-xl hover:bg-[#0077FF]/90 transition-colors"
              >
                Оставить заявку
              </button>
            </div>
          </div>
        </section>

        {/* Варианты участия в программе */}
        <section className="py-16 md:py-24 bg-[#F6F7F9]">
          <div className="max-w-[1480px] mx-auto px-5 md:px-8">
            <h2 className={`text-3xl md:text-4xl lg:text-5xl text-center mb-16 ${headingBase} ${headingColor}`}>
              Варианты участия в программе
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Партнёр */}
              <div className="p-2 bg-white rounded-[20px]">
                <div className="px-7 pt-6 pb-10">
                  <h3 className={`text-[32px] md:text-[39px] leading-[44px] ${headingBase} ${headingColor}`}>Партнёр</h3>
                  <p className="mt-4 text-[19px] leading-7 text-[#667085]">
                    Самостоятельно продавайте клиентам облачные сервисы и другие продукты и зарабатывайте за счёт партнёрской скидки.
                  </p>
                </div>

                <div className="space-y-2 px-0 pb-2">
                  <details className="group bg-[#F6F7F9] rounded-2xl px-7 py-5">
                    <summary className="flex items-center justify-between cursor-pointer select-none">
                      <span className={`text-[23px] leading-9 ${headingBase} ${headingColor}`}>Как это работает</span>
                      <span className="ml-4 inline-flex w-5 h-5 relative">
                        <span className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-0.5 w-full bg-[#101828]" />
                        <span className="absolute left-1/2 top-0 -translate-x-1/2 h-full w-0.5 bg-[#101828] transition-all group-open:h-0" />
                      </span>
                    </summary>
                    <div className="mt-4 text-[#475467] text-base leading-relaxed">
                      Доступ к прайсам, материалам и пресейл-поддержке. Вы закупаете услуги по партнёрским ценам и выставляете счёт клиенту.
                    </div>
                  </details>

                  <details className="group bg-[#F6F7F9] rounded-2xl px-7 py-5">
                    <summary className="flex items-center justify-between cursor-pointer select-none">
                      <span className={`text-2xl leading-9 ${headingBase} ${headingColor}`}>Преимущества</span>
                      <span className="ml-4 inline-flex w-5 h-5 relative">
                        <span className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-0.5 w-full bg-[#101828]" />
                        <span className="absolute left-1/2 top-0 -translate-x-1/2 h-full w-0.5 bg-[#101828] transition-all group-open:h-0" />
                      </span>
                    </summary>
                    <ul className="mt-4 space-y-2 text-[#475467] text-base">
                      <li>Партнёрская скидка и спецусловия</li>
                      <li>Материалы для продаж и совместный маркетинг</li>
                      <li>Поддержка на пресейле и внедрении</li>
                    </ul>
                  </details>
                </div>

                <div className="px-2 pt-2">
                  <button
                    onClick={() => setPartnersOpen(true)}
                    className="w-full px-5 py-3.5 rounded-xl bg-white text-[#0077FF] font-medium border border-[#E5E7EB] hover:bg-gray-50 transition"
                  >
                    Стать партнёром
                  </button>
                </div>
              </div>

              {/* Агент */}
              <div className="p-2 bg-white rounded-[20px]">
                <div className="px-7 pt-6 pb-10">
                  <h3 className={`text-[32px] md:text-[39px] leading-[44px] ${headingBase} ${headingColor}`}>Агент</h3>
                  <p className="mt-4 text-[19px] leading-7 text-[#667085]">
                    Привлекайте новых клиентов к работе с сервисами и получайте процент от потреблённых ресурсов или стоимости лицензий.
                  </p>
                </div>

                <div className="space-y-2 px-0 pb-2">
                  <details className="group bg-[#F6F7F9] rounded-2xl px-7 py-5">
                    <summary className="flex items-center justify-between cursor-pointer select-none">
                      <span className={`text-[23px] leading-9 ${headingBase} ${headingColor}`}>Как это работает</span>
                      <span className="ml-4 inline-flex w-5 h-5 relative">
                        <span className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-0.5 w-full bg-[#101828]" />
                        <span className="absolute left-1/2 top-0 -translate-x-1/2 h-full w-0.5 bg-[#101828] transition-all group-open:h-0" />
                      </span>
                    </summary>
                    <div className="mt-4 text-[#475467] text-base leading-relaxed">
                      Регистрируете лид — мы ведём сделку и осуществляем поставку. После оплаты клиентом получаете агентское вознаграждение.
                    </div>
                  </details>

                  <details className="group bg-[#F6F7F9] rounded-2xl px-7 py-5">
                    <summary className="flex items-center justify-between cursor-pointer select-none">
                      <span className={`text-2xl leading-9 ${headingBase} ${headingColor}`}>Преимущества</span>
                      <span className="ml-4 inline-flex w-5 h-5 relative">
                        <span className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-0.5 w-full bg-[#101828]" />
                        <span className="absolute left-1/2 top-0 -translate-x-1/2 h-full w-0.5 bg-[#101828] transition-all group-open:h-0" />
                      </span>
                    </summary>
                    <ul className="mt-4 space-y-2 text-[#475467] text-base">
                      <li>Быстрый старт без интеграций</li>
                      <li>Прозрачное начисление комиссий</li>
                      <li>Методички и скрипты для продаж</li>
                    </ul>
                  </details>
                </div>

                <div className="px-2 pt-2">
                  <button
                    onClick={() => setPartnersOpen(true)}
                    className="w-full px-5 py-3.5 rounded-xl bg-white text-[#0077FF] font-medium border border-[#E5E7EB] hover:bg-gray-50 transition"
                  >
                    Стать агентом
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Преимущества */}
        <section className="py-16 md:py-24">
          <div className="max-w-[1480px] mx-auto px-5 md:px-8">
            <h2 className={`text-3xl md:text-4xl lg:text-[48px] text-center mb-10 ${headingBase} ${headingColor}`}>
              Преимущества
            </h2>

            <div className="rounded-3xl border border-[#E5E7EB] p-5 md:p-6 relative overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-3 md:grid-rows-2 gap-8 relative">
                <div className="hidden md:block absolute left-0 right-0 top-1/2 h-px bg-[#E5E7EB]" />
                <div className="hidden md:block absolute top-0 bottom-0 left-1/3 w-px bg-[#E5E7EB]" />
                <div className="hidden md:block absolute top-0 bottom-0 left-2/3 w-px bg-[#E5E7EB]" />

                {[
                  { icon: "/icons/partners/2.svg", text: "Маржинальность до 35%, эксклюзивные цены" },
                  { icon: "/icons/partners/4.svg", text: "Защита сделок и программа мотивации" },
                  { icon: "/icons/partners/3.svg", text: "Обучение продажам облачных продуктов" },
                  { icon: "/icons/partners/5.svg", text: "Помощь в сопровождении сделки и пресейл" },
                  { icon: "/icons/partners/6.svg", text: "Спецусловия на продукты для вашей компании" },
                  { icon: "/icons/partners/1.svg", text: "Маркетинговая поддержка" },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="inline-flex w-12 h-12 rounded-lg bg-[#0077FF] items-center justify-center shrink-0">
                      <Image src={item.icon} alt="" width={20} height={20} />
                    </span>
                    <p className="text-[19px] leading-7 text-[#101828]">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Кому подойдёт программа */}
        <section className="py-16 md:py-24 bg-[#F6F7F9]">
          <div className="max-w-[1480px] mx-auto px-5 md:px-8">
            <div className="bg-white rounded-3xl px-9 pt-14 pb-5">
              <h2 className={`text-3xl md:text-4xl lg:text-[48px] text-center mb-12 ${headingBase} ${headingColor}`}>
                Кому подойдёт программа
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {whoIsItFor.map((item, idx) => (
                  <div key={idx} className="px-4 py-3.5 bg-[#F6F7F9] rounded-xl inline-flex items-center gap-2">
                    <span className="w-5 h-5 relative inline-flex items-center justify-center">
                      <Image src={item.icon} alt="" width={20} height={20} />
                    </span>
                    <span className="text-[#1F2937] text-base leading-tight">{item.title}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Почему продавать облачные решения перспективно — с изображениями графиков */}
        <section className="py-16 md:py-24">
          <div className="max-w-[1480px] mx-auto px-5 md:px-8">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <h2 className={`text-3xl md:text-4xl lg:text-[38.9px] ${headingBase} ${headingColor}`}>
                Почему продавать облачные решения перспективно
              </h2>
              <p className={`mt-6 text-lg ${paragraphMuted}`}>
                Рынок облачных технологий в России растёт, а цифровизация городов и муниципальных сервисов ускоряется —
                спрос на внедрения и сопровождение стабильно высокий.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="flex-1 p-8 bg-white rounded-[20px]">
                <div className="w-full rounded-xl overflow-hidden border border-[#E5E7EB]">
                  <Image
                    src="/img/partners/4.svg"
                    alt="Динамика инвестиций в цифровизацию городов"
                    width={960}
                    height={540}
                    className="w-full h-auto"
                    priority
                  />
                </div>
                <p className="mt-4 text-sm text-[#667085]">
                  Инвестиции в цифровую инфраструктуру, реестры, геоданные и муниципальные сервисы.
                </p>
              </div>

              <div className="flex-1 p-8 bg-white rounded-[20px]">
                <div className="w-full rounded-xl overflow-hidden border border-[#E5E7EB]">
                  <Image
                    src="/img/partners/5.svg"
                    alt="Актуальность услуг: оцифровка кладбищ, инвентаризация зелени и др."
                    width={960}
                    height={540}
                    className="w-full h-auto"
                  />
                </div>
                <p className="mt-4 text-sm text-[#667085]">
                  Стабильный рост спроса на прикладные сервисы управления городской средой.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Программа технологической сертификации ПО — редизайн */}
      {/* Программа технологической сертификации ПО — редизайн */}
<section className="py-16 md:py-24">
  <div className="max-w-[1480px] mx-auto px-5 md:px-8">
    <div className="w-full max-w-[960px] mx-auto text-center mb-12">
      <h2 className={`text-[28px] md:text-[38.9px] ${headingBase} ${headingColor}`}>
Узнайте больше о сервисе и услугах     </h2>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
      {/* Public Cloud */}
      <div className="p-2 bg-white rounded-3xl flex flex-col lg:flex-row justify-center items-start gap-9">
        {/* Текстовый блок */}
        <div className="w-full lg:w-[464px] p-7 flex flex-col justify-between items-start">
          <div>
            <h3 className={`text-[24px] md:text-[28px] ${headingBase} ${headingColor}`}>Платформа "Единая Среда"</h3>
            <p className="mt-4 text-xl leading-7 text-[#667085]">
             облачная платформа с гибкими
                      настройками и удобным масштабированием для
                      муниципалитетов и бизнеса.
            </p>
          </div>
          <div className="pt-10">
            <Link
              href="/"
              className="inline-flex px-5 py-3.5 bg-[#F2F2F2] rounded-xl text-[#101828] text-xl font-medium hover:bg-[#EBEBEB] transition"
            >
              Узнать подробнее
            </Link>
          </div>
        </div>

        {/* Картинка — снизу на мобиле, справа на десктопе */}
        <div className="w-full lg:w-[220px] lg:h-[324px] bg-white rounded-2xl flex justify-center items-center overflow-hidden">
          <Image
            src="/img/partners/6.svg"
            alt="Иллюстрация ES"
            width={220}
            height={324}
            className="w-full max-w-[220px] h-auto"
          />
        </div>
      </div>

      {/* Private Cloud */}
      <div className="p-2 bg-white rounded-3xl flex flex-col lg:flex-row justify-center items-start gap-9">
        {/* Текстовый блок */}
        <div className="w-full lg:w-[464px] p-7 flex flex-col justify-between items-start">
          <div>
            <h3 className={`text-[24px] md:text-[28px] ${headingBase} ${headingColor}`}>Услуги</h3>
            <p className="mt-4 text-xl leading-7 text-[#667085]">
            Оцифровка кладбищ,
                      инвентаризация зелёных насаждений,мелиорация,
                      лесоустройство и многое другое на отдельной странице
            </p>
          </div>
          <div className="pt-10">
            <Link
              href="/services"
              className="inline-flex px-5 py-3.5 bg-[#F2F2F2] rounded-xl text-[#101828] text-xl font-medium hover:bg-[#EBEBEB] transition"
            >
              Узнать подробнее
            </Link>
          </div>
        </div>

        {/* Картинка — снизу на мобиле, справа на десктопе */}
        <div className="w-full lg:w-[220px] lg:h-[324px] bg-white rounded-2xl flex justify-center items-center overflow-hidden">
          <Image
            src="/img/partners/7.svg"
            alt="Иллюстрация услуг"
            width={220}
            height={324}
            className="w-full max-w-[220px] h-auto"
          />
        </div>
      </div>
    </div>
  </div>
</section>


        {/* FAQ — новый стиль */}
        <section className="py-16 md:py-24">
          <div className="max-w-[1480px] mx-auto px-5 md:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-8 lg:gap-12 items-start">
              <div className="relative">
                <div className="mb-8">
                  <h2 className={`text-[clamp(26px,4vw,48px)] ${headingBase} ${headingColor}`}>FAQ</h2>
                </div>

                <div className="flex flex-col">
                  {faqItems.map((item, idx) => {
                    const isOpen = openFaq === idx;
                    return (
                      <div key={idx} className="border-top border-[#E5E7EB]">
                        <button
                          type="button"
                          onClick={() => setOpenFaq(isOpen ? -1 : idx)}
                          className="w-full py-5 flex items-center gap-6 text-left border-t border-[#E5E7EB]"
                        >
                          <h5 className="flex-1 text-[19px] md:text-xl font-medium leading-7 text-[#101828]">
                            {item.title}
                          </h5>
                          <span className="relative inline-flex items-center justify-center w-5 h-5">
                            <span className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[2px] w-full bg-[#101828]" />
                            <span
                              className={`absolute left-1/2 top-0 -translate-x-1/2 w-[2px] h-full bg-[#101828] transition-all duration-200 ${
                                isOpen ? "scale-y-0 opacity-0" : "scale-y-100 opacity-100"
                              }`}
                            />
                          </span>
                        </button>
                        {isOpen && <div className="pb-6 pr-0 md:pr-10">{item.content}</div>}
                      </div>
                    );
                  })}
                  <div className="border-t border-[#E5E7EB]" />
                </div>
              </div>

              <aside className="lg:pl-6">
                <div className="rounded-3xl border border-[#E5E7EB] p-7 md:p-9 flex flex-col justify-between min-h-[280px]">
                  <div>
                    <h4 className={`text-[clamp(20px,3vw,24px)] ${headingBase} ${headingColor}`}>
                      Не нашли ответ на свой вопрос?
                    </h4>
                    <p className="mt-4 text-xl leading-7 text-[#7B88A0]">
                      Задайте его нам — и мы оперативно ответим.
                    </p>
                  </div>
                  <div className="mt-8">
                    <button
                      onClick={openConsult}
                      className="inline-flex px-5 py-3.5 rounded-xl text-base font-medium text-[#0077FF] bg-[#F2F2F2] hover:bg-[#EBEBEB] transition"
                    >
                      Задать вопрос
                    </button>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </section>



        {/* CTA финальный */}

<section className="py-16 md:py-24 bg-[#F6F7F9]">
  <div className="max-w-[1480px] mx-auto px-5 md:px-8">
    <div className="rounded-3xl border border-[#E5E7EB] bg-white overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-2">
        {/* Лево: заголовок, текст и кнопки */}
        <div className="p-8 md:p-12 flex flex-col justify-center">
          <h2 className={`text-3xl md:text-4xl lg:text-5xl mb-4 ${headingBase} ${headingColor}`}>
            Готовы стать партнёром?
          </h2>
          <p className={`text-lg md:text-xl ${paragraphMuted} mb-8 max-w-xl`}>
            Свяжитесь с нами для обсуждения условий сотрудничества и получения персонального предложения.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => setPartnersOpen(true)}
              className="bg-[#0077FF] text-white px-8 py-4 rounded-xl font-semibold hover:bg-[#0062D8] transition-colors"
            >
              Подать заявку
            </button>
            <a
              href="mailto:partnership@edinayasreda.ru"
              className="px-8 py-4 rounded-xl border border-[#0077FF] text-[#0077FF] font-semibold hover:bg-[#0077FF] hover:text-white transition-colors text-center"
            >
              Написать письмо
            </a>
          </div>
        </div>

        {/* Право: изображение (на мобиле уйдёт вниз автоматически) */}
        <div className=" flex items-end justify-center bg-[#F8FAFC]">
          <img
            src="/img/partners/partners.png"
            alt="Иллюстрация партнёрства"
            className="w-full  h-auto "
          />
        </div>
      </div>
    </div>
  </div>
</section>



      </div>

      {/* Новая модалка партнёрства */}
      <PartnersModal open={partnersOpen} onClose={() => setPartnersOpen(false)} />
    </Layout>
  );
}
