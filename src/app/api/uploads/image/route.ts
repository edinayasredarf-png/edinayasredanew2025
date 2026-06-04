import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { requireContentWriter } from "@/lib/server/authFromBearer";
import { dbInsertEditorMedia } from "@/lib/server/dataDb";

export const runtime = "nodejs";

const MAX_BYTES = 4 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    await requireContentWriter(request);

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file required" }, { status: 400 });
    }
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "only images allowed" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "Файл слишком большой (макс. 4 МБ)" },
        { status: 413 }
      );
    }

    const id = randomUUID();
    const buffer = Buffer.from(await file.arrayBuffer());
    await dbInsertEditorMedia(id, file.type || "image/webp", buffer);

    return NextResponse.json({ url: `/api/media/${id}` });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const st =
      typeof e === "object" &&
      e !== null &&
      "status" in e &&
      typeof (e as { status: number }).status === "number"
        ? (e as { status: number }).status
        : 500;
    return NextResponse.json({ error: msg }, { status: st });
  }
}
