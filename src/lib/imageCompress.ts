/** Сжатие изображений на клиенте перед загрузкой / вставкой */

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onerror = () => rej(fr.error);
    fr.onload = () => res(String(fr.result));
    fr.readAsDataURL(file);
  });
}

export async function compressImageDataURL(
  inputDataUrl: string,
  mimeOut: "image/webp" | "image/jpeg" = "image/webp",
  quality = 0.82,
  maxSide = 1200
): Promise<string> {
  const img = new Image();
  img.crossOrigin = "anonymous";
  const p = new Promise<string>((resolve, reject) => {
    img.onload = () => {
      const { width, height } = img;
      const k = Math.min(1, maxSide / Math.max(width, height));
      const w = Math.max(1, Math.round(width * k));
      const h = Math.max(1, Math.round(height * k));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas context"));
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL(mimeOut, quality));
    };
    img.onerror = () => reject(new Error("Image decode failed"));
  });
  img.src = inputDataUrl;
  return p;
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(",");
  const mime = header.match(/data:([^;]+)/)?.[1] || "image/webp";
  const bin = atob(base64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

/** Файл для multipart-загрузки (WEBP, до maxSide px) */
export async function compressImageFileForUpload(
  file: File,
  maxSide = 1200,
  quality = 0.82
): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  const raw = await readFileAsDataURL(file);
  let dataUrl: string;
  try {
    dataUrl = await compressImageDataURL(raw, "image/webp", quality, maxSide);
  } catch {
    dataUrl = await compressImageDataURL(raw, "image/jpeg", quality, maxSide);
  }
  const blob = dataUrlToBlob(dataUrl);
  const name = file.name.replace(/\.[^.]+$/, "") || "image";
  return new File([blob], `${name}.webp`, { type: blob.type });
}

export async function fileToDataURL(file: File): Promise<string> {
  const raw = await readFileAsDataURL(file);
  if (file.type.startsWith("image/")) {
    try {
      return await compressImageDataURL(raw, "image/webp", 0.85, 1600);
    } catch {
      return await compressImageDataURL(raw, "image/jpeg", 0.85, 1600);
    }
  }
  return raw;
}
