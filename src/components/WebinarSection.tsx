"use client";
import React from "react";

const WebinarSection: React.FC = () => {
  return (
    <section className="w-full flex justify-center mt-16 px-4">
      <div className="w-full max-w-[1022px] bg-white rounded-3xl overflow-hidden flex flex-col md:flex-row items-stretch">
        {/* Чёрный блок (слева на десктопе, сверху на мобильных) */}
        <div className="relative w-full md:w-[498px] h-[220px] md:h-[292px] bg-black md:m-2 md:rounded-2xl rounded-t-2xl overflow-hidden flex items-center justify-center">
      <img src="/img/webinar.webp" alt="Webinar" className="w-full h-full object-cover" />
        </div>

        {/* Правая часть — текстовый контент */}
        <div className="flex flex-col justify-start items-start p-6 md:p-0 md:ml-[30px] md:mt-[35px]">
          <h2 className="text-[#313131] text-[22px] md:text-[25px] font-medium leading-[1.3] font-[Raleway] mb-[16px]">
            Большой онлайн вебинар
          </h2>
          <p className="text-[#7c8a9a] text-sm md:text-base font-normal leading-6 font-[Raleway] mb-[28px] md:mb-[36px] max-w-[439px]">
            Тема: «Управление захоронениями в муниципалитетах: как не допустить
            проведение инвентаризации впустую и не столкнуться с мошенниками в
            сфере оцифровки».
          </p>
          <a
            href="https://mts-link.ru/"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full md:w-auto text-center px-5 py-3.5 bg-[#0077ff] rounded-xl text-white text-lg md:text-xl font-medium leading-7 font-[Raleway] hover:bg-[#005fd1] transition-colors"
          >
            Записаться
          </a>
        </div>
      </div>
    </section>
  );
};

export default WebinarSection;
