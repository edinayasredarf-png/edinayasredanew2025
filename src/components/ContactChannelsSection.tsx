"use client";

import { useModal } from "@/components/ModalProvider";

function ArrowUpRight() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="shrink-0">
      <path d="M7 17 17 7" />
      <path d="M7 7h10v10" />
    </svg>
  );
}

export default function ContactChannelsSection() {
  const modal = useModal() as {
    openConsult?: () => void;
  };

  const consult = () => modal?.openConsult?.();

  return (
    <section className="bg-white w-full py-16 md:py-24" aria-label="Не нашли ответ на свой вопрос">
      <div className="rd-content-column">
        {/* Заголовок + подзаголовок */}
        <div className="flex flex-col items-center text-center">
          <h2 className="max-w-[1120px] font-involve text-[#050c26] text-[32px] md:text-[40px] font-medium leading-[1.15] md:leading-[44px] tracking-wide">
            Не нашли ответ на свой вопрос?
          </h2>
          <p className="mt-4 max-w-[680px] font-[Raleway] text-base leading-6 tracking-tight text-[#646b85]">
            Свяжитесь с нами любым удобным способом:
          </p>
        </div>

        {/* Карточки каналов */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* В Max */}
          <div className="bg-[#F6F7F9] rounded-[32px] p-8 lg:p-10 flex items-start justify-between gap-6 min-h-[220px]">
            <div className="flex flex-col h-full">
              <h3 className="font-involve text-[#050c26] text-2xl font-medium leading-7 tracking-wide">В Max</h3>
              <p className="mt-3 flex-1 font-[Raleway] text-base leading-6 tracking-tight text-[#646b85]">
                Ответим на любые вопросы в личной переписке по нашей системе и услугам.
              </p>
              <a href="https://max.ru/join/o9Qsp_ls9FThf7PTGJkQIm1as_Uknlw_zFRNV28FtVY" target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center gap-2 text-[#029cda] text-base font-medium font-involve hover:opacity-80 transition-opacity">
                Написать <ArrowUpRight />
              </a>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/img/chanel/1.svg" alt="Личная переписка в мессенджере" className="shrink-0 w-[68px] h-[68px] object-contain" />
          </div>

          {/* В чате */}
          <div className="bg-[#F6F7F9] rounded-[32px] p-8 lg:p-10 flex items-start justify-between gap-6 min-h-[220px]">
            <div className="flex flex-col h-full">
              <h3 className="font-involve text-[#050c26] text-2xl font-medium leading-7 tracking-wide">В чате</h3>
              <p className="mt-3 flex-1 font-[Raleway] text-base leading-6 tracking-tight text-[#646b85]">
                Ответим в течение нескольких минут. Не закрывайте сайт, пока не получите ответ.
              </p>
              <button type="button" onClick={consult} className="mt-5 inline-flex items-center gap-2 text-[#029cda] text-base font-medium font-involve hover:opacity-80 transition-opacity">
                Задать вопрос <ArrowUpRight />
              </button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/img/chanel/2.svg" alt="Чат с командой поддержки" className="shrink-0 w-[68px] h-[68px] object-contain" />
          </div>

          {/* На почту */}
          <div className="bg-[#F6F7F9] rounded-[32px] p-8 lg:p-10 flex items-start justify-between gap-6 min-h-[220px]">
            <div className="flex flex-col h-full">
              <h3 className="font-involve text-[#050c26] text-2xl font-medium leading-7 tracking-wide">На почту</h3>
              <p className="mt-3 flex-1 font-[Raleway] text-base leading-6 tracking-tight text-[#646b85]">
                Напишите нам на почту — и менеджер ответит на все ваши вопросы.
              </p>
              <a href="mailto:info@единаясреда.рф?subject=Вопрос по системе «Единая среда»" className="mt-5 inline-flex items-center gap-2 text-[#029cda] text-base font-medium font-involve hover:opacity-80 transition-opacity">
                Написать на почту <ArrowUpRight />
              </a>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/img/chanel/3.svg" alt="Связаться по электронной почте" className="shrink-0 w-[68px] h-[68px] object-contain" />
          </div>

          {/* По телефону */}
          <div className="bg-[#F6F7F9] rounded-[32px] p-8 lg:p-10 flex items-start justify-between gap-6 min-h-[220px]">
            <div className="flex flex-col h-full">
              <h3 className="font-involve text-2xl font-medium leading-7 tracking-wide">
                <span className="text-[#050c26]">По телефону </span>
                <a href="tel:88005505612" className="text-[#029cda] hover:opacity-80 transition-opacity">8 800 550-56-12</a>
              </h3>
              <p className="mt-3 flex-1 font-[Raleway] text-base leading-6 tracking-tight text-[#646b85]">
                Звонок бесплатный по всей России. Или закажите обратный звонок — перезвоним сразу или в удобное вам время.
              </p>
              <button type="button" onClick={consult} className="mt-5 inline-flex items-center gap-2 text-[#029cda] text-base font-medium font-involve hover:opacity-80 transition-opacity">
                Заказать звонок <ArrowUpRight />
              </button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/img/chanel/4.svg" alt="Бесплатный звонок по телефону" className="shrink-0 w-[68px] h-[68px] object-contain" />
          </div>
        </div>
      </div>
    </section>
  );
}
