// components/DigitalSystemSection.tsx
import React from 'react';
import Image from 'next/image';

const DigitalSystemSection: React.FC = () => {
  const data = {
    title: "Создаем цифровую систему управления зеленым фондом",
    benefits: [
      "интерактивную карту насаждений",
      "централизованную базу данных",
      "быстрый поиск объектов",
      "возможность обновления информации",
      "основу для долгосрочного планирования"
    ]
  };

  return (
    <section className="py-24 bg-[#f5f7fa]">
      <div className="max-w-[1480px] mx-auto px-4">
        <h2 className="text-center text-[#313131] text-4xl md:text-[56px] font-medium leading-tight mb-16">
          {data.title}
        </h2>

        {/* GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
          {/* ЛЕВАЯ БОЛЬШАЯ */}
          <div className="bg-white rounded-3xl p-9 flex flex-col justify-between min-h-[420px]">
            <h3 className="text-[#313131] text-2xl md:text-[26px] leading-snug">
              Классическая инвентаризация часто заканчивается передачей таблиц и
              отчетов, которые быстро устаревают.
            </h3>

            <p className="text-[#7c8a9a] text-lg md:text-xl leading-relaxed">
              Мы идем дальше — формируем цифровую платформу управления территорией.
            </p>
          </div>

          {/* ЦЕНТР — ИЗОБРАЖЕНИЕ */}
          <div className="bg-white rounded-3xl p-2 flex items-center">
            <div className="w-full h-full min-h-[420px] bg-[#f6f7f9] rounded-2xl flex items-center justify-center">
              <Image
                src="/img/services/izn/7.png"
                alt="Цифровая система"
                width={260}
                height={220}
                className="object-contain"
              />
            </div>
          </div>

          {/* ПРАВАЯ КОЛОНКА */}
          <div className="flex flex-col gap-2">
            {/* ВЫ ПОЛУЧАЕТЕ */}
            <div className="bg-white rounded-3xl p-9">
              <h3 className="text-[#313131] text-2xl mb-4">
                Вы получаете:
              </h3>

              <ul className="space-y-3 text-[#7c8a9a] text-lg leading-relaxed">
                {data.benefits.map((item, i) => (
                  <li
                    key={i}
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

            {/* НИЖНИЙ БЛОК */}
            <div className="bg-white rounded-3xl px-9 py-6">
              <p className="text-[#7c8a9a] text-lg leading-relaxed">
                Такой подход особенно эффективен для крупных территорий и
                муниципальных образований, где важны точность данных и скорость
                доступа к информации.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DigitalSystemSection;