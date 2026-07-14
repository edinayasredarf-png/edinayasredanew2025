'use client';
import Image from 'next/image';

interface Props {
  onButtonClick: () => void;
}

const steps = [
  {
    title: "Подготовительный этап",
    text: "Включает проведение первого лесоустроительного совещания, получение сведений от Заказчика, сбор и анализ данных, подготовку топографических карт и обеспечение космической съёмкой.",
    image: "/img/imz6.png"
  },
  {
    title: "Полевые работы",
    text: "Включает выезд на объект работ, проведение тренировок, таксацию лесов с использованием специализированного оборудования и приемку-сдачу полевых работ.",
    image: "/img/imz7.png"
  },
  {
    title: "Камеральные работы",
    text: "Включает камеральную обработку лесоустроительной информации, составление документации, подготовку картографической информации и финальную сдачу работ.",
    image: "/img/imz8.png"
  },
];

export default function LesWorkflowSection({ onButtonClick }: Props) {
  return (
    <section className="max-w-[880px] mx-auto px-4 py-24">
      <h2 className="text-center text-[#313131] text-4xl md:text-[52px] mb-16">
        Как проводится лесоустройство
      </h2>
      <div className="flex flex-col gap-4">
        {steps.map((item, i) => (
          <div key={i} className="bg-[#F6F7F9] rounded-3xl p-2 flex flex-col lg:flex-row gap-8 transition">
            <div className="lg:w-1/2 bg-white rounded-2xl flex items-center justify-center p-8 min-h-[260px]">
              <Image
                src={item.image}
                alt={item.title}
                width={260}
                height={260}
                className="object-contain"
              />
            </div>
            <div className="lg:w-1/2 flex flex-col justify-center p-6">
              <h3 className="text-2xl mb-4 text-[#313131]">{item.title}</h3>
              <p className="text-lg text-[#7c8a9a] leading-relaxed">{item.text}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-center mt-12">
        <button
          onClick={onButtonClick}
          className="bg-[#029cda] hover:bg-[#0066db] text-white text-lg font-medium px-8 py-4 rounded-xl transition hover:scale-[1.03]"
        >
          Получить консультацию
        </button>
      </div>
    </section>
  );
}
