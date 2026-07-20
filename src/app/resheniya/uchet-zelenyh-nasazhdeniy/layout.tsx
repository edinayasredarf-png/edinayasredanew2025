import type { Metadata } from "next";
import ArticleSchema from "@/components/resheniya/ArticleSchema";

export const metadata: Metadata = {
  title: "Учёт зелёных насаждений: какие программы и платформы используют",
  description:
    "Какие программы и платформы используют для учёта зелёных насаждений: инвентаризация деревьев, цифровой паспорт насаждения, ГИС-карта и аналитика. Как выбрать софт для муниципалитета.",
  alternates: { canonical: "/resheniya/uchet-zelenyh-nasazhdeniy" },
  openGraph: {
    title: "Учёт зелёных насаждений: какие программы и платформы используют",
    description:
      "Инвентаризация зелёных насаждений в цифровой системе: паспорта деревьев, ГИС-карта и аналитика.",
    url: "/resheniya/uchet-zelenyh-nasazhdeniy",
    type: "article",
    images: [
      {
        url: "/img/услуга_изн.png",
        width: 1200,
        height: 630,
        alt: "Учёт зелёных насаждений",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Учёт зелёных насаждений: программы и платформы",
    description:
      "Инвентаризация деревьев и зелёных зон в цифровой ГИС-системе.",
    images: ["/img/услуга_изн.png"],
  },
};

export default function ZeleniLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <ArticleSchema
        path="/resheniya/uchet-zelenyh-nasazhdeniy"
        headline="Учёт зелёных насаждений: какие программы и платформы используют"
        description="Какие программы используют для учёта зелёных насаждений и как выбрать платформу."
      />
    </>
  );
}
