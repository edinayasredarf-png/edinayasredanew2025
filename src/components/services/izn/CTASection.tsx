// components/CTASection.tsx
import React from 'react';
import Image from 'next/image';

interface CTASectionProps {
  onButtonClick: () => void;
}

const CTASection: React.FC<CTASectionProps> = ({ onButtonClick }) => {
  const data = {
    title: "Оставьте запрос на <br />консультацию с индивидуальным расчетом",
    description: "Цена зависит от нескольких факторов: площади территории, плотности насаждений, сложности ландшафта, объема полевых работ, требований к итоговой документации. Оставьте заявку — подготовим коммерческое предложение в течение 24 часов.",
    buttonText: "Оставить заявку",
    imageSrc: "/img/imz_cta.png",
    imageAlt: "Получить консультацию по инвентаризации и оцифровке мест"
  };

  return (
    <section className="max-w-[1200px] mx-auto px-4 py-24">
      <div className="bg-[#F6F7F9] rounded-3xl p-2 flex flex-col lg:flex-row gap-8 lg:gap-12">
        {/* Текст слева */}
        <div className="lg:w-1/2 flex flex-col justify-center p-6">
          <h2
            className="text-[#313131] text-3xl md:text-[28px] font-medium leading-snug mb-6"
            dangerouslySetInnerHTML={{ __html: data.title }}
          />

          <p className="text-[#7c8a9a] text-lg leading-relaxed mb-8">
            {data.description}
          </p>

          <div>
            <button
              onClick={onButtonClick}
              className="bg-[#029cda] hover:bg-[#0066db] text-white text-lg font-medium px-8 py-4 rounded-xl transition"
            >
              {data.buttonText}
            </button>
          </div>
        </div>

        {/* Изображение справа */}
        <div className="lg:w-1/2 bg-white rounded-2xl flex items-center justify-center p-6">
          <Image
            src={data.imageSrc}
            alt={data.imageAlt}
            width={320}
            height={320}
          />
        </div>
      </div>
    </section>
  );
};

export default CTASection;