import type { Metadata } from "next";
import ArticleSchema from "@/components/resheniya/ArticleSchema";

export const metadata: Metadata = {
  title: "Программа для инвентаризации: как выбрать ПО для муниципалитета",
  description:
    "Как выбрать программу для инвентаризации муниципальных объектов: критерии, реестр отечественного ПО, ГИС-учёт, мобильное приложение и контроль подрядчиков. На что смотреть при выборе.",
  alternates: { canonical: "/resheniya/programma-dlya-inventarizacii" },
  openGraph: {
    title: "Программа для инвентаризации: как выбрать ПО для муниципалитета",
    description:
      "Критерии выбора программного обеспечения для инвентаризации городских объектов.",
    url: "/resheniya/programma-dlya-inventarizacii",
    type: "article",
    images: [
      {
        url: "/img/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Программа для инвентаризации",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Программа для инвентаризации: как выбрать",
    description: "Критерии выбора ПО для инвентаризации муниципальных объектов.",
    images: ["/img/og-image.jpg"],
  },
};

export default function ProgramLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <ArticleSchema
        path="/resheniya/programma-dlya-inventarizacii"
        headline="Программа для инвентаризации: как выбрать ПО для муниципалитета"
        description="Критерии выбора программного обеспечения для инвентаризации муниципальных объектов."
      />
    </>
  );
}
