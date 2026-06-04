"use client";

import {
  compressImageFileForUpload,
  dataUrlToBlob,
} from "@/lib/imageCompress";

const DATA_IMAGE_SRC_RE =
  /src=(["'])(data:image\/[^"']+)\1/gi;

/** Загрузка одного файла в БД (editor_media) → URL /api/media/{uuid} */
export async function uploadEditorImage(file: File): Promise<string> {
  const prepared = await compressImageFileForUpload(file, 1200, 0.8);
  const form = new FormData();
  form.append("file", prepared);

  const res = await fetch("/api/uploads/image", {
    method: "POST",
    body: form,
    credentials: "include",
  });

  const text = await res.text();
  if (!res.ok) {
    let msg = text;
    try {
      const j = JSON.parse(text) as { error?: string };
      if (j.error) msg = j.error;
    } catch {
      /* raw */
    }
    throw new Error(msg || res.statusText);
  }

  const data = JSON.parse(text) as { url?: string };
  if (!data.url) throw new Error("Сервер не вернул URL изображения");
  return data.url;
}

/** data: URL или уже http(s) / путь — для обложки и старых черновиков */
export async function uploadDataUrlIfNeeded(
  src: string | undefined
): Promise<string | undefined> {
  if (!src?.trim()) return undefined;
  const s = src.trim();
  if (
    s.startsWith("http://") ||
    s.startsWith("https://") ||
    s.startsWith("/api/media/") ||
    s.startsWith("/uploads/editor/")
  ) {
    return s;
  }
  if (!s.startsWith("data:image/")) return s;

  const blob = dataUrlToBlob(s);
  const file = new File([blob], "upload.webp", { type: blob.type });
  return uploadEditorImage(file);
}

/** Перед сохранением в БД: все base64-картинки в HTML → URL на сервере */
export async function externalizeContentImages(html: string): Promise<string> {
  if (!html || !html.includes("data:image/")) return html;

  const cache = new Map<string, string>();
  let result = html;
  const re = new RegExp(DATA_IMAGE_SRC_RE.source, DATA_IMAGE_SRC_RE.flags);
  const found: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    found.push(m[2]);
  }

  for (const dataUrl of found) {
    if (cache.has(dataUrl)) continue;
    const url = await uploadDataUrlIfNeeded(dataUrl);
    if (!url) continue;
    cache.set(dataUrl, url);
  }

  for (const [dataUrl, url] of cache) {
    result = result.split(dataUrl).join(url);
  }

  return result;
}
