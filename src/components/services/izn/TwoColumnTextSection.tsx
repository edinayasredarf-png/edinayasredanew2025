// components/TwoColumnTextSection.tsx
import React from 'react';

const TwoColumnTextSection: React.FC = () => {
  const data = {
    title: "Что такое инвентаризация зеленых насаждений",
    paragraphs: [
      "Инвентаризация зеленых насаждений — это комплекс профессиональных работ по учету деревьев, кустарников и других элементов озеленения с последующим формированием реестра территории.",
      "В ходе обследования специалисты определяют количественные и качественные характеристики растений, оценивают их состояние, выявляют аварийные экземпляры и фиксируют точное расположение каждого объекта."
    ]
  };

  return (
    <section className="font-[Raleway] py-14 md:py-20">
      <div className="max-w-page mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-[50px] items-start">
          <h2 className="text-[#313131] font-medium text-3xl sm:text-4xl lg:text-[52px] leading-tight lg:leading-[57px] max-w-[720px]">
            {data.title}
          </h2>

          <div className="text-[#6B7280] text-base sm:text-lg leading-7 max-w-[720px]">
            {data.paragraphs.map((paragraph, index) => (
              <p key={index} className={index > 0 ? 'mt-4' : ''}>
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TwoColumnTextSection;