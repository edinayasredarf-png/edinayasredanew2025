// Генератор src/lib/serviceCities.ts
// Сканирует layout.tsx городских страниц izn/imz, извлекает slug и город
// (в предложном падеже из title: "... в <Город> под ключ ...").
// Запуск: node scripts/generate-service-cities.mjs

import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const servicesDir = join(__dirname, '..', 'src', 'app', 'services');

function collect(service) {
  const base = join(servicesDir, service);
  const out = [];
  for (const name of readdirSync(base)) {
    const dir = join(base, name);
    if (!statSync(dir).isDirectory()) continue;
    let layout;
    try {
      layout = readFileSync(join(dir, 'layout.tsx'), 'utf8');
    } catch {
      continue; // нет layout — пропускаем
    }
    // slug берём из canonical, чтобы совпадал 1:1 с реальным URL
    const canon = layout.match(/canonical:\s*'([^']+)'/);
    const slug = canon ? canon[1].split('/').pop() : name;
    // город (предложный падеж) из первого title: "... в <Город> под ключ ..."
    const titleMatch = layout.match(/title:\s*'([^']+)'/);
    let city = slug;
    if (titleMatch) {
      const m = titleMatch[1].match(/\sв\s+([^,]+?)\s+под\s+ключ/i);
      if (m) city = m[1].trim();
    }
    out.push({ slug, city });
  }
  // сортируем по русскому названию
  out.sort((a, b) => a.city.localeCompare(b.city, 'ru'));
  return out;
}

const izn = collect('izn');
const imz = collect('imz');

const header = `// АВТОГЕНЕРАЦИЯ — не редактируйте вручную.
// Источник: scripts/generate-service-cities.mjs (читает layout.tsx городов).
// Обновить: node scripts/generate-service-cities.mjs

export interface ServiceCity {
  /** slug из canonical, часть URL: /services/izn/<slug> */
  slug: string;
  /** название города в предложном падеже (как в title/H1) */
  city: string;
}
`;

const body =
  `\nexport const IZN_CITIES: ServiceCity[] = ${JSON.stringify(izn, null, 2)};\n` +
  `\nexport const IMZ_CITIES: ServiceCity[] = ${JSON.stringify(imz, null, 2)};\n`;

const target = join(__dirname, '..', 'src', 'lib', 'serviceCities.ts');
writeFileSync(target, header + body, 'utf8');
console.log(`Готово: izn=${izn.length}, imz=${imz.length} -> ${target}`);
