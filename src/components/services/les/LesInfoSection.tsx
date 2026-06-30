'use client';
import Image from 'next/image';

export default function LesInfoSection() {
  return (
    <section className="py-24 bg-[#f5f7fa]">
      <div className="max-w-[1200px] mx-auto px-4">
        <h2 className="text-center text-[#313131] text-4xl md:text-[56px] font-medium leading-tight mb-16">
          Мы более 17 лет работаем на этом рынке и знаем об лесоустройстве всё
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
          <div className="bg-white rounded-3xl p-9 flex flex-col justify-between min-h-[420px]">
            <h3 className="text-[#313131] text-2xl md:text-[26px] leading-snug">
              Что такое лесоустройство
            </h3>
            <p className="text-[#7c8a9a] text-lg md:text-xl leading-relaxed">
              Лесоустройство — это система мероприятий по изучению лесного фонда, оценке его состояния и планированию рационального использования лесных ресурсов.<br />
              В ходе работ формируется достоверная информационная база о лесных территориях: определяется состав насаждений, их возраст, состояние, экологическая ценность и потенциал использования.
            </p>
          </div>
          <div className="bg-white rounded-3xl p-2 flex items-center">
            <div className="w-full h-full min-h-[420px] bg-[#f6f7f9] rounded-2xl flex items-center justify-center">
              <Image
                src="/img/services/izn/7.png"
                alt="Цифровая система"
                width={260}
                height={220}
                className="object-contain"
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="bg-white rounded-3xl p-9">
              <h3 className="text-[#313131] text-2xl mb-4">
                Результаты лесоустройства становятся основой для:
              </h3>
              <ul className="space-y-3 text-[#7c8a9a] text-lg leading-relaxed">
                {[
                  "стратегического развития территорий",
                  "охраны и восстановления лесов",
                  "повышения эффективности управления",
                  "экологической безопасности региона"
                ].map((item, i) => (
                  <li
                    key={i}
                    className="relative pl-6 before:content-[''] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-2 before:h-2 before:bg-no-repeat before:bg-contain before:bg-center before:bg-[url('/icons/check_blue.svg')]"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white rounded-3xl px-9 py-6">
              <p className="text-[#7c8a9a] text-lg leading-relaxed">
                Грамотно проведённое лесоустройство помогает не только сохранить природный потенциал, но и использовать его максимально рационально.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
