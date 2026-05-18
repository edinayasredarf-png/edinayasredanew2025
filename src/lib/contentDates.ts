/** Метка времени контента (мс): из API/PG — number, string, bigint. */
export function parseContentTimestamp(...values: unknown[]): number {
  for (const value of values) {
    if (value == null || value === "") continue;

    if (typeof value === "number" && Number.isFinite(value)) {
      if (value > 0 && value < 1e12) return Math.round(value * 1000);
      return value;
    }

    if (typeof value === "bigint") {
      const n = Number(value);
      if (Number.isFinite(n)) return n;
    }

    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) continue;
      const asNum = Number(trimmed);
      if (Number.isFinite(asNum)) {
        if (asNum > 0 && asNum < 1e12) return Math.round(asNum * 1000);
        return asNum;
      }
      const parsed = Date.parse(trimmed);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return Date.now();
}

export function formatContentDate(...values: unknown[]): string {
  const ms = parseContentTimestamp(...values);
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("ru-RU");
}
