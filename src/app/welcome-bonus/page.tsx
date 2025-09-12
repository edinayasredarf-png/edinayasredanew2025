"use client";

import React from "react";
import Layout from "@/components/Layout";
import { useModal } from "@/components/ModalProvider";
import Image from "next/image";
import Link from "next/link";

export default function WelcomeBonusPage() {
  const { openRegister, openConsult } = useModal();

  // Единый стиль заголовков/текста как на других страницах
  const headingBase = "font-medium leading-[1.15]";
  const headingColor = "text-[#101828]";
  const paragraphMuted = "text-[#667085]";

  return (
    <Layout>
      <div className="min-h-screen">
        {/* HERO — слева текст/кнопки, справа изображение */}
        <section className="bg-black text-white rounded-b-[20px] relative overflow-hidden min-h-[420px]">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-20 relative z-10">
            <div className="relative flex flex-col lg:flex-row items-center lg:items-stretch gap-16">
              {/* Текст слева */}
              <div className="flex-1 lg:basis-3/5 text-left flex flex-col justify-center z-20">
                <h1 className={`text-4xl sm:text-5xl md:text-[72px] ${headingBase}`}>
                  Приветственный бонус
                </h1>
                <p className="mt-8 text-xl sm:text-[27px] text-grey-92 max-w-2xl">
                  Новым клиентам — стартовый бонус на запуск и обучение: быстрее внедрите «Единую Среду», получите
                  готовые методички и поддержку команды.
                </p>
                <div className="mt-10 flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={openRegister}
                    className="inline-flex items-center justify-center bg-[#0077FF] text-white font-semibold px-8 py-4 rounded-xl hover:bg-[#0062D8] transition-colors"
                  >
                    Получить бонус
                  </button>
                  <a
                    href="#terms"
                    className="inline-flex items-center justify-center border border-white/30 text-white px-8 py-4 rounded-xl hover:bg-white hover:text-black transition-colors"
                  >
                    Условия акции
                  </a>
                </div>
              </div>

              {/* Картинка — на мобиле снизу, на десктопе справа */}
              <div className="flex-1 w-full h-full relative flex justify-center items-end lg:hidden z-10">
                <img
                  src="/img/bonus-hero.png"
                  alt="Иллюстрация бонуса"
                  className="w-full max-w-[520px] object-contain"
                  style={{ height: "auto" }}
                />
              </div>
            </div>

            {/* Картинка справа (desktop) */}
            <div className="hidden lg:block absolute right-0 bottom-0 z-10 w-[40%] max-w-[620px] h-auto pointer-events-none">
              <img
                src="/img/bonus-hero.png"
                alt="Иллюстрация бонуса"
                className="w-full object-contain"
                style={{ height: "auto" }}
              />
            </div>
          </div>
        </section>

        {/* Что входит в бонус */}
        <section className="py-16 md:py-24">
          <div className="max-w-[1480px] mx-auto px-5 md:px-8">
            <div className="text-center mb-12 md:mb-16">
              <h2 className={`text-3xl md:text-4xl lg:text-[48px] ${headingBase} ${headingColor}`}>
                Что входит в приветственный бонус
              </h2>
              <p className={`mt-4 text-lg ${paragraphMuted} max-w-3xl mx-auto`}>
                Помогаем быстро запуститься и увидеть первые результаты — без долгого старта и лишних затрат.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {[
                {
                  icon: "/icons/bonus/seminar.svg",
                  title: "Онбординг и обучение",
                  text: "Сценарии запуска, методички, обучающие сессии для команды.",
                },
                {
                  icon: "/icons/bonus/tuition.svg",
                  title: "Готовые шаблоны реестров",
                  text: "Стартовые структуры данных и формы для быстрого ввода.",
                },
                {
                  icon: "/icons/bonus/support.svg",
                  title: "Техническое сопровождение",
                  text: "Поддержка в течение всего срока подписки.",
                },
                {
                  icon: "/icons/bonus/computer-data-laptop.svg",
                  title: "Миграция данных",
                  text: "Импорт и нормализация до 50 000 записей из ваших Excel/старых реестров с проверкой качества.",
                },
              ].map((c, i) => (
                <div key={i} className="p-6 rounded-2xl border border-[#E5E7EB] bg-white">
                  <span className="inline-flex w-12 h-12 rounded-lg bg-[#0077FF] items-center justify-center">
                    <Image src={c.icon} alt="" width={20} height={20} />
                  </span>
                  <h3 className={`mt-4 text-xl ${headingBase} ${headingColor}`}>{c.title}</h3>
                  <p className={`mt-2 text-[15px] leading-6 ${paragraphMuted}`}>{c.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Как получить — шаги */}
        <section className="py-8 md:py-10">
          <div className="max-w-[1480px] mx-auto px-5 md:px-8">
            <h2 className={`text-3xl md:text-4xl lg:text-[48px] text-center mb-10 ${headingBase} ${headingColor}`}>
              Как получить бонус
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { step: "01", title: "Заявка", text: "Заполните короткую форму регистрации." },
                { step: "02", title: "Созвон", text: "Уточним задачи, подберём сценарий и состав бонуса." },
                { step: "03", title: "Запуск", text: "Выдаем доступы, материалы и сопровождаем старт." },
              ].map((x, i) => (
                <div key={i} className="p-6 rounded-2xl border border-[#E5E7EB] bg-white">
                  <div className="text-[#0077FF] text-sm font-semibold">{x.step}</div>
                  <h3 className={`mt-2 text-xl ${headingBase} ${headingColor}`}>{x.title}</h3>
                  <p className={`mt-3 text-[15px] leading-6 ${paragraphMuted}`}>{x.text}</p>
                </div>
              ))}
            </div>

            <div className="flex justify-center mt-10">
              <button
                onClick={openRegister}
                className="px-5 py-3.5 bg-[#0077FF] text-white text-lg font-medium rounded-xl hover:bg-[#0077FF]/90 transition-colors"
              >
                Зарегистрироваться и получить бонус
              </button>
            </div>
          </div>
        </section>

        {/* Условия акции */}
        <section id="terms" className="py-16 md:py-24 bg-[#F6F7F9]">
          <div className="max-w-[1480px] mx-auto px-5 md:px-8">
            <div className="bg-white rounded-3xl p-8 md:p-12">
              <h2 className={`text-3xl md:text-4xl ${headingBase} ${headingColor}`}>Условия акции</h2>
              <ul className={`mt-6 space-y-3 text-lg ${paragraphMuted}`}>
                <li>• Бонус доступен новым клиентам при первой регистрации в «Единой Среде».</li>
                <li>• Состав бонуса согласуется на пресейл-созвоне исходя из задач проекта.</li>
                <li>• Не суммируется с другими специальными предложениями, если не оговорено отдельно.</li>
              </ul>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <button
                  onClick={openRegister}
                  className="bg-[#0077FF] text-white px-8 py-4 rounded-xl font-semibold hover:bg-[#0062D8] transition-colors"
                >
                  Получить бонус
                </button>
                <button
                  onClick={openConsult}
                  className="px-8 py-4 rounded-xl border border-[#0077FF] text-[#0077FF] font-semibold hover:bg-[#0077FF] hover:text-white transition-colors"
                >
                  Задать вопрос
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ (минималистично) */}
        <section className="py-16 md:py-24">
          <div className="max-w-[1480px] mx-auto px-5 md:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-8 lg:gap-12 items-start">
              <div className="relative">
                <div className="mb-8">
                  <h2 className={`text-[clamp(26px,4vw,48px)] ${headingBase} ${headingColor}`}>FAQ</h2>
                </div>
                <div className="flex flex-col">
                  {[
                    {
                      q: "Сколько действует бонус?",
                      a: "Срок зависит от состава бонуса — уточняется в КП по итогам пресейла.",
                    },
                    {
                      q: "Можно ли совместить бонус с госзакупкой/тендером?",
                      a: "Да, варианты предоставления бонуса обсуждаем на этапе подготовки КП/ТЗ.",
                    },
                    {
                      q: "Что, если нам нужны нестандартные интеграции?",
                      a: "Мы предложим пилот и выделим часть бонуса на тех.консалт и прототип.",
                    },
                  ].map((item, idx) => (
                    <details
                      key={idx}
                      className="group border-t border-[#E5E7EB] py-5"
                    >
                      <summary className="flex items-center justify-between cursor-pointer select-none">
                        <h5 className="flex-1 text-[19px] md:text-xl font-medium leading-7 text-[#101828]">
                          {item.q}
                        </h5>
                        <span className="ml-4 relative inline-flex items-center justify-center w-5 h-5">
                          <span className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[2px] w-full bg-[#101828]" />
                          <span className="absolute left-1/2 top-0 -translate-x-1/2 w-[2px] h-full bg-[#101828] transition-all duration-200 group-open:scale-y-0 group-open:opacity-0" />
                        </span>
                      </summary>
                      <p className="mt-4 text-[17px] leading-7 text-[#475467]">
                        {item.a}
                      </p>
                    </details>
                  ))}
                  <div className="border-t border-[#E5E7EB]" />
                </div>
              </div>

              <aside className="lg:pl-6">
                <div className="rounded-3xl border border-[#E5E7EB] p-7 md:p-9 flex flex-col justify-between min-h-[280px] ">
                  <div>
                    <h4 className={`text-[clamp(20px,3vw,24px)] ${headingBase} ${headingColor}`}>
                      Остались вопросы?
                    </h4>
                    <p className="mt-4 text-xl leading-7 text-[#7B88A0]">
                      Напишите нам — поможем подобрать состав бонуса под ваш сценарий.
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

        {/* CTA финальный — слева текст/кнопки, справа картинка */}
        <section className="py-16 md:py-24 bg-[#F6F7F9]">
          <div className="max-w-[1480px] mx-auto px-5 md:px-8">
            <div className="rounded-3xl border border-[#E5E7EB] bg-white overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-2">
                {/* Лево */}
                <div className="p-8 md:p-12 flex flex-col justify-center">
                  <h2 className={`text-3xl md:text-4xl lg:text-5xl mb-4 ${headingBase} ${headingColor}`}>
                    Готовы начать с бонусом?
                  </h2>
                  <p className={`text-lg md:text-xl ${paragraphMuted} mb-8 max-w-xl`}>
                    Зарегистрируйтесь — и мы сразу подготовим материалы и план запуска под ваши задачи.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button
                      onClick={openRegister}
                      className="bg-[#0077FF] text-white px-8 py-4 rounded-xl font-semibold hover:bg-[#0062D8] transition-colors"
                    >
                      Получить бонус
                    </button>
                    <a
                      href="mailto:hello@edinayasreda.ru"
                      className="px-8 py-4 rounded-xl border border-[#0077FF] text-[#0077FF] font-semibold hover:bg-[#0077FF] hover:text-white transition-colors text-center"
                    >
                      Написать письмо
                    </a>
                  </div>
                </div>

                {/* Право — картинка */}
                <div className="p-8 md:p-12 flex items-end justify-center bg-[#F8FAFC]">
                  <img
                    src="/img/bonus-cta.png"
                    alt="Иллюстрация бонуса"
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
