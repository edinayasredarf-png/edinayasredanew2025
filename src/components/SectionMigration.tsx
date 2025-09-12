import React from 'react';
import Image from 'next/image';
import { useModal } from './ModalProvider';

const tags = ['Надёжно', 'Быстро', 'Бесплатно'];

const SectionMigration = () => {
  const { openConsult } = useModal();
  return (
    <section className="w-full flex flex-col items-center mt-16">
      <div className="max-w-[1480px] mx-auto px-5 md:px-8">
        <div className="w-full min-h-[540px] p-2 md:p-4 bg-white rounded-[20px] flex flex-col md:flex-row justify-center items-stretch gap-6">
          {/* Левая часть */}
          <div className="w-full md:w-[538px] flex flex-col relative py-4 md:py-8 pl-2 md:pl-8 pr-2 md:pr-8">
            {/* Теги */}
            <div className="flex gap-2 mb-6 mt-6 md:mt-0">
              {tags.map((tag) => (
                <span key={tag} className="px-2 py-1.5 bg-[#F6F7F9] rounded-lg text-black text-sm md:text-base">
                  {tag}
                </span>
              ))}
            </div>
            {/* Список */}
            <ul className="flex flex-col gap-4 mb-8 pl-2">
              <li className="text-black text-sm md:text-base lg:text-lg">
                Поможем интегрировать ваши текущие наработки и реестры в &quot;Единую Среду&quot;, сохраняя структуру и полноту информации.
              </li>
              <li className="text-black text-sm md:text-base lg:text-lg">
                Даже если ваши данные хранятся в разных форматах или частично неструктурированы — мы найдём решение.
              </li>
              <li className="text-black text-sm md:text-base lg:text-lg">
                На каждом этапе миграции вас сопровождает команда специалистов: от первичной консультации до полной настройки и проверки корректности переноса.
              </li>
            </ul>
            {/* Кнопка */}
            <button
              type="button"
              onClick={openConsult}
              className="inline-block px-6 py-3 bg-[#0077FF] text-white rounded-xl font-medium text-sm md:text-base lg:text-lg text-center hover:bg-[#0077FF]/90 transition-colors open-consult-modal"
            >
              Получить консультацию
            </button>
          </div>
          {/* Правая часть */}
          <div className= "bg-[#F6F7F9] rounded-3xl  w-full md:w-1/2 flex justify-center items-center py-4 md:py-8 pl-2 md:pl-8 pr-2 md:pr-8">
                            <div className=" flex justify-center items-center aspect-square w-full max-w-[320px] mx-auto md:max-w-[560px]">
              <Image
                src="/img/migrations.png"
                alt="Миграция серверов"
                width={220}
                height={220}
                className="w-full h-auto max-w-[80%] mx-auto object-contain"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SectionMigration;