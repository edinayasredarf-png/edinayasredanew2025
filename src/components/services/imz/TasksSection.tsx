"use client";
import Image from "next/image";

export default function TasksSection() {
  return (
    <section className="max-w-[1200px] mx-auto px-4 py-24">
      <h2 className="text-center text-[#313131] text-4xl md:text-[56px] mb-16">
        Какие задачи решает инвентаризация кладбищ
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
        <div className="lg:col-span-2 bg-[#F6F7F9] rounded-3xl p-2 flex flex-col lg:flex-row gap-2">
          <div className="lg:w-1/2 bg-white rounded-2xl flex items-center justify-center">
            <Image src="/img/imz4.png" alt="Учёт заполненности кладбища: занятые и свободные места" width={320} height={320} />
          </div>
          <div className="lg:w-1/2 flex flex-col justify-center px-8 py-4">
            <h3 className="text-2xl text-[#313131] mb-4">Полная картина заполненности кладбищ</h3>
            <p className="text-lg text-[#7c8a9a]">Определение фактического количества захоронений, свободных мест и резервов.</p>
          </div>
        </div>

        <div className="bg-[#F6F7F9] rounded-3xl px-8 py-6 flex flex-col justify-center">
          <h3 className="text-2xl text-[#313131] mb-4">Наведение порядка в книгах захоронений</h3>
          <p className="text-lg text-[#7c8a9a]">Сопоставление архивных записей с фактическими данными, устранение дубликатов и ошибок.</p>
        </div>

        <div className="bg-[#F6F7F9] rounded-3xl px-8 py-6 flex flex-col justify-center">
          <h3 className="text-2xl text-[#313131] mb-4">Исполнение нормативных требований</h3>
          <p className="text-lg text-[#7c8a9a]">Подготовка к переходу на государственные системы учета.</p>
        </div>

        <div className="lg:col-span-2 bg-[#F6F7F9] rounded-3xl p-2 flex flex-col lg:flex-row gap-2">
          <div className="lg:w-1/2 flex flex-col justify-center px-8 py-4">
            <h3 className="text-2xl text-[#313131] mb-4">Повышение качества сервисов для граждан</h3>
            <p className="text-lg text-[#7c8a9a]">Поиск захоронений по фамилии и оформление обращений онлайн на основе актуальных данных.</p>
          </div>
          <div className="lg:w-1/2 bg-white rounded-2xl flex items-center justify-center">
            <Image src="/img/imz5.png" alt="Онлайн-поиск захоронений по фамилии" width={320} height={320} />
          </div>
        </div>
      </div>
    </section>
  );
}