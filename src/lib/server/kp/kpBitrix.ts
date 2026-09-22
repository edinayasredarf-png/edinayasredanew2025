import "server-only";
import { bitrixCall, bitrixConfigured } from "@/lib/server/bitrix";

/*
 * Интеграция генератора КП с Bitrix24: список сделок компании и загрузка
 * готовых КП в файловое поле сделки. Имя поля настраивается через env
 * KP_BITRIX_DEAL_FILE_FIELD (по умолчанию — «Файл КП»).
 */

export const KP_DEAL_FILE_FIELD =
  process.env.KP_BITRIX_DEAL_FILE_FIELD?.trim() || "UF_CRM_DEAL_AMO_ZHTQYGFXQYUHKMXD";

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

/** Множественное ли поле «Файл КП» (кэш на процесс). Одиночное поле требует
 *  один объект {fileData}, множественное — массив; иначе Bitrix игнорирует запись. */
let fileFieldMultiple: boolean | null = null;
async function isFileFieldMultiple(): Promise<boolean> {
  if (fileFieldMultiple !== null) return fileFieldMultiple;
  try {
    const { result } = await bitrixCall<Record<string, { isMultiple?: boolean }>>("crm.deal.fields");
    fileFieldMultiple = Boolean(result?.[KP_DEAL_FILE_FIELD]?.isMultiple);
  } catch {
    fileFieldMultiple = false;
  }
  return fileFieldMultiple;
}

/**
 * Кладёт файлы в файловое поле сделки. Формат зависит от типа поля:
 *  - множественное → массив {fileData};
 *  - одиночное → один объект {fileData} (берём первый файл).
 * ВНИМАНИЕ: Bitrix заменяет значение поля целиком (перезапись).
 */
export async function uploadKpToDeal(dealId: string, files: KpUploadFile[]): Promise<void> {
  if (!bitrixConfigured()) throw new Error("Bitrix не настроен");
  if (!dealId || files.length === 0) return;
  const multiple = await isFileFieldMultiple();
  const asData = (f: KpUploadFile) => ({ fileData: [f.filename, f.buffer.toString("base64")] });
  const value = multiple ? files.map(asData) : asData(files[0]);
  await bitrixCall("crm.deal.update", {
    id: dealId,
    fields: { [KP_DEAL_FILE_FIELD]: value },
  });
}
