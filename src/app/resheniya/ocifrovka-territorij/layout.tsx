import type { Metadata } from "next";
import ArticleSchema from "@/components/resheniya/ArticleSchema";

export const metadata: Metadata = {
  title: "Оцифровка территорий: что это и как выполняется",
  description:
    "Что такое оцифровка территорий: перевод объектов в цифровой вид с геопривязкой, ГИС-картой и единым реестром. Какие объекты оцифровывают, этапы работ и результат для муниципалитетов.",
  alternates: { canonical: "/resheniya/ocifrovka-territorij" },
  openGraph: {
    title: "Оцифровка территорий: что это и как выполняется",
    description:
      "Перевод территорий и объектов в цифровой вид: геопривязка, ГИС-карта, единый реестр и паспорта объектов.",
    url: "/resheniya/ocifrovka-territorij",
    type: "article",
    images: [
      {
        url: "/img/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Оцифровка территорий",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Оцифровка территорий: что это и как выполняется",
    description:
      "Перевод объектов территории в ГИС: геопривязка, карта, реестр и паспорта.",
    images: ["/img/og-image.jpg"],
  },
};

export default function OcifrovkaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <ArticleSchema
        path="/resheniya/ocifrovka-territorij"
        headline="Оцифровка территорий: что это и как выполняется"
        description="Что такое оцифровка территорий: перевод объектов в цифровой вид с геопривязкой, ГИС-картой и единым реестром."
      />
    </>
  );
}
