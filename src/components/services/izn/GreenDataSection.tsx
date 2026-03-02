// components/GreenDataSection.tsx
import React from 'react';
import Image from 'next/image';

const GreenDataSection: React.FC = () => {
  const items = [
    "управления городскими и корпоративными территориями",
    "подготовки проектов благоустройства",
    "реконструкции объектов",
    "прохождения проверок",
    "планирования ухода за насаждениями"
  ];

  return (
    <section className="max-w-[1480px] mx-auto px-4 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
        {/* TOP BLOCK — занимает всю ширину */}
        <div className="lg:col-span-3 bg-white rounded-3xl p-2 flex flex-col lg:flex-row gap-2">
          <div className="lg:w-1/2 bg-[#f6f7f9] rounded-2xl flex items-center justify-center p-2">
            <Image
              src="/img/services/izn/1.png"
              alt="Актуальные данные об инвентаризации"
              width={180}
              height={180}
            />
          </div>
          <div className="lg:w-1/2 bg-white rounded-3xl p-4 flex flex-col justify-center">
            <h3 className="text-2xl text-[#313131] py-4 mb-4">
              Актуальные данные о зеленом фонде необходимы для:
            </h3>
            <ul className="space-y-2 pl-0 text-[#7C8A9A]">
              {items.map((item, i) => (
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
        </div>

        {/* BOTTOM LEFT — маленький блок */}
        <div className="bg-white rounded-3xl p-6 flex flex-col justify-center">
          <h3 className="text-2xl text-[#313131] mb-4">
            Без системного учета невозможно принимать обоснованные управленческие решения
          </h3>
          <p className="text-lg text-[#7c8a9a]">
            Именно поэтому инвентаризация является базовым инструментом современного территориального менеджмента.
          </p>
        </div>

        {/* BOTTOM RIGHT — большой блок */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-2 flex flex-col lg:flex-row gap-2">
          <div className="lg:w-1/2 flex flex-col justify-center px-4 py-4">
            <h3 className="text-2xl text-[#313131] mb-4">
              В отличие от традиционного подхода, мы создаем не просто отчет
            </h3>
            <p className="text-lg text-[#7c8a9a]">
              А цифровую модель зеленых насаждений, готовую к дальнейшему использованию и обновлению.
            </p>
          </div>
          <div className="lg:w-1/2 bg-[#f6f7f9] rounded-2xl flex items-center justify-center p-2">
            <Image
              src="/img/services/izn/2.png"
              alt="Не просто отчет зеленого реестра"
              width={220}
              height={220}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default GreenDataSection;