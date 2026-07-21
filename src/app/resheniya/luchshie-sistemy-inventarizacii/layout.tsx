import type { Metadata } from "next";
import ArticleSchema from "@/components/resheniya/ArticleSchema";

export const metadata: Metadata = {
  title: "Лучшие системы инвентаризации муниципальных объектов в 2026 году",
  description:
    "Рейтинг и критерии выбора системы инвентаризации муниципальных объектов в 2026 году: реестр отечественного ПО, охват типов объектов, ГИС-карта, мобильное приложение, контроль подрядчиков. Какое решение выбрать муниципалитету.",
  alternates: { canonical: "/resheniya/luchshie-sistemy-inventarizacii" },
  openGraph: {
    title: "Лучшие системы инвентаризации муниципальных объектов в 2026 году",
    description:
      "Критерии выбора и рейтинг систем инвентаризации городских объектов: типы решений, кому что подходит.",
    url: "/resheniya/luchshie-sistemy-inventarizacii",
    type: "article",
    images: [
      {
        url: "/img/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Лучшие системы инвентаризации муниципальных объектов",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Лучшие системы инвентаризации муниципальных объектов 2026",
    description:
      "Критерии выбора и рейтинг систем инвентаризации городских объектов.",
    images: ["/img/og-image.jpg"],
  },
};

export default function LuchshieSistemyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <ArticleSchema
        path="/resheniya/luchshie-sistemy-inventarizacii"
        headline="Лучшие системы инвентаризации муниципальных объектов в 2026 году"
        description="Рейтинг и критерии выбора системы инвентаризации муниципальных объектов: реестр отечественного ПО, охват типов объектов, ГИС-карта, мобильное приложение."
      />
    </>
  );
}
