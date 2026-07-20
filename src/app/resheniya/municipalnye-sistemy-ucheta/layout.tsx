import type { Metadata } from "next";
import ArticleSchema from "@/components/resheniya/ArticleSchema";

export const metadata: Metadata = {
  title: "Муниципальные системы учёта объектов: что это и как внедрить",
  description:
    "Муниципальные системы учёта — цифровые платформы для инвентаризации городских объектов: зелёных насаждений, благоустройства, мест захоронений. Возможности, внедрение и выбор системы для муниципалитета.",
  alternates: { canonical: "/resheniya/municipalnye-sistemy-ucheta" },
  openGraph: {
    title: "Муниципальные системы учёта объектов: что это и как внедрить",
    description:
      "Цифровая инвентаризация и учёт объектов городской инфраструктуры для муниципалитетов: единый реестр, карта, аналитика.",
    url: "/resheniya/municipalnye-sistemy-ucheta",
    type: "article",
    images: [
      {
        url: "/img/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Муниципальные системы учёта объектов",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Муниципальные системы учёта объектов",
    description:
      "Цифровые платформы для учёта городских объектов: возможности и внедрение.",
    images: ["/img/og-image.jpg"],
  },
};

export default function MunicipalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <ArticleSchema
        path="/resheniya/municipalnye-sistemy-ucheta"
        headline="Муниципальные системы учёта объектов"
        description="Что такое муниципальная система учёта, какие объекты охватывает и как её внедрить."
      />
    </>
  );
}
