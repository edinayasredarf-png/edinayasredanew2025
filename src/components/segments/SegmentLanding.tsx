"use client";

import React from "react";
import Layout from "@/components/Layout";
import Hero from "@/components/resheniya/Hero";
import SegmentHero, { type HeroCrumb } from "@/components/segments/SegmentHero";
import FaqBlock from "@/components/resheniya/FaqBlock";
import CtaBlock from "@/components/resheniya/CtaBlock";
import RelatedLinks, { type RelatedLink } from "@/components/resheniya/RelatedLinks";

export interface SegmentCard {
  title: string;
  text: string;
}

export interface SegmentData {
  h1: string;
  heroLead: React.ReactNode;
  /** Если задано — hero отрисовывается карточкой с изображением справа. */
  heroImage?: string;
  heroImageAlt?: string;
  breadcrumb?: HeroCrumb[];
  intro: React.ReactNode;
  problem: { title: string; problem: string; result: string; solution: string };
  benefits: { heading: string; items: SegmentCard[] };
  components: { heading: string; lead?: string; items: string[] };
  features: { heading: string; items: string[] };
  objects: { heading: string; lead?: string; items: string[] };
  whyUs: { heading: string; items: SegmentCard[] };
  faq: { q: string; a: string }[];
  related?: RelatedLink[];
  cta: { title: string; text: string };
  kpLabel?: string;
  consultLabel?: string;
}

function Check() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      className="shrink-0 mt-0.5"
      aria-hidden
    >
      <circle cx="12" cy="12" r="12" fill="#029cda" fillOpacity="0.12" />
      <path
        d="M7 12.5l3.2 3.2L17 9"
        stroke="#029cda"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CardGrid({ items, cols = 3 }: { items: SegmentCard[]; cols?: 2 | 3 }) {
  return (
    <div
      className={`grid grid-cols-1 ${
        cols === 3 ? "md:grid-cols-3" : "md:grid-cols-2"
      } gap-6`}
    >
      {items.map((c) => (
        <div key={c.title} className="bg-white rounded-3xl p-6 md:p-7">
          <h3 className="text-lg md:text-xl font-semibold mb-2 text-[#050c26] font-involve">
            {c.title}
          </h3>
          <p className="text-gray-600 text-sm md:text-base leading-relaxed">
            {c.text}
          </p>
        </div>
      ))}
    </div>
  );
}

function CheckList({ items }: { items: string[] }) {
  return (
    <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
      {items.map((it) => (
        <li key={it} className="flex items-start gap-3">
          <Check />
          <span className="text-[#313131] text-base md:text-lg leading-relaxed">
            {it}
          </span>
        </li>
      ))}
    </ul>
  );
}

