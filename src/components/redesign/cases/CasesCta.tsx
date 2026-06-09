'use client';

type CasesCtaProps = {
  onConsult: () => void;
};

export function CasesCta({ onConsult }: CasesCtaProps) {
  return (
    <section className="py-16 md:py-24 font-involve font-medium lining-nums">
      <div className="case-page-column">
        <div className="relative overflow-hidden rounded-[var(--rd-radius-xl,2rem)] bg-[#029cda] text-white px-8 py-14 md:px-16 md:py-20 text-center">
         
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="font-involve text-2xl md:text-4xl leading-tight">
              Готовы реализовать похожий проект?
            </h2>
            <p className="mt-4 text-lg text-white/70">
              Свяжитесь с нами — обсудим задачи и подготовим персональное предложение
            </p>
            <button
              type="button"
              onClick={onConsult}
              className="mt-8 inline-flex items-center justify-center bg-[#ffffff] text-black px-8 py-4 rounded-2xl text-lg font-medium hover:bg-[#ffffff] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            >
              Получить консультацию
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
