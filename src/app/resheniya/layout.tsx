import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Решения для муниципалитетов: учёт и инвентаризация городских объектов",
  description:
    "Справочный раздел по цифровому учёту муниципальных объектов: благоустройство, зелёные насаждения, места захоронений, выбор ПО для инвентаризации и сравнение систем.",
  alternates: { canonical: "/resheniya" },
  openGraph: {
    title:
      "Решения для муниципалитетов: учёт и инвентаризация городских объектов",
    description:
      "Как автоматизировать учёт объектов благоустройства, зелёных насаждений и мест захоронений. Критерии выбора системы инвентаризации.",
    url: "/resheniya",
    type: "website",
    images: [
      {
        url: "/img/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Решения «Единая среда» для муниципалитетов",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title:
      "Решения для муниципалитетов: учёт и инвентаризация городских объектов",
    description:
      "Цифровой учёт благоустройства, зелёных насаждений и мест захоронений для муниципалитетов.",
    images: ["/img/og-image.jpg"],
  },
};

export default function ResheniyaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
