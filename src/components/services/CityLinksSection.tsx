import Link from 'next/link';
import type { ServiceCity } from '@/lib/serviceCities';

interface CityLinksSectionProps {
  /** базовый путь услуги, например 'izn' или 'imz' */
  service: 'izn' | 'imz';
  cities: ServiceCity[];
  /** заголовок блока */
  heading: string;
  /** подводящий текст (для объёма и релевантности) */
  intro: string;
  /** шаблон anchor-текста: получает город в предложном падеже */
  anchor: (city: string) => string;
}

/**
 * Блок внутренней перелинковки на городские страницы услуги.
 * Даёт поисковым роботам пути обхода к сотням локальных лендингов
 * (без этого блока и записей в sitemap они остаются «сиротами»).
 * Anchor-текст = точный локальный запрос — усиливает локальное ранжирование.
 */
export default function CityLinksSection({
  service,
  cities,
  heading,
  intro,
  anchor,
}: CityLinksSectionProps) {
  if (!cities.length) return null;

  return (
    <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
      <h2 className="text-2xl md:text-3xl font-medium mb-3">{heading}</h2>
      <p className="text-gray-600 max-w-3xl mb-8">{intro}</p>
      <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-2">
        {cities.map(({ slug, city }) => (
          <li key={slug}>
            <Link
              href={`/services/${service}/${slug}`}
              className="text-[#029cda] hover:underline text-sm md:text-base"
              title={anchor(city)}
            >
              {city}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
