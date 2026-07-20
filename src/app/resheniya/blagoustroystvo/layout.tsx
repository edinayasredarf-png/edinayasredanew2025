import type { Metadata } from "next";
import ArticleSchema from "@/components/resheniya/ArticleSchema";

export const metadata: Metadata = {
  title:
    "Инвентаризация и учёт объектов благоустройства: программа и реестр",
  description:
    "Как провести инвентаризацию объектов благоустройства и вести реестр: учёт МАФ, детских площадок, освещения и элементов благоустройства города в единой системе для муниципалитета.",
  alternates: { canonical: "/resheniya/blagoustroystvo" },
  openGraph: {
    title:
      "Инвентаризация и учёт объектов благоустройства: программа и реестр",
    description:
      "Учёт объектов благоустройства города в цифровой системе: МАФ, площадки, освещение, паспорт благоустройства и реестр территорий.",
    url: "/resheniya/blagoustroystvo",
    type: "article",
    images: [
      {
        url: "/img/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Инвентаризация объектов благоустройства",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Инвентаризация и учёт объектов благоустройства",
    description:
      "Программа для учёта объектов благоустройства города: МАФ, площадки, освещение, реестр территорий.",
    images: ["/img/og-image.jpg"],
  },
};

export default function BlagoustroystvoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <ArticleSchema
        path="/resheniya/blagoustroystvo"
        headline="Инвентаризация и учёт объектов благоустройства"
        description="Как провести инвентаризацию объектов благоустройства и вести реестр территорий в цифровой системе для муниципалитета."
      />
    </>
  );
}
