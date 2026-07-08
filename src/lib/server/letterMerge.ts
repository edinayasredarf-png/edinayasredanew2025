import "server-only";
import { computeRecipient } from "./nameTransforms";

export interface RecipientRow {
  fio: string;
  position: string;
  number: string;
  date: string;
}

/** Собирает значения тегов для одного получателя. */
export function buildTags(r: RecipientRow): Record<string, string> {
  const c = computeRecipient(r.fio, r.position);
  return {
    "НОМЕР ПИСЬМА": r.number || "",
    "ДАТА": r.date || "",
    "ДОЛЖНОСТЬ": r.position || "",
    "Должность сокр": c.positionShort,
    "Дательный падеж ФИО": c.fioDative,
    "ОБРАЩЕНИЕ": c.address,
    "ИО": c.io,
    "Инициалы": c.initials,
    "ФИО": r.fio,
  };
}

/** Заменяет <<ТЕГ>> на значения (регистр тега не важен). Неизвестные — как есть. */
export function mergeTags(text: string, tags: Record<string, string>): string {
  const lower: Record<string, string> = {};
  for (const k of Object.keys(tags)) lower[k.toLowerCase()] = tags[k];
  return text.replace(/<<\s*([^>]+?)\s*>>/g, (m, tag: string) => {
    const key = tag.toLowerCase();
    return key in lower ? lower[key] : m;
  });
}

/** Убирает недопустимые для имени файла символы. */
export function safeFilename(name: string): string {
  return name
    .replace(/[\\/:*?"<>|]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180);
}
