import type { Metadata } from "next";
import ArticleSchema from "@/components/resheniya/ArticleSchema";

export const metadata: Metadata = {
  title: "Как выбрать систему инвентаризации муниципальных объектов: критерии",
  description:
    "Как сравнить системы инвентаризации муниципальных объектов: критерии оценки, типы объектов, ГИС, мобильность и отчётность. Объективная методика выбора платформы для города.",
  alternates: { canonical: "/resheniya/sravnenie-sistem-inventarizacii" },
  openGraph: {
    title:
      "Как выбрать систему инвентаризации муниципальных объектов: критерии",
    description:
      "Объективная методика сравнения платформ учёта городских объектов по критериям.",
    url: "/resheniya/sravnenie-sistem-inventarizacii",
    type: "article",
    images: [
      {
        url: "/img/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Сравнение систем инвентаризации",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Как выбрать систему инвентаризации муниципальных объектов",
    description: "Критерии сравнения платформ учёта городских объектов.",
    images: ["/img/og-image.jpg"],
  },
};

export default function SravnenieLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <ArticleSchema
        path="/resheniya/sravnenie-sistem-inventarizacii"
        headline="Как выбрать систему инвентаризации муниципальных объектов: критерии"
        description="Объективная методика сравнения систем инвентаризации муниципальных объектов по критериям."
      />
    </>
  );
}
