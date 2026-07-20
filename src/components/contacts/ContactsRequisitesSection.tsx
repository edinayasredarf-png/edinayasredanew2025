"use client";

import React from "react";

const docsBase =
  process.env.NEXT_PUBLIC_DOCS_BASE_URL?.replace(/\/$/, "") ??
  "https://ytevoelicxcecwpetcqj.supabase.co/storage/v1/object/public/docs";
const requisitesPdfUrl = `${docsBase}/${encodeURIComponent("Rekvizity_OOO_Sfera_2026.pdf")}`;

const rows: { label: string; value: React.ReactNode }[] = [
  { label: "Полное наименование организации", value: "Общество с ограниченной ответственностью «Сфера»" },
  { label: "Сокращенное наименование", value: "ООО «Сфера»" },
  { label: "Юридический адрес", value: "346400, Ростовская область, г. Новочеркасск, пр. Платовский, д. 124/52, офис 3" },
  { label: "Почтовый адрес", value: "346400, Ростовская область, г. Новочеркасск, пр. Платовский, д. 124/52, офис 3" },
  { label: "ИНН / КПП", value: "6150100608 / 615001001" },
  { label: "ОГРН", value: "1206100037670" },
  { label: "Расчетный счет", value: "40702810129050000160" },
  { label: "Наименование банка", value: "Филиал «Центральный» Банка ВТБ (ПАО)" },
  { label: "Корреспондентский счет", value: "30101810145250000411" },
  { label: "БИК", value: "044525411" },
  { label: "ОКВЭД", value: "72.19 Научные исследования и разработки в области естественных и технических наук" },
  { label: "Директор", value: "Статов Андрей Викторович, действует на основании Устава" },
];

export default function ContactsRequisitesSection() {
  return (
    <section className="bg-white w-full py-12 md:py-16" aria-label="Реквизиты">
      <div className="rd-content-column">
        <h2 className="text-center font-involve text-[#050c26] text-[28px] md:text-[36px] font-medium leading-[1.2] tracking-wide">
          Реквизиты
        </h2>

        <div className="mt-8 rounded-[32px] border border-[#E5E7EB] bg-white px-6 md:px-10 py-2 md:py-4">
          {rows.map((r) => (
            <div
              key={r.label}
              className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-8 py-4 border-b border-[#E5E7EB] last:border-b-0"
            >
              <div className="sm:w-[42%] shrink-0 font-[Raleway] text-[#646b85] text-base leading-6">
                {r.label}
              </div>
              <div className="sm:w-[58%] font-[Raleway] text-[#050c26] text-base leading-6 text-left sm:text-right">
                {r.value}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex justify-center">
          <a
            href={requisitesPdfUrl}
            download
            className="inline-flex items-center justify-center h-[52px] px-8 rounded-xl bg-[#029cda] text-white text-base font-medium font-involve hover:bg-[#0288bd] transition-colors"
          >
            Скачать реквизиты
          </a>
        </div>
      </div>
    </section>
  );
}
