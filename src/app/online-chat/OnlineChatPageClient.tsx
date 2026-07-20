"use client";

import React from "react";
import Layout from "@/components/Layout";

const CHAT_URL = "https://oooecostroy.bitrix24.ru/online/support";

export default function OnlineChatPageClient() {
  return (
    <Layout>
      <div className="font-[Raleway] font-medium lining-nums">
        {/* Hero */}
        <section className="page-hero rounded-b-[20px] relative overflow-hidden">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4 md:pt-10 md:pb-6 relative z-10">
            <div className="relative flex flex-col lg:flex-row items-center lg:items-stretch">
              <div className="flex-1 lg:basis-3/5 text-left flex flex-col justify-center z-20">
                <h1 className="font-involve text-[#313131] text-[clamp(2rem,5.5vw,3.4rem)] leading-[1.14] tracking-[0.6px]">
                  Онлайн-чат
                </h1>
                <p className="mt-4 text-[#313131]/70 text-base md:text-lg leading-[1.4] max-w-[620px] font-[Inter]">
                  Напишите нам в чате — оператор ответит в течение нескольких минут.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Chat embed */}
        <section className="bg-white w-full pt-4 pb-16 md:pt-6 md:pb-24" aria-label="Онлайн-чат">
          <div className="rd-content-column">
            {/*
              Встраиваем только сам виджет «Открытая линия» без фона страницы Bitrix.
              Виджет .bx-livechat-box имеет фиксированный размер 732×557 и вертикально
              центрируется на странице. При высоте окна 783px весь контент помещается
              без прокрутки, и верх виджета оказывается на отметке 123px
              ((783-557)/2 + отступ). Поэтому: контейнер высотой 557px с overflow-hidden,
              внутри iframe высотой 783px, сдвинутый вверх на 123px — в кадре остаётся
              ровно виджет (шапка → поле ввода), без тёмного фона, пустот и селектора языка.
            */}
            <div className="mx-auto h-[557px] w-full max-w-[732px] overflow-hidden rounded-[20px] border border-[#E5E7EB] shadow-[0_10px_40px_rgba(5,12,38,0.08)]">
              <iframe
                title="Онлайн-чат «Единая среда»"
                src={CHAT_URL}
                className="block w-full border-0"
                style={{ height: "783px", marginTop: "-123px" }}
                allow="microphone; camera; clipboard-write; autoplay"
              />
            </div>

            {/* Fallback — если чат не открылся в окне */}
            <p className="mx-auto mt-6 max-w-[732px] text-center font-[Raleway] text-base text-[#646b85]">
              Чат не загрузился?{" "}
              <a
                href={CHAT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#029cda] font-medium hover:opacity-80 transition-opacity"
              >
                Открыть в новом окне
              </a>
            </p>
          </div>
        </section>
      </div>
    </Layout>
  );
}
