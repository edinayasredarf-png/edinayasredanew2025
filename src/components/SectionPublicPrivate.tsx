import React from 'react';
import Image from 'next/image';

const problems = [
  'Хаос в учёте и документации',
  'Сложности с отчетностью и проверками',
  'Несовместимость данных между отделами',
  'Потери информации при смене специалистов',
  'Отсутствие публичной карты объектов',
];

const SectionPublicPrivate = () => (
  <section className="max-w-[1480px] mx-auto px-5 md:px-8 mt-16">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Public */}
      <div className="bg-white rounded-[20px] p-8 flex flex-col md:flex-row min-h-[276px]">
        <div className="flex-1 flex flex-col justify-between h-full">
          <h3 className="font-medium text-black text-lg md:text-xl lg:text-2xl leading-9 mb-2">
            Можно работать с телефона
          </h3>
          <div className="text-black text-sm md:text-base lg:text-lg leading-7 mb-6">
            Отметить границы захоронения, добавить атрибуты ЗНО или МАФа —<br className="hidden md:block" />
            можно с телефона на объекте.
          </div>
          <a href="https://www.rustore.ru/catalog/app/ru.edinayasreda">
            <Image
              src="/icons/Rustore Logo Color Light.svg"
              width={176}
              height={80}
              alt="Rustore"
              className="w-auto h-20 max-w-[176px] object-contain hover:scale-105 active:scale-95 transition-all duration-300"
            />
          </a>
        </div>
        <div className="flex-shrink-0 flex justify-center items-end w-full md:w-auto mt-8 md:mt-0 md:ml-8">
          <Image
            src="/img/mobile.png"
            alt="Телефон"
            width={176}
            height={176}
            className="w-auto h-auto max-w-[176px] object-contain"
          />
        </div>
      </div>
      {/* Private */}
      <div className="bg-white rounded-[20px] p-8 flex flex-col md:flex-row min-h-[276px]">
        <div className="flex-1 flex flex-col justify-between h-full">
          <h3 className="font-medium text-black text-lg md:text-xl lg:text-2xl leading-9 mb-4">
            Проблемы, которые решает сервис
          </h3>
          <ul className="text-black text-sm md:text-base lg:text-lg leading-7 mb-6 space-y-2">
            {problems.map((problem, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-rose-500 text-lg">✖</span>
                <span className="text-black">{problem}</span>
              </li>
            ))}
          </ul>
          {/* Можно добавить call-to-action или ссылку, если нужно */}
        </div>
        <div className="flex-shrink-0 flex justify-center items-end w-full md:w-auto mt-8 md:mt-0 md:ml-8">
          <Image
            src="/img/problem.png"
            alt="Проблемы"
            width={176}
            height={176}
            className="w-auto h-auto max-w-[176px] object-contain"
          />
        </div>
      </div>
    </div>
  </section>
);

export default SectionPublicPrivate;