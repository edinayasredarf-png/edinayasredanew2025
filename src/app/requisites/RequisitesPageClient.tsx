"use client";
import React from 'react';
import Layout from '@/components/Layout';

const docsBase =
  process.env.NEXT_PUBLIC_DOCS_BASE_URL?.replace(/\/$/, "") ??
  "https://ytevoelicxcecwpetcqj.supabase.co/storage/v1/object/public/docs";
const requisitesPdfUrl = `${docsBase}/${encodeURIComponent("Rekvizity_OOO_Sfera_2026.pdf")}`;

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-6 py-4 border-b border-[#E5E7EB] last:border-b-0">
      <div className="sm:w-1/3 text-[#7C8A9A] text-base shrink-0">{label}</div>
      <div className="sm:w-2/3 text-[#313131] text-base leading-relaxed">{value}</div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-[#E5E7EB] bg-white p-6 md:p-8">
      <h2 className="text-2xl font-bold text-[#313131] mb-4">{title}</h2>
      {children}
    </div>
  );
}

export default function RequisitesPageClient() {
  return (
    <Layout>
      <div className="font-[Raleway] font-medium lining-nums">

        {/* Hero Section */}
        <section className="page-hero rounded-b-[20px] relative overflow-hidden min-h-[400px]">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-20 relative z-10">
            <div className="relative flex flex-col lg:flex-row items-center lg:items-stretch gap-16">
              <div className="flex-1 lg:basis-3/5 text-left flex flex-col justify-center z-20">
                <h1 className="font-involve text-[#313131] text-[clamp(2rem,5.5vw,3.4rem)] leading-[1.14] tracking-[0.6px]">
                  Реквизиты
                </h1>
                <p className="mt-6 md:mt-8 text-[#313131]/70 text-lg md:text-[22.7px] leading-[1.37] max-w-[662px] font-[Inter]">
                  Официальные реквизиты ООО «Сфера» для заключения договоров, оформления счетов и документооборота
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Requisites Content */}
        <section className="py-16 md:py-24 bg-[#F6F7F9]">
          <div className="max-w-[1200px] mx-auto px-5 md:px-8 space-y-8">

            {/* General Info */}
            <Card title="Реквизиты организации">
              <InfoRow label="Полное наименование" value="Общество с ограниченной ответственностью «Сфера»" />
              <InfoRow label="Сокращенное наименование" value="ООО «Сфера»" />
              <InfoRow label="Юридический адрес" value="346400, Ростовская область, г. Новочеркасск, пр. Платовский, д. 124/52, офис 3" />
              <InfoRow label="Почтовый адрес" value="346400, Ростовская область, г. Новочеркасск, пр. Платовский, д. 124/52, офис 3" />
              <InfoRow label="ОГРН" value="1206100037670" />
              <InfoRow label="ИНН / КПП" value="6150100608 / 615001001" />
              <InfoRow label="ОКВЭД (основной)" value="72.19" />
              <InfoRow label="Директор" value="Статов Андрей Викторович, действует на основании Устава" />
              <InfoRow label="Телефон" value={<a href="tel:88005505612" className="hover:text-[#029cda] transition-colors">8 800 550-56-12</a>} />
              <InfoRow label="E-mail" value={<a href="mailto:Sfera-nov@yandex.ru" className="hover:text-[#029cda] transition-colors">Sfera-nov@yandex.ru</a>} />
            </Card>

            {/* Bank details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card title="Банковские реквизиты — ПАО «ВТБ»">
                <InfoRow label="Банк" value="Филиал «Центральный» Банка ВТБ (ПАО)" />
                <InfoRow label="Расчетный счет" value="40702810129050000160" />
                <InfoRow label="Корр. счет" value="30101810145250000411" />
                <InfoRow label="БИК" value="044525411" />
                <InfoRow label="ИНН банка" value="7702070139" />
                <InfoRow label="КПП банка" value="770943002" />
                <InfoRow label="Адрес банка" value="107031, г. Москва, ул. Рождественка, д. 10/2, строен. 1" />
              </Card>

              <Card title="Банковские реквизиты — ПАО «Сбербанк»">
                <InfoRow label="Банк" value="Юго-Западный банк ПАО Сбербанк" />
                <InfoRow label="Расчетный счет" value="40702810352090046832" />
                <InfoRow label="Корр. счет" value="30101810600000000602" />
                <InfoRow label="БИК" value="046015602" />
                <InfoRow label="ИНН банка" value="7707083893" />
                <InfoRow label="КПП банка" value="616143002" />
              </Card>
            </div>

            {/* VAT note */}
            <div className="rounded-3xl border border-[#E5E7EB] bg-white p-6 md:p-8">
              <p className="text-[#7C8A9A] text-base leading-relaxed">
                НДС не облагается в связи с тем, что ООО «Сфера» является резидентом инновационного центра «Сколково»,
                в соответствии с Федеральным законом от 28.09.2010 № 244-ФЗ «Об инновационном центре «Сколково»
                (номер в реестре — 1128097 от 06.11.2025).
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href={requisitesPdfUrl}
                download
                className="px-8 py-4 bg-[#029cda] text-white text-lg font-medium rounded-xl hover:bg-[#029cda]/90 transition-colors text-center"
              >
                Скачать реквизиты (PDF)
              </a>
              <a
                href="mailto:info@единаясреда.рф"
                className="px-8 py-4 border-2 border-gray-300 text-gray-700 text-lg font-medium rounded-xl hover:bg-[#F6F7F9] transition-colors text-center"
              >
                Написать нам
              </a>
            </div>

          </div>
        </section>

      </div>
    </Layout>
  );
}
