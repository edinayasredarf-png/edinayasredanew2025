import React from "react";
import Link from "next/link";

export interface RelatedLink {
  href: string;
  title: string;
  desc?: string;
}

interface RelatedLinksProps {
  links: RelatedLink[];
  title?: string;
}

/**
 * Блок внутренней перелинковки на смежные решения и услуги.
 */
export default function RelatedLinks({
  links,
  title = "Смежные материалы и услуги",
}: RelatedLinksProps) {
  return (
    <section className="py-14 md:py-20 bg-[#F5F7FA]">
      <div className="max-w-[1200px] mx-auto px-4">
        <h2 className="text-2xl md:text-3xl lg:text-4xl text-[#313131] font-medium mb-8">
          {title}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="block bg-white rounded-3xl p-6 shadow-[0_0_0_1px_rgba(15,23,42,0.06)] hover:shadow-[0_0_0_1px_rgba(2,156,218,0.4)] transition-shadow"
            >
              <h3 className="text-lg font-semibold mb-2 text-[#313131]">
                {l.title}
              </h3>
              {l.desc && (
                <p className="text-gray-600 text-sm md:text-base">{l.desc}</p>
              )}
              <span className="inline-block mt-3 text-[#029cda] font-medium text-sm">
                Подробнее →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
