import React from "react";
import FAQ from "@/components/FAQ";

export interface FaqItem {
  q: string;
  a: string;
}

interface FaqBlockProps {
  items: FaqItem[];
  title?: string;
}

/**
 * FAQ-блок в дизайне главной страницы (аккордеон + FAQPage JSON-LD).
 * Принимает {q, a} и маппит их на формат компонента FAQ,
 * чтобы разметка и schema были едиными на всех страницах.
 */
export default function FaqBlock({
  items,
  title = "Вопросы и ответы",
}: FaqBlockProps) {
  return (
    <FAQ
      title={title}
      items={items.map((it) => ({ question: it.q, answer: it.a }))}
    />
  );
}
