import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Единая среда для отелей — учёт и содержание территории",
  description:
    "Цифровой учёт озеленения и благоустройства территории отеля: единый реестр объектов, интерактивная карта, контроль ландшафтных подрядчиков, планирование сезонных работ и безопасность гостей.",
  alternates: { canonical: "/dlya/oteli" },
  openGraph: {
    title: "Единая среда для отелей — учёт и содержание территории",
    description:
      "Ухоженная территория, контроль подрядчиков и безопасность гостей в одной системе.",
    url: "https://xn--80aakbcct4b2aj7m.xn--p1ai/dlya/oteli",
    type: "website",
    images: [
      { url: "/img/og-image.jpg", width: 1200, height: 630, alt: "Единая среда для отелей" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Единая среда для отелей — учёт и содержание территории",
    description: "Содержание территории, контроль подрядчиков и безопасность гостей.",
    images: ["/img/og-image.jpg"],
  },
};

export default function DlyaOteliLayout({ children }: { children: React.ReactNode }) {
  return children;
}
