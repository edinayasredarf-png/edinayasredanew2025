import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Инвентаризация и оцифровка мест захоронений и кладбищ — Единая среда",
  description:
    "Инвентаризация кладбищ и мест захоронений, оцифровка данных, электронная карта и реестр захоронений, поиск захоронений по фамилии для муниципалитетов и операторов кладбищ.",
  alternates: { canonical: "/services/inventory-burials-seo" },
  openGraph: {
    title: "Инвентаризация и оцифровка мест захоронений и кладбищ — Единая среда",
    description:
      "Цифровая инвентаризация кладбищ: электронная карта, единый реестр мест захоронений и поиск захоронений по фамилии. Решение для муниципалитетов и служб.",
    url: "/services/inventory-burials-seo",
    type: "article",
    images: [
      {
        url: "/img/cemetery1.png",
        width: 1200,
        height: 630,
        alt: "Инвентаризация и оцифровка мест захоронений",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Инвентаризация и оцифровка мест захоронений и кладбищ — Единая среда",
    description:
      "Инвентаризация кладбищ и мест захоронений, оцифровка и создание электронной карты и реестра захоронений.",
    images: ["/img/cemetery1.png"],
  },
};

export default function InventoryBurialsSeoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}


