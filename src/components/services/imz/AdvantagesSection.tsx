"use client";

export default function AdvantagesSection({ onKP }: any) {
  const advantages = [
    { label: "Признанные эксперты", description: "Мы – признанные эксперты в проведении инвентаризации кладбищ." },
    { label: "Соответствие требованиям", description: "Работаем по постановлению Правительства №2424-р." },
    { label: "Полная информация", description: "Система включает полные сведения по каждому месту захоронения." },
    { label: "Новое оборудование", description: "Используем новое высокоточное оборудование." },
    { label: "Безопасность данных", description: "Все данные надежно защищены." },
    { label: "Постоплата", description: "Услуга доступна с опцией постоплаты." },
  ];

  return (
    <section className="max-w-[1480px] mx-auto px-4 bg-[#f5f7fa] py-24">
      <h2 className="text-center text-[#313131] text-4xl md:text-[56px] font-medium leading-tight mb-16">
        Почему выбирают именно нас
      </h2>

      <div className="rounded-[20px] border border-[#e3e8f2] overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {advantages.map((item, index) => (
            <div key={index} className={`p-10 border-[#e3e8f2] ${index % 3 !== 2 ? "lg:border-r" : ""} ${index < 3 ? "border-b" : ""}`}>
              <h3 className="text-[#313131] text-2xl font-medium mb-4">{item.label}</h3>
              <p className="text-[#7c8a9a] text-lg leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>

        <div className="flex justify-center py-12">
          <button onClick={onKP} className="bg-[#0077FF] hover:bg-[#0066db] text-white text-lg font-medium px-8 py-4 rounded-xl transition">
            Оставить заявку
          </button>
        </div>
      </div>
    </section>
  );
}