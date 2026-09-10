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

/**
 * Кладёт файлы в файловое поле сделки. ВНИМАНИЕ: Bitrix заменяет значение
 * множественного поля целиком (перезапись). Возвращает { ok } или бросает.
 */
export async function uploadKpToDeal(dealId: string, files: KpUploadFile[]): Promise<void> {
  if (!bitrixConfigured()) throw new Error("Bitrix не настроен");
  if (!dealId || files.length === 0) return;
  const value = files.map((f) => ({ fileData: [f.filename, f.buffer.toString("base64")] }));
  await bitrixCall("crm.deal.update", {
    id: dealId,
    fields: { [KP_DEAL_FILE_FIELD]: value },
  });
}
