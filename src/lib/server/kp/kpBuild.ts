import "server-only";
import {
  dbGetCustomAliasValues,
  dbGetExecutor,
  dbGetHeaderLayout,
  dbGetOrganization,
  dbGetTier,
  dbResolveTemplate,
} from "./kpDb";
import { buildKpContext, type KpFormPayload } from "./kpMerge";
import { fillDocxTemplate, type KpImage } from "./kpDocx";
import { buildDocxFromHtml } from "./kpHtmlDocx";
import type { PriceTier } from "./kpCalc";
import { dbGetEditorMedia } from "@/lib/server/dataDb";
import type { KpOrganization } from "./kpDb";

/** Достаёт байты картинки по ссылке /api/media/{id} (шапка/подпись/печать). */
async function loadMediaImage(
  url: string,
  token: string,
  maxWidthPt: number
): Promise<KpImage | null> {
  const id = (url || "").split("/").filter(Boolean).pop();
  if (!id) return null;
  try {
    const media = await dbGetEditorMedia(id);
    if (!media?.data?.length) return null;
    return { token, data: media.data, mime: media.mimeType || "image/png", maxWidthPt };
  } catch {
    return null;
  }
}

/** Собирает картинки компании для вставки по алиасам в шаблон. */
async function orgImages(org: KpOrganization): Promise<KpImage[]> {
  const out: KpImage[] = [];
  const items: Array<[string, string, number]> = [
    [org.headerImage, "company_header_image", 470], // шапка на всю ширину
    [org.signatureImage, "signature", 130],
    [org.stampImage, "stamp", 130],
  ];
  for (const [url, token, w] of items) {
    if (!url) continue;
    const img = await loadMediaImage(url, token, w);
    if (img) out.push(img);
  }
  return out;
}

/** Запрос генерации: одна форма (клиент + расчёт) → несколько организаций. */
export interface KpGenerateRequest {
  form: KpFormPayload;
  orgKeys: string[];
  executorId?: number;
}

export interface KpBuiltDoc {
  orgKey: string;
  orgName: string;
  shortName: string;
  filename: string; // без расширения
  docx: Buffer;
  totalCost: number;
  clientEmail?: string;
}

export interface KpBuildOutput {
  docs: KpBuiltDoc[];
  errors: Array<{ orgKey: string; message: string }>;
}

/** Убирает недопустимые для имени файла символы. */
export function safeKpFilename(name: string): string {
  return name
    .replace(/[\\/:*?"<>|]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180);
}

/**
 * Строит DOCX по одной форме для каждой выбранной организации.
 * Отличаются только цена (тир организации) и исполнитель/реквизиты —
 * это и есть автоматизация «3 КП от 3 организаций».
 */
export async function buildKpDocuments(req: KpGenerateRequest): Promise<KpBuildOutput> {
  const docs: KpBuiltDoc[] = [];
  const errors: Array<{ orgKey: string; message: string }> = [];

  const executor = req.executorId ? await dbGetExecutor(req.executorId) : null;
  const serviceType = req.form.serviceType;
  const [headerLayout, customAliases] = await Promise.all([
    dbGetHeaderLayout(),
    dbGetCustomAliasValues(),
  ]);

  for (const orgKey of req.orgKeys) {
    try {
      const org = await dbGetOrganization(orgKey);
      if (!org) {
        errors.push({ orgKey, message: "Организация не найдена" });
        continue;
      }

      const tierRow = await dbGetTier(orgKey, serviceType);
      const tier: PriceTier = tierRow
        ? {
            pricePerHaDirect: tierRow.pricePerHaDirect,
            pricePerHaTender: tierRow.pricePerHaTender,
            aisPrice: tierRow.aisPrice,
            renewalPerYear: tierRow.renewalPerYear,
            minHectares: tierRow.minHectares,
          }
        : { pricePerHaDirect: 0, pricePerHaTender: 0, aisPrice: 0, renewalPerYear: 0, minHectares: 1 };

      // Если пользователь не задал цены АИС/пролонгации явно — берём из тира.
      const form: KpFormPayload = {
        ...req.form,
        ais: req.form.ais?.pricePerLicense
          ? req.form.ais
          : { licenses: req.form.ais?.licenses ?? 1, pricePerLicense: tier.aisPrice },
        renewal: req.form.renewal?.pricePerYear
          ? req.form.renewal
          : { years: req.form.renewal?.years ?? 1, pricePerYear: tier.renewalPerYear },
      };

      const ctx = buildKpContext({ payload: form, org, executor, tier });
      // Пользовательские алиасы дополняют теги (встроенные имеют приоритет).
      const mergedTags = { ...customAliases, ...ctx.tags };

      const template = await dbResolveTemplate(serviceType, orgKey);
      if (!template) {
        errors.push({
          orgKey,
          message: `Нет шаблона для услуги «${serviceType}» (${org.shortName || org.name}). Загрузите его во вкладке «Шаблоны».`,
        });
        continue;
      }

      // HTML-шаблон → собираем .docx из тела; иначе берём загруженные байты.
      const templateBuffer =
        template.source === "html" || !template.data
          ? await buildDocxFromHtml(template.bodyHtml)
          : template.data;

      const images = await orgImages(org);
      const docx = await fillDocxTemplate(
        templateBuffer,
        mergedTags,
        ctx.table,
        images,
        !template.skipAutoBlocks, // авто-шапка/подписант, если шаблон их не содержит
        headerLayout, // расположение реквизитов/адресата (лево/центр/право)
        ctx.tableAlias // {{<алиас таблицы>}} тоже заменяется на таблицу
      );
      docs.push({
        orgKey,
        orgName: org.name,
        shortName: org.shortName || org.name,
        filename: safeKpFilename(ctx.filenameBase),
        docx,
        totalCost: ctx.totalCost,
      });
    } catch (e) {
      errors.push({ orgKey, message: (e as Error).message || "Ошибка генерации" });
    }
  }

  return { docs, errors };
}
