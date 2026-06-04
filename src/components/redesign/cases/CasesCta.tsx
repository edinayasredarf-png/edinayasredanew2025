'use client';

type CasesCtaProps = {
  onConsult: () => void;
};

export function CasesCta({ onConsult }: CasesCtaProps) {
  return (
    <section className="py-16 md:py-24 font-[Raleway] font-medium lining-nums">
      <div className="case-page-column">
        <div className="relative overflow-hidden rounded-[var(--rd-radius-xl,2rem)] bg-[var(--rd-hero-cta-from,#0a0f1a)] text-white px-8 py-14 md:px-16 md:py-20 text-center">
          <div
            className="absolute inset-0 opacity-40 pointer-events-none redesign-hero-mesh"
            aria-hidden
          />
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
              className="mt-8 inline-flex items-center justify-center bg-[#029cda] text-white px-8 py-4 rounded-2xl text-lg font-medium hover:bg-[#0288bd] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            >
              Получить консультацию
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
