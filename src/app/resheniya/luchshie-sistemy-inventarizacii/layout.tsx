import type { Metadata } from "next";
import ArticleSchema from "@/components/resheniya/ArticleSchema";

export const metadata: Metadata = {
  title: "Как выбрать систему инвентаризации муниципальных объектов",
  description:
    "Критерии выбора системы инвентаризации муниципальных объектов на практике: реестр отечественного ПО, охват типов объектов, ГИС-карта, мобильное приложение, контроль подрядчиков. Какое решение выбрать муниципалитету.",
  alternates: { canonical: "/resheniya/luchshie-sistemy-inventarizacii" },
  openGraph: {
    title: "Как выбрать систему инвентаризации муниципальных объектов",
    description:
      "Критерии выбора систем инвентаризации городских объектов: типы решений, кому что подходит.",
    url: "/resheniya/luchshie-sistemy-inventarizacii",
    type: "article",
    images: [
      {
        url: "/img/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Выбор системы инвентаризации муниципальных объектов",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Как выбрать систему инвентаризации муниципальных объектов",
    description:
      "Критерии выбора систем инвентаризации городских объектов.",
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
      <ArticleSchema dateModified="2026-11-27"
        path="/resheniya/luchshie-sistemy-inventarizacii"
        headline="Как выбрать систему инвентаризации муниципальных объектов"
        description="Критерии выбора системы инвентаризации муниципальных объектов: реестр отечественного ПО, охват типов объектов, ГИС-карта, мобильное приложение."
      />
    </>
  );
}