export default function SegmentLanding({ data }: { data: SegmentData }) {
  return (
    <Layout>
      <div className="font-raleway font-medium lining-nums">
        {data.heroImage ? (
          <SegmentHero
            h1={data.h1}
            image={data.heroImage}
            imageAlt={data.heroImageAlt}
            breadcrumb={data.breadcrumb}
            kpLabel={data.kpLabel || "Получить КП"}
            consultLabel={data.consultLabel || "Получить консультацию"}
          >
            {typeof data.heroLead === "string" ? <p>{data.heroLead}</p> : data.heroLead}
          </SegmentHero>
        ) : (
          <Hero
            h1={data.h1}
            kpLabel={data.kpLabel || "Получить КП"}
            consultLabel={data.consultLabel || "Бесплатная консультация"}
          >
            {typeof data.heroLead === "string" ? <p>{data.heroLead}</p> : data.heroLead}
          </Hero>
        )}

        {/* Интро — карточка с обводкой (по макету Figma) */}
        <section className="pt-8 md:pt-12 pb-6 md:pb-10">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:ml-auto lg:max-w-[900px] rounded-[32px] border-4 border-[#f6f7f9] p-7 sm:p-9 lg:p-12">
              <div className="text-gray-500 text-base md:text-lg leading-relaxed font-medium font-raleway [&_strong]:font-bold [&_strong]:text-gray-500">
                {data.intro}
              </div>
            </div>
          </div>
        </section>

        {/* Проблема → результат → решение */}
        <section className="py-14 md:py-20 bg-[#F5F7FA]">
          <div className="max-w-[1200px] mx-auto px-4">
            <h2 className="text-2xl md:text-3xl lg:text-4xl text-[#050c26] font-involve font-medium mb-8">
              {data.problem.title}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-3xl p-6 md:p-7 border-l-4 border-[#e2574c]">
                <p className="text-sm font-semibold text-[#e2574c] mb-2 uppercase tracking-wide">
                  Проблема
                </p>
                <p className="text-gray-700 text-sm md:text-base leading-relaxed">
                  {data.problem.problem}
                </p>
              </div>
              <div className="bg-white rounded-3xl p-6 md:p-7 border-l-4 border-[#c9ccd4]">
                <p className="text-sm font-semibold text-[#8a8f9c] mb-2 uppercase tracking-wide">
                  Результат
                </p>
                <p className="text-gray-700 text-sm md:text-base leading-relaxed">
                  {data.problem.result}
                </p>
              </div>
              <div className="bg-white rounded-3xl p-6 md:p-7 border-l-4 border-[#029cda]">
                <p className="text-sm font-semibold text-[#029cda] mb-2 uppercase tracking-wide">
                  Решение «Единой среды»
                </p>
                <p className="text-gray-700 text-sm md:text-base leading-relaxed">
                  {data.problem.solution}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Зачем нужна система (выгоды) */}
        <section className="py-14 md:py-20">
          <div className="max-w-[1200px] mx-auto px-4">
            <h2 className="text-2xl md:text-3xl lg:text-4xl text-[#050c26] font-involve font-medium mb-8">
              {data.benefits.heading}
            </h2>
            <CardGrid items={data.benefits.items} />
          </div>
        </section>

        {/* Что включает система */}
        <section className="py-14 md:py-20 bg-[#F5F7FA]">
          <div className="max-w-[1200px] mx-auto px-4">
            <h2 className="text-2xl md:text-3xl lg:text-4xl text-[#050c26] font-involve font-medium mb-4">
              {data.components.heading}
            </h2>
            {data.components.lead && (
              <p className="text-gray-700 text-base md:text-lg max-w-3xl mb-8">
                {data.components.lead}
              </p>
            )}
            <CheckList items={data.components.items} />
          </div>
        </section>

        {/* Возможности */}
        <section className="py-14 md:py-20">
          <div className="max-w-[1200px] mx-auto px-4">
            <h2 className="text-2xl md:text-3xl lg:text-4xl text-[#050c26] font-involve font-medium mb-8">
              {data.features.heading}
            </h2>
            <CheckList items={data.features.items} />
          </div>
        </section>

        {/* Что берём на учёт (объекты) */}
        <section className="py-14 md:py-20 bg-[#F5F7FA]">
          <div className="max-w-[1200px] mx-auto px-4">
            <h2 className="text-2xl md:text-3xl lg:text-4xl text-[#050c26] font-involve font-medium mb-4">
              {data.objects.heading}
            </h2>
            {data.objects.lead && (
              <p className="text-gray-700 text-base md:text-lg max-w-3xl mb-8">
                {data.objects.lead}
              </p>
            )}
            <div className="flex flex-wrap gap-3">
              {data.objects.items.map((o) => (
                <span
                  key={o}
                  className="rounded-full bg-white text-[#313131] text-sm md:text-base px-4 py-2.5 shadow-[0_0_0_1px_rgba(15,23,42,0.06)]"
                >
                  {o}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Почему нас выбирают */}
        <section className="py-14 md:py-20">
          <div className="max-w-[1200px] mx-auto px-4">
            <h2 className="text-2xl md:text-3xl lg:text-4xl text-[#050c26] font-involve font-medium mb-8">
              {data.whyUs.heading}
            </h2>
            <CardGrid items={data.whyUs.items} />
          </div>
        </section>

        <FaqBlock items={data.faq} />

        {data.related && data.related.length > 0 && (
          <RelatedLinks links={data.related} />
        )}

        <CtaBlock title={data.cta.title} text={data.cta.text} />
      </div>
    </Layout>
  );
}
