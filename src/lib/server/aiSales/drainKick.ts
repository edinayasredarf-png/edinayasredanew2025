import "server-only";

/**
 * Запуск дренажа очереди «изнутри»: страховка на случай, если внешний планировщик (cron-job.org) отключился.
 * Дёргается из приёмника вебхуков Bitrix (события идут весь рабочий день). Не чаще раза в 20 секунд на экземпляр;
 * сам дренаж безопасен при параллельных вызовах (SKIP LOCKED) и самопродолжается, пока есть работа.
 */
let lastKick = 0;

export async function kickDrain(requestUrl: string): Promise<void> {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return;
  const now = Date.now();
  if (now - lastKick < 20_000) return;
  lastKick = now;
  try {
    const u = new URL("/api/ai-sales/jobs/drain", requestUrl);
    await fetch(u.toString(), { method: "GET", headers: { authorization: `Bearer ${secret}` }, signal: AbortSignal.timeout(55_000) });
  } catch {
    /* следующее событие или планировщик запустят дренаж */
  }
}
