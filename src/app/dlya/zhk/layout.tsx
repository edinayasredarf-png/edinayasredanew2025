import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Единая среда для ЖК — контроль благоустройства и подрядчиков",
  description:
    "Цифровая система учёта благоустройства придомовой территории ЖК: реестр объектов, интерактивная карта, онлайн-приёмка работ подрядчиков, мобильное приложение с фотофиксацией. Решение для управляющих компаний.",
  alternates: { canonical: "/dlya/zhk" },
  openGraph: {
    title: "Единая среда для ЖК — контроль благоустройства и подрядчиков",
    description:
      "Реестр территории, интерактивная карта и онлайн-приёмка работ подрядчиков для управляющих компаний.",
    url: "https://xn--80aakbcct4b2aj7m.xn--p1ai/dlya/zhk",
    type: "website",
    images: [
      { url: "/img/og-image.jpg", width: 1200, height: 630, alt: "Единая среда для ЖК" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Единая среда для ЖК — контроль благоустройства и подрядчиков",
    description:
      "Учёт благоустройства и контроль подрядчиков для управляющих компаний.",
    images: ["/img/og-image.jpg"],
  },
};

export default function DlyaZhkLayout({ children }: { children: React.ReactNode }) {
  return children;
}
