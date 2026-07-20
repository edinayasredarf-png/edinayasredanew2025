import type { Metadata } from "next";
import ArticleSchema from "@/components/resheniya/ArticleSchema";

export const metadata: Metadata = {
  title: "Учёт мест захоронений: как автоматизировать и вести реестр",
  description:
    "Как автоматизировать учёт мест захоронений и вести электронный реестр кладбищ: оцифровка книг, карта захоронений, поиск по фамилии. Решение для муниципалитетов и операторов кладбищ.",
  alternates: { canonical: "/resheniya/uchet-mest-zahoroneniy" },
  openGraph: {
    title: "Учёт мест захоронений: как автоматизировать и вести реестр",
    description:
      "Электронный реестр мест захоронений, карта кладбищ и поиск по фамилии для муниципалитетов.",
    url: "/resheniya/uchet-mest-zahoroneniy",
    type: "article",
    images: [
      {
        url: "/img/cemetery1.png",
        width: 1200,
        height: 630,
        alt: "Учёт мест захоронений",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Учёт мест захоронений: как автоматизировать",
    description:
      "Электронный реестр захоронений и карта кладбищ для муниципалитетов.",
    images: ["/img/cemetery1.png"],
  },
};

export default function ZahoroneniyaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <ArticleSchema
        path="/resheniya/uchet-mest-zahoroneniy"
        headline="Учёт мест захоронений: как автоматизировать и вести реестр"
        description="Как автоматизировать учёт мест захоронений и вести электронный реестр кладбищ."
      />
    </>
  );
}
