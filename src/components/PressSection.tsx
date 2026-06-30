"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { listPress, PressItem } from "@/lib/pressStore";

export default function PressSection() {
  const [items, setItems] = useState<PressItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listPress()
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  if (!loading && items.length === 0) return null;

  return (
    <section className="py-16 md:py-24 bg-[#F6F7F9]">
      <div className="rd-content-column">
        <h2 className="text-[clamp(1.6rem,3.5vw,2.4rem)] font-involve font-medium leading-tight tracking-tight text-[#1a1a1a] mb-3">
          СМИ о нас
        </h2>
        <p className="text-[#6b7280] text-[17px] mb-10">
          Публикации в ведущих изданиях об «Единой среде»
        </p>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white rounded-2xl p-5 h-[180px] animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {items.map(item => (
              <a
                key={item.id}
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-white rounded-2xl p-5 flex flex-col justify-between hover:shadow-md transition-shadow duration-200 min-h-[180px]"
              >
                {/* Логотип источника */}
                <div className="mb-4 h-9 flex items-center">
                  {item.source_logo ? (
                    <Image
                      src={item.source_logo}
                      alt={item.source_name}
                      width={120}
                      height={36}
                      className="max-h-9 w-auto object-contain"
                    />
                  ) : (
                    <span className="text-[13px] font-semibold text-[#6b7280] uppercase tracking-wide">
                      {item.source_name}
                    </span>
                  )}
                </div>

                {/* Заголовок */}
                <p className="text-[#1a1a1a] text-[15px] font-medium leading-snug line-clamp-3 flex-1 mb-4">
                  {item.title}
                </p>

                {/* Дата + стрелка */}
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-[#9ca3af]">
                    {new Date(item.published_at).toLocaleDateString("ru-RU", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                  <span className="text-[#029cda] opacity-0 group-hover:opacity-100 transition-opacity text-[13px] font-medium flex items-center gap-1">
                    Читать
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12"/>
                      <polyline points="12 5 19 12 12 19"/>
                    </svg>
                  </span>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
