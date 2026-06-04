'use client';

type CasesEmptyStateProps = {
  onReset: () => void;
};

export function CasesEmptyState({ onReset }: CasesEmptyStateProps) {
  return (
    <div className="text-center py-20 md:py-28">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--rd-accent-soft,#e6f6fc)] text-3xl mb-6">
        🔍
      </div>
      <h3 className="text-2xl font-medium text-[var(--rd-ink,#101828)] mb-3">
        По выбранным фильтрам ничего не найдено
      </h3>
      <p className="text-[var(--rd-muted,#667085)] mb-8 max-w-md mx-auto">
        Попробуйте другой тип услуги или сбросьте фильтры
      </p>
      <button
        type="button"
        onClick={onReset}
        className="inline-flex bg-[#029cda] text-white px-8 py-3.5 rounded-2xl font-medium hover:bg-[#0288bd] transition-colors"
      >
        Сбросить фильтры
      </button>
    </div>
  );
}
