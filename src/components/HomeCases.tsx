"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import { CaseItem, sb_listCases } from "@/lib/blogStore";
import { resolveCaseCover } from "@/lib/caseCover";

let _homeCasesCache: CaseItem[] | null = null;

export default function HomeCases() {
  const [cases, setCases] = useState<CaseItem[]>(_homeCasesCache || []);

  useEffect(() => {
    (async () => {
      try {
        const data = await sb_listCases();
        const sorted = [...data].sort((a, b) => b.createdAt - a.createdAt);

        _homeCasesCache = sorted;
        setCases(sorted);
      } catch {
        setCases([]);
      }
    })();
  }, []);

  if (!cases.length) return null;

  return (
    <section className="bg-white py-16 md:py-20 overflow-hidden">
      <div className="rd-content-column">
        <h2 className="mb-10 md:mb-12 font-involve text-[#222222] text-[32px] md:text-[46.3px] font-medium leading-[1.2] md:leading-[54.24px] max-w-[1199px]">
          Более 300 компаний уже пользуются
          <br />
          Единой средой
        </h2>

        <div
          className="
            flex
            gap-4
            overflow-x-auto
            snap-x
            snap-mandatory
            pb-1
            [-ms-overflow-style:none]
            [scrollbar-width:none]
            [&::-webkit-scrollbar]:hidden
          "
          aria-label="Кейсы клиентов"
        >
          {cases.map((item, index) => {
            const logo = resolveCaseCover(item.cover, item.contentHtml);

            return (
              <Link
                key={item.id}
                href={`/cases/${item.slug}`}
                aria-label={`${index + 1} из ${cases.length}: ${item.title}`}
                className="
                  group
                  shrink-0
                  snap-start
                  flex
                  flex-col

                  w-[360px]
                  sm:w-[400px]
                  lg:w-[532px]
                  min-h-[300px]
                  lg:min-h-[340px]

                  bg-[#f6f6f6]
                  rounded-3xl
                  p-10

                  transition-colors
                  duration-300
                  hover:bg-[#efefef]
                "
              >
                <div className="relative h-[80px] w-[300px] shrink-0 overflow-hidden rounded-2xl bg-[#ebebeb]">
                  <Image
                    src={logo}
                    alt=""
                    fill
                    className="object-cover object-center"
                    sizes="300px"
                  />
                </div>

                <div className="mt-6 max-w-[385px] flex flex-col flex-grow">
                  <p className="text-[#222222] text-lg font-normal font-sans leading-[25.92px]">
                    {item.title}
                  </p>

                  <span className="mt-3 text-[#029cda] text-lg font-normal font-sans leading-[25.92px] group-hover:underline">
                    Подробнее
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
