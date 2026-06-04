'use client';

type CasesFilterBarProps = {
  industries?: string[];
  applications: string[];
  selectedIndustry?: string;
  selectedApplication: string;
  onIndustryChange?: (value: string) => void;
  onApplicationChange: (value: string) => void;
  onReset: () => void;
  resultCount: number;
};

export function CasesFilterBar({
  industries,
  applications,
  selectedIndustry,
  selectedApplication,
  onIndustryChange,
  onApplicationChange,
  onReset,
  resultCount,
}: CasesFilterBarProps) {
  const hasIndustry = industries && onIndustryChange && selectedIndustry;
  const hasActiveFilters =
    (hasIndustry && selectedIndustry !== industries![0]) ||
    selectedApplication !== applications[0];

  return (
    <section className="sticky top-0 z-30 py-4 font-[Raleway] font-medium lining-nums">
      <div className="case-page-column">
        <div className="bg-white/90 backdrop-blur-md border border-[var(--rd-border,#e4e7ec)] rounded-2xl px-4 py-4 md:px-6 md:py-5 shadow-[var(--rd-shadow-card)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-3 min-w-0 flex-1">
              {hasIndustry && (
                <FilterPills
                  label="Отрасль"
                  options={industries}
                  value={selectedIndustry}
                  onChange={onIndustryChange}
                />
              )}
              <FilterPills
                label="Тип услуги"
                options={applications}
                value={selectedApplication}
                onChange={onApplicationChange}
              />
            </div>
            <div className="flex items-center justify-between gap-4 lg:flex-col lg:items-end lg:shrink-0">
              <p className="text-sm text-[var(--rd-muted,#667085)] whitespace-nowrap">
                Найдено: <span className="font-medium text-[var(--rd-ink,#101828)]">{resultCount}</span>
              </p>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={onReset}
                  className="text-sm font-medium text-[#029cda] hover:text-[#0288bd] transition-colors whitespace-nowrap"
                >
                  Сбросить фильтры
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FilterPills({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <p className="text-xs text-[var(--rd-muted,#667085)] mb-2 uppercase tracking-wide">{label}</p>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
        {options.map((opt) => {
          const active = value === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                active
                  ? 'bg-[#029cda] text-white shadow-sm'
                  : 'bg-[#f2f4f7] text-[#344054] hover:bg-[#e4e7ec]'
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}
