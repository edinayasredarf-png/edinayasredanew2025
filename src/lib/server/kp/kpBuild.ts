import "server-only";
import {
  dbGetExecutor,
  dbGetOrganization,
  dbGetTier,
  dbResolveTemplate,
} from "./kpDb";
import { buildKpContext, type KpFormPayload } from "./kpMerge";
import { fillDocxTemplate } from "./kpDocx";
import type { PriceTier } from "./kpCalc";

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

      const template = await dbResolveTemplate(serviceType, orgKey);
      if (!template) {
        errors.push({
          orgKey,
          message: `Нет шаблона для услуги «${serviceType}» (${org.shortName || org.name}). Загрузите его во вкладке «Шаблоны».`,
        });
        continue;
      }

      const docx = await fillDocxTemplate(template.data, ctx.tags, ctx.table);
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
