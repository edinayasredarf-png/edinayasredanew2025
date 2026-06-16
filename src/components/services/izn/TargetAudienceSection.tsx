// components/TargetAudienceSection.tsx
import React from 'react';
import Image from 'next/image';

interface TargetAudienceSectionProps {
  onButtonClick: () => void;
}

const TargetAudienceSection: React.FC<TargetAudienceSectionProps> = ({ onButtonClick }) => {
  const data = {
    title: "Кому необходима инвентаризация <br />зеленых насаждений",
    cards: [
      {
        title: "Муниципалитеты",
        description: "Для управления городским зеленым фондом, планирования благоустройства и подготовки к проверкам."
      },
      {
        title: "Девелоперы",
        description: "Для корректной подготовки проектной документации и минимизации рисков при строительстве."
      },
      {
        title: "Промышленные предприятия",
        description: "Для контроля санитарно-защитных зон и соблюдения экологических требований."
      },
      {
        title: "Управляющие компании",
        description: "Для системного ухода за придомовыми территориями."
      },
      {
        title: "Парки, санатории, образовательные кампусы",
        description: "Для поддержания безопасной и комфортной среды."
      }
    ]
  };

  return (
    <section className="py-24 bg-[#f5f7fa]">
      <div className="max-w-[1200px] mx-auto px-4">
        <h2
          className="text-center text-[#313131] text-4xl md:text-[56px] font-medium leading-tight mb-16"
          dangerouslySetInnerHTML={{ __html: data.title }}
        />

        {/* Верхний ряд — 3 карточки */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mb-2">
          {data.cards.slice(0, 3).map((card, index) => (
            <div key={index} className="bg-white rounded-3xl p-6">
              <h3 className="text-[#313131] text-2xl font-medium mb-4">{card.title}</h3>
              <p className="text-[#7c8a9a] text-lg leading-6">{card.description}</p>
            </div>
          ))}
        </div>

        {/* Нижний ряд */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 mb-12">
          {/* Левая карточка */}
          <div className="bg-white rounded-3xl p-6">
            <h3 className="text-[#313131] text-2xl font-medium mb-4">{data.cards[3].title}</h3>
            <p className="text-[#7c8a9a] text-lg leading-6">{data.cards[3].description}</p>
          </div>

          {/* Правая большая карточка (занимает 2 колонки) */}
          <div className="lg:col-span-2 bg-white rounded-3xl p-2 flex flex-col lg:flex-row gap-2">
            <div className="lg:w-1/2 flex flex-col p-4">
              <h3 className="text-2xl text-[#313131] mb-4">{data.cards[4].title}</h3>
              <p className="text-lg text-[#7c8a9a]">{data.cards[4].description}</p>
            </div>
            <div className="lg:w-1/2 bg-[#f6f7f9] rounded-2xl flex items-center justify-center p-2">
              <Image
                src="/img/services/izn/3.png"
                alt="Система нужна всем"
                width={160}
                height={160}
              />
            </div>
          </div>
        </div>

        {/* Кнопка */}
        <div className="flex justify-center">
          <button
            onClick={onButtonClick}
            className="bg-[#029cda] hover:bg-[#0066db] text-white text-xl font-medium px-8 py-4 rounded-xl transition"
          >
            Оставить заявку
          </button>
        </div>
      </div>
    </section>
  );
};

export default TargetAudienceSection;