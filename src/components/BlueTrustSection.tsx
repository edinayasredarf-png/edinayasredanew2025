'use client';

import React from 'react';

type SmallCard = {
  title: string;
  iconSrc: string;   // путь к иконке обязателен
  iconAlt?: string;
  captionClassName?: string;
};

const DEFAULT_CARDS: SmallCard[] = [
  { title: 'В Едином реестре российского ПО', iconSrc: '/icons/gerb.svg' },
  { title: 'Аккредитованная IT-компания', iconSrc: '/icons/it-company.svg' },
  { title: 'Резидент Сколково', iconSrc: '/icons/skolkovo.svg' },
  {
    title: 'Работа на технологическом стеке, исключающем продукты западных вендоров',
    iconSrc: '/icons/stek.svg',
    captionClassName: 'text-[#7c8a9a] text-sm md:text-[15px] font-semibold leading-[18px]',
  },
];

const BlueTrustWithScreen: React.FC<{
  cards?: SmallCard[];
  screenSrc?: string;     // картинка «экрана» справа (накладывается режимом screen)
  sideBgLeft?: string;    // опциональный фоновый столбец слева (на всю высоту)
  sideBgRight?: string;   // опциональный фоновый столбец справа (на всю высоту)
}> = ({
  cards = DEFAULT_CARDS,
  screenSrc = '/img/spec.png',
  sideBgLeft,
  sideBgRight,
}) => {
  return (
    <section className="mx-auto w-full max-w-[1480px] px-4 py-8 lg:py-12">
      <div className="relative rounded-2xl bg-[#0077FF] overflow-hidden">
        {/* Боковые фоновые изображения на всю высоту (опционально, скрываем на мобиле) */}
        {sideBgLeft && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 z-0 hidden sm:block w-[26%] min-w-[180px] max-w-[360px]"
          >
            <img src={sideBgLeft} alt="" className="h-full w-full object-cover opacity-50" />
          </div>
        )}
        {sideBgRight && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 z-0 hidden sm:block w-[26%] min-w-[180px] max-w-[360px]"
          >
            <img src={sideBgRight} alt="" className="h-full w-full object-cover opacity-50" />
          </div>
        )}

        {/* Контент: изолируем, чтобы blend не влиял на текст/карточки */}
        <div className="relative z-10 isolate px-4 py-8 md:px-8 md:py-12">
          <div className="grid gap-8 md:grid-cols-2">
            {/* ПРАВАЯ колонка на десктопе (но на мобиле идёт первой): заголовок по центру */}
            <div className="order-1 md:order-2">
              <div className="relative flex h-full min-h-[160px] items-center justify-center text-center md:text-right px-6 md:px-10 lg:px-10">
                <h2 className="text-white  text-left font-medium leading-[1.18] text-[36px] sm:text-[36px] md:text-[44px] lg:text-[52px] max-w-[34ch]">
                  <span className="text-white">Полностью</span><br/>
                  <span className="text-white/60">российская разработка</span>
                  <span className="text-white"> без санкционных рисков</span>
                </h2>
              </div>
            </div>

            {/* ЛЕВАЯ колонка (на мобиле отображается второй): 4 белые карточки с иконками */}
            <div className="order-2 md:order-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
                {cards.slice(0, 4).map((item, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl bg-white border border-white/80 px-5 py-5 lg:px-6 lg:py-6 flex flex-col"
                  >
                    <div className="mb-4 h-[96px] w-[96px] md:h-[120px] md:w-[120px] rounded-[18px] border border-[#E6ECF4] bg-white flex items-center justify-center overflow-hidden">
                      <img
                        src={item.iconSrc}
                        alt={item.iconAlt || ''}
                        className="max-h-[74%] max-w-[74%] object-contain"
                      />
                    </div>
                    <div className={item.captionClassName || 'text-black text-base md:text-lg font-medium leading-relaxed'}>
                      {item.title}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* немного нижнего «воздуха» */}
          <div className="mt-4 md:mt-6" />
        </div>

        {/* КАРТИНКА СПРАВА С РЕЖИМОМ НАЛОЖЕНИЯ SCREEN (только desktop) */}
        {!!screenSrc && (
          <img
            src={screenSrc}
            alt=""
            className="
              hidden md:block pointer-events-none
              absolute right-6 lg:right-10 top-1/2 -translate-y-1/2
              w-[100%] max-w-[1960px] h-auto
              mix-blend-screen opacity-80
            "
            style={{
              // мягкая краевая маска, чтобы края уходили в фон
              WebkitMaskImage:
                'linear-gradient(90deg, rgba(0,0,0,0) 0%, #000 14%, #000 96%, rgba(0,0,0,0) 100%)',
              maskImage:
                'linear-gradient(90deg, rgba(0,0,0,0) 0%, #000 14%, #000 96%, rgba(0,0,0,0) 100%)',
            }}
          />
        )}
      </div>
    </section>
  );
};

export default BlueTrustWithScreen;
