import React from 'react';

type Item = {
  title: string; // \n → перенос строки
  icon: string;
};

// Иконки из public/img/who (1–6.svg), порядок = порядок категорий.
const items: Item[] = [
  { title: 'Органы власти\nи муниципалитетам', icon: '/img/who/1.svg' },
  { title: 'Управляющие\nкомпании ЖКХ', icon: '/img/who/2.svg' },
  { title: 'Ритуальные службы', icon: '/img/who/3.svg' },
  { title: 'Образовательным\nучреждениям', icon: '/img/who/4.svg' },
  { title: 'Медицинским\nорганизациям', icon: '/img/who/5.svg' },
  { title: 'Отели и санатории', icon: '/img/who/6.svg' },
];

const SectionAudience: React.FC = () => {
  return (
    <section className="bg-white w-full py-16 md:py-24" aria-label="Кому подходит система">
      <div className="rd-content-column">
        {/* Заголовок + подзаголовок */}
        <div className="flex flex-col items-center text-center">
          <h2 className="max-w-[1120px] font-involve text-[#050c26] text-[32px] md:text-[40px] font-medium leading-[1.15] md:leading-[44px] tracking-wide">
            Кому подходит система
          </h2>
          <p className="mt-4 max-w-[680px] font-[Raleway] text-base leading-6 tracking-tight text-[#646b85]">
            Единая среда работает там, где важно видеть объекты на карте и управлять ими
          </p>
        </div>

        {/* Карточки-категории */}
        <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {items.map((item) => (
            <div
              key={item.title}
              className="bg-[#F6F7F9] rounded-[32px] p-6 flex flex-col items-center text-center"
            >
              <div className="w-12 h-12 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.icon} alt="" className="w-12 h-12 object-contain" />
              </div>
              <span className="mt-6 font-involve text-[#050c26] text-base font-medium leading-6 tracking-wide whitespace-pre-line">
                {item.title}
              </span>
            </div>
          ))}
        </div>

        {/* Нижняя строка */}
        <div className="mt-8 flex justify-center">
          <p className="max-w-[448px] text-center font-[Raleway] text-base font-medium leading-6 tracking-tight text-[#646b85]">
            + любая организация, которой нужно видеть свои объекты на карте и вести по ним учёт
          </p>
        </div>
      </div>
    </section>
  );
};

export default SectionAudience;
