import React from 'react';
import Image from 'next/image';
import { useModal } from './ModalProvider';

const tags = ['Надёжно', 'Быстро', 'Бесплатно'];

const SectionMigration = () => {
  const { openConsult } = useModal();

  return (
    <section className="bg-white w-full py-10 md:py-14 lg:py-16">
      <div className="rd-content-column font-[Raleway]">
        <h2 className="font-involve text-[#313131] text-center text-[clamp(1.75rem,4vw,3rem)] leading-[1.2] mb-8 md:mb-12 max-w-[560px] mx-auto">
          Бесплатный перенос данных в платформу
        </h2>

        <div className="bg-[#F6F7F9] rounded-2xl p-2">
          <div className="flex flex-col lg:flex-row gap-6">

            {/* Левая часть */}
            <div className="w-full lg:w-[calc(100%-222px-24px)] p-6 lg:p-8 flex flex-col">
              {/* Теги */}
              <div className="flex flex-wrap gap-2 mb-8 text-[#313131} font-medium font-{Raleway}">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1.5 rd-block rounded-md text-black text-sm font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Текст */}
              <div className="space-y-6 mb-10 flex-grow text-[#7C8A9A] font-medium">
                <p className="text-[17px] lg:text-[19px] leading-7">
                  Поможем интегрировать ваши текущие наработки и реестры в &quot;Единую Среду&quot;, сохраняя структуру и полноту информации.
                </p>
                <p className=" text-[17px] lg:text-[19px] leading-7">
                  Даже если ваши данные хранятся в разных форматах или частично неструктурированы — мы найдём решение.
                </p>
                <p className=" text-[17px] lg:text-[19px] leading-7">
                  На каждом этапе внедрения вас сопровождает команда специалистов: от первичной консультации до полной настройки и проверки корректности переноса.
                </p>
              </div>

              {/* Кнопка */}
              <div>
                <button
                  type="button"
                  onClick={openConsult}
									className="w-full lg:w-auto px-5 py-3.5 bg-[#029cda] text-white rounded-xl text-base lg:text-lg font-medium hover:bg-[#0066DD] transition-colors"
									>
                  Получить консультацию
                </button>
              </div>
            </div>

            {/* Правая часть - серый блок */}
            <div className="w-full lg:w-[722px] rd-block rounded-2xl p-8 lg:p-12 flex items-center justify-center min-h-[350px] lg:min-h-[414px]">
              <Image
                src="/img/migrations.png"
                alt="Миграция серверов"
                width={434}
                height={301}
                className="w-full h-auto max-w-[90%] object-contain"
                priority
              />
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};

export default SectionMigration;
