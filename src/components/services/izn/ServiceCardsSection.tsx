// components/ServiceCardsSection.tsx
import React from 'react';
import Image from 'next/image';

const ServiceCardsSection: React.FC = () => {
  const data = {
    title: "Что входит в услугу",
    subtitle: "Полный цикл работ — от обследования территории до подготовки цифровой модели и отчетной документации.",
    cards: [
      {
        title: "Полевой этап",
        list: [
          "обследование территории",
          "таксация деревьев и кустарников",
          "измерение высоты и диаметра",
          "оценка состояния растений",
          "фотофиксация",
          "геопривязка каждого объекта"
        ],
        image: "/img/services/izn/4.png"
      },
      {
        title: "Камеральная обработка",
        list: [
          "создание цифровой карты",
          "формирование реестра насаждений",
          "структурирование данных",
          "подготовка аналитики"
        ],
        image: "/img/services/izn/5.png"
      },
      {
        title: "Документация",
        list: [
          "паспорта зеленых насаждений",
          "ведомости учета",
          "отчетные материалы",
          "рекомендации по содержанию"
        ],
        image: "/img/services/izn/6.png"
      }
    ]
  };

  return (
    <section className="max-w-[1200px] mx-auto px-4 py-24">
      <h2 className="text-center text-[#313131] text-4xl md:text-[52px] leading-tight">
        {data.title}
      </h2>

      <p className="text-center text-[#7c8a9a] text-xl mt-6 mb-16 max-w-3xl mx-auto">
        {data.subtitle}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
        {data.cards.map((card, i) => (
          <div
            key={i}
            className="bg-[#F6F7F9] rounded-3xl flex flex-col overflow-hidden"
          >
            {/* IMAGE */}
            <div className="p-2">
              <div className="bg-white rounded-2xl flex items-center justify-center h-[260px]">
                <Image
                  src={card.image}
                  alt={card.title}
                  width={160}
                  height={160}
                  className="object-contain"
                />
              </div>
            </div>

            {/* TEXT */}
            <div className="p-6 space-y-4">
              <h3 className="text-[#313131] text-2xl leading-snug">
                {card.title}
              </h3>

              <ul className="space-y-3 text-[#7c8a9a] text-lg leading-relaxed pl-0">
                {card.list.map((item, idx) => (
                  <li
                    key={idx}
                    className="
                      relative pl-6
                      before:content-['']
                      before:absolute
                      before:left-0
                      before:top-1/2
                      before:-translate-y-1/2
                      before:w-2
                      before:h-2
                      before:bg-no-repeat
                      before:bg-contain
                      before:bg-center
                      before:bg-[url('/icons/check_blue.svg')]
                    "
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ServiceCardsSection;