import type { Metadata } from "next";
import ArticleSchema from "@/components/resheniya/ArticleSchema";

export const metadata: Metadata = {
  title: "Преимущества и возможности АИС «Единая среда»",
  description:
    "Преимущества АИС «Единая среда»: реестр отечественного ПО, учёт зелёных насаждений, благоустройства и мест захоронений в одной системе, контроль подрядчиков, 500+ проектов в 40+ регионах с 2011 года.",
  alternates: { canonical: "/resheniya/preimushchestva" },
  openGraph: {
    title: "Преимущества и возможности АИС «Единая среда»",
    description:
      "Почему муниципалитеты выбирают «Единую среду»: возможности платформы и факты о компании.",
    url: "/resheniya/preimushchestva",
    type: "article",
    images: [
      {
        url: "/img/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Преимущества АИС «Единая среда»",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Преимущества и возможности АИС «Единая среда»",
    description: "Возможности платформы и факты о компании.",
    images: ["/img/og-image.jpg"],
  },
};

export default function PreimuLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <ArticleSchema
        path="/resheniya/preimushchestva"
        headline="Преимущества и возможности АИС «Единая среда»"
        description="Возможности платформы «Единая среда» и факты о компании для муниципалитетов."
      />
    </>
  );
}
