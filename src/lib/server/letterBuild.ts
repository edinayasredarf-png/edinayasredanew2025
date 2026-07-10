import "server-only";
import { Jimp } from "jimp";
import { renderLetterPdf } from "@/lib/server/letterPdf";
import { dbGetEditorMedia } from "@/lib/server/dataDb";
import { LetterTemplate } from "@/lib/server/letterTemplatesDb";
import {
  buildTags,
  mergeTags,
  safeFilename,
  RecipientRow,
} from "@/lib/server/letterMerge";
import { computeRecipient } from "@/lib/server/nameTransforms";

/** /api/media/<id> → data-URI (движок PDF не умеет относительные URL).
 *  trim=true — авто-обрезка пустых полей (для шапки/подписи). */
export async function resolveImage(
  url?: string,
  trim = false
): Promise<string | undefined> {
  const u = (url || "").trim();
  if (!u) return undefined;
  const m = /^\/api\/media\/([\w-]+)$/.exec(u);
  if (!m) return u; // абсолютный URL — как есть
  try {
    const media = await dbGetEditorMedia(m[1]);
    if (!media) return undefined;
    let buffer = media.data;
    let mime = media.mimeType;
    if (trim) {
      try {
        const img = await Jimp.read(buffer);
        img.autocrop({ tolerance: 0.02, cropOnlyFrames: false });
        buffer = await img.getBuffer("image/png");
        mime = "image/png";
      } catch {
        /* если обрезка не удалась — используем оригинал */
      }
    }
    return `data:${mime};base64,${buffer.toString("base64")}`;
  } catch {
    return undefined;
  }
}

export interface TemplateImages {
  headerImage?: string;
  signatureImage?: string;
}

/** Картинки шаблона одинаковы для всех получателей — резолвим один раз. */
export async function resolveTemplateImages(
  template: LetterTemplate
): Promise<TemplateImages> {
  const [headerImage, signatureImage] = await Promise.all([
    resolveImage(template.header_image, true),
    resolveImage(template.signature_image, true),
  ]);
  return { headerImage, signatureImage };
}

export interface BuiltLetter {
  filename: string;
  buffer: Buffer;
  tags: Record<string, string>;
}

/** Собирает один именной PDF (общая логика для /generate и /send). */
export async function buildLetterPdf(
  template: LetterTemplate,
  recipient: RecipientRow,
  images: TemplateImages
): Promise<BuiltLetter> {
  const tags = buildTags(recipient);
  const c = computeRecipient(recipient.fio, recipient.position);
  const buffer = await renderLetterPdf({
    headerImage: images.headerImage,
    number: recipient.number || "",
    date: recipient.date || "",
    position: recipient.position || "",
    fioDative: c.fioDative,
    greeting: `${c.address} ${c.io}!`,
    body: mergeTags(template.body, tags),
    signerRole: template.signer_role || "",
    signatureImage: images.signatureImage,
    signerName: template.signer_name || "",
    executor: mergeTags(template.executor, tags),
  });
  const filename = `${safeFilename(mergeTags(template.filename_pattern, tags))}.pdf`;
  return { filename, buffer, tags };
}

/**
 * Обрабатывает список с ограничением одновременных задач (по умолчанию 4).
 * Нужен, чтобы рендер PDF (@react-pdf) + jimp не съедали память на большом
 * батче и чтобы не упираться в SMTP-лимиты при рассылке.
 * Результаты возвращаются в исходном порядке.
 */
export async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const i = next++;
      if (i >= items.length) break;
      results[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return results;
}
