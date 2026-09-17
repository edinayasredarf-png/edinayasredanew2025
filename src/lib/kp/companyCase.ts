/**
 * Родительный падеж названия организации-клиента (эвристика).
 * Для юр. лиц с кавычками/аббревиатурой формы (ООО «…», ИП …) название не
 * склоняется. Для описательных названий («Администрация …») склоняется первое
 * слово: «Администрация района» → «Администрации района».
 */

const LEGAL_FORMS = /^(ООО|ОАО|АО|ЗАО|ПАО|НАО|ИП|ГУП|МУП|ФГУП|МУ|МБУ|ГБУ|ГАУ|МАУ|ФКУ|ГКУ|КФХ|ТСЖ|СНТ|НКО|АНО|ФОНД)\b/i;

function genitiveHead(w: string): string {
  if (!w) return w;
  // Женский род на -ия/-я → -ии/-и: Администрация→Администрации, Управа→Управы
  if (/[иы]я$/i.test(w)) return w.slice(0, -1) + "и"; // Администрация→Администрации
  if (/я$/i.test(w)) return w.slice(0, -1) + "и";
  if (/а$/i.test(w)) return w.slice(0, -1) + "ы"; // Управа→Управы, Палата→Палаты
  if (/[иы]й$/i.test(w)) return w.slice(0, -2) + "ого"; // прилаг. (редко в голове)
  if (/ь$/i.test(w)) return w.slice(0, -1) + "я"; // муж. на -ь
  if (/[бвгдзклмнпрстфхцчшщ]$/i.test(w)) return w + "а"; // Департамент→Департамента
  return w;
}

export function companyGenitive(name: string): string {
  const s = (name || "").trim();
  if (!s) return "";
  // Кавычки или юр. форма — бренд-название, не склоняем.
  if (/[«»"„”]/.test(s)) return s;
  if (LEGAL_FORMS.test(s)) return s;
  const parts = s.split(/\s+/);
  parts[0] = genitiveHead(parts[0]);
  return parts.join(" ");
}

/** «Должность + организация в род. падеже»: «Директор Администрации района». */
export function positionWithCompany(position: string, company: string): string {
  const p = (position || "").trim();
  const c = companyGenitive(company);
  return [p, c].filter(Boolean).join(" ");
}
