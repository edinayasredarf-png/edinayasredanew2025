import type { Metadata } from "next";
import Layout from "@/components/Layout";

const YANDEX_ORG = "80012739748";
const YANDEX_URL =
  "https://yandex.ru/maps/org/yedinaya_sreda/80012739748/reviews/";

export const metadata: Metadata = {
  title: "Отзывы о компании «Единая среда»",
  description:
    "Отзывы клиентов — муниципалитетов и организаций из 40+ регионов — о работе «Единой среды»: инвентаризация зелёных насаждений, мест захоронений, лесоустройство. Актуальные отзывы с Яндекс.Карт.",
  alternates: { canonical: "/reviews" },
  openGraph: {
    title: "Отзывы о компании «Единая среда»",
    description:
      "Что пишут клиенты о работе «Единой среды»: инвентаризация зелёных насаждений, мест захоронений, лесоустройство. Актуальные отзывы с Яндекс.Карт.",
    url: "https://xn--80aakbcct4b2aj7m.xn--p1ai/reviews",
    type: "website",
    images: [
      {
        url: "/img/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Отзывы о компании «Единая среда»",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Отзывы о компании «Единая среда»",
    description:
      "Актуальные отзывы клиентов о работе «Единой среды» с Яндекс.Карт.",
    images: ["/img/og-image.jpg"],
  },
};

export default function ReviewsPage() {
  return (
    <Layout>
      <div className="font-raleway font-medium lining-nums">
        {/* Интро (индексируемый текст для поиска и ИИ) */}
        <section className="py-12 md:py-16 bg-white">
          <div className="rd-content-column">
            <div className="max-w-3xl">
              <h1 className="text-[clamp(2rem,5vw,3rem)] leading-[1.14] text-[#050c26] font-involve font-medium mb-6">
                Отзывы о компании «Единая среда»
              </h1>
              <p className="text-lg md:text-xl leading-relaxed text-[#313131]">
                «Единая среда» — цифровая платформа для учёта муниципальных
                территорий. Наши клиенты — муниципалитеты, органы власти и
                организации из 40+ регионов России — оставляют отзывы о работе
                по инвентаризации зелёных насаждений, инвентаризации мест
                захоронений, лесоустройству и оцифровке городских территорий.
              </p>

              <div className="mt-8">
                <p className="text-[#050c26] font-semibold text-lg mb-3">
                  О чём чаще всего пишут клиенты
                </p>
                <ul className="space-y-2 text-gray-700 text-base md:text-lg">
                  <li>— профессиональное проведение полевых работ и инвентаризации;</li>
                  <li>— создание цифровой базы объектов и удобное ПО;</li>
                  <li>— скорость и качество выполнения проектов;</li>
                  <li>— внимательная консультация и клиентоориентированность.</li>
                </ul>
              </div>

              <a
                href={YANDEX_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-8 text-[#029cda] font-semibold hover:text-[#0280b5] transition-colors"
              >
                Смотреть все отзывы на Яндекс.Картах →
              </a>
            </div>
          </div>
        </section>

        {/* Виджет отзывов Яндекса (авто-обновление) */}
        <section className="pb-16 md:pb-24 bg-white">
          <div className="rd-content-column">
            <div className="max-w-3xl">
              <iframe
                title="Отзывы о компании «Единая среда» на Яндекс.Картах"
                src={`https://yandex.ru/maps-reviews-widget/${YANDEX_ORG}?comments`}
                className="w-full rounded-2xl border border-[#e8eaed]"
                style={{ height: 800, boxSizing: "border-box" }}
                loading="lazy"
              />
              <noscript>
                <a href={YANDEX_URL} target="_blank" rel="noopener noreferrer">
                  Отзывы о компании «Единая среда» на Яндекс.Картах
                </a>
              </noscript>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
