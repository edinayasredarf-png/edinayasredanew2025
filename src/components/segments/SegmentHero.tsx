"use client";

import React, { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";

export interface HeroCrumb {
  label: string;
  href?: string;
}

interface SegmentHeroProps {
  h1: string;
  children?: ReactNode;
  image: string;
  imageAlt?: string;
  breadcrumb?: HeroCrumb[];
  kpLabel?: string;
  consultLabel?: string;
}

/**
 * Hero отраслевого лендинга в виде светлой карточки: хлебные крошки, H1,
 * подзаголовок, две CTA-кнопки и изображение справа (макет Figma).
 */
export default function SegmentHero({
  h1,
  children,
  image,
  imageAlt,
  breadcrumb = [],
  kpLabel = "Получить КП",
  consultLabel = "Получить консультацию",
}: SegmentHeroProps) {
  const openKP = () => window.dispatchEvent(new CustomEvent("openKPModal"));
  const openConsult = () =>
    window.dispatchEvent(new CustomEvent("openConsultModal"));

  return (
    <section className="pt-6 md:pt-8">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative bg-[#f6f7f9] rounded-[32px] overflow-hidden">
          <div className="flex flex-col lg:flex-row items-stretch gap-8 lg:gap-10 p-6 sm:p-8 lg:p-10">
            {/* Левая колонка */}
            <div className="flex-1 min-w-0 flex flex-col justify-center py-2">
              {breadcrumb.length > 0 && (
                <nav aria-label="Хлебные крошки" className="flex items-center flex-wrap mb-5">
                  {breadcrumb.map((c, i) => {
                    const last = i === breadcrumb.length - 1;
                    return (
                      <span key={`${c.label}-${i}`} className="inline-flex items-center">
                        {c.href && !last ? (
                          <Link
                            href={c.href}
                            className="text-[#050c26] text-sm font-medium leading-5 tracking-tight hover:text-[#029cda] transition-colors"
                          >
                            {c.label}
                          </Link>
                        ) : (
                          <span
                            className={`text-sm font-medium leading-5 tracking-tight ${
                              last ? "text-[#667085]" : "text-[#050c26]"
                            }`}
                          >
                            {c.label}
                          </span>
                        )}
                        {!last && <span className="px-2 text-[#050c26] text-sm leading-5">/</span>}
                      </span>
                    );
                  })}
                </nav>
              )}

              <h1 className="font-involve font-medium text-[#050c26] text-[clamp(1.85rem,4.4vw,2.9rem)] leading-[1.08] tracking-[0.5px]">
                {h1}
              </h1>

              {children && (
                <div className="mt-5 text-gray-500 text-base md:text-lg leading-relaxed max-w-[620px] space-y-4 font-raleway">
                  {children}
                </div>
              )}

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={openKP}
                  className="inline-flex items-center justify-center bg-[#029cda] text-white text-base font-medium px-6 py-4 rounded-xl hover:bg-[#029cda]/90 transition-colors focus:outline-none"
                >
                  {kpLabel}
                </button>
                <button
                  onClick={openConsult}
                  className="inline-flex items-center justify-center bg-transparent text-[#029cda] border border-[#029cda] text-base font-medium px-6 py-4 rounded-xl hover:bg-[#029cda]/10 transition-colors focus:outline-none"
                >
                  {consultLabel}
                </button>
              </div>
            </div>

            {/* Изображение справа */}
            <div className="lg:w-[380px] shrink-0">
              <div className="relative w-full h-[260px] sm:h-[360px] lg:h-[494px] rounded-[22px] overflow-hidden">
                <Image
                  src={image}
                  alt={imageAlt || h1}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 380px"
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
