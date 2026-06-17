"use client";
import Image from "next/image";

export default function ProcessSection({ onConsult }: any) {
  const steps = [
    { title: "Подготовка и анализ архивов", text: "Изучение книг захоронений, схем участков и электронных данных.", image: "/img/imz6.png" },
    { title: "Полевые работы", text: "GPS-съемка, фотофиксация и сбор данных по каждому месту захоронения.", image: "/img/imz7.png" },
    { title: "Создание цифрового реестра", text: "Формирование электронной карты кладбища и запуск системы учета.", image: "/img/imz8.png" },
  ];

  return (
    <section className="max-w-[1200px] mx-auto px-4 py-24">
      <h2 className="text-center text-[#313131] text-4xl md:text-[52px] mb-16">
        Как проводится инвентаризация кладбищ
      </h2>

      <div className="flex flex-col gap-4">
        {steps.map((item, i) => (
          <div key={i} className="bg-white rounded-3xl p-2 flex flex-col lg:flex-row gap-8 transition">
            <div className="lg:w-1/2 bg-[#f6f7f9] rounded-2xl flex items-center justify-center p-8 min-h-[260px]">
              <Image src={item.image} alt={item.title} width={260} height={260} className="object-contain" />
            </div>
            <div className="lg:w-1/2 flex flex-col justify-center p-6">
              <h3 className="text-2xl mb-4 text-[#313131]">{item.title}</h3>
              <p className="text-lg text-[#7c8a9a] leading-relaxed">{item.text}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center mt-12">
        <button onClick={onConsult} className="bg-[#029cda] hover:bg-[#0066db] text-white text-lg font-medium px-8 py-4 rounded-xl transition hover:scale-[1.03]">
          Получить консультацию
        </button>
      </div>
    </section>
  );
}