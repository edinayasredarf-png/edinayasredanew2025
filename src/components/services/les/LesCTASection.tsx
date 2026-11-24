'use client';
import Image from 'next/image';

interface Props {
  onButtonClick: () => void;
  title?: React.ReactNode;
  description?: string;
  imageAlt?: string;
}

export default function LesCTASection({ onButtonClick, title, description, imageAlt }: Props) {
  return (
    <section className="max-w-[980px] mx-auto px-4 py-24">
      <div className="bg-[#F6F7F9] rounded-3xl p-2 flex flex-col lg:flex-row gap-8 lg:gap-12">
        <div className="lg:w-1/2 flex flex-col justify-center p-6">
          <h2 className="text-[#313131] text-3xl md:text-[28px] font-medium leading-snug mb-6">
            {title ?? <>Рассчитаем стоимость <br />лесоустройства вашей территории</>}
          </h2>
          <p className="text-[#7c8a9a] text-lg leading-relaxed mb-8">
            {description ?? "Стоимость зависит от площади и характеристик лесной территории, актуальности материалов предыдущего лесоустройства, объёма таксационных и картографических работ. Оставьте заявку — подготовим индивидуальный расчёт обследования лесов и разработки лесоустроительной документации."}
          </p>
          <div>
            <button
              onClick={onButtonClick}
              className="bg-[#029cda] hover:bg-[#0066db] text-white text-lg font-medium px-8 py-4 rounded-xl transition"
            >
              Оставить заявку
            </button>
          </div>
        </div>
        <div className="lg:w-1/2 bg-white rounded-2xl flex items-center justify-center p-6">
          <Image
            src="/img/imz_cta.png"
            alt={imageAlt ?? "Расчёт стоимости лесоустройства и подготовки лесной документации"}
            width={320}
            height={320}
          />
        </div>
      </div>
    </section>
  );
}
