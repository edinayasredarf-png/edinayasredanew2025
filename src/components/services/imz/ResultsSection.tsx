"use client";

export default function ResultsSection({ onConsult }: any) {
  return (
    <section className="max-w-[880px] mx-auto px-4 py-24">
      <h2 className="text-center text-[#313131] text-4xl md:text-[52px] font-medium leading-tight mb-16">
        Результат для муниципалитета и граждан
      </h2>

      <div className="flex flex-col lg:flex-row gap-2">
        <div className="bg-white rounded-3xl p-6 flex-1 relative flex flex-col">
          <h3 className="text-[#313131] text-xl md:text-2xl font-semibold mb-4">Для администрации и служб</h3>
          <p className="text-[#7c8a9a] text-lg leading-relaxed mt-4">
            Актуальная электронная карта кладбищ и реестр мест захоронений, отчетность и планирование развития территорий.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 flex-1 relative flex flex-col">
          <h3 className="text-[#313131] text-xl md:text-2xl font-semibold mb-4">Для жителей</h3>
          <p className="text-[#7c8a9a] text-lg leading-relaxed mt-4">
            Удобный поиск захоронений по фамилии, доступ к информации онлайн и возможность заказать услуги по уходу.
          </p>
        </div>
      </div>

      <div className="flex justify-center mt-12">
        <button onClick={onConsult} className="bg-[#0077FF] hover:bg-[#0066db] text-white text-lg font-medium px-8 py-4 rounded-xl transition">
          Получить консультацию
        </button>
      </div>
    </section>
  );
}