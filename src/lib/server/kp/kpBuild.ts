import "server-only";
import {
  dbGetCustomAliasValues,
  dbGetDocStyle,
  dbGetExecutor,
  dbGetHeaderLayout,
  dbAddRegistryRow,
  dbGetOrganization,
  dbGetTier,
  dbNextRegistryNumber,
  dbResolveComposedTier,
  dbResolveTemplate,
} from "./kpDb";
import { serviceComponents } from "@/lib/kp/serviceComposition";
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

/** Параметры КП отдельно для организации (у каждой своя дата, номер, срок, запрос заказчика, исполнитель). */
export interface KpOrgParams {
  date?: string;
  number?: string;
  validityPeriod?: string;
  requestNumber?: string;
  requestDate?: string;
  executorId?: number;
  recordRegistry?: boolean;
}

/** Запрос генерации: одна форма (клиент + расчёт) → несколько организаций. */
export interface KpGenerateRequest {
  form: KpFormPayload;
  orgKeys: string[];
  executorId?: number;
  /** Записать в реестр КП и присвоить № по каждой компании. */
  recordRegistry?: boolean;
  /** Параметры по организациям (orgKey → параметры); не заданное берётся из общих полей запроса. */
  orgParams?: Record<string, KpOrgParams>;
}

function todayYmd(): string {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
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

  const executorCache = new Map<number, Awaited<ReturnType<typeof dbGetExecutor>>>();
  const getExecutor = async (id?: number) => {
    if (!id) return null;
    if (!executorCache.has(id)) executorCache.set(id, await dbGetExecutor(id));
    return executorCache.get(id) ?? null;
  };
  const serviceType = req.form.serviceType;
  const [headerLayout, customAliases, docStyle] = await Promise.all([
    dbGetHeaderLayout(),
    dbGetCustomAliasValues(),
    dbGetDocStyle(),
  ]);

  for (const orgKey of req.orgKeys) {
    try {
      const org = await dbGetOrganization(orgKey);
      if (!org) {
        errors.push({ orgKey, message: "Организация не найдена" });
        continue;
      }

      const op = req.orgParams?.[orgKey];
      // Если у организации заданы свои параметры — используем только их: не заданное (например, исполнитель) остаётся пустым,
      // а не подставляется из другой компании. Общие поля запроса — только для старых вызовов без orgParams.
      const executor = await getExecutor(op ? op.executorId : req.executorId);
      const doRegistry = op ? Boolean(op.recordRegistry) : req.recordRegistry;

      const tierRow = await dbResolveComposedTier(orgKey, serviceType);
      const tier: PriceTier = tierRow
        ? {
            pricePerHaDirect: tierRow.pricePerHaDirect,
            pricePerHaTender: tierRow.pricePerHaTender,
            aisPrice: tierRow.aisPrice,
            renewalPerYear: tierRow.renewalPerYear,
            minHectares: tierRow.minHectares,
          }
        : { pricePerHaDirect: 0, pricePerHaTender: 0, aisPrice: 0, renewalPerYear: 0, minHectares: 1 };

      // Стоимость строк-услуг зависит от компании: перезаписываем cost в строках
      // с ключами __svc/__line ценами из тарифа этой компании (line_prices).
      const compTiers = new Map<string, Awaited<ReturnType<typeof dbGetTier>>>();
      for (const svc of serviceComponents(serviceType)) {
        compTiers.set(svc, await dbGetTier(orgKey, svc));
      }
      const pricedRows = (req.form.rows || []).map((r) => {
        const svc = (r as Record<string, string>).__svc;
        const line = (r as Record<string, string>).__line;
        if (!svc || !line) return r;
        const lp = compTiers.get(svc)?.linePrices?.[line];
        if (!lp) return r;
        // __pd/__pt — цена за единицу для формул (цена × площадь) по этой компании.
        // Плюс заполняем не-формульные ячейки стоимости напрямую (формулы их игнорируют).
        return {
          ...r,
          __pd: String(lp.direct || 0),
          __pt: String(lp.tender || 0),
          __p: String(lp.direct || 0),
          unit_price: String(lp.direct || 0),
          cost_direct: String(lp.direct || 0),
          cost_tender: String(lp.tender || 0),
          cost: String(lp.direct || 0),
        };
      });

      // Реестр КП: присваиваем № по компании (если попросили и номер пишется).
      let assignedNumber: number | undefined;
      if (doRegistry && org.writeKpNumber) {
        assignedNumber = await dbNextRegistryNumber(orgKey);
      }

      // Если пользователь не задал цены АИС/пролонгации явно — берём из тира.
      const form: KpFormPayload = {
        ...req.form,
        rows: pricedRows,
        client: {
          ...req.form.client,
          requestNumber: op ? op.requestNumber : req.form.client?.requestNumber,
          requestDate: op ? op.requestDate : req.form.client?.requestDate,
        },
        kp: {
          ...req.form.kp,
          date: op ? op.date : req.form.kp?.date,
          validityPeriod: op ? op.validityPeriod : req.form.kp?.validityPeriod,
          number: assignedNumber ? String(assignedNumber) : op ? op.number?.trim() : req.form.kp?.numbers?.[orgKey]?.trim() || req.form.kp?.number,
        },
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
        docStyle.headerAliases ? headerLayout : null, // авто-шапка с реквизитами/адресатом (лево/центр/право)
        ctx.tableAlias, // {{<алиас таблицы>}} тоже заменяется на таблицу
        docStyle.forceFont ? (org.fontFamily || docStyle.fontFamily) : "" // единый шрифт: свой у организации, иначе общий
      );
      docs.push({
        orgKey,
        orgName: org.name,
        shortName: org.shortName || org.name,
        filename: safeKpFilename(ctx.filenameBase),
        docx,
        totalCost: ctx.totalCost,
      });

      // Авто-запись строки реестра с данными формы.
      if (doRegistry && assignedNumber) {
        const cl = form.client as { position?: string; fioFull?: string };
        const addressee = [cl.position, cl.fioFull].map((s) => (s || "").trim()).filter(Boolean).join(" ");
        await dbAddRegistryRow({
          orgKey,
          number: assignedNumber,
          letterDate: (form.kp?.date || "").trim() || todayYmd(),
          addressee,
          subject: `КП ${serviceType}`,
          executor: executor?.fio || "",
        }).catch(() => {});
      }
    } catch (e) {
      errors.push({ orgKey, message: (e as Error).message || "Ошибка генерации" });
    }
  }

  return { docs, errors };
}
