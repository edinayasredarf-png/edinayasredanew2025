// components/WorkflowStepsSection.tsx
import React from 'react';

const WorkflowStepsSection: React.FC = () => {
  const data = {
    title: "Как проходит работа",
    steps: [
      "Предварительный анализ — изучаем территорию и задачи.",
      "Подготовка методики — определяем формат учета.",
      "Полевые работы — проводим обследование.",
      "Оцифровка данных — формируем карту и реестр.",
      "Передача результатов — предоставляем готовую систему и документацию."
    ]
  };

  return (
    <section className="py-24 bg-[#f5f7fa]">
      <div className="max-w-[1200px] mx-auto px-4 flex flex-col items-center gap-12">
			<h2 className="text-center text-[#313131] text-4xl md:text-[56px] font-medium leading-tight mb-6">
			{data.title}
        </h2>

        <div className="relative w-full flex flex-col items-center gap-6">
          {data.steps.map((text, i) => {
            const isLeft = i % 2 === 0;

            return (
              <div
                key={i}
                className="relative w-full flex justify-center items-center"
              >
                {/* СТРЕЛКА → видна только на md+ */}
                {i < data.steps.length - 1 && (
                  <div
                    className={`
                      absolute
                      ${isLeft ? 'left-[8%]' : 'right-[8%]'}
                      top-[130%]
                      -translate-y-1/2
                      z-0
                      pointer-events-none
                      hidden md:block
                    `}
                  >
                    <img
                      src={
                        isLeft
                          ? '/icons/arrow-step-left.svg'
                          : '/icons/arrow-step-right.svg'
                      }
                      alt="Стрелка"
                      className="w-[420px] h-[420px]"
                    />
                  </div>
                )}

                {/* Карточка шага */}
                <div
                  className={`
                    relative z-10
                    max-w-full
                    bg-white
                    rounded-2xl
                    px-4 py-2
                    flex items-center gap-6
                    transition-all duration-300
                    justify-center md:${isLeft ? 'justify-start' : 'justify-end'}
                  `}
                >
                  {/* Номер */}
                  <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-[#029cda] text-white text-xl font-medium rounded-2xl">
                    {i + 1}
                  </div>

                  {/* Текст */}
                  <p className="text-[#313131] text-xl font-medium leading-relaxed text-center md:text-left">
                    {text}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default WorkflowStepsSection;