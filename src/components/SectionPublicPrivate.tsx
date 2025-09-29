import React from 'react';
import Image from 'next/image';

const problems = [
  'Хаос в учёте и документации',
  'Сложности с отчетностью и проверками',
  'Несовместимость данных между отделами',
  'Потери информации при смене специалистов',
  'Отсутствие публичной карты объектов',
];

const SectionPublicPrivate: React.FC = () => (
  <section className="max-w-[1480px] mx-auto px-5 md:px-8 mt-4">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Public */}
      <article className="bg-white rounded-[20px] p-8 pb-0 overflow-hidden flex flex-col md:flex-row min-h-[276px]">
        {/* Текстовая колонка со своим нижним отступом (вместо -mb) */}
        <div className="flex-1 flex flex-col justify-between h-full pb-8">
          <h3 className="font-medium text-black text-lg md:text-xl lg:text-2xl leading-9 mb-2">
            Можно работать с телефона<br />даже без интернета
          </h3>
          <p className="text-black/70 leading-snug text-[15px] sm:text-[16px] md:text-[16px]">
            Отметить границы захоронения, добавить атрибуты ЗНО или МАФа —
            <br className="hidden md:block" />
            можно с телефона на объекте, даже если там не ловит связь.
          </p>
          <a href="https://www.rustore.ru/catalog/app/ru.edinayasreda" className="inline-block">
            <Image
              src="/icons/Rustore Logo Color Light.svg"
              width={176}
              height={80}
              alt="RuStore"
              className="w-auto h-20 max-w-[176px] object-contain hover:scale-105 active:scale-95 transition-all duration-300"
            />
          </a>
        </div>

        {/* Изображение: всегда внутри и у нижнего края */}
        <div className="flex-shrink-0 flex justify-center md:justify-end items-end w-full md:w-auto mt-6 md:mt-0 md:ml-1">
          {/* Контейнер с адаптивными размерами по брейкпоинтам */}
          <div className="relative w-[140px] h-[140px] sm:w-[168px] sm:h-[168px] md:w-[176px] md:h-[176px] lg:w-[292px] lg:h-[322px]">
            <Image
              src="/img/no_wifi.webp"
              alt="Телефон: офлайн-работа"
              fill
              sizes="(max-width: 767px) 140px, (max-width: 1023px) 168px, (max-width: 1279px) 176px, 192px"
              className="object-contain"
              priority={false}
            />
          </div>
        </div>
      </article>

      {/* Private */}
      <article className="bg-white rounded-[20px] p-8 pb-0 overflow-hidden flex flex-col md:flex-row min-h-[276px]">
        <div className="flex-1 flex flex-col justify-between h-full pb-8">
          <h3 className="font-medium text-black text-lg md:text-xl lg:text-2xl leading-9 mb-4">
            Проблемы, которые решает сервис
          </h3>
          <ul className="text-black text-sm md:text-base lg:text-lg leading-7 mb-6 space-y-2">
            {problems.map((problem, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-rose-500 text-lg" aria-hidden>✖</span>
                <span className="text-black">{problem}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Изображение: всегда внутри и у нижнего края */}
        <div className="flex-shrink-0 flex justify-center md:justify-end items-end w-full md:w-auto mt-6 md:mt-0 md:ml-8">
          <div className="relative w-[140px] h-[140px] sm:w-[168px] sm:h-[168px] md:w-[176px] md:h-[176px] lg:w-[192px] lg:h-[192px]">
            <Image
              src="/img/problem.png"
              alt="Типовые проблемы учета"
              fill
              sizes="(max-width: 767px) 140px, (max-width: 1023px) 168px, (max-width: 1279px) 176px, 192px"
              className="object-contain"
              priority={false}
            />
          </div>
        </div>
      </article>
    </div>
  </section>
);

export default SectionPublicPrivate;
