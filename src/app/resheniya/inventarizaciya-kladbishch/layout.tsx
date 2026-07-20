import type { Metadata } from "next";
import ArticleSchema from "@/components/resheniya/ArticleSchema";

export const metadata: Metadata = {
  title: "Инвентаризация кладбищ: как проводится и что входит",
  description:
    "Что такое инвентаризация кладбищ: полевое обследование захоронений с геопривязкой, фотофиксация, сверка с архивами и электронный реестр с картой. Этапы работ, нормы и результат для муниципалитетов.",
  alternates: { canonical: "/resheniya/inventarizaciya-kladbishch" },
  openGraph: {
    title: "Инвентаризация кладбищ: как проводится и что входит",
    description:
      "Полевое обследование, оцифровка захоронений, электронная карта и реестр с поиском по фамилии.",
    url: "/resheniya/inventarizaciya-kladbishch",
    type: "article",
    images: [
      {
        url: "/img/cemetery1.png",
        width: 1200,
        height: 630,
        alt: "Инвентаризация кладбищ",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Инвентаризация кладбищ: как проводится и что входит",
    description:
      "Обследование захоронений, оцифровка, карта и реестр кладбища с поиском по фамилии.",
    images: ["/img/cemetery1.png"],
  },
};

export default function InventarizaciyaKladbishchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <ArticleSchema
        path="/resheniya/inventarizaciya-kladbishch"
        headline="Инвентаризация кладбищ: как проводится и что входит"
        description="Что такое инвентаризация кладбищ: полевое обследование захоронений с геопривязкой, фотофиксация, сверка с архивами и электронный реестр с картой."
      />
    </>
  );
}
