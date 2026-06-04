'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Layout from '@/components/Layout';
import { resolveCaseCover } from '@/lib/caseCover';
import { useModal } from '@/components/ModalProvider';
import { CASE_APPLICATION_OPTIONS, sb_listCases } from '@/lib/blogStore';
import {
  CaseCard,
  CasesCta,
  CasesEmptyState,
  CasesFilterBar,
  CasesHero,
  type CaseCardItem,
} from '@/components/redesign/cases';
import '@/styles/redesign.css';

type DynCase = {
	id: string;
	slug: string;
	title: string;
	subtitle: string;
	cover?: string;
	contentHtml?: string;
	application?: string;
	location?: string;
	createdAt: number;
};

let _casesCache: DynCase[] | null = null;

export default function CasesPage() {
  const { openConsult } = useModal();
  const [items, setItems] = useState<DynCase[]>(_casesCache || []);
  const [loading, setLoading] = useState(_casesCache === null);
  const [selectedApplication, setSelectedApplication] = useState('Все типы');

  useEffect(() => {
    (async () => {
      try {
        const cases = await sb_listCases();
        const dyn = (cases || [])
          .sort((a, b) => b.createdAt - a.createdAt)
          .map((c) => ({
            id: c.id,
            slug: c.slug,
            title: c.title,
            subtitle: c.subtitle || '',
            cover: c.cover,
            contentHtml: c.contentHtml,
            application: c.application || '',
            location: c.location || '',
            createdAt: c.createdAt,
          }));
        _casesCache = dyn;
        setItems(dyn);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const applications = useMemo(() => ['Все типы', ...CASE_APPLICATION_OPTIONS], []);

  const filteredItems = useMemo(() => {
    if (selectedApplication === 'Все типы') return items;
    return items.filter((c) => (c.application || '') === selectedApplication);
  }, [items, selectedApplication]);

  const cardItems: CaseCardItem[] = useMemo(
    () =>
      filteredItems.map((it) => ({
        id: it.id,
        href: `/cases/${it.slug}`,
        title: it.title,
        description: it.subtitle || undefined,
        image: resolveCaseCover(it.cover, it.contentHtml),
        application: it.application || undefined,
        location: it.location || undefined,
        date: it.createdAt,
      })),
    [filteredItems],
  );

  const resetFilters = () => setSelectedApplication('Все типы');

  return (
    <Layout>
      <div className="redesign bg-[var(--rd-bg)]">
        <CasesHero onConsult={openConsult} caseCount={items.length} />

        <CasesFilterBar
          applications={applications}
          selectedApplication={selectedApplication}
          onApplicationChange={setSelectedApplication}
          onReset={resetFilters}
          resultCount={filteredItems.length}
        />

        <section id="cases-grid" className="case-page-column pb-8 lining-nums">
          {loading ? (
            <div className="text-center py-24 text-[var(--rd-muted,#667085)]">Загрузка…</div>
          ) : cardItems.length === 0 ? (
            <CasesEmptyState onReset={resetFilters} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
              {cardItems.map((item) => (
                <CaseCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </section>

        <CasesCta onConsult={openConsult} />
      </div>
    </Layout>
  );
}
