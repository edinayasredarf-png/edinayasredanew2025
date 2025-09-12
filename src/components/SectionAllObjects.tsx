import React from 'react';
import Image from 'next/image';

const objects = [
  { icon: '/icons/Cemetery.svg', label: 'Кладбища и захоронения' },
  { icon: '/icons/Tree.svg', label: 'Зеленые насаждения' },
  { icon: '/icons/Trash.svg', label: 'Места складирования отходов' },
  { icon: '/icons/Banner.svg', label: 'Рекламные конструкции' },
  { icon: '/icons/Landscape.svg', label: 'Элементы благоустройства' },
  { icon: '/icons/Retail.svg', label: 'Торговые точки' },
  { icon: '/icons/Power Line Icon 1.svg', label: 'ЛЭП и наземные коммуникации' },
  { icon: '/icons/Fountain filled 1.svg', label: 'МАФы' },
  { icon: '/icons/City.svg', label: 'и другие объекты городской среды' },
];

const ObjectCard: React.FC<{ icon: string; label: string; withRightBorder?: boolean; withBottomBorder?: boolean }> = ({ icon, label, withRightBorder, withBottomBorder }) => (
  <div className={`flex flex-col h-auto p-8 ${withRightBorder ? 'border-r border-grey-92' : ''} ${withBottomBorder ? 'border-b border-grey-92' : ''}`}>
    <div className="flex items-center mb-4">
      <div className="w-[60px] h-[60px] min-w-[60px] flex items-center justify-center bg-[#0077FF] rounded-[20px] mr-4">
        <Image src={icon} alt="" width={28} height={28} className="w-7 h-7" />
      </div>
      <div className="text-black text-base md:text-lg lg:text-xl font-normal leading-7">
        {label}
      </div>
    </div>
    {/* Разделитель только если не последняя строка */}
    {/* <div className="h-px w-full bg-grey-92 mt-auto"></div> */}
  </div>
);

const SectionAllObjects = () => (
  <section className="w-full flex flex-col items-center mt-16">
    <div className="max-w-[1480px] w-full flex flex-col items-start gap-16 px-5 md:px-8">
      {/* Заголовок */}
      <div className="w-full flex flex-col items-center">
        <h2 className="text-center font-medium text-black text-lg md:text-2xl lg:text-4xl leading-tight">
          Учитывайте все объекты в одной системе
        </h2>
      </div>
      {/* Список */}
      <div className="w-full rounded-[20px] outline outline-1 outline-grey-92 grid grid-cols-1 md:grid-cols-3 gap-0">
        {objects.map((obj, idx) => (
          <ObjectCard
            key={obj.label}
            icon={obj.icon}
            label={obj.label}
            withRightBorder={idx % 3 !== 2 && idx !== objects.length - 1}
            withBottomBorder={idx < 6}
          />
        ))}
      </div>
    </div>
  </section>
);

export default SectionAllObjects; 