'use client';
import Image from 'next/image';

interface Props {
  onButtonClick: () => void;
}

export default function LesAudienceSection({ onButtonClick }: Props) {
  return (
    <section className="py-24 bg-[#f5f7fa]">
      <div className="max-w-[1200px] mx-auto px-4">
        <h2 className="text-center text-[#313131] text-4xl md:text-[56px] font-medium leading-tight mb-16">
          Кому необходимо лесоустройство
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mb-2">
          <div className="bg-[#F6F7F9] rounded-3xl p-6">
            <h3 className="text-[#313131] text-2xl font-medium mb-4">Муниципалитетам</h3>
            <p className="text-[#7c8a9a] text-lg leading-6">
              Для контроля состояния лесного фонда и повышения прозрачности управления.
            </p>
          </div>
          <div className="bg-[#F6F7F9] rounded-3xl p-6">
            <h3 className="text-[#313131] text-2xl font-medium mb-4">Региональным органам власти</h3>
            <p className="text-[#7c8a9a] text-lg leading-6">
              При развитии территорий и реализации природоохранных программ.
            </p>
          </div>
          <div className="bg-[#F6F7F9] rounded-3xl p-6">
            <h3 className="text-[#313131] text-2xl font-medium mb-4">Лесничества</h3>
            <p className="text-[#7c8a9a] text-lg leading-6">
              И профильные учреждения, для актуализации данных и планирования работ
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 mb-12">
          <div className="bg-[#F6F7F9] rounded-3xl p-6">
            <h3 className="text-[#313131] text-2xl font-medium mb-4">Арендаторам лесных участков</h3>
            <p className="text-[#7c8a9a] text-lg leading-6">
              Для законного и эффективного использования ресурсов
            </p>
          </div>
          <div className="lg:col-span-2 bg-[#F6F7F9] rounded-3xl p-2 flex flex-col lg:flex-row gap-2">
            <div className="lg:w-1/2 flex flex-col p-4">
              <h3 className="text-2xl text-[#313131] mb-4">Инвесторам</h3>
              <p className="text-lg text-[#7c8a9a]">
                При подготовке проектов освоения территорий.
              </p>
            </div>
            <div className="lg:w-1/2 bg-white rounded-2xl flex items-center justify-center p-2">
              <Image
                src="/img/services/izn/3.png"
                alt="Система нужна всем"
                width={160}
                height={160}
              />
            </div>
          </div>
        </div>
        <div className="flex justify-center">
          <button
            onClick={onButtonClick}
            className="bg-[#029cda] hover:bg-[#0066db] text-white text-xl font-medium px-8 py-4 rounded-xl transition"
          >
            Оставить заявку
          </button>
        </div>
      </div>
    </section>
  );
}
