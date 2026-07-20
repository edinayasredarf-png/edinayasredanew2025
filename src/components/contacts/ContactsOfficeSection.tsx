"use client";

const OFFICE_ADDRESS = "Россия, г. Ростов-на-Дону, ул. Комарова, 28/2, офис 430";
// Яндекс.Карты — виджет из «Конструктора» с настроенной меткой (без API-ключа).
const MAP_SRC =
  "https://yandex.ru/map-widget/v1/?um=constructor%3Abc95fd3859638c7daa47e1662aaae6ce55e67126d111841305077e032b13ac18&source=constructor";

export default function ContactsOfficeSection() {
  return (
    <section className="bg-white w-full py-12 md:py-16" aria-label="Наш офис">
      <div className="rd-content-column">
        <h2 className="text-center font-involve text-[#050c26] text-[28px] md:text-[36px] font-medium leading-[1.2] tracking-wide">
          Наш офис
        </h2>
        <p className="mt-4 text-center font-[Raleway] text-base md:text-lg leading-6 text-[#646b85]">
          {OFFICE_ADDRESS}
        </p>
        <div className="mt-8 overflow-hidden rounded-[32px] border border-[#E5E7EB]">
          <iframe
            title="Карта — офис Единой среды в Ростове-на-Дону"
            src={MAP_SRC}
            className="block h-[320px] w-full md:h-[440px]"
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </section>
  );
}
