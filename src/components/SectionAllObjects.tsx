import React from 'react';
import Image from 'next/image';

interface ObjectItem {
  icon: string;
  label: string;
}

const objects: ObjectItem[] = [
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

interface ObjectCardProps {
  icon: string;
  label: string;
  index: number;
  totalItems: number;
}

const ObjectCard: React.FC<ObjectCardProps> = ({ icon, label, index, totalItems }) => {
  const COLS = 3;
  const isLastColumn = (index + 1) % COLS === 0;
  const isLastRow = index >= totalItems - COLS;
  const isLastItem = index === totalItems - 1;

  return (
    <div
      className={`
        flex items-center gap-4 p-6 md:p-8
        ${!isLastColumn && !isLastItem ? 'border-r border-[#DCDCDC]' : ''}
        ${!isLastRow ? 'border-b border-[#DCDCDC]' : ''}
      `}
    >
      {/* Иконка */}
      <div className="w-[60px] h-[60px] min-w-[60px] flex items-center justify-center bg-[#0077FF] rounded-[20px]">
        <Image
          src={icon}
          alt={label}
          width={28}
          height={28}
          className="w-7 h-7"
        />
      </div>

      {/* Текст */}
      <p className="md:text-lg lg:text-xl  font-[Raleway] font-medium text-[#313131] leading-7">
        {label}
      </p>
    </div>
  );
};

const SectionAllObjects: React.FC = () => {
  return (
    <section className="py-16 md:py-24">
      <div className="max-w-[1480px] mx-auto px-5 md:px-8">
        {/* Заголовок */}
        <h2 className="text-[#313131] text-center font-medium font-[Raleway] text-[28px] md:text-[36px] lg:text-[48px] leading-tight mb-12 md:mb-16">
          Все объекты в одной системе
        </h2>

        {/* Сетка объектов */}
        <div className="w-full  rounded-[20px] border border-[#DCDCDC] grid grid-cols-1 md:grid-cols-3 overflow-hidden">
          {objects.map((obj, idx) => (
            <ObjectCard
              key={`${obj.icon}-${idx}`}
              icon={obj.icon}
              label={obj.label}
              index={idx}
              totalItems={objects.length}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default SectionAllObjects;
