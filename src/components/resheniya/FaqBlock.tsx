import React from "react";

export interface FaqItem {
  q: string;
  a: string;
}

interface FaqBlockProps {
  items: FaqItem[];
  title?: string;
}

/**
 * Видимый FAQ-блок + соответствующий FAQPage JSON-LD.
 * Текст вопросов/ответов — единая точка правды для контента и разметки,
 * чтобы schema всегда совпадала с тем, что видит пользователь и ИИ.
 */
export default function FaqBlock({
  items,
  title = "Частые вопросы",
}: FaqBlockProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((it) => ({
      "@type": "Question",
      name: it.q,
      acceptedAnswer: { "@type": "Answer", text: it.a },
    })),
  };

  return (
    <section className="py-14 md:py-20 bg-[#F5F7FA]">
      <div className="max-w-[1200px] mx-auto px-4">
        <h2 className="text-2xl md:text-3xl lg:text-4xl text-[#313131] font-medium mb-8">
          {title}
        </h2>
        <div className="max-w-3xl space-y-4">
          {items.map((it, i) => (
            <details
              key={i}
              className="group bg-white rounded-2xl p-5 md:p-6 shadow-[0_0_0_1px_rgba(15,23,42,0.06)]"
            >
              <summary className="cursor-pointer list-none flex items-start justify-between gap-4 text-base md:text-lg font-semibold text-[#313131]">
                <span itemProp="name">{it.q}</span>
                <span className="text-[#029cda] shrink-0 transition-transform group-open:rotate-45 text-2xl leading-none">
                  +
                </span>
              </summary>
              <p className="mt-3 text-gray-600 text-sm md:text-base leading-relaxed">
                {it.a}
              </p>
            </details>
          ))}
        </div>
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </section>
  );
}
