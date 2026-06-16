// components/TasksSection.tsx
import React from 'react';

interface TasksSectionProps {
  onButtonClick: () => void;
}

const TasksSection: React.FC<TasksSectionProps> = ({ onButtonClick }) => {
  const data = {
    title: "Какие задачи решает инвентаризация",
    tasks: [
      {
        label: 'Cформировать актуальный реестр зеленого фонда',
        description: 'Создание полного и актуального реестра всех деревьев, кустарников и других зеленых насаждений на вашей территории. Это позволяет отслеживать состояние объектов и вести системное управление.'
      },
      {
        label: 'Выявить аварийные и потенциально опасные деревья',
        description: 'Определение деревьев, представляющих угрозу безопасности, с указанием их местоположения и состояния. Раннее выявление позволяет предотвратить инциденты и снизить риски для людей и инфраструктуры.'
      },
      {
        label: 'Снизить расходы на содержание территории',
        description: 'Система включает возможности для получения полной и развернутой информации по каждому месту захоронения. Данные можно использовать для отчетов и планирования.'
      },
      {
        label: 'Подготовиться к благоустройству или строительству',
        description: 'Данные инвентаризации дают документальное обоснование для проведения работ по вырубке или пересадке деревьев. Это снижает юридические риски и делает решения прозрачными для контролирующих органов.'
      },
      {
        label: 'Повысить экологическую устойчивость территории',
        description: 'Анализ состава и состояния зеленых насаждений помогает создавать сбалансированные экосистемы, улучшать микроклимат и повышать экологическое качество городской или частной территории.'
      },
      {
        label: 'Исключить ошибки в дендропланах',
        description: 'Достоверные данные о возрасте, породе и расположении растений обеспечивают точность дендропланов и карт озеленения, предотвращая ошибки при планировании работ и реконструкции.'
      },
    ]
  };

  return (
    <section className="bg-[#f5f7fa] py-24">
      <div className="max-w-[1200px] mx-auto px-4">
        <h2 className="text-center text-[#313131] text-4xl md:text-[56px] font-medium leading-tight mb-16">
          {data.title}
        </h2>

        <div className="rounded-[20px] border border-[#e3e8f2] overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {data.tasks.map((item, index) => (
              <div
                key={index}
                className={`
                  p-10
                  border-[#e3e8f2]
                  ${index % 3 !== 2 ? 'lg:border-r' : ''}
                  ${index < 3 ? 'border-b' : ''}
                `}
              >
                <h3 className="text-[#313131] text-2xl font-medium mb-4">
                  {item.label}
                </h3>
                <p className="text-[#7c8a9a] text-lg leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>

          <div className="flex justify-center py-12">
            <button
              onClick={onButtonClick}
              className="bg-[#029cda] hover:bg-[#0066db] text-white text-lg font-medium px-8 py-4 rounded-xl transition"
            >
              Оставить заявку
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TasksSection;