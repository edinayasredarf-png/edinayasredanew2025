import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Инвентаризация кладбищ «под ключ» — электронная карта и реестр захоронений",
  description:
    "Проектная инвентаризация кладбищ «под ключ»: полевые работы, оцифровка мест захоронений, создание электронной карты и реестра захоронений на базе АИС «Единая среда».",
  alternates: { canonical: "/services/inventory-burials-landing" },
  openGraph: {
    title: "Инвентаризация кладбищ «под ключ» — электронная карта и реестр захоронений",
    description:
      "Инвентаризация кладбищ и мест захоронений под ключ: от анализа архивов до запуска электронной карты и реестра захоронений для муниципалитетов.",
    url: "/services/inventory-burials-landing",
    type: "article",
    images: [
      {
        url: "/img/cemetery1.png",
        width: 1200,
        height: 630,
        alt: "Инвентаризация кладбищ под ключ",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title:
      "Инвентаризация кладбищ «под ключ» — электронная карта и реестр захоронений",
    description:
      "Инвентаризация кладбищ и мест захоронений под ключ: полевые работы, оцифровка и запуск электронной карты и реестра захоронений.",
    images: ["/img/cemetery1.png"],
  },
};

export default function InventoryBurialsLandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}


