import React from "react";

interface ServiceLeadDefinitionProps {
  /** Заголовок-вопрос, напр. «Что такое инвентаризация мест захоронений» */
  heading: string;
  /** Самодостаточное определение (2–3 предложения) — цельный пассаж для цитирования */
  answer: string;
  /** Предложение об исполнителе — «Единая среда» */
  provider?: string;
  /** Короткие факты-чипы под текстом */
  facts?: string[];
}

/**
 * Блок-определение в начале сервисной страницы.
 * Первый абзац отвечает на запрос «что такое …» цельным самодостаточным пассажем,
 * который ИИ-системы (ChatGPT, Perplexity, Google AI Overviews) извлекают и цитируют
 * вместе с упоминанием исполнителя. Усиливает GEO-видимость по категорийным запросам.
 */
export default function ServiceLeadDefinition({
  heading,
  answer,
  provider,
  facts,
}: ServiceLeadDefinitionProps) {
  return (
    <section className="py-12 md:py-16 bg-white font-raleway">
      <div className="rd-content-column">
        <div className="max-w-3xl">
          <h2 className="text-2xl md:text-3xl lg:text-4xl text-[#313131] font-medium mb-5">
            {heading}
          </h2>
          <p className="text-lg md:text-xl leading-relaxed text-[#313131]">
            {answer}
          </p>
          {provider && (
            <p className="mt-4 text-base md:text-lg leading-relaxed text-gray-600">
              {provider}
            </p>
          )}
          {facts && facts.length > 0 && (
            <ul className="mt-6 flex flex-wrap gap-3">
              {facts.map((f, i) => (
                <li
                  key={i}
                  className="rounded-full bg-[#F5F7FA] text-[#313131] text-sm md:text-base px-4 py-2 shadow-[0_0_0_1px_rgba(15,23,42,0.06)]"
                >
                  {f}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
