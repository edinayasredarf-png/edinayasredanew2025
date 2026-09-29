import "server-only";

import fs from "node:fs";
import path from "node:path";

/**
 * Загрузчик версионируемых промптов из /prompts/*.md (§33 ТЗ). Промпты —
 * не в коде: редактируются как обычные файлы, версия и метаданные — в
 * YAML frontmatter. Кэшируется в памяти процесса (файлы меняются только
 * через деплой, не в рантайме).
 */

interface PromptFile {
  meta: Record<string, string>;
  system: string;
}

const cache = new Map<string, PromptFile>();

function parseFrontmatter(raw: string): PromptFile {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) return { meta: {}, system: raw.trim() };
  const meta: Record<string, string> = {};
  for (const line of m[1].split("\n")) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    meta[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
  return { meta, system: m[2].trim() };
}

export function loadPrompt(name: string): PromptFile {
  const cached = cache.get(name);
  if (cached) return cached;
  const filePath = path.join(process.cwd(), "prompts", `${name}.md`);
  const raw = fs.readFileSync(filePath, "utf-8");
  const parsed = parseFrontmatter(raw);
  cache.set(name, parsed);
  return parsed;
}

export function promptVersion(name: string): number {
  const v = Number(loadPrompt(name).meta.version);
  return Number.isFinite(v) ? v : 1;
}
