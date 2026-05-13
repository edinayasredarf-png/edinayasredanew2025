// components/AdvantagesGridSection.tsx
import React from 'react';
import Image from 'next/image';

const AdvantagesGridSection: React.FC = () => {
  const data = {
    title: "Наши преимущества",
    advantagesMobile: [
      {
        title: "Новое оборудование",
        text: "Используем новое оборудование высокой точности, не имеющее аналогов.",
        img: null
      },
      {
        title: "Экспертная команда",
        text: " Объединяем специалистов в области озеленения и цифровых решений.",
        img: "/img/imz4.png"
      },
      {
        title: "Безопасность данных",
        text: "Все информация надежно защищена и хранится в соответствии с требованиями законодательства.",
        img: null
      },
      {
        title: "Масштабируемость",
        text: " Работаем как с локальными объектами, так и с территориями в сотни гектаров.",
        img: "/img/imz4.png"
      },
      {
        title: "Постоплата",
        text: "Предлагаем уникальную возможность. Сначала получаете услугу, а оплачиваете позже.",
        img: "/img/imz4.png"
      },
    ]
  };

  return (
    <section className="py-24 bg-[#f5f7fa]">
      <div className="w-full max-w-page mx-auto flex flex-col items-center gap-16 px-4">
        <h2 className="text-center text-[#313131] text-4xl md:text-[64px] font-medium leading-snug md:leading-[70px]">
          {data.title}
        </h2>

        <div className="relative w-full h-auto lg:h-[620px]">
          {/* Десктопная версия с absolute */}
          <div className="hidden lg:block relative w-full h-full">
            {/* Карточка 1 */}
            <div className="absolute top-0 left-0 w-[364px] min-h-[300px] bg-white rounded-3xl flex flex-col p-2 pb-[67px]">
              <div className="flex flex-col gap-3 px-7 pt-[27px] pb-7">
                <h3 className="text-[#313131] text-[28px] font-medium leading-9">
                  Новое оборудование
                </h3>
                <p className="text-[#7C8A9A] text-xl leading-7">
                  Используем новое оборудование высокой точности, не имеющее аналогов.
                </p>
              </div>
            </div>

            {/* Карточка 2 с изображением */}
            <div className="absolute top-0 left-[372px] w-[736px] h-[300px] bg-white rounded-3xl flex gap-2 p-2">
              <div className="w-[356px] flex flex-col gap-3 px-7 pt-[27px] pb-[123px]">
                <h3 className="text-[#313131] text-[28px] font-medium leading-9">
                  Экспертная команда
                </h3>
                <p className="text-[#7C8A9A] text-xl leading-7">
                  Объединяем специалистов в области озеленения и цифровых решений.
                </p>
              </div>
              <div className="w-[356px] bg-[#f6f7f9] rounded-2xl flex items-center justify-center px-10">
                <Image
                  src="/img/services/izn/8.png"
                  alt="Инвентаризация кладбищ"
                  width={320}
                  height={320}
                />
              </div>
            </div>

            {/* Карточка 3 */}

            <div className="absolute top-0 left-[1116px] w-[364px] min-h-[300px] bg-white rounded-3xl flex flex-col p-2 ">
              <div className="flex flex-col gap-3 px-7 pt-[27px] pb-7">
                <h3 className="text-[#313131] text-[28px] font-medium leading-9">
                  Безопасность данных
                </h3>
                <p className="text-[#7C8A9A] text-xl leading-7">
                  Все информация надежно защищена и хранится в соответствии с требованиями законодательства.
                </p>
              </div>
            </div>

            {/* Карточка 4 с изображением */}
            <div className="absolute top-[308px] left-0 w-[736px] min-h-[300px] bg-white rounded-3xl flex gap-2 p-2">
              <div className="w-[356px] bg-[#f6f7f9] rounded-2xl flex items-center justify-center px-10 py-10">
                <Image
                  src="/img/services/izn/9.png"
                  alt="Инвентаризация кладбищ"
                  width={320}
                  height={320}
                />
              </div>
              <div className="w-[356px] flex flex-col gap-3 px-7 pt-[27px] pb-[87px]">
                <h3 className="text-[#313131] text-[28px] font-medium leading-9">
                  Масштабируемость
                </h3>
                <p className="text-[#7c8a9a] text-xl leading-7">
                  Работаем как с локальными объектами, так и с территориями в сотни гектаров.
                </p>
              </div>
            </div>

            {/* Карточка 5 с изображением */}
            <div className="absolute top-[308px] left-[744px] w-[736px] min-h-[300px] bg-white rounded-3xl flex gap-2 p-2">
              <div className="w-[356px] flex flex-col gap-3 px-7 pt-[27px] pb-[87px]">
                <h3 className="text-[#313131] text-[28px] font-medium">
                  Постоплата
                </h3>
                <p className="text-[#7C8A9A] text-xl leading-7">
                  Предлагаем уникальную возможность. Сначала получаете услугу, а оплачиваете позже.
                </p>
              </div>
              <div className="w-[356px] bg-[#f6f7f9] rounded-2xl flex items-center justify-center px-10">
                <Image
                  src="/img/services/izn/10.png"
                  alt="Инвентаризация кладбищ"
                  width={220}
                  height={220}
                />
              </div>
            </div>
          </div>

          {/* Мобильная/планшетная версия */}
          <div className="block lg:hidden flex flex-col gap-2">
            {data.advantagesMobile.map((card, idx) => (
              <div key={idx} className="bg-white rounded-3xl flex flex-col md:flex-row gap-4 p-6">
                {card.img && (
                  <div className="flex-1 bg-[#f6f7f9] rounded-2xl flex items-center justify-center p-6">
                    <Image src={card.img} alt={card.title} width={320} height={320} />
                  </div>
                )}
                <div className="flex-1 flex flex-col gap-3">
                  <h3 className="text-[#313131] text-2xl font-medium">{card.title}</h3>
                  <p className="text-[#7c8a9a] text-base leading-relaxed">{card.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AdvantagesGridSection;