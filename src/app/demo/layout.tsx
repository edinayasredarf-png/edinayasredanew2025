import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Демо‑версия системы — Единая среда",
  description:
    "Демо‑версия АИС «Единая среда»: интерактивная карта, реестры, карточки объектов, поиск и аналитика. Запросите доступ к демонстрации системы.",
  alternates: { canonical: "/demo" },
  openGraph: {
    title: "Демо‑версия системы — Единая среда",
    description:
      "Посмотрите демо АИС «Единая среда»: карта, реестры, поиск и аналитика. Доступ по запросу.",
    url: "/demo",
    type: "article",
    images: [
      {
        url: "/img/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Демо‑версия АИС «Единая среда»",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Демо‑версия системы — Единая среда",
    description:
      "Демо‑версия АИС «Единая среда»: карта, реестры, поиск и аналитика. Запросите доступ к демонстрации.",
    images: ["/img/og-image.jpg"],
  },
};

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return children;
}

