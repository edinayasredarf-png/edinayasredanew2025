import type { Metadata } from "next";
import ArticleSchema from "@/components/resheniya/ArticleSchema";

export const metadata: Metadata = {
  title: "Лесоустройство: что это, как проводится и в какие сроки",
  description:
    "Что такое лесоустройство: таксация, дешифрирование, картографирование и подготовка лесоустроительной документации. Этапы, сроки и результат работ, оцифровка материалов и цифровые лесные карты.",
  alternates: { canonical: "/resheniya/lesoustrojstvo" },
  openGraph: {
    title: "Лесоустройство: что это, как проводится и в какие сроки",
    description:
      "Таксация, картографирование и лесоустроительная документация с оцифровкой материалов и цифровыми лесными картами.",
    url: "/resheniya/lesoustrojstvo",
    type: "article",
    images: [
      {
        url: "/img/лес.png",
        width: 1200,
        height: 630,
        alt: "Лесоустройство",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Лесоустройство: что это и как проводится",
    description:
      "Таксация, лесные карты и лесоустроительная документация для лесного хозяйства.",
    images: ["/img/лес.png"],
  },
};

export default function LesoustrojstvoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <ArticleSchema
        path="/resheniya/lesoustrojstvo"
        headline="Лесоустройство: что это, как проводится и в какие сроки"
        description="Что такое лесоустройство: таксация, картографирование и подготовка лесоустроительной документации с оцифровкой материалов."
      />
    </>
  );
}
