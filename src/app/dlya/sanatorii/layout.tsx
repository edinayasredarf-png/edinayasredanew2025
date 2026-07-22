import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Единая среда для санаториев — учёт парковой территории",
  description:
    "Цифровой учёт зелёных насаждений и благоустройства санатория: реестр и паспорт каждого дерева, интерактивная карта, выявление аварийных деревьев, контроль подрядчиков и безопасность отдыхающих.",
  alternates: { canonical: "/dlya/sanatorii" },
  openGraph: {
    title: "Единая среда для санаториев — учёт парковой территории",
    description:
      "Реестр деревьев с рекомендациями дендрологов, безопасность отдыхающих и контроль подрядчиков.",
    url: "https://xn--80aakbcct4b2aj7m.xn--p1ai/dlya/sanatorii",
    type: "website",
    images: [
      { url: "/img/og-image.jpg", width: 1200, height: 630, alt: "Единая среда для санаториев" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Единая среда для санаториев — учёт парковой территории",
    description: "Учёт парка, безопасность отдыхающих и контроль подрядчиков.",
    images: ["/img/og-image.jpg"],
  },
};

export default function DlyaSanatoriiLayout({ children }: { children: React.ReactNode }) {
  return children;
}
