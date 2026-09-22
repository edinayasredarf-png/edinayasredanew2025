import "server-only";
import { bitrixCall, bitrixConfigured } from "@/lib/server/bitrix";

/*
 * Интеграция генератора КП с Bitrix24: список сделок компании и загрузка
 * готовых КП в файловое поле сделки. Имя поля настраивается через env
 * KP_BITRIX_DEAL_FILE_FIELD (по умолчанию — «Файл КП»).
 */

export const KP_DEAL_FILE_FIELD =
  process.env.KP_BITRIX_DEAL_FILE_FIELD?.trim() || "UF_CRM_1790087172011";

export interface BitrixDeal {
  id: string;
  title: string;
  stage?: string;
}

/** Сделки компании (crm.deal.list по COMPANY_ID). */
export async function listDealsByCompany(companyId: string): Promise<BitrixDeal[]> {
  if (!bitrixConfigured() || !companyId) return [];
  const { result } = await bitrixCall<Array<Record<string, unknown>>>("crm.deal.list", {
    filter: { COMPANY_ID: companyId },
    select: ["ID", "TITLE", "STAGE_ID"],
    order: { ID: "DESC" },
    start: 0,
  });
  return (result || []).slice(0, 30).map((r) => ({
    id: String(r.ID || ""),
    title: String(r.TITLE || "").trim() || `Сделка #${r.ID}`,
    stage: String(r.STAGE_ID || "") || undefined,
  }));
}

export interface KpUploadFile {
  filename: string;
  buffer: Buffer;
}

/** Множественное ли поле «Файл КП» (кэш с TTL). Одиночное поле требует один
 *  объект {fileData}, множественное — массив; иначе Bitrix игнорирует запись.
 *  TTL нужен, чтобы после смены типа поля в Bitrix значение подхватилось без
 *  редеплоя (на «тёплой» лямбде Vercel кэш иначе жил бы вечно). */
let fileFieldMultiple: { value: boolean; at: number } | null = null;
const FIELD_TTL_MS = 60_000;
async function isFileFieldMultiple(): Promise<boolean> {
  if (fileFieldMultiple && Date.now() - fileFieldMultiple.at < FIELD_TTL_MS) return fileFieldMultiple.value;
  let value = false;
  try {
    const { result } = await bitrixCall<Record<string, { isMultiple?: boolean }>>("crm.deal.fields");
    value = Boolean(result?.[KP_DEAL_FILE_FIELD]?.isMultiple);
  } catch {
    value = fileFieldMultiple?.value ?? false;
  }
  fileFieldMultiple = { value, at: Date.now() };
  return value;
}

export interface KpUploadResult {
  /** Множественное ли файловое поле сделки. */
  multiple: boolean;
  /** Сколько файлов записано в файловое поле сделки. */
  fieldCount: number;
  /** Сколько файлов приложено к комментарию в Таймлайне (fallback для одиночного поля). */
  timelineCount: number;
  total: number;
}

/** Приложить все КП комментарием в Таймлайн сделки (несколько файлов там доступны
 *  всегда, независимо от типа пользовательского поля). */
async function postFilesToTimeline(dealId: string, files: KpUploadFile[]): Promise<number> {
  try {
    await bitrixCall("crm.timeline.comment.add", {
      fields: {
        ENTITY_ID: Number(dealId),
        ENTITY_TYPE: "deal",
        COMMENT: `Коммерческие предложения (${files.length} шт.)`,
        FILES: files.map((f) => ({ fileData: [f.filename, f.buffer.toString("base64")] })),
      },
    });
    return files.length;
  } catch {
    return 0;
  }
}

/**
 * Кладёт КП в сделку Bitrix24:
 *  - множественное поле → массив {fileData} (все файлы в поле);
 *  - одиночное поле → первый файл в поле + ВЕСЬ комплект комментарием в Таймлайн,
 *    чтобы менеджер видел все КП (одиночное поле хранит лишь один файл — это
 *    ограничение Bitrix, а не бага генератора).
 * ВНИМАНИЕ: Bitrix заменяет значение поля целиком (перезапись).
 */
export async function uploadKpToDeal(dealId: string, files: KpUploadFile[]): Promise<KpUploadResult> {
  if (!bitrixConfigured()) throw new Error("Bitrix не настроен");
  if (!dealId || files.length === 0) return { multiple: false, fieldCount: 0, timelineCount: 0, total: 0 };
  const multiple = await isFileFieldMultiple();
  const asData = (f: KpUploadFile) => ({ fileData: [f.filename, f.buffer.toString("base64")] });
  const value = multiple ? files.map(asData) : asData(files[0]);
  await bitrixCall("crm.deal.update", {
    id: dealId,
    fields: { [KP_DEAL_FILE_FIELD]: value },
  });
  const fieldCount = multiple ? files.length : 1;
  // Одиночное поле и файлов больше одного — дублируем весь комплект в Таймлайн.
  const timelineCount = !multiple && files.length > 1 ? await postFilesToTimeline(dealId, files) : 0;
  return { multiple, fieldCount, timelineCount, total: files.length };
}
