"use client";

import React from "react";
import Image from "next/image";
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

export default function SegmentLanding({ data }: { data: SegmentData }) {
  return (
    <Layout hideBreadcrumbs={!!data.heroImage}>
      <div
        className={`font-raleway font-medium lining-nums ${
          data.heroImage ? "segment-headings-bebas" : ""
        }`}
      >
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

        {/* Интро — карточка с обводкой (по макету, Figma) */}
        <section className="pt-8 md:pt-12 pb-6 md:pb-10">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-[900px] rounded-[32px] border-4 border-[#f6f7f9] p-7 sm:p-9 lg:p-12">
              <div className="text-gray-500 text-base md:text-lg leading-relaxed font-medium font-raleway [&_strong]:font-bold [&_strong]:text-gray-500">
                {data.intro}
              </div>
            </div>
          </div>
        </section>

        {/* Проблема → результат → решение */}
        <section className="pt-10 pb-16 md:pb-24">
          <div className="max-w-[1200px] mx-auto px-4 flex flex-col gap-10">
            <h2 className="text-center text-[#313131] font-bebas text-[38px] md:text-[52px] leading-[1.1] md:leading-[65px]">
              {data.problem.title}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[#f6f7f9] rounded-3xl p-6 overflow-hidden">
                <h3 className="text-[#313131] text-2xl font-bebas leading-[33px]">
                  Проблема
                </h3>
                <p className="pt-4 text-[#7c8a9a] text-lg font-medium font-raleway leading-[29.25px]">
                  {data.problem.problem}
                </p>
              </div>
              <div className="bg-[#f6f7f9] rounded-3xl p-6 overflow-hidden">
                <h3 className="text-[#313131] text-2xl font-bebas leading-[33px]">
                  Результат
                </h3>
                <p className="pt-4 text-[#7c8a9a] text-lg font-medium font-raleway leading-[29.25px]">
                  {data.problem.result}
                </p>
              </div>
              <div className="bg-[#f6f7f9] rounded-3xl p-6 overflow-hidden">
                <h3 className="text-[#313131] text-2xl font-bebas leading-[33px]">
                  Решение «Единой среды»
                </h3>
                <p className="pt-4 text-[#7c8a9a] text-lg font-medium font-raleway leading-[29.25px]">
                  {data.problem.solution}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Зачем нужна система (выгоды) */}
        <section className="py-16 md:py-24">
          <div className="max-w-[1200px] mx-auto px-4">
            <h2 className="text-center text-[#313131] font-bebas text-[32px] md:text-[52px] leading-[1.15] md:leading-[70px]">
              {data.benefits.heading}
            </h2>
            <div className="mt-12 md:mt-16 rounded-[20px] border border-[#e3e8f2] overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-3">
                {data.benefits.items.map((c) => (
                  <div
                    key={c.title}
                    className="p-8 md:p-10 border-b border-[#e3e8f2] [&:last-child]:border-b-0 md:border-r md:[&:nth-child(3n)]:border-r-0 md:[&:nth-child(n+4)]:border-b-0"
                  >
                    <h3 className="text-[#313131] text-2xl font-bebas leading-8">
                      {c.title}
                    </h3>
                    <p className="pt-4 text-[#7c8a9a] text-lg font-medium font-raleway leading-[29.25px]">
                      {c.text}
                    </p>
                  </div>
                ))}
              </div>
              <div className="py-12 flex justify-center">
                <button
                  onClick={() =>
                    window.dispatchEvent(new CustomEvent("openConsultModal"))
                  }
                  className="px-8 py-4 bg-[#029cda] rounded-xl text-white text-lg font-medium font-involve leading-7 hover:bg-[#029cda]/90 transition-colors duration-200 focus:outline-none"
                >
                  Оставить заявку
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Что включает система + возможности (объединённая секция) */}
        <section className="py-16 md:py-24">
          <div className="max-w-[1200px] mx-auto px-4">
            <h2 className="text-center text-[#050c26] font-bebas text-[32px] md:text-[52px] leading-[1.05] tracking-wide">
              {data.components.heading}
            </h2>
            {data.components.lead && (
              <p className="mt-4 mx-auto max-w-[972px] text-center text-[#646b85] text-base font-raleway leading-6">
                {data.components.lead}
              </p>
            )}
            <div className="mt-10 md:mt-12 grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-8 lg:gap-12 items-start lg:items-center">
              {/* Список того, что включает система и её возможностей */}
              <ul className="flex flex-col gap-5">
                {data.components.items.map((it) => (
                  <li key={it} className="flex items-start gap-4">
                    <span className="shrink-0 mt-0.5 w-8 h-8 rounded-2xl bg-[#f5f6fe] flex items-center justify-center">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden
                      >
                        <path
                          d="M5 12.5l4 4L19 7"
                          stroke="#029cda"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                    <span className="text-[#050c26] text-base font-medium font-raleway leading-6">
                      {it}
                    </span>
                  </li>
                ))}
              </ul>
              {/* Изображение картографической платформы */}
              <div className="bg-[#F6F7F9] rounded-[32px] flex items-center justify-center p-8 md:p-12 lg:p-[64px] min-h-[320px] md:min-h-[420px] lg:h-[548px]">
                <div className="relative w-full max-w-[600px] aspect-[16/10] md:translate-x-6 lg:translate-x-10">
                  <Image
                    src="/img/platform.webp"
                    alt="Картографическая платформа «Единая среда»"
                    fill
                    className="object-contain"
                    sizes="(max-width: 1024px) 90vw, 600px"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Что берём на учёт (объекты) */}
        <section className="py-16 md:py-24">
          <div className="max-w-[1200px] mx-auto px-4">
            <h2 className="text-center text-[#050c26] font-bebas text-[32px] md:text-[52px] leading-[1.05] tracking-wide">
              {data.objects.heading}
            </h2>
            {data.objects.lead && (
              <p className="mt-4 mx-auto max-w-[1184px] text-center text-[#364153] text-lg font-medium font-raleway leading-7">
                {data.objects.lead}
              </p>
            )}
            <div className="mt-8 flex flex-wrap gap-3">
              {data.objects.items.map((o) => (
                <span
                  key={o}
                  className="rounded-full bg-[#f6f6f6] text-[#313131] text-base font-medium font-raleway px-4 py-2.5 shadow-[0_0_0_1px_rgba(15,23,42,0.06)]"
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
