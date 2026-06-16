"use client";
import Image from "next/image";

export default function AudienceSection() {
  const items = [
    {
      title: "Органы местного самоуправления",
      text: "Ведение реестра, отчетность, планирование развития кладбищ.",
      image: "/img/imz1.png",
    },
    {
      title: "Муниципальные кладбища и МУПы",
      text: "Единая база захоронений и учет мест на кладбище.",
      image: "/img/imz2.png",
    },
    {
      title: "Подрядчики по инвентаризации кладбищ",
      text: "Инструмент для инвентаризации и передачи данных заказчику.",
      image: "/img/imz3.png",
    },
  ];

  return (
    <section className="max-w-[1200px] mx-auto px-4 py-24">
      <h2 className="text-center text-[#313131] text-4xl md:text-[52px] leading-tight mb-16">
        Для кого подходит система инвентаризации мест захоронений
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
        {items.map((card, i) => (
          <div key={i} className="bg-white rounded-3xl flex flex-col overflow-hidden">
            <div className="p-2">
              <div className="bg-[#f6f7f9] rounded-2xl flex items-center justify-center h-[260px]">
                <Image
                  src={card.image}
                  alt={card.title}
                  width={320}
                  height={320}
                  className="object-contain"
                />
              </div>
            </div>

            <div className="px-8 py-6 space-y-4">
              <h3 className="text-[#313131] text-2xl leading-snug">{card.title}</h3>
              <p className="text-[#7c8a9a] text-lg leading-relaxed">{card.text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}