import "server-only";

import { getTimewebPool } from "@/lib/timewebPg";
import { embedDocument, embedQuery, cosineSimilarity } from "@/lib/ai/embeddings";

/**
 * База знаний для RAG (§31 ТЗ). Документы → чанки → эмбеддинги (Yandex, jsonb).
 * Поиск — косинус в коде по активным чанкам (масштаб БЗ небольшой, pgvector не нужен).
 */

export interface KbDocument {
  id: string;
  title: string;
  category: string | null;
  content: string;
  isActive: boolean;
  chunks: number;
  indexed: number;   // сколько чанков с эмбеддингом
  updatedAt: string | null;
}

export const KB_CATEGORIES: Array<{ value: string; label: string }> = [
  { value: "product", label: "Продукты" },
  { value: "price", label: "Цены" },
  { value: "faq", label: "FAQ" },
  { value: "script", label: "Скрипты" },
  { value: "regulation", label: "Регламенты" },
  { value: "objection", label: "Возражения" },
  { value: "example", label: "Примеры звонков" },
  { value: "other", label: "Другое" },
];

/** Разбить текст на чанки ~800 символов по границам абзацев/предложений. */
export function chunkText(content: string, target = 800): string[] {
  const clean = (content || "").replace(/\r\n/g, "\n").trim();
  if (!clean) return [];
  const paras = clean.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const chunks: string[] = [];
  let cur = "";
  const push = () => { if (cur.trim()) chunks.push(cur.trim()); cur = ""; };
  for (const para of paras) {
    if (para.length > target * 1.6) {
      // Длинный абзац — режем по предложениям.
      const sentences = para.split(/(?<=[.!?])\s+/);
      for (const sn of sentences) {
        if ((cur + " " + sn).length > target) push();
        cur += (cur ? " " : "") + sn;
      }
      push();
    } else {
      if ((cur + "\n\n" + para).length > target) push();
      cur += (cur ? "\n\n" : "") + para;
    }
  }
  push();
  return chunks;
}

export async function listDocuments(): Promise<KbDocument[]> {
  const pool = getTimewebPool();
  const { rows } = await pool.query<{
    id: string; title: string; category: string | null; content: string; is_active: boolean;
    updated_at: Date | null; chunks: string; indexed: string;
  }>(
    `select d.id, d.title, d.category, d.content, d.is_active, d.updated_at,
            (select count(*) from ai_kb_chunks c where c.document_id = d.id)::text as chunks,
            (select count(*) from ai_kb_chunks c where c.document_id = d.id and c.embedding is not null)::text as indexed
       from ai_kb_documents d
      order by d.updated_at desc nulls last`
  );
  return rows.map((r) => ({
    id: r.id, title: r.title, category: r.category, content: r.content, isActive: r.is_active,
    chunks: Number(r.chunks), indexed: Number(r.indexed),
    updatedAt: r.updated_at ? r.updated_at.toISOString() : null,
  }));
}

export async function createDocument(input: { title: string; category: string | null; content: string }): Promise<string> {
  const pool = getTimewebPool();
  const { rows } = await pool.query<{ id: string }>(
    `insert into ai_kb_documents (title, category, content) values ($1, $2, $3) returning id`,
    [input.title.trim() || "Без названия", input.category, input.content || ""]
  );
  const id = rows[0].id;
  await reindexDocument(id);
  return id;
}

export async function updateDocument(
  id: string,
  patch: { title?: string; category?: string | null; content?: string; isActive?: boolean }
): Promise<void> {
  const pool = getTimewebPool();
  const sets: string[] = [];
  const params: unknown[] = [];
  let i = 1;
  let contentChanged = false;
  if (typeof patch.title === "string") { sets.push(`title = $${i++}`); params.push(patch.title.trim() || "Без названия"); }
  if (patch.category !== undefined) { sets.push(`category = $${i++}`); params.push(patch.category); }
  if (typeof patch.content === "string") { sets.push(`content = $${i++}`); params.push(patch.content); contentChanged = true; }
  if (typeof patch.isActive === "boolean") { sets.push(`is_active = $${i++}`); params.push(patch.isActive); }
  if (!sets.length) return;
  params.push(id);
  await pool.query(`update ai_kb_documents set ${sets.join(", ")}, updated_at = now() where id = $${i}`, params);
  if (contentChanged) await reindexDocument(id);
}

export async function deleteDocument(id: string): Promise<void> {
  const pool = getTimewebPool();
  await pool.query(`delete from ai_kb_documents where id = $1`, [id]);
}

/** Пере-разбить документ на чанки и посчитать эмбеддинги. */
export async function reindexDocument(id: string): Promise<{ chunks: number; indexed: number }> {
  const pool = getTimewebPool();
  const doc = await pool.query<{ content: string }>(`select content from ai_kb_documents where id = $1`, [id]);
  if (!doc.rows[0]) return { chunks: 0, indexed: 0 };
  const chunks = chunkText(doc.rows[0].content);
  await pool.query(`delete from ai_kb_chunks where document_id = $1`, [id]);
  let indexed = 0;
  for (let idx = 0; idx < chunks.length; idx++) {
    const text = chunks[idx];
    let embedding: number[] | null = null;
    try { embedding = await embedDocument(text); indexed++; } catch { embedding = null; }
    await pool.query(
      `insert into ai_kb_chunks (document_id, chunk_index, content, embedding, tokens)
       values ($1, $2, $3, $4, $5)`,
      [id, idx, text, embedding ? JSON.stringify(embedding) : null, Math.ceil(text.length / 4)]
    );
  }
  return { chunks: chunks.length, indexed };
}

export interface KbHit {
  documentId: string;
  title: string;
  category: string | null;
  content: string;
  score: number;
}

/** Семантический поиск по базе знаний: top-K чанков по косинусу к запросу. */
export async function searchKnowledge(query: string, k = 6): Promise<KbHit[]> {
  const q = (query || "").trim();
  if (!q) return [];
  const pool = getTimewebPool();
  const qvec = await embedQuery(q);
  const { rows } = await pool.query<{
    document_id: string; title: string; category: string | null; content: string; embedding: number[] | null;
  }>(
    `select c.document_id, d.title, d.category, c.content, c.embedding
       from ai_kb_chunks c join ai_kb_documents d on d.id = c.document_id
      where d.is_active and c.embedding is not null`
  );
  const scored = rows
    .map((r) => ({
      documentId: r.document_id,
      title: r.title,
      category: r.category,
      content: r.content,
      score: Array.isArray(r.embedding) ? cosineSimilarity(qvec, r.embedding) : 0,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
  return scored;
}
